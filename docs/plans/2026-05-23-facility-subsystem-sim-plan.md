# Facility Subsystem Simulation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace war-room mock data with physics-based HVAC/Gas/Power simulation engines, bidirectional coupling matrix, 7 fault scenarios, SCADA-style Canvas2D panels, and 3D Babylon.js integration.

**Architecture:** Three pure-function engines (lumped-parameter HVAC, gas transport, electrical distribution) share state via a coupling matrix at 1 Hz. A Zustand store drives Canvas2D panels and Babylon.js scene effects. Faults inject into one engine and cascade naturally through coupled variables.

**Tech Stack:** TypeScript pure functions, Zustand, Canvas2D, Babylon.js, Jest

**Design doc:** `docs/plans/2026-05-23-facility-subsystem-sim-design.md`

**Existing patterns to follow:**
- Engine: `src/lib/analytics/vpp-engine.ts` (pure functions, typed inputs/outputs)
- Store: `src/stores/analytics-store.ts` (INITIAL_STATE + create())
- Canvas2D: `src/components/charts/canvas-chart.tsx` (useRef + useEffect + getContext)
- Tests: `src/lib/analytics/__tests__/vpp-engine.test.ts` (Jest globals, describe/test/expect)
- Babylon: `src/components/babylon/WarRoomBabylonScene.tsx` (PBR materials, mesh creation)

---

## Task 1: Types & Constants

**Files:**
- Create: `src/lib/engines/facility-types.ts`
- Create: `src/lib/engines/facility-constants.ts`

**Step 1: Create types file**

```typescript
// src/lib/engines/facility-types.ts

// ── HVAC Node Types ──

export type HvacNodeId =
  | 'chiller'
  | 'ahu-supply'
  | 'duct-main'
  | 'zone-cr'
  | 'zone-prod'
  | 'return-plenum'
  | 'ffu-array';

export interface HvacNodeState {
  T: number;           // temperature (C)
  RH: number;          // relative humidity (%)
  P: number;           // pressure (Pa gauge)
  flow: number;        // mass flow rate (kg/s)
  particleCount: number; // particles/m3
}

export type HvacNetworkState = Record<HvacNodeId, HvacNodeState>;

export interface HvacEngineState {
  nodes: HvacNetworkState;
  chillerOnline: boolean;
  ahuFanOnline: boolean;
  doorBreached: boolean;
}

// ── Gas Types ──

export type GasSpecies = 'O2' | 'H2' | 'NH3' | 'CO' | 'Cl2' | 'H2S';

export interface GasSensorState {
  id: string;
  species: GasSpecies;
  position_r: number;      // distance from source (m)
  concentration: number;   // measured (after lag), ppm or %
  concentrationActual: number; // true value before sensor lag
  unit: 'ppm' | '%';
  lowAlarm: number;
  highAlarm: number;
  status: 'normal' | 'alarm' | 'fault';
  drift: number;           // cumulative drift
}

export interface ScrubberState {
  inletFlow: number;       // m3/s
  efficiency: number;      // 0-1
  powerDraw: number;       // kW
  online: boolean;
}

export interface GasEngineState {
  sensors: GasSensorState[];
  scrubber: ScrubberState;
  cabinetPressure: number; // Pa
  leakRateMultiplier: number; // 1 = normal, 50 = leak scenario
}

// ── Power Types ──

export type PowerNodeId =
  | 'utility'
  | 'transformer-t1'
  | 'transformer-t2'
  | 'switchgear'
  | 'pdu-a'
  | 'load-bus';

export interface PowerNodeState {
  V: number;          // voltage (V)
  I: number;          // current (A)
  P_active: number;   // active power (kW)
  P_reactive: number; // reactive power (kVAr)
  PF: number;         // power factor
  theta: number;      // temperature (C)
}

export interface UpsState {
  online: boolean;       // true = battery active
  soc: number;           // state of charge 0-1
  outputV: number;       // output voltage
}

export interface PowerEngineState {
  nodes: Record<PowerNodeId, PowerNodeState>;
  ups: UpsState;
  totalLoad: number;      // kW (sum of all loads)
  t1Online: boolean;
  t2Online: boolean;
}

// ── Coupling ──

export interface CoupledVariables {
  hvac_zone_cr_temp: number;
  hvac_ahu_flow: number;
  hvac_ahu_power_draw: number;
  hvac_pressure_diff: number;
  gas_scrubber_power_draw: number;
  gas_total_leak_rate: number;
  gas_scrubber_exhaust_temp: number;
  power_voltage: number;
  power_available: boolean;
  power_ups_active: boolean;
}

// ── Scenarios ──

export type FacilityScenarioId =
  | 'nominal'
  | 'ups-depletion'
  | 'transformer-overload'
  | 'chiller-failure'
  | 'ahu-fan-failure'
  | 'pressure-breach'
  | 'chemical-leak'
  | 'scrubber-failure';

export interface FacilityScenario {
  id: FacilityScenarioId;
  label: string;
  origin: 'power' | 'hvac' | 'gas';
  description: string;
}

// ── Facility State ──

export interface FacilitySimState {
  hvac: HvacEngineState;
  gas: GasEngineState;
  power: PowerEngineState;
  coupled: CoupledVariables;
  scenario: FacilityScenarioId;
  tick: number;
  scenarioStartTick: number;
}

// ── Alarm ──

export interface FacilityAlarm {
  subsystem: 'hvac' | 'gas' | 'power';
  message: string;
  severity: 'critical' | 'warning' | 'info';
  tick: number;
}

// ── Equipment health for 3D ──

export type HealthLevel = 'normal' | 'warning' | 'alarm';

export interface EquipmentHealth {
  id: string;
  subsystem: 'hvac' | 'gas' | 'power';
  health: HealthLevel;
}

export interface CascadeLine {
  fromId: string;
  toId: string;
  severity: HealthLevel;
  progress: number; // 0-1 animation progress
}
```

**Step 2: Create constants file**

```typescript
// src/lib/engines/facility-constants.ts

import type {
  HvacNodeId,
  HvacNodeState,
  HvacNetworkState,
  GasSensorState,
  GasSpecies,
  ScrubberState,
  PowerNodeId,
  PowerNodeState,
  UpsState,
  FacilityScenario,
  FacilityScenarioId,
} from './facility-types';

// ── HVAC Constants ──

export const HVAC_TICK_DT = 1; // seconds

/** Node connectivity: each node flows into the next */
export const HVAC_TOPOLOGY: [HvacNodeId, HvacNodeId][] = [
  ['chiller', 'ahu-supply'],
  ['ahu-supply', 'duct-main'],
  ['duct-main', 'zone-cr'],
  ['duct-main', 'zone-prod'],
  ['zone-cr', 'ffu-array'],
  ['ffu-array', 'zone-cr'],
  ['zone-cr', 'return-plenum'],
  ['zone-prod', 'return-plenum'],
  ['return-plenum', 'chiller'],
];

export const CHILLER_CAPACITY_KW = 150;
export const CHILLER_COP = 4.5;
export const AHU_FAN_CFM = 15000;
export const AHU_FAN_FLOW_KGS = 7.08; // 15000 CFM -> ~7.08 kg/s air
export const AHU_FAN_POWER_KW = 18.5;
export const ZONE_VOLUME_M3 = 400;
export const ZONE_CR_PRESSURE_PA = 20; // positive differential
export const AIR_CP = 1005; // J/(kg*K)
export const AIR_DENSITY = 1.2; // kg/m3
export const ZONE_MASS_KG = ZONE_VOLUME_M3 * AIR_DENSITY; // ~480 kg

export const FFU_EFFICIENCY = 0.9999; // HEPA
export const OCCUPANT_HEAT_W = 120; // per person
export const OCCUPANT_MOISTURE_GS = 0.0139; // 50 g/hr -> g/s
export const OCCUPANT_PARTICLES = 1667; // 10^5/min -> /s per person
export const OCCUPANT_COUNT = 8;
export const EQUIPMENT_HEAT_W = 45000; // 45 kW from process tools
export const AMBIENT_PARTICLE_COUNT = 35200000; // ISO 8 ambient
export const ISO5_LIMIT = 3520;
export const ISO7_LIMIT = 352000;

export const INITIAL_HVAC_NODE: HvacNodeState = {
  T: 22,
  RH: 45,
  P: 20,
  flow: AHU_FAN_FLOW_KGS,
  particleCount: 1000,
};

export const INITIAL_HVAC_NODES: HvacNetworkState = {
  'chiller': { T: 7, RH: 95, P: 0, flow: AHU_FAN_FLOW_KGS, particleCount: 0 },
  'ahu-supply': { T: 14, RH: 85, P: 250, flow: AHU_FAN_FLOW_KGS, particleCount: 0 },
  'duct-main': { T: 16, RH: 60, P: 120, flow: AHU_FAN_FLOW_KGS, particleCount: 100 },
  'zone-cr': { T: 22, RH: 45, P: 20, flow: AHU_FAN_FLOW_KGS * 0.6, particleCount: 1000 },
  'zone-prod': { T: 23, RH: 48, P: 15, flow: AHU_FAN_FLOW_KGS * 0.4, particleCount: 50000 },
  'return-plenum': { T: 24, RH: 50, P: -5, flow: AHU_FAN_FLOW_KGS, particleCount: 30000 },
  'ffu-array': { T: 22, RH: 45, P: 50, flow: AHU_FAN_FLOW_KGS * 0.6, particleCount: 100 },
};

// ── Gas Constants ──

export const SENSOR_TAU_S = 3; // first-order lag time constant
export const SENSOR_DRIFT_PER_S = 0.001 / 3600; // 0.1% per hour in per-second
export const DIFFUSION_COEFF = 2e-5; // m2/s typical gas in air

export const GAS_SENSOR_CONFIGS: Omit<GasSensorState, 'concentration' | 'concentrationActual' | 'status' | 'drift'>[] = [
  { id: 'gas-01', species: 'O2', position_r: 2, unit: '%', lowAlarm: 19.5, highAlarm: 23.5 },
  { id: 'gas-02', species: 'O2', position_r: 5, unit: '%', lowAlarm: 19.5, highAlarm: 23.5 },
  { id: 'gas-03', species: 'CO', position_r: 1.5, unit: 'ppm', lowAlarm: 25, highAlarm: 50 },
  { id: 'gas-04', species: 'H2', position_r: 2, unit: 'ppm', lowAlarm: 100, highAlarm: 500 },
  { id: 'gas-05', species: 'NH3', position_r: 1.8, unit: 'ppm', lowAlarm: 25, highAlarm: 50 },
  { id: 'gas-06', species: 'H2S', position_r: 1.5, unit: 'ppm', lowAlarm: 5, highAlarm: 10 },
  { id: 'gas-07', species: 'Cl2', position_r: 2.5, unit: 'ppm', lowAlarm: 0.5, highAlarm: 1 },
  { id: 'gas-08', species: 'CO', position_r: 4, unit: 'ppm', lowAlarm: 25, highAlarm: 50 },
];

export const GAS_BASELINES: Record<GasSpecies, number> = {
  O2: 20.9,
  H2: 8,
  NH3: 2,
  CO: 4,
  Cl2: 0.1,
  H2S: 0.5,
};

export const SCRUBBER_FLOW_MAX = 0.5; // m3/s
export const SCRUBBER_ETA_MAX = 0.98;
export const SCRUBBER_POWER_BASE = 5; // kW
export const SCRUBBER_POWER_K = 40; // kW/(m3/s)^2
export const CABINET_PRESSURE_PA = 300000; // ~3 atm
export const LEAK_RATE_K = 1e-10; // baseline leak coefficient
export const LEAK_TEMP_ALPHA = 0.02; // per degree C above 22

export const INITIAL_SCRUBBER: ScrubberState = {
  inletFlow: 0.05,
  efficiency: SCRUBBER_ETA_MAX,
  powerDraw: SCRUBBER_POWER_BASE + SCRUBBER_POWER_K * 0.05 * 0.05,
  online: true,
};

// ── Power Constants ──

export const UTILITY_VOLTAGE = 230;
export const UTILITY_FREQ_HZ = 50;
export const TRANSFORMER_KVA = 500;
export const TRANSFORMER_Z_PCT = 0.05;
export const TRANSFORMER_TURNS_RATIO = 1.0;
export const TRANSFORMER_THETA_RISE_MAX = 65; // C above ambient
export const TRANSFORMER_TAU_S = 300; // thermal time constant
export const AMBIENT_TEMP_C = 25;
export const TRANSFORMER_ALARM_TEMP = 85;
export const UPS_KVA = 120;
export const UPS_BATTERY_V = 384; // 384V DC bus
export const UPS_CAPACITY_AH = 100;
export const UPS_SOC_CRITICAL = 0.20;
export const UPS_TRANSFER_V = 210; // voltage sag threshold
export const PDU_RATED_A = 400;
export const LIGHTING_LOAD_KW = 12;
export const PROCESS_TOOLS_LOAD_KW = 85;
export const PF_ALARM_THRESHOLD = 0.85;

export const INITIAL_POWER_NODES: Record<PowerNodeId, PowerNodeState> = {
  'utility': { V: 230, I: 0, P_active: 0, P_reactive: 0, PF: 1, theta: 25 },
  'transformer-t1': { V: 230, I: 260, P_active: 55, P_reactive: 18, PF: 0.95, theta: 45 },
  'transformer-t2': { V: 230, I: 0, P_active: 0, P_reactive: 0, PF: 1, theta: 28 },
  'switchgear': { V: 228, I: 260, P_active: 55, P_reactive: 18, PF: 0.95, theta: 30 },
  'pdu-a': { V: 227, I: 260, P_active: 55, P_reactive: 18, PF: 0.95, theta: 32 },
  'load-bus': { V: 226, I: 260, P_active: 55, P_reactive: 18, PF: 0.95, theta: 30 },
};

export const INITIAL_UPS: UpsState = {
  online: false,
  soc: 1.0,
  outputV: 230,
};

// ── Fault Scenarios ──

export const FACILITY_SCENARIOS: FacilityScenario[] = [
  { id: 'nominal', label: 'Nominal', origin: 'hvac', description: 'Steady-state baseline operation' },
  { id: 'ups-depletion', label: 'UPS Battery Depletion', origin: 'power', description: 'SOC forced to 18%, utility voltage sag to 205V' },
  { id: 'transformer-overload', label: 'Transformer Overload', origin: 'power', description: 'Load spike to 110% rated, T1 temp ramp to 95C' },
  { id: 'chiller-failure', label: 'Chiller Failure', origin: 'hvac', description: 'Chiller cooling capacity drops to 0' },
  { id: 'ahu-fan-failure', label: 'AHU Fan Failure', origin: 'hvac', description: 'AHU flow and fan power drop to 0' },
  { id: 'pressure-breach', label: 'Cleanroom Pressure Breach', origin: 'hvac', description: 'Pressure differential forced to 0 Pa' },
  { id: 'chemical-leak', label: 'Chemical Leak (NH3)', origin: 'gas', description: 'NH3 cabinet leak rate x50' },
  { id: 'scrubber-failure', label: 'Scrubber Failure', origin: 'gas', description: 'Scrubber efficiency drops to 0%' },
];

// ── Coupled Variables Initial ──

export const INITIAL_COUPLED: import('./facility-types').CoupledVariables = {
  hvac_zone_cr_temp: 22,
  hvac_ahu_flow: AHU_FAN_FLOW_KGS,
  hvac_ahu_power_draw: AHU_FAN_POWER_KW,
  hvac_pressure_diff: ZONE_CR_PRESSURE_PA,
  gas_scrubber_power_draw: SCRUBBER_POWER_BASE,
  gas_total_leak_rate: 0,
  gas_scrubber_exhaust_temp: 30,
  power_voltage: UTILITY_VOLTAGE,
  power_available: true,
  power_ups_active: false,
};

// ── 3D Equipment Mapping ──

export const SUBSYSTEM_EQUIPMENT_MAP: Record<string, 'hvac' | 'gas' | 'power'> = {
  'PDU-A-01': 'power',
  'UPS-A': 'power',
  'AHU-SUPPLY-01': 'hvac',
  'CHILLED-WATER-LOOP': 'hvac',
  'GAS-CABINET-01': 'gas',
  'SCRUBBER-SUBFAB-01': 'gas',
};

// ── Cascade Line Definitions (per scenario) ──

export const SCENARIO_CASCADE_PATHS: Record<FacilityScenarioId, [string, string][]> = {
  'nominal': [],
  'ups-depletion': [['UPS-A', 'PDU-A-01'], ['PDU-A-01', 'AHU-SUPPLY-01'], ['AHU-SUPPLY-01', 'GAS-CABINET-01']],
  'transformer-overload': [['PDU-A-01', 'AHU-SUPPLY-01'], ['AHU-SUPPLY-01', 'CHILLED-WATER-LOOP']],
  'chiller-failure': [['CHILLED-WATER-LOOP', 'AHU-SUPPLY-01'], ['AHU-SUPPLY-01', 'GAS-CABINET-01'], ['GAS-CABINET-01', 'SCRUBBER-SUBFAB-01'], ['SCRUBBER-SUBFAB-01', 'PDU-A-01']],
  'ahu-fan-failure': [['AHU-SUPPLY-01', 'GAS-CABINET-01'], ['GAS-CABINET-01', 'SCRUBBER-SUBFAB-01']],
  'pressure-breach': [['AHU-SUPPLY-01', 'GAS-CABINET-01']],
  'chemical-leak': [['GAS-CABINET-01', 'SCRUBBER-SUBFAB-01'], ['SCRUBBER-SUBFAB-01', 'PDU-A-01'], ['PDU-A-01', 'AHU-SUPPLY-01']],
  'scrubber-failure': [['SCRUBBER-SUBFAB-01', 'GAS-CABINET-01'], ['GAS-CABINET-01', 'AHU-SUPPLY-01'], ['AHU-SUPPLY-01', 'PDU-A-01']],
};
```

