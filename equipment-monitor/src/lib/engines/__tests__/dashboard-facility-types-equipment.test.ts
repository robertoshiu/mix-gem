// src/lib/engines/__tests__/dashboard-facility-types-equipment.test.ts

import {
  SUBSYSTEM_IDS,
  EQUIPMENT_DEFS,
  type EquipmentStatus,
} from '../dashboard-facility-types';

describe('equipment definitions', () => {
  test('EQUIPMENT_DEFS has an entry for each subsystem', () => {
    for (const id of SUBSYSTEM_IDS) {
      expect(EQUIPMENT_DEFS[id]).toBeDefined();
      expect(EQUIPMENT_DEFS[id]).toHaveLength(3);
    }
  });

  test('each equipment def has name and detail templates', () => {
    for (const id of SUBSYSTEM_IDS) {
      for (const eq of EQUIPMENT_DEFS[id]) {
        expect(eq.name).toBeTruthy();
        expect(eq.runningDetails.length).toBeGreaterThanOrEqual(2);
        expect(eq.maintenanceDetails.length).toBeGreaterThanOrEqual(2);
        expect(eq.faultDetails.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  test('EquipmentStatus type is exported', () => {
    const status: EquipmentStatus = {
      name: 'Test',
      status: 'running',
      detail: 'OK',
    };
    expect(status.status).toBe('running');
  });
});
