import { DEPTH_BINS } from './constants';

export interface DamageState {
  /** Normalized vacancy density per bin (0-1 scale, 1 = amorphization threshold) */
  vacancies: number[];
  /** Absolute vacancy count per bin for concentration calculation */
  vacancyCounts: number[];
  /** Total Frenkel pairs created */
  totalFrenkelPairs: number;
}

/**
 * Create fresh damage state.
 */
export function createDamageState(bins: number = DEPTH_BINS): DamageState {
  return {
    vacancies: new Array(bins).fill(0),
    vacancyCounts: new Array(bins).fill(0),
    totalFrenkelPairs: 0,
  };
}

/**
 * Record lattice damage at a specific depth.
 */
export function recordDamage(
  state: DamageState,
  depthNm: number,
  binSize: number,
  count: number,
  threshold: number,
): void {
  const bin = Math.floor(depthNm / binSize);
  if (bin < 0 || bin >= state.vacancies.length) return;

  state.vacancies[bin] += count / Math.max(1, threshold * 100);
  state.vacancyCounts[bin] += count;
  state.totalFrenkelPairs += count;
}

/**
 * Apply temperature-dependent annealing (Frenkel pair recombination).
 */
export function applyAnnealing(
  state: DamageState,
  temperatureC: number,
  annealRate: number,
): void {
  if (annealRate <= 0) return;

  const tempK = temperatureC + 273.15;
  const kB_eV = 8.617e-5;
  const Ea = 0.3;

  const rate = annealRate * Math.exp(-Ea / (kB_eV * tempK));

  for (let i = 0; i < state.vacancies.length; i++) {
    if (state.vacancies[i] > 0) {
      const reduction = state.vacancies[i] * rate * 0.1;
      state.vacancies[i] = Math.max(0, state.vacancies[i] - reduction);
    }
  }
}

/**
 * Check if a depth bin is amorphous (vacancy density exceeds threshold).
 */
export function isAmorphous(state: DamageState, bin: number): boolean {
  if (bin < 0 || bin >= state.vacancies.length) return false;
  return state.vacancies[bin] >= 1.0;
}

/**
 * Get the amorphous map (boolean per bin).
 */
export function getAmorphousMap(state: DamageState): boolean[] {
  return state.vacancies.map(v => v >= 1.0);
}

/**
 * Initialize a pre-amorphized layer (for PAI preset).
 */
export function initializePAI(
  state: DamageState,
  amorphousDepthNm: number,
  binSize: number,
): void {
  const bins = Math.floor(amorphousDepthNm / binSize);
  for (let i = 0; i < Math.min(bins, state.vacancies.length); i++) {
    state.vacancies[i] = 1.5;
    state.vacancyCounts[i] = 1000;
  }
}

/**
 * Get peak vacancy density (normalized) and its depth bin.
 */
export function peakDamage(state: DamageState): { peakValue: number; peakBin: number } {
  let maxVal = 0;
  let maxBin = 0;
  for (let i = 0; i < state.vacancies.length; i++) {
    if (state.vacancies[i] > maxVal) {
      maxVal = state.vacancies[i];
      maxBin = i;
    }
  }
  return { peakValue: maxVal, peakBin: maxBin };
}
