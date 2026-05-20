# ICP Etching Digital Twin (etch-sim) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build ICP etching digital twin with plasma/sheath/etch-profile physics engine, Babylon.js ICP chamber visualization, wafer metrics display, and back button retrofit for all 4 sims.

**Architecture:** Pure TS physics engine at `src/lib/etch-sim/`, React UI at `src/components/etch-sim/`, page route at `src/app/mes/fab-floor/etching/etch-sim/page.tsx`. Same immutable state-machine pattern as damascene-sim. Material removal (inverse of deposition) — profile starts full (1) and decreases to 0.

**Tech Stack:** TypeScript, Next.js 15, React 19, Babylon.js 9.6, Canvas 2D, Jest

**Design doc:** `docs/plans/2026-05-20-etch-sim-design.md`

---

## Phase 1: Physics Library (TDD)

### Task 1: Types and Constants

**Files:**
- Create: `src/lib/etch-sim/types.ts`
- Create: `src/lib/etch-sim/constants.ts`

**Step 1: Create types.ts**

```typescript
// src/lib/etch-sim/types.ts

export type ProcessPhase = 'strike' | 'main-etch' | 'over-etch';

export interface SimulationParams {
  icpPower: number;        // W (200-2000, default 800)
  biasPower: number;       // W (0-500, default 100)
  chamberPressure: number; // mTorr (1-100, default 15)
  cf4Flow: number;         // sccm (10-200, default 80)
  o2Flow: number;          // sccm (0-100, default 20)
  chuckTemp: number;       // °C (10-80, default 40)
  trenchWidth: number;     // nm (20-500, default 100)
  aspectRatio: number;     // 1-20, default 5
  totalSteps: number;      // 200 default
}

export interface StepState {
  stepIndex: number;
  phase: ProcessPhase;
  timeSeconds: number;
  electronDensity: number;     // cm⁻³
  ionFlux: number;             // cm⁻²s⁻¹
  ionEnergy: number;           // eV
  sheathPotential: number;     // V
  etchProfile: number[];       // 20-point (1=material, 0=removed)
  etchDepth: number;           // nm
  etchRate: number;            // nm/min
  selectivity: number;         // ratio
  cdBias: number;              // nm
  profileAngle: number;        // degrees
  etchRateMap: number[];       // per-die
  uniformityMap: number[];     // per-die
  cdBiasMap: number[];         // per-die
  roughnessMap: number[];      // per-die
  uniformity: number;          // % 1-sigma/mean
  dieCount: number;
  dieGridCols: number;
  dieGridRows: number;
}

export interface SimulationState {
  params: SimulationParams;
  steps: StepState[];
  currentIndex: number;   // -1 = not started
  totalSteps: number;
}

export type WaferMetric = 'etchRate' | 'selectivity' | 'cdBias' | 'profileAngle';

export type PresetId =
  | 'plasma-nonuniformity'
  | 'ion-bombardment'
  | 'micro-loading'
  | 'polymer-buildup'
  | 'selectivity-loss'
  | 'endpoint-drift';

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
// src/lib/etch-sim/constants.ts
import type { SimulationParams } from './types';

// ---- Phase boundaries (out of 200 total steps) ----
export const STRIKE_END = 40;           // steps 0-39
export const MAIN_ETCH_END = 160;       // steps 40-159
export const DEFAULT_TOTAL_STEPS = 200;

// ---- Plasma Constants ----
export const IONIZATION_EFFICIENCY = 1e15;  // cm⁻³ per W/(mTorr·cm³)
export const CHAMBER_VOLUME = 5000;         // cm³
export const ELECTRON_TEMP_EV = 3.0;        // eV (typical ICP Te)
export const CF4_ION_MASS_KG = 69 * 1.66e-27; // kg (CF3+ dominant ion)
export const ELECTRON_CHARGE = 1.602e-19;   // C
export const BOLTZMANN_J = 1.381e-23;       // J/K

// ---- Sheath Constants ----
export const ION_THERMAL_EV = 0.03;         // room-temp ions

// ---- Etch Profile ----
export const ETCH_PROFILE_POINTS = 20;

// ---- Thermal Constants ----
export const ETCH_ACTIVATION_ENERGY = 0.3;  // eV
export const KB_EV = 8.617e-5;              // Boltzmann in eV/K
export const ETCH_REF_TEMP = 40;            // °C
export const BASE_SELECTIVITY = 15;         // at reference conditions
export const BASE_ROUGHNESS = 0.5;          // nm RMS

// ---- Die Grid (same 9x9 as other sims) ----
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
  icpPower:        { min: 200,  max: 2000, default: 800,  step: 50,  unit: 'W' },
  biasPower:       { min: 0,    max: 500,  default: 100,  step: 10,  unit: 'W' },
  chamberPressure: { min: 1,    max: 100,  default: 15,   step: 1,   unit: 'mTorr' },
  cf4Flow:         { min: 10,   max: 200,  default: 80,   step: 5,   unit: 'sccm' },
  o2Flow:          { min: 0,    max: 100,  default: 20,   step: 5,   unit: 'sccm' },
  chuckTemp:       { min: 10,   max: 80,   default: 40,   step: 1,   unit: '\u00B0C' },
  trenchWidth:     { min: 20,   max: 500,  default: 100,  step: 10,  unit: 'nm' },
  aspectRatio:     { min: 1,    max: 20,   default: 5,    step: 1,   unit: '' },
  totalSteps:      { min: 50,   max: 400,  default: 200,  step: 10,  unit: 'steps' },
} as const;

export const DEFAULT_PARAMS: SimulationParams = {
  icpPower:        PARAM_BOUNDS.icpPower.default,
  biasPower:       PARAM_BOUNDS.biasPower.default,
  chamberPressure: PARAM_BOUNDS.chamberPressure.default,
  cf4Flow:         PARAM_BOUNDS.cf4Flow.default,
  o2Flow:          PARAM_BOUNDS.o2Flow.default,
  chuckTemp:       PARAM_BOUNDS.chuckTemp.default,
  trenchWidth:     PARAM_BOUNDS.trenchWidth.default,
  aspectRatio:     PARAM_BOUNDS.aspectRatio.default,
  totalSteps:      PARAM_BOUNDS.totalSteps.default,
};
```

**Step 3: Commit**

```bash
git add src/lib/etch-sim/types.ts src/lib/etch-sim/constants.ts
git commit -m "feat(etch-sim): types and constants for ICP etching simulation"
```

---

### Task 2: Plasma Model (TDD)

**Files:**
- Create: `src/lib/etch-sim/__tests__/plasma-model.test.ts`
- Create: `src/lib/etch-sim/plasma-model.ts`

**Step 1: Write the failing tests**

```typescript
// src/lib/etch-sim/__tests__/plasma-model.test.ts
import { computePlasmaState, computeIonFluxMap } from '../plasma-model';
import { DEFAULT_PARAMS, ACTIVE_DIE_COUNT, DIE_MASK } from '../constants';
import type { SimulationParams } from '../types';

describe('plasma-model', () => {
  it('electron density scales with ICP power', () => {
    const low = computePlasmaState({ ...DEFAULT_PARAMS, icpPower: 400 });
    const high = computePlasmaState({ ...DEFAULT_PARAMS, icpPower: 1600 });
    expect(high.electronDensity).toBeGreaterThan(low.electronDensity * 1.5);
    expect(high.electronDensity).toBeGreaterThan(0);
  });

  it('ion flux is positive at nominal params', () => {
    const state = computePlasmaState(DEFAULT_PARAMS);
    expect(state.ionFlux).toBeGreaterThan(0);
  });

  it('gas ratio is CF4/(CF4+O2) and in 0-1 range', () => {
    const state = computePlasmaState(DEFAULT_PARAMS);
    expect(state.gasRatio).toBeCloseTo(80 / (80 + 20));
    expect(state.gasRatio).toBeGreaterThanOrEqual(0);
    expect(state.gasRatio).toBeLessThanOrEqual(1);
  });

  it('ion flux map is center-peaked (center > edge)', () => {
    const map = computeIonFluxMap(DEFAULT_PARAMS);
    const center = map[40]; // center die index (row 4, col 4)
    // Find an active edge die
    const edgeDie = map[3]; // row 0, col 3 (top-center edge)
    expect(center).toBeGreaterThan(edgeDie);
    expect(map.filter((_, i) => DIE_MASK[i] && map[i] > 0).length).toBe(ACTIVE_DIE_COUNT);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd equipment-monitor && npx jest src/lib/etch-sim/__tests__/plasma-model.test.ts --no-coverage
```

Expected: FAIL — module not found

**Step 3: Write the implementation**

