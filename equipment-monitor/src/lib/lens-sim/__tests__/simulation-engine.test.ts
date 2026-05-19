// equipment-monitor/src/lib/lens-sim/__tests__/simulation-engine.test.ts
import { createSimulation, stepWafer, applyPreset } from '../simulation-engine';
import { DEFAULT_PARAMS, LOT_SIZE } from '../constants';

describe('simulation-engine', () => {
  it('creates initial state with empty wafers', () => {
    const state = createSimulation(DEFAULT_PARAMS);
    expect(state.wafers).toHaveLength(0);
    expect(state.currentIndex).toBe(-1);
    expect(state.lotSize).toBe(LOT_SIZE);
  });

  it('stepWafer advances currentIndex', () => {
    let state = createSimulation(DEFAULT_PARAMS);
    state = stepWafer(state);
    expect(state.currentIndex).toBe(0);
    expect(state.wafers).toHaveLength(1);
  });

  it('full lot produces 25 wafers', () => {
    let state = createSimulation(DEFAULT_PARAMS);
    for (let i = 0; i < LOT_SIZE; i++) {
      state = stepWafer(state);
    }
    expect(state.wafers).toHaveLength(LOT_SIZE);
    expect(state.currentIndex).toBe(LOT_SIZE - 1);
  });

  it('does not exceed lot size', () => {
    let state = createSimulation(DEFAULT_PARAMS);
    for (let i = 0; i < LOT_SIZE + 5; i++) {
      state = stepWafer(state);
    }
    expect(state.wafers).toHaveLength(LOT_SIZE);
  });

  it('cooling-failure preset sets cooling to 0', () => {
    let state = createSimulation(DEFAULT_PARAMS);
    state = stepWafer(state); // wafer 0
    state = applyPreset(state, 'cooling-failure');
    expect(state.params.coolingPower).toBe(0);
  });

  it('cold-start preset resets to fresh state', () => {
    let state = createSimulation(DEFAULT_PARAMS);
    for (let i = 0; i < 10; i++) state = stepWafer(state);
    state = applyPreset(state, 'cold-start');
    expect(state.wafers).toHaveLength(0);
    expect(state.currentIndex).toBe(-1);
  });

  it('wafer elapsed time increases across lot', () => {
    let state = createSimulation(DEFAULT_PARAMS);
    for (let i = 0; i < 5; i++) state = stepWafer(state);
    for (let i = 1; i < state.wafers.length; i++) {
      expect(state.wafers[i].elapsedTime).toBeGreaterThan(state.wafers[i - 1].elapsedTime);
    }
  });
});
