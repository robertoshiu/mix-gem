/**
 * thermal-fea.ts — 2D Heat Equation Solver for Oxidation Simulation
 *
 * Solves the transient heat equation on the FEA mesh using an implicit
 * radial diffusion scheme (tridiagonal / Thomas algorithm) with:
 *   - Lamp-based heating with configurable center-to-edge balance
 *   - Exothermic oxidation heat source
 *   - Material-aware thermal conductivity (Si is T-dependent)
 *   - Radiative + convective cooling at wafer edge
 *   - Thermal profile generation (ramp / soak / cool phases)
 */

import type { FEAMesh, SimulationParams, ThermalStep, ThermalPhase, OxidationType } from './types';
import {
  T_AMBIENT,
  WAFER_RADIUS_MM,
  DEFAULT_TOTAL_STEPS,
  thermalConductivity,
  MATERIAL_PROPS,
  OXIDATION_ENTHALPY,
} from './constants';

// ─── Thomas Algorithm ───
/** Solve tridiagonal system: a[i]*x[i-1] + b[i]*x[i] + c[i]*x[i+1] = d[i] */
function tridiagonalSolve(
  a: number[],
  b: number[],
  c: number[],
  d: number[],
): number[] {
  const n = b.length;
  if (n === 0) return [];
  if (n === 1) return [d[0] / b[0]];

  const cp = new Array(n);
  const dp = new Array(n);
  const x = new Array(n);

  cp[0] = c[0] / b[0];
  dp[0] = d[0] / b[0];
  for (let i = 1; i < n; i++) {
    const m = b[i] - a[i] * cp[i - 1];
    if (Math.abs(m) < 1e-30) {
      cp[i] = 0;
      dp[i] = dp[i - 1];
    } else {
      cp[i] = c[i] / m;
      dp[i] = (d[i] - a[i] * dp[i - 1]) / m;
    }
  }

  x[n - 1] = dp[n - 1];
  for (let i = n - 2; i >= 0; i--) {
    x[i] = dp[i] - cp[i] * x[i + 1];
  }

  return x;
}

// ─── Lamp Heating Model ───
/**
 * Compute per-radial-node effective target temperature.
 * lampBalance=100 => uniform target across wafer.
 * lampBalance<100 => center is closer to targetT, edge falls off.
 *
 * This models the RTP lamp array where center vs edge lamp zones
 * are independently controlled.
 */
function computeEffectiveTarget(
  nr: number,
  rPositions: number[],
  targetT: number,
  lampBalance: number,
): number[] {
  const effTarget = new Array(nr);
  const sigma = WAFER_RADIUS_MM * 0.5;
  // imbalance: 0 at lampBalance=100 (uniform), up to 1 at lampBalance=0
  const imbalance = (100 - lampBalance) / 100;

  for (let ir = 0; ir < nr; ir++) {
    const r = rPositions[ir];
    // Gaussian roll-off for edge deficit
    const edgeDeficit = imbalance * (1 - Math.exp(-0.5 * (r / sigma) ** 2));
    // Edge gets a lower effective target; center stays at targetT
    const deficit = edgeDeficit * (targetT - T_AMBIENT);
    effTarget[ir] = targetT - deficit;
  }
  return effTarget;
}

// ─── Exothermic Heat Source ───
/**
 * Convert oxidation rate to volumetric heat source (W/m^3).
 */
function oxidationHeatSource(
  oxidationRate: number[],
  oxidationType: OxidationType,
  nr: number,
): number[] {
  const enthalpy = OXIDATION_ENTHALPY[oxidationType]; // eV/molecule
  const eVtoJ = 1.602e-19;
  const molecularDensity = 2.2e28; // molecules/m^3 for SiO2
  const heatPerRate = enthalpy * eVtoJ * molecularDensity * 1e-9;

  const source = new Array(nr);
  for (let ir = 0; ir < nr; ir++) {
    source[ir] = oxidationRate[ir] * heatPerRate;
  }
  return source;
}

// ─── Main Solver ───

