import { computeFillProfile, computeFillFraction, advanceFillProfile } from '../fill-profile';
import { DEFAULT_PARAMS, FILL_PROFILE_POINTS } from '../constants';

describe('fill-profile', () => {
  it('initial fill profile is all zeros', () => {
    const profile = computeFillProfile(0, DEFAULT_PARAMS);
    expect(profile).toHaveLength(FILL_PROFILE_POINTS);
    expect(profile.every((v) => v === 0)).toBe(true);
  });

  it('superfill regime: center fills faster than edges', () => {
    const params = { ...DEFAULT_PARAMS, additiveConc: 0.9 };
    const profile = advanceFillProfile(new Array(FILL_PROFILE_POINTS).fill(0), params, 30, 10);
    const center = profile[FILL_PROFILE_POINTS / 2];
    const edge = profile[0];
    expect(center).toBeGreaterThan(edge);
  });

  it('conformal regime: uniform fill across width', () => {
    const params = { ...DEFAULT_PARAMS, additiveConc: 0.45 };
    const profile = advanceFillProfile(new Array(FILL_PROFILE_POINTS).fill(0), params, 30, 10);
    const center = profile[FILL_PROFILE_POINTS / 2];
    const edge = profile[0];
    const ratio = center / Math.max(edge, 0.001);
    expect(ratio).toBeLessThan(2.0);
    expect(ratio).toBeGreaterThan(0.5);
  });

  it('fill fraction is monotonically increasing with current', () => {
    const prev = new Array(FILL_PROFILE_POINTS).fill(0);
    const p1 = advanceFillProfile(prev, DEFAULT_PARAMS, 20, 5);
    const p2 = advanceFillProfile(prev, DEFAULT_PARAMS, 40, 5);
    expect(computeFillFraction(p2)).toBeGreaterThan(computeFillFraction(p1));
  });

  it('low additive creates void risk (edges higher than center)', () => {
    const params = { ...DEFAULT_PARAMS, additiveConc: 0.15 };
    const profile = advanceFillProfile(new Array(FILL_PROFILE_POINTS).fill(0), params, 30, 20);
    const edge = profile[1];
    const center = profile[FILL_PROFILE_POINTS / 2];
    expect(edge).toBeGreaterThanOrEqual(center);
  });
});
