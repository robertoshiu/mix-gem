// src/lib/engines/coupling-matrix.ts
// Coupling Matrix — orchestrates HVAC, Gas, and Power engines with explicit Euler tick execution.
// All three engines run with the previous tick's coupled values (1-tick delay), avoiding circular dependency.
// After all three compute their next state, coupled outputs are collected and clamped.

import type { FacilitySimState, CoupledVariables } from './facility-types';
import { INITIAL_COUPLED } from './facility-constants';
import { createInitialHvacState, stepHvac, getHvacCoupledOutputs } from './hvac-engine';
import { createInitialGasState, stepGas, getGasCoupledOutputs } from './gas-engine';
import { createInitialPowerState, stepPower, getPowerCoupledOutputs } from './power-engine';

function clampCoupled(c: CoupledVariables): CoupledVariables {
  return {
    hvac_zone_cr_temp: Math.max(0, Math.min(80, c.hvac_zone_cr_temp)),
    hvac_ahu_flow: Math.max(0, Math.min(20, c.hvac_ahu_flow)),
    hvac_ahu_power_draw: Math.max(0, Math.min(100, c.hvac_ahu_power_draw)),
    hvac_pressure_diff: Math.max(-10, Math.min(50, c.hvac_pressure_diff)),
    gas_scrubber_power_draw: Math.max(0, Math.min(50, c.gas_scrubber_power_draw)),
    gas_total_leak_rate: Math.max(0, Math.min(1000, c.gas_total_leak_rate)),
    gas_scrubber_exhaust_temp: Math.max(20, Math.min(80, c.gas_scrubber_exhaust_temp)),
    power_voltage: Math.max(0, Math.min(260, c.power_voltage)),
    power_available: c.power_available,
    power_ups_active: c.power_ups_active,
  };
}

export function createInitialFacilityState(): FacilitySimState {
  return {
    hvac: createInitialHvacState(),
    gas: createInitialGasState(),
    power: createInitialPowerState(),
    coupled: { ...INITIAL_COUPLED },
    scenario: 'nominal',
    tick: 0,
    scenarioStartTick: 0,
  };
}

export function tickFacility(prev: FacilitySimState): FacilitySimState {
  const dt = 1;
  const { scenario, coupled } = prev;

  // All three engines run with previous tick's coupled values (explicit Euler)
  const nextHvac = stepHvac(prev.hvac, dt, coupled, scenario);
  const nextGas = stepGas(prev.gas, dt, coupled, scenario);
  const nextPower = stepPower(prev.power, dt, coupled, scenario);

  // Collect and clamp coupled outputs
  const hvacOut = getHvacCoupledOutputs(nextHvac);
  const gasOut = getGasCoupledOutputs(nextGas);
  const powerOut = getPowerCoupledOutputs(nextPower);

  const nextCoupled = clampCoupled({ ...hvacOut, ...gasOut, ...powerOut });

  return {
    hvac: nextHvac,
    gas: nextGas,
    power: nextPower,
    coupled: nextCoupled,
    scenario: prev.scenario,
    tick: prev.tick + 1,
    scenarioStartTick: prev.scenarioStartTick,
  };
}
