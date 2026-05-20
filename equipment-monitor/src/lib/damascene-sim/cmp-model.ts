import type { SimulationParams } from './types';
import { PRESTON_K, DISHING_COEFF, BARRIER_THICKNESS } from './constants';

export function computeRemovalRate(params: SimulationParams): number {
  const dt = 0.5;
  return PRESTON_K * params.padPressure * params.padVelocity * dt;
}

export function computeDishing(params: SimulationParams, overpolishSteps: number): number {
  return DISHING_COEFF * params.trenchWidth * overpolishSteps;
}

export function applyCmpStep(
  currentThickness: number,
  params: SimulationParams,
  stepsInCmp: number,
): { thickness: number; dishing: number } {
  const removal = computeRemovalRate(params);
  const thickness = Math.max(currentThickness - removal, BARRIER_THICKNESS);

  const overpolishSteps = thickness <= BARRIER_THICKNESS + 5 ? stepsInCmp : 0;
  const dishing = computeDishing(params, overpolishSteps);

  return { thickness, dishing };
}
