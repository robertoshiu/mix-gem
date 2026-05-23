// src/lib/engines/gas-engine.ts
// Gas & Chemical Delivery Engine — 8 sensors, 3 subsystems, Gaussian plume diffusion
// Pure functions, no side effects, no randomness.

import type {
  GasEngineState,
  GasSensorState,
  ScrubberState,
  CoupledVariables,
  FacilityScenarioId,
  FacilityAlarm,
  GasSpecies,
} from './facility-types';

import {
  GAS_SENSOR_CONFIGS,
  GAS_BASELINES,
  SENSOR_TAU_S,
  SENSOR_DRIFT_PER_S,
  DIFFUSION_COEFF,
  SCRUBBER_ETA_MAX,
  SCRUBBER_FLOW_MAX,
  SCRUBBER_POWER_BASE,
  SCRUBBER_POWER_K,
  CABINET_PRESSURE_PA,
  LEAK_RATE_K,
  LEAK_TEMP_ALPHA,
  INITIAL_SCRUBBER,
} from './facility-constants';

// ── Helpers ──

/** Clamp a value to [lo, hi] */
function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Deep-clone sensors array */
function cloneSensors(sensors: GasSensorState[]): GasSensorState[] {
  return sensors.map(s => ({ ...s }));
}

/** Clone scrubber state */
function cloneScrubber(s: ScrubberState): ScrubberState {
  return { ...s };
}

// ── Public API ──

/**
 * Create the initial gas engine state with 8 sensors and a scrubber.
 */
export function createInitialGasState(): GasEngineState {
  const sensors: GasSensorState[] = GAS_SENSOR_CONFIGS.map(cfg => ({
    ...cfg,
    concentration: GAS_BASELINES[cfg.species],
    concentrationActual: GAS_BASELINES[cfg.species],
    status: 'normal' as const,
    drift: 0,
  }));

  return {
    sensors,
    scrubber: { ...INITIAL_SCRUBBER },
    cabinetPressure: CABINET_PRESSURE_PA,
    leakRateMultiplier: 1,
  };
}

/**
 * Advance the gas engine state by dt seconds.
 *
 * Physics per tick:
 * - Cabinet micro-leak model produces source term Q (mol/s)
 * - Gaussian plume diffusion from cabinet to each sensor
 * - Scrubber removal reduces downstream concentration
 * - Airflow dilution from HVAC AHU
 * - O2 displacement from total non-O2 gas concentration
 * - First-order sensor lag with drift
 * - Scenario overrides for chemical-leak and scrubber-failure
 */
