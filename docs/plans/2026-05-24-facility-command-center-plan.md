# Facility Command Center — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the Facility Systems tab from generic unlabeled sparklines to an industry-standard BMS command center with KPI summary bar, threshold-band trend charts, labeled metrics with units, and equipment status indicators.

**Architecture:** Additive changes to the engine (new pure functions for KPIs + equipment status), store (new computed fields), and UI (rewrite SubsystemCard, new FacilityKpiBar, modify FacilityTab layout). EventFeed and DashboardTabs untouched.

**Tech Stack:** Next.js 16, React 19, Zustand, Canvas2D, TypeScript, Jest 30, Tailwind CSS

> **Review addendum (2026-05-24):** This plan has already been applied in the working tree. Treat the existing code as the source of truth; do not replay the TDD tasks blindly or overwrite existing files. Keep the review fixes captured below: correct type-module imports, reduced-motion-safe pulse classes, accessible KPI/equipment labels, `role="img"` on trend canvases, and `SUBSYSTEM_IDS.length` instead of hard-coded subsystem counts.

> **Git note:** Commit commands are historical checkpoints only. Do not run them unless the user explicitly asks for commits.

---

## Reference Files

| What | Path |
|------|------|
| Engine | `src/lib/engines/dashboard-facility-engine.ts` |
| Types | `src/lib/engines/dashboard-facility-types.ts` |
| Store | `src/stores/dashboard-facility-store.ts` |
| SubsystemCard | `src/components/dashboard/SubsystemCard.tsx` |
| EventFeed | `src/components/dashboard/EventFeed.tsx` |
| FacilityTab | `src/components/dashboard/FacilityTab.tsx` |
| HistoryBuffer | `src/lib/engines/history-buffer.ts` |
| Engine tests | `src/lib/engines/__tests__/dashboard-facility-engine.test.ts` |
| Store tests | `src/stores/__tests__/dashboard-facility-store.test.ts` |
| Card tests | `src/components/dashboard/__tests__/SubsystemCard.test.tsx` |
| Design doc | Not present in this workspace; use this reviewed plan as the implementation source |

All paths relative to `equipment-monitor/`.

---

### Task 1: Add EquipmentStatus Type & Equipment Definitions

**Files:**
- Modify: `src/lib/engines/dashboard-facility-types.ts`
- Test: `src/lib/engines/__tests__/dashboard-facility-types-equipment.test.ts`

**Step 1: Write the failing test**

```typescript
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
```

**Step 2: Run test to verify it fails**

Run: `cd E:\repo\mix-gem\equipment-monitor; npm test -- src/lib/engines/__tests__/dashboard-facility-types-equipment.test.ts --no-coverage`
Expected: FAIL — cannot find EQUIPMENT_DEFS

**Step 3: Write implementation**

Add to the end of `src/lib/engines/dashboard-facility-types.ts`:

```typescript
// ---------------------------------------------------------------------------
// Equipment status types & definitions
// ---------------------------------------------------------------------------

export interface EquipmentStatus {
  name: string;
  status: 'running' | 'maintenance' | 'fault';
  detail: string;
}

export interface EquipmentDef {
  name: string;
  runningDetails: string[];
  maintenanceDetails: string[];
  faultDetails: string[];
}

export const EQUIPMENT_DEFS: Record<SubsystemId, [EquipmentDef, EquipmentDef, EquipmentDef]> = {
  ems: [
    {
      name: 'HEPA Filter Bank',
      runningDetails: ['ΔP 11.2Pa', 'ΔP 12.0Pa', 'ΔP 10.8Pa', 'Flow 3200 CFM'],
      maintenanceDetails: ['Filter life 12%', 'Scheduled swap', 'ΔP high 18Pa'],
      faultDetails: ['ΔP exceeded limit', 'Fan overload'],
    },
    {
      name: 'Particle Monitor',
      runningDetails: ['Sampling OK', 'Count 450/m³', 'Count 620/m³', 'Self-test pass'],
      maintenanceDetails: ['Cal due 3 days', 'Sensor drift', 'Cal overdue'],
      faultDetails: ['Laser failure', 'Comm lost'],
    },
    {
      name: 'Makeup Air Damper',
      runningDetails: ['Auto 78%', 'Auto 82%', 'Auto 65%', 'Tracking setpoint'],
      maintenanceDetails: ['Actuator slow', 'Linkage wear', 'Response lag 4s'],
      faultDetails: ['Stuck closed', 'Actuator fault'],
    },
  ],
  bas: [
    {
      name: 'Chiller-1',
      runningDetails: ['COP 5.8', 'COP 6.1', 'Load 72%', 'Evap 6.2°C'],
      maintenanceDetails: ['Oil change due', 'Condenser fouled', 'Vibration elevated'],
      faultDetails: ['Compressor trip', 'Low refrigerant'],
    },
    {
      name: 'AHU-3',
      runningDetails: ['Fan 1420 RPM', 'Fan 1380 RPM', 'Supply 14°C', 'Filter OK'],
      maintenanceDetails: ['Filter ΔP high', 'Belt wear 80%', 'VFD alarm pending'],
      faultDetails: ['Fan failure', 'VFD fault'],
    },
    {
      name: 'Coolant Pump P-2',
      runningDetails: ['Flow 42 L/min', 'Flow 44 L/min', '1450 RPM', 'Pressure 3.2 bar'],
      maintenanceDetails: ['Seal drip', 'Bearing temp 68°C', 'Impeller cavitation'],
      faultDetails: ['Motor overload', 'No flow'],
    },
  ],
  gas: [
    {
      name: 'Scrubber',
      runningDetails: ['Eff 97.2%', 'Eff 96.8%', 'Inlet 320°C', 'Outlet clear'],
      maintenanceDetails: ['Media 15% life', 'Pressure drop high', 'Regen needed'],
      faultDetails: ['Bypass active', 'Heater fault'],
    },
    {
      name: 'Gas Cabinet A',
      runningDetails: ['Sealed OK', 'N₂ purge active', 'Pressure 45 kPa', 'Interlocks armed'],
      maintenanceDetails: ['Regulator drift', 'Valve cycle 90%', 'Leak test due'],
      faultDetails: ['Leak detected', 'Valve stuck'],
    },
    {
      name: 'VMB Valve Panel',
      runningDetails: ['All closed', 'Standby OK', 'Pneumatic 5.5 bar', 'Sensors online'],
      maintenanceDetails: ['Actuator slow V3', 'Position sensor drift', 'Cycle count high'],
      faultDetails: ['V2 open stuck', 'Pneumatic loss'],
    },
  ],
  fire: [
    {
      name: 'Fire Panel FP-1',
      runningDetails: ['All zones clear', 'Network OK', 'Battery 100%', 'Supervision OK'],
      maintenanceDetails: ['Loop fault zone C', 'Battery aging', 'Sounder test due'],
      faultDetails: ['Comm failure', 'Power fault'],
    },
    {
      name: 'FM-200 Zone A',
      runningDetails: ['Armed 25.1 bar', 'Armed 24.8 bar', 'Hold active', 'Integrity OK'],
      maintenanceDetails: ['Cylinder weight low', 'Nozzle inspect due', 'Door seal worn'],
      faultDetails: ['Pressure lost', 'Abort switch open'],
    },
    {
      name: 'VESDA Detector',
      runningDetails: ['Alert 0.02%/m', 'Sampling OK', 'Flow 3.2 L/min', 'Normal'],
      maintenanceDetails: ['Filter dirty', 'Pipe clean due', 'Sensitivity drift'],
      faultDetails: ['Aspirator fault', 'Chamber dirty'],
    },
  ],
  power: [
    {
      name: 'UPS Battery',
      runningDetails: ['SoC 96%', 'SoC 94%', 'Float 54.2V', 'Healthy'],
      maintenanceDetails: ['Cell imbalance', 'Capacity test due', 'Temp 32°C high'],
      faultDetails: ['String fault', 'Charger fail'],
    },
    {
      name: 'PDU-A',
      runningDetails: ['Load 78%', 'Load 82%', 'Balanced ±2%', 'Breakers OK'],
      maintenanceDetails: ['Phase C high', 'Thermal scan due', 'Branch near trip'],
      faultDetails: ['Breaker tripped', 'Overload'],
    },
    {
      name: 'Generator G-1',
      runningDetails: ['Standby OK', 'Fuel 88%', 'Block heater 42°C', 'Battery 12.8V'],
      maintenanceDetails: ['Fuel filter due', 'Coolant low', 'Test run failed'],
      faultDetails: ['Start failure', 'Oil pressure low'],
    },
  ],
};
```

