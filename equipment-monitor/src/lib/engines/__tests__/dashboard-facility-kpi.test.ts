// src/lib/engines/__tests__/dashboard-facility-kpi.test.ts

import {
  computeComfortIndex,
  computeGasSafetyScore,
  computePUE,
  countActiveAlarms,
  computeSystemUptime,
  generateEquipmentStatuses,
  generateSubsystemSnapshot,
} from '../dashboard-facility-engine';
import { SUBSYSTEM_IDS } from '../dashboard-facility-types';
import type { SubsystemId, SubsystemSnapshot } from '../dashboard-facility-types';

function allSnapshots(tick: number): Record<SubsystemId, SubsystemSnapshot> {
  const result = {} as Record<SubsystemId, SubsystemSnapshot>;
  for (const id of SUBSYSTEM_IDS) {
    result[id] = generateSubsystemSnapshot(tick, id);
  }
  return result;
}

describe('computeComfortIndex', () => {
  test('returns 0-100 for all ticks', () => {
    for (let tick = 0; tick < 180; tick++) {
      const snap = generateSubsystemSnapshot(tick, 'ems');
      const score = computeComfortIndex(snap);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  test('returns 100 when all metrics are within spec', () => {
    const snap: SubsystemSnapshot = {
      id: 'ems',
      metrics: [
        { key: 'temp', value: 22, status: 'normal' },
        { key: 'rh', value: 45, status: 'normal' },
        { key: 'particles', value: 800, status: 'normal' },
        { key: 'dp', value: 12.5, status: 'normal' },
      ],
      status: 'normal',
    };
    expect(computeComfortIndex(snap)).toBe(100);
  });

  test('returns lower when metrics are out of spec', () => {
    const snap: SubsystemSnapshot = {
      id: 'ems',
      metrics: [
        { key: 'temp', value: 26, status: 'critical' },
        { key: 'rh', value: 45, status: 'normal' },
        { key: 'particles', value: 800, status: 'normal' },
        { key: 'dp', value: 12.5, status: 'normal' },
      ],
      status: 'critical',
    };
    const score = computeComfortIndex(snap);
    expect(score).toBeLessThan(100);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

describe('computeGasSafetyScore', () => {
  test('returns 0-100 for all ticks', () => {
    for (let tick = 0; tick < 180; tick++) {
      const snap = generateSubsystemSnapshot(tick, 'gas');
      const score = computeGasSafetyScore(snap);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  test('returns 100 when all gas at zero and scrubber at 100', () => {
    const snap: SubsystemSnapshot = {
      id: 'gas',
      metrics: [
        { key: 'nh3', value: 0, status: 'normal' },
        { key: 'cl2', value: 0, status: 'normal' },
        { key: 'h2', value: 0, status: 'normal' },
        { key: 'scrubber', value: 100, status: 'normal' },
      ],
      status: 'normal',
    };
    expect(computeGasSafetyScore(snap)).toBe(100);
  });
});

describe('computePUE', () => {
  test('returns 1.0-2.0 for all ticks', () => {
    for (let tick = 0; tick < 180; tick++) {
      const snap = generateSubsystemSnapshot(tick, 'power');
      const pue = computePUE(snap);
      expect(pue).toBeGreaterThanOrEqual(1.0);
      expect(pue).toBeLessThanOrEqual(2.0);
    }
  });

  test('is deterministic', () => {
    const snap = generateSubsystemSnapshot(42, 'power');
    expect(computePUE(snap)).toBe(computePUE(snap));
  });
});

describe('countActiveAlarms', () => {
  test('returns warnings and criticals counts', () => {
    const subs = allSnapshots(50);
    const result = countActiveAlarms(subs);
    expect(typeof result.warnings).toBe('number');
    expect(typeof result.criticals).toBe('number');
    expect(result.warnings + result.criticals).toBeLessThanOrEqual(20);
  });

  test('returns 0/0 when all normal', () => {
    const subs = {} as Record<SubsystemId, SubsystemSnapshot>;
    for (const id of SUBSYSTEM_IDS) {
      subs[id] = {
        id,
        metrics: [
          { key: 'a', value: 0, status: 'normal' },
          { key: 'b', value: 0, status: 'normal' },
          { key: 'c', value: 0, status: 'normal' },
          { key: 'd', value: 0, status: 'normal' },
        ],
        status: 'normal',
      };
    }
    expect(countActiveAlarms(subs)).toEqual({ warnings: 0, criticals: 0 });
  });
});

describe('computeSystemUptime', () => {
  test('returns 0-100', () => {
    const subs = allSnapshots(50);
    expect(computeSystemUptime(subs)).toBeGreaterThanOrEqual(0);
    expect(computeSystemUptime(subs)).toBeLessThanOrEqual(100);
  });

  test('returns 100 when all normal', () => {
    const subs = {} as Record<SubsystemId, SubsystemSnapshot>;
    for (const id of SUBSYSTEM_IDS) {
      subs[id] = { id, metrics: [{ key: 'a', value: 0, status: 'normal' },{ key: 'b', value: 0, status: 'normal' },{ key: 'c', value: 0, status: 'normal' },{ key: 'd', value: 0, status: 'normal' }], status: 'normal' };
    }
    expect(computeSystemUptime(subs)).toBe(100);
  });
});

describe('generateEquipmentStatuses', () => {
  test('returns 3 items per subsystem', () => {
    for (const id of SUBSYSTEM_IDS) {
      const statuses = generateEquipmentStatuses(50, id);
      expect(statuses).toHaveLength(3);
      for (const eq of statuses) {
        expect(eq.name).toBeTruthy();
        expect(['running', 'maintenance', 'fault']).toContain(eq.status);
        expect(eq.detail).toBeTruthy();
      }
    }
  });

  test('is deterministic', () => {
    for (const id of SUBSYSTEM_IDS) {
      expect(generateEquipmentStatuses(77, id)).toEqual(generateEquipmentStatuses(77, id));
    }
  });

  test('distribution roughly 80/15/5 over 180 ticks', () => {
    let running = 0, maintenance = 0, fault = 0;
    for (let tick = 0; tick < 180; tick++) {
      for (const id of SUBSYSTEM_IDS) {
        for (const eq of generateEquipmentStatuses(tick, id)) {
          if (eq.status === 'running') running++;
          else if (eq.status === 'maintenance') maintenance++;
          else fault++;
        }
      }
    }
    const total = running + maintenance + fault;
    expect(running / total).toBeGreaterThan(0.65);
    expect(running / total).toBeLessThan(0.92);
    expect(maintenance / total).toBeGreaterThan(0.05);
    expect(fault / total).toBeLessThan(0.15);
  });
});
