# Deposition Reactor ALD Digital Twin — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a SiO₂ BDEAS/O₃ ALD reactor digital twin at `/mes/fab-floor/deposition/reactor-sim` with physics engine, Babylon.js visualization, and fab-floor entry points.

**Architecture:** Pure TypeScript physics engine at `src/lib/dep-sim/` (same pattern as `src/lib/lens-sim/`), stepping by ALD cycle instead of wafer. Babylon.js reactor cross-section + Canvas2D surface adsorption grid, wafer die map, cycle timeline. Entry points via scene badges and HUD panel buttons on the fab-floor page.

**Tech Stack:** TypeScript, Jest (TDD), Babylon.js v9.6.2, Next.js 15.1 dynamic imports, React useState/useCallback/useEffect

**Design doc:** `docs/plans/2026-05-20-deposition-reactor-sim-design.md`

**Reference implementation:** `src/lib/lens-sim/` — follow identical patterns for types, constants, physics modules, simulation engine, presets, barrel export, and test structure.

---

## Phase 1: Physics Engine (Pure TypeScript, TDD)

### Task 1: Types and Constants

**Files:**
- Create: `equipment-monitor/src/lib/dep-sim/types.ts`
- Create: `equipment-monitor/src/lib/dep-sim/constants.ts`

**Step 1: Create types.ts**

```typescript
// equipment-monitor/src/lib/dep-sim/types.ts

/** ALD cycle phase */
export type CyclePhase = 'bdeas-pulse' | 'purge-a' | 'o3-pulse' | 'purge-b';

/** Simulation input parameters (driven by sliders) */
export interface SimulationParams {
  bdeasFlowRate: number;     // sccm
  bdeasPulseTime: number;    // seconds
  o3FlowRate: number;        // sccm
  o3PulseTime: number;       // seconds
  purgeTime: number;         // seconds
  pedestalTemp: number;      // degC
  chamberPressure: number;   // Torr
  carrierGasFlow: number;    // sccm (N2)
  totalCycles: number;       // target cycle count (e.g. 200)
}

/** Per-cycle simulation result */
export interface CycleState {
  cycleIndex: number;
  phase: CyclePhase;
  coverageA: number;            // BDEAS surface coverage (0-1)
  coverageB: number;            // O3 oxidation coverage (0-1)
  gpc: number;                  // Angstrom this cycle
  cumulativeThickness: number;  // Angstrom total
  thicknessMap: number[];       // per-die thickness (Angstrom)
  roughnessMap: number[];       // per-die roughness (Angstrom RMS)
  riMap: number[];              // per-die refractive index
  uniformity: number;           // % 1-sigma/mean
  dieCount: number;
  dieGridCols: number;
  dieGridRows: number;
}

/** Full simulation state */
export interface SimulationState {
  params: SimulationParams;
  cycles: CycleState[];       // history for all completed cycles
  currentIndex: number;       // -1 = not started, 0..N
  totalCycles: number;        // target
}

/** Wafer metric layer for display */
export type WaferMetric = 'thickness' | 'uniformity' | 'roughness' | 'ri';

/** What-if preset identifier */
export type PresetId =
  | 'precursor-starvation'
  | 'purge-leak-through'
  | 'temperature-excursion'
  | 'o3-degradation'
  | 'chamber-seasoning';

/** What-if preset definition */
export interface Preset {
  id: PresetId;
  label: string;
  labelCN: string;
  color: string;
  apply: (params: SimulationParams, cycleIndex: number) => SimulationParams;
}

/** Reactor flow state */
export interface FlowState {
  residenceTime: number;          // seconds
  effectiveO3Fraction: number;    // 0-1 (after thermal decomposition)
  purgeEfficiency: number;        // 0-1 (1 = perfect purge)
  residualFraction: number;       // 0-1 (leftover precursor after purge)
}

/** Thermal regime classification */
export type ThermalRegime = 'condensation' | 'ald-window' | 'decomposition';
```

**Step 2: Create constants.ts**

```typescript
// equipment-monitor/src/lib/dep-sim/constants.ts
import type { SimulationParams } from './types';

// ---- ALD Process: SiO2 from BDEAS + O3 ----

/** Maximum growth per cycle at full saturation (Angstrom) */
export const GPC_MAX = 0.6;

/** Ideal refractive index of stoichiometric SiO2 at 633nm */
export const IDEAL_RI = 1.46;

/** ALD temperature window bounds (degC) */
export const ALD_WINDOW_LOW = 100;
export const ALD_WINDOW_HIGH = 300;

/** Default total ALD cycles for a ~120 Angstrom film */
export const DEFAULT_TOTAL_CYCLES = 200;

// ---- Langmuir Adsorption Constants ----

/** BDEAS adsorption equilibrium constant K_A (1/(Torr*s)) */
export const K_BDEAS = 12.0;

/** O3 oxidation equilibrium constant K_B (1/(Torr*s)) */
export const K_O3 = 8.0;

// ---- Reactor Flow Constants ----

/** Chamber volume (liters) */
export const CHAMBER_VOLUME_L = 2.5;

/** O3 thermal decomposition activation energy (eV) */
export const O3_DECOMP_EA = 1.05;

/** O3 decomposition pre-exponential (1/s) */
export const O3_DECOMP_A = 1e12;

/** Boltzmann constant in eV/K */
export const KB_EV = 8.617e-5;

// ---- Thermal / Arrhenius Constants ----

/** Surface reaction activation energy (eV) */
export const SURFACE_EA = 0.45;

/** Surface reaction pre-exponential (1/s) */
export const SURFACE_A = 1e8;

/** Reference temperature for nominal GPC (degC) */
export const T_REF = 200;

// ---- Roughness Model ----

/** Base roughness for ideal ALD (Angstrom RMS) */
export const BASE_ROUGHNESS = 0.3;

/** Roughness penalty per unit residual fraction (Angstrom RMS) */
export const ROUGHNESS_PER_RESIDUAL = 4.0;

/** Roughness penalty for thermal decomposition (Angstrom RMS per degC above window) */
export const ROUGHNESS_PER_DECOMP_DEGREE = 0.05;

// ---- Refractive Index Model ----

/** RI deviation per unit of incomplete oxidation (coverage B deficit) */
export const RI_PER_COVERAGE_DEFICIT = 0.08;

// ---- Die Grid (same as lens-sim for consistency) ----

export const DIE_GRID_COLS = 9;
export const DIE_GRID_ROWS = 9;

/** Valid die positions (1 = active, 0 = outside wafer) - row-major 9x9 */
export const DIE_MASK: readonly number[] = [
  0, 0, 0, 1, 1, 1, 0, 0, 0,
  0, 0, 1, 1, 1, 1, 1, 0, 0,
  0, 1, 1, 1, 1, 1, 1, 1, 0,
  1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1,
  0, 1, 1, 1, 1, 1, 1, 1, 0,
  0, 0, 1, 1, 1, 1, 1, 0, 0,
  0, 0, 0, 1, 1, 1, 0, 0, 0,
];

export const ACTIVE_DIE_COUNT = DIE_MASK.filter((d) => d === 1).length;

// ---- Showerhead Flow Profile ----

/** Center-to-edge flow non-uniformity factor (0 = uniform, higher = more edge starvation) */
export const SHOWERHEAD_NONUNIFORMITY = 0.12;

// ---- Slider parameter bounds ----

export const PARAM_BOUNDS = {
  bdeasFlowRate:  { min: 10,  max: 200, default: 80,   step: 5,    unit: 'sccm' },
  bdeasPulseTime: { min: 0.1, max: 5.0, default: 1.5,  step: 0.1,  unit: 's' },
  o3FlowRate:     { min: 50,  max: 500, default: 200,  step: 10,   unit: 'sccm' },
  o3PulseTime:    { min: 0.5, max: 8.0, default: 3.0,  step: 0.5,  unit: 's' },
  purgeTime:      { min: 0.5, max: 10,  default: 4.0,  step: 0.5,  unit: 's' },
  pedestalTemp:   { min: 50,  max: 400, default: 200,  step: 5,    unit: '\u00B0C' },
  chamberPressure:{ min: 0.1, max: 5.0, default: 1.0,  step: 0.1,  unit: 'Torr' },
  carrierGasFlow: { min: 50,  max: 500, default: 200,  step: 10,   unit: 'sccm' },
  totalCycles:    { min: 10,  max: 500, default: 200,  step: 10,   unit: 'cycles' },
} as const;

/** Default simulation parameters */
export const DEFAULT_PARAMS: SimulationParams = {
  bdeasFlowRate:  PARAM_BOUNDS.bdeasFlowRate.default,
  bdeasPulseTime: PARAM_BOUNDS.bdeasPulseTime.default,
  o3FlowRate:     PARAM_BOUNDS.o3FlowRate.default,
  o3PulseTime:    PARAM_BOUNDS.o3PulseTime.default,
  purgeTime:      PARAM_BOUNDS.purgeTime.default,
  pedestalTemp:   PARAM_BOUNDS.pedestalTemp.default,
  chamberPressure:PARAM_BOUNDS.chamberPressure.default,
  carrierGasFlow: PARAM_BOUNDS.carrierGasFlow.default,
  totalCycles:    PARAM_BOUNDS.totalCycles.default,
};
```

**Step 3: Verify TypeScript compiles**

Run: `cd equipment-monitor && npx tsc --noEmit src/lib/dep-sim/types.ts src/lib/dep-sim/constants.ts`
Expected: No errors

**Step 4: Commit**

```bash
cd equipment-monitor && git add src/lib/dep-sim/types.ts src/lib/dep-sim/constants.ts
git commit -m "feat(dep-sim): add types and constants for SiO2 BDEAS/O3 ALD simulation"
```

---

### Task 2: Langmuir Adsorption Model (TDD)

**Files:**
- Create: `equipment-monitor/src/lib/dep-sim/__tests__/langmuir.test.ts`
- Create: `equipment-monitor/src/lib/dep-sim/langmuir.ts`

**Step 1: Write the failing tests**

