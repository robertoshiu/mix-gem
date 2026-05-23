import { useMesSpcStore } from '@/stores/mes-spc-store';
import { generateMeasurement } from './metrology-generator';
import { evaluateSpc } from './spc-engine';
import { generateRecommendations, shouldAnalyze } from './ai-recommendation-engine';
import { makeS6F11, makeS2F41Stop, makeS2F42Ack } from './secs-message-log';
import { SPC_PARAM_KEYS } from './spc-parameters';
import type { SpcMeasurement, SpcViolation } from './mes-types';

const TICK_MS = 2000;
const MAX_WAFERS = 25;
const SPC_WINDOW = 20;

export class SimulatorEngine {
  private intervalId: ReturnType<typeof setInterval> | null = null;

  start() {
    if (this.intervalId !== null) return;
    this.intervalId = setInterval(() => this.tick(), TICK_MS);
  }

  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick() {
    const store = useMesSpcStore.getState();
    const { activeLotId, waferNumber, activeFault, equipmentState } = store;

    if (!activeLotId || equipmentState === 'inhibited') return;

    // Complete lot
    if (waferNumber > MAX_WAFERS) {
      store.updateLot(activeLotId, { status: 'completed' });
      store.stopProcessing();
      this.stop();
      return;
    }

    // Generate measurement
    const generated = generateMeasurement(waferNumber, activeFault);
    const measurement: SpcMeasurement = {
      id: `${activeLotId}-w${waferNumber}-${Date.now()}`,
      lotId: activeLotId,
      timestamp: new Date(),
      ...generated,
    };
    store.addMeasurement(measurement);

    // Log S6F11
    store.addEvent(makeS6F11(activeLotId, waferNumber, generated));

    // Evaluate SPC — build sliding window
    const allMeasurements = useMesSpcStore.getState().measurements
      .filter((m) => m.lotId === activeLotId)
      .slice(-SPC_WINDOW);

    for (const param of SPC_PARAM_KEYS) {
      const violation = evaluateSpc(allMeasurements, param);
      if (violation) {
        const v: SpcViolation = {
          id: `viol-${Date.now()}-${param}`,
          lotId: activeLotId,
          acknowledged: false,
          timestamp: new Date(),
          ...violation,
        };
        store.addViolation(v);
        store.updateLot(activeLotId, { status: 'on_hold' });
        store.addEvent(makeS2F41Stop(param, violation.rule));
        store.addEvent(makeS2F42Ack());
        this.stop();
        return;
      }
    }

    // Increment wafer
    store.incrementWafer();

    // Check completion after increment
    if (waferNumber >= MAX_WAFERS) {
      store.updateLot(activeLotId, { status: 'completed' });
      store.stopProcessing();
      this.stop();
      return;
    }

    // AI Recommendation Analysis — run every N ticks
    const aiConfig = store.aiEngineConfig;
    if (waferNumber % aiConfig.analysisInterval === 0) {
      const state = useMesSpcStore.getState();
      const ctx = {
        measurements: state.measurements.filter((m) => m.lotId === activeLotId),
        violations: state.violations,
        equipmentState: state.equipmentState,
        waferNumber: state.waferNumber,
        activeFault: state.activeFault ? { type: state.activeFault.type, parameter: state.activeFault.parameter } : null,
      };

      if (shouldAnalyze(ctx, aiConfig, state.lastAnalysisTimestamp)) {
        const newRecs = generateRecommendations(ctx, state.recommendations, aiConfig);
        for (const rec of newRecs) {
          store.addRecommendation(rec);
        }
        store.setLastAnalysisTimestamp(Date.now());
      }
    }
  }
}
