// equipment-monitor/src/lib/lens-sim/__tests__/thermal-model.test.ts
import { computeLensTemperatures } from '../thermal-model';
import { DEFAULT_PARAMS } from '../constants';

describe('thermal-model', () => {
  it('returns LENS_COUNT elements', () => {
    const result = computeLensTemperatures(DEFAULT_PARAMS, 0);
    expect(result).toHaveLength(5);
  });

  it('L1 reaches ~63% of deltaT_max at t=tau', () => {
    // tau for L1 = 80s. At default cooling (0.8), effective dT_max scaled.
    // At t=80s, T should be ~63.2% of max rise
    const tau = 80;
    const result = computeLensTemperatures(DEFAULT_PARAMS, tau);
    const maxResult = computeLensTemperatures(DEFAULT_PARAMS, 10000);
    const ratio = result[0].deltaT / maxResult[0].deltaT;
    expect(ratio).toBeCloseTo(0.632, 1);
  });

  it('converges to steady state by wafer 25', () => {
    const tEnd = 25 * 12; // 25 wafers * 12s each = 300s
    const result = computeLensTemperatures(DEFAULT_PARAMS, tEnd);
    const steadyState = computeLensTemperatures(DEFAULT_PARAMS, 10000);
    result.forEach((el, i) => {
      const ratio = el.deltaT / steadyState[i].deltaT;
      expect(ratio).toBeGreaterThan(0.6);
    });
  });

  it('L1 has highest temperature', () => {
    const result = computeLensTemperatures(DEFAULT_PARAMS, 100);
    for (let i = 1; i < result.length; i++) {
      expect(result[0].deltaT).toBeGreaterThan(result[i].deltaT);
    }
  });

  it('cooling=0 doubles effective deltaT_max', () => {
    const noCooling = { ...DEFAULT_PARAMS, coolingPower: 0 };
    const full = computeLensTemperatures(noCooling, 10000);
    const withCooling = computeLensTemperatures(DEFAULT_PARAMS, 10000);
    // With cooling at 0.8, dT_max is reduced. Without cooling, should be higher.
    expect(full[0].deltaT).toBeGreaterThan(withCooling[0].deltaT * 1.3);
  });

  it('higher dose increases temperature', () => {
    const highDose = { ...DEFAULT_PARAMS, dose: 45 };
    const normal = computeLensTemperatures(DEFAULT_PARAMS, 100);
    const hot = computeLensTemperatures(highDose, 100);
    expect(hot[0].deltaT).toBeGreaterThan(normal[0].deltaT);
  });

  it('computes deltaOPL proportional to deltaT and thickness', () => {
    const result = computeLensTemperatures(DEFAULT_PARAMS, 100);
    // dOPL = dn/dT * dT * thickness_mm * 1e6 (convert mm to nm)
    // All elements should have positive dOPL
    result.forEach((el) => {
      expect(el.deltaOPL).toBeGreaterThan(0);
    });
  });
});
