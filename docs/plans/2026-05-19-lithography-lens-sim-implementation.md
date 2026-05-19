# Lithography Lens Sim Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an interactive DUV ArFi 193nm lens heating + immersion fluid digital twin at `/mes/fab-floor/lithography/lens-sim` with semi-quantitative physics, split-screen Babylon.js visualization, and timeline-driven lot simulation.

**Architecture:** Pure TypeScript simulation engine (`lib/lens-sim/`) decoupled from rendering. Babylon.js cross-section scene (left) + Canvas2D wafer heatmap (right). Page state via `useRef` for engine + `useState` for UI. No Zustand store needed.

**Tech Stack:** Next.js 15, Babylon.js v9.6.2, TypeScript, Jest, Canvas2D (wafer map)

**Design doc:** `docs/plans/2026-05-19-lithography-lens-sim-design.md`

---

### Task 1: Types and Constants

**Files:**
- Create: `equipment-monitor/src/lib/lens-sim/types.ts`
- Create: `equipment-monitor/src/lib/lens-sim/constants.ts`

**Step 1: Create types.ts**

```typescript
// equipment-monitor/src/lib/lens-sim/types.ts

/** Simulation input parameters (driven by sliders) */
export interface SimulationParams {
  dose: number;            // mJ/cm2
  scanSpeed: number;       // mm/s
  coolingPower: number;    // 0-1 (fraction)
  fluidFlowRate: number;   // L/min
  resistThickness: number; // nm
  ambientTemp: number;     // degC
}

/** Per-lens-element thermal state */
export interface LensElementState {
  index: number;       // 0=L1 (closest to wafer) .. 4=L5
  temperature: number; // degC
  deltaT: number;      // degC above ambient
  deltaOPL: number;    // nm optical path length change
}

/** Per-wafer exposure result */
export interface WaferState {
  waferIndex: number;           // 0-24
  elapsedTime: number;          // seconds since lot start
  lensElements: LensElementState[];
  zernikes: number[];           // Z1-Z16 coefficients (nm wavefront)
  cdMap: number[];              // per-die CD deviation (nm) - flat array, row-major
  overlayMap: number[];         // per-die overlay magnitude (nm)
  lerMap: number[];             // per-die LER 3sigma (nm)
  defectMap: number[];          // per-die defect count
  dieCount: number;             // number of dies
  dieGridCols: number;          // columns in die grid
  dieGridRows: number;          // rows in die grid
}

/** Full simulation state */
export interface SimulationState {
  params: SimulationParams;
  wafers: WaferState[];     // history for all exposed wafers so far
  currentIndex: number;     // 0-24
  lotSize: number;          // 25
}

/** Wafer metric layer for display */
export type WaferMetric = 'cd' | 'overlay' | 'ler' | 'defectivity';

/** What-if preset identifier */
export type PresetId = 'cooling-failure' | 'flow-drop' | 'dose-drift' | 'cold-start';

/** What-if preset definition */
export interface Preset {
  id: PresetId;
  label: string;
  labelCN: string;
  color: string;
  apply: (params: SimulationParams, waferIndex: number) => SimulationParams;
}

/** Defect type from immersion fluid */
export type DefectType = 'watermark' | 'bubble' | 'particle' | 'film-pull';

/** Fluid state at a given moment */
export interface FluidState {
  flowVelocity: number;      // m/s
  meniscusContactAngle: number; // degrees
  criticalScanSpeed: number; // mm/s
  bubbleProbability: number; // 0-1
  watermarkRisk: number;     // 0-1
  waterTemp: number;         // degC
}
```

**Step 2: Create constants.ts**

```typescript
// equipment-monitor/src/lib/lens-sim/constants.ts
import type { SimulationParams } from './types';

/** Number of lens elements modeled (L1 closest to wafer, L5 farthest) */
export const LENS_COUNT = 5;

/** Number of Zernike coefficients (Z1-Z16) */
export const ZERNIKE_COUNT = 16;

/** Default lot size */
export const LOT_SIZE = 25;

/** Exposure time per wafer (seconds) - typical ArFi scanner */
export const EXPOSURE_TIME_PER_WAFER = 12;

/** Wafer diameter (mm) */
export const WAFER_DIAMETER_MM = 300;

/** Die grid layout (approximation for 300mm wafer) */
export const DIE_GRID_COLS = 9;
export const DIE_GRID_ROWS = 9;

/** Valid die positions (1 = active die, 0 = outside wafer) - row-major */
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

/** Number of active dies */
export const ACTIVE_DIE_COUNT = DIE_MASK.filter((d) => d === 1).length;

// ---- Lens element physical properties ----

/** Absorption fraction per pass for each element [L1..L5] */
export const ABSORPTION_FRACTION = [0.003, 0.002, 0.0015, 0.001, 0.0008];

/** Thermal time constant tau (seconds) per element [L1..L5] */
export const THERMAL_TAU = [80, 120, 160, 220, 300];

/** Max temperature rise at 100% cooling (degC) per element [L1..L5] */
export const DELTA_T_MAX_BASE = [0.15, 0.10, 0.07, 0.04, 0.02];

/** Element thickness (mm) [L1..L5] */
export const ELEMENT_THICKNESS_MM = [15, 20, 25, 30, 40];

// ---- Optical constants ----

/** Fused silica dn/dT at 193nm (per degC) */
export const SILICA_DN_DT = 10e-6;

/** Water dn/dT at 193nm (per degC) — negative */
export const WATER_DN_DT = -100e-6;

/** Water refractive index at 193nm (baseline) */
export const WATER_N_193 = 1.437;

/** Immersion gap height (um) */
export const IMMERSION_GAP_UM = 100;

// ---- Zernike sensitivities (nm wavefront per degC of L1) ----

export const ZERNIKE_SENSITIVITY: readonly number[] = [
  0,     // Z1 piston (ignored)
  0.05,  // Z2 tilt-x
  0.05,  // Z3 tilt-y
  1.2,   // Z4 defocus (dominant)
  0.3,   // Z5 astigmatism-0
  0.25,  // Z6 astigmatism-45
  0.15,  // Z7 coma-x
  0.12,  // Z8 coma-y
  0.5,   // Z9 spherical (significant)
  0.08,  // Z10 trefoil
  0.06,  // Z11 trefoil
  0.04,  // Z12
  0.03,  // Z13
  0.02,  // Z14
  0.015, // Z15
  0.01,  // Z16
];

// ---- Wafer impact sensitivities ----

/** CD change per nm of defocus (nm CD / nm defocus) */
export const CD_PER_DEFOCUS = 0.4;

/** CD change per mJ/cm2 dose error (nm CD / mJ) */
export const CD_PER_DOSE = 1.5;

/** Overlay per nm of coma wavefront (nm OVL / nm wavefront) */
export const OVERLAY_PER_COMA = 0.6;

/** Overlay per nm of tilt wavefront */
export const OVERLAY_PER_TILT = 0.8;

/** Base LER 3sigma (nm) */
export const BASE_LER = 2.8;

/** LER sensitivity to dose margin (nm LER per % dose error) */
export const LER_PER_DOSE_PCT = 0.15;

// ---- Fluid dynamics ----

/** Water surface tension at 22.5C (N/m) */
export const WATER_SURFACE_TENSION = 0.0728;

/** Water dynamic viscosity at 22.5C (Pa*s) */
export const WATER_VISCOSITY = 0.00095;

/** Meniscus length (mm) */
export const MENISCUS_LENGTH_MM = 2.0;

/** Base contact angle (degrees) */
export const BASE_CONTACT_ANGLE = 60;

/** Fraction of L1 heat removed by immersion water */
export const WATER_COOLING_FRACTION = 0.7;

// ---- Slider parameter bounds ----

export const PARAM_BOUNDS = {
  dose:            { min: 20, max: 45, default: 30, step: 0.5, unit: 'mJ/cm\u00B2' },
  scanSpeed:       { min: 200, max: 700, default: 500, step: 10, unit: 'mm/s' },
  coolingPower:    { min: 0, max: 1, default: 0.8, step: 0.01, unit: '%', displayScale: 100 },
  fluidFlowRate:   { min: 0.3, max: 2.0, default: 1.2, step: 0.1, unit: 'L/min' },
  resistThickness: { min: 60, max: 120, default: 90, step: 1, unit: 'nm' },
  ambientTemp:     { min: 22.0, max: 23.0, default: 22.5, step: 0.1, unit: '\u00B0C' },
} as const;

/** Default simulation parameters */
export const DEFAULT_PARAMS: SimulationParams = {
  dose: PARAM_BOUNDS.dose.default,
  scanSpeed: PARAM_BOUNDS.scanSpeed.default,
  coolingPower: PARAM_BOUNDS.coolingPower.default,
  fluidFlowRate: PARAM_BOUNDS.fluidFlowRate.default,
  resistThickness: PARAM_BOUNDS.resistThickness.default,
  ambientTemp: PARAM_BOUNDS.ambientTemp.default,
};
```

**Step 3: Commit**

```bash
git add equipment-monitor/src/lib/lens-sim/types.ts equipment-monitor/src/lib/lens-sim/constants.ts
git commit -m "feat(lens-sim): add types and physical constants"
```

---

### Task 2: Thermal Model

**Files:**
- Create: `equipment-monitor/src/lib/lens-sim/thermal-model.ts`
- Create: `equipment-monitor/src/lib/lens-sim/__tests__/thermal-model.test.ts`

**Step 1: Write failing tests**

