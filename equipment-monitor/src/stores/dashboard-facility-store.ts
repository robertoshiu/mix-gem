// ---------------------------------------------------------------------------
// Dashboard Facility Subsystem Store
// ---------------------------------------------------------------------------
import { create } from 'zustand';
import type {
  SubsystemId,
  SubsystemSnapshot,
  FacilityEvent,
  EquipmentStatus,
} from '@/lib/engines/dashboard-facility-types';
import { SUBSYSTEM_IDS } from '@/lib/engines/dashboard-facility-types';
import {
  generateSubsystemSnapshot,
  generateEvents,
  computeComfortIndex,
  computeGasSafetyScore,
  computePUE,
  countActiveAlarms,
  computeSystemUptime,
  generateEquipmentStatuses,
} from '@/lib/engines/dashboard-facility-engine';
import { HistoryBuffer } from '@/lib/engines/history-buffer';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TICK_WRAP = 180;
const SPARKLINE_CAPACITY = 180;
const EVENT_CAPACITY = 200;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildInitialSubsystems(): Record<SubsystemId, SubsystemSnapshot> {
  const result = {} as Record<SubsystemId, SubsystemSnapshot>;
  for (const id of SUBSYSTEM_IDS) {
    result[id] = generateSubsystemSnapshot(0, id);
  }
  return result;
}

function buildSparklines(): Record<SubsystemId, HistoryBuffer<number>> {
  const result = {} as Record<SubsystemId, HistoryBuffer<number>>;
  for (const id of SUBSYSTEM_IDS) {
    result[id] = new HistoryBuffer<number>(SPARKLINE_CAPACITY);
  }
  return result;
}

function buildBuffer<T>(values: T[], capacity: number): HistoryBuffer<T> {
  const buffer = new HistoryBuffer<T>(capacity);
  for (const value of values) {
    buffer.push(value);
  }
  return buffer;
}

// ---------------------------------------------------------------------------
// KPI & Equipment helpers
// ---------------------------------------------------------------------------

export interface FacilityKpis {
  comfortIndex: number;
  gasSafety: number;
  pue: number;
  systemUptime: number;
  energyLoad: number;
  activeAlarms: { warnings: number; criticals: number };
}

function computeKpis(subsystems: Record<SubsystemId, SubsystemSnapshot>): FacilityKpis {
  return {
    comfortIndex: computeComfortIndex(subsystems.ems),
    gasSafety: computeGasSafetyScore(subsystems.gas),
    pue: computePUE(subsystems.power),
    systemUptime: computeSystemUptime(subsystems),
    energyLoad: subsystems.power.metrics[1].value,
    activeAlarms: countActiveAlarms(subsystems),
  };
}

function buildEquipmentStatuses(tick: number): Record<SubsystemId, [EquipmentStatus, EquipmentStatus, EquipmentStatus]> {
  const result = {} as Record<SubsystemId, [EquipmentStatus, EquipmentStatus, EquipmentStatus]>;
  for (const id of SUBSYSTEM_IDS) {
    result[id] = generateEquipmentStatuses(tick, id);
  }
  return result;
}

// ---------------------------------------------------------------------------
// State interface
// ---------------------------------------------------------------------------

export interface DashboardFacilityState {
  tick: number;
  elapsedTicks: number;
  eventOrdinal: number;
  subsystems: Record<SubsystemId, SubsystemSnapshot>;
  sparklines: Record<SubsystemId, HistoryBuffer<number>>;
  events: HistoryBuffer<FacilityEvent>;
  kpis: FacilityKpis;
  equipmentStatuses: Record<SubsystemId, [EquipmentStatus, EquipmentStatus, EquipmentStatus]>;

  tick_: () => void;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useDashboardFacilityStore = create<DashboardFacilityState>(
  (set, get) => ({
    tick: 0,
    elapsedTicks: 0,
    eventOrdinal: 0,
    subsystems: buildInitialSubsystems(),
    sparklines: buildSparklines(),
    events: new HistoryBuffer<FacilityEvent>(EVENT_CAPACITY),
    kpis: computeKpis(buildInitialSubsystems()),
    equipmentStatuses: buildEquipmentStatuses(0),

    tick_: () => {
      const state = get();
      const nextElapsedTicks = state.elapsedTicks + 1;
      const nextTick = nextElapsedTicks % TICK_WRAP;

      // Generate new subsystem snapshots
      const subsystems = {} as Record<SubsystemId, SubsystemSnapshot>;
      const sparklines = {} as Record<SubsystemId, HistoryBuffer<number>>;

      for (const id of SUBSYSTEM_IDS) {
        const snapshot = generateSubsystemSnapshot(nextTick, id);
        subsystems[id] = snapshot;
        sparklines[id] = buildBuffer(
          [...state.sparklines[id].toArray(), snapshot.metrics[0].value],
          SPARKLINE_CAPACITY,
        );
      }

      // Compute KPIs and equipment statuses
      const kpis = computeKpis(subsystems);
      const equipmentStatuses = buildEquipmentStatuses(nextTick);

      // Generate events and push to buffer
      const newEvents = generateEvents(nextTick);
      let eventOrdinal = state.eventOrdinal;
      const eventValues = state.events.toArray();
      for (const ev of newEvents) {
        eventOrdinal += 1;
        eventValues.push({ ...ev, id: `${ev.id}-seq-${eventOrdinal}` });
      }
      const events = buildBuffer(eventValues, EVENT_CAPACITY);

      set({
        tick: nextTick,
        elapsedTicks: nextElapsedTicks,
        eventOrdinal,
        subsystems,
        sparklines,
        events,
        kpis,
        equipmentStatuses,
      });
    },

    reset: () => {
      set({
        tick: 0,
        elapsedTicks: 0,
        eventOrdinal: 0,
        subsystems: buildInitialSubsystems(),
        sparklines: buildSparklines(),
        events: new HistoryBuffer<FacilityEvent>(EVENT_CAPACITY),
        kpis: computeKpis(buildInitialSubsystems()),
        equipmentStatuses: buildEquipmentStatuses(0),
      });
    },
  }),
);
