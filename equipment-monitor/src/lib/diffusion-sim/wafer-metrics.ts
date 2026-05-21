import type { SimulationParams, SolverState, DiffusionMetric, DopantSpecies } from './types';
import { DOPANT_DB, MASETTI_ELECTRONS, MASETTI_HOLES, ELECTRON_CHARGE } from './constants';
import { equilibriumInterstitials, equilibriumVacancies } from './point-defects';

/** Masetti mobility model (cm²/V·s) */
export function mobilityMasetti(C: number, isNtype: boolean): number {
  const p = isNtype ? MASETTI_ELECTRONS : MASETTI_HOLES;
  const mu = p.muMin + (p.muMax - p.muMin) / (1 + Math.pow(C / p.cRef, p.alpha))
    - p.mu1 / (1 + Math.pow(p.cRef2 / C, p.beta));
  return Math.max(10, mu);
}

/** Sheet resistance from active profile (Ω/□) */
export function sheetResistance(
  activeProfile: number[],
  species: DopantSpecies,
  binSize: number,
): number {
  const db = DOPANT_DB[species];
  const dx = binSize * 1e-7;
  let conductance = 0;

  for (let i = 0; i < activeProfile.length; i++) {
    const C = activeProfile[i];
    if (C <= 0) continue;
    const mu = mobilityMasetti(C, db.isNtype);
    conductance += ELECTRON_CHARGE * mu * C * dx;
  }

  return conductance > 0 ? 1 / conductance : 1e6;
}

/** Compute all 10 metrics from current solver state */
export function computeMetrics(
  state: SolverState,
  params: SimulationParams,
  binSize: number,
): Record<DiffusionMetric, number> {
  const N = state.dopantProfile.length;

  // Junction depth: deepest x where active > backgroundDoping
  let junctionDepth = 0;
  for (let i = N - 1; i >= 0; i--) {
    if (state.activeProfile[i] > params.backgroundDoping) {
      junctionDepth = (i + 1) * binSize;
      break;
    }
  }

  // Sheet resistance
  const Rs = sheetResistance(state.activeProfile, params.dopantSpecies, binSize);

  // Peak concentration
  const peakConcentration = Math.max(...state.activeProfile);

  // Thermal budget
  const thermalBudget = state.thermalBudget;

  // Activation fraction
  const totalDose = state.dopantProfile.reduce((s, c) => s + c, 0);
  const activeDose = state.activeProfile.reduce((s, c) => s + c, 0);
  const activationFraction = totalDose > 0 ? activeDose / totalDose : 1;

  // Interstitial supersaturation (peak)
  const cIeq = equilibriumInterstitials(state.temperature) * params.interstitialFactor;
  let maxSI = 0;
  for (let i = 0; i < N; i++) {
    const si = cIeq > 0 ? state.defects.interstitials[i] / cIeq : 1;
    if (si > maxSI) maxSI = si;
  }
  const interstitialSupersaturation = maxSI;

  // Profile abruptness (nm/decade at junction)
  let profileAbruptness = 50;
  if (junctionDepth > 0) {
    const jBin = Math.floor(junctionDepth / binSize);
    if (jBin > 0 && jBin < N) {
      const c1 = Math.max(1, state.activeProfile[jBin - 1]);
      const c2 = Math.max(1, state.activeProfile[Math.min(jBin + 1, N - 1)]);
      const logDiff = Math.abs(Math.log10(c1) - Math.log10(c2));
      if (logDiff > 0) {
        profileAbruptness = (2 * binSize) / logDiff;
      }
    }
  }

  // Segregation ratio
  const seg0 = state.dopantProfile[0] || 1;
  const segDeep = state.dopantProfile[Math.min(3, N - 1)] || 1;
  const segregationRatio = seg0 / segDeep;

  // Vacancy concentration (peak normalized)
  const cVeq = equilibriumVacancies(state.temperature) * params.vacancyFactor;
  let maxSV = 0;
  for (let i = 0; i < N; i++) {
    const sv = cVeq > 0 ? state.defects.vacancies[i] / cVeq : 1;
    if (sv > maxSV) maxSV = sv;
  }
  const vacancyConcentration = maxSV;

  // Diffusion length
  const diffusionLength = Math.sqrt(Math.max(0, thermalBudget)) * 1e7;

  return {
    junctionDepth,
    sheetResistance: Rs,
    peakConcentration,
    thermalBudget,
    activationFraction,
    interstitialSupersaturation,
    profileAbruptness,
    segregationRatio,
    vacancyConcentration,
    diffusionLength,
  };
}
