import {
  getDefaultDemoEquipment,
  getSecsGemDemoData,
  resolveDemoEquipment,
  SCENARIO_TEMPLATES,
  ALARM_TEMPLATES,
  TERMINAL_MESSAGES,
  STATUS_VARIABLES,
  SPC_NOMINAL,
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

describe('data pools', () => {
  it('SCENARIO_TEMPLATES has 4 templates each with 4 steps', () => {
    expect(SCENARIO_TEMPLATES).toHaveLength(4);
    for (const template of SCENARIO_TEMPLATES) {
      expect(template).toHaveLength(4);
      for (const step of template) {
        expect(step).toHaveProperty('id');
        expect(step).toHaveProperty('label');
        expect(step).toHaveProperty('primary');
        expect(step).toHaveProperty('expected');
      }
    }
  });

  it('ALARM_TEMPLATES has 10 entries with required fields', () => {
    expect(ALARM_TEMPLATES).toHaveLength(10);
    for (const alarm of ALARM_TEMPLATES) {
      expect(alarm).toHaveProperty('alarmId');
      expect(alarm).toHaveProperty('code');
      expect(alarm).toHaveProperty('message');
      expect(alarm).toHaveProperty('severity');
      expect(alarm).toHaveProperty('rootCause');
      expect(alarm).toHaveProperty('action');
    }
  });

  it('TERMINAL_MESSAGES has 8 message templates', () => {
    expect(TERMINAL_MESSAGES).toHaveLength(8);
    for (const msg of TERMINAL_MESSAGES) {
      expect(typeof msg).toBe('string');
      expect(msg.length).toBeGreaterThan(0);
    }
  });

  it('STATUS_VARIABLES has 8 entries with svid, name, and values array', () => {
    expect(STATUS_VARIABLES).toHaveLength(8);
    for (const sv of STATUS_VARIABLES) {
      expect(sv).toHaveProperty('svid');
      expect(sv).toHaveProperty('name');
      expect(sv.values.length).toBeGreaterThan(0);
    }
  });

  it('SPC_NOMINAL has all 5 parameters with mean and stddev', () => {
    expect(Object.keys(SPC_NOMINAL)).toEqual(
      expect.arrayContaining(['cd', 'cdu', 'ovl_x', 'ovl_y', 'ler'])
    );
    for (const param of Object.values(SPC_NOMINAL)) {
      expect(param).toHaveProperty('mean');
      expect(param).toHaveProperty('stddev');
      expect(typeof param.mean).toBe('number');
      expect(typeof param.stddev).toBe('number');
    }
  });
});