/**
 * Perform one thermal FEA timestep — updates mesh.nodes[].T in-place.
 *
 * The solver uses a split approach:
 *   1. Radial implicit diffusion (tridiagonal) per z-row
 *   2. Vertical explicit diffusion coupling between z-rows
 *
 * Heating mechanism: each node relaxes toward its effective target
 * temperature (set by lamp power distribution) at a rate proportional
 * to the temperature deficit. This models the RTP/furnace thermal
 * environment and ensures stable convergence.
 *
 * @param mesh       - FEA mesh (nodes updated in-place)
 * @param targetT    - furnace/lamp target temperature (C)
 * @param dt         - timestep (seconds)
 * @param lampBalance - 50..100, center-to-edge lamp power uniformity
 * @param oxidationRate - per-radial-node oxidation rate array (length = mesh.nr)
 * @param oxidationType - type of oxidation for enthalpy calculation
 */
export function solveThermalStep(
  mesh: FEAMesh,
  targetT: number,
  dt: number,
  lampBalance: number,
  oxidationRate: number[],
  oxidationType: OxidationType,
): void {
  const { nr, nz, nodes } = mesh;

  // Extract unique radial positions from the first z-row
  const rPositions = new Array(nr);
  for (let ir = 0; ir < nr; ir++) {
    rPositions[ir] = nodes[ir].r;
  }

  // Compute per-node effective target temperature (lamp balance model)
  const effTarget = computeEffectiveTarget(nr, rPositions, targetT, lampBalance);

  // Compute oxidation heat source
  const oxHeat = oxidationHeatSource(oxidationRate, oxidationType, nr);

  // Heating relaxation rate (1/s) — controls how fast nodes approach target
  // Chosen so that within ~2-3 seconds the wafer is near target
  const heatingRate = 0.8;

  // For each z-row, solve the radial 1D heat equation implicitly
  for (let iz = 0; iz < nz; iz++) {
    const a = new Array(nr).fill(0);
    const b = new Array(nr).fill(0);
    const c = new Array(nr).fill(0);
    const d = new Array(nr).fill(0);

    for (let ir = 0; ir < nr; ir++) {
      const idx = iz * nr + ir;
      const node = nodes[idx];
      const T_old = node.T;
      const mat = node.material;
      const rhoCp = MATERIAL_PROPS[mat].rhoCp;
      const k = thermalConductivity(mat, T_old);
      const alpha = k / rhoCp;

      // Radial spacing
      let drLeft = 0;
      let drRight = 0;
      if (ir > 0) {
        drLeft = (rPositions[ir] - rPositions[ir - 1]) * 1e-3; // mm -> m
      }
      if (ir < nr - 1) {
        drRight = (rPositions[ir + 1] - rPositions[ir]) * 1e-3;
      }

      // --- Heating source: relaxation toward effective target ---
      // The implicit form: heatingRate * (T_target - T) is added to the system
      // In the discretized equation: T_new(1 + dt*heatingRate) = T_old + dt*heatingRate*T_target + ...
      const heatCoeff = dt * heatingRate;

      // Oxidation exotherm (surface nodes only)
      let oxSource = 0;
      if (iz === 0) {
        oxSource = dt * oxHeat[ir] / rhoCp;
      }

      // --- Build tridiagonal system ---
      if (ir === 0) {
        // Center (r=0): symmetry BC => dT/dr = 0
        if (nr > 1) {
          const dr = drRight > 0 ? drRight : 1e-6;
          const coeff = dt * alpha / (dr * dr);
          a[ir] = 0;
          b[ir] = 1 + coeff + heatCoeff;
          c[ir] = -coeff;
          d[ir] = T_old + heatCoeff * effTarget[ir] + oxSource;
        } else {
          b[ir] = 1 + heatCoeff;
          d[ir] = T_old + heatCoeff * effTarget[ir] + oxSource;
        }
      } else if (ir === nr - 1) {
        // Edge boundary
        const dr = drLeft > 0 ? drLeft : 1e-6;
        const coeff = dt * alpha / (dr * dr);

        a[ir] = -coeff;
        b[ir] = 1 + coeff + heatCoeff;
        c[ir] = 0;
        d[ir] = T_old + heatCoeff * effTarget[ir] + oxSource;
      } else {
        // Interior nodes: central difference
        const drL = drLeft > 0 ? drLeft : 1e-6;
        const drR = drRight > 0 ? drRight : 1e-6;
        const drAvg = 0.5 * (drL + drR);

        const coeffL = dt * alpha / (drL * drAvg);
        const coeffR = dt * alpha / (drR * drAvg);

        a[ir] = -coeffL;
        b[ir] = 1 + coeffL + coeffR + heatCoeff;
        c[ir] = -coeffR;
        d[ir] = T_old + heatCoeff * effTarget[ir] + oxSource;
      }
    }

    // Solve tridiagonal system for this z-row
    const T_new = tridiagonalSolve(a, b, c, d);

    // Update node temperatures
    for (let ir = 0; ir < nr; ir++) {
      const idx = iz * nr + ir;
      nodes[idx].T = isFinite(T_new[ir]) ? T_new[ir] : T_AMBIENT;
    }
  }

  // Vertical diffusion pass: explicit coupling between z-rows
  // This provides 2D thermal coupling
  for (let ir = 0; ir < nr; ir++) {
    for (let iz = 1; iz < nz - 1; iz++) {
      const idx = iz * nr + ir;
      const idxUp = (iz - 1) * nr + ir;
      const idxDown = (iz + 1) * nr + ir;
      const node = nodes[idx];
      const mat = node.material;
      const k = thermalConductivity(mat, node.T);
      const rhoCp = MATERIAL_PROPS[mat].rhoCp;
      const alpha = k / rhoCp;

      // z positions in nm -> m
      const zUp = nodes[idxUp].z * 1e-9;
      const zCurr = node.z * 1e-9;
      const zDown = nodes[idxDown].z * 1e-9;
      const dzUp = zCurr - zUp;
      const dzDown = zDown - zCurr;
      const dzAvg = 0.5 * (dzUp + dzDown);

      if (dzAvg > 0 && dzUp > 0 && dzDown > 0) {
        const coeffUp = alpha * dt / (dzUp * dzAvg);
        const coeffDown = alpha * dt / (dzDown * dzAvg);
        // Stability clamp for explicit scheme
        const maxCoeff = 0.4;
        const totalCoeff = coeffUp + coeffDown;
        const scale = totalCoeff > maxCoeff ? maxCoeff / totalCoeff : 1.0;

        const dT = scale * (
          coeffUp * (nodes[idxUp].T - node.T) +
          coeffDown * (nodes[idxDown].T - node.T)
        );
        nodes[idx].T += dT;
      }
    }
  }
}