```typescript
// equipment-monitor/src/lib/dep-sim/__tests__/langmuir.test.ts
import { computeCoverage, computeHalfCycleCoverages } from '../langmuir';
import { DEFAULT_PARAMS, K_BDEAS, K_O3 } from '../constants';

describe('langmuir', () => {
  it('coverage is 0 when exposure dose is 0', () => {
    expect(computeCoverage(12.0, 0, 0)).toBe(0);
  });

  it('coverage approaches 1.0 at high exposure dose', () => {
    // Very high pressure * time product
    const theta = computeCoverage(12.0, 100, 100);
    expect(theta).toBeGreaterThan(0.99);
    expect(theta).toBeLessThanOrEqual(1.0);
  });

  it('coverage increases monotonically with pulse time', () => {
    const K = 12.0;
    const P = 1.0;
    let prev = 0;
    for (let t = 0.1; t <= 5.0; t += 0.5) {
      const theta = computeCoverage(K, P, t);
      expect(theta).toBeGreaterThan(prev);
      prev = theta;
    }
  });

  it('self-limiting: doubling pulse time past saturation barely changes coverage', () => {
    const K = 12.0;
    const P = 1.0;
    const theta5 = computeCoverage(K, P, 5.0);
    const theta10 = computeCoverage(K, P, 10.0);
    // Both should be near saturation; difference < 2%
    expect(Math.abs(theta10 - theta5)).toBeLessThan(0.02);
  });

  it('computeHalfCycleCoverages returns coverageA and coverageB', () => {
    const result = computeHalfCycleCoverages(DEFAULT_PARAMS);
    expect(result.coverageA).toBeGreaterThan(0);
    expect(result.coverageA).toBeLessThanOrEqual(1.0);
    expect(result.coverageB).toBeGreaterThan(0);
    expect(result.coverageB).toBeLessThanOrEqual(1.0);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd equipment-monitor && npx jest src/lib/dep-sim/__tests__/langmuir.test.ts --no-coverage`
Expected: FAIL — cannot find module '../langmuir'

**Step 3: Write minimal implementation**

```typescript
// equipment-monitor/src/lib/dep-sim/langmuir.ts
import type { SimulationParams } from './types';
import { K_BDEAS, K_O3 } from './constants';

/**
 * Langmuir adsorption isotherm.
 * theta = K * P * t / (1 + K * P * t)
 *
 * K: adsorption equilibrium constant (1/(Torr*s))
 * P: partial pressure (Torr)
 * t: pulse time (seconds)
 *
 * Returns surface coverage fraction (0-1).
 */
export function computeCoverage(K: number, P: number, t: number): number {
  const dose = K * P * t;
  if (dose <= 0) return 0;
  return dose / (1 + dose);
}

/**
 * Compute half-cycle coverages for BDEAS (A) and O3 (B).
 * Partial pressure is approximated from flow rate and chamber pressure.
 */
export function computeHalfCycleCoverages(params: SimulationParams): {
  coverageA: number;
  coverageB: number;
} {
  // Approximate partial pressure: precursor fraction of total flow * chamber pressure
  const totalFlow = params.bdeasFlowRate + params.o3FlowRate + params.carrierGasFlow;
  const pA = (params.bdeasFlowRate / totalFlow) * params.chamberPressure;
  const pB = (params.o3FlowRate / totalFlow) * params.chamberPressure;

  const coverageA = computeCoverage(K_BDEAS, pA, params.bdeasPulseTime);
  const coverageB = computeCoverage(K_O3, pB, params.o3PulseTime);

  return { coverageA, coverageB };
}
```

**Step 4: Run tests to verify they pass**

Run: `cd equipment-monitor && npx jest src/lib/dep-sim/__tests__/langmuir.test.ts --no-coverage`
Expected: 5 tests PASS

**Step 5: Commit**

```bash
cd equipment-monitor && git add src/lib/dep-sim/langmuir.ts src/lib/dep-sim/__tests__/langmuir.test.ts
git commit -m "feat(dep-sim): Langmuir adsorption isotherm with self-limiting coverage"
```

---

### Task 3: Thermal Model (TDD)

**Files:**
- Create: `equipment-monitor/src/lib/dep-sim/__tests__/thermal-model.test.ts`
- Create: `equipment-monitor/src/lib/dep-sim/thermal-model.ts`

**Step 1: Write the failing tests**

```typescript
// equipment-monitor/src/lib/dep-sim/__tests__/thermal-model.test.ts
import { classifyRegime, arrheniusRate, gpcThermalFactor } from '../thermal-model';

describe('thermal-model', () => {
  it('classifies temperatures below 100C as condensation', () => {
    expect(classifyRegime(50)).toBe('condensation');
    expect(classifyRegime(99)).toBe('condensation');
  });

  it('classifies temperatures 100-300C as ald-window', () => {
    expect(classifyRegime(100)).toBe('ald-window');
    expect(classifyRegime(200)).toBe('ald-window');
    expect(classifyRegime(300)).toBe('ald-window');
  });

  it('classifies temperatures above 300C as decomposition', () => {
    expect(classifyRegime(301)).toBe('decomposition');
    expect(classifyRegime(400)).toBe('decomposition');
  });

  it('Arrhenius rate increases with temperature', () => {
    const r150 = arrheniusRate(150);
    const r250 = arrheniusRate(250);
    expect(r250).toBeGreaterThan(r150);
  });

  it('GPC thermal factor is ~1.0 inside ALD window at reference temp', () => {
    const factor = gpcThermalFactor(200); // T_REF = 200
    expect(factor).toBeCloseTo(1.0, 1);
  });

  it('GPC thermal factor increases above ALD window (decomposition)', () => {
    const factor = gpcThermalFactor(380);
    expect(factor).toBeGreaterThan(1.2);
  });

  it('GPC thermal factor is reduced below ALD window (condensation)', () => {
    const factor = gpcThermalFactor(60);
    expect(factor).toBeLessThan(0.8);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd equipment-monitor && npx jest src/lib/dep-sim/__tests__/thermal-model.test.ts --no-coverage`
Expected: FAIL — cannot find module '../thermal-model'

**Step 3: Write minimal implementation**

```typescript
// equipment-monitor/src/lib/dep-sim/thermal-model.ts
import type { ThermalRegime } from './types';
import {
  ALD_WINDOW_HIGH,
  ALD_WINDOW_LOW,
  KB_EV,
  SURFACE_A,
  SURFACE_EA,
  T_REF,
} from './constants';

/**
 * Classify the thermal regime based on pedestal temperature.
 */
export function classifyRegime(tempC: number): ThermalRegime {
  if (tempC < ALD_WINDOW_LOW) return 'condensation';
  if (tempC > ALD_WINDOW_HIGH) return 'decomposition';
  return 'ald-window';
}

/**
 * Arrhenius rate constant: k = A * exp(-Ea / (kB * T))
 * T in Kelvin.
 */
export function arrheniusRate(tempC: number): number {
  const T = tempC + 273.15;
  return SURFACE_A * Math.exp(-SURFACE_EA / (KB_EV * T));
}

/**
 * GPC thermal correction factor relative to reference temperature.
 * - Inside ALD window: ~1.0 (self-limiting, weak T dependence)
 * - Below ALD window: reduced (condensation/physisorption regime)
 * - Above ALD window: increased (thermal decomposition adds CVD-like growth)
 */
export function gpcThermalFactor(tempC: number): number {
  const regime = classifyRegime(tempC);

  if (regime === 'ald-window') {
    // Mild Arrhenius variation within the window
    const rateRatio = arrheniusRate(tempC) / arrheniusRate(T_REF);
    // Clamp to near-unity since ALD is self-limiting
    return 0.85 + 0.15 * Math.min(rateRatio, 2.0);
  }

  if (regime === 'condensation') {
    // Below window: physisorption — thickness depends on temp, less efficient
    const deficit = ALD_WINDOW_LOW - tempC;
    return Math.max(0.2, 1.0 - deficit * 0.008);
  }

  // Decomposition: precursor breaks down in gas phase — uncontrolled CVD growth
  const excess = tempC - ALD_WINDOW_HIGH;
  return 1.0 + excess * 0.008;
}
```

**Step 4: Run tests to verify they pass**

Run: `cd equipment-monitor && npx jest src/lib/dep-sim/__tests__/thermal-model.test.ts --no-coverage`
Expected: 7 tests PASS

**Step 5: Commit**

```bash
cd equipment-monitor && git add src/lib/dep-sim/thermal-model.ts src/lib/dep-sim/__tests__/thermal-model.test.ts
git commit -m "feat(dep-sim): thermal model with ALD window classification and Arrhenius kinetics"
```

---

### Task 4: Reactor Flow Model (TDD)

**Files:**
- Create: `equipment-monitor/src/lib/dep-sim/__tests__/reactor-flow.test.ts`
- Create: `equipment-monitor/src/lib/dep-sim/reactor-flow.ts`

**Step 1: Write the failing tests**

```typescript
// equipment-monitor/src/lib/dep-sim/__tests__/reactor-flow.test.ts
import { computeResidenceTime, computeO3Fraction, computePurgeEfficiency, computeFlowState } from '../reactor-flow';
import { DEFAULT_PARAMS } from '../constants';

describe('reactor-flow', () => {
  it('residence time = chamber volume / total flow', () => {
    // 2.5 L chamber, total ~480 sccm -> tau = 2.5 / (480/60) = 0.3125 s
    const tau = computeResidenceTime(480);
    expect(tau).toBeCloseTo(2.5 / (480 / 60), 3);
  });

  it('O3 effective fraction decreases with higher temperature', () => {
    const frac150 = computeO3Fraction(150, 0.3);
    const frac350 = computeO3Fraction(350, 0.3);
    expect(frac350).toBeLessThan(frac150);
  });

  it('O3 effective fraction is between 0 and 1', () => {
    const frac = computeO3Fraction(200, 0.3);
    expect(frac).toBeGreaterThan(0);
    expect(frac).toBeLessThanOrEqual(1.0);
  });

  it('purge efficiency approaches 1.0 with long purge time', () => {
    const eff = computePurgeEfficiency(20.0, 0.3);
    expect(eff).toBeGreaterThan(0.99);
  });

  it('purge efficiency is low with very short purge time', () => {
    const eff = computePurgeEfficiency(0.05, 0.3);
    expect(eff).toBeLessThan(0.5);
  });

  it('computeFlowState returns all fields', () => {
    const state = computeFlowState(DEFAULT_PARAMS);
    expect(state.residenceTime).toBeGreaterThan(0);
    expect(state.effectiveO3Fraction).toBeGreaterThan(0);
    expect(state.effectiveO3Fraction).toBeLessThanOrEqual(1);
    expect(state.purgeEfficiency).toBeGreaterThan(0);
    expect(state.residualFraction).toBeGreaterThanOrEqual(0);
    expect(state.residualFraction).toBeLessThan(1);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd equipment-monitor && npx jest src/lib/dep-sim/__tests__/reactor-flow.test.ts --no-coverage`
Expected: FAIL — cannot find module '../reactor-flow'

**Step 3: Write minimal implementation**

