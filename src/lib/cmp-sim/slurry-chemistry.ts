import type { SimulationParams } from './types';
import { RADIAL_NODES, ARRHENIUS_EA, KB_EV, AMBIENT_TEMP_C } from './constants';

export interface SlurryChemistryState {
  dissolutionRate: number;
  abrasiveProfile: number[];
  passivationThickness: number;
}

export function computeSlurryChemistry(
  params: SimulationParams,
  temperature: number,
): SlurryChemistryState {
  const T = temperature + 273.15;
  const Tref = AMBIENT_TEMP_C + 273.15;
  const arrheniusFactor = Math.exp(ARRHENIUS_EA / KB_EV * (1 / Tref - 1 / T));

  const ph = params.slurryPh;
  let chemFactor: number;
  if (ph <= 7) {
    chemFactor = Math.pow(10, -(ph - 2)) * 0.1;
  } else {
    chemFactor = Math.pow(10, -(12 - ph)) * 0.05;
  }

  const dissolutionRate = 10 * arrheniusFactor * Math.max(0.01, chemFactor);

  const C0 = params.abrasiveConc;
  const kDep = 0.5;
  const Q = params.slurryFlow;
  const abrasiveProfile = new Array(RADIAL_NODES).fill(0);
  for (let i = 0; i < RADIAL_NODES; i++) {
    const rNorm = i / (RADIAL_NODES - 1);
    const r_mm = rNorm * 150;
    abrasiveProfile[i] = C0 * Math.exp(-kDep * r_mm / Q);
  }

  let passivationThickness: number;
  if (ph <= 7) {
    passivationThickness = 2 + (7 - ph) * 0.5;
  } else {
    passivationThickness = 2 + (ph - 7) * 1.0;
  }

  return { dissolutionRate, abrasiveProfile, passivationThickness };
}
