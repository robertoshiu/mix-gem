import {
  useAnalyticsSimStore,
  ANALYTICS_EVENT_CAPACITY,
  ANALYTICS_TICK_INTERVAL_MS,
} from '../analytics-sim-store';
import { ANALYTICS_CYCLE_TICKS } from '@/lib/analytics/analytics-sim';

beforeEach(() => {
  useAnalyticsSimStore.getState().reset();
});

afterEach(() => {
  // Ensure no driver leaks between tests.
  useAnalyticsSimStore.getState().stop();
});

describe('analytics-sim-store — initial state', () => {
  test('starts at tick 0, defaults to playing, reduced-motion off', () => {
    const s = useAnalyticsSimStore.getState();
    expect(s.tick).toBe(0);
    expect(s.elapsedTicks).toBe(0);
    // Default-playing matches the WCAG 2.2.2 "defaults to playing" design
    // requirement so the SSR/first-paint button reads "Pause"/⏸.
    expect(s.playing).toBe(true);
    expect(s.prefersReducedMotion).toBe(false);
  });

  test('seeds module snapshots and a (possibly empty) event list', () => {
    const s = useAnalyticsSimStore.getState();
    expect(s.modules).toHaveProperty('yield');
    expect(s.modules).toHaveProperty('vpp');
    expect(Array.isArray(s.eventList)).toBe(true);
    expect(s.events.length).toBe(s.eventList.length);
  });
});

describe('analytics-sim-store — tick_', () => {
  test('advances elapsedTicks and wraps the displayed tick', () => {
    const tick_ = useAnalyticsSimStore.getState().tick_;
    tick_();
    expect(useAnalyticsSimStore.getState().elapsedTicks).toBe(1);
    expect(useAnalyticsSimStore.getState().tick).toBe(1);
  });

  test('tick at elapsed 180 wraps display tick back to 0', () => {
    const tick_ = useAnalyticsSimStore.getState().tick_;
    for (let i = 0; i < ANALYTICS_CYCLE_TICKS; i++) tick_();
    const s = useAnalyticsSimStore.getState();
    expect(s.elapsedTicks).toBe(ANALYTICS_CYCLE_TICKS);
    expect(s.tick).toBe(0);
  });

  test('publishes a fresh newest-first eventList reference on push', () => {
    const before = useAnalyticsSimStore.getState().eventList;
    useAnalyticsSimStore.getState().tick_();
    const after = useAnalyticsSimStore.getState().eventList;
    expect(after).not.toBe(before);
  });

  test('module snapshots update to match the wrapped tick', () => {
    useAnalyticsSimStore.getState().tick_();
    useAnalyticsSimStore.getState().tick_();
    expect(useAnalyticsSimStore.getState().tick).toBe(2);
  });
});

describe('analytics-sim-store — bounded event ring buffer', () => {
  test('never exceeds the configured capacity and evicts oldest', () => {
    const tick_ = useAnalyticsSimStore.getState().tick_;
    // Run well past capacity so eviction definitely kicks in.
    for (let i = 0; i < ANALYTICS_CYCLE_TICKS * 3; i++) tick_();
    const s = useAnalyticsSimStore.getState();
    expect(s.events.length).toBeLessThanOrEqual(ANALYTICS_EVENT_CAPACITY);
    expect(s.eventList.length).toBeLessThanOrEqual(ANALYTICS_EVENT_CAPACITY);
    // With this many ticks the buffer should be saturated to its cap.
    expect(s.events.length).toBe(ANALYTICS_EVENT_CAPACITY);
  });

  test('eventList is newest-first (most recent elapsed tick leads)', () => {
    const tick_ = useAnalyticsSimStore.getState().tick_;
    // Advance until we have a few events.
    let guard = 0;
    while (useAnalyticsSimStore.getState().eventList.length < 3 && guard < 500) {
      tick_();
      guard++;
    }
    const list = useAnalyticsSimStore.getState().eventList;
    // ids pushed by tick_ are suffixed with the elapsed tick (-eN); the tick-0
    // seed events have no suffix and are the oldest (treat as elapsed 0).
    const elapsedOf = (id: string) => {
      const parts = id.split('-e');
      return parts.length > 1 ? Number(parts[parts.length - 1]) : 0;
    };
    for (let i = 1; i < list.length; i++) {
      expect(elapsedOf(list[i - 1].id)).toBeGreaterThanOrEqual(elapsedOf(list[i].id));
    }
  });

  test('reset clears the buffer back to the tick-0 seed', () => {
    const tick_ = useAnalyticsSimStore.getState().tick_;
    for (let i = 0; i < 50; i++) tick_();
    useAnalyticsSimStore.getState().reset();
    const s = useAnalyticsSimStore.getState();
    expect(s.tick).toBe(0);
    expect(s.elapsedTicks).toBe(0);
    expect(s.events.length).toBe(s.eventList.length);
  });
});

describe('analytics-sim-store — single tick driver', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    useAnalyticsSimStore.getState().stop();
    jest.useRealTimers();
  });

  test('start sets playing and drives ticks at 1 Hz', () => {
    useAnalyticsSimStore.getState().start();
    expect(useAnalyticsSimStore.getState().playing).toBe(true);
    jest.advanceTimersByTime(ANALYTICS_TICK_INTERVAL_MS * 3);
    expect(useAnalyticsSimStore.getState().elapsedTicks).toBe(3);
  });

  test('start is idempotent — only one driver runs', () => {
    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    useAnalyticsSimStore.getState().start();
    useAnalyticsSimStore.getState().start();
    useAnalyticsSimStore.getState().start();
    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(ANALYTICS_TICK_INTERVAL_MS * 2);
    // Two real intervals would double-count; a single driver yields exactly 2.
    expect(useAnalyticsSimStore.getState().elapsedTicks).toBe(2);
    setIntervalSpy.mockRestore();
  });

  test('stop halts ticking and clears playing', () => {
    useAnalyticsSimStore.getState().start();
    jest.advanceTimersByTime(ANALYTICS_TICK_INTERVAL_MS);
    useAnalyticsSimStore.getState().stop();
    const elapsedAfterStop = useAnalyticsSimStore.getState().elapsedTicks;
    expect(useAnalyticsSimStore.getState().playing).toBe(false);
    jest.advanceTimersByTime(ANALYTICS_TICK_INTERVAL_MS * 5);
    expect(useAnalyticsSimStore.getState().elapsedTicks).toBe(elapsedAfterStop);
  });

  test('prefers-reduced-motion freezes ticking while the driver runs', () => {
    useAnalyticsSimStore.getState().setPrefersReducedMotion(true);
    useAnalyticsSimStore.getState().start();
    jest.advanceTimersByTime(ANALYTICS_TICK_INTERVAL_MS * 5);
    expect(useAnalyticsSimStore.getState().elapsedTicks).toBe(0);
    // Clearing the preference resumes advancement.
    useAnalyticsSimStore.getState().setPrefersReducedMotion(false);
    jest.advanceTimersByTime(ANALYTICS_TICK_INTERVAL_MS * 2);
    expect(useAnalyticsSimStore.getState().elapsedTicks).toBe(2);
  });
});
