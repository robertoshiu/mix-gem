import type { SimulationParams, StepState } from './types';
import {
  DIE_GRID_COLS,
  DIE_GRID_ROWS,
  DIE_MASK,
  FARADAY_EFFICIENCY,
  CU_MOLAR_MASS,
  CU_DENSITY,
  FARADAY_CONST,
  CU_VALENCE,
} from './constants';
import { computeCurrentDensityMap } from './current-density';
import { advanceFillProfile, computeFillFraction } from './fill-profile';
import { computePlatingRateFactor, computeRoughness } from './thermal-model';

export function computeStepMetrics(
  params: SimulationParams,
  stepIndex: number,
  prevCopperThickness: number,
  prevFillProfile: number[],
): Omit<StepState, 'stepIndex' | 'phase' | 'timeSeconds' | 'dishingDepth' | 'viaResistance'> {
  const cols = DIE_GRID_COLS;
  const rows = DIE_GRID_ROWS;
  const dieCount = cols * rows;
  const dt = 0.5;

  const currentDensityMap = computeCurrentDensityMap(params);

  const activeDensities = currentDensityMap.filter((_, i) => DIE_MASK[i]);
  const avgJ = activeDensities.length > 0
    ? activeDensities.reduce((s, v) => s + v, 0) / activeDensities.length
    : params.appliedCurrent;

  const fillProfile = advanceFillProfile(prevFillProfile, params, avgJ, stepIndex);
  const fillFraction = computeFillFraction(fillProfile);

  const rateFactor = computePlatingRateFactor(params.bathTemp);
  const depositRate = (avgJ * 1e-3 * CU_MOLAR_MASS * FARADAY_EFFICIENCY * dt)
    / (CU_VALENCE * FARADAY_CONST * CU_DENSITY) * 1e7 * rateFactor;
  const copperThickness = prevCopperThickness + depositRate;

  const thicknessMap = new Array<number>(dieCount);
  for (let i = 0; i < dieCount; i++) {
    if (!DIE_MASK[i]) { thicknessMap[i] = 0; continue; }
    const ratio = currentDensityMap[i] / Math.max(avgJ, 0.01);
    thicknessMap[i] = copperThickness * ratio;
  }

  const rho_cu = 1.7e-6;
  const resistanceMap = new Array<number>(dieCount);
  for (let i = 0; i < dieCount; i++) {
    if (!DIE_MASK[i]) { resistanceMap[i] = 0; continue; }
    const t_cm = thicknessMap[i] * 1e-7;
    resistanceMap[i] = t_cm > 0 ? rho_cu / t_cm : 999;
  }

  const activeRs = resistanceMap.filter((_, i) => DIE_MASK[i]);
  const sheetResistance = activeRs.length > 0
    ? activeRs.reduce((s, v) => s + v, 0) / activeRs.length
    : 0;

  const baseRoughness = computeRoughness(params.bathTemp);
  const roughnessMap = new Array<number>(dieCount);
  for (let i = 0; i < dieCount; i++) {
    if (!DIE_MASK[i]) { roughnessMap[i] = 0; continue; }
    roughnessMap[i] = baseRoughness;
  }

  const minFill = Math.min(...fillProfile);
  const maxFill = Math.max(...fillProfile);
  const stepCoverage = maxFill > 0 ? (minFill / maxFill) * 100 : 100;

  const activeThk = thicknessMap.filter((_, i) => DIE_MASK[i]);
  const meanThk = activeThk.reduce((s, v) => s + v, 0) / activeThk.length;
  const variance = activeThk.reduce((s, v) => s + (v - meanThk) ** 2, 0) / activeThk.length;
  const uniformity = meanThk > 0 ? (Math.sqrt(variance) / meanThk) * 100 : 0;

  return {
    currentDensityMap,
    fillProfile,
    fillFraction,
    copperThickness,
    sheetResistance,
    stepCoverage,
    thicknessMap,
    resistanceMap,
    roughnessMap,
    uniformity,
    dieCount,
    dieGridCols: cols,
    dieGridRows: rows,
  };
}
