// equipment-monitor/src/lib/lens-sim/thermal-model.ts
import type { LensElementState, SimulationParams } from './types';
import {
  DELTA_T_MAX_BASE,
  ELEMENT_THICKNESS_MM,
  LENS_COUNT,
  SILICA_DN_DT,
  THERMAL_TAU,
  WATER_COOLING_FRACTION,
} from './constants';

/**
 * Compute lens element temperatures at a given elapsed time.
 *
 * Model: T(t) = T_ambient + dT_max_eff * (1 - e^(-t/tau))
 * where dT_max_eff scales with dose (vs default 30) and inversely with cooling.
 *
 * All values synthetic/illustrative.
 */
export function computeLensTemperatures(
  params: SimulationParams,
  elapsedSeconds: number,
): LensElementState[] {
  const doseScale = params.dose / 30; // normalized to default 30 mJ/cm2

  return Array.from({ length: LENS_COUNT }, (_, i) => {
    // Effective cooling: L1 gets extra cooling from immersion water
    const waterCooling = i === 0 ? WATER_COOLING_FRACTION * params.coolingPower : 0;
    const effectiveCooling = params.coolingPower * (1 - (i === 0 ? 0 : 0)) + waterCooling;
    // dT_max reduced by cooling: at cooling=1, base value; at cooling=0, ~1/(1-waterCooling) higher
    const coolingFactor = 1 / (0.3 + 0.7 * (i === 0 ? effectiveCooling : params.coolingPower));
    const deltaTMax = DELTA_T_MAX_BASE[i] * doseScale * coolingFactor;

    const tau = THERMAL_TAU[i];
    const deltaT = deltaTMax * (1 - Math.exp(-elapsedSeconds / tau));
    const temperature = params.ambientTemp + deltaT;

    // Optical path length change: dOPL = dn/dT * dT * thickness (mm->nm via *1e6)
    const deltaOPL = SILICA_DN_DT * deltaT * ELEMENT_THICKNESS_MM[i] * 1e6;

    return { index: i, temperature, deltaT, deltaOPL };
  });
}