```typescript
// equipment-monitor/src/lib/dep-sim/reactor-flow.ts
import type { SimulationParams, FlowState } from './types';
import {
  CHAMBER_VOLUME_L,
  KB_EV,
  O3_DECOMP_A,
  O3_DECOMP_EA,
} from './constants';

/**
 * Compute gas residence time in seconds.
 * tau = V_chamber / Q_total (converting sccm to L/s: sccm/60)
 */
export function computeResidenceTime(totalFlowSccm: number): number {
  const flowLps = totalFlowSccm / 60; // sccm -> L/s (at STP)
  return CHAMBER_VOLUME_L / flowLps;
}

/**
 * Compute effective O3 fraction after thermal decomposition.
 * O3 decomposes: rate = A * exp(-Ea/(kB*T))
 * Surviving fraction = exp(-rate * residenceTime)
 */
export function computeO3Fraction(tempC: number, residenceTime: number): number {
  const T = tempC + 273.15;
  const decompRate = O3_DECOMP_A * Math.exp(-O3_DECOMP_EA / (KB_EV * T));
  return Math.exp(-decompRate * residenceTime);
}

/**
 * Compute purge efficiency.
 * Residual fraction = exp(-t_purge / tau)
 * Efficiency = 1 - residual
 */
export function computePurgeEfficiency(purgeTime: number, residenceTime: number): number {
  const residual = Math.exp(-purgeTime / residenceTime);
  return 1 - residual;
}

/**
 * Compute full reactor flow state from simulation parameters.
 */
export function computeFlowState(params: SimulationParams): FlowState {
  const totalFlow = params.bdeasFlowRate + params.o3FlowRate + params.carrierGasFlow;
  const residenceTime = computeResidenceTime(totalFlow);
  const effectiveO3Fraction = computeO3Fraction(params.pedestalTemp, residenceTime);
  const purgeEfficiency = computePurgeEfficiency(params.purgeTime, residenceTime);
  const residualFraction = 1 - purgeEfficiency;

  return {
    residenceTime,
    effectiveO3Fraction,
    purgeEfficiency,
    residualFraction,
  };
}
```

**Step 4: Run tests to verify they pass**

Run: `cd equipment-monitor && npx jest src/lib/dep-sim/__tests__/reactor-flow.test.ts --no-coverage`
Expected: 6 tests PASS

**Step 5: Commit**

```bash
cd equipment-monitor && git add src/lib/dep-sim/reactor-flow.ts src/lib/dep-sim/__tests__/reactor-flow.test.ts
git commit -m "feat(dep-sim): reactor flow model with residence time, O3 decomposition, purge efficiency"
```

---

### Task 5: Growth Model (TDD)

**Files:**
- Create: `equipment-monitor/src/lib/dep-sim/__tests__/growth-model.test.ts`
- Create: `equipment-monitor/src/lib/dep-sim/growth-model.ts`

**Depends on:** Task 2 (langmuir), Task 3 (thermal-model), Task 4 (reactor-flow)

**Step 1: Write the failing tests**

```typescript
// equipment-monitor/src/lib/dep-sim/__tests__/growth-model.test.ts
import { computeGpc, computeThicknessMap } from '../growth-model';
import { DEFAULT_PARAMS, GPC_MAX, DIE_GRID_COLS, DIE_GRID_ROWS, DIE_MASK } from '../constants';

describe('growth-model', () => {
  it('GPC equals GPC_MAX when both coverages are 1.0 at reference temp', () => {
    const gpc = computeGpc(1.0, 1.0, 1.0, 200);
    expect(gpc).toBeCloseTo(GPC_MAX, 2);
  });

  it('GPC is 0 when coverageA is 0', () => {
    const gpc = computeGpc(0, 1.0, 1.0, 200);
    expect(gpc).toBe(0);
  });

  it('GPC is 0 when coverageB is 0', () => {
    const gpc = computeGpc(1.0, 0, 1.0, 200);
    expect(gpc).toBe(0);
  });

  it('thickness map has correct length and center > edge for active dies', () => {
    const map = computeThicknessMap(DEFAULT_PARAMS, 0.95, 0.92, 0, 1.0);
    expect(map).toHaveLength(DIE_GRID_COLS * DIE_GRID_ROWS);
    // Center die should have more thickness than edge die (showerhead profile)
    const centerIdx = 4 * DIE_GRID_COLS + 4; // row 4, col 4
    const edgeIdx = 3 * DIE_GRID_COLS + 0;   // row 3, col 0
    if (DIE_MASK[centerIdx] && DIE_MASK[edgeIdx]) {
      expect(map[centerIdx]).toBeGreaterThan(map[edgeIdx]);
    }
  });

  it('inactive dies have zero thickness', () => {
    const map = computeThicknessMap(DEFAULT_PARAMS, 1.0, 1.0, 0, 1.0);
    map.forEach((v, i) => {
      if (!DIE_MASK[i]) expect(v).toBe(0);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd equipment-monitor && npx jest src/lib/dep-sim/__tests__/growth-model.test.ts --no-coverage`
Expected: FAIL — cannot find module '../growth-model'

**Step 3: Write minimal implementation**

```typescript
// equipment-monitor/src/lib/dep-sim/growth-model.ts
import type { SimulationParams } from './types';
import {
  DIE_GRID_COLS,
  DIE_GRID_ROWS,
  DIE_MASK,
  GPC_MAX,
  SHOWERHEAD_NONUNIFORMITY,
} from './constants';
import { gpcThermalFactor } from './thermal-model';

/**
 * Compute growth per cycle (Angstrom).
 * GPC = GPC_MAX * coverageA * coverageB * thermalFactor * o3Fraction
 */
export function computeGpc(
  coverageA: number,
  coverageB: number,
  o3Fraction: number,
  pedestalTemp: number,
): number {
  if (coverageA <= 0 || coverageB <= 0) return 0;
  const thermal = gpcThermalFactor(pedestalTemp);
  return GPC_MAX * coverageA * coverageB * o3Fraction * thermal;
}

/**
 * Compute per-die thickness for this cycle.
 * Applies showerhead flow non-uniformity: center gets more precursor than edge.
 * Returns GPC per die (Angstrom), masked to zero for inactive dies.
 */
export function computeThicknessMap(
  params: SimulationParams,
  coverageA: number,
  coverageB: number,
  cumulativeThickness: number,
  o3Fraction: number,
): number[] {
  const cols = DIE_GRID_COLS;
  const rows = DIE_GRID_ROWS;
  const dieCount = cols * rows;
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const maxR = Math.sqrt(cx * cx + cy * cy);

  const baseGpc = computeGpc(coverageA, coverageB, o3Fraction, params.pedestalTemp);
  const map = new Array<number>(dieCount);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;
      if (!DIE_MASK[idx]) {
        map[idx] = 0;
        continue;
      }
      // Radial distance normalized 0..1
      const rx = (col - cx) / maxR;
      const ry = (row - cy) / maxR;
      const r = Math.sqrt(rx * rx + ry * ry);
      // Showerhead profile: center gets slightly more, edge gets less
      const uniformityFactor = 1 - SHOWERHEAD_NONUNIFORMITY * r * r;
      map[idx] = cumulativeThickness + baseGpc * uniformityFactor;
    }
  }

  return map;
}
```

**Step 4: Run tests to verify they pass**

Run: `cd equipment-monitor && npx jest src/lib/dep-sim/__tests__/growth-model.test.ts --no-coverage`
Expected: 5 tests PASS

**Step 5: Commit**

```bash
cd equipment-monitor && git add src/lib/dep-sim/growth-model.ts src/lib/dep-sim/__tests__/growth-model.test.ts
git commit -m "feat(dep-sim): growth model with GPC calculation and showerhead non-uniformity"
```

---

### Task 6: Wafer Metrics Orchestrator (TDD)

**Files:**
- Create: `equipment-monitor/src/lib/dep-sim/__tests__/wafer-metrics.test.ts`
- Create: `equipment-monitor/src/lib/dep-sim/wafer-metrics.ts`

**Depends on:** Tasks 2-5 (all physics modules)

**Step 1: Write the failing tests**

```typescript
// equipment-monitor/src/lib/dep-sim/__tests__/wafer-metrics.test.ts
import { computeCycleMetrics } from '../wafer-metrics';
import { DEFAULT_PARAMS, DIE_MASK, IDEAL_RI } from '../constants';

describe('wafer-metrics', () => {
  it('returns correct die count for 9x9 grid', () => {
    const result = computeCycleMetrics(DEFAULT_PARAMS, 0);
    expect(result.dieCount).toBe(81);
    expect(result.dieGridCols).toBe(9);
    expect(result.dieGridRows).toBe(9);
  });

  it('thickness map has correct length', () => {
    const result = computeCycleMetrics(DEFAULT_PARAMS, 0);
    expect(result.thicknessMap).toHaveLength(81);
  });

  it('GPC is near GPC_MAX at default (nominal) params', () => {
    const result = computeCycleMetrics(DEFAULT_PARAMS, 0);
    // With default params, both coverages should be near saturation
    expect(result.gpc).toBeGreaterThan(0.4);
    expect(result.gpc).toBeLessThan(0.8);
  });

  it('roughness increases with incomplete purge', () => {
    const nominal = computeCycleMetrics(DEFAULT_PARAMS, 0);
    const badPurge = computeCycleMetrics({ ...DEFAULT_PARAMS, purgeTime: 0.1 }, 0);
    // Average roughness should be higher with bad purge
    const avgNominal = nominal.roughnessMap.reduce((s, v) => s + v, 0) / nominal.roughnessMap.length;
    const avgBad = badPurge.roughnessMap.reduce((s, v) => s + v, 0) / badPurge.roughnessMap.length;
    expect(avgBad).toBeGreaterThan(avgNominal);
  });

  it('RI is near 1.46 at nominal conditions for active dies', () => {
    const result = computeCycleMetrics(DEFAULT_PARAMS, 0);
    result.riMap.forEach((v, i) => {
      if (DIE_MASK[i]) {
        expect(v).toBeGreaterThan(IDEAL_RI - 0.05);
        expect(v).toBeLessThan(IDEAL_RI + 0.05);
      } else {
        expect(v).toBe(0);
      }
    });
  });

  it('uniformity is below 5% at nominal conditions', () => {
    const result = computeCycleMetrics(DEFAULT_PARAMS, 0);
    expect(result.uniformity).toBeGreaterThan(0);
    expect(result.uniformity).toBeLessThan(5);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd equipment-monitor && npx jest src/lib/dep-sim/__tests__/wafer-metrics.test.ts --no-coverage`
Expected: FAIL — cannot find module '../wafer-metrics'

**Step 3: Write minimal implementation**

