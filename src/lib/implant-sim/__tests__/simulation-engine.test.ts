import { createSimulation, stepForward, stepN, applyPreset } from '../simulation-engine';
import { DEFAULT_PARAMS } from '../constants';

describe('simulation-engine', () => {
  test('createSimulation returns initial state with index -1', () => {
    const sim = createSimulation();
    expect(sim.currentIndex).toBe(-1);
    expect(sim.steps).toHaveLength(0);
    expect(sim.totalSteps).toBe(200);
  });

  test('stepForward advances index by 1', () => {
    const sim = createSimulation();
    const next = stepForward(sim);
    expect(next.currentIndex).toBe(0);
    expect(next.steps).toHaveLength(1);
  });

  test('step produces trajectories', () => {
    const sim = createSimulation();
    const next = stepForward(sim);
    expect(next.steps[0].trajectories.length).toBeGreaterThan(0);
  });

  test('ion count increases with steps', () => {
    let sim = createSimulation();
    sim = stepForward(sim);
    const ions1 = sim.steps[0].ionsSimulated;
    sim = stepForward(sim);
    const ions2 = sim.steps[1].ionsSimulated;
    expect(ions2).toBeGreaterThan(ions1);
  });

  test('200 steps complete without error', () => {
    const sim = stepN(createSimulation(), 200);
    expect(sim.currentIndex).toBe(199);
    expect(sim.steps).toHaveLength(200);
  }, 30000);

  test('does not exceed totalSteps', () => {
    const params = { ...DEFAULT_PARAMS, totalSteps: 10 };
    let sim = createSimulation(params);
    sim = stepN(sim, 20);
    expect(sim.currentIndex).toBe(9);
    expect(sim.steps).toHaveLength(10);
  });

  test('damage evolves across steps', () => {
    let sim = createSimulation();
    sim = stepN(sim, 5);
    const early = sim.steps[0].damagePeakDensity;
    sim = stepN(sim, 50);
    const later = sim.steps[sim.steps.length - 1].damagePeakDensity;
    expect(later).toBeGreaterThanOrEqual(early);
  });

  test('applyPreset changes params and resets sim', () => {
    const sim = createSimulation();
    const next = applyPreset(sim, 'channeling-implant');
    expect(next.params.tiltAngle).toBe(0);
    expect(next.currentIndex).toBe(-1);
  });

  test('depth profile has DEPTH_BINS entries', () => {
    let sim = createSimulation();
    sim = stepForward(sim);
    expect(sim.steps[0].depthProfile.length).toBe(200);
  });
});
