import { useMesSpcStore } from '@/stores/mes-spc-store';
import { evaluateSpc } from './spc-engine';
import { generateRecommendations, shouldAnalyze } from './ai-recommendation-engine';
import {
  makeS6F11,
  makeS2F42Ack,
  makeS2F49,
  makeS2F50,
  makeS6F11Notification,
} from './secs-message-log';
import { SPC_PARAM_KEYS, SPC_PARAMETERS } from './spc-parameters';
import {
  PLAYBACK_FRAME_COUNT,
  PLAYBACK_TICK_MS,
  generatePlaybackMeasurement,
  playbackFrameFromWafer,
} from './spc-playback-data';
import {
  calculateCUSUM,
  calculateEWMA,
  detectCUSUMSignal,
  detectEWMASignal,
} from './trend-analysis';
import { calculateCapability } from './spc-capability';
import { trimMeasurements, createRollingWindow, aggregateToHourly } from './data-retention';
import { GemStateMachine } from './gem-state-machine';
import type {
  SpcViolation,
  SpcParameter,
  AiRecommendation, SecsEvent,
  SpcRule, AlarmSeverity, MetrologyConfig,
} from './mes-types';

const SPC_WINDOW = 20;
const RECOVERY_CONSECUTIVE_TICKS = 3;

/** Map SPC rule to alarm severity. */
function ruleToSeverity(rule: SpcRule): AlarmSeverity {
  switch (rule) {
    case 'rule_1':                return 'critical';
    case 'rule_2':
    case 'rule_5':
    case 'rule_6':                return 'warning';
    case 'rule_3':
    case 'rule_4':
    case 'rule_7':
    case 'rule_8':                return 'info';
  }
}

export class SimulatorEngine {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private tickCount: number = 0;
  private playbackCycle: number = 0;
  private consecutiveGoodTicks = 0;
  private gem: GemStateMachine = new GemStateMachine();
  private _wasRunning = false;

