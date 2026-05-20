import type { SimulationParams, SimulationState, StepState, ProcessPhase } from './types';
import { DEFAULT_PARAMS, DEFAULT_TOTAL_STEPS, ECD_FILL_END, ANNEAL_END, FILL_PROFILE_POINTS, DIE_MASK } from './constants';
import { computeStepMetrics } from './wafer-metrics';
import { applyCmpStep } from './cmp-model';
import { computeAnnealFactor } from './thermal-model';
import { getPreset } from './presets';

function getPhase(stepIndex: number): ProcessPhase {
  if (stepIndex < ECD_FILL_END) return 'ecd-fill';
  if (stepIndex < ANNEAL_END) return 'anneal';
  return 'cmp';
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
  const prevThickness = prev?.copperThickness ?? 0;
  const prevProfile = prev?.fillProfile ?? new Array(FILL_PROFILE_POINTS).fill(0);
  const dt = 0.5;

  let stepState: StepState;

  if (phase === 'ecd-fill') {
    const metrics = computeStepMetrics(state.params, nextIndex, prevThickness, prevProfile);
    stepState = {
      stepIndex: nextIndex,
      phase,
      timeSeconds: nextIndex * dt,
      dishingDepth: 0,
      viaResistance: metrics.sheetResistance * 0.04,
      ...metrics,
    };
  } else if (phase === 'anneal') {
    const annealProgress = (nextIndex - ECD_FILL_END) / (ANNEAL_END - ECD_FILL_END);
    const rsFactor = computeAnnealFactor(annealProgress);
    const prevResMap = prev?.resistanceMap ?? [];
    const resistanceMap = prevResMap.map((v) => v * rsFactor);
    const activeRs = resistanceMap.filter((_: number, i: number) => DIE_MASK[i]);
    const sheetResistance = activeRs.length > 0
      ? activeRs.reduce((s: number, v: number) => s + v, 0) / activeRs.length
      : prev?.sheetResistance ?? 0;

    stepState = {
      stepIndex: nextIndex,
      phase,
      timeSeconds: nextIndex * dt,
      currentDensityMap: prev?.currentDensityMap ?? [],
      fillProfile: prev?.fillProfile ?? prevProfile,
      fillFraction: prev?.fillFraction ?? 0,
      copperThickness: prev?.copperThickness ?? 0,
      sheetResistance,
      viaResistance: sheetResistance * 0.04,
      stepCoverage: prev?.stepCoverage ?? 100,
      dishingDepth: 0,
      thicknessMap: prev?.thicknessMap ?? [],
      resistanceMap,
      roughnessMap: prev?.roughnessMap ?? [],
      uniformity: prev?.uniformity ?? 0,
      dieCount: prev?.dieCount ?? 81,
      dieGridCols: prev?.dieGridCols ?? 9,
      dieGridRows: prev?.dieGridRows ?? 9,
    };
  } else {
    // CMP phase
    const stepsInCmp = nextIndex - ANNEAL_END;
    const cmp = applyCmpStep(prev?.copperThickness ?? 0, state.params, stepsInCmp);

    const ratio = prev?.copperThickness && prev.copperThickness > 0
      ? cmp.thickness / prev.copperThickness
      : 1;
    const thicknessMap = (prev?.thicknessMap ?? []).map((v) => v * ratio);
    const rho_cu = 1.7e-6;
    const resistanceMap = thicknessMap.map((t) => {
      const t_cm = t * 1e-7;
      return t_cm > 0 ? rho_cu / t_cm : 0;
    });

    const activeRs = resistanceMap.filter((_: number, i: number) => DIE_MASK[i]);
    const sheetResistance = activeRs.length > 0
      ? activeRs.reduce((s: number, v: number) => s + v, 0) / activeRs.length
      : prev?.sheetResistance ?? 0;

    const activeThk = thicknessMap.filter((_: number, i: number) => DIE_MASK[i]);
    const meanThk = activeThk.reduce((s: number, v: number) => s + v, 0) / activeThk.length;
    const variance = activeThk.reduce((s: number, v: number) => s + (v - meanThk) ** 2, 0) / activeThk.length;
    const uniformity = meanThk > 0 ? (Math.sqrt(variance) / meanThk) * 100 : 0;

    stepState = {
      stepIndex: nextIndex,
      phase,
      timeSeconds: nextIndex * dt,
      currentDensityMap: prev?.currentDensityMap ?? [],
      fillProfile: prev?.fillProfile ?? prevProfile,
      fillFraction: prev?.fillFraction ?? 0,
      copperThickness: cmp.thickness,
      sheetResistance,
      viaResistance: sheetResistance * 0.04,
      stepCoverage: prev?.stepCoverage ?? 100,
      dishingDepth: cmp.dishing,
      thicknessMap,
      resistanceMap,
      roughnessMap: prev?.roughnessMap ?? [],
      uniformity,
      dieCount: prev?.dieCount ?? 81,
      dieGridCols: prev?.dieGridCols ?? 9,
      dieGridRows: prev?.dieGridRows ?? 9,
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
