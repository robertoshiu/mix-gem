import { createSimulation, stepForward, stepN, applyPreset } from '../simulation-engine';
import { RAMP_UP_END, BULK_CU_END, BARRIER_END } from '../constants';

describe('simulation-engine', () => {
  it('createSimulation returns initial state with index -1', () => {
    const sim = createSimulation();
    expect(sim.currentIndex).toBe(-1);
    expect(sim.steps).toHaveLength(0);
    expect(sim.totalSteps).toBe(200);
  });

  it('stepForward advances index by 1', () => {
    const sim = stepForward(createSimulation());
    expect(sim.currentIndex).toBe(0);
    expect(sim.steps).toHaveLength(1);
    expect(sim.steps[0].phase).toBe('ramp-up');
  });

  it('phase transitions at correct boundaries', () => {
    let sim = createSimulation();

    sim = stepN(sim, RAMP_UP_END);
    expect(sim.steps[sim.currentIndex].phase).toBe('ramp-up');

    sim = stepForward(sim);
    expect(sim.steps[sim.currentIndex].phase).toBe('bulk-cu');

    sim = stepN(sim, BULK_CU_END - RAMP_UP_END - 1);
    expect(sim.steps[sim.currentIndex].phase).toBe('bulk-cu');

    sim = stepForward(sim);
    expect(sim.steps[sim.currentIndex].phase).toBe('barrier');

    sim = stepN(sim, BARRIER_END - BULK_CU_END - 1);
    expect(sim.steps[sim.currentIndex].phase).toBe('barrier');

    sim = stepForward(sim);
    expect(sim.steps[sim.currentIndex].phase).toBe('buff');
  });

  it('200 steps complete without error', () => {
    const sim = stepN(createSimulation(), 200);
    expect(sim.currentIndex).toBe(199);
    expect(sim.steps).toHaveLength(200);
  });

  it('slurry swap changes chemistry at barrier transition', () => {
    let sim = stepN(createSimulation(), BULK_CU_END);
    const cuStep = sim.steps[sim.currentIndex];
    sim = stepForward(sim);
    const barrierStep = sim.steps[sim.currentIndex];
    expect(barrierStep.phase).toBe('barrier');
    expect(cuStep.phase).toBe('bulk-cu');
  });

  it('buff phase has minimal removal rate', () => {
    const sim = stepN(createSimulation(), 190);
    const buffStep = sim.steps[sim.currentIndex];
    expect(buffStep.phase).toBe('buff');
    expect(buffStep.removalRate).toBeLessThan(100);
  });

  it('does not exceed totalSteps', () => {
    const sim = stepN(createSimulation(), 300);
    expect(sim.currentIndex).toBe(199);
    const same = stepForward(sim);
    expect(same).toBe(sim);
  });

  it('applyPreset modifies params', () => {
    const sim = createSimulation();
    const modified = applyPreset(sim, 'slurry-starvation');
    expect(modified.params.slurryFlow).toBeLessThan(sim.params.slurryFlow);
  });

  it('Cu remaining decreases during bulk-cu phase', () => {
    const sim = stepN(createSimulation(), 100);
    const step = sim.steps[sim.currentIndex];
    expect(step.cuRemaining).toBeLessThan(sim.params.cuThickness);
  });
});
