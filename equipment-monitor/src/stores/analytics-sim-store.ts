// ---------------------------------------------------------------------------
// Analytics Live-Data Store — single tick driver for /mes/analytics
// ---------------------------------------------------------------------------
//
// Owns exactly ONE setInterval tick driver (mirrors the FacilityTab pattern of
// a single store-owned interval, cleared on stop) that advances the shared
// analytics simulation at 1 Hz. State exposed to the Hero + 6 tabs:
//   - current wrapped tick (0..179) + monotonic elapsedTicks for the loop pill,
//   - the 6 per-module input snapshots for the current tick,
//   - a bounded ring buffer (cap 80, oldest evicted) of multi-category events,
//   - playing/paused state for the Hero ▶/⏸ control (WCAG 2.2.2),
//   - a prefersReducedMotion flag (freeze to latest snapshot when set).
//
// Components subscribe with granular selectors; the store, not the components,
// owns the timer so there is never more than one driver regardless of how many
// subscribers mount.
// ---------------------------------------------------------------------------

import { create } from 'zustand';
import { HistoryBuffer } from '@/lib/engines/history-buffer';
import {
  ANALYTICS_CYCLE_TICKS,
  generateAnalyticsTick,
  type AnalyticsEvent,
  type ModuleSnapshots,
} from '@/lib/analytics/analytics-sim';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Bounded event ring buffer capacity — oldest events are evicted past this. */
export const ANALYTICS_EVENT_CAPACITY = 80;

/** Tick cadence in milliseconds (1 Hz). */
export const ANALYTICS_TICK_INTERVAL_MS = 1000;

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

export interface AnalyticsSimState {
  /** Wrapped tick index in [0, 179] for the current frame. */
  tick: number;
  /** Monotonically increasing tick count (drives the loop progress pill). */
  elapsedTicks: number;
  /** Per-module input snapshots for the current tick. */
  modules: ModuleSnapshots;
  /** Bounded ring buffer of multi-category events (cap = ANALYTICS_EVENT_CAPACITY). */
  events: HistoryBuffer<AnalyticsEvent>;
  /**
   * Newest-first array snapshot of `events`, replaced (new reference) on every
   * tick so selectors subscribed to the feed re-render. The ring buffer above
   * remains the source of truth for capacity/eviction.
   */
  eventList: AnalyticsEvent[];
  /** Whether the simulation is currently advancing (Hero ▶/⏸). */
  playing: boolean;
  /** Honor `prefers-reduced-motion`: when true, freeze to the latest snapshot. */
  prefersReducedMotion: boolean;

  // Actions
  /** Start the single tick driver (no-op if already running). Resumes playing. */
  start: () => void;
  /** Stop the tick driver and clear the interval. Sets playing=false. */
  stop: () => void;
  /** Advance one tick: regenerate snapshots, push new events into the ring buffer. */
  tick_: () => void;
  /** Reflect the user's prefers-reduced-motion preference. */
  setPrefersReducedMotion: (value: boolean) => void;
  /** Reset to the initial (tick 0) state and stop the driver. */
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Single shared interval handle (module scope → exactly one driver)
// ---------------------------------------------------------------------------

let intervalHandle: ReturnType<typeof setInterval> | null = null;

function clearDriver(): void {
  if (intervalHandle !== null) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

function buildEventBuffer(): HistoryBuffer<AnalyticsEvent> {
  return new HistoryBuffer<AnalyticsEvent>(ANALYTICS_EVENT_CAPACITY);
}

function createInitialState() {
  const first = generateAnalyticsTick(0);
  const events = buildEventBuffer();
  for (const ev of first.events) {
    events.push(ev);
  }
  return {
    tick: first.tick,
    elapsedTicks: 0,
    modules: first.modules,
    events,
    eventList: events.toArray().reverse(),
    playing: false,
    prefersReducedMotion: false,
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAnalyticsSimStore = create<AnalyticsSimState>((set, get) => ({
  ...createInitialState(),

  start: () => {
    set({ playing: true });
    if (intervalHandle !== null) return; // already running — single driver only
    intervalHandle = setInterval(() => {
      // Reduced-motion users get a frozen snapshot: keep the driver paused.
      if (get().prefersReducedMotion) return;
      get().tick_();
    }, ANALYTICS_TICK_INTERVAL_MS);
  },

  stop: () => {
    clearDriver();
    set({ playing: false });
  },

  tick_: () => {
    const state = get();
    const nextElapsed = state.elapsedTicks + 1;
    const wrapped = nextElapsed % ANALYTICS_CYCLE_TICKS;
    const frame = generateAnalyticsTick(wrapped);

    // Push new events into the existing bounded ring buffer (oldest evicted).
    // Tag each with the elapsed tick so repeated wraps stay uniquely keyed.
    for (const ev of frame.events) {
      state.events.push({ ...ev, id: `${ev.id}-e${nextElapsed}` });
    }

    set({
      tick: frame.tick,
      elapsedTicks: nextElapsed,
      modules: frame.modules,
      // Ring buffer mutated in place above; publish a fresh newest-first array
      // reference so feed selectors re-render without a second copy of state.
      eventList: state.events.toArray().reverse(),
    });
  },

  setPrefersReducedMotion: (value: boolean) => {
    set({ prefersReducedMotion: value });
  },

  reset: () => {
    clearDriver();
    set({ ...createInitialState() });
  },
}));
