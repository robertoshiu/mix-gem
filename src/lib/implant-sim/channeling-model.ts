import { COULOMB_CONST, CHANNEL_DB, ION_DB } from './constants';
import type { IonSpecies, CrystalOrientation } from './types';

/**
 * Lindhard critical angle for axial channeling (radians).
 *
 * ψ_c = sqrt(2 * Z1 * Z2 * e² / (E * d))
 * where d is the atomic row spacing for the given crystal orientation.
 */
export function criticalAngle(
  E_eV: number,
  Z1: number,
  Z2: number,
  orientation: CrystalOrientation,
): number {
  if (E_eV <= 0) return Math.PI;
  const d = CHANNEL_DB[orientation].rowSpacing;
  return Math.sqrt((2 * Z1 * Z2 * COULOMB_CONST) / (E_eV * d));
}

/**
 * Compute the angle between beam direction and channel axis.
 */
export function angleToChannel(
  tiltDeg: number,
  twistDeg: number,
  orientation: CrystalOrientation,
): number {
  const tiltRad = (tiltDeg * Math.PI) / 180;

  switch (orientation) {
    case '100':
      return tiltRad;
    case '110':
      return Math.abs(tiltRad - Math.PI / 4);
    case '111':
      return Math.abs(tiltRad - (54.7 * Math.PI) / 180);
  }
}

/**
 * Determine if an ion can enter channeling at given conditions.
 */
export function canChannel(
  E_eV: number,
  species: IonSpecies,
  tiltDeg: number,
  twistDeg: number,
  orientation: CrystalOrientation,
  isAmorphous: boolean,
): boolean {
  if (isAmorphous) return false;

  const ion = ION_DB[species];
  const psi_c = criticalAngle(E_eV, ion.Z, 14, orientation);
  const angle = angleToChannel(tiltDeg, twistDeg, orientation);

  return angle < psi_c;
}

/**
 * Compute dechanneling probability per step.
 */
export function dechannelingProbability(
  temperatureC: number,
  damageNormalized: number,
  depthFraction: number,
): number {
  const debyeTemp = 645;
  const tempK = temperatureC + 273.15;

  const thermal = 0.015 * Math.sqrt(tempK / debyeTemp);
  const damage = Math.min(0.5, damageNormalized * 0.3);
  const depth = 0.005 * depthFraction;

  return Math.min(1, thermal + damage + depth);
}
