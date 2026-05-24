// ---------------------------------------------------------------------------
// Dashboard Facility Subsystem Store
// ---------------------------------------------------------------------------
import { create } from 'zustand';
import type {
  SubsystemId,
  SubsystemSnapshot,
  FacilityEvent,
} from '@/lib/engines/dashboard-facility-types';
import { SUBSYSTEM_IDS } from '@/lib/engines/dashboard-facility-types';
import {
  generateSubsystemSnapshot,
  generateEvents,
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
// State interface
// ---------------------------------------------------------------------------

export interface DashboardFacilityState {
  tick: number;
  elapsedTicks: number;
  eventOrdinal: number;
  subsystems: Record<SubsystemId, SubsystemSnapshot>;
  sparklines: Record<SubsystemId, HistoryBuffer<number>>;
  events: HistoryBuffer<FacilityEvent>;

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
      });
    },
  }),
);
