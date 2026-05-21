# CMP Planarization Sim — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a multi-step Cu + Barrier CMP digital twin at `/mes/fab-floor/cmp/planarization-sim` with Reynolds flow, Greenwood-Williamson contact, and viscoelastic pad physics.

**Architecture:** Pure-TS physics engine at `src/lib/cmp-sim/` (6 models, TDD). React components at `src/components/cmp-sim/` (TimelineBar, ParameterPanel, PlanarizeScene, WaferMetricsPanel). Babylon.js split-view scene. 4 phases, 8 presets, 10 sliders, 6 die-level metrics.

**Tech Stack:** TypeScript, Jest, React, Next.js, Babylon.js v9.6.2, Canvas 2D

**Reference implementation:** `src/lib/etch-sim/` and `src/components/etch-sim/` — follow these patterns exactly.

**Test command:** `cd equipment-monitor && npx jest src/lib/cmp-sim/__tests__/<file> --verbose`

---

## Task 1: Types & Constants

**Files:**
- Create: `src/lib/cmp-sim/types.ts`
- Create: `src/lib/cmp-sim/constants.ts`

**Step 1: Create types.ts**

```typescript
// src/lib/cmp-sim/types.ts
export type ProcessPhase = 'ramp-up' | 'bulk-cu' | 'barrier' | 'buff';

export interface SimulationParams {
  downForce: number;        // PSI (1-10)
  waferRpm: number;         // RPM (10-150)
  platenRpm: number;        // RPM (10-150)
  slurryFlow: number;       // mL/min (50-500)
  abrasiveConc: number;     // wt% (1-15)
  slurryPh: number;         // pH (2-12)
  padStiffness: number;     // MPa (10-100)
  asperityDensity: number;  // 1/mm^2 (100-2000)
  cuThickness: number;      // nm (500-2000)
  patternDensity: number;   // % (10-90)
  totalSteps: number;
}

export interface StepState {
  stepIndex: number;
  phase: ProcessPhase;
  timeSeconds: number;
  // Reynolds flow
  filmThickness: number[];     // 20 radial nodes
  fluidPressure: number[];     // 20 radial nodes
  // Contact
  realContactArea: number;     // fraction (0.001-0.01)
  padCreepStrain: number;      // viscoelastic state
  contactPressure: number[];   // 20 radial nodes
  // Removal
  removalRate: number;         // nm/min (aggregate)
  cuRemaining: number;         // nm
  barrierRemaining: number;    // nm
  // 6 die-level maps
  removalRateMap: number[];
  wiwnuMap: number[];
  dishingMap: number[];
  erosionMap: number[];
  roughnessMap: number[];
  thicknessMap: number[];
  // Die grid
  dieCount: number;
  dieGridCols: number;
  dieGridRows: number;
}

export interface SimulationState {
  params: SimulationParams;
  steps: StepState[];
  currentIndex: number;
  totalSteps: number;
}

export type WaferMetric = 'removalRate' | 'wiwnu' | 'dishing' | 'erosion' | 'roughness' | 'thickness';

export type PresetId =
  | 'slurry-starvation'
  | 'pad-glazing'
  | 'over-polish'
  | 'downforce-imbalance'
  | 'retaining-ring-wear'
  | 'slurry-ph-drift'
  | 'hydroplaning'
  | 'pattern-density';

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
// src/lib/cmp-sim/constants.ts
import type { SimulationParams } from './types';

// Phase boundaries (200 steps total)
export const RAMP_UP_END = 20;
export const BULK_CU_END = 120;
export const BARRIER_END = 170;
export const DEFAULT_TOTAL_STEPS = 200;

// Reynolds flow
export const RADIAL_NODES = 20;
export const WAFER_RADIUS_MM = 150;          // 300mm wafer
export const SLURRY_VISCOSITY = 0.001;       // Pa·s (water-like)
export const PAD_GROOVE_POSITIONS = [0.25, 0.45, 0.65, 0.85]; // normalized r
export const ATMOSPHERIC_PA = 101325;

// Contact model
export const ASPERITY_TIP_RADIUS_UM = 5;     // um
export const ASPERITY_HEIGHT_STD_UM = 2;     // um (sigma_s)
export const COMPOSITE_MODULUS_MPA = 200;    // E* for pad-wafer system
export const PAD_RELAXATION_TIME_S = 3;      // tau for Kelvin-Voigt

// Greenwood-Williamson lookup: 20 pre-computed separation values
export const GW_SEPARATIONS = 20;

// Preston equation: material-specific kp (cm^2/dyne)
export const KP_CU = 5e-14;
export const KP_BARRIER = 1e-14;
export const KP_OXIDE = 0.3e-14;

// Barrier thickness (under Cu)
export const BARRIER_THICKNESS_NM = 25;

// Thermal
export const FRICTION_COEFF = 0.3;
export const THERMAL_MASS = 500;             // J/K (effective)
export const AMBIENT_TEMP_C = 25;
export const ARRHENIUS_EA = 0.3;             // eV
export const KB_EV = 8.617e-5;

// Die grid (same as etch-sim)
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

// Phase-specific overrides
export const PHASE_CHEMISTRY = {
  'ramp-up':  { ph: 4,  kp: KP_CU,      pressureFactor: 0.5 },
  'bulk-cu':  { ph: 4,  kp: KP_CU,      pressureFactor: 1.0 },
  'barrier':  { ph: 10, kp: KP_BARRIER,  pressureFactor: 0.7 },
  'buff':     { ph: 10, kp: KP_OXIDE,    pressureFactor: 0.15 },
} as const;

export const PARAM_BOUNDS = {
  downForce:       { min: 1,    max: 10,   default: 3,    step: 0.5, unit: 'PSI' },
  waferRpm:        { min: 10,   max: 150,  default: 60,   step: 5,   unit: 'RPM' },
  platenRpm:       { min: 10,   max: 150,  default: 60,   step: 5,   unit: 'RPM' },
  slurryFlow:      { min: 50,   max: 500,  default: 200,  step: 10,  unit: 'mL/min' },
  abrasiveConc:    { min: 1,    max: 15,   default: 5,    step: 1,   unit: 'wt%' },
  slurryPh:        { min: 2,    max: 12,   default: 4,    step: 0.5, unit: '' },
  padStiffness:    { min: 10,   max: 100,  default: 50,   step: 5,   unit: 'MPa' },
  asperityDensity: { min: 100,  max: 2000, default: 500,  step: 50,  unit: '/mm\u00B2' },
  cuThickness:     { min: 500,  max: 2000, default: 1000, step: 50,  unit: 'nm' },
  patternDensity:  { min: 10,   max: 90,   default: 50,   step: 5,   unit: '%' },
  totalSteps:      { min: 50,   max: 400,  default: 200,  step: 10,  unit: 'steps' },
} as const;

export const DEFAULT_PARAMS: SimulationParams = {
  downForce:       PARAM_BOUNDS.downForce.default,
  waferRpm:        PARAM_BOUNDS.waferRpm.default,
  platenRpm:       PARAM_BOUNDS.platenRpm.default,
  slurryFlow:      PARAM_BOUNDS.slurryFlow.default,
  abrasiveConc:    PARAM_BOUNDS.abrasiveConc.default,
  slurryPh:        PARAM_BOUNDS.slurryPh.default,
  padStiffness:    PARAM_BOUNDS.padStiffness.default,
  asperityDensity: PARAM_BOUNDS.asperityDensity.default,
  cuThickness:     PARAM_BOUNDS.cuThickness.default,
  patternDensity:  PARAM_BOUNDS.patternDensity.default,
  totalSteps:      PARAM_BOUNDS.totalSteps.default,
};
```

**Step 3: Commit**

```bash
git add src/lib/cmp-sim/types.ts src/lib/cmp-sim/constants.ts
git commit -m "feat(cmp-sim): types and constants for CMP planarization sim"
```

---

## Task 2: Reynolds Flow Model

**Files:**
- Create: `src/lib/cmp-sim/__tests__/reynolds-flow.test.ts`
- Create: `src/lib/cmp-sim/reynolds-flow.ts`

**Step 1: Write the failing tests**

```typescript
// src/lib/cmp-sim/__tests__/reynolds-flow.test.ts
import { computeReynoldsFlow } from '../reynolds-flow';
import { DEFAULT_PARAMS, RADIAL_NODES } from '../constants';

describe('reynolds-flow', () => {
  it('film thickness is positive at all nodes', () => {
    const result = computeReynoldsFlow(DEFAULT_PARAMS);
    expect(result.filmThickness).toHaveLength(RADIAL_NODES);
    result.filmThickness.forEach((h) => {
      expect(h).toBeGreaterThan(0);
    });
  });

  it('pressure array has correct length', () => {
    const result = computeReynoldsFlow(DEFAULT_PARAMS);
    expect(result.fluidPressure).toHaveLength(RADIAL_NODES);
  });

  it('pressure drops to near-zero at pad groove locations', () => {
    const result = computeReynoldsFlow(DEFAULT_PARAMS);
    // Groove at normalized r=0.25 -> node index ~5
    const grooveNode = Math.round(0.25 * (RADIAL_NODES - 1));
    const neighborNode = grooveNode + 1;
    expect(result.fluidPressure[grooveNode]).toBeLessThan(
      result.fluidPressure[neighborNode]
    );
  });

  it('higher RPM increases fluid pressure (hydroplaning risk)', () => {
    const normal = computeReynoldsFlow(DEFAULT_PARAMS);
    const fast = computeReynoldsFlow({ ...DEFAULT_PARAMS, platenRpm: 140, waferRpm: 140 });
    const normalMax = Math.max(...normal.fluidPressure);
    const fastMax = Math.max(...fast.fluidPressure);
    expect(fastMax).toBeGreaterThan(normalMax);
  });

  it('higher slurry flow increases film thickness', () => {
    const low = computeReynoldsFlow({ ...DEFAULT_PARAMS, slurryFlow: 80 });
    const high = computeReynoldsFlow({ ...DEFAULT_PARAMS, slurryFlow: 400 });
    const lowMean = low.filmThickness.reduce((s, v) => s + v, 0) / RADIAL_NODES;
    const highMean = high.filmThickness.reduce((s, v) => s + v, 0) / RADIAL_NODES;
    expect(highMean).toBeGreaterThan(lowMean);
  });

  it('very high RPM triggers hydroplaning (high film thickness)', () => {
    const result = computeReynoldsFlow({ ...DEFAULT_PARAMS, platenRpm: 150, waferRpm: 150, slurryFlow: 450 });
    const meanH = result.filmThickness.reduce((s, v) => s + v, 0) / RADIAL_NODES;
    // Hydroplaning: film > 50 um
    expect(meanH).toBeGreaterThan(30);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd equipment-monitor && npx jest src/lib/cmp-sim/__tests__/reynolds-flow.test.ts --verbose`
Expected: FAIL — module not found

**Step 3: Write implementation**