```typescript
// src/lib/etch-sim/plasma-model.ts
import type { SimulationParams } from './types';
import {
  IONIZATION_EFFICIENCY, CHAMBER_VOLUME, ELECTRON_TEMP_EV,
  CF4_ION_MASS_KG, ELECTRON_CHARGE,
  DIE_MASK, DIE_GRID_COLS, DIE_GRID_ROWS,
} from './constants';

export interface PlasmaState {
  electronDensity: number;  // cm⁻³
  ionFlux: number;          // cm⁻²s⁻¹
  gasRatio: number;         // CF4/(CF4+O2), 0-1
}

export function computePlasmaState(params: SimulationParams): PlasmaState {
  // n_e = k × P_ICP / (pressure × volume)
  const electronDensity = IONIZATION_EFFICIENCY * params.icpPower
    / (params.chamberPressure * CHAMBER_VOLUME);

  // Bohm velocity: v_B = sqrt(kTe / mi)
  const Te_J = ELECTRON_TEMP_EV * ELECTRON_CHARGE;
  const vBohm = Math.sqrt(Te_J / CF4_ION_MASS_KG);

  // Ion flux: Γ_i = n_e × v_Bohm
  const ionFlux = electronDensity * vBohm;

  // Gas chemistry ratio
  const totalFlow = params.cf4Flow + params.o2Flow;
  const gasRatio = totalFlow > 0 ? params.cf4Flow / totalFlow : 0.5;

  return { electronDensity, ionFlux, gasRatio };
}

export function computeIonFluxMap(params: SimulationParams): number[] {
  const { ionFlux } = computePlasmaState(params);
  const totalDies = DIE_GRID_COLS * DIE_GRID_ROWS;
  const centerCol = (DIE_GRID_COLS - 1) / 2;
  const centerRow = (DIE_GRID_ROWS - 1) / 2;
  const maxR = Math.sqrt(centerCol ** 2 + centerRow ** 2);

  const map = new Array(totalDies).fill(0);
  for (let i = 0; i < totalDies; i++) {
    if (!DIE_MASK[i]) continue;
    const col = i % DIE_GRID_COLS;
    const row = Math.floor(i / DIE_GRID_COLS);
    const r = Math.sqrt((col - centerCol) ** 2 + (row - centerRow) ** 2);
    const rNorm = r / maxR;
    // ICP center-peaked: edge gets ~10% less
    map[i] = ionFlux * (1 - 0.1 * rNorm);
  }
  return map;
}
```

**Step 4: Run tests to verify they pass**

```bash
cd equipment-monitor && npx jest src/lib/etch-sim/__tests__/plasma-model.test.ts --no-coverage
```

Expected: 4 tests PASS

**Step 5: Commit**

```bash
git add src/lib/etch-sim/plasma-model.ts src/lib/etch-sim/__tests__/plasma-model.test.ts
git commit -m "feat(etch-sim): plasma model — electron density, ion flux, center-peaked map"
```

---

### Task 3: Sheath Model (TDD)

**Files:**
- Create: `src/lib/etch-sim/__tests__/sheath-model.test.ts`
- Create: `src/lib/etch-sim/sheath-model.ts`

**Step 1: Write the failing tests**

```typescript
// src/lib/etch-sim/__tests__/sheath-model.test.ts
import { computeSheathState } from '../sheath-model';
import { DEFAULT_PARAMS } from '../constants';

describe('sheath-model', () => {
  it('sheath potential scales with bias power', () => {
    const low = computeSheathState({ ...DEFAULT_PARAMS, biasPower: 50 });
    const high = computeSheathState({ ...DEFAULT_PARAMS, biasPower: 300 });
    expect(high.sheathPotential).toBeGreaterThan(low.sheathPotential);
  });

  it('ion energy is positive and in reasonable eV range', () => {
    const state = computeSheathState(DEFAULT_PARAMS);
    expect(state.ionEnergy).toBeGreaterThan(10);
    expect(state.ionEnergy).toBeLessThan(5000);
  });

  it('ion angle decreases with higher bias (narrower spread)', () => {
    const lowBias = computeSheathState({ ...DEFAULT_PARAMS, biasPower: 50 });
    const highBias = computeSheathState({ ...DEFAULT_PARAMS, biasPower: 400 });
    expect(highBias.ionAngle).toBeLessThan(lowBias.ionAngle);
  });

  it('low bias yields low ion energy', () => {
    const state = computeSheathState({ ...DEFAULT_PARAMS, biasPower: 10 });
    expect(state.ionEnergy).toBeLessThan(100);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd equipment-monitor && npx jest src/lib/etch-sim/__tests__/sheath-model.test.ts --no-coverage
```

**Step 3: Write the implementation**

```typescript
// src/lib/etch-sim/sheath-model.ts
import type { SimulationParams } from './types';
import { ION_THERMAL_EV } from './constants';

export interface SheathState {
  sheathPotential: number;  // V
  ionEnergy: number;        // eV
  ionAngle: number;         // degrees (half-angle)
}

export function computeSheathState(params: SimulationParams): SheathState {
  // V_sh ≈ V_bias × (1 + P_ICP/P_bias × 0.1)
  const pRatio = params.biasPower > 0 ? params.icpPower / params.biasPower : 0;
  const sheathPotential = params.biasPower * (1 + pRatio * 0.1);

  // E_ion = q × V_sh (in eV since V in volts)
  const ionEnergy = sheathPotential;

  // θ = arctan(sqrt(T_i / E_ion))
  const ratio = ionEnergy > 0 ? ION_THERMAL_EV / ionEnergy : 1;
  const ionAngle = Math.atan(Math.sqrt(ratio)) * (180 / Math.PI);

  return { sheathPotential, ionEnergy, ionAngle };
}
```

**Step 4: Run tests to verify they pass**

```bash
cd equipment-monitor && npx jest src/lib/etch-sim/__tests__/sheath-model.test.ts --no-coverage
```

Expected: 4 tests PASS

**Step 5: Commit**

```bash
git add src/lib/etch-sim/sheath-model.ts src/lib/etch-sim/__tests__/sheath-model.test.ts
git commit -m "feat(etch-sim): sheath model — potential, ion energy, angular distribution"
```

---

### Task 4: Etch Profile (TDD)

**Files:**
- Create: `src/lib/etch-sim/__tests__/etch-profile.test.ts`
- Create: `src/lib/etch-sim/etch-profile.ts`

**Step 1: Write the failing tests**

```typescript
// src/lib/etch-sim/__tests__/etch-profile.test.ts
import { computeEtchProfile } from '../etch-profile';
import { ETCH_PROFILE_POINTS, DEFAULT_PARAMS } from '../constants';

describe('etch-profile', () => {
  const fullProfile = new Array(ETCH_PROFILE_POINTS).fill(1);

  it('anisotropic regime (gasRatio > 0.6) yields high profile angle', () => {
    const result = computeEtchProfile(fullProfile, 0.8, 1.0, 200, 250, 0.5, DEFAULT_PARAMS);
    expect(result.profileAngle).toBeGreaterThan(87);
  });

  it('isotropic regime (gasRatio < 0.3) is flagged', () => {
    const result = computeEtchProfile(fullProfile, 0.2, 5.0, 50, 200, 0.5, DEFAULT_PARAMS);
    expect(result.isIsotropic).toBe(true);
  });

  it('etch depth increases with multiple steps', () => {
    let profile = [...fullProfile];
    let prevDepth = 0;
    for (let i = 0; i < 10; i++) {
      const result = computeEtchProfile(profile, 0.7, 1.0, 200, 250, 0.5, DEFAULT_PARAMS);
      expect(result.etchDepth).toBeGreaterThanOrEqual(prevDepth);
      prevDepth = result.etchDepth;
      profile = result.profile;
    }
  });

  it('micro-loading: narrow trench etches slower', () => {
    const wide = computeEtchProfile(fullProfile, 0.7, 1.0, 200, 250, 0.5,
      { ...DEFAULT_PARAMS, trenchWidth: 400 });
    const narrow = computeEtchProfile(fullProfile, 0.7, 1.0, 200, 250, 0.5,
      { ...DEFAULT_PARAMS, trenchWidth: 50 });
    expect(narrow.etchDepth).toBeLessThanOrEqual(wide.etchDepth);
  });

  it('profile values stay in 0-1 range', () => {
    const result = computeEtchProfile(fullProfile, 0.7, 1.0, 200, 250, 0.5, DEFAULT_PARAMS);
    result.profile.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd equipment-monitor && npx jest src/lib/etch-sim/__tests__/etch-profile.test.ts --no-coverage
```

**Step 3: Write the implementation**

