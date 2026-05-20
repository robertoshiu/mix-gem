import type { SimulationParams } from './types';
import { ION_THERMAL_EV } from './constants';

export interface SheathState {
  sheathPotential: number;
  ionEnergy: number;
  ionAngle: number;
}

export function computeSheathState(params: SimulationParams): SheathState {
  const pRatio = params.biasPower > 0 ? params.icpPower / params.biasPower : 0;
  const sheathPotential = params.biasPower * (1 + pRatio * 0.1);
  const ionEnergy = sheathPotential;
  const ratio = ionEnergy > 0 ? ION_THERMAL_EV / ionEnergy : 1;
  const ionAngle = Math.atan(Math.sqrt(ratio)) * (180 / Math.PI);
  return { sheathPotential, ionEnergy, ionAngle };
}