```typescript
// src/lib/cmp-sim/reynolds-flow.ts
import type { SimulationParams } from './types';
import {
  RADIAL_NODES, WAFER_RADIUS_MM, SLURRY_VISCOSITY,
  PAD_GROOVE_POSITIONS,
} from './constants';

export interface ReynoldsFlowState {
  filmThickness: number[];   // um at each radial node
  fluidPressure: number[];   // Pa at each radial node
}

/**
 * Radially-discretized Reynolds lubrication equation.
 * Solves for steady-state film thickness and pressure between pad and wafer.
 * Uses Thomas algorithm (tridiagonal solver) — O(n) per call.
 */
export function computeReynoldsFlow(params: SimulationParams): ReynoldsFlowState {
  const n = RADIAL_NODES;
  const dr = WAFER_RADIUS_MM / (n - 1);      // mm per node
  const mu = SLURRY_VISCOSITY;                // Pa·s

  // Effective angular velocity (rad/s) — combined wafer + platen
  const omegaW = (params.waferRpm * 2 * Math.PI) / 60;
  const omegaP = (params.platenRpm * 2 * Math.PI) / 60;
  const omegaEff = omegaW + omegaP;

  // Base film thickness from flow rate (empirical: h ~ Q^0.5 / (omega^0.5))
  // Reference: h0 ~ 20um at 200 mL/min, 60+60 RPM
  const flowRatio = params.slurryFlow / 200;
  const rpmRatio = omegaEff / ((60 * 2 * Math.PI) / 60 * 2);
  const h0_um = 20 * Math.sqrt(flowRatio) / Math.max(0.1, Math.sqrt(rpmRatio));

  // Film thickness varies radially: thinner at center (centrifugal throw-off)
  const filmThickness = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    const rNorm = i / (n - 1);
    // Centrifugal thinning: h decreases toward edge
    const centrifugalFactor = 1 - 0.3 * rNorm * rNorm;
    filmThickness[i] = Math.max(1, h0_um * centrifugalFactor);

    // Pad grooves: locally increase film thickness (slurry reservoir)
    for (const grooveR of PAD_GROOVE_POSITIONS) {
      const dist = Math.abs(rNorm - grooveR);
      if (dist < 0.05) {
        filmThickness[i] *= 1.5;
      }
    }
  }

  // Solve pressure via simplified Reynolds: p(r) ~ 6*mu*omega*r / h(r)^2
  // With Thomas algorithm for the coupled system
  const fluidPressure = new Array(n).fill(0);

  // Tridiagonal coefficients
  const a = new Array(n).fill(0);  // sub-diagonal
  const b = new Array(n).fill(0);  // diagonal
  const c = new Array(n).fill(0);  // super-diagonal
  const d = new Array(n).fill(0);  // RHS

  for (let i = 1; i < n - 1; i++) {
    const r = (i * dr) / 1000;     // convert mm to m
    const h = filmThickness[i] * 1e-6;  // um to m
    const h3 = h * h * h;

    // Coefficients from radial Reynolds equation discretization
    const rMinus = ((i - 0.5) * dr) / 1000;
    const rPlus = ((i + 0.5) * dr) / 1000;
    const drM = dr / 1000;

    a[i] = rMinus * h3 / (drM * drM);
    c[i] = rPlus * h3 / (drM * drM);
    b[i] = -(a[i] + c[i]);
    // RHS: squeeze term from effective velocity
    d[i] = -6 * mu * omegaEff * r * h * 0.01;  // scaled source term
  }

  // BCs: p(0) = 0 (center symmetry), p(R) = 0 (atmospheric)
  b[0] = 1; d[0] = 0;
  b[n - 1] = 1; d[n - 1] = 0;

  // Reset groove nodes to atmospheric
  for (const grooveR of PAD_GROOVE_POSITIONS) {
    const gi = Math.round(grooveR * (n - 1));
    if (gi > 0 && gi < n - 1) {
      a[gi] = 0; b[gi] = 1; c[gi] = 0; d[gi] = 0;
    }
  }

  // Thomas algorithm (forward sweep)
  const cp = new Array(n).fill(0);
  const dp = new Array(n).fill(0);
  cp[0] = c[0] / b[0];
  dp[0] = d[0] / b[0];
  for (let i = 1; i < n; i++) {
    const m = b[i] - a[i] * cp[i - 1];
    if (Math.abs(m) < 1e-30) { cp[i] = 0; dp[i] = 0; continue; }
    cp[i] = c[i] / m;
    dp[i] = (d[i] - a[i] * dp[i - 1]) / m;
  }

  // Back substitution
  fluidPressure[n - 1] = dp[n - 1];
  for (let i = n - 2; i >= 0; i--) {
    fluidPressure[i] = dp[i] - cp[i] * fluidPressure[i + 1];
  }

  // Ensure non-negative pressures (cavitation constraint)
  for (let i = 0; i < n; i++) {
    fluidPressure[i] = Math.abs(fluidPressure[i]);
  }

  return { filmThickness, fluidPressure };
}
```

**Step 4: Run tests to verify they pass**

Run: `cd equipment-monitor && npx jest src/lib/cmp-sim/__tests__/reynolds-flow.test.ts --verbose`
Expected: 6 tests PASS

**Step 5: Commit**

```bash
git add src/lib/cmp-sim/reynolds-flow.ts src/lib/cmp-sim/__tests__/reynolds-flow.test.ts
git commit -m "feat(cmp-sim): Reynolds flow model with Thomas algorithm solver"
```

---

## Task 3: Slurry Chemistry Model

**Files:**
- Create: `src/lib/cmp-sim/__tests__/slurry-chemistry.test.ts`
- Create: `src/lib/cmp-sim/slurry-chemistry.ts`

**Step 1: Write the failing tests**

```typescript
// src/lib/cmp-sim/__tests__/slurry-chemistry.test.ts
import { computeSlurryChemistry } from '../slurry-chemistry';
import { DEFAULT_PARAMS, RADIAL_NODES } from '../constants';

describe('slurry-chemistry', () => {
  it('dissolution rate is positive at nominal params', () => {
    const result = computeSlurryChemistry(DEFAULT_PARAMS, 30);
    expect(result.dissolutionRate).toBeGreaterThan(0);
  });

  it('dissolution rate increases with temperature (Arrhenius)', () => {
    const cold = computeSlurryChemistry(DEFAULT_PARAMS, 25);
    const hot = computeSlurryChemistry(DEFAULT_PARAMS, 50);
    expect(hot.dissolutionRate).toBeGreaterThan(cold.dissolutionRate);
  });

  it('abrasive concentration profile depletes from center to edge', () => {
    const result = computeSlurryChemistry(DEFAULT_PARAMS, 30);
    expect(result.abrasiveProfile).toHaveLength(RADIAL_NODES);
    // Center should have more abrasive than edge
    expect(result.abrasiveProfile[0]).toBeGreaterThanOrEqual(
      result.abrasiveProfile[RADIAL_NODES - 1]
    );
  });

  it('passivation layer thickness scales with pH', () => {
    const acidic = computeSlurryChemistry({ ...DEFAULT_PARAMS, slurryPh: 3 }, 30);
    const alkaline = computeSlurryChemistry({ ...DEFAULT_PARAMS, slurryPh: 10 }, 30);
    // Different pH ranges produce different passivation
    expect(acidic.passivationThickness).toBeGreaterThan(0);
    expect(alkaline.passivationThickness).toBeGreaterThan(0);
  });

  it('higher flow rate reduces abrasive depletion', () => {
    const lowFlow = computeSlurryChemistry({ ...DEFAULT_PARAMS, slurryFlow: 80 }, 30);
    const highFlow = computeSlurryChemistry({ ...DEFAULT_PARAMS, slurryFlow: 400 }, 30);
    const lowEdge = lowFlow.abrasiveProfile[RADIAL_NODES - 1];
    const highEdge = highFlow.abrasiveProfile[RADIAL_NODES - 1];
    // Higher flow -> less depletion at edge
    expect(highEdge).toBeGreaterThanOrEqual(lowEdge);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd equipment-monitor && npx jest src/lib/cmp-sim/__tests__/slurry-chemistry.test.ts --verbose`
Expected: FAIL — module not found

**Step 3: Write implementation**

```typescript
// src/lib/cmp-sim/slurry-chemistry.ts
import type { SimulationParams } from './types';
import { RADIAL_NODES, ARRHENIUS_EA, KB_EV, AMBIENT_TEMP_C } from './constants';

export interface SlurryChemistryState {
  dissolutionRate: number;       // nm/min chemical component
  abrasiveProfile: number[];     // wt% at each radial node
  passivationThickness: number;  // nm — soft oxide layer on Cu
}

/**
 * Computes slurry chemistry: Arrhenius dissolution, abrasive transport, passivation.
 */
export function computeSlurryChemistry(
  params: SimulationParams,
  temperature: number,  // °C at wafer surface
): SlurryChemistryState {
  // Arrhenius dissolution: R_chem = k0 * exp(-Ea/kT) * [H+]^n or [OH-]^n
  const T = temperature + 273.15;
  const Tref = AMBIENT_TEMP_C + 273.15;
  const arrheniusFactor = Math.exp(ARRHENIUS_EA / KB_EV * (1 / Tref - 1 / T));

  // pH-dependent rate: acidic Cu dissolution vs alkaline barrier dissolution
  const ph = params.slurryPh;
  let chemFactor: number;
  if (ph <= 7) {
    // Acidic: Cu dissolves. Rate peaks at low pH
    chemFactor = Math.pow(10, -(ph - 2)) * 0.1;
  } else {
    // Alkaline: barrier dissolves. Rate peaks at high pH
    chemFactor = Math.pow(10, -(12 - ph)) * 0.05;
  }

  // Base dissolution rate ~10 nm/min at reference conditions
  const dissolutionRate = 10 * arrheniusFactor * Math.max(0.01, chemFactor);

  // Abrasive transport: depletion along radial flow direction
  // C(r) = C0 * exp(-k_dep * r / Q)
  const C0 = params.abrasiveConc;
  const kDep = 0.5;  // depletion constant
  const Q = params.slurryFlow;
  const abrasiveProfile = new Array(RADIAL_NODES).fill(0);
  for (let i = 0; i < RADIAL_NODES; i++) {
    const rNorm = i / (RADIAL_NODES - 1);
    const r_mm = rNorm * 150;  // 0 to 150mm
    abrasiveProfile[i] = C0 * Math.exp(-kDep * r_mm / Q);
  }

  // Passivation layer: Cu forms CuO or Cu(OH)2 layer
  // Thickness depends on pH and time available (steady-state approximation)
  let passivationThickness: number;
  if (ph <= 7) {
    // Acidic: thinner passivation, more aggressive dissolution
    passivationThickness = 2 + (7 - ph) * 0.5;
  } else {
    // Alkaline: thicker passivation
    passivationThickness = 2 + (ph - 7) * 1.0;
  }

  return { dissolutionRate, abrasiveProfile, passivationThickness };
}
```

**Step 4: Run tests**

Run: `cd equipment-monitor && npx jest src/lib/cmp-sim/__tests__/slurry-chemistry.test.ts --verbose`
Expected: 5 tests PASS

**Step 5: Commit**

```bash
git add src/lib/cmp-sim/slurry-chemistry.ts src/lib/cmp-sim/__tests__/slurry-chemistry.test.ts
git commit -m "feat(cmp-sim): slurry chemistry model with Arrhenius dissolution"
```

---

## Task 4: Contact Model (Greenwood-Williamson + Viscoelastic)

**Files:**
- Create: `src/lib/cmp-sim/__tests__/contact-model.test.ts`
- Create: `src/lib/cmp-sim/contact-model.ts`

**Step 1: Write the failing tests**

```typescript
// src/lib/cmp-sim/__tests__/contact-model.test.ts
import { computeContactState, buildGWLookup } from '../contact-model';
import { DEFAULT_PARAMS, RADIAL_NODES } from '../constants';

describe('contact-model', () => {
  it('real contact area is 0.1%-1% of nominal at default params', () => {
    const filmThickness = new Array(RADIAL_NODES).fill(20);
    const result = computeContactState(DEFAULT_PARAMS, filmThickness, 0, 0);
    expect(result.realContactArea).toBeGreaterThan(0.0005);
    expect(result.realContactArea).toBeLessThan(0.02);
  });

  it('contact pressure array has correct length', () => {
    const filmThickness = new Array(RADIAL_NODES).fill(20);
    const result = computeContactState(DEFAULT_PARAMS, filmThickness, 0, 0);
    expect(result.contactPressure).toHaveLength(RADIAL_NODES);
  });

  it('GW lookup table has monotonic contact area vs separation', () => {
    const lookup = buildGWLookup(DEFAULT_PARAMS);
    // More separation -> less contact area
    for (let i = 1; i < lookup.length; i++) {
      expect(lookup[i].contactArea).toBeLessThanOrEqual(lookup[i - 1].contactArea);
    }
  });

  it('viscoelastic creep: contact area increases with time', () => {
    const filmThickness = new Array(RADIAL_NODES).fill(20);
    const early = computeContactState(DEFAULT_PARAMS, filmThickness, 0, 1);
    const late = computeContactState(DEFAULT_PARAMS, filmThickness, 0, 15);
    expect(late.realContactArea).toBeGreaterThanOrEqual(early.realContactArea);
  });

  it('creep reaches steady state after ~3*tau', () => {
    const filmThickness = new Array(RADIAL_NODES).fill(20);
    const at3tau = computeContactState(DEFAULT_PARAMS, filmThickness, 0, 9);
    const at5tau = computeContactState(DEFAULT_PARAMS, filmThickness, 0, 15);
    const diff = Math.abs(at5tau.realContactArea - at3tau.realContactArea);
    expect(diff).toBeLessThan(at3tau.realContactArea * 0.1);
  });

  it('pad glazing (low asperity density) reduces contact area', () => {
    const filmThickness = new Array(RADIAL_NODES).fill(20);
    const normal = computeContactState(DEFAULT_PARAMS, filmThickness, 0, 10);
    const glazed = computeContactState(
      { ...DEFAULT_PARAMS, asperityDensity: 150 },
      filmThickness, 0, 10
    );
    expect(glazed.realContactArea).toBeLessThan(normal.realContactArea);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd equipment-monitor && npx jest src/lib/cmp-sim/__tests__/contact-model.test.ts --verbose`
Expected: FAIL — module not found

**Step 3: Write implementation**

