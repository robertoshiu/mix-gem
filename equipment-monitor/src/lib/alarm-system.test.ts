import { AlarmManager } from './alarm-system';
import type { SpcParameter, SpcRule } from './mes-types';

describe('AlarmManager', () => {
  let manager: AlarmManager;

  const param: SpcParameter = 'cd';
  const rule: SpcRule = 'rule_1';
  const message = 'CD exceeds control limit';
  const value = 50;
  const limit = 48;

  beforeEach(() => {
    manager = new AlarmManager();
  });

  describe('createAlarm', () => {
    it('creates an alarm with critical severity', () => {
      const alarm = manager.createAlarm('critical', param, message, rule, value, limit);
      expect(alarm).not.toBeNull();
      expect(alarm!.severity).toBe('critical');
      expect(alarm!.parameter).toBe(param);
      expect(alarm!.message).toBe(message);
      expect(alarm!.rule).toBe(rule);
      expect(alarm!.value).toBe(value);
      expect(alarm!.limit).toBe(limit);
      expect(alarm!.acknowledged).toBe(false);
      expect(alarm!.id).toMatch(/^alarm-/);
      expect(alarm!.timestamp).toBeInstanceOf(Date);
    });

    it('creates alarm with warning severity', () => {
      const alarm = manager.createAlarm('warning', 'cdu', 'CDU warning', rule, 3.5, 3.0);
      expect(alarm).not.toBeNull();
      expect(alarm!.severity).toBe('warning');
    });

    it('creates alarm with info severity', () => {
      const alarm = manager.createAlarm('info', 'ler', 'LER info', rule, 12, 10);
      expect(alarm).not.toBeNull();
      expect(alarm!.severity).toBe('info');
    });

    it('returns null for duplicate alarm (same parameter + rule, not dismissed)', () => {
      manager.createAlarm('critical', param, message, rule, value, limit);
      const duplicate = manager.createAlarm('warning', param, 'duplicate', rule, 49, limit);
      expect(duplicate).toBeNull();
    });

    it('allows new alarm after previous one is dismissed', () => {
      const alarm = manager.createAlarm('critical', param, message, rule, value, limit);
      expect(alarm).not.toBeNull();
      manager.dismissAlarm(alarm!.id);
      const second = manager.createAlarm('warning', param, 'after dismiss', rule, 49, limit);
      expect(second).not.toBeNull();
      expect(second!.severity).toBe('warning');
    });

    it('allows alarms for different parameters with same rule', () => {
      const alarm1 = manager.createAlarm('critical', 'cd', message, rule, value, limit);
      const alarm2 = manager.createAlarm('critical', 'cdu', 'CDU alarm', rule, 4.0, 3.0);
      expect(alarm1).not.toBeNull();
      expect(alarm2).not.toBeNull();
      expect(alarm1!.id).not.toBe(alarm2!.id);
    });

    it('allows alarms for same parameter with different rules', () => {
      const alarm1 = manager.createAlarm('critical', param, message, rule, value, limit);
      const alarm2 = manager.createAlarm('critical', param, 'rule 2 alarm', 'rule_2', 49, 46);
      expect(alarm1).not.toBeNull();
      expect(alarm2).not.toBeNull();
      expect(alarm1!.id).not.toBe(alarm2!.id);
    });
  });

  describe('acknowledgeAlarm', () => {
    it('acknowledges an existing alarm', () => {
      const alarm = manager.createAlarm('critical', param, message, rule, value, limit);
      expect(alarm).not.toBeNull();
      const updated = manager.acknowledgeAlarm(alarm!.id);
      expect(updated).toBeDefined();
      expect(updated!.acknowledged).toBe(true);
      expect(updated!.acknowledgedAt).toBeInstanceOf(Date);
    });

    it('returns undefined for non-existent alarm', () => {
      const result = manager.acknowledgeAlarm('nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('dismissAlarm', () => {
    it('dismisses an existing alarm and removes it from active list', () => {
      const alarm = manager.createAlarm('critical', param, message, rule, value, limit);
      expect(alarm).not.toBeNull();
      const dismissed = manager.dismissAlarm(alarm!.id);
      expect(dismissed).toBe(true);
      expect(manager.getActiveAlarms()).toHaveLength(0);
    });

    it('returns false for non-existent alarm', () => {
      const result = manager.dismissAlarm('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('getActiveAlarms', () => {
    it('returns empty array initially', () => {
      expect(manager.getActiveAlarms()).toEqual([]);
    });

    it('returns active alarms sorted by timestamp descending', () => {
      const alarm1 = manager.createAlarm('critical', param, 'first', rule, value, limit);
      // Small delay to ensure different timestamps
      const alarm2 = manager.createAlarm('warning', 'cdu', 'second', 'rule_2', 4.0, 3.0);
      const alarm3 = manager.createAlarm('info', 'ler', 'third', 'rule_3', 12, 10);
      expect(alarm1).not.toBeNull();
      expect(alarm2).not.toBeNull();
      expect(alarm3).not.toBeNull();

      const active = manager.getActiveAlarms();
      expect(active).toHaveLength(3);
      // Should be sorted newest first
      const timestamps = active.map(a => a.timestamp.getTime());
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i - 1]).toBeGreaterThanOrEqual(timestamps[i]);
      }
    });

    it('excludes dismissed alarms', () => {
      const alarm1 = manager.createAlarm('critical', param, 'keep', rule, value, limit);
      const alarm2 = manager.createAlarm('warning', 'cdu', 'remove', 'rule_2', 4.0, 3.0);
      expect(alarm1).not.toBeNull();
      expect(alarm2).not.toBeNull();
      manager.dismissAlarm(alarm2!.id);
      const active = manager.getActiveAlarms();
      expect(active).toHaveLength(1);
      expect(active[0].id).toBe(alarm1!.id);
    });
  });

  describe('clearRecoveredAlarms', () => {
    const spcParameters: Record<SpcParameter, { ucl: number; lcl: number }> = {
      cd: { ucl: 48, lcl: 42 },
      cdu: { ucl: 3.0, lcl: 0.5 },
      ovl_x: { ucl: 10, lcl: -10 },
      ovl_y: { ucl: 10, lcl: -10 },
      ler: { ucl: 10, lcl: 0 },
    };

    it('clears alarms for parameters back within limits', () => {
      manager.createAlarm('critical', 'cd', 'CD above UCL', 'rule_1', 50, 48);
      manager.createAlarm('critical', 'cdu', 'CDU above UCL', 'rule_1', 4.0, 3.0);
      const currentValues: Record<SpcParameter, number> = {
        cd: 45,   // back within 42-48
        cdu: 1.5, // back within 0.5-3.0
        ovl_x: 0,
        ovl_y: 0,
        ler: 5,
      };
      const cleared = manager.clearRecoveredAlarms(currentValues, spcParameters);
      expect(cleared).toHaveLength(2);
      expect(manager.getActiveAlarms()).toHaveLength(0);
    });

    it('does not clear alarms for parameters still out of limits', () => {
      manager.createAlarm('critical', 'cd', 'CD above UCL', 'rule_1', 50, 48);
      const currentValues: Record<SpcParameter, number> = {
        cd: 50,   // still above UCL
        cdu: 1.5,
        ovl_x: 0,
        ovl_y: 0,
        ler: 5,
      };
      const cleared = manager.clearRecoveredAlarms(currentValues, spcParameters);
      expect(cleared).toHaveLength(0);
      expect(manager.getActiveAlarms()).toHaveLength(1);
    });

    it('only clears the specific alarm that recovered', () => {
      const alarm1 = manager.createAlarm('critical', 'cd', 'CD above UCL', 'rule_1', 50, 48);
      const alarm2 = manager.createAlarm('critical', 'cdu', 'CDU above UCL', 'rule_1', 4.0, 3.0);
      expect(alarm1).not.toBeNull();
      expect(alarm2).not.toBeNull();
      const currentValues: Record<SpcParameter, number> = {
        cd: 50,   // still out
        cdu: 1.5, // recovered
        ovl_x: 0,
        ovl_y: 0,
        ler: 5,
      };
      const cleared = manager.clearRecoveredAlarms(currentValues, spcParameters);
      expect(cleared).toHaveLength(1);
      expect(cleared[0]).toBe(alarm2!.id);
      const active = manager.getActiveAlarms();
      expect(active).toHaveLength(1);
      expect(active[0].id).toBe(alarm1!.id);
    });

    it('clears if value is exactly on boundary (ucl or lcl)', () => {
      manager.createAlarm('critical', 'cd', 'CD above UCL', 'rule_1', 50, 48);
      const currentValues: Record<SpcParameter, number> = {
        cd: 48,   // exactly on UCL
        cdu: 0.5,
        ovl_x: 0,
        ovl_y: 0,
        ler: 5,
      };
      const cleared = manager.clearRecoveredAlarms(currentValues, spcParameters);
      expect(cleared).toHaveLength(1);
    });
  });

  describe('getAlarmCount', () => {
    it('returns all zeros initially', () => {
      const counts = manager.getAlarmCount();
      expect(counts).toEqual({ total: 0, critical: 0, warning: 0, info: 0 });
    });

    it('counts alarms by severity', () => {
      manager.createAlarm('critical', 'cd', '', 'rule_1', 50, 48);
      manager.createAlarm('critical', 'cdu', '', 'rule_2', 4.0, 3.0);
      manager.createAlarm('warning', 'ovl_x', '', 'rule_1', 12, 10);
      manager.createAlarm('info', 'ler', '', 'rule_1', 12, 10);

      const counts = manager.getAlarmCount();
      expect(counts).toEqual({ total: 4, critical: 2, warning: 1, info: 1 });
    });

    it('only counts active (non-dismissed) alarms', () => {
      const alarm = manager.createAlarm('critical', 'cd', '', 'rule_1', 50, 48);
      manager.createAlarm('warning', 'cdu', '', 'rule_2', 4.0, 3.0);
      expect(alarm).not.toBeNull();
      manager.dismissAlarm(alarm!.id);

      const counts = manager.getAlarmCount();
      expect(counts).toEqual({ total: 1, critical: 0, warning: 1, info: 0 });
    });
  });
});
