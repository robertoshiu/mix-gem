import {
  createController,
  stepController,
  generateDrift,
  simulateRuns,
  computeResidualStats,
} from '../apc-engine';

describe('createController', () => {
  test('initializes with target as level and zero slope', () => {
    const state = createController({ target: 100, lambda: 0.3, lambdaSlope: 0.1, noise: 1.5 });
    expect(state.level).toBe(100);
    expect(state.slope).toBe(0);
    expect(state.correction).toBe(0);
  });
});

describe('stepController', () => {
  test('adjusts level toward measurement', () => {
    const config = { target: 100, lambda: 0.3, lambdaSlope: 0.1, noise: 1.5 };
    const state = createController(config);
    const { newState } = stepController(state, 105, config);
    expect(newState.level).toBeGreaterThan(100);
    expect(newState.level).toBeLessThan(105);
  });

  test('with lambdaSlope=0 slope stays zero (single EWMA)', () => {
    const config = { target: 100, lambda: 0.3, lambdaSlope: 0, noise: 1.5 };
    const state = createController(config);
    const { newState } = stepController(state, 110, config);
    expect(newState.slope).toBe(0);
  });

  test('correction opposes forecast deviation from target', () => {
    const config = { target: 100, lambda: 0.3, lambdaSlope: 0.1, noise: 1.5 };
    const state = createController(config);
    const { newState } = stepController(state, 108, config);
    expect(newState.correction).toBeLessThan(0);
  });
});

describe('generateDrift', () => {
  test('none returns 0', () => {
    expect(generateDrift({ type: 'none' }, 50)).toBe(0);
  });

  test('linear scales with run index', () => {
    const d1 = generateDrift({ type: 'linear', slope: 0.5 }, 10);
    const d2 = generateDrift({ type: 'linear', slope: 0.5 }, 20);
    expect(d2).toBeCloseTo(d1 + 0.5 * 10, 6);
  });

  test('sinusoidal is bounded by amplitude', () => {
    const config = { type: 'sinusoidal' as const, amplitude: 5, period: 20 };
    for (let i = 0; i < 100; i++) {
      const d = generateDrift(config, i);
      expect(Math.abs(d)).toBeLessThanOrEqual(5.001);
    }
  });

  test('step-shift is zero before trigger, magnitude after', () => {
    const config = { type: 'step-shift' as const, magnitude: 10, triggerRun: 25 };
    expect(generateDrift(config, 20)).toBe(0);
    expect(generateDrift(config, 30)).toBe(10);
  });
});

describe('simulateRuns', () => {
  test('returns correct number of runs', () => {
    const config = { target: 100, lambda: 0.3, lambdaSlope: 0.1, noise: 1.5 };
    const drift = { type: 'none' as const };
    const results = simulateRuns(config, drift, 50, 42);
    expect(results).toHaveLength(50);
  });

  test('controlled output is closer to target than uncontrolled under drift', () => {
    const config = { target: 100, lambda: 0.3, lambdaSlope: 0.1, noise: 0.5 };
    const drift = { type: 'linear' as const, slope: 0.5 };
    const results = simulateRuns(config, drift, 80, 42);
    const last20 = results.slice(60);
    const controlledMse = last20.reduce((s, r) => s + (r.controlled - 100) ** 2, 0) / 20;
    const uncontrolledMse = last20.reduce((s, r) => s + (r.uncontrolled - 100) ** 2, 0) / 20;
    expect(controlledMse).toBeLessThan(uncontrolledMse);
  });

  test('is deterministic with same seed', () => {
    const config = { target: 100, lambda: 0.3, lambdaSlope: 0.1, noise: 1.5 };
    const drift = { type: 'linear' as const, slope: 0.3 };
    const a = simulateRuns(config, drift, 20, 77);
    const b = simulateRuns(config, drift, 20, 77);
    expect(a).toEqual(b);
  });
});

describe('computeResidualStats', () => {
  test('computes mean near zero for on-target data', () => {
    const controlled = Array.from({ length: 100 }, () => 100 + (Math.random() - 0.5) * 0.01);
    const stats = computeResidualStats(controlled, 100);
    expect(Math.abs(stats.mean)).toBeLessThan(0.1);
  });

  test('histogram bins sum to total count', () => {
    const controlled = Array.from({ length: 50 }, (_, i) => 100 + i * 0.1);
    const stats = computeResidualStats(controlled, 100);
    const total = stats.histogram.reduce((s, b) => s + b.count, 0);
    expect(total).toBe(50);
  });

  test('Cpk is positive for centered data within spec', () => {
    const data = Array.from({ length: 100 }, (_, i) => 99.5 + i * 0.01);
    const stats = computeResidualStats(data, 100);
    expect(stats.cpk).toBeGreaterThan(0);
  });
});