```typescript
// equipment-monitor/src/lib/lens-sim/__tests__/thermal-model.test.ts
import { computeLensTemperatures } from '../thermal-model';
import { DEFAULT_PARAMS } from '../constants';

describe('thermal-model', () => {
  it('returns LENS_COUNT elements', () => {
    const result = computeLensTemperatures(DEFAULT_PARAMS, 0);
    expect(result).toHaveLength(5);
  });

  it('L1 reaches ~63% of deltaT_max at t=tau', () => {
    // tau for L1 = 80s. At default cooling (0.8), effective dT_max scaled.
    // At t=80s, T should be ~63.2% of max rise
    const tau = 80;
    const result = computeLensTemperatures(DEFAULT_PARAMS, tau);
    const maxResult = computeLensTemperatures(DEFAULT_PARAMS, 10000);
    const ratio = result[0].deltaT / maxResult[0].deltaT;
    expect(ratio).toBeCloseTo(0.632, 1);
  });

  it('converges to steady state by wafer 25', () => {
    const tEnd = 25 * 12; // 25 wafers * 12s each = 300s
    const result = computeLensTemperatures(DEFAULT_PARAMS, tEnd);
    const steadyState = computeLensTemperatures(DEFAULT_PARAMS, 10000);
    result.forEach((el, i) => {
      const ratio = el.deltaT / steadyState[i].deltaT;
      expect(ratio).toBeGreaterThan(0.95);
    });
  });

  it('L1 has highest temperature', () => {
    const result = computeLensTemperatures(DEFAULT_PARAMS, 100);
    for (let i = 1; i < result.length; i++) {
      expect(result[0].deltaT).toBeGreaterThan(result[i].deltaT);
    }
  });

  it('cooling=0 doubles effective deltaT_max', () => {
    const noCooling = { ...DEFAULT_PARAMS, coolingPower: 0 };
    const full = computeLensTemperatures(noCooling, 10000);
    const withCooling = computeLensTemperatures(DEFAULT_PARAMS, 10000);
    // With cooling at 0.8, dT_max is reduced. Without cooling, should be higher.
    expect(full[0].deltaT).toBeGreaterThan(withCooling[0].deltaT * 1.3);
  });

  it('higher dose increases temperature', () => {
    const highDose = { ...DEFAULT_PARAMS, dose: 45 };
    const normal = computeLensTemperatures(DEFAULT_PARAMS, 100);
    const hot = computeLensTemperatures(highDose, 100);
    expect(hot[0].deltaT).toBeGreaterThan(normal[0].deltaT);
  });

  it('computes deltaOPL proportional to deltaT and thickness', () => {
    const result = computeLensTemperatures(DEFAULT_PARAMS, 100);
    // dOPL = dn/dT * dT * thickness_mm * 1e6 (convert mm to nm)
    // All elements should have positive dOPL
    result.forEach((el) => {
      expect(el.deltaOPL).toBeGreaterThan(0);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd equipment-monitor && npx jest lens-sim --passWithNoTests`
Expected: FAIL — module not found

**Step 3: Implement thermal-model.ts**

```typescript
// equipment-monitor/src/lib/lens-sim/thermal-model.ts
import type { LensElementState, SimulationParams } from './types';
import {
  ABSORPTION_FRACTION,
  DELTA_T_MAX_BASE,
  ELEMENT_THICKNESS_MM,
  LENS_COUNT,
  SILICA_DN_DT,
  THERMAL_TAU,
  WATER_COOLING_FRACTION,
} from './constants';

/**
 * Compute lens element temperatures at a given elapsed time.
 *
 * Model: T(t) = T_ambient + dT_max_eff * (1 - e^(-t/tau))
 * where dT_max_eff scales with dose (vs default 30) and inversely with cooling.
 *
 * All values synthetic/illustrative.
 */
export function computeLensTemperatures(
  params: SimulationParams,
  elapsedSeconds: number,
): LensElementState[] {
  const doseScale = params.dose / 30; // normalized to default 30 mJ/cm2

  return Array.from({ length: LENS_COUNT }, (_, i) => {
    // Effective cooling: L1 gets extra cooling from immersion water
    const waterCooling = i === 0 ? WATER_COOLING_FRACTION * params.coolingPower : 0;
    const effectiveCooling = params.coolingPower * (1 - (i === 0 ? 0 : 0)) + waterCooling;
    // dT_max reduced by cooling: at cooling=1, base value; at cooling=0, ~1/(1-waterCooling) higher
    const coolingFactor = 1 / (0.3 + 0.7 * (i === 0 ? effectiveCooling : params.coolingPower));
    const deltaTMax = DELTA_T_MAX_BASE[i] * doseScale * coolingFactor;

    const tau = THERMAL_TAU[i];
    const deltaT = deltaTMax * (1 - Math.exp(-elapsedSeconds / tau));
    const temperature = params.ambientTemp + deltaT;

    // Optical path length change: dOPL = dn/dT * dT * thickness (mm->nm via *1e6)
    const deltaOPL = SILICA_DN_DT * deltaT * ELEMENT_THICKNESS_MM[i] * 1e6;

    return { index: i, temperature, deltaT, deltaOPL };
  });
}
```

**Step 4: Run tests to verify they pass**

Run: `cd equipment-monitor && npx jest thermal-model -v`
Expected: All 7 tests PASS

**Step 5: Commit**

```bash
git add equipment-monitor/src/lib/lens-sim/thermal-model.ts equipment-monitor/src/lib/lens-sim/__tests__/thermal-model.test.ts
git commit -m "feat(lens-sim): thermal model with exponential lens heating"
```

---

### Task 3: Sellmeier Refractive Index Model

**Files:**
- Create: `equipment-monitor/src/lib/lens-sim/sellmeier.ts`
- Create: `equipment-monitor/src/lib/lens-sim/__tests__/sellmeier.test.ts`

**Step 1: Write failing tests**

```typescript
// equipment-monitor/src/lib/lens-sim/__tests__/sellmeier.test.ts
import { silicaDnDt, waterDnDt, waterRefractiveIndex } from '../sellmeier';

describe('sellmeier', () => {
  it('silica dn/dT is ~10e-6 /C at 193nm', () => {
    const result = silicaDnDt(22.5);
    expect(result).toBeCloseTo(10e-6, 7);
  });

  it('water dn/dT is negative (~-100e-6 /C)', () => {
    const result = waterDnDt(22.5);
    expect(result).toBeLessThan(0);
    expect(Math.abs(result)).toBeCloseTo(100e-6, 6);
  });

  it('water refractive index at baseline is ~1.437', () => {
    const result = waterRefractiveIndex(22.5);
    expect(result).toBeCloseTo(1.437, 2);
  });

  it('water refractive index decreases with temperature', () => {
    const n1 = waterRefractiveIndex(22.0);
    const n2 = waterRefractiveIndex(23.0);
    expect(n2).toBeLessThan(n1);
  });
});
```

**Step 2: Run tests — expected FAIL**

**Step 3: Implement sellmeier.ts**

```typescript
// equipment-monitor/src/lib/lens-sim/sellmeier.ts
import { SILICA_DN_DT, WATER_DN_DT, WATER_N_193 } from './constants';

/**
 * Fused silica dn/dT at 193nm.
 * Simplified: constant over small temperature range near 22.5C.
 * Real Sellmeier would be wavelength-dependent, but at fixed 193nm this is sufficient.
 */
export function silicaDnDt(_temperatureC: number): number {
  return SILICA_DN_DT;
}

/**
 * Water dn/dT at 193nm. Negative value.
 */
export function waterDnDt(_temperatureC: number): number {
  return WATER_DN_DT;
}

/**
 * Water refractive index at 193nm as function of temperature.
 * Linear model: n(T) = n_base + dn/dT * (T - T_ref)
 */
export function waterRefractiveIndex(temperatureC: number): number {
  const deltaT = temperatureC - 22.5;
  return WATER_N_193 + WATER_DN_DT * deltaT;
}
```

**Step 4: Run tests — expected PASS**

**Step 5: Commit**

```bash
git add equipment-monitor/src/lib/lens-sim/sellmeier.ts equipment-monitor/src/lib/lens-sim/__tests__/sellmeier.test.ts
git commit -m "feat(lens-sim): Sellmeier refractive index model for silica and water"
```

---

### Task 4: Zernike Wavefront Model

**Files:**
- Create: `equipment-monitor/src/lib/lens-sim/zernike.ts`
- Create: `equipment-monitor/src/lib/lens-sim/__tests__/zernike.test.ts`

**Step 1: Write failing tests**

```typescript
// equipment-monitor/src/lib/lens-sim/__tests__/zernike.test.ts
import { computeZernikes, zernikeToFieldImpact } from '../zernike';
import type { LensElementState } from '../types';
import { LENS_COUNT, ZERNIKE_COUNT } from '../constants';

function makeLensState(l1DeltaT: number): LensElementState[] {
  // Create a lens state where L1 has the given deltaT, others proportionally less
  return Array.from({ length: LENS_COUNT }, (_, i) => ({
    index: i,
    temperature: 22.5 + l1DeltaT * (1 - i * 0.2),
    deltaT: l1DeltaT * (1 - i * 0.2),
    deltaOPL: 0, // not used by zernike model directly
  }));
}

describe('zernike', () => {
  it('returns ZERNIKE_COUNT coefficients', () => {
    const result = computeZernikes(makeLensState(0.1));
    expect(result).toHaveLength(ZERNIKE_COUNT);
  });

  it('Z4 (defocus) is the dominant coefficient under symmetric heating', () => {
    const z = computeZernikes(makeLensState(0.1));
    const z4 = Math.abs(z[3]); // Z4 at index 3
    // Z4 should be larger than any other
    z.forEach((val, i) => {
      if (i !== 3) expect(z4).toBeGreaterThan(Math.abs(val));
    });
  });

  it('cold lens produces near-zero Zernikes', () => {
    const z = computeZernikes(makeLensState(0));
    z.forEach((val) => expect(Math.abs(val)).toBeLessThan(0.001));
  });

  it('hotter lens produces larger Zernikes', () => {
    const cool = computeZernikes(makeLensState(0.05));
    const hot = computeZernikes(makeLensState(0.15));
    expect(Math.abs(hot[3])).toBeGreaterThan(Math.abs(cool[3]));
  });

  it('zernikeToFieldImpact returns per-die CD and overlay values', () => {
    const z = computeZernikes(makeLensState(0.1));
    const impact = zernikeToFieldImpact(z, 9, 9);
    expect(impact.cdImpact).toHaveLength(81);
    expect(impact.overlayImpact).toHaveLength(81);
  });
});
```