```typescript
// equipment-monitor/src/lib/dep-sim/wafer-metrics.ts
import type { SimulationParams, CycleState } from './types';
import {
  BASE_ROUGHNESS,
  DIE_GRID_COLS,
  DIE_GRID_ROWS,
  DIE_MASK,
  IDEAL_RI,
  RI_PER_COVERAGE_DEFICIT,
  ROUGHNESS_PER_DECOMP_DEGREE,
  ROUGHNESS_PER_RESIDUAL,
  ALD_WINDOW_HIGH,
} from './constants';
import { computeHalfCycleCoverages } from './langmuir';
import { computeFlowState } from './reactor-flow';
import { computeThicknessMap, computeGpc } from './growth-model';
import { classifyRegime } from './thermal-model';

/**
 * Compute all wafer metrics for a single ALD cycle.
 * Orchestrates langmuir -> flow -> growth -> roughness -> RI.
 */
export function computeCycleMetrics(
  params: SimulationParams,
  cumulativeThickness: number,
): Omit<CycleState, 'cycleIndex' | 'phase'> {
  const cols = DIE_GRID_COLS;
  const rows = DIE_GRID_ROWS;
  const dieCount = cols * rows;

  // 1. Half-cycle coverages
  const { coverageA, coverageB } = computeHalfCycleCoverages(params);

  // 2. Reactor flow state
  const flow = computeFlowState(params);

  // 3. GPC and thickness map
  const gpc = computeGpc(coverageA, coverageB, flow.effectiveO3Fraction, params.pedestalTemp);
  const thicknessMap = computeThicknessMap(params, coverageA, coverageB, cumulativeThickness, flow.effectiveO3Fraction);

  // 4. Roughness map — increases with parasitic CVD (residual) and decomposition
  const regime = classifyRegime(params.pedestalTemp);
  const decompPenalty = regime === 'decomposition'
    ? (params.pedestalTemp - ALD_WINDOW_HIGH) * ROUGHNESS_PER_DECOMP_DEGREE
    : 0;
  const residualPenalty = flow.residualFraction * ROUGHNESS_PER_RESIDUAL;
  const roughnessMap = new Array<number>(dieCount);
  for (let i = 0; i < dieCount; i++) {
    if (!DIE_MASK[i]) {
      roughnessMap[i] = 0;
      continue;
    }
    roughnessMap[i] = BASE_ROUGHNESS + residualPenalty + decompPenalty;
  }

  // 5. Refractive index map — deviates from 1.46 when oxidation is incomplete
  const coverageDeficit = 1 - coverageB * flow.effectiveO3Fraction;
  const riMap = new Array<number>(dieCount);
  for (let i = 0; i < dieCount; i++) {
    if (!DIE_MASK[i]) {
      riMap[i] = 0;
      continue;
    }
    riMap[i] = IDEAL_RI - coverageDeficit * RI_PER_COVERAGE_DEFICIT;
  }

  // 6. Uniformity: 1-sigma/mean of active die thicknesses
  const activeThicknesses = thicknessMap.filter((_, i) => DIE_MASK[i] === 1);
  const mean = activeThicknesses.reduce((s, v) => s + v, 0) / activeThicknesses.length;
  const variance = activeThicknesses.reduce((s, v) => s + (v - mean) ** 2, 0) / activeThicknesses.length;
  const sigma = Math.sqrt(variance);
  const uniformity = mean > 0 ? (sigma / mean) * 100 : 0;

  const newCumulativeThickness = cumulativeThickness + gpc;

  return {
    coverageA,
    coverageB,
    gpc,
    cumulativeThickness: newCumulativeThickness,
    thicknessMap,
    roughnessMap,
    riMap,
    uniformity,
    dieCount,
    dieGridCols: cols,
    dieGridRows: rows,
  };
}
```

**Step 4: Run tests to verify they pass**

Run: `cd equipment-monitor && npx jest src/lib/dep-sim/__tests__/wafer-metrics.test.ts --no-coverage`
Expected: 6 tests PASS

**Step 5: Commit**

```bash
cd equipment-monitor && git add src/lib/dep-sim/wafer-metrics.ts src/lib/dep-sim/__tests__/wafer-metrics.test.ts
git commit -m "feat(dep-sim): wafer metrics orchestrator with thickness, roughness, RI, uniformity"
```

---

### Task 7: Simulation Engine + Presets + Barrel Export (TDD)

**Files:**
- Create: `equipment-monitor/src/lib/dep-sim/presets.ts`
- Create: `equipment-monitor/src/lib/dep-sim/simulation-engine.ts`
- Create: `equipment-monitor/src/lib/dep-sim/index.ts`
- Create: `equipment-monitor/src/lib/dep-sim/__tests__/simulation-engine.test.ts`
- Create: `equipment-monitor/src/lib/dep-sim/__tests__/presets.test.ts`

**Depends on:** Task 6 (wafer-metrics)

**Step 1: Create presets.ts**

```typescript
// equipment-monitor/src/lib/dep-sim/presets.ts
import type { Preset } from './types';
import { DEFAULT_PARAMS } from './constants';

export const PRESETS: Preset[] = [
  {
    id: 'precursor-starvation',
    label: 'Precursor Starvation',
    labelCN: '\u524D\u9A45\u7269\u8655\u7F3A',
    color: '#ef4444',
    apply: (params) => ({ ...params, bdeasFlowRate: params.bdeasFlowRate * 0.4 }),
  },
  {
    id: 'purge-leak-through',
    label: 'Purge Leak-Through',
    labelCN: '\u5439\u6383\u6B98\u7559',
    color: '#f59e0b',
    apply: (params) => ({ ...params, purgeTime: params.purgeTime * 0.3 }),
  },
  {
    id: 'temperature-excursion',
    label: 'Temperature Excursion',
    labelCN: '\u6EAB\u5EA6\u5931\u63A7',
    color: '#f97316',
    apply: (params) => ({ ...params, pedestalTemp: params.pedestalTemp + 80 }),
  },
  {
    id: 'o3-degradation',
    label: 'O\u2083 Generator Degradation',
    labelCN: '\u81ED\u6C27\u8870\u6E1B',
    color: '#8b5cf6',
    apply: (params, cycleIndex) => ({
      ...params,
      o3FlowRate: params.o3FlowRate * Math.max(0.2, 1 - 0.05 * Math.min(cycleIndex, 16)),
    }),
  },
  {
    id: 'chamber-seasoning',
    label: 'Chamber Seasoning Drift',
    labelCN: '\u8155\u9AD4\u8ABF\u8CEA\u6F02\u79FB',
    color: '#3b82f6',
    apply: (params) => ({ ...DEFAULT_PARAMS, totalCycles: params.totalCycles }),
  },
];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
```

**Step 2: Create simulation-engine.ts**

```typescript
// equipment-monitor/src/lib/dep-sim/simulation-engine.ts
import type { PresetId, SimulationParams, SimulationState, CycleState } from './types';
import { DEFAULT_PARAMS, DEFAULT_TOTAL_CYCLES } from './constants';
import { computeCycleMetrics } from './wafer-metrics';
import { getPreset } from './presets';

/**
 * Create a fresh simulation state.
 */
export function createSimulation(params: SimulationParams = DEFAULT_PARAMS): SimulationState {
  return {
    params: { ...params },
    cycles: [],
    currentIndex: -1,
    totalCycles: params.totalCycles ?? DEFAULT_TOTAL_CYCLES,
  };
}

/**
 * Advance the simulation by one ALD cycle.
 * Returns a new state (immutable update).
 */
export function stepCycle(state: SimulationState): SimulationState {
  const nextIndex = state.currentIndex + 1;
  if (nextIndex >= state.totalCycles) return state;

  const prevThickness = nextIndex > 0
    ? state.cycles[state.cycles.length - 1].cumulativeThickness
    : 0;

  const metrics = computeCycleMetrics(state.params, prevThickness);

  const cycleState: CycleState = {
    cycleIndex: nextIndex,
    phase: 'purge-b', // completed full cycle
    ...metrics,
  };

  return {
    ...state,
    cycles: [...state.cycles, cycleState],
    currentIndex: nextIndex,
  };
}

/**
 * Advance the simulation by N cycles (batch step for fast-forward).
 */
export function stepN(state: SimulationState, n: number): SimulationState {
  let current = state;
  for (let i = 0; i < n; i++) {
    const next = stepCycle(current);
    if (next === current) break; // reached limit
    current = next;
  }
  return current;
}

/**
 * Apply a what-if preset to the current simulation state.
 */
export function applyPreset(state: SimulationState, presetId: PresetId): SimulationState {
  const preset = getPreset(presetId);
  if (!preset) return state;

  if (presetId === 'chamber-seasoning') {
    return createSimulation(preset.apply(state.params, 0));
  }

  return {
    ...state,
    params: preset.apply(state.params, state.currentIndex),
  };
}
```

**Step 3: Create index.ts barrel export**

```typescript
// equipment-monitor/src/lib/dep-sim/index.ts
export { createSimulation, stepCycle, stepN, applyPreset } from './simulation-engine';
export { PRESETS, getPreset } from './presets';
export { DEFAULT_PARAMS, PARAM_BOUNDS, DEFAULT_TOTAL_CYCLES } from './constants';
export type {
  SimulationParams,
  SimulationState,
  CycleState,
  CyclePhase,
  WaferMetric,
  PresetId,
  FlowState,
  ThermalRegime,
} from './types';
```

**Step 4: Write simulation-engine tests**

```typescript
// equipment-monitor/src/lib/dep-sim/__tests__/simulation-engine.test.ts
import { createSimulation, stepCycle, stepN, applyPreset } from '../simulation-engine';
import { DEFAULT_PARAMS, DEFAULT_TOTAL_CYCLES } from '../constants';

describe('simulation-engine', () => {
  it('creates initial state with empty cycles', () => {
    const state = createSimulation(DEFAULT_PARAMS);
    expect(state.cycles).toHaveLength(0);
    expect(state.currentIndex).toBe(-1);
    expect(state.totalCycles).toBe(DEFAULT_TOTAL_CYCLES);
  });

  it('stepCycle advances currentIndex', () => {
    let state = createSimulation(DEFAULT_PARAMS);
    state = stepCycle(state);
    expect(state.currentIndex).toBe(0);
    expect(state.cycles).toHaveLength(1);
  });

  it('cumulative thickness grows across cycles', () => {
    let state = createSimulation(DEFAULT_PARAMS);
    for (let i = 0; i < 10; i++) state = stepCycle(state);
    const thicknesses = state.cycles.map((c) => c.cumulativeThickness);
    for (let i = 1; i < thicknesses.length; i++) {
      expect(thicknesses[i]).toBeGreaterThan(thicknesses[i - 1]);
    }
  });

  it('does not exceed total cycles', () => {
    const params = { ...DEFAULT_PARAMS, totalCycles: 5 };
    let state = createSimulation(params);
    for (let i = 0; i < 10; i++) state = stepCycle(state);
    expect(state.cycles).toHaveLength(5);
  });

  it('stepN advances by N cycles', () => {
    let state = createSimulation(DEFAULT_PARAMS);
    state = stepN(state, 20);
    expect(state.cycles).toHaveLength(20);
    expect(state.currentIndex).toBe(19);
  });

  it('precursor-starvation preset reduces BDEAS flow', () => {
    let state = createSimulation(DEFAULT_PARAMS);
    state = stepCycle(state);
    state = applyPreset(state, 'precursor-starvation');
    expect(state.params.bdeasFlowRate).toBeCloseTo(DEFAULT_PARAMS.bdeasFlowRate * 0.4);
  });

  it('chamber-seasoning preset resets to fresh state', () => {
    let state = createSimulation(DEFAULT_PARAMS);
    for (let i = 0; i < 10; i++) state = stepCycle(state);
    state = applyPreset(state, 'chamber-seasoning');
    expect(state.cycles).toHaveLength(0);
    expect(state.currentIndex).toBe(-1);
  });
});
```

