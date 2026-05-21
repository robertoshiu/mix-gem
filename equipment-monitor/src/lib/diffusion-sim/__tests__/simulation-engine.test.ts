
import { createSimulation, stepForward, stepN, applyPreset } from '../simulation-engine';
import { DEFAULT_PARAMS, DEPTH_BINS, DEFAULT_TOTAL_STEPS } from '../constants';
import type { SimulationParams } from '../types';

describe('simulation-engine', () => {
  it('createSimulation returns valid initial state', () => {
    const sim = createSimulation();
    expect(sim.params).toEqual(DEFAULT_PARAMS);
    expect(sim.steps).toHaveLength(0);
    expect(sim.currentIndex).toBe(-1);
    expect(sim.totalSteps).toBe(DEFAULT_TOTAL_STEPS);
    expect(sim.thermalProfile).toHaveLength(DEFAULT_TOTAL_STEPS);
  });

  it('stepForward advances index', () => {
    const sim = createSimulation();
    const next = stepForward(sim);
    expect(next.currentIndex).toBe(0);
    expect(next.steps).toHaveLength(1);
  });

  it('step produces profiles with DEPTH_BINS length', () => {
    const sim = stepForward(createSimulation());
    const step = sim.steps[0];
    expect(step.dopantProfile).toHaveLength(DEPTH_BINS);
    expect(step.activeProfile).toHaveLength(DEPTH_BINS);
    expect(step.clusteredProfile).toHaveLength(DEPTH_BINS);
    expect(step.interstitialProfile).toHaveLength(DEPTH_BINS);
    expect(step.vacancyProfile).toHaveLength(DEPTH_BINS);
    expect(step.carrierProfile).toHaveLength(DEPTH_BINS);
    expect(step.temperatureProfile).toHaveLength(DEPTH_BINS);
  });

  it('junction depth evolves over multiple steps', () => {
    let sim = createSimulation();
    sim = stepN(sim, 50);
    const xj = sim.steps.map(s => s.junctionDepth);
    expect(xj[xj.length - 1]).toBeGreaterThan(0);
  });

  it('thermal budget accumulates over steps', () => {
    let sim = createSimulation();
    sim = stepN(sim, 30);
    const budgets = sim.steps.map(s => s.thermalBudget);
    for (let i = 1; i < budgets.length; i++) {
      expect(budgets[i]).toBeGreaterThanOrEqual(budgets[i - 1]);
    }
  });

  it('totalSteps caps simulation', () => {
    const params: SimulationParams = { ...DEFAULT_PARAMS, totalSteps: 10 };
    let sim = createSimulation(params);
    sim = stepN(sim, 20);
    expect(sim.currentIndex).toBe(9);
    expect(sim.steps).toHaveLength(10);
  });

  it('applyPreset changes params and resets state', () => {
    let sim = createSimulation();
    sim = stepN(sim, 5);
    const preset = applyPreset(sim, 'furnace-drive-in');
    expect(preset.currentIndex).toBe(-1);
    expect(preset.steps).toHaveLength(0);
    expect(preset.params.thermalMode).toBe('furnace');
  });

  it('different thermal modes produce different thermal budgets', () => {
    const furnace = stepN(createSimulation({ ...DEFAULT_PARAMS, thermalMode: 'furnace', rampRate: 5, soakTime: 3600, coolingRate: 3 }), 100);
    const laser = stepN(createSimulation({ ...DEFAULT_PARAMS, thermalMode: 'laser' }), 100);

    const budgetFurnace = furnace.steps[furnace.steps.length - 1].thermalBudget;
    const budgetLaser = laser.steps[laser.steps.length - 1].thermalBudget;

    expect(budgetFurnace).toBeGreaterThan(budgetLaser);
  });

  it('200 steps complete without error', () => {
    let sim = createSimulation();
    sim = stepN(sim, 200);
    expect(sim.steps).toHaveLength(200);
    expect(sim.currentIndex).toBe(199);
    const last = sim.steps[199];
    expect(isFinite(last.junctionDepth)).toBe(true);
    expect(isFinite(last.sheetResistance)).toBe(true);
    expect(isFinite(last.thermalBudget)).toBe(true);
  });

  it('step has time and temperature from thermal profile', () => {
    const sim = stepForward(createSimulation());
    const step = sim.steps[0];
    expect(step.time).toBeGreaterThan(0);
    expect(step.temperature).toBeGreaterThan(20);
  });
});
