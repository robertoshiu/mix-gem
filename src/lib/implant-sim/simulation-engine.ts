import type { SimulationParams, SimulationState, StepState } from './types';
import { DEFAULT_PARAMS, DEFAULT_TOTAL_STEPS, DEFAULT_ION_COUNT } from './constants';
import {
  createEnsemble, simulateBatch, computeStatistics,
  getDepthProfile, getLateralProfile,
} from './monte-carlo';
import { getAmorphousMap } from './damage-model';
import { getPreset } from './presets';
import type { EnsembleState } from './monte-carlo';

// We store the mutable ensemble state alongside the immutable SimulationState
// using a WeakMap keyed by the state object.
const ensembleCache = new WeakMap<SimulationState, EnsembleState>();

export function createSimulation(params: SimulationParams = DEFAULT_PARAMS): SimulationState {
  const state: SimulationState = {
    params: { ...params },
    steps: [],
    currentIndex: -1,
    totalSteps: params.totalSteps ?? DEFAULT_TOTAL_STEPS,
  };
  // Pre-create ensemble
  ensembleCache.set(state, createEnsemble(params));
  return state;
}

export function stepForward(state: SimulationState): SimulationState {
  const nextIndex = state.currentIndex + 1;
  if (nextIndex >= state.totalSteps) return state;

  // Get or create ensemble
  let ensemble = ensembleCache.get(state);
  if (!ensemble) {
    ensemble = createEnsemble(state.params);
    // Replay previous ions
    const prevIons = state.steps.length > 0
      ? state.steps[state.steps.length - 1].ionsSimulated
      : 0;
    if (prevIons > 0) {
      simulateBatch(ensemble, prevIons);
    }
  }

  // Compute batch size for this step
  const batchSize = Math.max(1, Math.round(DEFAULT_ION_COUNT / state.totalSteps));
  const trajectories = simulateBatch(ensemble, batchSize);
  const stats = computeStatistics(ensemble);
  const depthProfile = getDepthProfile(ensemble);
  const lateralProfile = getLateralProfile(ensemble);
  const amorphousMap = getAmorphousMap(ensemble.damage);
  const damageProfile = ensemble.damage.vacancies.map(v => v);

  const stepState: StepState = {
    stepIndex: nextIndex,
    ionsSimulated: ensemble.ionCount,
    totalIons: DEFAULT_ION_COUNT,
    trajectories,
    depthProfile,
    damageProfile,
    lateralProfile,
    amorphousMap,
    layers: ensemble.layers,
    maxDepthNm: ensemble.maxDepthNm,
    ...stats,
  };

  const newState: SimulationState = {
    ...state,
    steps: [...state.steps, stepState],
    currentIndex: nextIndex,
  };

  // Transfer ensemble to new state object
  ensembleCache.set(newState, ensemble);

  return newState;
}

export function stepN(state: SimulationState, n: number): SimulationState {
  let current = state;
  for (let i = 0; i < n; i++) {
    const next = stepForward(current);
    if (next === current) break;
    current = next;
  }
  return current;
}

export function applyPreset(state: SimulationState, presetId: string): SimulationState {
  const preset = getPreset(presetId);
  if (!preset) return state;
  const newParams = preset.apply(state.params);
  return createSimulation(newParams);
}
