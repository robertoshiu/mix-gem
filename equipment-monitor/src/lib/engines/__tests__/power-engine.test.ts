import {
  createInitialPowerState,
  stepPower,
  getPowerCoupledOutputs,
  computePowerAlarms,
} from '../power-engine';
import { INITIAL_COUPLED } from '../facility-constants';
import type { CoupledVariables, PowerEngineState } from '../facility-types';

/** Helper: run N ticks with default coupled + scenario */
function runTicks(
  state: PowerEngineState,
  n: number,
  coupled: CoupledVariables = { ...INITIAL_COUPLED },
  scenario: Parameters<typeof stepPower>[3] = 'nominal',
): PowerEngineState {
  let s = state;
  for (let i = 0; i < n; i++) {
    s = stepPower(s, 1, coupled, scenario);
  }
  return s;
}

describe('Power Distribution Engine', () => {
  // ── Initial state ──

  test('createInitialPowerState returns 6 nodes', () => {
    const state = createInitialPowerState();
    expect(Object.keys(state.nodes)).toHaveLength(6);
  });

  test('UPS starts offline (bypass mode)', () => {
    const state = createInitialPowerState();
    expect(state.ups.online).toBe(false);
  });

  test('Battery starts at 100% SOC', () => {
    const state = createInitialPowerState();
    expect(state.ups.soc).toBe(1.0);
  });

  test('Both transformers start online', () => {
    const state = createInitialPowerState();
    expect(state.t1Online).toBe(true);
    expect(state.t2Online).toBe(true);
  });

  // ── Steady-state ──

  test('Steady state maintains voltage near 230V (220-240 range) over 10 ticks', () => {
    const initial = createInitialPowerState();
    const after = runTicks(initial, 10);
    expect(after.nodes['load-bus'].V).toBeGreaterThanOrEqual(220);
    expect(after.nodes['load-bus'].V).toBeLessThanOrEqual(240);
  });

  // ── UPS depletion ──

  test('UPS depletion activates battery and reduces SOC below 0.20 within 30 ticks', () => {
    const initial = createInitialPowerState();
    const after = runTicks(initial, 30, { ...INITIAL_COUPLED }, 'ups-depletion');
    expect(after.ups.online).toBe(true);
    expect(after.ups.soc).toBeLessThan(0.20);
  });

  // ── Transformer overload ──

  test('Transformer overload heats T1 above 80C within 60 ticks', () => {
    const initial = createInitialPowerState();
    const after = runTicks(initial, 60, { ...INITIAL_COUPLED }, 'transformer-overload');
    expect(after.nodes['transformer-t1'].theta).toBeGreaterThan(80);
  });

  // ── Coupled loads ──

  test('HVAC+gas power draw increases total load above 100 kW', () => {
    const initial = createInitialPowerState();
    const coupled: CoupledVariables = {
      ...INITIAL_COUPLED,
      hvac_ahu_power_draw: 18.5,
      gas_scrubber_power_draw: 5,
    };
    const after = runTicks(initial, 1, coupled);
    // 12 (lighting) + 85 (process) + 18.5 (hvac) + 5 (gas) = 120.5 kW
    expect(after.totalLoad).toBeGreaterThan(100);
  });

  // ── Power factor bounds ──

  test('Power factor stays in 0-1 range under stress', () => {
    const initial = createInitialPowerState();
    const after = runTicks(initial, 10, { ...INITIAL_COUPLED }, 'transformer-overload');
    for (const node of Object.values(after.nodes)) {
      expect(node.PF).toBeGreaterThanOrEqual(0);
      expect(node.PF).toBeLessThanOrEqual(1);
    }
  });

  // ── Voltage non-negativity ──

  test('Voltage stays non-negative under all conditions (120 ticks of ups-depletion)', () => {
    const initial = createInitialPowerState();
    const after = runTicks(initial, 120, { ...INITIAL_COUPLED }, 'ups-depletion');
    for (const node of Object.values(after.nodes)) {
      expect(node.V).toBeGreaterThanOrEqual(0);
    }
  });

  // ── Alarms ──

  test('Nominal state produces no alarms', () => {
    const state = createInitialPowerState();
    const alarms = computePowerAlarms(state, 0);
    expect(alarms).toHaveLength(0);
  });

  test('Low SOC (15%) with UPS online triggers critical alarm', () => {
    const state = createInitialPowerState();
    state.ups.soc = 0.15;
    state.ups.online = true;
    const alarms = computePowerAlarms(state, 10);
    expect(alarms.length).toBeGreaterThanOrEqual(1);
    expect(alarms.some(a => a.severity === 'critical' && a.message.toLowerCase().includes('soc'))).toBe(true);
  });

  test('Transformer high temp (90C) triggers critical alarm', () => {
    const state = createInitialPowerState();
    state.nodes['transformer-t1'].theta = 90;
    const alarms = computePowerAlarms(state, 10);
    expect(alarms.length).toBeGreaterThanOrEqual(1);
    expect(alarms.some(a => a.severity === 'critical' && a.message.toLowerCase().includes('transformer'))).toBe(true);
  });

  test('Low PF (0.80) triggers warning alarm', () => {
    const state = createInitialPowerState();
    state.nodes['load-bus'].PF = 0.80;
    const alarms = computePowerAlarms(state, 10);
    expect(alarms.length).toBeGreaterThanOrEqual(1);
    expect(alarms.some(a => a.severity === 'warning' && a.message.toLowerCase().includes('power factor'))).toBe(true);
  });
});
