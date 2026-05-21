import { COULOMB_CONST } from './constants';
import type { MaterialData } from './constants';
import { screeningLength } from './zbl-potential';

/**
 * Nuclear stopping power Sn(E) in eV/nm.
 *
 * Uses the ZBL universal nuclear stopping formula in reduced units,
 * then converts to eV/nm via material density.
 */
export function nuclearStopping(
  E_eV: number,
  Z1: number, M1: number,
  Z2: number, M2: number,
  density: number,
): number {
  if (E_eV <= 0) return 0;

  const a = screeningLength(Z1, Z2);

  // Reduced energy
  const epsilon = (a * M2 * E_eV) / (Z1 * Z2 * COULOMB_CONST * (M1 + M2));

  // ZBL universal reduced nuclear stopping
  let sn_reduced: number;
  if (epsilon <= 30) {
    sn_reduced =
      (0.5 * Math.log(1 + 1.1383 * epsilon)) /
      (epsilon + 0.01321 * Math.pow(epsilon, 0.21226) + 0.19593 * Math.pow(epsilon, 0.5));
  } else {
    sn_reduced = Math.log(epsilon) / (2 * epsilon);
  }

  const Sn_cross = sn_reduced * 0.08462 * Z1 * Z2 * M1 / ((M1 + M2) * (Math.pow(Z1, 0.23) + Math.pow(Z2, 0.23)));

  return Sn_cross * density;
}

/**
 * Electronic stopping power Se(E) in eV/nm.
 *
 * Lindhard-Scharff model: Se ∝ Z1^(1/6) * √E
 */
export function electronicStopping(
  E_eV: number,
  Z1: number, M1: number,
  Z2: number, M2: number,
  density: number,
): number {
  if (E_eV <= 0) return 0;

  const Z_sum_23 = Math.pow(Z1, 2 / 3) + Math.pow(Z2, 2 / 3);
  const k_LS =
    0.0793 *
    Math.pow(Z1, 1 / 6) *
    Math.sqrt(Z1 * Z2) /
    Math.pow(Z_sum_23, 1.5) *
    Math.sqrt(M1 / M2);

  const Se_cross = k_LS * Math.sqrt(E_eV / 1000) * 0.15;

  return Se_cross * density;
}

/**
 * Compute electronic energy loss over a flight path.
 */
export function computeElectronicLoss(
  E_eV: number,
  dx_nm: number,
  Z1: number, M1: number,
  material: MaterialData,
): number {
  const Se = electronicStopping(E_eV, Z1, M1, material.Z, material.M, material.density);
  return Se * dx_nm;
}

/**
 * Total stopping power (nuclear + electronic) in eV/nm.
 */
export function totalStopping(
  E_eV: number,
  Z1: number, M1: number,
  Z2: number, M2: number,
  density: number,
): number {
  return nuclearStopping(E_eV, Z1, M1, Z2, M2, density) +
         electronicStopping(E_eV, Z1, M1, Z2, M2, density);
}
