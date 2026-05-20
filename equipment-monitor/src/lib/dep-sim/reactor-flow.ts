import type { SimulationParams, FlowState } from './types';
import {
  CHAMBER_VOLUME_L,
  KB_EV,
  O3_DECOMP_A,
  O3_DECOMP_EA,
} from './constants';

export function computeResidenceTime(totalFlowSccm: number): number {
  const flowLps = totalFlowSccm / 60;
  return CHAMBER_VOLUME_L / flowLps;
}

export function computeO3Fraction(tempC: number, residenceTime: number): number {
  const T = tempC + 273.15;
  const decompRate = O3_DECOMP_A * Math.exp(-O3_DECOMP_EA / (KB_EV * T));
  return Math.exp(-decompRate * residenceTime);
}

export function computePurgeEfficiency(purgeTime: number, residenceTime: number): number {
  const residual = Math.exp(-purgeTime / residenceTime);
  return 1 - residual;
}

export function computeFlowState(params: SimulationParams): FlowState {
  const totalFlow = params.bdeasFlowRate + params.o3FlowRate + params.carrierGasFlow;
  const residenceTime = computeResidenceTime(totalFlow);
  const effectiveO3Fraction = computeO3Fraction(params.pedestalTemp, residenceTime);
  const purgeEfficiency = computePurgeEfficiency(params.purgeTime, residenceTime);
  const residualFraction = 1 - purgeEfficiency;

  return { residenceTime, effectiveO3Fraction, purgeEfficiency, residualFraction };
}