**Step 3: Commit**

```bash
git add src/lib/engines/facility-types.ts src/lib/engines/facility-constants.ts
git commit -m "feat(facility): add types and constants for HVAC/Gas/Power simulation engines"
```

---

## Task 2: History Ring Buffer

**Files:**
- Create: `src/lib/engines/history-buffer.ts`
- Create: `src/lib/engines/__tests__/history-buffer.test.ts`

**Step 1: Write failing tests**

```typescript
// src/lib/engines/__tests__/history-buffer.test.ts

import { HistoryBuffer } from '../history-buffer';

describe('HistoryBuffer', () => {
  test('starts empty', () => {
    const buf = new HistoryBuffer<number>(10);
    expect(buf.length).toBe(0);
    expect(buf.toArray()).toEqual([]);
  });

  test('push adds values', () => {
    const buf = new HistoryBuffer<number>(5);
    buf.push(1);
    buf.push(2);
    expect(buf.length).toBe(2);
    expect(buf.toArray()).toEqual([1, 2]);
  });

  test('wraps at capacity', () => {
    const buf = new HistoryBuffer<number>(3);
    buf.push(1);
    buf.push(2);
    buf.push(3);
    buf.push(4);
    expect(buf.length).toBe(3);
    expect(buf.toArray()).toEqual([2, 3, 4]);
  });

  test('latest returns most recent value', () => {
    const buf = new HistoryBuffer<number>(5);
    buf.push(10);
    buf.push(20);
    expect(buf.latest()).toBe(20);
  });

  test('latest returns undefined when empty', () => {
    const buf = new HistoryBuffer<number>(5);
    expect(buf.latest()).toBeUndefined();
  });

  test('last(n) returns tail slice', () => {
    const buf = new HistoryBuffer<number>(10);
    for (let i = 0; i < 7; i++) buf.push(i);
    expect(buf.last(3)).toEqual([4, 5, 6]);
  });

  test('last(n) with n > length returns all', () => {
    const buf = new HistoryBuffer<number>(10);
    buf.push(1);
    buf.push(2);
    expect(buf.last(5)).toEqual([1, 2]);
  });

  test('clear resets buffer', () => {
    const buf = new HistoryBuffer<number>(5);
    buf.push(1);
    buf.push(2);
    buf.clear();
    expect(buf.length).toBe(0);
    expect(buf.toArray()).toEqual([]);
  });

  test('handles 300-point capacity (production size)', () => {
    const buf = new HistoryBuffer<number>(300);
    for (let i = 0; i < 500; i++) buf.push(i);
    expect(buf.length).toBe(300);
    expect(buf.toArray()[0]).toBe(200);
    expect(buf.latest()).toBe(499);
  });

  test('works with object values', () => {
    const buf = new HistoryBuffer<{ t: number; v: number }>(3);
    buf.push({ t: 0, v: 100 });
    buf.push({ t: 1, v: 200 });
    buf.push({ t: 2, v: 300 });
    buf.push({ t: 3, v: 400 });
    expect(buf.toArray()).toEqual([
      { t: 1, v: 200 },
      { t: 2, v: 300 },
      { t: 3, v: 400 },
    ]);
  });
});
```

**Step 2: Run tests, verify fail**

```bash
npx jest src/lib/engines/__tests__/history-buffer.test.ts --no-coverage
```
Expected: FAIL — module not found

**Step 3: Implement**

```typescript
// src/lib/engines/history-buffer.ts

export class HistoryBuffer<T> {
  private buf: (T | undefined)[];
  private head = 0;
  private count = 0;
  private readonly cap: number;

  constructor(capacity: number) {
    this.cap = capacity;
    this.buf = new Array(capacity);
  }

  push(value: T): void {
    this.buf[this.head] = value;
    this.head = (this.head + 1) % this.cap;
    if (this.count < this.cap) this.count++;
  }

  get length(): number {
    return this.count;
  }

  latest(): T | undefined {
    if (this.count === 0) return undefined;
    return this.buf[(this.head - 1 + this.cap) % this.cap];
  }

  toArray(): T[] {
    if (this.count === 0) return [];
    const start = (this.head - this.count + this.cap) % this.cap;
    const result: T[] = [];
    for (let i = 0; i < this.count; i++) {
      result.push(this.buf[(start + i) % this.cap] as T);
    }
    return result;
  }

  last(n: number): T[] {
    const arr = this.toArray();
    return n >= arr.length ? arr : arr.slice(arr.length - n);
  }

  clear(): void {
    this.head = 0;
    this.count = 0;
    this.buf = new Array(this.cap);
  }
}
```

**Step 4: Run tests, verify pass**

```bash
npx jest src/lib/engines/__tests__/history-buffer.test.ts --no-coverage
```
Expected: 10 tests PASS

**Step 5: Commit**

```bash
git add src/lib/engines/history-buffer.ts src/lib/engines/__tests__/history-buffer.test.ts
git commit -m "feat(facility): history ring buffer with 300-point capacity for trend data"
```

---

## Task 3: HVAC Engine

**Files:**
- Create: `src/lib/engines/hvac-engine.ts`
- Create: `src/lib/engines/__tests__/hvac-engine.test.ts`

**Step 1: Write failing tests**

```typescript
// src/lib/engines/__tests__/hvac-engine.test.ts

import {
  createInitialHvacState,
  stepHvac,
  computeHvacAlarms,
} from '../hvac-engine';
import type { CoupledVariables } from '../facility-types';
import { INITIAL_COUPLED, ISO5_LIMIT, ISO7_LIMIT } from '../facility-constants';

function nominalCoupled(): CoupledVariables {
  return { ...INITIAL_COUPLED };
}

describe('createInitialHvacState', () => {
  test('returns state with 7 nodes', () => {
    const state = createInitialHvacState();
    expect(Object.keys(state.nodes)).toHaveLength(7);
  });

  test('chiller online by default', () => {
    const state = createInitialHvacState();
    expect(state.chillerOnline).toBe(true);
  });

  test('zone-cr starts at ~22C', () => {
    const state = createInitialHvacState();
    expect(state.nodes['zone-cr'].T).toBeCloseTo(22, 0);
  });

  test('zone-cr starts below ISO 5 limit', () => {
    const state = createInitialHvacState();
    expect(state.nodes['zone-cr'].particleCount).toBeLessThan(ISO5_LIMIT);
  });
});

describe('stepHvac', () => {
  test('steady state preserves temperature within 0.5C over 10 ticks', () => {
    let state = createInitialHvacState();
    const coupled = nominalCoupled();
    const t0 = state.nodes['zone-cr'].T;
    for (let i = 0; i < 10; i++) {
      state = stepHvac(state, 1, coupled, 'nominal');
    }
    expect(Math.abs(state.nodes['zone-cr'].T - t0)).toBeLessThan(0.5);
  });

  test('chiller failure causes temperature rise', () => {
    let state = createInitialHvacState();
    const coupled = nominalCoupled();
    const t0 = state.nodes['zone-cr'].T;
    for (let i = 0; i < 60; i++) {
      state = stepHvac(state, 1, coupled, 'chiller-failure');
    }
    expect(state.nodes['zone-cr'].T).toBeGreaterThan(t0 + 1);
  });

  test('AHU fan failure causes particle count spike', () => {
    let state = createInitialHvacState();
    const coupled = nominalCoupled();
    const p0 = state.nodes['zone-cr'].particleCount;
    for (let i = 0; i < 30; i++) {
      state = stepHvac(state, 1, coupled, 'ahu-fan-failure');
    }
    expect(state.nodes['zone-cr'].particleCount).toBeGreaterThan(p0 * 5);
  });

  test('pressure breach drops zone-cr pressure to ~0', () => {
    let state = createInitialHvacState();
    const coupled = nominalCoupled();
    for (let i = 0; i < 10; i++) {
      state = stepHvac(state, 1, coupled, 'pressure-breach');
    }
    expect(state.nodes['zone-cr'].P).toBeLessThan(5);
  });

  test('low voltage from power reduces AHU flow proportionally', () => {
    let state = createInitialHvacState();
    const coupled = nominalCoupled();
    coupled.power_voltage = 200; // sag
    coupled.power_available = true;
    for (let i = 0; i < 5; i++) {
      state = stepHvac(state, 1, coupled, 'nominal');
    }
    expect(state.nodes['ahu-supply'].flow).toBeLessThan(7.0);
  });

  test('power unavailable stops AHU completely', () => {
    let state = createInitialHvacState();
    const coupled = nominalCoupled();
    coupled.power_available = false;
    for (let i = 0; i < 5; i++) {
      state = stepHvac(state, 1, coupled, 'nominal');
    }
    expect(state.nodes['ahu-supply'].flow).toBeCloseTo(0, 1);
  });

  test('returns valid coupled outputs', () => {
    const state = createInitialHvacState();
    const coupled = nominalCoupled();
    const next = stepHvac(state, 1, coupled, 'nominal');
    expect(next.nodes['zone-cr'].T).toBeGreaterThan(0);
    expect(next.nodes['zone-cr'].T).toBeLessThan(80);
  });

  test('humidity stays in physical range 0-100', () => {
    let state = createInitialHvacState();
    const coupled = nominalCoupled();
    for (let i = 0; i < 120; i++) {
      state = stepHvac(state, 1, coupled, 'chiller-failure');
    }
    expect(state.nodes['zone-cr'].RH).toBeGreaterThanOrEqual(0);
    expect(state.nodes['zone-cr'].RH).toBeLessThanOrEqual(100);
  });
});

describe('computeHvacAlarms', () => {
  test('nominal state produces no alarms', () => {
    const state = createInitialHvacState();
    const alarms = computeHvacAlarms(state, 0);
    expect(alarms).toHaveLength(0);
  });

  test('high temperature triggers warning', () => {
    const state = createInitialHvacState();
    state.nodes['zone-cr'].T = 28;
    const alarms = computeHvacAlarms(state, 0);
    expect(alarms.some(a => a.severity === 'warning' && a.message.includes('temp'))).toBe(true);
  });

  test('ISO 5 violation triggers critical', () => {
    const state = createInitialHvacState();
    state.nodes['zone-cr'].particleCount = ISO5_LIMIT + 1000;
    const alarms = computeHvacAlarms(state, 0);
    expect(alarms.some(a => a.severity === 'critical')).toBe(true);
  });

  test('pressure loss triggers warning', () => {
    const state = createInitialHvacState();
    state.nodes['zone-cr'].P = 2;
    const alarms = computeHvacAlarms(state, 0);
    expect(alarms.some(a => a.message.includes('pressure'))).toBe(true);
  });
});
```

**Step 2: Run tests, verify fail**

```bash
npx jest src/lib/engines/__tests__/hvac-engine.test.ts --no-coverage
```

**Step 3: Implement**

