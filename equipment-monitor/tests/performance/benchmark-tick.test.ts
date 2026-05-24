/**
 * Performance benchmark tests for SimulatorEngine.
 *
 * Measures:
 *   - Average tick duration (target < 500ms)
 *   - 99th percentile tick duration (target < 1000ms)
 *   - Total 1000-tick execution time (target < 60s)
 *   - Store update performance with 5000 measurements (target < 50ms per add)
 *
 * Uses jest fake timers for deterministic, fast execution.
 * Real wall-clock time is measured via process.hrtime.bigint()
 * because jest.useFakeTimers() also fakes performance.now().
 * Assertions are informational — targets are aspirational, not hard limits.
 */

import { SimulatorEngine } from '@/lib/simulator-engine';
import { useMesSpcStore, INITIAL_MES_SPC_STATE } from '@/stores/mes-spc-store';
import type { SpcMeasurement } from '@/lib/mes-types';

// ── Constants ────────────────────────────────────────────────────

const TICK_MS = 2000;
const MAX_WAFERS = 25; // Engine auto-completes lot after this many wafers
const TICKS_PER_LOT = MAX_WAFERS; // One tick = one wafer
const TARGET_TICK_SAMPLES = 100;
const TARGET_TOTAL_TICKS = 1000;

jest.useFakeTimers({ doNotFake: ['hrtime'] });

// ── Real-time measurement helpers ─────────────────────────────────
// process.hrtime.bigint() is NOT faked by Jest — it returns genuine
// wall-clock nanoseconds, so use it for all benchmarking measurements.

/** Capture a high-resolution real-time timestamp in milliseconds. */
function realNow(): number {
  return Number(process.hrtime.bigint()) / 1e6; // ns → ms
}

/** Measure the wall-clock duration of fn() in milliseconds. */
function realElapsed(fn: () => void): number {
  const t0 = process.hrtime.bigint();
  fn();
  return Number(process.hrtime.bigint() - t0) / 1e6;
}

// ── Fixture Helpers ──────────────────────────────────────────────

/** Reset the store to initial state and start processing a new lot. */
function setupLot(): void {
  useMesSpcStore.setState({ ...INITIAL_MES_SPC_STATE });
  useMesSpcStore.getState().startProcessing('LOT-2026-001', 'LITHO-193nm-v4');
}

/** Reset store, create a fresh engine, and start it. */
function prepareEngine(): SimulatorEngine {
  setupLot();
  const engine = new SimulatorEngine();
  engine.start();
  return engine;
}

/**
 * Advance fake timers by `TICK_MS` and measure the real elapsed time.
 * Returns the wall-clock duration (in ms) of the synchronous tick callback.
 */
function timeOneTick(): number {
  return realElapsed(() => {
    jest.advanceTimersByTime(TICK_MS);
  });
}

/**
 * Run `count` ticks through one or more engine instances,
 * handling lot completion by restarting with fresh store + engine.
 * Collects per-tick real-time durations and returns them.
 */
function runTimedTicks(count: number): number[] {
  const durations: number[] = [];
  let ticksRun = 0;

  while (ticksRun < count) {
    const engine = prepareEngine();

    // Run ticks for this engine instance. The engine may stop early
    // due to SPC violations or after MAX_WAFERS wafers.
    for (let i = 0; i < TICKS_PER_LOT && ticksRun < count; i++) {
      durations.push(timeOneTick());
      ticksRun++;

      // If the engine has cleared its interval (stopped itself), break out
      const engineActive = engine.isRunning();
      if (!engineActive) break;
    }

    // Ensure cleanup
    engine.stop();
  }

  return durations;
}