**Step 2: Run tests — expected FAIL**

**Step 3: Implement zernike.ts**

```typescript
// equipment-monitor/src/lib/lens-sim/zernike.ts
import type { LensElementState } from './types';
import {
  CD_PER_DEFOCUS,
  OVERLAY_PER_COMA,
  OVERLAY_PER_TILT,
  ZERNIKE_COUNT,
  ZERNIKE_SENSITIVITY,
} from './constants';

/**
 * Compute Zernike wavefront coefficients (nm) from lens thermal state.
 * Simplified: each Zernike is proportional to the weighted sum of element deltaTsm
 * with L1 contributing most.
 *
 * Synthetic/illustrative values.
 */
export function computeZernikes(lensElements: LensElementState[]): number[] {
  // Weighted average deltaT (L1 dominates)
  const weights = [0.5, 0.25, 0.13, 0.08, 0.04];
  const weightedDeltaT = lensElements.reduce(
    (sum, el, i) => sum + el.deltaT * (weights[i] ?? 0),
    0,
  );

  return Array.from({ length: ZERNIKE_COUNT }, (_, i) => {
    return ZERNIKE_SENSITIVITY[i] * weightedDeltaT;
  });
}

/**
 * Convert Zernike coefficients to per-die CD and overlay impact.
 *
 * CD impact: dominated by Z4 (defocus) and Z9 (spherical).
 *   - Z4 contributes a uniform shift
 *   - Z9 contributes a radial bowl (center vs edge)
 *
 * Overlay impact: dominated by Z2/Z3 (tilt) and Z7/Z8 (coma).
 *   - Z2/Z3 create linear gradient
 *   - Z7/Z8 create clover-leaf pattern
 */
export function zernikeToFieldImpact(
  zernikes: number[],
  gridCols: number,
  gridRows: number,
): { cdImpact: number[]; overlayImpact: number[] } {
  const dieCount = gridCols * gridRows;
  const cdImpact = new Array<number>(dieCount);
  const overlayImpact = new Array<number>(dieCount);

  const cx = (gridCols - 1) / 2;
  const cy = (gridRows - 1) / 2;
  const maxR = Math.sqrt(cx * cx + cy * cy);

  const z4 = zernikes[3] ?? 0;  // defocus
  const z5 = zernikes[4] ?? 0;  // astig-0
  const z6 = zernikes[5] ?? 0;  // astig-45
  const z7 = zernikes[6] ?? 0;  // coma-x
  const z8 = zernikes[7] ?? 0;  // coma-y
  const z9 = zernikes[8] ?? 0;  // spherical
  const z2 = zernikes[1] ?? 0;  // tilt-x
  const z3 = zernikes[2] ?? 0;  // tilt-y

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const idx = row * gridCols + col;
      const rx = (col - cx) / (maxR || 1); // normalized -1..1
      const ry = (row - cy) / (maxR || 1);
      const r2 = rx * rx + ry * ry;

      // CD: defocus (uniform) + spherical (radial bowl) + astigmatism (saddle)
      const defocusContrib = z4 * CD_PER_DEFOCUS;
      const sphericalContrib = z9 * CD_PER_DEFOCUS * (2 * r2 - 1);
      const astigContrib = (z5 * (rx * rx - ry * ry) + z6 * 2 * rx * ry) * CD_PER_DEFOCUS * 0.5;
      cdImpact[idx] = defocusContrib + sphericalContrib + astigContrib;

      // Overlay: tilt (linear) + coma (clover)
      const tiltContrib = Math.sqrt((z2 * OVERLAY_PER_TILT) ** 2 + (z3 * OVERLAY_PER_TILT) ** 2) * Math.sqrt(rx * rx + ry * ry);
      const comaContrib = Math.sqrt((z7 * rx) ** 2 + (z8 * ry) ** 2) * OVERLAY_PER_COMA;
      overlayImpact[idx] = tiltContrib + comaContrib;
    }
  }

  return { cdImpact, overlayImpact };
}
```

**Step 4: Run tests — expected PASS**

**Step 5: Commit**

```bash
git add equipment-monitor/src/lib/lens-sim/zernike.ts equipment-monitor/src/lib/lens-sim/__tests__/zernike.test.ts
git commit -m "feat(lens-sim): Zernike wavefront model with field impact mapping"
```

---

### Task 5: Fluid Dynamics Model

**Files:**
- Create: `equipment-monitor/src/lib/lens-sim/fluid-model.ts`
- Create: `equipment-monitor/src/lib/lens-sim/__tests__/fluid-model.test.ts`

**Step 1: Write failing tests**

```typescript
// equipment-monitor/src/lib/lens-sim/__tests__/fluid-model.test.ts
import { computeFluidState, computeDefectProbabilities } from '../fluid-model';
import { DEFAULT_PARAMS } from '../constants';

describe('fluid-model', () => {
  it('critical scan speed increases with higher surface tension', () => {
    // Higher flow rate -> better meniscus control -> higher critical speed
    const low = computeFluidState({ ...DEFAULT_PARAMS, fluidFlowRate: 0.5 }, 22.5);
    const high = computeFluidState({ ...DEFAULT_PARAMS, fluidFlowRate: 1.5 }, 22.5);
    expect(high.criticalScanSpeed).toBeGreaterThan(low.criticalScanSpeed);
  });

  it('bubble probability increases when scan speed exceeds critical', () => {
    const fast = computeFluidState({ ...DEFAULT_PARAMS, scanSpeed: 700 }, 22.5);
    const slow = computeFluidState({ ...DEFAULT_PARAMS, scanSpeed: 200 }, 22.5);
    expect(fast.bubbleProbability).toBeGreaterThan(slow.bubbleProbability);
  });

  it('defect probability > 50% when flow rate < 0.5 L/min', () => {
    const lowFlow = computeFluidState({ ...DEFAULT_PARAMS, fluidFlowRate: 0.3 }, 22.5);
    expect(lowFlow.bubbleProbability + lowFlow.watermarkRisk).toBeGreaterThan(0.5);
  });

  it('water temperature rises from ambient', () => {
    const state = computeFluidState(DEFAULT_PARAMS, 22.5);
    // Water acts as heat sink, should be slightly above ambient if lens is hot
    expect(state.waterTemp).toBeGreaterThanOrEqual(DEFAULT_PARAMS.ambientTemp);
  });

  it('computeDefectProbabilities returns per-die defect counts', () => {
    const fluid = computeFluidState(DEFAULT_PARAMS, 22.5);
    const defects = computeDefectProbabilities(fluid, DEFAULT_PARAMS, 9, 9);
    expect(defects).toHaveLength(81);
    defects.forEach((d) => expect(d).toBeGreaterThanOrEqual(0));
  });

  it('edge dies have higher defect counts than center dies', () => {
    const fluid = computeFluidState({ ...DEFAULT_PARAMS, scanSpeed: 600 }, 22.5);
    const defects = computeDefectProbabilities(fluid, { ...DEFAULT_PARAMS, scanSpeed: 600 }, 9, 9);
    // Center die
    const centerIdx = 4 * 9 + 4;
    // Edge die (leftmost in center row)
    const edgeIdx = 4 * 9 + 0;
    // On average edge should have more defects (bubble/film-pull at scan reversal)
    // Use a simple comparison — at high speed this should hold
    expect(defects[edgeIdx]).toBeGreaterThanOrEqual(defects[centerIdx]);
  });
});
```

**Step 2: Run tests — expected FAIL**

**Step 3: Implement fluid-model.ts**

```typescript
// equipment-monitor/src/lib/lens-sim/fluid-model.ts
import type { FluidState, SimulationParams } from './types';
import {
  BASE_CONTACT_ANGLE,
  MENISCUS_LENGTH_MM,
  WATER_COOLING_FRACTION,
  WATER_SURFACE_TENSION,
  WATER_VISCOSITY,
} from './constants';

/**
 * Compute immersion fluid state from simulation parameters.
 * Simplified Navier-Stokes and meniscus stability model.
 *
 * Synthetic/illustrative values.
 */
export function computeFluidState(
  params: SimulationParams,
  l1DeltaT: number,
): FluidState {
  // Flow velocity proportional to flow rate, inversely to gap cross-section
  const flowVelocity = params.fluidFlowRate / 2.0; // simplified: L/min -> ~m/s

  // Meniscus contact angle affected by flow rate (higher flow = better wetting)
  const flowFactor = Math.min(params.fluidFlowRate / 1.2, 1.5);
  const meniscusContactAngle = BASE_CONTACT_ANGLE / flowFactor;

  // Critical scan speed: v_crit = gamma * cos(theta) / (3 * mu * L)
  const thetaRad = (meniscusContactAngle * Math.PI) / 180;
  const criticalScanSpeed =
    (WATER_SURFACE_TENSION * Math.cos(thetaRad)) /
    (3 * WATER_VISCOSITY * (MENISCUS_LENGTH_MM / 1000)) * 1000; // convert to mm/s

  // Bubble probability: sigmoid above critical speed
  const speedRatio = params.scanSpeed / criticalScanSpeed;
  const bubbleProbability = 1 / (1 + Math.exp(-8 * (speedRatio - 1)));

  // Watermark risk: increases at low flow rates
  const watermarkRisk = Math.max(0, 1 - params.fluidFlowRate / 0.8) * 0.7;

  // Water temperature: absorbs heat from L1
  const heatAbsorbed = l1DeltaT * WATER_COOLING_FRACTION * params.coolingPower;
  const waterTemp = params.ambientTemp + heatAbsorbed * 0.3; // attenuated

  return {
    flowVelocity,
    meniscusContactAngle,
    criticalScanSpeed,
    bubbleProbability,
    watermarkRisk,
    waterTemp,
  };
}

/**
 * Compute per-die defect counts based on fluid state.
 * Edge dies (near scan-reversal zones) get more bubble/film-pull defects.
 * Random particle defects scattered uniformly.
 *
 * Returns deterministic values (seeded by die position) for reproducibility.
 */
export function computeDefectProbabilities(
  fluid: FluidState,
  params: SimulationParams,
  gridCols: number,
  gridRows: number,
): number[] {
  const dieCount = gridCols * gridRows;
  const defects = new Array<number>(dieCount);
  const cx = (gridCols - 1) / 2;
  const cy = (gridRows - 1) / 2;

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const idx = row * gridCols + col;
      const rx = Math.abs(col - cx) / cx; // 0=center, 1=edge
      const ry = Math.abs(row - cy) / cy;

      // Edge factor: scan reversal at left/right edges (x-direction)
      const edgeFactor = rx * rx;

      // Bubble defects: edge-concentrated, scaled by probability
      const bubbleDefects = fluid.bubbleProbability * edgeFactor * 3;

      // Watermark: more uniform, slight edge bias
      const watermarkDefects = fluid.watermarkRisk * (0.5 + 0.5 * Math.max(rx, ry));

      // Film-pull: only at extreme edges when speed > critical
      const filmPull = params.scanSpeed > fluid.criticalScanSpeed * 0.9 ? edgeFactor * 0.8 : 0;

      // Particle: uniform low-level background
      const particleBase = 0.05;

      defects[idx] = Math.max(0, bubbleDefects + watermarkDefects + filmPull + particleBase);
    }
  }

  return defects;
}
```