```typescript
// src/lib/engines/hvac-engine.ts

import type {
  HvacEngineState,
  HvacNetworkState,
  CoupledVariables,
  FacilityScenarioId,
  FacilityAlarm,
} from './facility-types';
import {
  INITIAL_HVAC_NODES,
  AHU_FAN_FLOW_KGS,
  AHU_FAN_POWER_KW,
  CHILLER_CAPACITY_KW,
  AIR_CP,
  ZONE_MASS_KG,
  EQUIPMENT_HEAT_W,
  OCCUPANT_HEAT_W,
  OCCUPANT_COUNT,
  OCCUPANT_PARTICLES,
  OCCUPANT_MOISTURE_GS,
  FFU_EFFICIENCY,
  ZONE_CR_PRESSURE_PA,
  AMBIENT_PARTICLE_COUNT,
  ISO5_LIMIT,
  ISO7_LIMIT,
  UTILITY_VOLTAGE,
} from './facility-constants';

export function createInitialHvacState(): HvacEngineState {
  return {
    nodes: structuredClone(INITIAL_HVAC_NODES),
    chillerOnline: true,
    ahuFanOnline: true,
    doorBreached: false,
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function stepHvac(
  prev: HvacEngineState,
  dt: number,
  coupled: CoupledVariables,
  scenario: FacilityScenarioId,
): HvacEngineState {
  const nodes: HvacNetworkState = structuredClone(prev.nodes);

  // Scenario overrides
  const chillerOnline = scenario !== 'chiller-failure' && prev.chillerOnline;
  const ahuFanOnline = scenario !== 'ahu-fan-failure' && coupled.power_available;
  const doorBreached = scenario === 'pressure-breach';

  // Voltage derating factor for AHU motor speed
  const voltageFactor = coupled.power_available
    ? clamp(coupled.power_voltage / UTILITY_VOLTAGE, 0, 1)
    : 0;
  const fanFactor = ahuFanOnline ? voltageFactor : 0;

  // AHU flow
  const ahuFlow = AHU_FAN_FLOW_KGS * fanFactor;
  nodes['ahu-supply'].flow = ahuFlow;
  nodes['duct-main'].flow = ahuFlow;
  nodes['zone-cr'].flow = ahuFlow * 0.6;
  nodes['zone-prod'].flow = ahuFlow * 0.4;
  nodes['ffu-array'].flow = ahuFlow * 0.6;
  nodes['return-plenum'].flow = ahuFlow;
  nodes['chiller'].flow = ahuFlow;

  // Chiller — cools supply air
  if (chillerOnline && ahuFlow > 0) {
    const coolingPower = CHILLER_CAPACITY_KW * 1000; // W
    const deltaT = coolingPower / (ahuFlow * AIR_CP);
    nodes['ahu-supply'].T = nodes['return-plenum'].T - deltaT;
    nodes['ahu-supply'].T = clamp(nodes['ahu-supply'].T, 5, 40);
    // Dehumidify at cooling coil
    if (nodes['ahu-supply'].T < 14) {
      nodes['ahu-supply'].RH = clamp(nodes['ahu-supply'].RH - 2 * dt, 40, 100);
    }
  } else {
    // No cooling — supply air = return air (pass-through)
    nodes['ahu-supply'].T = nodes['return-plenum'].T;
    nodes['ahu-supply'].RH = nodes['return-plenum'].RH;
  }

  // Duct — small heat gain
  nodes['duct-main'].T = nodes['ahu-supply'].T + 0.5;
  nodes['duct-main'].RH = nodes['ahu-supply'].RH;

  // Zone-CR energy balance
  const heatGain = EQUIPMENT_HEAT_W * 0.6 + OCCUPANT_HEAT_W * OCCUPANT_COUNT;
  const supplyT = nodes['duct-main'].T;
  const crFlow = nodes['zone-cr'].flow;
  const coolRate = crFlow > 0.01 ? crFlow * AIR_CP * (nodes['zone-cr'].T - supplyT) : 0;
  const dT_cr = dt * (heatGain - coolRate) / (ZONE_MASS_KG * AIR_CP);
  nodes['zone-cr'].T = clamp(nodes['zone-cr'].T + dT_cr, 5, 80);

  // Zone-CR humidity
  const moistureGain = OCCUPANT_MOISTURE_GS * OCCUPANT_COUNT * dt;
  const moistureRemoval = crFlow > 0.01 ? crFlow * (nodes['zone-cr'].RH - nodes['duct-main'].RH) * 0.001 * dt : 0;
  nodes['zone-cr'].RH = clamp(nodes['zone-cr'].RH + (moistureGain - moistureRemoval) * 0.1, 0, 100);

  // Zone-CR particles
  const particleGeneration = OCCUPANT_PARTICLES * OCCUPANT_COUNT * dt;
  const ffuRemoval = crFlow > 0.01 ? nodes['zone-cr'].particleCount * FFU_EFFICIENCY * (crFlow / (ZONE_MASS_KG / 1.2)) * dt : 0;
  const ambientIngress = doorBreached ? AMBIENT_PARTICLE_COUNT * 0.001 * dt : 0;
  nodes['zone-cr'].particleCount = clamp(
    nodes['zone-cr'].particleCount + particleGeneration - ffuRemoval + ambientIngress,
    0, AMBIENT_PARTICLE_COUNT,
  );

  // Zone-CR pressure
  if (doorBreached) {
    nodes['zone-cr'].P = clamp(nodes['zone-cr'].P - 5 * dt, 0, ZONE_CR_PRESSURE_PA);
  } else if (ahuFanOnline) {
    nodes['zone-cr'].P = clamp(nodes['zone-cr'].P + (ZONE_CR_PRESSURE_PA - nodes['zone-cr'].P) * 0.1 * dt, 0, 50);
  } else {
    nodes['zone-cr'].P = clamp(nodes['zone-cr'].P - 2 * dt, 0, ZONE_CR_PRESSURE_PA);
  }

  // Zone-Prod (similar but less strict)
  const heatGainProd = EQUIPMENT_HEAT_W * 0.4;
  const prodFlow = nodes['zone-prod'].flow;
  const coolRateProd = prodFlow > 0.01 ? prodFlow * AIR_CP * (nodes['zone-prod'].T - supplyT) : 0;
  const dT_prod = dt * (heatGainProd - coolRateProd) / (ZONE_MASS_KG * AIR_CP);
  nodes['zone-prod'].T = clamp(nodes['zone-prod'].T + dT_prod, 5, 80);
  nodes['zone-prod'].RH = clamp(nodes['zone-prod'].RH + (moistureGain * 0.3 - (prodFlow > 0 ? 0.05 : 0)) * 0.1, 0, 100);
  nodes['zone-prod'].particleCount = clamp(
    nodes['zone-prod'].particleCount + particleGeneration * 2 -
    (prodFlow > 0 ? nodes['zone-prod'].particleCount * 0.005 * dt : 0) +
    (doorBreached ? AMBIENT_PARTICLE_COUNT * 0.0005 * dt : 0),
    0, AMBIENT_PARTICLE_COUNT,
  );
  nodes['zone-prod'].P = clamp(
    doorBreached ? nodes['zone-prod'].P - 3 * dt : nodes['zone-prod'].P + (15 - nodes['zone-prod'].P) * 0.1 * dt,
    0, 30,
  );

  // FFU array
  nodes['ffu-array'].T = nodes['zone-cr'].T;
  nodes['ffu-array'].particleCount = nodes['zone-cr'].particleCount * (1 - FFU_EFFICIENCY);

  // Return plenum — mix of zone returns
  nodes['return-plenum'].T = (nodes['zone-cr'].T * 0.6 + nodes['zone-prod'].T * 0.4);
  nodes['return-plenum'].RH = (nodes['zone-cr'].RH * 0.6 + nodes['zone-prod'].RH * 0.4);
  nodes['return-plenum'].particleCount = (nodes['zone-cr'].particleCount * 0.6 + nodes['zone-prod'].particleCount * 0.4);

  // Chiller node
  nodes['chiller'].T = chillerOnline ? 7 : nodes['return-plenum'].T;

  // AHU pressure
  nodes['ahu-supply'].P = ahuFanOnline ? 250 * fanFactor : 0;
  nodes['duct-main'].P = nodes['ahu-supply'].P * 0.48;
  nodes['ffu-array'].P = nodes['zone-cr'].P + 30;

  return {
    nodes,
    chillerOnline,
    ahuFanOnline,
    doorBreached,
  };
}

export function getHvacCoupledOutputs(state: HvacEngineState): Pick<
  CoupledVariables,
  'hvac_zone_cr_temp' | 'hvac_ahu_flow' | 'hvac_ahu_power_draw' | 'hvac_pressure_diff'
> {
  return {
    hvac_zone_cr_temp: state.nodes['zone-cr'].T,
    hvac_ahu_flow: state.nodes['ahu-supply'].flow,
    hvac_ahu_power_draw: state.ahuFanOnline ? AHU_FAN_POWER_KW * (state.nodes['ahu-supply'].flow / AHU_FAN_FLOW_KGS) : 0,
    hvac_pressure_diff: state.nodes['zone-cr'].P,
  };
}

export function computeHvacAlarms(state: HvacEngineState, tick: number): FacilityAlarm[] {
  const alarms: FacilityAlarm[] = [];
  const cr = state.nodes['zone-cr'];

  if (cr.T > 26) {
    alarms.push({ subsystem: 'hvac', message: `Cleanroom temp ${cr.T.toFixed(1)}C exceeds 26C limit`, severity: cr.T > 30 ? 'critical' : 'warning', tick });
  }
  if (cr.particleCount > ISO5_LIMIT) {
    alarms.push({ subsystem: 'hvac', message: `ISO 5 violation: ${Math.round(cr.particleCount)} particles/m3 (limit ${ISO5_LIMIT})`, severity: 'critical', tick });
  }
  if (cr.P < 5) {
    alarms.push({ subsystem: 'hvac', message: `Cleanroom pressure differential ${cr.P.toFixed(1)} Pa below 5 Pa minimum`, severity: 'warning', tick });
  }
  if (cr.RH > 60) {
    alarms.push({ subsystem: 'hvac', message: `Cleanroom humidity ${cr.RH.toFixed(1)}% exceeds 60% limit`, severity: 'warning', tick });
  }
  if (!state.chillerOnline) {
    alarms.push({ subsystem: 'hvac', message: 'Chiller offline — no active cooling', severity: 'critical', tick });
  }
  if (!state.ahuFanOnline) {
    alarms.push({ subsystem: 'hvac', message: 'AHU fan offline — no airflow', severity: 'critical', tick });
  }
  const prod = state.nodes['zone-prod'];
  if (prod.particleCount > ISO7_LIMIT) {
    alarms.push({ subsystem: 'hvac', message: `Production zone ISO 7 violation: ${Math.round(prod.particleCount)} particles/m3`, severity: 'warning', tick });
  }

  return alarms;
}
```

**Step 4: Run tests, verify pass**

```bash
npx jest src/lib/engines/__tests__/hvac-engine.test.ts --no-coverage
```
Expected: 12 tests PASS. If any assertion thresholds need tuning, adjust the test expectations to match the physics model's actual steady-state output (e.g., if temperature drifts slightly from initial, widen the tolerance).

**Step 5: Commit**

```bash
git add src/lib/engines/hvac-engine.ts src/lib/engines/__tests__/hvac-engine.test.ts
git commit -m "feat(facility): HVAC lumped-parameter network engine with 7-node energy balance"
```

---

## Task 4: Gas Engine

**Files:**
- Create: `src/lib/engines/gas-engine.ts`
- Create: `src/lib/engines/__tests__/gas-engine.test.ts`

**Step 1: Write failing tests**

```typescript
// src/lib/engines/__tests__/gas-engine.test.ts

import {
  createInitialGasState,
  stepGas,
  computeGasAlarms,
} from '../gas-engine';
import type { CoupledVariables } from '../facility-types';
import { INITIAL_COUPLED, GAS_BASELINES } from '../facility-constants';

function nominalCoupled(): CoupledVariables {
  return { ...INITIAL_COUPLED };
}

describe('createInitialGasState', () => {
  test('returns 8 sensors', () => {
    const state = createInitialGasState();
    expect(state.sensors).toHaveLength(8);
  });

  test('O2 sensors start near 20.9%', () => {
    const state = createInitialGasState();
    const o2 = state.sensors.filter(s => s.species === 'O2');
    expect(o2).toHaveLength(2);
    o2.forEach(s => expect(s.concentration).toBeCloseTo(20.9, 0));
  });

  test('scrubber starts online', () => {
    const state = createInitialGasState();
    expect(state.scrubber.online).toBe(true);
  });

  test('all sensors start in normal status', () => {
    const state = createInitialGasState();
    state.sensors.forEach(s => expect(s.status).toBe('normal'));
  });
});

describe('stepGas', () => {
  test('steady state keeps concentrations near baseline', () => {
    let state = createInitialGasState();
    const coupled = nominalCoupled();
    for (let i = 0; i < 30; i++) {
      state = stepGas(state, 1, coupled, 'nominal');
    }
    const nh3 = state.sensors.find(s => s.species === 'NH3')!;
    expect(nh3.concentration).toBeLessThan(10); // well below 25 ppm alarm
  });

  test('chemical leak causes NH3 spike', () => {
    let state = createInitialGasState();
    const coupled = nominalCoupled();
    for (let i = 0; i < 60; i++) {
      state = stepGas(state, 1, coupled, 'chemical-leak');
    }
    const nh3 = state.sensors.find(s => s.species === 'NH3')!;
    expect(nh3.concentration).toBeGreaterThan(25); // above alarm threshold
  });

  test('scrubber failure causes concentration rise in multiple gases', () => {
    let state = createInitialGasState();
    const coupled = nominalCoupled();
    for (let i = 0; i < 60; i++) {
      state = stepGas(state, 1, coupled, 'scrubber-failure');
    }
    expect(state.scrubber.efficiency).toBeCloseTo(0, 1);
  });

  test('high temperature from HVAC increases leak rate', () => {
    let state = createInitialGasState();
    const coupled = nominalCoupled();
    coupled.hvac_zone_cr_temp = 35; // hot cleanroom
    const coupled22 = nominalCoupled();
    coupled22.hvac_zone_cr_temp = 22;

    let stateHot = createInitialGasState();
    let stateCold = createInitialGasState();
    for (let i = 0; i < 30; i++) {
      stateHot = stepGas(stateHot, 1, coupled, 'nominal');
      stateCold = stepGas(stateCold, 1, coupled22, 'nominal');
    }
    const nh3Hot = stateHot.sensors.find(s => s.species === 'NH3')!;
    const nh3Cold = stateCold.sensors.find(s => s.species === 'NH3')!;
    expect(nh3Hot.concentration).toBeGreaterThan(nh3Cold.concentration);
  });

  test('sensor lag delays measured value', () => {
    let state = createInitialGasState();
    const coupled = nominalCoupled();
    // Force a sudden actual concentration change
    state = stepGas(state, 1, coupled, 'chemical-leak');
    const nh3 = state.sensors.find(s => s.species === 'NH3')!;
    // Measured should lag behind actual
    expect(nh3.concentration).toBeLessThan(nh3.concentrationActual);
  });

  test('O2 displacement when gases leak', () => {
    let state = createInitialGasState();
    const coupled = nominalCoupled();
    for (let i = 0; i < 60; i++) {
      state = stepGas(state, 1, coupled, 'chemical-leak');
    }
    const o2 = state.sensors.find(s => s.species === 'O2')!;
    expect(o2.concentrationActual).toBeLessThan(20.9);
  });

  test('concentrations are clamped non-negative', () => {
    let state = createInitialGasState();
    const coupled = nominalCoupled();
    for (let i = 0; i < 120; i++) {
      state = stepGas(state, 1, coupled, 'nominal');
    }
    state.sensors.forEach(s => {
      expect(s.concentration).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('computeGasAlarms', () => {
  test('nominal state produces no alarms', () => {
    const state = createInitialGasState();
    expect(computeGasAlarms(state, 0)).toHaveLength(0);
  });

  test('NH3 above threshold triggers alarm', () => {
    const state = createInitialGasState();
    const nh3 = state.sensors.find(s => s.species === 'NH3')!;
    nh3.concentration = 30;
    nh3.status = 'alarm';
    const alarms = computeGasAlarms(state, 0);
    expect(alarms.some(a => a.severity === 'critical')).toBe(true);
  });

  test('O2 below 19.5% triggers critical', () => {
    const state = createInitialGasState();
    const o2 = state.sensors.find(s => s.species === 'O2')!;
    o2.concentration = 19.0;
    o2.status = 'alarm';
    const alarms = computeGasAlarms(state, 0);
    expect(alarms.some(a => a.message.includes('O2') && a.severity === 'critical')).toBe(true);
  });

  test('scrubber offline triggers warning', () => {
    const state = createInitialGasState();
    state.scrubber.online = false;
    const alarms = computeGasAlarms(state, 0);
    expect(alarms.some(a => a.message.includes('crubber'))).toBe(true);
  });
});
```

