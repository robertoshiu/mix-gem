import {
  generateFabData,
  tostEquivalence,
  computeCpk,
  fitTransferFunction,
  generateDistributionCurve,
  generateFabComparison,
} from '../replication-engine';

describe('generateFabData', () => {
  test('returns requested sample size', () => {
    const data = generateFabData('hq', 'cd', 50, 0, 1, 42);
    expect(data).toHaveLength(50);
  });

  test('is deterministic with same seed', () => {
    const a = generateFabData('hq', 'cd', 30, 0, 1, 99);
    const b = generateFabData('hq', 'cd', 30, 0, 1, 99);
    expect(a).toEqual(b);
  });

  test('biased data has mean shifted from target', () => {
    const data = generateFabData('new-build', 'cd', 200, 0.05, 1, 42);
    const mean = data.reduce((s, v) => s + v, 0) / data.length;
    expect(mean).toBeGreaterThan(45);
  });
});

describe('tostEquivalence', () => {
  test('identical samples pass equivalence', () => {
    const sample = Array.from({ length: 50 }, () => 100);
    const result = tostEquivalence(sample, sample, 2, 0.95);
    expect(result.pass).toBe(true);
  });

  test('highly biased samples fail equivalence', () => {
    const s1 = Array.from({ length: 50 }, () => 100);
    const s2 = Array.from({ length: 50 }, () => 110);
    const result = tostEquivalence(s1, s2, 2, 0.95);
    expect(result.pass).toBe(false);
  });

  test('mean difference is close to actual difference', () => {
    const s1 = Array.from({ length: 100 }, () => 100);
    const s2 = Array.from({ length: 100 }, () => 101);
    const result = tostEquivalence(s1, s2, 5, 0.95);
    expect(result.meanDiff).toBeCloseTo(1, 1);
  });
});

describe('computeCpk', () => {
  test('centered process with tight spread gives high Cpk', () => {
    const data = Array.from({ length: 100 }, (_, i) => 99.5 + i * 0.01);
    expect(computeCpk(data, 110, 90)).toBeGreaterThan(1.33);
  });

  test('off-center process gives lower Cpk', () => {
    const centered = Array.from({ length: 100 }, (_, i) => 99.5 + i * 0.01);
    const offCenter = Array.from({ length: 100 }, (_, i) => 104.5 + i * 0.01);
    expect(computeCpk(offCenter, 110, 90)).toBeLessThan(computeCpk(centered, 110, 90));
  });
});

describe('fitTransferFunction', () => {
  test('linear fit on linear data gives R² ≈ 1', () => {
    const x = Array.from({ length: 50 }, (_, i) => i);
    const y = x.map((v) => 2 * v + 5);
    const fit = fitTransferFunction(x, y, 1);
    expect(fit.rSquared).toBeGreaterThan(0.99);
    expect(fit.coefficients).toHaveLength(2);
  });

  test('quadratic fit returns 3 coefficients', () => {
    const x = Array.from({ length: 50 }, (_, i) => i);
    const y = x.map((v) => 0.1 * v * v + 2 * v + 5);
    const fit = fitTransferFunction(x, y, 2);
    expect(fit.coefficients).toHaveLength(3);
    expect(fit.rSquared).toBeGreaterThan(0.99);
  });

  test('bias is difference at mean x', () => {
    const x = Array.from({ length: 50 }, (_, i) => 40 + i * 0.4);
    const y = x.map((v) => v + 3);
    const fit = fitTransferFunction(x, y, 1);
    expect(fit.bias).toBeCloseTo(3, 0);
  });
});

describe('generateDistributionCurve', () => {
  test('returns requested number of points', () => {
    const curve = generateDistributionCurve(100, 5, 100);
    expect(curve).toHaveLength(100);
  });

  test('peak is near the mean', () => {
    const curve = generateDistributionCurve(50, 2, 200);
    const peak = curve.reduce((max, p) => (p.pdf > max.pdf ? p : max), curve[0]);
    expect(peak.x).toBeCloseTo(50, 0);
  });
});

describe('generateFabComparison', () => {
  test('returns data for all 3 fabs', () => {
    const result = generateFabComparison('cd', { sampleSize: 30, confidence: 0.95, margin: 2 });
    expect(result.fabData.size).toBe(3);
  });

  test('returns 3 TOST results (3 pairs)', () => {
    const result = generateFabComparison('cd', { sampleSize: 30, confidence: 0.95, margin: 2 });
    expect(result.tostResults).toHaveLength(3);
  });
});