/** Calculate the p-th percentile (0–1) from a sorted array. */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil(p * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

// ── Tests ────────────────────────────────────────────────────────

describe('SimulatorEngine Performance', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  // ── Tick Duration ────────────────────────────────────────────

  describe('tick duration benchmarks', () => {
    /** Shared data collected once for all tick-duration assertions. */
    let tickDurations: number[];

    beforeAll(() => {
      tickDurations = runTimedTicks(TARGET_TICK_SAMPLES);

      const avg = tickDurations.reduce((s, d) => s + d, 0) / tickDurations.length;
      const sorted = [...tickDurations].sort((a, b) => a - b);
      const p50 = percentile(sorted, 0.50);
      const p95 = percentile(sorted, 0.95);
      const p99 = percentile(sorted, 0.99);
      const max = sorted[sorted.length - 1];

      console.log('─── Tick Duration Benchmarks ───');
      console.log(`  Samples collected : ${tickDurations.length}`);
      console.log(`  Average           : ${avg.toFixed(4)} ms`);
      console.log(`  50th percentile   : ${p50.toFixed(4)} ms`);
      console.log(`  95th percentile   : ${p95.toFixed(4)} ms`);
      console.log(`  99th percentile   : ${p99.toFixed(4)} ms`);
      console.log(`  Maximum           : ${max.toFixed(4)} ms`);
      console.log(`  Target (avg)      : < 500 ms`);
      console.log(`  Target (p99)      : < 1000 ms`);
      console.log('───────────────────────────────');
    });

    it('average tick duration < 500ms', () => {
      const avg = tickDurations.reduce((s, d) => s + d, 0) / tickDurations.length;
      // Informational assertion with generous tolerance
      expect(avg).toBeLessThan(500);
    });

    it('99th percentile tick duration < 1000ms', () => {
      const sorted = [...tickDurations].sort((a, b) => a - b);
      const p99 = percentile(sorted, 0.99);
      expect(p99).toBeLessThan(1000);
    });
  });

  // ── Total Execution (1000 ticks) ─────────────────────────────

  describe('total execution time', () => {
    let totalDuration: number;

    beforeAll(() => {
      const start = realNow();
      runTimedTicks(TARGET_TOTAL_TICKS);
      totalDuration = realNow() - start;

      console.log('─── Total Execution Benchmark ───');
      console.log(`  Ticks executed    : ${TARGET_TOTAL_TICKS}`);
      console.log(`  Wall-clock time   : ${totalDuration.toFixed(2)} ms`);
      console.log(`  Time per tick     : ${(totalDuration / TARGET_TOTAL_TICKS).toFixed(4)} ms`);
      console.log(`  Target            : < 60,000 ms (60s)`);
      console.log('─────────────────────────────────');
    });

    it('total 1000-tick execution < 60s', () => {
      expect(totalDuration).toBeLessThan(60_000);
    });
  });

  // ── Store Update with 5000 Measurements ──────────────────────

  describe('store update performance', () => {
    it('average addMeasurement < 50ms with 5000 pre-existing measurements', () => {
      // Pre-populate 5000 measurements
      const seed: SpcMeasurement[] = Array.from({ length: 5000 }, (_, i) => ({
        id: `m-${i}`,
        lotId: 'LOT-001',
        waferNumber: i + 1,
        timestamp: new Date(),
        cd: 45,
        cdu: 2,
        ovl_x: 0,
        ovl_y: 0,
        ler: 3,
      }));
      useMesSpcStore.setState({ measurements: seed });

      // Measure addMeasurement time for 100 new measurements
      const durations: number[] = [];
      for (let i = 0; i < 100; i++) {
        const m: SpcMeasurement = {
          id: `new-${i}`,
          lotId: 'LOT-001',
          waferNumber: 5001 + i,
          timestamp: new Date(),
          cd: 45,
          cdu: 2,
          ovl_x: 0,
          ovl_y: 0,
          ler: 3,
        };
        const t0 = process.hrtime.bigint();
        useMesSpcStore.getState().addMeasurement(m);
        durations.push(Number(process.hrtime.bigint() - t0) / 1e6);
      }

      const avg = durations.reduce((s, d) => s + d, 0) / durations.length;
      const sorted = [...durations].sort((a, b) => a - b);
      const p99 = percentile(sorted, 0.99);

      console.log('─── Store Update Benchmarks ───');
      console.log(`  Pre-populated     : 5,000 measurements`);
      console.log(`  New adds measured : 100`);
      console.log(`  Average add       : ${avg.toFixed(4)} ms`);
      console.log(`  99th percentile   : ${p99.toFixed(4)} ms`);
      console.log(`  Target            : < 50 ms`);
      console.log('──────────────────────────────');

      expect(avg).toBeLessThan(50);
    });
  });
});
