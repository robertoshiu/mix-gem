import type { SimulationParams } from './types';
import { RADIAL_NODES, WAFER_RADIUS_MM } from './constants';

export interface PrestonRemovalState {
  removalRateProfile: number[];
  meanRemovalRate: number;
  dishingFactor: number;
  erosionFactor: number;
}

export function computePrestonRemoval(
  params: SimulationParams,
  contactPressure: number[],
  fluidPressure: number[],
  kp: number,
): PrestonRemovalState {
  const n = RADIAL_NODES;
  const removalRateProfile = new Array(n).fill(0);

  const omegaW = (params.waferRpm * 2 * Math.PI) / 60;
  const omegaP = (params.platenRpm * 2 * Math.PI) / 60;
  const omegaEff = omegaW + omegaP;

  const density = params.patternDensity / 100;
  const winklerFactor = 1 / Math.max(0.1, density);
  const dishingFactor = (1 - density) * winklerFactor * 0.1;
  const erosionFactor = density * 0.05;

  for (let i = 0; i < n; i++) {
    const rNorm = i / (n - 1);
    const r_m = (rNorm * WAFER_RADIUS_MM) / 1000;

    const V = r_m * omegaEff;
    const P_total = contactPressure[i] + fluidPressure[i] * 0.1;

    const P_dyne = P_total * 10;
    const V_cm = V * 100;
    const mrr_cm_s = kp * P_dyne * V_cm;
    const mrr_nm_min = mrr_cm_s * 1e7 * 60;

    removalRateProfile[i] = Math.max(0, mrr_nm_min);
  }

  const activeRates = removalRateProfile.slice(1);
  const meanRemovalRate = activeRates.length > 0
    ? activeRates.reduce((s, v) => s + v, 0) / activeRates.length
    : 0;

  return {
    removalRateProfile,
    meanRemovalRate,
    dishingFactor,
    erosionFactor,
  };
}
