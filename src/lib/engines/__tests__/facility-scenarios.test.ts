import { createInitialFacilityState, tickFacility } from '../coupling-matrix';
import {
  injectScenario,
  clearScenario,
  collectAlarms,
  getEquipmentHealth,
  getCascadeLines,
} from '../facility-scenarios';
import type { FacilitySimState } from '../facility-types';

// Helper: run N ticks with a given scenario
function runScenario(
  scenario: 'nominal' | 'chiller-failure' | 'chemical-leak',
  ticks: number,
): FacilitySimState {
  let state = createInitialFacilityState();
  state = injectScenario(state, scenario);
  for (let i = 0; i < ticks; i++) state = tickFacility(state);
  return state;
}

describe('injectScenario', () => {
  test('sets scenario and records start tick', () => {
    let state = createInitialFacilityState();
    // Advance a few ticks first so tick > 0
    for (let i = 0; i < 5; i++) state = tickFacility(state);
    expect(state.tick).toBe(5);

    const injected = injectScenario(state, 'chiller-failure');
    expect(injected.scenario).toBe('chiller-failure');
    expect(injected.scenarioStartTick).toBe(5);
  });
});

describe('clearScenario', () => {
  test('resets to nominal', () => {
    let state = createInitialFacilityState();
    state = injectScenario(state, 'chemical-leak');
    expect(state.scenario).toBe('chemical-leak');

    const cleared = clearScenario(state);
    expect(cleared.scenario).toBe('nominal');
    expect(cleared.scenarioStartTick).toBe(state.tick);
  });
});

describe('collectAlarms', () => {
  test('nominal produces few or no alarms', () => {
    const state = runScenario('nominal', 10);
    const alarms = collectAlarms(state);
    // Nominal may have steady-state ISO 5 particle alarm from occupant load,
    // but should have no equipment-failure alarms (chiller offline, scrubber offline, etc.)
    const failureAlarms = alarms.filter(
      a => a.message.includes('offline') || a.message.includes('SOC') || a.message.includes('tripped'),
    );
    expect(failureAlarms.length).toBe(0);
  });

  test('chiller failure produces HVAC alarms after 60-tick cascade', () => {
    const state = runScenario('chiller-failure', 60);
    const alarms = collectAlarms(state);
    const hvacAlarms = alarms.filter(a => a.subsystem === 'hvac');
    // After 60 ticks without chiller, temperature rises and chiller-offline warning fires
    expect(hvacAlarms.length).toBeGreaterThan(0);
  });
});

describe('getEquipmentHealth', () => {
  test('nominal returns all equipment health as normal (power & gas subsystems)', () => {
    const state = runScenario('nominal', 10);
    const healths = getEquipmentHealth(state);
    expect(healths.length).toBe(6); // 6 equipment entries in SUBSYSTEM_EQUIPMENT_MAP
    // Power and gas equipment should be normal in nominal
    const powerAndGas = healths.filter(h => h.subsystem === 'power' || h.subsystem === 'gas');
    for (const h of powerAndGas) {
      expect(h.health).toBe('normal');
    }
  });

  test('chiller failure sets HVAC equipment to warning or alarm after 60 ticks', () => {
    const state = runScenario('chiller-failure', 60);
    const healths = getEquipmentHealth(state);
    const hvacHealth = healths.filter(h => h.subsystem === 'hvac');
    // At least one HVAC equipment should be warning or alarm
    const nonNormal = hvacHealth.filter(h => h.health !== 'normal');
    expect(nonNormal.length).toBeGreaterThan(0);
  });
});

describe('getCascadeLines', () => {
  test('nominal returns empty cascade lines', () => {
    const state = runScenario('nominal', 10);
    const lines = getCascadeLines(state);
    expect(lines).toEqual([]);
  });

  test('chiller failure returns cascade lines after 30-tick propagation', () => {
    const state = runScenario('chiller-failure', 30);
    const lines = getCascadeLines(state);
    // chiller-failure has 4 cascade path entries; after 30 ticks,
    // at least the first few paths should have progress > 0
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      expect(line.progress).toBeGreaterThan(0);
      expect(line.progress).toBeLessThanOrEqual(1);
    }
  });
});