**Step 5: Write presets tests**

```typescript
// equipment-monitor/src/lib/dep-sim/__tests__/presets.test.ts
import { getPreset, PRESETS } from '../presets';
import { DEFAULT_PARAMS } from '../constants';

describe('presets', () => {
  it('precursor-starvation reduces BDEAS flow by 60%', () => {
    const preset = getPreset('precursor-starvation')!;
    const result = preset.apply(DEFAULT_PARAMS, 0);
    expect(result.bdeasFlowRate).toBeCloseTo(DEFAULT_PARAMS.bdeasFlowRate * 0.4);
  });

  it('purge-leak-through cuts purge time to 30%', () => {
    const preset = getPreset('purge-leak-through')!;
    const result = preset.apply(DEFAULT_PARAMS, 0);
    expect(result.purgeTime).toBeCloseTo(DEFAULT_PARAMS.purgeTime * 0.3);
  });

  it('temperature-excursion adds 80 degC', () => {
    const preset = getPreset('temperature-excursion')!;
    const result = preset.apply(DEFAULT_PARAMS, 0);
    expect(result.pedestalTemp).toBe(DEFAULT_PARAMS.pedestalTemp + 80);
  });

  it('o3-degradation reduces O3 flow progressively', () => {
    const preset = getPreset('o3-degradation')!;
    const early = preset.apply(DEFAULT_PARAMS, 0);
    const late = preset.apply(DEFAULT_PARAMS, 16);
    expect(late.o3FlowRate).toBeLessThan(early.o3FlowRate);
  });

  it('chamber-seasoning resets to default params', () => {
    const preset = getPreset('chamber-seasoning')!;
    const modified = { ...DEFAULT_PARAMS, pedestalTemp: 350, bdeasFlowRate: 10 };
    const result = preset.apply(modified, 0);
    expect(result.pedestalTemp).toBe(DEFAULT_PARAMS.pedestalTemp);
    expect(result.bdeasFlowRate).toBe(DEFAULT_PARAMS.bdeasFlowRate);
  });
});
```

**Step 6: Run all dep-sim tests**

Run: `cd equipment-monitor && npx jest src/lib/dep-sim/ --no-coverage`
Expected: All ~33 tests PASS across 7 test files

**Step 7: TypeScript check**

Run: `cd equipment-monitor && npx tsc --noEmit`
Expected: No errors

**Step 8: Commit**

```bash
cd equipment-monitor && git add src/lib/dep-sim/presets.ts src/lib/dep-sim/simulation-engine.ts src/lib/dep-sim/index.ts src/lib/dep-sim/__tests__/simulation-engine.test.ts src/lib/dep-sim/__tests__/presets.test.ts
git commit -m "feat(dep-sim): simulation engine with 5 what-if presets and barrel export"
```

---

## Phase 2: Fab-Floor Entry Points

### Task 8: Digital Twin Routes Constant + HUD Panel Button

**Files:**
- Create: `equipment-monitor/src/lib/digital-twin-routes.ts`
- Modify: `equipment-monitor/src/components/fab-floor/ProcessHudPanel.tsx`

**Step 1: Create the routes lookup**

```typescript
// equipment-monitor/src/lib/digital-twin-routes.ts
import type { ProcessId } from './fab-process-data';

/** Map of processes that have a digital twin sub-route */
export const DIGITAL_TWIN_ROUTES: Partial<Record<ProcessId, string>> = {
  lithography: '/mes/fab-floor/lithography/lens-sim',
  deposition: '/mes/fab-floor/deposition/reactor-sim',
};
```

**Step 2: Add "Open Digital Twin" button to ProcessHudPanel**

Modify `equipment-monitor/src/components/fab-floor/ProcessHudPanel.tsx`:

After the existing `<Link href={...}>View Details</Link>` at line 69, add a second link that only renders when the process has a digital twin route. The full replacement for lines 69-71:

```typescript
      <Link href={`/mes/fab-floor/${process.id}`} className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold uppercase tracking-[0.16em] transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2" style={{ borderColor: process.color, color: process.color }}>
        View Details <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
      {DIGITAL_TWIN_ROUTES[process.id] && (
        <Link href={DIGITAL_TWIN_ROUTES[process.id]!} className="mt-2 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold uppercase tracking-[0.16em] transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2" style={{ borderColor: process.color, backgroundColor: `color-mix(in srgb, ${process.color} 12%, transparent)`, color: process.color }}>
          Digital Twin \u6578\u4F4D\u5B6E\u751F <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </aside>
```

Also add the import at the top of ProcessHudPanel.tsx:

```typescript
import { DIGITAL_TWIN_ROUTES } from '@/lib/digital-twin-routes';
```

**Step 3: Verify TypeScript compiles**

Run: `cd equipment-monitor && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
cd equipment-monitor && git add src/lib/digital-twin-routes.ts src/components/fab-floor/ProcessHudPanel.tsx
git commit -m "feat(fab-floor): add Digital Twin button to HUD panel for lithography and deposition"
```

---

### Task 9: Fab Floor Scene Digital Twin Badges

**Files:**
- Modify: `equipment-monitor/src/components/babylon/FabFloorScene.tsx`

**Step 1: Add badge creation function and integrate into scene**

Add the import at the top of `FabFloorScene.tsx` (after existing imports):

```typescript
import { DIGITAL_TWIN_ROUTES } from '@/lib/digital-twin-routes';
```

Add this function after `createStation` (after line 175):

```typescript
function createDigitalTwinBadge(scene: BABYLON.Scene, process: FabProcess, group: BABYLON.TransformNode) {
  if (!DIGITAL_TWIN_ROUTES[process.id]) return;

  // Pulsing diamond badge
  const badge = BABYLON.MeshBuilder.CreateSphere(`${process.id}-dt-badge`, { diameter: 0.55, segments: 4 }, scene);
  badge.parent = group;
  badge.position.y = 4.2;
  badge.rotation.y = Math.PI / 4;
  badge.scaling = new BABYLON.Vector3(1, 1.3, 1);

  const mat = new BABYLON.StandardMaterial(`${process.id}-dt-badge-mat`, scene);
  mat.diffuseColor = BABYLON.Color3.FromHexString(process.color);
  mat.emissiveColor = BABYLON.Color3.FromHexString(process.color).scale(0.9);
  mat.alpha = 0.85;
  badge.material = mat;
  badge.metadata = { processId: process.id, type: 'dt-badge', route: DIGITAL_TWIN_ROUTES[process.id] };
  badge.isPickable = true;

  // "DT" label below diamond
  const labelTexture = new BABYLON.DynamicTexture(`${process.id}-dt-label-tex`, { width: 256, height: 96 }, scene, false);
  labelTexture.hasAlpha = true;
  labelTexture.drawText('DT', 80, 64, 'bold 48px Fira Code, monospace', '#f8fafc', 'transparent', true);
  const labelMat = new BABYLON.StandardMaterial(`${process.id}-dt-label-mat`, scene);
  labelMat.diffuseTexture = labelTexture;
  labelMat.opacityTexture = labelTexture;
  labelMat.emissiveColor = BABYLON.Color3.FromHexString(process.color);
  labelMat.disableLighting = true;
  labelMat.backFaceCulling = false;
  const labelPlane = BABYLON.MeshBuilder.CreatePlane(`${process.id}-dt-label`, { width: 1.2, height: 0.45 }, scene);
  labelPlane.parent = group;
  labelPlane.position.y = 3.85;
  labelPlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
  labelPlane.material = labelMat;
  labelPlane.isPickable = false;

  // Pulse animation
  scene.onBeforeRenderObservable.add(() => {
    const pulse = 0.75 + 0.25 * Math.sin(performance.now() / 600);
    mat.alpha = pulse;
    badge.rotation.y += 0.008;
  });
}
```

In the `createStation` function, add the badge call at line 174 (just before `return group;`):

```typescript
  createDigitalTwinBadge(scene, process, group);
  return group;
```

In the `scene.onPointerObservable.add` handler (around line 275-279), update the click handler to support badge navigation:

Replace the existing handler:
```typescript
  scene.onPointerObservable.add((info) => {
    if (info.type !== BABYLON.PointerEventTypes.POINTERPICK) return;
    const metadata = info.pickInfo?.pickedMesh?.metadata as SceneMeshMetadata | undefined;
    if (metadata?.processId) propsRef.current.onSelectProcess(metadata.processId);
  });
```

With:
```typescript
  scene.onPointerObservable.add((info) => {
    if (info.type !== BABYLON.PointerEventTypes.POINTERPICK) return;
    const metadata = info.pickInfo?.pickedMesh?.metadata as (SceneMeshMetadata & { route?: string }) | undefined;
    if (metadata?.type === 'dt-badge' && metadata.route) {
      // Navigate to digital twin page — use window.location for Next.js static export compatibility
      window.location.href = metadata.route;
      return;
    }
    if (metadata?.processId) propsRef.current.onSelectProcess(metadata.processId);
  });
```

**Step 2: Verify TypeScript compiles**

Run: `cd equipment-monitor && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
cd equipment-monitor && git add src/components/babylon/FabFloorScene.tsx
git commit -m "feat(fab-floor): add pulsing DT badge on stations with digital twin sims"
```

---

## Phase 3: UI Layer

### Task 10: Reactor Sim Page + Timeline + Parameter Panel

**Files:**
- Create: `equipment-monitor/src/app/mes/fab-floor/deposition/reactor-sim/page.tsx`
- Create: `equipment-monitor/src/components/dep-sim/TimelineBar.tsx`
- Create: `equipment-monitor/src/components/dep-sim/ParameterPanel.tsx`

**Step 1: Create TimelineBar component**

