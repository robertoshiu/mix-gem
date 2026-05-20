import type { SimulationParams } from './types';
import { ETCH_ACTIVATION_ENERGY, KB_EV, ETCH_REF_TEMP, BASE_SELECTIVITY, BASE_ROUGHNESS } from './constants';

export function computeThermalEtchRate(baseRate: number, params: SimulationParams): number {
  const T = params.chuckTemp + 273.15;
  const Tref = ETCH_REF_TEMP + 273.15;
  const factor = Math.exp(ETCH_ACTIVATION_ENERGY / KB_EV * (1 / Tref - 1 / T));
  return baseRate * factor;
}

export function computeSelectivity(params: SimulationParams, ionEnergy: number): number {
  const tempFactor = 1 - (params.chuckTemp - ETCH_REF_TEMP) * 0.02;
  const energyFactor = 1 - Math.max(0, (ionEnergy - 100) * 0.001);
  return BASE_SELECTIVITY * Math.max(0.3, tempFactor) * Math.max(0.3, energyFactor);
}

export function computeRoughness(ionEnergy: number, chuckTemp: number): number {
  const ionContribution = ionEnergy * 0.002;
  const tempContribution = Math.max(0, (chuckTemp - ETCH_REF_TEMP) * 0.01);
  return BASE_ROUGHNESS + ionContribution + tempContribution;
}
