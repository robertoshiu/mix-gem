// src/stores/__tests__/dashboard-facility-store-kpi.test.ts

import { useDashboardFacilityStore } from '../dashboard-facility-store';
import { SUBSYSTEM_IDS } from '@/lib/engines/dashboard-facility-types';

const getState = () => useDashboardFacilityStore.getState();

beforeEach(() => {
  getState().reset();
});

describe('dashboard-facility-store KPIs', () => {
  test('initial state has kpis object with all fields', () => {
    const { kpis } = getState();
    expect(typeof kpis.comfortIndex).toBe('number');
    expect(typeof kpis.gasSafety).toBe('number');
    expect(typeof kpis.pue).toBe('number');
    expect(typeof kpis.systemUptime).toBe('number');
    expect(typeof kpis.energyLoad).toBe('number');
    expect(kpis.activeAlarms).toHaveProperty('warnings');
    expect(kpis.activeAlarms).toHaveProperty('criticals');
  });

  test('initial state has equipmentStatuses for all subsystems', () => {
    const { equipmentStatuses } = getState();
    for (const id of SUBSYSTEM_IDS) {
      expect(equipmentStatuses[id]).toHaveLength(3);
      for (const eq of equipmentStatuses[id]) {
        expect(eq.name).toBeTruthy();
        expect(['running', 'maintenance', 'fault']).toContain(eq.status);
        expect(eq.detail).toBeTruthy();
      }
    }
  });

  test('tick_ updates kpis', () => {
    for (let i = 0; i < 30; i++) {
      getState().tick_();
    }
    const { kpis } = getState();
    expect(typeof kpis.comfortIndex).toBe('number');
    expect(kpis.comfortIndex).toBeGreaterThanOrEqual(0);
    expect(kpis.comfortIndex).toBeLessThanOrEqual(100);
    expect(typeof kpis.pue).toBe('number');
  });

  test('tick_ updates equipmentStatuses', () => {
    getState().tick_();
    const { equipmentStatuses } = getState();
    for (const id of SUBSYSTEM_IDS) {
      expect(equipmentStatuses[id]).toHaveLength(3);
    }
  });

  test('reset restores initial kpis', () => {
    for (let i = 0; i < 10; i++) getState().tick_();
    getState().reset();
    const { kpis } = getState();
    expect(typeof kpis.comfortIndex).toBe('number');
    expect(kpis.systemUptime).toBeGreaterThanOrEqual(0);
  });
});
