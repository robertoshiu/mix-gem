import type { SimulationParams } from './types';
import {
  FRICTION_COEFF, THERMAL_MASS, AMBIENT_TEMP_C,
  ARRHENIUS_EA, KB_EV, WAFER_RADIUS_MM,
} from './constants';

export interface ThermalState {
  temperature: number;
  frictionalPower: number;
  arrheniusFactor: number;
}

export function computeThermalState(
  params: SimulationParams,
  timeSeconds: number,
): ThermalState {
  const r_m = WAFER_RADIUS_MM / 1000;
  const area_m2 = Math.PI * r_m * r_m;
  const F_N = params.downForce * 6894.76 * area_m2;

  const omegaW = (params.waferRpm * 2 * Math.PI) / 60;
  const omegaP = (params.platenRpm * 2 * Math.PI) / 60;
  const rAvg = (2 / 3) * r_m;
  const V_avg = rAvg * (omegaW + omegaP);

  const frictionalPower = FRICTION_COEFF * F_N * V_avg;

  const tau_thermal = THERMAL_MASS / Math.max(1, frictionalPower * 0.1);
  const deltaT = (frictionalPower / THERMAL_MASS) * 20 *
    (1 - Math.exp(-timeSeconds / Math.max(1, tau_thermal)));
  const temperature = Math.min(75, AMBIENT_TEMP_C + deltaT);

  const T_K = temperature + 273.15;
  const Tref_K = AMBIENT_TEMP_C + 273.15;
  const arrheniusFactor = Math.exp(ARRHENIUS_EA / KB_EV * (1 / Tref_K - 1 / T_K));

  return { temperature, frictionalPower, arrheniusFactor };
}