```typescript
// src/lib/etch-sim/etch-profile.ts
import type { SimulationParams } from './types';
import { ETCH_PROFILE_POINTS } from './constants';

export interface EtchProfileResult {
  profile: number[];       // 20-point (1=material, 0=removed)
  etchDepth: number;       // nm
  profileAngle: number;    // degrees (sidewall verticality)
  isIsotropic: boolean;
}

export function computeEtchProfile(
  prevProfile: number[],
  gasRatio: number,
  ionAngle: number,
  ionEnergy: number,
  etchRateNmMin: number,
  dt: number,
  params: SimulationParams,
): EtchProfileResult {
  const profile = [...prevProfile];
  const n = ETCH_PROFILE_POINTS;
  const center = (n - 1) / 2;

  // Regime from CF4 fraction
  const isAnisotropic = gasRatio > 0.6;
  const isIsotropic = gasRatio < 0.3;

  // Profile angle: 90° ideal, reduced by lateral etch
  const passivationStrength = 1 - gasRatio; // O2 fraction → sidewall protection
  const profileAngle = Math.min(90, 90 - ionAngle + passivationStrength * 5);

  // Material removal per step
  const trenchDepth = params.trenchWidth * params.aspectRatio;
  const removalRate = (etchRateNmMin / 60) * dt / Math.max(trenchDepth / n, 1);
  const removal = Math.min(removalRate, 0.05);

  // Micro-loading: dense (narrow) features deplete reactants locally
  const microLoading = Math.min(1, Math.max(0.3, params.trenchWidth / 200));

  for (let i = 0; i < n; i++) {
    if (profile[i] <= 0) continue;
    const distFromCenter = Math.abs(i - center) / center;

    let localRemoval = removal * microLoading;
    if (isAnisotropic) {
      localRemoval *= (1 - distFromCenter * 0.3);
    } else if (isIsotropic) {
      localRemoval *= 1.0; // uniform including sidewalls
    } else {
      localRemoval *= (1 - distFromCenter * 0.6);
    }

    profile[i] = Math.max(0, profile[i] - localRemoval);
  }

  // Etch depth from average material removed
  const avgRemoved = 1 - profile.reduce((s, v) => s + v, 0) / n;
  const etchDepth = avgRemoved * trenchDepth;

  return { profile, etchDepth, profileAngle, isIsotropic };
}
```

**Step 4: Run tests to verify they pass**

```bash
cd equipment-monitor && npx jest src/lib/etch-sim/__tests__/etch-profile.test.ts --no-coverage
```

Expected: 5 tests PASS

**Step 5: Commit**

```bash
git add src/lib/etch-sim/etch-profile.ts src/lib/etch-sim/__tests__/etch-profile.test.ts
git commit -m "feat(etch-sim): etch profile — trench cross-section, 3 regimes, micro-loading"
```

---

### Task 5: Thermal Model (TDD)

**Files:**
- Create: `src/lib/etch-sim/__tests__/thermal-model.test.ts`
- Create: `src/lib/etch-sim/thermal-model.ts`

**Step 1: Write the failing tests**

```typescript
// src/lib/etch-sim/__tests__/thermal-model.test.ts
import { computeThermalEtchRate, computeSelectivity, computeRoughness } from '../thermal-model';
import { DEFAULT_PARAMS } from '../constants';

describe('thermal-model', () => {
  it('higher temperature yields higher etch rate (Arrhenius)', () => {
    const cold = computeThermalEtchRate(250, { ...DEFAULT_PARAMS, chuckTemp: 20 });
    const hot = computeThermalEtchRate(250, { ...DEFAULT_PARAMS, chuckTemp: 70 });
    expect(hot).toBeGreaterThan(cold);
  });

  it('higher temperature lowers selectivity', () => {
    const cold = computeSelectivity({ ...DEFAULT_PARAMS, chuckTemp: 20 }, 100);
    const hot = computeSelectivity({ ...DEFAULT_PARAMS, chuckTemp: 70 }, 100);
    expect(hot).toBeLessThan(cold);
  });

  it('higher ion energy increases roughness', () => {
    const low = computeRoughness(50, 40);
    const high = computeRoughness(500, 40);
    expect(high).toBeGreaterThan(low);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd equipment-monitor && npx jest src/lib/etch-sim/__tests__/thermal-model.test.ts --no-coverage
```

**Step 3: Write the implementation**

```typescript
// src/lib/etch-sim/thermal-model.ts
import type { SimulationParams } from './types';
import { ETCH_ACTIVATION_ENERGY, KB_EV, ETCH_REF_TEMP, BASE_SELECTIVITY, BASE_ROUGHNESS } from './constants';

export function computeThermalEtchRate(baseRate: number, params: SimulationParams): number {
  const T = params.chuckTemp + 273.15;
  const Tref = ETCH_REF_TEMP + 273.15;
  const factor = Math.exp(ETCH_ACTIVATION_ENERGY / KB_EV * (1 / Tref - 1 / T));
  return baseRate * factor;
}

export function computeSelectivity(params: SimulationParams, ionEnergy: number): number {
  const tempFactor = 1 - (params.chuckTemp - ETCH_REF_TEMP) * 0.02;
  const energyFactor = 1 - Math.max(0, (ionEnergy - 100) * 0.001);
  return BASE_SELECTIVITY * Math.max(0.3, tempFactor) * Math.max(0.3, energyFactor);
}

export function computeRoughness(ionEnergy: number, chuckTemp: number): number {
  const ionContribution = ionEnergy * 0.002;
  const tempContribution = Math.max(0, (chuckTemp - ETCH_REF_TEMP) * 0.01);
  return BASE_ROUGHNESS + ionContribution + tempContribution;
}
```

**Step 4: Run tests to verify they pass**

```bash
cd equipment-monitor && npx jest src/lib/etch-sim/__tests__/thermal-model.test.ts --no-coverage
```

Expected: 3 tests PASS

**Step 5: Commit**

```bash
git add src/lib/etch-sim/thermal-model.ts src/lib/etch-sim/__tests__/thermal-model.test.ts
git commit -m "feat(etch-sim): thermal model — Arrhenius etch rate, selectivity, roughness"
```

---

### Task 6: Wafer Metrics Orchestrator (TDD)

**Files:**
- Create: `src/lib/etch-sim/__tests__/wafer-metrics.test.ts`
- Create: `src/lib/etch-sim/wafer-metrics.ts`

**Step 1: Write the failing tests**

```typescript
// src/lib/etch-sim/__tests__/wafer-metrics.test.ts
import { computeStepMetrics } from '../wafer-metrics';
import { DEFAULT_PARAMS, ETCH_PROFILE_POINTS, ACTIVE_DIE_COUNT, DIE_MASK } from '../constants';

describe('wafer-metrics', () => {
  const fullProfile = new Array(ETCH_PROFILE_POINTS).fill(1);

  it('returns all 4 maps with valid values for active dies', () => {
    const m = computeStepMetrics(DEFAULT_PARAMS, 80, fullProfile);
    const activeDies = DIE_MASK.reduce((s, v) => s + v, 0);
    expect(m.etchRateMap.filter((_, i) => DIE_MASK[i] && m.etchRateMap[i] > 0).length).toBe(activeDies);
    expect(m.cdBiasMap.length).toBe(81);
    expect(m.roughnessMap.filter((_, i) => DIE_MASK[i] && m.roughnessMap[i] > 0).length).toBe(activeDies);
  });

  it('etch rate is in reasonable nm/min range at nominal', () => {
    const m = computeStepMetrics(DEFAULT_PARAMS, 80, fullProfile);
    expect(m.etchRate).toBeGreaterThan(50);
    expect(m.etchRate).toBeLessThan(1000);
  });

  it('uniformity is below 5% at nominal params', () => {
    const m = computeStepMetrics(DEFAULT_PARAMS, 80, fullProfile);
    expect(m.uniformity).toBeLessThan(5);
  });

  it('dieCount equals ACTIVE_DIE_COUNT', () => {
    const m = computeStepMetrics(DEFAULT_PARAMS, 80, fullProfile);
    expect(m.dieCount).toBe(ACTIVE_DIE_COUNT);
  });

  it('profile length is ETCH_PROFILE_POINTS', () => {
    const m = computeStepMetrics(DEFAULT_PARAMS, 80, fullProfile);
    expect(m.etchProfile.length).toBe(ETCH_PROFILE_POINTS);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd equipment-monitor && npx jest src/lib/etch-sim/__tests__/wafer-metrics.test.ts --no-coverage
```

**Step 3: Write the implementation**

