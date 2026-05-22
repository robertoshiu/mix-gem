/**
 * stress-model.ts — Viscoelastic Stress with CTE Mismatch
 *
 * Computes mechanical stresses in the Si/SiO2 system during thermal oxidation:
 * 1. Thermal stress from CTE mismatch between Si and SiO2
 * 2. Compressive stress from 2.2x volume expansion (Si → SiO2)
 * 3. Viscoelastic relaxation via temperature-dependent viscosity
 * 4. Geometry-dependent stress concentration (STI trench corners)
 */
import type { FEAMesh, MaterialType } from './types';
import {
  MATERIAL_PROPS,
  MISMATCH_STRAIN,
  VISCOSITY_PREFACTOR,
  VISCOSITY_ACTIVATION,
  BOLTZMANN_EV,
  T_AMBIENT,
} from './constants';

// ─── Thermal Stress (CTE Mismatch) ───

/**
 * CTE mismatch stress between two materials (MPa).
 * sigma = E_eff * (CTE1 - CTE2) * (T_current - T_ref)
 * Uses average Young's modulus of the two materials.
 */
export function thermalStress(
  mat1: MaterialType,
  mat2: MaterialType,
  T_ref: number,
  T_current: number,
): number {
  const dT = T_current - T_ref;
  if (dT === 0) return 0;

  const p1 = MATERIAL_PROPS[mat1];
  const p2 = MATERIAL_PROPS[mat2];

  // Average Young's modulus (GPa → MPa: multiply by 1000)
  const E_eff = ((p1.youngsE + p2.youngsE) / 2) * 1000;

  // CTE difference
  const dCTE = p1.cte - p2.cte;

  return E_eff * dCTE * dT;
}

// ─── Volume Expansion Stress ───

/**
 * Compressive stress from Si → SiO2 volume expansion (2.2x).
 * Returns negative value (compressive) for positive oxide growth.
 * sigma = -E_SiO2 * MISMATCH_STRAIN * (newOxideNm / (newOxideNm + 100))
 * The saturation term (newOxideNm + 100) prevents unbounded stress for thick oxides.
 */
export function volumeExpansionStress(newOxideNm: number, T_celsius: number): number {
  if (newOxideNm <= 0) return 0;

  const E_SiO2 = MATERIAL_PROPS.SiO2.youngsE * 1000; // GPa → MPa
  // Saturation factor: stress builds up but saturates for thick oxides
  const saturation = newOxideNm / (newOxideNm + 100);

  return -E_SiO2 * MISMATCH_STRAIN * saturation;
}

// ─── Viscous Relaxation ───

/**
 * Exponential stress relaxation with temperature-dependent viscosity.
 * eta = VISCOSITY_PREFACTOR * exp(VISCOSITY_ACTIVATION / (kB * T_K))
 * tau = eta / E_SiO2
 * stress_new = stress * exp(-dt / tau)
 *
 * Higher temperature → lower viscosity → faster relaxation.
 */
export function viscousRelaxation(stress: number, T_celsius: number, dt: number): number {
  if (stress === 0 || dt <= 0) return stress;

  const T_K = T_celsius + 273.15;
  const kT = BOLTZMANN_EV * T_K; // eV

  // Viscosity — Arrhenius (units consistent with MPa stress scale)
  const eta = VISCOSITY_PREFACTOR * Math.exp(VISCOSITY_ACTIVATION / kT);

  // Relaxation time (s) — E in MPa to match stress units
  const E_SiO2_MPa = MATERIAL_PROPS.SiO2.youngsE * 1000; // GPa → MPa
  const tau = eta / E_SiO2_MPa;

  // Exponential decay
  return stress * Math.exp(-dt / tau);
}

// ─── Compute Stress Field ───

/**
 * Update all mesh node stresses in-place.
 * For each node:
 *   1. Thermal stress from Si/SiO2 CTE mismatch based on node temperature
 *   2. Volume expansion stress for surface nodes (z-index = 0)
 *   3. Viscous relaxation using node temperature
 *   4. Geometry concentration factor for corner/edge nodes (STI)
 */
export function computeStressField(
  mesh: FEAMesh,
  oxideThickness: number[],
  dt: number,
): void {
  const { nr, nz } = mesh;

  // Compute average oxide thickness for volume expansion propagation
  const avgOxThickness = oxideThickness.length > 0
    ? oxideThickness.reduce((a, b) => a + b, 0) / oxideThickness.length
    : 0;

  for (let iz = 0; iz < nz; iz++) {
    for (let ir = 0; ir < nr; ir++) {
      const idx = iz * nr + ir;
      const node = mesh.nodes[idx];

      // 1. Thermal stress from CTE mismatch (elastic — always present)
      const sigmaThermal = thermalStress('Si', 'SiO2', T_AMBIENT, node.T);

      // 2. Volume expansion stress
      let sigmaIntrinsic = node.stress; // carry forward previous intrinsic stress
      if (iz === 0 && ir < oxideThickness.length) {
        // Surface nodes get full volume expansion stress
        sigmaIntrinsic += volumeExpansionStress(oxideThickness[ir], node.T);
      } else if (avgOxThickness > 0) {
        // Subsurface nodes receive attenuated volume expansion stress
        // (oxide growth strain propagates into bulk, decaying with depth)
        const depthDecay = Math.exp(-node.z / 500); // characteristic length ~500nm
        sigmaIntrinsic += volumeExpansionStress(avgOxThickness, node.T) * depthDecay;
      }

      // 3. Viscous relaxation — only applies to intrinsic (non-elastic) stress
      const relaxedIntrinsic = viscousRelaxation(sigmaIntrinsic, node.T, dt);

      // 4. Geometry stress concentration for STI trench corners
      const concentrationFactor = getStressConcentration(node.z, mesh);

      // Total stress: elastic thermal (unrelaxed) + relaxed intrinsic
      node.stress = (sigmaThermal + relaxedIntrinsic) * concentrationFactor;
    }
  }
}

/**
 * Stress concentration factor for geometry features.
 * Trench corners (z between trenchDepth*0.5 and trenchDepth*1.5) get 1.5-2x.
 * Flat surfaces get 1.0x.
 */
function getStressConcentration(z: number, mesh: FEAMesh): number {
  // Estimate trench depth from mesh extent
  // For STI meshes (nz=25), the trench region is in the upper portion
  // Default trench depth is 300nm (from DEFAULT_PARAMS)
  const maxZ = mesh.nodes[mesh.nodes.length - 1].z;

  // Only apply concentration if mesh has enough depth (STI-like)
  if (maxZ < 500) return 1.0;

  // Estimate trench depth as ~1/4 of total depth for STI
  const estimatedTrenchDepth = maxZ * 0.15;
  const cornerLow = estimatedTrenchDepth * 0.5;
  const cornerHigh = estimatedTrenchDepth * 1.5;

  if (z > cornerLow && z < cornerHigh) {
    // Peaked concentration factor: strongest at center of corner region
    const center = (cornerLow + cornerHigh) / 2;
    const halfWidth = (cornerHigh - cornerLow) / 2;
    const dist = Math.abs(z - center) / halfWidth;
    // Ranges from 2.0 at center to 1.5 at edges of corner region
    return 1.5 + 0.5 * (1 - dist);
  }

  return 1.0;
}
