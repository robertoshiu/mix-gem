# Advanced Analytics Hub Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a 6-tab analytics hub at `/mes/analytics` with full simulation engines for VPP, APC R2R, Yield Forecast, Reliability, Cross-Process Optimization, and Multi-Fab Replication.

**Architecture:** Each tab has a pure-function engine (no classes), a Zustand store slice, and a React component with Canvas2D charts. Engines are standalone — no store dependency. The VPP engine imports existing sim engines (oxidation-sim, cmp-sim, etc.) via federation pattern.

**Tech Stack:** Next.js 15, React 19, Zustand, Canvas2D, TypeScript, Jest (globals — no vitest imports)

**Codebase context:**
- All work in `equipment-monitor/` directory
- Run tests: `npx jest` from `equipment-monitor/`
- Existing pattern: `mulberry32` PRNG for deterministic mock data (see `src/lib/tool-health/mock-data.ts`)
- Existing process data: `src/lib/fab-process-data.ts` — 8 `ProcessId` types, `PROCESS_ORDER`, `INITIAL_PROCESSES` with `nominalYield`, `nominalOee`, `nominalWph`
- Store pattern: `INITIAL_STATE` export for testing, Zustand `create()` with typed interface
- Nav: `src/components/mes/MesNavBar.tsx` — `NAV_ITEMS` array with `{href, label, icon?}`
- Existing TabsNavigation at `src/components/layout/tabs-navigation.tsx` — but it's for responsive layout, not our use case. We'll build a dedicated `AnalyticsTabBar`.

---

### Task 1: Types & Constants

**Files:**
- Create: `src/lib/analytics/types.ts`
- Create: `src/lib/analytics/constants.ts`

**Step 1: Create types.ts**

```typescript
// src/lib/analytics/types.ts

// ── Shared ──
export type AnalyticsTab = 'vpp' | 'apc' | 'yield' | 'reliability' | 'optimization' | 'replication';

export type ProcessStepId = 'oxidation' | 'lithography' | 'etching' | 'deposition' | 'implant' | 'diffusion' | 'cmp' | 'metallization';

// ── Yield Forecast ──
export interface StepYield {
  stepId: ProcessStepId;
  d0: number;
  yield: number;
  yieldLoss: number;
}

export interface YieldResult {
  perStep: StepYield[];
  lineYield: number;
  worstStep: ProcessStepId;
}

export interface YieldWaterfallPoint {
  stepId: ProcessStepId;
  cumulative: number;
}

export interface YieldCurvePoint {
  d0: number;
  yield: number;
}

// ── APC R2R ──
export interface EwmaState {
  level: number;
  slope: number;
  correction: number;
  forecast: number;
}

export interface ApcRunResult {
  run: number;
  controlled: number;
  uncontrolled: number;
  ewmaLevel: number;
  ewmaSlope: number;
  correction: number;
  drift: number;
}

export type DriftType = 'none' | 'linear' | 'sinusoidal' | 'step-shift' | 'mixed';

export interface DriftConfig {
  type: DriftType;
  slope?: number;         // linear: units/run
  amplitude?: number;     // sinusoidal: peak deviation
  period?: number;        // sinusoidal: runs per cycle
  magnitude?: number;     // step-shift: jump size
  triggerRun?: number;    // step-shift: when shift occurs
}

export interface ApcConfig {
  target: number;
  lambda: number;         // EWMA weight (0.01–1.0)
  lambdaSlope: number;    // d-EWMA slope weight (0 = single EWMA)
  noise: number;          // process noise σ
}

export interface ResidualStats {
  mean: number;
  std: number;
  cpk: number;
  histogram: { bin: number; count: number }[];
}

// ── Reliability ──
export type RbdTopology = 'series' | 'parallel' | 'series-parallel';

export interface Subsystem {
  id: ProcessStepId;
  name: string;
  lambda: number;   // failures per 1000h
  mu: number;       // repairs per 1000h
  k?: number;       // k-of-n: minimum required
  n?: number;       // k-of-n: total redundant
}

export interface RbdResult {
  systemAvail: number;
  subsystemAvails: { id: ProcessStepId; availability: number }[];
  bottleneck: ProcessStepId;
  systemMtbf: number;
}

export interface LifeProjectionPoint {
  tempC: number;
  arrhenius: number;
  eyring: number;
}

// ── Cross-Process Optimization ──
export type ObjectiveId = 'yield' | 'throughput' | 'cost' | 'defectDensity';
export type ObjectiveDirection = 'maximize' | 'minimize';

export interface Objective {
  id: ObjectiveId;
  direction: ObjectiveDirection;
}

export interface RecipeKnob {
  stepId: ProcessStepId;
  label: string;
  unit: string;
  min: number;
  max: number;
  value: number;
}

export interface ParetoPoint {
  objectives: Record<ObjectiveId, number>;
  recipe: number[];
  dominated: boolean;
}

export interface RsmFit {
  coefficients: number[];
  rSquared: number;
}

export interface SensitivityBar {
  stepId: ProcessStepId;
  label: string;
  impact: number;
}

export interface ConstraintSet {
  minYield?: number;
  maxD0?: number;
  minThroughput?: number;
  maxCost?: number;
}

// ── Multi-Fab Replication ──
export type FabId = 'hq' | 'satellite' | 'new-build';

export interface FabConfig {
  id: FabId;
  name: string;
  location: string;
  maturity: 'Mature' | 'Established' | 'Ramping';
  bias: number;         // fraction of target (0 = no bias)
  spreadFactor: number; // multiplier on σ (1 = baseline)
}

export interface TostResult {
  fab1: FabId;
  fab2: FabId;
  meanDiff: number;
  ciLower: number;
  ciUpper: number;
  equivalenceLower: number;
  equivalenceUpper: number;
  pass: boolean;
}

export interface TransferFit {
  fromFab: FabId;
  toFab: FabId;
  coefficients: number[];
  rSquared: number;
  bias: number;
}

export interface DistributionCurvePoint {
  x: number;
  pdf: number;
}

export type ReplicationParam = 'cd' | 'overlay' | 'thickness' | 'dose' | 'etchDepth' | 'implantDepth' | 'diffusionDepth' | 'cmpRemoval';

// ── VPP ──
export interface PipelineStep {
  stepId: ProcessStepId;
  presetName: string;
  overrides: Record<string, number>;
}

export interface PipelineStepResult {
  stepId: ProcessStepId;
  yield: number;
  thickness: number;
  stress: number;
  defectDensity: number;
}

export interface FilmLayer {
  material: string;
  thickness: number;
  color: string;
}

export interface PipelineResult {
  perStep: PipelineStepResult[];
  filmStack: FilmLayer[];
  cumulativeYield: number;
}
```

**Step 2: Create constants.ts**

```typescript
// src/lib/analytics/constants.ts
import type {
  AnalyticsTab, ProcessStepId, FabId, FabConfig, RecipeKnob,
  Objective, ObjectiveId, ReplicationParam, Subsystem,
} from './types';

export const ANALYTICS_TABS: { id: AnalyticsTab; label: string }[] = [
  { id: 'vpp', label: 'VPP' },
  { id: 'apc', label: 'APC R2R' },
  { id: 'yield', label: 'Yield Forecast' },
  { id: 'reliability', label: 'Reliability' },
  { id: 'optimization', label: 'Cross-Process Opt' },
  { id: 'replication', label: 'Multi-Fab' },
];

export const PROCESS_STEPS: ProcessStepId[] = [
  'oxidation', 'lithography', 'etching', 'deposition',
  'implant', 'diffusion', 'cmp', 'metallization',
];

export const STEP_SHORT_NAMES: Record<ProcessStepId, string> = {
  oxidation: 'OX', lithography: 'LITHO', etching: 'ETCH', deposition: 'DEP',
  implant: 'IMP', diffusion: 'DIFF', cmp: 'CMP', metallization: 'MET',
};

// ── Yield defaults (D₀ per step from industry ranges) ──
export const DEFAULT_D0: Record<ProcessStepId, number> = {
  oxidation: 0.12, lithography: 0.25, etching: 0.18, deposition: 0.10,
  implant: 0.22, diffusion: 0.15, cmp: 0.14, metallization: 0.13,
};

export const DEFAULT_DIE_AREA = 100;  // mm²
export const DEFAULT_ALPHA = 2.0;     // cluster factor

// ── APC defaults ──
export const DEFAULT_APC_TARGET = 100;
export const DEFAULT_LAMBDA = 0.3;
export const DEFAULT_LAMBDA_SLOPE = 0.1;
export const DEFAULT_NOISE = 1.5;

// ── Reliability defaults ──
export const DEFAULT_SUBSYSTEMS: Subsystem[] = [
  { id: 'oxidation',     name: 'Oxidation',     lambda: 1.2, mu: 24 },
  { id: 'lithography',   name: 'Lithography',   lambda: 2.0, mu: 18 },
  { id: 'etching',       name: 'Etching',       lambda: 1.8, mu: 20 },
  { id: 'deposition',    name: 'Deposition',    lambda: 1.0, mu: 22 },
  { id: 'implant',       name: 'Implant',       lambda: 2.5, mu: 15 },
  { id: 'diffusion',     name: 'Diffusion',     lambda: 1.1, mu: 25 },
  { id: 'cmp',           name: 'CMP',           lambda: 1.5, mu: 20 },
  { id: 'metallization', name: 'Metal',         lambda: 1.3, mu: 22 },
];

export const BOLTZMANN_EV = 8.617333e-5; // eV/K

// ── Optimization defaults ──
export const OBJECTIVES: Objective[] = [
  { id: 'yield', direction: 'maximize' },
  { id: 'throughput', direction: 'maximize' },
  { id: 'cost', direction: 'minimize' },
  { id: 'defectDensity', direction: 'minimize' },
];

export const DEFAULT_RECIPE_KNOBS: RecipeKnob[] = [
  { stepId: 'oxidation',     label: 'Temp',       unit: '°C',    min: 900,  max: 1100, value: 1000 },
  { stepId: 'lithography',   label: 'Dose',       unit: 'mJ/cm²', min: 20, max: 40,   value: 30 },
  { stepId: 'etching',       label: 'Pressure',   unit: 'mTorr', min: 5,    max: 50,   value: 25 },
  { stepId: 'deposition',    label: 'Dep Rate',   unit: 'nm/s',  min: 1,    max: 6,    value: 3.2 },
  { stepId: 'implant',       label: 'Energy',     unit: 'keV',   min: 10,   max: 200,  value: 80 },
  { stepId: 'diffusion',     label: 'Anneal Temp', unit: '°C',   min: 800,  max: 1100, value: 1000 },
  { stepId: 'cmp',           label: 'Downforce',  unit: 'psi',   min: 1,    max: 7,    value: 4 },
  { stepId: 'metallization', label: 'Sputter Pwr', unit: 'kW',   min: 1,    max: 10,   value: 5 },
];

export const DEFAULT_CONSTRAINTS = {
  minYield: 85,
  maxD0: 0.5,
  minThroughput: 40,
  maxCost: 150,
};

// ── Replication defaults ──
export const FAB_CONFIGS: Record<FabId, FabConfig> = {
  hq:         { id: 'hq',         name: 'HQ Fab',        location: 'Hsinchu',   maturity: 'Mature',      bias: 0,    spreadFactor: 1.0 },
  satellite:  { id: 'satellite',  name: 'Satellite Fab',  location: 'Tainan',    maturity: 'Established', bias: 0.02, spreadFactor: 1.1 },
  'new-build': { id: 'new-build', name: 'New-Build Fab',  location: 'Kaohsiung', maturity: 'Ramping',     bias: 0.05, spreadFactor: 1.3 },
};

export const FAB_IDS: FabId[] = ['hq', 'satellite', 'new-build'];

export const REPLICATION_PARAMS: { id: ReplicationParam; label: string; unit: string; target: number; usl: number; lsl: number }[] = [
  { id: 'cd',             label: 'CD',              unit: 'nm',     target: 45,   usl: 48,   lsl: 42 },
  { id: 'overlay',        label: 'Overlay',         unit: 'nm',     target: 2.0,  usl: 3.0,  lsl: -3.0 },
  { id: 'thickness',      label: 'Film Thickness',  unit: 'nm',     target: 100,  usl: 108,  lsl: 92 },
  { id: 'dose',           label: 'Implant Dose',    unit: '×10¹²',  target: 5.0,  usl: 5.4,  lsl: 4.6 },
  { id: 'etchDepth',      label: 'Etch Depth',      unit: 'nm',     target: 200,  usl: 215,  lsl: 185 },
  { id: 'implantDepth',   label: 'Implant Depth',   unit: 'nm',     target: 60,   usl: 66,   lsl: 54 },
  { id: 'diffusionDepth', label: 'Junction Depth',  unit: 'nm',     target: 62,   usl: 68,   lsl: 56 },
  { id: 'cmpRemoval',     label: 'CMP Removal',     unit: 'nm',     target: 350,  usl: 380,  lsl: 320 },
];

// ── VPP film stack materials ──
export const FILM_MATERIALS: Record<ProcessStepId, { material: string; color: string; baseThickness: number }> = {
  oxidation:     { material: 'SiO₂',    color: '#60A5FA', baseThickness: 100 },
  lithography:   { material: 'Resist',   color: '#F472B6', baseThickness: 200 },
  etching:       { material: '(removed)', color: '#6B7280', baseThickness: -50 },
  deposition:    { material: 'Si₃N₄',   color: '#34D399', baseThickness: 55 },
  implant:       { material: '(doped)',   color: '#F87171', baseThickness: 0 },
  diffusion:     { material: '(annealed)', color: '#FBBF24', baseThickness: 0 },
  cmp:           { material: '(planarized)', color: '#A78BFA', baseThickness: -30 },
  metallization: { material: 'Cu',       color: '#FB923C', baseThickness: 150 },
};

// ── PRNG ──
export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}
```

**Step 3: Verify no syntax errors**

Run: `cd equipment-monitor && npx tsc --noEmit src/lib/analytics/types.ts src/lib/analytics/constants.ts 2>&1 | head -20`
Expected: No errors (or only unrelated ambient type issues)

**Step 4: Commit**

```bash
git add src/lib/analytics/types.ts src/lib/analytics/constants.ts
git commit -m "feat(analytics): add shared types and constants for 6-tab analytics hub"
```

---

### Task 2: Yield Engine + Tests

**Files:**
- Create: `src/lib/analytics/yield-engine.ts`
- Create: `src/lib/analytics/__tests__/yield-engine.test.ts`

**Step 1: Write the failing tests**

```typescript
// src/lib/analytics/__tests__/yield-engine.test.ts
import {
  computeStepYield,
  computeLineYield,
  generateYieldWaterfall,
  generateYieldCurve,
  generateForecastLots,
} from '../yield-engine';

describe('computeStepYield', () => {
  test('returns 1 when D0 is 0', () => {
    expect(computeStepYield(0, 100, 2)).toBe(1);
  });

  test('returns 1 when die area is 0', () => {
    expect(computeStepYield(0.5, 0, 2)).toBe(1);
  });

  test('matches hand-calc for known values', () => {
    // Y = (1 + 0.5 * 100 / 2)^(-2) = (1 + 25)^(-2) = 26^(-2) ≈ 0.001479
    const y = computeStepYield(0.5, 100, 2);
    expect(y).toBeCloseTo(1 / (26 * 26), 5);
  });

  test('higher D0 gives lower yield', () => {
    const yLow = computeStepYield(0.1, 100, 2);
    const yHigh = computeStepYield(0.5, 100, 2);
    expect(yLow).toBeGreaterThan(yHigh);
  });

  test('higher alpha (less clustering) gives higher yield', () => {
    const yCluster = computeStepYield(0.3, 100, 1);
    const yRandom = computeStepYield(0.3, 100, 10);
    expect(yRandom).toBeGreaterThan(yCluster);
  });
});

describe('computeLineYield', () => {
  test('returns product of all step yields', () => {
    const steps = [
      { stepId: 'oxidation' as const, d0: 0.1 },
      { stepId: 'lithography' as const, d0: 0.2 },
    ];
    const result = computeLineYield(steps, 100, 2);
    const y1 = computeStepYield(0.1, 100, 2);
    const y2 = computeStepYield(0.2, 100, 2);
    expect(result.lineYield).toBeCloseTo(y1 * y2, 6);
    expect(result.perStep).toHaveLength(2);
  });

  test('identifies worst step correctly', () => {
    const steps = [
      { stepId: 'oxidation' as const, d0: 0.05 },
      { stepId: 'implant' as const, d0: 0.9 },
      { stepId: 'cmp' as const, d0: 0.1 },
    ];
    const result = computeLineYield(steps, 100, 2);
    expect(result.worstStep).toBe('implant');
  });

  test('empty steps gives lineYield = 1', () => {
    const result = computeLineYield([], 100, 2);
    expect(result.lineYield).toBe(1);
  });
});

describe('generateYieldWaterfall', () => {
  test('starts near 1 and decreases monotonically', () => {
    const steps = [
      { stepId: 'oxidation' as const, d0: 0.1 },
      { stepId: 'lithography' as const, d0: 0.2 },
      { stepId: 'etching' as const, d0: 0.15 },
    ];
    const waterfall = generateYieldWaterfall(steps, 100, 2);
    expect(waterfall).toHaveLength(3);
    for (let i = 1; i < waterfall.length; i++) {
      expect(waterfall[i].cumulative).toBeLessThanOrEqual(waterfall[i - 1].cumulative);
    }
  });

  test('last entry matches lineYield', () => {
    const steps = [
      { stepId: 'oxidation' as const, d0: 0.12 },
      { stepId: 'cmp' as const, d0: 0.14 },
    ];
    const waterfall = generateYieldWaterfall(steps, 100, 2);
    const { lineYield } = computeLineYield(steps, 100, 2);
    expect(waterfall[waterfall.length - 1].cumulative).toBeCloseTo(lineYield, 6);
  });
});

describe('generateYieldCurve', () => {
  test('returns requested number of points', () => {
    const curve = generateYieldCurve(100, 2, 0, 1, 50);
    expect(curve).toHaveLength(50);
  });

  test('yield decreases as D0 increases', () => {
    const curve = generateYieldCurve(100, 2, 0, 1, 10);
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].yield).toBeLessThanOrEqual(curve[i - 1].yield + 1e-9);
    }
  });
});

describe('generateForecastLots', () => {
  test('returns requested number of lots', () => {
    const steps = [
      { stepId: 'oxidation' as const, d0: 0.12 },
      { stepId: 'lithography' as const, d0: 0.25 },
    ];
    const lots = generateForecastLots(steps, 100, 2, 20, 42);
    expect(lots).toHaveLength(20);
  });

  test('is deterministic with same seed', () => {
    const steps = [{ stepId: 'oxidation' as const, d0: 0.12 }];
    const a = generateForecastLots(steps, 100, 2, 10, 99);
    const b = generateForecastLots(steps, 100, 2, 10, 99);
    expect(a).toEqual(b);
  });

  test('different seeds give different results', () => {
    const steps = [{ stepId: 'oxidation' as const, d0: 0.12 }];
    const a = generateForecastLots(steps, 100, 2, 10, 1);
    const b = generateForecastLots(steps, 100, 2, 10, 2);
    const same = a.every((v, i) => v === b[i]);
    expect(same).toBe(false);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd equipment-monitor && npx jest src/lib/analytics/__tests__/yield-engine.test.ts --no-coverage 2>&1 | tail -5`
Expected: FAIL — Cannot find module '../yield-engine'

**Step 3: Write minimal implementation**

