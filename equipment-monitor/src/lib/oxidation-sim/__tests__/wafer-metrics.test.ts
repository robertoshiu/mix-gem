import { computeMetrics } from '../wafer-metrics';
import { createMesh } from '../mesh-templates';
import { DEFAULT_PARAMS } from '../constants';
import type { SolverState } from '../types';

function makeSolverState(): SolverState {
  const mesh = createMesh('blanket', DEFAULT_PARAMS);
  const nr = mesh.nr;
  return {
    mesh,
    oxideThickness: new Array(nr).fill(10),
    interfaceStress: new Array(nr).fill(0),
    oxidationRate: new Array(nr).fill(1),
    temperature: 1000,
    time: 100,
    thermalBudget: 5000,
  };
}

describe('wafer-metrics', () => {
  it('all 8 metrics are finite numbers', () => {
    const state = makeSolverState();
    const m = computeMetrics(state, DEFAULT_PARAMS);
    expect(isFinite(m.oxideThickness)).toBe(true);
    expect(isFinite(m.temperature)).toBe(true);
    expect(isFinite(m.peakStress)).toBe(true);
    expect(isFinite(m.birdBeakLength)).toBe(true);
    expect(isFinite(m.oxidationRate)).toBe(true);
    expect(isFinite(m.oxideUniformity)).toBe(true);
    expect(isFinite(m.trenchCornerStress)).toBe(true);
    expect(isFinite(m.thermalBudget)).toBe(true);
  });

  it('oxide uniformity is 0% for uniform thickness', () => {
    const state = makeSolverState();
    state.oxideThickness.fill(50);
    const m = computeMetrics(state, DEFAULT_PARAMS);
    expect(m.oxideUniformity).toBeCloseTo(0, 1);
  });

  it('oxide uniformity > 0 for non-uniform thickness', () => {
    const state = makeSolverState();
    state.oxideThickness[0] = 100;
    state.oxideThickness[state.oxideThickness.length - 1] = 50;
    const m = computeMetrics(state, DEFAULT_PARAMS);
    expect(m.oxideUniformity).toBeGreaterThan(0);
  });

  it('bird beak length is 0 for blanket geometry', () => {
    const state = makeSolverState();
    const m = computeMetrics(state, DEFAULT_PARAMS);
    expect(m.birdBeakLength).toBe(0);
  });

  it('trench corner stress factor is 1.0 for blanket', () => {
    const state = makeSolverState();
    const m = computeMetrics(state, DEFAULT_PARAMS);
    expect(m.trenchCornerStress).toBeCloseTo(1.0, 1);
  });

  it('thermal budget matches solver state', () => {
    const state = makeSolverState();
    state.thermalBudget = 12345;
    const m = computeMetrics(state, DEFAULT_PARAMS);
    expect(m.thermalBudget).toBe(12345);
  });

  it('temperature is center node temperature', () => {
    const state = makeSolverState();
    state.mesh.nodes[0].T = 999;
    const m = computeMetrics(state, DEFAULT_PARAMS);
    expect(m.temperature).toBe(999);
  });

  it('oxide thickness is center value', () => {
    const state = makeSolverState();
    state.oxideThickness[0] = 42;
    const m = computeMetrics(state, DEFAULT_PARAMS);
    expect(m.oxideThickness).toBe(42);
  });
});
