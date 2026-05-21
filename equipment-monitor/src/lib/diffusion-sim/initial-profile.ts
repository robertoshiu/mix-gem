import type { DopantSpecies } from './types';
import { DOPANT_DB } from './constants';

/**
 * Generate as-implanted Gaussian dopant profile with channeling tail.
 * Returns array of concentrations (cm⁻³) per depth bin.
 */
export function generateInitialProfile(
  species: DopantSpecies,
  dose: number,
  depth: number,
  bins: number,
  binSize: number,
): number[] {
  const db = DOPANT_DB[species];
  const Rp = depth;
  const dRp = Rp * db.straggleRatio;
  const dRpSafe = Math.max(dRp, binSize * 0.5);

  const peak = dose / (Math.sqrt(2 * Math.PI) * dRpSafe * 1e-7);

  const profile = new Array(bins);
  const lambdaCh = 0.3 * dRpSafe;
  const tailStart = 2 * Rp;

  for (let i = 0; i < bins; i++) {
    const x = (i + 0.5) * binSize;

    const gaussian = peak * Math.exp(-Math.pow(x - Rp, 2) / (2 * dRpSafe * dRpSafe));

    if (x > tailStart && lambdaCh > 0) {
      const tailPeak = peak * Math.exp(-Math.pow(tailStart - Rp, 2) / (2 * dRpSafe * dRpSafe));
      const tail = tailPeak * Math.exp(-(x - tailStart) / lambdaCh);
      profile[i] = Math.max(gaussian, tail);
    } else {
      profile[i] = gaussian;
    }
  }

  return profile;
}

/**
 * Generate initial implant damage (excess interstitials) for {311} defect storage.
 * "+1" model: each implanted ion creates approximately 1 excess interstitial.
 */
export function generateImplantDamage(
  profile: number[],
  species: DopantSpecies,
): number[] {
  const damageFactor = species === 'Ge' ? 2.0 : species === 'Sb' ? 1.5 : 1.0;
  return profile.map(c => c * damageFactor);
}
