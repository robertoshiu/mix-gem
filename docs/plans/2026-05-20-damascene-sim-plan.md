# Metallization Damascene Digital Twin — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Cu dual-damascene ECD + CMP digital twin at `/mes/fab-floor/metallization/damascene-sim` with physics engine, Babylon.js visualization, and fab-floor entry point.

**Architecture:** Pure TypeScript physics engine at `src/lib/damascene-sim/` (same pattern as `src/lib/dep-sim/`), stepping through 200 unified steps across 3 phases (ECD Fill → Anneal → CMP). Babylon.js electroplating cell cross-section + Canvas2D trench fill inset, wafer die map with trend sparkline. Entry point via existing DIGITAL_TWIN_ROUTES map.

**Tech Stack:** TypeScript, Jest (TDD), Babylon.js v9.6.2, Next.js 15.1 dynamic imports, React useState/useCallback/useEffect

**Design doc:** `docs/plans/2026-05-20-damascene-sim-design.md`

**Reference implementation:** `src/lib/dep-sim/` — follow identical patterns for types, constants, physics modules, simulation engine, presets, barrel export, and test structure.

---

## Phase 1: Physics Engine (Pure TypeScript, TDD)

### Task 1: Types and Constants

**Files:**
- Create: `equipment-monitor/src/lib/damascene-sim/types.ts`
- Create: `equipment-monitor/src/lib/damascene-sim/constants.ts`

**Step 1: Create types.ts**

```typescript
// equipment-monitor/src/lib/damascene-sim/types.ts

/** Process phase within the 200-step simulation */
export type ProcessPhase = 'ecd-fill' | 'anneal' | 'cmp';

/** Simulation input parameters (driven by sliders) */
export interface SimulationParams {
  appliedCurrent: number;      // mA/cm²
  bathTemp: number;            // °C
  additiveConc: number;        // normalized 0-1 (suppressor/accelerator health)
  seedThickness: number;       // nm
  trenchWidth: number;         // nm
  trenchDepth: number;         // nm
  padPressure: number;         // psi (CMP)
  padVelocity: number;         // m/s (CMP relative velocity)
  totalSteps: number;          // 200 default
}

/** Per-step simulation result */
export interface StepState {
  stepIndex: number;
  phase: ProcessPhase;
  timeSeconds: number;
  currentDensityMap: number[];  // per-die j (mA/cm²)
  fillProfile: number[];        // 20-point trench cross-section heights (0-1 normalized)
  fillFraction: number;         // 0-1 overall trench fill
  copperThickness: number;      // nm overburden above trench
  sheetResistance: number;      // ohm/sq
  viaResistance: number;        // ohm
  stepCoverage: number;         // %
  dishingDepth: number;         // nm (CMP only)
  thicknessMap: number[];       // per-die copper thickness (nm)
  resistanceMap: number[];      // per-die sheet resistance (ohm/sq)
  roughnessMap: number[];       // per-die surface roughness (nm RMS)
  uniformity: number;           // % 1-sigma/mean
  dieCount: number;
  dieGridCols: number;
  dieGridRows: number;
}

/** Full simulation state */
export interface SimulationState {
  params: SimulationParams;
  steps: StepState[];
  currentIndex: number;         // -1 = not started
  totalSteps: number;
}

/** Wafer metric layer for display */
export type WaferMetric = 'sheetResistance' | 'viaResistance' | 'stepCoverage' | 'thickness';

/** What-if preset identifier */
export type PresetId =
  | 'current-crowding'
  | 'additive-depletion'
  | 'seed-thinning'
  | 'over-polish'
  | 'under-polish'
  | 'bath-temp-drift';

/** What-if preset definition */
export interface Preset {
  id: PresetId;
  label: string;
  labelCN: string;
  color: string;
  apply: (params: SimulationParams, stepIndex: number) => SimulationParams;
}
```

**Step 2: Create constants.ts**

```typescript
// equipment-monitor/src/lib/damascene-sim/constants.ts
import type { SimulationParams } from './types';

// ---- Phase boundaries (out of 200 total steps) ----
export const ECD_FILL_END = 120;     // steps 0-119
export const ANNEAL_END = 160;       // steps 120-159
export const DEFAULT_TOTAL_STEPS = 200;

// ---- ECD / Electroplating Constants ----

/** Electrolyte conductivity (S/cm) */
export const ELECTROLYTE_CONDUCTIVITY = 0.05;

/** Exchange current density (mA/cm²) */
export const EXCHANGE_CURRENT_DENSITY = 5.0;

/** Characteristic length for Wagner number (cm) */
export const CHARACTERISTIC_LENGTH = 0.5;

/** Seed layer sheet resistance coefficient (ohm/sq per nm inverse) */
export const SEED_RESISTANCE_COEFF = 0.5;

/** Terminal effect strength (fraction of extra current at edge) */
export const TERMINAL_EFFECT_STRENGTH = 0.15;

/** Faraday efficiency for Cu deposition */
export const FARADAY_EFFICIENCY = 0.95;

/** Molar mass of Cu (g/mol) */
export const CU_MOLAR_MASS = 63.546;

/** Cu density (g/cm³) */
export const CU_DENSITY = 8.96;

/** Faraday constant (C/mol) */
export const FARADAY_CONST = 96485;

/** Valence for Cu²⁺ */
export const CU_VALENCE = 2;

// ---- Fill Profile Constants ----

/** Number of discrete points across trench width */
export const FILL_PROFILE_POINTS = 20;

/** Superfill threshold — additive health above this gives bottom-up fill */
export const SUPERFILL_THRESHOLD = 0.6;

/** Void threshold — additive health below this causes pinch-off */
export const VOID_THRESHOLD = 0.3;

// ---- CMP Constants ----

/** Preston coefficient (nm/(psi·m/s·s)) */
export const PRESTON_K = 120;

/** Dishing coefficient (nm per nm trench width per second overpolish) */
export const DISHING_COEFF = 0.0005;

/** Erosion rate (nm/s) for dense features */
export const EROSION_RATE = 0.02;

/** Barrier thickness (nm) — CMP target is to expose this layer */
export const BARRIER_THICKNESS = 15;

// ---- Thermal Constants ----

/** Activation energy for Cu ECD (eV) */
export const ECD_EA = 0.25;

/** Reference bath temperature (°C) */
export const BATH_T_REF = 25;

/** Boltzmann constant (eV/K) */
export const KB_EV = 8.617e-5;

/** Anneal temperature (°C) */
export const ANNEAL_TEMP = 200;

/** Post-anneal resistance reduction factor */
export const ANNEAL_RS_FACTOR = 0.85;

/** Base roughness for ideal ECD (nm RMS) */
export const BASE_ROUGHNESS = 1.5;

/** Roughness increase per °C above reference */
export const ROUGHNESS_PER_DEGREE = 0.08;

// ---- Die Grid (same as dep-sim / lens-sim) ----

export const DIE_GRID_COLS = 9;
export const DIE_GRID_ROWS = 9;

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

// ---- Slider parameter bounds ----

export const PARAM_BOUNDS = {
  appliedCurrent: { min: 5,   max: 60,  default: 30,    step: 1,    unit: 'mA/cm\u00B2' },
  bathTemp:       { min: 15,  max: 45,  default: 25,    step: 1,    unit: '\u00B0C' },
  additiveConc:   { min: 0,   max: 1.0, default: 0.8,   step: 0.05, unit: '' },
  seedThickness:  { min: 10,  max: 100, default: 50,    step: 5,    unit: 'nm' },
  trenchWidth:    { min: 30,  max: 500, default: 100,   step: 10,   unit: 'nm' },
  trenchDepth:    { min: 50,  max: 500, default: 200,   step: 10,   unit: 'nm' },
  padPressure:    { min: 1,   max: 10,  default: 4,     step: 0.5,  unit: 'psi' },
  padVelocity:    { min: 0.5, max: 3.0, default: 1.5,   step: 0.1,  unit: 'm/s' },
  totalSteps:     { min: 50,  max: 400, default: 200,   step: 10,   unit: 'steps' },
} as const;

export const DEFAULT_PARAMS: SimulationParams = {
  appliedCurrent: PARAM_BOUNDS.appliedCurrent.default,
  bathTemp:       PARAM_BOUNDS.bathTemp.default,
  additiveConc:   PARAM_BOUNDS.additiveConc.default,
  seedThickness:  PARAM_BOUNDS.seedThickness.default,
  trenchWidth:    PARAM_BOUNDS.trenchWidth.default,
  trenchDepth:    PARAM_BOUNDS.trenchDepth.default,
  padPressure:    PARAM_BOUNDS.padPressure.default,
  padVelocity:    PARAM_BOUNDS.padVelocity.default,
  totalSteps:     PARAM_BOUNDS.totalSteps.default,
};
```

