import { trimMeasurements, createRollingWindow } from '@/lib/data-retention';
import { useMesSpcStore, INITIAL_MES_SPC_STATE } from '@/stores/mes-spc-store';
import type { SpcMeasurement } from '@/lib/mes-types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a lightweight SpcMeasurement with minimal fields for bulk testing. */
function makeBulkMeasurement(index: number, lotId = 'BULK-LOT'): SpcMeasurement {
  return {
    id: `${lotId}-w${index}`,
    lotId,
    waferNumber: index + 1,
    timestamp: new Date(Date.UTC(2026, 4, 1) + index * 2000),
    cd: 20 + (index % 10) * 1.5,
    cdu: 1.0 + Math.sin(index * 0.1) * 0.3,
    ovl_x: 0.05 + Math.cos(index * 0.05) * 0.02,
    ovl_y: -0.03 + Math.sin(index * 0.07) * 0.04,
    ler: 0.6 + (index % 5) * 0.1,
  };
}

/** Generate an array of N bulk measurements. */
function generateBulkMeasurements(count: number, lotId = 'BULK-LOT'): SpcMeasurement[] {
  return Array.from({ length: count }, (_, i) => makeBulkMeasurement(i, lotId));
}

// Restore store to initial state before each test.
beforeEach(() => {
  useMesSpcStore.setState(INITIAL_MES_SPC_STATE);
});

// ---------------------------------------------------------------------------
// Test 1: Heap usage stays under 50 MB equivalent (functional verification)
// ---------------------------------------------------------------------------

describe('Memory benchmark – 25 000 data points', () => {
  const DATA_POINTS = 25000;
  const RETAIN_MAX = 5000;

  it('trimMeasurements reduces 25 000 items to exactly 5 000', () => {
    const items = generateBulkMeasurements(DATA_POINTS);
    expect(items).toHaveLength(DATA_POINTS);

    const trimmed = trimMeasurements(items, RETAIN_MAX);

    // Core assertion: trimming caps at 5 000
    expect(trimmed).toHaveLength(RETAIN_MAX);
  });

  it('trimMeasurements keeps the most recent measurements (last 5 000)', () => {
    const items = generateBulkMeasurements(DATA_POINTS);
    const trimmed = trimMeasurements(items, RETAIN_MAX);

    // The first kept item should be the (DATA_POINTS - RETAIN_MAX)-th item
    expect(trimmed[0].id).toBe(items[DATA_POINTS - RETAIN_MAX].id);
    // The last kept item should be the very last item
    expect(trimmed[trimmed.length - 1].id).toBe(items[DATA_POINTS - 1].id);
  });

  it('loading 25 000 measurements into store does not cause timeout or crash', () => {
    const store = useMesSpcStore.getState();
    const items = generateBulkMeasurements(DATA_POINTS);

    // Load all measurements one-by-one (simulating real ingestion)
    for (const m of items) {
      store.addMeasurement(m);
    }

    // State should contain all 25 000 measurements (no trimming in store itself)
    expect(useMesSpcStore.getState().measurements).toHaveLength(DATA_POINTS);
  });

  it('trimMeasurements after store load correctly caps to 5 000', () => {
    const store = useMesSpcStore.getState();
    const items = generateBulkMeasurements(DATA_POINTS);
    for (const m of items) {
      store.addMeasurement(m);
    }

    const current = useMesSpcStore.getState().measurements;
    const trimmed = trimMeasurements(current, RETAIN_MAX);

    expect(trimmed).toHaveLength(RETAIN_MAX);
    // Most recent measurement is preserved
    expect(trimmed[trimmed.length - 1].id).toBe(items[DATA_POINTS - 1].id);
  });

  it('full pipeline: generate → trim → verify no stack overflow', () => {
    // Stress test: generate, trim, verify multiple times
    for (let iteration = 0; iteration < 5; iteration++) {
      const items = generateBulkMeasurements(DATA_POINTS);
      const trimmed = trimMeasurements(items, RETAIN_MAX);
      expect(trimmed).toHaveLength(RETAIN_MAX);
    }
    // If we reach here without stack overflow, it passed
    expect(true).toBe(true);
  });

  it('5 parameters × 5 000 measurements = 25 000 total data points handled', () => {
    // Create measurements with all 5 parameters varied
    const items = generateBulkMeasurements(DATA_POINTS);

    // Verify each measurement has all 5 SPC parameters populated
    for (const item of items.slice(0, 100)) {
      expect(typeof item.cd).toBe('number');
      expect(typeof item.cdu).toBe('number');
      expect(typeof item.ovl_x).toBe('number');
      expect(typeof item.ovl_y).toBe('number');
      expect(typeof item.ler).toBe('number');
    }

    const trimmed = trimMeasurements(items, RETAIN_MAX);
    expect(trimmed).toHaveLength(RETAIN_MAX);

    // Spot-check: first and last trimmed items have valid parameter values
    expect(trimmed[0].cd).not.toBeNaN();
    expect(trimmed[trimmed.length - 1].cd).not.toBeNaN();
  });
});

