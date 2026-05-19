// equipment-monitor/src/lib/lens-sim/fluid-model.ts
import type { FluidState, SimulationParams } from './types';
import {
  BASE_CONTACT_ANGLE,
  MENISCUS_LENGTH_MM,
  WATER_COOLING_FRACTION,
  WATER_SURFACE_TENSION,
  WATER_VISCOSITY,
} from './constants';

/**
 * Compute immersion fluid state from simulation parameters.
 * Simplified Navier-Stokes and meniscus stability model.
 *
 * Synthetic/illustrative values.
 */
export function computeFluidState(
  params: SimulationParams,
  l1DeltaT: number,
): FluidState {
  // Flow velocity proportional to flow rate, inversely to gap cross-section
  const flowVelocity = params.fluidFlowRate / 2.0; // simplified: L/min -> ~m/s

  // Meniscus contact angle affected by flow rate (higher flow = better wetting)
  const flowFactor = Math.min(params.fluidFlowRate / 1.2, 1.5);
  const meniscusContactAngle = BASE_CONTACT_ANGLE / flowFactor;

  // Critical scan speed: v_crit = gamma * cos(theta) / (3 * mu * L)
  const thetaRad = (meniscusContactAngle * Math.PI) / 180;
  const criticalScanSpeed =
    (WATER_SURFACE_TENSION * Math.cos(thetaRad)) /
    (3 * WATER_VISCOSITY * (MENISCUS_LENGTH_MM / 1000)) * 1000; // convert to mm/s

  // Bubble probability: sigmoid above critical speed
  const speedRatio = params.scanSpeed / criticalScanSpeed;
  const bubbleProbability = 1 / (1 + Math.exp(-8 * (speedRatio - 1)));

  // Watermark risk: increases at low flow rates
  const watermarkRisk = Math.max(0, 1 - params.fluidFlowRate / 0.8) * 0.85;

  // Water temperature: absorbs heat from L1
  const heatAbsorbed = l1DeltaT * WATER_COOLING_FRACTION * params.coolingPower;
  const waterTemp = params.ambientTemp + heatAbsorbed * 0.3; // attenuated

  return {
    flowVelocity,
    meniscusContactAngle,
    criticalScanSpeed,
    bubbleProbability,
    watermarkRisk,
    waterTemp,
  };
}

/**
 * Compute per-die defect counts based on fluid state.
 * Edge dies (near scan-reversal zones) get more bubble/film-pull defects.
 * Random particle defects scattered uniformly.
 *
 * Returns deterministic values (seeded by die position) for reproducibility.
 */
export function computeDefectProbabilities(
  fluid: FluidState,
  params: SimulationParams,
  gridCols: number,
  gridRows: number,
): number[] {
  const dieCount = gridCols * gridRows;
  const defects = new Array<number>(dieCount);
  const cx = (gridCols - 1) / 2;
  const cy = (gridRows - 1) / 2;

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const idx = row * gridCols + col;
      const rx = Math.abs(col - cx) / cx; // 0=center, 1=edge
      const ry = Math.abs(row - cy) / cy;

      // Edge factor: scan reversal at left/right edges (x-direction)
      const edgeFactor = rx * rx;

      // Bubble defects: edge-concentrated, scaled by probability
      const bubbleDefects = fluid.bubbleProbability * edgeFactor * 3;

      // Watermark: more uniform, slight edge bias
      const watermarkDefects = fluid.watermarkRisk * (0.5 + 0.5 * Math.max(rx, ry));

      // Film-pull: only at extreme edges when speed > critical
      const filmPull = params.scanSpeed > fluid.criticalScanSpeed * 0.9 ? edgeFactor * 0.8 : 0;

      // Particle: uniform low-level background
      const particleBase = 0.05;

      defects[idx] = Math.max(0, bubbleDefects + watermarkDefects + filmPull + particleBase);
    }
  }

  return defects;
}