**Step 2: Run tests, verify fail**

```bash
npx jest src/lib/engines/__tests__/gas-engine.test.ts --no-coverage
```

**Step 3: Implement**

```typescript
// src/lib/engines/gas-engine.ts

import type {
  GasEngineState,
  GasSensorState,
  ScrubberState,
  CoupledVariables,
  FacilityScenarioId,
  FacilityAlarm,
  GasSpecies,
} from './facility-types';
import {
  GAS_SENSOR_CONFIGS,
  GAS_BASELINES,
  SENSOR_TAU_S,
  SENSOR_DRIFT_PER_S,
  DIFFUSION_COEFF,
  SCRUBBER_ETA_MAX,
  SCRUBBER_FLOW_MAX,
  SCRUBBER_POWER_BASE,
  SCRUBBER_POWER_K,
  CABINET_PRESSURE_PA,
  LEAK_RATE_K,
  LEAK_TEMP_ALPHA,
  INITIAL_SCRUBBER,
} from './facility-constants';

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function createInitialGasState(): GasEngineState {
  const sensors: GasSensorState[] = GAS_SENSOR_CONFIGS.map(cfg => ({
    ...cfg,
    concentration: GAS_BASELINES[cfg.species],
    concentrationActual: GAS_BASELINES[cfg.species],
    status: 'normal' as const,
    drift: 0,
  }));

  return {
    sensors,
    scrubber: { ...INITIAL_SCRUBBER },
    cabinetPressure: CABINET_PRESSURE_PA,
    leakRateMultiplier: 1,
  };
}

function computeLeakRate(
  species: GasSpecies,
  cabinetPressure: number,
  tempC: number,
  multiplier: number,
): number {
  const tempFactor = 1 + LEAK_TEMP_ALPHA * Math.max(0, tempC - 22);
  const baseRate = LEAK_RATE_K * cabinetPressure * tempFactor;
  // O2 doesn't leak from cabinets
  if (species === 'O2') return 0;
  return baseRate * multiplier;
}

function computeConcentrationAtSensor(
  leakRate: number,
  position_r: number,
  t: number,
  scrubberEfficiency: number,
  ahuFlow: number,
): number {
  if (leakRate <= 0) return 0;
  // Gaussian plume: C = Q / (4*pi*D*t_eff) * exp(-r^2/(4*D*t_eff))
  const t_eff = Math.max(t, 1); // avoid division by zero
  const raw = (leakRate / (4 * Math.PI * DIFFUSION_COEFF * t_eff)) *
    Math.exp(-(position_r * position_r) / (4 * DIFFUSION_COEFF * t_eff));
  // Scrubber removes a fraction, dilution by airflow
  const afterScrubber = raw * (1 - scrubberEfficiency);
  const dilutionFactor = ahuFlow > 0.01 ? 1 / (1 + ahuFlow * 10) : 1;
  // Convert mol/m3 to ppm (approximate: 1 mol/m3 ~ 24400 ppm at STP)
  return afterScrubber * dilutionFactor * 24400;
}

export function stepGas(
  prev: GasEngineState,
  dt: number,
  coupled: CoupledVariables,
  scenario: FacilityScenarioId,
): GasEngineState {
  const scrubber: ScrubberState = { ...prev.scrubber };

  // Scenario overrides
  const leakMultiplier = scenario === 'chemical-leak' ? 50 : 1;
  if (scenario === 'scrubber-failure') {
    scrubber.efficiency = 0;
    scrubber.online = false;
  } else if (coupled.power_available) {
    scrubber.online = true;
    const flowRatio = scrubber.inletFlow / SCRUBBER_FLOW_MAX;
    scrubber.efficiency = SCRUBBER_ETA_MAX * (1 - clamp(flowRatio, 0, 1));
  } else {
    scrubber.online = false;
    scrubber.efficiency = 0;
  }

  const temp = coupled.hvac_zone_cr_temp;
  const ahuFlow = coupled.hvac_ahu_flow;

  // Compute total leak contribution for scrubber load
  let totalLeakRate = 0;
  const sensors: GasSensorState[] = prev.sensors.map(sensor => {
    const leakRate = computeLeakRate(sensor.species, prev.cabinetPressure, temp, leakMultiplier);
    totalLeakRate += leakRate;

    // True concentration at sensor
    let actual: number;
    if (sensor.species === 'O2') {
      // O2 displaced by other gases
      const totalGasPpm = prev.sensors
        .filter(s => s.species !== 'O2')
        .reduce((sum, s) => sum + s.concentrationActual, 0);
      actual = 20.9 * (1 - totalGasPpm / 1000000);
      actual = clamp(actual, 0, 21);
    } else {
      const baseline = GAS_BASELINES[sensor.species];
      const leakConcentration = computeConcentrationAtSensor(
        leakRate, sensor.position_r, 10, scrubber.efficiency, ahuFlow,
      );
      actual = baseline + leakConcentration;
    }

    // First-order sensor lag
    const measured = sensor.concentration + (dt / SENSOR_TAU_S) * (actual - sensor.concentration);

    // Drift
    const drift = sensor.drift + SENSOR_DRIFT_PER_S * dt;

    // Status
    let status: GasSensorState['status'] = 'normal';
    if (sensor.species === 'O2') {
      if (measured < sensor.lowAlarm || measured > sensor.highAlarm) status = 'alarm';
    } else {
      if (measured > sensor.highAlarm) status = 'alarm';
    }

    return {
      ...sensor,
      concentrationActual: clamp(actual, 0, sensor.species === 'O2' ? 25 : 100000),
      concentration: clamp(measured + drift, 0, sensor.species === 'O2' ? 25 : 100000),
      status,
      drift,
    };
  });

  // Scrubber load from total leaks
  scrubber.inletFlow = clamp(0.05 + totalLeakRate * 1e6, 0.01, SCRUBBER_FLOW_MAX * 1.2);
  scrubber.powerDraw = scrubber.online
    ? SCRUBBER_POWER_BASE + SCRUBBER_POWER_K * scrubber.inletFlow * scrubber.inletFlow
    : 0;

  return {
    sensors,
    scrubber,
    cabinetPressure: prev.cabinetPressure,
    leakRateMultiplier: leakMultiplier,
  };
}

export function getGasCoupledOutputs(state: GasEngineState): Pick<
  CoupledVariables,
  'gas_scrubber_power_draw' | 'gas_total_leak_rate' | 'gas_scrubber_exhaust_temp'
> {
  const totalLeak = state.sensors
    .filter(s => s.species !== 'O2')
    .reduce((sum, s) => sum + Math.max(0, s.concentrationActual - GAS_BASELINES[s.species]), 0);
  return {
    gas_scrubber_power_draw: state.scrubber.powerDraw,
    gas_total_leak_rate: totalLeak * 1e-6,
    gas_scrubber_exhaust_temp: 30 + state.scrubber.inletFlow * 20,
  };
}

export function computeGasAlarms(state: GasEngineState, tick: number): FacilityAlarm[] {
  const alarms: FacilityAlarm[] = [];

  for (const s of state.sensors) {
    if (s.status === 'alarm') {
      if (s.species === 'O2' && s.concentration < s.lowAlarm) {
        alarms.push({ subsystem: 'gas', message: `O2 low: ${s.concentration.toFixed(1)}% (limit ${s.lowAlarm}%)`, severity: 'critical', tick });
      } else if (s.species !== 'O2' && s.concentration > s.highAlarm) {
        alarms.push({ subsystem: 'gas', message: `${s.species} high: ${s.concentration.toFixed(1)} ${s.unit} (limit ${s.highAlarm})`, severity: 'critical', tick });
      }
    }
    if (s.status === 'fault') {
      alarms.push({ subsystem: 'gas', message: `Sensor ${s.id} (${s.species}) fault`, severity: 'warning', tick });
    }
  }

  if (!state.scrubber.online) {
    alarms.push({ subsystem: 'gas', message: 'Scrubber offline — exhaust not treated', severity: 'critical', tick });
  } else if (state.scrubber.inletFlow / SCRUBBER_FLOW_MAX > 0.9) {
    alarms.push({ subsystem: 'gas', message: `Scrubber at ${Math.round(state.scrubber.inletFlow / SCRUBBER_FLOW_MAX * 100)}% capacity`, severity: 'warning', tick });
  }

  return alarms;
}
```

**Step 4: Run tests, verify pass**

```bash
npx jest src/lib/engines/__tests__/gas-engine.test.ts --no-coverage
```
Expected: ~14 tests PASS. Tune leak/diffusion constants if needed so that the chemical-leak scenario exceeds 25 ppm NH3 within 60 ticks.

**Step 5: Commit**

```bash
git add src/lib/engines/gas-engine.ts src/lib/engines/__tests__/gas-engine.test.ts
git commit -m "feat(facility): gas & chemical delivery engine with diffusion transport and scrubber model"
```

---

## Task 5: Power Engine

**Files:**
- Create: `src/lib/engines/power-engine.ts`
- Create: `src/lib/engines/__tests__/power-engine.test.ts`

**Step 1: Write failing tests**

```typescript
// src/lib/engines/__tests__/power-engine.test.ts

import {
  createInitialPowerState,
  stepPower,
  computePowerAlarms,
} from '../power-engine';
import type { CoupledVariables } from '../facility-types';
import { INITIAL_COUPLED, UTILITY_VOLTAGE, UPS_SOC_CRITICAL } from '../facility-constants';

function nominalCoupled(): CoupledVariables {
  return { ...INITIAL_COUPLED };
}

describe('createInitialPowerState', () => {
  test('returns 6 nodes', () => {
    const state = createInitialPowerState();
    expect(Object.keys(state.nodes)).toHaveLength(6);
  });

  test('UPS starts offline (bypass mode)', () => {
    const state = createInitialPowerState();
    expect(state.ups.online).toBe(false);
  });

  test('battery starts at 100% SOC', () => {
    const state = createInitialPowerState();
    expect(state.ups.soc).toBeCloseTo(1.0);
  });

  test('both transformers online', () => {
    const state = createInitialPowerState();
    expect(state.t1Online).toBe(true);
    expect(state.t2Online).toBe(true);
  });
});

describe('stepPower', () => {
  test('steady state maintains voltage near 230V', () => {
    let state = createInitialPowerState();
    const coupled = nominalCoupled();
    for (let i = 0; i < 10; i++) {
      state = stepPower(state, 1, coupled, 'nominal');
    }
    expect(state.nodes['load-bus'].V).toBeGreaterThan(220);
    expect(state.nodes['load-bus'].V).toBeLessThan(240);
  });

  test('UPS depletion activates battery and reduces SOC', () => {
    let state = createInitialPowerState();
    const coupled = nominalCoupled();
    for (let i = 0; i < 30; i++) {
      state = stepPower(state, 1, coupled, 'ups-depletion');
    }
    expect(state.ups.online).toBe(true);
    expect(state.ups.soc).toBeLessThan(0.20);
  });

  test('transformer overload heats T1 above alarm threshold', () => {
    let state = createInitialPowerState();
    const coupled = nominalCoupled();
    for (let i = 0; i < 60; i++) {
      state = stepPower(state, 1, coupled, 'transformer-overload');
    }
    expect(state.nodes['transformer-t1'].theta).toBeGreaterThan(80);
  });

  test('HVAC+gas power draw increases total load', () => {
    let state = createInitialPowerState();
    const coupled = nominalCoupled();
    coupled.hvac_ahu_power_draw = 30; // higher than default
    coupled.gas_scrubber_power_draw = 15;
    for (let i = 0; i < 5; i++) {
      state = stepPower(state, 1, coupled, 'nominal');
    }
    expect(state.totalLoad).toBeGreaterThan(100);
  });

  test('power factor stays in range 0-1', () => {
    let state = createInitialPowerState();
    const coupled = nominalCoupled();
    for (let i = 0; i < 60; i++) {
      state = stepPower(state, 1, coupled, 'transformer-overload');
    }
    expect(state.nodes['load-bus'].PF).toBeGreaterThan(0);
    expect(state.nodes['load-bus'].PF).toBeLessThanOrEqual(1);
  });

  test('voltage clamped non-negative', () => {
    let state = createInitialPowerState();
    const coupled = nominalCoupled();
    for (let i = 0; i < 120; i++) {
      state = stepPower(state, 1, coupled, 'ups-depletion');
    }
    Object.values(state.nodes).forEach(n => {
      expect(n.V).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('computePowerAlarms', () => {
  test('nominal state produces no alarms', () => {
    const state = createInitialPowerState();
    expect(computePowerAlarms(state, 0)).toHaveLength(0);
  });

  test('low SOC triggers critical alarm', () => {
    const state = createInitialPowerState();
    state.ups.soc = 0.15;
    state.ups.online = true;
    const alarms = computePowerAlarms(state, 0);
    expect(alarms.some(a => a.severity === 'critical' && a.message.includes('SOC'))).toBe(true);
  });

  test('transformer high temp triggers alarm', () => {
    const state = createInitialPowerState();
    state.nodes['transformer-t1'].theta = 90;
    const alarms = computePowerAlarms(state, 0);
    expect(alarms.some(a => a.message.includes('T1') && a.severity === 'critical')).toBe(true);
  });

  test('low PF triggers warning', () => {
    const state = createInitialPowerState();
    state.nodes['load-bus'].PF = 0.80;
    const alarms = computePowerAlarms(state, 0);
    expect(alarms.some(a => a.message.includes('power factor'))).toBe(true);
  });
});
```