  start() {
    if (this.intervalId !== null) return;
    this.consecutiveGoodTicks = 0;

    // GEM state transitions: ensure machine reaches EXECUTING
    if (this.gem.state === 'INIT') {
      this._applyGemTransition(this.gem.transitionTo('IDLE'));
    }
    if (this.gem.state === 'IDLE') {
      this._applyGemTransition(this.gem.transitionTo('SETUP'));
      this._applyGemTransition(this.gem.transitionTo('READY'));
      this._applyGemTransition(this.gem.transitionTo('EXECUTING'));
    }
    if (this.gem.state === 'PAUSED') {
      this._applyGemTransition(this.gem.transitionTo('EXECUTING'));
    }

    this.intervalId = setInterval(() => this.tick(), PLAYBACK_TICK_MS);
    document.addEventListener('visibilitychange', this._handleVisibility);
  }

  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    document.removeEventListener('visibilitychange', this._handleVisibility);
  }

  isRunning(): boolean {
    return this.intervalId !== null;
  }

  private tick() {
    const store = useMesSpcStore.getState();
    const { activeLotId, waferNumber, activeFault, equipmentState, activeRecipeId, recipes } = store;

    if (!activeLotId || equipmentState === 'idle') return;

    this.tickCount++;
    const playbackFrame = playbackFrameFromWafer(waferNumber);

    // Build metrology config from active recipe (if available)
    const activeRecipe = recipes.find((r) => r.id === activeRecipeId);
    const metrologyConfig: MetrologyConfig = {
      exposureDose: activeRecipe?.exposure ?? 38,
      focusOffset:  activeRecipe?.focus ?? 0,
    };

    // Generate deterministic three-minute playback data. Frames do not repeat
    // inside a cycle; values repeat after PLAYBACK_FRAME_COUNT ticks.
    const measurement = generatePlaybackMeasurement(
      activeLotId,
      playbackFrame,
      this.playbackCycle,
      activeFault,
      metrologyConfig,
      new Date(),
    );
    const generated = {
      waferNumber: measurement.waferNumber,
      cd: measurement.cd,
      cdu: measurement.cdu,
      ovl_x: measurement.ovl_x,
      ovl_y: measurement.ovl_y,
      ler: measurement.ler,
    };
    store.addMeasurement(measurement);

    // Trim measurements to prevent unbounded growth (keep max 5000)
    const currentMeasurements = useMesSpcStore.getState().measurements;
    useMesSpcStore.setState({ measurements: trimMeasurements(currentMeasurements) });

    // Log S6F11
    store.addEvent(makeS6F11(activeLotId, playbackFrame, generated));
    this._emitScheduledEvents(playbackFrame, activeLotId, activeRecipeId);

    // Evaluate SPC — build sliding window via createRollingWindow
    const lotMeasurements = useMesSpcStore.getState().measurements
      .filter((m) => m.lotId === activeLotId);

    const windowMeasurements = createRollingWindow(lotMeasurements, SPC_WINDOW);
    const acknowledgedViolationWafers = useMesSpcStore.getState().violations
      .filter((v) => v.lotId === activeLotId && v.acknowledged)
      .reduce((acc, violation) => {
        const wafers = acc.get(violation.parameter) ?? new Set<number>();
        wafers.add(violation.waferNumber);
        acc.set(violation.parameter, wafers);
        return acc;
      }, new Map<SpcParameter, Set<number>>());

    for (const param of SPC_PARAM_KEYS) {
      const ignoredWafers = acknowledgedViolationWafers.get(param);
      const evaluationWindow = ignoredWafers
        ? windowMeasurements.filter((m) => !ignoredWafers.has(m.waferNumber))
        : windowMeasurements;
      const violation = evaluateSpc(evaluationWindow, param);
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
        store.addEvent(makeS2F42Ack());

        // Create alarm
        const severity = ruleToSeverity(violation.rule);
        const alarmManager = store.alarmManager;
        const alarm = alarmManager.createAlarm(
          severity,
          param as SpcParameter,
          `${param} violation: value ${violation.value.toFixed(2)} exceeds limit ${violation.limit.toFixed(2)} (rule ${violation.rule})`,
          violation.rule as SpcRule,
          violation.value,
          violation.limit,
        );

        if (alarm) {
          // Sync active alarms to store
          store.setActiveAlarms(alarmManager.getActiveAlarms());

          // Create notification for this alarm
          store.addNotification({
            id: `notif-alarm-${Date.now()}`,
            type: 'alarm',
            severity,
            title: `Alarm: ${param} ${severity}`,
            message: alarm.message,
            timestamp: new Date(),
            read: false,
          });
        }

        // Emit a STOP/RESUME pair for violation visibility without freezing the demo stream.
        if (this.gem.canTransitionTo('PAUSED')) {
          this._applyGemTransition(this.gem.transitionTo('PAUSED', { parameter: param, rule: violation.rule }));
        }
        if (this.gem.canTransitionTo('EXECUTING')) {
          this._applyGemTransition(this.gem.transitionTo('EXECUTING'));
        }
        store.updateLot(activeLotId, { status: 'in_process' });
        useMesSpcStore.setState({ equipmentState: 'processing' });
        break;
      }
    }

    // No violation this tick — track recovery
    this.consecutiveGoodTicks++;

    if (this.consecutiveGoodTicks >= RECOVERY_CONSECUTIVE_TICKS) {
      const alarmManager = store.alarmManager;
      const cleared = alarmManager.clearRecoveredAlarms(
        { cd: generated.cd, cdu: generated.cdu, ovl_x: generated.ovl_x, ovl_y: generated.ovl_y, ler: generated.ler } as Record<SpcParameter, number>,
        SPC_PARAMETERS as unknown as Record<SpcParameter, { ucl: number; lcl: number }>,
      );

      if (cleared.length > 0) {
        store.setActiveAlarms(alarmManager.getActiveAlarms());

        // Notify for each cleared alarm
        for (const alarmId of cleared) {
          store.addNotification({
            id: `notif-recovery-${Date.now()}-${alarmId}`,
            type: 'alarm',
            severity: 'info',
            title: 'Alarm Recovered',
            message: `Alarm ${alarmId} cleared — parameter back within control limits`,
            timestamp: new Date(),
            read: false,
          });
        }

        this.consecutiveGoodTicks = 0;
      }
    }

    // Calculate Process Capability (Cpk/Ppk) for each parameter
    for (const param of SPC_PARAM_KEYS) {
      const paramConfig = SPC_PARAMETERS[param];
      const values = lotMeasurements.map((m) => m[param]);
      const result = calculateCapability(values, paramConfig.target, paramConfig.ucl, paramConfig.lcl, 5);
      store.setCapabilityResult(param, result);
    }

    // Calculate CUSUM/EWMA for each parameter
    for (const param of SPC_PARAM_KEYS) {
      const paramConfig = SPC_PARAMETERS[param];
      const values = lotMeasurements.map((m) => m[param]);

      // CUSUM
      const cusumResult = calculateCUSUM(values, paramConfig.target, paramConfig.sigma);
      store.setCUSUMResult(param, cusumResult);

      const cusumSignal = detectCUSUMSignal(cusumResult);
      if (cusumSignal) {
        store.addTrendSignal(cusumSignal);
        // Create AI recommendation for trend signal
        const rec: AiRecommendation = {
          id: `rec-cusum-${Date.now()}-${param}`,
          type: 'quality',
          source: 'trend-drift',
          title: `CUSUM ${cusumSignal.direction} shift detected in ${param}`,
          description: `CUSUM ${cusumSignal.direction}ward shift detected at measurement ${cusumSignal.index}. Parameter: ${SPC_PARAMETERS[param].label}`,
          confidence: 75,
          impact: 'Medium — investigate process drift',
          status: 'pending',
          createdAt: new Date(),
          confidenceHistory: [{ timestamp: new Date(), confidence: 75 }],
          relatedParameter: param,
          trendDirection: cusumSignal.direction === 'up' ? 'degrading' : 'improving',
        };
        store.addRecommendation(rec);
      }

      // EWMA
      const ewmaResult = calculateEWMA(values, 0.2, paramConfig.target, paramConfig.sigma);
      store.setEWMAResult(param, ewmaResult);

      const ewmaSignal = detectEWMASignal(ewmaResult);
      if (ewmaSignal) {
        store.addTrendSignal(ewmaSignal);
      }
    }

    // Increment wafer
    this._advancePlaybackCursor(playbackFrame, activeLotId);

    // AI Recommendation Analysis — run every N ticks
    const aiConfig = store.aiEngineConfig;
    if (playbackFrame % aiConfig.analysisInterval === 0) {
      const state = useMesSpcStore.getState();
      const ctx = {
        measurements: state.measurements.filter((m) => m.lotId === activeLotId),
        violations: state.violations,
        equipmentState: state.equipmentState,
        waferNumber: playbackFrame,
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

    // Every 60 ticks, compute and store hourly aggregated data
    if (this.tickCount % 60 === 0) {
      const allM = useMesSpcStore.getState().measurements;
      store.setHourlyAggregates(aggregateToHourly(allM));
    }
  }

  // ── Visibility Handling ──────────────────────────────────────

  private _handleVisibility = () => {
    if (document.hidden) {
      // Pause: clear interval but remember it was running
      if (this.intervalId !== null) {
        clearInterval(this.intervalId);
        this.intervalId = null;
        this._wasRunning = true;
      }
      useMesSpcStore.getState().updateSettings({ simulatorPaused: true });
    } else {
      // Resume: restart interval if was running
      if (this._wasRunning) {
        this._wasRunning = false;
        this.intervalId = setInterval(() => this.tick(), PLAYBACK_TICK_MS);
      }
      useMesSpcStore.getState().updateSettings({ simulatorPaused: false });
    }
  }

  // ── GEM Helpers ────────────────────────────────────────────

  /**
   * Apply a GEM state transition: store its SECS events,
   * sync gemState & stateHistory into the Zustand store,
   * and update equipmentState for backward compatibility.
   */
  private _applyGemTransition(events: SecsEvent[]): void {
    const store = useMesSpcStore.getState();

    // Store SECS events emitted by the transition
    for (const event of events) {
      store.addEvent(event);
    }

    // Update gem state and history in the store
    store.setGemState(this.gem.state);
    const history = this.gem.getStateHistory();
    const last = history[history.length - 1];
    if (last) {
      store.addStateTransition(last);
    }

    // Map GEM state → legacy equipmentState for backward compat
    this._syncEquipmentState();
  }

  private _emitScheduledEvents(frameNumber: number, lotId: string, recipeId: string | null): void {
    const store = useMesSpcStore.getState();

    if (frameNumber % 9 === 0) {
      store.addEvent(makeS6F11Notification('LOT_PROGRESS', {
        lotId,
        playbackFrame: frameNumber,
        cycle: this.playbackCycle + 1,
        queueDepth: 6 + (frameNumber % 5),
      }));
    }

    if (frameNumber % 18 === 0) {
      const recipe = recipeId ?? 'LITHO-193nm-v4';
      store.addEvent(makeS2F49(recipe));
      store.addEvent(makeS2F50(true));
    }

    if (frameNumber % 30 === 0) {
      store.addEvent(makeS6F11Notification('VIRTUAL_METROLOGY_SYNC', {
        lotId,
        chamber: 'LITHO01',
        sampleWindow: `${Math.max(1, frameNumber - 9)}-${frameNumber}`,
      }));
    }
  }

  private _advancePlaybackCursor(frameNumber: number, activeLotId: string): void {
    if (frameNumber >= PLAYBACK_FRAME_COUNT) {
      this.playbackCycle++;
      useMesSpcStore.setState((state) => ({
        waferNumber: 1,
        measurements: [],
        violations: state.violations.slice(-12),
        lots: state.lots.map((lot) =>
          lot.id === activeLotId ? { ...lot, status: 'in_process' as const } : lot,
        ),
        equipmentState: 'processing' as const,
      }));
      return;
    }

    useMesSpcStore.getState().incrementWafer();
  }

  /** Map GemState to legacy equipmentState. */
  private _syncEquipmentState(): void {
    const gemState = this.gem.state;
    let equipmentState: 'idle' | 'processing' | 'inhibited';
    if (gemState === 'EXECUTING') {
      equipmentState = 'processing';
    } else if (gemState === 'PAUSED') {
      equipmentState = 'inhibited';
    } else {
      equipmentState = 'idle';
    }
    useMesSpcStore.setState({ equipmentState });
  }
}