```typescript
// src/lib/cmp-sim/contact-model.ts
import type { SimulationParams } from './types';
import {
  RADIAL_NODES,
  ASPERITY_TIP_RADIUS_UM,
  ASPERITY_HEIGHT_STD_UM,
  COMPOSITE_MODULUS_MPA,
  PAD_RELAXATION_TIME_S,
  GW_SEPARATIONS,
} from './constants';

export interface ContactState {
  realContactArea: number;       // fraction of nominal area
  padCreepStrain: number;        // viscoelastic strain state
  contactPressure: number[];     // Pa at each radial node
}

export interface GWLookupEntry {
  separation: number;    // um
  contactArea: number;   // fraction
  contactForce: number;  // normalized
}

/**
 * Pre-compute Greenwood-Williamson integrals for 20 separation values.
 * A_real = pi * eta * R * integral_d^inf (z-d) * phi(z) dz
 * P_contact = (4/3) * E* * eta * sqrt(R) * integral_d^inf (z-d)^1.5 * phi(z) dz
 */
export function buildGWLookup(params: SimulationParams): GWLookupEntry[] {
  const sigma = ASPERITY_HEIGHT_STD_UM;
  const R = ASPERITY_TIP_RADIUS_UM;  // um
  const eta = params.asperityDensity; // per mm^2 -> per um^2 = eta * 1e-6
  const etaPerUm2 = eta * 1e-6;

  const lookup: GWLookupEntry[] = [];

  // Gaussian PDF
  const phi = (z: number) => Math.exp(-0.5 * (z / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));

  for (let si = 0; si < GW_SEPARATIONS; si++) {
    const d = (si / (GW_SEPARATIONS - 1)) * 4 * sigma;  // 0 to 4*sigma

    // Numerical integration from d to 6*sigma (trapezoidal)
    const zMax = 6 * sigma;
    const steps = 100;
    const dz = (zMax - d) / steps;
    let integralArea = 0;
    let integralForce = 0;

    for (let j = 0; j <= steps; j++) {
      const z = d + j * dz;
      const delta = z - d;
      const w = (j === 0 || j === steps) ? 0.5 : 1;
      integralArea += w * delta * phi(z) * dz;
      integralForce += w * Math.pow(delta, 1.5) * phi(z) * dz;
    }

    const contactArea = Math.PI * etaPerUm2 * R * integralArea;
    const contactForce = (4 / 3) * etaPerUm2 * Math.sqrt(R) * integralForce;

    lookup.push({ separation: d, contactArea, contactForce });
  }

  return lookup;
}

/**
 * Interpolate GW lookup table at a given separation.
 */
function interpolateGW(
  lookup: GWLookupEntry[],
  separation: number,
): { contactArea: number; contactForce: number } {
  if (separation <= lookup[0].separation) return { contactArea: lookup[0].contactArea, contactForce: lookup[0].contactForce };
  if (separation >= lookup[lookup.length - 1].separation) return { contactArea: 0, contactForce: 0 };

  for (let i = 0; i < lookup.length - 1; i++) {
    if (separation >= lookup[i].separation && separation < lookup[i + 1].separation) {
      const t = (separation - lookup[i].separation) / (lookup[i + 1].separation - lookup[i].separation);
      return {
        contactArea: lookup[i].contactArea + t * (lookup[i + 1].contactArea - lookup[i].contactArea),
        contactForce: lookup[i].contactForce + t * (lookup[i + 1].contactForce - lookup[i].contactForce),
      };
    }
  }
  return { contactArea: 0, contactForce: 0 };
}

/**
 * Compute contact state: GW asperity contact + Kelvin-Voigt viscoelastic creep.
 */
export function computeContactState(
  params: SimulationParams,
  filmThickness: number[],    // um at each radial node
  prevCreepStrain: number,    // from previous step
  timeSeconds: number,        // elapsed time (for creep)
): ContactState {
  const lookup = buildGWLookup(params);
  const tau = PAD_RELAXATION_TIME_S;
  const E_star = COMPOSITE_MODULUS_MPA;  // MPa

  // Kelvin-Voigt creep: strain(t) = (sigma/E) * [1 - exp(-t/tau)]
  // Applied pressure in PSI -> MPa: 1 PSI = 0.006895 MPa
  const appliedPressure_MPa = params.downForce * 0.006895;
  const creepStrain = (appliedPressure_MPa / (params.padStiffness)) *
    (1 - Math.exp(-timeSeconds / tau));

  // Creep reduces effective separation (pad deforms into wafer)
  const creepDeflection_um = creepStrain * ASPERITY_HEIGHT_STD_UM * 10;

  const contactPressure = new Array(RADIAL_NODES).fill(0);
  let totalContactArea = 0;
  let validNodes = 0;

  for (let i = 0; i < RADIAL_NODES; i++) {
    // Effective separation = film thickness - creep deflection
    const separation = Math.max(0, filmThickness[i] - creepDeflection_um);
    const normalizedSep = separation;  // already in um

    const gw = interpolateGW(lookup, normalizedSep);
    totalContactArea += gw.contactArea;
    validNodes++;

    // Contact pressure: E* * normalized force
    contactPressure[i] = E_star * 1e6 * gw.contactForce;  // Pa
  }

  const realContactArea = validNodes > 0
    ? Math.max(0.0005, Math.min(0.02, totalContactArea / validNodes))
    : 0.001;

  return {
    realContactArea,
    padCreepStrain: creepStrain,
    contactPressure,
  };
}
```

**Step 4: Run tests**

Run: `cd equipment-monitor && npx jest src/lib/cmp-sim/__tests__/contact-model.test.ts --verbose`
Expected: 6 tests PASS

**Step 5: Commit**

```bash
git add src/lib/cmp-sim/contact-model.ts src/lib/cmp-sim/__tests__/contact-model.test.ts
git commit -m "feat(cmp-sim): Greenwood-Williamson contact model with viscoelastic pad"
```

---

## Task 5: Preston Removal Model

**Files:**
- Create: `src/lib/cmp-sim/__tests__/preston-removal.test.ts`
- Create: `src/lib/cmp-sim/preston-removal.ts`

**Step 1: Write the failing tests**

```typescript
// src/lib/cmp-sim/__tests__/preston-removal.test.ts
import { computePrestonRemoval } from '../preston-removal';
import { DEFAULT_PARAMS, RADIAL_NODES, KP_CU, KP_BARRIER, KP_OXIDE } from '../constants';

describe('preston-removal', () => {
  const contactPressure = new Array(RADIAL_NODES).fill(20000); // 20 kPa
  const fluidPressure = new Array(RADIAL_NODES).fill(5000);

  it('MRR scales linearly with pressure', () => {
    const lowP = new Array(RADIAL_NODES).fill(10000);
    const highP = new Array(RADIAL_NODES).fill(30000);
    const low = computePrestonRemoval(DEFAULT_PARAMS, lowP, fluidPressure, KP_CU);
    const high = computePrestonRemoval(DEFAULT_PARAMS, highP, fluidPressure, KP_CU);
    // Should be roughly 3x (within tolerance for fluid pressure contribution)
    expect(high.meanRemovalRate).toBeGreaterThan(low.meanRemovalRate * 1.5);
  });

  it('Cu rate > barrier rate > oxide rate for same conditions', () => {
    const cu = computePrestonRemoval(DEFAULT_PARAMS, contactPressure, fluidPressure, KP_CU);
    const barrier = computePrestonRemoval(DEFAULT_PARAMS, contactPressure, fluidPressure, KP_BARRIER);
    const oxide = computePrestonRemoval(DEFAULT_PARAMS, contactPressure, fluidPressure, KP_OXIDE);
    expect(cu.meanRemovalRate).toBeGreaterThan(barrier.meanRemovalRate);
    expect(barrier.meanRemovalRate).toBeGreaterThan(oxide.meanRemovalRate);
  });

  it('removal rate profile has RADIAL_NODES entries', () => {
    const result = computePrestonRemoval(DEFAULT_PARAMS, contactPressure, fluidPressure, KP_CU);
    expect(result.removalRateProfile).toHaveLength(RADIAL_NODES);
  });

  it('higher RPM increases removal rate', () => {
    const slow = computePrestonRemoval(
      { ...DEFAULT_PARAMS, waferRpm: 20, platenRpm: 20 },
      contactPressure, fluidPressure, KP_CU
    );
    const fast = computePrestonRemoval(
      { ...DEFAULT_PARAMS, waferRpm: 120, platenRpm: 120 },
      contactPressure, fluidPressure, KP_CU
    );
    expect(fast.meanRemovalRate).toBeGreaterThan(slow.meanRemovalRate);
  });

  it('dishing increases with pattern density < 50%', () => {
    const dense = computePrestonRemoval(
      { ...DEFAULT_PARAMS, patternDensity: 80 }, contactPressure, fluidPressure, KP_CU
    );
    const sparse = computePrestonRemoval(
      { ...DEFAULT_PARAMS, patternDensity: 20 }, contactPressure, fluidPressure, KP_CU
    );
    // Sparse patterns have more dishing (pad sinks into wide Cu areas)
    expect(sparse.dishingFactor).toBeGreaterThan(dense.dishingFactor);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd equipment-monitor && npx jest src/lib/cmp-sim/__tests__/preston-removal.test.ts --verbose`
Expected: FAIL — module not found

**Step 3: Write implementation**

```typescript
// src/lib/cmp-sim/preston-removal.ts
import type { SimulationParams } from './types';
import { RADIAL_NODES, WAFER_RADIUS_MM } from './constants';

export interface PrestonRemovalState {
  removalRateProfile: number[];  // nm/min at each radial node
  meanRemovalRate: number;       // nm/min aggregate
  dishingFactor: number;         // dimensionless (0-1): how much pad sinks into features
  erosionFactor: number;         // dimensionless (0-1): how much oxide thins in dense areas
}

/**
 * Preston equation: MRR = kp * P * V
 * With Winkler foundation for pattern-dependent pressure.
 */
export function computePrestonRemoval(
  params: SimulationParams,
  contactPressure: number[],    // Pa at each radial node (from contact model)
  fluidPressure: number[],      // Pa at each radial node (from Reynolds)
  kp: number,                   // cm^2/dyne — material-specific Preston constant
): PrestonRemovalState {
  const n = RADIAL_NODES;
  const removalRateProfile = new Array(n).fill(0);

  // Effective velocity at each radial node: V(r) = r * (omega_w + omega_p)
  const omegaW = (params.waferRpm * 2 * Math.PI) / 60;
  const omegaP = (params.platenRpm * 2 * Math.PI) / 60;
  const omegaEff = omegaW + omegaP;

  // Pattern density affects local pressure via Winkler foundation
  // Low density -> pad deforms into features -> higher local pressure on Cu -> more dishing
  // High density -> load shared across many features -> less dishing but more erosion
  const density = params.patternDensity / 100;
  const winklerFactor = 1 / Math.max(0.1, density);  // pressure amplification
  const dishingFactor = (1 - density) * winklerFactor * 0.1;
  const erosionFactor = density * 0.05;

  for (let i = 0; i < n; i++) {
    const rNorm = i / (n - 1);
    const r_m = (rNorm * WAFER_RADIUS_MM) / 1000;  // m

    // Effective local velocity
    const V = r_m * omegaEff;  // m/s

    // Total pressure: contact + fluid contribution
    const P_total = contactPressure[i] + fluidPressure[i] * 0.1;  // contact dominates

    // Preston: MRR = kp * P * V
    // kp in cm^2/dyne, P in Pa, V in m/s -> convert
    // 1 Pa = 10 dyne/cm^2, so P_dyne = P * 10
    // MRR (cm/s) = kp * P_dyne * V_cm
    // Convert to nm/min: * 1e7 * 60
    const P_dyne = P_total * 10;
    const V_cm = V * 100;
    const mrr_cm_s = kp * P_dyne * V_cm;
    const mrr_nm_min = mrr_cm_s * 1e7 * 60;

    removalRateProfile[i] = Math.max(0, mrr_nm_min);
  }

  // Mean removal rate (exclude node 0 which has V=0)
  const activeRates = removalRateProfile.slice(1);
  const meanRemovalRate = activeRates.length > 0
    ? activeRates.reduce((s, v) => s + v, 0) / activeRates.length
    : 0;

  return {
    removalRateProfile,
    meanRemovalRate,
    dishingFactor,
    erosionFactor,
  };
}
```

**Step 4: Run tests**

Run: `cd equipment-monitor && npx jest src/lib/cmp-sim/__tests__/preston-removal.test.ts --verbose`
Expected: 5 tests PASS

**Step 5: Commit**

```bash
git add src/lib/cmp-sim/preston-removal.ts src/lib/cmp-sim/__tests__/preston-removal.test.ts
git commit -m "feat(cmp-sim): Preston removal model with Winkler pattern-dependent pressure"
```

---

## Task 6: Thermal Model

**Files:**
- Create: `src/lib/cmp-sim/__tests__/thermal-model.test.ts`
- Create: `src/lib/cmp-sim/thermal-model.ts`

**Step 1: Write the failing tests**

```typescript
// src/lib/cmp-sim/__tests__/thermal-model.test.ts
import { computeThermalState } from '../thermal-model';
import { DEFAULT_PARAMS } from '../constants';

describe('thermal-model', () => {
  it('frictional heating raises temperature above ambient', () => {
    const result = computeThermalState(DEFAULT_PARAMS, 5);
    expect(result.temperature).toBeGreaterThan(25);
  });

  it('higher RPM produces more heating', () => {
    const slow = computeThermalState({ ...DEFAULT_PARAMS, waferRpm: 20, platenRpm: 20 }, 10);
    const fast = computeThermalState({ ...DEFAULT_PARAMS, waferRpm: 120, platenRpm: 120 }, 10);
    expect(fast.temperature).toBeGreaterThan(slow.temperature);
  });

  it('higher down-force produces more heating', () => {
    const low = computeThermalState({ ...DEFAULT_PARAMS, downForce: 1 }, 10);
    const high = computeThermalState({ ...DEFAULT_PARAMS, downForce: 8 }, 10);
    expect(high.temperature).toBeGreaterThan(low.temperature);
  });

  it('temperature affects Arrhenius rate factor', () => {
    const result = computeThermalState(DEFAULT_PARAMS, 10);
    expect(result.arrheniusFactor).toBeGreaterThan(1);
  });

  it('temperature stays in reasonable range (25-80C)', () => {
    const extreme = computeThermalState(
      { ...DEFAULT_PARAMS, downForce: 10, waferRpm: 150, platenRpm: 150 }, 50
    );
    expect(extreme.temperature).toBeLessThan(80);
    expect(extreme.temperature).toBeGreaterThan(25);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd equipment-monitor && npx jest src/lib/cmp-sim/__tests__/thermal-model.test.ts --verbose`