**Step 2: Run tests, verify fail**

```bash
npx jest src/lib/engines/__tests__/power-engine.test.ts --no-coverage
```

**Step 3: Implement**

```typescript
// src/lib/engines/power-engine.ts

import type {
  PowerEngineState,
  PowerNodeId,
  PowerNodeState,
  UpsState,
  CoupledVariables,
  FacilityScenarioId,
  FacilityAlarm,
} from './facility-types';
import {
  INITIAL_POWER_NODES,
  INITIAL_UPS,
  UTILITY_VOLTAGE,
  TRANSFORMER_KVA,
  TRANSFORMER_Z_PCT,
  TRANSFORMER_TURNS_RATIO,
  TRANSFORMER_THETA_RISE_MAX,
  TRANSFORMER_TAU_S,
  TRANSFORMER_ALARM_TEMP,
  AMBIENT_TEMP_C,
  UPS_BATTERY_V,
  UPS_CAPACITY_AH,
  UPS_SOC_CRITICAL,
  UPS_TRANSFER_V,
  LIGHTING_LOAD_KW,
  PROCESS_TOOLS_LOAD_KW,
  PF_ALARM_THRESHOLD,
  AHU_FAN_POWER_KW,
  SCRUBBER_POWER_BASE,
} from './facility-constants';

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function createInitialPowerState(): PowerEngineState {
  return {
    nodes: structuredClone(INITIAL_POWER_NODES),
    ups: { ...INITIAL_UPS },
    totalLoad: LIGHTING_LOAD_KW + PROCESS_TOOLS_LOAD_KW + AHU_FAN_POWER_KW + SCRUBBER_POWER_BASE,
    t1Online: true,
    t2Online: true,
  };
}

export function stepPower(
  prev: PowerEngineState,
  dt: number,
  coupled: CoupledVariables,
  scenario: FacilityScenarioId,
): PowerEngineState {
  const nodes = structuredClone(prev.nodes);
  const ups: UpsState = { ...prev.ups };
  let t1Online = prev.t1Online;
  let t2Online = prev.t2Online;

  // Total load from all subsystems
  const totalLoad = LIGHTING_LOAD_KW + PROCESS_TOOLS_LOAD_KW +
    coupled.hvac_ahu_power_draw + coupled.gas_scrubber_power_draw;

  // Scenario: utility voltage
  let utilityV = UTILITY_VOLTAGE;
  if (scenario === 'ups-depletion') {
    utilityV = 205;
    ups.soc = clamp(prev.ups.soc - 0.003 * dt, 0, 1); // force depletion
    ups.online = true;
  }
  if (scenario === 'transformer-overload') {
    // Force T1 to see 110% load
  }
  nodes['utility'].V = utilityV;

  // Transformer model
  const transformerLoad = totalLoad;
  const ratedI = (TRANSFORMER_KVA * 1000) / utilityV;
  const loadFraction = scenario === 'transformer-overload' ? 1.1 : (transformerLoad / (TRANSFORMER_KVA * 0.9));

  // T1 (primary)
  if (t1Online) {
    const loadI_t1 = ratedI * loadFraction;
    const vDrop = utilityV * TRANSFORMER_TURNS_RATIO * (loadI_t1 / ratedI) * TRANSFORMER_Z_PCT;
    nodes['transformer-t1'].V = clamp(utilityV - vDrop, 0, 260);
    nodes['transformer-t1'].I = loadI_t1;
    nodes['transformer-t1'].P_active = totalLoad;
    nodes['transformer-t1'].P_reactive = totalLoad * 0.33; // tan(phi) ~ 0.33 for PF 0.95

    // Thermal model: theta approaches theta_rise_max * (I/I_rated)^2
    const thetaTarget = AMBIENT_TEMP_C + TRANSFORMER_THETA_RISE_MAX * Math.pow(clamp(loadI_t1 / ratedI, 0, 2), 2);
    const thetaPrev = nodes['transformer-t1'].theta;
    nodes['transformer-t1'].theta = thetaPrev + dt * (thetaTarget - thetaPrev) / TRANSFORMER_TAU_S;

    // Trip if overheated
    if (nodes['transformer-t1'].theta > 95) {
      t1Online = false;
    }
  } else {
    nodes['transformer-t1'].V = 0;
    nodes['transformer-t1'].I = 0;
    nodes['transformer-t1'].P_active = 0;
    nodes['transformer-t1'].theta = clamp(
      nodes['transformer-t1'].theta - dt * 0.05, AMBIENT_TEMP_C, 150,
    );
  }

  // T2 (standby, absorbs load if T1 trips)
  if (!t1Online && t2Online) {
    const loadI_t2 = ratedI * loadFraction;
    const vDrop = utilityV * TRANSFORMER_TURNS_RATIO * (loadI_t2 / ratedI) * TRANSFORMER_Z_PCT;
    nodes['transformer-t2'].V = clamp(utilityV - vDrop, 0, 260);
    nodes['transformer-t2'].I = loadI_t2;
    nodes['transformer-t2'].P_active = totalLoad;
    nodes['transformer-t2'].P_reactive = totalLoad * 0.33;
    const thetaTarget = AMBIENT_TEMP_C + TRANSFORMER_THETA_RISE_MAX * Math.pow(clamp(loadI_t2 / ratedI, 0, 2), 2);
    nodes['transformer-t2'].theta = nodes['transformer-t2'].theta + dt * (thetaTarget - nodes['transformer-t2'].theta) / TRANSFORMER_TAU_S;
  }

  // Switchgear — passes through from active transformer
  const activeXfmr = t1Online ? 'transformer-t1' : (t2Online ? 'transformer-t2' : null);
  if (activeXfmr) {
    nodes['switchgear'].V = nodes[activeXfmr].V * 0.995; // small drop
    nodes['switchgear'].I = nodes[activeXfmr].I;
    nodes['switchgear'].P_active = nodes[activeXfmr].P_active;
    nodes['switchgear'].P_reactive = nodes[activeXfmr].P_reactive;
  } else {
    nodes['switchgear'].V = 0;
    nodes['switchgear'].I = 0;
  }

  // UPS logic
  const switchgearV = nodes['switchgear'].V;
  if (switchgearV < UPS_TRANSFER_V && ups.soc > 0) {
    ups.online = true;
    // Drain battery
    const drainRate = (totalLoad * 1000) / (UPS_BATTERY_V * UPS_CAPACITY_AH * 3600); // fraction/s
    ups.soc = clamp(ups.soc - drainRate * dt, 0, 1);
    ups.outputV = UPS_BATTERY_V > 0 ? 230 * ups.soc : 0;
  } else if (switchgearV >= UPS_TRANSFER_V) {
    ups.online = false;
    // Trickle charge
    ups.soc = clamp(ups.soc + 0.0001 * dt, 0, 1);
    ups.outputV = switchgearV;
  } else {
    // Battery depleted, no utility
    ups.online = false;
    ups.outputV = 0;
  }

  // PDU
  const sourceV = ups.online ? clamp(ups.outputV, 0, 240) : nodes['switchgear'].V;
  nodes['pdu-a'].V = sourceV * 0.998;
  nodes['pdu-a'].I = sourceV > 10 ? (totalLoad * 1000) / sourceV : 0;
  nodes['pdu-a'].P_active = totalLoad;
  nodes['pdu-a'].P_reactive = totalLoad * 0.33;

  // Load bus
  nodes['load-bus'].V = nodes['pdu-a'].V * 0.997;
  nodes['load-bus'].I = nodes['pdu-a'].I;
  nodes['load-bus'].P_active = totalLoad;
  nodes['load-bus'].P_reactive = totalLoad * 0.33;

  // Power factor at load bus
  const S = Math.sqrt(totalLoad * totalLoad + (totalLoad * 0.33) * (totalLoad * 0.33));
  nodes['load-bus'].PF = clamp(S > 0 ? totalLoad / S : 1, 0, 1);
  nodes['pdu-a'].PF = nodes['load-bus'].PF;
  nodes['switchgear'].PF = nodes['load-bus'].PF;

  return {
    nodes,
    ups,
    totalLoad,
    t1Online,
    t2Online,
  };
}

export function getPowerCoupledOutputs(state: PowerEngineState): Pick<
  CoupledVariables,
  'power_voltage' | 'power_available' | 'power_ups_active'
> {
  return {
    power_voltage: state.nodes['load-bus'].V,
    power_available: state.nodes['load-bus'].V > 180,
    power_ups_active: state.ups.online,
  };
}

export function computePowerAlarms(state: PowerEngineState, tick: number): FacilityAlarm[] {
  const alarms: FacilityAlarm[] = [];

  if (state.ups.online && state.ups.soc < UPS_SOC_CRITICAL) {
    alarms.push({ subsystem: 'power', message: `UPS battery SOC ${(state.ups.soc * 100).toFixed(0)}% — critical`, severity: 'critical', tick });
  }
  if (state.nodes['transformer-t1'].theta > TRANSFORMER_ALARM_TEMP) {
    alarms.push({ subsystem: 'power', message: `T1 thermal alarm: ${state.nodes['transformer-t1'].theta.toFixed(0)}C (limit ${TRANSFORMER_ALARM_TEMP}C)`, severity: 'critical', tick });
  }
  if (state.nodes['transformer-t2'].theta > TRANSFORMER_ALARM_TEMP) {
    alarms.push({ subsystem: 'power', message: `T2 thermal alarm: ${state.nodes['transformer-t2'].theta.toFixed(0)}C`, severity: 'critical', tick });
  }
  if (!state.t1Online) {
    alarms.push({ subsystem: 'power', message: 'Transformer T1 tripped offline', severity: 'critical', tick });
  }
  if (state.nodes['load-bus'].PF < PF_ALARM_THRESHOLD) {
    alarms.push({ subsystem: 'power', message: `Low power factor ${state.nodes['load-bus'].PF.toFixed(2)} (threshold ${PF_ALARM_THRESHOLD})`, severity: 'warning', tick });
  }
  if (state.nodes['load-bus'].V < 210) {
    alarms.push({ subsystem: 'power', message: `Voltage sag: ${state.nodes['load-bus'].V.toFixed(0)}V`, severity: 'warning', tick });
  }

  return alarms;
}
```

**Step 4: Run tests, verify pass**

```bash
npx jest src/lib/engines/__tests__/power-engine.test.ts --no-coverage
```
Expected: ~12 tests PASS

**Step 5: Commit**

```bash
git add src/lib/engines/power-engine.ts src/lib/engines/__tests__/power-engine.test.ts
git commit -m "feat(facility): power distribution engine with transformer thermal model and UPS"
```

---

## Task 6: Coupling Matrix

**Files:**
- Create: `src/lib/engines/coupling-matrix.ts`
- Create: `src/lib/engines/__tests__/coupling-matrix.test.ts`

**Step 1: Write failing tests**

```typescript
// src/lib/engines/__tests__/coupling-matrix.test.ts

import { tickFacility, createInitialFacilityState } from '../coupling-matrix';
import type { FacilitySimState } from '../facility-types';

describe('createInitialFacilityState', () => {
  test('returns valid initial state', () => {
    const state = createInitialFacilityState();
    expect(state.tick).toBe(0);
    expect(state.scenario).toBe('nominal');
    expect(state.hvac.nodes['zone-cr'].T).toBeCloseTo(22, 0);
    expect(state.gas.sensors).toHaveLength(8);
    expect(state.power.nodes['utility'].V).toBeCloseTo(230, 0);
  });
});

describe('tickFacility', () => {
  test('advances tick counter', () => {
    const s0 = createInitialFacilityState();
    const s1 = tickFacility(s0);
    expect(s1.tick).toBe(1);
  });

  test('coupled variables propagate between engines', () => {
    let state = createInitialFacilityState();
    // Run chiller failure for 30 ticks
    state = { ...state, scenario: 'chiller-failure', scenarioStartTick: 0 };
    for (let i = 0; i < 30; i++) {
      state = tickFacility(state);
    }
    // HVAC temp rise should propagate to gas via coupling
    expect(state.coupled.hvac_zone_cr_temp).toBeGreaterThan(23);
  });

  test('nominal scenario stays stable for 60 ticks', () => {
    let state = createInitialFacilityState();
    for (let i = 0; i < 60; i++) {
      state = tickFacility(state);
    }
    expect(state.coupled.hvac_zone_cr_temp).toBeGreaterThan(18);
    expect(state.coupled.hvac_zone_cr_temp).toBeLessThan(28);
    expect(state.coupled.power_voltage).toBeGreaterThan(210);
  });

  test('coupling clamps prevent runaway values', () => {
    let state = createInitialFacilityState();
    state = { ...state, scenario: 'chiller-failure', scenarioStartTick: 0 };
    for (let i = 0; i < 300; i++) {
      state = tickFacility(state);
    }
    expect(state.coupled.hvac_zone_cr_temp).toBeLessThanOrEqual(80);
    expect(state.coupled.power_voltage).toBeGreaterThanOrEqual(0);
  });

  test('chemical leak scenario cascades to power via scrubber draw', () => {
    let state = createInitialFacilityState();
    state = { ...state, scenario: 'chemical-leak', scenarioStartTick: 0 };
    const initialPower = state.coupled.gas_scrubber_power_draw;
    for (let i = 0; i < 30; i++) {
      state = tickFacility(state);
    }
    expect(state.coupled.gas_scrubber_power_draw).toBeGreaterThan(initialPower);
  });

  test('each scenario produces different coupled state than nominal', () => {
    const scenarios = [
      'ups-depletion', 'transformer-overload', 'chiller-failure',
      'ahu-fan-failure', 'pressure-breach', 'chemical-leak', 'scrubber-failure',
    ] as const;
    const nominal = (() => {
      let s = createInitialFacilityState();
      for (let i = 0; i < 30; i++) s = tickFacility(s);
      return s;
    })();

    for (const scenario of scenarios) {
      let s = createInitialFacilityState();
      s = { ...s, scenario, scenarioStartTick: 0 };
      for (let i = 0; i < 30; i++) s = tickFacility(s);
      const differs = (
        Math.abs(s.coupled.hvac_zone_cr_temp - nominal.coupled.hvac_zone_cr_temp) > 0.1 ||
        Math.abs(s.coupled.power_voltage - nominal.coupled.power_voltage) > 0.5 ||
        Math.abs(s.coupled.gas_scrubber_power_draw - nominal.coupled.gas_scrubber_power_draw) > 0.1
      );
      expect(differs).toBe(true);
    }
  });
});
```