```typescript
// src/lib/etch-sim/wafer-metrics.ts
import type { SimulationParams } from './types';
import {
  DIE_MASK, DIE_GRID_COLS, DIE_GRID_ROWS, ACTIVE_DIE_COUNT,
} from './constants';
import { computePlasmaState, computeIonFluxMap } from './plasma-model';
import { computeSheathState } from './sheath-model';
import { computeEtchProfile } from './etch-profile';
import { computeThermalEtchRate, computeSelectivity, computeRoughness } from './thermal-model';

export interface StepMetrics {
  electronDensity: number;
  ionFlux: number;
  ionEnergy: number;
  sheathPotential: number;
  etchProfile: number[];
  etchDepth: number;
  etchRate: number;
  selectivity: number;
  cdBias: number;
  profileAngle: number;
  etchRateMap: number[];
  uniformityMap: number[];
  cdBiasMap: number[];
  roughnessMap: number[];
  uniformity: number;
  dieCount: number;
  dieGridCols: number;
  dieGridRows: number;
}

export function computeStepMetrics(
  params: SimulationParams,
  stepIndex: number,
  prevProfile: number[],
): StepMetrics {
  const plasma = computePlasmaState(params);
  const sheath = computeSheathState(params);
  const ionFluxMap = computeIonFluxMap(params);

  // Base etch rate from ion flux × gas chemistry
  const baseEtchRate = plasma.ionFlux * 1e-13 * (0.5 + 0.5 * plasma.gasRatio);
  const etchRate = computeThermalEtchRate(baseEtchRate, params);

  const dt = 0.5;
  const profileResult = computeEtchProfile(
    prevProfile, plasma.gasRatio, sheath.ionAngle, sheath.ionEnergy,
    etchRate, dt, params,
  );

  const selectivity = computeSelectivity(params, sheath.ionEnergy);
  const cdBias = (90 - profileResult.profileAngle) * 0.5;

  // Per-die maps
  const totalDies = DIE_GRID_COLS * DIE_GRID_ROWS;
  const etchRateMap = new Array(totalDies).fill(0);
  const uniformityMap = new Array(totalDies).fill(0);
  const cdBiasMap = new Array(totalDies).fill(0);
  const roughnessMap = new Array(totalDies).fill(0);

  const centerCol = (DIE_GRID_COLS - 1) / 2;
  const centerRow = (DIE_GRID_ROWS - 1) / 2;
  const maxR = Math.sqrt(centerCol ** 2 + centerRow ** 2);

  for (let i = 0; i < totalDies; i++) {
    if (!DIE_MASK[i]) continue;
    const col = i % DIE_GRID_COLS;
    const row = Math.floor(i / DIE_GRID_COLS);
    const r = Math.sqrt((col - centerCol) ** 2 + (row - centerRow) ** 2);
    const rNorm = r / maxR;

    const localFluxRatio = plasma.ionFlux > 0 ? ionFluxMap[i] / plasma.ionFlux : 1;
    etchRateMap[i] = etchRate * localFluxRatio;
    uniformityMap[i] = etchRate * localFluxRatio;
    cdBiasMap[i] = cdBias * (1 + rNorm * 0.2);
    roughnessMap[i] = computeRoughness(sheath.ionEnergy, params.chuckTemp) * (1 + rNorm * 0.1);
  }

  // Uniformity: 1-sigma/mean of active dies
  const activeRates = etchRateMap.filter((_, i) => DIE_MASK[i]);
  const mean = activeRates.reduce((s, v) => s + v, 0) / activeRates.length;
  const variance = activeRates.reduce((s, v) => s + (v - mean) ** 2, 0) / activeRates.length;
  const uniformity = mean > 0 ? (Math.sqrt(variance) / mean) * 100 : 0;

  return {
    electronDensity: plasma.electronDensity,
    ionFlux: plasma.ionFlux,
    ionEnergy: sheath.ionEnergy,
    sheathPotential: sheath.sheathPotential,
    etchProfile: profileResult.profile,
    etchDepth: profileResult.etchDepth,
    etchRate,
    selectivity,
    cdBias,
    profileAngle: profileResult.profileAngle,
    etchRateMap,
    uniformityMap,
    cdBiasMap,
    roughnessMap,
    uniformity,
    dieCount: ACTIVE_DIE_COUNT,
    dieGridCols: DIE_GRID_COLS,
    dieGridRows: DIE_GRID_ROWS,
  };
}
```

**Step 4: Run tests to verify they pass**

```bash
cd equipment-monitor && npx jest src/lib/etch-sim/__tests__/wafer-metrics.test.ts --no-coverage
```

Expected: 5 tests PASS

**Step 5: Commit**

```bash
git add src/lib/etch-sim/wafer-metrics.ts src/lib/etch-sim/__tests__/wafer-metrics.test.ts
git commit -m "feat(etch-sim): wafer metrics orchestrator — 4 die-level maps"
```

---

### Task 7: Simulation Engine (TDD)

**Files:**
- Create: `src/lib/etch-sim/__tests__/simulation-engine.test.ts`
- Create: `src/lib/etch-sim/simulation-engine.ts`

**Step 1: Write the failing tests**

```typescript
// src/lib/etch-sim/__tests__/simulation-engine.test.ts
import { createSimulation, stepForward, stepN, applyPreset } from '../simulation-engine';
import { DEFAULT_PARAMS, STRIKE_END, MAIN_ETCH_END } from '../constants';

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
    expect(sim.steps[0].phase).toBe('strike');
  });

  it('phase transitions at step 40 (main-etch) and 160 (over-etch)', () => {
    let sim = createSimulation();
    sim = stepN(sim, STRIKE_END); // step 0-39
    expect(sim.steps[sim.currentIndex].phase).toBe('strike');

    sim = stepForward(sim); // step 40
    expect(sim.steps[sim.currentIndex].phase).toBe('main-etch');

    sim = stepN(sim, MAIN_ETCH_END - STRIKE_END - 1); // to step 159
    expect(sim.steps[sim.currentIndex].phase).toBe('main-etch');

    sim = stepForward(sim); // step 160
    expect(sim.steps[sim.currentIndex].phase).toBe('over-etch');
  });

  it('stepN advances N steps', () => {
    const sim = stepN(createSimulation(), 50);
    expect(sim.currentIndex).toBe(49);
    expect(sim.steps).toHaveLength(50);
  });

  it('applyPreset modifies params', () => {
    const sim = createSimulation();
    const modified = applyPreset(sim, 'plasma-nonuniformity');
    expect(modified.params.icpPower).toBeGreaterThan(sim.params.icpPower);
  });

  it('does not exceed totalSteps', () => {
    const sim = stepN(createSimulation(), 300);
    expect(sim.currentIndex).toBe(199);
    expect(sim.steps).toHaveLength(200);
    const same = stepForward(sim);
    expect(same).toBe(sim);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd equipment-monitor && npx jest src/lib/etch-sim/__tests__/simulation-engine.test.ts --no-coverage
```

**Step 3: Write the implementation**

```typescript
// src/lib/etch-sim/simulation-engine.ts
import type { SimulationParams, SimulationState, StepState, ProcessPhase } from './types';
import {
  DEFAULT_PARAMS, DEFAULT_TOTAL_STEPS, STRIKE_END, MAIN_ETCH_END,
  ETCH_PROFILE_POINTS, DIE_GRID_COLS, DIE_GRID_ROWS, ACTIVE_DIE_COUNT,
} from './constants';
import { computePlasmaState } from './plasma-model';
import { computeSheathState } from './sheath-model';
import { computeStepMetrics } from './wafer-metrics';
import { getPreset } from './presets';

function getPhase(stepIndex: number): ProcessPhase {
  if (stepIndex < STRIKE_END) return 'strike';
  if (stepIndex < MAIN_ETCH_END) return 'main-etch';
  return 'over-etch';
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
  const prevProfile = prev?.etchProfile ?? new Array(ETCH_PROFILE_POINTS).fill(1);
  const dt = 0.5;
  const totalDies = DIE_GRID_COLS * DIE_GRID_ROWS;

  let stepState: StepState;

  if (phase === 'strike') {
    // Plasma ignition: ramp up, no etching
    const progress = (nextIndex + 1) / STRIKE_END;
    const plasma = computePlasmaState(state.params);
    const sheath = computeSheathState(state.params);

    stepState = {
      stepIndex: nextIndex,
      phase,
      timeSeconds: nextIndex * dt,
      electronDensity: plasma.electronDensity * progress,
      ionFlux: plasma.ionFlux * progress * 0.1,
      ionEnergy: sheath.ionEnergy * progress,
      sheathPotential: sheath.sheathPotential * progress,
      etchProfile: prevProfile,
      etchDepth: 0,
      etchRate: 0,
      selectivity: 0,
      cdBias: 0,
      profileAngle: 90,
      etchRateMap: new Array(totalDies).fill(0),
      uniformityMap: new Array(totalDies).fill(0),
      cdBiasMap: new Array(totalDies).fill(0),
      roughnessMap: new Array(totalDies).fill(0),
      uniformity: 0,
      dieCount: ACTIVE_DIE_COUNT,
      dieGridCols: DIE_GRID_COLS,
      dieGridRows: DIE_GRID_ROWS,
    };
  } else {
    // Main Etch or Over-etch
    const metrics = computeStepMetrics(state.params, nextIndex, prevProfile);
    const overEtchFactor = phase === 'over-etch' ? 0.3 : 1;

    stepState = {
      stepIndex: nextIndex,
      phase,
      timeSeconds: nextIndex * dt,
      ...metrics,
      etchRate: metrics.etchRate * overEtchFactor,
      etchRateMap: metrics.etchRateMap.map((v) => v * overEtchFactor),
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

**Step 4: Run tests to verify they pass**

```bash
cd equipment-monitor && npx jest src/lib/etch-sim/__tests__/simulation-engine.test.ts --no-coverage
```

Expected: 6 tests PASS

**Step 5: Commit**

```bash
git add src/lib/etch-sim/simulation-engine.ts src/lib/etch-sim/__tests__/simulation-engine.test.ts
git commit -m "feat(etch-sim): simulation engine — 3-phase state machine, stepN, applyPreset"
```

---

### Task 8: Presets + Barrel Export (TDD)

**Files:**
- Create: `src/lib/etch-sim/__tests__/presets.test.ts`
- Create: `src/lib/etch-sim/presets.ts`
- Create: `src/lib/etch-sim/index.ts`

**Step 1: Write the failing tests**

```typescript
// src/lib/etch-sim/__tests__/presets.test.ts
import { PRESETS, getPreset } from '../presets';
import { DEFAULT_PARAMS } from '../constants';

