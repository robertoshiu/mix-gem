import { computeResidenceTime, computeO3Fraction, computePurgeEfficiency, computeFlowState } from '../reactor-flow';
import { DEFAULT_PARAMS } from '../constants';

describe('reactor-flow', () => {
  it('residence time = chamber volume / total flow', () => {
    const tau = computeResidenceTime(480);
    expect(tau).toBeCloseTo(2.5 / (480 / 60), 3);
  });

  it('O3 effective fraction decreases with higher temperature', () => {
    const frac150 = computeO3Fraction(150, 0.3);
    const frac350 = computeO3Fraction(350, 0.3);
    expect(frac350).toBeLessThan(frac150);
  });

  it('O3 effective fraction is between 0 and 1', () => {
    const frac = computeO3Fraction(200, 0.3);
    expect(frac).toBeGreaterThan(0);
    expect(frac).toBeLessThanOrEqual(1.0);
  });

  it('purge efficiency approaches 1.0 with long purge time', () => {
    const eff = computePurgeEfficiency(20.0, 0.3);
    expect(eff).toBeGreaterThan(0.99);
  });

  it('purge efficiency is low with very short purge time', () => {
    const eff = computePurgeEfficiency(0.05, 0.3);
    expect(eff).toBeLessThan(0.5);
  });

  it('computeFlowState returns all fields', () => {
    const state = computeFlowState(DEFAULT_PARAMS);
    expect(state.residenceTime).toBeGreaterThan(0);
    expect(state.effectiveO3Fraction).toBeGreaterThan(0);
    expect(state.effectiveO3Fraction).toBeLessThanOrEqual(1);
    expect(state.purgeEfficiency).toBeGreaterThan(0);
    expect(state.residualFraction).toBeGreaterThanOrEqual(0);
    expect(state.residualFraction).toBeLessThan(1);
  });
});