**Step 4: Run test to verify it passes**

Run: `cd E:\repo\mix-gem\equipment-monitor; npm test -- src/lib/engines/__tests__/dashboard-facility-types-equipment.test.ts --no-coverage`
Expected: PASS — all 3 assertions

**Step 5: Commit**

```bash
git add src/lib/engines/dashboard-facility-types.ts src/lib/engines/__tests__/dashboard-facility-types-equipment.test.ts
git commit -m "feat(dashboard): add equipment status types and definitions"
```

---

### Task 2: Add KPI & Equipment Engine Functions

**Files:**
- Modify: `src/lib/engines/dashboard-facility-engine.ts`
- Test: `src/lib/engines/__tests__/dashboard-facility-kpi.test.ts`

**Step 1: Write the failing test**

```typescript
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

// Helper: generate all 5 snapshots at a given tick
function allSnapshots(tick: number): Record<SubsystemId, SubsystemSnapshot> {
  const result = {} as Record<SubsystemId, SubsystemSnapshot>;
  for (const id of SUBSYSTEM_IDS) {
    result[id] = generateSubsystemSnapshot(tick, id);
  }
  return result;
}

describe('computeComfortIndex', () => {
  test('returns a number between 0 and 100', () => {
    for (let tick = 0; tick < 180; tick++) {
      const snap = generateSubsystemSnapshot(tick, 'ems');
      const score = computeComfortIndex(snap);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  test('returns 100 when all EMS metrics are within spec', () => {
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

  test('returns lower score when metrics are out of spec', () => {
    const snap: SubsystemSnapshot = {
      id: 'ems',
      metrics: [
        { key: 'temp', value: 25, status: 'critical' },  // out of range
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
  test('returns a number between 0 and 100', () => {
    for (let tick = 0; tick < 180; tick++) {
      const snap = generateSubsystemSnapshot(tick, 'gas');
      const score = computeGasSafetyScore(snap);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  test('returns 100 when all gas metrics are at zero', () => {
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
  test('returns a number between 1.0 and 2.0', () => {
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
    expect(result.warnings).toBeGreaterThanOrEqual(0);
    expect(result.criticals).toBeGreaterThanOrEqual(0);
    expect(result.warnings + result.criticals).toBeLessThanOrEqual(20); // 5 subsystems * 4 metrics
  });

  test('returns 0/0 when all metrics are normal', () => {
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
    const result = countActiveAlarms(subs);
    expect(result.warnings).toBe(0);
    expect(result.criticals).toBe(0);
  });
});

describe('computeSystemUptime', () => {
  test('returns 0-100', () => {
    const subs = allSnapshots(50);
    const uptime = computeSystemUptime(subs);
    expect(uptime).toBeGreaterThanOrEqual(0);
    expect(uptime).toBeLessThanOrEqual(100);
  });

  test('returns 100 when all subsystems are normal', () => {
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
    expect(computeSystemUptime(subs)).toBe(100);
  });
});

describe('generateEquipmentStatuses', () => {
  test('returns 3 equipment items for each subsystem', () => {
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
      const a = generateEquipmentStatuses(77, id);
      const b = generateEquipmentStatuses(77, id);
      expect(a).toEqual(b);
    }
  });

  test('distribution is roughly 80/15/5 over 180 ticks', () => {
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
    const total = running + maintenance + fault; // 180 * 5 * 3 = 2700
    expect(running / total).toBeGreaterThan(0.65);
    expect(running / total).toBeLessThan(0.92);
    expect(maintenance / total).toBeGreaterThan(0.05);
    expect(fault / total).toBeLessThan(0.15);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd E:\repo\mix-gem\equipment-monitor; npm test -- src/lib/engines/__tests__/dashboard-facility-kpi.test.ts --no-coverage`
