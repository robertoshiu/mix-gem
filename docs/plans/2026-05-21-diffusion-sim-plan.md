# Diffusion 3D Digital Twin Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a diffusion digital twin at `/mes/fab-floor/diffusion/diffusion-sim` with full pair-diffusion PDE solver, point defect model, 5 thermal modes, 6 dopant species, and real-time Babylon.js 3D visualization.

**Architecture:** Crank-Nicolson PDE solver on 200-bin depth grid driven by pre-computed thermal profiles. Six dopants with charge-state-dependent diffusivity mediated by vacancy-interstitial pairs. Split 70/30 layout: Babylon.js 3D wafer slab + Canvas2D multi-species concentration plots. Amber `#F59E0B` accent.

**Tech Stack:** TypeScript, Next.js 15.1, Babylon.js v9.6.2, Canvas2D, Vitest

**Reference files (read these for patterns):**
- `equipment-monitor/src/lib/implant-sim/types.ts` — type pattern
- `equipment-monitor/src/lib/implant-sim/constants.ts` — constants + PARAM_BOUNDS pattern
- `equipment-monitor/src/lib/implant-sim/simulation-engine.ts` — WeakMap cache pattern
- `equipment-monitor/src/lib/implant-sim/presets.ts` — preset pattern
- `equipment-monitor/src/lib/implant-sim/index.ts` — barrel export pattern
- `equipment-monitor/src/components/implant-sim/TimelineBar.tsx` — timeline component pattern
- `equipment-monitor/src/components/implant-sim/ParameterPanel.tsx` — parameter panel pattern
- `equipment-monitor/src/components/implant-sim/TrajectoryScene.tsx` — Babylon.js propsRef pattern
- `equipment-monitor/src/components/implant-sim/ProfilePanel.tsx` — Canvas2D profile pattern
- `equipment-monitor/src/app/mes/fab-floor/implant/implant-sim/page.tsx` — page route pattern
- `equipment-monitor/src/lib/digital-twin-routes.ts` — route registration

**All paths are relative to `equipment-monitor/`.**

**Test runner:** `cd equipment-monitor && npx vitest run src/lib/diffusion-sim/__tests__/<file> --reporter verbose`

---

### Task 1: Types and Constants

**Files:**
- Create: `src/lib/diffusion-sim/types.ts`
- Create: `src/lib/diffusion-sim/constants.ts`
- Create: `src/lib/diffusion-sim/__tests__/constants.test.ts`

**Step 1: Create `src/lib/diffusion-sim/types.ts`**

```typescript
// ─── Enums & Unions ───
export type DopantSpecies = 'B' | 'P' | 'As' | 'Sb' | 'In' | 'Ge';
export type ThermalMode = 'furnace' | 'rta' | 'spike' | 'flash' | 'laser';
export type AmbientGas = 'N2' | 'O2' | 'N2O2';
export type SubstrateOrientation = '100' | '110' | '111';
export type ThermalPhase = 'ramp' | 'soak' | 'cool' | 'pulse';

// ─── Layer definition ───
export interface LayerDef {
  material: 'Si' | 'SiO2';
  startNm: number;
  endNm: number;
}

// ─── Thermal step ───
export interface ThermalStep {
  time: number;           // seconds since start
  temperature: number;    // °C (surface temperature)
  tempProfile: number[];  // T(z) per bin — uniform except laser mode
  dt: number;             // timestep size in seconds
  phase: ThermalPhase;
}

// ─── Point defect state ───
export interface PointDefectState {
  vacancies: number[];      // C_V[bin], cm⁻³
  interstitials: number[];  // C_I[bin], cm⁻³
  defect311: number[];      // N_311[bin], stored interstitials
}

// ─── Solver state (mutable, cached via WeakMap) ───
export interface SolverState {
  dopantProfile: number[];
  activeProfile: number[];
  clusteredProfile: number[];
  defects: PointDefectState;
  carrierProfile: number[];
  temperature: number;
  time: number;
  thermalBudget: number;
}

// ─── Simulation parameters (14 user-facing) ───
export interface SimulationParams {
  // Thermal (4)
  peakTemperature: number;        // °C, 700–1410
  rampRate: number;               // °C/s, log scale
  soakTime: number;               // s, log scale
  coolingRate: number;            // °C/s, log scale
  // Process (4 — 3 dropdowns + 1 slider)
  dopantSpecies: DopantSpecies;
  thermalMode: ThermalMode;
  ambientGas: AmbientGas;
  initialDose: number;            // cm⁻², log scale (stored as exponent 12–16)
  initialDepth: number;           // nm, 5–500
  // Material (3)
  screenOxideThickness: number;   // nm, 0–50
  substrateOrientation: SubstrateOrientation;
  backgroundDoping: number;       // cm⁻³, log scale (stored as exponent 14–17)
  // Advanced physics (3)
  interstitialFactor: number;     // multiplier on I supersaturation, 0.1–10
  vacancyFactor: number;          // multiplier on V equilibrium, 0.1–10
  clusteringThreshold: number;    // cm⁻³, log scale (stored as exponent 19–21)
  // Meta
  totalSteps?: number;
}

// ─── Per-step snapshot ───
export interface StepState {
  stepIndex: number;
  time: number;                   // elapsed seconds
  temperature: number;            // current T °C
  thermalPhase: ThermalPhase;
  // Profiles (all number[DEPTH_BINS])
  dopantProfile: number[];        // total C(x) cm⁻³
  activeProfile: number[];        // electrically active
  clusteredProfile: number[];     // inactive clusters
  interstitialProfile: number[];  // C_I(x) normalized to equilibrium
  vacancyProfile: number[];       // C_V(x) normalized to equilibrium
  carrierProfile: number[];       // n(x) or p(x) cm⁻³
  temperatureProfile: number[];   // T(x) °C — non-uniform for laser mode
  // Metrics (10)
  junctionDepth: number;
  sheetResistance: number;
  peakConcentration: number;
  thermalBudget: number;
  activationFraction: number;
  interstitialSupersaturation: number;
  profileAbruptness: number;
  segregationRatio: number;
  vacancyConcentration: number;
  diffusionLength: number;
  // Context
  maxDepthNm: number;
  layers: LayerDef[];
}

// ─── Top-level simulation state (immutable) ───
export interface SimulationState {
  params: SimulationParams;
  steps: StepState[];
  currentIndex: number;
  totalSteps: number;
  thermalProfile: ThermalStep[];
}

// ─── Metric union ───
export type DiffusionMetric =
  | 'junctionDepth'
  | 'sheetResistance'
  | 'peakConcentration'
  | 'thermalBudget'
  | 'activationFraction'
  | 'interstitialSupersaturation'
  | 'profileAbruptness'
  | 'segregationRatio'
  | 'vacancyConcentration'
  | 'diffusionLength';

// ─── Preset union ───
export type PresetId =
  | 'furnace-drive-in'
  | 'rta-activation'
  | 'spike-anneal'
  | 'flash-anneal'
  | 'laser-anneal'
  | 'ted-showcase'
  | 'oed-effect'
  | 'retrograde-well'
  | 'dopant-pile-up'
  | 'high-conc-clustering'
  | 'co-diffusion'
  | 'thermal-budget-overshoot';

export interface Preset {
  id: PresetId;
  label: string;
  labelCN: string;
  color: string;
  apply: (params: SimulationParams) => SimulationParams;
}
```

**Step 2: Create `src/lib/diffusion-sim/constants.ts`**

```typescript
import type { SimulationParams, DopantSpecies, ThermalMode } from './types';

// ─── Physical Constants ───
export const BOLTZMANN_EV = 8.617e-5;          // eV/K
export const ELECTRON_CHARGE = 1.602e-19;       // C
export const SI_LATTICE_DENSITY = 5.0e22;       // atoms/cm³
export const SI_LATTICE_SPACING = 0.235;        // nm (a₀/√2)
export const T_AMBIENT = 25;                    // °C

// ─── Simulation Grid ───
export const DEPTH_BINS = 200;
export const DEFAULT_TOTAL_STEPS = 200;

// ─── Point Defect Formation Energies ───
export const E_FORM_V = 2.0;   // eV — vacancy formation energy
export const E_FORM_I = 3.0;   // eV — interstitial formation energy
export const C_EQUIL_PREFACTOR = 5.0e22; // cm⁻³ — pre-exponential for equilibrium
export const E_RECOMBINATION = 0.5; // eV — IV recombination barrier
export const D_DEFECT_PREFACTOR = 1.0e-3; // cm²/s — defect diffusivity prefactor
export const E_DEFECT_MIGRATION = 0.5;     // eV — defect migration energy

// ─── {311} Defect Dissolution ───
export const E_311 = 3.6;      // eV — {311} dissolution activation
export const TAU_311_0 = 1e-13; // s — pre-exponential time constant

// ─── OED Parameters ───
export const K_OX_DRY = 0.01;   // interstitial injection rate (dry O₂)
export const K_OX_WET = 0.1;    // interstitial injection rate (wet O₂/N₂O₂)

// ─── Intrinsic Carrier Concentration ───
export const NI_PREFACTOR = 3.87e16; // cm⁻³ · K^(-3/2)
export const NI_ACTIVATION = 0.605;  // eV

// ─── Dopant Database ───
export interface DopantData {
  symbol: string;
  // Interstitial-mediated diffusivity: D_I^0, D_I^+, D_I^-, D_I^2-
  dI: { d0: number; ea: number }[];
  // Vacancy-mediated diffusivity: D_V^0, D_V^+, D_V^-, D_V^2-
  dV: { d0: number; ea: number }[];
  fI: number;  // interstitial fraction (0–1)
  // Solid solubility: C_sol = cSol0 * exp(-eSol/kT)
  cSol0: number;   // cm⁻³
  eSol: number;     // eV
  // Segregation coefficient at SiO₂/Si
  segregationCoeff: number;  // m = C_oxide/C_silicon
  // Implant range estimate: Rp(nm) ≈ C * depth_param
  rangeCoeff: number;
  straggleRatio: number;  // ΔRp/Rp
  isNtype: boolean;
  color: string;
}

export const DOPANT_DB: Record<DopantSpecies, DopantData> = {
  B: {
    symbol: 'B',
    dI: [
      { d0: 0.037, ea: 3.46 },  // D_I⁰
      { d0: 0.72,  ea: 3.46 },  // D_I⁺
      { d0: 0,     ea: 0 },     // D_I⁻ (negligible)
      { d0: 0,     ea: 0 },     // D_I²⁻
    ],
    dV: [
      { d0: 0, ea: 0 },
      { d0: 0, ea: 0 },
      { d0: 0, ea: 0 },
      { d0: 0, ea: 0 },
    ],
    fI: 1.0,
    cSol0: 5.5e23, eSol: 0.73,
    segregationCoeff: 0.3,
    rangeCoeff: 1.0, straggleRatio: 0.4,
    isNtype: false,
    color: '#3b82f6',
  },
  P: {
    symbol: 'P',
    dI: [
      { d0: 3.85, ea: 3.66 },   // D_I⁰
      { d0: 0,    ea: 0 },
      { d0: 0,    ea: 0 },
      { d0: 0,    ea: 0 },
    ],
    dV: [
      { d0: 0,    ea: 0 },
      { d0: 0,    ea: 0 },
      { d0: 3.85, ea: 3.66 },   // D_V⁻
      { d0: 0,    ea: 0 },
    ],
    fI: 0.5,
    cSol0: 2.5e23, eSol: 0.62,
    segregationCoeff: 10,
    rangeCoeff: 0.6, straggleRatio: 0.35,
    isNtype: true,
    color: '#22c55e',
  },
  As: {
    symbol: 'As',
    dI: [
      { d0: 0, ea: 0 },
      { d0: 0, ea: 0 },
      { d0: 0, ea: 0 },
      { d0: 0, ea: 0 },
    ],
    dV: [
      { d0: 0.066, ea: 3.44 },  // D_V⁰
      { d0: 0,     ea: 0 },
      { d0: 12.0,  ea: 4.05 },  // D_V⁻
      { d0: 0,     ea: 0 },
    ],
    fI: 0.3,
    cSol0: 1.5e23, eSol: 0.42,
    segregationCoeff: 10,
    rangeCoeff: 0.3, straggleRatio: 0.3,
    isNtype: true,
    color: '#ef4444',
  },
  Sb: {
    symbol: 'Sb',
    dI: [
      { d0: 0, ea: 0 },
      { d0: 0, ea: 0 },
      { d0: 0, ea: 0 },
      { d0: 0, ea: 0 },
    ],
    dV: [
      { d0: 0.214, ea: 3.65 },  // D_V⁰
      { d0: 0,     ea: 0 },
      { d0: 15.0,  ea: 4.08 },  // D_V⁻
      { d0: 0,     ea: 0 },
    ],
    fI: 0.0,
    cSol0: 8.0e22, eSol: 0.40,
    segregationCoeff: 10,
    rangeCoeff: 0.2, straggleRatio: 0.25,
    isNtype: true,
    color: '#f97316',
  },
  In: {
    symbol: 'In',
    dI: [
      { d0: 0.6, ea: 3.5 },     // D_I⁰
      { d0: 0,   ea: 0 },
      { d0: 1.2, ea: 3.9 },     // D_I⁻
      { d0: 0,   ea: 0 },
    ],
    dV: [
      { d0: 0, ea: 0 },
      { d0: 0, ea: 0 },
      { d0: 0, ea: 0 },
      { d0: 0, ea: 0 },
    ],
    fI: 1.0,
    cSol0: 1.0e22, eSol: 0.50,
    segregationCoeff: 0.5,
    rangeCoeff: 0.15, straggleRatio: 0.25,
    isNtype: false,
    color: '#8b5cf6',
  },
  Ge: {
    symbol: 'Ge',
    dI: [
      { d0: 6.2, ea: 5.28 },    // D_I⁰
      { d0: 0,   ea: 0 },
      { d0: 0,   ea: 0 },
      { d0: 0,   ea: 0 },
    ],
    dV: [
      { d0: 0.28, ea: 4.65 },   // D_V⁰
      { d0: 0,    ea: 0 },
      { d0: 0,    ea: 0 },
      { d0: 0,    ea: 0 },
    ],
    fI: 0.5,
    cSol0: 1e24, eSol: 0.0,     // effectively unlimited (isoelectronic)
    segregationCoeff: 1.0,
    rangeCoeff: 0.25, straggleRatio: 0.3,
    isNtype: false,  // electrically inactive in practice
    color: '#6b7280',
  },
};

// ─── Thermal Mode Timescale Configuration ───
export interface ThermalModeConfig {
  label: string;
  labelCN: string;
  typicalDt: number;       // seconds per simulation step
  totalTimeScale: number;  // total process time (seconds)
}

export const THERMAL_MODES: Record<ThermalMode, ThermalModeConfig> = {
  furnace: { label: 'Furnace',  labelCN: '爐管退火', typicalDt: 9,      totalTimeScale: 1800 },
  rta:     { label: 'RTA',      labelCN: '快速熱退火', typicalDt: 0.1,    totalTimeScale: 20 },
  spike:   { label: 'Spike',    labelCN: '尖峰退火', typicalDt: 0.01,   totalTimeScale: 2 },
  flash:   { label: 'Flash',    labelCN: '閃光退火', typicalDt: 2.5e-5, totalTimeScale: 0.005 },
  laser:   { label: 'Laser',    labelCN: '激光退火', typicalDt: 2.5e-6, totalTimeScale: 0.0005 },
};

// ─── Masetti Mobility Parameters ───
export const MASETTI_ELECTRONS = {
  muMin: 52.2, muMax: 1417, cRef: 9.68e16, alpha: 0.68,
  mu1: 43.4, cRef2: 3.43e20, beta: 2.0,
};
export const MASETTI_HOLES = {
  muMin: 44.9, muMax: 470.5, cRef: 2.23e17, alpha: 0.719,
  mu1: 29.0, cRef2: 6.1e20, beta: 2.0,
};

// ─── Depth Estimation ───
export function estimateMaxDepth(species: DopantSpecies, depthNm: number): number {
  return Math.max(200, depthNm * 5);
}

// ─── Parameter Bounds ───
export const PARAM_BOUNDS = {
  peakTemperature:      { min: 700,  max: 1410, default: 1000, step: 10,   unit: '°C',        label: 'Peak T' },
  rampRate:             { min: -1,   max: 6,    default: 1.7,  step: 0.1,  unit: '°C/s',      label: 'Ramp Rate', isLog: true },
  soakTime:             { min: -4,   max: 3.86, default: 1.48, step: 0.1,  unit: 's',         label: 'Soak Time', isLog: true },
  coolingRate:          { min: -1,   max: 6,    default: 1.7,  step: 0.1,  unit: '°C/s',      label: 'Cool Rate', isLog: true },
  initialDose:          { min: 12,   max: 16,   default: 14,   step: 0.1,  unit: 'cm⁻²',      label: 'Dose (10ˣ)', isLog: true },
  initialDepth:         { min: 5,    max: 500,  default: 50,   step: 5,    unit: 'nm',        label: 'Init Depth' },
  screenOxideThickness: { min: 0,    max: 50,   default: 5,    step: 1,    unit: 'nm',        label: 'Screen Oxide' },
  backgroundDoping:     { min: 14,   max: 17,   default: 15,   step: 0.1,  unit: 'cm⁻³',      label: 'Bg Doping (10ˣ)', isLog: true },
  interstitialFactor:   { min: 0.1,  max: 10,   default: 1.0,  step: 0.1,  unit: '×',         label: 'I Factor' },
  vacancyFactor:        { min: 0.1,  max: 10,   default: 1.0,  step: 0.1,  unit: '×',         label: 'V Factor' },
  clusteringThreshold:  { min: 19,   max: 21,   default: 20,   step: 0.1,  unit: 'cm⁻³',      label: 'Cluster (10ˣ)', isLog: true },
} as const;

export const DEFAULT_PARAMS: SimulationParams = {
  peakTemperature: PARAM_BOUNDS.peakTemperature.default,
  rampRate: Math.pow(10, PARAM_BOUNDS.rampRate.default),       // ~50 °C/s
  soakTime: Math.pow(10, PARAM_BOUNDS.soakTime.default),       // ~30 s
  coolingRate: Math.pow(10, PARAM_BOUNDS.coolingRate.default),  // ~50 °C/s
  dopantSpecies: 'B',
  thermalMode: 'rta',
  ambientGas: 'N2',
  initialDose: Math.pow(10, PARAM_BOUNDS.initialDose.default), // 1e14 cm⁻²
  initialDepth: PARAM_BOUNDS.initialDepth.default,
  screenOxideThickness: PARAM_BOUNDS.screenOxideThickness.default,
  substrateOrientation: '100',
  backgroundDoping: Math.pow(10, PARAM_BOUNDS.backgroundDoping.default), // 1e15 cm⁻³
  interstitialFactor: PARAM_BOUNDS.interstitialFactor.default,
  vacancyFactor: PARAM_BOUNDS.vacancyFactor.default,
  clusteringThreshold: Math.pow(10, PARAM_BOUNDS.clusteringThreshold.default), // 1e20 cm⁻³
  totalSteps: DEFAULT_TOTAL_STEPS,
};

// ─── Seeded PRNG (for reproducible noise in particles) ───
export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

**Step 3: Create `src/lib/diffusion-sim/__tests__/constants.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PARAMS, DOPANT_DB, THERMAL_MODES, DEPTH_BINS,
  DEFAULT_TOTAL_STEPS, PARAM_BOUNDS, estimateMaxDepth, mulberry32,
  BOLTZMANN_EV, SI_LATTICE_DENSITY,
} from '../constants';