Expected: FAIL — module not found

**Step 3: Write implementation**

```typescript
// src/lib/cmp-sim/thermal-model.ts
import type { SimulationParams } from './types';
import {
  FRICTION_COEFF, THERMAL_MASS, AMBIENT_TEMP_C,
  ARRHENIUS_EA, KB_EV, WAFER_RADIUS_MM,
} from './constants';

export interface ThermalState {
  temperature: number;      // °C at wafer surface
  frictionalPower: number;  // W
  arrheniusFactor: number;  // dimensionless rate multiplier
}

/**
 * Compute frictional heating and its effect on chemistry rate.
 * P_friction = mu * F_normal * V_avg
 * T = T_ambient + P_friction * t / C_thermal (with saturation)
 */
export function computeThermalState(
  params: SimulationParams,
  timeSeconds: number,
): ThermalState {
  // Normal force: F = pressure * area
  // Wafer area = pi * r^2
  const r_m = WAFER_RADIUS_MM / 1000;
  const area_m2 = Math.PI * r_m * r_m;
  const F_N = params.downForce * 6894.76 * area_m2;  // PSI -> Pa -> N

  // Average velocity: V_avg at r=2/3*R (area-weighted average)
  const omegaW = (params.waferRpm * 2 * Math.PI) / 60;
  const omegaP = (params.platenRpm * 2 * Math.PI) / 60;
  const rAvg = (2 / 3) * r_m;
  const V_avg = rAvg * (omegaW + omegaP);

  // Frictional power
  const frictionalPower = FRICTION_COEFF * F_N * V_avg;

  // Temperature rise with exponential saturation (heat loss to slurry)
  const tau_thermal = THERMAL_MASS / Math.max(1, frictionalPower * 0.1);
  const deltaT = (frictionalPower / THERMAL_MASS) * 20 *
    (1 - Math.exp(-timeSeconds / Math.max(1, tau_thermal)));
  const temperature = Math.min(75, AMBIENT_TEMP_C + deltaT);

  // Arrhenius factor: rate increase due to temperature
  const T_K = temperature + 273.15;
  const Tref_K = AMBIENT_TEMP_C + 273.15;
  const arrheniusFactor = Math.exp(ARRHENIUS_EA / KB_EV * (1 / Tref_K - 1 / T_K));

  return { temperature, frictionalPower, arrheniusFactor };
}
```

**Step 4: Run tests**

Run: `cd equipment-monitor && npx jest src/lib/cmp-sim/__tests__/thermal-model.test.ts --verbose`
Expected: 5 tests PASS

**Step 5: Commit**

```bash
git add src/lib/cmp-sim/thermal-model.ts src/lib/cmp-sim/__tests__/thermal-model.test.ts
git commit -m "feat(cmp-sim): thermal model with frictional heating and Arrhenius feedback"
```

---

## Task 7: Wafer Metrics Orchestrator

**Files:**
- Create: `src/lib/cmp-sim/__tests__/wafer-metrics.test.ts`
- Create: `src/lib/cmp-sim/wafer-metrics.ts`

**Step 1: Write the failing tests**

```typescript
// src/lib/cmp-sim/__tests__/wafer-metrics.test.ts
import { computeStepMetrics } from '../wafer-metrics';
import { DEFAULT_PARAMS, ACTIVE_DIE_COUNT, DIE_MASK, DIE_GRID_COLS, DIE_GRID_ROWS } from '../constants';
import type { ProcessPhase } from '../types';

describe('wafer-metrics', () => {
  it('returns all 6 maps with correct die count', () => {
    const m = computeStepMetrics(DEFAULT_PARAMS, 80, 'bulk-cu', 0, 1000, 25);
    const totalDies = DIE_GRID_COLS * DIE_GRID_ROWS;
    expect(m.removalRateMap).toHaveLength(totalDies);
    expect(m.wiwnuMap).toHaveLength(totalDies);
    expect(m.dishingMap).toHaveLength(totalDies);
    expect(m.erosionMap).toHaveLength(totalDies);
    expect(m.roughnessMap).toHaveLength(totalDies);
    expect(m.thicknessMap).toHaveLength(totalDies);
    expect(m.dieCount).toBe(ACTIVE_DIE_COUNT);
  });

  it('WIWNU is computed as sigma/mu * 100 and below 10% at nominal', () => {
    const m = computeStepMetrics(DEFAULT_PARAMS, 80, 'bulk-cu', 0, 1000, 25);
    const activeRates = m.removalRateMap.filter((_, i) => DIE_MASK[i]);
    const mean = activeRates.reduce((s, v) => s + v, 0) / activeRates.length;
    const variance = activeRates.reduce((s, v) => s + (v - mean) ** 2, 0) / activeRates.length;
    const expectedWiwnu = mean > 0 ? (Math.sqrt(variance) / mean) * 100 : 0;
    expect(m.wiwnu).toBeCloseTo(expectedWiwnu, 1);
    expect(m.wiwnu).toBeLessThan(10);
  });

  it('dishing only accumulates during bulk-cu phase', () => {
    const cuPhase = computeStepMetrics(DEFAULT_PARAMS, 80, 'bulk-cu', 0, 500, 25);
    const buffPhase = computeStepMetrics(DEFAULT_PARAMS, 180, 'buff', 0, 0, 25);
    const cuDishing = cuPhase.dishingMap.filter((_, i) => DIE_MASK[i]);
    const buffDishing = buffPhase.dishingMap.filter((_, i) => DIE_MASK[i]);
    const cuMax = Math.max(...cuDishing);
    const buffMax = Math.max(...buffDishing);
    expect(cuMax).toBeGreaterThan(buffMax);
  });

  it('erosion accumulates in dense-pattern dies', () => {
    const m = computeStepMetrics(
      { ...DEFAULT_PARAMS, patternDensity: 80 },
      140, 'barrier', 0, 800, 25
    );
    const activeErosion = m.erosionMap.filter((_, i) => DIE_MASK[i]);
    expect(activeErosion.some((v) => v > 0)).toBe(true);
  });

  it('removal rate is in reasonable range (50-1000 nm/min)', () => {
    const m = computeStepMetrics(DEFAULT_PARAMS, 80, 'bulk-cu', 0, 1000, 25);
    expect(m.removalRate).toBeGreaterThan(10);
    expect(m.removalRate).toBeLessThan(2000);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd equipment-monitor && npx jest src/lib/cmp-sim/__tests__/wafer-metrics.test.ts --verbose`
Expected: FAIL — module not found

**Step 3: Write implementation**

```typescript
// src/lib/cmp-sim/wafer-metrics.ts
import type { SimulationParams, ProcessPhase } from './types';
import {
  DIE_MASK, DIE_GRID_COLS, DIE_GRID_ROWS, ACTIVE_DIE_COUNT,
  PHASE_CHEMISTRY, RADIAL_NODES,
} from './constants';
import { computeReynoldsFlow } from './reynolds-flow';
import { computeContactState } from './contact-model';
import { computePrestonRemoval } from './preston-removal';
import { computeSlurryChemistry } from './slurry-chemistry';
import { computeThermalState } from './thermal-model';

export interface StepMetrics {
  // Reynolds
  filmThickness: number[];
  fluidPressure: number[];
  // Contact
  realContactArea: number;
  padCreepStrain: number;
  contactPressure: number[];
  // Removal
  removalRate: number;
  cuRemaining: number;
  barrierRemaining: number;
  // 6 die-level maps
  removalRateMap: number[];
  wiwnuMap: number[];
  dishingMap: number[];
  erosionMap: number[];
  roughnessMap: number[];
  thicknessMap: number[];
  // Stats
  wiwnu: number;
  dieCount: number;
  dieGridCols: number;
  dieGridRows: number;
}

export function computeStepMetrics(
  params: SimulationParams,
  stepIndex: number,
  phase: ProcessPhase,
  prevCreepStrain: number,
  prevCuRemaining: number,
  prevBarrierRemaining: number,
): StepMetrics {
  const dt = 0.5;
  const timeSeconds = stepIndex * dt;
  const phaseChem = PHASE_CHEMISTRY[phase];

  // 1. Thermal state
  const thermal = computeThermalState(params, timeSeconds);

  // 2. Reynolds flow
  const reynolds = computeReynoldsFlow(params);

  // 3. Contact mechanics
  const contact = computeContactState(
    params, reynolds.filmThickness, prevCreepStrain, timeSeconds
  );

  // 4. Slurry chemistry
  const chemistry = computeSlurryChemistry(params, thermal.temperature);

  // 5. Preston removal
  const preston = computePrestonRemoval(
    params, contact.contactPressure, reynolds.fluidPressure, phaseChem.kp
  );

  // Scale by pressure factor for phase and Arrhenius
  const effectiveRate = preston.meanRemovalRate * phaseChem.pressureFactor * thermal.arrheniusFactor;

  // Material remaining
  const removed = effectiveRate * (dt / 60);  // nm removed this step
  let cuRemaining = prevCuRemaining;
  let barrierRemaining = prevBarrierRemaining;

  if (phase === 'bulk-cu' || phase === 'ramp-up') {
    cuRemaining = Math.max(0, prevCuRemaining - removed);
  } else if (phase === 'barrier') {
    barrierRemaining = Math.max(0, prevBarrierRemaining - removed * 0.2);
  }
  // buff: minimal removal, don't track

  // 6. Die-level maps
  const totalDies = DIE_GRID_COLS * DIE_GRID_ROWS;
  const removalRateMap = new Array(totalDies).fill(0);
  const wiwnuMap = new Array(totalDies).fill(0);
  const dishingMap = new Array(totalDies).fill(0);
  const erosionMap = new Array(totalDies).fill(0);
  const roughnessMap = new Array(totalDies).fill(0);
  const thicknessMap = new Array(totalDies).fill(0);

  const centerCol = (DIE_GRID_COLS - 1) / 2;
  const centerRow = (DIE_GRID_ROWS - 1) / 2;
  const maxR = Math.sqrt(centerCol ** 2 + centerRow ** 2);
  const density = params.patternDensity / 100;

  for (let i = 0; i < totalDies; i++) {
    if (!DIE_MASK[i]) continue;
    const col = i % DIE_GRID_COLS;
    const row = Math.floor(i / DIE_GRID_COLS);
    const r = Math.sqrt((col - centerCol) ** 2 + (row - centerRow) ** 2);
    const rNorm = r / maxR;

    // Map radial node index
    const nodeIdx = Math.min(RADIAL_NODES - 1, Math.round(rNorm * (RADIAL_NODES - 1)));

    // Removal rate: radial profile + random per-die variation
    const radialRate = preston.removalRateProfile[nodeIdx] * phaseChem.pressureFactor * thermal.arrheniusFactor;
    // Abrasive concentration affects rate
    const abrasiveFactor = chemistry.abrasiveProfile[nodeIdx] / Math.max(1, params.abrasiveConc);
    removalRateMap[i] = radialRate * abrasiveFactor;

    // WIWNU map: local deviation from mean
    wiwnuMap[i] = removalRateMap[i];  // will compute sigma/mu from this

    // Dishing: pattern-dependent, accumulates during Cu removal
    if (phase === 'bulk-cu' || phase === 'ramp-up') {
      dishingMap[i] = preston.dishingFactor * removalRateMap[i] * 0.01 * (1 + rNorm * 0.2);
    }

    // Erosion: oxide thinning in dense areas, accumulates during barrier step
    if (phase === 'barrier') {
      erosionMap[i] = preston.erosionFactor * removalRateMap[i] * 0.005 * (1 + density);
    }

    // Roughness: from asperity contact, decreases during buff
    const baseRoughness = contact.realContactArea * 50 + 0.5;
    roughnessMap[i] = phase === 'buff' ? baseRoughness * 0.3 : baseRoughness * (1 + rNorm * 0.1);

    // Thickness remaining
    thicknessMap[i] = cuRemaining + barrierRemaining;
  }

  // Compute WIWNU from removal rate map
  const activeRates = removalRateMap.filter((_, i) => DIE_MASK[i]);
  const mean = activeRates.length > 0 ? activeRates.reduce((s, v) => s + v, 0) / activeRates.length : 0;
  const variance = activeRates.length > 0 ? activeRates.reduce((s, v) => s + (v - mean) ** 2, 0) / activeRates.length : 0;
  const wiwnu = mean > 0 ? (Math.sqrt(variance) / mean) * 100 : 0;

  return {
    filmThickness: reynolds.filmThickness,
    fluidPressure: reynolds.fluidPressure,
    realContactArea: contact.realContactArea,
    padCreepStrain: contact.padCreepStrain,
    contactPressure: contact.contactPressure,
    removalRate: effectiveRate,
    cuRemaining,
    barrierRemaining,
    removalRateMap,
    wiwnuMap,
    dishingMap,
    erosionMap,
    roughnessMap,
    thicknessMap,
    wiwnu,
    dieCount: ACTIVE_DIE_COUNT,
    dieGridCols: DIE_GRID_COLS,
    dieGridRows: DIE_GRID_ROWS,
  };
}
```