Expected: FAIL — functions not exported from engine

**Step 3: Write implementation**

Append to `src/lib/engines/dashboard-facility-engine.ts`:

```typescript
// ---------------------------------------------------------------------------
// KPI computations (pure functions)
// ---------------------------------------------------------------------------

/**
 * Comfort Index: weighted compliance score for EMS.
 * 40% temp + 30% RH + 20% particles + 10% ΔP.
 * Returns 0-100.
 */
export function computeComfortIndex(emsSnapshot: SubsystemSnapshot): number {
  const weights = [0.4, 0.3, 0.2, 0.1];
  const emsDefs = SUBSYSTEM_DEFS.ems.metrics;
  let score = 0;

  for (let i = 0; i < 4; i++) {
    const metric = emsSnapshot.metrics[i];
    const def = emsDefs[i];
    const lo = def.warnLo;
    const hi = def.warnHi;
    const range = hi - lo;

    if (range === 0) {
      // Static metric — full score if normal
      score += metric.status === 'normal' ? weights[i] * 100 : 0;
      continue;
    }

    // Compute how far inside the acceptable range the value is
    if (metric.value >= lo && metric.value <= hi) {
      score += weights[i] * 100;
    } else {
      // Linearly degrade: 0% at 2x range beyond limit
      const overshoot = metric.value < lo
        ? (lo - metric.value) / range
        : (metric.value - hi) / range;
      const penalty = Math.min(overshoot * 50, 100); // 50% per 1x range overshoot
      score += weights[i] * Math.max(0, 100 - penalty);
    }
  }

  return Math.round(score * 10) / 10;
}

/**
 * Gas Safety Score: inverse-weighted concentrations vs limits.
 * NH₃ (30%), Cl₂ (30%), H₂ (20%), Scrubber inverted (20%).
 * Returns 0-100.
 */
export function computeGasSafetyScore(gasSnapshot: SubsystemSnapshot): number {
  const gasDefs = SUBSYSTEM_DEFS.gas.metrics;
  const weights = [0.3, 0.3, 0.2, 0.2];
  let score = 0;

  for (let i = 0; i < 4; i++) {
    const metric = gasSnapshot.metrics[i];
    const def = gasDefs[i];

    if (i === 3) {
      // Scrubber: higher is better (100% = perfect)
      const efficiency = Math.max(0, Math.min(100, metric.value));
      score += weights[i] * efficiency;
    } else {
      // Gas concentration: lower is better (0 = 100 score, warnHi = 0 score)
      const limit = def.warnHi;
      if (limit === 0) {
        score += weights[i] * 100;
      } else {
        const ratio = Math.max(0, Math.min(1, metric.value / limit));
        score += weights[i] * (1 - ratio) * 100;
      }
    }
  }

  return Math.round(score * 10) / 10;
}

/**
 * Power Usage Effectiveness: simulated as 1.2 + (load/capacity) * 0.4.
 * Returns ~1.2-1.8.
 */
export function computePUE(powerSnapshot: SubsystemSnapshot): number {
  const loadMetric = powerSnapshot.metrics[1]; // 'load' is index 1
  const loadDef = SUBSYSTEM_DEFS.power.metrics[1];
  const capacity = loadDef.warnHi; // 1000 kW
  const ratio = Math.max(0, Math.min(1, loadMetric.value / capacity));
  const pue = 1.2 + ratio * 0.4;
  return Math.round(pue * 100) / 100;
}

/**
 * Count active alarms across all subsystems.
 */
export function countActiveAlarms(
  subsystems: Record<SubsystemId, SubsystemSnapshot>,
): { warnings: number; criticals: number } {
  let warnings = 0;
  let criticals = 0;
  for (const id of SUBSYSTEM_IDS) {
    for (const metric of subsystems[id].metrics) {
      if (metric.status === 'warning') warnings++;
      else if (metric.status === 'critical') criticals++;
    }
  }
  return { warnings, criticals };
}

/**
 * System uptime: % of 5 subsystems in "normal" status.
 */
export function computeSystemUptime(
  subsystems: Record<SubsystemId, SubsystemSnapshot>,
): number {
  let normalCount = 0;
  for (const id of SUBSYSTEM_IDS) {
    if (subsystems[id].status === 'normal') normalCount++;
  }
  return (normalCount / SUBSYSTEM_IDS.length) * 100;
}

/**
 * Generate equipment status for a subsystem at a given tick.
 * Distribution: ~80% running, ~15% maintenance, ~5% fault.
 */
export function generateEquipmentStatuses(
  tick: number,
  subsystemId: SubsystemId,
): [EquipmentStatus, EquipmentStatus, EquipmentStatus] {
  const defs = EQUIPMENT_DEFS[subsystemId];

  return defs.map((def, i) => {
    const seed = hashSeed(tick, `equip_${subsystemId}_${i}`);
    const rng = mulberry32(seed);
    const r = rng();

    let status: 'running' | 'maintenance' | 'fault';
    let details: string[];
    if (r < 0.80) {
      status = 'running';
      details = def.runningDetails;
    } else if (r < 0.95) {
      status = 'maintenance';
      details = def.maintenanceDetails;
    } else {
      status = 'fault';
      details = def.faultDetails;
    }

    const detailIdx = Math.floor(rng() * details.length);
    return { name: def.name, status, detail: details[detailIdx] };
  }) as [EquipmentStatus, EquipmentStatus, EquipmentStatus];
}
```