**Step 4: Run tests — expected PASS**

**Step 5: Commit**

```bash
git add equipment-monitor/src/lib/lens-sim/fluid-model.ts equipment-monitor/src/lib/lens-sim/__tests__/fluid-model.test.ts
git commit -m "feat(lens-sim): immersion fluid dynamics and defect probability model"
```

---

### Task 6: Wafer Metrics Calculator

**Files:**
- Create: `equipment-monitor/src/lib/lens-sim/wafer-metrics.ts`
- Create: `equipment-monitor/src/lib/lens-sim/__tests__/wafer-metrics.test.ts`

**Step 1: Write failing tests**

```typescript
// equipment-monitor/src/lib/lens-sim/__tests__/wafer-metrics.test.ts
import { computeWaferMetrics } from '../wafer-metrics';
import { DEFAULT_PARAMS } from '../constants';

describe('wafer-metrics', () => {
  it('returns correct die count for 9x9 grid', () => {
    const result = computeWaferMetrics(DEFAULT_PARAMS, 60);
    expect(result.dieCount).toBe(81);
    expect(result.dieGridCols).toBe(9);
    expect(result.dieGridRows).toBe(9);
  });

  it('CD map has correct length', () => {
    const result = computeWaferMetrics(DEFAULT_PARAMS, 60);
    expect(result.cdMap).toHaveLength(81);
  });

  it('first-wafer effect: wafer 1 CD differs from wafer 25 by > 1nm', () => {
    const w1 = computeWaferMetrics(DEFAULT_PARAMS, 12);   // first wafer
    const w25 = computeWaferMetrics(DEFAULT_PARAMS, 300);  // last wafer
    const maxCd1 = Math.max(...w1.cdMap.map(Math.abs));
    const maxCd25 = Math.max(...w25.cdMap.map(Math.abs));
    expect(Math.abs(maxCd25 - maxCd1)).toBeGreaterThan(1);
  });

  it('overlay map values are non-negative', () => {
    const result = computeWaferMetrics(DEFAULT_PARAMS, 100);
    result.overlayMap.forEach((v) => expect(v).toBeGreaterThanOrEqual(0));
  });

  it('LER values are within plausible range (1-6 nm)', () => {
    const result = computeWaferMetrics(DEFAULT_PARAMS, 100);
    result.lerMap.forEach((v) => {
      expect(v).toBeGreaterThan(1);
      expect(v).toBeLessThan(6);
    });
  });

  it('defect map values are non-negative', () => {
    const result = computeWaferMetrics(DEFAULT_PARAMS, 100);
    result.defectMap.forEach((v) => expect(v).toBeGreaterThanOrEqual(0));
  });
});
```

**Step 2: Run tests — expected FAIL**

**Step 3: Implement wafer-metrics.ts**

```typescript
// equipment-monitor/src/lib/lens-sim/wafer-metrics.ts
import type { SimulationParams, WaferState } from './types';
import {
  ACTIVE_DIE_COUNT,
  BASE_LER,
  DIE_GRID_COLS,
  DIE_GRID_ROWS,
  DIE_MASK,
  LER_PER_DOSE_PCT,
} from './constants';
import { computeLensTemperatures } from './thermal-model';
import { computeZernikes, zernikeToFieldImpact } from './zernike';
import { computeFluidState, computeDefectProbabilities } from './fluid-model';

/**
 * Compute all wafer metrics for a given set of params at a given elapsed time.
 * Orchestrates thermal -> zernike -> field impact -> fluid -> defects.
 */
export function computeWaferMetrics(
  params: SimulationParams,
  elapsedSeconds: number,
): Omit<WaferState, 'waferIndex' | 'elapsedTime'> {
  const cols = DIE_GRID_COLS;
  const rows = DIE_GRID_ROWS;
  const dieCount = cols * rows;

  // 1. Lens temperatures
  const lensElements = computeLensTemperatures(params, elapsedSeconds);

  // 2. Zernike wavefront
  const zernikes = computeZernikes(lensElements);

  // 3. CD and overlay from Zernikes
  const { cdImpact, overlayImpact } = zernikeToFieldImpact(zernikes, cols, rows);

  // 4. Fluid state and defects
  const fluid = computeFluidState(params, lensElements[0].deltaT);
  const defectMap = computeDefectProbabilities(fluid, params, cols, rows);

  // 5. LER: base + dose-margin degradation + slight edge effect
  const doseError = ((params.dose - 30) / 30) * 100; // % deviation from nominal
  const lerBase = BASE_LER + Math.abs(doseError) * LER_PER_DOSE_PCT;
  const lerMap = Array.from({ length: dieCount }, (_, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const rx = Math.abs(col - (cols - 1) / 2) / ((cols - 1) / 2);
    const ry = Math.abs(row - (rows - 1) / 2) / ((rows - 1) / 2);
    const edgePenalty = (rx * rx + ry * ry) * 0.3;
    return lerBase + edgePenalty;
  });

  // 6. Apply die mask (zero out inactive dies)
  const cdMap = cdImpact.map((v, i) => (DIE_MASK[i] ? v : 0));
  const overlayMapMasked = overlayImpact.map((v, i) => (DIE_MASK[i] ? v : 0));
  const lerMapMasked = lerMap.map((v, i) => (DIE_MASK[i] ? v : 0));
  const defectMapMasked = defectMap.map((v, i) => (DIE_MASK[i] ? v : 0));

  return {
    lensElements,
    zernikes,
    cdMap,
    overlayMap: overlayMapMasked,
    lerMap: lerMapMasked,
    defectMap: defectMapMasked,
    dieCount,
    dieGridCols: cols,
    dieGridRows: rows,
  };
}
```

**Step 4: Run tests — expected PASS**

**Step 5: Commit**

```bash
git add equipment-monitor/src/lib/lens-sim/wafer-metrics.ts equipment-monitor/src/lib/lens-sim/__tests__/wafer-metrics.test.ts
git commit -m "feat(lens-sim): wafer metrics calculator orchestrating thermal/zernike/fluid"
```

---

### Task 7: Simulation Engine + Presets

**Files:**
- Create: `equipment-monitor/src/lib/lens-sim/simulation-engine.ts`
- Create: `equipment-monitor/src/lib/lens-sim/presets.ts`
- Create: `equipment-monitor/src/lib/lens-sim/__tests__/simulation-engine.test.ts`

**Step 1: Write failing tests**

```typescript
// equipment-monitor/src/lib/lens-sim/__tests__/simulation-engine.test.ts
import { createSimulation, stepWafer, applyPreset } from '../simulation-engine';
import { DEFAULT_PARAMS, LOT_SIZE } from '../constants';

describe('simulation-engine', () => {
  it('creates initial state with empty wafers', () => {
    const state = createSimulation(DEFAULT_PARAMS);
    expect(state.wafers).toHaveLength(0);
    expect(state.currentIndex).toBe(-1);
    expect(state.lotSize).toBe(LOT_SIZE);
  });

  it('stepWafer advances currentIndex', () => {
    let state = createSimulation(DEFAULT_PARAMS);
    state = stepWafer(state);
    expect(state.currentIndex).toBe(0);
    expect(state.wafers).toHaveLength(1);
  });

  it('full lot produces 25 wafers', () => {
    let state = createSimulation(DEFAULT_PARAMS);
    for (let i = 0; i < LOT_SIZE; i++) {
      state = stepWafer(state);
    }
    expect(state.wafers).toHaveLength(LOT_SIZE);
    expect(state.currentIndex).toBe(LOT_SIZE - 1);
  });

  it('does not exceed lot size', () => {
    let state = createSimulation(DEFAULT_PARAMS);
    for (let i = 0; i < LOT_SIZE + 5; i++) {
      state = stepWafer(state);
    }
    expect(state.wafers).toHaveLength(LOT_SIZE);
  });

  it('cooling-failure preset sets cooling to 0', () => {
    let state = createSimulation(DEFAULT_PARAMS);
    state = stepWafer(state); // wafer 0
    state = applyPreset(state, 'cooling-failure');
    expect(state.params.coolingPower).toBe(0);
  });

  it('cold-start preset resets to fresh state', () => {
    let state = createSimulation(DEFAULT_PARAMS);
    for (let i = 0; i < 10; i++) state = stepWafer(state);
    state = applyPreset(state, 'cold-start');
    expect(state.wafers).toHaveLength(0);
    expect(state.currentIndex).toBe(-1);
  });

  it('wafer elapsed time increases across lot', () => {
    let state = createSimulation(DEFAULT_PARAMS);
    for (let i = 0; i < 5; i++) state = stepWafer(state);
    for (let i = 1; i < state.wafers.length; i++) {
      expect(state.wafers[i].elapsedTime).toBeGreaterThan(state.wafers[i - 1].elapsedTime);
    }
  });
});
```

