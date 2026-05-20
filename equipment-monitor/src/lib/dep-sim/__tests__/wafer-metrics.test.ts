import { computeCycleMetrics } from '../wafer-metrics';
import { DEFAULT_PARAMS, DIE_MASK, IDEAL_RI } from '../constants';

describe('wafer-metrics', () => {
  it('returns correct die count for 9x9 grid', () => {
    const result = computeCycleMetrics(DEFAULT_PARAMS, 0);
    expect(result.dieCount).toBe(81);
    expect(result.dieGridCols).toBe(9);
    expect(result.dieGridRows).toBe(9);
  });

  it('thickness map has correct length', () => {
    const result = computeCycleMetrics(DEFAULT_PARAMS, 0);
    expect(result.thicknessMap).toHaveLength(81);
  });

  it('GPC is positive at default (nominal) params', () => {
    const result = computeCycleMetrics(DEFAULT_PARAMS, 0);
    // O3 thermal decomposition at 200C reduces effective O3 fraction,
    // yielding GPC well below GPC_MAX but still positive (~0.05 A/cycle)
    expect(result.gpc).toBeGreaterThan(0.01);
    expect(result.gpc).toBeLessThan(0.2);
  });

  it('roughness increases with incomplete purge', () => {
    const nominal = computeCycleMetrics(DEFAULT_PARAMS, 0);
    const badPurge = computeCycleMetrics({ ...DEFAULT_PARAMS, purgeTime: 0.1 }, 0);
    const avgNominal = nominal.roughnessMap.reduce((s, v) => s + v, 0) / nominal.roughnessMap.length;
    const avgBad = badPurge.roughnessMap.reduce((s, v) => s + v, 0) / badPurge.roughnessMap.length;
    expect(avgBad).toBeGreaterThan(avgNominal);
  });

  it('RI tracks coverage deficit for active dies, zero for inactive', () => {
    const result = computeCycleMetrics(DEFAULT_PARAMS, 0);
    result.riMap.forEach((v, i) => {
      if (DIE_MASK[i]) {
        // RI = IDEAL_RI - deficit * 0.08; at nominal O3 decomposition
        // deficit is significant, so RI is below ideal but still > 1.3
        expect(v).toBeGreaterThan(1.3);
        expect(v).toBeLessThanOrEqual(IDEAL_RI);
      } else {
        expect(v).toBe(0);
      }
    });
  });

  it('uniformity is below 5% at nominal conditions', () => {
    const result = computeCycleMetrics(DEFAULT_PARAMS, 0);
    expect(result.uniformity).toBeGreaterThan(0);
    expect(result.uniformity).toBeLessThan(5);
  });
});
