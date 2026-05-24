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

// ---------------------------------------------------------------------------
// State interface
// ---------------------------------------------------------------------------

export interface DashboardFacilityState {
  tick: number;
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
    subsystems: buildInitialSubsystems(),
    sparklines: buildSparklines(),
    events: new HistoryBuffer<FacilityEvent>(EVENT_CAPACITY),

    tick_: () => {
      const state = get();
      const nextTick = (state.tick + 1) % TICK_WRAP;

      // Generate new subsystem snapshots
      const subsystems = {} as Record<SubsystemId, SubsystemSnapshot>;
      const sparklines = state.sparklines;

      for (const id of SUBSYSTEM_IDS) {
        const snapshot = generateSubsystemSnapshot(nextTick, id);
        subsystems[id] = snapshot;
        // Push primary metric (metrics[0].value) to sparkline
        sparklines[id].push(snapshot.metrics[0].value);
      }

      // Generate events and push to buffer
      const events = state.events;
      const newEvents = generateEvents(nextTick);
      for (const ev of newEvents) {
        events.push(ev);
      }

      set({
        tick: nextTick,
        subsystems,
        sparklines,
        events,
      });
    },

    reset: () => {
      set({
        tick: 0,
        subsystems: buildInitialSubsystems(),
        sparklines: buildSparklines(),
        events: new HistoryBuffer<FacilityEvent>(EVENT_CAPACITY),
      });
    },
  }),
);