export function stepGas(
  prev: GasEngineState,
  dt: number,
  coupled: CoupledVariables,
  scenario: FacilityScenarioId,
): GasEngineState {
  const sensors = cloneSensors(prev.sensors);
  const scrubber = cloneScrubber(prev.scrubber);
  let leakRateMultiplier = prev.leakRateMultiplier;
  const cabinetPressure = prev.cabinetPressure;

  // ── Scenario overrides ──
  if (scenario === 'chemical-leak') {
    leakRateMultiplier = 50;
  } else {
    leakRateMultiplier = 1;
  }

  if (scenario === 'scrubber-failure') {
    scrubber.efficiency = 0;
    scrubber.online = false;
  } else {
    scrubber.online = true;
    // Scrubber efficiency degrades with flow: eta = eta_max * (1 - flow/flow_max)
    scrubber.efficiency = SCRUBBER_ETA_MAX * (1 - scrubber.inletFlow / SCRUBBER_FLOW_MAX);
    scrubber.efficiency = clamp(scrubber.efficiency, 0, SCRUBBER_ETA_MAX);
  }

  // Scrubber power draw: P = P_base + k * flow^2
  scrubber.powerDraw = scrubber.online
    ? SCRUBBER_POWER_BASE + SCRUBBER_POWER_K * scrubber.inletFlow * scrubber.inletFlow
    : 0;

  // ── Temperature from HVAC coupling ──
  const temp = coupled.hvac_zone_cr_temp;
  const ahuFlow = coupled.hvac_ahu_flow;

  // ── Compute leak rate per species ──
  // Micro-leak: leak = LEAK_RATE_K * cabinetPressure * (1 + LEAK_TEMP_ALPHA * max(0, temp - 22)) * leakMultiplier
  const tempFactor = 1 + LEAK_TEMP_ALPHA * Math.max(0, temp - 22);
  const baseLeak = LEAK_RATE_K * cabinetPressure * tempFactor * leakRateMultiplier;

  // ── Effective turbulent diffusion coefficient ──
  // In a cleanroom with forced-air convection, turbulent mixing dominates
  // molecular diffusion. D_eff is orders of magnitude larger than D_molecular.
  // We scale by AHU flow to couple convective transport to airflow.
  const D_eff = DIFFUSION_COEFF + ahuFlow * 0.05; // ~0.35 m2/s with normal flow

  // ── Track total non-O2 gas ppm for O2 displacement ──
  let totalGasPpm = 0;

  for (const sensor of sensors) {
    if (sensor.species === 'O2') continue; // O2 handled separately

    // Source term Q = baseLeak (mol/s equivalent source strength)
    const Q = baseLeak;

    // Gaussian plume: C = (Q / (4*pi*D_eff*t_eff)) * exp(-r^2 / (4*D_eff*t_eff))
    // t_eff = max(dt, 1) to avoid singularity at t=0
    const r = sensor.position_r;
    const t_eff = Math.max(dt, 1);
    const denominator = 4 * Math.PI * D_eff * t_eff;
    const exponent = -(r * r) / (4 * D_eff * t_eff);
    const C_raw = (Q / denominator) * Math.exp(exponent);

    // Convert to ppm (multiply by molar volume at STP: 24400 mL/mol)
    const C_ppm = C_raw * 24400;

    // Scrubber removal
    const C_after_scrubber = C_ppm * (1 - scrubber.efficiency);

    // Dilution by airflow: dilutionFactor = 1 / (1 + ahuFlow * 10)
    const dilutionFactor = 1 / (1 + ahuFlow * 10);

    // Net concentration change this tick (ppm added per tick)
    const deltaC = C_after_scrubber * dilutionFactor;

    // Target concentration: baseline + leak contribution
    const baseline = GAS_BASELINES[sensor.species];
    const targetConc = baseline + deltaC;
    // First-order approach to target with time-constant-like smoothing
    const alpha = clamp(dt * 0.3, 0, 1);
    sensor.concentrationActual = sensor.concentrationActual + alpha * (targetConc - sensor.concentrationActual);
    sensor.concentrationActual = Math.max(0, sensor.concentrationActual);

    totalGasPpm += sensor.concentrationActual;
  }

  // ── O2 displacement ──
  // O2% = 20.9 * (1 - totalGasPpm / 1_000_000)
  for (const sensor of sensors) {
    if (sensor.species !== 'O2') continue;
    sensor.concentrationActual = 20.9 * (1 - totalGasPpm / 1_000_000);
    sensor.concentrationActual = Math.max(0, sensor.concentrationActual);
  }

  // ── Sensor lag and drift ──
  for (const sensor of sensors) {
    // First-order lag: C_measured = C_prev + (dt/tau) * (C_actual - C_prev)
    const lagAlpha = dt / SENSOR_TAU_S;
    sensor.concentration = sensor.concentration + lagAlpha * (sensor.concentrationActual - sensor.concentration);

    // Drift accumulation
    sensor.drift += SENSOR_DRIFT_PER_S * dt;

    // Apply drift to measured value
    sensor.concentration += sensor.drift * sensor.concentration;

    // Clamp non-negative
    sensor.concentration = Math.max(0, sensor.concentration);
    sensor.concentrationActual = Math.max(0, sensor.concentrationActual);

    // Update status based on alarm thresholds
    if (sensor.species === 'O2') {
      // O2: alarm if below lowAlarm or above highAlarm
      if (sensor.concentration < sensor.lowAlarm || sensor.concentration > sensor.highAlarm) {
        sensor.status = 'alarm';
      } else {
        sensor.status = 'normal';
      }
    } else {
      // Toxic gases: alarm if above highAlarm
      if (sensor.concentration > sensor.highAlarm) {
        sensor.status = 'alarm';
      } else if (sensor.concentration > sensor.lowAlarm) {
        sensor.status = 'alarm';
      } else {
        sensor.status = 'normal';
      }
    }
  }

  return {
    sensors,
    scrubber,
    cabinetPressure,
    leakRateMultiplier,
  };
}