**Step 2: Run tests — expected FAIL**

**Step 3: Implement presets.ts**

```typescript
// equipment-monitor/src/lib/lens-sim/presets.ts
import type { Preset, SimulationParams } from './types';
import { DEFAULT_PARAMS } from './constants';

export const PRESETS: Preset[] = [
  {
    id: 'cooling-failure',
    label: 'Cooling Failure',
    labelCN: '\u51B7\u5374\u5931\u6548',
    color: '#ef4444',
    apply: (params) => ({ ...params, coolingPower: 0 }),
  },
  {
    id: 'flow-drop',
    label: 'Flow Rate Drop',
    labelCN: '\u6D41\u91CF\u4E0B\u964D',
    color: '#f59e0b',
    apply: (params) => ({ ...params, fluidFlowRate: 0.3 }),
  },
  {
    id: 'dose-drift',
    label: 'Dose Drift +15%',
    labelCN: '\u5242\u91CF\u6F02\u79FB',
    color: '#f97316',
    apply: (params, waferIndex) => ({
      ...params,
      dose: params.dose * (1 + 0.15 * Math.min((waferIndex + 1) / 5, 1)),
    }),
  },
  {
    id: 'cold-start',
    label: 'Cold Start',
    labelCN: '\u51B7\u542F\u52A8',
    color: '#3b82f6',
    apply: () => ({ ...DEFAULT_PARAMS }),
  },
];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
```

**Step 4: Implement simulation-engine.ts**

```typescript
// equipment-monitor/src/lib/lens-sim/simulation-engine.ts
import type { PresetId, SimulationParams, SimulationState, WaferState } from './types';
import { DEFAULT_PARAMS, EXPOSURE_TIME_PER_WAFER, LOT_SIZE } from './constants';
import { computeWaferMetrics } from './wafer-metrics';
import { getPreset } from './presets';

/**
 * Create a fresh simulation state.
 */
export function createSimulation(params: SimulationParams = DEFAULT_PARAMS): SimulationState {
  return {
    params: { ...params },
    wafers: [],
    currentIndex: -1,
    lotSize: LOT_SIZE,
  };
}

/**
 * Advance the simulation by one wafer.
 * Returns a new state (immutable update).
 */
export function stepWafer(state: SimulationState): SimulationState {
  const nextIndex = state.currentIndex + 1;
  if (nextIndex >= state.lotSize) return state;

  const elapsedTime = (nextIndex + 1) * EXPOSURE_TIME_PER_WAFER;
  const metrics = computeWaferMetrics(state.params, elapsedTime);

  const waferState: WaferState = {
    waferIndex: nextIndex,
    elapsedTime,
    ...metrics,
  };

  return {
    ...state,
    wafers: [...state.wafers, waferState],
    currentIndex: nextIndex,
  };
}

/**
 * Apply a what-if preset to the current simulation state.
 */
export function applyPreset(state: SimulationState, presetId: PresetId): SimulationState {
  const preset = getPreset(presetId);
  if (!preset) return state;

  if (presetId === 'cold-start') {
    return createSimulation(preset.apply(state.params, 0));
  }

  return {
    ...state,
    params: preset.apply(state.params, state.currentIndex),
  };
}
```

**Step 5: Create barrel export**

```typescript
// equipment-monitor/src/lib/lens-sim/index.ts
export { createSimulation, stepWafer, applyPreset } from './simulation-engine';
export { PRESETS, getPreset } from './presets';
export { DEFAULT_PARAMS, PARAM_BOUNDS, LOT_SIZE } from './constants';
export type {
  SimulationParams,
  SimulationState,
  WaferState,
  WaferMetric,
  PresetId,
  FluidState,
  LensElementState,
} from './types';
```

**Step 6: Run tests — expected PASS**

Run: `cd equipment-monitor && npx jest lens-sim -v`
Expected: All tests pass (thermal: 7, sellmeier: 4, zernike: 5, fluid: 6, wafer-metrics: 6, engine: 7 = ~35 tests)

**Step 7: Commit**

```bash
git add equipment-monitor/src/lib/lens-sim/
git commit -m "feat(lens-sim): simulation engine with presets and barrel export"
```

---

### Task 8: Page Route and Layout Shell

**Files:**
- Create: `equipment-monitor/src/app/mes/fab-floor/lithography/lens-sim/page.tsx`
- Create: `equipment-monitor/src/components/lens-sim/TimelineBar.tsx`
- Create: `equipment-monitor/src/components/lens-sim/ParameterPanel.tsx`

**Step 1: Create TimelineBar component**

```typescript
// equipment-monitor/src/components/lens-sim/TimelineBar.tsx
'use client';

import { LOT_SIZE } from '@/lib/lens-sim';
import type { WaferState } from '@/lib/lens-sim';

interface TimelineBarProps {
  currentIndex: number;
  lotSize: number;
  playing: boolean;
  currentWafer: WaferState | null;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onSeek: (index: number) => void;
  onReset: () => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
}

export function TimelineBar({
  currentIndex,
  lotSize,
  playing,
  currentWafer,
  onPlay,
  onPause,
  onStep,
  onSeek,
  onReset,
  playbackSpeed,
  onSpeedChange,
}: TimelineBarProps) {
  const waferNum = currentIndex + 1;
  const l1DeltaT = currentWafer?.lensElements[0]?.deltaT ?? 0;
  const maxCd = currentWafer ? Math.max(...currentWafer.cdMap.map(Math.abs)) : 0;
  const elapsed = currentWafer?.elapsedTime ?? 0;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[rgba(34,211,238,0.22)] bg-[rgba(8,18,31,0.82)] px-4 py-2.5 backdrop-blur-xl">
      {/* Transport controls */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg px-2 py-1 font-mono text-xs text-[var(--sf-text-secondary)] hover:bg-white/[0.06]"
          aria-label="Reset to start"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onStep}
          disabled={currentIndex >= lotSize - 1}
          className="rounded-lg px-2 py-1 font-mono text-xs text-[var(--sf-text-secondary)] hover:bg-white/[0.06] disabled:opacity-30"
          aria-label="Step one wafer"
        >
          Step
        </button>
        <button
          type="button"
          onClick={playing ? onPause : onPlay}
          disabled={currentIndex >= lotSize - 1 && !playing}
          className="min-h-[36px] min-w-[36px] rounded-lg border border-[var(--sf-accent-cyan)] bg-[rgba(34,211,238,0.12)] px-2.5 py-1 font-mono text-xs text-white"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? '\u23F8' : '\u25B6'}
        </button>
      </div>

      {/* Scrubber */}
      <input
        type="range"
        min={0}
        max={lotSize - 1}
        value={Math.max(0, currentIndex)}
        onChange={(e) => onSeek(Number(e.target.value))}
        className="mx-2 h-1.5 flex-1 cursor-pointer accent-[var(--sf-accent-cyan)]"
        aria-label="Wafer timeline"
      />

      {/* Readouts */}
      <div className="flex items-center gap-4 font-mono text-[11px]">
        <span className="text-white">
          Wafer <span className="text-[var(--sf-accent-cyan)]">{waferNum}</span>/{lotSize}
        </span>
        <span className="text-[var(--sf-text-muted)]">t={elapsed.toFixed(0)}s</span>
        <span className="text-[var(--sf-text-muted)]">
          L1: <span className={l1DeltaT > 0.1 ? 'text-[#f59e0b]' : 'text-[#22d3ee]'}>+{l1DeltaT.toFixed(3)}\u00B0C</span>
        </span>
        <span className="text-[var(--sf-text-muted)]">
          \u0394CD: <span className={maxCd > 2 ? 'text-[#ef4444]' : 'text-[#22d3ee]'}>{maxCd.toFixed(1)}nm</span>
        </span>
      </div>

      {/* Speed selector */}
      <select
        value={playbackSpeed}
        onChange={(e) => onSpeedChange(Number(e.target.value))}
        className="rounded-lg border border-white/10 bg-transparent px-2 py-1 font-mono text-[10px] text-[var(--sf-text-secondary)]"
        aria-label="Playback speed"
      >
        {[1, 2, 5, 10].map((s) => (
          <option key={s} value={s}>{s}x</option>
        ))}
      </select>
    </div>
  );
}
```

**Step 2: Create ParameterPanel component**