```typescript
// equipment-monitor/src/components/dep-sim/TimelineBar.tsx
'use client';

import { ChevronRight, Pause, Play, RotateCcw } from 'lucide-react';
import type { CycleState } from '@/lib/dep-sim';

interface TimelineBarProps {
  currentIndex: number;
  totalCycles: number;
  playing: boolean;
  currentCycle: CycleState | null;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onSeek: (index: number) => void;
  onReset: () => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
}

const PHASE_COLORS: Record<string, string> = {
  'bdeas-pulse': '#3b82f6',
  'purge-a': '#6b7280',
  'o3-pulse': '#f97316',
  'purge-b': '#6b7280',
};

const PHASE_LABELS: Record<string, string> = {
  'bdeas-pulse': 'BDEAS Pulse',
  'purge-a': 'Purge',
  'o3-pulse': 'O\u2083 Pulse',
  'purge-b': 'Purge',
};

export function TimelineBar({
  currentIndex, totalCycles, playing, currentCycle,
  onPlay, onPause, onStep, onSeek, onReset,
  playbackSpeed, onSpeedChange,
}: TimelineBarProps) {
  const progress = totalCycles > 0 ? ((currentIndex + 1) / totalCycles) * 100 : 0;
  const phase = currentCycle?.phase ?? 'purge-b';
  const thickness = currentCycle?.cumulativeThickness.toFixed(1) ?? '0.0';

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[rgba(59,130,246,0.2)] bg-[rgba(2,6,23,0.8)] px-4 py-2 backdrop-blur-xl">
      <div className="flex items-center gap-1">
        <button type="button" onClick={playing ? onPause : onPlay} className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full hover:bg-white/10" aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button type="button" onClick={onStep} className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full hover:bg-white/10" aria-label="Step one cycle" disabled={currentIndex >= totalCycles - 1}>
          <ChevronRight className="h-4 w-4" />
        </button>
        <button type="button" onClick={onReset} className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full hover:bg-white/10" aria-label="Reset">
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 min-w-[200px]">
        <input type="range" min={-1} max={totalCycles - 1} value={currentIndex} onChange={(e) => onSeek(Number(e.target.value))} className="w-full accent-blue-500" aria-label="Cycle timeline" />
        <div className="mt-0.5 h-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: PHASE_COLORS[phase] }} />
        </div>
      </div>

      <div className="flex items-center gap-3 font-mono text-xs">
        <span className="rounded-full px-2 py-0.5" style={{ backgroundColor: PHASE_COLORS[phase], color: '#fff' }}>
          {PHASE_LABELS[phase]}
        </span>
        <span className="text-[var(--sf-text-secondary)]">
          Cycle {currentIndex + 1}/{totalCycles}
        </span>
        <span style={{ color: '#3b82f6' }}>
          {thickness} \u00C5
        </span>
        <select value={playbackSpeed} onChange={(e) => onSpeedChange(Number(e.target.value))} className="rounded bg-white/10 px-2 py-1 text-xs" aria-label="Playback speed">
          <option value={1}>1\u00D7</option>
          <option value={2}>2\u00D7</option>
          <option value={5}>5\u00D7</option>
          <option value={10}>10\u00D7</option>
        </select>
      </div>
    </div>
  );
}
```

**Step 2: Create ParameterPanel component**

```typescript
// equipment-monitor/src/components/dep-sim/ParameterPanel.tsx
'use client';

import type { PresetId, SimulationParams } from '@/lib/dep-sim';
import { PARAM_BOUNDS, PRESETS } from '@/lib/dep-sim';

interface ParameterPanelProps {
  params: SimulationParams;
  activePreset: PresetId | null;
  onParamChange: (key: keyof SimulationParams, value: number) => void;
  onPreset: (id: PresetId) => void;
}

const SLIDER_KEYS: (keyof SimulationParams)[] = [
  'bdeasFlowRate', 'bdeasPulseTime', 'o3FlowRate', 'o3PulseTime',
  'purgeTime', 'pedestalTemp', 'chamberPressure', 'carrierGasFlow',
];

const LABELS: Record<string, string> = {
  bdeasFlowRate: 'BDEAS Flow',
  bdeasPulseTime: 'BDEAS Pulse',
  o3FlowRate: 'O\u2083 Flow',
  o3PulseTime: 'O\u2083 Pulse',
  purgeTime: 'Purge Time',
  pedestalTemp: 'Pedestal Temp',
  chamberPressure: 'Pressure',
  carrierGasFlow: 'N\u2082 Carrier',
};

export function ParameterPanel({ params, activePreset, onParamChange, onPreset }: ParameterPanelProps) {
  return (
    <div className="rounded-2xl border border-[rgba(59,130,246,0.2)] bg-[rgba(2,6,23,0.8)] px-4 py-3 backdrop-blur-xl">
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4 xl:grid-cols-8">
        {SLIDER_KEYS.map((key) => {
          const bounds = PARAM_BOUNDS[key];
          return (
            <label key={key} className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wider text-[var(--sf-text-muted)]">{LABELS[key]}</span>
              <input type="range" min={bounds.min} max={bounds.max} step={bounds.step} value={params[key]} onChange={(e) => onParamChange(key, Number(e.target.value))} className="accent-blue-500" />
              <span className="font-mono text-xs text-[var(--sf-text-secondary)]">{params[key]} {bounds.unit}</span>
            </label>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 border-t border-white/10 pt-3">
        <span className="text-[10px] uppercase tracking-wider text-[var(--sf-text-muted)] self-center mr-2">What-If</span>
        {PRESETS.map((preset) => (
          <button key={preset.id} type="button" onClick={() => onPreset(preset.id)} className="rounded-full border px-3 py-1 text-xs font-semibold transition-colors hover:bg-white/10" style={{ borderColor: preset.color, color: preset.color, backgroundColor: activePreset === preset.id ? `color-mix(in srgb, ${preset.color} 18%, transparent)` : 'transparent' }}>
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Step 3: Create the reactor-sim page**

```typescript
// equipment-monitor/src/app/mes/fab-floor/deposition/reactor-sim/page.tsx
'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TimelineBar } from '@/components/dep-sim/TimelineBar';
import { ParameterPanel } from '@/components/dep-sim/ParameterPanel';
import {
  createSimulation,
  stepCycle,
  stepN,
  applyPreset,
} from '@/lib/dep-sim';
import type { PresetId, SimulationParams, SimulationState, WaferMetric } from '@/lib/dep-sim';

const ReactorCrossSectionScene = dynamic(
  () => import('@/components/dep-sim/ReactorCrossSectionScene').then((m) => ({ default: m.ReactorCrossSectionScene })),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center bg-[var(--sf-bg-canvas)]"><p className="animate-pulse font-mono text-sm text-[var(--sf-text-muted)] motion-reduce:animate-none">Initializing reactor simulation...</p></div> },
);

const WaferMetricsPanel = dynamic(
  () => import('@/components/dep-sim/WaferMetricsPanel').then((m) => ({ default: m.WaferMetricsPanel })),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center bg-[var(--sf-bg-canvas)]"><p className="animate-pulse font-mono text-sm text-[var(--sf-text-muted)] motion-reduce:animate-none">Loading wafer metrics...</p></div> },
);

export default function ReactorSimPage() {
  const [sim, setSim] = useState<SimulationState>(() => createSimulation());
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [metric, setMetric] = useState<WaferMetric>('thickness');
  const [activePreset, setActivePreset] = useState<PresetId | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentCycle = sim.currentIndex >= 0 ? sim.cycles[sim.currentIndex] ?? null : null;

  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    const ms = Math.max(50, 600 / speed);
    intervalRef.current = setInterval(() => {
      setSim((prev) => {
        if (prev.currentIndex >= prev.totalCycles - 1) {
          setPlaying(false);
          return prev;
        }
        return stepCycle(prev);
      });
    }, ms);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, speed]);

  const handleStep = useCallback(() => {
    setSim((prev) => stepCycle(prev));
  }, []);

  const handleSeek = useCallback((index: number) => {
    setPlaying(false);
    setSim((prev) => {
      if (index < 0) return createSimulation(prev.params);
      let state = createSimulation(prev.params);
      state = stepN(state, index + 1);
      return state;
    });
  }, []);

  const handleReset = useCallback(() => {
    setPlaying(false);
    setActivePreset(null);
    setSim(createSimulation());
  }, []);

  const handleParamChange = useCallback((key: keyof SimulationParams, value: number) => {
    setSim((prev) => {
      const newParams = { ...prev.params, [key]: value };
      let state = createSimulation(newParams);
      if (prev.currentIndex >= 0) {
        state = stepN(state, prev.currentIndex + 1);
      }
      return state;
    });
  }, []);

  const handlePreset = useCallback((id: PresetId) => {
    setActivePreset(id);
    setSim((prev) => applyPreset(prev, id));
  }, []);

  return (
    <div className="relative flex min-h-[calc(100dvh-104px)] flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_32%),var(--sf-bg-canvas)] text-[var(--sf-text-primary)]">
      <div className="z-10 px-4 pt-3">
        <TimelineBar
          currentIndex={sim.currentIndex}
          totalCycles={sim.totalCycles}
          playing={playing}
          currentCycle={currentCycle}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onStep={handleStep}
          onSeek={handleSeek}
          onReset={handleReset}
          playbackSpeed={speed}
          onSpeedChange={setSpeed}
        />
      </div>

      <main className="flex flex-1 gap-1 overflow-hidden px-4 py-2" style={{ minHeight: 480 }}>
        <div className="flex-1 overflow-hidden rounded-2xl border border-[rgba(59,130,246,0.15)]" data-testid="reactor-cross-section-panel">
          <ReactorCrossSectionScene cycle={currentCycle} params={sim.params} />
        </div>
        <div className="flex-1 overflow-hidden rounded-2xl border border-[rgba(59,130,246,0.15)]" data-testid="wafer-metrics-panel">
          <WaferMetricsPanel cycles={sim.cycles} currentCycle={currentCycle} metric={metric} onMetricChange={setMetric} />
        </div>
      </main>

      <div className="z-10 px-4 pb-3">
        <ParameterPanel
          params={sim.params}
          activePreset={activePreset}
          onParamChange={handleParamChange}
          onPreset={handlePreset}
        />
      </div>
    </div>
  );
}
```

**Step 4: Verify TypeScript compiles** (will warn about missing ReactorCrossSectionScene and WaferMetricsPanel — that's OK, they come in Tasks 11-12)

Run: `cd equipment-monitor && npx tsc --noEmit 2>&1 | head -20`
Expected: Only errors about missing dep-sim component modules (ReactorCrossSectionScene, WaferMetricsPanel)

**Step 5: Commit**

```bash
cd equipment-monitor && git add src/app/mes/fab-floor/deposition/reactor-sim/page.tsx src/components/dep-sim/TimelineBar.tsx src/components/dep-sim/ParameterPanel.tsx
git commit -m "feat(dep-sim): reactor-sim page with timeline controls and parameter panel"
```

---

### Task 11: Babylon.js Reactor Cross-Section Scene + Surface Adsorption Grid

**Files:**
- Create: `equipment-monitor/src/components/dep-sim/ReactorCrossSectionScene.tsx`

**Reference:** `equipment-monitor/src/components/babylon/FabFloorScene.tsx` for Babylon.js patterns (engine setup, propsRef, dispose lifecycle). `equipment-monitor/src/components/lens-sim/LensCrossSectionScene.tsx` if it exists for split-panel Babylon.js pattern.

**Step 1: Create ReactorCrossSectionScene**

This component renders the ALD reactor chamber cross-section with:
- Showerhead (top) with particle system for gas flow
- Wafer on heated pedestal (bottom) with growing film layer
- Phase-colored particles (blue=BDEAS, orange=O3, none during purge)
- Surface adsorption grid overlay (Canvas2D) showing Langmuir coverage

```typescript
// equipment-monitor/src/components/dep-sim/ReactorCrossSectionScene.tsx
'use client';

