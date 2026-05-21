import { createSimulation, stepForward, stepN } from '../simulation-engine';
import { DEFAULT_PARAMS, DEFAULT_TOTAL_STEPS, ECD_FILL_END, ANNEAL_END } from '../constants';

describe('simulation-engine', () => {
  it('creates initial state with empty steps', () => {
    const state = createSimulation(DEFAULT_PARAMS);
    expect(state.steps).toHaveLength(0);
    expect(state.currentIndex).toBe(-1);
    expect(state.totalSteps).toBe(DEFAULT_TOTAL_STEPS);
  });

  it('stepForward advances currentIndex', () => {
    let state = createSimulation(DEFAULT_PARAMS);
    state = stepForward(state);
    expect(state.currentIndex).toBe(0);
    expect(state.steps).toHaveLength(1);
    expect(state.steps[0].phase).toBe('ecd-fill');
  });

  it('phase transitions at correct step boundaries', () => {
    const params = { ...DEFAULT_PARAMS, totalSteps: DEFAULT_TOTAL_STEPS };
    let state = createSimulation(params);
    state = stepN(state, ECD_FILL_END + 1);
    expect(state.steps[ECD_FILL_END - 1].phase).toBe('ecd-fill');
    expect(state.steps[ECD_FILL_END].phase).toBe('anneal');
  });

  it('CMP phase starts after anneal', () => {
    let state = createSimulation(DEFAULT_PARAMS);
    state = stepN(state, ANNEAL_END + 1);
    expect(state.steps[ANNEAL_END].phase).toBe('cmp');
  });

  it('does not exceed total steps', () => {
    const params = { ...DEFAULT_PARAMS, totalSteps: 10 };
    let state = createSimulation(params);
    for (let i = 0; i < 20; i++) state = stepForward(state);
    expect(state.steps).toHaveLength(10);
  });

  it('stepN advances by N steps', () => {
    let state = createSimulation(DEFAULT_PARAMS);
    state = stepN(state, 30);
    expect(state.steps).toHaveLength(30);
    expect(state.currentIndex).toBe(29);
  });
});
