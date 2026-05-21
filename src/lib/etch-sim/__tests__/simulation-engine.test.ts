import { createSimulation, stepForward, stepN, applyPreset } from '../simulation-engine';
import { STRIKE_END, MAIN_ETCH_END } from '../constants';

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
    expect(sim.steps[0].phase).toBe('strike');
  });

  it('phase transitions at step 40 (main-etch) and 160 (over-etch)', () => {
    let sim = createSimulation();
    sim = stepN(sim, STRIKE_END);
    expect(sim.steps[sim.currentIndex].phase).toBe('strike');

    sim = stepForward(sim);
    expect(sim.steps[sim.currentIndex].phase).toBe('main-etch');

    sim = stepN(sim, MAIN_ETCH_END - STRIKE_END - 1);
    expect(sim.steps[sim.currentIndex].phase).toBe('main-etch');

    sim = stepForward(sim);
    expect(sim.steps[sim.currentIndex].phase).toBe('over-etch');
  });

  it('stepN advances N steps', () => {
    const sim = stepN(createSimulation(), 50);
    expect(sim.currentIndex).toBe(49);
    expect(sim.steps).toHaveLength(50);
  });

  it('applyPreset modifies params', () => {
    const sim = createSimulation();
    const modified = applyPreset(sim, 'plasma-nonuniformity');
    expect(modified.params.icpPower).toBeGreaterThan(sim.params.icpPower);
  });

  it('does not exceed totalSteps', () => {
    const sim = stepN(createSimulation(), 300);
    expect(sim.currentIndex).toBe(199);
    expect(sim.steps).toHaveLength(200);
    const same = stepForward(sim);
    expect(same).toBe(sim);
  });
});
