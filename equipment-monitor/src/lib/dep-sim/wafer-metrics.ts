import type { SimulationParams, CycleState } from './types';
import {
  BASE_ROUGHNESS,
  DIE_GRID_COLS,
  DIE_GRID_ROWS,
  DIE_MASK,
  IDEAL_RI,
  RI_PER_COVERAGE_DEFICIT,
  ROUGHNESS_PER_DECOMP_DEGREE,
  ROUGHNESS_PER_RESIDUAL,
  ALD_WINDOW_HIGH,
} from './constants';
import { computeHalfCycleCoverages } from './langmuir';
import { computeFlowState } from './reactor-flow';
import { computeThicknessMap, computeGpc } from './growth-model';
import { classifyRegime } from './thermal-model';

/**
 * Compute all wafer metrics for a single ALD cycle.
 * Orchestrates langmuir -> flow -> growth -> roughness -> RI.
 */
export function computeCycleMetrics(
  params: SimulationParams,
  cumulativeThickness: number,
): Omit<CycleState, 'cycleIndex' | 'phase'> {
  const cols = DIE_GRID_COLS;
  const rows = DIE_GRID_ROWS;
  const dieCount = cols * rows;

  // 1. Half-cycle coverages
  const { coverageA, coverageB } = computeHalfCycleCoverages(params);

  // 2. Reactor flow state
  const flow = computeFlowState(params);

  // 3. GPC and thickness map
  const gpc = computeGpc(coverageA, coverageB, flow.effectiveO3Fraction, params.pedestalTemp);
  const thicknessMap = computeThicknessMap(params, coverageA, coverageB, cumulativeThickness, flow.effectiveO3Fraction);

  // 4. Roughness map
  const regime = classifyRegime(params.pedestalTemp);
  const decompPenalty = regime === 'decomposition'
    ? (params.pedestalTemp - ALD_WINDOW_HIGH) * ROUGHNESS_PER_DECOMP_DEGREE
    : 0;
  const residualPenalty = flow.residualFraction * ROUGHNESS_PER_RESIDUAL;
  const roughnessMap = new Array<number>(dieCount);
  for (let i = 0; i < dieCount; i++) {
    if (!DIE_MASK[i]) {
      roughnessMap[i] = 0;
      continue;
    }
    roughnessMap[i] = BASE_ROUGHNESS + residualPenalty + decompPenalty;
  }

  // 5. Refractive index map
  const coverageDeficit = 1 - coverageB * flow.effectiveO3Fraction;
  const riMap = new Array<number>(dieCount);
  for (let i = 0; i < dieCount; i++) {
    if (!DIE_MASK[i]) {
      riMap[i] = 0;
      continue;
    }
    riMap[i] = IDEAL_RI - coverageDeficit * RI_PER_COVERAGE_DEFICIT;
  }

  // 6. Uniformity
  const activeThicknesses = thicknessMap.filter((_, i) => DIE_MASK[i] === 1);
  const mean = activeThicknesses.reduce((s, v) => s + v, 0) / activeThicknesses.length;
  const variance = activeThicknesses.reduce((s, v) => s + (v - mean) ** 2, 0) / activeThicknesses.length;
  const sigma = Math.sqrt(variance);
  const uniformity = mean > 0 ? (sigma / mean) * 100 : 0;

  const newCumulativeThickness = cumulativeThickness + gpc;

  return {
    coverageA,
    coverageB,
    gpc,
    cumulativeThickness: newCumulativeThickness,
    thicknessMap,
    roughnessMap,
    riMap,
    uniformity,
    dieCount,
    dieGridCols: cols,
    dieGridRows: rows,
  };
}