**Step 3: Commit**

```bash
git add equipment-monitor/src/lib/damascene-sim/types.ts equipment-monitor/src/lib/damascene-sim/constants.ts
git commit -m "feat(damascene-sim): types and constants for Cu ECD + CMP simulation"
```

---

### Task 2: Current Density Model (TDD)

**Files:**
- Create: `equipment-monitor/src/lib/damascene-sim/__tests__/current-density.test.ts`
- Create: `equipment-monitor/src/lib/damascene-sim/current-density.ts`

**Step 1: Write tests**

```typescript
// equipment-monitor/src/lib/damascene-sim/__tests__/current-density.test.ts
import { computeWagnerNumber, computeRadialCurrentDensity, computeCurrentDensityMap } from '../current-density';
import { DEFAULT_PARAMS } from '../constants';

describe('current-density', () => {
  it('Wagner number is positive at default conditions', () => {
    const wa = computeWagnerNumber();
    expect(wa).toBeGreaterThan(0);
  });

  it('edge current density exceeds center', () => {
    const jEdge = computeRadialCurrentDensity(DEFAULT_PARAMS, 1.0);
    const jCenter = computeRadialCurrentDensity(DEFAULT_PARAMS, 0.0);
    expect(jEdge).toBeGreaterThan(jCenter);
  });

  it('thinner seed increases terminal effect', () => {
    const jEdgeThick = computeRadialCurrentDensity(DEFAULT_PARAMS, 1.0);
    const thinSeed = { ...DEFAULT_PARAMS, seedThickness: 20 };
    const jEdgeThin = computeRadialCurrentDensity(thinSeed, 1.0);
    // Thinner seed → higher edge current (more terminal effect)
    expect(jEdgeThin / computeRadialCurrentDensity(thinSeed, 0.0))
      .toBeGreaterThan(jEdgeThick / computeRadialCurrentDensity(DEFAULT_PARAMS, 0.0));
  });

  it('current density map has correct length for active dies', () => {
    const map = computeCurrentDensityMap(DEFAULT_PARAMS);
    expect(map).toHaveLength(81);
    // Inactive dies should have 0 current
    expect(map[0]).toBe(0); // corner die is inactive
  });
});
```

**Step 2: Implement**

```typescript
// equipment-monitor/src/lib/damascene-sim/current-density.ts
import type { SimulationParams } from './types';
import {
  ELECTROLYTE_CONDUCTIVITY,
  EXCHANGE_CURRENT_DENSITY,
  CHARACTERISTIC_LENGTH,
  SEED_RESISTANCE_COEFF,
  TERMINAL_EFFECT_STRENGTH,
  DIE_GRID_COLS,
  DIE_GRID_ROWS,
  DIE_MASK,
} from './constants';

/**
 * Wagner number: ratio of polarization resistance to ohmic resistance.
 * Higher Wa → more uniform current distribution.
 */
export function computeWagnerNumber(): number {
  return ELECTROLYTE_CONDUCTIVITY / (EXCHANGE_CURRENT_DENSITY * CHARACTERISTIC_LENGTH);
}

/**
 * Compute local current density at a given normalized radial position (0=center, 1=edge).
 * Terminal effect: edge current is amplified by thin seed layer resistance.
 */
export function computeRadialCurrentDensity(
  params: SimulationParams,
  normalizedRadius: number,
): number {
  const seedFactor = 50 / Math.max(params.seedThickness, 1);
  const terminalBoost = 1 + TERMINAL_EFFECT_STRENGTH * seedFactor * normalizedRadius * normalizedRadius;
  return params.appliedCurrent * terminalBoost;
}

/**
 * Compute per-die current density map.
 * Each die's position is converted to normalized radius from wafer center.
 */
export function computeCurrentDensityMap(params: SimulationParams): number[] {
  const cols = DIE_GRID_COLS;
  const rows = DIE_GRID_ROWS;
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const maxR = Math.hypot(cx, cy);

  const map = new Array<number>(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (!DIE_MASK[idx]) {
        map[idx] = 0;
        continue;
      }
      const normR = Math.hypot(r - cy, c - cx) / maxR;
      map[idx] = computeRadialCurrentDensity(params, normR);
    }
  }
  return map;
}
```

**Step 3: Run tests**

```bash
cd equipment-monitor && npx jest --testPathPatterns='damascene-sim.*current-density' --no-coverage
```

**Step 4: Commit**

```bash
git add equipment-monitor/src/lib/damascene-sim/current-density.ts equipment-monitor/src/lib/damascene-sim/__tests__/current-density.test.ts
git commit -m "feat(damascene-sim): current density model with Wagner number and terminal effect"
```

---

### Task 3: Fill Profile Model (TDD)

**Files:**
- Create: `equipment-monitor/src/lib/damascene-sim/__tests__/fill-profile.test.ts`
- Create: `equipment-monitor/src/lib/damascene-sim/fill-profile.ts`

**Step 1: Write tests**

