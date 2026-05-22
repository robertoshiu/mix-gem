import type { StepYield, YieldResult, YieldWaterfallPoint, YieldCurvePoint, ProcessStepId } from './types';
import { mulberry32 } from './constants';

export function computeStepYield(d0: number, area: number, alpha: number): number {
  if (d0 <= 0 || area <= 0) return 1;
  return Math.pow(1 + (d0 * area) / alpha, -alpha);
}

export function computeLineYield(
  steps: { stepId: ProcessStepId; d0: number }[],
  area: number,
  alpha: number,
): YieldResult {
  if (steps.length === 0) {
    return { perStep: [], lineYield: 1, worstStep: 'oxidation' };
  }
  const perStep: StepYield[] = steps.map(({ stepId, d0 }) => {
    const y = computeStepYield(d0, area, alpha);
    return { stepId, d0, yield: y, yieldLoss: 1 - y };
  });
  const lineYield = perStep.reduce((acc, s) => acc * s.yield, 1);
  let worstIdx = 0;
  for (let i = 1; i < perStep.length; i++) {
    if (perStep[i].yield < perStep[worstIdx].yield) worstIdx = i;
  }
  return { perStep, lineYield, worstStep: perStep[worstIdx].stepId };
}

export function generateYieldWaterfall(
  steps: { stepId: ProcessStepId; d0: number }[],
  area: number,
  alpha: number,
): YieldWaterfallPoint[] {
  let cumulative = 1;
  return steps.map(({ stepId, d0 }) => {
    cumulative *= computeStepYield(d0, area, alpha);
    return { stepId, cumulative };
  });
}

export function generateYieldCurve(
  area: number,
  alpha: number,
  d0Min: number,
  d0Max: number,
  points = 100,
): YieldCurvePoint[] {
  const step = (d0Max - d0Min) / Math.max(1, points - 1);
  return Array.from({ length: points }, (_, i) => {
    const d0 = d0Min + i * step;
    return { d0, yield: computeStepYield(d0, area, alpha) };
  });
}

export function generateForecastLots(
  steps: { stepId: ProcessStepId; d0: number }[],
  area: number,
  alpha: number,
  nLots: number,
  seed: number,
): number[] {
  const rng = mulberry32(seed);
  return Array.from({ length: nLots }, () => {
    let lotYield = 1;
    for (const { d0 } of steps) {
      const noise = (rng() - 0.5) * 0.1;
      const noisyD0 = d0 * (1 + noise);
      lotYield *= computeStepYield(noisyD0, area, alpha);
    }
    return lotYield;
  });
}