**Step 2: Run tests, verify fail**

```bash
npx jest src/lib/engines/__tests__/coupling-matrix.test.ts --no-coverage
```

**Step 3: Implement**

```typescript
// src/lib/engines/coupling-matrix.ts

import type { FacilitySimState, CoupledVariables } from './facility-types';
import { INITIAL_COUPLED } from './facility-constants';
import { createInitialHvacState, stepHvac, getHvacCoupledOutputs } from './hvac-engine';
import { createInitialGasState, stepGas, getGasCoupledOutputs } from './gas-engine';
import { createInitialPowerState, stepPower, getPowerCoupledOutputs } from './power-engine';

function clampCoupled(c: CoupledVariables): CoupledVariables {
  return {
    hvac_zone_cr_temp: Math.max(0, Math.min(80, c.hvac_zone_cr_temp)),
    hvac_ahu_flow: Math.max(0, Math.min(20, c.hvac_ahu_flow)),
    hvac_ahu_power_draw: Math.max(0, Math.min(100, c.hvac_ahu_power_draw)),
    hvac_pressure_diff: Math.max(-10, Math.min(50, c.hvac_pressure_diff)),
    gas_scrubber_power_draw: Math.max(0, Math.min(50, c.gas_scrubber_power_draw)),
    gas_total_leak_rate: Math.max(0, Math.min(1, c.gas_total_leak_rate)),
    gas_scrubber_exhaust_temp: Math.max(20, Math.min(80, c.gas_scrubber_exhaust_temp)),
    power_voltage: Math.max(0, Math.min(260, c.power_voltage)),
    power_available: c.power_available,
    power_ups_active: c.power_ups_active,
  };
}

export function createInitialFacilityState(): FacilitySimState {
  return {
    hvac: createInitialHvacState(),
    gas: createInitialGasState(),
    power: createInitialPowerState(),
    coupled: { ...INITIAL_COUPLED },
    scenario: 'nominal',
    tick: 0,
    scenarioStartTick: 0,
  };
}

export function tickFacility(prev: FacilitySimState): FacilitySimState {
  const dt = 1;
  const { scenario, coupled } = prev;

  // All three engines run with previous tick's coupled values (explicit Euler)
  const nextHvac = stepHvac(prev.hvac, dt, coupled, scenario);
  const nextGas = stepGas(prev.gas, dt, coupled, scenario);
  const nextPower = stepPower(prev.power, dt, coupled, scenario);

  // Collect coupled outputs
  const hvacOut = getHvacCoupledOutputs(nextHvac);
  const gasOut = getGasCoupledOutputs(nextGas);
  const powerOut = getPowerCoupledOutputs(nextPower);

  const nextCoupled = clampCoupled({
    ...hvacOut,
    ...gasOut,
    ...powerOut,
  });

  return {
    hvac: nextHvac,
    gas: nextGas,
    power: nextPower,
    coupled: nextCoupled,
    scenario: prev.scenario,
    tick: prev.tick + 1,
    scenarioStartTick: prev.scenarioStartTick,
  };
}
```

**Step 4: Run tests, verify pass**

```bash
npx jest src/lib/engines/__tests__/coupling-matrix.test.ts --no-coverage
```
Expected: ~6 tests PASS

**Step 5: Commit**

```bash
git add src/lib/engines/coupling-matrix.ts src/lib/engines/__tests__/coupling-matrix.test.ts
git commit -m "feat(facility): coupling matrix with bidirectional state exchange and clamp guards"
```

---

## Task 7: Facility Scenarios & Alarm Aggregation

**Files:**
- Create: `src/lib/engines/facility-scenarios.ts`
- Create: `src/lib/engines/__tests__/facility-scenarios.test.ts`

**Step 1: Write failing tests**

```typescript
// src/lib/engines/__tests__/facility-scenarios.test.ts

import { injectScenario, clearScenario, collectAlarms, getEquipmentHealth, getCascadeLines } from '../facility-scenarios';
import { createInitialFacilityState, tickFacility } from '../coupling-matrix';

describe('injectScenario', () => {
  test('sets scenario and records start tick', () => {
    let state = createInitialFacilityState();
    for (let i = 0; i < 5; i++) state = tickFacility(state);
    const injected = injectScenario(state, 'chiller-failure');
    expect(injected.scenario).toBe('chiller-failure');
    expect(injected.scenarioStartTick).toBe(5);
  });
});

describe('clearScenario', () => {
  test('resets to nominal', () => {
    let state = createInitialFacilityState();
    state = injectScenario(state, 'chiller-failure');
    const cleared = clearScenario(state);
    expect(cleared.scenario).toBe('nominal');
  });
});

describe('collectAlarms', () => {
  test('nominal produces few or no alarms', () => {
    const state = createInitialFacilityState();
    const alarms = collectAlarms(state);
    expect(alarms.length).toBeLessThan(3);
  });

  test('chiller failure produces HVAC alarms after cascade', () => {
    let state = createInitialFacilityState();
    state = injectScenario(state, 'chiller-failure');
    for (let i = 0; i < 60; i++) state = tickFacility(state);
    const alarms = collectAlarms(state);
    expect(alarms.some(a => a.subsystem === 'hvac')).toBe(true);
  });
});

describe('getEquipmentHealth', () => {
  test('nominal returns all normal', () => {
    const state = createInitialFacilityState();
    const health = getEquipmentHealth(state);
    health.forEach(h => expect(h.health).toBe('normal'));
  });

  test('chiller failure sets HVAC equipment to warning/alarm', () => {
    let state = createInitialFacilityState();
    state = injectScenario(state, 'chiller-failure');
    for (let i = 0; i < 60; i++) state = tickFacility(state);
    const health = getEquipmentHealth(state);
    const hvacEquip = health.filter(h => h.subsystem === 'hvac');
    expect(hvacEquip.some(h => h.health !== 'normal')).toBe(true);
  });
});

describe('getCascadeLines', () => {
  test('nominal returns empty array', () => {
    const state = createInitialFacilityState();
    const lines = getCascadeLines(state);
    expect(lines).toHaveLength(0);
  });

  test('chiller failure returns cascade lines after propagation', () => {
    let state = createInitialFacilityState();
    state = injectScenario(state, 'chiller-failure');
    for (let i = 0; i < 30; i++) state = tickFacility(state);
    const lines = getCascadeLines(state);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines[0].fromId).toBeTruthy();
    expect(lines[0].toId).toBeTruthy();
  });
});
```

**Step 2: Run tests, verify fail**

```bash
npx jest src/lib/engines/__tests__/facility-scenarios.test.ts --no-coverage
```

**Step 3: Implement**

```typescript
// src/lib/engines/facility-scenarios.ts

import type {
  FacilitySimState,
  FacilityScenarioId,
  FacilityAlarm,
  EquipmentHealth,
  CascadeLine,
  HealthLevel,
} from './facility-types';
import { SCENARIO_CASCADE_PATHS, SUBSYSTEM_EQUIPMENT_MAP } from './facility-constants';
import { computeHvacAlarms } from './hvac-engine';
import { computeGasAlarms } from './gas-engine';
import { computePowerAlarms } from './power-engine';

export function injectScenario(state: FacilitySimState, scenario: FacilityScenarioId): FacilitySimState {
  return {
    ...state,
    scenario,
    scenarioStartTick: state.tick,
  };
}

export function clearScenario(state: FacilitySimState): FacilitySimState {
  return {
    ...state,
    scenario: 'nominal',
    scenarioStartTick: state.tick,
  };
}

export function collectAlarms(state: FacilitySimState): FacilityAlarm[] {
  return [
    ...computeHvacAlarms(state.hvac, state.tick),
    ...computeGasAlarms(state.gas, state.tick),
    ...computePowerAlarms(state.power, state.tick),
  ];
}

function subsystemHealth(alarms: FacilityAlarm[], subsystem: 'hvac' | 'gas' | 'power'): HealthLevel {
  const mine = alarms.filter(a => a.subsystem === subsystem);
  if (mine.some(a => a.severity === 'critical')) return 'alarm';
  if (mine.some(a => a.severity === 'warning')) return 'warning';
  return 'normal';
}

export function getEquipmentHealth(state: FacilitySimState): EquipmentHealth[] {
  const alarms = collectAlarms(state);
  return Object.entries(SUBSYSTEM_EQUIPMENT_MAP).map(([id, subsystem]) => ({
    id,
    subsystem,
    health: subsystemHealth(alarms, subsystem),
  }));
}

export function getCascadeLines(state: FacilitySimState): CascadeLine[] {
  if (state.scenario === 'nominal') return [];
  const paths = SCENARIO_CASCADE_PATHS[state.scenario];
  if (!paths || paths.length === 0) return [];

  const elapsed = state.tick - state.scenarioStartTick;
  const alarms = collectAlarms(state);

  return paths.map(([fromId, toId], idx) => {
    // Each cascade step takes ~10 ticks to propagate
    const arrivalTick = (idx + 1) * 10;
    const progress = Math.min(1, Math.max(0, (elapsed - arrivalTick + 10) / 10));

    // Severity based on downstream alarms
    const toSubsystem = SUBSYSTEM_EQUIPMENT_MAP[toId];
    const severity = toSubsystem ? subsystemHealth(alarms, toSubsystem) : 'normal';

    return {
      fromId,
      toId,
      severity: progress > 0.5 ? severity : 'warning' as HealthLevel,
      progress,
    };
  }).filter(line => line.progress > 0);
}
```

**Step 4: Run tests, verify pass**

```bash
npx jest src/lib/engines/__tests__/facility-scenarios.test.ts --no-coverage
```
Expected: ~7 tests PASS

**Step 5: Commit**

```bash
git add src/lib/engines/facility-scenarios.ts src/lib/engines/__tests__/facility-scenarios.test.ts
git commit -m "feat(facility): scenario injection/recovery, alarm aggregation, equipment health, cascade lines"
```

---

## Task 8: Zustand Store

**Files:**
- Create: `src/stores/facility-sim-store.ts`
- Create: `src/stores/__tests__/facility-sim-store.test.ts`

**Step 1: Write failing tests**

```typescript
// src/stores/__tests__/facility-sim-store.test.ts

import { useFacilitySimStore, INITIAL_FACILITY_SIM_STATE } from '../facility-sim-store';

beforeEach(() => {
  useFacilitySimStore.setState(structuredClone(INITIAL_FACILITY_SIM_STATE));
});

describe('initial state', () => {
  test('starts at tick 0', () => {
    expect(useFacilitySimStore.getState().tick).toBe(0);
  });

  test('starts in nominal scenario', () => {
    expect(useFacilitySimStore.getState().scenario).toBe('nominal');
  });

  test('has empty alarm list', () => {
    expect(useFacilitySimStore.getState().alarms).toHaveLength(0);
  });

  test('history buffers start empty', () => {
    const s = useFacilitySimStore.getState();
    expect(s.hvacTempHistory.length).toBe(0);
    expect(s.powerVoltageHistory.length).toBe(0);
  });
});

describe('tick', () => {
  test('advances state and tick counter', () => {
    useFacilitySimStore.getState().tick_();
    expect(useFacilitySimStore.getState().tick).toBe(1);
  });

  test('pushes to history buffers', () => {
    useFacilitySimStore.getState().tick_();
    expect(useFacilitySimStore.getState().hvacTempHistory.length).toBe(1);
  });
});

describe('setScenario', () => {
  test('changes active scenario', () => {
    useFacilitySimStore.getState().setScenario('chiller-failure');
    expect(useFacilitySimStore.getState().scenario).toBe('chiller-failure');
  });

  test('clearing scenario resets to nominal', () => {
    useFacilitySimStore.getState().setScenario('chiller-failure');
    useFacilitySimStore.getState().setScenario('nominal');
    expect(useFacilitySimStore.getState().scenario).toBe('nominal');
  });
});

describe('reset', () => {
  test('resets to initial state', () => {
    useFacilitySimStore.getState().tick_();
    useFacilitySimStore.getState().tick_();
    useFacilitySimStore.getState().setScenario('chiller-failure');
    useFacilitySimStore.getState().reset();
    expect(useFacilitySimStore.getState().tick).toBe(0);
    expect(useFacilitySimStore.getState().scenario).toBe('nominal');
  });
});
```

**Step 2: Run tests, verify fail**

```bash
npx jest src/stores/__tests__/facility-sim-store.test.ts --no-coverage
```

**Step 3: Implement**