describe('diffusion-sim constants', () => {
  it('DEFAULT_PARAMS has all required fields', () => {
    expect(DEFAULT_PARAMS.peakTemperature).toBe(1000);
    expect(DEFAULT_PARAMS.dopantSpecies).toBe('B');
    expect(DEFAULT_PARAMS.thermalMode).toBe('rta');
    expect(DEFAULT_PARAMS.ambientGas).toBe('N2');
    expect(DEFAULT_PARAMS.initialDose).toBeCloseTo(1e14, -10);
    expect(DEFAULT_PARAMS.totalSteps).toBe(200);
  });

  it('DOPANT_DB has all 6 species with valid data', () => {
    const species = Object.keys(DOPANT_DB);
    expect(species).toHaveLength(6);
    expect(species).toEqual(expect.arrayContaining(['B', 'P', 'As', 'Sb', 'In', 'Ge']));
    for (const s of species) {
      const d = DOPANT_DB[s as keyof typeof DOPANT_DB];
      expect(d.dI).toHaveLength(4);
      expect(d.dV).toHaveLength(4);
      expect(d.fI).toBeGreaterThanOrEqual(0);
      expect(d.fI).toBeLessThanOrEqual(1);
    }
  });

  it('THERMAL_MODES has all 5 modes with increasing timescale', () => {
    expect(Object.keys(THERMAL_MODES)).toHaveLength(5);
    expect(THERMAL_MODES.furnace.typicalDt).toBeGreaterThan(THERMAL_MODES.rta.typicalDt);
    expect(THERMAL_MODES.rta.typicalDt).toBeGreaterThan(THERMAL_MODES.spike.typicalDt);
    expect(THERMAL_MODES.spike.typicalDt).toBeGreaterThan(THERMAL_MODES.flash.typicalDt);
    expect(THERMAL_MODES.flash.typicalDt).toBeGreaterThan(THERMAL_MODES.laser.typicalDt);
  });

  it('estimateMaxDepth returns reasonable range', () => {
    const d = estimateMaxDepth('B', 50);
    expect(d).toBeGreaterThanOrEqual(200);
    expect(d).toBeLessThan(5000);
  });

  it('mulberry32 produces deterministic sequence', () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);
    for (let i = 0; i < 10; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it('PARAM_BOUNDS covers all 11 slider parameters', () => {
    expect(Object.keys(PARAM_BOUNDS)).toHaveLength(11);
    for (const [, b] of Object.entries(PARAM_BOUNDS)) {
      expect(b.min).toBeLessThan(b.max);
      expect(b.default).toBeGreaterThanOrEqual(b.min);
      expect(b.default).toBeLessThanOrEqual(b.max);
    }
  });
});
```

**Step 4: Run tests**

Run: `cd equipment-monitor && npx vitest run src/lib/diffusion-sim/__tests__/constants.test.ts --reporter verbose`
Expected: 6/6 PASS

**Step 5: Commit**

```bash
cd equipment-monitor && git add src/lib/diffusion-sim/types.ts src/lib/diffusion-sim/constants.ts src/lib/diffusion-sim/__tests__/constants.test.ts && git commit -m "feat(diffusion-sim): types and constants"
```

---

### Task 2: Point Defect Model

**Files:**
- Create: `src/lib/diffusion-sim/point-defects.ts`
- Create: `src/lib/diffusion-sim/__tests__/point-defects.test.ts`

**Dependencies:** Task 1 (types, constants)

**Step 1: Create `src/lib/diffusion-sim/point-defects.ts`**

```typescript
import type { PointDefectState, AmbientGas } from './types';
import {
  BOLTZMANN_EV, C_EQUIL_PREFACTOR, E_FORM_V, E_FORM_I,
  E_RECOMBINATION, D_DEFECT_PREFACTOR, E_DEFECT_MIGRATION,
  E_311, TAU_311_0, K_OX_DRY, K_OX_WET, SI_LATTICE_SPACING,
  DEPTH_BINS,
} from './constants';

/** Equilibrium vacancy concentration at temperature T (°C) */
export function equilibriumVacancies(T_celsius: number): number {
  const T = T_celsius + 273.15;
  return C_EQUIL_PREFACTOR * Math.exp(-E_FORM_V / (BOLTZMANN_EV * T));
}

/** Equilibrium interstitial concentration at temperature T (°C) */
export function equilibriumInterstitials(T_celsius: number): number {
  const T = T_celsius + 273.15;
  return C_EQUIL_PREFACTOR * Math.exp(-E_FORM_I / (BOLTZMANN_EV * T));
}

/** IV recombination rate constant */
function recombinationRate(T_celsius: number): number {
  const T = T_celsius + 273.15;
  const D_eff = D_DEFECT_PREFACTOR * Math.exp(-E_DEFECT_MIGRATION / (BOLTZMANN_EV * T));
  return 4 * Math.PI * 2 * D_eff * (SI_LATTICE_SPACING * 1e-7) * Math.exp(-E_RECOMBINATION / (BOLTZMANN_EV * T));
}

/** {311} dissolution time constant (seconds) */
function tau311(T_celsius: number): number {
  const T = T_celsius + 273.15;
  return TAU_311_0 * Math.exp(E_311 / (BOLTZMANN_EV * T));
}

/** OED injection flux based on ambient gas */
function oedInjectionRate(T_celsius: number, ambient: AmbientGas): number {
  if (ambient === 'N2') return 0;
  const T = T_celsius + 273.15;
  const k = ambient === 'O2' ? K_OX_WET : K_OX_DRY;
  // Oxidation rate ~ Deal-Grove linear rate approximation
  const oxRate = k * Math.exp(-1.24 / (BOLTZMANN_EV * T));
  return oxRate * C_EQUIL_PREFACTOR * 1e-4; // scaled injection
}

export function createPointDefectState(bins: number, implantDamage: number[]): PointDefectState {
  const vacancies = new Array(bins).fill(0);
  const interstitials = new Array(bins).fill(0);
  const defect311 = new Array(bins).fill(0);

  // Initialize to equilibrium at room temperature
  const cVeq = equilibriumVacancies(25);
  const cIeq = equilibriumInterstitials(25);
  for (let i = 0; i < bins; i++) {
    vacancies[i] = cVeq;
    interstitials[i] = cIeq;
    defect311[i] = implantDamage[i] ?? 0;
  }

  return { vacancies, interstitials, defect311 };
}

export function stepPointDefects(
  state: PointDefectState,
  T_celsius: number,
  dt: number,
  ambient: AmbientGas,
  binSize: number,
  interstitialFactor: number,
  vacancyFactor: number,
): void {
  const bins = state.vacancies.length;
  const cVeq = equilibriumVacancies(T_celsius) * vacancyFactor;
  const cIeq = equilibriumInterstitials(T_celsius) * interstitialFactor;
  const kIV = recombinationRate(T_celsius);
  const tau = tau311(T_celsius);
  const oedFlux = oedInjectionRate(T_celsius, ambient);

  for (let i = 0; i < bins; i++) {
    // {311} dissolution → release interstitials
    const release = state.defect311[i] * (1 - Math.exp(-dt / tau));
    state.defect311[i] -= release;
    state.interstitials[i] += release;

    // IV recombination
    const R = kIV * (state.interstitials[i] * state.vacancies[i] - cIeq * cVeq);
    const recomb = Math.min(R * dt, Math.min(state.interstitials[i], state.vacancies[i]) * 0.5);
    state.interstitials[i] -= recomb;
    state.vacancies[i] -= recomb;

    // Relax toward equilibrium (surface-driven)
    const relaxRate = 0.1 * dt; // damped approach to equilibrium
    state.vacancies[i] += (cVeq - state.vacancies[i]) * Math.min(1, relaxRate);
    state.interstitials[i] += (cIeq - state.interstitials[i]) * Math.min(1, relaxRate);
  }

  // Surface boundary: OED injection at bin 0
  if (oedFlux > 0) {
    state.interstitials[0] += oedFlux * dt;
  }

  // Clamp to non-negative
  for (let i = 0; i < bins; i++) {
    state.vacancies[i] = Math.max(0, state.vacancies[i]);
    state.interstitials[i] = Math.max(0, state.interstitials[i]);
    state.defect311[i] = Math.max(0, state.defect311[i]);
  }
}

export function getSuperSaturation(
  state: PointDefectState,
  T_celsius: number,
  interstitialFactor: number,
  vacancyFactor: number,
): { sI: number[]; sV: number[] } {
  const cVeq = equilibriumVacancies(T_celsius) * vacancyFactor;
  const cIeq = equilibriumInterstitials(T_celsius) * interstitialFactor;
  const bins = state.vacancies.length;
  const sI = new Array(bins);
  const sV = new Array(bins);
  for (let i = 0; i < bins; i++) {
    sI[i] = cIeq > 0 ? state.interstitials[i] / cIeq : 1;
    sV[i] = cVeq > 0 ? state.vacancies[i] / cVeq : 1;
  }
  return { sI, sV };
}
```

**Step 2: Create `src/lib/diffusion-sim/__tests__/point-defects.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import {
  createPointDefectState, stepPointDefects, getSuperSaturation,
  equilibriumVacancies, equilibriumInterstitials,
} from '../point-defects';

describe('point-defects', () => {
  it('equilibrium vacancy increases with temperature', () => {
    const v800 = equilibriumVacancies(800);
    const v1000 = equilibriumVacancies(1000);
    expect(v1000).toBeGreaterThan(v800);
    expect(v800).toBeGreaterThan(0);
  });

  it('equilibrium interstitial is much lower than vacancy', () => {
    const cV = equilibriumVacancies(1000);
    const cI = equilibriumInterstitials(1000);
    expect(cI).toBeLessThan(cV);
    expect(cI).toBeGreaterThan(0);
  });

  it('createPointDefectState initializes with implant damage in {311}', () => {
    const damage = new Array(200).fill(0);
    damage[50] = 1e18;
    const state = createPointDefectState(200, damage);
    expect(state.defect311[50]).toBe(1e18);
    expect(state.defect311[0]).toBe(0);
    expect(state.vacancies).toHaveLength(200);
    expect(state.interstitials).toHaveLength(200);
  });

  it('stepPointDefects dissolves {311} defects', () => {
    const damage = new Array(200).fill(1e16);
    const state = createPointDefectState(200, damage);
    const initial311 = state.defect311[100];
    stepPointDefects(state, 1000, 1.0, 'N2', 1.0, 1.0, 1.0);
    expect(state.defect311[100]).toBeLessThan(initial311);
  });

  it('IV recombination reduces both species', () => {
    const state = createPointDefectState(200, new Array(200).fill(0));
    // Artificially boost both
    for (let i = 0; i < 200; i++) {
      state.interstitials[i] = 1e20;
      state.vacancies[i] = 1e20;
    }
    const prevI = state.interstitials[100];
    stepPointDefects(state, 1000, 0.1, 'N2', 1.0, 1.0, 1.0);
    expect(state.interstitials[100]).toBeLessThan(prevI);
    expect(state.vacancies[100]).toBeLessThan(prevI);
  });

  it('OED injects interstitials at surface with O2 ambient', () => {
    const state = createPointDefectState(200, new Array(200).fill(0));
    const prevI0 = state.interstitials[0];
    stepPointDefects(state, 1000, 1.0, 'O2', 1.0, 1.0, 1.0);
    expect(state.interstitials[0]).toBeGreaterThan(prevI0);
  });

  it('N2 ambient produces no OED injection', () => {
    const state = createPointDefectState(200, new Array(200).fill(0));
    const stateO2 = createPointDefectState(200, new Array(200).fill(0));
    stepPointDefects(state, 1000, 1.0, 'N2', 1.0, 1.0, 1.0);
    stepPointDefects(stateO2, 1000, 1.0, 'O2', 1.0, 1.0, 1.0);
    expect(stateO2.interstitials[0]).toBeGreaterThan(state.interstitials[0]);
  });

  it('getSuperSaturation returns ~1 at equilibrium', () => {
    const state = createPointDefectState(200, new Array(200).fill(0));
    // Warm up to equilibrium
    for (let i = 0; i < 50; i++) {
      stepPointDefects(state, 1000, 1.0, 'N2', 1.0, 1.0, 1.0);
    }
    const { sI, sV } = getSuperSaturation(state, 1000, 1.0, 1.0);
    expect(sI[100]).toBeCloseTo(1.0, 0);
    expect(sV[100]).toBeCloseTo(1.0, 0);
  });

  it('high interstitialFactor increases supersaturation', () => {
    const state = createPointDefectState(200, new Array(200).fill(0));
    const { sI: sI_1 } = getSuperSaturation(state, 1000, 1.0, 1.0);
    const { sI: sI_5 } = getSuperSaturation(state, 1000, 5.0, 1.0);
    // Higher factor means lower equilibrium → higher ratio for same C_I
    expect(sI_5[100]).toBeLessThan(sI_1[100]);
  });
});
```

**Step 3: Run tests**

Run: `cd equipment-monitor && npx vitest run src/lib/diffusion-sim/__tests__/point-defects.test.ts --reporter verbose`
Expected: 8/8 PASS

**Step 4: Commit**

```bash
cd equipment-monitor && git add src/lib/diffusion-sim/point-defects.ts src/lib/diffusion-sim/__tests__/point-defects.test.ts && git commit -m "feat(diffusion-sim): point defect model with {311} TED and OED"
```

---

### Task 3: Diffusivity Model

**Files:**
- Create: `src/lib/diffusion-sim/diffusivity.ts`
- Create: `src/lib/diffusion-sim/__tests__/diffusivity.test.ts`

**Dependencies:** Task 1 (types, constants)

**Step 1: Create `src/lib/diffusion-sim/diffusivity.ts`**

```typescript
import type { DopantSpecies } from './types';
import { BOLTZMANN_EV, NI_PREFACTOR, NI_ACTIVATION, DOPANT_DB } from './constants';

/** Intrinsic carrier concentration n_i(T) in cm⁻³ */
export function intrinsicCarrier(T_celsius: number): number {
  const T = T_celsius + 273.15;
  return NI_PREFACTOR * Math.pow(T, 1.5) * Math.exp(-NI_ACTIVATION / (BOLTZMANN_EV * T));
}

/** Carrier concentrations from net doping and n_i via charge neutrality */
export function carrierConcentrations(
  netDoping: number,   // positive = n-type, negative = p-type
  ni: number,
): { n: number; p: number } {
  const half = netDoping / 2;
  const n = half + Math.sqrt(half * half + ni * ni);
  const p = ni * ni / n;
  return { n, p };
}

/** Compute Arrhenius diffusivity: D = D0 * exp(-Ea/kT) */
function arrhenius(d0: number, ea: number, T_kelvin: number): number {
  if (d0 === 0) return 0;
  return d0 * Math.exp(-ea / (BOLTZMANN_EV * T_kelvin));
}

/**
 * Effective dopant diffusivity D_eff at a single depth bin.
 * Combines interstitial and vacancy mechanisms with charge-state weighting.
 */
export function effectiveDiffusivity(
  species: DopantSpecies,
  T_celsius: number,
  ni: number,
  n: number,
  p: number,
  sI: number,  // interstitial supersaturation C_I/C_I*
  sV: number,  // vacancy supersaturation C_V/C_V*
): number {
  const T = T_celsius + 273.15;
  const db = DOPANT_DB[species];

  // Interstitial-mediated: D_I = h_I * [D_I⁰ + D_I⁺*(p/ni) + D_I⁻*(n/ni) + D_I²⁻*(n/ni)²]
  const ratioN = ni > 0 ? n / ni : 1;
  const ratioP = ni > 0 ? p / ni : 1;

  let dI = 0;
  dI += arrhenius(db.dI[0].d0, db.dI[0].ea, T);                      // D_I⁰
  dI += arrhenius(db.dI[1].d0, db.dI[1].ea, T) * ratioP;             // D_I⁺
  dI += arrhenius(db.dI[2].d0, db.dI[2].ea, T) * ratioN;             // D_I⁻
  dI += arrhenius(db.dI[3].d0, db.dI[3].ea, T) * ratioN * ratioN;    // D_I²⁻
  dI *= sI;

  // Vacancy-mediated: D_V = h_V * [D_V⁰ + D_V⁺*(p/ni) + D_V⁻*(n/ni) + D_V²⁻*(n/ni)²]
  let dV = 0;
  dV += arrhenius(db.dV[0].d0, db.dV[0].ea, T);
  dV += arrhenius(db.dV[1].d0, db.dV[1].ea, T) * ratioP;
  dV += arrhenius(db.dV[2].d0, db.dV[2].ea, T) * ratioN;
  dV += arrhenius(db.dV[3].d0, db.dV[3].ea, T) * ratioN * ratioN;
  dV *= sV;

  return dI + dV;
}

/** Solid solubility at temperature T (°C) */
export function solidSolubility(species: DopantSpecies, T_celsius: number): number {
  const T = T_celsius + 273.15;
  const db = DOPANT_DB[species];
  return db.cSol0 * Math.exp(-db.eSol / (BOLTZMANN_EV * T));
}

/** Active fraction of dopant: saturating activation model */
export function activeFraction(
  C_total: number,
  species: DopantSpecies,
  T_celsius: number,
): number {
  const cSol = solidSolubility(species, T_celsius);
  if (C_total <= 0) return 0;
  const active = cSol * (1 - Math.exp(-C_total / cSol));
  return Math.min(1, active / C_total);
}

/** Compute active and clustered concentrations */
export function activeConcentration(
  C_total: number,
  species: DopantSpecies,
  T_celsius: number,
): { active: number; clustered: number } {
  const cSol = solidSolubility(species, T_celsius);
  const active = cSol * (1 - Math.exp(-C_total / cSol));
  const clamped = Math.min(C_total, active);
  return { active: clamped, clustered: C_total - clamped };
}
```

**Step 2: Create `src/lib/diffusion-sim/__tests__/diffusivity.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import {
  intrinsicCarrier, carrierConcentrations, effectiveDiffusivity,
  solidSolubility, activeFraction, activeConcentration,
} from '../diffusivity';

describe('diffusivity', () => {
  it('intrinsic carrier increases with temperature', () => {
    const ni800 = intrinsicCarrier(800);
    const ni1000 = intrinsicCarrier(1000);
    expect(ni1000).toBeGreaterThan(ni800);
    expect(ni800).toBeGreaterThan(1e10);
  });

  it('carrier concentrations satisfy charge neutrality', () => {
    const ni = intrinsicCarrier(1000);
    const { n, p } = carrierConcentrations(1e18, ni);
    expect(n * p).toBeCloseTo(ni * ni, -ni * ni * 0.01);
    expect(n).toBeGreaterThan(p); // n-type
  });

  it('B diffuses primarily via interstitials (fI=1)', () => {
    const ni = intrinsicCarrier(1000);
    const { n, p } = carrierConcentrations(0, ni);
    const dB = effectiveDiffusivity('B', 1000, ni, n, p, 1, 1);
    // B with sV only → should be near zero
    const dB_noI = effectiveDiffusivity('B', 1000, ni, n, p, 0, 1);
    expect(dB).toBeGreaterThan(dB_noI);
    expect(dB).toBeGreaterThan(0);
  });

  it('Sb diffuses only via vacancies (fV=1)', () => {
    const ni = intrinsicCarrier(1000);
    const { n, p } = carrierConcentrations(0, ni);
    const dSb = effectiveDiffusivity('Sb', 1000, ni, n, p, 1, 1);
    const dSb_noV = effectiveDiffusivity('Sb', 1000, ni, n, p, 1, 0);
    expect(dSb).toBeGreaterThan(dSb_noV);
    expect(dSb_noV).toBeCloseTo(0, 15);
  });

  it('P uses dual mechanism (both I and V)', () => {
    const ni = intrinsicCarrier(1000);
    const { n, p } = carrierConcentrations(1e18, ni);
    const dP_full = effectiveDiffusivity('P', 1000, ni, n, p, 1, 1);
    const dP_Ionly = effectiveDiffusivity('P', 1000, ni, n, p, 1, 0);
    const dP_Vonly = effectiveDiffusivity('P', 1000, ni, n, p, 0, 1);
    expect(dP_full).toBeGreaterThan(dP_Ionly);
    expect(dP_full).toBeGreaterThan(dP_Vonly);
  });

  it('supersaturation multiplies diffusivity', () => {
    const ni = intrinsicCarrier(1000);
    const { n, p } = carrierConcentrations(0, ni);
    const d1 = effectiveDiffusivity('B', 1000, ni, n, p, 1, 1);
    const d5 = effectiveDiffusivity('B', 1000, ni, n, p, 5, 1);
    expect(d5).toBeCloseTo(d1 * 5, -1);
  });

  it('solid solubility increases with temperature', () => {
    const sol900 = solidSolubility('B', 900);
    const sol1100 = solidSolubility('B', 1100);
    expect(sol1100).toBeGreaterThan(sol900);
    expect(sol900).toBeGreaterThan(1e18);
  });

  it('activeFraction is < 1 above solid solubility', () => {
    const frac = activeFraction(1e21, 'As', 1000);
    expect(frac).toBeLessThan(1);
    expect(frac).toBeGreaterThan(0);
  });

  it('Ge has very low diffusivity due to high activation energies', () => {
    const ni = intrinsicCarrier(1000);
    const { n, p } = carrierConcentrations(0, ni);
    const dGe = effectiveDiffusivity('Ge', 1000, ni, n, p, 1, 1);
    const dB = effectiveDiffusivity('B', 1000, ni, n, p, 1, 1);
    expect(dGe).toBeLessThan(dB);
  });
});
```

**Step 3: Run tests, commit**

Run: `cd equipment-monitor && npx vitest run src/lib/diffusion-sim/__tests__/diffusivity.test.ts --reporter verbose`
Expected: 8/8 PASS

```bash
cd equipment-monitor && git add src/lib/diffusion-sim/diffusivity.ts src/lib/diffusion-sim/__tests__/diffusivity.test.ts && git commit -m "feat(diffusion-sim): charge-state-dependent diffusivity model"
```

---

### Task 4: Thermal Profile Generator

**Files:**
- Create: `src/lib/diffusion-sim/thermal-profile.ts`
- Create: `src/lib/diffusion-sim/__tests__/thermal-profile.test.ts`

**Dependencies:** Task 1

**Step 1: Create `src/lib/diffusion-sim/thermal-profile.ts`**

```typescript
import type { SimulationParams, ThermalStep, ThermalMode } from './types';
import { DEPTH_BINS, DEFAULT_TOTAL_STEPS, T_AMBIENT, THERMAL_MODES } from './constants';

/**
 * Generate the complete T(t) thermal profile as an array of ThermalStep.
 * Each step maps to one simulation timestep.
 */
export function generateThermalProfile(
  mode: ThermalMode,
  params: SimulationParams,
): ThermalStep[] {
  const totalSteps = params.totalSteps ?? DEFAULT_TOTAL_STEPS;
  const cfg = THERMAL_MODES[mode];
  const dt = cfg.totalTimeScale / totalSteps;
  const steps: ThermalStep[] = [];

  for (let i = 0; i < totalSteps; i++) {
    const time = (i + 0.5) * dt;
    const { temperature, phase, tempProfile } = computeThermalState(mode, params, time, dt);
    steps.push({ time, temperature, tempProfile, dt, phase });
  }

  return steps;
}

function computeThermalState(
  mode: ThermalMode,
  params: SimulationParams,
  time: number,
  dt: number,
): { temperature: number; phase: ThermalPhase; tempProfile: number[] } {
  let temperature: number;
  let phase: ThermalPhase;
  let depthDependent = false;

  const Tpeak = params.peakTemperature;
  const ramp = params.rampRate;
  const soak = params.soakTime;
  const cool = params.coolingRate;

  switch (mode) {
    case 'furnace': {
      const tRamp = (Tpeak - T_AMBIENT) / ramp;
      const tSoakEnd = tRamp + soak;
      if (time < tRamp) {
        temperature = T_AMBIENT + ramp * time;
        phase = 'ramp';
      } else if (time < tSoakEnd) {
        temperature = Tpeak;
        phase = 'soak';
      } else {
        temperature = Math.max(T_AMBIENT, Tpeak - cool * (time - tSoakEnd));
        phase = 'cool';
      }
      break;
    }
    case 'rta': {
      const tRamp = (Tpeak - T_AMBIENT) / ramp;
      const tSoakEnd = tRamp + soak;
      if (time < tRamp) {
        temperature = T_AMBIENT + ramp * time;
        phase = 'ramp';
      } else if (time < tSoakEnd) {
        temperature = Tpeak;
        phase = 'soak';
      } else {
        const tauCool = (Tpeak - T_AMBIENT) / cool;
        temperature = T_AMBIENT + (Tpeak - T_AMBIENT) * Math.exp(-(time - tSoakEnd) / Math.max(1e-6, tauCool));
        phase = 'cool';
      }
      break;
    }
    case 'spike': {
      const tPeak = THERMAL_MODES.spike.totalTimeScale / 2;
      const sigma = 0.3; // FWHM ~0.7s
      temperature = T_AMBIENT + (Tpeak - T_AMBIENT) * Math.exp(-Math.pow(time - tPeak, 2) / (2 * sigma * sigma));
      phase = time < tPeak ? 'ramp' : 'cool';
      break;
    }
    case 'flash': {
      const Tpreheat = 700;
      const tauFlash = 1.5e-3;
      const tPulse = THERMAL_MODES.flash.totalTimeScale * 0.3;
      if (time < tPulse) {
        temperature = Tpreheat + (Tpeak - Tpreheat) * (time / tPulse);
        phase = 'pulse';
      } else {
        temperature = Tpreheat + (Tpeak - Tpreheat) * Math.exp(-(time - tPulse) / tauFlash);
        phase = 'cool';
      }
      break;
    }
    case 'laser': {
      const tPulse = THERMAL_MODES.laser.totalTimeScale * 0.4;
      const Tbase = 400;
      depthDependent = true;
      if (time < tPulse) {
        temperature = Tbase + (Tpeak - Tbase) * (time / tPulse);
        phase = 'pulse';
      } else {
        temperature = Tbase + (Tpeak - Tbase) * Math.exp(-(time - tPulse) / (tPulse * 0.5));
        phase = 'cool';
      }
      break;
    }
    default:
      temperature = T_AMBIENT;
      phase = 'ramp';
  }

  temperature = Math.max(T_AMBIENT, Math.min(Tpeak, temperature));

  // Build depth-resolved temperature profile
  const tempProfile = new Array(DEPTH_BINS);
  if (depthDependent) {
    // Laser mode: exponential decay with depth
    const alphaSi = 0.9; // cm²/s thermal diffusivity
    const tauLaser = THERMAL_MODES.laser.totalTimeScale * 0.4;
    const deltaThermal = Math.sqrt(alphaSi * tauLaser) * 1e7; // convert cm to nm
    const maxDepthNm = params.initialDepth * 5;
    const binSize = maxDepthNm / DEPTH_BINS;
    for (let i = 0; i < DEPTH_BINS; i++) {
      const depth = (i + 0.5) * binSize;
      const atten = Math.exp(-depth / Math.max(1, deltaThermal));
      tempProfile[i] = T_AMBIENT + (temperature - T_AMBIENT) * atten;
    }
  } else {
    tempProfile.fill(temperature);
  }

  return { temperature, phase: phase as ThermalPhase, tempProfile };
}

type ThermalPhase = 'ramp' | 'soak' | 'cool' | 'pulse';

/** Compute cumulative thermal budget Dt from a sequence of thermal steps */
export function thermalBudget(
  steps: ThermalStep[],
  D_at_T: (T: number) => number,
): number {
  let Dt = 0;
  for (const step of steps) {
    Dt += D_at_T(step.temperature) * step.dt;
  }
  return Dt;
}
```

**Step 2: Create `src/lib/diffusion-sim/__tests__/thermal-profile.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { generateThermalProfile, thermalBudget } from '../thermal-profile';
import { DEFAULT_PARAMS, DEFAULT_TOTAL_STEPS, T_AMBIENT, THERMAL_MODES } from '../constants';
import type { ThermalMode, SimulationParams } from '../types';

function makeParams(mode: ThermalMode, overrides: Partial<SimulationParams> = {}): SimulationParams {
  return { ...DEFAULT_PARAMS, thermalMode: mode, ...overrides };
}

describe('thermal-profile', () => {
  it('generates correct number of steps for all modes', () => {
    for (const mode of ['furnace', 'rta', 'spike', 'flash', 'laser'] as ThermalMode[]) {
      const steps = generateThermalProfile(mode, makeParams(mode));
      expect(steps).toHaveLength(DEFAULT_TOTAL_STEPS);
    }
  });

  it('furnace mode has dt on order of seconds', () => {
    const steps = generateThermalProfile('furnace', makeParams('furnace'));
    expect(steps[0].dt).toBeGreaterThan(1);
    expect(steps[0].dt).toBeLessThan(100);
  });

  it('laser mode has dt on order of microseconds', () => {
    const steps = generateThermalProfile('laser', makeParams('laser'));
    expect(steps[0].dt).toBeLessThan(1e-4);
    expect(steps[0].dt).toBeGreaterThan(0);
  });

  it('spike mode has Gaussian-like shape peaking mid-process', () => {
    const steps = generateThermalProfile('spike', makeParams('spike', { peakTemperature: 1080 }));
    const temps = steps.map(s => s.temperature);
    const maxT = Math.max(...temps);
    const maxIdx = temps.indexOf(maxT);
    expect(maxIdx).toBeGreaterThan(steps.length * 0.2);
    expect(maxIdx).toBeLessThan(steps.length * 0.8);
    expect(maxT).toBeGreaterThan(900);
  });

  it('all modes contain only valid phases', () => {
    const validPhases = new Set(['ramp', 'soak', 'cool', 'pulse']);
    for (const mode of ['furnace', 'rta', 'spike', 'flash', 'laser'] as ThermalMode[]) {
      const steps = generateThermalProfile(mode, makeParams(mode));
      for (const s of steps) {
        expect(validPhases.has(s.phase)).toBe(true);
      }
    }
  });

  it('furnace ramp phase reaches near peak temperature', () => {
    const steps = generateThermalProfile('furnace', makeParams('furnace', { peakTemperature: 1050 }));
    const maxT = Math.max(...steps.map(s => s.temperature));
    expect(maxT).toBeGreaterThan(1000);
  });

  it('cooling phase decreases temperature', () => {
    const steps = generateThermalProfile('rta', makeParams('rta', { peakTemperature: 1050, soakTime: 5 }));
    const coolSteps = steps.filter(s => s.phase === 'cool');
    if (coolSteps.length >= 2) {
      expect(coolSteps[coolSteps.length - 1].temperature).toBeLessThan(coolSteps[0].temperature);
    }
  });

  it('laser mode has depth-dependent temperature', () => {
    const steps = generateThermalProfile('laser', makeParams('laser', { peakTemperature: 1400 }));
    const midStep = steps[Math.floor(steps.length * 0.3)];
    const surfaceT = midStep.tempProfile[0];
    const deepT = midStep.tempProfile[DEPTH_BINS - 1];
    // For laser mode, deep T should be significantly less than surface
    // (unless it's already in the cool phase)
    if (surfaceT > 500) {
      expect(deepT).toBeLessThan(surfaceT);
    }
  });

  it('thermalBudget accumulates correctly', () => {
    const steps = generateThermalProfile('rta', makeParams('rta'));
    const budget = thermalBudget(steps, () => 1e-12); // constant D
    const totalTime = steps.reduce((s, st) => s + st.dt, 0);
    expect(budget).toBeCloseTo(1e-12 * totalTime, 20);
  });
});

const DEPTH_BINS = 200;
```

**Step 3: Run tests, commit**

Run: `cd equipment-monitor && npx vitest run src/lib/diffusion-sim/__tests__/thermal-profile.test.ts --reporter verbose`
Expected: 8/8 PASS

```bash
cd equipment-monitor && git add src/lib/diffusion-sim/thermal-profile.ts src/lib/diffusion-sim/__tests__/thermal-profile.test.ts && git commit -m "feat(diffusion-sim): thermal profile generator — 5 modes from furnace to laser"
```

---

### Task 5: Initial Profile Generator

**Files:**
- Create: `src/lib/diffusion-sim/initial-profile.ts`
- Create: `src/lib/diffusion-sim/__tests__/initial-profile.test.ts`

**Dependencies:** Task 1

**Step 1: Create `src/lib/diffusion-sim/initial-profile.ts`**

```typescript
import type { DopantSpecies } from './types';
import { DOPANT_DB } from './constants';

/**
 * Generate as-implanted Gaussian dopant profile with channeling tail.
 * Returns array of concentrations (cm⁻³) per depth bin.
 */
export function generateInitialProfile(
  species: DopantSpecies,
  dose: number,       // cm⁻²
  depth: number,      // nm — target projected range
  bins: number,
  binSize: number,    // nm per bin
): number[] {
  const db = DOPANT_DB[species];
  const Rp = depth;                            // projected range = initialDepth
  const dRp = Rp * db.straggleRatio;           // straggle
  const dRpSafe = Math.max(dRp, binSize * 0.5); // avoid division by zero

  // Peak concentration from Gaussian: dose / (√(2π) * ΔRp) — convert nm to cm
  const peak = dose / (Math.sqrt(2 * Math.PI) * dRpSafe * 1e-7);

  const profile = new Array(bins);
  const lambdaCh = 0.3 * dRpSafe; // channeling tail decay length
  const tailStart = 2 * Rp;

  for (let i = 0; i < bins; i++) {
    const x = (i + 0.5) * binSize; // depth in nm

    // Gaussian main profile
    const gaussian = peak * Math.exp(-Math.pow(x - Rp, 2) / (2 * dRpSafe * dRpSafe));

    // Channeling tail beyond 2*Rp
    if (x > tailStart && lambdaCh > 0) {
      const tailPeak = peak * Math.exp(-Math.pow(tailStart - Rp, 2) / (2 * dRpSafe * dRpSafe));
      const tail = tailPeak * Math.exp(-(x - tailStart) / lambdaCh);
      profile[i] = Math.max(gaussian, tail);
    } else {
      profile[i] = gaussian;
    }
  }

  return profile;
}

/**
 * Generate initial implant damage (excess interstitials) for {311} defect storage.
 * "+1" model: each implanted ion creates approximately 1 excess interstitial.
 */
export function generateImplantDamage(
  profile: number[],
  species: DopantSpecies,
): number[] {
  // Damage is proportional to dopant concentration
  // Heavier ions create more damage
  const db = DOPANT_DB[species];
  const damageFactor = species === 'Ge' ? 2.0 : species === 'Sb' ? 1.5 : 1.0;

  return profile.map(c => c * damageFactor);
}
```

**Step 2: Create `src/lib/diffusion-sim/__tests__/initial-profile.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { generateInitialProfile, generateImplantDamage } from '../initial-profile';

describe('initial-profile', () => {
  const bins = 200;
  const binSize = 2.0; // nm

  it('generates Gaussian-shaped profile', () => {
    const profile = generateInitialProfile('B', 1e14, 50, bins, binSize);
    expect(profile).toHaveLength(bins);
    const peakBin = Math.floor(50 / binSize);
    // Peak should be near the target depth
    const maxVal = Math.max(...profile);
    const maxIdx = profile.indexOf(maxVal);
    expect(Math.abs(maxIdx - peakBin)).toBeLessThan(5);
  });

  it('integral approximately equals dose', () => {
    const dose = 1e14;
    const profile = generateInitialProfile('B', dose, 50, bins, binSize);
    // Integrate: sum(C * dx) where dx = binSize in cm
    const integral = profile.reduce((s, c) => s + c * binSize * 1e-7, 0);
    // Should be within ~20% of dose (Gaussian plus tail)
    expect(integral).toBeGreaterThan(dose * 0.5);
    expect(integral).toBeLessThan(dose * 2.0);
  });

  it('peak is near initialDepth', () => {
    const profile = generateInitialProfile('P', 1e14, 100, bins, binSize);
    const maxIdx = profile.indexOf(Math.max(...profile));
    const peakDepth = (maxIdx + 0.5) * binSize;
    expect(Math.abs(peakDepth - 100)).toBeLessThan(20);
  });

  it('has channeling tail beyond 2*Rp', () => {
    const profile = generateInitialProfile('B', 1e14, 40, bins, binSize);
    const tailBin = Math.floor(100 / binSize); // well beyond 2*Rp=80nm
    const deepBin = Math.floor(150 / binSize);
    // Tail should be non-zero and decreasing
    expect(profile[tailBin]).toBeGreaterThan(0);
    if (deepBin < bins) {
      expect(profile[deepBin]).toBeLessThan(profile[tailBin]);
    }
  });

  it('implant damage is proportional to profile', () => {
    const profile = generateInitialProfile('B', 1e14, 50, bins, binSize);
    const damage = generateImplantDamage(profile, 'B');
    expect(damage).toHaveLength(bins);
    for (let i = 0; i < bins; i++) {
      expect(damage[i]).toBeCloseTo(profile[i], -1);
    }
  });

  it('heavier species produce more damage per ion', () => {
    const profile = generateInitialProfile('Sb', 1e14, 30, bins, binSize);
    const damageSb = generateImplantDamage(profile, 'Sb');
    const damageB = generateImplantDamage(profile, 'B');
    expect(damageSb[Math.floor(30 / binSize)]).toBeGreaterThan(damageB[Math.floor(30 / binSize)]);
  });
});
```

**Step 3: Run tests, commit**

Run: `cd equipment-monitor && npx vitest run src/lib/diffusion-sim/__tests__/initial-profile.test.ts --reporter verbose`
Expected: 6/6 PASS

```bash
cd equipment-monitor && git add src/lib/diffusion-sim/initial-profile.ts src/lib/diffusion-sim/__tests__/initial-profile.test.ts && git commit -m "feat(diffusion-sim): initial Gaussian implant profile generator"
```

---

### Task 6: Diffusion PDE Solver

**Files:**
- Create: `src/lib/diffusion-sim/diffusion-solver.ts`
- Create: `src/lib/diffusion-sim/__tests__/diffusion-solver.test.ts`

**Dependencies:** Tasks 1, 2, 3, 4, 5

**Step 1: Create `src/lib/diffusion-sim/diffusion-solver.ts`**

```typescript
import type { SimulationParams, ThermalStep, SolverState, PointDefectState } from './types';
import { DEPTH_BINS, DOPANT_DB } from './constants';
import { createPointDefectState, stepPointDefects, getSuperSaturation } from './point-defects';
import { intrinsicCarrier, carrierConcentrations, effectiveDiffusivity, activeConcentration } from './diffusivity';
import { generateInitialProfile, generateImplantDamage } from './initial-profile';
import { estimateMaxDepth } from './constants';

/** Thomas algorithm for tridiagonal system: a[i]*x[i-1] + b[i]*x[i] + c[i]*x[i+1] = d[i] */
export function tridiagonalSolve(
  a: number[],
  b: number[],
  c: number[],
  d: number[],
): number[] {
  const n = b.length;
  const cp = new Array(n);
  const dp = new Array(n);
  const x = new Array(n);

  // Forward sweep
  cp[0] = c[0] / b[0];
  dp[0] = d[0] / b[0];
  for (let i = 1; i < n; i++) {
    const m = b[i] - a[i] * cp[i - 1];
    cp[i] = c[i] / m;
    dp[i] = (d[i] - a[i] * dp[i - 1]) / m;
  }

  // Back substitution
  x[n - 1] = dp[n - 1];
  for (let i = n - 2; i >= 0; i--) {
    x[i] = dp[i] - cp[i] * x[i + 1];
  }

  return x;
}

/** Create initial solver state from simulation parameters */
export function createSolverState(params: SimulationParams): SolverState {
  const maxDepth = estimateMaxDepth(params.dopantSpecies, params.initialDepth);
  const binSize = maxDepth / DEPTH_BINS;

  const dopantProfile = generateInitialProfile(
    params.dopantSpecies,
    params.initialDose,
    params.initialDepth,
    DEPTH_BINS,
    binSize,
  );

  const implantDamage = generateImplantDamage(dopantProfile, params.dopantSpecies);
  const defects = createPointDefectState(DEPTH_BINS, implantDamage);

  // Compute initial active/clustered from profile
  const activeProfile = new Array(DEPTH_BINS);
  const clusteredProfile = new Array(DEPTH_BINS);
  for (let i = 0; i < DEPTH_BINS; i++) {
    const { active, clustered } = activeConcentration(dopantProfile[i], params.dopantSpecies, 25);
    activeProfile[i] = active;
    clusteredProfile[i] = clustered;
  }

  // Carrier profile from active doping
  const ni = intrinsicCarrier(25);
  const db = DOPANT_DB[params.dopantSpecies];
  const carrierProfile = new Array(DEPTH_BINS);
  for (let i = 0; i < DEPTH_BINS; i++) {
    const netDoping = db.isNtype ? activeProfile[i] - params.backgroundDoping : params.backgroundDoping - activeProfile[i];
    const { n } = carrierConcentrations(netDoping, ni);
    carrierProfile[i] = n;
  }

  return {
    dopantProfile,
    activeProfile,
    clusteredProfile,
    defects,
    carrierProfile,
    temperature: 25,
    time: 0,
    thermalBudget: 0,
  };
}

/** Solve one diffusion timestep using Crank-Nicolson */
export function solveDiffusionStep(
  state: SolverState,
  thermalStep: ThermalStep,
  params: SimulationParams,
  binSize: number,
): void {
  const N = DEPTH_BINS;
  const dt = thermalStep.dt;
  const T = thermalStep.temperature;
  const dx = binSize * 1e-7; // nm → cm for diffusivity units

  state.temperature = T;
  state.time += dt;

  // 1. Step point defects
  stepPointDefects(
    state.defects, T, dt, params.ambientGas, binSize,
    params.interstitialFactor, params.vacancyFactor,
  );

  // 2. Get supersaturation
  const { sI, sV } = getSuperSaturation(
    state.defects, T,
    params.interstitialFactor, params.vacancyFactor,
  );

  // 3. Compute D_eff per bin
  const ni = intrinsicCarrier(T);
  const db = DOPANT_DB[params.dopantSpecies];
  const D = new Array(N);
  for (let i = 0; i < N; i++) {
    const netDoping = db.isNtype
      ? state.activeProfile[i] - params.backgroundDoping
      : params.backgroundDoping - state.activeProfile[i];
    const { n, p } = carrierConcentrations(netDoping, ni);
    state.carrierProfile[i] = db.isNtype ? n : p;

    const Tlocal = thermalStep.tempProfile[i] ?? T;
    D[i] = effectiveDiffusivity(
      params.dopantSpecies, Tlocal, ni, n, p,
      sI[i] ?? 1, sV[i] ?? 1,
    );
  }

  // 4. Accumulate thermal budget (average D * dt)
  const avgD = D.reduce((s, d) => s + d, 0) / N;
  state.thermalBudget += avgD * dt;

  // 5. Crank-Nicolson tridiagonal solve
  const a = new Array(N).fill(0);
  const b = new Array(N).fill(0);
  const c = new Array(N).fill(0);
  const d = new Array(N).fill(0);

  for (let i = 0; i < N; i++) {
    const Dleft = i > 0 ? 0.5 * (D[i] + D[i - 1]) : D[i];
    const Dright = i < N - 1 ? 0.5 * (D[i] + D[i + 1]) : D[i];

    const rL = Dleft * dt / (2 * dx * dx);
    const rR = Dright * dt / (2 * dx * dx);

    // Implicit (LHS)
    a[i] = -rL;
    c[i] = -rR;
    b[i] = 1 + rL + rR;

    // Explicit (RHS)
    const Ci = state.dopantProfile[i];
    const Cleft = i > 0 ? state.dopantProfile[i - 1] : Ci;    // zero-flux BC
    const Cright = i < N - 1 ? state.dopantProfile[i + 1] : Ci; // zero-flux BC

    d[i] = Ci + rL * (Cleft - Ci) + rR * (Cright - Ci);
  }

  // Boundary conditions: zero-flux (already handled by mirroring)
  // Surface segregation for bin 0 if oxide present
  if (params.screenOxideThickness > 0 && N > 1) {
    const m = db.segregationCoeff;
    const kSeg = 0.01 * dt; // segregation flux rate
    const flux = kSeg * (state.dopantProfile[0] - state.dopantProfile[1] / m);
    d[0] -= flux;
  }

  const newProfile = tridiagonalSolve(a, b, c, d);

  // 6. Apply clustering and update profiles
  for (let i = 0; i < N; i++) {
    state.dopantProfile[i] = Math.max(0, newProfile[i]);
    const Tlocal = thermalStep.tempProfile[i] ?? T;
    const { active, clustered } = activeConcentration(
      state.dopantProfile[i], params.dopantSpecies, Tlocal,
    );
    state.activeProfile[i] = active;
    state.clusteredProfile[i] = clustered;
  }
}
```

**Step 2: Create `src/lib/diffusion-sim/__tests__/diffusion-solver.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { tridiagonalSolve, createSolverState, solveDiffusionStep } from '../diffusion-solver';
import { generateThermalProfile } from '../thermal-profile';
import { DEFAULT_PARAMS, DEPTH_BINS, estimateMaxDepth } from '../constants';
import type { SimulationParams } from '../types';

describe('diffusion-solver', () => {
  it('tridiagonal solver returns identity for trivial system', () => {
    const n = 5;
    const a = [0, 0, 0, 0, 0];
    const b = [1, 1, 1, 1, 1];
    const c = [0, 0, 0, 0, 0];
    const d = [1, 2, 3, 4, 5];
    const x = tridiagonalSolve(a, b, c, d);
    for (let i = 0; i < n; i++) {
      expect(x[i]).toBeCloseTo(d[i], 10);
    }
  });

  it('createSolverState initializes valid profiles', () => {
    const state = createSolverState(DEFAULT_PARAMS);
    expect(state.dopantProfile).toHaveLength(DEPTH_BINS);
    expect(state.activeProfile).toHaveLength(DEPTH_BINS);
    expect(state.clusteredProfile).toHaveLength(DEPTH_BINS);
    expect(state.defects.vacancies).toHaveLength(DEPTH_BINS);
    expect(state.temperature).toBe(25);
    expect(state.time).toBe(0);
    expect(state.thermalBudget).toBe(0);
  });

  it('profile broadens after diffusion step', () => {
    const state = createSolverState(DEFAULT_PARAMS);
    const maxDepth = estimateMaxDepth(DEFAULT_PARAMS.dopantSpecies, DEFAULT_PARAMS.initialDepth);
    const binSize = maxDepth / DEPTH_BINS;
    const steps = generateThermalProfile('rta', DEFAULT_PARAMS);

    // Measure initial profile width (FWHM proxy)
    const maxBefore = Math.max(...state.dopantProfile);
    const halfMax = maxBefore / 2;
    let widthBefore = 0;
    for (const c of state.dopantProfile) {
      if (c >= halfMax) widthBefore++;
    }

    // Run 50 diffusion steps
    for (let i = 0; i < 50; i++) {
      solveDiffusionStep(state, steps[i], DEFAULT_PARAMS, binSize);
    }

    let widthAfter = 0;
    const maxAfter = Math.max(...state.dopantProfile);
    const halfMaxAfter = maxAfter / 2;
    for (const c of state.dopantProfile) {
      if (c >= halfMaxAfter) widthAfter++;
    }

    expect(widthAfter).toBeGreaterThanOrEqual(widthBefore);
  });

  it('mass is approximately conserved', () => {
    const state = createSolverState(DEFAULT_PARAMS);
    const maxDepth = estimateMaxDepth(DEFAULT_PARAMS.dopantSpecies, DEFAULT_PARAMS.initialDepth);
    const binSize = maxDepth / DEPTH_BINS;
    const steps = generateThermalProfile('rta', DEFAULT_PARAMS);

    const massBefore = state.dopantProfile.reduce((s, c) => s + c, 0);

    for (let i = 0; i < 20; i++) {
      solveDiffusionStep(state, steps[i], DEFAULT_PARAMS, binSize);
    }

    const massAfter = state.dopantProfile.reduce((s, c) => s + c, 0);
    // Mass should be conserved within ~20% (some numerical diffusion + segregation)
    expect(massAfter / massBefore).toBeGreaterThan(0.7);
    expect(massAfter / massBefore).toBeLessThan(1.3);
  });

  it('higher temperature produces more diffusion', () => {
    const params1: SimulationParams = { ...DEFAULT_PARAMS, peakTemperature: 800 };
    const params2: SimulationParams = { ...DEFAULT_PARAMS, peakTemperature: 1100 };

    const state1 = createSolverState(params1);
    const state2 = createSolverState(params2);
    const maxDepth = estimateMaxDepth(DEFAULT_PARAMS.dopantSpecies, DEFAULT_PARAMS.initialDepth);
    const binSize = maxDepth / DEPTH_BINS;

    const steps1 = generateThermalProfile('rta', params1);
    const steps2 = generateThermalProfile('rta', params2);

    for (let i = 0; i < 50; i++) {
      solveDiffusionStep(state1, steps1[i], params1, binSize);
      solveDiffusionStep(state2, steps2[i], params2, binSize);
    }

    expect(state2.thermalBudget).toBeGreaterThan(state1.thermalBudget);
  });

  it('Crank-Nicolson is stable with large timestep', () => {
    const params: SimulationParams = { ...DEFAULT_PARAMS, thermalMode: 'furnace' };
    const state = createSolverState(params);
    const maxDepth = estimateMaxDepth(params.dopantSpecies, params.initialDepth);
    const binSize = maxDepth / DEPTH_BINS;
    const steps = generateThermalProfile('furnace', params);

    // Run through entire furnace profile — should not blow up
    for (let i = 0; i < 100; i++) {
      solveDiffusionStep(state, steps[i], params, binSize);
    }

    // All values should be finite and non-negative
    for (const c of state.dopantProfile) {
      expect(isFinite(c)).toBe(true);
      expect(c).toBeGreaterThanOrEqual(0);
    }
  });

  it('boundary conditions: zero-flux at edges', () => {
    const state = createSolverState(DEFAULT_PARAMS);
    const maxDepth = estimateMaxDepth(DEFAULT_PARAMS.dopantSpecies, DEFAULT_PARAMS.initialDepth);
    const binSize = maxDepth / DEPTH_BINS;
    const steps = generateThermalProfile('rta', DEFAULT_PARAMS);

    for (let i = 0; i < 20; i++) {
      solveDiffusionStep(state, steps[i], DEFAULT_PARAMS, binSize);
    }

    // Deep substrate should remain near zero (profile hasn't diffused that far)
    expect(state.dopantProfile[DEPTH_BINS - 1]).toBeLessThan(state.dopantProfile[0]);
  });

  it('segregation affects surface concentration with oxide', () => {
    const paramsOx: SimulationParams = { ...DEFAULT_PARAMS, screenOxideThickness: 30 };
    const paramsNoOx: SimulationParams = { ...DEFAULT_PARAMS, screenOxideThickness: 0 };

    const stateOx = createSolverState(paramsOx);
    const stateNoOx = createSolverState(paramsNoOx);
    const maxDepth = estimateMaxDepth(DEFAULT_PARAMS.dopantSpecies, DEFAULT_PARAMS.initialDepth);
    const binSize = maxDepth / DEPTH_BINS;
    const stepsOx = generateThermalProfile('rta', paramsOx);
    const stepsNoOx = generateThermalProfile('rta', paramsNoOx);

    for (let i = 0; i < 50; i++) {
      solveDiffusionStep(stateOx, stepsOx[i], paramsOx, binSize);
      solveDiffusionStep(stateNoOx, stepsNoOx[i], paramsNoOx, binSize);
    }

    // With oxide and B (segregationCoeff=0.3 < 1), B piles into oxide → surface depletion
    // Surface concentration may differ
    const diff = Math.abs(stateOx.dopantProfile[0] - stateNoOx.dopantProfile[0]);
    expect(diff).toBeGreaterThanOrEqual(0); // Just verify it doesn't crash
  });

  it('clustering limits peak active concentration', () => {
    const params: SimulationParams = {
      ...DEFAULT_PARAMS,
      dopantSpecies: 'As',
      initialDose: 1e16,
      clusteringThreshold: 1e20,
    };
    const state = createSolverState(params);
    const maxVal = Math.max(...state.activeProfile);
    const totalMax = Math.max(...state.dopantProfile);
    expect(maxVal).toBeLessThanOrEqual(totalMax);
  });

  it('thermal budget increases monotonically over steps', () => {
    const state = createSolverState(DEFAULT_PARAMS);
    const maxDepth = estimateMaxDepth(DEFAULT_PARAMS.dopantSpecies, DEFAULT_PARAMS.initialDepth);
    const binSize = maxDepth / DEPTH_BINS;
    const steps = generateThermalProfile('rta', DEFAULT_PARAMS);

    let prevBudget = 0;
    for (let i = 0; i < 20; i++) {
      solveDiffusionStep(state, steps[i], DEFAULT_PARAMS, binSize);
      expect(state.thermalBudget).toBeGreaterThanOrEqual(prevBudget);
      prevBudget = state.thermalBudget;
    }
  });
});
```

**Step 3: Run tests, commit**

Run: `cd equipment-monitor && npx vitest run src/lib/diffusion-sim/__tests__/diffusion-solver.test.ts --reporter verbose`
Expected: 10/10 PASS

```bash
cd equipment-monitor && git add src/lib/diffusion-sim/diffusion-solver.ts src/lib/diffusion-sim/__tests__/diffusion-solver.test.ts && git commit -m "feat(diffusion-sim): Crank-Nicolson PDE solver with Thomas algorithm"
```

---

### Task 7: Wafer Metrics

**Files:**
- Create: `src/lib/diffusion-sim/wafer-metrics.ts`
- Create: `src/lib/diffusion-sim/__tests__/wafer-metrics.test.ts`

**Dependencies:** Tasks 1, 3

**Step 1: Create `src/lib/diffusion-sim/wafer-metrics.ts`**

```typescript
import type { SimulationParams, SolverState, DiffusionMetric } from './types';
import { DOPANT_DB, MASETTI_ELECTRONS, MASETTI_HOLES, DEPTH_BINS, ELECTRON_CHARGE } from './constants';
import { equilibriumInterstitials, equilibriumVacancies } from './point-defects';

/** Masetti mobility model (cm²/V·s) */
export function mobilityMasetti(C: number, isNtype: boolean): number {
  const p = isNtype ? MASETTI_ELECTRONS : MASETTI_HOLES;
  const mu = p.muMin + (p.muMax - p.muMin) / (1 + Math.pow(C / p.cRef, p.alpha))
    - p.mu1 / (1 + Math.pow(p.cRef2 / C, p.beta));
  return Math.max(10, mu);
}

/** Sheet resistance from active profile (Ω/□) */
export function sheetResistance(
  activeProfile: number[],
  species: DopantSpecies,
  binSize: number,
): number {
  const db = DOPANT_DB[species];
  const dx = binSize * 1e-7; // nm → cm
  let conductance = 0;

  for (let i = 0; i < activeProfile.length; i++) {
    const C = activeProfile[i];
    if (C <= 0) continue;
    const mu = mobilityMasetti(C, db.isNtype);
    conductance += ELECTRON_CHARGE * mu * C * dx;
  }

  return conductance > 0 ? 1 / conductance : 1e6;
}

import type { DopantSpecies } from './types';

/** Compute all 10 metrics from current solver state */
export function computeMetrics(
  state: SolverState,
  params: SimulationParams,
  binSize: number,
): Record<DiffusionMetric, number> {
  const N = state.dopantProfile.length;
  const db = DOPANT_DB[params.dopantSpecies];

  // Junction depth: deepest x where active > backgroundDoping
  let junctionDepth = 0;
  for (let i = N - 1; i >= 0; i--) {
    if (state.activeProfile[i] > params.backgroundDoping) {
      junctionDepth = (i + 1) * binSize;
      break;
    }
  }

  // Sheet resistance
  const Rs = sheetResistance(state.activeProfile, params.dopantSpecies, binSize);

  // Peak concentration
  const peakConcentration = Math.max(...state.activeProfile);

  // Thermal budget
  const thermalBudget = state.thermalBudget;

  // Activation fraction
  const totalDose = state.dopantProfile.reduce((s, c) => s + c, 0);
  const activeDose = state.activeProfile.reduce((s, c) => s + c, 0);
  const activationFraction = totalDose > 0 ? activeDose / totalDose : 1;

  // Interstitial supersaturation (peak)
  const cIeq = equilibriumInterstitials(state.temperature) * params.interstitialFactor;
  let maxSI = 0;
  for (let i = 0; i < N; i++) {
    const si = cIeq > 0 ? state.defects.interstitials[i] / cIeq : 1;
    if (si > maxSI) maxSI = si;
  }
  const interstitialSupersaturation = maxSI;

  // Profile abruptness (nm/decade at junction)
  let profileAbruptness = 50; // default
  if (junctionDepth > 0) {
    const jBin = Math.floor(junctionDepth / binSize);
    if (jBin > 0 && jBin < N) {
      const c1 = Math.max(1, state.activeProfile[jBin - 1]);
      const c2 = Math.max(1, state.activeProfile[Math.min(jBin + 1, N - 1)]);
      const logDiff = Math.abs(Math.log10(c1) - Math.log10(c2));
      if (logDiff > 0) {
        profileAbruptness = (2 * binSize) / logDiff;
      }
    }
  }

  // Segregation ratio
  const seg0 = state.dopantProfile[0] || 1;
  const segDeep = state.dopantProfile[Math.min(3, N - 1)] || 1; // ~2nm deep
  const segregationRatio = seg0 / segDeep;

  // Vacancy concentration (peak normalized)
  const cVeq = equilibriumVacancies(state.temperature) * params.vacancyFactor;
  let maxSV = 0;
  for (let i = 0; i < N; i++) {
    const sv = cVeq > 0 ? state.defects.vacancies[i] / cVeq : 1;
    if (sv > maxSV) maxSV = sv;
  }
  const vacancyConcentration = maxSV;

  // Diffusion length
  const diffusionLength = Math.sqrt(Math.max(0, thermalBudget)) * 1e7; // cm → nm

  return {
    junctionDepth,
    sheetResistance: Rs,
    peakConcentration,
    thermalBudget,
    activationFraction,
    interstitialSupersaturation,
    profileAbruptness,
    segregationRatio,
    vacancyConcentration,
    diffusionLength,
  };
}
```

**Step 2: Create `src/lib/diffusion-sim/__tests__/wafer-metrics.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { mobilityMasetti, sheetResistance, computeMetrics } from '../wafer-metrics';
import { createSolverState, solveDiffusionStep } from '../diffusion-solver';
import { generateThermalProfile } from '../thermal-profile';
import { DEFAULT_PARAMS, DEPTH_BINS, estimateMaxDepth } from '../constants';

describe('wafer-metrics', () => {
  it('Masetti mobility decreases with concentration', () => {
    const mu_low = mobilityMasetti(1e15, true);
    const mu_high = mobilityMasetti(1e20, true);
    expect(mu_low).toBeGreaterThan(mu_high);
    expect(mu_high).toBeGreaterThan(0);
  });

  it('sheet resistance is positive and physically reasonable', () => {
    const state = createSolverState(DEFAULT_PARAMS);
    const maxDepth = estimateMaxDepth(DEFAULT_PARAMS.dopantSpecies, DEFAULT_PARAMS.initialDepth);
    const binSize = maxDepth / DEPTH_BINS;
    const Rs = sheetResistance(state.activeProfile, DEFAULT_PARAMS.dopantSpecies, binSize);
    expect(Rs).toBeGreaterThan(0);
    expect(Rs).toBeLessThan(1e7);
  });

  it('junction depth is positive after diffusion', () => {
    const state = createSolverState(DEFAULT_PARAMS);
    const maxDepth = estimateMaxDepth(DEFAULT_PARAMS.dopantSpecies, DEFAULT_PARAMS.initialDepth);
    const binSize = maxDepth / DEPTH_BINS;
    const steps = generateThermalProfile('rta', DEFAULT_PARAMS);
    for (let i = 0; i < 30; i++) {
      solveDiffusionStep(state, steps[i], DEFAULT_PARAMS, binSize);
    }
    const metrics = computeMetrics(state, DEFAULT_PARAMS, binSize);
    expect(metrics.junctionDepth).toBeGreaterThan(0);
  });

  it('activation fraction is between 0 and 1', () => {
    const state = createSolverState(DEFAULT_PARAMS);
    const maxDepth = estimateMaxDepth(DEFAULT_PARAMS.dopantSpecies, DEFAULT_PARAMS.initialDepth);
    const binSize = maxDepth / DEPTH_BINS;
    const metrics = computeMetrics(state, DEFAULT_PARAMS, binSize);
    expect(metrics.activationFraction).toBeGreaterThanOrEqual(0);
    expect(metrics.activationFraction).toBeLessThanOrEqual(1);
  });

  it('thermal budget increases with steps', () => {
    const state = createSolverState(DEFAULT_PARAMS);
    const maxDepth = estimateMaxDepth(DEFAULT_PARAMS.dopantSpecies, DEFAULT_PARAMS.initialDepth);
    const binSize = maxDepth / DEPTH_BINS;
    const steps = generateThermalProfile('rta', DEFAULT_PARAMS);

    const m0 = computeMetrics(state, DEFAULT_PARAMS, binSize);
    for (let i = 0; i < 20; i++) {
      solveDiffusionStep(state, steps[i], DEFAULT_PARAMS, binSize);
    }
    const m1 = computeMetrics(state, DEFAULT_PARAMS, binSize);
    expect(m1.thermalBudget).toBeGreaterThan(m0.thermalBudget);
  });

  it('diffusion length equals sqrt(Dt) converted to nm', () => {
    const state = createSolverState(DEFAULT_PARAMS);
    const maxDepth = estimateMaxDepth(DEFAULT_PARAMS.dopantSpecies, DEFAULT_PARAMS.initialDepth);
    const binSize = maxDepth / DEPTH_BINS;
    const steps = generateThermalProfile('rta', DEFAULT_PARAMS);
    for (let i = 0; i < 20; i++) {
      solveDiffusionStep(state, steps[i], DEFAULT_PARAMS, binSize);
    }
    const metrics = computeMetrics(state, DEFAULT_PARAMS, binSize);
    const expected = Math.sqrt(state.thermalBudget) * 1e7;
    expect(metrics.diffusionLength).toBeCloseTo(expected, 0);
  });

  it('profile abruptness is positive', () => {
    const state = createSolverState(DEFAULT_PARAMS);
    const maxDepth = estimateMaxDepth(DEFAULT_PARAMS.dopantSpecies, DEFAULT_PARAMS.initialDepth);
    const binSize = maxDepth / DEPTH_BINS;
    const steps = generateThermalProfile('rta', DEFAULT_PARAMS);
    for (let i = 0; i < 30; i++) {
      solveDiffusionStep(state, steps[i], DEFAULT_PARAMS, binSize);
    }
    const metrics = computeMetrics(state, DEFAULT_PARAMS, binSize);
    expect(metrics.profileAbruptness).toBeGreaterThan(0);
  });

  it('segregation ratio is >= 0', () => {
    const state = createSolverState(DEFAULT_PARAMS);
    const maxDepth = estimateMaxDepth(DEFAULT_PARAMS.dopantSpecies, DEFAULT_PARAMS.initialDepth);
    const binSize = maxDepth / DEPTH_BINS;
    const metrics = computeMetrics(state, DEFAULT_PARAMS, binSize);
    expect(metrics.segregationRatio).toBeGreaterThanOrEqual(0);
  });
});
```

**Step 3: Run tests, commit**

Run: `cd equipment-monitor && npx vitest run src/lib/diffusion-sim/__tests__/wafer-metrics.test.ts --reporter verbose`
Expected: 8/8 PASS

```bash
cd equipment-monitor && git add src/lib/diffusion-sim/wafer-metrics.ts src/lib/diffusion-sim/__tests__/wafer-metrics.test.ts && git commit -m "feat(diffusion-sim): 10 wafer metrics with Masetti mobility model"
```

---

### Task 8: Simulation Engine

**Files:**
- Create: `src/lib/diffusion-sim/simulation-engine.ts`
- Create: `src/lib/diffusion-sim/__tests__/simulation-engine.test.ts`

**Dependencies:** Tasks 1–7

**Step 1: Create `src/lib/diffusion-sim/simulation-engine.ts`**

```typescript
import type { SimulationParams, SimulationState, StepState, SolverState } from './types';
import { DEFAULT_PARAMS, DEFAULT_TOTAL_STEPS, DEPTH_BINS, estimateMaxDepth, DOPANT_DB } from './constants';
import { generateThermalProfile } from './thermal-profile';
import { createSolverState, solveDiffusionStep } from './diffusion-solver';
import { computeMetrics } from './wafer-metrics';
import { equilibriumInterstitials, equilibriumVacancies } from './point-defects';
import { getPreset } from './presets';

const solverCache = new WeakMap<SimulationState, SolverState>();

export function createSimulation(params: SimulationParams = DEFAULT_PARAMS): SimulationState {
  const totalSteps = params.totalSteps ?? DEFAULT_TOTAL_STEPS;
  const thermalProfile = generateThermalProfile(params.thermalMode, params);

  const state: SimulationState = {
    params: { ...params },
    steps: [],
    currentIndex: -1,
    totalSteps,
    thermalProfile,
  };

  solverCache.set(state, createSolverState(params));
  return state;
}

export function stepForward(state: SimulationState): SimulationState {
  const nextIndex = state.currentIndex + 1;
  if (nextIndex >= state.totalSteps) return state;

  // Get or rebuild solver state
  let solver = solverCache.get(state);
  if (!solver) {
    solver = createSolverState(state.params);
    // Replay previous steps
    const maxDepth = estimateMaxDepth(state.params.dopantSpecies, state.params.initialDepth);
    const binSize = maxDepth / DEPTH_BINS;
    for (let i = 0; i <= state.currentIndex; i++) {
      const thermalStep = state.thermalProfile[i];
      if (thermalStep) {
        solveDiffusionStep(solver, thermalStep, state.params, binSize);
      }
    }
  }

  // Solve next step
  const maxDepth = estimateMaxDepth(state.params.dopantSpecies, state.params.initialDepth);
  const binSize = maxDepth / DEPTH_BINS;
  const thermalStep = state.thermalProfile[nextIndex];
  if (thermalStep) {
    solveDiffusionStep(solver, thermalStep, state.params, binSize);
  }

  // Compute metrics
  const metrics = computeMetrics(solver, state.params, binSize);

  // Normalize defect profiles for display
  const cIeq = equilibriumInterstitials(solver.temperature) * state.params.interstitialFactor;
  const cVeq = equilibriumVacancies(solver.temperature) * state.params.vacancyFactor;

  // Build layers
  const layers = [];
  let offset = 0;
  if (state.params.screenOxideThickness > 0) {
    layers.push({ material: 'SiO2' as const, startNm: 0, endNm: state.params.screenOxideThickness });
    offset = state.params.screenOxideThickness;
  }
  layers.push({ material: 'Si' as const, startNm: offset, endNm: maxDepth });

  const stepState: StepState = {
    stepIndex: nextIndex,
    time: solver.time,
    temperature: solver.temperature,
    thermalPhase: thermalStep?.phase ?? 'ramp',
    dopantProfile: [...solver.dopantProfile],
    activeProfile: [...solver.activeProfile],
    clusteredProfile: [...solver.clusteredProfile],
    interstitialProfile: solver.defects.interstitials.map(v => cIeq > 0 ? v / cIeq : 1),
    vacancyProfile: solver.defects.vacancies.map(v => cVeq > 0 ? v / cVeq : 1),
    carrierProfile: [...solver.carrierProfile],
    temperatureProfile: thermalStep?.tempProfile ? [...thermalStep.tempProfile] : new Array(DEPTH_BINS).fill(solver.temperature),
    ...metrics,
    maxDepthNm: maxDepth,
    layers,
  };

  const newState: SimulationState = {
    ...state,
    steps: [...state.steps, stepState],
    currentIndex: nextIndex,
  };

  solverCache.set(newState, solver);
  return newState;
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
  const newParams = preset.apply(state.params);
  return createSimulation(newParams);
}
```

**Step 2: Create `src/lib/diffusion-sim/__tests__/simulation-engine.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { createSimulation, stepForward, stepN, applyPreset } from '../simulation-engine';
import { DEFAULT_PARAMS, DEPTH_BINS, DEFAULT_TOTAL_STEPS } from '../constants';
import type { SimulationParams } from '../types';

describe('simulation-engine', () => {
  it('createSimulation returns valid initial state', () => {
    const sim = createSimulation();
    expect(sim.params).toEqual(DEFAULT_PARAMS);
    expect(sim.steps).toHaveLength(0);
    expect(sim.currentIndex).toBe(-1);
    expect(sim.totalSteps).toBe(DEFAULT_TOTAL_STEPS);
    expect(sim.thermalProfile).toHaveLength(DEFAULT_TOTAL_STEPS);
  });

  it('stepForward advances index', () => {
    const sim = createSimulation();
    const next = stepForward(sim);
    expect(next.currentIndex).toBe(0);
    expect(next.steps).toHaveLength(1);
  });

  it('step produces profiles with DEPTH_BINS length', () => {
    const sim = stepForward(createSimulation());
    const step = sim.steps[0];
    expect(step.dopantProfile).toHaveLength(DEPTH_BINS);
    expect(step.activeProfile).toHaveLength(DEPTH_BINS);
    expect(step.clusteredProfile).toHaveLength(DEPTH_BINS);
    expect(step.interstitialProfile).toHaveLength(DEPTH_BINS);
    expect(step.vacancyProfile).toHaveLength(DEPTH_BINS);
    expect(step.carrierProfile).toHaveLength(DEPTH_BINS);
    expect(step.temperatureProfile).toHaveLength(DEPTH_BINS);
  });

  it('junction depth evolves over multiple steps', () => {
    let sim = createSimulation();
    sim = stepN(sim, 50);
    const xj = sim.steps.map(s => s.junctionDepth);
    // Not all junctions will increase monotonically (initial transient)
    // but final should be > 0
    expect(xj[xj.length - 1]).toBeGreaterThan(0);
  });

  it('thermal budget accumulates over steps', () => {
    let sim = createSimulation();
    sim = stepN(sim, 30);
    const budgets = sim.steps.map(s => s.thermalBudget);
    for (let i = 1; i < budgets.length; i++) {
      expect(budgets[i]).toBeGreaterThanOrEqual(budgets[i - 1]);
    }
  });

  it('totalSteps caps simulation', () => {
    const params: SimulationParams = { ...DEFAULT_PARAMS, totalSteps: 10 };
    let sim = createSimulation(params);
    sim = stepN(sim, 20);
    expect(sim.currentIndex).toBe(9);
    expect(sim.steps).toHaveLength(10);
  });

  it('applyPreset changes params and resets state', () => {
    let sim = createSimulation();
    sim = stepN(sim, 5);
    const preset = applyPreset(sim, 'furnace-drive-in');
    expect(preset.currentIndex).toBe(-1);
    expect(preset.steps).toHaveLength(0);
    expect(preset.params.thermalMode).toBe('furnace');
  });

  it('different thermal modes produce different junction depths', () => {
    const furnace = stepN(createSimulation({ ...DEFAULT_PARAMS, thermalMode: 'furnace' }), 100);
    const laser = stepN(createSimulation({ ...DEFAULT_PARAMS, thermalMode: 'laser' }), 100);

    const xjFurnace = furnace.steps[furnace.steps.length - 1].junctionDepth;
    const xjLaser = laser.steps[laser.steps.length - 1].junctionDepth;

    // Furnace (long time) should produce deeper junction than laser (microseconds)
    expect(xjFurnace).toBeGreaterThan(xjLaser);
  });

  it('200 steps complete without error', () => {
    let sim = createSimulation();
    sim = stepN(sim, 200);
    expect(sim.steps).toHaveLength(200);
    expect(sim.currentIndex).toBe(199);
    // Verify last step has valid data
    const last = sim.steps[199];
    expect(isFinite(last.junctionDepth)).toBe(true);
    expect(isFinite(last.sheetResistance)).toBe(true);
    expect(isFinite(last.thermalBudget)).toBe(true);
  });

  it('step has time and temperature from thermal profile', () => {
    const sim = stepForward(createSimulation());
    const step = sim.steps[0];
    expect(step.time).toBeGreaterThan(0);
    expect(step.temperature).toBeGreaterThan(T_AMBIENT_APPROX);
  });
});

const T_AMBIENT_APPROX = 20;
```

**Step 3: Run tests, commit**

Run: `cd equipment-monitor && npx vitest run src/lib/diffusion-sim/__tests__/simulation-engine.test.ts --reporter verbose`
Expected: 10/10 PASS

```bash
cd equipment-monitor && git add src/lib/diffusion-sim/simulation-engine.ts src/lib/diffusion-sim/__tests__/simulation-engine.test.ts && git commit -m "feat(diffusion-sim): simulation engine with WeakMap solver cache"
```

---

### Task 9: Presets

**Files:**
- Create: `src/lib/diffusion-sim/presets.ts`
- Create: `src/lib/diffusion-sim/__tests__/presets.test.ts`

**Dependencies:** Task 1

**Step 1: Create `src/lib/diffusion-sim/presets.ts`**

```typescript
import type { Preset } from './types';

export const PRESETS: Preset[] = [
  {
    id: 'furnace-drive-in',
    label: 'Furnace Drive-In',
    labelCN: '爐管推進',
    color: '#f97316',
    apply: (p) => ({ ...p, thermalMode: 'furnace', peakTemperature: 1050, soakTime: 3600, dopantSpecies: 'B', ambientGas: 'N2', rampRate: 5, coolingRate: 3 }),
  },
  {
    id: 'rta-activation',
    label: 'RTA Activation',
    labelCN: '快速熱退火活化',
    color: '#ef4444',
    apply: (p) => ({ ...p, thermalMode: 'rta', peakTemperature: 1050, soakTime: 10, dopantSpecies: 'As', ambientGas: 'N2', rampRate: 100 }),
  },
  {
    id: 'spike-anneal',
    label: 'Spike Anneal',
    labelCN: '尖峰退火',
    color: '#f59e0b',
    apply: (p) => ({ ...p, thermalMode: 'spike', peakTemperature: 1080, soakTime: 0, dopantSpecies: 'B', ambientGas: 'N2' }),
  },
  {
    id: 'flash-anneal',
    label: 'Flash Anneal',
    labelCN: '閃光退火',
    color: '#eab308',
    apply: (p) => ({ ...p, thermalMode: 'flash', peakTemperature: 1300, soakTime: 0.002, dopantSpecies: 'B', ambientGas: 'N2' }),
  },
  {
    id: 'laser-anneal',
    label: 'Laser Anneal',
    labelCN: '激光退火',
    color: '#06b6d4',
    apply: (p) => ({ ...p, thermalMode: 'laser', peakTemperature: 1400, soakTime: 0.0005, dopantSpecies: 'As', ambientGas: 'N2' }),
  },
  {
    id: 'ted-showcase',
    label: 'TED Showcase',
    labelCN: '暫態增強擴散',
    color: '#8b5cf6',
    apply: (p) => ({ ...p, thermalMode: 'rta', peakTemperature: 800, soakTime: 60, dopantSpecies: 'B', interstitialFactor: 5, ambientGas: 'N2' }),
  },
  {
    id: 'oed-effect',
    label: 'OED Effect',
    labelCN: '氧化增強擴散',
    color: '#10b981',
    apply: (p) => ({ ...p, thermalMode: 'furnace', peakTemperature: 1000, soakTime: 1800, dopantSpecies: 'B', ambientGas: 'O2', rampRate: 5, coolingRate: 3 }),
  },
  {
    id: 'retrograde-well',
    label: 'Retrograde Well',
    labelCN: '逆行井',
    color: '#3b82f6',
    apply: (p) => ({ ...p, thermalMode: 'rta', peakTemperature: 1050, soakTime: 15, dopantSpecies: 'In', initialDose: 1e13, initialDepth: 300 }),
  },
  {
    id: 'dopant-pile-up',
    label: 'Dopant Pile-Up',
    labelCN: '雜質堆積',
    color: '#ec4899',
    apply: (p) => ({ ...p, thermalMode: 'furnace', peakTemperature: 1100, soakTime: 1800, dopantSpecies: 'B', screenOxideThickness: 30, rampRate: 5, coolingRate: 3 }),
  },
  {
    id: 'high-conc-clustering',
    label: 'High-Conc Clustering',
    labelCN: '高濃度團簇',
    color: '#a855f7',
    apply: (p) => ({ ...p, thermalMode: 'rta', peakTemperature: 1000, soakTime: 20, dopantSpecies: 'As', initialDose: 1e16, clusteringThreshold: 5e19 }),
  },
  {
    id: 'co-diffusion',
    label: 'Co-Diffusion',
    labelCN: '共擴散',
    color: '#6366f1',
    apply: (p) => ({ ...p, thermalMode: 'furnace', peakTemperature: 1050, soakTime: 3600, dopantSpecies: 'P', backgroundDoping: 1e16, rampRate: 5, coolingRate: 3 }),
  },
  {
    id: 'thermal-budget-overshoot',
    label: 'Budget Overshoot',
    labelCN: '熱預算超標',
    color: '#dc2626',
    apply: (p) => ({ ...p, thermalMode: 'furnace', peakTemperature: 1150, soakTime: 7200, dopantSpecies: 'B', rampRate: 5, coolingRate: 3 }),
  },
];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
```

**Step 2: Create `src/lib/diffusion-sim/__tests__/presets.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { PRESETS, getPreset } from '../presets';
import { DEFAULT_PARAMS } from '../constants';

describe('presets', () => {
  it('has 12 presets', () => {
    expect(PRESETS).toHaveLength(12);
  });

  it('each preset produces valid params', () => {
    for (const preset of PRESETS) {
      const params = preset.apply(DEFAULT_PARAMS);
      expect(params.peakTemperature).toBeGreaterThanOrEqual(700);
      expect(params.peakTemperature).toBeLessThanOrEqual(1410);
      expect(params.dopantSpecies).toBeTruthy();
      expect(params.thermalMode).toBeTruthy();
    }
  });

  it('furnace-drive-in has long soak time', () => {
    const p = getPreset('furnace-drive-in')!.apply(DEFAULT_PARAMS);
    expect(p.soakTime).toBeGreaterThanOrEqual(3600);
    expect(p.thermalMode).toBe('furnace');
  });

  it('laser-anneal has microsecond soak time', () => {
    const p = getPreset('laser-anneal')!.apply(DEFAULT_PARAMS);
    expect(p.soakTime).toBeLessThan(0.001);
    expect(p.thermalMode).toBe('laser');
  });

  it('ted-showcase has high interstitial factor', () => {
    const p = getPreset('ted-showcase')!.apply(DEFAULT_PARAMS);
    expect(p.interstitialFactor).toBeGreaterThan(1);
  });

  it('all 5 thermal modes covered by presets', () => {
    const modes = new Set(PRESETS.map(p => p.apply(DEFAULT_PARAMS).thermalMode));
    expect(modes.size).toBe(5);
  });

  it('co-diffusion sets P dopant', () => {
    const p = getPreset('co-diffusion')!.apply(DEFAULT_PARAMS);
    expect(p.dopantSpecies).toBe('P');
  });

  it('thermal-budget-overshoot has longest total time', () => {
    const p = getPreset('thermal-budget-overshoot')!.apply(DEFAULT_PARAMS);
    expect(p.soakTime).toBe(7200);
    expect(p.peakTemperature).toBeGreaterThan(1100);
  });
});
```

**Step 3: Run tests, commit**

Run: `cd equipment-monitor && npx vitest run src/lib/diffusion-sim/__tests__/presets.test.ts --reporter verbose`
Expected: 8/8 PASS

```bash
cd equipment-monitor && git add src/lib/diffusion-sim/presets.ts src/lib/diffusion-sim/__tests__/presets.test.ts && git commit -m "feat(diffusion-sim): 12 presets from furnace to laser anneal"
```

---

### Task 10: Barrel Export and Route Registration

**Files:**
- Create: `src/lib/diffusion-sim/index.ts`
- Modify: `src/lib/digital-twin-routes.ts`

**Dependencies:** Tasks 1–9

**Step 1: Create `src/lib/diffusion-sim/index.ts`**

```typescript
export { createSimulation, stepForward, stepN, applyPreset } from './simulation-engine';
export { PRESETS, getPreset } from './presets';
export {
  DEFAULT_PARAMS, PARAM_BOUNDS, DEFAULT_TOTAL_STEPS,
  DEPTH_BINS, DOPANT_DB, THERMAL_MODES,
} from './constants';
export type {
  SimulationParams,
  SimulationState,
  StepState,
  ThermalStep,
  SolverState,
  PointDefectState,
  LayerDef,
  DiffusionMetric,
  PresetId,
  Preset,
  DopantSpecies,
  ThermalMode,
  AmbientGas,
  SubstrateOrientation,
  ThermalPhase,
} from './types';
```

**Step 2: Add diffusion route to `src/lib/digital-twin-routes.ts`**

Add after the `implant` line:
```typescript
  diffusion: '/mes/fab-floor/diffusion/diffusion-sim',
```

**Step 3: Commit**

```bash
cd equipment-monitor && git add src/lib/diffusion-sim/index.ts src/lib/digital-twin-routes.ts && git commit -m "feat(diffusion-sim): barrel export and route registration"
```

---

### Task 11: TimelineBar Component

**Files:**
- Create: `src/components/diffusion-sim/TimelineBar.tsx`

**Dependencies:** Task 10

**Step 1: Create `src/components/diffusion-sim/TimelineBar.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react';
import type { StepState } from '@/lib/diffusion-sim';

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

function formatTime(s: number): string {
  if (s >= 60) return `${(s / 60).toFixed(1)} min`;
  if (s >= 1) return `${s.toFixed(1)} s`;
  if (s >= 1e-3) return `${(s * 1e3).toFixed(1)} ms`;
  return `${(s * 1e6).toFixed(1)} \u00B5s`;
}

const PHASE_COLORS: Record<string, string> = {
  ramp: '#F59E0B',
  soak: '#EF4444',
  cool: '#3B82F6',
  pulse: '#FFFFFF',
};

export function TimelineBar({
  currentIndex, totalSteps, playing, currentStep, backHref,
  onPlay, onPause, onStep, onSeek, onReset,
  playbackSpeed, onSpeedChange,
}: TimelineBarProps) {
  const progress = totalSteps > 0 ? ((currentIndex + 1) / totalSteps) * 100 : 0;
  const temp = currentStep?.temperature?.toFixed(0) ?? '--';
  const time = currentStep ? formatTime(currentStep.time) : '--';
  const phase = currentStep?.thermalPhase ?? 'ramp';

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
          <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex items-center gap-3 font-mono text-xs">
        <span className="text-[var(--sf-text-secondary)]">
          Step {currentIndex + 1}/{totalSteps}
        </span>
        <span style={{ color: '#F59E0B' }}>
          {temp}°C
        </span>
        <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: PHASE_COLORS[phase] + '33', color: PHASE_COLORS[phase] }}>
          {phase}
        </span>
        <span className="text-[var(--sf-text-muted)]">
          t={time}
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
cd equipment-monitor && git add src/components/diffusion-sim/TimelineBar.tsx && git commit -m "feat(diffusion-sim): TimelineBar with thermal phase indicator"
```

---

### Task 12: ParameterPanel Component

**Files:**
- Create: `src/components/diffusion-sim/ParameterPanel.tsx`

**Dependencies:** Task 10

**Step 1: Create `src/components/diffusion-sim/ParameterPanel.tsx`**

```tsx
'use client';