/**
 * Extract coupled output variables from Gas state for other engines.
 */
export function getGasCoupledOutputs(
  state: GasEngineState,
): Pick<CoupledVariables, 'gas_scrubber_power_draw' | 'gas_total_leak_rate' | 'gas_scrubber_exhaust_temp'> {
  // Total leak rate: sum of all non-O2 sensor concentrations above baseline
  let totalLeakRate = 0;
  for (const sensor of state.sensors) {
    if (sensor.species === 'O2') continue;
    const baseline = GAS_BASELINES[sensor.species];
    const excess = Math.max(0, sensor.concentrationActual - baseline);
    totalLeakRate += excess;
  }

  // Scrubber exhaust temperature: base 30 C + heat from chemical reaction in scrubber
  const exhaustTemp = 30 + state.scrubber.powerDraw * 0.5;

  return {
    gas_scrubber_power_draw: state.scrubber.powerDraw,
    gas_total_leak_rate: totalLeakRate,
    gas_scrubber_exhaust_temp: exhaustTemp,
  };
}

/**
 * Compute gas alarms based on current state.
 * Returns an array of alarms (may be empty for nominal operation).
 */
export function computeGasAlarms(
  state: GasEngineState,
  tick: number,
): FacilityAlarm[] {
  const alarms: FacilityAlarm[] = [];

  // Check each sensor
  for (const sensor of state.sensors) {
    if (sensor.species === 'O2') {
      // O2 low alarm
      if (sensor.concentration < sensor.lowAlarm) {
        alarms.push({
          subsystem: 'gas',
          message: `O2 sensor ${sensor.id}: low O2 at ${sensor.concentration.toFixed(1)}% (<${sensor.lowAlarm}%)`,
          severity: 'critical',
          tick,
        });
      }
      // O2 high alarm
      if (sensor.concentration > sensor.highAlarm) {
        alarms.push({
          subsystem: 'gas',
          message: `O2 sensor ${sensor.id}: high O2 at ${sensor.concentration.toFixed(1)}% (>${sensor.highAlarm}%)`,
          severity: 'warning',
          tick,
        });
      }
    } else {
      // Toxic gas high alarm (critical)
      if (sensor.concentration > sensor.highAlarm) {
        alarms.push({
          subsystem: 'gas',
          message: `${sensor.species} sensor ${sensor.id}: ${sensor.concentration.toFixed(1)} ${sensor.unit} exceeds critical limit (>${sensor.highAlarm})`,
          severity: 'critical',
          tick,
        });
      } else if (sensor.concentration > sensor.lowAlarm) {
        // Warning alarm
        alarms.push({
          subsystem: 'gas',
          message: `${sensor.species} sensor ${sensor.id}: ${sensor.concentration.toFixed(1)} ${sensor.unit} exceeds warning limit (>${sensor.lowAlarm})`,
          severity: 'warning',
          tick,
        });
      }
    }
  }

  // Scrubber offline alarm
  if (!state.scrubber.online) {
    alarms.push({
      subsystem: 'gas',
      message: 'Scrubber offline — no exhaust treatment',
      severity: 'critical',
      tick,
    });
  }

  return alarms;
}
