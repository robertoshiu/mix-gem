import { computeEtchProfile } from '../etch-profile';
import { ETCH_PROFILE_POINTS, DEFAULT_PARAMS } from '../constants';

describe('etch-profile', () => {
  const fullProfile = new Array(ETCH_PROFILE_POINTS).fill(1);

  it('anisotropic regime (gasRatio > 0.6) yields high profile angle', () => {
    const result = computeEtchProfile(fullProfile, 0.8, 1.0, 200, 250, 0.5, DEFAULT_PARAMS);
    expect(result.profileAngle).toBeGreaterThan(87);
  });

  it('isotropic regime (gasRatio < 0.3) is flagged', () => {
    const result = computeEtchProfile(fullProfile, 0.2, 5.0, 50, 200, 0.5, DEFAULT_PARAMS);
    expect(result.isIsotropic).toBe(true);
  });

  it('etch depth increases with multiple steps', () => {
    let profile = [...fullProfile];
    let prevDepth = 0;
    for (let i = 0; i < 10; i++) {
      const result = computeEtchProfile(profile, 0.7, 1.0, 200, 250, 0.5, DEFAULT_PARAMS);
      expect(result.etchDepth).toBeGreaterThanOrEqual(prevDepth);
      prevDepth = result.etchDepth;
      profile = result.profile;
    }
  });

  it('micro-loading: narrow trench etches slower', () => {
    const wide = computeEtchProfile(fullProfile, 0.7, 1.0, 200, 250, 0.5,
      { ...DEFAULT_PARAMS, trenchWidth: 400 });
    const narrow = computeEtchProfile(fullProfile, 0.7, 1.0, 200, 250, 0.5,
      { ...DEFAULT_PARAMS, trenchWidth: 50 });
    expect(narrow.etchDepth).toBeLessThanOrEqual(wide.etchDepth);
  });

  it('profile values stay in 0-1 range', () => {
    const result = computeEtchProfile(fullProfile, 0.7, 1.0, 200, 250, 0.5, DEFAULT_PARAMS);
    result.profile.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    });
  });
});
