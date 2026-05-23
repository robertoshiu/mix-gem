import {
  createInitialGasState,
  stepGas,
  getGasCoupledOutputs,
  computeGasAlarms,
} from '../gas-engine';
import { INITIAL_COUPLED, GAS_SENSOR_CONFIGS, GAS_BASELINES, SCRUBBER_ETA_MAX } from '../facility-constants';
import type { CoupledVariables, GasEngineState } from '../facility-types';

/** Helper: run N ticks with default coupled + scenario */
function runTicks(
  state: GasEngineState,
  n: number,
  coupled: CoupledVariables = { ...INITIAL_COUPLED },
  scenario: Parameters<typeof stepGas>[3] = 'nominal',
): GasEngineState {
  let s = state;
  for (let i = 0; i < n; i++) {
    s = stepGas(s, 1, coupled, scenario);
  }
  return s;
}

describe('Gas & Chemical Delivery Engine', () => {
  // ── Initial state ──

  test('createInitialGasState returns 8 sensors', () => {
    const state = createInitialGasState();
    expect(state.sensors).toHaveLength(8);
  });

  test('O2 sensors start near 20.9%', () => {
    const state = createInitialGasState();
    const o2Sensors = state.sensors.filter(s => s.species === 'O2');
    expect(o2Sensors.length).toBeGreaterThanOrEqual(1);
    for (const sensor of o2Sensors) {
      expect(sensor.concentration).toBeCloseTo(GAS_BASELINES.O2, 1);
    }
  });

  test('scrubber starts online with max efficiency', () => {
    const state = createInitialGasState();
    expect(state.scrubber.online).toBe(true);
    expect(state.scrubber.efficiency).toBeCloseTo(SCRUBBER_ETA_MAX, 2);
  });

  test('all sensors start in normal status', () => {
    const state = createInitialGasState();
    for (const sensor of state.sensors) {
      expect(sensor.status).toBe('normal');
    }
  });

  // ── Steady state ──

  test('steady state keeps concentrations near baseline after 30 ticks', () => {
    const initial = createInitialGasState();
    const after = runTicks(initial, 30);
    for (const sensor of after.sensors) {
      const baseline = GAS_BASELINES[sensor.species];
      // Should stay near baseline: O2 within 1%, non-O2 within baseline + 5 ppm
      // (nominal micro-leak with turbulent diffusion raises concentrations slightly)
      if (sensor.species === 'O2') {
        expect(Math.abs(sensor.concentration - baseline)).toBeLessThan(1);
      } else {
        expect(sensor.concentration).toBeLessThan(baseline + 5);
      }
    }
  });

  // ── Chemical leak scenario ──

  test('chemical leak causes NH3 spike above 25 ppm within 60 ticks', () => {
    const initial = createInitialGasState();
    const after = runTicks(initial, 60, { ...INITIAL_COUPLED }, 'chemical-leak');
    const nh3 = after.sensors.find(s => s.species === 'NH3');
    expect(nh3).toBeDefined();
    expect(nh3!.concentration).toBeGreaterThan(25);
  });

  // ── Scrubber failure ──

  test('scrubber failure sets efficiency to ~0', () => {
    const initial = createInitialGasState();
    const after = runTicks(initial, 5, { ...INITIAL_COUPLED }, 'scrubber-failure');
    expect(after.scrubber.efficiency).toBeCloseTo(0, 2);
    expect(after.scrubber.online).toBe(false);
  });

  // ── Temperature coupling ──

  test('high temperature (35 C) from HVAC increases leak rate vs 22 C', () => {
    const initial = createInitialGasState();
    const hotCoupled: CoupledVariables = { ...INITIAL_COUPLED, hvac_zone_cr_temp: 35 };
    const coldCoupled: CoupledVariables = { ...INITIAL_COUPLED, hvac_zone_cr_temp: 22 };

    const hot = runTicks(createInitialGasState(), 30, hotCoupled);
    const cold = runTicks(createInitialGasState(), 30, coldCoupled);

    // Non-O2 sensors should show higher concentrations in hot case
    const hotNH3 = hot.sensors.find(s => s.species === 'NH3')!;
    const coldNH3 = cold.sensors.find(s => s.species === 'NH3')!;
    expect(hotNH3.concentrationActual).toBeGreaterThan(coldNH3.concentrationActual);
  });

  // ── Sensor lag ──

  test('sensor lag delays measured value behind actual', () => {
    const initial = createInitialGasState();
    // Inject a sudden change by running a leak scenario for 1 tick
    const after = stepGas(initial, 1, { ...INITIAL_COUPLED }, 'chemical-leak');
    const nh3 = after.sensors.find(s => s.species === 'NH3')!;
    // The measured value should lag behind the actual
    // After 1 tick with tau=3, measured should be closer to initial than actual
    if (nh3.concentrationActual > GAS_BASELINES.NH3 + 0.1) {
      expect(nh3.concentration).toBeLessThan(nh3.concentrationActual);
    }
  });

  // ── O2 displacement ──

  test('O2 displacement when gases leak (O2 < 20.9% after chemical leak)', () => {
    const initial = createInitialGasState();
    const after = runTicks(initial, 60, { ...INITIAL_COUPLED }, 'chemical-leak');
    const o2 = after.sensors.find(s => s.species === 'O2')!;
    expect(o2.concentrationActual).toBeLessThan(20.9);
  });

  // ── Non-negative concentrations ──

  test('concentrations clamped non-negative', () => {
    const initial = createInitialGasState();
    const after = runTicks(initial, 100);
    for (const sensor of after.sensors) {
      expect(sensor.concentration).toBeGreaterThanOrEqual(0);
      expect(sensor.concentrationActual).toBeGreaterThanOrEqual(0);
    }
  });

  // ── Alarms ──

  test('nominal state produces no alarms', () => {
    const state = createInitialGasState();
    const alarms = computeGasAlarms(state, 0);
    expect(alarms).toHaveLength(0);
  });

  test('NH3 above threshold triggers critical alarm', () => {
    const state = createInitialGasState();
    const nh3 = state.sensors.find(s => s.species === 'NH3')!;
    nh3.concentration = 60; // above highAlarm (50)
    const alarms = computeGasAlarms(state, 10);
    expect(alarms.length).toBeGreaterThanOrEqual(1);
    expect(alarms.some(a => a.severity === 'critical' && a.message.toLowerCase().includes('nh3'))).toBe(true);
  });

  test('O2 below 19.5% triggers critical alarm', () => {
    const state = createInitialGasState();
    const o2 = state.sensors.find(s => s.species === 'O2')!;
    o2.concentration = 19.0;
    const alarms = computeGasAlarms(state, 10);
    expect(alarms.length).toBeGreaterThanOrEqual(1);
    expect(alarms.some(a => a.severity === 'critical' && a.message.toLowerCase().includes('o2'))).toBe(true);
  });

  test('scrubber offline triggers alarm', () => {
    const state = createInitialGasState();
    state.scrubber.online = false;
    const alarms = computeGasAlarms(state, 10);
    expect(alarms.length).toBeGreaterThanOrEqual(1);
    expect(alarms.some(a => a.message.toLowerCase().includes('scrubber'))).toBe(true);
  });

  // ── Coupled outputs ──

  test('getGasCoupledOutputs returns correct shape', () => {
    const state = createInitialGasState();
    const out = getGasCoupledOutputs(state);
    expect(out).toHaveProperty('gas_scrubber_power_draw');
    expect(out).toHaveProperty('gas_total_leak_rate');
    expect(out).toHaveProperty('gas_scrubber_exhaust_temp');
    expect(typeof out.gas_scrubber_power_draw).toBe('number');
  });
});
