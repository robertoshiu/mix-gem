import { computeThermalEtchRate, computeSelectivity, computeRoughness } from '../thermal-model';
import { DEFAULT_PARAMS } from '../constants';

describe('thermal-model', () => {
  it('higher temperature yields higher etch rate (Arrhenius)', () => {
    const cold = computeThermalEtchRate(250, { ...DEFAULT_PARAMS, chuckTemp: 20 });
    const hot = computeThermalEtchRate(250, { ...DEFAULT_PARAMS, chuckTemp: 70 });
    expect(hot).toBeGreaterThan(cold);
  });

  it('higher temperature lowers selectivity', () => {
    const cold = computeSelectivity({ ...DEFAULT_PARAMS, chuckTemp: 20 }, 100);
    const hot = computeSelectivity({ ...DEFAULT_PARAMS, chuckTemp: 70 }, 100);
    expect(hot).toBeLessThan(cold);
  });

  it('higher ion energy increases roughness', () => {
    const low = computeRoughness(50, 40);
    const high = computeRoughness(500, 40);
    expect(high).toBeGreaterThan(low);
  });
});
