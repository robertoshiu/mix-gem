import type { SimulationParams } from './types';
import {
  DIE_MASK, DIE_GRID_COLS, DIE_GRID_ROWS, ACTIVE_DIE_COUNT,
} from './constants';
import { computePlasmaState, computeIonFluxMap } from './plasma-model';
import { computeSheathState } from './sheath-model';
import { computeEtchProfile } from './etch-profile';
import { computeThermalEtchRate, computeSelectivity, computeRoughness } from './thermal-model';

export interface StepMetrics {
  electronDensity: number;
  ionFlux: number;
  ionEnergy: number;
  sheathPotential: number;
  etchProfile: number[];
  etchDepth: number;
  etchRate: number;
  selectivity: number;
  cdBias: number;
  profileAngle: number;
  etchRateMap: number[];
  uniformityMap: number[];
  cdBiasMap: number[];
  roughnessMap: number[];
  uniformity: number;
  dieCount: number;
  dieGridCols: number;
  dieGridRows: number;
}

export function computeStepMetrics(
  params: SimulationParams,
  _stepIndex: number,
  prevProfile: number[],
): StepMetrics {
  const plasma = computePlasmaState(params);
  const sheath = computeSheathState(params);
  const ionFluxMap = computeIonFluxMap(params);

  const baseEtchRate = plasma.ionFlux * 1e-13 * (0.5 + 0.5 * plasma.gasRatio);
  const etchRate = computeThermalEtchRate(baseEtchRate, params);

  const dt = 0.5;
  const profileResult = computeEtchProfile(
    prevProfile, plasma.gasRatio, sheath.ionAngle, sheath.ionEnergy,
    etchRate, dt, params,
  );

  const selectivity = computeSelectivity(params, sheath.ionEnergy);
  const cdBias = (90 - profileResult.profileAngle) * 0.5;

  const totalDies = DIE_GRID_COLS * DIE_GRID_ROWS;
  const etchRateMap = new Array(totalDies).fill(0);
  const uniformityMap = new Array(totalDies).fill(0);
  const cdBiasMap = new Array(totalDies).fill(0);
  const roughnessMap = new Array(totalDies).fill(0);

  const centerCol = (DIE_GRID_COLS - 1) / 2;
  const centerRow = (DIE_GRID_ROWS - 1) / 2;
  const maxR = Math.sqrt(centerCol ** 2 + centerRow ** 2);

  for (let i = 0; i < totalDies; i++) {
    if (!DIE_MASK[i]) continue;
    const col = i % DIE_GRID_COLS;
    const row = Math.floor(i / DIE_GRID_COLS);
    const r = Math.sqrt((col - centerCol) ** 2 + (row - centerRow) ** 2);
    const rNorm = r / maxR;

    const localFluxRatio = plasma.ionFlux > 0 ? ionFluxMap[i] / plasma.ionFlux : 1;
    etchRateMap[i] = etchRate * localFluxRatio;
    uniformityMap[i] = etchRate * localFluxRatio;
    cdBiasMap[i] = cdBias * (1 + rNorm * 0.2);
    roughnessMap[i] = computeRoughness(sheath.ionEnergy, params.chuckTemp) * (1 + rNorm * 0.1);
  }

  const activeRates = etchRateMap.filter((_, i) => DIE_MASK[i]);
  const mean = activeRates.reduce((s, v) => s + v, 0) / activeRates.length;
  const variance = activeRates.reduce((s, v) => s + (v - mean) ** 2, 0) / activeRates.length;
  const uniformity = mean > 0 ? (Math.sqrt(variance) / mean) * 100 : 0;

  return {
    electronDensity: plasma.electronDensity,
    ionFlux: plasma.ionFlux,
    ionEnergy: sheath.ionEnergy,
    sheathPotential: sheath.sheathPotential,
    etchProfile: profileResult.profile,
    etchDepth: profileResult.etchDepth,
    etchRate,
    selectivity,
    cdBias,
    profileAngle: profileResult.profileAngle,
    etchRateMap,
    uniformityMap,
    cdBiasMap,
    roughnessMap,
    uniformity,
    dieCount: ACTIVE_DIE_COUNT,
    dieGridCols: DIE_GRID_COLS,
    dieGridRows: DIE_GRID_ROWS,
  };
}