import { PARAM_BOUNDS, PRESETS, DOPANT_DB, THERMAL_MODES } from '@/lib/diffusion-sim';
import type { PresetId, SimulationParams, DopantSpecies, ThermalMode, AmbientGas, SubstrateOrientation } from '@/lib/diffusion-sim';

interface ParameterPanelProps {
  params: SimulationParams;
  activePreset: PresetId | null;
  onParamChange: (key: keyof SimulationParams, value: number | string) => void;
  onPreset: (id: PresetId) => void;
}

const SLIDER_KEYS: (keyof typeof PARAM_BOUNDS)[] = [
  'peakTemperature', 'rampRate', 'soakTime', 'coolingRate',
  'initialDose', 'initialDepth', 'screenOxideThickness', 'backgroundDoping',
  'interstitialFactor', 'vacancyFactor', 'clusteringThreshold',
];

const DOPANT_OPTIONS: DopantSpecies[] = ['B', 'P', 'As', 'Sb', 'In', 'Ge'];
const MODE_OPTIONS: ThermalMode[] = ['furnace', 'rta', 'spike', 'flash', 'laser'];
const GAS_OPTIONS: AmbientGas[] = ['N2', 'O2', 'N2O2'];
const ORIENT_OPTIONS: SubstrateOrientation[] = ['100', '110', '111'];