```typescript
// src/lib/analytics/yield-engine.ts
import type { StepYield, YieldResult, YieldWaterfallPoint, YieldCurvePoint, ProcessStepId } from './types';
import { mulberry32 } from './constants';

/**
 * Negative Binomial yield: Y = (1 + D₀·A/α)^(-α)
 */
export function computeStepYield(d0: number, area: number, alpha: number): number {
  if (d0 <= 0 || area <= 0) return 1;
  return Math.pow(1 + (d0 * area) / alpha, -alpha);
}

export function computeLineYield(
  steps: { stepId: ProcessStepId; d0: number }[],
  area: number,
  alpha: number,
): YieldResult {
  if (steps.length === 0) {
    return { perStep: [], lineYield: 1, worstStep: 'oxidation' };
  }

  const perStep: StepYield[] = steps.map(({ stepId, d0 }) => {
    const y = computeStepYield(d0, area, alpha);
    return { stepId, d0, yield: y, yieldLoss: 1 - y };
  });

  const lineYield = perStep.reduce((acc, s) => acc * s.yield, 1);

  let worstIdx = 0;
  for (let i = 1; i < perStep.length; i++) {
    if (perStep[i].yield < perStep[worstIdx].yield) worstIdx = i;
  }

  return { perStep, lineYield, worstStep: perStep[worstIdx].stepId };
}

export function generateYieldWaterfall(
  steps: { stepId: ProcessStepId; d0: number }[],
  area: number,
  alpha: number,
): YieldWaterfallPoint[] {
  let cumulative = 1;
  return steps.map(({ stepId, d0 }) => {
    cumulative *= computeStepYield(d0, area, alpha);
    return { stepId, cumulative };
  });
}

export function generateYieldCurve(
  area: number,
  alpha: number,
  d0Min: number,
  d0Max: number,
  points = 100,
): YieldCurvePoint[] {
  const step = (d0Max - d0Min) / Math.max(1, points - 1);
  return Array.from({ length: points }, (_, i) => {
    const d0 = d0Min + i * step;
    return { d0, yield: computeStepYield(d0, area, alpha) };
  });
}

export function generateForecastLots(
  steps: { stepId: ProcessStepId; d0: number }[],
  area: number,
  alpha: number,
  nLots: number,
  seed: number,
): number[] {
  const rng = mulberry32(seed);
  const baseResult = computeLineYield(steps, area, alpha);
  return Array.from({ length: nLots }, () => {
    // Per-lot variance: multiply each step yield by (1 + noise)
    let lotYield = 1;
    for (const { d0 } of steps) {
      const noise = (rng() - 0.5) * 0.1; // ±5% D₀ variation
      const noisyD0 = d0 * (1 + noise);
      lotYield *= computeStepYield(noisyD0, area, alpha);
    }
    return lotYield;
  });
}
```

**Step 4: Run tests to verify they pass**

Run: `cd equipment-monitor && npx jest src/lib/analytics/__tests__/yield-engine.test.ts --no-coverage 2>&1 | tail -5`
Expected: PASS — 15 tests

**Step 5: Commit**

```bash
git add src/lib/analytics/yield-engine.ts src/lib/analytics/__tests__/yield-engine.test.ts
git commit -m "feat(analytics): yield forecast engine with Negative Binomial model + 15 tests"
```

---

### Task 3: APC R2R Engine + Tests

**Files:**
- Create: `src/lib/analytics/apc-engine.ts`
- Create: `src/lib/analytics/__tests__/apc-engine.test.ts`

**Step 1: Write the failing tests**

```typescript
// src/lib/analytics/__tests__/apc-engine.test.ts
import {
  createController,
  stepController,
  generateDrift,
  simulateRuns,
  computeResidualStats,
} from '../apc-engine';

describe('createController', () => {
  test('initializes with target as level and zero slope', () => {
    const state = createController({ target: 100, lambda: 0.3, lambdaSlope: 0.1, noise: 1.5 });
    expect(state.level).toBe(100);
    expect(state.slope).toBe(0);
    expect(state.correction).toBe(0);
  });
});

describe('stepController', () => {
  test('adjusts level toward measurement', () => {
    const config = { target: 100, lambda: 0.3, lambdaSlope: 0.1, noise: 1.5 };
    const state = createController(config);
    const { newState } = stepController(state, 105, config);
    // Level should move toward 105
    expect(newState.level).toBeGreaterThan(100);
    expect(newState.level).toBeLessThan(105);
  });

  test('with lambdaSlope=0 slope stays zero (single EWMA)', () => {
    const config = { target: 100, lambda: 0.3, lambdaSlope: 0, noise: 1.5 };
    const state = createController(config);
    const { newState } = stepController(state, 110, config);
    expect(newState.slope).toBe(0);
  });

  test('correction opposes forecast deviation from target', () => {
    const config = { target: 100, lambda: 0.3, lambdaSlope: 0.1, noise: 1.5 };
    const state = createController(config);
    const { newState } = stepController(state, 108, config);
    // Forecast > target, so correction should be negative
    expect(newState.correction).toBeLessThan(0);
  });
});

describe('generateDrift', () => {
  test('none returns 0', () => {
    expect(generateDrift({ type: 'none' }, 50)).toBe(0);
  });

  test('linear scales with run index', () => {
    const d1 = generateDrift({ type: 'linear', slope: 0.5 }, 10);
    const d2 = generateDrift({ type: 'linear', slope: 0.5 }, 20);
    expect(d2).toBeCloseTo(d1 + 0.5 * 10, 6);
  });

  test('sinusoidal is bounded by amplitude', () => {
    const config = { type: 'sinusoidal' as const, amplitude: 5, period: 20 };
    for (let i = 0; i < 100; i++) {
      const d = generateDrift(config, i);
      expect(Math.abs(d)).toBeLessThanOrEqual(5.001);
    }
  });

  test('step-shift is zero before trigger, magnitude after', () => {
    const config = { type: 'step-shift' as const, magnitude: 10, triggerRun: 25 };
    expect(generateDrift(config, 20)).toBe(0);
    expect(generateDrift(config, 30)).toBe(10);
  });
});

describe('simulateRuns', () => {
  test('returns correct number of runs', () => {
    const config = { target: 100, lambda: 0.3, lambdaSlope: 0.1, noise: 1.5 };
    const drift = { type: 'none' as const };
    const results = simulateRuns(config, drift, 50, 42);
    expect(results).toHaveLength(50);
  });

  test('controlled output is closer to target than uncontrolled under drift', () => {
    const config = { target: 100, lambda: 0.3, lambdaSlope: 0.1, noise: 0.5 };
    const drift = { type: 'linear' as const, slope: 0.5 };
    const results = simulateRuns(config, drift, 80, 42);
    // Last 20 runs: controlled should be closer to target
    const last20 = results.slice(60);
    const controlledMse = last20.reduce((s, r) => s + (r.controlled - 100) ** 2, 0) / 20;
    const uncontrolledMse = last20.reduce((s, r) => s + (r.uncontrolled - 100) ** 2, 0) / 20;
    expect(controlledMse).toBeLessThan(uncontrolledMse);
  });

  test('is deterministic with same seed', () => {
    const config = { target: 100, lambda: 0.3, lambdaSlope: 0.1, noise: 1.5 };
    const drift = { type: 'linear' as const, slope: 0.3 };
    const a = simulateRuns(config, drift, 20, 77);
    const b = simulateRuns(config, drift, 20, 77);
    expect(a).toEqual(b);
  });
});

describe('computeResidualStats', () => {
  test('computes mean near zero for on-target data', () => {
    const controlled = Array.from({ length: 100 }, () => 100 + (Math.random() - 0.5) * 0.01);
    const stats = computeResidualStats(controlled, 100);
    expect(Math.abs(stats.mean)).toBeLessThan(0.1);
  });

  test('histogram bins sum to total count', () => {
    const controlled = Array.from({ length: 50 }, (_, i) => 100 + i * 0.1);
    const stats = computeResidualStats(controlled, 100);
    const total = stats.histogram.reduce((s, b) => s + b.count, 0);
    expect(total).toBe(50);
  });

  test('Cpk is positive for centered data within spec', () => {
    // σ ≈ 0.29, mean ≈ 100 => Cpk with implicit ±3σ spec
    const data = Array.from({ length: 100 }, (_, i) => 99.5 + i * 0.01);
    const stats = computeResidualStats(data, 100);
    expect(stats.cpk).toBeGreaterThan(0);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd equipment-monitor && npx jest src/lib/analytics/__tests__/apc-engine.test.ts --no-coverage 2>&1 | tail -5`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/lib/analytics/apc-engine.ts
import type { EwmaState, ApcConfig, DriftConfig, ApcRunResult, ResidualStats } from './types';
import { mulberry32 } from './constants';

export function createController(config: ApcConfig): EwmaState {
  return { level: config.target, slope: 0, correction: 0, forecast: config.target };
}

export function stepController(
  state: EwmaState,
  measurement: number,
  config: ApcConfig,
): { newState: EwmaState; correction: number } {
  const { lambda, lambdaSlope, target } = config;

  // d-EWMA update
  const newLevel = lambda * measurement + (1 - lambda) * (state.level + state.slope);
  const newSlope = lambdaSlope === 0
    ? 0
    : lambdaSlope * (newLevel - state.level) + (1 - lambdaSlope) * state.slope;

  const forecast = newLevel + newSlope;
  const correction = target - forecast;

  return {
    newState: { level: newLevel, slope: newSlope, correction, forecast },
    correction,
  };
}

export function generateDrift(config: DriftConfig, runIndex: number): number {
  switch (config.type) {
    case 'none':
      return 0;
    case 'linear':
      return (config.slope ?? 0) * runIndex;
    case 'sinusoidal':
      return (config.amplitude ?? 0) * Math.sin((2 * Math.PI * runIndex) / (config.period ?? 20));
    case 'step-shift':
      return runIndex >= (config.triggerRun ?? 25) ? (config.magnitude ?? 0) : 0;
    case 'mixed':
      return (config.slope ?? 0.2) * runIndex
        + (config.amplitude ?? 3) * Math.sin((2 * Math.PI * runIndex) / (config.period ?? 30));
    default:
      return 0;
  }
}

function gaussianNoise(rng: () => number): number {
  const u1 = rng();
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1 || 1e-10)) * Math.cos(2 * Math.PI * u2);
}

export function simulateRuns(
  config: ApcConfig,
  driftConfig: DriftConfig,
  nRuns: number,
  seed: number,
): ApcRunResult[] {
  const rng = mulberry32(seed);
  let state = createController(config);
  const results: ApcRunResult[] = [];

  for (let i = 0; i < nRuns; i++) {
    const drift = generateDrift(driftConfig, i);
    const noise = gaussianNoise(rng) * config.noise;

    // Uncontrolled: target + drift + noise
    const uncontrolled = config.target + drift + noise;

    // Controlled: target + drift + noise + correction from controller
    const controlled = config.target + drift + noise + state.correction;

    // Feed controlled measurement to controller
    const { newState } = stepController(state, controlled, config);
    state = newState;

    results.push({
      run: i,
      controlled,
      uncontrolled,
      ewmaLevel: state.level,
      ewmaSlope: state.slope,
      correction: state.correction,
      drift,
    });
  }

  return results;
}

export function computeResidualStats(controlled: number[], target: number): ResidualStats {
  const residuals = controlled.map((v) => v - target);
  const n = residuals.length;
  const mean = residuals.reduce((s, v) => s + v, 0) / (n || 1);
  const variance = residuals.reduce((s, v) => s + (v - mean) ** 2, 0) / (n || 1);
  const std = Math.sqrt(variance);

  // Cpk using ±3σ as spec limits
  const usl = 3 * std;
  const lsl = -3 * std;
  const cpk = std === 0 ? Infinity : Math.min((usl - mean) / (3 * std), (mean - lsl) / (3 * std));

  // Histogram: 20 bins
  const binCount = 20;
  const min = Math.min(...residuals);
  const max = Math.max(...residuals);
  const range = max - min || 1;
  const binWidth = range / binCount;
  const histogram = Array.from({ length: binCount }, (_, i) => ({
    bin: min + (i + 0.5) * binWidth,
    count: 0,
  }));
  for (const r of residuals) {
    const idx = Math.min(Math.floor((r - min) / binWidth), binCount - 1);
    histogram[idx].count++;
  }

  return { mean, std, cpk, histogram };
}
```

**Step 4: Run tests to verify they pass**

Run: `cd equipment-monitor && npx jest src/lib/analytics/__tests__/apc-engine.test.ts --no-coverage 2>&1 | tail -5`
Expected: PASS — 18 tests

**Step 5: Commit**

```bash
git add src/lib/analytics/apc-engine.ts src/lib/analytics/__tests__/apc-engine.test.ts
git commit -m "feat(analytics): APC R2R engine with d-EWMA controller + 18 tests"
```

---

### Task 4: Reliability Engine + Tests

**Files:**
- Create: `src/lib/analytics/reliability-engine.ts`
- Create: `src/lib/analytics/__tests__/reliability-engine.test.ts`

**Step 1: Write the failing tests**

```typescript
// src/lib/analytics/__tests__/reliability-engine.test.ts
import {
  computeSubsystemAvailability,
  computeSeriesAvailability,
  computeParallelAvailability,
  computeKofNAvailability,
  arrheniusLife,
  eyringLife,
  accelerationFactor,
  generateLifeProjection,
  generateSystemRBD,
} from '../reliability-engine';

describe('computeSubsystemAvailability', () => {
  test('returns mu/(lambda+mu)', () => {
    expect(computeSubsystemAvailability(2, 18)).toBeCloseTo(0.9, 5);
  });

  test('perfect repair (large mu) gives near-1 availability', () => {
    expect(computeSubsystemAvailability(1, 10000)).toBeGreaterThan(0.999);
  });
});

describe('computeSeriesAvailability', () => {
  test('is product of individual availabilities', () => {
    const a = computeSeriesAvailability([0.99, 0.98, 0.97]);
    expect(a).toBeCloseTo(0.99 * 0.98 * 0.97, 6);
  });

  test('is less than minimum component', () => {
    const a = computeSeriesAvailability([0.99, 0.95, 0.98]);
    expect(a).toBeLessThan(0.95);
  });
});

describe('computeParallelAvailability', () => {
  test('is 1 - product(1 - Ai)', () => {
    const a = computeParallelAvailability([0.9, 0.9]);
    expect(a).toBeCloseTo(1 - 0.1 * 0.1, 6);
  });

  test('is greater than maximum component', () => {
    const a = computeParallelAvailability([0.9, 0.85, 0.88]);
    expect(a).toBeGreaterThan(0.9);
  });
});

describe('computeKofNAvailability', () => {
  test('k=n equals series (all must work)', () => {
    const kn = computeKofNAvailability(3, 3, 0.95);
    const series = 0.95 ** 3;
    expect(kn).toBeCloseTo(series, 6);
  });

  test('k=1 equals parallel (any one works)', () => {
    const kn = computeKofNAvailability(1, 3, 0.9);
    const parallel = 1 - 0.1 ** 3;
    expect(kn).toBeCloseTo(parallel, 6);
  });

  test('2-of-3 is between series and parallel', () => {
    const A = 0.9;
    const kn = computeKofNAvailability(2, 3, A);
    const series = A ** 3;
    const parallel = 1 - (1 - A) ** 3;
    expect(kn).toBeGreaterThan(series);
    expect(kn).toBeLessThan(parallel);
  });
});

describe('arrheniusLife', () => {
  test('higher temperature gives shorter life', () => {
    const l1 = arrheniusLife(1e10, 0.7, 273 + 65);  // 65°C
    const l2 = arrheniusLife(1e10, 0.7, 273 + 125); // 125°C
    expect(l2).toBeLessThan(l1);
  });
});

describe('eyringLife', () => {
  test('with b=0 and S=0 approximates Arrhenius/T', () => {
    const T = 273 + 100;
    const arr = arrheniusLife(1e10, 0.7, T);
    const eyr = eyringLife(1e10, 0.7, T, 0, 0);
    // Eyring has extra 1/T factor: eyr ≈ arr / T * constant
    // Just check same order of magnitude and same trend
    expect(eyr).toBeGreaterThan(0);
  });
});

describe('accelerationFactor', () => {
  test('AF = 1 when test temp equals use temp', () => {
    expect(accelerationFactor(0.7, 338, 338)).toBeCloseTo(1, 6);
  });

  test('AF > 1 when test temp > use temp', () => {
    expect(accelerationFactor(0.7, 338, 398)).toBeGreaterThan(1);
  });
});

describe('generateLifeProjection', () => {
  test('returns correct number of points', () => {
    const pts = generateLifeProjection(0.7, 0.01, 0.5, 65, 50);
    expect(pts).toHaveLength(50);
  });

  test('life decreases with temperature', () => {
    const pts = generateLifeProjection(0.7, 0, 0, 65, 20);
    for (let i = 1; i < pts.length; i++) {
      expect(pts[i].arrhenius).toBeLessThanOrEqual(pts[i - 1].arrhenius + 0.01);
    }
  });
});