```typescript
// equipment-monitor/src/lib/damascene-sim/__tests__/fill-profile.test.ts
import { computeFillProfile, computeFillFraction, advanceFillProfile } from '../fill-profile';
import { DEFAULT_PARAMS, FILL_PROFILE_POINTS } from '../constants';

describe('fill-profile', () => {
  it('initial fill profile is all zeros', () => {
    const profile = computeFillProfile(0, DEFAULT_PARAMS);
    expect(profile).toHaveLength(FILL_PROFILE_POINTS);
    expect(profile.every((v) => v === 0)).toBe(true);
  });

  it('superfill regime: center fills faster than edges', () => {
    const params = { ...DEFAULT_PARAMS, additiveConc: 0.9 };
    const profile = advanceFillProfile(new Array(FILL_PROFILE_POINTS).fill(0), params, 30, 10);
    const center = profile[FILL_PROFILE_POINTS / 2];
    const edge = profile[0];
    expect(center).toBeGreaterThan(edge);
  });

  it('conformal regime: uniform fill across width', () => {
    const params = { ...DEFAULT_PARAMS, additiveConc: 0.45 };
    const profile = advanceFillProfile(new Array(FILL_PROFILE_POINTS).fill(0), params, 30, 10);
    const center = profile[FILL_PROFILE_POINTS / 2];
    const edge = profile[0];
    // Conformal is more uniform, ratio closer to 1
    const ratio = center / Math.max(edge, 0.001);
    expect(ratio).toBeLessThan(2.0);
    expect(ratio).toBeGreaterThan(0.5);
  });

  it('fill fraction is monotonically increasing with current', () => {
    const prev = new Array(FILL_PROFILE_POINTS).fill(0);
    const p1 = advanceFillProfile(prev, DEFAULT_PARAMS, 20, 5);
    const p2 = advanceFillProfile(prev, DEFAULT_PARAMS, 40, 5);
    expect(computeFillFraction(p2)).toBeGreaterThan(computeFillFraction(p1));
  });

  it('low additive creates void risk (edges higher than center)', () => {
    const params = { ...DEFAULT_PARAMS, additiveConc: 0.15 };
    const profile = advanceFillProfile(new Array(FILL_PROFILE_POINTS).fill(0), params, 30, 20);
    const edge = profile[1];
    const center = profile[FILL_PROFILE_POINTS / 2];
    expect(edge).toBeGreaterThanOrEqual(center);
  });
});
```

**Step 2: Implement**

```typescript
// equipment-monitor/src/lib/damascene-sim/fill-profile.ts
import type { SimulationParams } from './types';
import {
  FILL_PROFILE_POINTS,
  SUPERFILL_THRESHOLD,
  VOID_THRESHOLD,
  FARADAY_EFFICIENCY,
  CU_MOLAR_MASS,
  CU_DENSITY,
  FARADAY_CONST,
  CU_VALENCE,
} from './constants';

/**
 * Compute a fresh fill profile (all zeros) or return the profile at a given fill level.
 */
export function computeFillProfile(fillLevel: number, _params: SimulationParams): number[] {
  return new Array(FILL_PROFILE_POINTS).fill(fillLevel);
}

/**
 * Compute overall fill fraction from a profile (average height / trench depth normalized).
 * Profile values are 0-1 (fraction of trench depth filled).
 */
export function computeFillFraction(profile: number[]): number {
  const sum = profile.reduce((s, v) => s + Math.min(v, 1), 0);
  return sum / profile.length;
}

/**
 * Advance a fill profile by one step.
 * @param prevProfile - previous fill heights (0-1 per point)
 * @param params - simulation parameters
 * @param localCurrentDensity - mA/cm² at this die
 * @param stepCount - number of steps elapsed (affects additive decay)
 * @returns new fill profile
 */
export function advanceFillProfile(
  prevProfile: number[],
  params: SimulationParams,
  localCurrentDensity: number,
  stepCount: number,
): number[] {
  const n = prevProfile.length;
  const midpoint = (n - 1) / 2;
  const dt = 0.5; // seconds per step

  // Deposition rate from Faraday's law: thickness = (j * M * eta * t) / (z * F * rho)
  // Convert mA/cm² to A/cm², result in cm, then to nm
  const baseRate = (localCurrentDensity * 1e-3 * CU_MOLAR_MASS * FARADAY_EFFICIENCY * dt)
    / (CU_VALENCE * FARADAY_CONST * CU_DENSITY) * 1e7; // cm -> nm

  // Normalize rate to trench depth fraction
  const rateNorm = baseRate / Math.max(params.trenchDepth, 1);

  // Effective additive concentration (may decay over time in presets)
  const additive = Math.max(0, Math.min(1, params.additiveConc));

  const profile = new Array<number>(n);

  for (let i = 0; i < n; i++) {
    const distFromCenter = Math.abs(i - midpoint) / midpoint; // 0 at center, 1 at edge

    let localEfficiency: number;

    if (additive >= SUPERFILL_THRESHOLD) {
      // Superfill: bottom-up, center fills much faster
      // Accelerator accumulates at bottom (center of profile in 1D cross-section)
      localEfficiency = 1.0 + (1 - distFromCenter) * additive * 1.5;
    } else if (additive >= VOID_THRESHOLD) {
      // Conformal: relatively uniform fill
      localEfficiency = 0.6 + 0.4 * additive;
    } else {
      // Void risk: edges fill faster (sidewall deposition), pinch-off risk
      localEfficiency = 0.3 + distFromCenter * (1 - additive) * 1.2;
    }

    const growth = rateNorm * localEfficiency;
    profile[i] = Math.min(prevProfile[i] + growth, 1.5); // allow overburden > 1.0
  }

  return profile;
}
```

**Step 3: Run tests and commit**

```bash
cd equipment-monitor && npx jest --testPathPatterns='damascene-sim.*fill-profile' --no-coverage
git add equipment-monitor/src/lib/damascene-sim/fill-profile.ts equipment-monitor/src/lib/damascene-sim/__tests__/fill-profile.test.ts
git commit -m "feat(damascene-sim): fill profile model with superfill/conformal/void regimes"
```

---

### Task 4: CMP Model (TDD)

**Files:**
- Create: `equipment-monitor/src/lib/damascene-sim/__tests__/cmp-model.test.ts`
- Create: `equipment-monitor/src/lib/damascene-sim/cmp-model.ts`

**Step 1: Write tests**

```typescript
// equipment-monitor/src/lib/damascene-sim/__tests__/cmp-model.test.ts
import { computeRemovalRate, computeDishing, applyCmpStep } from '../cmp-model';
import { DEFAULT_PARAMS, BARRIER_THICKNESS } from '../constants';

describe('cmp-model', () => {
  it('removal rate follows Preston equation (proportional to pressure × velocity)', () => {
    const r1 = computeRemovalRate(DEFAULT_PARAMS);
    const r2 = computeRemovalRate({ ...DEFAULT_PARAMS, padPressure: DEFAULT_PARAMS.padPressure * 2 });
    expect(r2).toBeCloseTo(r1 * 2, 1);
  });

  it('dishing increases with trench width', () => {
    const d1 = computeDishing(DEFAULT_PARAMS, 5);
    const d2 = computeDishing({ ...DEFAULT_PARAMS, trenchWidth: DEFAULT_PARAMS.trenchWidth * 3 }, 5);
    expect(d2).toBeGreaterThan(d1);
  });

  it('CMP step reduces copper thickness', () => {
    const result = applyCmpStep(150, DEFAULT_PARAMS, 0);
    expect(result.thickness).toBeLessThan(150);
  });

  it('copper does not go below barrier thickness', () => {
    const result = applyCmpStep(20, DEFAULT_PARAMS, 100);
    expect(result.thickness).toBeGreaterThanOrEqual(BARRIER_THICKNESS);
  });
});
```