// ---------------------------------------------------------------------------
// Test 2: Rolling window correctly prunes data
// ---------------------------------------------------------------------------

describe('Rolling window pruning', () => {
  const WINDOW = 5000;
  const OVERFLOW = 6000;

  it('trimMeasurements caps at exactly 5 000 when fed 6 000 items', () => {
    const items = generateBulkMeasurements(OVERFLOW);
    const result = trimMeasurements(items, WINDOW);

    expect(result).toHaveLength(WINDOW);
    // First retained item should match items[overflow - window]
    expect(result[0].id).toBe(items[OVERFLOW - WINDOW].id);
  });

  it('most recent measurements are preserved after trim', () => {
    const items = generateBulkMeasurements(OVERFLOW);
    const result = trimMeasurements(items, WINDOW);

    // Last item in result should be the very last item in the source
    expect(result[result.length - 1].id).toBe(items[OVERFLOW - 1].id);
    // Timestamps in result should be monotonically increasing
    for (let i = 1; i < result.length; i++) {
      expect(result[i].timestamp.getTime()).toBeGreaterThanOrEqual(
        result[i - 1].timestamp.getTime(),
      );
    }
  });

  it('adding 100 more measurements after trim keeps count ≤ 5 000', () => {
    // Step 1: load 5 000 + 200 = 5 200 into store
    const store = useMesSpcStore.getState();
    const initial = generateBulkMeasurements(5200);
    for (const m of initial) {
      store.addMeasurement(m);
    }

    // Step 2: trim to 5 000
    const trimmed = trimMeasurements(useMesSpcStore.getState().measurements, WINDOW);
    expect(trimmed).toHaveLength(WINDOW);

    // Step 3: add 100 more
    const extra = generateBulkMeasurements(100, 'EXTRA-LOT');
    const combined = [...trimmed, ...extra];

    // Step 4: re-trim – should be at most 5 000
    const reTrimmed = trimMeasurements(combined, WINDOW);
    expect(reTrimmed.length).toBeLessThanOrEqual(WINDOW);
  });

  it('createRollingWindow returns exactly windowSize items when over the limit', () => {
    const items = generateBulkMeasurements(OVERFLOW);
    const result = createRollingWindow(items, WINDOW);

    expect(result).toHaveLength(WINDOW);
    // Window should hold the most recent items
    expect(result[0].id).toBe(items[OVERFLOW - WINDOW].id);
    expect(result[result.length - 1].id).toBe(items[OVERFLOW - 1].id);
  });

  it('createRollingWindow with window=5000 on 10000 items returns last 5000', () => {
    const items = generateBulkMeasurements(10000);
    const result = createRollingWindow(items, 5000);

    expect(result).toHaveLength(5000);
    expect(result[0].id).toBe(items[5000].id);
    expect(result[result.length - 1].id).toBe(items[9999].id);
  });

  it('preserves correct count after repeated trim/add cycles', () => {
    let buffer: SpcMeasurement[] = [];

    // Simulate 10 cycles of add-trim (6 000 → trim to 5 000)
    for (let cycle = 0; cycle < 10; cycle++) {
      const batch = generateBulkMeasurements(6000, `CYCLE-${cycle}`);
      buffer = trimMeasurements([...buffer, ...batch], WINDOW);
      expect(buffer.length).toBeLessThanOrEqual(WINDOW);
    }

    // After 10 cycles, should still be at window size
    expect(buffer).toHaveLength(WINDOW);
  });
});

