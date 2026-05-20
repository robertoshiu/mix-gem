import { computeWagnerNumber, computeRadialCurrentDensity, computeCurrentDensityMap } from '../current-density';
import { DEFAULT_PARAMS } from '../constants';

describe('current-density', () => {
  it('Wagner number is positive at default conditions', () => {
    const wa = computeWagnerNumber();
    expect(wa).toBeGreaterThan(0);
  });

  it('edge current density exceeds center', () => {
    const jEdge = computeRadialCurrentDensity(DEFAULT_PARAMS, 1.0);
    const jCenter = computeRadialCurrentDensity(DEFAULT_PARAMS, 0.0);
    expect(jEdge).toBeGreaterThan(jCenter);
  });

  it('thinner seed increases terminal effect', () => {
    const jEdgeThick = computeRadialCurrentDensity(DEFAULT_PARAMS, 1.0);
    const thinSeed = { ...DEFAULT_PARAMS, seedThickness: 20 };
    const jEdgeThin = computeRadialCurrentDensity(thinSeed, 1.0);
    expect(jEdgeThin / computeRadialCurrentDensity(thinSeed, 0.0))
      .toBeGreaterThan(jEdgeThick / computeRadialCurrentDensity(DEFAULT_PARAMS, 0.0));
  });

  it('current density map has correct length for active dies', () => {
    const map = computeCurrentDensityMap(DEFAULT_PARAMS);
    expect(map).toHaveLength(81);
    expect(map[0]).toBe(0);
  });
});