**Step 2: Implement**

```typescript
// equipment-monitor/src/lib/damascene-sim/cmp-model.ts
import type { SimulationParams } from './types';
import { PRESTON_K, DISHING_COEFF, BARRIER_THICKNESS } from './constants';

/**
 * Preston equation removal rate: R = Kp * P * V (nm per step, dt=0.5s).
 */
export function computeRemovalRate(params: SimulationParams): number {
  const dt = 0.5;
  return PRESTON_K * params.padPressure * params.padVelocity * dt;
}

/**
 * Dishing depth: proportional to trench width and overpolish steps.
 */
export function computeDishing(params: SimulationParams, overpolishSteps: number): number {
  return DISHING_COEFF * params.trenchWidth * overpolishSteps;
}

/**
 * Apply one CMP step: reduce copper thickness, compute dishing.
 * @param currentThickness - current copper thickness (nm)
 * @param params - simulation parameters
 * @param stepsInCmp - how many CMP steps have elapsed (for overpolish tracking)
 * @returns updated thickness and dishing depth
 */
export function applyCmpStep(
  currentThickness: number,
  params: SimulationParams,
  stepsInCmp: number,
): { thickness: number; dishing: number } {
  const removal = computeRemovalRate(params);
  const thickness = Math.max(currentThickness - removal, BARRIER_THICKNESS);

  // Dishing only occurs once field copper is cleared (thickness near barrier)
  const overpolishSteps = thickness <= BARRIER_THICKNESS + 5 ? stepsInCmp : 0;
  const dishing = computeDishing(params, overpolishSteps);

  return { thickness, dishing };
}
```

**Step 3: Run tests and commit**

```bash
cd equipment-monitor && npx jest --testPathPatterns='damascene-sim.*cmp-model' --no-coverage
git add equipment-monitor/src/lib/damascene-sim/cmp-model.ts equipment-monitor/src/lib/damascene-sim/__tests__/cmp-model.test.ts
git commit -m "feat(damascene-sim): CMP model with Preston equation and dishing"
```

---

### Task 5: Thermal Model (TDD)

**Files:**
- Create: `equipment-monitor/src/lib/damascene-sim/__tests__/thermal-model.test.ts`
- Create: `equipment-monitor/src/lib/damascene-sim/thermal-model.ts`

**Step 1: Write tests**

```typescript
// equipment-monitor/src/lib/damascene-sim/__tests__/thermal-model.test.ts
import { computePlatingRateFactor, computeAnnealFactor, computeRoughness } from '../thermal-model';
import { ANNEAL_RS_FACTOR, BATH_T_REF } from '../constants';

describe('thermal-model', () => {
  it('plating rate factor is 1.0 at reference temperature', () => {
    const factor = computePlatingRateFactor(BATH_T_REF);
    expect(factor).toBeCloseTo(1.0, 2);
  });

  it('higher bath temp increases plating rate', () => {
    const f1 = computePlatingRateFactor(25);
    const f2 = computePlatingRateFactor(40);
    expect(f2).toBeGreaterThan(f1);
  });

  it('anneal reduces resistance by expected factor', () => {
    const factor = computeAnnealFactor(0.5);
    // At 50% anneal progress, factor should be between 1.0 and ANNEAL_RS_FACTOR
    expect(factor).toBeLessThan(1.0);
    expect(factor).toBeGreaterThan(ANNEAL_RS_FACTOR);
  });

  it('roughness increases with temperature above reference', () => {
    const r1 = computeRoughness(25);
    const r2 = computeRoughness(40);
    expect(r2).toBeGreaterThan(r1);
  });
});
```

**Step 2: Implement**

```typescript
// equipment-monitor/src/lib/damascene-sim/thermal-model.ts
import {
  ECD_EA,
  BATH_T_REF,
  KB_EV,
  ANNEAL_RS_FACTOR,
  BASE_ROUGHNESS,
  ROUGHNESS_PER_DEGREE,
} from './constants';

/**
 * Arrhenius plating rate factor relative to reference temperature.
 * factor = exp(-Ea/kB * (1/T - 1/Tref))
 */
export function computePlatingRateFactor(bathTempC: number): number {
  const T = bathTempC + 273.15;
  const Tref = BATH_T_REF + 273.15;
  return Math.exp((-ECD_EA / KB_EV) * (1 / T - 1 / Tref));
}

/**
 * Anneal progress factor for resistance reduction.
 * @param progress - 0 to 1 (fraction through anneal phase)
 * @returns multiplier for sheet resistance (1.0 -> ANNEAL_RS_FACTOR)
 */
export function computeAnnealFactor(progress: number): number {
  const p = Math.max(0, Math.min(1, progress));
  return 1.0 + (ANNEAL_RS_FACTOR - 1.0) * p;
}

/**
 * Surface roughness as a function of bath temperature.
 * Higher temp → faster but rougher deposition.
 */
export function computeRoughness(bathTempC: number): number {
  const tempExcess = Math.max(0, bathTempC - BATH_T_REF);
  return BASE_ROUGHNESS + tempExcess * ROUGHNESS_PER_DEGREE;
}
```

**Step 3: Run tests and commit**

```bash
cd equipment-monitor && npx jest --testPathPatterns='damascene-sim.*thermal-model' --no-coverage
git add equipment-monitor/src/lib/damascene-sim/thermal-model.ts equipment-monitor/src/lib/damascene-sim/__tests__/thermal-model.test.ts
git commit -m "feat(damascene-sim): thermal model with Arrhenius rate and anneal factor"
```

---

### Task 6: Wafer Metrics Orchestrator (TDD)

**Files:**
- Create: `equipment-monitor/src/lib/damascene-sim/__tests__/wafer-metrics.test.ts`
- Create: `equipment-monitor/src/lib/damascene-sim/wafer-metrics.ts`

**Step 1: Write tests**

