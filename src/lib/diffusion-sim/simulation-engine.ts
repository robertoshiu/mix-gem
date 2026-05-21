import type { SimulationParams, SimulationState, StepState, SolverState } from './types';
import { DEFAULT_PARAMS, DEFAULT_TOTAL_STEPS, DEPTH_BINS, estimateMaxDepth, DOPANT_DB } from './constants';
import { generateThermalProfile } from './thermal-profile';
import { createSolverState, solveDiffusionStep } from './diffusion-solver';
import { computeMetrics } from './wafer-metrics';
import { equilibriumInterstitials, equilibriumVacancies } from './point-defects';
import { getPreset } from './presets';

const solverCache = new WeakMap<SimulationState, SolverState>();

export function createSimulation(params: SimulationParams = DEFAULT_PARAMS): SimulationState {
  const totalSteps = params.totalSteps ?? DEFAULT_TOTAL_STEPS;
  const thermalProfile = generateThermalProfile(params.thermalMode, params);

  const state: SimulationState = {
    params: { ...params },
    steps: [],
    currentIndex: -1,
    totalSteps,
    thermalProfile,
  };

  solverCache.set(state, createSolverState(params));
  return state;
}

export function stepForward(state: SimulationState): SimulationState {
  const nextIndex = state.currentIndex + 1;
  if (nextIndex >= state.totalSteps) return state;

  let solver = solverCache.get(state);
  if (!solver) {
    solver = createSolverState(state.params);
    const maxDepth = estimateMaxDepth(state.params.dopantSpecies, state.params.initialDepth);
    const binSize = maxDepth / DEPTH_BINS;
    for (let i = 0; i <= state.currentIndex; i++) {
      const thermalStep = state.thermalProfile[i];
      if (thermalStep) {
        solveDiffusionStep(solver, thermalStep, state.params, binSize);
      }
    }
  }

  const maxDepth = estimateMaxDepth(state.params.dopantSpecies, state.params.initialDepth);
  const binSize = maxDepth / DEPTH_BINS;
  const thermalStep = state.thermalProfile[nextIndex];
  if (thermalStep) {
    solveDiffusionStep(solver, thermalStep, state.params, binSize);
  }

  const metrics = computeMetrics(solver, state.params, binSize);

  const cIeq = equilibriumInterstitials(solver.temperature) * state.params.interstitialFactor;
  const cVeq = equilibriumVacancies(solver.temperature) * state.params.vacancyFactor;

  const layers = [];
  let offset = 0;
  if (state.params.screenOxideThickness > 0) {
    layers.push({ material: 'SiO2' as const, startNm: 0, endNm: state.params.screenOxideThickness });
    offset = state.params.screenOxideThickness;
  }
  layers.push({ material: 'Si' as const, startNm: offset, endNm: maxDepth });

  const stepState: StepState = {
    stepIndex: nextIndex,
    time: solver.time,
    temperature: solver.temperature,
    thermalPhase: thermalStep?.phase ?? 'ramp',
    dopantProfile: [...solver.dopantProfile],
    activeProfile: [...solver.activeProfile],
    clusteredProfile: [...solver.clusteredProfile],
    interstitialProfile: solver.defects.interstitials.map(v => cIeq > 0 ? v / cIeq : 1),
    vacancyProfile: solver.defects.vacancies.map(v => cVeq > 0 ? v / cVeq : 1),
    carrierProfile: [...solver.carrierProfile],
    temperatureProfile: thermalStep?.tempProfile ? [...thermalStep.tempProfile] : new Array(DEPTH_BINS).fill(solver.temperature),
    ...metrics,
    maxDepthNm: maxDepth,
    layers,
  };

  const newState: SimulationState = {
    ...state,
    steps: [...state.steps, stepState],
    currentIndex: nextIndex,
  };

  solverCache.set(newState, solver);
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
