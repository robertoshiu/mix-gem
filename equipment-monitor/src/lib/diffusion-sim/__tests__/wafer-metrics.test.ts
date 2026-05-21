import { mobilityMasetti, sheetResistance, computeMetrics } from '../wafer-metrics';
import { createSolverState, solveDiffusionStep } from '../diffusion-solver';
import { generateThermalProfile } from '../thermal-profile';
import { DEFAULT_PARAMS, DEPTH_BINS, estimateMaxDepth } from '../constants';

describe('wafer-metrics', () => {
  it('Masetti mobility decreases with concentration', () => {
    const mu_low = mobilityMasetti(1e15, true);
    const mu_high = mobilityMasetti(1e20, true);
    expect(mu_low).toBeGreaterThan(mu_high);
    expect(mu_high).toBeGreaterThan(0);
  });

  it('sheet resistance is positive and physically reasonable', () => {
    const state = createSolverState(DEFAULT_PARAMS);
    const maxDepth = estimateMaxDepth(DEFAULT_PARAMS.dopantSpecies, DEFAULT_PARAMS.initialDepth);
    const binSize = maxDepth / DEPTH_BINS;
    const Rs = sheetResistance(state.activeProfile, DEFAULT_PARAMS.dopantSpecies, binSize);
    expect(Rs).toBeGreaterThan(0);
    expect(Rs).toBeLessThan(1e10);
  });

  it('junction depth is positive after diffusion', () => {
    const state = createSolverState(DEFAULT_PARAMS);
    const maxDepth = estimateMaxDepth(DEFAULT_PARAMS.dopantSpecies, DEFAULT_PARAMS.initialDepth);
    const binSize = maxDepth / DEPTH_BINS;
    const steps = generateThermalProfile('rta', DEFAULT_PARAMS);
    for (let i = 0; i < 30; i++) {
      solveDiffusionStep(state, steps[i], DEFAULT_PARAMS, binSize);
    }
    const metrics = computeMetrics(state, DEFAULT_PARAMS, binSize);
    expect(metrics.junctionDepth).toBeGreaterThan(0);
  });

  it('activation fraction is between 0 and 1', () => {
    const state = createSolverState(DEFAULT_PARAMS);
    const maxDepth = estimateMaxDepth(DEFAULT_PARAMS.dopantSpecies, DEFAULT_PARAMS.initialDepth);
    const binSize = maxDepth / DEPTH_BINS;
    const metrics = computeMetrics(state, DEFAULT_PARAMS, binSize);
    expect(metrics.activationFraction).toBeGreaterThanOrEqual(0);
    expect(metrics.activationFraction).toBeLessThanOrEqual(1);
  });

  it('thermal budget increases with steps', () => {
    const state = createSolverState(DEFAULT_PARAMS);
    const maxDepth = estimateMaxDepth(DEFAULT_PARAMS.dopantSpecies, DEFAULT_PARAMS.initialDepth);
    const binSize = maxDepth / DEPTH_BINS;
    const steps = generateThermalProfile('rta', DEFAULT_PARAMS);

    const m0 = computeMetrics(state, DEFAULT_PARAMS, binSize);
    for (let i = 0; i < 20; i++) {
      solveDiffusionStep(state, steps[i], DEFAULT_PARAMS, binSize);
    }
    const m1 = computeMetrics(state, DEFAULT_PARAMS, binSize);
    expect(m1.thermalBudget).toBeGreaterThan(m0.thermalBudget);
  });

  it('diffusion length equals sqrt(Dt) converted to nm', () => {
    const state = createSolverState(DEFAULT_PARAMS);
    const maxDepth = estimateMaxDepth(DEFAULT_PARAMS.dopantSpecies, DEFAULT_PARAMS.initialDepth);
    const binSize = maxDepth / DEPTH_BINS;
    const steps = generateThermalProfile('rta', DEFAULT_PARAMS);
    for (let i = 0; i < 20; i++) {
      solveDiffusionStep(state, steps[i], DEFAULT_PARAMS, binSize);
    }
    const metrics = computeMetrics(state, DEFAULT_PARAMS, binSize);
    const expected = Math.sqrt(state.thermalBudget) * 1e7;
    expect(metrics.diffusionLength).toBeCloseTo(expected, 0);
  });

  it('profile abruptness is positive', () => {
    const state = createSolverState(DEFAULT_PARAMS);
    const maxDepth = estimateMaxDepth(DEFAULT_PARAMS.dopantSpecies, DEFAULT_PARAMS.initialDepth);
    const binSize = maxDepth / DEPTH_BINS;
    const steps = generateThermalProfile('rta', DEFAULT_PARAMS);
    for (let i = 0; i < 30; i++) {
      solveDiffusionStep(state, steps[i], DEFAULT_PARAMS, binSize);
    }
    const metrics = computeMetrics(state, DEFAULT_PARAMS, binSize);
    expect(metrics.profileAbruptness).toBeGreaterThan(0);
  });

  it('segregation ratio is >= 0', () => {
    const state = createSolverState(DEFAULT_PARAMS);
    const maxDepth = estimateMaxDepth(DEFAULT_PARAMS.dopantSpecies, DEFAULT_PARAMS.initialDepth);
    const binSize = maxDepth / DEPTH_BINS;
    const metrics = computeMetrics(state, DEFAULT_PARAMS, binSize);
    expect(metrics.segregationRatio).toBeGreaterThanOrEqual(0);
  });
});
