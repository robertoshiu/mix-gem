import { useDashboardFacilityStore } from '../dashboard-facility-store';
import { SUBSYSTEM_IDS } from '@/lib/engines/dashboard-facility-types';

const getState = () => useDashboardFacilityStore.getState();

beforeEach(() => {
  getState().reset();
});

describe('dashboard-facility-store', () => {
  // ── Initial state ──────────────────────────────────────────────────────

  describe('initial state', () => {
    test('initial tick is 0', () => {
      expect(getState().tick).toBe(0);
    });

    test('initial subsystems has all 5 entries with 4 metrics each', () => {
      const { subsystems } = getState();
      for (const id of SUBSYSTEM_IDS) {
        expect(subsystems[id]).toBeDefined();
        expect(subsystems[id].id).toBe(id);
        expect(subsystems[id].metrics).toHaveLength(4);
      }
    });

    test('initial sparklines are empty (length 0)', () => {
      const { sparklines } = getState();
      for (const id of SUBSYSTEM_IDS) {
        expect(sparklines[id]).toBeDefined();
        expect(sparklines[id].length).toBe(0);
      }
    });

    test('initial events is empty (length 0)', () => {
      expect(getState().events.length).toBe(0);
    });
  });

  // ── tick_ behaviour ────────────────────────────────────────────────────

  describe('tick_', () => {
    test('tick_ increments tick and updates subsystems', () => {
      getState().tick_();
      const s = getState();
      expect(s.tick).toBe(1);
      // subsystems should still have all 5 entries
      for (const id of SUBSYSTEM_IDS) {
        expect(s.subsystems[id]).toBeDefined();
        expect(s.subsystems[id].metrics).toHaveLength(4);
      }
    });

    test('tick_ pushes to sparklines (1 point per tick per subsystem)', () => {
      getState().tick_();
      const { sparklines } = getState();
      for (const id of SUBSYSTEM_IDS) {
        expect(sparklines[id].length).toBe(1);
      }

      getState().tick_();
      const s2 = getState();
      for (const id of SUBSYSTEM_IDS) {
        expect(s2.sparklines[id].length).toBe(2);
      }
    });

    test('tick_ appends events to event buffer (some events after 20 ticks)', () => {
      for (let i = 0; i < 20; i++) {
        getState().tick_();
      }
      // With the hash-based event generation, over 20 ticks we should
      // have at least some events (statistically ~13 on average)
      expect(getState().events.length).toBeGreaterThan(0);
    });
  });

  // ── Wrapping & capping ─────────────────────────────────────────────────

  describe('wrapping and capping', () => {
    test('tick wraps at 180 (after 180 ticks, tick is 0)', () => {
      for (let i = 0; i < 180; i++) {
        getState().tick_();
      }
      expect(getState().tick).toBe(0);
    });

    test('sparklines cap at 180 points (after 200 ticks, length <= 180)', () => {
      for (let i = 0; i < 200; i++) {
        getState().tick_();
      }
      const { sparklines } = getState();
      for (const id of SUBSYSTEM_IDS) {
        expect(sparklines[id].length).toBeLessThanOrEqual(180);
      }
    });

    test('events cap at 200 entries (after 300 ticks, length <= 200)', () => {
      for (let i = 0; i < 300; i++) {
        getState().tick_();
      }
      expect(getState().events.length).toBeLessThanOrEqual(200);
    });
  });

  // ── reset ──────────────────────────────────────────────────────────────

  describe('reset', () => {
    test('reset restores initial state (tick 0, empty events)', () => {
      // Advance some ticks
      for (let i = 0; i < 10; i++) {
        getState().tick_();
      }
      expect(getState().tick).toBe(10);

      // Reset
      getState().reset();
      const s = getState();
      expect(s.tick).toBe(0);
      expect(s.events.length).toBe(0);
      for (const id of SUBSYSTEM_IDS) {
        expect(s.sparklines[id].length).toBe(0);
      }
    });
  });
});
