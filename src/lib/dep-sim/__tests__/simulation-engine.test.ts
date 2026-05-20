import { createSimulation, stepCycle, stepN, applyPreset } from '../simulation-engine';
import { DEFAULT_PARAMS, DEFAULT_TOTAL_CYCLES } from '../constants';

describe('simulation-engine', () => {
  it('creates initial state with empty cycles', () => {
    const state = createSimulation(DEFAULT_PARAMS);
    expect(state.cycles).toHaveLength(0);
    expect(state.currentIndex).toBe(-1);
    expect(state.totalCycles).toBe(DEFAULT_TOTAL_CYCLES);
  });

  it('stepCycle advances currentIndex', () => {
    let state = createSimulation(DEFAULT_PARAMS);
    state = stepCycle(state);
    expect(state.currentIndex).toBe(0);
    expect(state.cycles).toHaveLength(1);
  });

  it('cumulative thickness grows across cycles', () => {
    let state = createSimulation(DEFAULT_PARAMS);
    for (let i = 0; i < 10; i++) state = stepCycle(state);
    const thicknesses = state.cycles.map((c) => c.cumulativeThickness);
    for (let i = 1; i < thicknesses.length; i++) {
      expect(thicknesses[i]).toBeGreaterThan(thicknesses[i - 1]);
    }
  });

  it('does not exceed total cycles', () => {
    const params = { ...DEFAULT_PARAMS, totalCycles: 5 };
    let state = createSimulation(params);
    for (let i = 0; i < 10; i++) state = stepCycle(state);
    expect(state.cycles).toHaveLength(5);
  });

  it('stepN advances by N cycles', () => {
    let state = createSimulation(DEFAULT_PARAMS);
    state = stepN(state, 20);
    expect(state.cycles).toHaveLength(20);
    expect(state.currentIndex).toBe(19);
  });

  it('precursor-starvation preset reduces BDEAS flow', () => {
    let state = createSimulation(DEFAULT_PARAMS);
    state = stepCycle(state);
    state = applyPreset(state, 'precursor-starvation');
    expect(state.params.bdeasFlowRate).toBeCloseTo(DEFAULT_PARAMS.bdeasFlowRate * 0.4);
  });

  it('chamber-seasoning preset resets to fresh state', () => {
    let state = createSimulation(DEFAULT_PARAMS);
    for (let i = 0; i < 10; i++) state = stepCycle(state);
    state = applyPreset(state, 'chamber-seasoning');
    expect(state.cycles).toHaveLength(0);
    expect(state.currentIndex).toBe(-1);
  });
});