describe('presets', () => {
  it('plasma-nonuniformity increases ICP power and decreases pressure', () => {
    const p = getPreset('plasma-nonuniformity')!;
    const result = p.apply(DEFAULT_PARAMS, 0);
    expect(result.icpPower).toBeGreaterThan(DEFAULT_PARAMS.icpPower);
    expect(result.chamberPressure).toBeLessThan(DEFAULT_PARAMS.chamberPressure);
  });

  it('ion-bombardment increases bias power', () => {
    const p = getPreset('ion-bombardment')!;
    const result = p.apply(DEFAULT_PARAMS, 0);
    expect(result.biasPower).toBeGreaterThan(DEFAULT_PARAMS.biasPower);
  });

  it('micro-loading decreases trench width and increases aspect ratio', () => {
    const p = getPreset('micro-loading')!;
    const result = p.apply(DEFAULT_PARAMS, 0);
    expect(result.trenchWidth).toBeLessThan(DEFAULT_PARAMS.trenchWidth);
    expect(result.aspectRatio).toBeGreaterThan(DEFAULT_PARAMS.aspectRatio);
  });

  it('polymer-buildup decreases O2 flow', () => {
    const p = getPreset('polymer-buildup')!;
    const result = p.apply(DEFAULT_PARAMS, 0);
    expect(result.o2Flow).toBeLessThan(DEFAULT_PARAMS.o2Flow);
  });

  it('selectivity-loss decreases pressure and increases chuck temp', () => {
    const p = getPreset('selectivity-loss')!;
    const result = p.apply(DEFAULT_PARAMS, 0);
    expect(result.chamberPressure).toBeLessThan(DEFAULT_PARAMS.chamberPressure);
    expect(result.chuckTemp).toBeGreaterThan(DEFAULT_PARAMS.chuckTemp);
  });

  it('endpoint-drift increases total steps and decreases bias', () => {
    const p = getPreset('endpoint-drift')!;
    const result = p.apply(DEFAULT_PARAMS, 0);
    expect(result.totalSteps).toBeGreaterThan(DEFAULT_PARAMS.totalSteps);
    expect(result.biasPower).toBeLessThan(DEFAULT_PARAMS.biasPower);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd equipment-monitor && npx jest src/lib/etch-sim/__tests__/presets.test.ts --no-coverage
```

**Step 3: Write presets.ts**

```typescript
// src/lib/etch-sim/presets.ts
import type { Preset } from './types';

export const PRESETS: Preset[] = [
  {
    id: 'plasma-nonuniformity',
    label: 'Plasma Non-uniformity',
    labelCN: '\u96FB\u6F3F\u4E0D\u5747\u52FB',
    color: '#ef4444',
    apply: (params) => ({
      ...params,
      icpPower: params.icpPower * 1.3,
      chamberPressure: params.chamberPressure * 0.6,
    }),
  },
  {
    id: 'ion-bombardment',
    label: 'Ion Bombardment Damage',
    labelCN: '\u96E2\u5B50\u8F5F\u64CA\u640D\u50B7',
    color: '#f97316',
    apply: (params) => ({
      ...params,
      biasPower: params.biasPower * 1.8,
    }),
  },
  {
    id: 'micro-loading',
    label: 'Micro-loading',
    labelCN: '\u5FAE\u8CA0\u8F09\u6548\u61C9',
    color: '#f59e0b',
    apply: (params) => ({
      ...params,
      trenchWidth: params.trenchWidth * 0.5,
      aspectRatio: params.aspectRatio * 1.6,
    }),
  },
  {
    id: 'polymer-buildup',
    label: 'Polymer Buildup',
    labelCN: '\u805A\u5408\u7269\u5806\u7A4D',
    color: '#8b5cf6',
    apply: (params) => ({
      ...params,
      o2Flow: params.o2Flow * 0.3,
      cf4Flow: params.cf4Flow * 1.2,
    }),
  },
  {
    id: 'selectivity-loss',
    label: 'Selectivity Loss',
    labelCN: '\u9078\u64C7\u6BD4\u55AA\u5931',
    color: '#ec4899',
    apply: (params) => ({
      ...params,
      chamberPressure: params.chamberPressure * 0.5,
      chuckTemp: params.chuckTemp + 25,
    }),
  },
  {
    id: 'endpoint-drift',
    label: 'Endpoint Drift',
    labelCN: '\u7D42\u9EDE\u6F02\u79FB',
    color: '#10b981',
    apply: (params) => ({
      ...params,
      totalSteps: params.totalSteps + 40,
      biasPower: params.biasPower * 0.7,
    }),
  },
];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
```

**Step 4: Create barrel export (index.ts)**

```typescript
// src/lib/etch-sim/index.ts
export { createSimulation, stepForward, stepN, applyPreset } from './simulation-engine';
export { PRESETS, getPreset } from './presets';
export { DEFAULT_PARAMS, PARAM_BOUNDS, DEFAULT_TOTAL_STEPS, STRIKE_END, MAIN_ETCH_END } from './constants';
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

**Step 5: Run tests to verify they pass**

```bash
cd equipment-monitor && npx jest src/lib/etch-sim/__tests__/presets.test.ts --no-coverage
```

Expected: 6 tests PASS

**Step 6: Commit**

```bash
git add src/lib/etch-sim/presets.ts src/lib/etch-sim/index.ts src/lib/etch-sim/__tests__/presets.test.ts
git commit -m "feat(etch-sim): 6 what-if presets + barrel export"
```

---

## Phase 2: Back Button Retrofit

### Task 9: Add backHref to all 4 TimelineBars + page.tsx files

**Files:**
- Modify: `src/components/lens-sim/TimelineBar.tsx`
- Modify: `src/components/dep-sim/TimelineBar.tsx`
- Modify: `src/components/damascene-sim/TimelineBar.tsx`
- Modify: `src/app/mes/fab-floor/lithography/lens-sim/page.tsx`
- Modify: `src/app/mes/fab-floor/deposition/reactor-sim/page.tsx`
- Modify: `src/app/mes/fab-floor/metallization/damascene-sim/page.tsx`

**Step 1: Retrofit lens-sim TimelineBar.tsx**

Add `import Link from 'next/link'` and `import { ChevronLeft } from 'lucide-react'`. Add `backHref?: string` to the props interface. Render the back button as the first element inside the outer div, before the transport controls div:

```tsx
{backHref && (
  <Link href={backHref} className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full hover:bg-white/10" aria-label="Back">
    <ChevronLeft className="h-4 w-4" />
  </Link>
)}
```

**Step 2: Retrofit dep-sim TimelineBar.tsx**

Same pattern: add `backHref?: string` prop. Add `import Link from 'next/link'` and `import { ChevronLeft }` (already imports from lucide-react). Render back button before the play/pause button group:

```tsx
{backHref && (
  <Link href={backHref} className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full hover:bg-white/10" aria-label="Back">
    <ChevronLeft className="h-4 w-4" />
  </Link>
)}
```

**Step 3: Retrofit damascene-sim TimelineBar.tsx**

Same pattern: add `backHref?: string` prop. Add `import Link from 'next/link'` and `ChevronLeft` to the lucide-react import. Render back button before play/pause.

**Step 4: Update lens-sim page.tsx**

Pass `backHref="/mes/fab-floor/lithography"` to `<TimelineBar>`.

**Step 5: Update dep-sim page.tsx**

Pass `backHref="/mes/fab-floor/deposition"` to `<TimelineBar>`.

**Step 6: Update damascene-sim page.tsx**

Pass `backHref="/mes/fab-floor/metallization"` to `<TimelineBar>`.

**Step 7: Commit**

```bash
git add src/components/lens-sim/TimelineBar.tsx src/components/dep-sim/TimelineBar.tsx src/components/damascene-sim/TimelineBar.tsx \
       src/app/mes/fab-floor/lithography/lens-sim/page.tsx src/app/mes/fab-floor/deposition/reactor-sim/page.tsx src/app/mes/fab-floor/metallization/damascene-sim/page.tsx
git commit -m "feat: add backHref prop to all 3 existing TimelineBars + page.tsx files"
```

---

## Phase 3: UI Components

### Task 10: Digital Twin Routes + Page + TimelineBar + ParameterPanel

**Files:**
- Modify: `src/lib/digital-twin-routes.ts`
- Create: `src/components/etch-sim/TimelineBar.tsx`
- Create: `src/components/etch-sim/ParameterPanel.tsx`
- Create: `src/app/mes/fab-floor/etching/etch-sim/page.tsx`

**Step 1: Add etching to digital-twin-routes.ts**

Add `etching: '/mes/fab-floor/etching/etch-sim',` to the DIGITAL_TWIN_ROUTES object.

**Step 2: Create etch-sim TimelineBar.tsx (with backHref built in)**

```tsx
// src/components/etch-sim/TimelineBar.tsx
'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react';
import type { StepState } from '@/lib/etch-sim';

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
  'strike': '#a855f7',
  'main-etch': '#7c3aed',
  'over-etch': '#ec4899',
};

const PHASE_LABELS: Record<string, string> = {
  'strike': 'Strike',
  'main-etch': 'Main Etch',
  'over-etch': 'Over-etch',
};

export function TimelineBar({
  currentIndex, totalSteps, playing, currentStep, backHref,
  onPlay, onPause, onStep, onSeek, onReset,
  playbackSpeed, onSpeedChange,
}: TimelineBarProps) {
  const progress = totalSteps > 0 ? ((currentIndex + 1) / totalSteps) * 100 : 0;
  const phase = currentStep?.phase ?? 'strike';
  const etchDepth = currentStep?.etchDepth.toFixed(1) ?? '0.0';

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[rgba(168,85,247,0.2)] bg-[rgba(2,6,23,0.8)] px-4 py-2 backdrop-blur-xl">
      {backHref && (
        <Link href={backHref} className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full hover:bg-white/10" aria-label="Back">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}

      <div className="flex items-center gap-1">
        <button type="button" onClick={playing ? onPause : onPlay} className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full hover:bg-white/10" aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button type="button" onClick={onStep} className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full hover:bg-white/10" aria-label="Step one step" disabled={currentIndex >= totalSteps - 1}>
          <ChevronRight className="h-4 w-4" />
        </button>
        <button type="button" onClick={onReset} className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full hover:bg-white/10" aria-label="Reset">
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 min-w-[200px]">
        <input type="range" min={-1} max={totalSteps - 1} value={currentIndex} onChange={(e) => onSeek(Number(e.target.value))} className="w-full accent-purple-500" aria-label="Step timeline" />
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
        <span style={{ color: '#a855f7' }}>
          {etchDepth} nm
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

**Step 3: Create ParameterPanel.tsx**

```tsx
// src/components/etch-sim/ParameterPanel.tsx
'use client';

import { PARAM_BOUNDS, PRESETS } from '@/lib/etch-sim';
import type { PresetId, SimulationParams } from '@/lib/etch-sim';

interface ParameterPanelProps {
  params: SimulationParams;
  activePreset: PresetId | null;
  onParamChange: (key: keyof SimulationParams, value: number) => void;
  onPreset: (id: PresetId) => void;
}

const SLIDER_KEYS: (keyof typeof PARAM_BOUNDS)[] = [
  'icpPower', 'biasPower', 'chamberPressure', 'cf4Flow',
  'o2Flow', 'chuckTemp', 'trenchWidth', 'aspectRatio',
];

const SLIDER_LABELS: Record<string, string> = {
  icpPower: 'ICP Power',
  biasPower: 'Bias Power',
  chamberPressure: 'Pressure',
  cf4Flow: 'CF\u2084 Flow',
  o2Flow: 'O\u2082 Flow',
  chuckTemp: 'Chuck Temp',
  trenchWidth: 'Trench W',
  aspectRatio: 'Aspect Ratio',
};

export function ParameterPanel({ params, activePreset, onParamChange, onPreset }: ParameterPanelProps) {
  return (
    <div className="rounded-2xl border border-[rgba(168,85,247,0.2)] bg-[rgba(2,6,23,0.8)] px-4 py-3 backdrop-blur-xl">
      <div className="grid grid-cols-4 gap-x-6 gap-y-2 sm:grid-cols-8">
        {SLIDER_KEYS.map((key) => {
          const b = PARAM_BOUNDS[key];
          const val = params[key];
          return (
            <label key={key} className="flex flex-col gap-0.5 font-mono text-[10px] text-[var(--sf-text-secondary)]">
              <span>{SLIDER_LABELS[key]}</span>
              <input type="range" min={b.min} max={b.max} step={b.step} value={val} onChange={(e) => onParamChange(key, Number(e.target.value))} className="accent-purple-500" />
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

**Step 4: Create page.tsx**

```tsx
// src/app/mes/fab-floor/etching/etch-sim/page.tsx
'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TimelineBar } from '@/components/etch-sim/TimelineBar';
import { ParameterPanel } from '@/components/etch-sim/ParameterPanel';
import {
  createSimulation,
  stepForward,
  stepN,
  applyPreset,
} from '@/lib/etch-sim';
import type { PresetId, SimulationParams, SimulationState, WaferMetric } from '@/lib/etch-sim';

const ICPChamberScene = dynamic(
  () => import('@/components/etch-sim/ICPChamberScene').then((m) => ({ default: m.ICPChamberScene })),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center bg-[var(--sf-bg-canvas)]"><p className="animate-pulse font-mono text-sm text-[var(--sf-text-muted)] motion-reduce:animate-none">Initializing ICP chamber...</p></div> },
);

const WaferMetricsPanel = dynamic(
  () => import('@/components/etch-sim/WaferMetricsPanel').then((m) => ({ default: m.WaferMetricsPanel })),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center bg-[var(--sf-bg-canvas)]"><p className="animate-pulse font-mono text-sm text-[var(--sf-text-muted)] motion-reduce:animate-none">Loading wafer metrics...</p></div> },
);

export default function EtchSimPage() {
  const [sim, setSim] = useState<SimulationState>(() => createSimulation());
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [metric, setMetric] = useState<WaferMetric>('etchRate');
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
    <div className="relative flex min-h-[calc(100dvh-104px)] flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.10),transparent_32%),var(--sf-bg-canvas)] text-[var(--sf-text-primary)]">
      <div className="z-10 px-4 pt-3">
        <TimelineBar
          currentIndex={sim.currentIndex}
          totalSteps={sim.totalSteps}
          playing={playing}
          currentStep={currentStep}
          backHref="/mes/fab-floor/etching"
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
        <div className="flex-1 overflow-hidden rounded-2xl border border-[rgba(168,85,247,0.15)]" data-testid="icp-chamber-panel">
          <ICPChamberScene step={currentStep} params={sim.params} />
        </div>
        <div className="flex-1 overflow-hidden rounded-2xl border border-[rgba(168,85,247,0.15)]" data-testid="wafer-metrics-panel">
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

**Step 5: Commit**

```bash
git add src/lib/digital-twin-routes.ts \
       src/components/etch-sim/TimelineBar.tsx \
       src/components/etch-sim/ParameterPanel.tsx \
       src/app/mes/fab-floor/etching/etch-sim/page.tsx
git commit -m "feat(etch-sim): page route, TimelineBar with backHref, ParameterPanel, digital twin route"
```

---

### Task 11: ICPChamberScene (Babylon.js)

**Files:**
- Create: `src/components/etch-sim/ICPChamberScene.tsx`

**Step 1: Create ICPChamberScene.tsx**

Build the ICP chamber cross-section with procedural geometry, phase-dependent animations, and etch profile inset overlay (Canvas2D). Uses the same `propsRef` render-loop pattern as other sims.

```tsx
// src/components/etch-sim/ICPChamberScene.tsx
'use client';

import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import type { StepState, SimulationParams } from '@/lib/etch-sim';
import { STRIKE_END, MAIN_ETCH_END, ETCH_PROFILE_POINTS } from '@/lib/etch-sim';

interface ICPChamberSceneProps {
  step: StepState | null;
  params: SimulationParams;
}

const PURPLE = new BABYLON.Color3(0.66, 0.33, 0.97);   // #A855F7
const PINK = new BABYLON.Color3(0.93, 0.29, 0.60);     // #EC4899
const COPPER = new BABYLON.Color3(0.72, 0.45, 0.20);

export function ICPChamberScene({ step, params }: ICPChamberSceneProps) {
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

    // Camera
    const camera = new BABYLON.ArcRotateCamera('cam', -Math.PI / 2, Math.PI / 2.5, 12, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 6;
    camera.upperRadiusLimit = 20;

    // Lighting
    const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene);
    hemi.intensity = 0.4;
    const point = new BABYLON.PointLight('point', new BABYLON.Vector3(0, 3, 0), scene);
    point.intensity = 0.6;

    // ---- Static Geometry ----

    // Chamber walls (box shell — left/right/top)
    const wallMat = new BABYLON.StandardMaterial('wallMat', scene);
    wallMat.diffuseColor = new BABYLON.Color3(0.2, 0.22, 0.25);
    wallMat.specularPower = 8;

    const leftWall = BABYLON.MeshBuilder.CreateBox('leftWall', { width: 0.15, height: 6, depth: 5 }, scene);
    leftWall.position.x = -3;
    leftWall.material = wallMat;

    const rightWall = leftWall.clone('rightWall');
    rightWall.position.x = 3;

    const topLid = BABYLON.MeshBuilder.CreateBox('topLid', { width: 6.15, height: 0.15, depth: 5 }, scene);
    topLid.position.y = 3;
    topLid.material = wallMat;

    // ICP Coil (3 torus rings above dielectric window)
    const coilMat = new BABYLON.StandardMaterial('coilMat', scene);
    coilMat.diffuseColor = COPPER;
    coilMat.specularColor = new BABYLON.Color3(1, 0.8, 0.4);
    coilMat.emissiveColor = new BABYLON.Color3(0.1, 0.05, 0);

    const coils: BABYLON.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const torus = BABYLON.MeshBuilder.CreateTorus(`coil${i}`, { diameter: 3.5 - i * 0.4, thickness: 0.12, tessellation: 32 }, scene);
      torus.position.y = 3.5 + i * 0.3;
      torus.material = coilMat;
      coils.push(torus);
    }

    // Dielectric window (quartz disc)
    const quartzMat = new BABYLON.StandardMaterial('quartzMat', scene);
    quartzMat.diffuseColor = new BABYLON.Color3(0.7, 0.75, 0.8);
    quartzMat.alpha = 0.4;

    const quartzDisc = BABYLON.MeshBuilder.CreateCylinder('quartz', { diameter: 5.5, height: 0.1, tessellation: 32 }, scene);
    quartzDisc.position.y = 3.0;
    quartzDisc.material = quartzMat;

    // Electrostatic chuck (pedestal)
    const chuckMat = new BABYLON.StandardMaterial('chuckMat', scene);
    chuckMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.35);

    const chuck = BABYLON.MeshBuilder.CreateCylinder('chuck', { diameter: 4, height: 0.6, tessellation: 32 }, scene);
    chuck.position.y = -2.7;
    chuck.material = chuckMat;

    // Wafer on chuck
    const waferMat = new BABYLON.StandardMaterial('waferMat', scene);
    waferMat.diffuseColor = new BABYLON.Color3(0.4, 0.42, 0.5);

    const wafer = BABYLON.MeshBuilder.CreateCylinder('wafer', { diameter: 3.6, height: 0.05, tessellation: 32 }, scene);
    wafer.position.y = -2.35;
    wafer.material = waferMat;

    // Film layer on wafer (will thin during etch)
    const filmMat = new BABYLON.StandardMaterial('filmMat', scene);
    filmMat.diffuseColor = new BABYLON.Color3(0.5, 0.6, 0.3);

    const film = BABYLON.MeshBuilder.CreateCylinder('film', { diameter: 3.4, height: 0.15, tessellation: 32 }, scene);
    film.position.y = -2.25;
    film.material = filmMat;

    // Gas inlet nozzle (top-left)
    const nozzle = BABYLON.MeshBuilder.CreateCylinder('nozzle', { diameter: 0.2, height: 0.6, tessellation: 8 }, scene);
    nozzle.position.set(-2.8, 2.7, 0);
    nozzle.rotation.z = Math.PI / 4;
    nozzle.material = wallMat;

    // Exhaust port (bottom-right)
    const exhaust = BABYLON.MeshBuilder.CreateCylinder('exhaust', { diameter: 0.3, height: 0.6, tessellation: 8 }, scene);
    exhaust.position.set(2.8, -2.7, 0);
    exhaust.rotation.z = -Math.PI / 4;
    exhaust.material = wallMat;

    // ---- Plasma Glow Volume ----
    const glowMat = new BABYLON.StandardMaterial('glowMat', scene);
    glowMat.emissiveColor = PURPLE.clone();
    glowMat.alpha = 0;
    glowMat.disableLighting = true;

    const plasma = BABYLON.MeshBuilder.CreateSphere('plasma', { diameterX: 4, diameterY: 3, diameterZ: 4, segments: 16 }, scene);
    plasma.position.y = 0.5;
    plasma.material = glowMat;

    // ---- Ion Particles ----
    const particleSPS = new BABYLON.SolidParticleSystem('ions', scene);
    const ionModel = BABYLON.MeshBuilder.CreateSphere('ionModel', { diameter: 0.06 }, scene);
    particleSPS.addShape(ionModel, 40);
    ionModel.dispose();

    const ionMesh = particleSPS.buildMesh();
    const ionMat = new BABYLON.StandardMaterial('ionMat', scene);
    ionMat.emissiveColor = new BABYLON.Color3(0.6, 0.8, 1.0);
    ionMat.disableLighting = true;
    ionMesh.material = ionMat;

    particleSPS.initParticles = () => {
      for (let i = 0; i < particleSPS.nbParticles; i++) {
        const p = particleSPS.particles[i];
        p.position.x = (Math.random() - 0.5) * 4;
        p.position.y = 2.5 - Math.random() * 5;
        p.position.z = (Math.random() - 0.5) * 2;
        p.velocity = new BABYLON.Vector3(0, -0.02, 0);
        p.alive = false;
      }
    };
    particleSPS.initParticles();
    particleSPS.setParticles();

    // ---- Reactive Species Particles ----
    const speciesSPS = new BABYLON.SolidParticleSystem('species', scene);
    const specModel = BABYLON.MeshBuilder.CreateSphere('specModel', { diameter: 0.04 }, scene);
    speciesSPS.addShape(specModel, 20);
    specModel.dispose();

    const specMesh = speciesSPS.buildMesh();
    const specMat = new BABYLON.StandardMaterial('specMat', scene);
    specMat.emissiveColor = new BABYLON.Color3(0.3, 0.9, 0.4);
    specMat.disableLighting = true;
    specMesh.material = specMat;

    speciesSPS.initParticles = () => {
      for (let i = 0; i < speciesSPS.nbParticles; i++) {
        const p = speciesSPS.particles[i];
        p.position.x = (Math.random() - 0.5) * 3;
        p.position.y = 1.5 - Math.random() * 3;
        p.position.z = (Math.random() - 0.5) * 2;
        p.velocity = new BABYLON.Vector3(0, -0.01, 0);
        p.alive = false;
      }
    };
    speciesSPS.initParticles();
    speciesSPS.setParticles();

    // ---- Phase Banner GUI ----
    const advTex = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('ui', true, scene);
    const phaseBanner = new BABYLON.GUI.TextBlock('phaseBanner', 'Strike');
    phaseBanner.color = '#a855f7';
    phaseBanner.fontSize = 18;
    phaseBanner.fontFamily = 'monospace';
    phaseBanner.top = '16px';
    phaseBanner.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    phaseBanner.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    advTex.addControl(phaseBanner);

    // ---- Render Loop ----
    let frame = 0;
    scene.registerBeforeRender(() => {
      frame++;
      const { step: s } = propsRef.current;
      const idx = s?.stepIndex ?? -1;
      const phase = s?.phase ?? 'strike';

      // Plasma glow
      if (phase === 'strike') {
        const progress = Math.max(0, (idx + 1) / STRIKE_END);
        glowMat.alpha = progress * 0.25;
        glowMat.emissiveColor = PURPLE.clone();
        plasma.scaling.setAll(0.3 + progress * 0.7);
      } else if (phase === 'main-etch') {
        glowMat.alpha = 0.3 + Math.sin(frame * 0.05) * 0.05;
        glowMat.emissiveColor = PURPLE.clone();
        plasma.scaling.setAll(1);
      } else {
        glowMat.alpha = 0.2;
        glowMat.emissiveColor = BABYLON.Color3.Lerp(PURPLE, PINK, 0.5);
        plasma.scaling.setAll(0.9);
      }

      // Coil emissive pulse
      const coilPulse = 0.05 + Math.sin(frame * 0.1) * 0.05;
      coilMat.emissiveColor = new BABYLON.Color3(coilPulse * 2, coilPulse, 0);

      // Film thinning
      const etchFraction = s ? Math.min(1, s.etchDepth / (params.trenchWidth * params.aspectRatio)) : 0;
      film.scaling.y = Math.max(0.01, 1 - etchFraction);
      film.position.y = -2.25 - etchFraction * 0.07;

      // Underlayer exposure
      if (etchFraction > 0.9) {
        filmMat.diffuseColor = new BABYLON.Color3(0.35, 0.35, 0.4);
      } else {
        filmMat.diffuseColor = new BABYLON.Color3(0.5, 0.6, 0.3);
      }

      // Ion particles
      const ionSpeed = s ? Math.max(0.01, s.ionEnergy * 0.0001) : 0.01;
      const showIons = phase !== 'strike' || idx > STRIKE_END * 0.5;

      particleSPS.updateParticle = (p) => {
        p.alive = showIons;
        if (!p.alive) {
          p.position.y = 10; // hide
          return p;
        }
        p.position.y -= ionSpeed;
        if (p.position.y < -2.3) {
          p.position.y = 2.5;
          p.position.x = (Math.random() - 0.5) * 3.5;
          p.position.z = (Math.random() - 0.5) * 2;
          // Center-peaked: bias toward center
          p.position.x *= 0.5 + Math.random() * 0.5;
        }
        return p;
      };
      particleSPS.setParticles();

      // Species particles (only main etch)
      const showSpec = phase === 'main-etch';
      speciesSPS.updateParticle = (p) => {
        p.alive = showSpec;
        if (!p.alive) {
          p.position.y = 10;
          return p;
        }
        p.position.y -= 0.008;
        p.position.x += (Math.random() - 0.5) * 0.02;
        if (p.position.y < -2.2) {
          p.position.y = 1.5;
          p.position.x = (Math.random() - 0.5) * 3;
          p.position.z = (Math.random() - 0.5) * 2;
        }
        return p;
      };
      speciesSPS.setParticles();

      // Phase banner
      const phaseLabels: Record<string, string> = { strike: 'Plasma Strike', 'main-etch': 'Main Etch', 'over-etch': 'Over-etch + Ash' };
      const phaseColors: Record<string, string> = { strike: '#a855f7', 'main-etch': '#7c3aed', 'over-etch': '#ec4899' };
      phaseBanner.text = phaseLabels[phase] ?? 'Strike';
      phaseBanner.color = phaseColors[phase] ?? '#a855f7';
    });

    engine.runRenderLoop(() => scene.render());
    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    // Draw etch profile inset on 2D canvas
    const drawInset = () => {
      const ctx = insetRef.current?.getContext('2d');
      if (!ctx) return;
      const w = 180, h = 220;
      ctx.clearRect(0, 0, w, h);

      const { step: s } = propsRef.current;
      const profile = s?.etchProfile ?? new Array(ETCH_PROFILE_POINTS).fill(1);
      const isIsotropic = s?.profileAngle != null && s.profileAngle < 83;

      // Background
      ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
      ctx.strokeRect(0, 0, w, h);

      // Title
      ctx.fillStyle = '#a855f7';
      ctx.font = '10px monospace';
      ctx.fillText('Etch Profile', 8, 16);

      // Draw profile bars (top-down: full=material, empty=removed)
      const barW = (w - 20) / ETCH_PROFILE_POINTS;
      const maxH = h - 40;
      for (let i = 0; i < profile.length; i++) {
        const barH = profile[i] * maxH;
        const x = 10 + i * barW;
        const y = 30 + (maxH - barH);
        ctx.fillStyle = profile[i] > 0.5 ? '#a855f7' : '#7c3aed';
        ctx.fillRect(x, y, barW - 1, barH);
      }

      // Isotropic undercut warning
      if (isIsotropic) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('UNDERCUT', w / 2 - 28, h - 6);
      }

      requestAnimationFrame(drawInset);
    };
    requestAnimationFrame(drawInset);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.dispose();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative h-full w-full">
      <canvas ref={canvasRef} className="h-full w-full" />
      <canvas ref={insetRef} width={180} height={220} className="absolute bottom-3 right-3 rounded-lg" style={{ imageRendering: 'pixelated' }} />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/etch-sim/ICPChamberScene.tsx
git commit -m "feat(etch-sim): Babylon.js ICP chamber scene — coils, plasma glow, ion particles, etch profile inset"
```

---

### Task 12: WaferMetricsPanel (Canvas 2D)

**Files:**
- Create: `src/components/etch-sim/WaferMetricsPanel.tsx`

**Step 1: Create WaferMetricsPanel.tsx**

Canvas-based wafer die map with 4 selectable metrics + trend sparkline. Same pattern as damascene-sim WaferMetricsPanel but with purple accent and etch-specific metrics/ranges.

```tsx
// src/components/etch-sim/WaferMetricsPanel.tsx
'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { StepState, WaferMetric } from '@/lib/etch-sim';
import { DIE_MASK, DIE_GRID_COLS, DIE_GRID_ROWS, STRIKE_END, MAIN_ETCH_END } from '@/lib/etch-sim';

interface WaferMetricsPanelProps {
  steps: StepState[];
  currentStep: StepState | null;
  metric: WaferMetric;
  onMetricChange: (m: WaferMetric) => void;
}

const METRIC_CFG: Record<WaferMetric, { label: string; unit: string; min: number; max: number; specMin: number; specMax: number; colorLow: string; colorMid: string; colorHigh: string }> = {
  etchRate:     { label: 'Etch Rate',     unit: 'nm/min', min: 150, max: 300, specMin: 220, specMax: 255, colorLow: '#3b82f6', colorMid: '#ffffff', colorHigh: '#ef4444' },
  selectivity:  { label: 'Selectivity',   unit: ':1',     min: 5,   max: 25,  specMin: 12,  specMax: 25,  colorLow: '#ef4444', colorMid: '#eab308', colorHigh: '#22c55e' },
  cdBias:       { label: 'CD Bias',       unit: 'nm',     min: -5,  max: 5,   specMin: -3,  specMax: 3,   colorLow: '#22c55e', colorMid: '#ffffff', colorHigh: '#ef4444' },
  profileAngle: { label: 'Profile Angle', unit: '\u00B0', min: 80,  max: 90,  specMin: 87,  specMax: 90,  colorLow: '#ef4444', colorMid: '#eab308', colorHigh: '#22c55e' },
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
    case 'etchRate': return step.etchRateMap[dieIdx];
    case 'selectivity': return step.selectivity;
    case 'cdBias': return step.cdBiasMap[dieIdx];
    case 'profileAngle': return step.profileAngle;
  }
}

function getMetricMean(step: StepState, metric: WaferMetric): number {
  switch (metric) {
    case 'etchRate': return step.etchRate;
    case 'selectivity': return step.selectivity;
    case 'cdBias': return step.cdBias;
    case 'profileAngle': return step.profileAngle;
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
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.2)';
        ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);
      }
    }

    // Mean label
    if (currentStep) {
      const meanVal = getMetricMean(currentStep, metric);
      ctx.fillStyle = '#a855f7';
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

    // Background
    ctx.fillStyle = 'rgba(2, 6, 23, 0.6)';
    ctx.fillRect(0, 0, w, h);

    // Phase dividers
    const totalSteps = steps.length > 0 ? steps[steps.length - 1].stepIndex + 1 : 200;
    const drawDivider = (stepIdx: number, label: string) => {
      const x = pad.left + (stepIdx / totalSteps) * plotW;
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, pad.top + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(168, 85, 247, 0.5)';
      ctx.font = '8px monospace';
      ctx.fillText(label, x + 2, pad.top + 10);
    };
    drawDivider(STRIKE_END, 'Main Etch');
    drawDivider(MAIN_ETCH_END, 'Over-etch');

    // Spec limits
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

    // Trend line
    if (steps.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < steps.length; i++) {
        const val = getMetricMean(steps[i], metric);
        const x = pad.left + (steps[i].stepIndex / totalSteps) * plotW;
        const y = yFromVal(val);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Area fill
      const lastStep = steps[steps.length - 1];
      const lastX = pad.left + (lastStep.stepIndex / totalSteps) * plotW;
      ctx.lineTo(lastX, pad.top + plotH);
      ctx.lineTo(pad.left, pad.top + plotH);
      ctx.closePath();
      ctx.fillStyle = 'rgba(168, 85, 247, 0.08)';
      ctx.fill();
      ctx.lineWidth = 1;
    }

    // Axis label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px monospace';
    ctx.fillText(`Step 0-${totalSteps}`, pad.left, h - 4);
    ctx.fillText(cfg.unit, w - pad.right - 30, h - 4);
  }, [steps, metric]);

  useEffect(() => { drawMap(); }, [drawMap]);
  useEffect(() => { drawSparkline(); }, [drawSparkline]);

  const metrics: WaferMetric[] = ['etchRate', 'selectivity', 'cdBias', 'profileAngle'];

  return (
    <div className="flex h-full flex-col bg-[var(--sf-bg-canvas)] p-3">
      {/* Metric selector */}
      <div className="mb-2 flex gap-1">
        {metrics.map((m) => (
          <button key={m} type="button" onClick={() => onMetricChange(m)} className="rounded-full px-2 py-0.5 font-mono text-[10px] transition-colors" style={{ backgroundColor: metric === m ? '#a855f7' : 'rgba(168, 85, 247, 0.1)', color: metric === m ? '#fff' : '#a855f7' }}>
            {METRIC_CFG[m].label}
          </button>
        ))}
      </div>

      {/* Die map */}
      <div className="flex-1 min-h-0">
        <canvas ref={mapRef} width={340} height={340} className="h-full w-full" style={{ imageRendering: 'pixelated' }} />
      </div>

      {/* Sparkline */}
      <div className="mt-2 h-[120px]">
        <canvas ref={sparkRef} width={340} height={120} className="h-full w-full" />
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/etch-sim/WaferMetricsPanel.tsx
git commit -m "feat(etch-sim): WaferMetricsPanel — die map, trend sparkline, 4 metrics"
```

---

## Phase 4: Verification

### Task 13: Build Verification

**Step 1: Run all etch-sim tests**

```bash
cd equipment-monitor && npx jest src/lib/etch-sim/ --no-coverage
```

Expected: ~33 tests across 7 files, all PASS

**Step 2: Type check**

```bash
cd equipment-monitor && npx tsc --noEmit 2>&1 | head -30
```

Expected: 0 errors (or only pre-existing unrelated warnings)

**Step 3: Production build**

```bash
cd equipment-monitor && npx next build 2>&1 | tail -20
```

Expected: build succeeds, `/mes/fab-floor/etching/etch-sim` route included

**Step 4: Commit any remaining fixes, then tag**

```bash
git log --oneline -15
```

Verify all etch-sim and back-button commits are present.
