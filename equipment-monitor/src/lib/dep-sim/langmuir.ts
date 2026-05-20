import type { SimulationParams } from './types';
import { K_BDEAS, K_O3 } from './constants';

/**
 * Langmuir adsorption isotherm.
 * theta = K * P * t / (1 + K * P * t)
 */
export function computeCoverage(K: number, P: number, t: number): number {
  const dose = K * P * t;
  if (dose <= 0) return 0;
  return dose / (1 + dose);
}

/**
 * Compute half-cycle coverages for BDEAS (A) and O3 (B).
 */
export function computeHalfCycleCoverages(params: SimulationParams): {
  coverageA: number;
  coverageB: number;
} {
  const totalFlow = params.bdeasFlowRate + params.o3FlowRate + params.carrierGasFlow;
  const pA = (params.bdeasFlowRate / totalFlow) * params.chamberPressure;
  const pB = (params.o3FlowRate / totalFlow) * params.chamberPressure;

  const coverageA = computeCoverage(K_BDEAS, pA, params.bdeasPulseTime);
  const coverageB = computeCoverage(K_O3, pB, params.o3PulseTime);

  return { coverageA, coverageB };
}