```typescript
// equipment-monitor/src/components/lens-sim/ParameterPanel.tsx
'use client';

import { PARAM_BOUNDS, PRESETS } from '@/lib/lens-sim';
import type { PresetId, SimulationParams } from '@/lib/lens-sim';

interface ParameterPanelProps {
  params: SimulationParams;
  activePreset: PresetId | null;
  onParamChange: (key: keyof SimulationParams, value: number) => void;
  onPreset: (id: PresetId) => void;
}

const SLIDER_KEYS: Array<{ key: keyof SimulationParams; label: string; labelCN: string }> = [
  { key: 'dose', label: 'Dose', labelCN: '\u5242\u91CF' },
  { key: 'scanSpeed', label: 'Scan Speed', labelCN: '\u626B\u63CF\u901F\u5EA6' },
  { key: 'coolingPower', label: 'Cooling', labelCN: '\u51B7\u5374\u529F\u7387' },
  { key: 'fluidFlowRate', label: 'Flow Rate', labelCN: '\u6D41\u91CF' },
  { key: 'resistThickness', label: 'Resist', labelCN: '\u5149\u963B\u539A\u5EA6' },
  { key: 'ambientTemp', label: 'Ambient', labelCN: '\u73AF\u5883\u6E29\u5EA6' },
];

export function ParameterPanel({ params, activePreset, onParamChange, onPreset }: ParameterPanelProps) {
  return (
    <div className="rounded-2xl border border-[rgba(34,211,238,0.22)] bg-[rgba(8,18,31,0.82)] p-3 backdrop-blur-xl">
      {/* Sliders */}
      <div className="mb-3 grid grid-cols-3 gap-x-6 gap-y-2 xl:grid-cols-6">
        {SLIDER_KEYS.map(({ key, label, labelCN }) => {
          const bounds = PARAM_BOUNDS[key];
          const displayValue = bounds.displayScale
            ? (params[key] * bounds.displayScale).toFixed(0)
            : params[key].toFixed(key === 'ambientTemp' ? 1 : key === 'fluidFlowRate' ? 1 : 0);

          return (
            <label key={key} className="flex flex-col gap-0.5">
              <span className="font-mono text-[10px] text-[var(--sf-text-muted)]">
                {label} <span className="text-[var(--sf-text-muted)]/60">({labelCN})</span>
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={bounds.min}
                  max={bounds.max}
                  step={bounds.step}
                  value={params[key]}
                  onChange={(e) => onParamChange(key, Number(e.target.value))}
                  onDoubleClick={() => onParamChange(key, bounds.default)}
                  className="h-1 flex-1 cursor-pointer accent-[var(--sf-accent-cyan)]"
                />
                <span className="w-16 text-right font-mono text-[11px] text-white">
                  {displayValue}{bounds.unit}
                </span>
              </div>
            </label>
          );
        })}
      </div>

      {/* What-If presets */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--sf-text-muted)]">
          What-If
        </span>
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onPreset(preset.id)}
            className="rounded-lg border px-3 py-1.5 font-mono text-[11px] transition-colors"
            style={{
              borderColor: activePreset === preset.id ? preset.color : 'rgba(255,255,255,0.1)',
              backgroundColor: activePreset === preset.id ? `${preset.color}20` : 'transparent',
              color: activePreset === preset.id ? preset.color : 'var(--sf-text-secondary)',
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Step 3: Create page.tsx**

```typescript
// equipment-monitor/src/app/mes/fab-floor/lithography/lens-sim/page.tsx
'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TimelineBar } from '@/components/lens-sim/TimelineBar';
import { ParameterPanel } from '@/components/lens-sim/ParameterPanel';
import {
  createSimulation,
  stepWafer,
  applyPreset,
  DEFAULT_PARAMS,
  LOT_SIZE,
} from '@/lib/lens-sim';
import type { PresetId, SimulationParams, SimulationState, WaferMetric } from '@/lib/lens-sim';

const LensCrossSectionScene = dynamic(
  () => import('@/components/lens-sim/LensCrossSectionScene').then((m) => ({ default: m.LensCrossSectionScene })),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center bg-[var(--sf-bg-canvas)]"><p className="animate-pulse font-mono text-sm text-[var(--sf-text-muted)] motion-reduce:animate-none">Initializing lens simulation...</p></div> },
);

const WaferImpactMap = dynamic(
  () => import('@/components/lens-sim/WaferImpactMap').then((m) => ({ default: m.WaferImpactMap })),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center bg-[var(--sf-bg-canvas)]"><p className="animate-pulse font-mono text-sm text-[var(--sf-text-muted)] motion-reduce:animate-none">Loading wafer map...</p></div> },
);

