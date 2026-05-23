import { useFacilitySimStore } from '../facility-sim-store';

// Reset store before each test
beforeEach(() => {
  useFacilitySimStore.getState().reset();
});

describe('facility-sim-store', () => {
  describe('initial state', () => {
    test('starts at tick 0', () => {
      expect(useFacilitySimStore.getState().tick).toBe(0);
    });

    test('starts in nominal scenario', () => {
      expect(useFacilitySimStore.getState().scenario).toBe('nominal');
    });

    test('has history buffers with zero length', () => {
      const s = useFacilitySimStore.getState();
      expect(s.hvacTempHistory.length).toBe(0);
      expect(s.hvacParticleHistory.length).toBe(0);
      expect(s.hvacPressureHistory.length).toBe(0);
      expect(s.gasNh3History.length).toBe(0);
      expect(s.gasO2History.length).toBe(0);
      expect(s.gasScrubberHistory.length).toBe(0);
      expect(s.powerVoltageHistory.length).toBe(0);
      expect(s.powerLoadHistory.length).toBe(0);
      expect(s.powerSocHistory.length).toBe(0);
    });

    test('scenarioMarkers is empty', () => {
      expect(useFacilitySimStore.getState().scenarioMarkers).toEqual([]);
    });
  });

  describe('tick_', () => {
    test('advances tick counter', () => {
      useFacilitySimStore.getState().tick_();
      expect(useFacilitySimStore.getState().tick).toBe(1);
    });

    test('pushes to history buffers', () => {
      useFacilitySimStore.getState().tick_();
      const s = useFacilitySimStore.getState();
      expect(s.hvacTempHistory.length).toBe(1);
      expect(s.hvacParticleHistory.length).toBe(1);
      expect(s.hvacPressureHistory.length).toBe(1);
      expect(s.gasNh3History.length).toBe(1);
      expect(s.gasO2History.length).toBe(1);
      expect(s.gasScrubberHistory.length).toBe(1);
      expect(s.powerVoltageHistory.length).toBe(1);
      expect(s.powerLoadHistory.length).toBe(1);
      expect(s.powerSocHistory.length).toBe(1);
    });

    test('history points contain correct tick numbers', () => {
      useFacilitySimStore.getState().tick_();
      useFacilitySimStore.getState().tick_();
      useFacilitySimStore.getState().tick_();
      const arr = useFacilitySimStore.getState().hvacTempHistory.toArray();
      expect(arr.map(p => p.tick)).toEqual([1, 2, 3]);
    });
  });

  describe('setScenario', () => {
    test('changes active scenario', () => {
      useFacilitySimStore.getState().setScenario('chiller-failure');
      expect(useFacilitySimStore.getState().scenario).toBe('chiller-failure');
    });

    test('clears to nominal', () => {
      useFacilitySimStore.getState().setScenario('chiller-failure');
      useFacilitySimStore.getState().setScenario('nominal');
      expect(useFacilitySimStore.getState().scenario).toBe('nominal');
    });

    test('records scenario marker when injecting non-nominal', () => {
      useFacilitySimStore.getState().tick_();
      useFacilitySimStore.getState().tick_();
      useFacilitySimStore.getState().setScenario('chiller-failure');
      const markers = useFacilitySimStore.getState().scenarioMarkers;
      expect(markers.length).toBe(1);
      expect(markers[0].tick).toBe(2);
    });
  });

  describe('reset', () => {
    test('resets to initial state', () => {
      useFacilitySimStore.getState().tick_();
      useFacilitySimStore.getState().tick_();
      useFacilitySimStore.getState().setScenario('chiller-failure');
      useFacilitySimStore.getState().reset();
      expect(useFacilitySimStore.getState().tick).toBe(0);
      expect(useFacilitySimStore.getState().scenario).toBe('nominal');
      expect(useFacilitySimStore.getState().hvacTempHistory.length).toBe(0);
      expect(useFacilitySimStore.getState().scenarioMarkers).toEqual([]);
    });
  });
});
