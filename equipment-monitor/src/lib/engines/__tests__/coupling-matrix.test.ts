import { tickFacility, createInitialFacilityState } from '../coupling-matrix';

describe('createInitialFacilityState', () => {
  test('returns valid initial state', () => {
    const state = createInitialFacilityState();
    expect(state.tick).toBe(0);
    expect(state.scenario).toBe('nominal');
    expect(state.hvac.nodes['zone-cr'].T).toBeCloseTo(22, 0);
    expect(state.gas.sensors).toHaveLength(8);
    expect(state.power.nodes['utility'].V).toBeCloseTo(230, 0);
  });
});

describe('tickFacility', () => {
  test('advances tick counter', () => {
    const s0 = createInitialFacilityState();
    const s1 = tickFacility(s0);
    expect(s1.tick).toBe(1);
  });

  test('coupled variables propagate between engines', () => {
    let state = createInitialFacilityState();
    state = { ...state, scenario: 'chiller-failure', scenarioStartTick: 0 };
    for (let i = 0; i < 30; i++) state = tickFacility(state);
    expect(state.coupled.hvac_zone_cr_temp).toBeGreaterThan(23);
  });

  test('nominal scenario stays stable for 60 ticks', () => {
    let state = createInitialFacilityState();
    for (let i = 0; i < 60; i++) state = tickFacility(state);
    expect(state.coupled.hvac_zone_cr_temp).toBeGreaterThan(18);
    expect(state.coupled.hvac_zone_cr_temp).toBeLessThan(28);
    expect(state.coupled.power_voltage).toBeGreaterThan(210);
  });

  test('coupling clamps prevent runaway values', () => {
    let state = createInitialFacilityState();
    state = { ...state, scenario: 'chiller-failure', scenarioStartTick: 0 };
    for (let i = 0; i < 300; i++) state = tickFacility(state);
    expect(state.coupled.hvac_zone_cr_temp).toBeLessThanOrEqual(80);
    expect(state.coupled.power_voltage).toBeGreaterThanOrEqual(0);
  });

  test('chemical leak scenario cascades via elevated gas leak rate', () => {
    let state = createInitialFacilityState();
    state = { ...state, scenario: 'chemical-leak', scenarioStartTick: 0 };
    const initialLeakRate = state.coupled.gas_total_leak_rate;
    for (let i = 0; i < 30; i++) state = tickFacility(state);
    expect(state.coupled.gas_total_leak_rate).toBeGreaterThan(initialLeakRate + 10);
  });

  test('each scenario produces different coupled state than nominal', () => {
    const scenarios = [
      'ups-depletion', 'transformer-overload', 'chiller-failure',
      'ahu-fan-failure', 'pressure-breach', 'chemical-leak', 'scrubber-failure',
    ] as const;
    const nominal = (() => {
      let s = createInitialFacilityState();
      for (let i = 0; i < 30; i++) s = tickFacility(s);
      return s;
    })();
    for (const scenario of scenarios) {
      let s = createInitialFacilityState();
      s = { ...s, scenario, scenarioStartTick: 0 };
      for (let i = 0; i < 30; i++) s = tickFacility(s);
      const differs = (
        Math.abs(s.coupled.hvac_zone_cr_temp - nominal.coupled.hvac_zone_cr_temp) > 0.1 ||
        Math.abs(s.coupled.power_voltage - nominal.coupled.power_voltage) > 0.5 ||
        Math.abs(s.coupled.gas_scrubber_power_draw - nominal.coupled.gas_scrubber_power_draw) > 0.1 ||
        Math.abs(s.coupled.hvac_pressure_diff - nominal.coupled.hvac_pressure_diff) > 0.5 ||
        Math.abs(s.coupled.gas_total_leak_rate - nominal.coupled.gas_total_leak_rate) > 1
      );
      expect(differs).toBe(true);
    }
  });
});
