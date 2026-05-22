import { BOLTZMANN_EV } from './constants';

/**
 * Kao correction factor for oxidation rate.
 * sigma_n: normal stress at interface (MPa, negative = compressive)
 * T_celsius: temperature
 * volume: activation volume (nm^3) — KAO_VA for B/A, KAO_VD for B
 * Returns multiplicative factor (< 1 for compressive, > 1 for tensile)
 */
export function kaoCorrection(sigma_n_MPa: number, T_celsius: number, volume_nm3: number): number {
  if (sigma_n_MPa === 0) return 1;
  const T = T_celsius + 273.15;
  const kT = BOLTZMANN_EV * T; // eV
  // Convert: sigma (MPa) * volume (nm^3) -> eV
  // 1 MPa * 1 nm^3 = 1e6 Pa * 1e-27 m^3 = 1e-21 J = 6.242e-3 eV
  const sigmaV_eV = sigma_n_MPa * volume_nm3 * 6.242e-3;
  return Math.exp(sigmaV_eV / kT);
}

/**
 * Compute bird's beak length from oxide thickness array.
 * maskEdgeIdx: radial index where nitride mask edge is.
 * Returns distance (in node units) where thickness drops below 50% of field value.
 */
export function computeBirdBeakLength(oxideThicknesses: number[], maskEdgeIdx: number): number {
  if (maskEdgeIdx <= 0 || maskEdgeIdx >= oxideThicknesses.length) return 0;
  const fieldThickness = oxideThicknesses[0];
  if (fieldThickness <= 0) return 0;
  const threshold = fieldThickness * 0.5;

  let bbLength = 0;
  for (let i = maskEdgeIdx; i < oxideThicknesses.length; i++) {
    if (oxideThicknesses[i] < threshold) {
      bbLength = i - maskEdgeIdx;
      break;
    }
  }
  return bbLength;
}
