// ─── Deal-Grove Linear-Parabolic Oxidation Model ───
//
// Implements the classic Deal-Grove model for thermal silicon oxidation:
//   x² + A·x = B·(t + τ)
//
// Where:
//   B/A = linear rate constant (surface-reaction limited, nm/s)
//   B   = parabolic rate constant (diffusion limited, nm²/s)
//   A   = B / (B/A) = crossover thickness (nm)
//   τ   = time offset for initial oxide: τ = (x₀² + A·x₀) / B
//
// Includes:
//   - 6 ambient types (dry, wet, N₂O, pyrogenic, HCl, HIBOX)
//   - 3 substrate orientations (100, 110, 111)
//   - Kao stress-dependent rate correction
//   - HCl doping enhancement
//   - HIBOX pressure scaling (linear B/A, quadratic B)

import type { OxidationType, SubstrateOrientation } from './types';
import {
  BOLTZMANN_EV,
  getDealGroveCoeffs,
  ORIENTATION_FACTOR,
  KAO_VA,
  KAO_VD,
} from './constants';

// ─── Conversion factor: σ(MPa) × V(nm³) → eV ───
const MPA_NM3_TO_EV = 6.242e-3;

/**
 * Compute the linear rate constant B/A (nm/s).
 *
 * B/A controls the thin-oxide (surface-reaction limited) growth regime.
 * Orientation-dependent via ORIENTATION_FACTOR.
 * Kao correction: exp(σ·Vₐ / kT) — compressive σ<0 retards growth.
 *
 * @param type        - Oxidation ambient
 * @param T_celsius   - Temperature in °C
 * @param orientation - Crystal orientation
 * @param stressN_MPa - Normal interface stress (MPa, negative = compressive)
 * @param kaoVa       - Activation volume override (nm³); 0 → use default KAO_VA
 */
export function computeBA(
  type: OxidationType,
  T_celsius: number,
  orientation: SubstrateOrientation,
  stressN_MPa: number,
  kaoVa: number,
): number {
  const c = getDealGroveCoeffs(type);
  const kT = BOLTZMANN_EV * (T_celsius + 273.15);

  let ba = c.baDivPrefactor * Math.exp(-c.baE / kT) * (ORIENTATION_FACTOR[orientation] ?? 1.0);

  // Kao stress feedback
  if (stressN_MPa !== 0) {
    const Va = kaoVa !== 0 ? kaoVa : KAO_VA;
    const sigma_eV = stressN_MPa * Va * MPA_NM3_TO_EV;
    ba *= Math.exp(sigma_eV / kT);
  }

  return ba;
}

/**
 * Compute the parabolic rate constant B (nm²/s).
 *
 * B controls the thick-oxide (diffusion limited) growth regime.
 * Orientation-independent.
 * Kao correction: exp(σ·V_d / kT).
 *
 * @param type        - Oxidation ambient
 * @param T_celsius   - Temperature in °C
 * @param stressN_MPa - Normal interface stress (MPa)
 * @param kaoVd       - Diffusion activation volume override (nm³); 0 → use default KAO_VD
 */
export function computeB(
  type: OxidationType,
  T_celsius: number,
  stressN_MPa: number,
  kaoVd: number,
): number {
  const c = getDealGroveCoeffs(type);
  const kT = BOLTZMANN_EV * (T_celsius + 273.15);

  let b = c.bPrefactor * Math.exp(-c.bE / kT);

  // Kao stress feedback
  if (stressN_MPa !== 0) {
    const Vd = kaoVd !== 0 ? kaoVd : KAO_VD;
    const sigma_eV = stressN_MPa * Vd * MPA_NM3_TO_EV;
    b *= Math.exp(sigma_eV / kT);
  }

  return b;
}

/**
 * Advance oxide thickness by dt seconds using the Deal-Grove quadratic solution.
 *
 * Solves:  x² + A·x = B·(dt + τ_eff)
 * where τ_eff = (x₀² + A·x₀) / B accounts for the initial oxide.
 *
 * Solution: x_new = (-A + √(A² + 4·B·(dt + τ_eff))) / 2
 *
 * @param x_current - Current oxide thickness (nm)
 * @param ba        - B/A linear rate constant (nm/s)
 * @param b         - B parabolic rate constant (nm²/s)
 * @param dt        - Time step (seconds)
 * @returns New oxide thickness (nm)
 */
export function advanceOxideThickness(
  x_current: number,
  ba: number,
  b: number,
  dt: number,
): number {
  if (ba <= 0 || b <= 0 || dt <= 0) return x_current;

  const A = b / ba;

  // Effective tau from initial oxide
  const tau_eff = (x_current * x_current + A * x_current) / b;

  // Quadratic solution
  const discriminant = A * A + 4 * b * (dt + tau_eff);
  if (discriminant < 0) return x_current;

  const x_new = (-A + Math.sqrt(discriminant)) / 2;
  return Math.max(x_new, x_current); // oxide only grows
}

/**
 * Adjust B/A for HCl doping enhancement.
 *
 * HCl gettering during oxidation increases the linear rate by clearing
 * metallic contaminants at the Si/SiO₂ interface.
 *
 * Enhancement: B/A_eff = B/A × (1 + 0.1 × hclPercent)
 *
 * @param ba         - Base B/A value (nm/s)
 * @param hclPercent - HCl concentration (%)
 */
export function adjustForHcl(ba: number, hclPercent: number): number {
  if (hclPercent <= 0) return ba;
  return ba * (1 + 0.1 * hclPercent);
}

/**
 * Adjust rate constants for HIBOX high-pressure oxidation.
 *
 * Henry's law: oxidant solubility ∝ pressure.
 *   - B/A scales linearly with pressure (surface reaction rate)
 *   - B scales quadratically with pressure (diffusion × solubility)
 *
 * @param value    - Base rate constant value
 * @param pressure - Total pressure (atm)
 * @param which    - Which constant: 'ba' (linear) or 'b' (quadratic)
 */
export function adjustForPressure(
  value: number,
  pressure: number,
  which: 'ba' | 'b',
): number {
  if (pressure <= 0) return value;
  if (which === 'ba') {
    return value * pressure;
  }
  // B scales as pressure² (Henry's law: C* ∝ P, and B ∝ D·C* → but effective B also has
  // solubility in both linear and parabolic terms, giving P² for the parabolic constant)
  return value * pressure * pressure;
}