Note: The `EQUIPMENT_DEFS` value and `EquipmentStatus` type need to be added to the existing imports at the top of the engine file. Do not add a second import block for `'./dashboard-facility-types'` inside the file body.

**Step 4: Run test to verify it passes**

Run: `cd E:\repo\mix-gem\equipment-monitor; npm test -- src/lib/engines/__tests__/dashboard-facility-kpi.test.ts --no-coverage`
Expected: PASS — all tests

**Step 5: Verify existing engine tests still pass**

Run: `cd E:\repo\mix-gem\equipment-monitor; npm test -- src/lib/engines/__tests__/dashboard-facility-engine.test.ts --no-coverage`
Expected: PASS — no regressions

**Step 6: Commit**

```bash
git add src/lib/engines/dashboard-facility-engine.ts src/lib/engines/__tests__/dashboard-facility-kpi.test.ts
git commit -m "feat(dashboard): add KPI computation and equipment status engine functions"
```

---

### Task 3: Update Zustand Store with KPI & Equipment Fields

**Files:**
- Modify: `src/stores/dashboard-facility-store.ts`
- Test: `src/stores/__tests__/dashboard-facility-store-kpi.test.ts`

**Step 1: Write the failing test**

```typescript
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
    // Tick several times to get different values
    for (let i = 0; i < 30; i++) {
      getState().tick_();
    }
    const after = getState().kpis;
    // KPIs should be computed (may or may not differ from initial depending on seed)
    expect(typeof after.comfortIndex).toBe('number');
    expect(typeof after.pue).toBe('number');
    expect(after.comfortIndex).toBeGreaterThanOrEqual(0);
    expect(after.comfortIndex).toBeLessThanOrEqual(100);
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
```

**Step 2: Run test to verify it fails**

Run: `cd E:\repo\mix-gem\equipment-monitor; npm test -- src/stores/__tests__/dashboard-facility-store-kpi.test.ts --no-coverage`
Expected: FAIL — kpis/equipmentStatuses undefined

**Step 3: Modify store implementation**

Update `src/stores/dashboard-facility-store.ts` to add KPI and equipment fields:

Add imports:
```typescript
import {
  computeComfortIndex,
  computeGasSafetyScore,
  computePUE,
  countActiveAlarms,
  computeSystemUptime,
  generateEquipmentStatuses,
} from '@/lib/engines/dashboard-facility-engine';
import type { EquipmentStatus } from '@/lib/engines/dashboard-facility-types';
```

Add to interface:
```typescript
export interface FacilityKpis {
  comfortIndex: number;
  gasSafety: number;
  pue: number;
  systemUptime: number;
  energyLoad: number;
  activeAlarms: { warnings: number; criticals: number };
}

export interface DashboardFacilityState {
  // ... existing fields ...
  kpis: FacilityKpis;
  equipmentStatuses: Record<SubsystemId, [EquipmentStatus, EquipmentStatus, EquipmentStatus]>;
  // ... existing methods ...
}
```

Add helper:
```typescript
function computeKpis(subsystems: Record<SubsystemId, SubsystemSnapshot>): FacilityKpis {
  return {
    comfortIndex: computeComfortIndex(subsystems.ems),
    gasSafety: computeGasSafetyScore(subsystems.gas),
    pue: computePUE(subsystems.power),
    systemUptime: computeSystemUptime(subsystems),
    energyLoad: subsystems.power.metrics[1].value, // load metric
    activeAlarms: countActiveAlarms(subsystems),
  };
}

function buildEquipmentStatuses(tick: number): Record<SubsystemId, [EquipmentStatus, EquipmentStatus, EquipmentStatus]> {
  const result = {} as Record<SubsystemId, [EquipmentStatus, EquipmentStatus, EquipmentStatus]>;
  for (const id of SUBSYSTEM_IDS) {
    result[id] = generateEquipmentStatuses(tick, id);
  }
  return result;
}
```

Add to initial state:
```typescript
kpis: computeKpis(buildInitialSubsystems()),
equipmentStatuses: buildEquipmentStatuses(0),
```

Add to `tick_()` after building subsystems:
```typescript
const kpis = computeKpis(subsystems);
const equipmentStatuses = buildEquipmentStatuses(nextTick);
// ... in the set() call add: kpis, equipmentStatuses
```

Add to `reset()`:
```typescript
const initialSubs = buildInitialSubsystems();
// ... in set() add:
kpis: computeKpis(initialSubs),
equipmentStatuses: buildEquipmentStatuses(0),
```

**Step 4: Run test to verify it passes**

Run: `cd E:\repo\mix-gem\equipment-monitor; npm test -- src/stores/__tests__/dashboard-facility-store-kpi.test.ts --no-coverage`
Expected: PASS

**Step 5: Verify existing store tests still pass**

Run: `cd E:\repo\mix-gem\equipment-monitor; npm test -- src/stores/__tests__/dashboard-facility-store.test.ts --no-coverage`
Expected: PASS

**Step 6: Commit**

```bash
git add src/stores/dashboard-facility-store.ts src/stores/__tests__/dashboard-facility-store-kpi.test.ts
git commit -m "feat(dashboard): add KPIs and equipment statuses to facility store"
```

---