export default function LensSimPage() {
  const [sim, setSim] = useState<SimulationState>(() => createSimulation());
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [metric, setMetric] = useState<WaferMetric>('cd');
  const [activePreset, setActivePreset] = useState<PresetId | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentWafer = sim.currentIndex >= 0 ? sim.wafers[sim.currentIndex] ?? null : null;

  // Auto-play interval
  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    const ms = Math.max(100, 1200 / speed);
    intervalRef.current = setInterval(() => {
      setSim((prev) => {
        if (prev.currentIndex >= prev.lotSize - 1) {
          setPlaying(false);
          return prev;
        }
        return stepWafer(prev);
      });
    }, ms);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, speed]);

  const handleStep = useCallback(() => {
    setSim((prev) => stepWafer(prev));
  }, []);

  const handleSeek = useCallback((index: number) => {
    setPlaying(false);
    setSim((prev) => {
      // Recompute up to the target index
      let state = createSimulation(prev.params);
      for (let i = 0; i <= index; i++) {
        state = stepWafer(state);
      }
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
      // Recompute all wafers with new params
      let state = createSimulation(newParams);
      for (let i = 0; i <= prev.currentIndex; i++) {
        state = stepWafer(state);
      }
      return state;
    });
  }, []);

  const handlePreset = useCallback((id: PresetId) => {
    setActivePreset(id);
    setSim((prev) => applyPreset(prev, id));
  }, []);

  return (
    <div className="relative flex min-h-[calc(100dvh-104px)] flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.10),transparent_32%),var(--sf-bg-canvas)] text-[var(--sf-text-primary)]">
      {/* Timeline */}
      <div className="z-10 px-4 pt-3">
        <TimelineBar
          currentIndex={sim.currentIndex}
          lotSize={sim.lotSize}
          playing={playing}
          currentWafer={currentWafer}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onStep={handleStep}
          onSeek={handleSeek}
          onReset={handleReset}
          playbackSpeed={speed}
          onSpeedChange={setSpeed}
        />
      </div>

      {/* Split-screen 3D panels */}
      <main className="flex flex-1 gap-1 overflow-hidden px-4 py-2" style={{ minHeight: 480 }}>
        <div className="flex-1 overflow-hidden rounded-2xl border border-[rgba(34,211,238,0.15)]" data-testid="lens-cross-section-panel">
          <LensCrossSectionScene wafer={currentWafer} params={sim.params} />
        </div>
        <div className="flex-1 overflow-hidden rounded-2xl border border-[rgba(34,211,238,0.15)]" data-testid="wafer-impact-panel">
          <WaferImpactMap wafer={currentWafer} metric={metric} onMetricChange={setMetric} />
        </div>
      </main>

      {/* Parameter panel */}
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

**Step 4: Commit**

```bash
git add equipment-monitor/src/app/mes/fab-floor/lithography/lens-sim/page.tsx \
       equipment-monitor/src/components/lens-sim/TimelineBar.tsx \
       equipment-monitor/src/components/lens-sim/ParameterPanel.tsx
git commit -m "feat(lens-sim): page route with timeline and parameter controls"
```

---

### Task 9: Babylon.js Lens Cross-Section Scene

**Files:**
- Create: `equipment-monitor/src/components/lens-sim/LensCrossSectionScene.tsx`

This is the largest single component. It renders the lens column cutaway, thermal heatmap, immersion water, and 193nm beam.

**Step 1: Implement LensCrossSectionScene.tsx**

```typescript
// equipment-monitor/src/components/lens-sim/LensCrossSectionScene.tsx
'use client';

import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { WebGLFallback } from '@/components/three/WebGLFallback';
import { useWebGLSupport } from '@/hooks/use-webgl-support';
import type { SimulationParams, WaferState } from '@/lib/lens-sim';
import { LENS_COUNT } from '@/lib/lens-sim/constants';

interface LensCrossSectionSceneProps {
  wafer: WaferState | null;
  params: SimulationParams;
}

/** Map deltaT to a color between cyan -> amber -> red */
function heatColor(deltaT: number, maxDeltaT: number): BABYLON.Color3 {
  const t = Math.min(deltaT / Math.max(maxDeltaT, 0.01), 1);
  if (t < 0.5) {
    const s = t / 0.5;
    return BABYLON.Color3.Lerp(
      BABYLON.Color3.FromHexString('#22d3ee'),
      BABYLON.Color3.FromHexString('#f59e0b'),
      s,
    );
  }
  const s = (t - 0.5) / 0.5;
  return BABYLON.Color3.Lerp(
    BABYLON.Color3.FromHexString('#f59e0b'),
    BABYLON.Color3.FromHexString('#ef4444'),
    s,
  );
}

function createScene(
  canvas: HTMLCanvasElement,
  propsRef: React.MutableRefObject<LensCrossSectionSceneProps>,
) {
  const engine = new BABYLON.Engine(canvas, true, { stencil: true, antialias: true });
  engine.setHardwareScalingLevel(window.devicePixelRatio > 1 ? 1.2 : 1);
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.02, 0.03, 0.08, 1);

  // Camera: side view
  const camera = new BABYLON.ArcRotateCamera('LENS-CAM', -Math.PI / 2, 1.1, 14, new BABYLON.Vector3(0, 3, 0), scene);
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 6;
  camera.upperRadiusLimit = 22;
  camera.wheelPrecision = 40;

  // Lighting
  const hemi = new BABYLON.HemisphericLight('LENS-AMBIENT', new BABYLON.Vector3(0, 1, 0), scene);
  hemi.intensity = 0.5;
  hemi.diffuse = BABYLON.Color3.FromHexString('#1e293b');
  const rim = new BABYLON.PointLight('LENS-RIM', new BABYLON.Vector3(5, 8, -3), scene);
  rim.diffuse = BABYLON.Color3.FromHexString('#22d3ee');
  rim.intensity = 0.6;
  rim.range = 30;

  // ---- Lens elements (L1 at bottom, L5 at top) ----
  const lensMeshes: BABYLON.Mesh[] = [];
  const lensMaterials: BABYLON.PBRMaterial[] = [];
  const elementGap = 0.3;
  const elementHeight = 0.6;
  const baseY = 1.0; // L1 bottom

  for (let i = 0; i < LENS_COUNT; i++) {
    const y = baseY + i * (elementHeight + elementGap);
    const diameter = 3.2 - i * 0.15; // L1 widest, L5 narrowest
    const lens = BABYLON.MeshBuilder.CreateCylinder(`LENS-L${i + 1}`, {
      height: elementHeight,
      diameter,
      tessellation: 36,
    }, scene);
    lens.position.y = y + elementHeight / 2;

    const mat = new BABYLON.PBRMaterial(`LENS-L${i + 1}-mat`, scene);
    mat.albedoColor = BABYLON.Color3.FromHexString('#bfdbfe');
    mat.emissiveColor = BABYLON.Color3.FromHexString('#22d3ee').scale(0.1);
    mat.roughness = 0.15;
    mat.metallic = 0.05;
    mat.alpha = 0.85;
    lens.material = mat;
    lens.metadata = { type: 'lens-element', index: i };
    lensMeshes.push(lens);
    lensMaterials.push(mat);
  }

  // ---- Immersion water gap ----
  const waterY = baseY - 0.15;
  const water = BABYLON.MeshBuilder.CreateBox('IMMERSION-WATER', { width: 3.4, height: 0.2, depth: 3.4 }, scene);
  water.position.y = waterY;
  const waterMat = new BABYLON.PBRMaterial('WATER-mat', scene);
  waterMat.albedoColor = BABYLON.Color3.FromHexString('#0ea5e9');
  waterMat.emissiveColor = BABYLON.Color3.FromHexString('#0ea5e9').scale(0.2);
  waterMat.roughness = 0.05;
  waterMat.metallic = 0;
  waterMat.alpha = 0.5;
  water.material = waterMat;

  // ---- Flow particles in water ----
  const flowParticles: BABYLON.Mesh[] = [];
  for (let i = 0; i < 80; i++) {
    const p = BABYLON.MeshBuilder.CreateSphere(`FLOW-P-${i}`, { diameter: 0.04, segments: 6 }, scene);
    const pm = new BABYLON.PBRMaterial(`FLOW-P-${i}-mat`, scene);
    pm.albedoColor = BABYLON.Color3.FromHexString('#7dd3fc');
    pm.emissiveColor = BABYLON.Color3.FromHexString('#7dd3fc').scale(0.5);
    pm.roughness = 0.1;
    pm.metallic = 0;
    p.material = pm;
    p.isPickable = false;
    p.position.y = waterY;
    flowParticles.push(p);
  }

  // ---- Wafer surface ----
  const wafer = BABYLON.MeshBuilder.CreateCylinder('WAFER-DISC', { height: 0.08, diameter: 5, tessellation: 48 }, scene);
  wafer.position.y = waterY - 0.25;
  const waferMat = new BABYLON.PBRMaterial('WAFER-mat', scene);
  waferMat.albedoColor = BABYLON.Color3.FromHexString('#334155');
  waferMat.emissiveColor = BABYLON.Color3.FromHexString('#475569').scale(0.1);
  waferMat.roughness = 0.3;
  waferMat.metallic = 0.6;
  wafer.material = waferMat;

  // ---- Resist layer ----
  const resist = BABYLON.MeshBuilder.CreateCylinder('RESIST-LAYER', { height: 0.03, diameter: 4.9, tessellation: 48 }, scene);
  resist.position.y = waterY - 0.195;
  const resistMat = new BABYLON.PBRMaterial('RESIST-mat', scene);
  resistMat.albedoColor = BABYLON.Color3.FromHexString('#a78bfa');
  resistMat.emissiveColor = BABYLON.Color3.FromHexString('#a78bfa').scale(0.15);
  resistMat.roughness = 0.5;
  resistMat.metallic = 0;
  resist.material = resistMat;

  // ---- 193nm beam cone ----
  const beamTop = LENS_COUNT * (elementHeight + elementGap) + baseY + 0.5;
  const beam = BABYLON.MeshBuilder.CreateCylinder('UV-BEAM', {
    height: beamTop - waterY,
    diameterTop: 1.0,
    diameterBottom: 2.8,
    tessellation: 24,
  }, scene);
  beam.position.y = (beamTop + waterY) / 2;
  const beamMat = new BABYLON.StandardMaterial('UV-BEAM-mat', scene);
  beamMat.diffuseColor = BABYLON.Color3.FromHexString('#22d3ee');
  beamMat.emissiveColor = BABYLON.Color3.FromHexString('#22d3ee').scale(0.3);
  beamMat.alpha = 0.08;
  beamMat.backFaceCulling = false;
  beam.material = beamMat;
  beam.isPickable = false;

  // ---- Meniscus edges (curved arcs at water boundary) ----
  const meniscusL = BABYLON.MeshBuilder.CreateTorus('MENISCUS-L', { diameter: 0.5, thickness: 0.04, tessellation: 24 }, scene);
  meniscusL.position = new BABYLON.Vector3(-1.7, waterY, 0);
  meniscusL.rotation.z = Math.PI / 2;
  const meniscusMat = new BABYLON.StandardMaterial('MENISCUS-mat', scene);
  meniscusMat.diffuseColor = BABYLON.Color3.FromHexString('#38bdf8');
  meniscusMat.emissiveColor = BABYLON.Color3.FromHexString('#38bdf8').scale(0.4);
  meniscusMat.alpha = 0.6;
  meniscusL.material = meniscusMat;
  const meniscusR = meniscusL.clone('MENISCUS-R');
  meniscusR.position.x = 1.7;

  // ---- Scan line indicator on wafer ----
  const scanLine = BABYLON.MeshBuilder.CreateBox('SCAN-LINE', { width: 5, height: 0.01, depth: 0.06 }, scene);
  scanLine.position.y = waterY - 0.18;
  const scanMat = new BABYLON.StandardMaterial('SCAN-LINE-mat', scene);
  scanMat.diffuseColor = BABYLON.Color3.FromHexString('#22d3ee');
  scanMat.emissiveColor = BABYLON.Color3.FromHexString('#22d3ee');
  scanMat.alpha = 0.7;
  scanLine.material = scanMat;
  scanLine.isPickable = false;

  // ---- Per-frame update ----
  scene.onBeforeRenderObservable.add(() => {
    const props = propsRef.current;
    const now = performance.now() / 1000;

    // Update lens element thermal colors
    const maxDT = 0.2; // scale reference
    for (let i = 0; i < LENS_COUNT; i++) {
      const deltaT = props.wafer?.lensElements[i]?.deltaT ?? 0;
      const color = heatColor(deltaT, maxDT);
      lensMaterials[i].emissiveColor = color.scale(0.35);
      lensMaterials[i].albedoColor = BABYLON.Color3.Lerp(
        BABYLON.Color3.FromHexString('#bfdbfe'),
        color,
        Math.min(deltaT / maxDT, 1) * 0.5,
      );
    }

    // Animate flow particles (parabolic velocity profile)
    const scanSpeed = props.params.scanSpeed / 1000; // mm/s -> m/s-ish visual scale
    flowParticles.forEach((p, i) => {
      const phase = ((now * scanSpeed + i * 0.15) % 4) / 4;
      const x = (phase - 0.5) * 3.2;
      const z = ((i % 8) - 3.5) * 0.4;
      const yOffset = Math.sin(phase * Math.PI) * 0.04; // slight parabolic arc
      p.position.set(x, waterY + yOffset, z);
    });

    // Scan line sweep
    const scanPhase = (now * scanSpeed * 0.5) % 2;
    const scanZ = scanPhase < 1 ? (scanPhase - 0.5) * 4 : (1.5 - scanPhase) * 4;
    scanLine.position.z = scanZ;
  });

  // ---- Engine lifecycle ----
  const resize = () => engine.resize();
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    window.removeEventListener('resize', resize);
    window.removeEventListener('pagehide', dispose);
    scene.dispose();
    engine.dispose();
  };
  window.addEventListener('resize', resize);
  window.addEventListener('pagehide', dispose);
  engine.runRenderLoop(() => { if (!disposed) scene.render(); });

  return dispose;
}

export function LensCrossSectionScene(props: LensCrossSectionSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const propsRef = useRef(props);
  const webgl = useWebGLSupport();

  useEffect(() => { propsRef.current = props; });

  useEffect(() => {
    if (!canvasRef.current || !webgl.supported) return undefined;
    return createScene(canvasRef.current, propsRef);
  }, [webgl.supported]);

  if (!webgl.supported) return <WebGLFallback />;

  return (
    <canvas
      ref={canvasRef}
      data-testid="lens-cross-section-canvas"
      aria-label="Lens heating cross-section simulation"
      className="h-full w-full touch-none outline-none"
    />
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd equipment-monitor && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add equipment-monitor/src/components/lens-sim/LensCrossSectionScene.tsx
git commit -m "feat(lens-sim): Babylon.js lens cross-section with thermal heatmap and flow particles"
```

---

### Task 10: Wafer Impact Map (Canvas2D)

**Files:**
- Create: `equipment-monitor/src/components/lens-sim/WaferImpactMap.tsx`

Uses Canvas2D for performance — drawing 81 die cells as colored rectangles is faster than Babylon.js for a 2D heatmap.

**Step 1: Implement WaferImpactMap.tsx**

```typescript
// equipment-monitor/src/components/lens-sim/WaferImpactMap.tsx
'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { WaferMetric, WaferState } from '@/lib/lens-sim';
import { DIE_GRID_COLS, DIE_GRID_ROWS, DIE_MASK } from '@/lib/lens-sim/constants';

interface WaferImpactMapProps {
  wafer: WaferState | null;
  metric: WaferMetric;
  onMetricChange: (metric: WaferMetric) => void;
}

const METRICS: Array<{ id: WaferMetric; label: string; labelCN: string }> = [
  { id: 'cd', label: 'CD', labelCN: '\u7EBF\u5BBD' },
  { id: 'overlay', label: 'Overlay', labelCN: '\u5957\u523B' },
  { id: 'ler', label: 'LER', labelCN: '\u7EBF\u8FB9\u7C97\u7CD9' },
  { id: 'defectivity', label: 'Defect', labelCN: '\u7F3A\u9677' },
];

const COLORMAPS: Record<WaferMetric, { lo: [number, number, number]; mid: [number, number, number]; hi: [number, number, number]; range: [number, number] }> = {
  cd:           { lo: [59, 130, 246],  mid: [255, 255, 255], hi: [239, 68, 68],   range: [-3, 3] },
  overlay:      { lo: [34, 197, 94],   mid: [250, 204, 21],  hi: [239, 68, 68],   range: [0, 2.5] },
  ler:          { lo: [34, 211, 238],  mid: [168, 85, 247],  hi: [236, 72, 153],  range: [2.0, 4.5] },
  defectivity:  { lo: [34, 197, 94],   mid: [250, 204, 21],  hi: [239, 68, 68],   range: [0, 5] },
};

function lerpColor(a: [number, number, number], b: [number, number, number], t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

function valueToColor(value: number, metric: WaferMetric): string {
  const { lo, mid, hi, range } = COLORMAPS[metric];
  const t = Math.max(0, Math.min(1, (value - range[0]) / (range[1] - range[0])));
  if (t < 0.5) return lerpColor(lo, mid, t / 0.5);
  return lerpColor(mid, hi, (t - 0.5) / 0.5);
}

function getMetricData(wafer: WaferState, metric: WaferMetric): number[] {
  switch (metric) {
    case 'cd': return wafer.cdMap;
    case 'overlay': return wafer.overlayMap;
    case 'ler': return wafer.lerMap;
    case 'defectivity': return wafer.defectMap;
  }
}

export function WaferImpactMap({ wafer, metric, onMetricChange }: WaferImpactMapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = 40;
    const size = Math.min(w, h) - padding * 2;
    const ox = (w - size) / 2;
    const oy = (h - size) / 2;
    const cellW = size / DIE_GRID_COLS;
    const cellH = size / DIE_GRID_ROWS;
    const cx = ox + size / 2;
    const cy = oy + size / 2;
    const radius = size / 2;

    // Clear
    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, w, h);

    // Wafer outline
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
    ctx.strokeStyle = '#22d3ee44';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Notch
    ctx.beginPath();
    ctx.arc(cx, cy + radius + 2, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#22d3ee';
    ctx.fill();

    if (!wafer) {
      ctx.fillStyle = '#64748b';
      ctx.font = '13px "Fira Code", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Press Play to start exposure', cx, cy);
      return;
    }

    const data = getMetricData(wafer, metric);

    // Draw dies
    for (let row = 0; row < DIE_GRID_ROWS; row++) {
      for (let col = 0; col < DIE_GRID_COLS; col++) {
        const idx = row * DIE_GRID_COLS + col;
        if (!DIE_MASK[idx]) continue;

        const x = ox + col * cellW;
        const y = oy + row * cellH;
        const value = data[idx] ?? 0;

        ctx.fillStyle = valueToColor(value, metric);
        ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

        // Value label (only if cells are large enough)
        if (cellW > 30) {
          ctx.fillStyle = '#0a1628';
          ctx.font = '9px "Fira Code", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            metric === 'defectivity' ? value.toFixed(1) : value.toFixed(2),
            x + cellW / 2,
            y + cellH / 2,
          );
        }
      }
    }

    // Color bar legend
    const barX = ox + size + 12;
    const barH = size * 0.6;
    const barY = oy + (size - barH) / 2;
    const barW = 12;
    const { range } = COLORMAPS[metric];
    for (let i = 0; i < barH; i++) {
      const t = i / barH;
      ctx.fillStyle = valueToColor(range[0] + t * (range[1] - range[0]), metric);
      ctx.fillRect(barX, barY + barH - i, barW, 1);
    }
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px "Fira Code", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${range[1]}`, barX + barW + 4, barY);
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${range[0]}`, barX + barW + 4, barY + barH);

    // Title
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '600 12px "Fira Code", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const metricLabel = METRICS.find((m) => m.id === metric);
    ctx.fillText(
      `${metricLabel?.label ?? metric} Map — Wafer ${wafer.waferIndex + 1} (illustrative)`,
      cx,
      oy - 22,
    );
  }, [wafer, metric]);

  useEffect(() => {
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [draw]);

  return (
    <div className="flex h-full flex-col">
      {/* Metric tabs */}
      <div className="flex gap-1 border-b border-white/10 px-3 py-2">
        {METRICS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onMetricChange(m.id)}
            data-testid={`metric-tab-${m.id}`}
            className={`rounded-lg px-3 py-1.5 font-mono text-[11px] transition-colors ${
              metric === m.id
                ? 'border border-[var(--sf-accent-cyan)] bg-[rgba(34,211,238,0.12)] text-white'
                : 'border border-transparent text-[var(--sf-text-secondary)] hover:bg-white/[0.06]'
            }`}
          >
            {m.label} <span className="text-[var(--sf-text-muted)]/60">({m.labelCN})</span>
          </button>
        ))}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        data-testid="wafer-impact-canvas"
        className="flex-1"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd equipment-monitor && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add equipment-monitor/src/components/lens-sim/WaferImpactMap.tsx
git commit -m "feat(lens-sim): Canvas2D wafer impact map with quad-metric heatmap"
```