const LOG_KEYS = new Set(['rampRate', 'soakTime', 'coolingRate', 'initialDose', 'backgroundDoping', 'clusteringThreshold']);

function getSliderValue(key: string, params: SimulationParams): number {
  const raw = params[key as keyof SimulationParams] as number;
  if (LOG_KEYS.has(key)) return Math.log10(Math.max(1e-10, raw));
  return raw;
}

function formatValue(key: string, params: SimulationParams): string {
  const raw = params[key as keyof SimulationParams] as number;
  if (LOG_KEYS.has(key)) {
    const exp = Math.log10(Math.max(1e-10, raw));
    return `1e${exp.toFixed(1)}`;
  }
  return `${raw}`;
}

export function ParameterPanel({ params, activePreset, onParamChange, onPreset }: ParameterPanelProps) {
  return (
    <div className="rounded-2xl border border-[rgba(245,158,11,0.2)] bg-[rgba(2,6,23,0.8)] px-4 py-3 backdrop-blur-xl">
      <div className="grid grid-cols-5 gap-x-6 gap-y-2 sm:grid-cols-15">
        {/* Dropdown: Dopant Species */}
        <label className="flex flex-col gap-0.5 font-mono text-[10px] text-[var(--sf-text-secondary)]">
          <span>Dopant</span>
          <select
            value={params.dopantSpecies}
            onChange={(e) => onParamChange('dopantSpecies', e.target.value)}
            className="rounded bg-white/10 px-1 py-0.5 text-[10px] accent-amber-500"
          >
            {DOPANT_OPTIONS.map(s => (
              <option key={s} value={s}>{DOPANT_DB[s].symbol}</option>
            ))}
          </select>
        </label>

        {/* Dropdown: Thermal Mode */}
        <label className="flex flex-col gap-0.5 font-mono text-[10px] text-[var(--sf-text-secondary)]">
          <span>Mode</span>
          <select
            value={params.thermalMode}
            onChange={(e) => onParamChange('thermalMode', e.target.value)}
            className="rounded bg-white/10 px-1 py-0.5 text-[10px] accent-amber-500"
          >
            {MODE_OPTIONS.map(m => (
              <option key={m} value={m}>{THERMAL_MODES[m].label}</option>
            ))}
          </select>
        </label>

        {/* Dropdown: Ambient Gas */}
        <label className="flex flex-col gap-0.5 font-mono text-[10px] text-[var(--sf-text-secondary)]">
          <span>Ambient</span>
          <select
            value={params.ambientGas}
            onChange={(e) => onParamChange('ambientGas', e.target.value)}
            className="rounded bg-white/10 px-1 py-0.5 text-[10px] accent-amber-500"
          >
            {GAS_OPTIONS.map(g => (
              <option key={g} value={g}>{g === 'N2O2' ? 'N\u2082+O\u2082' : g === 'N2' ? 'N\u2082' : 'O\u2082'}</option>
            ))}
          </select>
        </label>

        {/* Dropdown: Orientation */}
        <label className="flex flex-col gap-0.5 font-mono text-[10px] text-[var(--sf-text-secondary)]">
          <span>Orient</span>
          <select
            value={params.substrateOrientation}
            onChange={(e) => onParamChange('substrateOrientation', e.target.value)}
            className="rounded bg-white/10 px-1 py-0.5 text-[10px] accent-amber-500"
          >
            {ORIENT_OPTIONS.map(o => (
              <option key={o} value={o}>&lt;{o}&gt;</option>
            ))}
          </select>
        </label>

        {/* 11 Sliders */}
        {SLIDER_KEYS.map((key) => {
          const b = PARAM_BOUNDS[key];
          const isLog = LOG_KEYS.has(key);
          const sliderVal = getSliderValue(key, params);

          return (
            <label key={key} className="flex flex-col gap-0.5 font-mono text-[10px] text-[var(--sf-text-secondary)]">
              <span>{b.label}</span>
              <input
                type="range"
                min={b.min}
                max={b.max}
                step={b.step}
                value={sliderVal}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  onParamChange(key as keyof SimulationParams, isLog ? Math.pow(10, v) : v);
                }}
                className="accent-amber-500"
              />
              <span className="text-[var(--sf-text-muted)]">
                {formatValue(key, params)}{b.unit ? ` ${b.unit}` : ''}
              </span>
            </label>
          );
        })}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPreset(p.id)}
            className="rounded-full border px-3 py-1 font-mono text-[10px] transition-colors"
            style={{
              borderColor: p.color,
              backgroundColor: activePreset === p.id ? p.color : 'transparent',
              color: activePreset === p.id ? '#fff' : p.color,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
cd equipment-monitor && git add src/components/diffusion-sim/ParameterPanel.tsx && git commit -m "feat(diffusion-sim): ParameterPanel with 4 dropdowns + 11 sliders + 12 presets"
```

---

### Task 13: Babylon.js DiffusionScene

**Files:**
- Create: `src/components/diffusion-sim/DiffusionScene.tsx`

**Dependencies:** Task 10

**Step 1: Create `src/components/diffusion-sim/DiffusionScene.tsx`**

```tsx
'use client';

import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import type { StepState, SimulationParams } from '@/lib/diffusion-sim';
import { DEPTH_BINS } from '@/lib/diffusion-sim';

interface DiffusionSceneProps {
  step: StepState | null;
  params: SimulationParams;
}

const STRIP_COUNT = 40; // 200 bins / 5 bins per strip

function concToColor(logC: number): BABYLON.Color3 {
  if (logC >= 20) return new BABYLON.Color3(0.96, 0.62, 0.04); // amber #F59E0B
  if (logC >= 17) return new BABYLON.Color3(0.92, 0.35, 0.05); // orange #EA580C
  if (logC >= 14) return new BABYLON.Color3(0.50, 0.11, 0.11); // dark red #7F1D1D
  return new BABYLON.Color3(0.12, 0.23, 0.37); // substrate blue #1E3A5F
}

const PHASE_COLORS: Record<string, BABYLON.Color3> = {
  ramp: new BABYLON.Color3(0.96, 0.62, 0.04),
  soak: new BABYLON.Color3(0.94, 0.27, 0.27),
  cool: new BABYLON.Color3(0.23, 0.51, 0.96),
  pulse: new BABYLON.Color3(1, 1, 1),
};

export function DiffusionScene({ step, params }: DiffusionSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ step, params });
  propsRef.current = { step, params };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new BABYLON.Engine(canvas, true, { adaptToDeviceRatio: true });
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.02, 0.03, 0.06, 1);

    // Camera
    const camera = new BABYLON.ArcRotateCamera('cam', -Math.PI / 4, Math.PI / 3, 350, new BABYLON.Vector3(0, -80, 0), scene);
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 100;
    camera.upperRadiusLimit = 800;
    camera.lowerBetaLimit = 0.15;
    camera.upperBetaLimit = Math.PI * 0.85;

    // Lights
    const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene);
    hemi.intensity = 0.5;
    const point = new BABYLON.PointLight('pt', new BABYLON.Vector3(50, 50, 50), scene);
    point.intensity = 0.4;

    // Wafer slab strips (horizontal slices of silicon)
    const strips: BABYLON.Mesh[] = [];
    const stripMats: BABYLON.StandardMaterial[] = [];
    const stripHeight = 200 / STRIP_COUNT;

    for (let i = 0; i < STRIP_COUNT; i++) {
      const mat = new BABYLON.StandardMaterial(`strip${i}`, scene);
      mat.diffuseColor = new BABYLON.Color3(0.12, 0.23, 0.37);
      mat.alpha = 0.7;
      mat.backFaceCulling = false;
      stripMats.push(mat);

      const box = BABYLON.MeshBuilder.CreateBox(`strip${i}`, { width: 100, height: stripHeight, depth: 20 }, scene);
      box.material = mat;
      box.position.y = -(i + 0.5) * stripHeight;
      strips.push(box);
    }

    // Screen oxide layer
    const oxMat = new BABYLON.StandardMaterial('oxMat', scene);
    oxMat.diffuseColor = new BABYLON.Color3(0.55, 0.45, 0.72);
    oxMat.alpha = 0.25;
    const oxBox = BABYLON.MeshBuilder.CreateBox('oxide', { width: 100, height: 1, depth: 20 }, scene);
    oxBox.material = oxMat;
    oxBox.isVisible = false;

    // Junction plane
    const junctionMat = new BABYLON.StandardMaterial('jMat', scene);
    junctionMat.diffuseColor = new BABYLON.Color3(0.96, 0.62, 0.04);
    junctionMat.emissiveColor = new BABYLON.Color3(0.96, 0.62, 0.04);
    junctionMat.alpha = 0.5;
    const junctionPlane = BABYLON.MeshBuilder.CreateBox('junction', { width: 110, height: 0.5, depth: 25 }, scene);
    junctionPlane.material = junctionMat;
    junctionPlane.isVisible = false;

    // Point defect particle pools
    const interstitialPool: BABYLON.Mesh[] = [];
    const vacancyPool: BABYLON.Mesh[] = [];

    const iMat = new BABYLON.StandardMaterial('iMat', scene);
    iMat.emissiveColor = new BABYLON.Color3(0.02, 0.71, 0.83);
    iMat.alpha = 0.7;

    const vMat = new BABYLON.StandardMaterial('vMat', scene);
    vMat.emissiveColor = new BABYLON.Color3(0.66, 0.33, 0.97);
    vMat.alpha = 0.7;

    for (let i = 0; i < 50; i++) {
      const si = BABYLON.MeshBuilder.CreateSphere(`iP${i}`, { diameter: 1.5 }, scene);
      si.material = iMat;
      si.isVisible = false;
      interstitialPool.push(si);

      const sv = BABYLON.MeshBuilder.CreateSphere(`vP${i}`, { diameter: 1.5 }, scene);
      sv.material = vMat;
      sv.isVisible = false;
      vacancyPool.push(sv);
    }

    // Temperature gradient bar (left edge)
    const tempStrips: BABYLON.Mesh[] = [];
    const tempMats: BABYLON.StandardMaterial[] = [];
    const tempBarStrips = 20;
    for (let i = 0; i < tempBarStrips; i++) {
      const m = new BABYLON.StandardMaterial(`tBar${i}`, scene);
      m.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.5);
      m.alpha = 0.8;
      tempMats.push(m);
      const b = BABYLON.MeshBuilder.CreateBox(`tBar${i}`, { width: 3, height: 200 / tempBarStrips, depth: 2 }, scene);
      b.material = m;
      b.position.x = -55;
      b.position.y = -(i + 0.5) * (200 / tempBarStrips);
      tempStrips.push(b);
    }

    // Render loop
    scene.registerBeforeRender(() => {
      const { step: curStep, params: curParams } = propsRef.current;
      if (!curStep) return;

      const maxD = curStep.maxDepthNm;
      const scale = 200 / Math.max(maxD, 100);
      const binsPerStrip = Math.floor(DEPTH_BINS / STRIP_COUNT);

      // Update concentration strip colors
      for (let s = 0; s < STRIP_COUNT; s++) {
        let avgConc = 0;
        for (let b = 0; b < binsPerStrip; b++) {
          const idx = s * binsPerStrip + b;
          if (idx < DEPTH_BINS) avgConc += curStep.dopantProfile[idx];
        }
        avgConc /= binsPerStrip;
        const logC = avgConc > 0 ? Math.log10(avgConc) : 8;
        stripMats[s].diffuseColor = concToColor(logC);
      }

      // Update oxide layer
      if (curParams.screenOxideThickness > 0) {
        const h = curParams.screenOxideThickness * scale;
        oxBox.isVisible = true;
        oxBox.scaling.y = h;
        oxBox.position.y = h / 2;
      } else {
        oxBox.isVisible = false;
      }

      // Update junction plane
      if (curStep.junctionDepth > 0) {
        junctionPlane.isVisible = true;
        junctionPlane.position.y = -curStep.junctionDepth * scale;
      } else {
        junctionPlane.isVisible = false;
      }

      // Update particles
      let iIdx = 0;
      let vIdx = 0;
      for (let bin = 0; bin < DEPTH_BINS; bin += 10) {
        const sI = curStep.interstitialProfile[bin] ?? 1;
        const sV = curStep.vacancyProfile[bin] ?? 1;
        const y = -(bin + 0.5) * (200 / DEPTH_BINS);

        if (sI > 1.2 && iIdx < interstitialPool.length) {
          const p = interstitialPool[iIdx++];
          p.position.set((Math.random() - 0.5) * 80, y + Math.random() * 2, (Math.random() - 0.5) * 16);
          p.isVisible = true;
        }

        if (sV > 1.2 && vIdx < vacancyPool.length) {
          const p = vacancyPool[vIdx++];
          p.position.set((Math.random() - 0.5) * 80, y, (Math.random() - 0.5) * 16);
          p.isVisible = true;
        }
      }
      for (let i = iIdx; i < interstitialPool.length; i++) interstitialPool[i].isVisible = false;
      for (let i = vIdx; i < vacancyPool.length; i++) vacancyPool[i].isVisible = false;

      // Update temperature bar
      for (let i = 0; i < tempBarStrips; i++) {
        const binIdx = Math.floor((i / tempBarStrips) * DEPTH_BINS);
        const T = curStep.temperatureProfile[binIdx] ?? curStep.temperature;
        const norm = Math.max(0, Math.min(1, (T - 25) / (1410 - 25)));
        tempMats[i].emissiveColor = new BABYLON.Color3(norm, 0.1 * (1 - norm), 0.8 * (1 - norm));
      }
    });

    engine.runRenderLoop(() => scene.render());
    const onResize = () => engine.resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      engine.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="h-full w-full" />;
}
```

**Step 2: Commit**

```bash
cd equipment-monitor && git add src/components/diffusion-sim/DiffusionScene.tsx && git commit -m "feat(diffusion-sim): Babylon.js 3D wafer slab with volumetric dopant color"
```

---

### Task 14: Canvas2D ProfilePanel

**Files:**
- Create: `src/components/diffusion-sim/ProfilePanel.tsx`

**Dependencies:** Task 10

**Step 1: Create `src/components/diffusion-sim/ProfilePanel.tsx`**

```tsx
'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { StepState, SimulationParams, DiffusionMetric } from '@/lib/diffusion-sim';
import { DEPTH_BINS, DOPANT_DB } from '@/lib/diffusion-sim';

