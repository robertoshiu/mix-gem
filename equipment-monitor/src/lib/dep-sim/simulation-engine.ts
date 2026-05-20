import type { PresetId, SimulationParams, SimulationState, CycleState } from './types';
import { DEFAULT_PARAMS, DEFAULT_TOTAL_CYCLES } from './constants';
import { computeCycleMetrics } from './wafer-metrics';
import { getPreset } from './presets';

export function createSimulation(params: SimulationParams = DEFAULT_PARAMS): SimulationState {
  return {
    params: { ...params },
    cycles: [],
    currentIndex: -1,
    totalCycles: params.totalCycles ?? DEFAULT_TOTAL_CYCLES,
  };
}

export function stepCycle(state: SimulationState): SimulationState {
  const nextIndex = state.currentIndex + 1;
  if (nextIndex >= state.totalCycles) return state;

  const prevThickness = nextIndex > 0
    ? state.cycles[state.cycles.length - 1].cumulativeThickness
    : 0;

  const metrics = computeCycleMetrics(state.params, prevThickness);

  const cycleState: CycleState = {
    cycleIndex: nextIndex,
    phase: 'purge-b',
    ...metrics,
  };

  return {
    ...state,
    cycles: [...state.cycles, cycleState],
    currentIndex: nextIndex,
  };
}

export function stepN(state: SimulationState, n: number): SimulationState {
  let current = state;
  for (let i = 0; i < n; i++) {
    const next = stepCycle(current);
    if (next === current) break;
    current = next;
  }
  return current;
}

export function applyPreset(state: SimulationState, presetId: PresetId): SimulationState {
  const preset = getPreset(presetId);
  if (!preset) return state;

  if (presetId === 'chamber-seasoning') {
    return createSimulation(preset.apply(state.params, 0));
  }

  return {
    ...state,
    params: preset.apply(state.params, state.currentIndex),
  };
}