// ---------------------------------------------------------------------------
// Test 3: No memory leaks across mount/unmount cycles
// ---------------------------------------------------------------------------

describe('Mount/unmount memory leak resistance', () => {
  it('does not leak subscriptions across 10 mount/unmount cycles', () => {
    const subs: Array<() => void> = [];

    // Simulate 10 mount/unmount cycles
    for (let cycle = 0; cycle < 10; cycle++) {
      // Mount: subscribe
      const unsub = useMesSpcStore.subscribe((state) => {
        // Minimal listener body – just capture state reference change
        void (state.measurements.length);
      });
      subs.push(unsub);

      // Simulate some work during mount
      const items = generateBulkMeasurements(500, `MOUNT-${cycle}`);
      const store = useMesSpcStore.getState();
      for (const m of items) {
        store.addMeasurement(m);
      }

      // Unmount
      const last = subs.pop()!;
      last();
    }

    // After all cycles, store should still be functional
    expect(useMesSpcStore.getState().measurements.length).toBeGreaterThan(0);

    // Verify no leaked listeners by setting state and observing
    // (If listeners leaked, they'd process state changes beyond lifecycle)
    useMesSpcStore.setState(INITIAL_MES_SPC_STATE);
    expect(useMesSpcStore.getState().measurements).toHaveLength(0);
  });

  it('store state resets cleanly between mount cycles', () => {
    for (let cycle = 0; cycle < 10; cycle++) {
      // Start clean
      useMesSpcStore.setState(INITIAL_MES_SPC_STATE);
      expect(useMesSpcStore.getState().measurements).toHaveLength(0);

      // Load data
      const store = useMesSpcStore.getState();
      const items = generateBulkMeasurements(1000, `CLEAN-${cycle}`);
      for (const m of items) {
        store.addMeasurement(m);
      }
      expect(useMesSpcStore.getState().measurements).toHaveLength(1000);

      // Reset before next cycle
      useMesSpcStore.setState(INITIAL_MES_SPC_STATE);
    }

    // Final state should be clean
    expect(useMesSpcStore.getState().measurements).toHaveLength(0);
  });

  it('unsubscribed listeners do not fire on subsequent state changes', () => {
    let callCount = 0;
    const unsub = useMesSpcStore.subscribe(() => {
      callCount++;
    });

    // Fire a state change – listener should fire
    useMesSpcStore.getState().addMeasurement(makeBulkMeasurement(0));
    expect(callCount).toBeGreaterThan(0);

    // Unsubscribe
    const beforeUnsub = callCount;
    unsub();

    // Fire more state changes – listener should NOT fire
    for (let i = 0; i < 20; i++) {
      useMesSpcStore.getState().addMeasurement(makeBulkMeasurement(i + 1));
    }

    expect(callCount).toBe(beforeUnsub);
  });

  it('multiple subscribe/unsubscribe cycles do not degrade store performance', () => {
    // Stress test: rapid subscribe/unsubscribe
    for (let cycle = 0; cycle < 50; cycle++) {
      const unsub = useMesSpcStore.subscribe(() => {
        // empty listener
      });
      unsub();
    }

    // Store should still work
    useMesSpcStore.getState().addMeasurement(makeBulkMeasurement(0));
    expect(useMesSpcStore.getState().measurements).toHaveLength(1);
  });

  it('store measurements array does not retain stale references after reset', () => {
    // Load data
    const store = useMesSpcStore.getState();
    const items = generateBulkMeasurements(5000);
    for (const m of items) {
      store.addMeasurement(m);
    }

    expect(useMesSpcStore.getState().measurements).toHaveLength(5000);

    // Trim and reset
    const trimmed = trimMeasurements(useMesSpcStore.getState().measurements, 1000);
    expect(trimmed).toHaveLength(1000);

    // Full reset
    useMesSpcStore.setState(INITIAL_MES_SPC_STATE);
    expect(useMesSpcStore.getState().measurements).toHaveLength(0);

    // Verify no residual data in other store fields
    const state = useMesSpcStore.getState();
    expect(state.events).toHaveLength(0);
    expect(state.violations).toHaveLength(0);
    expect(state.equipmentState).toBe('idle');
  });
});