```typescript
// src/stores/facility-sim-store.ts

import { create } from 'zustand';
import type {
  FacilitySimState,
  FacilityScenarioId,
  FacilityAlarm,
  EquipmentHealth,
  CascadeLine,
} from '@/lib/engines/facility-types';
import { HistoryBuffer } from '@/lib/engines/history-buffer';
import { createInitialFacilityState, tickFacility } from '@/lib/engines/coupling-matrix';
import { injectScenario, clearScenario, collectAlarms, getEquipmentHealth, getCascadeLines } from '@/lib/engines/facility-scenarios';

const HISTORY_CAPACITY = 300; // 5 minutes at 1 Hz

interface HistoryPoint {
  tick: number;
  value: number;
}

interface FacilitySimStoreState {
  // Simulation state
  sim: FacilitySimState;
  tick: number;
  scenario: FacilityScenarioId;

  // Derived
  alarms: FacilityAlarm[];
  equipmentHealth: EquipmentHealth[];
  cascadeLines: CascadeLine[];

  // History buffers
  hvacTempHistory: HistoryBuffer<HistoryPoint>;
  hvacParticleHistory: HistoryBuffer<HistoryPoint>;
  hvacPressureHistory: HistoryBuffer<HistoryPoint>;
  gasNh3History: HistoryBuffer<HistoryPoint>;
  gasO2History: HistoryBuffer<HistoryPoint>;
  gasScrubberHistory: HistoryBuffer<HistoryPoint>;
  powerVoltageHistory: HistoryBuffer<HistoryPoint>;
  powerLoadHistory: HistoryBuffer<HistoryPoint>;
  powerSocHistory: HistoryBuffer<HistoryPoint>;

  // Scenario markers (ticks where faults were injected)
  scenarioMarkers: HistoryPoint[];

  // Actions
  tick_: () => void;
  setScenario: (scenario: FacilityScenarioId) => void;
  reset: () => void;
}

function createHistoryBuffers() {
  return {
    hvacTempHistory: new HistoryBuffer<HistoryPoint>(HISTORY_CAPACITY),
    hvacParticleHistory: new HistoryBuffer<HistoryPoint>(HISTORY_CAPACITY),
    hvacPressureHistory: new HistoryBuffer<HistoryPoint>(HISTORY_CAPACITY),
    gasNh3History: new HistoryBuffer<HistoryPoint>(HISTORY_CAPACITY),
    gasO2History: new HistoryBuffer<HistoryPoint>(HISTORY_CAPACITY),
    gasScrubberHistory: new HistoryBuffer<HistoryPoint>(HISTORY_CAPACITY),
    powerVoltageHistory: new HistoryBuffer<HistoryPoint>(HISTORY_CAPACITY),
    powerLoadHistory: new HistoryBuffer<HistoryPoint>(HISTORY_CAPACITY),
    powerSocHistory: new HistoryBuffer<HistoryPoint>(HISTORY_CAPACITY),
  };
}

export const INITIAL_FACILITY_SIM_STATE = {
  sim: createInitialFacilityState(),
  tick: 0,
  scenario: 'nominal' as FacilityScenarioId,
  alarms: [] as FacilityAlarm[],
  equipmentHealth: [] as EquipmentHealth[],
  cascadeLines: [] as CascadeLine[],
  scenarioMarkers: [] as HistoryPoint[],
  ...createHistoryBuffers(),
};

export const useFacilitySimStore = create<FacilitySimStoreState>((set, get) => ({
  ...INITIAL_FACILITY_SIM_STATE,
  sim: createInitialFacilityState(),
  ...createHistoryBuffers(),

  tick_: () => {
    const { sim } = get();
    const nextSim = tickFacility(sim);
    const alarms = collectAlarms(nextSim);
    const equipmentHealth = getEquipmentHealth(nextSim);
    const cascadeLines = getCascadeLines(nextSim);

    // Push to history
    const t = nextSim.tick;
    get().hvacTempHistory.push({ tick: t, value: nextSim.hvac.nodes['zone-cr'].T });
    get().hvacParticleHistory.push({ tick: t, value: nextSim.hvac.nodes['zone-cr'].particleCount });
    get().hvacPressureHistory.push({ tick: t, value: nextSim.hvac.nodes['zone-cr'].P });
    const nh3 = nextSim.gas.sensors.find(s => s.species === 'NH3');
    get().gasNh3History.push({ tick: t, value: nh3?.concentration ?? 0 });
    const o2 = nextSim.gas.sensors.find(s => s.species === 'O2');
    get().gasO2History.push({ tick: t, value: o2?.concentration ?? 20.9 });
    get().gasScrubberHistory.push({ tick: t, value: nextSim.gas.scrubber.efficiency * 100 });
    get().powerVoltageHistory.push({ tick: t, value: nextSim.power.nodes['load-bus'].V });
    get().powerLoadHistory.push({ tick: t, value: nextSim.power.totalLoad });
    get().powerSocHistory.push({ tick: t, value: nextSim.power.ups.soc * 100 });

    set({
      sim: nextSim,
      tick: nextSim.tick,
      scenario: nextSim.scenario,
      alarms,
      equipmentHealth,
      cascadeLines,
    });
  },

  setScenario: (scenario) => {
    const { sim, scenarioMarkers } = get();
    const nextSim = scenario === 'nominal'
      ? clearScenario(sim)
      : injectScenario(sim, scenario);
    const markers = scenario !== 'nominal'
      ? [...scenarioMarkers, { tick: sim.tick, value: 0 }]
      : scenarioMarkers;
    set({
      sim: nextSim,
      scenario,
      scenarioMarkers: markers,
    });
  },

  reset: () => {
    set({
      sim: createInitialFacilityState(),
      tick: 0,
      scenario: 'nominal',
      alarms: [],
      equipmentHealth: [],
      cascadeLines: [],
      scenarioMarkers: [],
      ...createHistoryBuffers(),
    });
  },
}));
```

**Step 4: Run tests, verify pass**

```bash
npx jest src/stores/__tests__/facility-sim-store.test.ts --no-coverage
```
Expected: ~8 tests PASS

**Step 5: Commit**

```bash
git add src/stores/facility-sim-store.ts src/stores/__tests__/facility-sim-store.test.ts
git commit -m "feat(facility): Zustand store with tick loop, history buffers, and scenario control"
```

---

## Task 9: Canvas2D MiniSparkline Component

**Files:**
- Create: `src/components/war-room/canvas/MiniSparkline.tsx`

**Step 1: Implement**

```typescript
// src/components/war-room/canvas/MiniSparkline.tsx
'use client';

import { useRef, useEffect } from 'react';

interface MiniSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function MiniSparkline({
  data,
  width = 80,
  height = 24,
  color = '#22D3EE',
  className,
}: MiniSparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pad = 2;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';

    for (let i = 0; i < data.length; i++) {
      const x = (i / (data.length - 1)) * width;
      const y = pad + (1 - (data[i] - min) / range) * (height - pad * 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Latest value dot
    const lastX = width;
    const lastY = pad + (1 - (data[data.length - 1] - min) / range) * (height - pad * 2);
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(lastX - 2, lastY, 2, 0, Math.PI * 2);
    ctx.fill();
  }, [data, width, height, color]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className={className}
      aria-hidden="true"
    />
  );
}
```

**Step 2: Commit**

```bash
git add src/components/war-room/canvas/MiniSparkline.tsx
git commit -m "feat(facility): MiniSparkline Canvas2D component for KPI cards"
```

---

## Task 10: Canvas2D TrendChart Component

**Files:**
- Create: `src/components/war-room/canvas/TrendChart.tsx`

**Step 1: Implement**

```typescript
// src/components/war-room/canvas/TrendChart.tsx
'use client';

import { useRef, useEffect, useState } from 'react';

interface TrendPoint {
  tick: number;
  value: number;
}

interface TrendChartProps {
  data: TrendPoint[];
  markers?: TrendPoint[];
  label: string;
  unit: string;
  lsl?: number;
  usl?: number;
  color?: string;
  height?: number;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

const COLLAPSED_H = 80;
const EXPANDED_H = 180;

export function TrendChart({
  data,
  markers = [],
  label,
  unit,
  lsl,
  usl,
  color = '#22D3EE',
  height,
  expanded = false,
  onToggleExpand,
}: TrendChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const h = height ?? (expanded ? EXPANDED_H : COLLAPSED_H);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.parentElement?.clientWidth ?? 300;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const values = data.map(d => d.value);
    const allValues = [...values];
    if (lsl !== undefined) allValues.push(lsl);
    if (usl !== undefined) allValues.push(usl);
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min || 1;
    const pad = { top: 4, bottom: 16, left: 40, right: 8 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    const toX = (i: number) => pad.left + (i / (data.length - 1)) * plotW;
    const toY = (v: number) => pad.top + (1 - (v - min) / range) * plotH;

    // Spec limits
    if (lsl !== undefined) {
      const y = toY(lsl);
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = 'rgba(239,68,68,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (usl !== undefined) {
      const y = toY(usl);
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = 'rgba(239,68,68,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Scenario markers
    for (const marker of markers) {
      const idx = data.findIndex(d => d.tick >= marker.tick);
      if (idx < 0) continue;
      const x = toX(idx);
      ctx.strokeStyle = 'rgba(244,121,32,0.7)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, h - pad.bottom);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Data line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    for (let i = 0; i < data.length; i++) {
      const x = toX(i);
      const y = toY(data[i].value);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Fill below line
    ctx.lineTo(toX(data.length - 1), h - pad.bottom);
    ctx.lineTo(toX(0), h - pad.bottom);
    ctx.closePath();
    ctx.fillStyle = `${color}18`;
    ctx.fill();

    // Y axis labels
    ctx.fillStyle = 'rgba(148,163,184,0.7)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(max.toFixed(1), pad.left - 4, pad.top + 8);
    ctx.fillText(min.toFixed(1), pad.left - 4, h - pad.bottom);

    // Latest value
    const latest = data[data.length - 1];
    ctx.fillStyle = color;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${latest.value.toFixed(1)} ${unit}`, w - pad.right, pad.top + 10);

  }, [data, markers, h, color, lsl, usl]);

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: 'var(--sf-surface-card)',
        border: '1px solid var(--sf-border-default)',
      }}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--sf-text-secondary)' }}>
          {label}
        </span>
        {onToggleExpand && (
          <button
            type="button"
            onClick={onToggleExpand}
            className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded hover:bg-white/10"
            style={{ color: 'var(--sf-text-muted)' }}
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        )}
      </div>
      <canvas ref={canvasRef} aria-label={`${label} trend chart`} role="img" />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/war-room/canvas/TrendChart.tsx
git commit -m "feat(facility): TrendChart Canvas2D component with spec limits and scenario markers"
```

---

## Task 11: Canvas2D NetworkSchematic Component

**Files:**
- Create: `src/components/war-room/canvas/NetworkSchematic.tsx`

**Step 1: Implement**

This is the most complex Canvas2D component — it renders a node-graph diagram with live values, animated flow arrows, and health coloring. The node positions are hardcoded per network type (HVAC/Gas/Power).

```typescript
// src/components/war-room/canvas/NetworkSchematic.tsx
'use client';

import { useRef, useEffect } from 'react';

export interface SchematicNode {
  id: string;
  label: string;
  x: number;
  y: number;
  values: { label: string; value: string }[];
  health: 'normal' | 'warning' | 'alarm';
  highlighted?: boolean;
}

export interface SchematicEdge {
  from: string;
  to: string;
  animated?: boolean;
}

interface NetworkSchematicProps {
  nodes: SchematicNode[];
  edges: SchematicEdge[];
  width?: number;
  height?: number;
}

const COLORS = {
  normal: '#10B981',
  warning: '#F59E0B',
  alarm: '#EF4444',
  edge: 'rgba(148,163,184,0.4)',
  edgeAnimated: '#22D3EE',
  bg: '#0D1B2A',
  text: '#CBD5E1',
  textMuted: '#64748B',
  highlight: '#F47920',
};

const NODE_W = 84;
const NODE_H = 56;

