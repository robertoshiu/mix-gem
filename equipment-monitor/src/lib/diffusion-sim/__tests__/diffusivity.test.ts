import { describe, it, expect } from 'vitest';
import {
  intrinsicCarrier, carrierConcentrations, effectiveDiffusivity,
  solidSolubility, activeFraction, activeConcentration,
} from '../diffusivity';

describe('diffusivity', () => {
  it('intrinsic carrier increases with temperature', () => {
    const ni800 = intrinsicCarrier(800);
    const ni1000 = intrinsicCarrier(1000);
    expect(ni1000).toBeGreaterThan(ni800);
    expect(ni800).toBeGreaterThan(1e10);
  });

  it('carrier concentrations satisfy charge neutrality', () => {
    const ni = intrinsicCarrier(1000);
    const { n, p } = carrierConcentrations(1e18, ni);
    expect(n * p).toBeCloseTo(ni * ni, -ni * ni * 0.01);
    expect(n).toBeGreaterThan(p);
  });

  it('B diffuses primarily via interstitials (fI=1)', () => {
    const ni = intrinsicCarrier(1000);
    const { n, p } = carrierConcentrations(0, ni);
    const dB = effectiveDiffusivity('B', 1000, ni, n, p, 1, 1);
    const dB_noI = effectiveDiffusivity('B', 1000, ni, n, p, 0, 1);
    expect(dB).toBeGreaterThan(dB_noI);
    expect(dB).toBeGreaterThan(0);
  });

  it('Sb diffuses only via vacancies (fV=1)', () => {
    const ni = intrinsicCarrier(1000);
    const { n, p } = carrierConcentrations(0, ni);
    const dSb = effectiveDiffusivity('Sb', 1000, ni, n, p, 1, 1);
    const dSb_noV = effectiveDiffusivity('Sb', 1000, ni, n, p, 1, 0);
    expect(dSb).toBeGreaterThan(dSb_noV);
    expect(dSb_noV).toBeCloseTo(0, 15);
  });

  it('P uses dual mechanism (both I and V)', () => {
    const ni = intrinsicCarrier(1000);
    const { n, p } = carrierConcentrations(1e18, ni);
    const dP_full = effectiveDiffusivity('P', 1000, ni, n, p, 1, 1);
    const dP_Ionly = effectiveDiffusivity('P', 1000, ni, n, p, 1, 0);
    const dP_Vonly = effectiveDiffusivity('P', 1000, ni, n, p, 0, 1);
    expect(dP_full).toBeGreaterThan(dP_Ionly);
    expect(dP_full).toBeGreaterThan(dP_Vonly);
  });

  it('supersaturation multiplies diffusivity', () => {
    const ni = intrinsicCarrier(1000);
    const { n, p } = carrierConcentrations(0, ni);
    const d1 = effectiveDiffusivity('B', 1000, ni, n, p, 1, 1);
    const d5 = effectiveDiffusivity('B', 1000, ni, n, p, 5, 1);
    expect(d5).toBeCloseTo(d1 * 5, -1);
  });

  it('solid solubility increases with temperature', () => {
    const sol900 = solidSolubility('B', 900);
    const sol1100 = solidSolubility('B', 1100);
    expect(sol1100).toBeGreaterThan(sol900);
    expect(sol900).toBeGreaterThan(1e18);
  });

  it('activeFraction is < 1 above solid solubility', () => {
    const frac = activeFraction(1e21, 'As', 1000);
    expect(frac).toBeLessThan(1);
    expect(frac).toBeGreaterThan(0);
  });

  it('Ge has very low diffusivity due to high activation energies', () => {
    const ni = intrinsicCarrier(1000);
    const { n, p } = carrierConcentrations(0, ni);
    const dGe = effectiveDiffusivity('Ge', 1000, ni, n, p, 1, 1);
    const dB = effectiveDiffusivity('B', 1000, ni, n, p, 1, 1);
    expect(dGe).toBeLessThan(dB);
  });
});