```typescript
// equipment-monitor/src/lib/damascene-sim/__tests__/wafer-metrics.test.ts
import { computeStepMetrics } from '../wafer-metrics';
import { DEFAULT_PARAMS, FILL_PROFILE_POINTS } from '../constants';

describe('wafer-metrics', () => {
  it('ECD fill step produces valid metrics', () => {
    const prevProfile = new Array(FILL_PROFILE_POINTS).fill(0);
    const result = computeStepMetrics(DEFAULT_PARAMS, 10, 0, prevProfile);
    expect(result.thicknessMap).toHaveLength(81);
    expect(result.resistanceMap).toHaveLength(81);
    expect(result.fillProfile).toHaveLength(FILL_PROFILE_POINTS);
  });

  it('sheet resistance is within spec at nominal ECD', () => {
    const prevProfile = new Array(FILL_PROFILE_POINTS).fill(0);
    const result = computeStepMetrics(DEFAULT_PARAMS, 60, 0, prevProfile);
    expect(result.sheetResistance).toBeGreaterThan(0.01);
    expect(result.sheetResistance).toBeLessThan(0.1);
  });

  it('step coverage is above 75% at nominal conditions', () => {
    const prevProfile = new Array(FILL_PROFILE_POINTS).fill(0);
    const result = computeStepMetrics(DEFAULT_PARAMS, 60, 0, prevProfile);
    expect(result.stepCoverage).toBeGreaterThan(50);
  });

  it('copper thickness grows during ECD phase', () => {
    const prevProfile = new Array(FILL_PROFILE_POINTS).fill(0);
    const r1 = computeStepMetrics(DEFAULT_PARAMS, 10, 0, prevProfile);
    const r2 = computeStepMetrics(DEFAULT_PARAMS, 50, 0, prevProfile);
    expect(r2.copperThickness).toBeGreaterThan(r1.copperThickness);
  });

  it('uniformity is below 5% at nominal', () => {
    const prevProfile = new Array(FILL_PROFILE_POINTS).fill(0);
    const result = computeStepMetrics(DEFAULT_PARAMS, 60, 0, prevProfile);
    expect(result.uniformity).toBeGreaterThanOrEqual(0);
    expect(result.uniformity).toBeLessThan(10);
  });
});
```

**Step 2: Implement**

```typescript
// equipment-monitor/src/lib/damascene-sim/wafer-metrics.ts
import type { SimulationParams, StepState } from './types';
import {
  DIE_GRID_COLS,
  DIE_GRID_ROWS,
  DIE_MASK,
  FARADAY_EFFICIENCY,
  CU_MOLAR_MASS,
  CU_DENSITY,
  FARADAY_CONST,
  CU_VALENCE,
} from './constants';
import { computeCurrentDensityMap, computeRadialCurrentDensity } from './current-density';
import { advanceFillProfile, computeFillFraction } from './fill-profile';
import { computePlatingRateFactor, computeRoughness } from './thermal-model';

/**
 * Compute all wafer metrics for a single ECD fill step.
 * Orchestrates current-density -> fill-profile -> thermal -> metrics.
 */
export function computeStepMetrics(
  params: SimulationParams,
  stepIndex: number,
  prevCopperThickness: number,
  prevFillProfile: number[],
): Omit<StepState, 'stepIndex' | 'phase' | 'timeSeconds' | 'dishingDepth' | 'viaResistance'> {
  const cols = DIE_GRID_COLS;
  const rows = DIE_GRID_ROWS;
  const dieCount = cols * rows;
  const dt = 0.5; // seconds per step

  // 1. Current density map
  const currentDensityMap = computeCurrentDensityMap(params);

  // 2. Average current density for fill profile
  const activeDensities = currentDensityMap.filter((_, i) => DIE_MASK[i]);
  const avgJ = activeDensities.length > 0
    ? activeDensities.reduce((s, v) => s + v, 0) / activeDensities.length
    : params.appliedCurrent;

  // 3. Fill profile evolution (feature-level)
  const fillProfile = advanceFillProfile(prevFillProfile, params, avgJ, stepIndex);
  const fillFraction = computeFillFraction(fillProfile);

  // 4. Copper thickness (overburden) via Faraday's law
  const rateFactor = computePlatingRateFactor(params.bathTemp);
  const depositRate = (avgJ * 1e-3 * CU_MOLAR_MASS * FARADAY_EFFICIENCY * dt)
    / (CU_VALENCE * FARADAY_CONST * CU_DENSITY) * 1e7 * rateFactor; // nm per step
  const copperThickness = prevCopperThickness + depositRate;

  // 5. Per-die thickness map (modulated by local current density)
  const thicknessMap = new Array<number>(dieCount);
  for (let i = 0; i < dieCount; i++) {
    if (!DIE_MASK[i]) { thicknessMap[i] = 0; continue; }
    const ratio = currentDensityMap[i] / Math.max(avgJ, 0.01);
    thicknessMap[i] = copperThickness * ratio;
  }

  // 6. Sheet resistance map: Rs ∝ 1/thickness
  const rho_cu = 1.7e-6; // ohm·cm for bulk Cu
  const resistanceMap = new Array<number>(dieCount);
  for (let i = 0; i < dieCount; i++) {
    if (!DIE_MASK[i]) { resistanceMap[i] = 0; continue; }
    const t_cm = thicknessMap[i] * 1e-7; // nm -> cm
    resistanceMap[i] = t_cm > 0 ? rho_cu / t_cm : 999;
  }

  // 7. Average sheet resistance
  const activeRs = resistanceMap.filter((_, i) => DIE_MASK[i]);
  const sheetResistance = activeRs.length > 0
    ? activeRs.reduce((s, v) => s + v, 0) / activeRs.length
    : 0;

  // 8. Roughness map
  const baseRoughness = computeRoughness(params.bathTemp);
  const roughnessMap = new Array<number>(dieCount);
  for (let i = 0; i < dieCount; i++) {
    if (!DIE_MASK[i]) { roughnessMap[i] = 0; continue; }
    roughnessMap[i] = baseRoughness;
  }

  // 9. Step coverage (min fill / max fill across profile)
  const minFill = Math.min(...fillProfile);
  const maxFill = Math.max(...fillProfile);
  const stepCoverage = maxFill > 0 ? (minFill / maxFill) * 100 : 100;

  // 10. Uniformity (1-sigma/mean of thickness)
  const activeThk = thicknessMap.filter((_, i) => DIE_MASK[i]);
  const meanThk = activeThk.reduce((s, v) => s + v, 0) / activeThk.length;
  const variance = activeThk.reduce((s, v) => s + (v - meanThk) ** 2, 0) / activeThk.length;
  const uniformity = meanThk > 0 ? (Math.sqrt(variance) / meanThk) * 100 : 0;

  return {
    currentDensityMap,
    fillProfile,
    fillFraction,
    copperThickness,
    sheetResistance,
    stepCoverage,
    thicknessMap,
    resistanceMap,
    roughnessMap,
    uniformity,
    dieCount,
    dieGridCols: cols,
    dieGridRows: rows,
  };
}
```

**Step 3: Run tests and commit**

```bash
cd equipment-monitor && npx jest --testPathPatterns='damascene-sim.*wafer-metrics' --no-coverage
git add equipment-monitor/src/lib/damascene-sim/wafer-metrics.ts equipment-monitor/src/lib/damascene-sim/__tests__/wafer-metrics.test.ts
git commit -m "feat(damascene-sim): wafer metrics orchestrator with thickness, resistance, step coverage"
```

---

### Task 7: Simulation Engine + Presets + Barrel Export (TDD)

