import type { Alarm, AlarmSeverity, SpcParameter, SpcRule } from './mes-types';

export class AlarmManager {
  private _alarms: Alarm[] = [];
  private _dismissedIds: Set<string> = new Set();

  /**
   * Create a new alarm.
   * Returns null if a duplicate exists (same parameter + rule, not yet dismissed).
   */
  createAlarm(
    severity: AlarmSeverity,
    parameter: SpcParameter,
    message: string,
    rule: SpcRule,
    value: number,
    limit: number,
  ): Alarm | null {
    // Deduplication: check for active alarm with same parameter + rule
    const hasActive = this._alarms.some(
      a => a.parameter === parameter && a.rule === rule && !this._dismissedIds.has(a.id),
    );
    if (hasActive) return null;

    const alarm: Alarm = {
      id: `alarm-${Date.now()}-${Math.random()}`,
      severity,
      parameter,
      message,
      rule,
      value,
      limit,
      acknowledged: false,
      timestamp: new Date(),
    };

    this._alarms.push(alarm);
    return alarm;
  }

  /**
   * Acknowledge an alarm by ID.
   * Returns the updated alarm, or undefined if not found.
   */
  acknowledgeAlarm(alarmId: string): Alarm | undefined {
    const alarm = this._alarms.find(a => a.id === alarmId);
    if (!alarm) return undefined;

    alarm.acknowledged = true;
    alarm.acknowledgedAt = new Date();
    return alarm;
  }

  /**
   * Dismiss an alarm by ID (remove from active list).
   * Returns true if found and dismissed, false otherwise.
   */
  dismissAlarm(alarmId: string): boolean {
    const exists = this._alarms.some(a => a.id === alarmId);
    if (!exists) return false;

    this._dismissedIds.add(alarmId);
    return true;
  }

  /**
   * Returns all active (non-dismissed) alarms sorted by timestamp descending.
   */
  getActiveAlarms(): Alarm[] {
    return this._alarms
      .filter(a => !this._dismissedIds.has(a.id))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Check active alarms against current parameter values.
   * If a parameter's current value is back within UCL/LCL, dismiss the alarm.
   * Returns list of cleared alarm IDs.
   */
  clearRecoveredAlarms(
    currentValues: Record<SpcParameter, number>,
    spcParameters: Record<SpcParameter, { ucl: number; lcl: number }>,
  ): string[] {
    const cleared: string[] = [];

    for (const alarm of this._alarms) {
      if (this._dismissedIds.has(alarm.id)) continue;

      const value = currentValues[alarm.parameter];
      const limits = spcParameters[alarm.parameter];
      if (value == null || !limits) continue;

      // Check if value is back within UCL/LCL (inclusive)
      if (value >= limits.lcl && value <= limits.ucl) {
        this._dismissedIds.add(alarm.id);
        cleared.push(alarm.id);
      }
    }

    return cleared;
  }

  /**
   * Get count of active alarms by severity.
   */
  getAlarmCount(): { total: number; critical: number; warning: number; info: number } {
    const active = this._alarms.filter(a => !this._dismissedIds.has(a.id));
    return {
      total: active.length,
      critical: active.filter(a => a.severity === 'critical').length,
      warning: active.filter(a => a.severity === 'warning').length,
      info: active.filter(a => a.severity === 'info').length,
    };
  }
}