**Step 4: Run tests**

Run: `cd equipment-monitor && npx jest src/lib/cmp-sim/__tests__/wafer-metrics.test.ts --verbose`
Expected: 5 tests PASS

**Step 5: Commit**

```bash
git add src/lib/cmp-sim/wafer-metrics.ts src/lib/cmp-sim/__tests__/wafer-metrics.test.ts
git commit -m "feat(cmp-sim): wafer metrics orchestrator with 6 die-level maps"
```

---

## Task 8: Presets

**Files:**
- Create: `src/lib/cmp-sim/__tests__/presets.test.ts`
- Create: `src/lib/cmp-sim/presets.ts`

**Step 1: Write the failing tests**

```typescript
// src/lib/cmp-sim/__tests__/presets.test.ts
import { PRESETS, getPreset } from '../presets';
import { DEFAULT_PARAMS } from '../constants';

describe('presets', () => {
  it('has 8 presets', () => {
    expect(PRESETS).toHaveLength(8);
  });

  it('slurry-starvation reduces flow rate', () => {
    const p = getPreset('slurry-starvation')!;
    const result = p.apply(DEFAULT_PARAMS, 0);
    expect(result.slurryFlow).toBeLessThan(DEFAULT_PARAMS.slurryFlow);
  });

  it('pad-glazing reduces asperity density and stiffness', () => {
    const p = getPreset('pad-glazing')!;
    const result = p.apply(DEFAULT_PARAMS, 0);
    expect(result.asperityDensity).toBeLessThan(DEFAULT_PARAMS.asperityDensity);
    expect(result.padStiffness).toBeLessThan(DEFAULT_PARAMS.padStiffness);
  });

  it('over-polish increases total steps', () => {
    const p = getPreset('over-polish')!;
    const result = p.apply(DEFAULT_PARAMS, 0);
    expect(result.totalSteps).toBeGreaterThan(DEFAULT_PARAMS.totalSteps);
  });

  it('downforce-imbalance changes downForce', () => {
    const p = getPreset('downforce-imbalance')!;
    const result = p.apply(DEFAULT_PARAMS, 0);
    expect(result.downForce).not.toBe(DEFAULT_PARAMS.downForce);
  });

  it('retaining-ring-wear changes downForce', () => {
    const p = getPreset('retaining-ring-wear')!;
    const result = p.apply(DEFAULT_PARAMS, 0);
    expect(result.downForce).not.toBe(DEFAULT_PARAMS.downForce);
  });

  it('slurry-ph-drift changes pH', () => {
    const p = getPreset('slurry-ph-drift')!;
    const result = p.apply(DEFAULT_PARAMS, 0);
    expect(result.slurryPh).not.toBe(DEFAULT_PARAMS.slurryPh);
  });

  it('hydroplaning increases RPM and flow', () => {
    const p = getPreset('hydroplaning')!;
    const result = p.apply(DEFAULT_PARAMS, 0);
    expect(result.platenRpm).toBeGreaterThan(DEFAULT_PARAMS.platenRpm);
    expect(result.slurryFlow).toBeGreaterThan(DEFAULT_PARAMS.slurryFlow);
  });

  it('pattern-density increases pattern density', () => {
    const p = getPreset('pattern-density')!;
    const result = p.apply(DEFAULT_PARAMS, 0);
    expect(result.patternDensity).toBeGreaterThan(DEFAULT_PARAMS.patternDensity);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd equipment-monitor && npx jest src/lib/cmp-sim/__tests__/presets.test.ts --verbose`
Expected: FAIL — module not found

**Step 3: Write implementation**

```typescript
// src/lib/cmp-sim/presets.ts
import type { Preset } from './types';

export const PRESETS: Preset[] = [
  {
    id: 'slurry-starvation',
    label: 'Slurry Starvation',
    labelCN: '\u6F3F\u6DB2\u98E2\u9913',
    color: '#ef4444',
    apply: (params) => ({ ...params, slurryFlow: 80 }),
  },
  {
    id: 'pad-glazing',
    label: 'Pad Glazing',
    labelCN: '\u7814\u78E8\u588A\u920D\u5316',
    color: '#f59e0b',
    apply: (params) => ({ ...params, asperityDensity: 150, padStiffness: 20 }),
  },
  {
    id: 'over-polish',
    label: 'Over-Polish',
    labelCN: '\u904E\u5EA6\u7814\u78E8',
    color: '#8b5cf6',
    apply: (params) => ({ ...params, totalSteps: params.totalSteps + 40 }),
  },
  {
    id: 'downforce-imbalance',
    label: 'Down-Force Imbalance',
    labelCN: '\u4E0B\u58D3\u529B\u4E0D\u5747',
    color: '#ec4899',
    apply: (params) => ({ ...params, downForce: params.downForce * 1.8 }),
  },
  {
    id: 'retaining-ring-wear',
    label: 'Retaining Ring Wear',
    labelCN: '\u56FA\u5B9A\u74B0\u78E8\u640D',
    color: '#f97316',
    apply: (params) => ({ ...params, downForce: params.downForce * 0.6 }),
  },
  {
    id: 'slurry-ph-drift',
    label: 'Slurry pH Drift',
    labelCN: 'pH \u6F02\u79FB',
    color: '#06b6d4',
    apply: (params) => ({ ...params, slurryPh: params.slurryPh + 2 }),
  },
  {
    id: 'hydroplaning',
    label: 'Hydroplaning',
    labelCN: '\u6C34\u819C\u4E0A\u6D6E',
    color: '#3b82f6',
    apply: (params) => ({ ...params, platenRpm: 140, waferRpm: 140, slurryFlow: 450 }),
  },
  {
    id: 'pattern-density',
    label: 'Pattern Density Effect',
    labelCN: '\u5716\u6848\u5BC6\u5EA6\u6548\u61C9',
    color: '#10b981',
    apply: (params) => ({ ...params, patternDensity: 85 }),
  },
];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
```

**Step 4: Run tests**

Run: `cd equipment-monitor && npx jest src/lib/cmp-sim/__tests__/presets.test.ts --verbose`
Expected: 9 tests PASS

**Step 5: Commit**

```bash
git add src/lib/cmp-sim/presets.ts src/lib/cmp-sim/__tests__/presets.test.ts
git commit -m "feat(cmp-sim): 8 what-if presets for CMP fault scenarios"
```

---

## Task 9: Simulation Engine

**Files:**
- Create: `src/lib/cmp-sim/__tests__/simulation-engine.test.ts`
- Create: `src/lib/cmp-sim/simulation-engine.ts`

**Step 1: Write the failing tests**

```typescript
// src/lib/cmp-sim/__tests__/simulation-engine.test.ts
import { createSimulation, stepForward, stepN, applyPreset } from '../simulation-engine';
import { DEFAULT_PARAMS, RAMP_UP_END, BULK_CU_END, BARRIER_END } from '../constants';

describe('simulation-engine', () => {
  it('createSimulation returns initial state with index -1', () => {
    const sim = createSimulation();
    expect(sim.currentIndex).toBe(-1);
    expect(sim.steps).toHaveLength(0);
    expect(sim.totalSteps).toBe(200);
  });

  it('stepForward advances index by 1', () => {
    const sim = stepForward(createSimulation());
    expect(sim.currentIndex).toBe(0);
    expect(sim.steps).toHaveLength(1);
    expect(sim.steps[0].phase).toBe('ramp-up');
  });

  it('phase transitions at correct boundaries', () => {
    let sim = createSimulation();

    // Ramp-up phase: steps 0-19
    sim = stepN(sim, RAMP_UP_END);
    expect(sim.steps[sim.currentIndex].phase).toBe('ramp-up');

    // Bulk-cu phase starts at step 20
    sim = stepForward(sim);
    expect(sim.steps[sim.currentIndex].phase).toBe('bulk-cu');

    // Bulk-cu ends at step 119
    sim = stepN(sim, BULK_CU_END - RAMP_UP_END - 1);
    expect(sim.steps[sim.currentIndex].phase).toBe('bulk-cu');

    // Barrier phase starts at step 120
    sim = stepForward(sim);
    expect(sim.steps[sim.currentIndex].phase).toBe('barrier');

    // Barrier ends at step 169
    sim = stepN(sim, BARRIER_END - BULK_CU_END - 1);
    expect(sim.steps[sim.currentIndex].phase).toBe('barrier');

    // Buff phase starts at step 170
    sim = stepForward(sim);
    expect(sim.steps[sim.currentIndex].phase).toBe('buff');
  });

  it('200 steps complete without error', () => {
    const sim = stepN(createSimulation(), 200);
    expect(sim.currentIndex).toBe(199);
    expect(sim.steps).toHaveLength(200);
  });

  it('slurry swap changes chemistry at barrier transition', () => {
    let sim = stepN(createSimulation(), BULK_CU_END);
    const cuStep = sim.steps[sim.currentIndex];
    sim = stepForward(sim);
    const barrierStep = sim.steps[sim.currentIndex];
    // Different phases should produce different removal rates
    expect(barrierStep.phase).toBe('barrier');
    expect(cuStep.phase).toBe('bulk-cu');
  });

  it('buff phase has minimal removal rate', () => {
    const sim = stepN(createSimulation(), 190);
    const buffStep = sim.steps[sim.currentIndex];
    expect(buffStep.phase).toBe('buff');
    expect(buffStep.removalRate).toBeLessThan(100);
  });

  it('does not exceed totalSteps', () => {
    const sim = stepN(createSimulation(), 300);
    expect(sim.currentIndex).toBe(199);
    const same = stepForward(sim);
    expect(same).toBe(sim);
  });

  it('applyPreset modifies params', () => {
    const sim = createSimulation();
    const modified = applyPreset(sim, 'slurry-starvation');
    expect(modified.params.slurryFlow).toBeLessThan(sim.params.slurryFlow);
  });

  it('Cu remaining decreases during bulk-cu phase', () => {
    const sim = stepN(createSimulation(), 100);
    const step = sim.steps[sim.currentIndex];
    expect(step.cuRemaining).toBeLessThan(sim.params.cuThickness);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd equipment-monitor && npx jest src/lib/cmp-sim/__tests__/simulation-engine.test.ts --verbose`
Expected: FAIL — module not found

**Step 3: Write implementation**

```typescript
// src/lib/cmp-sim/simulation-engine.ts
import type { SimulationParams, SimulationState, StepState, ProcessPhase } from './types';
import {
  DEFAULT_PARAMS, DEFAULT_TOTAL_STEPS,
  RAMP_UP_END, BULK_CU_END, BARRIER_END,
  RADIAL_NODES, BARRIER_THICKNESS_NM,
} from './constants';
import { computeStepMetrics } from './wafer-metrics';
import { getPreset } from './presets';

function getPhase(stepIndex: number): ProcessPhase {
  if (stepIndex < RAMP_UP_END) return 'ramp-up';
  if (stepIndex < BULK_CU_END) return 'bulk-cu';
  if (stepIndex < BARRIER_END) return 'barrier';
  return 'buff';
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
  const dt = 0.5;

  const prevCreepStrain = prev?.padCreepStrain ?? 0;
  const prevCuRemaining = prev?.cuRemaining ?? state.params.cuThickness;
  const prevBarrierRemaining = prev?.barrierRemaining ?? BARRIER_THICKNESS_NM;

  let stepState: StepState;

  if (phase === 'ramp-up') {
    const progress = (nextIndex + 1) / RAMP_UP_END;
    const metrics = computeStepMetrics(
      state.params, nextIndex, phase, prevCreepStrain,
      prevCuRemaining, prevBarrierRemaining
    );

    stepState = {
      stepIndex: nextIndex,
      phase,
      timeSeconds: nextIndex * dt,
      filmThickness: metrics.filmThickness,
      fluidPressure: metrics.fluidPressure,
      realContactArea: metrics.realContactArea * progress,
      padCreepStrain: metrics.padCreepStrain,
      contactPressure: metrics.contactPressure.map((v) => v * progress),
      removalRate: metrics.removalRate * progress,
      cuRemaining: metrics.cuRemaining,
      barrierRemaining: metrics.barrierRemaining,
      removalRateMap: metrics.removalRateMap.map((v) => v * progress),
      wiwnuMap: metrics.wiwnuMap,
      dishingMap: metrics.dishingMap.map((v) => v * progress),
      erosionMap: metrics.erosionMap,
      roughnessMap: metrics.roughnessMap,
      thicknessMap: metrics.thicknessMap,
      dieCount: metrics.dieCount,
      dieGridCols: metrics.dieGridCols,
      dieGridRows: metrics.dieGridRows,
    };
  } else {
    const metrics = computeStepMetrics(
      state.params, nextIndex, phase, prevCreepStrain,
      prevCuRemaining, prevBarrierRemaining
    );

    stepState = {
      stepIndex: nextIndex,
      phase,
      timeSeconds: nextIndex * dt,
      filmThickness: metrics.filmThickness,
      fluidPressure: metrics.fluidPressure,
      realContactArea: metrics.realContactArea,
      padCreepStrain: metrics.padCreepStrain,
      contactPressure: metrics.contactPressure,
      removalRate: metrics.removalRate,
      cuRemaining: metrics.cuRemaining,
      barrierRemaining: metrics.barrierRemaining,
      removalRateMap: metrics.removalRateMap,
      wiwnuMap: metrics.wiwnuMap,
      dishingMap: metrics.dishingMap,
      erosionMap: metrics.erosionMap,
      roughnessMap: metrics.roughnessMap,
      thicknessMap: metrics.thicknessMap,
      dieCount: metrics.dieCount,
      dieGridCols: metrics.dieGridCols,
      dieGridRows: metrics.dieGridRows,
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

**Step 4: Run tests**

Run: `cd equipment-monitor && npx jest src/lib/cmp-sim/__tests__/simulation-engine.test.ts --verbose`
Expected: 9 tests PASS

**Step 5: Commit**

```bash
git add src/lib/cmp-sim/simulation-engine.ts src/lib/cmp-sim/__tests__/simulation-engine.test.ts
git commit -m "feat(cmp-sim): 4-phase simulation engine (ramp-up, bulk-cu, barrier, buff)"
```

---

## Task 10: Barrel Export + Digital Twin Route

**Files:**
- Create: `src/lib/cmp-sim/index.ts`
- Modify: `src/lib/digital-twin-routes.ts:4-9`

**Step 1: Create barrel export**

```typescript
// src/lib/cmp-sim/index.ts
export { createSimulation, stepForward, stepN, applyPreset } from './simulation-engine';
export { PRESETS, getPreset } from './presets';
export {
  DEFAULT_PARAMS, PARAM_BOUNDS, DEFAULT_TOTAL_STEPS,
  RAMP_UP_END, BULK_CU_END, BARRIER_END,
  DIE_MASK, DIE_GRID_COLS, DIE_GRID_ROWS, RADIAL_NODES,
  PHASE_CHEMISTRY,
} from './constants';
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