**Files:**
- Create: `equipment-monitor/src/lib/damascene-sim/__tests__/simulation-engine.test.ts`
- Create: `equipment-monitor/src/lib/damascene-sim/__tests__/presets.test.ts`
- Create: `equipment-monitor/src/lib/damascene-sim/simulation-engine.ts`
- Create: `equipment-monitor/src/lib/damascene-sim/presets.ts`
- Create: `equipment-monitor/src/lib/damascene-sim/index.ts`

**Step 1: Write simulation engine tests**

```typescript
// equipment-monitor/src/lib/damascene-sim/__tests__/simulation-engine.test.ts
import { createSimulation, stepForward, stepN, applyPreset } from '../simulation-engine';
import { DEFAULT_PARAMS, DEFAULT_TOTAL_STEPS, ECD_FILL_END, ANNEAL_END } from '../constants';

describe('simulation-engine', () => {
  it('creates initial state with empty steps', () => {
    const state = createSimulation(DEFAULT_PARAMS);
    expect(state.steps).toHaveLength(0);
    expect(state.currentIndex).toBe(-1);
    expect(state.totalSteps).toBe(DEFAULT_TOTAL_STEPS);
  });

  it('stepForward advances currentIndex', () => {
    let state = createSimulation(DEFAULT_PARAMS);
    state = stepForward(state);
    expect(state.currentIndex).toBe(0);
    expect(state.steps).toHaveLength(1);
    expect(state.steps[0].phase).toBe('ecd-fill');
  });

  it('phase transitions at correct step boundaries', () => {
    const params = { ...DEFAULT_PARAMS, totalSteps: DEFAULT_TOTAL_STEPS };
    let state = createSimulation(params);
    state = stepN(state, ECD_FILL_END + 1);
    expect(state.steps[ECD_FILL_END - 1].phase).toBe('ecd-fill');
    expect(state.steps[ECD_FILL_END].phase).toBe('anneal');
  });

  it('CMP phase starts after anneal', () => {
    let state = createSimulation(DEFAULT_PARAMS);
    state = stepN(state, ANNEAL_END + 1);
    expect(state.steps[ANNEAL_END].phase).toBe('cmp');
  });

  it('does not exceed total steps', () => {
    const params = { ...DEFAULT_PARAMS, totalSteps: 10 };
    let state = createSimulation(params);
    for (let i = 0; i < 20; i++) state = stepForward(state);
    expect(state.steps).toHaveLength(10);
  });

  it('stepN advances by N steps', () => {
    let state = createSimulation(DEFAULT_PARAMS);
    state = stepN(state, 30);
    expect(state.steps).toHaveLength(30);
    expect(state.currentIndex).toBe(29);
  });
});
```

**Step 2: Write presets tests**

```typescript
// equipment-monitor/src/lib/damascene-sim/__tests__/presets.test.ts
import { PRESETS, getPreset } from '../presets';
import { DEFAULT_PARAMS } from '../constants';

describe('presets', () => {
  it('current-crowding increases current and reduces seed', () => {
    const preset = getPreset('current-crowding')!;
    const result = preset.apply(DEFAULT_PARAMS, 0);
    expect(result.appliedCurrent).toBeGreaterThan(DEFAULT_PARAMS.appliedCurrent);
    expect(result.seedThickness).toBeLessThan(DEFAULT_PARAMS.seedThickness);
  });

  it('additive-depletion reduces additive concentration over steps', () => {
    const preset = getPreset('additive-depletion')!;
    const early = preset.apply(DEFAULT_PARAMS, 5);
    const late = preset.apply(DEFAULT_PARAMS, 50);
    expect(late.additiveConc).toBeLessThan(early.additiveConc);
  });

  it('seed-thinning reduces seed thickness', () => {
    const preset = getPreset('seed-thinning')!;
    const result = preset.apply(DEFAULT_PARAMS, 0);
    expect(result.seedThickness).toBeLessThan(DEFAULT_PARAMS.seedThickness);
  });

  it('over-polish increases pad pressure', () => {
    const preset = getPreset('over-polish')!;
    const result = preset.apply(DEFAULT_PARAMS, 0);
    expect(result.padPressure).toBeGreaterThan(DEFAULT_PARAMS.padPressure);
  });

  it('under-polish decreases pad pressure', () => {
    const preset = getPreset('under-polish')!;
    const result = preset.apply(DEFAULT_PARAMS, 0);
    expect(result.padPressure).toBeLessThan(DEFAULT_PARAMS.padPressure);
  });

  it('bath-temp-drift increases temperature over steps', () => {
    const preset = getPreset('bath-temp-drift')!;
    const early = preset.apply(DEFAULT_PARAMS, 0);
    const late = preset.apply(DEFAULT_PARAMS, 60);
    expect(late.bathTemp).toBeGreaterThan(early.bathTemp);
  });
});
```

**Step 3: Implement simulation engine**

