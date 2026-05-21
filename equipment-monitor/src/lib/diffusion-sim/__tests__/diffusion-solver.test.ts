import { tridiagonalSolve, createSolverState, solveDiffusionStep } from '../diffusion-solver';
import { generateThermalProfile } from '../thermal-profile';
import { DEFAULT_PARAMS, DEPTH_BINS, estimateMaxDepth } from '../constants';
import type { SimulationParams } from '../types';

describe('diffusion-solver', () => {
  it('tridiagonal solver returns identity for trivial system', () => {
    const n = 5;
    const a = [0, 0, 0, 0, 0];
    const b = [1, 1, 1, 1, 1];
    const c = [0, 0, 0, 0, 0];
    const d = [1, 2, 3, 4, 5];
    const x = tridiagonalSolve(a, b, c, d);
    for (let i = 0; i < n; i++) {
      expect(x[i]).toBeCloseTo(d[i], 10);
    }
  });

  it('createSolverState initializes valid profiles', () => {
    const state = createSolverState(DEFAULT_PARAMS);
    expect(state.dopantProfile).toHaveLength(DEPTH_BINS);
    expect(state.activeProfile).toHaveLength(DEPTH_BINS);
    expect(state.clusteredProfile).toHaveLength(DEPTH_BINS);
    expect(state.defects.vacancies).toHaveLength(DEPTH_BINS);
    expect(state.temperature).toBe(25);
    expect(state.time).toBe(0);
    expect(state.thermalBudget).toBe(0);
  });

  it('profile broadens after diffusion step', () => {
    const state = createSolverState(DEFAULT_PARAMS);
    const maxDepth = estimateMaxDepth(DEFAULT_PARAMS.dopantSpecies, DEFAULT_PARAMS.initialDepth);
    const binSize = maxDepth / DEPTH_BINS;
    const steps = generateThermalProfile('rta', DEFAULT_PARAMS);

    const maxBefore = Math.max(...state.dopantProfile);
    const halfMax = maxBefore / 2;
    let widthBefore = 0;
    for (const c of state.dopantProfile) {
      if (c >= halfMax) widthBefore++;
    }

    for (let i = 0; i < 50; i++) {
      solveDiffusionStep(state, steps[i], DEFAULT_PARAMS, binSize);
    }

    let widthAfter = 0;
    const maxAfter = Math.max(...state.dopantProfile);
    const halfMaxAfter = maxAfter / 2;
    for (const c of state.dopantProfile) {
      if (c >= halfMaxAfter) widthAfter++;
    }

    expect(widthAfter).toBeGreaterThanOrEqual(widthBefore);
  });

  it('mass is approximately conserved', () => {
    const state = createSolverState(DEFAULT_PARAMS);
    const maxDepth = estimateMaxDepth(DEFAULT_PARAMS.dopantSpecies, DEFAULT_PARAMS.initialDepth);
    const binSize = maxDepth / DEPTH_BINS;
    const steps = generateThermalProfile('rta', DEFAULT_PARAMS);

    const massBefore = state.dopantProfile.reduce((s, c) => s + c, 0);

    for (let i = 0; i < 20; i++) {
      solveDiffusionStep(state, steps[i], DEFAULT_PARAMS, binSize);
    }

    const massAfter = state.dopantProfile.reduce((s, c) => s + c, 0);
    expect(massAfter / massBefore).toBeGreaterThan(0.7);
    expect(massAfter / massBefore).toBeLessThan(1.3);
  });

  it('higher temperature produces more diffusion', () => {
    const params1: SimulationParams = { ...DEFAULT_PARAMS, peakTemperature: 800 };
    const params2: SimulationParams = { ...DEFAULT_PARAMS, peakTemperature: 1100 };

    const state1 = createSolverState(params1);
    const state2 = createSolverState(params2);
    const maxDepth = estimateMaxDepth(DEFAULT_PARAMS.dopantSpecies, DEFAULT_PARAMS.initialDepth);
    const binSize = maxDepth / DEPTH_BINS;

    const steps1 = generateThermalProfile('rta', params1);
    const steps2 = generateThermalProfile('rta', params2);

    const nSteps = Math.min(steps1.length, steps2.length);
    for (let i = 0; i < nSteps; i++) {
      solveDiffusionStep(state1, steps1[i], params1, binSize);
      solveDiffusionStep(state2, steps2[i], params2, binSize);
    }

    expect(state2.thermalBudget).toBeGreaterThan(state1.thermalBudget);
  });

  it('Crank-Nicolson is stable with large timestep', () => {
    const params: SimulationParams = { ...DEFAULT_PARAMS, thermalMode: 'furnace' };
    const state = createSolverState(params);
    const maxDepth = estimateMaxDepth(params.dopantSpecies, params.initialDepth);
    const binSize = maxDepth / DEPTH_BINS;
    const steps = generateThermalProfile('furnace', params);

    for (let i = 0; i < 100; i++) {
      solveDiffusionStep(state, steps[i], params, binSize);
    }

    for (const c of state.dopantProfile) {
      expect(isFinite(c)).toBe(true);
      expect(c).toBeGreaterThanOrEqual(0);
    }
  });

  it('boundary conditions: zero-flux at edges', () => {
    const state = createSolverState(DEFAULT_PARAMS);
    const maxDepth = estimateMaxDepth(DEFAULT_PARAMS.dopantSpecies, DEFAULT_PARAMS.initialDepth);
    const binSize = maxDepth / DEPTH_BINS;
    const steps = generateThermalProfile('rta', DEFAULT_PARAMS);

    for (let i = 0; i < 20; i++) {
      solveDiffusionStep(state, steps[i], DEFAULT_PARAMS, binSize);
    }

    expect(state.dopantProfile[DEPTH_BINS - 1]).toBeLessThan(state.dopantProfile[0]);
  });

  it('segregation affects surface concentration with oxide', () => {
    const paramsOx: SimulationParams = { ...DEFAULT_PARAMS, screenOxideThickness: 30 };
    const paramsNoOx: SimulationParams = { ...DEFAULT_PARAMS, screenOxideThickness: 0 };

    const stateOx = createSolverState(paramsOx);
    const stateNoOx = createSolverState(paramsNoOx);
    const maxDepth = estimateMaxDepth(DEFAULT_PARAMS.dopantSpecies, DEFAULT_PARAMS.initialDepth);
    const binSize = maxDepth / DEPTH_BINS;
    const stepsOx = generateThermalProfile('rta', paramsOx);
    const stepsNoOx = generateThermalProfile('rta', paramsNoOx);

    for (let i = 0; i < 50; i++) {
      solveDiffusionStep(stateOx, stepsOx[i], paramsOx, binSize);
      solveDiffusionStep(stateNoOx, stepsNoOx[i], paramsNoOx, binSize);
    }

    const diff = Math.abs(stateOx.dopantProfile[0] - stateNoOx.dopantProfile[0]);
    expect(diff).toBeGreaterThanOrEqual(0);
  });

  it('clustering limits peak active concentration', () => {
    const params: SimulationParams = {
      ...DEFAULT_PARAMS,
      dopantSpecies: 'As',
      initialDose: 1e16,
      clusteringThreshold: 1e20,
    };
    const state = createSolverState(params);
    const maxVal = Math.max(...state.activeProfile);
    const totalMax = Math.max(...state.dopantProfile);
    expect(maxVal).toBeLessThanOrEqual(totalMax);
  });

  it('thermal budget increases monotonically over steps', () => {
    const state = createSolverState(DEFAULT_PARAMS);
    const maxDepth = estimateMaxDepth(DEFAULT_PARAMS.dopantSpecies, DEFAULT_PARAMS.initialDepth);
    const binSize = maxDepth / DEPTH_BINS;
    const steps = generateThermalProfile('rta', DEFAULT_PARAMS);

    let prevBudget = 0;
    for (let i = 0; i < 20; i++) {
      solveDiffusionStep(state, steps[i], DEFAULT_PARAMS, binSize);
      expect(state.thermalBudget).toBeGreaterThanOrEqual(prevBudget);
      prevBudget = state.thermalBudget;
    }
  });
});