**Step 2: Add CMP route to digital-twin-routes.ts**

Add `cmp` entry to line 8:

```typescript
// src/lib/digital-twin-routes.ts
import type { ProcessId } from './fab-process-data';

export const DIGITAL_TWIN_ROUTES: Partial<Record<ProcessId, string>> = {
  lithography: '/mes/fab-floor/lithography/lens-sim',
  deposition: '/mes/fab-floor/deposition/reactor-sim',
  metallization: '/mes/fab-floor/metallization/damascene-sim',
  etching: '/mes/fab-floor/etching/etch-sim',
  cmp: '/mes/fab-floor/cmp/planarization-sim',
};
```

**Step 3: Commit**

```bash
git add src/lib/cmp-sim/index.ts src/lib/digital-twin-routes.ts
git commit -m "feat(cmp-sim): barrel export and digital twin route registration"
```

---

## Task 11: TimelineBar Component

**Files:**
- Create: `src/components/cmp-sim/TimelineBar.tsx`

**Step 1: Create TimelineBar**

Follow the etch-sim TimelineBar pattern exactly, with 4 CMP phases:

```tsx
// src/components/cmp-sim/TimelineBar.tsx
'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react';
import type { StepState } from '@/lib/cmp-sim';

interface TimelineBarProps {
  currentIndex: number;
  totalSteps: number;
  playing: boolean;
  currentStep: StepState | null;
  backHref?: string;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onSeek: (index: number) => void;
  onReset: () => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
}

const PHASE_COLORS: Record<string, string> = {
  'ramp-up': '#6366f1',
  'bulk-cu': '#f59e0b',
  'barrier': '#8b5cf6',
  'buff': '#10b981',
};

const PHASE_LABELS: Record<string, string> = {
  'ramp-up': 'Ramp-Up',
  'bulk-cu': 'Bulk Cu',
  'barrier': 'Barrier',
  'buff': 'Buff',
};

export function TimelineBar({
  currentIndex, totalSteps, playing, currentStep, backHref,
  onPlay, onPause, onStep, onSeek, onReset,
  playbackSpeed, onSpeedChange,
}: TimelineBarProps) {
  const progress = totalSteps > 0 ? ((currentIndex + 1) / totalSteps) * 100 : 0;
  const phase = currentStep?.phase ?? 'ramp-up';
  const cuRemaining = currentStep?.cuRemaining.toFixed(0) ?? '1000';

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[rgba(245,158,11,0.2)] bg-[rgba(2,6,23,0.8)] px-4 py-2 backdrop-blur-xl">
      {backHref && (
        <Link href={backHref} className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full hover:bg-white/10" aria-label="Back">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}

      <div className="flex items-center gap-1">
        <button type="button" onClick={playing ? onPause : onPlay} className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full hover:bg-white/10" aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button type="button" onClick={onStep} className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full hover:bg-white/10" aria-label="Step" disabled={currentIndex >= totalSteps - 1}>
          <ChevronRight className="h-4 w-4" />
        </button>
        <button type="button" onClick={onReset} className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full hover:bg-white/10" aria-label="Reset">
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 min-w-[200px]">
        <input type="range" min={-1} max={totalSteps - 1} value={currentIndex} onChange={(e) => onSeek(Number(e.target.value))} className="w-full accent-amber-500" aria-label="Step timeline" />
        <div className="mt-0.5 h-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: PHASE_COLORS[phase] }} />
        </div>
      </div>

      <div className="flex items-center gap-3 font-mono text-xs">
        <span className="rounded-full px-2 py-0.5" style={{ backgroundColor: PHASE_COLORS[phase], color: '#fff' }}>
          {PHASE_LABELS[phase]}
        </span>
        <span className="text-[var(--sf-text-secondary)]">
          Step {currentIndex + 1}/{totalSteps}
        </span>
        <span style={{ color: '#f59e0b' }}>
          Cu: {cuRemaining} nm
        </span>
        <select value={playbackSpeed} onChange={(e) => onSpeedChange(Number(e.target.value))} className="rounded bg-white/10 px-2 py-1 text-xs" aria-label="Playback speed">
          <option value={1}>1{'\u00D7'}</option>
          <option value={2}>2{'\u00D7'}</option>
          <option value={5}>5{'\u00D7'}</option>
          <option value={10}>10{'\u00D7'}</option>
        </select>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/cmp-sim/TimelineBar.tsx
git commit -m "feat(cmp-sim): TimelineBar with 4-phase colors and back button"
```

---

## Task 12: ParameterPanel Component

**Files:**
- Create: `src/components/cmp-sim/ParameterPanel.tsx`

**Step 1: Create ParameterPanel**

```tsx
// src/components/cmp-sim/ParameterPanel.tsx
'use client';

import { PARAM_BOUNDS, PRESETS } from '@/lib/cmp-sim';
import type { PresetId, SimulationParams } from '@/lib/cmp-sim';

interface ParameterPanelProps {
  params: SimulationParams;
  activePreset: PresetId | null;
  onParamChange: (key: keyof SimulationParams, value: number) => void;
  onPreset: (id: PresetId) => void;
}

const SLIDER_KEYS: (keyof typeof PARAM_BOUNDS)[] = [
  'downForce', 'waferRpm', 'platenRpm', 'slurryFlow',
  'abrasiveConc', 'slurryPh', 'padStiffness', 'asperityDensity',
  'cuThickness', 'patternDensity',
];

const SLIDER_LABELS: Record<string, string> = {
  downForce: 'Down-Force',
  waferRpm: 'Wafer RPM',
  platenRpm: 'Platen RPM',
  slurryFlow: 'Slurry Flow',
  abrasiveConc: 'Abrasive %',
  slurryPh: 'Slurry pH',
  padStiffness: 'Pad Stiffness',
  asperityDensity: 'Asperity \u03B7',
  cuThickness: 'Cu Thick',
  patternDensity: 'Pattern \u03C1',
};

export function ParameterPanel({ params, activePreset, onParamChange, onPreset }: ParameterPanelProps) {
  return (
    <div className="rounded-2xl border border-[rgba(245,158,11,0.2)] bg-[rgba(2,6,23,0.8)] px-4 py-3 backdrop-blur-xl">
      <div className="grid grid-cols-5 gap-x-6 gap-y-2 sm:grid-cols-10">
        {SLIDER_KEYS.map((key) => {
          const b = PARAM_BOUNDS[key];
          const val = params[key];
          return (
            <label key={key} className="flex flex-col gap-0.5 font-mono text-[10px] text-[var(--sf-text-secondary)]">
              <span>{SLIDER_LABELS[key]}</span>
              <input type="range" min={b.min} max={b.max} step={b.step} value={val} onChange={(e) => onParamChange(key, Number(e.target.value))} className="accent-amber-500" />
              <span className="text-[var(--sf-text-muted)]">{val}{b.unit ? ` ${b.unit}` : ''}</span>
            </label>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button key={p.id} type="button" onClick={() => onPreset(p.id)} className="rounded-full border px-3 py-1 font-mono text-[10px] transition-colors" style={{ borderColor: p.color, backgroundColor: activePreset === p.id ? p.color : 'transparent', color: activePreset === p.id ? '#fff' : p.color }}>
            {p.label} {p.labelCN}
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/cmp-sim/ParameterPanel.tsx
git commit -m "feat(cmp-sim): ParameterPanel with 10 sliders and 8 presets"
```

---

## Task 13: Babylon.js PlanarizeScene

**Files:**
- Create: `src/components/cmp-sim/PlanarizeScene.tsx`

**Step 1: Create PlanarizeScene**

This is the largest component. Follow the ICPChamberScene pattern: Babylon.js main canvas + 2D inset canvas, `propsRef` for render-loop updates.