import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { useClientReady } from '@/hooks/use-client-ready';
import { useWebGLSupport } from '@/hooks/use-webgl-support';
import { WebGLFallback } from '@/components/three/WebGLFallback';
import type { CycleState, SimulationParams } from '@/lib/dep-sim';

interface Props {
  cycle: CycleState | null;
  params: SimulationParams;
}

interface SceneRefs {
  filmMesh: BABYLON.Mesh | null;
  showerhead: BABYLON.Mesh | null;
  pedestal: BABYLON.Mesh | null;
  pedestalMat: BABYLON.StandardMaterial | null;
  particles: BABYLON.ParticleSystem | null;
  phaseLabel: BABYLON.DynamicTexture | null;
  phasePlane: BABYLON.Mesh | null;
  coverageCanvas: HTMLCanvasElement | null;
  coveragePlane: BABYLON.Mesh | null;
  coverageTexture: BABYLON.DynamicTexture | null;
}

const PHASE_COLORS: Record<string, [number, number, number]> = {
  'bdeas-pulse': [0.23, 0.51, 0.96],
  'o3-pulse': [0.98, 0.45, 0.09],
  'purge-a': [0.42, 0.42, 0.42],
  'purge-b': [0.42, 0.42, 0.42],
};

const PHASE_LABELS: Record<string, string> = {
  'bdeas-pulse': 'BDEAS PULSE',
  'purge-a': 'PURGE',
  'o3-pulse': 'O\u2083 PULSE',
  'purge-b': 'PURGE',
};