### Task 4: FacilityKpiBar Component

**Files:**
- Create: `src/components/dashboard/FacilityKpiBar.tsx`
- Test: `src/components/dashboard/__tests__/FacilityKpiBar.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/components/dashboard/__tests__/FacilityKpiBar.test.tsx

import { render, screen } from '@testing-library/react';
import { FacilityKpiBar } from '../FacilityKpiBar';
import type { FacilityKpis } from '@/stores/dashboard-facility-store';

const mockKpis: FacilityKpis = {
  comfortIndex: 92.3,
  gasSafety: 97.1,
  pue: 1.38,
  systemUptime: 80,
  energyLoad: 847,
  activeAlarms: { warnings: 2, criticals: 0 },
};

describe('FacilityKpiBar', () => {
  beforeEach(() => {
    render(<FacilityKpiBar kpis={mockKpis} />);
  });

  test('renders Comfort Index value', () => {
    expect(screen.getByText('92.3')).toBeInTheDocument();
    expect(screen.getByText(/Comfort/i)).toBeInTheDocument();
  });

  test('renders Gas Safety value', () => {
    expect(screen.getByText('97.1')).toBeInTheDocument();
    expect(screen.getByText(/Gas Safety/i)).toBeInTheDocument();
  });

  test('renders PUE value', () => {
    expect(screen.getByText('1.38')).toBeInTheDocument();
    expect(screen.getByText(/PUE/i)).toBeInTheDocument();
  });

  test('renders System Uptime value', () => {
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText(/Uptime/i)).toBeInTheDocument();
  });

  test('renders Energy Load value', () => {
    expect(screen.getByText('847')).toBeInTheDocument();
    expect(screen.getByText(/Energy/i)).toBeInTheDocument();
  });

  test('renders Active Alarms', () => {
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText(/Alarms/i)).toBeInTheDocument();
  });

  test('renders 6 KPI cards', () => {
    const cards = screen.getAllByTestId('kpi-card');
    expect(cards).toHaveLength(6);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd E:\repo\mix-gem\equipment-monitor; npm test -- src/components/dashboard/__tests__/FacilityKpiBar.test.tsx --no-coverage`
Expected: FAIL — module not found

**Step 3: Write implementation**

```typescript
// src/components/dashboard/FacilityKpiBar.tsx

'use client';

import type { FacilityKpis } from '@/stores/dashboard-facility-store';

interface FacilityKpiBarProps {
  kpis: FacilityKpis;
}

interface KpiCardDef {
  label: string;
  getValue: (kpis: FacilityKpis) => string;
  getStatus: (kpis: FacilityKpis) => 'green' | 'amber' | 'red';
  unit?: string;
}

const KPI_DEFS: KpiCardDef[] = [
  {
    label: 'Comfort Index',
    getValue: (k) => k.comfortIndex.toFixed(1),
    getStatus: (k) => k.comfortIndex >= 90 ? 'green' : k.comfortIndex >= 75 ? 'amber' : 'red',
    unit: '/100',
  },
  {
    label: 'Active Alarms',
    getValue: (k) => `${k.activeAlarms.warnings + k.activeAlarms.criticals}`,
    getStatus: (k) => k.activeAlarms.criticals > 0 ? 'red' : k.activeAlarms.warnings > 0 ? 'amber' : 'green',
    unit: undefined,
  },
  {
    label: 'Power PUE',
    getValue: (k) => k.pue.toFixed(2),
    getStatus: (k) => k.pue <= 1.4 ? 'green' : k.pue <= 1.6 ? 'amber' : 'red',
  },
  {
    label: 'System Uptime',
    getValue: (k) => k.systemUptime.toFixed(0),
    getStatus: (k) => k.systemUptime >= 100 ? 'green' : k.systemUptime >= 80 ? 'amber' : 'red',
    unit: '%',
  },
  {
    label: 'Energy Load',
    getValue: (k) => k.energyLoad.toFixed(0),
    getStatus: (k) => k.energyLoad <= 900 ? 'green' : k.energyLoad <= 950 ? 'amber' : 'red',
    unit: 'kW',
  },
  {
    label: 'Gas Safety',
    getValue: (k) => k.gasSafety.toFixed(1),
    getStatus: (k) => k.gasSafety >= 95 ? 'green' : k.gasSafety >= 85 ? 'amber' : 'red',
    unit: '/100',
  },
];

const STATUS_COLORS = {
  green: { dot: 'bg-emerald-400', text: 'text-emerald-400', border: 'border-emerald-400/20' },
  amber: { dot: 'bg-amber-400', text: 'text-amber-400', border: 'border-amber-400/20' },
  red: { dot: 'bg-red-500 animate-pulse motion-reduce:animate-none', text: 'text-red-400', border: 'border-red-400/20' },
};

export function FacilityKpiBar({ kpis }: FacilityKpiBarProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {KPI_DEFS.map((def) => {
        const status = def.getStatus(kpis);
        const colors = STATUS_COLORS[status];
        return (
          <div
            key={def.label}
            data-testid="kpi-card"
            aria-label={`${def.label}: ${def.getValue(kpis)}${def.unit ?? ''}, status ${status}`}
            className={`rounded-2xl border ${colors.border} bg-[rgba(2,6,23,0.72)] p-4 backdrop-blur-xl`}
          >
            <div className="mb-2 flex items-center gap-2">
              <span aria-hidden="true" className={`h-2 w-2 rounded-full ${colors.dot}`} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--sf-text-muted)]">
                {def.label}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`font-mono text-2xl font-bold tabular-nums ${colors.text}`}>
                {def.getValue(kpis)}
              </span>
              {def.unit && (
                <span className="text-xs text-[var(--sf-text-muted)]">{def.unit}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd E:\repo\mix-gem\equipment-monitor; npm test -- src/components/dashboard/__tests__/FacilityKpiBar.test.tsx --no-coverage`
