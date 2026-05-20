import { computeStepMetrics } from '../wafer-metrics';
import { DEFAULT_PARAMS, ETCH_PROFILE_POINTS, ACTIVE_DIE_COUNT, DIE_MASK } from '../constants';

describe('wafer-metrics', () => {
  const fullProfile = new Array(ETCH_PROFILE_POINTS).fill(1);

  it('returns all 4 maps with valid values for active dies', () => {
    const m = computeStepMetrics(DEFAULT_PARAMS, 80, fullProfile);
    const activeDies = DIE_MASK.reduce((s, v) => s + v, 0);
    expect(m.etchRateMap.filter((_, i) => DIE_MASK[i] && m.etchRateMap[i] > 0).length).toBe(activeDies);
    expect(m.cdBiasMap.length).toBe(81);
    expect(m.roughnessMap.filter((_, i) => DIE_MASK[i] && m.roughnessMap[i] > 0).length).toBe(activeDies);
  });

  it('etch rate is in reasonable nm/min range at nominal', () => {
    const m = computeStepMetrics(DEFAULT_PARAMS, 80, fullProfile);
    expect(m.etchRate).toBeGreaterThan(50);
    expect(m.etchRate).toBeLessThan(3000);
  });

  it('uniformity is below 5% at nominal params', () => {
    const m = computeStepMetrics(DEFAULT_PARAMS, 80, fullProfile);
    expect(m.uniformity).toBeLessThan(5);
  });

  it('dieCount equals ACTIVE_DIE_COUNT', () => {
    const m = computeStepMetrics(DEFAULT_PARAMS, 80, fullProfile);
    expect(m.dieCount).toBe(ACTIVE_DIE_COUNT);
  });

  it('profile length is ETCH_PROFILE_POINTS', () => {
    const m = computeStepMetrics(DEFAULT_PARAMS, 80, fullProfile);
    expect(m.etchProfile.length).toBe(ETCH_PROFILE_POINTS);
  });
});
