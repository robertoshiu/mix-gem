import {
  computeStepYield,
  computeLineYield,
  generateYieldWaterfall,
  generateYieldCurve,
  generateForecastLots,
} from '../yield-engine';

describe('computeStepYield', () => {
  test('returns 1 when D0 is 0', () => {
    expect(computeStepYield(0, 100, 2)).toBe(1);
  });

  test('returns 1 when die area is 0', () => {
    expect(computeStepYield(0.5, 0, 2)).toBe(1);
  });

  test('matches hand-calc for known values', () => {
    const y = computeStepYield(0.5, 100, 2);
    expect(y).toBeCloseTo(1 / (26 * 26), 5);
  });

  test('higher D0 gives lower yield', () => {
    const yLow = computeStepYield(0.1, 100, 2);
    const yHigh = computeStepYield(0.5, 100, 2);
    expect(yLow).toBeGreaterThan(yHigh);
  });

  test('lower alpha (more clustering) gives higher yield', () => {
    const yCluster = computeStepYield(0.3, 100, 1);
    const yRandom = computeStepYield(0.3, 100, 10);
    expect(yCluster).toBeGreaterThan(yRandom);
  });
});

describe('computeLineYield', () => {
  test('returns product of all step yields', () => {
    const steps = [
      { stepId: 'oxidation' as const, d0: 0.1 },
      { stepId: 'lithography' as const, d0: 0.2 },
    ];
    const result = computeLineYield(steps, 100, 2);
    const y1 = computeStepYield(0.1, 100, 2);
    const y2 = computeStepYield(0.2, 100, 2);
    expect(result.lineYield).toBeCloseTo(y1 * y2, 6);
    expect(result.perStep).toHaveLength(2);
  });

  test('identifies worst step correctly', () => {
    const steps = [
      { stepId: 'oxidation' as const, d0: 0.05 },
      { stepId: 'implant' as const, d0: 0.9 },
      { stepId: 'cmp' as const, d0: 0.1 },
    ];
    const result = computeLineYield(steps, 100, 2);
    expect(result.worstStep).toBe('implant');
  });

  test('empty steps gives lineYield = 1', () => {
    const result = computeLineYield([], 100, 2);
    expect(result.lineYield).toBe(1);
  });
});

describe('generateYieldWaterfall', () => {
  test('starts near 1 and decreases monotonically', () => {
    const steps = [
      { stepId: 'oxidation' as const, d0: 0.1 },
      { stepId: 'lithography' as const, d0: 0.2 },
      { stepId: 'etching' as const, d0: 0.15 },
    ];
    const waterfall = generateYieldWaterfall(steps, 100, 2);
    expect(waterfall).toHaveLength(3);
    for (let i = 1; i < waterfall.length; i++) {
      expect(waterfall[i].cumulative).toBeLessThanOrEqual(waterfall[i - 1].cumulative);
    }
  });

  test('last entry matches lineYield', () => {
    const steps = [
      { stepId: 'oxidation' as const, d0: 0.12 },
      { stepId: 'cmp' as const, d0: 0.14 },
    ];
    const waterfall = generateYieldWaterfall(steps, 100, 2);
    const { lineYield } = computeLineYield(steps, 100, 2);
    expect(waterfall[waterfall.length - 1].cumulative).toBeCloseTo(lineYield, 6);
  });
});

describe('generateYieldCurve', () => {
  test('returns requested number of points', () => {
    const curve = generateYieldCurve(100, 2, 0, 1, 50);
    expect(curve).toHaveLength(50);
  });

  test('yield decreases as D0 increases', () => {
    const curve = generateYieldCurve(100, 2, 0, 1, 10);
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].yield).toBeLessThanOrEqual(curve[i - 1].yield + 1e-9);
    }
  });
});

describe('generateForecastLots', () => {
  test('returns requested number of lots', () => {
    const steps = [
      { stepId: 'oxidation' as const, d0: 0.12 },
      { stepId: 'lithography' as const, d0: 0.25 },
    ];
    const lots = generateForecastLots(steps, 100, 2, 20, 42);
    expect(lots).toHaveLength(20);
  });

  test('is deterministic with same seed', () => {
    const steps = [{ stepId: 'oxidation' as const, d0: 0.12 }];
    const a = generateForecastLots(steps, 100, 2, 10, 99);
    const b = generateForecastLots(steps, 100, 2, 10, 99);
    expect(a).toEqual(b);
  });

  test('different seeds give different results', () => {
    const steps = [{ stepId: 'oxidation' as const, d0: 0.12 }];
    const a = generateForecastLots(steps, 100, 2, 10, 1);
    const b = generateForecastLots(steps, 100, 2, 10, 2);
    const same = a.every((v, i) => v === b[i]);
    expect(same).toBe(false);
  });
});
