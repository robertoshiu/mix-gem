import {
  SUBSYSTEM_IDS,
  SUBSYSTEM_DEFS,
  ALL_TEMPLATES,
  EMS_TEMPLATES,
  BAS_TEMPLATES,
  GAS_TEMPLATES,
  FIRE_TEMPLATES,
  POWER_TEMPLATES,
  type SubsystemId,
  type MetricSnapshot,
  type SubsystemSnapshot,
  type EventSeverity,
  type FacilityEvent,
} from '../dashboard-facility-types';

describe('dashboard-facility-types', () => {
  describe('SUBSYSTEM_IDS', () => {
    it('has exactly 5 entries', () => {
      expect(SUBSYSTEM_IDS).toHaveLength(5);
    });

    it('contains ems, bas, gas, fire, power', () => {
      expect(SUBSYSTEM_IDS).toEqual(['ems', 'bas', 'gas', 'fire', 'power']);
    });
  });

  describe('SUBSYSTEM_DEFS', () => {
    it('has a definition for each subsystem ID', () => {
      for (const id of SUBSYSTEM_IDS) {
        expect(SUBSYSTEM_DEFS[id]).toBeDefined();
      }
    });

    it('each def has label, shortLabel, color (#hex), and exactly 4 metrics', () => {
      for (const id of SUBSYSTEM_IDS) {
        const def = SUBSYSTEM_DEFS[id];
        expect(def.label).toBeTruthy();
        expect(def.shortLabel).toBeTruthy();
        expect(def.color).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(def.metrics).toHaveLength(4);
      }
    });

    it('each metric has numeric baseline, amplitude, warnLo, warnHi', () => {
      for (const id of SUBSYSTEM_IDS) {
        const def = SUBSYSTEM_DEFS[id];
        for (const metric of def.metrics) {
          expect(typeof metric.baseline).toBe('number');
          expect(typeof metric.amplitude).toBe('number');
          expect(typeof metric.warnLo).toBe('number');
          expect(typeof metric.warnHi).toBe('number');
          expect(typeof metric.frequency).toBe('number');
          expect(typeof metric.precision).toBe('number');
          expect(metric.key).toBeTruthy();
          expect(metric.label).toBeTruthy();
          expect(typeof metric.unit).toBe('string');
        }
      }
    });

    it('EMS has correct color and metric baselines', () => {
      const ems = SUBSYSTEM_DEFS.ems;
      expect(ems.color).toBe('#22d3ee');
      expect(ems.metrics[0].baseline).toBe(22);
      expect(ems.metrics[1].baseline).toBe(45);
      expect(ems.metrics[2].baseline).toBe(800);
      expect(ems.metrics[3].baseline).toBe(12.5);
    });

    it('BAS has correct color', () => {
      expect(SUBSYSTEM_DEFS.bas.color).toBe('#a78bfa');
    });

    it('GAS has correct color', () => {
      expect(SUBSYSTEM_DEFS.gas.color).toBe('#fbbf24');
    });

    it('FIRE has correct color', () => {
      expect(SUBSYSTEM_DEFS.fire.color).toBe('#f43f5e');
    });

    it('POWER has correct color', () => {
      expect(SUBSYSTEM_DEFS.power.color).toBe('#4ade80');
    });
  });

  describe('Event templates', () => {
    it('each subsystem has exactly 30 templates', () => {
      expect(EMS_TEMPLATES).toHaveLength(30);
      expect(BAS_TEMPLATES).toHaveLength(30);
      expect(GAS_TEMPLATES).toHaveLength(30);
      expect(FIRE_TEMPLATES).toHaveLength(30);
      expect(POWER_TEMPLATES).toHaveLength(30);
    });

    it('ALL_TEMPLATES is grouped by subsystem ID', () => {
      expect(Object.keys(ALL_TEMPLATES).sort()).toEqual([...SUBSYSTEM_IDS].sort());
      expect(ALL_TEMPLATES.ems).toBe(EMS_TEMPLATES);
      expect(ALL_TEMPLATES.bas).toBe(BAS_TEMPLATES);
      expect(ALL_TEMPLATES.gas).toBe(GAS_TEMPLATES);
      expect(ALL_TEMPLATES.fire).toBe(FIRE_TEMPLATES);
      expect(ALL_TEMPLATES.power).toBe(POWER_TEMPLATES);
    });

    it('every template has a truthy msg and valid severity', () => {
      const validSeverities: EventSeverity[] = ['info', 'warning', 'critical'];
      for (const id of SUBSYSTEM_IDS) {
        for (const tpl of ALL_TEMPLATES[id]) {
          expect(tpl.msg).toBeTruthy();
          expect(validSeverities).toContain(tpl.severity);
        }
      }
    });

    it('severity distribution: 18-24 info, 4-8 warning, 1-5 critical per subsystem', () => {
      for (const id of SUBSYSTEM_IDS) {
        const templates = ALL_TEMPLATES[id];
        const infoCount = templates.filter((t) => t.severity === 'info').length;
        const warnCount = templates.filter((t) => t.severity === 'warning').length;
        const critCount = templates.filter((t) => t.severity === 'critical').length;

        expect(infoCount).toBeGreaterThanOrEqual(18);
        expect(infoCount).toBeLessThanOrEqual(24);
        expect(warnCount).toBeGreaterThanOrEqual(4);
        expect(warnCount).toBeLessThanOrEqual(8);
        expect(critCount).toBeGreaterThanOrEqual(1);
        expect(critCount).toBeLessThanOrEqual(5);
        expect(infoCount + warnCount + critCount).toBe(30);
      }
    });
  });

  describe('type compatibility', () => {
    it('MetricSnapshot shape is valid', () => {
      const snap: MetricSnapshot = { key: 'temp', value: 22.5, status: 'normal' };
      expect(snap.key).toBe('temp');
      expect(snap.value).toBe(22.5);
      expect(snap.status).toBe('normal');
    });

    it('SubsystemSnapshot shape is valid', () => {
      const snap: SubsystemSnapshot = {
        id: 'ems',
        metrics: [
          { key: 'temp', value: 22, status: 'normal' },
          { key: 'rh', value: 45, status: 'normal' },
          { key: 'particles', value: 800, status: 'warning' },
          { key: 'dp', value: 12.5, status: 'normal' },
        ],
        status: 'normal',
      };
      expect(snap.id).toBe('ems');
      expect(snap.metrics).toHaveLength(4);
    });

    it('FacilityEvent shape is valid', () => {
      const evt: FacilityEvent = {
        id: 'evt-001',
        tick: 42,
        timestamp: '16:40:42',
        subsystem: 'fire',
        severity: 'critical',
        message: 'Smoke detected in zone 3',
      };
      expect(evt.subsystem).toBe('fire');
      expect(evt.severity).toBe('critical');
    });

    it('SubsystemId type matches SUBSYSTEM_IDS values', () => {
      const ids: SubsystemId[] = [...SUBSYSTEM_IDS];
      expect(ids).toHaveLength(5);
    });
  });
});
