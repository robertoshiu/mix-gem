import { computeRemovalRate, computeDishing, applyCmpStep } from '../cmp-model';
import { DEFAULT_PARAMS, BARRIER_THICKNESS } from '../constants';

describe('cmp-model', () => {
  it('removal rate follows Preston equation (proportional to pressure × velocity)', () => {
    const r1 = computeRemovalRate(DEFAULT_PARAMS);
    const r2 = computeRemovalRate({ ...DEFAULT_PARAMS, padPressure: DEFAULT_PARAMS.padPressure * 2 });
    expect(r2).toBeCloseTo(r1 * 2, 1);
  });

  it('dishing increases with trench width', () => {
    const d1 = computeDishing(DEFAULT_PARAMS, 5);
    const d2 = computeDishing({ ...DEFAULT_PARAMS, trenchWidth: DEFAULT_PARAMS.trenchWidth * 3 }, 5);
    expect(d2).toBeGreaterThan(d1);
  });

  it('CMP step reduces copper thickness', () => {
    const result = applyCmpStep(150, DEFAULT_PARAMS, 0);
    expect(result.thickness).toBeLessThan(150);
  });

  it('copper does not go below barrier thickness', () => {
    const result = applyCmpStep(20, DEFAULT_PARAMS, 100);
    expect(result.thickness).toBeGreaterThanOrEqual(BARRIER_THICKNESS);
  });
});