function createReactorScene(
  canvas: HTMLCanvasElement,
  propsRef: React.MutableRefObject<Props>,
): () => void {
  const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, antialias: true });
  engine.setHardwareScalingLevel(window.devicePixelRatio > 1 ? 1.25 : 1);
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.02, 0.035, 0.08, 1);

  const camera = new BABYLON.ArcRotateCamera('reactor-cam', -Math.PI / 2, 1.2, 12, new BABYLON.Vector3(0, 2, 0), scene);
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 6;
  camera.upperRadiusLimit = 20;
  camera.wheelPrecision = 60;

  const hemi = new BABYLON.HemisphericLight('reactor-ambient', new BABYLON.Vector3(0, 1, 0), scene);
  hemi.intensity = 0.4;

  const refs: SceneRefs = {
    filmMesh: null, showerhead: null, pedestal: null, pedestalMat: null,
    particles: null, phaseLabel: null, phasePlane: null,
    coverageCanvas: null, coveragePlane: null, coverageTexture: null,
  };

  // Chamber walls (transparent outline)
  const chamberMat = new BABYLON.StandardMaterial('chamber-wall-mat', scene);
  chamberMat.diffuseColor = new BABYLON.Color3(0.15, 0.25, 0.4);
  chamberMat.emissiveColor = new BABYLON.Color3(0.05, 0.1, 0.2);
  chamberMat.alpha = 0.15;
  chamberMat.backFaceCulling = false;
  const chamber = BABYLON.MeshBuilder.CreateCylinder('chamber', { height: 5, diameter: 5, tessellation: 48 }, scene);
  chamber.position.y = 2.5;
  chamber.material = chamberMat;
  chamber.isPickable = false;

  // Showerhead (top)
  const showerMat = new BABYLON.PBRMaterial('shower-mat', scene);
  showerMat.albedoColor = new BABYLON.Color3(0.6, 0.65, 0.7);
  showerMat.metallic = 0.7;
  showerMat.roughness = 0.3;
  refs.showerhead = BABYLON.MeshBuilder.CreateCylinder('showerhead', { height: 0.3, diameter: 4, tessellation: 48 }, scene);
  refs.showerhead.position.y = 4.85;
  refs.showerhead.material = showerMat;
  refs.showerhead.isPickable = false;

  // Pedestal (bottom)
  refs.pedestalMat = new BABYLON.StandardMaterial('pedestal-mat', scene);
  refs.pedestalMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.45);
  refs.pedestalMat.emissiveColor = new BABYLON.Color3(0.15, 0.05, 0.02);
  refs.pedestal = BABYLON.MeshBuilder.CreateCylinder('pedestal', { height: 0.5, diameter: 3.5, tessellation: 48 }, scene);
  refs.pedestal.position.y = 0.25;
  refs.pedestal.material = refs.pedestalMat;
  refs.pedestal.isPickable = false;

  // Wafer (on pedestal)
  const waferMat = new BABYLON.PBRMaterial('wafer-mat', scene);
  waferMat.albedoColor = new BABYLON.Color3(0.3, 0.32, 0.38);
  waferMat.metallic = 0.5;
  waferMat.roughness = 0.2;
  const wafer = BABYLON.MeshBuilder.CreateCylinder('wafer', { height: 0.04, diameter: 3.0, tessellation: 48 }, scene);
  wafer.position.y = 0.52;
  wafer.material = waferMat;
  wafer.isPickable = false;

  // Film layer (grows with thickness)
  const filmMat = new BABYLON.StandardMaterial('film-mat', scene);
  filmMat.diffuseColor = new BABYLON.Color3(0.3, 0.5, 0.9);
  filmMat.emissiveColor = new BABYLON.Color3(0.1, 0.2, 0.5);
  filmMat.alpha = 0.7;
  refs.filmMesh = BABYLON.MeshBuilder.CreateCylinder('film', { height: 0.01, diameter: 3.0, tessellation: 48 }, scene);
  refs.filmMesh.position.y = 0.55;
  refs.filmMesh.material = filmMat;
  refs.filmMesh.isPickable = false;

  // Particle system for gas flow
  refs.particles = new BABYLON.ParticleSystem('gas-particles', 200, scene);
  refs.particles.createPointEmitter(new BABYLON.Vector3(-1.5, 0, -1.5), new BABYLON.Vector3(1.5, 0, 1.5));
  refs.particles.emitter = new BABYLON.Vector3(0, 4.6, 0);
  refs.particles.minLifeTime = 0.8;
  refs.particles.maxLifeTime = 1.5;
  refs.particles.minSize = 0.05;
  refs.particles.maxSize = 0.12;
  refs.particles.emitRate = 80;
  refs.particles.gravity = new BABYLON.Vector3(0, -3, 0);
  refs.particles.direction1 = new BABYLON.Vector3(-0.3, -1, -0.3);
  refs.particles.direction2 = new BABYLON.Vector3(0.3, -1, 0.3);
  refs.particles.start();

  // Phase label
  refs.phaseLabel = new BABYLON.DynamicTexture('phase-label-tex', { width: 512, height: 96 }, scene, false);
  refs.phaseLabel.hasAlpha = true;
  const phaseMat = new BABYLON.StandardMaterial('phase-label-mat', scene);
  phaseMat.diffuseTexture = refs.phaseLabel;
  phaseMat.opacityTexture = refs.phaseLabel;
  phaseMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
  phaseMat.disableLighting = true;
  phaseMat.backFaceCulling = false;
  refs.phasePlane = BABYLON.MeshBuilder.CreatePlane('phase-label-plane', { width: 3, height: 0.56 }, scene);
  refs.phasePlane.position.y = 5.5;
  refs.phasePlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
  refs.phasePlane.material = phaseMat;
  refs.phasePlane.isPickable = false;

  // Surface adsorption grid (20x20 Canvas2D texture)
  refs.coverageTexture = new BABYLON.DynamicTexture('coverage-tex', { width: 400, height: 400 }, scene, false);
  refs.coverageTexture.hasAlpha = true;
  const covMat = new BABYLON.StandardMaterial('coverage-mat', scene);
  covMat.diffuseTexture = refs.coverageTexture;
  covMat.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.3);
  covMat.disableLighting = true;
  covMat.backFaceCulling = false;
  covMat.alpha = 0.9;
  refs.coveragePlane = BABYLON.MeshBuilder.CreatePlane('coverage-plane', { width: 2.8, height: 2.8 }, scene);
  refs.coveragePlane.position = new BABYLON.Vector3(0, 0.58, 0);
  refs.coveragePlane.rotation.x = Math.PI / 2;
  refs.coveragePlane.material = covMat;
  refs.coveragePlane.isPickable = false;

  // Glow
  const glow = new BABYLON.GlowLayer('reactor-glow', scene, { blurKernelSize: 24 });
  glow.intensity = 0.5;

  let lastPhase = '';
  scene.onBeforeRenderObservable.add(() => {
    const { cycle, params } = propsRef.current;
    const phase = cycle?.phase ?? 'purge-b';
    const isPulse = phase === 'bdeas-pulse' || phase === 'o3-pulse';

    // Update particle color and rate
    if (refs.particles) {
      const [r, g, b] = PHASE_COLORS[phase] ?? [0.4, 0.4, 0.4];
      refs.particles.color1 = new BABYLON.Color4(r, g, b, 1);
      refs.particles.color2 = new BABYLON.Color4(r, g, b, 0.4);
      refs.particles.emitRate = isPulse ? 120 : 15;
    }

    // Update film thickness visual
    if (refs.filmMesh && cycle) {
      const h = Math.max(0.01, cycle.cumulativeThickness * 0.005); // scale for visibility
      refs.filmMesh.scaling.y = h;
      refs.filmMesh.position.y = 0.55 + h * 0.005;
    }

    // Update pedestal glow based on temperature
    if (refs.pedestalMat) {
      const heatFactor = Math.min(1, Math.max(0, (params.pedestalTemp - 100) / 300));
      refs.pedestalMat.emissiveColor = new BABYLON.Color3(
        0.15 + heatFactor * 0.7,
        0.05 + heatFactor * 0.15,
        0.02,
      );
    }

    // Update phase label
    if (refs.phaseLabel && phase !== lastPhase) {
      lastPhase = phase;
      const ctx = refs.phaseLabel.getContext();
      ctx.clearRect(0, 0, 512, 96);
      const [r, g, b] = PHASE_COLORS[phase] ?? [0.4, 0.4, 0.4];
      ctx.fillStyle = `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
      ctx.font = 'bold 36px Fira Code, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(PHASE_LABELS[phase] ?? '', 256, 60);
      refs.phaseLabel.update();
    }

    // Update surface adsorption grid
    if (refs.coverageTexture && cycle) {
      const ctx = refs.coverageTexture.getContext();
      const gridSize = 20;
      const cellSize = 400 / gridSize;
      ctx.clearRect(0, 0, 400, 400);
      const [cr, cg, cb] = PHASE_COLORS[phase] ?? [0.4, 0.4, 0.4];
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const cx = (col - gridSize / 2 + 0.5) / (gridSize / 2);
          const cy = (row - gridSize / 2 + 0.5) / (gridSize / 2);
          const r2 = cx * cx + cy * cy;
          if (r2 > 1.0) continue; // outside wafer circle
          const coverage = phase === 'bdeas-pulse' || phase === 'purge-b' ? cycle.coverageA : cycle.coverageB;
          const localCoverage = coverage * (1 - 0.12 * r2); // edge falloff
          const intensity = Math.min(1, localCoverage);
          ctx.fillStyle = `rgba(${Math.round(cr * 255)},${Math.round(cg * 255)},${Math.round(cb * 255)},${intensity * 0.8})`;
          ctx.fillRect(col * cellSize + 1, row * cellSize + 1, cellSize - 2, cellSize - 2);
        }
      }
      refs.coverageTexture.update();
    }
  });

  const resize = () => engine.resize();
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    window.removeEventListener('resize', resize);
    window.removeEventListener('pagehide', dispose);
    engine.stopRenderLoop();
    if (!scene.isDisposed) scene.dispose();
    engine.dispose();
  };
  window.addEventListener('resize', resize);
  window.addEventListener('pagehide', dispose);
  engine.runRenderLoop(() => {
    if (!disposed && !scene.isDisposed) scene.render();
  });

  return dispose;
}

export function ReactorCrossSectionScene(props: Props) {
  const clientReady = useClientReady();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const propsRef = useRef(props);
  const webgl = useWebGLSupport();

  useEffect(() => { propsRef.current = props; }, [props]);

  useEffect(() => {
    if (!clientReady || !canvasRef.current || !webgl.supported) return undefined;
    return createReactorScene(canvasRef.current, propsRef);
  }, [clientReady, webgl.supported]);

  if (!clientReady) return <div className="flex h-full items-center justify-center bg-[var(--sf-bg-canvas)] text-sm text-[var(--sf-text-secondary)]">Initializing reactor scene...</div>;
  if (!webgl.supported) return <WebGLFallback />;

  return <canvas ref={canvasRef} data-testid="reactor-babylon-canvas" aria-label="ALD reactor cross-section with surface adsorption" className="h-full w-full touch-none outline-none" />;
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd equipment-monitor && npx tsc --noEmit 2>&1 | head -10`
Expected: Only errors about missing WaferMetricsPanel (comes in Task 12)

**Step 3: Commit**

```bash
cd equipment-monitor && git add src/components/dep-sim/ReactorCrossSectionScene.tsx
git commit -m "feat(dep-sim): Babylon.js reactor cross-section scene with particle flow and surface grid"
```

---

### Task 12: Wafer Metrics Panel (Die Map + Trend Chart)

**Files:**
- Create: `equipment-monitor/src/components/dep-sim/WaferMetricsPanel.tsx`

**Step 1: Create WaferMetricsPanel**

```typescript
// equipment-monitor/src/components/dep-sim/WaferMetricsPanel.tsx
'use client';

import { useMemo } from 'react';
import type { CycleState, WaferMetric } from '@/lib/dep-sim';
import { DIE_MASK, DIE_GRID_COLS, DIE_GRID_ROWS, IDEAL_RI } from '@/lib/dep-sim/constants';

interface Props {
  cycles: CycleState[];
  currentCycle: CycleState | null;
  metric: WaferMetric;
  onMetricChange: (m: WaferMetric) => void;
}

const METRICS: { id: WaferMetric; label: string; unit: string }[] = [
  { id: 'thickness', label: 'Thickness', unit: '\u00C5' },
  { id: 'uniformity', label: 'Uniformity', unit: '%' },
  { id: 'roughness', label: 'Roughness', unit: '\u00C5 RMS' },
  { id: 'ri', label: 'Refractive Index', unit: '' },
];

function getDieValue(cycle: CycleState, metric: WaferMetric, idx: number): number {
  if (!DIE_MASK[idx]) return NaN;
  switch (metric) {
    case 'thickness': return cycle.thicknessMap[idx];
    case 'roughness': return cycle.roughnessMap[idx];
    case 'ri': return cycle.riMap[idx];
    case 'uniformity': return cycle.uniformity;
  }
}

function metricColor(metric: WaferMetric, value: number, cycle: CycleState): string {
  if (isNaN(value)) return 'transparent';
  let t: number;
  switch (metric) {
    case 'thickness': {
      const mean = cycle.cumulativeThickness;
      const dev = mean > 0 ? Math.abs(value - mean) / mean : 0;
      t = Math.min(1, dev / 0.04); // 4% deviation = fully red
      break;
    }
    case 'roughness': {
      t = Math.min(1, value / 3.0); // 3A RMS = fully red
      break;
    }
    case 'ri': {
      t = Math.min(1, Math.abs(value - IDEAL_RI) / 0.04); // 0.04 deviation = fully red
      break;
    }
    case 'uniformity': {
      t = Math.min(1, value / 5.0); // 5% = fully red
      break;
    }
  }
  const r = Math.round(34 + t * 221);
  const g = Math.round(197 - t * 150);
  const b = Math.round(94 - t * 50);
  return `rgb(${r},${g},${b})`;
}

function getTrendValue(cycle: CycleState, metric: WaferMetric): number {
  switch (metric) {
    case 'thickness': return cycle.cumulativeThickness;
    case 'uniformity': return cycle.uniformity;
    case 'roughness': {
      const active = cycle.roughnessMap.filter((_, i) => DIE_MASK[i]);
      return active.reduce((s, v) => s + v, 0) / active.length;
    }
    case 'ri': {
      const active = cycle.riMap.filter((_, i) => DIE_MASK[i]);
      return active.reduce((s, v) => s + v, 0) / active.length;
    }
  }
}

export function WaferMetricsPanel({ cycles, currentCycle, metric, onMetricChange }: Props) {
  const trendData = useMemo(() => cycles.map((c) => getTrendValue(c, metric)), [cycles, metric]);

  const trendPath = useMemo(() => {
    if (trendData.length < 2) return '';
    const min = Math.min(...trendData);
    const max = Math.max(...trendData);
    const range = max - min || 1;
    const w = 300;
    const h = 60;
    return trendData.map((v, i) => {
      const x = (i / (trendData.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }, [trendData]);

  return (
    <div className="flex h-full flex-col bg-[var(--sf-bg-canvas)] p-3">
      {/* Metric toggle */}
      <div className="flex flex-wrap gap-1 mb-3">
        {METRICS.map((m) => (
          <button key={m.id} type="button" onClick={() => onMetricChange(m.id)}
            className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors"
            style={{
              borderColor: metric === m.id ? '#3b82f6' : 'rgba(255,255,255,0.15)',
              color: metric === m.id ? '#3b82f6' : 'var(--sf-text-secondary)',
              backgroundColor: metric === m.id ? 'rgba(59,130,246,0.12)' : 'transparent',
            }}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Wafer die map */}
      <div className="flex-1 flex items-center justify-center">
        {currentCycle ? (
          <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${DIE_GRID_COLS}, 1fr)`, width: 'min(100%, 280px)', aspectRatio: '1' }}>
            {Array.from({ length: DIE_GRID_COLS * DIE_GRID_ROWS }, (_, idx) => {
              const value = getDieValue(currentCycle, metric, idx);
              const color = metricColor(metric, value, currentCycle);
              return (
                <div key={idx} className="rounded-sm" style={{ backgroundColor: color, aspectRatio: '1' }}
                  title={isNaN(value) ? '' : `${value.toFixed(3)}`} />
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[var(--sf-text-muted)]">Run simulation to see wafer map</p>
        )}
      </div>

      {/* Trend sparkline */}
      <div className="mt-3 border-t border-white/10 pt-3">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[var(--sf-text-muted)] mb-1">
          <span>{METRICS.find((m) => m.id === metric)?.label} Trend</span>
          {currentCycle && <span className="font-mono text-[var(--sf-text-secondary)]">{getTrendValue(currentCycle, metric).toFixed(3)} {METRICS.find((m) => m.id === metric)?.unit}</span>}
        </div>
        <svg viewBox="0 0 300 60" className="w-full h-[60px]" preserveAspectRatio="none">
          {trendPath && <path d={trendPath} fill="none" stroke="#3b82f6" strokeWidth="1.5" />}
        </svg>
      </div>
    </div>
  );
}
```

**Step 2: Verify full TypeScript compiles**

Run: `cd equipment-monitor && npx tsc --noEmit`
Expected: No errors

**Step 3: Run all dep-sim tests**

Run: `cd equipment-monitor && npx jest src/lib/dep-sim/ --no-coverage`
Expected: All ~33 tests PASS

**Step 4: Commit**

```bash
cd equipment-monitor && git add src/components/dep-sim/WaferMetricsPanel.tsx
git commit -m "feat(dep-sim): wafer metrics panel with die map, trend chart, and metric toggles"
```

---

### Task 13: Build Verification + Final Commit

**Files:** None new — verification only.

**Step 1: Run all dep-sim tests**

Run: `cd equipment-monitor && npx jest src/lib/dep-sim/ --no-coverage --verbose`
Expected: All tests PASS

**Step 2: Run full test suite (ensure no regressions)**

Run: `cd equipment-monitor && npx jest --no-coverage 2>&1 | tail -20`
Expected: No new failures

**Step 3: TypeScript check**

Run: `cd equipment-monitor && npx tsc --noEmit`
Expected: No errors

**Step 4: Next.js build**

Run: `cd equipment-monitor && npm run build 2>&1 | tail -30`
Expected: Build succeeds, new routes appear in output:
- `/mes/fab-floor/deposition/reactor-sim`

**Step 5: Verify file count**

Run: `find equipment-monitor/src/lib/dep-sim -type f | wc -l`
Expected: 16 files (7 source + 7 test + types.ts + constants.ts... total around 16)

Run: `find equipment-monitor/src/components/dep-sim -type f | wc -l`
Expected: 4 files (TimelineBar, ParameterPanel, ReactorCrossSectionScene, WaferMetricsPanel)

---

## Task Dependency Graph

```
Task 1 (types + constants) ──┬── Task 2 (langmuir) ───────┐
                              ├── Task 3 (thermal) ────────┤
                              └── Task 4 (reactor-flow) ───┤
                                                           ├── Task 5 (growth-model)
                                                           │         │
                                                           └─────────┴── Task 6 (wafer-metrics)
                                                                                │
                                                                      Task 7 (engine + presets + index)
                                                                                │
                                                           ┌────────────────────┤
                                                           │                    │
                                                     Task 8 (routes + HUD)  Task 10 (page + timeline + params)
                                                           │                    │
                                                     Task 9 (scene badges)  Task 11 (Babylon.js scene)
                                                                                │
                                                                          Task 12 (wafer metrics panel)
                                                                                │
                                                                          Task 13 (build verification)
```

**Parallelizable groups:**
- Tasks 2, 3, 4 (independent physics modules — BUT share no files, safe to parallel)
- Tasks 8+9 (entry points) can run parallel with Tasks 10+11+12 (UI layer) after Task 7

**Sequential dependencies:**
- Task 5 depends on Tasks 2, 3, 4
- Task 6 depends on Task 5
- Task 7 depends on Task 6
- Task 13 depends on all prior tasks