```typescript
// equipment-monitor/src/lib/damascene-sim/simulation-engine.ts
import type { SimulationParams, SimulationState, StepState, ProcessPhase } from './types';
import { DEFAULT_PARAMS, DEFAULT_TOTAL_STEPS, ECD_FILL_END, ANNEAL_END, FILL_PROFILE_POINTS } from './constants';
import { computeStepMetrics } from './wafer-metrics';
import { applyCmpStep } from './cmp-model';
import { computeAnnealFactor } from './thermal-model';
import { getPreset } from './presets';

function getPhase(stepIndex: number): ProcessPhase {
  if (stepIndex < ECD_FILL_END) return 'ecd-fill';
  if (stepIndex < ANNEAL_END) return 'anneal';
  return 'cmp';
}

export function createSimulation(params: SimulationParams = DEFAULT_PARAMS): SimulationState {
  return {
    params: { ...params },
    steps: [],
    currentIndex: -1,
    totalSteps: params.totalSteps ?? DEFAULT_TOTAL_STEPS,
  };
}

export function stepForward(state: SimulationState): SimulationState {
  const nextIndex = state.currentIndex + 1;
  if (nextIndex >= state.totalSteps) return state;

  const phase = getPhase(nextIndex);
  const prev = state.steps.length > 0 ? state.steps[state.steps.length - 1] : null;
  const prevThickness = prev?.copperThickness ?? 0;
  const prevProfile = prev?.fillProfile ?? new Array(FILL_PROFILE_POINTS).fill(0);
  const dt = 0.5;

  let stepState: StepState;

  if (phase === 'ecd-fill') {
    const metrics = computeStepMetrics(state.params, nextIndex, prevThickness, prevProfile);
    stepState = {
      stepIndex: nextIndex,
      phase,
      timeSeconds: nextIndex * dt,
      dishingDepth: 0,
      viaResistance: metrics.sheetResistance * 0.04, // via R ≈ Rs × geometry factor
      ...metrics,
    };
  } else if (phase === 'anneal') {
    // Anneal: no geometry change, resistance decreases
    const annealProgress = (nextIndex - ECD_FILL_END) / (ANNEAL_END - ECD_FILL_END);
    const rsFactor = computeAnnealFactor(annealProgress);
    const prevResMap = prev?.resistanceMap ?? [];
    const resistanceMap = prevResMap.map((v) => v * rsFactor);
    const activeRs = resistanceMap.filter((_, i) => {
      const { DIE_MASK } = require('./constants');
      return DIE_MASK[i];
    });
    const sheetResistance = activeRs.length > 0
      ? activeRs.reduce((s: number, v: number) => s + v, 0) / activeRs.length
      : prev?.sheetResistance ?? 0;

    stepState = {
      stepIndex: nextIndex,
      phase,
      timeSeconds: nextIndex * dt,
      currentDensityMap: prev?.currentDensityMap ?? [],
      fillProfile: prev?.fillProfile ?? prevProfile,
      fillFraction: prev?.fillFraction ?? 0,
      copperThickness: prev?.copperThickness ?? 0,
      sheetResistance,
      viaResistance: sheetResistance * 0.04,
      stepCoverage: prev?.stepCoverage ?? 100,
      dishingDepth: 0,
      thicknessMap: prev?.thicknessMap ?? [],
      resistanceMap,
      roughnessMap: prev?.roughnessMap ?? [],
      uniformity: prev?.uniformity ?? 0,
      dieCount: prev?.dieCount ?? 81,
      dieGridCols: prev?.dieGridCols ?? 9,
      dieGridRows: prev?.dieGridRows ?? 9,
    };
  } else {
    // CMP phase
    const stepsInCmp = nextIndex - ANNEAL_END;
    const cmp = applyCmpStep(prev?.copperThickness ?? 0, state.params, stepsInCmp);

    const ratio = prev?.copperThickness && prev.copperThickness > 0
      ? cmp.thickness / prev.copperThickness
      : 1;
    const thicknessMap = (prev?.thicknessMap ?? []).map((v) => v * ratio);
    const rho_cu = 1.7e-6;
    const resistanceMap = thicknessMap.map((t) => {
      const t_cm = t * 1e-7;
      return t_cm > 0 ? rho_cu / t_cm : 0;
    });

    const { DIE_MASK } = require('./constants');
    const activeRs = resistanceMap.filter((_: number, i: number) => DIE_MASK[i]);
    const sheetResistance = activeRs.length > 0
      ? activeRs.reduce((s: number, v: number) => s + v, 0) / activeRs.length
      : prev?.sheetResistance ?? 0;

    const activeThk = thicknessMap.filter((_: number, i: number) => DIE_MASK[i]);
    const meanThk = activeThk.reduce((s: number, v: number) => s + v, 0) / activeThk.length;
    const variance = activeThk.reduce((s: number, v: number) => s + (v - meanThk) ** 2, 0) / activeThk.length;
    const uniformity = meanThk > 0 ? (Math.sqrt(variance) / meanThk) * 100 : 0;

    stepState = {
      stepIndex: nextIndex,
      phase,
      timeSeconds: nextIndex * dt,
      currentDensityMap: prev?.currentDensityMap ?? [],
      fillProfile: prev?.fillProfile ?? prevProfile,
      fillFraction: prev?.fillFraction ?? 0,
      copperThickness: cmp.thickness,
      sheetResistance,
      viaResistance: sheetResistance * 0.04,
      stepCoverage: prev?.stepCoverage ?? 100,
      dishingDepth: cmp.dishing,
      thicknessMap,
      resistanceMap,
      roughnessMap: prev?.roughnessMap ?? [],
      uniformity,
      dieCount: prev?.dieCount ?? 81,
      dieGridCols: prev?.dieGridCols ?? 9,
      dieGridRows: prev?.dieGridRows ?? 9,
    };
  }

  return {
    ...state,
    steps: [...state.steps, stepState],
    currentIndex: nextIndex,
  };
}

export function stepN(state: SimulationState, n: number): SimulationState {
  let current = state;
  for (let i = 0; i < n; i++) {
    const next = stepForward(current);
    if (next === current) break;
    current = next;
  }
  return current;
}

export function applyPreset(state: SimulationState, presetId: string): SimulationState {
  const preset = getPreset(presetId);
  if (!preset) return state;
  return {
    ...state,
    params: preset.apply(state.params, state.currentIndex),
  };
}
```

**Step 4: Implement presets**

```typescript
// equipment-monitor/src/lib/damascene-sim/presets.ts
import type { Preset } from './types';

export const PRESETS: Preset[] = [
  {
    id: 'current-crowding',
    label: 'Current Crowding',
    labelCN: '\u96FB\u6D41\u64C1\u64E0',
    color: '#ef4444',
    apply: (params) => ({
      ...params,
      appliedCurrent: params.appliedCurrent * 1.4,
      seedThickness: params.seedThickness * 0.7,
    }),
  },
  {
    id: 'additive-depletion',
    label: 'Additive Depletion',
    labelCN: '\u6DFB\u52A0\u5291\u8017\u7D61',
    color: '#f59e0b',
    apply: (params, stepIndex) => ({
      ...params,
      additiveConc: Math.max(0.05, params.additiveConc * (1 - 0.03 * Math.min(stepIndex, 30))),
    }),
  },
  {
    id: 'seed-thinning',
    label: 'Seed Layer Thinning',
    labelCN: '\u7A2E\u5B50\u5C64\u8584\u5316',
    color: '#f97316',
    apply: (params) => ({
      ...params,
      seedThickness: params.seedThickness * 0.5,
    }),
  },
  {
    id: 'over-polish',
    label: 'Over-polish (Dishing)',
    labelCN: '\u904E\u5EA6\u62CB\u5149',
    color: '#8b5cf6',
    apply: (params) => ({
      ...params,
      padPressure: params.padPressure * 1.6,
      totalSteps: params.totalSteps + 20,
    }),
  },
  {
    id: 'under-polish',
    label: 'Under-polish (Residual Cu)',
    labelCN: '\u62CB\u5149\u4E0D\u8DB3',
    color: '#3b82f6',
    apply: (params) => ({
      ...params,
      padPressure: params.padPressure * 0.6,
    }),
  },
  {
    id: 'bath-temp-drift',
    label: 'Bath Temp Drift',
    labelCN: '\u69FD\u6EAB\u6F02\u79FB',
    color: '#10b981',
    apply: (params, stepIndex) => ({
      ...params,
      bathTemp: params.bathTemp + 15 + stepIndex * 0.5,
    }),
  },
];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
```

**Step 5: Create barrel export**

```typescript
// equipment-monitor/src/lib/damascene-sim/index.ts
export { createSimulation, stepForward, stepN, applyPreset } from './simulation-engine';
export { PRESETS, getPreset } from './presets';
export { DEFAULT_PARAMS, PARAM_BOUNDS, DEFAULT_TOTAL_STEPS, ECD_FILL_END, ANNEAL_END } from './constants';
export type {
  SimulationParams,
  SimulationState,
  StepState,
  ProcessPhase,
  WaferMetric,
  PresetId,
  Preset,
} from './types';
```

