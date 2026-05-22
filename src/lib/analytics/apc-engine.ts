import type { EwmaState, ApcConfig, DriftConfig, ApcRunResult, ResidualStats } from './types';
import { mulberry32 } from './constants';

export function createController(config: ApcConfig): EwmaState {
  return { level: config.target, slope: 0, correction: 0, forecast: config.target };
}

export function stepController(
  state: EwmaState,
  measurement: number,
  config: ApcConfig,
): { newState: EwmaState; correction: number } {
  const { lambda, lambdaSlope, target } = config;
  const newLevel = lambda * measurement + (1 - lambda) * (state.level + state.slope);
  const newSlope = lambdaSlope === 0
    ? 0
    : lambdaSlope * (newLevel - state.level) + (1 - lambdaSlope) * state.slope;
  const forecast = newLevel + newSlope;
  const correction = target - forecast;
  return {
    newState: { level: newLevel, slope: newSlope, correction, forecast },
    correction,
  };
}

export function generateDrift(config: DriftConfig, runIndex: number): number {
  switch (config.type) {
    case 'none':
      return 0;
    case 'linear':
      return (config.slope ?? 0) * runIndex;
    case 'sinusoidal':
      return (config.amplitude ?? 0) * Math.sin((2 * Math.PI * runIndex) / (config.period ?? 20));
    case 'step-shift':
      return runIndex >= (config.triggerRun ?? 25) ? (config.magnitude ?? 0) : 0;
    case 'mixed':
      return (config.slope ?? 0.2) * runIndex
        + (config.amplitude ?? 3) * Math.sin((2 * Math.PI * runIndex) / (config.period ?? 30));
    default:
      return 0;
  }
}

function gaussianNoise(rng: () => number): number {
  const u1 = rng();
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1 || 1e-10)) * Math.cos(2 * Math.PI * u2);
}

export function simulateRuns(
  config: ApcConfig,
  driftConfig: DriftConfig,
  nRuns: number,
  seed: number,
): ApcRunResult[] {
  const rng = mulberry32(seed);
  let state = createController(config);
  const results: ApcRunResult[] = [];
  for (let i = 0; i < nRuns; i++) {
    const drift = generateDrift(driftConfig, i);
    const noise = gaussianNoise(rng) * config.noise;
    const uncontrolled = config.target + drift + noise;
    const controlled = config.target + drift + noise + state.correction;
    const { newState } = stepController(state, controlled, config);
    state = newState;
    results.push({
      run: i,
      controlled,
      uncontrolled,
      ewmaLevel: state.level,
      ewmaSlope: state.slope,
      correction: state.correction,
      drift,
    });
  }
  return results;
}

export function computeResidualStats(controlled: number[], target: number): ResidualStats {
  const residuals = controlled.map((v) => v - target);
  const n = residuals.length;
  const mean = residuals.reduce((s, v) => s + v, 0) / (n || 1);
  const variance = residuals.reduce((s, v) => s + (v - mean) ** 2, 0) / (n || 1);
  const std = Math.sqrt(variance);
  const usl = 3 * std;
  const lsl = -3 * std;
  const cpk = std === 0 ? Infinity : Math.min((usl - mean) / (3 * std), (mean - lsl) / (3 * std));
  const binCount = 20;
  const min = Math.min(...residuals);
  const max = Math.max(...residuals);
  const range = max - min || 1;
  const binWidth = range / binCount;
  const histogram = Array.from({ length: binCount }, (_, i) => ({
    bin: min + (i + 0.5) * binWidth,
    count: 0,
  }));
  for (const r of residuals) {
    const idx = Math.min(Math.floor((r - min) / binWidth), binCount - 1);
    histogram[idx].count++;
  }
  return { mean, std, cpk, histogram };
}