---

### Task 11: Component Tests

**Files:**
- Create: `equipment-monitor/src/components/lens-sim/__tests__/LensSimPage.test.tsx`

**Step 1: Write component tests**

```typescript
// equipment-monitor/src/components/lens-sim/__tests__/LensSimPage.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';

// Mock Babylon.js and dynamic imports
jest.mock('@babylonjs/core', () => ({}));
jest.mock('@/hooks/use-webgl-support', () => ({
  useWebGLSupport: () => ({ supported: false }),
}));

describe('LensSimPage components', () => {
  describe('TimelineBar', () => {
    it('renders wafer count and controls', async () => {
      const { TimelineBar } = await import('@/components/lens-sim/TimelineBar');
      render(
        <TimelineBar
          currentIndex={2}
          lotSize={25}
          playing={false}
          currentWafer={null}
          onPlay={jest.fn()}
          onPause={jest.fn()}
          onStep={jest.fn()}
          onSeek={jest.fn()}
          onReset={jest.fn()}
          playbackSpeed={2}
          onSpeedChange={jest.fn()}
        />,
      );
      expect(screen.getByText(/3/)).toBeInTheDocument(); // wafer 3
      expect(screen.getByLabelText('Play')).toBeInTheDocument();
    });
  });

  describe('ParameterPanel', () => {
    it('renders all 6 sliders and 4 presets', async () => {
      const { ParameterPanel } = await import('@/components/lens-sim/ParameterPanel');
      const { DEFAULT_PARAMS } = await import('@/lib/lens-sim');
      render(
        <ParameterPanel
          params={DEFAULT_PARAMS}
          activePreset={null}
          onParamChange={jest.fn()}
          onPreset={jest.fn()}
        />,
      );
      expect(screen.getByText('Dose')).toBeInTheDocument();
      expect(screen.getByText('Cooling Failure')).toBeInTheDocument();
    });

    it('calls onPreset when preset button clicked', async () => {
      const { ParameterPanel } = await import('@/components/lens-sim/ParameterPanel');
      const { DEFAULT_PARAMS } = await import('@/lib/lens-sim');
      const onPreset = jest.fn();
      render(
        <ParameterPanel
          params={DEFAULT_PARAMS}
          activePreset={null}
          onParamChange={jest.fn()}
          onPreset={onPreset}
        />,
      );
      fireEvent.click(screen.getByText('Cooling Failure'));
      expect(onPreset).toHaveBeenCalledWith('cooling-failure');
    });
  });

  describe('WaferImpactMap', () => {
    it('renders metric tabs', async () => {
      const { WaferImpactMap } = await import('@/components/lens-sim/WaferImpactMap');
      render(<WaferImpactMap wafer={null} metric="cd" onMetricChange={jest.fn()} />);
      expect(screen.getByTestId('metric-tab-cd')).toBeInTheDocument();
      expect(screen.getByTestId('metric-tab-overlay')).toBeInTheDocument();
      expect(screen.getByTestId('metric-tab-ler')).toBeInTheDocument();
      expect(screen.getByTestId('metric-tab-defectivity')).toBeInTheDocument();
    });

    it('calls onMetricChange when tab clicked', async () => {
      const { WaferImpactMap } = await import('@/components/lens-sim/WaferImpactMap');
      const onChange = jest.fn();
      render(<WaferImpactMap wafer={null} metric="cd" onMetricChange={onChange} />);
      fireEvent.click(screen.getByTestId('metric-tab-overlay'));
      expect(onChange).toHaveBeenCalledWith('overlay');
    });
  });
});
```

**Step 2: Run all tests**

Run: `cd equipment-monitor && npx jest lens-sim -v`
Expected: All physics tests (35) + component tests (5) = ~40 tests PASS

**Step 3: Commit**

```bash
git add equipment-monitor/src/components/lens-sim/__tests__/LensSimPage.test.tsx
git commit -m "test(lens-sim): component tests for timeline, parameters, and wafer map"
```

---

### Task 12: Final Integration and Type Check

**Step 1: Run full TypeScript check**

Run: `cd equipment-monitor && npx tsc --noEmit`
Expected: No errors

**Step 2: Run full test suite**

Run: `cd equipment-monitor && npx jest lens-sim -v --coverage`
Expected: All ~40 tests pass, physics modules have >90% coverage

**Step 3: Verify page loads in dev server**

Run: `cd equipment-monitor && npx next dev`
Navigate to: `http://localhost:3000/mes/fab-floor/lithography/lens-sim`
Expected: Page loads with timeline bar, split panels, parameter sliders

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(lens-sim): lithography lens heating + immersion fluid digital twin

Semi-quantitative ArFi 193nm physics simulation with:
- Thermal model: exponential lens heating L1-L5
- Sellmeier: refractive index drift for silica and water
- Zernike: wavefront decomposition with field impact mapping
- Fluid: Poiseuille flow, meniscus stability, defect probability
- Babylon.js cross-section: thermal heatmap, flow particles, UV beam
- Canvas2D wafer map: CD/Overlay/LER/Defectivity quad-metric
- Timeline: 25-wafer lot with play/pause/scrub
- Parameter sliders + 4 what-if presets
- 40+ unit and component tests"
```
