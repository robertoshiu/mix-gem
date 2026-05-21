import type { SimulationParams } from './types';
import {
  RADIAL_NODES, WAFER_RADIUS_MM, SLURRY_VISCOSITY,
  PAD_GROOVE_POSITIONS,
} from './constants';

export interface ReynoldsFlowState {
  filmThickness: number[];
  fluidPressure: number[];
}

export function computeReynoldsFlow(params: SimulationParams): ReynoldsFlowState {
  const n = RADIAL_NODES;
  const dr = WAFER_RADIUS_MM / (n - 1);
  const mu = SLURRY_VISCOSITY;

  const omegaW = (params.waferRpm * 2 * Math.PI) / 60;
  const omegaP = (params.platenRpm * 2 * Math.PI) / 60;
  const omegaEff = omegaW + omegaP;

  const flowRatio = params.slurryFlow / 200;
  const rpmRatio = omegaEff / ((60 * 2 * Math.PI) / 60 * 2);
  const h0_um = 20 * Math.sqrt(flowRatio) * Math.max(0.1, Math.sqrt(rpmRatio));

  const filmThickness = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    const rNorm = i / (n - 1);
    const centrifugalFactor = 1 - 0.3 * rNorm * rNorm;
    filmThickness[i] = Math.max(1, h0_um * centrifugalFactor);

    for (const grooveR of PAD_GROOVE_POSITIONS) {
      const dist = Math.abs(rNorm - grooveR);
      if (dist < 0.05) {
        filmThickness[i] *= 1.5;
      }
    }
  }

  const fluidPressure = new Array(n).fill(0);
  const a = new Array(n).fill(0);
  const b = new Array(n).fill(0);
  const c = new Array(n).fill(0);
  const d = new Array(n).fill(0);

  for (let i = 1; i < n - 1; i++) {
    const r = (i * dr) / 1000;
    const h = filmThickness[i] * 1e-6;
    const h3 = h * h * h;

    const rMinus = ((i - 0.5) * dr) / 1000;
    const rPlus = ((i + 0.5) * dr) / 1000;
    const drM = dr / 1000;

    a[i] = rMinus * h3 / (drM * drM);
    c[i] = rPlus * h3 / (drM * drM);
    b[i] = -(a[i] + c[i]);
    d[i] = -6 * mu * omegaEff * r * h * 0.01;
  }

  b[0] = 1; d[0] = 0;
  b[n - 1] = 1; d[n - 1] = 0;

  for (const grooveR of PAD_GROOVE_POSITIONS) {
    const gi = Math.round(grooveR * (n - 1));
    if (gi > 0 && gi < n - 1) {
      a[gi] = 0; b[gi] = 1; c[gi] = 0; d[gi] = 0;
    }
  }

  const cp = new Array(n).fill(0);
  const dp = new Array(n).fill(0);
  cp[0] = c[0] / b[0];
  dp[0] = d[0] / b[0];
  for (let i = 1; i < n; i++) {
    const m = b[i] - a[i] * cp[i - 1];
    if (Math.abs(m) < 1e-30) { cp[i] = 0; dp[i] = 0; continue; }
    cp[i] = c[i] / m;
    dp[i] = (d[i] - a[i] * dp[i - 1]) / m;
  }

  fluidPressure[n - 1] = dp[n - 1];
  for (let i = n - 2; i >= 0; i--) {
    fluidPressure[i] = dp[i] - cp[i] * fluidPressure[i + 1];
  }

  for (let i = 0; i < n; i++) {
    fluidPressure[i] = Math.abs(fluidPressure[i]);
  }

  return { filmThickness, fluidPressure };
}