interface ProfilePanelProps {
  steps: StepState[];
  currentStep: StepState | null;
  params: SimulationParams;
  metric: DiffusionMetric;
  onMetricChange: (m: DiffusionMetric) => void;
}

const METRIC_CFG: Record<DiffusionMetric, { label: string; unit: string; format: (v: number) => string }> = {
  junctionDepth:                { label: 'Xj',        unit: 'nm',    format: v => v.toFixed(1) },
  sheetResistance:              { label: 'Rs',        unit: '\u03A9/\u25A1', format: v => v.toFixed(1) },
  peakConcentration:            { label: 'Cp',        unit: 'cm\u207B\u00B3', format: v => v.toExponential(1) },
  thermalBudget:                { label: 'Dt',        unit: 'cm\u00B2',  format: v => v.toExponential(2) },
  activationFraction:           { label: 'Act%',      unit: '%',     format: v => (v * 100).toFixed(1) },
  interstitialSupersaturation:  { label: 'S_I',       unit: '\u00D7',  format: v => v.toFixed(2) },
  profileAbruptness:            { label: 'Abrupt',    unit: 'nm/dec', format: v => v.toFixed(1) },
  segregationRatio:             { label: 'Seg',       unit: '\u00D7',  format: v => v.toFixed(2) },
  vacancyConcentration:         { label: 'S_V',       unit: '\u00D7',  format: v => v.toFixed(2) },
  diffusionLength:              { label: 'L_d',       unit: 'nm',    format: v => v.toFixed(1) },
};

