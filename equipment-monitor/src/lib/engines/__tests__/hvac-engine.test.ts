import {
  createInitialHvacState,
  stepHvac,
  getHvacCoupledOutputs,
  computeHvacAlarms,
} from '../hvac-engine';
import { INITIAL_COUPLED, ISO5_LIMIT, ZONE_CR_PRESSURE_PA } from '../facility-constants';
import type { CoupledVariables, HvacEngineState } from '../facility-types';

/** Helper: run N ticks with default coupled + scenario */
function runTicks(
  state: HvacEngineState,
  n: number,
  coupled: CoupledVariables = { ...INITIAL_COUPLED },
  scenario: Parameters<typeof stepHvac>[3] = 'nominal',
): HvacEngineState {
  let s = state;
  for (let i = 0; i < n; i++) {
    s = stepHvac(s, 1, coupled, scenario);
  }
  return s;
}

describe('HVAC Lumped-Parameter Network Engine', () => {
  // ── Initial state ──

  test('createInitialHvacState returns 7 nodes', () => {
    const state = createInitialHvacState();
    expect(Object.keys(state.nodes)).toHaveLength(7);
  });

  test('chiller is online by default', () => {
    const state = createInitialHvacState();
    expect(state.chillerOnline).toBe(true);
  });

  test('zone-cr starts at ~22 C', () => {
    const state = createInitialHvacState();
    expect(state.nodes['zone-cr'].T).toBeCloseTo(22, 0);
  });

  test('zone-cr starts below ISO 5 limit (3520 particles/m3)', () => {
    const state = createInitialHvacState();
    expect(state.nodes['zone-cr'].particleCount).toBeLessThan(ISO5_LIMIT);
  });

  // ── Steady-state ──

  test('steady state preserves temperature within 0.5 C over 10 ticks', () => {
    const initial = createInitialHvacState();
    const T0 = initial.nodes['zone-cr'].T;
    const after = runTicks(initial, 10);
    expect(Math.abs(after.nodes['zone-cr'].T - T0)).toBeLessThan(0.5);
  });

  // ── Chiller failure ──

  test('chiller failure causes temperature rise >1 C over 60 ticks', () => {
    const initial = createInitialHvacState();
    const T0 = initial.nodes['zone-cr'].T;
    const after = runTicks(initial, 60, { ...INITIAL_COUPLED }, 'chiller-failure');
    expect(after.nodes['zone-cr'].T).toBeGreaterThan(T0 + 1);
  });

  // ── AHU fan failure ──

  test('AHU fan failure causes particle count spike >5x in 30 ticks', () => {
    const initial = createInitialHvacState();
    const p0 = initial.nodes['zone-cr'].particleCount;
    const after = runTicks(initial, 30, { ...INITIAL_COUPLED }, 'ahu-fan-failure');
    expect(after.nodes['zone-cr'].particleCount).toBeGreaterThan(p0 * 5);
  });

  // ── Pressure breach ──

  test('pressure breach drops zone-cr pressure below 5 Pa in 10 ticks', () => {
    const initial = createInitialHvacState();
    const after = runTicks(initial, 10, { ...INITIAL_COUPLED }, 'pressure-breach');
    expect(after.nodes['zone-cr'].P).toBeLessThan(5);
  });

  // ── Voltage coupling ──

  test('low voltage (200V) reduces AHU flow below 7.0 kg/s', () => {
    const initial = createInitialHvacState();
    const coupled: CoupledVariables = { ...INITIAL_COUPLED, power_voltage: 200 };
    const after = runTicks(initial, 5, coupled, 'nominal');
    expect(after.nodes['ahu-supply'].flow).toBeLessThan(7.0);
  });

  test('power unavailable stops AHU flow to ~0', () => {
    const initial = createInitialHvacState();
    const coupled: CoupledVariables = { ...INITIAL_COUPLED, power_available: false };
    const after = runTicks(initial, 5, coupled, 'nominal');
    expect(after.nodes['ahu-supply'].flow).toBeLessThan(0.1);
  });

  // ── Humidity bounds ──

  test('humidity stays in 0-100% range after 120 ticks of chiller failure', () => {
    const initial = createInitialHvacState();
    const after = runTicks(initial, 120, { ...INITIAL_COUPLED }, 'chiller-failure');
    for (const node of Object.values(after.nodes)) {
      expect(node.RH).toBeGreaterThanOrEqual(0);
      expect(node.RH).toBeLessThanOrEqual(100);
    }
  });

  // ── Alarms ──

  test('nominal state produces no alarms', () => {
    const state = createInitialHvacState();
    const alarms = computeHvacAlarms(state, 0);
    expect(alarms).toHaveLength(0);
  });

  test('high temperature (28 C) triggers warning alarm', () => {
    const state = createInitialHvacState();
    state.nodes['zone-cr'].T = 28;
    const alarms = computeHvacAlarms(state, 10);
    expect(alarms.length).toBeGreaterThanOrEqual(1);
    expect(alarms.some(a => a.severity === 'warning' && a.message.toLowerCase().includes('temp'))).toBe(true);
  });

  test('ISO 5 violation triggers critical alarm', () => {
    const state = createInitialHvacState();
    state.nodes['zone-cr'].particleCount = ISO5_LIMIT + 1000;
    const alarms = computeHvacAlarms(state, 10);
    expect(alarms.length).toBeGreaterThanOrEqual(1);
    expect(alarms.some(a => a.severity === 'critical' && a.message.toLowerCase().includes('iso'))).toBe(true);
  });

  test('pressure loss triggers warning alarm', () => {
    const state = createInitialHvacState();
    state.nodes['zone-cr'].P = 3;
    const alarms = computeHvacAlarms(state, 10);
    expect(alarms.length).toBeGreaterThanOrEqual(1);
    expect(alarms.some(a => a.severity === 'warning' && a.message.toLowerCase().includes('pressure'))).toBe(true);
  });

  // ── Coupled outputs ──

  test('getHvacCoupledOutputs returns correct shape', () => {
    const state = createInitialHvacState();
    const out = getHvacCoupledOutputs(state);
    expect(out).toHaveProperty('hvac_zone_cr_temp');
    expect(out).toHaveProperty('hvac_ahu_flow');
    expect(out).toHaveProperty('hvac_ahu_power_draw');
    expect(out).toHaveProperty('hvac_pressure_diff');
    expect(typeof out.hvac_zone_cr_temp).toBe('number');
  });
});
