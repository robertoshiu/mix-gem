import {
  ECD_EA,
  BATH_T_REF,
  KB_EV,
  ANNEAL_RS_FACTOR,
  BASE_ROUGHNESS,
  ROUGHNESS_PER_DEGREE,
} from './constants';

export function computePlatingRateFactor(bathTempC: number): number {
  const T = bathTempC + 273.15;
  const Tref = BATH_T_REF + 273.15;
  return Math.exp((-ECD_EA / KB_EV) * (1 / T - 1 / Tref));
}

export function computeAnnealFactor(progress: number): number {
  const p = Math.max(0, Math.min(1, progress));
  return 1.0 + (ANNEAL_RS_FACTOR - 1.0) * p;
}

export function computeRoughness(bathTempC: number): number {
  const tempExcess = Math.max(0, bathTempC - BATH_T_REF);
  return BASE_ROUGHNESS + tempExcess * ROUGHNESS_PER_DEGREE;
}
