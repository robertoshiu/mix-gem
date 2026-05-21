import { ZBL_A, ZBL_B, BOHR_RADIUS_NM, COULOMB_CONST } from './constants';

/**
 * ZBL universal screening function φ(x).
 * φ(0) = 1 (unscreened Coulomb at r→0), φ→0 as x→∞.
 */
export function screeningFunction(x: number): number {
  let sum = 0;
  for (let i = 0; i < 4; i++) {
    sum += ZBL_A[i] * Math.exp(-ZBL_B[i] * x);
  }
  return sum;
}

/**
 * ZBL screening length a(Z1, Z2) in nm.
 */
export function screeningLength(Z1: number, Z2: number): number {
  return (0.8854 * BOHR_RADIUS_NM) / (Math.pow(Z1, 0.23) + Math.pow(Z2, 0.23));
}

/**
 * Compute scattering outcome for a single binary collision.
 *
 * Uses the ZBL "magic formula" approximation for the scattering angle
 * in the center-of-mass frame, then transforms to lab frame.
 */
export function computeCollision(
  E_eV: number,
  p_nm: number,
  Z1: number,
  Z2: number,
  M1: number,
  M2: number,
): { theta: number; T_eV: number } {
  const a = screeningLength(Z1, Z2);

  // Reduced energy: ε = a·M₂·E / (Z₁·Z₂·e²·(M₁+M₂))
  const epsilon = (a * M2 * E_eV) / (Z1 * Z2 * COULOMB_CONST * (M1 + M2));

  // Reduced impact parameter
  const b = p_nm / a;

  // CM scattering angle via magic formula approximation
  const A = 2 * epsilon * b;
  const exponent = 0.5 + 0.3535 * Math.sqrt(A);
  const theta_cm = Math.PI / (1 + Math.pow(Math.max(A, 1e-10), exponent));

  // Energy transfer (exact for elastic collision)
  const T_max = (4 * M1 * M2) / ((M1 + M2) ** 2) * E_eV;
  const T_eV = T_max * Math.pow(Math.sin(theta_cm / 2), 2);

  // Lab-frame scattering angle for projectile
  const sinCM = Math.sin(theta_cm);
  const cosCM = Math.cos(theta_cm);
  const theta_lab = Math.atan2(sinCM, cosCM + M1 / M2);

  return { theta: Math.abs(theta_lab), T_eV };
}
