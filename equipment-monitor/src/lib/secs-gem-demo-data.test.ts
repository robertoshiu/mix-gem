import {
  getDefaultDemoEquipment,
  getSecsGemDemoData,
  resolveDemoEquipment,
} from './secs-gem-demo-data';

describe('secs-gem-demo-data', () => {
  it('builds deterministic simulator data from equipment monitor fixtures', () => {
    const data = getSecsGemDemoData();

    expect(data.equipment.length).toBeGreaterThan(0);
    expect(data.scenarios.length).toBeGreaterThan(0);
    expect(data.messages.length).toBeGreaterThan(0);
    expect(data.snapshots.length).toBeGreaterThan(0);
    expect(data.alarms.length).toBeGreaterThan(0);
    expect(data.equipment[0]).toMatchObject({
      role: 'equipment',
      connectionState: 'selected',
      deviceId: expect.any(Number),
    });
    expect(data.messages.map((message) => message.sf)).toEqual(
      expect.arrayContaining(['S1F13', 'S1F14', 'S6F11', 'S2F41', 'S2F42'])
    );
  });

  it('resolves missing or unknown equipment ids to the default equipment', () => {
    const data = getSecsGemDemoData();
    const defaultEquipment = getDefaultDemoEquipment(data);

    expect(resolveDemoEquipment(data, null)).toBe(defaultEquipment);
    expect(resolveDemoEquipment(data, 'missing-equipment')).toBe(defaultEquipment);
  });
});