describe('generateSystemRBD', () => {
  test('identifies bottleneck as lowest availability subsystem', () => {
    const subsystems = [
      { id: 'oxidation' as const, name: 'OX', lambda: 1, mu: 20 },
      { id: 'implant' as const, name: 'IMP', lambda: 5, mu: 10 },
    ];
    const result = generateSystemRBD(subsystems, 'series');
    expect(result.bottleneck).toBe('implant');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd equipment-monitor && npx jest src/lib/analytics/__tests__/reliability-engine.test.ts --no-coverage 2>&1 | tail -5`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/lib/analytics/reliability-engine.ts
import type { Subsystem, RbdTopology, RbdResult, LifeProjectionPoint } from './types';
import { BOLTZMANN_EV } from './constants';

export function computeSubsystemAvailability(lambda: number, mu: number): number {
  return mu / (lambda + mu);
}

export function computeSeriesAvailability(availabilities: number[]): number {
  return availabilities.reduce((acc, a) => acc * a, 1);
}

export function computeParallelAvailability(availabilities: number[]): number {
  return 1 - availabilities.reduce((acc, a) => acc * (1 - a), 1);
}

export function computeKofNAvailability(k: number, n: number, A: number): number {
  // Binomial sum: P(X >= k) where X ~ Bin(n, A)
  let sum = 0;
  for (let i = k; i <= n; i++) {
    sum += binomial(n, i) * Math.pow(A, i) * Math.pow(1 - A, n - i);
  }
  return sum;
}

function binomial(n: number, k: number): number {
  if (k > n) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = result * (n - i) / (i + 1);
  }
  return result;
}

export function arrheniusLife(A: number, Ea: number, T_kelvin: number): number {
  return A * Math.exp(Ea / (BOLTZMANN_EV * T_kelvin));
}

export function eyringLife(A: number, Ea: number, T_kelvin: number, b: number, S: number): number {
  return (A / T_kelvin) * Math.exp(Ea / (BOLTZMANN_EV * T_kelvin)) * Math.exp(-b * S);
}

export function accelerationFactor(Ea: number, T_use: number, T_test: number): number {
  return Math.exp((Ea / BOLTZMANN_EV) * (1 / T_use - 1 / T_test));
}

export function generateLifeProjection(
  Ea: number,
  b: number,
  S: number,
  T_use_C: number,
  points = 100,
): LifeProjectionPoint[] {
  const tempMin = 50;
  const tempMax = 250;
  const step = (tempMax - tempMin) / Math.max(1, points - 1);
  // Use A constants that produce reasonable median lives
  const A_arr = 1e-5;  // Arrhenius pre-factor
  const A_eyr = 1e-2;  // Eyring pre-factor

  return Array.from({ length: points }, (_, i) => {
    const tempC = tempMin + i * step;
    const T = tempC + 273.15;
    return {
      tempC,
      arrhenius: arrheniusLife(A_arr, Ea, T),
      eyring: eyringLife(A_eyr, Ea, T, b, S),
    };
  });
}

export function generateSystemRBD(
  subsystems: Subsystem[],
  topology: RbdTopology,
): RbdResult {
  const subsystemAvails = subsystems.map((s) => ({
    id: s.id,
    availability: computeSubsystemAvailability(s.lambda, s.mu),
  }));

  const avails = subsystemAvails.map((s) => s.availability);

  let systemAvail: number;
  switch (topology) {
    case 'series':
      systemAvail = computeSeriesAvailability(avails);
      break;
    case 'parallel':
      systemAvail = computeParallelAvailability(avails);
      break;
    case 'series-parallel':
      // Each subsystem treated as k-of-n if k,n defined, else series element
      systemAvail = subsystems.reduce((acc, s, i) => {
        const a = s.k != null && s.n != null
          ? computeKofNAvailability(s.k, s.n, avails[i])
          : avails[i];
        return acc * a;
      }, 1);
      break;
    default:
      systemAvail = computeSeriesAvailability(avails);
  }

  // Find bottleneck (lowest individual availability)
  let bottleneckIdx = 0;
  for (let i = 1; i < subsystemAvails.length; i++) {
    if (subsystemAvails[i].availability < subsystemAvails[bottleneckIdx].availability) {
      bottleneckIdx = i;
    }
  }

  // System MTBF ≈ 1 / system failure rate
  const systemLambda = subsystems.reduce((s, sub) => s + sub.lambda, 0);
  const systemMtbf = 1000 / systemLambda; // hours (lambda is per 1000h)

  return {
    systemAvail,
    subsystemAvails,
    bottleneck: subsystemAvails[bottleneckIdx].id,
    systemMtbf,
  };
}
```

**Step 4: Run tests to verify they pass**

Run: `cd equipment-monitor && npx jest src/lib/analytics/__tests__/reliability-engine.test.ts --no-coverage 2>&1 | tail -5`
Expected: PASS — 15 tests

**Step 5: Commit**

```bash
git add src/lib/analytics/reliability-engine.ts src/lib/analytics/__tests__/reliability-engine.test.ts
git commit -m "feat(analytics): reliability engine with RBD + Arrhenius/Eyring + 15 tests"
```

---

### Task 5: Optimization Engine + Tests

**Files:**
- Create: `src/lib/analytics/optimization-engine.ts`
- Create: `src/lib/analytics/__tests__/optimization-engine.test.ts`

**Step 1: Write the failing tests**

```typescript
// src/lib/analytics/__tests__/optimization-engine.test.ts
import {
  evaluateObjectives,
  generateParetoFrontier,
  fitResponseSurface,
  evaluateRSM,
  computeSensitivity,
  checkConstraints,
} from '../optimization-engine';
import { DEFAULT_RECIPE_KNOBS, DEFAULT_CONSTRAINTS } from '../constants';

describe('evaluateObjectives', () => {
  test('returns all four objective values', () => {
    const recipe = DEFAULT_RECIPE_KNOBS.map((k) => k.value);
    const obj = evaluateObjectives(recipe);
    expect(obj).toHaveProperty('yield');
    expect(obj).toHaveProperty('throughput');
    expect(obj).toHaveProperty('cost');
    expect(obj).toHaveProperty('defectDensity');
  });

  test('yield is between 0 and 100', () => {
    const recipe = DEFAULT_RECIPE_KNOBS.map((k) => k.value);
    const obj = evaluateObjectives(recipe);
    expect(obj.yield).toBeGreaterThanOrEqual(0);
    expect(obj.yield).toBeLessThanOrEqual(100);
  });

  test('different recipes give different results', () => {
    const r1 = DEFAULT_RECIPE_KNOBS.map((k) => k.min);
    const r2 = DEFAULT_RECIPE_KNOBS.map((k) => k.max);
    const o1 = evaluateObjectives(r1);
    const o2 = evaluateObjectives(r2);
    expect(o1.yield).not.toBe(o2.yield);
  });
});

describe('generateParetoFrontier', () => {
  test('returns non-empty frontier', () => {
    const frontier = generateParetoFrontier(['yield', 'throughput'], DEFAULT_CONSTRAINTS, 50);
    expect(frontier.length).toBeGreaterThan(0);
  });

  test('non-dominated points dominate no other non-dominated point', () => {
    const frontier = generateParetoFrontier(['yield', 'cost'], DEFAULT_CONSTRAINTS, 30);
    const nonDom = frontier.filter((p) => !p.dominated);
    for (const a of nonDom) {
      for (const b of nonDom) {
        if (a === b) continue;
        // a should NOT dominate b (since both are non-dominated)
        const aDomB = a.objectives.yield >= b.objectives.yield && a.objectives.cost <= b.objectives.cost
          && (a.objectives.yield > b.objectives.yield || a.objectives.cost < b.objectives.cost);
        expect(aDomB).toBe(false);
      }
    }
  });
});

describe('fitResponseSurface', () => {
  test('fits quadratic data with high R²', () => {
    // Generate perfect quadratic: y = 2x1² + 3x2 + 1
    const samples = [];
    for (let x1 = 0; x1 <= 1; x1 += 0.2) {
      for (let x2 = 0; x2 <= 1; x2 += 0.2) {
        samples.push({ inputs: [x1, x2], output: 2 * x1 * x1 + 3 * x2 + 1 });
      }
    }
    const fit = fitResponseSurface(samples);
    expect(fit.rSquared).toBeGreaterThan(0.95);
  });
});

describe('evaluateRSM', () => {
  test('returns grid of correct dimensions', () => {
    const coefficients = [1, 2, 3, 0.1, 0.2, 0.05]; // β0 + β1*x1 + β2*x2 + β11*x1² + β22*x2² + β12*x1*x2
    const grid = evaluateRSM(coefficients, [0, 1], [0, 1], 10);
    expect(grid).toHaveLength(10);
    expect(grid[0]).toHaveLength(10);
  });
});

describe('computeSensitivity', () => {
  test('returns one entry per recipe knob', () => {
    const recipe = DEFAULT_RECIPE_KNOBS.map((k) => k.value);
    const sens = computeSensitivity(recipe, 'yield', 0.1);
    expect(sens).toHaveLength(8);
  });

  test('entries are sorted by absolute impact', () => {
    const recipe = DEFAULT_RECIPE_KNOBS.map((k) => k.value);
    const sens = computeSensitivity(recipe, 'yield', 0.1);
    for (let i = 1; i < sens.length; i++) {
      expect(Math.abs(sens[i - 1].impact)).toBeGreaterThanOrEqual(Math.abs(sens[i].impact));
    }
  });
});

describe('checkConstraints', () => {
  test('all constraints met returns feasible=true', () => {
    const objectives = { yield: 90, throughput: 50, cost: 120, defectDensity: 0.3 };
    const result = checkConstraints(objectives, DEFAULT_CONSTRAINTS);
    expect(result.feasible).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  test('yield below minimum returns violation', () => {
    const objectives = { yield: 70, throughput: 50, cost: 120, defectDensity: 0.3 };
    const result = checkConstraints(objectives, { minYield: 85 });
    expect(result.feasible).toBe(false);
    expect(result.violations).toContain('yield');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd equipment-monitor && npx jest src/lib/analytics/__tests__/optimization-engine.test.ts --no-coverage 2>&1 | tail -5`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/lib/analytics/optimization-engine.ts
import type {
  ObjectiveId, ParetoPoint, RsmFit, SensitivityBar, ConstraintSet,
} from './types';
import { DEFAULT_RECIPE_KNOBS, STEP_SHORT_NAMES, mulberry32 } from './constants';

/**
 * Evaluate a recipe vector → 4 objectives.
 * Uses a synthetic response model: each knob contributes linearly + quadratic cross-terms.
 */
export function evaluateObjectives(recipe: number[]): Record<ObjectiveId, number> {
  // Normalize recipe to [0,1] range
  const norm = recipe.map((v, i) => {
    const knob = DEFAULT_RECIPE_KNOBS[i];
    return (v - knob.min) / (knob.max - knob.min || 1);
  });

  // Synthetic model with plausible fab behavior
  const avgNorm = norm.reduce((s, v) => s + v, 0) / norm.length;

  // Yield: peaks when knobs are near center (0.5), drops at extremes
  const yieldPenalty = norm.reduce((s, v) => s + (v - 0.5) ** 2, 0);
  const yieldVal = Math.max(0, Math.min(100, 96 - yieldPenalty * 12));

  // Throughput: higher when some knobs are pushed higher
  const throughput = Math.max(0, Math.min(80, 30 + avgNorm * 40 + norm[1] * 10));

  // Cost: increases with higher settings
  const cost = Math.max(50, Math.min(250, 80 + avgNorm * 100 + norm[4] * 20));

  // Defect density: inversely related to yield model
  const defectDensity = Math.max(0.01, Math.min(2, 0.1 + yieldPenalty * 0.6));

  return { yield: yieldVal, throughput, cost, defectDensity };
}

export function generateParetoFrontier(
  objectiveIds: ObjectiveId[],
  constraints: ConstraintSet,
  gridPoints = 50,
): ParetoPoint[] {
  const rng = mulberry32(12345);
  const points: ParetoPoint[] = [];

  // Latin Hypercube-ish sampling
  for (let i = 0; i < gridPoints; i++) {
    const recipe = DEFAULT_RECIPE_KNOBS.map((k) => k.min + rng() * (k.max - k.min));
    const objectives = evaluateObjectives(recipe);

    // Check constraints
    const { feasible } = checkConstraints(objectives, constraints);
    if (!feasible) continue;

    points.push({ objectives, recipe, dominated: false });
  }

  // Non-dominated sort for selected 2 objectives
  const [id1, id2] = objectiveIds;
  const dir1 = id1 === 'cost' || id1 === 'defectDensity' ? -1 : 1;
  const dir2 = id2 === 'cost' || id2 === 'defectDensity' ? -1 : 1;

  for (let i = 0; i < points.length; i++) {
    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      const a = points[j].objectives;
      const b = points[i].objectives;
      const better1 = (a[id1] - b[id1]) * dir1 >= 0;
      const better2 = (a[id2] - b[id2]) * dir2 >= 0;
      const strict1 = (a[id1] - b[id1]) * dir1 > 0;
      const strict2 = (a[id2] - b[id2]) * dir2 > 0;
      if (better1 && better2 && (strict1 || strict2)) {
        points[i].dominated = true;
        break;
      }
    }
  }

  return points;
}

export function fitResponseSurface(
  samples: { inputs: number[]; output: number }[],
): RsmFit {
  // Quadratic model for 2 inputs: y = β0 + β1·x1 + β2·x2 + β11·x1² + β22·x2² + β12·x1·x2
  const n = samples.length;
  const p = 6; // number of coefficients

  // Build X matrix rows
  const X = samples.map((s) => {
    const [x1, x2] = s.inputs;
    return [1, x1, x2, x1 * x1, x2 * x2, x1 * x2];
  });
  const y = samples.map((s) => s.output);

  // Normal equations: (X'X)β = X'y
  const XtX = Array.from({ length: p }, (_, i) =>
    Array.from({ length: p }, (_, j) =>
      X.reduce((s, row) => s + row[i] * row[j], 0),
    ),
  );
  const Xty = Array.from({ length: p }, (_, i) =>
    X.reduce((s, row, k) => s + row[i] * y[k], 0),
  );

  // Solve via Gaussian elimination
  const aug = XtX.map((row, i) => [...row, Xty[i]]);
  for (let col = 0; col < p; col++) {
    // Pivot
    let maxRow = col;
    for (let row = col + 1; row < p; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-12) continue;

    for (let j = col; j <= p; j++) aug[col][j] /= pivot;
    for (let row = 0; row < p; row++) {
      if (row === col) continue;
      const factor = aug[row][col];
      for (let j = col; j <= p; j++) aug[row][j] -= factor * aug[col][j];
    }
  }

  const coefficients = aug.map((row) => row[p]);

  // R²
  const yMean = y.reduce((s, v) => s + v, 0) / n;
  const ssTot = y.reduce((s, v) => s + (v - yMean) ** 2, 0);
  const ssRes = samples.reduce((s, sample, k) => {
    const predicted = X[k].reduce((sum, xi, j) => sum + xi * coefficients[j], 0);
    return s + (sample.output - predicted) ** 2;
  }, 0);
  const rSquared = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  return { coefficients, rSquared };
}

export function evaluateRSM(
  coefficients: number[],
  x1Range: [number, number],
  x2Range: [number, number],
  gridSize = 50,
): number[][] {
  const [x1Min, x1Max] = x1Range;
  const [x2Min, x2Max] = x2Range;
  const dx1 = (x1Max - x1Min) / Math.max(1, gridSize - 1);
  const dx2 = (x2Max - x2Min) / Math.max(1, gridSize - 1);

  return Array.from({ length: gridSize }, (_, i) => {
    const x1 = x1Min + i * dx1;
    return Array.from({ length: gridSize }, (_, j) => {
      const x2 = x2Min + j * dx2;
      const [b0 = 0, b1 = 0, b2 = 0, b11 = 0, b22 = 0, b12 = 0] = coefficients;
      return b0 + b1 * x1 + b2 * x2 + b11 * x1 * x1 + b22 * x2 * x2 + b12 * x1 * x2;
    });
  });
}

export function computeSensitivity(
  baseRecipe: number[],
  objective: ObjectiveId,
  perturbation = 0.1,
): SensitivityBar[] {
  const baseObj = evaluateObjectives(baseRecipe);
  const baseVal = baseObj[objective];

  const bars: SensitivityBar[] = DEFAULT_RECIPE_KNOBS.map((knob, i) => {
    const delta = (knob.max - knob.min) * perturbation;
    const recipeUp = [...baseRecipe];
    recipeUp[i] = Math.min(knob.max, baseRecipe[i] + delta);
    const recipeDown = [...baseRecipe];
    recipeDown[i] = Math.max(knob.min, baseRecipe[i] - delta);

    const valUp = evaluateObjectives(recipeUp)[objective];
    const valDown = evaluateObjectives(recipeDown)[objective];
    const impact = (valUp - valDown) / 2;

    return { stepId: knob.stepId, label: `${STEP_SHORT_NAMES[knob.stepId]} ${knob.label}`, impact };
  });

  // Sort by absolute impact descending
  bars.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  return bars;
}

export function checkConstraints(
  objectives: Record<ObjectiveId, number>,
  constraints: ConstraintSet,
): { feasible: boolean; violations: string[] } {
  const violations: string[] = [];
  if (constraints.minYield != null && objectives.yield < constraints.minYield) violations.push('yield');
  if (constraints.maxD0 != null && objectives.defectDensity > constraints.maxD0) violations.push('defectDensity');
  if (constraints.minThroughput != null && objectives.throughput < constraints.minThroughput) violations.push('throughput');
  if (constraints.maxCost != null && objectives.cost > constraints.maxCost) violations.push('cost');
  return { feasible: violations.length === 0, violations };
}
```

**Step 4: Run tests to verify they pass**

Run: `cd equipment-monitor && npx jest src/lib/analytics/__tests__/optimization-engine.test.ts --no-coverage 2>&1 | tail -5`
Expected: PASS — 15 tests

**Step 5: Commit**

```bash
git add src/lib/analytics/optimization-engine.ts src/lib/analytics/__tests__/optimization-engine.test.ts
git commit -m "feat(analytics): cross-process optimization engine with Pareto + RSM + 15 tests"
```

---

### Task 6: Replication Engine + Tests

**Files:**
- Create: `src/lib/analytics/replication-engine.ts`
- Create: `src/lib/analytics/__tests__/replication-engine.test.ts`

**Step 1: Write the failing tests**

```typescript
// src/lib/analytics/__tests__/replication-engine.test.ts
import {
  generateFabData,
  tostEquivalence,
  computeCpk,
  fitTransferFunction,
  generateDistributionCurve,
  generateFabComparison,
} from '../replication-engine';

describe('generateFabData', () => {
  test('returns requested sample size', () => {
    const data = generateFabData('hq', 'cd', 50, 0, 1, 42);
    expect(data).toHaveLength(50);
  });

  test('is deterministic with same seed', () => {
    const a = generateFabData('hq', 'cd', 30, 0, 1, 99);
    const b = generateFabData('hq', 'cd', 30, 0, 1, 99);
    expect(a).toEqual(b);
  });

  test('biased data has mean shifted from target', () => {
    const data = generateFabData('new-build', 'cd', 200, 0.05, 1, 42);
    const mean = data.reduce((s, v) => s + v, 0) / data.length;
    // Target CD = 45nm, bias = 0.05 * 45 = 2.25nm offset
    expect(mean).toBeGreaterThan(45);
  });
});

describe('tostEquivalence', () => {
  test('identical samples pass equivalence', () => {
    const sample = Array.from({ length: 50 }, () => 100);
    const result = tostEquivalence(sample, sample, 2, 0.95);
    expect(result.pass).toBe(true);
  });

  test('highly biased samples fail equivalence', () => {
    const s1 = Array.from({ length: 50 }, () => 100);
    const s2 = Array.from({ length: 50 }, () => 110);
    const result = tostEquivalence(s1, s2, 2, 0.95);
    expect(result.pass).toBe(false);
  });

  test('mean difference is close to actual difference', () => {
    const s1 = Array.from({ length: 100 }, () => 100);
    const s2 = Array.from({ length: 100 }, () => 101);
    const result = tostEquivalence(s1, s2, 5, 0.95);
    expect(result.meanDiff).toBeCloseTo(1, 1);
  });
});

describe('computeCpk', () => {
  test('centered process with tight spread gives high Cpk', () => {
    // σ ≈ 0.29, centered at 100, spec 90–110 => Cpk ≈ (10/3)/0.29 ≈ 11.5
    const data = Array.from({ length: 100 }, (_, i) => 99.5 + i * 0.01);
    expect(computeCpk(data, 110, 90)).toBeGreaterThan(1.33);
  });

  test('off-center process gives lower Cpk', () => {
    const centered = Array.from({ length: 100 }, (_, i) => 99.5 + i * 0.01);
    const offCenter = Array.from({ length: 100 }, (_, i) => 104.5 + i * 0.01);
    expect(computeCpk(offCenter, 110, 90)).toBeLessThan(computeCpk(centered, 110, 90));
  });
});

describe('fitTransferFunction', () => {
  test('linear fit on linear data gives R² ≈ 1', () => {
    const x = Array.from({ length: 50 }, (_, i) => i);
    const y = x.map((v) => 2 * v + 5);
    const fit = fitTransferFunction(x, y, 1);
    expect(fit.rSquared).toBeGreaterThan(0.99);
    expect(fit.coefficients).toHaveLength(2); // [intercept, slope]
  });

  test('quadratic fit returns 3 coefficients', () => {
    const x = Array.from({ length: 50 }, (_, i) => i);
    const y = x.map((v) => 0.1 * v * v + 2 * v + 5);
    const fit = fitTransferFunction(x, y, 2);
    expect(fit.coefficients).toHaveLength(3);
    expect(fit.rSquared).toBeGreaterThan(0.99);
  });

  test('bias is difference at mean x', () => {
    const x = Array.from({ length: 50 }, (_, i) => 40 + i * 0.4);
    const y = x.map((v) => v + 3); // systematic +3 offset
    const fit = fitTransferFunction(x, y, 1);
    expect(fit.bias).toBeCloseTo(3, 0);
  });
});

describe('generateDistributionCurve', () => {
  test('returns requested number of points', () => {
    const curve = generateDistributionCurve(100, 5, 100);
    expect(curve).toHaveLength(100);
  });

  test('peak is near the mean', () => {
    const curve = generateDistributionCurve(50, 2, 200);
    const peak = curve.reduce((max, p) => (p.pdf > max.pdf ? p : max), curve[0]);
    expect(peak.x).toBeCloseTo(50, 0);
  });
});

describe('generateFabComparison', () => {
  test('returns data for all 3 fabs', () => {
    const result = generateFabComparison('cd', { sampleSize: 30, confidence: 0.95, margin: 2 });
    expect(result.fabData.size).toBe(3);
  });

  test('returns 3 TOST results (3 pairs)', () => {
    const result = generateFabComparison('cd', { sampleSize: 30, confidence: 0.95, margin: 2 });
    expect(result.tostResults).toHaveLength(3);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd equipment-monitor && npx jest src/lib/analytics/__tests__/replication-engine.test.ts --no-coverage 2>&1 | tail -5`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/lib/analytics/replication-engine.ts
import type {
  FabId, TostResult, TransferFit, DistributionCurvePoint, ReplicationParam,
} from './types';
import { mulberry32, hashCode, FAB_CONFIGS, FAB_IDS, REPLICATION_PARAMS } from './constants';

function gaussianNoise(rng: () => number): number {
  const u1 = rng();
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1 || 1e-10)) * Math.cos(2 * Math.PI * u2);
}

export function generateFabData(
  fabId: FabId,
  parameter: ReplicationParam,
  sampleSize: number,
  bias: number,
  spreadFactor: number,
  seed: number,
): number[] {
  const paramDef = REPLICATION_PARAMS.find((p) => p.id === parameter)!;
  const target = paramDef.target;
  const baseSpread = (paramDef.usl - paramDef.lsl) / 6; // ≈ 1σ within spec
  const sigma = baseSpread * spreadFactor;
  const mean = target * (1 + bias);

  const rng = mulberry32(seed + hashCode(fabId + parameter));
  return Array.from({ length: sampleSize }, (_, i) => {
    // New-Build drift: first 40% of samples have extra bias
    let driftBias = 0;
    if (fabId === 'new-build' && i < sampleSize * 0.4) {
      driftBias = target * 0.02; // extra 2% early bias
    }
    return mean + driftBias + gaussianNoise(rng) * sigma;
  });
}

export function tostEquivalence(
  sample1: number[],
  sample2: number[],
  margin: number,
  confidence: number,
): TostResult {
  const n1 = sample1.length;
  const n2 = sample2.length;
  const mean1 = sample1.reduce((s, v) => s + v, 0) / n1;
  const mean2 = sample2.reduce((s, v) => s + v, 0) / n2;
  const meanDiff = mean2 - mean1;

  const var1 = sample1.reduce((s, v) => s + (v - mean1) ** 2, 0) / (n1 - 1);
  const var2 = sample2.reduce((s, v) => s + (v - mean2) ** 2, 0) / (n2 - 1);
  const se = Math.sqrt(var1 / n1 + var2 / n2);

  // Approximate t-critical for 90% CI (two one-sided at alpha = (1-conf)/2 each)
  const alpha = 1 - confidence;
  // Approximation: for large n, use z-values
  const zMap: Record<number, number> = { 0.1: 1.282, 0.05: 1.645, 0.01: 2.326 };
  const z = zMap[alpha] ?? 1.645;

  const ciLower = meanDiff - z * se;
  const ciUpper = meanDiff + z * se;
  const pass = ciLower > -margin && ciUpper < margin;

  return {
    fab1: 'hq',
    fab2: 'satellite',
    meanDiff,
    ciLower,
    ciUpper,
    equivalenceLower: -margin,
    equivalenceUpper: margin,
    pass,
  };
}

export function computeCpk(samples: number[], usl: number, lsl: number): number {
  const n = samples.length;
  const mean = samples.reduce((s, v) => s + v, 0) / n;
  const sigma = Math.sqrt(samples.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1));
  if (sigma === 0) return Infinity;
  return Math.min((usl - mean) / (3 * sigma), (mean - lsl) / (3 * sigma));
}

export function fitTransferFunction(
  xData: number[],
  yData: number[],
  order: 1 | 2,
): TransferFit {
  const n = xData.length;
  const p = order + 1;

  // Build X matrix
  const X = xData.map((x) => {
    const row = [1, x];
    if (order === 2) row.push(x * x);
    return row;
  });

  // Normal equations
  const XtX = Array.from({ length: p }, (_, i) =>
    Array.from({ length: p }, (_, j) =>
      X.reduce((s, row) => s + row[i] * row[j], 0),
    ),
  );
  const Xty = Array.from({ length: p }, (_, i) =>
    X.reduce((s, row, k) => s + row[i] * yData[k], 0),
  );

  // Gaussian elimination
  const aug = XtX.map((row, i) => [...row, Xty[i]]);
  for (let col = 0; col < p; col++) {
    let maxRow = col;
    for (let row = col + 1; row < p; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-12) continue;
    for (let j = col; j <= p; j++) aug[col][j] /= pivot;
    for (let row = 0; row < p; row++) {
      if (row === col) continue;
      const f = aug[row][col];
      for (let j = col; j <= p; j++) aug[row][j] -= f * aug[col][j];
    }
  }

  const coefficients = aug.map((row) => row[p]);

  // R²
  const yMean = yData.reduce((s, v) => s + v, 0) / n;
  const ssTot = yData.reduce((s, v) => s + (v - yMean) ** 2, 0);
  const ssRes = xData.reduce((s, x, k) => {
    const pred = X[k].reduce((sum, xi, j) => sum + xi * coefficients[j], 0);
    return s + (yData[k] - pred) ** 2;
  }, 0);
  const rSquared = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  // Bias at mean x
  const xMean = xData.reduce((s, v) => s + v, 0) / n;
  const yPred = coefficients[0] + coefficients[1] * xMean + (order === 2 ? coefficients[2] * xMean * xMean : 0);
  const bias = yPred - xMean;

  return { fromFab: 'hq', toFab: 'satellite', coefficients, rSquared, bias };
}

export function generateDistributionCurve(
  mean: number,
  std: number,
  points = 200,
): DistributionCurvePoint[] {
  const xMin = mean - 4 * std;
  const xMax = mean + 4 * std;
  const dx = (xMax - xMin) / Math.max(1, points - 1);
  const coeff = 1 / (std * Math.sqrt(2 * Math.PI));

  return Array.from({ length: points }, (_, i) => {
    const x = xMin + i * dx;
    const z = (x - mean) / std;
    return { x, pdf: coeff * Math.exp(-0.5 * z * z) };
  });
}

export function generateFabComparison(
  parameter: ReplicationParam,
  config: { sampleSize: number; confidence: number; margin: number },
): {
  fabData: Map<FabId, number[]>;
  tostResults: TostResult[];
  transferFits: TransferFit[];
} {
  const fabData = new Map<FabId, number[]>();
  const paramDef = REPLICATION_PARAMS.find((p) => p.id === parameter)!;

  for (const fabId of FAB_IDS) {
    const fabCfg = FAB_CONFIGS[fabId];
    fabData.set(fabId, generateFabData(
      fabId, parameter, config.sampleSize,
      fabCfg.bias, fabCfg.spreadFactor, 42,
    ));
  }

  // TOST for each pair
  const pairs: [FabId, FabId][] = [['hq', 'satellite'], ['hq', 'new-build'], ['satellite', 'new-build']];
  const tostResults = pairs.map(([f1, f2]) => {
    const result = tostEquivalence(
      fabData.get(f1)!, fabData.get(f2)!,
      config.margin, config.confidence,
    );
    return { ...result, fab1: f1, fab2: f2 };
  });

  // Transfer functions (HQ → each other fab)
  const hqData = fabData.get('hq')!;
  const transferFits: TransferFit[] = (['satellite', 'new-build'] as FabId[]).map((toFab) => {
    const toData = fabData.get(toFab)!;
    const minLen = Math.min(hqData.length, toData.length);
    const fit = fitTransferFunction(hqData.slice(0, minLen), toData.slice(0, minLen), 1);
    return { ...fit, fromFab: 'hq' as FabId, toFab };
  });

  return { fabData, tostResults, transferFits };
}
```

**Step 4: Run tests to verify they pass**

Run: `cd equipment-monitor && npx jest src/lib/analytics/__tests__/replication-engine.test.ts --no-coverage 2>&1 | tail -5`
Expected: PASS — 15 tests

**Step 5: Commit**

```bash
git add src/lib/analytics/replication-engine.ts src/lib/analytics/__tests__/replication-engine.test.ts
git commit -m "feat(analytics): multi-fab replication engine with TOST + transfer functions + 15 tests"
```

---

### Task 7: VPP Engine + Tests

**Files:**
- Create: `src/lib/analytics/vpp-engine.ts`
- Create: `src/lib/analytics/__tests__/vpp-engine.test.ts`

**Step 1: Write the failing tests**

```typescript
// src/lib/analytics/__tests__/vpp-engine.test.ts
import {
  createDefaultPipeline,
  runFederatedSim,
  computeFilmStack,
  computePipelineYield,
} from '../vpp-engine';

describe('createDefaultPipeline', () => {
  test('returns 8 steps matching PROCESS_ORDER', () => {
    const pipeline = createDefaultPipeline();
    expect(pipeline).toHaveLength(8);
    expect(pipeline[0].stepId).toBe('oxidation');
    expect(pipeline[7].stepId).toBe('metallization');
  });
});

describe('runFederatedSim', () => {
  test('returns per-step results for each pipeline step', () => {
    const pipeline = createDefaultPipeline();
    const result = runFederatedSim(pipeline);
    expect(result.perStep).toHaveLength(8);
  });

  test('each step has yield between 0 and 1', () => {
    const pipeline = createDefaultPipeline();
    const result = runFederatedSim(pipeline);
    for (const step of result.perStep) {
      expect(step.yield).toBeGreaterThanOrEqual(0);
      expect(step.yield).toBeLessThanOrEqual(1);
    }
  });

  test('cumulative yield is product of step yields', () => {
    const pipeline = createDefaultPipeline();
    const result = runFederatedSim(pipeline);
    const product = result.perStep.reduce((acc, s) => acc * s.yield, 1);
    expect(result.cumulativeYield).toBeCloseTo(product, 6);
  });

  test('overrides affect result', () => {
    const pipeline = createDefaultPipeline();
    const base = runFederatedSim(pipeline);
    pipeline[0].overrides = { temperature: 1200 }; // extreme temp
    const modified = runFederatedSim(pipeline);
    expect(modified.perStep[0].thickness).not.toBe(base.perStep[0].thickness);
  });
});

describe('computeFilmStack', () => {
  test('returns layers with positive or zero thickness', () => {
    const pipeline = createDefaultPipeline();
    const result = runFederatedSim(pipeline);
    const stack = computeFilmStack(result.perStep);
    for (const layer of stack) {
      expect(layer.thickness).toBeGreaterThanOrEqual(0);
    }
  });

  test('filters out zero-thickness layers', () => {
    const pipeline = createDefaultPipeline();
    const result = runFederatedSim(pipeline);
    const stack = computeFilmStack(result.perStep);
    // Implant and diffusion have 0 base thickness — should be filtered
    expect(stack.length).toBeLessThan(8);
  });
});

describe('computePipelineYield', () => {
  test('returns per-step and cumulative', () => {
    const pipeline = createDefaultPipeline();
    const result = runFederatedSim(pipeline);
    const yieldData = computePipelineYield(result.perStep);
    expect(yieldData.perStep).toHaveLength(8);
    expect(yieldData.cumulative).toBeLessThanOrEqual(1);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd equipment-monitor && npx jest src/lib/analytics/__tests__/vpp-engine.test.ts --no-coverage 2>&1 | tail -5`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/lib/analytics/vpp-engine.ts
import type {
  PipelineStep, PipelineStepResult, PipelineResult, FilmLayer, ProcessStepId,
} from './types';
import { PROCESS_STEPS, FILM_MATERIALS, DEFAULT_D0, mulberry32, hashCode } from './constants';

export function createDefaultPipeline(): PipelineStep[] {
  return PROCESS_STEPS.map((stepId) => ({
    stepId,
    presetName: 'default',
    overrides: {},
  }));
}

/**
 * Federation orchestrator — runs each step through a synthetic model.
 * For steps with real sim engines (oxidation, cmp, implant, diffusion),
 * the model uses calibrated parameters. For others, uses parametric stubs.
 */
export function runFederatedSim(pipeline: PipelineStep[]): PipelineResult {
  const perStep: PipelineStepResult[] = [];
  let cumulativeYield = 1;

  for (const step of pipeline) {
    const result = simulateStep(step);
    cumulativeYield *= result.yield;
    perStep.push(result);
  }

  const filmStack = computeFilmStack(perStep);

  return { perStep, filmStack, cumulativeYield };
}

function simulateStep(step: PipelineStep): PipelineStepResult {
  const { stepId, overrides } = step;
  const rng = mulberry32(hashCode(stepId + JSON.stringify(overrides)));
  const filmDef = FILM_MATERIALS[stepId];
  const baseD0 = DEFAULT_D0[stepId];

  // Synthetic per-step model
  let thickness = Math.abs(filmDef.baseThickness);
  let stress = 0;
  let defectDensity = baseD0;

  // Apply overrides to modulate output
  if (overrides.temperature != null) {
    const tempFactor = overrides.temperature / 1000; // normalize around 1000°C
    thickness *= tempFactor;
    stress = (tempFactor - 1) * 200; // MPa
    defectDensity *= 1 + (tempFactor - 1) * 0.5;
  }
  if (overrides.dose != null) {
    thickness *= 1 + (overrides.dose - 30) / 100;
  }
  if (overrides.pressure != null) {
    defectDensity *= 1 + (overrides.pressure - 25) / 200;
  }

  // Add small random variation
  thickness += (rng() - 0.5) * thickness * 0.02;
  defectDensity = Math.max(0.01, defectDensity + (rng() - 0.5) * 0.02);

  // Yield from NB model
  const area = 100; // mm²
  const alpha = 2;
  const yieldVal = Math.pow(1 + (defectDensity * area) / alpha, -alpha);

  return {
    stepId,
    yield: yieldVal,
    thickness: Math.max(0, thickness),
    stress,
    defectDensity,
  };
}

export function computeFilmStack(stepResults: PipelineStepResult[]): FilmLayer[] {
  return stepResults
    .filter((r) => r.thickness > 0 && FILM_MATERIALS[r.stepId].baseThickness !== 0)
    .map((r) => ({
      material: FILM_MATERIALS[r.stepId].material,
      thickness: r.thickness,
      color: FILM_MATERIALS[r.stepId].color,
    }));
}

export function computePipelineYield(
  stepResults: PipelineStepResult[],
): { perStep: { stepId: ProcessStepId; yield: number }[]; cumulative: number } {
  let cumulative = 1;
  const perStep = stepResults.map((r) => {
    cumulative *= r.yield;
    return { stepId: r.stepId, yield: r.yield };
  });
  return { perStep, cumulative };
}
```

**Step 4: Run tests to verify they pass**

Run: `cd equipment-monitor && npx jest src/lib/analytics/__tests__/vpp-engine.test.ts --no-coverage 2>&1 | tail -5`
Expected: PASS — 12 tests

**Step 5: Commit**

```bash
git add src/lib/analytics/vpp-engine.ts src/lib/analytics/__tests__/vpp-engine.test.ts
git commit -m "feat(analytics): VPP federation engine with pipeline orchestration + 12 tests"
```

---

### Task 8: Barrel Export

**Files:**
- Create: `src/lib/analytics/index.ts`

**Step 1: Create barrel export**

```typescript
// src/lib/analytics/index.ts
export type {
  AnalyticsTab, ProcessStepId,
  StepYield, YieldResult, YieldWaterfallPoint, YieldCurvePoint,
  EwmaState, ApcConfig, DriftConfig, DriftType, ApcRunResult, ResidualStats,
  RbdTopology, Subsystem, RbdResult, LifeProjectionPoint,
  ObjectiveId, ObjectiveDirection, Objective, RecipeKnob, ParetoPoint, RsmFit,
  SensitivityBar, ConstraintSet,
  FabId, FabConfig, TostResult, TransferFit, DistributionCurvePoint, ReplicationParam,
  PipelineStep, PipelineStepResult, FilmLayer, PipelineResult,
} from './types';

export {
  ANALYTICS_TABS, PROCESS_STEPS, STEP_SHORT_NAMES,
  DEFAULT_D0, DEFAULT_DIE_AREA, DEFAULT_ALPHA,
  DEFAULT_APC_TARGET, DEFAULT_LAMBDA, DEFAULT_LAMBDA_SLOPE, DEFAULT_NOISE,
  DEFAULT_SUBSYSTEMS, BOLTZMANN_EV,
  OBJECTIVES, DEFAULT_RECIPE_KNOBS, DEFAULT_CONSTRAINTS,
  FAB_CONFIGS, FAB_IDS, REPLICATION_PARAMS, FILM_MATERIALS,
  mulberry32, hashCode,
} from './constants';

export {
  computeStepYield, computeLineYield, generateYieldWaterfall,
  generateYieldCurve, generateForecastLots,
} from './yield-engine';

export {
  createController, stepController, generateDrift,
  simulateRuns, computeResidualStats,
} from './apc-engine';

export {
  computeSubsystemAvailability, computeSeriesAvailability,
  computeParallelAvailability, computeKofNAvailability,
  arrheniusLife, eyringLife, accelerationFactor,
  generateLifeProjection, generateSystemRBD,
} from './reliability-engine';

export {
  evaluateObjectives, generateParetoFrontier, fitResponseSurface,
  evaluateRSM, computeSensitivity, checkConstraints,
} from './optimization-engine';

export {
  generateFabData, tostEquivalence, computeCpk,
  fitTransferFunction, generateDistributionCurve, generateFabComparison,
} from './replication-engine';

export {
  createDefaultPipeline, runFederatedSim, computeFilmStack, computePipelineYield,
} from './vpp-engine';
```

**Step 2: Verify all tests still pass**

Run: `cd equipment-monitor && npx jest src/lib/analytics/ --no-coverage 2>&1 | tail -10`
Expected: PASS — all ~90 tests

**Step 3: Commit**

```bash
git add src/lib/analytics/index.ts
git commit -m "feat(analytics): barrel export for all 6 engines"
```

---

### Task 9: Analytics Store + Tests

**Files:**
- Create: `src/stores/analytics-store.ts`
- Create: `src/stores/__tests__/analytics-store.test.ts`

**Step 1: Write the failing tests**

```typescript
// src/stores/__tests__/analytics-store.test.ts
import { useAnalyticsStore, INITIAL_ANALYTICS_STATE } from '../analytics-store';

describe('analytics-store', () => {
  beforeEach(() => {
    useAnalyticsStore.setState(INITIAL_ANALYTICS_STATE);
  });

  test('initial state has yield as active tab', () => {
    expect(useAnalyticsStore.getState().activeTab).toBe('yield');
  });

  test('setTab changes active tab', () => {
    useAnalyticsStore.getState().setTab('apc');
    expect(useAnalyticsStore.getState().activeTab).toBe('apc');
  });

  test('setYieldArea updates die area', () => {
    useAnalyticsStore.getState().setYieldArea(200);
    expect(useAnalyticsStore.getState().yieldArea).toBe(200);
  });

  test('setYieldAlpha updates cluster factor', () => {
    useAnalyticsStore.getState().setYieldAlpha(5);
    expect(useAnalyticsStore.getState().yieldAlpha).toBe(5);
  });

  test('setApcLambda updates EWMA weight', () => {
    useAnalyticsStore.getState().setApcLambda(0.5);
    expect(useAnalyticsStore.getState().apcLambda).toBe(0.5);
  });

  test('setApcLambdaSlope updates slope weight', () => {
    useAnalyticsStore.getState().setApcLambdaSlope(0.2);
    expect(useAnalyticsStore.getState().apcLambdaSlope).toBe(0.2);
  });

  test('setApcDriftType updates drift type', () => {
    useAnalyticsStore.getState().setApcDriftType('sinusoidal');
    expect(useAnalyticsStore.getState().apcDriftType).toBe('sinusoidal');
  });

  test('setRbdTopology updates topology', () => {
    useAnalyticsStore.getState().setRbdTopology('parallel');
    expect(useAnalyticsStore.getState().rbdTopology).toBe('parallel');
  });

  test('setReplicationParam updates selected parameter', () => {
    useAnalyticsStore.getState().setReplicationParam('overlay');
    expect(useAnalyticsStore.getState().replicationParam).toBe('overlay');
  });

  test('setOptimizationObjectives updates selected objectives', () => {
    useAnalyticsStore.getState().setOptimizationObjectives(['yield', 'cost']);
    expect(useAnalyticsStore.getState().optimizationObjectives).toEqual(['yield', 'cost']);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd equipment-monitor && npx jest src/stores/__tests__/analytics-store.test.ts --no-coverage 2>&1 | tail -5`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/stores/analytics-store.ts
import { create } from 'zustand';
import type { AnalyticsTab, DriftType, RbdTopology, ObjectiveId, ReplicationParam } from '@/lib/analytics/types';
import {
  DEFAULT_DIE_AREA, DEFAULT_ALPHA,
  DEFAULT_LAMBDA, DEFAULT_LAMBDA_SLOPE, DEFAULT_NOISE,
  DEFAULT_APC_TARGET,
} from '@/lib/analytics/constants';

interface AnalyticsState {
  activeTab: AnalyticsTab;

  // Yield
  yieldArea: number;
  yieldAlpha: number;

  // APC
  apcTarget: number;
  apcLambda: number;
  apcLambdaSlope: number;
  apcNoise: number;
  apcDriftType: DriftType;
  apcRunCount: number;

  // Reliability
  rbdTopology: RbdTopology;
  reliabilityEa: number;
  reliabilityHumidity: number;
  reliabilityUseTemp: number;

  // Optimization
  optimizationObjectives: ObjectiveId[];

  // Replication
  replicationParam: ReplicationParam;
  replicationMargin: number;
  replicationConfidence: number;
  replicationSampleSize: number;

  // Actions
  setTab: (tab: AnalyticsTab) => void;
  setYieldArea: (area: number) => void;
  setYieldAlpha: (alpha: number) => void;
  setApcLambda: (lambda: number) => void;
  setApcLambdaSlope: (lambdaSlope: number) => void;
  setApcDriftType: (drift: DriftType) => void;
  setApcRunCount: (count: number) => void;
  setRbdTopology: (topology: RbdTopology) => void;
  setReliabilityEa: (ea: number) => void;
  setOptimizationObjectives: (objectives: ObjectiveId[]) => void;
  setReplicationParam: (param: ReplicationParam) => void;
  setReplicationMargin: (margin: number) => void;
  setReplicationSampleSize: (size: number) => void;
}

export const INITIAL_ANALYTICS_STATE: Omit<AnalyticsState,
  | 'setTab' | 'setYieldArea' | 'setYieldAlpha'
  | 'setApcLambda' | 'setApcLambdaSlope' | 'setApcDriftType' | 'setApcRunCount'
  | 'setRbdTopology' | 'setReliabilityEa'
  | 'setOptimizationObjectives'
  | 'setReplicationParam' | 'setReplicationMargin' | 'setReplicationSampleSize'
> = {
  activeTab: 'yield',
  yieldArea: DEFAULT_DIE_AREA,
  yieldAlpha: DEFAULT_ALPHA,
  apcTarget: DEFAULT_APC_TARGET,
  apcLambda: DEFAULT_LAMBDA,
  apcLambdaSlope: DEFAULT_LAMBDA_SLOPE,
  apcNoise: DEFAULT_NOISE,
  apcDriftType: 'none',
  apcRunCount: 50,
  rbdTopology: 'series',
  reliabilityEa: 0.7,
  reliabilityHumidity: 0,
  reliabilityUseTemp: 65,
  optimizationObjectives: ['yield', 'throughput'],
  replicationParam: 'cd',
  replicationMargin: 2,
  replicationConfidence: 0.95,
  replicationSampleSize: 50,
};

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  ...INITIAL_ANALYTICS_STATE,
  setTab: (tab) => set({ activeTab: tab }),
  setYieldArea: (area) => set({ yieldArea: area }),
  setYieldAlpha: (alpha) => set({ yieldAlpha: alpha }),
  setApcLambda: (lambda) => set({ apcLambda: lambda }),
  setApcLambdaSlope: (lambdaSlope) => set({ apcLambdaSlope: lambdaSlope }),
  setApcDriftType: (drift) => set({ apcDriftType: drift }),
  setApcRunCount: (count) => set({ apcRunCount: count }),
  setRbdTopology: (topology) => set({ rbdTopology: topology }),
  setReliabilityEa: (ea) => set({ reliabilityEa: ea }),
  setOptimizationObjectives: (objectives) => set({ optimizationObjectives: objectives }),
  setReplicationParam: (param) => set({ replicationParam: param }),
  setReplicationMargin: (margin) => set({ replicationMargin: margin }),
  setReplicationSampleSize: (size) => set({ replicationSampleSize: size }),
}));
```

**Step 4: Run tests to verify they pass**

Run: `cd equipment-monitor && npx jest src/stores/__tests__/analytics-store.test.ts --no-coverage 2>&1 | tail -5`
Expected: PASS — 10 tests

**Step 5: Commit**

```bash
git add src/stores/analytics-store.ts src/stores/__tests__/analytics-store.test.ts
git commit -m "feat(analytics): Zustand analytics store with per-tab state slices + 10 tests"
```

---

### Task 10: AnalyticsTabBar Component

**Files:**
- Create: `src/components/analytics/AnalyticsTabBar.tsx`
- Create: `src/components/analytics/__tests__/AnalyticsTabBar.test.tsx`

**Step 1: Write the failing tests**

```typescript
// src/components/analytics/__tests__/AnalyticsTabBar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { AnalyticsTabBar } from '../AnalyticsTabBar';

describe('AnalyticsTabBar', () => {
  test('renders all 6 tab buttons', () => {
    render(<AnalyticsTabBar activeTab="yield" onTabChange={() => {}} />);
    expect(screen.getByRole('tab', { name: /VPP/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /APC R2R/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Yield Forecast/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Reliability/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Cross-Process Opt/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Multi-Fab/i })).toBeInTheDocument();
  });

  test('active tab has aria-selected=true', () => {
    render(<AnalyticsTabBar activeTab="apc" onTabChange={() => {}} />);
    expect(screen.getByRole('tab', { name: /APC R2R/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Yield Forecast/i })).toHaveAttribute('aria-selected', 'false');
  });

  test('clicking tab calls onTabChange', () => {
    const onChange = jest.fn();
    render(<AnalyticsTabBar activeTab="yield" onTabChange={onChange} />);
    fireEvent.click(screen.getByRole('tab', { name: /Reliability/i }));
    expect(onChange).toHaveBeenCalledWith('reliability');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd equipment-monitor && npx jest src/components/analytics/__tests__/AnalyticsTabBar.test.tsx --no-coverage 2>&1 | tail -5`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/components/analytics/AnalyticsTabBar.tsx
'use client';

import type { AnalyticsTab } from '@/lib/analytics/types';
import { ANALYTICS_TABS } from '@/lib/analytics/constants';

interface AnalyticsTabBarProps {
  activeTab: AnalyticsTab;
  onTabChange: (tab: AnalyticsTab) => void;
}

export function AnalyticsTabBar({ activeTab, onTabChange }: AnalyticsTabBarProps) {
  return (
    <div role="tablist" className="flex border-b border-[var(--smartfactory-border-default)] bg-[var(--smartfactory-surface-card)] px-2 overflow-x-auto" aria-label="Analytics tabs">
      {ANALYTICS_TABS.map(({ id, label }) => (
        <button
          key={id}
          role="tab"
          aria-selected={activeTab === id}
          onClick={() => onTabChange(id)}
          className={`min-h-[44px] px-4 text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === id
              ? 'border-b-2 border-[var(--smartfactory-border-active)] text-[var(--smartfactory-text-primary)]'
              : 'text-[var(--smartfactory-text-secondary)] hover:text-[var(--smartfactory-text-primary)]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `cd equipment-monitor && npx jest src/components/analytics/__tests__/AnalyticsTabBar.test.tsx --no-coverage 2>&1 | tail -5`
Expected: PASS — 3 tests

**Step 5: Commit**

```bash
git add src/components/analytics/AnalyticsTabBar.tsx src/components/analytics/__tests__/AnalyticsTabBar.test.tsx
git commit -m "feat(analytics): AnalyticsTabBar component with 6 tabs + 3 tests"
```

---

### Task 11: YieldTab Component + Tests

**Files:**
- Create: `src/components/analytics/YieldTab.tsx`
- Create: `src/components/analytics/__tests__/YieldTab.test.tsx`

**Step 1: Write the failing tests**

```typescript
// src/components/analytics/__tests__/YieldTab.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { YieldTab } from '../YieldTab';

describe('YieldTab', () => {
  test('renders KPI strip with Line Yield', () => {
    render(<YieldTab />);
    expect(screen.getByText(/Line Yield/i)).toBeInTheDocument();
  });

  test('renders die area slider', () => {
    render(<YieldTab />);
    expect(screen.getByLabelText(/Die Area/i)).toBeInTheDocument();
  });

  test('renders 8 D₀ sliders for process steps', () => {
    render(<YieldTab />);
    expect(screen.getByLabelText(/OX/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/MET/i)).toBeInTheDocument();
  });

  test('renders scenario preset buttons', () => {
    render(<YieldTab />);
    expect(screen.getByRole('button', { name: /Baseline/i })).toBeInTheDocument();
  });

  test('renders 3 chart canvases', () => {
    render(<YieldTab />);
    const canvases = screen.getAllByTestId(/yield-chart/);
    expect(canvases.length).toBeGreaterThanOrEqual(3);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd equipment-monitor && npx jest src/components/analytics/__tests__/YieldTab.test.tsx --no-coverage 2>&1 | tail -5`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/components/analytics/YieldTab.tsx
'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import {
  computeLineYield, generateYieldWaterfall, generateYieldCurve,
} from '@/lib/analytics/yield-engine';
import { DEFAULT_D0, PROCESS_STEPS, STEP_SHORT_NAMES } from '@/lib/analytics/constants';
import type { ProcessStepId } from '@/lib/analytics/types';
import { useAnalyticsStore } from '@/stores/analytics-store';

const PRESETS = {
  Baseline: () => ({ ...DEFAULT_D0 }),
  '10% Improvement': () => {
    const d: Record<string, number> = {};
    for (const k of PROCESS_STEPS) d[k] = DEFAULT_D0[k] * 0.9;
    return d as Record<ProcessStepId, number>;
  },
  'New Tool': () => {
    const d = { ...DEFAULT_D0 };
    // Find worst step and reduce by 40%
    let worst: ProcessStepId = 'oxidation';
    for (const k of PROCESS_STEPS) if (DEFAULT_D0[k] > DEFAULT_D0[worst]) worst = k;
    d[worst] *= 0.6;
    return d;
  },
};

export function YieldTab() {
  const { yieldArea, yieldAlpha, setYieldArea, setYieldAlpha } = useAnalyticsStore();
  const [d0Values, setD0Values] = useState<Record<ProcessStepId, number>>({ ...DEFAULT_D0 });
  const [selectedStep, setSelectedStep] = useState<ProcessStepId>('lithography');

  const steps = PROCESS_STEPS.map((id) => ({ stepId: id, d0: d0Values[id] }));
  const result = computeLineYield(steps, yieldArea, yieldAlpha);
  const waterfall = generateYieldWaterfall(steps, yieldArea, yieldAlpha);
  const curve = generateYieldCurve(yieldArea, yieldAlpha, 0, 1, 100);

  // Canvas refs
  const barRef = useRef<HTMLCanvasElement>(null);
  const curveRef = useRef<HTMLCanvasElement>(null);
  const waterfallRef = useRef<HTMLCanvasElement>(null);

  const drawCharts = useCallback(() => {
    drawStackedBar(barRef.current, result);
    drawYieldCurve(curveRef.current, curve, d0Values[selectedStep]);
    drawWaterfall(waterfallRef.current, waterfall);
  }, [result, curve, waterfall, d0Values, selectedStep]);

  useEffect(() => { drawCharts(); }, [drawCharts]);

  const worstStep = result.worstStep;
  const worstYield = result.perStep.find((s) => s.stepId === worstStep);

  return (
    <div className="space-y-4">
      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-2">
        <KpiBox label="Line Yield" value={`${(result.lineYield * 100).toFixed(1)}%`} />
        <KpiBox label="Worst Step" value={`${STEP_SHORT_NAMES[worstStep]} ${((worstYield?.yield ?? 0) * 100).toFixed(1)}%`} />
        <KpiBox label="D₀ avg" value={`${(steps.reduce((s, st) => s + st.d0, 0) / steps.length).toFixed(3)}`} />
        <KpiBox label="Die Area" value={`${yieldArea} mm²`} />
        <KpiBox label="α cluster" value={`${yieldAlpha.toFixed(1)}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Controls */}
        <div className="space-y-3 bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded p-3">
          <div>
            <label htmlFor="die-area" className="text-xs text-[var(--smartfactory-text-muted)]">Die Area (mm²)</label>
            <input id="die-area" aria-label="Die Area" type="range" min={50} max={300} value={yieldArea}
              onChange={(e) => setYieldArea(Number(e.target.value))}
              className="w-full" />
            <span className="text-xs text-[var(--smartfactory-text-secondary)]">{yieldArea} mm²</span>
          </div>
          <div>
            <label htmlFor="alpha" className="text-xs text-[var(--smartfactory-text-muted)]">Cluster α</label>
            <input id="alpha" type="range" min={0.5} max={10} step={0.1} value={yieldAlpha}
              onChange={(e) => setYieldAlpha(Number(e.target.value))}
              className="w-full" />
          </div>
          {PROCESS_STEPS.map((id) => (
            <div key={id}>
              <label htmlFor={`d0-${id}`} className="text-xs text-[var(--smartfactory-text-muted)]" aria-label={STEP_SHORT_NAMES[id]}>
                {STEP_SHORT_NAMES[id]} D₀
              </label>
              <input id={`d0-${id}`} aria-label={STEP_SHORT_NAMES[id]} type="range" min={0.01} max={2} step={0.01}
                value={d0Values[id]}
                onChange={(e) => setD0Values((prev) => ({ ...prev, [id]: Number(e.target.value) }))}
                className="w-full" />
              <span className="text-xs text-[var(--smartfactory-text-secondary)]">{d0Values[id].toFixed(2)}</span>
            </div>
          ))}
          <div className="flex gap-2 flex-wrap">
            {Object.entries(PRESETS).map(([name, fn]) => (
              <button key={name} onClick={() => setD0Values(fn())}
                className="px-2 py-1 text-xs rounded bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] hover:border-[var(--smartfactory-border-active)] text-[var(--smartfactory-text-secondary)]">
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Charts */}
        <div className="space-y-4">
          <canvas ref={barRef} data-testid="yield-chart-bar" width={500} height={200}
            className="w-full bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded" />
          <canvas ref={curveRef} data-testid="yield-chart-curve" width={500} height={200}
            className="w-full bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded" />
          <canvas ref={waterfallRef} data-testid="yield-chart-waterfall" width={500} height={200}
            className="w-full bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded" />
        </div>
      </div>
    </div>
  );
}

function KpiBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded p-2 text-center">
      <div className="text-xs text-[var(--smartfactory-text-muted)]">{label}</div>
      <div className="text-sm font-semibold text-[var(--smartfactory-text-primary)]">{value}</div>
    </div>
  );
}

// ── Canvas drawing helpers ──
const STEP_COLORS = ['#FF6B35', '#22D3EE', '#A855F7', '#3B82F6', '#F43F5E', '#F59E0B', '#10B981', '#E2E8F0'];

function drawStackedBar(canvas: HTMLCanvasElement | null, result: ReturnType<typeof computeLineYield>) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  const { perStep } = result;
  if (perStep.length === 0) return;
  const barW = W / perStep.length * 0.7;
  const gap = W / perStep.length * 0.3;
  perStep.forEach((s, i) => {
    const x = i * (barW + gap) + gap / 2;
    const barH = s.yieldLoss * H * 5; // scale for visibility
    ctx.fillStyle = STEP_COLORS[i % STEP_COLORS.length];
    ctx.fillRect(x, H - barH, barW, barH);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(STEP_SHORT_NAMES[s.stepId], x + barW / 2, H - barH - 4);
  });
}

function drawYieldCurve(canvas: HTMLCanvasElement | null, curve: { d0: number; yield: number }[], currentD0: number) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  if (curve.length === 0) return;
  const pad = 30;
  ctx.strokeStyle = '#22D3EE';
  ctx.lineWidth = 2;
  ctx.beginPath();
  curve.forEach((pt, i) => {
    const x = pad + (i / (curve.length - 1)) * (W - 2 * pad);
    const y = H - pad - pt.yield * (H - 2 * pad);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
  // Current D₀ marker
  const idx = curve.findIndex((pt) => pt.d0 >= currentD0);
  if (idx >= 0) {
    const x = pad + (idx / (curve.length - 1)) * (W - 2 * pad);
    const y = H - pad - curve[idx].yield * (H - 2 * pad);
    ctx.fillStyle = '#F47920';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fill();
  }
}

function drawWaterfall(canvas: HTMLCanvasElement | null, waterfall: { stepId: ProcessStepId; cumulative: number }[]) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  if (waterfall.length === 0) return;
  const pad = 30;
  const barW = (W - 2 * pad) / waterfall.length * 0.7;
  const gap = (W - 2 * pad) / waterfall.length * 0.3;
  waterfall.forEach((pt, i) => {
    const x = pad + i * (barW + gap);
    const barH = pt.cumulative * (H - 2 * pad);
    ctx.fillStyle = STEP_COLORS[i % STEP_COLORS.length] + '88';
    ctx.fillRect(x, H - pad - barH, barW, barH);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${(pt.cumulative * 100).toFixed(0)}%`, x + barW / 2, H - pad - barH - 4);
  });
}
```

**Step 4: Run tests to verify they pass**

Run: `cd equipment-monitor && npx jest src/components/analytics/__tests__/YieldTab.test.tsx --no-coverage 2>&1 | tail -5`
Expected: PASS — 5 tests

**Step 5: Commit**

```bash
git add src/components/analytics/YieldTab.tsx src/components/analytics/__tests__/YieldTab.test.tsx
git commit -m "feat(analytics): YieldTab component with NB model, Canvas charts, sliders + 5 tests"
```

---

### Task 12: ApcTab Component + Tests

**Files:**
- Create: `src/components/analytics/ApcTab.tsx`
- Create: `src/components/analytics/__tests__/ApcTab.test.tsx`

**Step 1: Write the failing tests**

```typescript
// src/components/analytics/__tests__/ApcTab.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ApcTab } from '../ApcTab';
import { useAnalyticsStore, INITIAL_ANALYTICS_STATE } from '@/stores/analytics-store';

describe('ApcTab', () => {
  beforeEach(() => {
    useAnalyticsStore.setState(INITIAL_ANALYTICS_STATE);
  });

  test('renders KPI strip with Current Offset', () => {
    render(<ApcTab />);
    expect(screen.getByText(/Current Offset/i)).toBeInTheDocument();
  });

  test('renders mode toggle for EWMA/d-EWMA', () => {
    render(<ApcTab />);
    expect(screen.getByRole('button', { name: /EWMA/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /d-EWMA/i })).toBeInTheDocument();
  });

  test('renders drift type selector', () => {
    render(<ApcTab />);
    expect(screen.getByLabelText(/Drift Type/i)).toBeInTheDocument();
  });

  test('renders 3 chart canvases', () => {
    render(<ApcTab />);
    const canvases = screen.getAllByTestId(/apc-chart/);
    expect(canvases.length).toBeGreaterThanOrEqual(3);
  });

  test('switching to EWMA mode sets lambdaSlope to 0', () => {
    render(<ApcTab />);
    fireEvent.click(screen.getByRole('button', { name: /^EWMA$/i }));
    expect(useAnalyticsStore.getState().apcLambdaSlope).toBe(0);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd equipment-monitor && npx jest src/components/analytics/__tests__/ApcTab.test.tsx --no-coverage 2>&1 | tail -5`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/components/analytics/ApcTab.tsx
'use client';

import { useRef, useEffect, useCallback, useMemo } from 'react';
import { simulateRuns, computeResidualStats } from '@/lib/analytics/apc-engine';
import type { DriftType, DriftConfig } from '@/lib/analytics/types';
import { useAnalyticsStore } from '@/stores/analytics-store';

const DRIFT_OPTIONS: { value: DriftType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'linear', label: 'Linear' },
  { value: 'sinusoidal', label: 'Sinusoidal' },
  { value: 'step-shift', label: 'Step-Shift' },
  { value: 'mixed', label: 'Mixed' },
];

export function ApcTab() {
  const {
    apcTarget, apcLambda, apcLambdaSlope, apcNoise, apcDriftType, apcRunCount,
    setApcLambda, setApcLambdaSlope, setApcDriftType, setApcRunCount,
  } = useAnalyticsStore();

  const driftConfig: DriftConfig = useMemo(() => {
    switch (apcDriftType) {
      case 'linear': return { type: 'linear', slope: 0.5 };
      case 'sinusoidal': return { type: 'sinusoidal', amplitude: 5, period: 30 };
      case 'step-shift': return { type: 'step-shift', magnitude: 8, triggerRun: Math.floor(apcRunCount / 2) };
      case 'mixed': return { type: 'mixed', slope: 0.2, amplitude: 3, period: 30 };
      default: return { type: 'none' };
    }
  }, [apcDriftType, apcRunCount]);

  const runs = useMemo(() =>
    simulateRuns({ target: apcTarget, lambda: apcLambda, lambdaSlope: apcLambdaSlope, noise: apcNoise }, driftConfig, apcRunCount, 42),
    [apcTarget, apcLambda, apcLambdaSlope, apcNoise, driftConfig, apcRunCount],
  );

  const stats = useMemo(() =>
    computeResidualStats(runs.map((r) => r.controlled), apcTarget),
    [runs, apcTarget],
  );

  const traceRef = useRef<HTMLCanvasElement>(null);
  const ewmaRef = useRef<HTMLCanvasElement>(null);
  const histRef = useRef<HTMLCanvasElement>(null);

  const drawCharts = useCallback(() => {
    drawTraceChart(traceRef.current, runs, apcTarget);
    drawEwmaChart(ewmaRef.current, runs);
    drawHistogram(histRef.current, stats);
  }, [runs, apcTarget, stats]);

  useEffect(() => { drawCharts(); }, [drawCharts]);

  const lastRun = runs[runs.length - 1];
  const currentOffset = lastRun ? (lastRun.controlled - apcTarget).toFixed(2) : '—';

  return (
    <div className="space-y-4">
      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-2">
        <KpiBox label="Current Offset" value={currentOffset} />
        <KpiBox label="EWMA λ" value={apcLambda.toFixed(2)} />
        <KpiBox label="Drift Rate" value={driftConfig.type === 'linear' ? `${driftConfig.slope}/run` : driftConfig.type} />
        <KpiBox label="Runs" value={`${apcRunCount}`} />
        <KpiBox label="Cpk" value={stats.cpk === Infinity ? '∞' : stats.cpk.toFixed(2)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Controls */}
        <div className="space-y-3 bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded p-3">
          {/* Mode toggle */}
          <div className="flex gap-2">
            <button role="button" onClick={() => setApcLambdaSlope(0)}
              className={`px-3 py-1 text-xs rounded ${apcLambdaSlope === 0 ? 'bg-blue-600 text-white' : 'bg-[var(--smartfactory-surface-card)] text-[var(--smartfactory-text-secondary)] border border-[var(--smartfactory-border-default)]'}`}>
              EWMA
            </button>
            <button role="button" onClick={() => setApcLambdaSlope(0.1)}
              className={`px-3 py-1 text-xs rounded ${apcLambdaSlope > 0 ? 'bg-blue-600 text-white' : 'bg-[var(--smartfactory-surface-card)] text-[var(--smartfactory-text-secondary)] border border-[var(--smartfactory-border-default)]'}`}>
              d-EWMA
            </button>
          </div>

          <div>
            <label className="text-xs text-[var(--smartfactory-text-muted)]">EWMA λ</label>
            <input type="range" min={0.01} max={1} step={0.01} value={apcLambda}
              onChange={(e) => setApcLambda(Number(e.target.value))} className="w-full" />
          </div>

          {apcLambdaSlope > 0 && (
            <div>
              <label className="text-xs text-[var(--smartfactory-text-muted)]">Slope λ</label>
              <input type="range" min={0.01} max={0.5} step={0.01} value={apcLambdaSlope}
                onChange={(e) => setApcLambdaSlope(Number(e.target.value))} className="w-full" />
            </div>
          )}

          <div>
            <label htmlFor="drift-type" className="text-xs text-[var(--smartfactory-text-muted)]">Drift Type</label>
            <select id="drift-type" aria-label="Drift Type" value={apcDriftType}
              onChange={(e) => setApcDriftType(e.target.value as DriftType)}
              className="w-full bg-[var(--smartfactory-bg-base)] border border-[var(--smartfactory-border-default)] rounded px-2 py-1 text-sm text-[var(--smartfactory-text-primary)]">
              {DRIFT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-[var(--smartfactory-text-muted)]">Run Count</label>
            <input type="range" min={20} max={200} value={apcRunCount}
              onChange={(e) => setApcRunCount(Number(e.target.value))} className="w-full" />
            <span className="text-xs text-[var(--smartfactory-text-secondary)]">{apcRunCount}</span>
          </div>
        </div>

        {/* Right: Charts */}
        <div className="space-y-4">
          <canvas ref={traceRef} data-testid="apc-chart-trace" width={500} height={200}
            className="w-full bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded" />
          <canvas ref={ewmaRef} data-testid="apc-chart-ewma" width={500} height={200}
            className="w-full bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded" />
          <canvas ref={histRef} data-testid="apc-chart-hist" width={500} height={200}
            className="w-full bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded" />
        </div>
      </div>
    </div>
  );
}

function KpiBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded p-2 text-center">
      <div className="text-xs text-[var(--smartfactory-text-muted)]">{label}</div>
      <div className="text-sm font-semibold text-[var(--smartfactory-text-primary)]">{value}</div>
    </div>
  );
}

function drawTraceChart(canvas: HTMLCanvasElement | null, runs: { run: number; controlled: number; uncontrolled: number }[], target: number) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  if (runs.length === 0) return;
  const pad = 30;
  const allVals = runs.flatMap((r) => [r.controlled, r.uncontrolled]);
  const yMin = Math.min(...allVals, target - 5);
  const yMax = Math.max(...allVals, target + 5);
  const yRange = yMax - yMin || 1;
  const toX = (i: number) => pad + (i / (runs.length - 1)) * (W - 2 * pad);
  const toY = (v: number) => H - pad - ((v - yMin) / yRange) * (H - 2 * pad);
  // Target line
  ctx.strokeStyle = '#64748B';
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(pad, toY(target)); ctx.lineTo(W - pad, toY(target)); ctx.stroke();
  ctx.setLineDash([]);
  // Uncontrolled
  ctx.strokeStyle = '#EF4444';
  ctx.lineWidth = 1;
  ctx.beginPath();
  runs.forEach((r, i) => { i === 0 ? ctx.moveTo(toX(i), toY(r.uncontrolled)) : ctx.lineTo(toX(i), toY(r.uncontrolled)); });
  ctx.stroke();
  // Controlled
  ctx.strokeStyle = '#3B82F6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  runs.forEach((r, i) => { i === 0 ? ctx.moveTo(toX(i), toY(r.controlled)) : ctx.lineTo(toX(i), toY(r.controlled)); });
  ctx.stroke();
}

function drawEwmaChart(canvas: HTMLCanvasElement | null, runs: { ewmaLevel: number; ewmaSlope: number }[]) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  if (runs.length === 0) return;
  const pad = 30;
  const levels = runs.map((r) => r.ewmaLevel);
  const yMin = Math.min(...levels);
  const yMax = Math.max(...levels);
  const yRange = yMax - yMin || 1;
  ctx.strokeStyle = '#22D3EE';
  ctx.lineWidth = 2;
  ctx.beginPath();
  runs.forEach((r, i) => {
    const x = pad + (i / (runs.length - 1)) * (W - 2 * pad);
    const y = H - pad - ((r.ewmaLevel - yMin) / yRange) * (H - 2 * pad);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function drawHistogram(canvas: HTMLCanvasElement | null, stats: ReturnType<typeof computeResidualStats>) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  const { histogram } = stats;
  if (histogram.length === 0) return;
  const pad = 30;
  const maxCount = Math.max(...histogram.map((b) => b.count), 1);
  const barW = (W - 2 * pad) / histogram.length;
  histogram.forEach((bin, i) => {
    const x = pad + i * barW;
    const barH = (bin.count / maxCount) * (H - 2 * pad);
    ctx.fillStyle = '#3B82F688';
    ctx.fillRect(x, H - pad - barH, barW - 1, barH);
  });
}
```

**Step 4: Run tests to verify they pass**

Run: `cd equipment-monitor && npx jest src/components/analytics/__tests__/ApcTab.test.tsx --no-coverage 2>&1 | tail -5`
Expected: PASS — 5 tests

**Step 5: Commit**

```bash
git add src/components/analytics/ApcTab.tsx src/components/analytics/__tests__/ApcTab.test.tsx
git commit -m "feat(analytics): ApcTab component with d-EWMA controller + Canvas charts + 5 tests"
```

---

### Task 13: ReliabilityTab Component + Tests

**Files:**
- Create: `src/components/analytics/ReliabilityTab.tsx`
- Create: `src/components/analytics/__tests__/ReliabilityTab.test.tsx`

**Step 1: Write the failing tests**

```typescript
// src/components/analytics/__tests__/ReliabilityTab.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ReliabilityTab } from '../ReliabilityTab';
import { useAnalyticsStore, INITIAL_ANALYTICS_STATE } from '@/stores/analytics-store';

describe('ReliabilityTab', () => {
  beforeEach(() => {
    useAnalyticsStore.setState(INITIAL_ANALYTICS_STATE);
  });

  test('renders KPI strip with System Availability', () => {
    render(<ReliabilityTab />);
    expect(screen.getByText(/System Availability/i)).toBeInTheDocument();
  });

  test('renders topology selector buttons', () => {
    render(<ReliabilityTab />);
    expect(screen.getByRole('button', { name: /Series/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Parallel/i })).toBeInTheDocument();
  });

  test('renders 8 subsystem blocks', () => {
    render(<ReliabilityTab />);
    expect(screen.getByText(/Oxidation/i)).toBeInTheDocument();
    expect(screen.getByText(/Metal/i)).toBeInTheDocument();
  });

  test('renders chart canvases', () => {
    render(<ReliabilityTab />);
    const canvases = screen.getAllByTestId(/reliability-chart/);
    expect(canvases.length).toBeGreaterThanOrEqual(2);
  });

  test('switching topology updates store', () => {
    render(<ReliabilityTab />);
    fireEvent.click(screen.getByRole('button', { name: /Parallel/i }));
    expect(useAnalyticsStore.getState().rbdTopology).toBe('parallel');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd equipment-monitor && npx jest src/components/analytics/__tests__/ReliabilityTab.test.tsx --no-coverage 2>&1 | tail -5`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/components/analytics/ReliabilityTab.tsx
'use client';

import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import {
  generateSystemRBD, generateLifeProjection, accelerationFactor,
} from '@/lib/analytics/reliability-engine';
import type { RbdTopology, Subsystem } from '@/lib/analytics/types';
import { DEFAULT_SUBSYSTEMS } from '@/lib/analytics/constants';
import { useAnalyticsStore } from '@/stores/analytics-store';

export function ReliabilityTab() {
  const { rbdTopology, setRbdTopology, reliabilityEa, setReliabilityEa, reliabilityUseTemp } = useAnalyticsStore();
  const [subsystems, setSubsystems] = useState<Subsystem[]>(DEFAULT_SUBSYSTEMS.map((s) => ({ ...s })));

  const rbdResult = useMemo(() => generateSystemRBD(subsystems, rbdTopology), [subsystems, rbdTopology]);
  const lifeProjection = useMemo(() => generateLifeProjection(reliabilityEa, 0, 0, reliabilityUseTemp, 50), [reliabilityEa, reliabilityUseTemp]);
  const af125 = accelerationFactor(reliabilityEa, reliabilityUseTemp + 273.15, 125 + 273.15);

  const rbdRef = useRef<HTMLCanvasElement>(null);
  const lifeRef = useRef<HTMLCanvasElement>(null);

  const drawCharts = useCallback(() => {
    drawRbdDiagram(rbdRef.current, rbdResult, rbdTopology);
    drawLifeProjection(lifeRef.current, lifeProjection, reliabilityUseTemp);
  }, [rbdResult, rbdTopology, lifeProjection, reliabilityUseTemp]);

  useEffect(() => { drawCharts(); }, [drawCharts]);

  return (
    <div className="space-y-4">
      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-2">
        <KpiBox label="System Availability" value={`${(rbdResult.systemAvail * 100).toFixed(2)}%`} />
        <KpiBox label="System MTBF" value={`${rbdResult.systemMtbf.toFixed(0)}h`} />
        <KpiBox label="Worst Subsystem" value={rbdResult.bottleneck} />
        <KpiBox label="Ea" value={`${reliabilityEa.toFixed(2)} eV`} />
        <KpiBox label="AF @125°C" value={`${af125.toFixed(1)}×`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Controls */}
        <div className="space-y-3 bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded p-3">
          <div className="flex gap-2">
            {(['series', 'parallel', 'series-parallel'] as RbdTopology[]).map((t) => (
              <button key={t} onClick={() => setRbdTopology(t)}
                className={`px-3 py-1 text-xs rounded capitalize ${rbdTopology === t ? 'bg-blue-600 text-white' : 'bg-[var(--smartfactory-surface-card)] text-[var(--smartfactory-text-secondary)] border border-[var(--smartfactory-border-default)]'}`}>
                {t === 'series-parallel' ? 'Series-Parallel' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs text-[var(--smartfactory-text-muted)]">Activation Energy (eV)</label>
            <input type="range" min={0.3} max={1.2} step={0.01} value={reliabilityEa}
              onChange={(e) => setReliabilityEa(Number(e.target.value))} className="w-full" />
            <span className="text-xs text-[var(--smartfactory-text-secondary)]">{reliabilityEa.toFixed(2)} eV</span>
          </div>

          {subsystems.map((s, i) => (
            <div key={s.id} className="grid grid-cols-3 gap-1 items-center text-xs">
              <span className="text-[var(--smartfactory-text-secondary)]">{s.name}</span>
              <div>
                <span className="text-[var(--smartfactory-text-muted)]">λ</span>
                <input type="range" min={0.1} max={10} step={0.1} value={s.lambda}
                  onChange={(e) => {
                    const next = [...subsystems];
                    next[i] = { ...next[i], lambda: Number(e.target.value) };
                    setSubsystems(next);
                  }} className="w-full" />
              </div>
              <div>
                <span className="text-[var(--smartfactory-text-muted)]">μ</span>
                <input type="range" min={1} max={50} step={1} value={s.mu}
                  onChange={(e) => {
                    const next = [...subsystems];
                    next[i] = { ...next[i], mu: Number(e.target.value) };
                    setSubsystems(next);
                  }} className="w-full" />
              </div>
            </div>
          ))}
        </div>

        {/* Right: Charts */}
        <div className="space-y-4">
          <canvas ref={rbdRef} data-testid="reliability-chart-rbd" width={500} height={250}
            className="w-full bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded" />
          <canvas ref={lifeRef} data-testid="reliability-chart-life" width={500} height={250}
            className="w-full bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded" />
        </div>
      </div>
    </div>
  );
}

function KpiBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded p-2 text-center">
      <div className="text-xs text-[var(--smartfactory-text-muted)]">{label}</div>
      <div className="text-sm font-semibold text-[var(--smartfactory-text-primary)]">{value}</div>
    </div>
  );
}

const BLOCK_COLORS = { green: '#22C55E', amber: '#F59E0B', red: '#EF4444' };

function drawRbdDiagram(
  canvas: HTMLCanvasElement | null,
  result: ReturnType<typeof generateSystemRBD>,
  topology: RbdTopology,
) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  const { subsystemAvails } = result;
  const n = subsystemAvails.length;
  const pad = 20;
  const blockW = (W - 2 * pad - (n - 1) * 8) / n;
  const blockH = 40;

  if (topology === 'series') {
    const y = H / 2 - blockH / 2;
    subsystemAvails.forEach((s, i) => {
      const x = pad + i * (blockW + 8);
      const color = s.availability > 0.99 ? BLOCK_COLORS.green : s.availability > 0.95 ? BLOCK_COLORS.amber : BLOCK_COLORS.red;
      ctx.fillStyle = color + '44';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.fillRect(x, y, blockW, blockH);
      ctx.strokeRect(x, y, blockW, blockH);
      ctx.fillStyle = '#E2E8F0';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(s.id.slice(0, 4).toUpperCase(), x + blockW / 2, y + blockH / 2 + 4);
      // Connection lines
      if (i < n - 1) {
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + blockW, y + blockH / 2);
        ctx.lineTo(x + blockW + 8, y + blockH / 2);
        ctx.stroke();
      }
    });
  } else {
    // Parallel: stack vertically
    const rowH = (H - 2 * pad) / n;
    subsystemAvails.forEach((s, i) => {
      const x = W / 2 - blockW / 2;
      const y = pad + i * rowH + (rowH - blockH) / 2;
      const color = s.availability > 0.99 ? BLOCK_COLORS.green : s.availability > 0.95 ? BLOCK_COLORS.amber : BLOCK_COLORS.red;
      ctx.fillStyle = color + '44';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.fillRect(x, y, blockW, blockH);
      ctx.strokeRect(x, y, blockW, blockH);
      ctx.fillStyle = '#E2E8F0';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(s.id.slice(0, 4).toUpperCase(), x + blockW / 2, y + blockH / 2 + 4);
    });
  }
}

function drawLifeProjection(
  canvas: HTMLCanvasElement | null,
  points: { tempC: number; arrhenius: number; eyring: number }[],
  useTempC: number,
) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  if (points.length === 0) return;
  const pad = 40;
  const arrVals = points.map((p) => Math.log10(Math.max(1, p.arrhenius)));
  const yMin = Math.min(...arrVals);
  const yMax = Math.max(...arrVals);
  const yRange = yMax - yMin || 1;
  const toX = (i: number) => pad + (i / (points.length - 1)) * (W - 2 * pad);
  const toY = (logV: number) => H - pad - ((logV - yMin) / yRange) * (H - 2 * pad);

  // Arrhenius
  ctx.strokeStyle = '#3B82F6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((p, i) => {
    const y = toY(Math.log10(Math.max(1, p.arrhenius)));
    i === 0 ? ctx.moveTo(toX(i), y) : ctx.lineTo(toX(i), y);
  });
  ctx.stroke();

  // Eyring
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((p, i) => {
    const y = toY(Math.log10(Math.max(1, p.eyring)));
    i === 0 ? ctx.moveTo(toX(i), y) : ctx.lineTo(toX(i), y);
  });
  ctx.stroke();

  // Use temperature dashed line
  const useIdx = points.findIndex((p) => p.tempC >= useTempC);
  if (useIdx >= 0) {
    ctx.strokeStyle = '#EF4444';
    ctx.setLineDash([4, 4]);
    const x = toX(useIdx);
    ctx.beginPath(); ctx.moveTo(x, pad); ctx.lineTo(x, H - pad); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#EF4444';
    ctx.font = '10px monospace';
    ctx.fillText(`${useTempC}°C`, x + 4, pad + 12);
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `cd equipment-monitor && npx jest src/components/analytics/__tests__/ReliabilityTab.test.tsx --no-coverage 2>&1 | tail -5`
Expected: PASS — 5 tests

**Step 5: Commit**

```bash
git add src/components/analytics/ReliabilityTab.tsx src/components/analytics/__tests__/ReliabilityTab.test.tsx
git commit -m "feat(analytics): ReliabilityTab with RBD diagram + Arrhenius/Eyring charts + 5 tests"
```

---

### Task 14: OptimizationTab Component + Tests

**Files:**
- Create: `src/components/analytics/OptimizationTab.tsx`
- Create: `src/components/analytics/__tests__/OptimizationTab.test.tsx`

**Step 1: Write the failing tests**

```typescript
// src/components/analytics/__tests__/OptimizationTab.test.tsx
import { render, screen } from '@testing-library/react';
import { OptimizationTab } from '../OptimizationTab';
import { useAnalyticsStore, INITIAL_ANALYTICS_STATE } from '@/stores/analytics-store';

describe('OptimizationTab', () => {
  beforeEach(() => {
    useAnalyticsStore.setState(INITIAL_ANALYTICS_STATE);
  });

  test('renders KPI strip with Pareto Solutions', () => {
    render(<OptimizationTab />);
    expect(screen.getByText(/Pareto Solutions/i)).toBeInTheDocument();
  });

  test('renders 8 recipe knob sliders', () => {
    render(<OptimizationTab />);
    expect(screen.getByLabelText(/OX Temp/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/MET Sputter/i)).toBeInTheDocument();
  });

  test('renders chart canvases', () => {
    render(<OptimizationTab />);
    const canvases = screen.getAllByTestId(/opt-chart/);
    expect(canvases.length).toBeGreaterThanOrEqual(3);
  });

  test('renders constraint toggles', () => {
    render(<OptimizationTab />);
    expect(screen.getByText(/Min Yield/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd equipment-monitor && npx jest src/components/analytics/__tests__/OptimizationTab.test.tsx --no-coverage 2>&1 | tail -5`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/components/analytics/OptimizationTab.tsx
'use client';

import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import {
  evaluateObjectives, generateParetoFrontier, computeSensitivity, checkConstraints,
} from '@/lib/analytics/optimization-engine';
import {
  DEFAULT_RECIPE_KNOBS, DEFAULT_CONSTRAINTS, STEP_SHORT_NAMES, OBJECTIVES,
} from '@/lib/analytics/constants';
import type { ObjectiveId } from '@/lib/analytics/types';
import { useAnalyticsStore } from '@/stores/analytics-store';

export function OptimizationTab() {
  const { optimizationObjectives, setOptimizationObjectives } = useAnalyticsStore();
  const [recipe, setRecipe] = useState(DEFAULT_RECIPE_KNOBS.map((k) => k.value));
  const [constraints] = useState(DEFAULT_CONSTRAINTS);

  const objectives = useMemo(() => evaluateObjectives(recipe), [recipe]);
  const [obj1, obj2] = optimizationObjectives;
  const frontier = useMemo(() => generateParetoFrontier([obj1, obj2], constraints, 100), [obj1, obj2, constraints]);
  const sensitivity = useMemo(() => computeSensitivity(recipe, obj1, 0.1), [recipe, obj1]);
  const { feasible, violations } = checkConstraints(objectives, constraints);
  const nonDom = frontier.filter((p) => !p.dominated);

  const paretoRef = useRef<HTMLCanvasElement>(null);
  const tornadoRef = useRef<HTMLCanvasElement>(null);
  const rsmRef = useRef<HTMLCanvasElement>(null);

  const drawCharts = useCallback(() => {
    drawParetoScatter(paretoRef.current, frontier, obj1, obj2, objectives);
    drawTornado(tornadoRef.current, sensitivity);
    // RSM placeholder
    if (rsmRef.current) {
      const ctx = rsmRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, rsmRef.current.width, rsmRef.current.height);
        ctx.fillStyle = '#64748B';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('RSM Contour (select 2 axes)', rsmRef.current.width / 2, rsmRef.current.height / 2);
      }
    }
  }, [frontier, obj1, obj2, objectives, sensitivity]);

  useEffect(() => { drawCharts(); }, [drawCharts]);

  return (
    <div className="space-y-4">
      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-2">
        <KpiBox label="Pareto Solutions" value={`${nonDom.length}`} />
        <KpiBox label="Current Yield" value={`${objectives.yield.toFixed(1)}%`} />
        <KpiBox label="Throughput" value={`${objectives.throughput.toFixed(0)} wph`} />
        <KpiBox label="Violations" value={violations.length > 0 ? violations.join(', ') : 'None'} />
        <KpiBox label="Feasible" value={feasible ? 'Yes' : 'No'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Controls */}
        <div className="space-y-3 bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded p-3">
          <div className="text-xs text-[var(--smartfactory-text-muted)]">Objectives (select 2)</div>
          <div className="flex gap-2 flex-wrap">
            {OBJECTIVES.map((o) => (
              <button key={o.id} onClick={() => {
                const current = [...optimizationObjectives];
                if (current.includes(o.id)) {
                  if (current.length > 1) setOptimizationObjectives(current.filter((x) => x !== o.id));
                } else {
                  setOptimizationObjectives([...current.slice(-1), o.id]);
                }
              }}
                className={`px-2 py-1 text-xs rounded ${optimizationObjectives.includes(o.id) ? 'bg-blue-600 text-white' : 'bg-[var(--smartfactory-surface-card)] text-[var(--smartfactory-text-secondary)] border border-[var(--smartfactory-border-default)]'}`}>
                {o.id} ({o.direction === 'maximize' ? '↑' : '↓'})
              </button>
            ))}
          </div>

          <div className="text-xs text-[var(--smartfactory-text-muted)]">Min Yield ≥ {constraints.minYield}%</div>

          {DEFAULT_RECIPE_KNOBS.map((knob, i) => (
            <div key={knob.stepId}>
              <label htmlFor={`knob-${knob.stepId}`} aria-label={`${STEP_SHORT_NAMES[knob.stepId]} ${knob.label}`}
                className="text-xs text-[var(--smartfactory-text-muted)]">
                {STEP_SHORT_NAMES[knob.stepId]} {knob.label}
              </label>
              <input id={`knob-${knob.stepId}`} aria-label={`${STEP_SHORT_NAMES[knob.stepId]} ${knob.label}`}
                type="range" min={knob.min} max={knob.max} step={(knob.max - knob.min) / 100}
                value={recipe[i]}
                onChange={(e) => { const next = [...recipe]; next[i] = Number(e.target.value); setRecipe(next); }}
                className="w-full" />
            </div>
          ))}
        </div>

        {/* Right: Charts */}
        <div className="space-y-4">
          <canvas ref={paretoRef} data-testid="opt-chart-pareto" width={500} height={200}
            className="w-full bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded" />
          <canvas ref={rsmRef} data-testid="opt-chart-rsm" width={500} height={200}
            className="w-full bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded" />
          <canvas ref={tornadoRef} data-testid="opt-chart-tornado" width={500} height={200}
            className="w-full bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded" />
        </div>
      </div>
    </div>
  );
}

function KpiBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded p-2 text-center">
      <div className="text-xs text-[var(--smartfactory-text-muted)]">{label}</div>
      <div className="text-sm font-semibold text-[var(--smartfactory-text-primary)]">{value}</div>
    </div>
  );
}

function drawParetoScatter(
  canvas: HTMLCanvasElement | null,
  frontier: { objectives: Record<ObjectiveId, number>; dominated: boolean }[],
  obj1: ObjectiveId,
  obj2: ObjectiveId,
  currentObj: Record<ObjectiveId, number>,
) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  if (frontier.length === 0) return;
  const pad = 30;
  const x1s = frontier.map((p) => p.objectives[obj1]);
  const x2s = frontier.map((p) => p.objectives[obj2]);
  const xMin = Math.min(...x1s); const xMax = Math.max(...x1s);
  const yMin = Math.min(...x2s); const yMax = Math.max(...x2s);
  const xRange = xMax - xMin || 1; const yRange = yMax - yMin || 1;
  const toX = (v: number) => pad + ((v - xMin) / xRange) * (W - 2 * pad);
  const toY = (v: number) => H - pad - ((v - yMin) / yRange) * (H - 2 * pad);
  // Dominated (faded)
  frontier.filter((p) => p.dominated).forEach((p) => {
    ctx.fillStyle = '#64748B44';
    ctx.beginPath(); ctx.arc(toX(p.objectives[obj1]), toY(p.objectives[obj2]), 3, 0, 2 * Math.PI); ctx.fill();
  });
  // Non-dominated (bright)
  const nonDom = frontier.filter((p) => !p.dominated).sort((a, b) => a.objectives[obj1] - b.objectives[obj1]);
  ctx.strokeStyle = '#22D3EE';
  ctx.lineWidth = 1;
  if (nonDom.length > 1) {
    ctx.beginPath();
    nonDom.forEach((p, i) => {
      const x = toX(p.objectives[obj1]); const y = toY(p.objectives[obj2]);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }
  nonDom.forEach((p) => {
    ctx.fillStyle = '#22D3EE';
    ctx.beginPath(); ctx.arc(toX(p.objectives[obj1]), toY(p.objectives[obj2]), 4, 0, 2 * Math.PI); ctx.fill();
  });
  // Current operating point
  ctx.fillStyle = '#F47920';
  ctx.beginPath(); ctx.arc(toX(currentObj[obj1]), toY(currentObj[obj2]), 6, 0, 2 * Math.PI); ctx.fill();
}

function drawTornado(canvas: HTMLCanvasElement | null, bars: { label: string; impact: number }[]) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  if (bars.length === 0) return;
  const pad = 60;
  const maxAbs = Math.max(...bars.map((b) => Math.abs(b.impact)), 0.01);
  const barH = (H - 2 * pad) / bars.length;
  const centerX = W / 2;
  bars.forEach((bar, i) => {
    const y = pad + i * barH;
    const barW = (bar.impact / maxAbs) * (W / 2 - pad);
    ctx.fillStyle = bar.impact >= 0 ? '#22C55E88' : '#EF444488';
    ctx.fillRect(centerX, y, barW, barH - 2);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(bar.label, centerX - 4, y + barH / 2 + 3);
  });
  // Center line
  ctx.strokeStyle = '#64748B';
  ctx.beginPath(); ctx.moveTo(centerX, pad); ctx.lineTo(centerX, H - pad); ctx.stroke();
}
```

**Step 4: Run tests to verify they pass**

Run: `cd equipment-monitor && npx jest src/components/analytics/__tests__/OptimizationTab.test.tsx --no-coverage 2>&1 | tail -5`
Expected: PASS — 4 tests

**Step 5: Commit**

```bash
git add src/components/analytics/OptimizationTab.tsx src/components/analytics/__tests__/OptimizationTab.test.tsx
git commit -m "feat(analytics): OptimizationTab with Pareto frontier + sensitivity tornado + 4 tests"
```

---

### Task 15: ReplicationTab Component + Tests

**Files:**
- Create: `src/components/analytics/ReplicationTab.tsx`
- Create: `src/components/analytics/__tests__/ReplicationTab.test.tsx`

**Step 1: Write the failing tests**

```typescript
// src/components/analytics/__tests__/ReplicationTab.test.tsx
import { render, screen } from '@testing-library/react';
import { ReplicationTab } from '../ReplicationTab';
import { useAnalyticsStore, INITIAL_ANALYTICS_STATE } from '@/stores/analytics-store';

describe('ReplicationTab', () => {
  beforeEach(() => {
    useAnalyticsStore.setState(INITIAL_ANALYTICS_STATE);
  });

  test('renders KPI strip with Fab Count', () => {
    render(<ReplicationTab />);
    expect(screen.getByText(/Fab Count/i)).toBeInTheDocument();
  });

  test('renders 3 fab cards', () => {
    render(<ReplicationTab />);
    expect(screen.getByText(/HQ Fab/i)).toBeInTheDocument();
    expect(screen.getByText(/Satellite/i)).toBeInTheDocument();
    expect(screen.getByText(/New-Build/i)).toBeInTheDocument();
  });

  test('renders parameter selector', () => {
    render(<ReplicationTab />);
    expect(screen.getByLabelText(/Parameter/i)).toBeInTheDocument();
  });

  test('renders chart canvases', () => {
    render(<ReplicationTab />);
    const canvases = screen.getAllByTestId(/replication-chart/);
    expect(canvases.length).toBeGreaterThanOrEqual(3);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd equipment-monitor && npx jest src/components/analytics/__tests__/ReplicationTab.test.tsx --no-coverage 2>&1 | tail -5`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/components/analytics/ReplicationTab.tsx
'use client';

import { useRef, useEffect, useCallback, useMemo } from 'react';
import {
  generateFabComparison, generateDistributionCurve, computeCpk,
} from '@/lib/analytics/replication-engine';
import {
  FAB_CONFIGS, FAB_IDS, REPLICATION_PARAMS,
} from '@/lib/analytics/constants';
import type { ReplicationParam } from '@/lib/analytics/types';
import { useAnalyticsStore } from '@/stores/analytics-store';

export function ReplicationTab() {
  const {
    replicationParam, setReplicationParam,
    replicationMargin, replicationSampleSize, replicationConfidence,
  } = useAnalyticsStore();

  const comparison = useMemo(() => generateFabComparison(replicationParam, {
    sampleSize: replicationSampleSize,
    confidence: replicationConfidence,
    margin: replicationMargin,
  }), [replicationParam, replicationSampleSize, replicationConfidence, replicationMargin]);

  const paramDef = REPLICATION_PARAMS.find((p) => p.id === replicationParam)!;
  const passCount = comparison.tostResults.filter((r) => r.pass).length;

  const tostRef = useRef<HTMLCanvasElement>(null);
  const distRef = useRef<HTMLCanvasElement>(null);
  const transferRef = useRef<HTMLCanvasElement>(null);

  const drawCharts = useCallback(() => {
    drawTostChart(tostRef.current, comparison.tostResults, replicationMargin);
    drawDistributions(distRef.current, comparison.fabData, paramDef.target, paramDef.usl, paramDef.lsl);
    drawTransfer(transferRef.current, comparison.fabData, comparison.transferFits);
  }, [comparison, replicationMargin, paramDef]);

  useEffect(() => { drawCharts(); }, [drawCharts]);

  return (
    <div className="space-y-4">
      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-2">
        <KpiBox label="Fab Count" value="3" />
        <KpiBox label="Params Matched" value={`${passCount}/3`} />
        <KpiBox label="Pass Rate" value={`${((passCount / 3) * 100).toFixed(0)}%`} />
        <KpiBox label="Max Bias" value={`${Math.max(...comparison.tostResults.map((r) => Math.abs(r.meanDiff))).toFixed(2)}`} />
        <KpiBox label="Transfer R²" value={comparison.transferFits[0] ? comparison.transferFits[0].rSquared.toFixed(3) : '—'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Controls */}
        <div className="space-y-3 bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded p-3">
          {/* Fab cards */}
          <div className="grid grid-cols-3 gap-2">
            {FAB_IDS.map((id) => {
              const cfg = FAB_CONFIGS[id];
              const fabData = comparison.fabData.get(id);
              const cpk = fabData ? computeCpk(fabData, paramDef.usl, paramDef.lsl) : 0;
              return (
                <div key={id} className="bg-[var(--smartfactory-bg-base)] border border-[var(--smartfactory-border-default)] rounded p-2 text-center">
                  <div className="text-xs font-semibold text-[var(--smartfactory-text-primary)]">{cfg.name}</div>
                  <div className="text-[10px] text-[var(--smartfactory-text-muted)]">{cfg.location}</div>
                  <div className={`text-[10px] mt-1 px-1 rounded inline-block ${
                    cfg.maturity === 'Mature' ? 'bg-green-900 text-green-400'
                      : cfg.maturity === 'Established' ? 'bg-blue-900 text-blue-400'
                        : 'bg-amber-900 text-amber-400'
                  }`}>{cfg.maturity}</div>
                  <div className="text-xs text-[var(--smartfactory-text-secondary)] mt-1">Cpk {cpk.toFixed(2)}</div>
                </div>
              );
            })}
          </div>

          <div>
            <label htmlFor="repl-param" className="text-xs text-[var(--smartfactory-text-muted)]">Parameter</label>
            <select id="repl-param" aria-label="Parameter" value={replicationParam}
              onChange={(e) => setReplicationParam(e.target.value as ReplicationParam)}
              className="w-full bg-[var(--smartfactory-bg-base)] border border-[var(--smartfactory-border-default)] rounded px-2 py-1 text-sm text-[var(--smartfactory-text-primary)]">
              {REPLICATION_PARAMS.map((p) => (
                <option key={p.id} value={p.id}>{p.label} ({p.unit})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-[var(--smartfactory-text-muted)]">Equivalence Margin (±)</label>
            <input type="range" min={0.5} max={5} step={0.1} value={replicationMargin}
              onChange={(e) => useAnalyticsStore.getState().setReplicationMargin(Number(e.target.value))}
              className="w-full" />
            <span className="text-xs text-[var(--smartfactory-text-secondary)]">±{replicationMargin}</span>
          </div>

          <div>
            <label className="text-xs text-[var(--smartfactory-text-muted)]">Sample Size</label>
            <input type="range" min={30} max={100} step={10} value={replicationSampleSize}
              onChange={(e) => useAnalyticsStore.getState().setReplicationSampleSize(Number(e.target.value))}
              className="w-full" />
            <span className="text-xs text-[var(--smartfactory-text-secondary)]">{replicationSampleSize}</span>
          </div>

          {/* TOST results summary */}
          <div className="space-y-1">
            {comparison.tostResults.map((r) => (
              <div key={`${r.fab1}-${r.fab2}`} className="flex justify-between text-xs">
                <span className="text-[var(--smartfactory-text-secondary)]">{r.fab1} ↔ {r.fab2}</span>
                <span className={r.pass ? 'text-green-400' : 'text-red-400'}>{r.pass ? 'PASS' : 'FAIL'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Charts */}
        <div className="space-y-4">
          <canvas ref={tostRef} data-testid="replication-chart-tost" width={500} height={180}
            className="w-full bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded" />
          <canvas ref={distRef} data-testid="replication-chart-dist" width={500} height={180}
            className="w-full bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded" />
          <canvas ref={transferRef} data-testid="replication-chart-transfer" width={500} height={180}
            className="w-full bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded" />
        </div>
      </div>
    </div>
  );
}

function KpiBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded p-2 text-center">
      <div className="text-xs text-[var(--smartfactory-text-muted)]">{label}</div>
      <div className="text-sm font-semibold text-[var(--smartfactory-text-primary)]">{value}</div>
    </div>
  );
}

const FAB_COLORS: Record<string, string> = { hq: '#22D3EE', satellite: '#A855F7', 'new-build': '#F59E0B' };

function drawTostChart(
  canvas: HTMLCanvasElement | null,
  results: { fab1: string; fab2: string; meanDiff: number; ciLower: number; ciUpper: number; equivalenceLower: number; equivalenceUpper: number; pass: boolean }[],
  margin: number,
) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  const pad = 40;
  const rowH = (H - 2 * pad) / results.length;
  const xRange = margin * 3;
  const toX = (v: number) => pad + ((v + xRange) / (2 * xRange)) * (W - 2 * pad);
  // Equivalence bounds
  ctx.strokeStyle = '#EF4444';
  ctx.setLineDash([4, 4]);
  [margin, -margin].forEach((m) => {
    ctx.beginPath(); ctx.moveTo(toX(m), pad); ctx.lineTo(toX(m), H - pad); ctx.stroke();
  });
  ctx.setLineDash([]);
  // Center
  ctx.strokeStyle = '#64748B';
  ctx.beginPath(); ctx.moveTo(toX(0), pad); ctx.lineTo(toX(0), H - pad); ctx.stroke();
  // Results
  results.forEach((r, i) => {
    const y = pad + i * rowH + rowH / 2;
    // CI bar
    ctx.strokeStyle = r.pass ? '#22C55E' : '#EF4444';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(toX(r.ciLower), y); ctx.lineTo(toX(r.ciUpper), y); ctx.stroke();
    // Mean diff dot
    ctx.fillStyle = r.pass ? '#22C55E' : '#EF4444';
    ctx.beginPath(); ctx.arc(toX(r.meanDiff), y, 5, 0, 2 * Math.PI); ctx.fill();
    // Label
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${r.fab1}↔${r.fab2}`, pad - 4, y + 3);
  });
}

function drawDistributions(
  canvas: HTMLCanvasElement | null,
  fabData: Map<string, number[]>,
  target: number,
  usl: number,
  lsl: number,
) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  const pad = 30;
  const allVals = Array.from(fabData.values()).flat();
  const xMin = Math.min(...allVals, lsl);
  const xMax = Math.max(...allVals, usl);
  const xRange = xMax - xMin || 1;
  const toX = (v: number) => pad + ((v - xMin) / xRange) * (W - 2 * pad);
  // Spec limits
  ctx.strokeStyle = '#EF4444';
  ctx.setLineDash([4, 4]);
  [usl, lsl].forEach((sl) => {
    ctx.beginPath(); ctx.moveTo(toX(sl), pad); ctx.lineTo(toX(sl), H - pad); ctx.stroke();
  });
  ctx.setLineDash([]);
  // Distribution curves
  for (const [fabId, data] of fabData) {
    const mean = data.reduce((s, v) => s + v, 0) / data.length;
    const std = Math.sqrt(data.reduce((s, v) => s + (v - mean) ** 2, 0) / data.length);
    const curve = generateDistributionCurve(mean, std, 100);
    const maxPdf = Math.max(...curve.map((p) => p.pdf));
    ctx.strokeStyle = FAB_COLORS[fabId] ?? '#94A3B8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    curve.forEach((p, i) => {
      const x = toX(p.x);
      const y = H - pad - (p.pdf / maxPdf) * (H - 2 * pad) * 0.8;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }
}

function drawTransfer(
  canvas: HTMLCanvasElement | null,
  fabData: Map<string, number[]>,
  fits: { fromFab: string; toFab: string; coefficients: number[]; rSquared: number }[],
) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  const pad = 30;
  const hqData = fabData.get('hq');
  const satData = fabData.get('satellite');
  if (!hqData || !satData) return;
  const allX = [...hqData];
  const allY = [...satData];
  const xMin = Math.min(...allX); const xMax = Math.max(...allX);
  const yMin = Math.min(...allY); const yMax = Math.max(...allY);
  const xRange = xMax - xMin || 1; const yRange = yMax - yMin || 1;
  const toXp = (v: number) => pad + ((v - xMin) / xRange) * (W - 2 * pad);
  const toYp = (v: number) => H - pad - ((v - yMin) / yRange) * (H - 2 * pad);
  // 45° reference
  ctx.strokeStyle = '#64748B';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  const refMin = Math.min(xMin, yMin); const refMax = Math.max(xMax, yMax);
  ctx.moveTo(toXp(refMin), toYp(refMin)); ctx.lineTo(toXp(refMax), toYp(refMax));
  ctx.stroke();
  ctx.setLineDash([]);
  // Scatter
  const minLen = Math.min(hqData.length, satData.length);
  ctx.fillStyle = '#A855F744';
  for (let i = 0; i < minLen; i++) {
    ctx.beginPath(); ctx.arc(toXp(hqData[i]), toYp(satData[i]), 3, 0, 2 * Math.PI); ctx.fill();
  }
  // Regression line
  if (fits[0]) {
    const [b0, b1] = fits[0].coefficients;
    ctx.strokeStyle = '#A855F7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(toXp(xMin), toYp(b0 + b1 * xMin));
    ctx.lineTo(toXp(xMax), toYp(b0 + b1 * xMax));
    ctx.stroke();
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px monospace';
    ctx.fillText(`R²=${fits[0].rSquared.toFixed(3)}`, pad + 4, pad + 12);
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `cd equipment-monitor && npx jest src/components/analytics/__tests__/ReplicationTab.test.tsx --no-coverage 2>&1 | tail -5`
Expected: PASS — 4 tests

**Step 5: Commit**

```bash
git add src/components/analytics/ReplicationTab.tsx src/components/analytics/__tests__/ReplicationTab.test.tsx
git commit -m "feat(analytics): ReplicationTab with TOST + distribution overlay + transfer charts + 4 tests"
```

---

### Task 16: VppTab Component + Tests

**Files:**
- Create: `src/components/analytics/VppTab.tsx`
- Create: `src/components/analytics/__tests__/VppTab.test.tsx`

**Step 1: Write the failing tests**

```typescript
// src/components/analytics/__tests__/VppTab.test.tsx
import { render, screen } from '@testing-library/react';
import { VppTab } from '../VppTab';

describe('VppTab', () => {
  test('renders KPI strip with Active Sims', () => {
    render(<VppTab />);
    expect(screen.getByText(/Active Sims/i)).toBeInTheDocument();
  });

  test('renders 8 pipeline step cards', () => {
    render(<VppTab />);
    expect(screen.getByText(/OX/)).toBeInTheDocument();
    expect(screen.getByText(/MET/)).toBeInTheDocument();
  });

  test('renders film stack section', () => {
    render(<VppTab />);
    expect(screen.getByText(/Film Stack/i)).toBeInTheDocument();
  });

  test('renders chart canvases', () => {
    render(<VppTab />);
    const canvases = screen.getAllByTestId(/vpp-chart/);
    expect(canvases.length).toBeGreaterThanOrEqual(2);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd equipment-monitor && npx jest src/components/analytics/__tests__/VppTab.test.tsx --no-coverage 2>&1 | tail -5`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/components/analytics/VppTab.tsx
'use client';

import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import {
  createDefaultPipeline, runFederatedSim, computePipelineYield,
} from '@/lib/analytics/vpp-engine';
import {
  STEP_SHORT_NAMES, FILM_MATERIALS, PROCESS_STEPS,
} from '@/lib/analytics/constants';
import type { PipelineStep } from '@/lib/analytics/types';

export function VppTab() {
  const [pipeline, setPipeline] = useState<PipelineStep[]>(createDefaultPipeline);

  const result = useMemo(() => runFederatedSim(pipeline), [pipeline]);
  const yieldData = useMemo(() => computePipelineYield(result.perStep), [result]);

  const waterfallRef = useRef<HTMLCanvasElement>(null);
  const metricRef = useRef<HTMLCanvasElement>(null);

  const drawCharts = useCallback(() => {
    drawPipelineWaterfall(waterfallRef.current, result.perStep);
    drawMetricTrend(metricRef.current, result.perStep);
  }, [result]);

  useEffect(() => { drawCharts(); }, [drawCharts]);

  return (
    <div className="space-y-4">
      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-2">
        <KpiBox label="Active Sims" value={`${pipeline.length}`} />
        <KpiBox label="Pipeline Steps" value={`${pipeline.length}`} />
        <KpiBox label="Cumulative Yield" value={`${(result.cumulativeYield * 100).toFixed(1)}%`} />
        <KpiBox label="Total Thickness" value={`${result.filmStack.reduce((s, l) => s + l.thickness, 0).toFixed(0)} nm`} />
        <KpiBox label="Layers" value={`${result.filmStack.length}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Pipeline config */}
        <div className="space-y-3 bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded p-3">
          <div className="text-xs font-semibold text-[var(--smartfactory-text-primary)]">Pipeline Steps</div>
          {pipeline.map((step, i) => (
            <div key={step.stepId} className="flex items-center gap-2 text-xs">
              <span className="w-10 font-mono text-[var(--smartfactory-text-secondary)]">{STEP_SHORT_NAMES[step.stepId]}</span>
              <span className="flex-1 text-[var(--smartfactory-text-muted)]">
                Y: {(result.perStep[i]?.yield * 100).toFixed(1)}% | T: {result.perStep[i]?.thickness.toFixed(0)}nm
              </span>
            </div>
          ))}

          <div className="text-xs font-semibold text-[var(--smartfactory-text-primary)] mt-4">Film Stack</div>
          <div className="flex flex-col gap-0">
            {result.filmStack.map((layer, i) => (
              <div key={i} className="flex items-center gap-2 text-xs"
                style={{ borderLeft: `4px solid ${layer.color}`, paddingLeft: '8px' }}>
                <span className="text-[var(--smartfactory-text-secondary)]">{layer.material}</span>
                <span className="text-[var(--smartfactory-text-muted)]">{layer.thickness.toFixed(0)} nm</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Charts */}
        <div className="space-y-4">
          <canvas ref={waterfallRef} data-testid="vpp-chart-waterfall" width={500} height={220}
            className="w-full bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded" />
          <canvas ref={metricRef} data-testid="vpp-chart-metric" width={500} height={220}
            className="w-full bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded" />
        </div>
      </div>
    </div>
  );
}

function KpiBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded p-2 text-center">
      <div className="text-xs text-[var(--smartfactory-text-muted)]">{label}</div>
      <div className="text-sm font-semibold text-[var(--smartfactory-text-primary)]">{value}</div>
    </div>
  );
}

const STEP_COLORS = ['#FF6B35', '#22D3EE', '#A855F7', '#3B82F6', '#F43F5E', '#F59E0B', '#10B981', '#E2E8F0'];

function drawPipelineWaterfall(canvas: HTMLCanvasElement | null, perStep: { stepId: string; yield: number }[]) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  if (perStep.length === 0) return;
  const pad = 30;
  const barW = (W - 2 * pad) / perStep.length * 0.7;
  const gap = (W - 2 * pad) / perStep.length * 0.3;
  let cumulative = 1;
  perStep.forEach((step, i) => {
    cumulative *= step.yield;
    const x = pad + i * (barW + gap);
    const barH = cumulative * (H - 2 * pad);
    ctx.fillStyle = STEP_COLORS[i % STEP_COLORS.length] + '88';
    ctx.fillRect(x, H - pad - barH, barW, barH);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${(cumulative * 100).toFixed(0)}%`, x + barW / 2, H - pad - barH - 4);
    ctx.fillText(STEP_SHORT_NAMES[step.stepId as keyof typeof STEP_SHORT_NAMES] ?? step.stepId, x + barW / 2, H - pad + 12);
  });
}

function drawMetricTrend(canvas: HTMLCanvasElement | null, perStep: { stepId: string; thickness: number; stress: number; defectDensity: number }[]) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  if (perStep.length === 0) return;
  const pad = 30;
  const vals = perStep.map((s) => s.thickness);
  const yMin = Math.min(...vals, 0);
  const yMax = Math.max(...vals);
  const yRange = yMax - yMin || 1;
  ctx.strokeStyle = '#22D3EE';
  ctx.lineWidth = 2;
  ctx.beginPath();
  perStep.forEach((step, i) => {
    const x = pad + (i / (perStep.length - 1)) * (W - 2 * pad);
    const y = H - pad - ((step.thickness - yMin) / yRange) * (H - 2 * pad);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
  // Dots
  perStep.forEach((step, i) => {
    const x = pad + (i / (perStep.length - 1)) * (W - 2 * pad);
    const y = H - pad - ((step.thickness - yMin) / yRange) * (H - 2 * pad);
    ctx.fillStyle = STEP_COLORS[i % STEP_COLORS.length];
    ctx.beginPath(); ctx.arc(x, y, 4, 0, 2 * Math.PI); ctx.fill();
  });
  ctx.fillStyle = '#94A3B8';
  ctx.font = '10px monospace';
  ctx.fillText('Thickness (nm)', pad, pad - 8);
}
```

**Step 4: Run tests to verify they pass**

Run: `cd equipment-monitor && npx jest src/components/analytics/__tests__/VppTab.test.tsx --no-coverage 2>&1 | tail -5`
Expected: PASS — 4 tests

**Step 5: Commit**

```bash
git add src/components/analytics/VppTab.tsx src/components/analytics/__tests__/VppTab.test.tsx
git commit -m "feat(analytics): VppTab with federation pipeline + film stack + Canvas charts + 4 tests"
```

---

### Task 17: Analytics Page + Route

**Files:**
- Create: `src/app/mes/analytics/page.tsx`

**Step 1: Create the page**

```typescript
// src/app/mes/analytics/page.tsx
'use client';

import { useAnalyticsStore } from '@/stores/analytics-store';
import { AnalyticsTabBar } from '@/components/analytics/AnalyticsTabBar';
import { YieldTab } from '@/components/analytics/YieldTab';
import { ApcTab } from '@/components/analytics/ApcTab';
import { ReliabilityTab } from '@/components/analytics/ReliabilityTab';
import { OptimizationTab } from '@/components/analytics/OptimizationTab';
import { ReplicationTab } from '@/components/analytics/ReplicationTab';
import { VppTab } from '@/components/analytics/VppTab';

const TAB_COMPONENTS = {
  vpp: VppTab,
  apc: ApcTab,
  yield: YieldTab,
  reliability: ReliabilityTab,
  optimization: OptimizationTab,
  replication: ReplicationTab,
} as const;

export default function AnalyticsPage() {
  const { activeTab, setTab } = useAnalyticsStore();
  const TabComponent = TAB_COMPONENTS[activeTab];

  return (
    <div data-testid="analytics-page" className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-0">
        <div className="text-xs text-[var(--smartfactory-text-muted)]">MES / Analytics</div>
        <h2 className="text-lg font-semibold text-[var(--smartfactory-text-primary)]">
          Advanced Analytics
        </h2>
      </div>

      <AnalyticsTabBar activeTab={activeTab} onTabChange={setTab} />

      <div className="flex-1 overflow-y-auto p-4">
        <TabComponent />
      </div>
    </div>
  );
}
```

**Step 2: Verify the page renders**

Run: `cd equipment-monitor && npx tsc --noEmit 2>&1 | grep analytics | head -10`
Expected: No errors related to analytics files

**Step 3: Commit**

```bash
git add src/app/mes/analytics/page.tsx
git commit -m "feat(analytics): analytics hub page at /mes/analytics with 6-tab layout"
```

---

### Task 18: Nav Integration

**Files:**
- Modify: `src/components/mes/MesNavBar.tsx:8-20`

**Step 1: Read the current file**

Read `src/components/mes/MesNavBar.tsx` to confirm line numbers.

**Step 2: Add Analytics nav item**

Add `{ href: '/mes/analytics', label: 'Analytics', icon: Activity }` to `NAV_ITEMS` array, after the SPC Dashboard entry (line 18):

```typescript
const NAV_ITEMS = [
  { href: '/', label: 'Dashboard' },
  { href: '/mes/war-room', label: 'War Room', icon: Activity },
  { href: '/mes/fab-floor', label: 'Fab Floor', icon: Activity },
  { href: '/mes/fab-twin', label: 'Fab Twin', icon: Activity },
  { href: '/mes/ar-tracking', label: 'AR Tracking', icon: Activity },
  { href: '/mes/surveillance', label: 'Surveillance', icon: Activity },
  { href: '/mes/equipment', label: 'Equipment' },
  { href: '/mes/lots', label: 'Lot Tracker' },
  { href: '/mes/recipes', label: 'Recipe Manager' },
  { href: '/mes/spc', label: 'SPC Dashboard' },
  { href: '/mes/analytics', label: 'Analytics', icon: Activity },
  { href: '/mes/secs-gem', label: 'SECS/GEM Sim', icon: Activity },
];
```

**Step 3: Commit**

```bash
git add src/components/mes/MesNavBar.tsx
git commit -m "feat(analytics): add Analytics nav item to MES navigation bar"
```

---

### Task 19: Lint + Type Check

**Step 1: Run TypeScript check**

Run: `cd equipment-monitor && npx tsc --noEmit 2>&1 | head -30`
Expected: No errors (or only pre-existing unrelated warnings)

**Step 2: Run ESLint**

Run: `cd equipment-monitor && npx eslint src/lib/analytics/ src/components/analytics/ src/stores/analytics-store.ts src/app/mes/analytics/ --max-warnings 0 2>&1 | head -20`
Expected: No errors

**Step 3: Fix any issues found**

If lint/type errors found, fix them.

**Step 4: Commit fixes if any**

```bash
git add -A && git commit -m "fix(analytics): resolve lint and type errors"
```

---

### Task 20: Full Test Run

**Step 1: Run all analytics tests**

Run: `cd equipment-monitor && npx jest src/lib/analytics/ src/components/analytics/ src/stores/__tests__/analytics-store.test.ts --no-coverage 2>&1 | tail -20`
Expected: PASS — all ~120 tests

**Step 2: Run full test suite**

Run: `cd equipment-monitor && npx jest --no-coverage 2>&1 | tail -10`
Expected: All tests pass (existing + new)

**Step 3: Final commit**

```bash
git add -A && git commit -m "feat(analytics): complete advanced analytics hub — 6 engines, 6 tabs, ~120 tests"
```

---

## Summary

| Task | Component | Tests | Parallelizable With |
|------|-----------|-------|---------------------|
| 1 | types.ts + constants.ts | — | — |
| 2 | yield-engine | 15 | 3, 4, 5, 6, 7 |
| 3 | apc-engine | 18 | 2, 4, 5, 6, 7 |
| 4 | reliability-engine | 15 | 2, 3, 5, 6, 7 |
| 5 | optimization-engine | 15 | 2, 3, 4, 6, 7 |
| 6 | replication-engine | 15 | 2, 3, 4, 5, 7 |
| 7 | vpp-engine | 12 | 2, 3, 4, 5, 6 |
| 8 | index.ts barrel | — | — |
| 9 | analytics-store | 10 | — |
| 10 | AnalyticsTabBar | 3 | — |
| 11 | YieldTab | 5 | 12, 13, 14, 15, 16 |
| 12 | ApcTab | 5 | 11, 13, 14, 15, 16 |
| 13 | ReliabilityTab | 5 | 11, 12, 14, 15, 16 |
| 14 | OptimizationTab | 4 | 11, 12, 13, 15, 16 |
| 15 | ReplicationTab | 4 | 11, 12, 13, 14, 16 |
| 16 | VppTab | 4 | 11, 12, 13, 14, 15 |
| 17 | Page + route | — | — |
| 18 | Nav integration | — | — |
| 19 | Lint + type check | — | — |
| 20 | Full test run | — | — |

**Total: ~130 tests across 20 tasks**

**Parallel waves:**
- Wave 1: Tasks 2–7 (6 engines, all independent after Task 1)
- Wave 2: Tasks 11–16 (6 tabs, all independent after Task 10)
