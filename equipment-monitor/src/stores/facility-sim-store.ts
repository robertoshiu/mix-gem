import { create } from 'zustand';
import type {
  FacilitySimState,
  FacilityScenarioId,
  FacilityAlarm,
  EquipmentHealth,
  CascadeLine,
} from '@/lib/engines/facility-types';
import { HistoryBuffer } from '@/lib/engines/history-buffer';
import { createInitialFacilityState, tickFacility } from '@/lib/engines/coupling-matrix';
import {
  injectScenario,
  clearScenario,
  collectAlarms,
  getEquipmentHealth,
  getCascadeLines,
} from '@/lib/engines/facility-scenarios';

// ── History Point ──

export interface HistoryPoint {
  tick: number;
  value: number;
}

// ── Constants ──

const HISTORY_CAPACITY = 300;

function createHistoryBuffers() {
  return {
    hvacTempHistory: new HistoryBuffer<HistoryPoint>(HISTORY_CAPACITY),
    hvacParticleHistory: new HistoryBuffer<HistoryPoint>(HISTORY_CAPACITY),
    hvacPressureHistory: new HistoryBuffer<HistoryPoint>(HISTORY_CAPACITY),
    gasNh3History: new HistoryBuffer<HistoryPoint>(HISTORY_CAPACITY),
    gasO2History: new HistoryBuffer<HistoryPoint>(HISTORY_CAPACITY),
    gasScrubberHistory: new HistoryBuffer<HistoryPoint>(HISTORY_CAPACITY),
    powerVoltageHistory: new HistoryBuffer<HistoryPoint>(HISTORY_CAPACITY),
    powerLoadHistory: new HistoryBuffer<HistoryPoint>(HISTORY_CAPACITY),
    powerSocHistory: new HistoryBuffer<HistoryPoint>(HISTORY_CAPACITY),
  };
}

// ── Store Interface ──

interface FacilitySimStoreState {
  sim: FacilitySimState;
  tick: number;
  scenario: FacilityScenarioId;

  // Derived
  alarms: FacilityAlarm[];
  equipmentHealth: EquipmentHealth[];
  cascadeLines: CascadeLine[];

  // History buffers (9 channels, 300 points each)
  hvacTempHistory: HistoryBuffer<HistoryPoint>;
  hvacParticleHistory: HistoryBuffer<HistoryPoint>;
  hvacPressureHistory: HistoryBuffer<HistoryPoint>;
  gasNh3History: HistoryBuffer<HistoryPoint>;
  gasO2History: HistoryBuffer<HistoryPoint>;
  gasScrubberHistory: HistoryBuffer<HistoryPoint>;
  powerVoltageHistory: HistoryBuffer<HistoryPoint>;
  powerLoadHistory: HistoryBuffer<HistoryPoint>;
  powerSocHistory: HistoryBuffer<HistoryPoint>;

  // Scenario markers
  scenarioMarkers: HistoryPoint[];

  // Actions
  tick_: () => void;
  setScenario: (id: FacilityScenarioId) => void;
  reset: () => void;
}

function createInitialState() {
  const sim = createInitialFacilityState();
  return {
    sim,
    tick: 0,
    scenario: 'nominal' as FacilityScenarioId,
    alarms: [] as FacilityAlarm[],
    equipmentHealth: [] as EquipmentHealth[],
    cascadeLines: [] as CascadeLine[],
    ...createHistoryBuffers(),
    scenarioMarkers: [] as HistoryPoint[],
  };
}

export const INITIAL_FACILITY_SIM_STATE = createInitialState();

export const useFacilitySimStore = create<FacilitySimStoreState>((set, get) => ({
  ...createInitialState(),

  tick_: () => {
    const state = get();
    const nextSim = tickFacility(state.sim);
    const nextTick = nextSim.tick;

    // Derive alarm/health/cascade from new sim state
    const alarms = collectAlarms(nextSim);
    const equipmentHealth = getEquipmentHealth(nextSim);
    const cascadeLines = getCascadeLines(nextSim);

    // Push to history buffers (mutate in place, then spread to trigger re-render)
    const t = nextTick;
    state.hvacTempHistory.push({ tick: t, value: nextSim.hvac.nodes['zone-cr'].T });
    state.hvacParticleHistory.push({ tick: t, value: nextSim.hvac.nodes['zone-cr'].particleCount });
    state.hvacPressureHistory.push({ tick: t, value: nextSim.hvac.nodes['zone-cr'].P });

    // Gas sensors: find first NH3 and first O2
    const nh3Sensor = nextSim.gas.sensors.find(s => s.species === 'NH3');
    const o2Sensor = nextSim.gas.sensors.find(s => s.species === 'O2');
    state.gasNh3History.push({ tick: t, value: nh3Sensor?.concentration ?? 0 });
    state.gasO2History.push({ tick: t, value: o2Sensor?.concentration ?? 20.9 });
    state.gasScrubberHistory.push({ tick: t, value: nextSim.gas.scrubber.efficiency * 100 });

    // Power
    state.powerVoltageHistory.push({ tick: t, value: nextSim.power.nodes['load-bus'].V });
    state.powerLoadHistory.push({ tick: t, value: nextSim.power.totalLoad });
    state.powerSocHistory.push({ tick: t, value: nextSim.power.ups.soc * 100 });

    set({
      sim: nextSim,
      tick: nextTick,
      alarms,
      equipmentHealth,
      cascadeLines,
    });
  },

  setScenario: (id: FacilityScenarioId) => {
    const state = get();
    let nextSim: FacilitySimState;
    const markers = [...state.scenarioMarkers];

    if (id === 'nominal') {
      nextSim = clearScenario(state.sim);
    } else {
      nextSim = injectScenario(state.sim, id);
      markers.push({ tick: state.tick, value: state.tick });
    }

    // Recompute derived
    const alarms = collectAlarms(nextSim);
    const equipmentHealth = getEquipmentHealth(nextSim);
    const cascadeLines = getCascadeLines(nextSim);

    set({
      sim: nextSim,
      scenario: id,
      alarms,
      equipmentHealth,
      cascadeLines,
      scenarioMarkers: markers,
    });
  },

  reset: () => {
    set({
      ...createInitialState(),
    });
  },
}));
