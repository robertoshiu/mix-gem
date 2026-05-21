import type { SimulationParams } from './types';
import {
  RADIAL_NODES,
  ASPERITY_TIP_RADIUS_UM,
  ASPERITY_HEIGHT_STD_UM,
  COMPOSITE_MODULUS_MPA,
  PAD_RELAXATION_TIME_S,
  GW_SEPARATIONS,
} from './constants';

export interface ContactState {
  realContactArea: number;
  padCreepStrain: number;
  contactPressure: number[];
}

export interface GWLookupEntry {
  separation: number;
  contactArea: number;
  contactForce: number;
}

/**
 * Build Greenwood-Williamson lookup table.
 * Integrates asperity height distribution (Gaussian) to get
 * contact area fraction and contact force as a function of
 * mean separation d (in micrometers).
 *
 * Separation ranges from 0 to 4*sigma.
 * Contact area and force decrease monotonically with separation.
 */
export function buildGWLookup(params: SimulationParams): GWLookupEntry[] {
  const sigma = ASPERITY_HEIGHT_STD_UM;
  const R = ASPERITY_TIP_RADIUS_UM;
  const eta = params.asperityDensity; // per mm^2
  const etaPerUm2 = eta * 1e-6;

  const lookup: GWLookupEntry[] = [];

  const phi = (z: number) =>
    Math.exp(-0.5 * (z / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));

  for (let si = 0; si < GW_SEPARATIONS; si++) {
    const d = (si / (GW_SEPARATIONS - 1)) * 4 * sigma;

    const zMax = 6 * sigma;
    const steps = 100;
    const dz = (zMax - d) / steps;
    let integralArea = 0;
    let integralForce = 0;

    for (let j = 0; j <= steps; j++) {
      const z = d + j * dz;
      const delta = z - d;
      const w = j === 0 || j === steps ? 0.5 : 1;
      integralArea += w * delta * phi(z) * dz;
      integralForce += w * Math.pow(delta, 1.5) * phi(z) * dz;
    }

    const contactArea = Math.PI * etaPerUm2 * R * integralArea;
    const contactForce =
      (4 / 3) * etaPerUm2 * COMPOSITE_MODULUS_MPA * Math.sqrt(R) * integralForce;

    lookup.push({ separation: d, contactArea, contactForce });
  }

  return lookup;
}

function interpolateGW(
  lookup: GWLookupEntry[],
  separation: number,
): { contactArea: number; contactForce: number } {
  if (separation <= lookup[0].separation)
    return {
      contactArea: lookup[0].contactArea,
      contactForce: lookup[0].contactForce,
    };
  if (separation >= lookup[lookup.length - 1].separation)
    return { contactArea: 0, contactForce: 0 };

  for (let i = 0; i < lookup.length - 1; i++) {
    if (
      separation >= lookup[i].separation &&
      separation < lookup[i + 1].separation
    ) {
      const t =
        (separation - lookup[i].separation) /
        (lookup[i + 1].separation - lookup[i].separation);
      return {
        contactArea:
          lookup[i].contactArea +
          t * (lookup[i + 1].contactArea - lookup[i].contactArea),
        contactForce:
          lookup[i].contactForce +
          t * (lookup[i + 1].contactForce - lookup[i].contactForce),
      };
    }
  }
  return { contactArea: 0, contactForce: 0 };
}

/**
 * Find the equilibrium separation where the GW contact force
 * balances the applied pressure, using bisection on the lookup table.
 */
function findEquilibriumSeparation(
  lookup: GWLookupEntry[],
  targetPressure: number,
): number {
  const sigma = ASPERITY_HEIGHT_STD_UM;
  let lo = 0;
  let hi = 4 * sigma;

  // If pressure is higher than max contact force, separation is 0
  const maxForce = interpolateGW(lookup, 0).contactForce;
  if (targetPressure >= maxForce) return 0;
  // If pressure is ~0, separation is at max
  if (targetPressure <= 0) return hi;

  for (let iter = 0; iter < 50; iter++) {
    const mid = (lo + hi) / 2;
    const force = interpolateGW(lookup, mid).contactForce;
    if (force > targetPressure) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
}

/**
 * Compute the contact state for the CMP pad-wafer interface.
 *
 * Uses Greenwood-Williamson statistical asperity contact theory
 * combined with a standard linear solid (SLS) viscoelastic creep model.
 *
 * The applied down-force determines the equilibrium separation via
 * force balance against the GW contact force. Viscoelastic creep
 * reduces the effective separation over time (pad conforms to wafer).
 *
 * Film thickness variations across the wafer modulate local contact
 * (thicker film = less contact at that node).
 */
export function computeContactState(
  params: SimulationParams,
  filmThickness: number[],
  prevCreepStrain: number,
  timeSeconds: number,
): ContactState {
  const lookup = buildGWLookup(params);
  const tau = PAD_RELAXATION_TIME_S;
  const sigma = ASPERITY_HEIGHT_STD_UM;

  // Convert applied pressure: PSI -> MPa
  const appliedPressure_MPa = params.downForce * 0.006895;

  // Viscoelastic model: Standard Linear Solid (SLS)
  // Instantaneous elastic response + time-dependent creep
  // Total compliance: J(t) = 1/E_inf + (1/E_1)*(1 - exp(-t/tau))
  const instantaneousStrain = appliedPressure_MPa / params.padStiffness;
  const creepStrain =
    instantaneousStrain +
    (appliedPressure_MPa / params.padStiffness) *
      (1 - Math.exp(-timeSeconds / tau));

  // Creep deflection reduces effective separation (pad sinks toward wafer)
  // Pad thickness ~1mm, strain produces um-scale deflection
  const padThickness_um = 1000;
  const creepDeflection_um = creepStrain * padThickness_um;

  // Find equilibrium separation from force balance at nominal conditions
  // The applied pressure determines base separation
  const baseSeparation = findEquilibriumSeparation(lookup, appliedPressure_MPa);

  // Mean film thickness as reference
  const meanFilm =
    filmThickness.reduce((s, v) => s + v, 0) / filmThickness.length;

  const contactPressure = new Array(RADIAL_NODES).fill(0);
  let totalContactArea = 0;

  for (let i = 0; i < RADIAL_NODES; i++) {
    // Local separation: base + film variation (thicker film = larger gap)
    // Normalize film variation relative to mean
    const filmVariation = (filmThickness[i] - meanFilm) / (meanFilm || 1);
    const localSeparation = Math.max(
      0,
      baseSeparation + filmVariation * sigma - creepDeflection_um,
    );

    const gw = interpolateGW(lookup, localSeparation);
    totalContactArea += gw.contactArea;
    contactPressure[i] = gw.contactForce;
  }

  const realContactArea = totalContactArea / RADIAL_NODES;

  return {
    realContactArea,
    padCreepStrain: creepStrain,
    contactPressure,
  };
}
