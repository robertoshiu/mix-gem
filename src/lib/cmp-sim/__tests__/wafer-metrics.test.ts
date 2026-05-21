import { computeStepMetrics } from '../wafer-metrics';
import { DEFAULT_PARAMS, ACTIVE_DIE_COUNT, DIE_MASK, DIE_GRID_COLS, DIE_GRID_ROWS } from '../constants';

describe('wafer-metrics', () => {
  it('returns all 6 maps with correct die count', () => {
    const m = computeStepMetrics(DEFAULT_PARAMS, 80, 'bulk-cu', 0, 1000, 25);
    const totalDies = DIE_GRID_COLS * DIE_GRID_ROWS;
    expect(m.removalRateMap).toHaveLength(totalDies);
    expect(m.wiwnuMap).toHaveLength(totalDies);
    expect(m.dishingMap).toHaveLength(totalDies);
    expect(m.erosionMap).toHaveLength(totalDies);
    expect(m.roughnessMap).toHaveLength(totalDies);
    expect(m.thicknessMap).toHaveLength(totalDies);
    expect(m.dieCount).toBe(ACTIVE_DIE_COUNT);
  });

  it('WIWNU is computed as sigma/mu * 100 and below 10% at nominal', () => {
    const m = computeStepMetrics(DEFAULT_PARAMS, 80, 'bulk-cu', 0, 1000, 25);
    const activeRates = m.removalRateMap.filter((_, i) => DIE_MASK[i]);
    const mean = activeRates.reduce((s, v) => s + v, 0) / activeRates.length;
    const variance = activeRates.reduce((s, v) => s + (v - mean) ** 2, 0) / activeRates.length;
    const expectedWiwnu = mean > 0 ? (Math.sqrt(variance) / mean) * 100 : 0;
    expect(m.wiwnu).toBeCloseTo(expectedWiwnu, 1);
    expect(m.wiwnu).toBeLessThan(10);
  });

  it('dishing only accumulates during bulk-cu phase', () => {
    const cuPhase = computeStepMetrics(DEFAULT_PARAMS, 80, 'bulk-cu', 0, 500, 25);
    const buffPhase = computeStepMetrics(DEFAULT_PARAMS, 180, 'buff', 0, 0, 25);
    const cuDishing = cuPhase.dishingMap.filter((_, i) => DIE_MASK[i]);
    const buffDishing = buffPhase.dishingMap.filter((_, i) => DIE_MASK[i]);
    const cuMax = Math.max(...cuDishing);
    const buffMax = Math.max(...buffDishing);
    expect(cuMax).toBeGreaterThan(buffMax);
  });

  it('erosion accumulates in dense-pattern dies', () => {
    const m = computeStepMetrics(
      { ...DEFAULT_PARAMS, patternDensity: 80 },
      140, 'barrier', 0, 800, 25
    );
    const activeErosion = m.erosionMap.filter((_, i) => DIE_MASK[i]);
    expect(activeErosion.some((v) => v > 0)).toBe(true);
  });

  it('removal rate is in reasonable range (10-2000 nm/min)', () => {
    const m = computeStepMetrics(DEFAULT_PARAMS, 80, 'bulk-cu', 0, 1000, 25);
    expect(m.removalRate).toBeGreaterThan(10);
    expect(m.removalRate).toBeLessThan(2000);
  });
});