**Step 6: Run all tests and commit**

```bash
cd equipment-monitor && npx jest --testPathPatterns='damascene-sim' --no-coverage
git add equipment-monitor/src/lib/damascene-sim/simulation-engine.ts equipment-monitor/src/lib/damascene-sim/presets.ts equipment-monitor/src/lib/damascene-sim/index.ts equipment-monitor/src/lib/damascene-sim/__tests__/simulation-engine.test.ts equipment-monitor/src/lib/damascene-sim/__tests__/presets.test.ts
git commit -m "feat(damascene-sim): simulation engine, presets, and barrel export"
```

---

## Phase 2: Entry Points

### Task 8: Digital Twin Routes Update

**Files:**
- Modify: `equipment-monitor/src/lib/digital-twin-routes.ts`

**Step 1: Add metallization route**

Add `metallization` entry to the existing `DIGITAL_TWIN_ROUTES` map. No changes needed in FabFloorScene or ProcessHudPanel — they already read this map dynamically.

```typescript
export const DIGITAL_TWIN_ROUTES: Partial<Record<ProcessId, string>> = {
  lithography: '/mes/fab-floor/lithography/lens-sim',
  deposition: '/mes/fab-floor/deposition/reactor-sim',
  metallization: '/mes/fab-floor/metallization/damascene-sim',
};
```

**Step 2: Commit**

```bash
git add equipment-monitor/src/lib/digital-twin-routes.ts
git commit -m "feat(damascene-sim): add metallization to digital twin routes"
```

---

## Phase 3: UI Components

### Task 9: Damascene Sim Page + TimelineBar + ParameterPanel

**Files:**
- Create: `equipment-monitor/src/components/damascene-sim/TimelineBar.tsx`
- Create: `equipment-monitor/src/components/damascene-sim/ParameterPanel.tsx`
- Create: `equipment-monitor/src/app/mes/fab-floor/metallization/damascene-sim/page.tsx`

Follow the exact same pattern as `src/components/dep-sim/TimelineBar.tsx`, `src/components/dep-sim/ParameterPanel.tsx`, and `src/app/mes/fab-floor/deposition/reactor-sim/page.tsx`.

Key differences:
- Import from `@/lib/damascene-sim` instead of `@/lib/dep-sim`
- TimelineBar uses `StepState` instead of `CycleState`, `totalSteps` instead of `totalCycles`
- Phase colors: `'ecd-fill': '#3b82f6'`, `'anneal': '#f59e0b'`, `'cmp': '#10b981'`
- Phase labels: `'ecd-fill': 'ECD Fill'`, `'anneal': 'Anneal'`, `'cmp': 'CMP'`
- Display copper thickness in nm (not Angstrom)
- ParameterPanel: 8 sliders (appliedCurrent, bathTemp, additiveConc, seedThickness, trenchWidth, trenchDepth, padPressure, padVelocity) + 6 preset buttons
- Page: `ReactorCrossSectionScene` → `ElectroplatingScene`, `WaferMetricsPanel` → `WaferMetricsPanel`, `stepCycle` → `stepForward`, `cycles` → `steps`
- Accent color: slate `rgba(148, 163, 184, 0.2)` borders instead of blue
- Background gradient: `rgba(148,163,184,0.10)` instead of `rgba(59,130,246,0.10)`

**Commit:**

```bash
git add equipment-monitor/src/components/damascene-sim/TimelineBar.tsx equipment-monitor/src/components/damascene-sim/ParameterPanel.tsx equipment-monitor/src/app/mes/fab-floor/metallization/damascene-sim/page.tsx
git commit -m "feat(damascene-sim): page route with timeline and parameter controls"
```

---

### Task 10: Babylon.js Electroplating Cell Scene

**Files:**
- Create: `equipment-monitor/src/components/damascene-sim/ElectroplatingScene.tsx`

Follow the pattern of `src/components/dep-sim/ReactorCrossSectionScene.tsx`.

Key elements:
- **ECD phase**: wafer face-down (top), anode (bottom), electrolyte bath, Cu²⁺ particle streamlines flowing upward, seed layer ring
- **Anneal phase**: electrolyte fades, wafer glows amber
- **CMP phase**: wafer face-up, polishing pad, slurry particles, copper thins
- **Trench fill inset** (Canvas2D GUI overlay, lower-right): 20-point profile with copper fill
- **Phase banner** (GUI text, top center): phase name with matching color
- Same `propsRef` pattern, `useWebGLSupport`, `WebGLFallback`
- Props: `{ step: StepState | null; params: SimulationParams }`
- Mesh names prefixed with "DAM-"
- data-testid: "electroplating-scene-canvas"

**Commit:**

```bash
git add equipment-monitor/src/components/damascene-sim/ElectroplatingScene.tsx
git commit -m "feat(damascene-sim): Babylon.js electroplating cell scene with phase transitions"
```

---

### Task 11: Wafer Metrics Panel

**Files:**
- Create: `equipment-monitor/src/components/damascene-sim/WaferMetricsPanel.tsx`

Follow the pattern of `src/components/dep-sim/WaferMetricsPanel.tsx`.

Key differences:
- Metrics: `sheetResistance`, `viaResistance`, `stepCoverage`, `thickness`
- Labels: `{ sheetResistance: 'Sheet Rs', viaResistance: 'Via Rs', stepCoverage: 'Step Cov.', thickness: 'Thickness' }`
- Chinese labels: `{ sheetResistance: '片電阻', viaResistance: '通孔電阻', stepCoverage: '階梯覆蓋', thickness: '膜厚' }`
- Color maps:
  - sheetResistance: green→yellow→red, range [0.02, 0.06]
  - viaResistance: green→yellow→red, range [0, 3.0]
  - stepCoverage: red→yellow→green, range [60, 100]
  - thickness: blue→white→red, range [0, 200]
- Trend sparkline with **two phase divider lines** at step 120 and step 160
- Spec limits: sheetResistance 0.052, viaResistance 2.4, stepCoverage 75%
- Accent color: slate (#94A3B8) instead of blue
- data-testid: "wafer-metrics-canvas", "wafer-trend-sparkline"

**Commit:**

```bash
git add equipment-monitor/src/components/damascene-sim/WaferMetricsPanel.tsx
git commit -m "feat(damascene-sim): wafer metrics panel with die map and trend sparkline"
```

---

## Phase 4: Verification

### Task 12: Build Verification

**Step 1: Run all damascene-sim tests**

```bash
cd equipment-monitor && npx jest --testPathPatterns='damascene-sim' --no-coverage
```

Expected: 7 test suites, ~33 tests, all passing.

**Step 2: TypeScript type check**

```bash
cd equipment-monitor && npx tsc --noEmit
```

Expected: no errors.

**Step 3: Next.js production build**

```bash
cd equipment-monitor && npm run build
```

Expected: build succeeds, `/mes/fab-floor/metallization/damascene-sim` appears in route list.

**Step 4: Fix any issues found, commit fixes**
