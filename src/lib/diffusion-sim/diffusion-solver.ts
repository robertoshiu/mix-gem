import type { SimulationParams, ThermalStep, SolverState } from './types';
import { DEPTH_BINS, DOPANT_DB } from './constants';
import { createPointDefectState, stepPointDefects, getSuperSaturation } from './point-defects';
import { intrinsicCarrier, carrierConcentrations, effectiveDiffusivity, activeConcentration } from './diffusivity';
import { generateInitialProfile, generateImplantDamage } from './initial-profile';
import { estimateMaxDepth } from './constants';

/** Thomas algorithm for tridiagonal system: a[i]*x[i-1] + b[i]*x[i] + c[i]*x[i+1] = d[i] */
export function tridiagonalSolve(
  a: number[],
  b: number[],
  c: number[],
  d: number[],
): number[] {
  const n = b.length;
  const cp = new Array(n);
  const dp = new Array(n);
  const x = new Array(n);

  cp[0] = c[0] / b[0];
  dp[0] = d[0] / b[0];
  for (let i = 1; i < n; i++) {
    const m = b[i] - a[i] * cp[i - 1];
    cp[i] = c[i] / m;
    dp[i] = (d[i] - a[i] * dp[i - 1]) / m;
  }

  x[n - 1] = dp[n - 1];
  for (let i = n - 2; i >= 0; i--) {
    x[i] = dp[i] - cp[i] * x[i + 1];
  }

  return x;
}

/** Create initial solver state from simulation parameters */
export function createSolverState(params: SimulationParams): SolverState {
  const maxDepth = estimateMaxDepth(params.dopantSpecies, params.initialDepth);
  const binSize = maxDepth / DEPTH_BINS;

  const dopantProfile = generateInitialProfile(
    params.dopantSpecies,
    params.initialDose,
    params.initialDepth,
    DEPTH_BINS,
    binSize,
  );

  const implantDamage = generateImplantDamage(dopantProfile, params.dopantSpecies);
  const defects = createPointDefectState(DEPTH_BINS, implantDamage);

  const activeProfile = new Array(DEPTH_BINS);
  const clusteredProfile = new Array(DEPTH_BINS);
  for (let i = 0; i < DEPTH_BINS; i++) {
    const { active, clustered } = activeConcentration(dopantProfile[i], params.dopantSpecies, 25);
    activeProfile[i] = active;
    clusteredProfile[i] = clustered;
  }

  const ni = intrinsicCarrier(25);
  const db = DOPANT_DB[params.dopantSpecies];
  const carrierProfile = new Array(DEPTH_BINS);
  for (let i = 0; i < DEPTH_BINS; i++) {
    const netDoping = db.isNtype ? activeProfile[i] - params.backgroundDoping : params.backgroundDoping - activeProfile[i];
    const { n } = carrierConcentrations(netDoping, ni);
    carrierProfile[i] = n;
  }

  return {
    dopantProfile,
    activeProfile,
    clusteredProfile,
    defects,
    carrierProfile,
    temperature: 25,
    time: 0,
    thermalBudget: 0,
  };
}

/** Solve one diffusion timestep using Crank-Nicolson */
export function solveDiffusionStep(
  state: SolverState,
  thermalStep: ThermalStep,
  params: SimulationParams,
  binSize: number,
): void {
  const N = DEPTH_BINS;
  const dt = thermalStep.dt;
  const T = thermalStep.temperature;
  const dx = binSize * 1e-7;

  state.temperature = T;
  state.time += dt;

  stepPointDefects(
    state.defects, T, dt, params.ambientGas, binSize,
    params.interstitialFactor, params.vacancyFactor,
  );

  const { sI, sV } = getSuperSaturation(
    state.defects, T,
    params.interstitialFactor, params.vacancyFactor,
  );

  const ni = intrinsicCarrier(T);
  const db = DOPANT_DB[params.dopantSpecies];
  const D = new Array(N);
  for (let i = 0; i < N; i++) {
    const netDoping = db.isNtype
      ? state.activeProfile[i] - params.backgroundDoping
      : params.backgroundDoping - state.activeProfile[i];
    const { n, p } = carrierConcentrations(netDoping, ni);
    state.carrierProfile[i] = db.isNtype ? n : p;

    const Tlocal = thermalStep.tempProfile[i] ?? T;
    D[i] = effectiveDiffusivity(
      params.dopantSpecies, Tlocal, ni, n, p,
      sI[i] ?? 1, sV[i] ?? 1,
    );
  }

  const avgD = D.reduce((s, d) => s + d, 0) / N;
  state.thermalBudget += avgD * dt;

  const a = new Array(N).fill(0);
  const b = new Array(N).fill(0);
  const c = new Array(N).fill(0);
  const d = new Array(N).fill(0);

  for (let i = 0; i < N; i++) {
    const Dleft = i > 0 ? 0.5 * (D[i] + D[i - 1]) : D[i];
    const Dright = i < N - 1 ? 0.5 * (D[i] + D[i + 1]) : D[i];

    const rL = Dleft * dt / (2 * dx * dx);
    const rR = Dright * dt / (2 * dx * dx);

    a[i] = -rL;
    c[i] = -rR;
    b[i] = 1 + rL + rR;

    const Ci = state.dopantProfile[i];
    const Cleft = i > 0 ? state.dopantProfile[i - 1] : Ci;
    const Cright = i < N - 1 ? state.dopantProfile[i + 1] : Ci;

    d[i] = Ci + rL * (Cleft - Ci) + rR * (Cright - Ci);
  }

  if (params.screenOxideThickness > 0 && N > 1) {
    const m = db.segregationCoeff;
    const kSeg = 0.01 * dt;
    const flux = kSeg * (state.dopantProfile[0] - state.dopantProfile[1] / m);
    d[0] -= flux;
  }

  const newProfile = tridiagonalSolve(a, b, c, d);

  for (let i = 0; i < N; i++) {
    state.dopantProfile[i] = Math.max(0, newProfile[i]);
    const Tlocal = thermalStep.tempProfile[i] ?? T;
    const { active, clustered } = activeConcentration(
      state.dopantProfile[i], params.dopantSpecies, Tlocal,
    );
    state.activeProfile[i] = active;
    state.clusteredProfile[i] = clustered;
  }
}