Expected: PASS — all 7 assertions

**Step 5: Commit**

```bash
git add src/components/dashboard/FacilityKpiBar.tsx src/components/dashboard/__tests__/FacilityKpiBar.test.tsx
git commit -m "feat(dashboard): add FacilityKpiBar component with 6 KPIs"
```

---

### Task 5: Rewrite SubsystemCard with Threshold-Band Chart & Equipment Status

**Files:**
- Rewrite: `src/components/dashboard/SubsystemCard.tsx`
- Rewrite: `src/components/dashboard/__tests__/SubsystemCard.test.tsx`

**Step 1: Write the new test**

```typescript
// src/components/dashboard/__tests__/SubsystemCard.test.tsx

import { render, screen } from '@testing-library/react';
import { SubsystemCard } from '../SubsystemCard';
import type { SubsystemSnapshot, EquipmentStatus } from '@/lib/engines/dashboard-facility-types';

// Canvas mock
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  clearRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  fillRect: jest.fn(),
  fillText: jest.fn(),
  measureText: jest.fn(() => ({ width: 20 })),
  setLineDash: jest.fn(),
  scale: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  set strokeStyle(_: string) {},
  set fillStyle(_: string) {},
  set lineWidth(_: number) {},
  set lineJoin(_: string) {},
  set font(_: string) {},
  set textAlign(_: string) {},
  set textBaseline(_: string) {},
  set globalAlpha(_: number) {},
})) as never;

const mockSnapshot: SubsystemSnapshot = {
  id: 'ems',
  metrics: [
    { key: 'temp', value: 22.1, status: 'normal' },
    { key: 'rh', value: 45.2, status: 'normal' },
    { key: 'particles', value: 1200, status: 'warning' },
    { key: 'dp', value: 12.5, status: 'normal' },
  ],
  status: 'warning',
};

const mockEquipment: [EquipmentStatus, EquipmentStatus, EquipmentStatus] = [
  { name: 'HEPA Filter Bank', status: 'running', detail: 'ΔP 11.2Pa' },
  { name: 'Particle Monitor', status: 'maintenance', detail: 'Cal due 3 days' },
  { name: 'Makeup Air Damper', status: 'running', detail: 'Auto 78%' },
];

const sparklineData = [20, 21, 22, 21.5, 22.1, 22.3, 21.8];

describe('SubsystemCard', () => {
  beforeEach(() => {
    render(
      <SubsystemCard
        subsystemId="ems"
        snapshot={mockSnapshot}
        sparklineData={sparklineData}
        equipmentStatuses={mockEquipment}
      />,
    );
  });

  test('renders subsystem label', () => {
    expect(screen.getByText('EMS')).toBeInTheDocument();
    expect(screen.getByText(/Environmental/)).toBeInTheDocument();
  });

  test('renders chart title (primary metric name)', () => {
    expect(screen.getByText('Cleanroom Temp')).toBeInTheDocument();
  });

  test('renders canvas for threshold-band chart', () => {
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  test('renders all 4 metric values with units', () => {
    // 22.1°C appears in both chart header and metrics row.
    expect(screen.getAllByText('22.1°C').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('45.2%')).toBeInTheDocument();
    expect(screen.getByText('1200/m³')).toBeInTheDocument();
    expect(screen.getByText('12.5Pa')).toBeInTheDocument();
  });

  test('renders metric labels', () => {
    expect(screen.getByText('Temp')).toBeInTheDocument();
    expect(screen.getByText('RH')).toBeInTheDocument();
    expect(screen.getByText('Particles')).toBeInTheDocument();
  });

  test('renders equipment status items', () => {
    expect(screen.getByText('HEPA Filter Bank')).toBeInTheDocument();
    expect(screen.getByText('Particle Monitor')).toBeInTheDocument();
    expect(screen.getByText('Makeup Air Damper')).toBeInTheDocument();
  });

  test('renders equipment detail text', () => {
    expect(screen.getByText('ΔP 11.2Pa')).toBeInTheDocument();
    expect(screen.getByText('Cal due 3 days')).toBeInTheDocument();
    expect(screen.getByText('Auto 78%')).toBeInTheDocument();
  });

  test('renders status dot', () => {
    expect(screen.getByTestId('status-dot')).toBeInTheDocument();
  });

  test('applies data-subsystem attribute', () => {
    expect(document.querySelector('[data-subsystem="ems"]')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd E:\repo\mix-gem\equipment-monitor; npm test -- src/components/dashboard/__tests__/SubsystemCard.test.tsx --no-coverage`
Expected: FAIL — new props not accepted, new elements not rendered

**Step 3: Rewrite SubsystemCard**

