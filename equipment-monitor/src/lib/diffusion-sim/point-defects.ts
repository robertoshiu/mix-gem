import type { PointDefectState, AmbientGas } from './types';
import {
  BOLTZMANN_EV, C_EQUIL_PREFACTOR, E_FORM_V, E_FORM_I,
  E_RECOMBINATION, D_DEFECT_PREFACTOR, E_DEFECT_MIGRATION,
  E_311, TAU_311_0, K_OX_DRY, K_OX_WET, SI_LATTICE_SPACING,
  DEPTH_BINS,
} from './constants';

/** Equilibrium vacancy concentration at temperature T (°C) */
export function equilibriumVacancies(T_celsius: number): number {
  const T = T_celsius + 273.15;
  return C_EQUIL_PREFACTOR * Math.exp(-E_FORM_V / (BOLTZMANN_EV * T));
}

/** Equilibrium interstitial concentration at temperature T (°C) */
export function equilibriumInterstitials(T_celsius: number): number {
  const T = T_celsius + 273.15;
  return C_EQUIL_PREFACTOR * Math.exp(-E_FORM_I / (BOLTZMANN_EV * T));
}

/** IV recombination rate constant */
function recombinationRate(T_celsius: number): number {
  const T = T_celsius + 273.15;
  const D_eff = D_DEFECT_PREFACTOR * Math.exp(-E_DEFECT_MIGRATION / (BOLTZMANN_EV * T));
  return 4 * Math.PI * 2 * D_eff * (SI_LATTICE_SPACING * 1e-7) * Math.exp(-E_RECOMBINATION / (BOLTZMANN_EV * T));
}

/** {311} dissolution time constant (seconds) */
function tau311(T_celsius: number): number {
  const T = T_celsius + 273.15;
  return TAU_311_0 * Math.exp(E_311 / (BOLTZMANN_EV * T));
}

/** OED injection flux based on ambient gas */
function oedInjectionRate(T_celsius: number, ambient: AmbientGas): number {
  if (ambient === 'N2') return 0;
  const T = T_celsius + 273.15;
  const k = ambient === 'O2' ? K_OX_WET : K_OX_DRY;
  const oxRate = k * Math.exp(-1.24 / (BOLTZMANN_EV * T));
  return oxRate * C_EQUIL_PREFACTOR * 1e-4;
}

export function createPointDefectState(bins: number, implantDamage: number[]): PointDefectState {
  const vacancies = new Array(bins).fill(0);
  const interstitials = new Array(bins).fill(0);
  const defect311 = new Array(bins).fill(0);

  const cVeq = equilibriumVacancies(25);
  const cIeq = equilibriumInterstitials(25);
  for (let i = 0; i < bins; i++) {
    vacancies[i] = cVeq;
    interstitials[i] = cIeq;
    defect311[i] = implantDamage[i] ?? 0;
  }

  return { vacancies, interstitials, defect311 };
}

export function stepPointDefects(
  state: PointDefectState,
  T_celsius: number,
  dt: number,
  ambient: AmbientGas,
  binSize: number,
  interstitialFactor: number,
  vacancyFactor: number,
): void {
  const bins = state.vacancies.length;
  const cVeq = equilibriumVacancies(T_celsius) * vacancyFactor;
  const cIeq = equilibriumInterstitials(T_celsius) * interstitialFactor;
  const kIV = recombinationRate(T_celsius);
  const tau = tau311(T_celsius);
  const oedFlux = oedInjectionRate(T_celsius, ambient);

  for (let i = 0; i < bins; i++) {
    const release = state.defect311[i] * (1 - Math.exp(-dt / tau));
    state.defect311[i] -= release;
    state.interstitials[i] += release;

    const R = kIV * (state.interstitials[i] * state.vacancies[i] - cIeq * cVeq);
    const recomb = Math.min(R * dt, Math.min(state.interstitials[i], state.vacancies[i]) * 0.5);
    state.interstitials[i] -= recomb;
    state.vacancies[i] -= recomb;

    const relaxRate = 0.1 * dt;
    state.vacancies[i] += (cVeq - state.vacancies[i]) * Math.min(1, relaxRate);
    state.interstitials[i] += (cIeq - state.interstitials[i]) * Math.min(1, relaxRate);
  }

  if (oedFlux > 0) {
    state.interstitials[0] += oedFlux * dt;
  }

  for (let i = 0; i < bins; i++) {
    state.vacancies[i] = Math.max(0, state.vacancies[i]);
    state.interstitials[i] = Math.max(0, state.interstitials[i]);
    state.defect311[i] = Math.max(0, state.defect311[i]);
  }
}

export function getSuperSaturation(
  state: PointDefectState,
  T_celsius: number,
  interstitialFactor: number,
  vacancyFactor: number,
): { sI: number[]; sV: number[] } {
  const cVeq = equilibriumVacancies(T_celsius) * vacancyFactor;
  const cIeq = equilibriumInterstitials(T_celsius) * interstitialFactor;
  const bins = state.vacancies.length;
  const sI = new Array(bins);
  const sV = new Array(bins);
  for (let i = 0; i < bins; i++) {
    sI[i] = cIeq > 0 ? state.interstitials[i] / cIeq : 1;
    sV[i] = cVeq > 0 ? state.vacancies[i] / cVeq : 1;
  }
  return { sI, sV };
}
