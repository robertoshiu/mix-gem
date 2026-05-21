import type { DopantSpecies } from './types';
import { BOLTZMANN_EV, NI_PREFACTOR, NI_ACTIVATION, DOPANT_DB } from './constants';

/** Intrinsic carrier concentration n_i(T) in cm⁻³ */
export function intrinsicCarrier(T_celsius: number): number {
  const T = T_celsius + 273.15;
  return NI_PREFACTOR * Math.pow(T, 1.5) * Math.exp(-NI_ACTIVATION / (BOLTZMANN_EV * T));
}

/** Carrier concentrations from net doping and n_i via charge neutrality */
export function carrierConcentrations(
  netDoping: number,
  ni: number,
): { n: number; p: number } {
  const half = netDoping / 2;
  const n = half + Math.sqrt(half * half + ni * ni);
  const p = ni * ni / n;
  return { n, p };
}

/** Compute Arrhenius diffusivity: D = D0 * exp(-Ea/kT) */
function arrhenius(d0: number, ea: number, T_kelvin: number): number {
  if (d0 === 0) return 0;
  return d0 * Math.exp(-ea / (BOLTZMANN_EV * T_kelvin));
}

/**
 * Effective dopant diffusivity D_eff at a single depth bin.
 * Combines interstitial and vacancy mechanisms with charge-state weighting.
 */
export function effectiveDiffusivity(
  species: DopantSpecies,
  T_celsius: number,
  ni: number,
  n: number,
  p: number,
  sI: number,
  sV: number,
): number {
  const T = T_celsius + 273.15;
  const db = DOPANT_DB[species];

  const ratioN = ni > 0 ? n / ni : 1;
  const ratioP = ni > 0 ? p / ni : 1;

  let dI = 0;
  dI += arrhenius(db.dI[0].d0, db.dI[0].ea, T);
  dI += arrhenius(db.dI[1].d0, db.dI[1].ea, T) * ratioP;
  dI += arrhenius(db.dI[2].d0, db.dI[2].ea, T) * ratioN;
  dI += arrhenius(db.dI[3].d0, db.dI[3].ea, T) * ratioN * ratioN;
  dI *= sI;

  let dV = 0;
  dV += arrhenius(db.dV[0].d0, db.dV[0].ea, T);
  dV += arrhenius(db.dV[1].d0, db.dV[1].ea, T) * ratioP;
  dV += arrhenius(db.dV[2].d0, db.dV[2].ea, T) * ratioN;
  dV += arrhenius(db.dV[3].d0, db.dV[3].ea, T) * ratioN * ratioN;
  dV *= sV;

  return dI + dV;
}

/** Solid solubility at temperature T (°C) */
export function solidSolubility(species: DopantSpecies, T_celsius: number): number {
  const T = T_celsius + 273.15;
  const db = DOPANT_DB[species];
  return db.cSol0 * Math.exp(-db.eSol / (BOLTZMANN_EV * T));
}

/** Active fraction of dopant: saturating activation model */
export function activeFraction(
  C_total: number,
  species: DopantSpecies,
  T_celsius: number,
): number {
  const cSol = solidSolubility(species, T_celsius);
  if (C_total <= 0) return 0;
  const active = cSol * (1 - Math.exp(-C_total / cSol));
  return Math.min(1, active / C_total);
}

/** Compute active and clustered concentrations */
export function activeConcentration(
  C_total: number,
  species: DopantSpecies,
  T_celsius: number,
): { active: number; clustered: number } {
  const cSol = solidSolubility(species, T_celsius);
  const active = cSol * (1 - Math.exp(-C_total / cSol));
  const clamped = Math.min(C_total, active);
  return { active: clamped, clustered: C_total - clamped };
}