```typescript
// src/components/dashboard/SubsystemCard.tsx

'use client';

import { useRef, useEffect } from 'react';
import type { SubsystemId, SubsystemSnapshot, EquipmentStatus } from '@/lib/engines/dashboard-facility-types';
import { SUBSYSTEM_DEFS } from '@/lib/engines/dashboard-facility-types';
import { formatMetricValue } from '@/lib/engines/dashboard-facility-engine';

// ---------------------------------------------------------------------------
// Chart title mapping — human-readable names for primary metric charts
// ---------------------------------------------------------------------------

const CHART_TITLES: Record<SubsystemId, string> = {
  ems: 'Cleanroom Temp',
  bas: 'Chiller Load',
  gas: 'NH₃ Concentration',
  fire: 'Smoke Obscuration',
  power: 'Total Load',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SubsystemCardProps {
  subsystemId: SubsystemId;
  snapshot: SubsystemSnapshot;
  sparklineData: number[];
  equipmentStatuses: [EquipmentStatus, EquipmentStatus, EquipmentStatus];
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_DOT_CLASSES: Record<string, string> = {
  normal: 'bg-green-400',
  warning: 'bg-amber-400',
  critical: 'bg-red-500 animate-pulse motion-reduce:animate-none',
};

const EQUIP_STATUS_ICON: Record<string, string> = {
  running: '✓',
  maintenance: '⚠',
  fault: '✗',
};

const EQUIP_STATUS_COLOR: Record<string, string> = {
  running: 'text-emerald-400',
  maintenance: 'text-amber-400',
  fault: 'text-red-400',
};

// ---------------------------------------------------------------------------
// Threshold-band chart drawing
// ---------------------------------------------------------------------------

function drawThresholdChart(
  canvas: HTMLCanvasElement,
  data: number[],
  color: string,
  warnLo: number,
  warnHi: number,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const rect = canvas.getBoundingClientRect();
  const w = rect.width || 280;
  const h = rect.height || 140;

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  // Determine Y-axis range
  const pad = { top: 16, bottom: 24, left: 40, right: 12 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  // Auto-range: extend beyond warn bounds
  const dataMin = data.length > 0 ? Math.min(...data) : warnLo;
  const dataMax = data.length > 0 ? Math.max(...data) : warnHi;
  const range = warnHi - warnLo;
  const yMin = Math.min(dataMin, warnLo - range * 0.3);
  const yMax = Math.max(dataMax, warnHi + range * 0.3);
  const yRange = yMax - yMin || 1;

  const toY = (v: number) => pad.top + (1 - (v - yMin) / yRange) * chartH;
  const toX = (i: number) => pad.left + (data.length > 1 ? (i / (data.length - 1)) * chartW : chartW / 2);

  // Draw green band (normal zone)
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = color;
  const bandTop = toY(warnHi);
  const bandBottom = toY(warnLo);
  ctx.fillRect(pad.left, bandTop, chartW, bandBottom - bandTop);
  ctx.restore();

  // Draw red zones (above/below)
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(pad.left, pad.top, chartW, bandTop - pad.top); // above
  ctx.fillRect(pad.left, bandBottom, chartW, pad.top + chartH - bandBottom); // below
  ctx.restore();

  // Draw threshold lines (dashed)
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(pad.left, bandTop);
  ctx.lineTo(pad.left + chartW, bandTop);
  ctx.moveTo(pad.left, bandBottom);
  ctx.lineTo(pad.left + chartW, bandBottom);
  ctx.stroke();
  ctx.restore();

  // Y-axis labels
  ctx.save();
  ctx.font = '9px monospace';
  ctx.fillStyle = 'rgba(148,163,184,0.7)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const yTicks = [yMin, warnLo, warnHi, yMax];
  for (const val of yTicks) {
    const y = toY(val);
    if (y >= pad.top - 2 && y <= pad.top + chartH + 2) {
      ctx.fillText(val.toFixed(val < 10 ? 1 : 0), pad.left - 4, y);
    }
  }
  ctx.restore();

  // Draw metric line
  if (data.length >= 2) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    for (let i = 0; i < data.length; i++) {
      const x = toX(i);
      const y = toY(data[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Latest value dot
    const lastX = toX(data.length - 1);
    const lastY = toY(data[data.length - 1]);
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SubsystemCard({
  subsystemId,
  snapshot,
  sparklineData,
  equipmentStatuses,
}: SubsystemCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const def = SUBSYSTEM_DEFS[subsystemId];
  const primaryMetricDef = def.metrics[0];

  useEffect(() => {
    if (canvasRef.current) {
      drawThresholdChart(
        canvasRef.current,
        sparklineData,
        def.color,
        primaryMetricDef.warnLo,
        primaryMetricDef.warnHi,
      );
    }
  }, [sparklineData, def.color, primaryMetricDef.warnLo, primaryMetricDef.warnHi]);

  return (
    <div
      data-subsystem={subsystemId}
      className="rounded-2xl border bg-[rgba(2,6,23,0.72)] p-4 backdrop-blur-xl"
      style={{ borderColor: `${def.color}33` }}
    >
      {/* Header */}
      <div className="mb-2 flex items-center gap-2">
        <span
          data-testid="status-dot"
          aria-label={`Subsystem status: ${snapshot.status}`}
          className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT_CLASSES[snapshot.status] ?? STATUS_DOT_CLASSES.normal}`}
        />
        <span className="text-sm font-semibold text-[var(--sf-text-primary)]">
          {def.shortLabel}
        </span>
        <span className="text-xs text-[var(--sf-text-muted)]">
          — {def.label}
        </span>
      </div>

      {/* Chart title */}
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--sf-text-muted)]">
          {CHART_TITLES[subsystemId]}
        </span>
        <span className="font-mono text-xs tabular-nums" style={{ color: def.color }}>
          {formatMetricValue(snapshot.metrics[0].value, primaryMetricDef.precision)}{primaryMetricDef.unit}
        </span>
      </div>

      {/* Threshold-band chart */}
      <canvas
        ref={canvasRef}
        role="img"
        className="mb-3 h-[140px] w-full rounded-lg bg-[rgba(255,255,255,0.02)]"
        aria-label={`${CHART_TITLES[subsystemId]} trend chart`}
      />

      {/* Metrics row */}
      <div className="mb-3 grid grid-cols-4 gap-x-2 text-center border-b border-[rgba(255,255,255,0.06)] pb-3">
        {snapshot.metrics.map((metric, i) => {
          const metricDef = def.metrics[i];
          const statusColor = metric.status === 'critical' ? 'text-red-400'
            : metric.status === 'warning' ? 'text-amber-400'
            : 'text-[var(--sf-text-primary)]';
          return (
            <div key={metric.key} className="min-w-0">
              <div className={`font-mono text-xs font-semibold tabular-nums ${statusColor}`}>
                {formatMetricValue(metric.value, metricDef.precision)}{metricDef.unit}
              </div>
              <div className="truncate text-[9px] text-[var(--sf-text-muted)]">
                {metricDef.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Equipment status */}
      <div className="space-y-1">
        {equipmentStatuses.map((eq) => (
          <div
            key={eq.name}
            className="flex items-center gap-2 text-[10px]"
            aria-label={`${eq.name} status ${eq.status}: ${eq.detail}`}
          >
            <span aria-hidden="true" className={`shrink-0 font-bold ${EQUIP_STATUS_COLOR[eq.status]}`}>
              {EQUIP_STATUS_ICON[eq.status]}
            </span>
            <span className="flex-1 truncate text-[var(--sf-text-secondary)]">
              {eq.name}
            </span>
            <span className="shrink-0 font-mono text-[var(--sf-text-muted)]">
              {eq.detail}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd E:\repo\mix-gem\equipment-monitor; npm test -- src/components/dashboard/__tests__/SubsystemCard.test.tsx --no-coverage`
Expected: PASS — all 9 assertions

**Step 5: Commit**

```bash
git add src/components/dashboard/SubsystemCard.tsx src/components/dashboard/__tests__/SubsystemCard.test.tsx
git commit -m "feat(dashboard): rewrite SubsystemCard with threshold-band chart and equipment status"
```

---

### Task 6: Update FacilityTab Layout

**Files:**
- Modify: `src/components/dashboard/FacilityTab.tsx`

**Step 1: Rewrite FacilityTab**

```typescript
// src/components/dashboard/FacilityTab.tsx

'use client';

import { useEffect } from 'react';
import { useDashboardFacilityStore } from '@/stores/dashboard-facility-store';
import { SUBSYSTEM_IDS } from '@/lib/engines/dashboard-facility-types';
import { SubsystemCard } from '@/components/dashboard/SubsystemCard';
import { EventFeed } from '@/components/dashboard/EventFeed';
import { FacilityKpiBar } from '@/components/dashboard/FacilityKpiBar';

export function FacilityTab() {
  const tick_ = useDashboardFacilityStore((s) => s.tick_);
  const tick = useDashboardFacilityStore((s) => s.tick);
  const subsystems = useDashboardFacilityStore((s) => s.subsystems);
  const sparklines = useDashboardFacilityStore((s) => s.sparklines);
  const events = useDashboardFacilityStore((s) => s.events);
  const kpis = useDashboardFacilityStore((s) => s.kpis);
  const equipmentStatuses = useDashboardFacilityStore((s) => s.equipmentStatuses);

  // 1 Hz tick loop — only while mounted
  useEffect(() => {
    const id = window.setInterval(tick_, 1000);
    return () => window.clearInterval(id);
  }, [tick_]);

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <header className="rounded-3xl border border-[rgba(34,211,238,0.24)] bg-[rgba(2,6,23,0.72)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--sf-accent-cyan)]">
              Facility Command Center
            </p>
            <h1 className="mt-2 text-3xl font-semibold uppercase tracking-[0.16em] md:text-4xl">
              Facility Systems
            </h1>
            <p className="mt-2 max-w-4xl text-sm text-[var(--sf-text-secondary)]">
              Real-time BMS monitoring across EMS, BAS, Gas, Fire, and Power
              subsystems &mdash; threshold-band trend charts with equipment status.
            </p>
          </div>
          <div
            className="rounded-full border border-[rgba(34,211,238,0.35)] px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--sf-accent-cyan)]"
            aria-live="polite"
          >
            Tick {tick}/180 &middot; 1Hz
          </div>
        </div>
      </header>

      {/* KPI Summary Bar */}
      <section aria-label="Facility KPIs">
        <FacilityKpiBar kpis={kpis} />
      </section>

      {/* Subsystem cards grid */}
      <section
        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        aria-label="Facility subsystem panels"
      >
        {SUBSYSTEM_IDS.map((id) => (
          <SubsystemCard
            key={id}
            subsystemId={id}
            snapshot={subsystems[id]}
            sparklineData={sparklines[id].toArray()}
            equipmentStatuses={equipmentStatuses[id]}
          />
        ))}
      </section>

      {/* Event feed */}
      <section aria-label="Facility event log">
        <EventFeed events={events.toArray()} currentTick={tick} />
      </section>
    </div>
  );
}
```

**Step 2: Run all dashboard tests to verify nothing broke**

Run: `cd E:\repo\mix-gem\equipment-monitor; npm test -- --testPathPatterns="dashboard-facility|SubsystemCard|EventFeed|DashboardTabs|FacilityKpiBar" --no-coverage`
Expected: PASS — all tests

**Step 3: Commit**

```bash
git add src/components/dashboard/FacilityTab.tsx
git commit -m "feat(dashboard): update FacilityTab with KPI bar and lg:grid-cols-3 layout"
```

---

### Task 7: Final Verification & Build Check

**Step 1: Run the full test suite**

Run: `cd E:\repo\mix-gem\equipment-monitor; npm test -- --no-coverage`
Expected: All existing tests pass + all new tests pass

**Step 2: Run the build**

Run: `cd E:\repo\mix-gem\equipment-monitor; npm run build`
Expected: Build succeeds with no TypeScript errors

**Step 3: Fix any issues found**

If tests or build fail, fix the issues and re-run. Common things to check:
- Import paths correct (especially `@/` aliases)
- `FacilityKpis` type exported from store
- `EquipmentStatus` type re-exported correctly
- Canvas mock in tests has all methods used by `drawThresholdChart`

**Step 4: Commit if fixes needed**

```bash
git add -A
git commit -m "fix(dashboard): resolve build/test issues for facility command center"
```
