import type { ThermalRegime } from './types';
import {
  ALD_WINDOW_HIGH,
  ALD_WINDOW_LOW,
  KB_EV,
  SURFACE_A,
  SURFACE_EA,
  T_REF,
} from './constants';

export function classifyRegime(tempC: number): ThermalRegime {
  if (tempC < ALD_WINDOW_LOW) return 'condensation';
  if (tempC > ALD_WINDOW_HIGH) return 'decomposition';
  return 'ald-window';
}

export function arrheniusRate(tempC: number): number {
  const T = tempC + 273.15;
  return SURFACE_A * Math.exp(-SURFACE_EA / (KB_EV * T));
}

export function gpcThermalFactor(tempC: number): number {
  const regime = classifyRegime(tempC);

  if (regime === 'ald-window') {
    const rateRatio = arrheniusRate(tempC) / arrheniusRate(T_REF);
    return 0.85 + 0.15 * Math.min(rateRatio, 2.0);
  }

  if (regime === 'condensation') {
    const deficit = ALD_WINDOW_LOW - tempC;
    return Math.max(0.2, 1.0 - deficit * 0.008);
  }

  // Decomposition
  const excess = tempC - ALD_WINDOW_HIGH;
  return 1.0 + excess * 0.008;
}