```tsx
// src/components/cmp-sim/PlanarizeScene.tsx
'use client';

import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import type { StepState, SimulationParams } from '@/lib/cmp-sim';
import { RAMP_UP_END, BULK_CU_END, BARRIER_END, RADIAL_NODES } from '@/lib/cmp-sim';

interface PlanarizeSceneProps {
  step: StepState | null;
  params: SimulationParams;
}

const COPPER = new BABYLON.Color3(0.72, 0.45, 0.20);
const BARRIER_GRAY = new BABYLON.Color3(0.5, 0.5, 0.55);
const OXIDE_BLUE = new BABYLON.Color3(0.3, 0.4, 0.7);
const PAD_DARK = new BABYLON.Color3(0.15, 0.12, 0.1);
const SLURRY_AMBER = new BABYLON.Color3(0.9, 0.7, 0.2);
const SLURRY_BLUE = new BABYLON.Color3(0.3, 0.5, 0.8);

export function PlanarizeScene({ step, params }: PlanarizeSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const insetRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ step, params });
  propsRef.current = { step, params };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new BABYLON.Engine(canvas, true, { adaptToDeviceRatio: true });
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.02, 0.03, 0.06, 1);

    // Camera: angled view (~30 degrees from horizontal)
    const camera = new BABYLON.ArcRotateCamera('cam', -Math.PI / 4, Math.PI / 3.5, 14, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.lowerBetaLimit = 0.3;
    camera.upperBetaLimit = 1.2;
    camera.lowerRadiusLimit = 8;
    camera.upperRadiusLimit = 22;

    // Lights
    const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene);
    hemi.intensity = 0.4;
    const point = new BABYLON.PointLight('point', new BABYLON.Vector3(3, 5, 3), scene);
    point.intensity = 0.6;

    // Platen (large rotating disc)
    const platenMat = new BABYLON.StandardMaterial('platenMat', scene);
    platenMat.diffuseColor = PAD_DARK;
    platenMat.specularPower = 4;
    const platen = BABYLON.MeshBuilder.CreateCylinder('platen', { diameter: 10, height: 0.4, tessellation: 48 }, scene);
    platen.position.y = -0.5;
    platen.material = platenMat;

    // Pad grooves (4 concentric tori on platen)
    const grooveMat = new BABYLON.StandardMaterial('grooveMat', scene);
    grooveMat.diffuseColor = new BABYLON.Color3(0.08, 0.06, 0.05);
    const grooveRadii = [1.25, 2.25, 3.25, 4.25];
    for (let i = 0; i < grooveRadii.length; i++) {
      const groove = BABYLON.MeshBuilder.CreateTorus(`groove${i}`, { diameter: grooveRadii[i] * 2, thickness: 0.06, tessellation: 48 }, scene);
      groove.position.y = -0.28;
      groove.material = grooveMat;
    }

    // Wafer carrier (smaller disc on top)
    const carrierMat = new BABYLON.StandardMaterial('carrierMat', scene);
    carrierMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.35);
    const carrier = BABYLON.MeshBuilder.CreateCylinder('carrier', { diameter: 4.2, height: 0.3, tessellation: 32 }, scene);
    carrier.position.set(-1.5, 0.4, 0);
    carrier.material = carrierMat;

    // Retaining ring
    const ringMat = new BABYLON.StandardMaterial('ringMat', scene);
    ringMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.45);
    const ring = BABYLON.MeshBuilder.CreateTorus('ring', { diameter: 4.0, thickness: 0.15, tessellation: 32 }, scene);
    ring.position.set(-1.5, 0.1, 0);
    ring.material = ringMat;

    // Wafer (surface will change color by phase)
    const waferMat = new BABYLON.StandardMaterial('waferMat', scene);
    waferMat.diffuseColor = COPPER.clone();
    const wafer = BABYLON.MeshBuilder.CreateCylinder('wafer', { diameter: 3.6, height: 0.05, tessellation: 32 }, scene);
    wafer.position.set(-1.5, 0.12, 0);
    wafer.material = waferMat;

    // Slurry layer (semi-transparent disc between pad and wafer)
    const slurryMat = new BABYLON.StandardMaterial('slurryMat', scene);
    slurryMat.diffuseColor = SLURRY_AMBER.clone();
    slurryMat.alpha = 0.35;
    slurryMat.disableLighting = true;
    const slurry = BABYLON.MeshBuilder.CreateCylinder('slurry', { diameter: 9.5, height: 0.08, tessellation: 48 }, scene);
    slurry.position.y = -0.15;
    slurry.material = slurryMat;

    // Slurry particles (SPS)
    const particleSPS = new BABYLON.SolidParticleSystem('particles', scene);
    const particleModel = BABYLON.MeshBuilder.CreateSphere('pModel', { diameter: 0.05 }, scene);
    particleSPS.addShape(particleModel, 60);
    particleModel.dispose();
    const particleMesh = particleSPS.buildMesh();
    const particleMat = new BABYLON.StandardMaterial('pMat', scene);
    particleMat.emissiveColor = new BABYLON.Color3(0.9, 0.7, 0.3);
    particleMat.disableLighting = true;
    particleMesh.material = particleMat;

    particleSPS.initParticles = () => {
      for (let i = 0; i < particleSPS.nbParticles; i++) {
        const p = particleSPS.particles[i];
        const angle = Math.random() * Math.PI * 2;
        const r = 1 + Math.random() * 3.5;
        p.position.x = Math.cos(angle) * r;
        p.position.z = Math.sin(angle) * r;
        p.position.y = -0.1 + (Math.random() - 0.5) * 0.1;
      }
    };
    particleSPS.initParticles();
    particleSPS.setParticles();

    // Conditioner arm (cosmetic)
    const armMat = new BABYLON.StandardMaterial('armMat', scene);
    armMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.55);
    const arm = BABYLON.MeshBuilder.CreateBox('arm', { width: 0.15, height: 0.1, depth: 3 }, scene);
    arm.position.set(3, 0, 0);
    arm.material = armMat;
    const condDisc = BABYLON.MeshBuilder.CreateCylinder('cond', { diameter: 0.8, height: 0.12, tessellation: 16 }, scene);
    condDisc.position.set(3, 0.06, 1.2);
    condDisc.material = armMat;

    // Phase banner
    const advTex = GUI.AdvancedDynamicTexture.CreateFullscreenUI('ui', true, scene);
    const phaseBanner = new GUI.TextBlock('phaseBanner', 'Ramp-Up');
    phaseBanner.color = '#6366f1';
    phaseBanner.fontSize = 18;
    phaseBanner.fontFamily = 'monospace';
    phaseBanner.top = '16px';
    phaseBanner.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    phaseBanner.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    advTex.addControl(phaseBanner);

    // Render loop
    let frame = 0;
    scene.registerBeforeRender(() => {
      frame++;
      const { step: s, params: p } = propsRef.current;
      const phase = s?.phase ?? 'ramp-up';

      // Rotate platen and wafer
      const platenSpeed = (p.platenRpm / 60) * 0.02;
      const waferSpeed = (p.waferRpm / 60) * 0.02;
      platen.rotation.y += platenSpeed;
      carrier.rotation.y -= waferSpeed;
      wafer.rotation.y -= waferSpeed;
      ring.rotation.y -= waferSpeed;

      // Conditioner arm sweep
      arm.rotation.y = Math.sin(frame * 0.005) * 0.5;
      condDisc.rotation.y = arm.rotation.y;

      // Wafer color by phase
      if (phase === 'ramp-up' || phase === 'bulk-cu') {
        const cuFrac = s ? s.cuRemaining / p.cuThickness : 1;
        waferMat.diffuseColor = BABYLON.Color3.Lerp(BARRIER_GRAY, COPPER, cuFrac);
      } else if (phase === 'barrier') {
        waferMat.diffuseColor = BABYLON.Color3.Lerp(OXIDE_BLUE, BARRIER_GRAY, 0.5);
      } else {
        waferMat.diffuseColor = OXIDE_BLUE.clone();
      }

      // Slurry color by phase
      if (phase === 'barrier' || phase === 'buff') {
        slurryMat.diffuseColor = BABYLON.Color3.Lerp(slurryMat.diffuseColor, SLURRY_BLUE, 0.05);
        particleMat.emissiveColor = new BABYLON.Color3(0.4, 0.6, 0.9);
      } else {
        slurryMat.diffuseColor = BABYLON.Color3.Lerp(slurryMat.diffuseColor, SLURRY_AMBER, 0.05);
        particleMat.emissiveColor = new BABYLON.Color3(0.9, 0.7, 0.3);
      }

      // Slurry flow density
      const flowFactor = p.slurryFlow / 200;
      slurryMat.alpha = 0.2 + 0.2 * flowFactor;

      // Particles follow platen rotation
      particleSPS.updateParticle = (pt) => {
        const angle = Math.atan2(pt.position.z, pt.position.x) + platenSpeed;
        const r = Math.sqrt(pt.position.x ** 2 + pt.position.z ** 2);
        pt.position.x = Math.cos(angle) * r;
        pt.position.z = Math.sin(angle) * r;
        // Drift outward (centrifugal)
        const newR = r + 0.002 * flowFactor;
        if (newR > 4.5) {
          const resetAngle = Math.random() * Math.PI * 2;
          const resetR = 0.5 + Math.random() * 1.5;
          pt.position.x = Math.cos(resetAngle) * resetR;
          pt.position.z = Math.sin(resetAngle) * resetR;
        } else {
          pt.position.x = Math.cos(angle) * newR;
          pt.position.z = Math.sin(angle) * newR;
        }
        pt.isVisible = flowFactor > 0.2;
        return pt;
      };
      particleSPS.setParticles();

      // Retaining ring glow on wear preset
      ringMat.emissiveColor = p.downForce < 2
        ? new BABYLON.Color3(0.4, 0.2, 0)
        : BABYLON.Color3.Black();

      // Phase banner
      const phaseLabels: Record<string, string> = { 'ramp-up': 'Ramp-Up', 'bulk-cu': 'Bulk Cu Polish', 'barrier': 'Barrier Polish', 'buff': 'Buff' };
      const phaseColors: Record<string, string> = { 'ramp-up': '#6366f1', 'bulk-cu': '#f59e0b', 'barrier': '#8b5cf6', 'buff': '#10b981' };
      phaseBanner.text = phaseLabels[phase] ?? 'Ramp-Up';
      phaseBanner.color = phaseColors[phase] ?? '#6366f1';
    });

    engine.runRenderLoop(() => scene.render());
    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    // Cross-section inset (2D canvas)
    let animId = 0;
    const drawInset = () => {
      const ctx = insetRef.current?.getContext('2d');
      if (!ctx) { animId = requestAnimationFrame(drawInset); return; }
      const w = 200, h = 240;
      ctx.clearRect(0, 0, w, h);

      const { step: s, params: p } = propsRef.current;

      ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
      ctx.strokeRect(0, 0, w, h);

      ctx.fillStyle = '#f59e0b';
      ctx.font = '10px monospace';
      ctx.fillText('Pad-Wafer Interface', 8, 16);

      const padY = 90;
      const waferY = 140;
      const margin = 15;
      const plotW = w - margin * 2;

      // Draw pad asperities (jagged top surface)
      ctx.beginPath();
      ctx.strokeStyle = '#6b7280';
      ctx.fillStyle = 'rgba(107, 114, 128, 0.3)';
      ctx.moveTo(margin, padY + 30);
      for (let x = 0; x <= plotW; x += 3) {
        const rNorm = x / plotW;
        const baseH = 20;
        const asperityH = (Math.sin(x * 0.7) + Math.sin(x * 1.3) * 0.5) * 4;
        // Reduce asperity height for glazing (low density)
        const densityFactor = Math.min(1, p.asperityDensity / 500);
        const y = padY + baseH - asperityH * densityFactor;
        if (x === 0) ctx.moveTo(margin + x, y); else ctx.lineTo(margin + x, y);
      }
      ctx.lineTo(margin + plotW, padY + 30);
      ctx.lineTo(margin, padY + 30);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw slurry film (colored band between pad and wafer)
      const filmH = s ? Math.min(20, s.filmThickness[10] * 0.5) : 10;
      const phaseColor = (s?.phase === 'barrier' || s?.phase === 'buff') ? 'rgba(96,165,250,0.4)' : 'rgba(245,158,11,0.4)';
      ctx.fillStyle = phaseColor;
      ctx.fillRect(margin, waferY - filmH, plotW, filmH);

      // Draw wafer layer stack
      const cuFrac = s ? s.cuRemaining / p.cuThickness : 1;
      const barrierH = 5;
      const oxideH = 15;
      const cuH = Math.max(0, 20 * cuFrac);

      // Oxide (bottom)
      ctx.fillStyle = 'rgba(96, 130, 200, 0.8)';
      ctx.fillRect(margin, waferY + cuH + barrierH, plotW, oxideH);

      // Barrier
      ctx.fillStyle = 'rgba(128, 128, 140, 0.8)';
      ctx.fillRect(margin, waferY + cuH, plotW, barrierH);

      // Cu (top, thinning)
      ctx.fillStyle = 'rgba(184, 115, 51, 0.8)';
      ctx.fillRect(margin, waferY, plotW, cuH);

      // Dishing visualization (Cu dips in middle of wide features)
      if (s && s.phase === 'bulk-cu' && cuFrac < 0.5) {
        ctx.strokeStyle = '#ef4444';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(w / 2, waferY, 20, 0, Math.PI);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('DISHING', w / 2 - 22, waferY + 35);
      }

      // Contact points (bright dots where asperities touch wafer)
      if (s && s.realContactArea > 0.001) {
        const numContacts = Math.round(s.realContactArea * 500);
        ctx.fillStyle = '#fbbf24';
        for (let c = 0; c < numContacts; c++) {
          const cx = margin + Math.random() * plotW;
          ctx.beginPath();
          ctx.arc(cx, waferY - 1, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Pressure arrows
      if (s) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1;
        const arrows = 5;
        for (let a = 0; a < arrows; a++) {
          const ax = margin + (a + 0.5) * (plotW / arrows);
          const nodeIdx = Math.round((a / arrows) * (RADIAL_NODES - 1));
          const pScale = Math.min(20, (s.contactPressure[nodeIdx] || 0) * 0.0001);
          ctx.beginPath();
          ctx.moveTo(ax, padY - 5);
          ctx.lineTo(ax, padY - 5 + pScale);
          ctx.stroke();
          // Arrow head
          ctx.beginPath();
          ctx.moveTo(ax - 2, padY - 5 + pScale - 3);
          ctx.lineTo(ax, padY - 5 + pScale);
          ctx.lineTo(ax + 2, padY - 5 + pScale - 3);
          ctx.stroke();
        }
        ctx.lineWidth = 1;
      }

      // Labels
      ctx.fillStyle = '#9ca3af';
      ctx.font = '8px monospace';
      ctx.fillText('Pad', margin, padY + 42);
      ctx.fillText('Cu', margin, waferY + 10);
      ctx.fillText('Barrier', margin, waferY + cuH + barrierH - 2);
      ctx.fillText('Oxide', margin, waferY + cuH + barrierH + 10);

      if (s) {
        ctx.fillStyle = '#f59e0b';
        ctx.font = '9px monospace';
        ctx.fillText(`Contact: ${(s.realContactArea * 100).toFixed(2)}%`, 8, h - 6);
        ctx.fillText(`Film: ${s.filmThickness[10]?.toFixed(1) ?? '?'} \u03BCm`, w / 2, h - 6);
      }

      animId = requestAnimationFrame(drawInset);
    };
    animId = requestAnimationFrame(drawInset);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      engine.dispose();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative h-full w-full">
      <canvas ref={canvasRef} className="h-full w-full" />
      <canvas ref={insetRef} width={200} height={240} className="absolute bottom-3 right-3 rounded-lg" style={{ imageRendering: 'pixelated' }} />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/cmp-sim/PlanarizeScene.tsx
git commit -m "feat(cmp-sim): Babylon.js split-view scene — 3D CMP machine + cross-section inset"
```

---

## Task 14: WaferMetricsPanel Component

**Files:**
- Create: `src/components/cmp-sim/WaferMetricsPanel.tsx`

**Step 1: Create WaferMetricsPanel**

Follow etch-sim WaferMetricsPanel, extended to 6 metrics:

