import { computePlatingRateFactor, computeAnnealFactor, computeRoughness } from '../thermal-model';
import { ANNEAL_RS_FACTOR, BATH_T_REF } from '../constants';

describe('thermal-model', () => {
  it('plating rate factor is 1.0 at reference temperature', () => {
    const factor = computePlatingRateFactor(BATH_T_REF);
    expect(factor).toBeCloseTo(1.0, 2);
  });

  it('higher bath temp increases plating rate', () => {
    const f1 = computePlatingRateFactor(25);
    const f2 = computePlatingRateFactor(40);
    expect(f2).toBeGreaterThan(f1);
  });

  it('anneal reduces resistance by expected factor', () => {
    const factor = computeAnnealFactor(0.5);
    expect(factor).toBeLessThan(1.0);
    expect(factor).toBeGreaterThan(ANNEAL_RS_FACTOR);
  });

  it('roughness increases with temperature above reference', () => {
    const r1 = computeRoughness(25);
    const r2 = computeRoughness(40);
    expect(r2).toBeGreaterThan(r1);
  });
});
