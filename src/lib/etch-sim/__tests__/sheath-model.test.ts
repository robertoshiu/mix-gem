import { computeSheathState } from '../sheath-model';
import { DEFAULT_PARAMS } from '../constants';

describe('sheath-model', () => {
  it('sheath potential scales with bias power', () => {
    const low = computeSheathState({ ...DEFAULT_PARAMS, biasPower: 50 });
    const high = computeSheathState({ ...DEFAULT_PARAMS, biasPower: 300 });
    expect(high.sheathPotential).toBeGreaterThan(low.sheathPotential);
  });

  it('ion energy is positive and in reasonable eV range', () => {
    const state = computeSheathState(DEFAULT_PARAMS);
    expect(state.ionEnergy).toBeGreaterThan(10);
    expect(state.ionEnergy).toBeLessThan(5000);
  });

  it('ion angle decreases with higher bias (narrower spread)', () => {
    const lowBias = computeSheathState({ ...DEFAULT_PARAMS, biasPower: 50 });
    const highBias = computeSheathState({ ...DEFAULT_PARAMS, biasPower: 400 });
    expect(highBias.ionAngle).toBeLessThan(lowBias.ionAngle);
  });

  it('low bias yields low ion energy', () => {
    const state = computeSheathState({ ...DEFAULT_PARAMS, biasPower: 10 });
    expect(state.ionEnergy).toBeLessThan(100);
  });
});