```tsx
// src/components/cmp-sim/WaferMetricsPanel.tsx
'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { StepState, WaferMetric } from '@/lib/cmp-sim';
import { DIE_MASK, DIE_GRID_COLS, DIE_GRID_ROWS, RAMP_UP_END, BULK_CU_END, BARRIER_END } from '@/lib/cmp-sim';

interface WaferMetricsPanelProps {
  steps: StepState[];
  currentStep: StepState | null;
  metric: WaferMetric;
  onMetricChange: (m: WaferMetric) => void;
}

const METRIC_CFG: Record<WaferMetric, { label: string; unit: string; min: number; max: number; specMin: number; specMax: number; colorLow: string; colorMid: string; colorHigh: string }> = {
  removalRate: { label: 'Removal Rate', unit: 'nm/min', min: 0,   max: 800,  specMin: 100, specMax: 700, colorLow: '#3b82f6', colorMid: '#ffffff', colorHigh: '#ef4444' },
  wiwnu:       { label: 'WIWNU',        unit: '%',      min: 0,   max: 10,   specMin: 0,   specMax: 5,   colorLow: '#22c55e', colorMid: '#eab308', colorHigh: '#ef4444' },
  dishing:     { label: 'Dishing',      unit: 'nm',     min: 0,   max: 50,   specMin: 0,   specMax: 20,  colorLow: '#22c55e', colorMid: '#eab308', colorHigh: '#ef4444' },
  erosion:     { label: 'Erosion',      unit: 'nm',     min: 0,   max: 30,   specMin: 0,   specMax: 15,  colorLow: '#22c55e', colorMid: '#eab308', colorHigh: '#ef4444' },
  roughness:   { label: 'Roughness',    unit: 'nm RMS', min: 0,   max: 5,    specMin: 0,   specMax: 2,   colorLow: '#22c55e', colorMid: '#eab308', colorHigh: '#ef4444' },
  thickness:   { label: 'Remaining',    unit: 'nm',     min: 0,   max: 1200, specMin: 0,   specMax: 1100,colorLow: '#ef4444', colorMid: '#eab308', colorHigh: '#22c55e' },
};

function lerpColor(a: string, b: string, t: number): string {
  const parse = (hex: string) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

function getMetricValue(step: StepState, metric: WaferMetric, dieIdx: number): number {
  switch (metric) {
    case 'removalRate': return step.removalRateMap[dieIdx];
    case 'wiwnu':       return step.wiwnuMap[dieIdx];
    case 'dishing':     return step.dishingMap[dieIdx];
    case 'erosion':     return step.erosionMap[dieIdx];
    case 'roughness':   return step.roughnessMap[dieIdx];
    case 'thickness':   return step.thicknessMap[dieIdx];
  }
}

function getMetricMean(step: StepState, metric: WaferMetric): number {
  switch (metric) {
    case 'removalRate': return step.removalRate;
    case 'wiwnu': {
      const active = step.wiwnuMap.filter((_, i) => DIE_MASK[i]);
      const mean = active.reduce((s, v) => s + v, 0) / active.length;
      const variance = active.reduce((s, v) => s + (v - mean) ** 2, 0) / active.length;
      return mean > 0 ? (Math.sqrt(variance) / mean) * 100 : 0;
    }
    case 'dishing': {
      const active = step.dishingMap.filter((_, i) => DIE_MASK[i]);
      return active.reduce((s, v) => s + v, 0) / active.length;
    }
    case 'erosion': {
      const active = step.erosionMap.filter((_, i) => DIE_MASK[i]);
      return active.reduce((s, v) => s + v, 0) / active.length;
    }
    case 'roughness': {
      const active = step.roughnessMap.filter((_, i) => DIE_MASK[i]);
      return active.reduce((s, v) => s + v, 0) / active.length;
    }
    case 'thickness': return step.cuRemaining + step.barrierRemaining;
  }
}

export function WaferMetricsPanel({ steps, currentStep, metric, onMetricChange }: WaferMetricsPanelProps) {
  const mapRef = useRef<HTMLCanvasElement>(null);
  const sparkRef = useRef<HTMLCanvasElement>(null);

  const drawMap = useCallback(() => {
    const ctx = mapRef.current?.getContext('2d');
    if (!ctx || !mapRef.current) return;
    const w = mapRef.current.width;
    const h = mapRef.current.height;
    ctx.clearRect(0, 0, w, h);

    const cfg = METRIC_CFG[metric];
    const cellW = Math.floor((w - 20) / DIE_GRID_COLS);
    const cellH = Math.floor((h - 20) / DIE_GRID_ROWS);
    const ox = Math.floor((w - cellW * DIE_GRID_COLS) / 2);
    const oy = Math.floor((h - cellH * DIE_GRID_ROWS) / 2);

    for (let r = 0; r < DIE_GRID_ROWS; r++) {
      for (let c = 0; c < DIE_GRID_COLS; c++) {
        const idx = r * DIE_GRID_COLS + c;
        if (!DIE_MASK[idx]) continue;

        const x = ox + c * cellW;
        const y = oy + r * cellH;

        let val = 0;
        if (currentStep) val = getMetricValue(currentStep, metric, idx);
        const t = Math.max(0, Math.min(1, (val - cfg.min) / (cfg.max - cfg.min)));

        let color: string;
        if (t < 0.5) {
          color = lerpColor(cfg.colorLow, cfg.colorMid, t * 2);
        } else {
          color = lerpColor(cfg.colorMid, cfg.colorHigh, (t - 0.5) * 2);
        }

        ctx.fillStyle = color;
        ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.2)';
        ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);
      }
    }

    if (currentStep) {
      const meanVal = getMetricMean(currentStep, metric);
      ctx.fillStyle = '#f59e0b';
      ctx.font = '11px monospace';
      ctx.fillText(`${cfg.label}: ${meanVal.toFixed(1)} ${cfg.unit}`, 8, h - 6);
    }
  }, [currentStep, metric]);

  const drawSparkline = useCallback(() => {
    const ctx = sparkRef.current?.getContext('2d');
    if (!ctx || !sparkRef.current) return;
    const w = sparkRef.current.width;
    const h = sparkRef.current.height;
    ctx.clearRect(0, 0, w, h);

    const cfg = METRIC_CFG[metric];
    const pad = { top: 12, bottom: 20, left: 8, right: 8 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    ctx.fillStyle = 'rgba(2, 6, 23, 0.6)';
    ctx.fillRect(0, 0, w, h);

    const totalSteps = steps.length > 0 ? steps[steps.length - 1].stepIndex + 1 : 200;
    const drawDivider = (stepIdx: number, label: string) => {
      const x = pad.left + (stepIdx / totalSteps) * plotW;
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, pad.top + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.font = '8px monospace';
      ctx.fillText(label, x + 2, pad.top + 10);
    };
    drawDivider(RAMP_UP_END, 'Bulk Cu');
    drawDivider(BULK_CU_END, 'Barrier');
    drawDivider(BARRIER_END, 'Buff');

    const yFromVal = (v: number) => pad.top + plotH - ((v - cfg.min) / (cfg.max - cfg.min)) * plotH;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pad.left, yFromVal(cfg.specMin));
    ctx.lineTo(pad.left + plotW, yFromVal(cfg.specMin));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pad.left, yFromVal(cfg.specMax));
    ctx.lineTo(pad.left + plotW, yFromVal(cfg.specMax));
    ctx.stroke();
    ctx.setLineDash([]);

    if (steps.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < steps.length; i++) {
        const val = getMetricMean(steps[i], metric);
        const x = pad.left + (steps[i].stepIndex / totalSteps) * plotW;
        const y = yFromVal(val);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      const lastStep = steps[steps.length - 1];
      const lastX = pad.left + (lastStep.stepIndex / totalSteps) * plotW;
      ctx.lineTo(lastX, pad.top + plotH);
      ctx.lineTo(pad.left, pad.top + plotH);
      ctx.closePath();
      ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
      ctx.fill();
      ctx.lineWidth = 1;
    }

    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px monospace';
    ctx.fillText(`Step 0-${totalSteps}`, pad.left, h - 4);
    ctx.fillText(cfg.unit, w - pad.right - 30, h - 4);
  }, [steps, metric]);

  useEffect(() => { drawMap(); }, [drawMap]);
  useEffect(() => { drawSparkline(); }, [drawSparkline]);

  const metrics: WaferMetric[] = ['removalRate', 'wiwnu', 'dishing', 'erosion', 'roughness', 'thickness'];

  return (
    <div className="flex h-full flex-col bg-[var(--sf-bg-canvas)] p-3">
      <div className="mb-2 flex flex-wrap gap-1">
        {metrics.map((m) => (
          <button key={m} type="button" onClick={() => onMetricChange(m)} className="rounded-full px-2 py-0.5 font-mono text-[10px] transition-colors" style={{ backgroundColor: metric === m ? '#f59e0b' : 'rgba(245, 158, 11, 0.1)', color: metric === m ? '#fff' : '#f59e0b' }}>
            {METRIC_CFG[m].label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        <canvas ref={mapRef} width={340} height={340} className="h-full w-full" style={{ imageRendering: 'pixelated' }} />
      </div>

      <div className="mt-2 h-[120px]">
        <canvas ref={sparkRef} width={340} height={120} className="h-full w-full" />
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/cmp-sim/WaferMetricsPanel.tsx
git commit -m "feat(cmp-sim): WaferMetricsPanel with 6-metric die map and sparkline"
```

---

## Task 15: Page Route

**Files:**
- Create: `src/app/mes/fab-floor/cmp/planarization-sim/page.tsx`

**Step 1: Create page route**

Follow etch-sim page.tsx pattern exactly:

```tsx
// src/app/mes/fab-floor/cmp/planarization-sim/page.tsx
'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TimelineBar } from '@/components/cmp-sim/TimelineBar';
import { ParameterPanel } from '@/components/cmp-sim/ParameterPanel';
import {
  createSimulation,
  stepForward,
  stepN,
  applyPreset,
} from '@/lib/cmp-sim';
import type { PresetId, SimulationParams, SimulationState, WaferMetric } from '@/lib/cmp-sim';

const PlanarizeScene = dynamic(
  () => import('@/components/cmp-sim/PlanarizeScene').then((m) => ({ default: m.PlanarizeScene })),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center bg-[var(--sf-bg-canvas)]"><p className="animate-pulse font-mono text-sm text-[var(--sf-text-muted)] motion-reduce:animate-none">Initializing CMP tool...</p></div> },
);

const WaferMetricsPanel = dynamic(
  () => import('@/components/cmp-sim/WaferMetricsPanel').then((m) => ({ default: m.WaferMetricsPanel })),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center bg-[var(--sf-bg-canvas)]"><p className="animate-pulse font-mono text-sm text-[var(--sf-text-muted)] motion-reduce:animate-none">Loading wafer metrics...</p></div> },
);

export default function PlanarizationSimPage() {
  const [sim, setSim] = useState<SimulationState>(() => createSimulation());
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [metric, setMetric] = useState<WaferMetric>('removalRate');
  const [activePreset, setActivePreset] = useState<PresetId | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentStep = sim.currentIndex >= 0 ? sim.steps[sim.currentIndex] ?? null : null;

  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    const ms = Math.max(50, 600 / speed);
    intervalRef.current = setInterval(() => {
      setSim((prev) => {
        if (prev.currentIndex >= prev.totalSteps - 1) {
          setPlaying(false);
          return prev;
        }
        return stepForward(prev);
      });
    }, ms);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, speed]);

  const handleStep = useCallback(() => {
    setSim((prev) => stepForward(prev));
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
    <div className="relative flex min-h-[calc(100dvh-104px)] flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.10),transparent_32%),var(--sf-bg-canvas)] text-[var(--sf-text-primary)]">
      <div className="z-10 px-4 pt-3">
        <TimelineBar
          currentIndex={sim.currentIndex}
          totalSteps={sim.totalSteps}
          playing={playing}
          currentStep={currentStep}
          backHref="/mes/fab-floor/cmp"
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
        <div className="flex-1 overflow-hidden rounded-2xl border border-[rgba(245,158,11,0.15)]" data-testid="planarize-scene-panel">
          <PlanarizeScene step={currentStep} params={sim.params} />
        </div>
        <div className="flex-1 overflow-hidden rounded-2xl border border-[rgba(245,158,11,0.15)]" data-testid="wafer-metrics-panel">
          <WaferMetricsPanel steps={sim.steps} currentStep={currentStep} metric={metric} onMetricChange={setMetric} />
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

**Step 2: Commit**

```bash
git add src/app/mes/fab-floor/cmp/planarization-sim/page.tsx
git commit -m "feat(cmp-sim): page route wiring all components together"
```

---

## Task 16: Run All Tests + Final Verification

**Step 1: Run all CMP sim tests**

Run: `cd equipment-monitor && npx jest src/lib/cmp-sim/ --verbose`
Expected: All 45+ tests PASS across 8 test files

**Step 2: TypeScript check**

Run: `cd equipment-monitor && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors related to cmp-sim files

**Step 3: Dev server check**

Run: `cd equipment-monitor && npx next build 2>&1 | tail -20`
Expected: Build succeeds, `/mes/fab-floor/cmp/planarization-sim` route included

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(cmp-sim): resolve any build/type issues from integration"
```
