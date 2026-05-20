import type { SimulationParams, SimulationState, StepState, ProcessPhase } from './types';
import {
  DEFAULT_PARAMS, DEFAULT_TOTAL_STEPS, STRIKE_END, MAIN_ETCH_END,
  ETCH_PROFILE_POINTS, DIE_GRID_COLS, DIE_GRID_ROWS, ACTIVE_DIE_COUNT,
} from './constants';
import { computePlasmaState } from './plasma-model';
import { computeSheathState } from './sheath-model';
import { computeStepMetrics } from './wafer-metrics';
import { getPreset } from './presets';

function getPhase(stepIndex: number): ProcessPhase {
  if (stepIndex < STRIKE_END) return 'strike';
  if (stepIndex < MAIN_ETCH_END) return 'main-etch';
  return 'over-etch';
}

export function createSimulation(params: SimulationParams = DEFAULT_PARAMS): SimulationState {
  return {
    params: { ...params },
    steps: [],
    currentIndex: -1,
    totalSteps: params.totalSteps ?? DEFAULT_TOTAL_STEPS,
  };
}

export function stepForward(state: SimulationState): SimulationState {
  const nextIndex = state.currentIndex + 1;
  if (nextIndex >= state.totalSteps) return state;

  const phase = getPhase(nextIndex);
  const prev = state.steps.length > 0 ? state.steps[state.steps.length - 1] : null;
  const prevProfile = prev?.etchProfile ?? new Array(ETCH_PROFILE_POINTS).fill(1);
  const dt = 0.5;
  const totalDies = DIE_GRID_COLS * DIE_GRID_ROWS;

  let stepState: StepState;

  if (phase === 'strike') {
    const progress = (nextIndex + 1) / STRIKE_END;
    const plasma = computePlasmaState(state.params);
    const sheath = computeSheathState(state.params);

    stepState = {
      stepIndex: nextIndex,
      phase,
      timeSeconds: nextIndex * dt,
      electronDensity: plasma.electronDensity * progress,
      ionFlux: plasma.ionFlux * progress * 0.1,
      ionEnergy: sheath.ionEnergy * progress,
      sheathPotential: sheath.sheathPotential * progress,
      etchProfile: prevProfile,
      etchDepth: 0,
      etchRate: 0,
      selectivity: 0,
      cdBias: 0,
      profileAngle: 90,
      etchRateMap: new Array(totalDies).fill(0),
      uniformityMap: new Array(totalDies).fill(0),
      cdBiasMap: new Array(totalDies).fill(0),
      roughnessMap: new Array(totalDies).fill(0),
      uniformity: 0,
      dieCount: ACTIVE_DIE_COUNT,
      dieGridCols: DIE_GRID_COLS,
      dieGridRows: DIE_GRID_ROWS,
    };
  } else {
    const metrics = computeStepMetrics(state.params, nextIndex, prevProfile);
    const overEtchFactor = phase === 'over-etch' ? 0.3 : 1;

    stepState = {
      stepIndex: nextIndex,
      phase,
      timeSeconds: nextIndex * dt,
      ...metrics,
      etchRate: metrics.etchRate * overEtchFactor,
      etchRateMap: metrics.etchRateMap.map((v) => v * overEtchFactor),
    };
  }

  return {
    ...state,
    steps: [...state.steps, stepState],
    currentIndex: nextIndex,
  };
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
  return {
    ...state,
    params: preset.apply(state.params, state.currentIndex),
  };
}
