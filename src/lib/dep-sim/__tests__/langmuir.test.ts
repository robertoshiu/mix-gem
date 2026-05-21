import { computeCoverage, computeHalfCycleCoverages } from '../langmuir';
import { DEFAULT_PARAMS } from '../constants';

describe('langmuir', () => {
  it('coverage is 0 when exposure dose is 0', () => {
    expect(computeCoverage(12.0, 0, 0)).toBe(0);
  });

  it('coverage approaches 1.0 at high exposure dose', () => {
    const theta = computeCoverage(12.0, 100, 100);
    expect(theta).toBeGreaterThan(0.99);
    expect(theta).toBeLessThanOrEqual(1.0);
  });

  it('coverage increases monotonically with pulse time', () => {
    const K = 12.0;
    const P = 1.0;
    let prev = 0;
    for (let t = 0.1; t <= 5.0; t += 0.5) {
      const theta = computeCoverage(K, P, t);
      expect(theta).toBeGreaterThan(prev);
      prev = theta;
    }
  });

  it('self-limiting: doubling pulse time past saturation barely changes coverage', () => {
    const K = 12.0;
    const P = 1.0;
    const theta5 = computeCoverage(K, P, 5.0);
    const theta10 = computeCoverage(K, P, 10.0);
    expect(Math.abs(theta10 - theta5)).toBeLessThan(0.02);
  });

  it('computeHalfCycleCoverages returns coverageA and coverageB', () => {
    const result = computeHalfCycleCoverages(DEFAULT_PARAMS);
    expect(result.coverageA).toBeGreaterThan(0);
    expect(result.coverageA).toBeLessThanOrEqual(1.0);
    expect(result.coverageB).toBeGreaterThan(0);
    expect(result.coverageB).toBeLessThanOrEqual(1.0);
  });
});