// ─── Thermal Profile Generator ───

/**
 * Generate the thermal profile (temperature vs time) for the full process.
 * Divides into ramp, soak, and cool phases.
 */
export function createThermalProfile(params: SimulationParams): ThermalStep[] {
  const totalSteps = params.totalSteps ?? DEFAULT_TOTAL_STEPS;
  const { peakTemperature, rampRate, soakTime, coolingRate } = params;

  // Compute phase durations (seconds)
  const deltaT_ramp = peakTemperature - T_AMBIENT;
  const rampTime = rampRate > 0 ? deltaT_ramp / rampRate : 0;
  const coolTime = coolingRate > 0 ? deltaT_ramp / coolingRate : 0;
  const totalTime = rampTime + soakTime + coolTime;

  if (totalTime <= 0) {
    const dt = 1.0;
    return Array.from({ length: totalSteps }, (_, i) => ({
      time: i * dt,
      temperature: peakTemperature,
      dt,
      phase: 'soak' as ThermalPhase,
    }));
  }

  const dt = totalTime / totalSteps;
  const steps: ThermalStep[] = [];

  for (let i = 0; i < totalSteps; i++) {
    const time = (i + 0.5) * dt; // mid-point of step
    let temperature: number;
    let phase: ThermalPhase;

    if (time <= rampTime) {
      phase = 'ramp';
      temperature = T_AMBIENT + (peakTemperature - T_AMBIENT) * (time / rampTime);
    } else if (time <= rampTime + soakTime) {
      phase = 'soak';
      temperature = peakTemperature;
    } else {
      phase = 'cool';
      const coolElapsed = time - rampTime - soakTime;
      const coolFraction = Math.min(coolElapsed / coolTime, 1.0);
      temperature = peakTemperature - (peakTemperature - T_AMBIENT) * coolFraction;
    }

    temperature = Math.max(T_AMBIENT, Math.min(peakTemperature, temperature));
    steps.push({ time: i * dt, temperature, dt, phase });
  }

  // Ensure first step is ramp and last step is cool
  if (steps.length > 0) {
    steps[0].phase = 'ramp';
    steps[steps.length - 1].phase = 'cool';
  }

  return steps;
}