export function NetworkSchematic({
  nodes,
  edges,
  width = 360,
  height = 200,
}: NetworkSchematicProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let tick = 0;
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Edges
      for (const edge of edges) {
        const from = nodeMap.get(edge.from);
        const to = nodeMap.get(edge.to);
        if (!from || !to) continue;

        ctx.beginPath();
        ctx.strokeStyle = edge.animated ? COLORS.edgeAnimated : COLORS.edge;
        ctx.lineWidth = edge.animated ? 2 : 1;
        if (edge.animated) {
          ctx.setLineDash([6, 4]);
          ctx.lineDashOffset = -tick * 0.5;
        }
        ctx.moveTo(from.x + NODE_W / 2, from.y + NODE_H / 2);
        ctx.lineTo(to.x + NODE_W / 2, to.y + NODE_H / 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrow head
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 1) continue;
        const ux = dx / len;
        const uy = dy / len;
        const ax = to.x + NODE_W / 2 - ux * (NODE_W / 2 + 4);
        const ay = to.y + NODE_H / 2 - uy * (NODE_H / 2 + 4);
        ctx.beginPath();
        ctx.fillStyle = edge.animated ? COLORS.edgeAnimated : COLORS.edge;
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax - ux * 6 - uy * 3, ay - uy * 6 + ux * 3);
        ctx.lineTo(ax - ux * 6 + uy * 3, ay - uy * 6 - ux * 3);
        ctx.fill();
      }

      // Nodes
      for (const node of nodes) {
        const healthColor = COLORS[node.health];
        const borderAlpha = node.health === 'alarm'
          ? 0.6 + 0.4 * Math.sin(tick * 0.15) // pulse
          : node.health === 'warning'
            ? 0.5 + 0.2 * Math.sin(tick * 0.08)
            : 0.3;

        // Background
        ctx.fillStyle = node.highlighted ? `${COLORS.highlight}22` : `${healthColor}12`;
        ctx.strokeStyle = node.highlighted ? COLORS.highlight : healthColor;
        ctx.globalAlpha = 1;
        ctx.lineWidth = node.highlighted ? 2 : 1.5;
        (ctx as CanvasRenderingContext2D).globalAlpha = 1;

        const r = 6;
        ctx.beginPath();
        ctx.moveTo(node.x + r, node.y);
        ctx.lineTo(node.x + NODE_W - r, node.y);
        ctx.quadraticCurveTo(node.x + NODE_W, node.y, node.x + NODE_W, node.y + r);
        ctx.lineTo(node.x + NODE_W, node.y + NODE_H - r);
        ctx.quadraticCurveTo(node.x + NODE_W, node.y + NODE_H, node.x + NODE_W - r, node.y + NODE_H);
        ctx.lineTo(node.x + r, node.y + NODE_H);
        ctx.quadraticCurveTo(node.x, node.y + NODE_H, node.x, node.y + NODE_H - r);
        ctx.lineTo(node.x, node.y + r);
        ctx.quadraticCurveTo(node.x, node.y, node.x + r, node.y);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = borderAlpha;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Label
        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x + NODE_W / 2, node.y + 12);

        // Values
        ctx.font = '8px monospace';
        node.values.forEach((v, i) => {
          ctx.fillStyle = COLORS.textMuted;
          ctx.textAlign = 'left';
          ctx.fillText(v.label, node.x + 4, node.y + 24 + i * 12);
          ctx.fillStyle = COLORS.text;
          ctx.textAlign = 'right';
          ctx.fillText(v.value, node.x + NODE_W - 4, node.y + 24 + i * 12);
        });
      }

      tick++;
      frameRef.current = requestAnimationFrame(draw);
    }

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [nodes, edges, width, height]);

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: 'var(--sf-surface-card)',
        border: '1px solid var(--sf-border-default)',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width, height }}
        aria-label="Network schematic"
        role="img"
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/war-room/canvas/NetworkSchematic.tsx
git commit -m "feat(facility): NetworkSchematic Canvas2D component with animated flow and health coloring"
```

---

## Task 12: HVAC Panel

**Files:**
- Create: `src/components/war-room/HvacPanel.tsx`

**Step 1: Implement**

Build the full HVAC panel using the engine state, Canvas2D components, and the panel anatomy from the design doc. This replaces `BuildingAutoPanel.tsx`.

The component reads from `useFacilitySimStore` and renders:
1. Header with severity badge
2. KPI strip (6 metrics with MiniSparklines)
3. NetworkSchematic (7-node HVAC loop)
4. TrendCharts (zone temp, particle count) with dual view
5. Equipment status cards (chiller, AHU)
6. Alarm feed

Full implementation code should follow the exact pattern of `PowerMonitoringPanel.tsx` but use `useFacilitySimStore` instead of `generatePowerSubsystemData()`, and use Canvas2D components (`NetworkSchematic`, `TrendChart`, `MiniSparkline`) instead of Recharts/GaugeCard.

Key wiring:
```typescript
const sim = useFacilitySimStore(s => s.sim);
const alarms = useFacilitySimStore(s => s.alarms).filter(a => a.subsystem === 'hvac');
const tempHistory = useFacilitySimStore(s => s.hvacTempHistory);
const particleHistory = useFacilitySimStore(s => s.hvacParticleHistory);
const pressureHistory = useFacilitySimStore(s => s.hvacPressureHistory);
const markers = useFacilitySimStore(s => s.scenarioMarkers);
```

Build schematic nodes from `sim.hvac.nodes` with live T/RH/P values. Node positions arranged in a loop layout.

**Step 2: Commit**

```bash
git add src/components/war-room/HvacPanel.tsx
git commit -m "feat(facility): HvacPanel with network schematic, dual-view trend charts, and live KPIs"
```

---

## Task 13: Gas Chemical Panel

**Files:**
- Create: `src/components/war-room/GasChemicalPanel.tsx`

Same pattern as Task 12 but for gas engine. Network schematic shows cabinet → sensor positions → scrubber with concentration halos. KPIs: O2%, worst-gas ppm, scrubber load, sensor health count. Trend charts: NH3 concentration (with 25 ppm USL), scrubber efficiency.

Key wiring:
```typescript
const sim = useFacilitySimStore(s => s.sim);
const alarms = useFacilitySimStore(s => s.alarms).filter(a => a.subsystem === 'gas');
const nh3History = useFacilitySimStore(s => s.gasNh3History);
const o2History = useFacilitySimStore(s => s.gasO2History);
const scrubberHistory = useFacilitySimStore(s => s.gasScrubberHistory);
```

**Step 1: Implement** (full component, same SCADA anatomy)

**Step 2: Commit**

```bash
git add src/components/war-room/GasChemicalPanel.tsx
git commit -m "feat(facility): GasChemicalPanel with sensor grid, scrubber status, and concentration trends"
```

---

## Task 14: Power UPS Panel

**Files:**
- Create: `src/components/war-room/PowerUpsPanel.tsx`

Same pattern. Network schematic shows utility → T1/T2 → switchgear → PDU → UPS/battery tree. KPIs: Voltage, Current, PF, Load%, UPS SOC, Energy. Trend charts: voltage (with 210V LSL), load%, battery SOC (with 20% LSL).

Key wiring:
```typescript
const sim = useFacilitySimStore(s => s.sim);
const alarms = useFacilitySimStore(s => s.alarms).filter(a => a.subsystem === 'power');
const voltageHistory = useFacilitySimStore(s => s.powerVoltageHistory);
const loadHistory = useFacilitySimStore(s => s.powerLoadHistory);
const socHistory = useFacilitySimStore(s => s.powerSocHistory);
```

**Step 1: Implement** (full component)

**Step 2: Commit**

```bash
git add src/components/war-room/PowerUpsPanel.tsx
git commit -m "feat(facility): PowerUpsPanel with electrical distribution schematic and UPS monitoring"
```

---

## Task 15: Wire Panels into War Room Page

**Files:**
- Modify: `src/app/mes/war-room/page.tsx`

**Step 1: Add panel state and imports**

Add to war-room page:
- Import the 3 new panels and `useFacilitySimStore`
- Add state: `openPanel: 'hvac' | 'gas' | 'power' | null`
- Start the 1 Hz tick interval on mount via `useEffect`
- Wire TopBar subsystem buttons to open panels
- Wire scenario dropdown to `useFacilitySimStore.setScenario`
- Render the 3 panels with `isOpen` / `onClose` props

Key additions to page.tsx:
```typescript
import { HvacPanel } from '@/components/war-room/HvacPanel';
import { GasChemicalPanel } from '@/components/war-room/GasChemicalPanel';
import { PowerUpsPanel } from '@/components/war-room/PowerUpsPanel';
import { useFacilitySimStore } from '@/stores/facility-sim-store';
import { FACILITY_SCENARIOS } from '@/lib/engines/facility-constants';

// In component:
const [openPanel, setOpenPanel] = useState<'hvac' | 'gas' | 'power' | null>(null);
const tick = useFacilitySimStore(s => s.tick_);
const setScenario = useFacilitySimStore(s => s.setScenario);

// 1 Hz tick loop
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}, [tick]);

// Map subsystem button → panel
const handleSubsystemToggle = useCallback((subsystem: Subsystem) => {
  const panelMap: Record<Subsystem, 'hvac' | 'gas' | 'power' | null> = {
    bas: 'hvac', gas: 'gas', power: 'power', fire: null,
  };
  setOpenPanel(prev => prev === panelMap[subsystem] ? null : panelMap[subsystem]);
  // Also keep existing activeSubsystem for 3D layer isolation
  setActiveSubsystem(current => current === subsystem ? null : subsystem);
}, []);
```

Render panels at the end of the page JSX:
```tsx
<HvacPanel isOpen={openPanel === 'hvac'} onClose={() => setOpenPanel(null)} />
<GasChemicalPanel isOpen={openPanel === 'gas'} onClose={() => setOpenPanel(null)} />
<PowerUpsPanel isOpen={openPanel === 'power'} onClose={() => setOpenPanel(null)} />
```

**Step 2: Add facility scenario dropdown to TopBar**

Modify `TopBar.tsx` to accept `facilityScenario` and `onFacilityScenarioChange` props. Add a second dropdown after the existing fault scene dropdown, labeled "Facility Fault":

```tsx
<select
  id="war-room-facility-scenario"
  value={facilityScenario}
  onChange={(e) => onFacilityScenarioChange(e.target.value as FacilityScenarioId)}
  className="min-h-[44px] rounded-full border border-white/10 bg-slate-950 px-3 font-mono text-xs text-[var(--sf-text-primary)]"
>
  {FACILITY_SCENARIOS.map(s => (
    <option key={s.id} value={s.id}>{s.label}</option>
  ))}
</select>
```

**Step 3: Commit**

```bash
git add src/app/mes/war-room/page.tsx src/components/war-room-hud/TopBar.tsx
git commit -m "feat(facility): wire HVAC/Gas/Power panels into war-room page with 1Hz tick loop"
```

---

## Task 16: 3D Equipment Health Coloring

**Files:**
- Modify: `src/components/babylon/WarRoomBabylonScene.tsx`

**Step 1: Add health coloring to render loop**

In the Babylon scene component, subscribe to `useFacilitySimStore` equipment health. In the render loop (or a `useEffect` that runs on health changes), update equipment mesh emissive colors:

```typescript
// Inside the scene setup, after meshes are created:
const healthColors = {
  normal: BABYLON.Color3.FromHexString('#10B981'),
  warning: BABYLON.Color3.FromHexString('#F59E0B'),
  alarm: BABYLON.Color3.FromHexString('#EF4444'),
};

// In render loop (scene.onBeforeRenderObservable):
const equipmentHealth = useFacilitySimStoreRef.current;
for (const eh of equipmentHealth) {
  const mesh = scene.getMeshByName(eh.id);
  if (!mesh || !mesh.material) continue;
  const mat = mesh.material as BABYLON.PBRMaterial;
  const color = healthColors[eh.health];
  const pulseRate = eh.health === 'alarm' ? 2 : eh.health === 'warning' ? 1 : 0;
  const intensity = eh.health === 'normal' ? 0.12
    : eh.health === 'warning' ? 0.3
    : 0.5;
  const pulse = pulseRate > 0 ? intensity * (0.7 + 0.3 * Math.sin(performance.now() * 0.001 * pulseRate * Math.PI * 2)) : intensity;
  mat.emissiveColor = color.scale(pulse);
}
```

Use a `useRef` to pass store state into the render loop without re-creating the scene.

**Step 2: Commit**

```bash
git add src/components/babylon/WarRoomBabylonScene.tsx
git commit -m "feat(facility): 3D equipment health coloring with severity pulse in WarRoomBabylonScene"
```

---

## Task 17: 3D Cascade Connection Lines

**Files:**
- Modify: `src/components/babylon/WarRoomBabylonScene.tsx`

**Step 1: Add cascade tube meshes**

Subscribe to `cascadeLines` from the store. Maintain a pool of 6 `BABYLON.MeshBuilder.CreateTube` meshes. On each frame:

1. For each active cascade line, compute a curved path between the two equipment mesh positions using `BABYLON.Curve3.CreateCatmullRomSpline`
2. Update the tube mesh path, color, and opacity based on `severity` and `progress`
3. Animate the dash texture offset: `tube.material.diffuseTexture.uOffset += 0.02`
4. Hide unused pool meshes

Create a striped texture procedurally using `BABYLON.DynamicTexture` for the dash pattern.

**Step 2: Commit**

```bash
git add src/components/babylon/WarRoomBabylonScene.tsx
git commit -m "feat(facility): 3D cascade connection lines between coupled equipment during faults"
```

---

## Task 18: 3D Click-to-Panel Wiring

**Files:**
- Modify: `src/components/babylon/WarRoomBabylonScene.tsx`
- Modify: `src/app/mes/war-room/page.tsx`

**Step 1: Extend onAssetPick callback**

In the war-room page, modify `handleAssetPick` to check if the clicked mesh belongs to a facility subsystem. If so, open the corresponding panel instead of the metadata popup:

```typescript
import { SUBSYSTEM_EQUIPMENT_MAP } from '@/lib/engines/facility-constants';

const handleAssetPick = useCallback((asset: WarRoomPickedAsset, screenPos: { x: number; y: number }) => {
  const facilitySubsystem = SUBSYSTEM_EQUIPMENT_MAP[asset.id];
  if (facilitySubsystem) {
    setOpenPanel(facilitySubsystem);
    return;
  }
  setPickedAsset(asset);
  setPickScreenPos(screenPos);
}, []);
```

**Step 2: Pass highlighted node to panels**

Add an optional `highlightNodeId` prop to each panel, set from the clicked asset ID. The NetworkSchematic marks that node as `highlighted: true`.

**Step 3: Commit**

```bash
git add src/components/babylon/WarRoomBabylonScene.tsx src/app/mes/war-room/page.tsx
git commit -m "feat(facility): click equipment mesh to open corresponding facility panel with highlighted node"
```

---

## Task 19: Run All Tests

**Step 1: Run the full engine test suite**

```bash
npx jest src/lib/engines/ --no-coverage --verbose
```
Expected: ~90 tests PASS across 5 test files

**Step 2: Run the store test**

```bash
npx jest src/stores/__tests__/facility-sim-store.test.ts --no-coverage --verbose
```
Expected: ~8 tests PASS

**Step 3: Run the full project test suite to check for regressions**

```bash
npx jest --no-coverage 2>&1 | tail -20
```
Expected: All existing 1000+ tests PASS, plus ~98 new tests

**Step 4: Final commit if any fixes were needed**

```bash
git add -A && git commit -m "fix: test adjustments for facility simulation integration"
```

---

## Summary

| Task | Files | Tests | Description |
|------|-------|-------|-------------|
| 1 | 2 new | — | Types & constants |
| 2 | 2 new | 10 | History ring buffer |
| 3 | 2 new | 12 | HVAC lumped-parameter engine |
| 4 | 2 new | 14 | Gas transport + scrubber engine |
| 5 | 2 new | 12 | Power distribution + UPS engine |
| 6 | 2 new | 6 | Coupling matrix |
| 7 | 2 new | 7 | Scenarios, alarms, health, cascade |
| 8 | 2 new | 8 | Zustand store |
| 9 | 1 new | — | MiniSparkline Canvas2D |
| 10 | 1 new | — | TrendChart Canvas2D |
| 11 | 1 new | — | NetworkSchematic Canvas2D |
| 12 | 1 new | — | HvacPanel |
| 13 | 1 new | — | GasChemicalPanel |
| 14 | 1 new | — | PowerUpsPanel |
| 15 | 2 mod | — | War-room page wiring |
| 16 | 1 mod | — | 3D health coloring |
| 17 | 1 mod | — | 3D cascade lines |
| 18 | 2 mod | — | Click-to-panel |
| 19 | — | ~98 | Full test run |

**Total: 23 new files, 5 modified files, ~69 new tests, 19 tasks**
