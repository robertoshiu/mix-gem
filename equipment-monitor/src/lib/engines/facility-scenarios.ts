// src/lib/engines/facility-scenarios.ts
// Facility Scenarios — scenario injection/recovery, alarm aggregation,
// equipment health derivation, and cascade line generation.
// High-level API layer above the coupling matrix.

import type {
  FacilitySimState,
  FacilityScenarioId,
  FacilityAlarm,
  EquipmentHealth,
  CascadeLine,
  HealthLevel,
} from './facility-types';

import {
  SCENARIO_CASCADE_PATHS,
  SUBSYSTEM_EQUIPMENT_MAP,
} from './facility-constants';

import { computeHvacAlarms } from './hvac-engine';
import { computeGasAlarms } from './gas-engine';
import { computePowerAlarms } from './power-engine';

// ── Helpers ──

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// ── Public API ──

/**
 * Inject a scenario into the facility state.
 * Sets `state.scenario` and records `scenarioStartTick = state.tick`.
 */
export function injectScenario(
  state: FacilitySimState,
  scenario: FacilityScenarioId,
): FacilitySimState {
  return {
    ...state,
    scenario,
    scenarioStartTick: state.tick,
  };
}

/**
 * Clear the active scenario, resetting to 'nominal'.
 */
export function clearScenario(state: FacilitySimState): FacilitySimState {
  return {
    ...state,
    scenario: 'nominal',
    scenarioStartTick: state.tick,
  };
}

/**
 * Aggregate alarms from all three subsystem engines.
 */
export function collectAlarms(state: FacilitySimState): FacilityAlarm[] {
  const hvacAlarms = computeHvacAlarms(state.hvac, state.tick);
  const gasAlarms = computeGasAlarms(state.gas, state.tick);
  const powerAlarms = computePowerAlarms(state.power, state.tick);
  return [...hvacAlarms, ...gasAlarms, ...powerAlarms];
}

/**
 * Derive equipment health from alarm state.
 * For each equipment in SUBSYSTEM_EQUIPMENT_MAP, determine health based on
 * alarms for that subsystem:
 * - If any critical alarm for subsystem -> 'alarm'
 * - If any warning -> 'warning'
 * - Else -> 'normal'
 */
export function getEquipmentHealth(state: FacilitySimState): EquipmentHealth[] {
  const alarms = collectAlarms(state);

  // Build a severity map per subsystem
  const subsystemSeverity: Record<string, HealthLevel> = {
    hvac: 'normal',
    gas: 'normal',
    power: 'normal',
  };

  for (const alarm of alarms) {
    const current = subsystemSeverity[alarm.subsystem];
    if (alarm.severity === 'critical') {
      subsystemSeverity[alarm.subsystem] = 'alarm';
    } else if (alarm.severity === 'warning' && current !== 'alarm') {
      subsystemSeverity[alarm.subsystem] = 'warning';
    }
  }

  // Map each equipment to its subsystem's health
  return Object.entries(SUBSYSTEM_EQUIPMENT_MAP).map(([id, subsystem]) => ({
    id,
    subsystem,
    health: subsystemSeverity[subsystem],
  }));
}

/**
 * Generate cascade lines for active (non-nominal) scenarios.
 *
 * For each path entry in SCENARIO_CASCADE_PATHS[scenario]:
 * - Arrival time: (idx + 1) * 10 ticks after scenario start
 * - Progress: clamp((elapsed - arrivalTick + 10) / 10, 0, 1)
 * - Severity based on downstream equipment's subsystem health
 * - Only show lines with progress > 0
 */
export function getCascadeLines(state: FacilitySimState): CascadeLine[] {
  const { scenario, tick, scenarioStartTick } = state;

  if (scenario === 'nominal') return [];

  const paths = SCENARIO_CASCADE_PATHS[scenario];
  if (!paths || paths.length === 0) return [];

  const elapsed = tick - scenarioStartTick;

  // Get equipment health for severity lookup
  const healths = getEquipmentHealth(state);
  const healthMap = new Map<string, HealthLevel>();
  for (const h of healths) {
    healthMap.set(h.id, h.health);
  }

  const lines: CascadeLine[] = [];

  for (let idx = 0; idx < paths.length; idx++) {
    const [fromId, toId] = paths[idx];
    const arrivalTick = (idx + 1) * 10;
    const progress = clamp((elapsed - arrivalTick + 10) / 10, 0, 1);

    if (progress > 0) {
      // Severity is based on the downstream (toId) equipment's health
      const severity = healthMap.get(toId) ?? 'normal';

      lines.push({
        fromId,
        toId,
        severity,
        progress,
      });
    }
  }

  return lines;
}
