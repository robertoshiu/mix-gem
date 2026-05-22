import { createSimulation, stepForward, stepN, applyPreset } from '../simulation-engine';
import { DEFAULT_PARAMS, DEFAULT_TOTAL_STEPS } from '../constants';
import type { SimulationParams } from '../types';

describe('simulation-engine', () => {
  it('createSimulation returns valid initial state', () => {
    const sim = createSimulation();
    expect(sim.params).toEqual(DEFAULT_PARAMS);
    expect(sim.steps).toHaveLength(0);
    expect(sim.currentIndex).toBe(-1);
    expect(sim.totalSteps).toBe(DEFAULT_TOTAL_STEPS);
    expect(sim.thermalProfile).toHaveLength(DEFAULT_TOTAL_STEPS);
    expect(sim.mesh.nodes.length).toBeGreaterThan(0);
  });

  it('stepForward advances index by 1', () => {
    const sim = createSimulation();
    const next = stepForward(sim);
    expect(next.currentIndex).toBe(0);
    expect(next.steps).toHaveLength(1);
  });

  it('oxide grows monotonically over steps', () => {
    let sim = createSimulation();
    sim = stepN(sim, 50);
    const thicknesses = sim.steps.map(s => s.oxideThicknessCenter);
    for (let i = 1; i < thicknesses.length; i++) {
      expect(thicknesses[i]).toBeGreaterThanOrEqual(thicknesses[i - 1]);
    }
  });

  it('thermal budget accumulates', () => {
    let sim = createSimulation();
    sim = stepN(sim, 30);
    const budgets = sim.steps.map(s => s.thermalBudget);
    for (let i = 1; i < budgets.length; i++) {
      expect(budgets[i]).toBeGreaterThanOrEqual(budgets[i - 1]);
    }
  });

  it('thermal phases follow ramp-soak-cool', () => {
    let sim = createSimulation();
    sim = stepN(sim, 200);
    const phases = sim.steps.map(s => s.thermalPhase);
    expect(phases[0]).toBe('ramp');
    expect(phases).toContain('soak');
    expect(phases[phases.length - 1]).toBe('cool');
  });

  it('totalSteps caps simulation', () => {
    const params: SimulationParams = { ...DEFAULT_PARAMS, totalSteps: 10 };
    let sim = createSimulation(params);
    sim = stepN(sim, 20);
    expect(sim.currentIndex).toBe(9);
    expect(sim.steps).toHaveLength(10);
  });

  it('applyPreset resets state', () => {
    let sim = createSimulation();
    sim = stepN(sim, 5);
    const preset = applyPreset(sim, 'locos-isolation');
    expect(preset.currentIndex).toBe(-1);
    expect(preset.steps).toHaveLength(0);
    expect(preset.params.geometryType).toBe('locos');
  });

  it('step state has finite field data', () => {
    const sim = stepForward(createSimulation());
    const step = sim.steps[0];
    expect(step.nodeTemperatures.length).toBeGreaterThan(0);
    expect(step.nodeStresses.length).toBeGreaterThan(0);
    for (const v of step.nodeTemperatures) expect(isFinite(v)).toBe(true);
    for (const v of step.nodeStresses) expect(isFinite(v)).toBe(true);
  });

  it('200 steps complete without error', () => {
    let sim = createSimulation();
    sim = stepN(sim, 200);
    expect(sim.steps).toHaveLength(200);
    const last = sim.steps[199];
    expect(isFinite(last.oxideThicknessCenter)).toBe(true);
    expect(isFinite(last.peakStress)).toBe(true);
    expect(isFinite(last.thermalBudget)).toBe(true);
  });

  it('wet oxide grows faster than dry', () => {
    const dry = stepN(createSimulation({ ...DEFAULT_PARAMS, oxidationType: 'dry' }), 100);
    const wet = stepN(createSimulation({ ...DEFAULT_PARAMS, oxidationType: 'wet' }), 100);
    const dryFinal = dry.steps[dry.steps.length - 1].oxideThicknessCenter;
    const wetFinal = wet.steps[wet.steps.length - 1].oxideThicknessCenter;
    expect(wetFinal).toBeGreaterThan(dryFinal);
  });
});