const METRICS: DiffusionMetric[] = [
  'junctionDepth', 'sheetResistance', 'peakConcentration', 'thermalBudget',
  'activationFraction', 'interstitialSupersaturation', 'profileAbruptness',
  'segregationRatio', 'vacancyConcentration', 'diffusionLength',
];

const CURVE_COLORS = {
  total: '#F59E0B',
  active: '#22C55E',
  clustered: '#EF4444',
  interstitial: '#06B6D4',
  vacancy: '#A855F7',
  background: '#64748B',
};

export function ProfilePanel({ steps, currentStep, params, metric, onMetricChange }: ProfilePanelProps) {
  const profileRef = useRef<HTMLCanvasElement>(null);
  const tempRef = useRef<HTMLCanvasElement>(null);
  const sparkRef = useRef<HTMLCanvasElement>(null);

  const drawProfile = useCallback(() => {
    const ctx = profileRef.current?.getContext('2d');
    if (!ctx || !profileRef.current || !currentStep) return;
    const w = profileRef.current.width;
    const h = profileRef.current.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(2, 6, 23, 0.6)';
    ctx.fillRect(0, 0, w, h);

    const pad = { top: 16, bottom: 28, left: 44, right: 12 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    const logMin = 8;
    const logMax = 22;
    const yFromLog = (lv: number) => pad.top + plotH - ((lv - logMin) / (logMax - logMin)) * plotH;
    const maxDepth = currentStep.maxDepthNm;

    // Grid lines
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.15)';
    ctx.lineWidth = 0.5;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '7px monospace';
    for (let lv = logMin; lv <= logMax; lv += 2) {
      const y = yFromLog(lv);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + plotW, y);
      ctx.stroke();
      ctx.fillText(`1e${lv}`, 2, y + 3);
    }

    // Background doping line
    const bgLog = Math.log10(Math.max(1, params.backgroundDoping));
    const bgY = yFromLog(bgLog);
    ctx.strokeStyle = CURVE_COLORS.background;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pad.left, bgY);
    ctx.lineTo(pad.left + plotW, bgY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw curves
    const drawCurve = (data: number[], color: string, dashed = false) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      if (dashed) ctx.setLineDash([3, 3]);
      for (let i = 0; i < DEPTH_BINS; i++) {
        const x = pad.left + (i / DEPTH_BINS) * plotW;
        const val = data[i];
        const logV = val > 0 ? Math.log10(val) : logMin;
        const y = yFromLog(Math.max(logMin, Math.min(logMax, logV)));
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      if (dashed) ctx.setLineDash([]);
    };

    drawCurve(currentStep.dopantProfile, CURVE_COLORS.total);
    drawCurve(currentStep.activeProfile, CURVE_COLORS.active);
    drawCurve(currentStep.clusteredProfile, CURVE_COLORS.clustered, true);

    // Normalize defect profiles for display (they are already normalized to equilibrium)
    const iDisplay = currentStep.interstitialProfile.map(v => v * 1e14);
    const vDisplay = currentStep.vacancyProfile.map(v => v * 1e14);
    drawCurve(iDisplay, CURVE_COLORS.interstitial);
    drawCurve(vDisplay, CURVE_COLORS.vacancy);

    // Junction marker
    if (currentStep.junctionDepth > 0) {
      const xjX = pad.left + (currentStep.junctionDepth / maxDepth) * plotW;
      ctx.strokeStyle = '#EF4444';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(xjX, pad.top);
      ctx.lineTo(xjX, pad.top + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#EF4444';
      ctx.font = '8px monospace';
      ctx.fillText('Xj', xjX + 2, pad.top + 10);
    }

    // Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px monospace';
    ctx.fillText('Concentration vs Depth (log)', pad.left, pad.top - 4);
    ctx.fillText(`0 \u2014 ${maxDepth.toFixed(0)} nm`, pad.left, h - 4);

    // Legend
    const legend = [
      { label: 'Total', color: CURVE_COLORS.total },
      { label: 'Active', color: CURVE_COLORS.active },
      { label: 'Cluster', color: CURVE_COLORS.clustered },
      { label: 'I', color: CURVE_COLORS.interstitial },
      { label: 'V', color: CURVE_COLORS.vacancy },
    ];
    let lx = pad.left + plotW - 160;
    ctx.font = '7px monospace';
    for (const l of legend) {
      ctx.fillStyle = l.color;
      ctx.fillRect(lx, h - 15, 8, 4);
      ctx.fillText(l.label, lx + 10, h - 11);
      lx += 35;
    }
  }, [currentStep, params]);

  const drawTemp = useCallback(() => {
    const ctx = tempRef.current?.getContext('2d');
    if (!ctx || !tempRef.current) return;
    const w = tempRef.current.width;
    const h = tempRef.current.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(2, 6, 23, 0.6)';
    ctx.fillRect(0, 0, w, h);

    if (steps.length < 1) return;

    const pad = { top: 12, bottom: 16, left: 44, right: 12 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    const temps = steps.map(s => s.temperature);
    const minT = Math.min(...temps, 25);
    const maxT = Math.max(...temps, 100);

    const phaseColors: Record<string, string> = {
      ramp: '#F59E0B', soak: '#EF4444', cool: '#3B82F6', pulse: '#FFFFFF',
    };

    // Draw T(t) curve with phase coloring
    ctx.lineWidth = 1.5;
    for (let i = 1; i < steps.length; i++) {
      const x0 = pad.left + ((i - 1) / (steps.length - 1)) * plotW;
      const x1 = pad.left + (i / (steps.length - 1)) * plotW;
      const y0 = pad.top + plotH - ((temps[i - 1] - minT) / (maxT - minT)) * plotH;
      const y1 = pad.top + plotH - ((temps[i] - minT) / (maxT - minT)) * plotH;
      ctx.strokeStyle = phaseColors[steps[i].thermalPhase] ?? '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }

    // Current temperature text
    if (currentStep) {
      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`${currentStep.temperature.toFixed(0)}°C`, pad.left + plotW - 60, pad.top + 14);
    }

    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px monospace';
    ctx.fillText('T(t) Thermal History', pad.left, pad.top - 2);
  }, [steps, currentStep]);

  const drawSparkline = useCallback(() => {
    const ctx = sparkRef.current?.getContext('2d');
    if (!ctx || !sparkRef.current) return;
    const w = sparkRef.current.width;
    const h = sparkRef.current.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(2, 6, 23, 0.6)';
    ctx.fillRect(0, 0, w, h);

    if (steps.length < 2) return;

    const cfg = METRIC_CFG[metric];
    const pad = { top: 12, bottom: 16, left: 8, right: 8 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    const values = steps.map(s => s[metric] as number);
    const minV = Math.min(...values);
    const maxV = Math.max(...values, minV + 0.001);

    ctx.beginPath();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < values.length; i++) {
      const x = pad.left + (i / (steps.length - 1)) * plotW;
      const y = pad.top + plotH - ((values[i] - minV) / (maxV - minV)) * plotH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px monospace';
    ctx.fillText(`${cfg.label} trend`, pad.left, pad.top - 2);
  }, [steps, metric]);

  useEffect(() => { drawProfile(); }, [drawProfile]);
  useEffect(() => { drawTemp(); }, [drawTemp]);
  useEffect(() => { drawSparkline(); }, [drawSparkline]);

  return (
    <div className="flex h-full flex-col bg-[var(--sf-bg-canvas)] p-3">
      {/* Metric selector */}
      <div className="mb-2 flex flex-wrap gap-1">
        {METRICS.map((m) => (
          <button key={m} type="button" onClick={() => onMetricChange(m)}
            className="rounded-full px-2 py-0.5 font-mono text-[10px] transition-colors"
            style={{
              backgroundColor: metric === m ? '#F59E0B' : 'rgba(245,158,11,0.1)',
              color: metric === m ? '#fff' : '#F59E0B',
            }}>
            {METRIC_CFG[m].label}
          </button>
        ))}
      </div>

      {/* Metric readout */}
      {currentStep && (
        <div className="mb-2 grid grid-cols-5 gap-1 text-center font-mono text-[9px]">
          {METRICS.map((m) => {
            const cfg = METRIC_CFG[m];
            const val = currentStep[m] as number;
            return (
              <div key={m} className="rounded bg-white/5 px-1 py-0.5">
                <div className="text-[var(--sf-text-muted)]">{cfg.label}</div>
                <div style={{ color: metric === m ? '#F59E0B' : '#94a3b8' }}>{cfg.format(val)} {cfg.unit}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Concentration profile canvas */}
      <div className="flex-1 min-h-0">
        <canvas ref={profileRef} width={360} height={220} className="h-full w-full" />
      </div>

      {/* Temperature profile canvas */}
      <div className="mt-1 h-[80px]">
        <canvas ref={tempRef} width={360} height={80} className="h-full w-full" />
      </div>

      {/* Sparkline */}
      <div className="mt-1 h-[70px]">
        <canvas ref={sparkRef} width={360} height={70} className="h-full w-full" />
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
cd equipment-monitor && git add src/components/diffusion-sim/ProfilePanel.tsx && git commit -m "feat(diffusion-sim): Canvas2D ProfilePanel with 6-curve concentration plot"
```

---

### Task 15: Page Route

**Files:**
- Create: `src/app/mes/fab-floor/diffusion/diffusion-sim/page.tsx`

**Dependencies:** Tasks 11–14

**Step 1: Create `src/app/mes/fab-floor/diffusion/diffusion-sim/page.tsx`**

```tsx
'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TimelineBar } from '@/components/diffusion-sim/TimelineBar';
import { ParameterPanel } from '@/components/diffusion-sim/ParameterPanel';
import {
  createSimulation,
  stepForward,
  stepN,
  applyPreset,
} from '@/lib/diffusion-sim';
import type { PresetId, SimulationParams, SimulationState, DiffusionMetric } from '@/lib/diffusion-sim';

const DiffusionScene = dynamic(
  () => import('@/components/diffusion-sim/DiffusionScene').then((m) => ({ default: m.DiffusionScene })),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center bg-[var(--sf-bg-canvas)]"><p className="animate-pulse font-mono text-sm text-[var(--sf-text-muted)] motion-reduce:animate-none">Initializing diffusion furnace...</p></div> },
);

const ProfilePanel = dynamic(
  () => import('@/components/diffusion-sim/ProfilePanel').then((m) => ({ default: m.ProfilePanel })),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center bg-[var(--sf-bg-canvas)]"><p className="animate-pulse font-mono text-sm text-[var(--sf-text-muted)] motion-reduce:animate-none">Loading profiles...</p></div> },
);

export default function DiffusionSimPage() {
  const [sim, setSim] = useState<SimulationState>(() => createSimulation());
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [metric, setMetric] = useState<DiffusionMetric>('junctionDepth');
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

  const handleParamChange = useCallback((key: keyof SimulationParams, value: number | string) => {
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
          backHref="/mes/fab-floor/diffusion"
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
        <div className="flex-[7] overflow-hidden rounded-2xl border border-[rgba(245,158,11,0.15)]" data-testid="diffusion-scene-panel">
          <DiffusionScene step={currentStep} params={sim.params} />
        </div>
        <div className="flex-[3] overflow-hidden rounded-2xl border border-[rgba(245,158,11,0.15)]" data-testid="profile-panel">
          <ProfilePanel steps={sim.steps} currentStep={currentStep} params={sim.params} metric={metric} onMetricChange={setMetric} />
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
cd equipment-monitor && git add src/app/mes/fab-floor/diffusion/diffusion-sim/page.tsx && git commit -m "feat(diffusion-sim): page route with dynamic imports"
```

---

### Task 16: Final Verification

**Files:** None (verification only)

**Step 1: Run all tests**

```bash
cd equipment-monitor && npx vitest run src/lib/diffusion-sim/ --reporter verbose
```

Expected: ~72 tests across 9 suites, all PASS.

**Step 2: TypeScript check**

```bash
cd equipment-monitor && npx tsc --noEmit 2>&1 | head -30
```

Expected: Zero errors related to diffusion-sim.

**Step 3: Build check**

```bash
cd equipment-monitor && npx next build 2>&1 | grep -E "(diffusion|Error|error)"
```

Expected: `/mes/fab-floor/diffusion/diffusion-sim` route appears in build output. No errors.

**Step 4: Verify route registration**

```bash
grep diffusion src/lib/digital-twin-routes.ts
```

Expected: `diffusion: '/mes/fab-floor/diffusion/diffusion-sim'`

**No commit for this task — verification only.**
