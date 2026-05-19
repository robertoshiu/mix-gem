// equipment-monitor/src/lib/lens-sim/sellmeier.ts
import { SILICA_DN_DT, WATER_DN_DT, WATER_N_193 } from './constants';

/**
 * Fused silica dn/dT at 193nm.
 * Simplified: constant over small temperature range near 22.5C.
 * Real Sellmeier would be wavelength-dependent, but at fixed 193nm this is sufficient.
 */
export function silicaDnDt(_temperatureC: number): number {
  return SILICA_DN_DT;
}

/**
 * Water dn/dT at 193nm. Negative value.
 */
export function waterDnDt(_temperatureC: number): number {
  return WATER_DN_DT;
}

/**
 * Water refractive index at 193nm as function of temperature.
 * Linear model: n(T) = n_base + dn/dT * (T - T_ref)
 */
export function waterRefractiveIndex(temperatureC: number): number {
  const deltaT = temperatureC - 22.5;
  return WATER_N_193 + WATER_DN_DT * deltaT;
}
