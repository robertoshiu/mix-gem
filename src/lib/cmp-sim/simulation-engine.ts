import type { SimulationParams, SimulationState, StepState, ProcessPhase } from './types';
import {
  DEFAULT_PARAMS, DEFAULT_TOTAL_STEPS,
  RAMP_UP_END, BULK_CU_END, BARRIER_END,
  BARRIER_THICKNESS_NM,
} from './constants';
import { computeStepMetrics } from './wafer-metrics';
import { getPreset } from './presets';

function getPhase(stepIndex: number): ProcessPhase {
  if (stepIndex < RAMP_UP_END) return 'ramp-up';
  if (stepIndex < BULK_CU_END) return 'bulk-cu';
  if (stepIndex < BARRIER_END) return 'barrier';
  return 'buff';
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
  const dt = 0.5;

  const prevCreepStrain = prev?.padCreepStrain ?? 0;
  const prevCuRemaining = prev?.cuRemaining ?? state.params.cuThickness;
  const prevBarrierRemaining = prev?.barrierRemaining ?? BARRIER_THICKNESS_NM;

  const metrics = computeStepMetrics(
    state.params, nextIndex, phase, prevCreepStrain,
    prevCuRemaining, prevBarrierRemaining
  );

  let stepState: StepState;

  if (phase === 'ramp-up') {
    const progress = (nextIndex + 1) / RAMP_UP_END;
    stepState = {
      stepIndex: nextIndex,
      phase,
      timeSeconds: nextIndex * dt,
      filmThickness: metrics.filmThickness,
      fluidPressure: metrics.fluidPressure,
      realContactArea: metrics.realContactArea * progress,
      padCreepStrain: metrics.padCreepStrain,
      contactPressure: metrics.contactPressure.map((v) => v * progress),
      removalRate: metrics.removalRate * progress,
      cuRemaining: metrics.cuRemaining,
      barrierRemaining: metrics.barrierRemaining,
      removalRateMap: metrics.removalRateMap.map((v) => v * progress),
      wiwnuMap: metrics.wiwnuMap,
      dishingMap: metrics.dishingMap.map((v) => v * progress),
      erosionMap: metrics.erosionMap,
      roughnessMap: metrics.roughnessMap,
      thicknessMap: metrics.thicknessMap,
      dieCount: metrics.dieCount,
      dieGridCols: metrics.dieGridCols,
      dieGridRows: metrics.dieGridRows,
    };
  } else {
    stepState = {
      stepIndex: nextIndex,
      phase,
      timeSeconds: nextIndex * dt,
      filmThickness: metrics.filmThickness,
      fluidPressure: metrics.fluidPressure,
      realContactArea: metrics.realContactArea,
      padCreepStrain: metrics.padCreepStrain,
      contactPressure: metrics.contactPressure,
      removalRate: metrics.removalRate,
      cuRemaining: metrics.cuRemaining,
      barrierRemaining: metrics.barrierRemaining,
      removalRateMap: metrics.removalRateMap,
      wiwnuMap: metrics.wiwnuMap,
      dishingMap: metrics.dishingMap,
      erosionMap: metrics.erosionMap,
      roughnessMap: metrics.roughnessMap,
      thicknessMap: metrics.thicknessMap,
      dieCount: metrics.dieCount,
      dieGridCols: metrics.dieGridCols,
      dieGridRows: metrics.dieGridRows,
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
