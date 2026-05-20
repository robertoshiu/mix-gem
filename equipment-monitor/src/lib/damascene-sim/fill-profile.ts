import type { SimulationParams } from './types';
import {
  FILL_PROFILE_POINTS,
  SUPERFILL_THRESHOLD,
  VOID_THRESHOLD,
  FARADAY_EFFICIENCY,
  CU_MOLAR_MASS,
  CU_DENSITY,
  FARADAY_CONST,
  CU_VALENCE,
} from './constants';

export function computeFillProfile(fillLevel: number, _params: SimulationParams): number[] {
  return new Array(FILL_PROFILE_POINTS).fill(fillLevel);
}

export function computeFillFraction(profile: number[]): number {
  const sum = profile.reduce((s, v) => s + Math.min(v, 1), 0);
  return sum / profile.length;
}

export function advanceFillProfile(
  prevProfile: number[],
  params: SimulationParams,
  localCurrentDensity: number,
  stepCount: number,
): number[] {
  const n = prevProfile.length;
  const midpoint = (n - 1) / 2;
  const dt = 0.5;

  const baseRate = (localCurrentDensity * 1e-3 * CU_MOLAR_MASS * FARADAY_EFFICIENCY * dt)
    / (CU_VALENCE * FARADAY_CONST * CU_DENSITY) * 1e7;

  const rateNorm = baseRate / Math.max(params.trenchDepth, 1);
  const additive = Math.max(0, Math.min(1, params.additiveConc));

  const profile = new Array<number>(n);

  for (let i = 0; i < n; i++) {
    const distFromCenter = Math.abs(i - midpoint) / midpoint;

    let localEfficiency: number;

    if (additive >= SUPERFILL_THRESHOLD) {
      localEfficiency = 1.0 + (1 - distFromCenter) * additive * 1.5;
    } else if (additive >= VOID_THRESHOLD) {
      localEfficiency = 0.6 + 0.4 * additive;
    } else {
      localEfficiency = 0.3 + distFromCenter * (1 - additive) * 1.2;
    }

    const growth = rateNorm * localEfficiency;
    profile[i] = Math.min(prevProfile[i] + growth, 1.5);
  }

  return profile;
}
