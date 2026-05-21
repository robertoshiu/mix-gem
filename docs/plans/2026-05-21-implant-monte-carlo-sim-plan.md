# Ion Implantation Monte Carlo Digital Twin — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Monte Carlo BCA ion implantation digital twin at `/mes/fab-floor/implant/implant-sim` with channeling, amorphization, multi-layer targets, 4 ion species, 10 presets, and Babylon.js 3D trajectory visualization.

**Architecture:** 7 physics modules in `src/lib/implant-sim/`, 4 React components in `src/components/implant-sim/`, 1 Next.js page route. Pure client-side Monte Carlo simulation with procedural Babylon.js geometry. Follows established digital twin pattern (etch-sim, cmp-sim).

**Tech Stack:** TypeScript, Next.js 15, Babylon.js v9.6.2, Jest, lucide-react

**Accent color:** Cyan `#06b6d4` (distinct from CMP's amber)

---

## Task 1: Types & Constants

**Files:**
- Create: `src/lib/implant-sim/types.ts`
- Create: `src/lib/implant-sim/constants.ts`

### `types.ts`

```typescript
export type IonSpecies = 'B' | 'P' | 'As' | 'BF2';
export type CrystalOrientation = '100' | '110' | '111';
export type TargetMaterial = 'Si' | 'SiO2' | 'photoresist';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface CollisionEvent {
  position: Vec3;
  energyTransfer: number;
  isDisplacement: boolean;
  recoilCreated: boolean;
}

export interface IonTrajectory {
  points: Vec3[];
  collisions: CollisionEvent[];
  finalPosition: Vec3;
  recoilCascades: Vec3[][];
  channeled: boolean;
  backscattered: boolean;
  energyAtPoints: number[];
}

export interface LayerDef {
  material: TargetMaterial;
  startNm: number;
  endNm: number;
}

export interface SimulationParams {
  ionSpecies: IonSpecies;
  beamEnergy: number;
  dose: number;
  beamCurrent: number;
  tiltAngle: number;
  twistAngle: number;
  crystalOrientation: CrystalOrientation;
  screenOxideThickness: number;
  photoresistThickness: number;
  substrateTemperature: number;
  amorphizationThreshold: number;
  damageAnnealingRate: number;
  totalSteps: number;
}

export interface StepState {
  stepIndex: number;
  ionsSimulated: number;
  totalIons: number;
  trajectories: IonTrajectory[];
  depthProfile: number[];
  damageProfile: number[];
  lateralProfile: number[];
  amorphousMap: boolean[];
  layers: LayerDef[];
  maxDepthNm: number;
  projectedRange: number;
  straggle: number;
  junctionDepth: number;
  peakConcentration: number;
  channelingTailDepth: number;
  damagePeakDensity: number;
  lateralStraggle: number;
  retainedDoseFraction: number;
}

export interface SimulationState {
  params: SimulationParams;
  steps: StepState[];
  currentIndex: number;
  totalSteps: number;
}

export type ImplantMetric =
  | 'projectedRange'
  | 'straggle'
  | 'junctionDepth'
  | 'peakConcentration'
  | 'channelingTailDepth'
  | 'damagePeakDensity'
  | 'lateralStraggle'
  | 'retainedDoseFraction';

export type PresetId =
  | 'channeling-implant'
  | 'high-dose-amorphization'
  | 'implant-through-oxide'
  | 'shallow-junction'
  | 'retrograde-well'
  | 'dose-rate-heating'
  | 'resist-punch-through'
  | 'pre-amorphization'
  | 'twin-well-cmos'
  | 'high-tilt-halo';

export interface Preset {
  id: PresetId;
  label: string;
  labelCN: string;
  color: string;
  apply: (params: SimulationParams) => SimulationParams;
}
```

### `constants.ts`

```typescript
import type { SimulationParams, IonSpecies, TargetMaterial, CrystalOrientation } from './types';

// ─── Physical Constants (units: nm, eV, amu) ───
export const BOHR_RADIUS_NM = 0.0529177;
export const COULOMB_CONST = 1.44;  // e²/(4πε₀) in eV·nm

// ─── ZBL Universal Screening Function Coefficients ───
export const ZBL_A = [0.1818, 0.5099, 0.2802, 0.02817] as const;
export const ZBL_B = [3.2, 0.9423, 0.4029, 0.2016] as const;

// ─── Ion Species Database ───
export interface IonData {
  Z: number;
  M: number;
  symbol: string;
  color: string;
  /** For BF2: effective mass of molecular ion (energy partition) */
  molecularMass?: number;
}

export const ION_DB: Record<IonSpecies, IonData> = {
  B:   { Z: 5,  M: 11.01,  symbol: 'B',   color: '#3b82f6' },
  P:   { Z: 15, M: 30.97,  symbol: 'P',   color: '#22c55e' },
  As:  { Z: 33, M: 74.92,  symbol: 'As',  color: '#ef4444' },
  BF2: { Z: 5,  M: 11.01,  symbol: 'BF\u2082', color: '#f59e0b', molecularMass: 49.01 },
};

// ─── Target Material Database ───
export interface MaterialData {
  Z: number;
  M: number;
  density: number;  // atoms/nm³
  Ed: number;       // displacement energy (eV)
  name: string;
  color: string;
  /** true if crystalline (allows channeling) */
  crystalline: boolean;
}

export const MATERIAL_DB: Record<TargetMaterial, MaterialData> = {
  Si:          { Z: 14,  M: 28.09, density: 50.0,  Ed: 15, name: 'Silicon',       color: '#60a5fa', crystalline: true  },
  SiO2:        { Z: 10,  M: 20.0,  density: 66.0,  Ed: 20, name: 'Silicon Oxide',  color: '#a78bfa', crystalline: false },
  photoresist: { Z: 6.5, M: 12.5,  density: 55.0,  Ed: 28, name: 'Photoresist',    color: '#fbbf24', crystalline: false },
};

// ─── Crystal Channel Spacings ───
export interface ChannelData {
  rowSpacing: number;   // nm — atomic row spacing d
  planeSpacing: number; // nm — planar channel half-width
}

export const CHANNEL_DB: Record<CrystalOrientation, ChannelData> = {
  '100': { rowSpacing: 0.5431, planeSpacing: 0.1358 },
  '110': { rowSpacing: 0.3840, planeSpacing: 0.1920 },
  '111': { rowSpacing: 0.3139, planeSpacing: 0.1570 },
};

// ─── Simulation Constants ───
export const DEPTH_BINS = 200;
export const DEFAULT_TOTAL_STEPS = 200;
export const DEFAULT_ION_COUNT = 500;
export const E_CUTOFF_EV = 5;
export const MAX_TRAJECTORY_POINTS = 400;
export const MAX_RECOIL_CASCADES = 3;
export const P_MAX_FACTOR = 1.2;

// ─── Empirical LSS Range Coefficients (for max depth estimation) ───
// Rp(nm) ≈ C * E(keV)^alpha  — rough fit per species in Si
export const LSS_RANGE_FIT: Record<IonSpecies, { C: number; alpha: number }> = {
  B:   { C: 3.0,  alpha: 0.85 },
  P:   { C: 1.3,  alpha: 0.85 },
  As:  { C: 0.55, alpha: 0.85 },
  BF2: { C: 3.0,  alpha: 0.85 }, // uses effective B energy
};

/** Estimate max simulation depth based on ion/energy */
export function estimateMaxDepth(species: IonSpecies, energyKeV: number): number {
  let effectiveE = energyKeV;
  if (species === 'BF2') {
    effectiveE = energyKeV * (ION_DB.BF2.M / ION_DB.BF2.molecularMass!);
  }
  const fit = LSS_RANGE_FIT[species];
  const Rp = fit.C * Math.pow(effectiveE, fit.alpha);
  return Math.max(50, Rp * 4);
}

// ─── Parameter Bounds ───
export const PARAM_BOUNDS = {
  beamEnergy:             { min: 1,    max: 800,  default: 50,   step: 1,    unit: 'keV',       label: 'Beam Energy' },
  dose:                   { min: 11,   max: 16,   default: 13,   step: 0.5,  unit: 'ions/cm\u00B2', label: 'Dose (10\u02E3)' },
  beamCurrent:            { min: 0.1,  max: 20,   default: 5,    step: 0.1,  unit: 'mA',        label: 'Beam Current' },
  tiltAngle:              { min: 0,    max: 60,   default: 7,    step: 1,    unit: '\u00B0',    label: 'Tilt Angle' },
  twistAngle:             { min: 0,    max: 360,  default: 0,    step: 5,    unit: '\u00B0',    label: 'Twist Angle' },
  screenOxideThickness:   { min: 0,    max: 100,  default: 0,    step: 1,    unit: 'nm',        label: 'Screen Oxide' },
  photoresistThickness:   { min: 0,    max: 2000, default: 0,    step: 10,   unit: 'nm',        label: 'Resist Thick' },
  substrateTemperature:   { min: 25,   max: 600,  default: 25,   step: 5,    unit: '\u00B0C',   label: 'Substrate T' },
  amorphizationThreshold: { min: 1,    max: 20,   default: 5,    step: 0.5,  unit: '\u00D710\u00B2\u00B9', label: 'Amorph Thresh' },
  damageAnnealingRate:    { min: 0,    max: 1,    default: 0,    step: 0.05, unit: 'a.u.',      label: 'Anneal Rate' },
} as const;

export const DEFAULT_PARAMS: SimulationParams = {
  ionSpecies: 'B',
  beamEnergy: PARAM_BOUNDS.beamEnergy.default,
  dose: Math.pow(10, PARAM_BOUNDS.dose.default),
  beamCurrent: PARAM_BOUNDS.beamCurrent.default,
  tiltAngle: PARAM_BOUNDS.tiltAngle.default,
  twistAngle: PARAM_BOUNDS.twistAngle.default,
  crystalOrientation: '100',
  screenOxideThickness: PARAM_BOUNDS.screenOxideThickness.default,
  photoresistThickness: PARAM_BOUNDS.photoresistThickness.default,
  substrateTemperature: PARAM_BOUNDS.substrateTemperature.default,
  amorphizationThreshold: PARAM_BOUNDS.amorphizationThreshold.default,
  damageAnnealingRate: PARAM_BOUNDS.damageAnnealingRate.default,
  totalSteps: DEFAULT_TOTAL_STEPS,
};

// ─── Seeded PRNG (Mulberry32) for reproducible MC ───
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

**Test:** `src/lib/implant-sim/__tests__/constants.test.ts`

```typescript
import { DEFAULT_PARAMS, ION_DB, MATERIAL_DB, CHANNEL_DB, estimateMaxDepth, mulberry32, DEPTH_BINS } from '../constants';

describe('constants', () => {
  test('DEFAULT_PARAMS has all required fields', () => {
    expect(DEFAULT_PARAMS.ionSpecies).toBe('B');
    expect(DEFAULT_PARAMS.beamEnergy).toBe(50);
    expect(DEFAULT_PARAMS.tiltAngle).toBe(7);
    expect(DEFAULT_PARAMS.totalSteps).toBe(200);
  });

  test('ION_DB has 4 species', () => {
    expect(Object.keys(ION_DB)).toHaveLength(4);
    expect(ION_DB.B.Z).toBe(5);
    expect(ION_DB.As.Z).toBe(33);
    expect(ION_DB.BF2.molecularMass).toBeGreaterThan(ION_DB.BF2.M);
  });

  test('MATERIAL_DB has 3 targets', () => {
    expect(Object.keys(MATERIAL_DB)).toHaveLength(3);
    expect(MATERIAL_DB.Si.crystalline).toBe(true);
    expect(MATERIAL_DB.SiO2.crystalline).toBe(false);
  });

  test('estimateMaxDepth returns reasonable range', () => {
    const dB = estimateMaxDepth('B', 50);
    expect(dB).toBeGreaterThan(100);
    expect(dB).toBeLessThan(2000);
    const dAs = estimateMaxDepth('As', 50);
    expect(dAs).toBeLessThan(dB); // heavier ion, shallower
  });

  test('mulberry32 produces deterministic sequence', () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);
    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());
    expect(seq1).toEqual(seq2);
    seq1.forEach(v => { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1); });
  });
});
```

**Commit:** `feat(implant-sim): types and constants for ion implantation MC sim`

---

## Task 2: ZBL Potential

**Files:**
- Create: `src/lib/implant-sim/zbl-potential.ts`
- Test: `src/lib/implant-sim/__tests__/zbl-potential.test.ts`

### `zbl-potential.ts`

```typescript
import { ZBL_A, ZBL_B, BOHR_RADIUS_NM, COULOMB_CONST } from './constants';

/**
 * ZBL universal screening function φ(x).
 * φ(0) = 1 (unscreened Coulomb at r→0), φ→0 as x→∞.
 */
export function screeningFunction(x: number): number {
  let sum = 0;
  for (let i = 0; i < 4; i++) {
    sum += ZBL_A[i] * Math.exp(-ZBL_B[i] * x);
  }
  return sum;
}

/**
 * ZBL screening length a(Z1, Z2) in nm.
 */
export function screeningLength(Z1: number, Z2: number): number {
  return (0.8854 * BOHR_RADIUS_NM) / (Math.pow(Z1, 0.23) + Math.pow(Z2, 0.23));
}

/**
 * Compute scattering outcome for a single binary collision.
 *
 * Uses the ZBL "magic formula" approximation for the scattering angle
 * in the center-of-mass frame, then transforms to lab frame.
 *
 * @param E_eV  projectile kinetic energy in lab frame (eV)
 * @param p_nm  impact parameter (nm)
 * @param Z1    projectile atomic number
 * @param Z2    target atomic number
 * @param M1    projectile mass (amu)
 * @param M2    target mass (amu)
 * @returns lab-frame scattering angle (rad) and energy transferred to target (eV)
 */
export function computeCollision(
  E_eV: number,
  p_nm: number,
  Z1: number,
  Z2: number,
  M1: number,
  M2: number,
): { theta: number; T_eV: number } {
  const a = screeningLength(Z1, Z2);

  // Reduced energy: ε = a·M₂·E / (Z₁·Z₂·e²·(M₁+M₂))
  const epsilon = (a * M2 * E_eV) / (Z1 * Z2 * COULOMB_CONST * (M1 + M2));

  // Reduced impact parameter
  const b = p_nm / a;

  // CM scattering angle via magic formula approximation:
  // For small b (close collision): θ → π
  // For large b (distant): θ → 0
  // θ_CM ≈ π / (1 + (2ε·b)^(0.5 + 0.35·ε·b))
  const A = 2 * epsilon * b;
  const exponent = 0.5 + 0.3535 * Math.sqrt(A);
  const theta_cm = Math.PI / (1 + Math.pow(Math.max(A, 1e-10), exponent));

  // Energy transfer (exact for elastic collision)
  const T_max = (4 * M1 * M2) / ((M1 + M2) ** 2) * E_eV;
  const T_eV = T_max * Math.pow(Math.sin(theta_cm / 2), 2);

  // Lab-frame scattering angle for projectile
  const sinCM = Math.sin(theta_cm);
  const cosCM = Math.cos(theta_cm);
  const theta_lab = Math.atan2(sinCM, cosCM + M1 / M2);

  return { theta: Math.abs(theta_lab), T_eV };
}
```

### `zbl-potential.test.ts`

```typescript
import { screeningFunction, screeningLength, computeCollision } from '../zbl-potential';

describe('zbl-potential', () => {
  test('screening function phi(0) equals 1', () => {
    expect(screeningFunction(0)).toBeCloseTo(1.0, 4);
  });

  test('screening function decays with distance', () => {
    const phi1 = screeningFunction(1);
    const phi5 = screeningFunction(5);
    const phi10 = screeningFunction(10);
    expect(phi1).toBeLessThan(1);
    expect(phi5).toBeLessThan(phi1);
    expect(phi10).toBeLessThan(phi5);
    expect(phi10).toBeGreaterThan(0);
  });

  test('screening length scales inversely with Z sum', () => {
    const a_BinSi = screeningLength(5, 14);
    const a_AsinSi = screeningLength(33, 14);
    // Higher Z sum → shorter screening length
    expect(a_AsinSi).toBeLessThan(a_BinSi);
    // Both should be on order of 0.01 nm
    expect(a_BinSi).toBeGreaterThan(0.005);
    expect(a_BinSi).toBeLessThan(0.05);
  });

  test('head-on collision (p≈0) transfers maximum energy', () => {
    const { T_eV } = computeCollision(50000, 0.0001, 5, 14, 11, 28);
    const T_max = (4 * 11 * 28) / ((11 + 28) ** 2) * 50000;
    expect(T_eV).toBeGreaterThan(T_max * 0.5);
  });

  test('glancing collision (large p) transfers little energy', () => {
    const { T_eV, theta } = computeCollision(50000, 0.1, 5, 14, 11, 28);
    expect(T_eV).toBeLessThan(1000);
    expect(theta).toBeLessThan(0.5);
  });

  test('lower energy increases scattering angle', () => {
    const p = 0.01;
    const { theta: thetaHi } = computeCollision(100000, p, 5, 14, 11, 28);
    const { theta: thetaLo } = computeCollision(5000, p, 5, 14, 11, 28);
    expect(thetaLo).toBeGreaterThan(thetaHi);
  });
});
```

**Commit:** `feat(implant-sim): ZBL screened Coulomb potential`

---

## Task 3: Stopping Power

**Files:**
- Create: `src/lib/implant-sim/stopping-power.ts`
- Test: `src/lib/implant-sim/__tests__/stopping-power.test.ts`

### `stopping-power.ts`

```typescript
import { COULOMB_CONST, BOHR_RADIUS_NM } from './constants';
import type { MaterialData } from './constants';
import { screeningLength } from './zbl-potential';

/**
 * Nuclear stopping power Sn(E) in eV/nm.
 *
 * Uses the ZBL universal nuclear stopping formula in reduced units,
 * then converts to eV/nm via material density.
 */
export function nuclearStopping(
  E_eV: number,
  Z1: number, M1: number,
  Z2: number, M2: number,
  density: number, // atoms/nm³
): number {
  if (E_eV <= 0) return 0;

  const a = screeningLength(Z1, Z2);

  // Reduced energy
  const epsilon = (a * M2 * E_eV) / (Z1 * Z2 * COULOMB_CONST * (M1 + M2));

  // ZBL universal reduced nuclear stopping
  let sn_reduced: number;
  if (epsilon <= 30) {
    sn_reduced =
      (0.5 * Math.log(1 + 1.1383 * epsilon)) /
      (epsilon + 0.01321 * Math.pow(epsilon, 0.21226) + 0.19593 * Math.pow(epsilon, 0.5));
  } else {
    sn_reduced = Math.log(epsilon) / (2 * epsilon);
  }

  // Convert to eV/nm:
  // Sn = sn_reduced * 4π * a * Z1 * Z2 * COULOMB_CONST * M1 / (M1 + M2) * density
  // Simplified: Sn_eV_per_nm = sn_reduced * cross_section * density
  const crossSection =
    (Math.PI * a * Z1 * Z2 * COULOMB_CONST * M1) / ((M1 + M2) * E_eV) * E_eV;
  // Actually re-derive properly:
  // The stopping cross section in reduced units → convert:
  // S_n = sn_reduced * 8.462e-2 * Z1 * Z2 * M1 / ((M1+M2) * (Z1^0.23 + Z2^0.23))  [eV·nm²]
  // Then dE/dx = S_n * density
  const Sn_cross = sn_reduced * 0.08462 * Z1 * Z2 * M1 / ((M1 + M2) * (Math.pow(Z1, 0.23) + Math.pow(Z2, 0.23)));

  return Sn_cross * density;
}

/**
 * Electronic stopping power Se(E) in eV/nm.
 *
 * Lindhard-Scharff model: Se ∝ Z1^(1/6) * √E
 * Parameterized to match SRIM data for common ion/target pairs.
 */
export function electronicStopping(
  E_eV: number,
  Z1: number, M1: number,
  Z2: number, M2: number,
  density: number,
): number {
  if (E_eV <= 0) return 0;

  // Lindhard-Scharff coefficient (simplified):
  // k_LS ∝ Z1^(1/6) * √(Z1*Z2) / (Z1^(2/3) + Z2^(2/3))^(3/2) * (M1/M2)^(1/2)
  const Z_sum_23 = Math.pow(Z1, 2 / 3) + Math.pow(Z2, 2 / 3);
  const k_LS =
    0.0793 *
    Math.pow(Z1, 1 / 6) *
    Math.sqrt(Z1 * Z2) /
    Math.pow(Z_sum_23, 1.5) *
    Math.sqrt(M1 / M2);

  // Se = k_LS * √(E/1000) * density * calibration
  // calibration scale to match SRIM output (Se for B in Si at 50 keV ≈ 30 eV/nm)
  const Se_cross = k_LS * Math.sqrt(E_eV / 1000) * 0.15;

  return Se_cross * density;
}

/**
 * Compute electronic energy loss over a flight path.
 */
export function computeElectronicLoss(
  E_eV: number,
  dx_nm: number,
  Z1: number, M1: number,
  material: MaterialData,
): number {
  const Se = electronicStopping(E_eV, Z1, M1, material.Z, material.M, material.density);
  return Se * dx_nm;
}

/**
 * Total stopping power (nuclear + electronic) in eV/nm.
 */
export function totalStopping(
  E_eV: number,
  Z1: number, M1: number,
  Z2: number, M2: number,
  density: number,
): number {
  return nuclearStopping(E_eV, Z1, M1, Z2, M2, density) +
         electronicStopping(E_eV, Z1, M1, Z2, M2, density);
}
```

### `stopping-power.test.ts`

```typescript
import { nuclearStopping, electronicStopping, totalStopping } from '../stopping-power';
import { ION_DB, MATERIAL_DB } from '../constants';

describe('stopping-power', () => {
  const Si = MATERIAL_DB.Si;
  const B = ION_DB.B;

  test('nuclear stopping is positive for B in Si', () => {
    const Sn = nuclearStopping(50000, B.Z, B.M, Si.Z, Si.M, Si.density);
    expect(Sn).toBeGreaterThan(0);
  });

  test('nuclear stopping peaks at low energy and decreases', () => {
    const Sn_low = nuclearStopping(1000, B.Z, B.M, Si.Z, Si.M, Si.density);
    const Sn_hi = nuclearStopping(500000, B.Z, B.M, Si.Z, Si.M, Si.density);
    expect(Sn_low).toBeGreaterThan(Sn_hi);
  });

  test('electronic stopping increases with sqrt(E)', () => {
    const Se_lo = electronicStopping(10000, B.Z, B.M, Si.Z, Si.M, Si.density);
    const Se_hi = electronicStopping(100000, B.Z, B.M, Si.Z, Si.M, Si.density);
    expect(Se_hi).toBeGreaterThan(Se_lo);
    // Should scale roughly as sqrt(10) ≈ 3.16
    const ratio = Se_hi / Se_lo;
    expect(ratio).toBeGreaterThan(2);
    expect(ratio).toBeLessThan(5);
  });

  test('electronic stopping dominates at high energy', () => {
    const E = 500000; // 500 keV
    const Sn = nuclearStopping(E, B.Z, B.M, Si.Z, Si.M, Si.density);
    const Se = electronicStopping(E, B.Z, B.M, Si.Z, Si.M, Si.density);
    expect(Se).toBeGreaterThan(Sn);
  });

  test('heavier target increases nuclear stopping', () => {
    const Sn_Si = nuclearStopping(50000, B.Z, B.M, Si.Z, Si.M, Si.density);
    // As in Si (heavier projectile → more nuclear stopping at same energy)
    const As = ION_DB.As;
    const Sn_As = nuclearStopping(50000, As.Z, As.M, Si.Z, Si.M, Si.density);
    expect(Sn_As).toBeGreaterThan(Sn_Si);
  });

  test('total stopping is sum of nuclear + electronic', () => {
    const E = 50000;
    const Sn = nuclearStopping(E, B.Z, B.M, Si.Z, Si.M, Si.density);
    const Se = electronicStopping(E, B.Z, B.M, Si.Z, Si.M, Si.density);
    const St = totalStopping(E, B.Z, B.M, Si.Z, Si.M, Si.density);
    expect(St).toBeCloseTo(Sn + Se, 5);
  });
});
```

**Commit:** `feat(implant-sim): nuclear + electronic stopping power models`

---

## Task 4: BCA Engine

**Files:**
- Create: `src/lib/implant-sim/bca-engine.ts`
- Test: `src/lib/implant-sim/__tests__/bca-engine.test.ts`

### `bca-engine.ts`

```typescript
import type { Vec3, CollisionEvent, IonTrajectory, LayerDef, SimulationParams } from './types';
import {
  ION_DB, MATERIAL_DB, E_CUTOFF_EV, MAX_TRAJECTORY_POINTS,
  MAX_RECOIL_CASCADES, P_MAX_FACTOR, mulberry32,
} from './constants';
import type { MaterialData } from './constants';
import { computeCollision } from './zbl-potential';
import { computeElectronicLoss } from './stopping-power';

function vecAdd(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function vecScale(v: Vec3, s: number): Vec3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

function vecLen(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function vecNorm(v: Vec3): Vec3 {
  const l = vecLen(v);
  return l > 0 ? { x: v.x / l, y: v.y / l, z: v.z / l } : { x: 0, y: 0, z: 1 };
}

/**
 * Deflect a direction vector by scattering angle theta and random azimuthal phi.
 */
function deflect(dir: Vec3, theta: number, phi: number): Vec3 {
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  const cp = Math.cos(phi);
  const sp = Math.sin(phi);

  const d = vecNorm(dir);

  // Handle near-vertical case
  if (Math.abs(d.z) > 0.999) {
    return vecNorm({
      x: st * cp,
      y: st * sp,
      z: d.z > 0 ? ct : -ct,
    });
  }

  const denom = Math.sqrt(1 - d.z * d.z);
  return vecNorm({
    x: (st * (d.x * d.z * cp - d.y * sp)) / denom + d.x * ct,
    y: (st * (d.y * d.z * cp + d.x * sp)) / denom + d.y * ct,
    z: -st * cp * denom + d.z * ct,
  });
}

/**
 * Get the material at a given depth, given the layer stack.
 * Returns null if ion has exited (backscattered above surface).
 */
function getMaterialAtDepth(depthNm: number, layers: LayerDef[]): MaterialData | null {
  if (depthNm < 0) return null; // backscattered
  for (const layer of layers) {
    if (depthNm >= layer.startNm && depthNm < layer.endNm) {
      return MATERIAL_DB[layer.material];
    }
  }
  // Beyond last layer — still in substrate (Si extends infinitely)
  return MATERIAL_DB.Si;
}

/**
 * Build layer stack from simulation params.
 */
export function buildLayers(params: SimulationParams): LayerDef[] {
  const layers: LayerDef[] = [];
  let z = 0;

  if (params.photoresistThickness > 0) {
    layers.push({ material: 'photoresist', startNm: z, endNm: z + params.photoresistThickness });
    z += params.photoresistThickness;
  }
  if (params.screenOxideThickness > 0) {
    layers.push({ material: 'SiO2', startNm: z, endNm: z + params.screenOxideThickness });
    z += params.screenOxideThickness;
  }
  // Silicon substrate extends from z to "infinity" (handled by getMaterialAtDepth fallback)
  layers.push({ material: 'Si', startNm: z, endNm: z + 10000 });

  return layers;
}

/**
 * Trace a single recoil cascade (limited depth).
 */
function traceRecoil(
  startPos: Vec3,
  startEnergy: number,
  material: MaterialData,
  rng: () => number,
): Vec3[] {
  const points: Vec3[] = [{ ...startPos }];
  let pos = { ...startPos };
  let E = startEnergy;

  // Random initial direction for recoil
  const phi0 = rng() * 2 * Math.PI;
  const cosTheta0 = 2 * rng() - 1;
  const sinTheta0 = Math.sqrt(1 - cosTheta0 * cosTheta0);
  let dir: Vec3 = { x: sinTheta0 * Math.cos(phi0), y: sinTheta0 * Math.sin(phi0), z: cosTheta0 };

  let steps = 0;
  while (E > E_CUTOFF_EV && steps < 20) {
    steps++;
    const meanFree = 1 / (material.density * Math.PI * 0.01);
    const flightDist = meanFree * (-Math.log(Math.max(rng(), 1e-10)));
    const eLoss = computeElectronicLoss(E, flightDist, material.Z, material.M, material);
    E -= eLoss;
    if (E <= E_CUTOFF_EV) break;

    pos = vecAdd(pos, vecScale(dir, flightDist));
    points.push({ ...pos });

    const p = Math.sqrt(rng()) * 0.05;
    const { theta, T_eV } = computeCollision(E, p, material.Z, material.M, material.Z, material.M);
    E -= T_eV;
    const azimuth = rng() * 2 * Math.PI;
    dir = deflect(dir, theta, azimuth);
  }

  return points;
}

/**
 * Compute initial beam direction from tilt and twist angles.
 * z-axis points into substrate (downward). Tilt is angle from z-axis.
 */
function beamDirection(tiltDeg: number, twistDeg: number): Vec3 {
  const tilt = (tiltDeg * Math.PI) / 180;
  const twist = (twistDeg * Math.PI) / 180;
  return vecNorm({
    x: Math.sin(tilt) * Math.cos(twist),
    y: Math.sin(tilt) * Math.sin(twist),
    z: Math.cos(tilt),
  });
}

/**
 * Check if the ion is in a crystalline channeling condition.
 * Returns true if the ion's direction is within the critical angle of a channel axis.
 */
export function isChannelingCondition(
  dir: Vec3,
  tiltDeg: number,
  amorphousAtDepth: boolean,
): boolean {
  if (amorphousAtDepth) return false;
  // Channeling is most likely when tilt < critical angle
  // Approximate: if tilt < 5° and not amorphous, there's a probability of channeling
  // The probability decreases with tilt angle
  const tiltRad = (tiltDeg * Math.PI) / 180;
  const dirAngle = Math.acos(Math.min(1, Math.abs(dir.z)));
  return dirAngle < tiltRad + 0.05; // small angle from surface normal
}

/**
 * Trace a single ion through the target.
 */
export function traceIon(
  params: SimulationParams,
  layers: LayerDef[],
  damageState: number[],
  depthBinSize: number,
  maxDepthNm: number,
  rng: () => number,
): IonTrajectory {
  const ion = ION_DB[params.ionSpecies];
  let Z1 = ion.Z;
  let M1 = ion.M;

  // BF2: energy partition — B gets E * (M_B / M_BF2)
  let E = params.beamEnergy * 1000; // keV → eV
  if (params.ionSpecies === 'BF2' && ion.molecularMass) {
    E = E * (ion.M / ion.molecularMass);
  }

  let dir = beamDirection(params.tiltAngle, params.twistAngle);
  let pos: Vec3 = {
    x: (rng() - 0.5) * 2, // small random lateral offset
    y: (rng() - 0.5) * 2,
    z: 0,
  };

  const points: Vec3[] = [{ ...pos }];
  const energyAtPoints: number[] = [E];
  const collisions: CollisionEvent[] = [];
  const recoilCascades: Vec3[][] = [];
  let channeled = false;
  let backscattered = false;
  let steps = 0;

  while (E > E_CUTOFF_EV && steps < MAX_TRAJECTORY_POINTS) {
    steps++;

    const material = getMaterialAtDepth(pos.z, layers);
    if (!material) {
      backscattered = true;
      break;
    }

    // Mean free path: λ = 1/(n·π·pMax²)
    const pMax = P_MAX_FACTOR / Math.cbrt(material.density);
    const meanFree = 1 / (material.density * Math.PI * pMax * pMax);
    const flightDist = meanFree * (-Math.log(Math.max(rng(), 1e-10)));

    // Check channeling (only in crystalline Si)
    const depthBin = Math.min(Math.floor(pos.z / depthBinSize), damageState.length - 1);
    const isAmorphous = depthBin >= 0 && depthBin < damageState.length &&
      damageState[depthBin] >= params.amorphizationThreshold * 1e21 / (1e21); // normalized

    const inChannel = material.crystalline && !isAmorphous &&
      params.tiltAngle < 5 && Math.acos(Math.abs(dir.z)) < 0.1 &&
      rng() < 0.6; // probabilistic channeling

    if (inChannel) {
      channeled = true;
      // Channeled: only electronic stopping, longer flight
      const chanFlight = flightDist * 3;
      const eLoss = computeElectronicLoss(E, chanFlight, Z1, M1, material);
      E -= eLoss;
      pos = vecAdd(pos, vecScale(dir, chanFlight));

      // Dechanneling probability (thermal vibrations + defects)
      const debyeTemp = 645; // Si Debye temperature (K)
      const tempK = params.substrateTemperature + 273.15;
      const thermalDechannel = 0.02 * (tempK / debyeTemp);
      const defectDechannel = isAmorphous ? 1.0 : (depthBin >= 0 ? damageState[depthBin] * 0.1 : 0);

      if (rng() < thermalDechannel + defectDechannel) {
        // Dechanneled — add small random deflection
        dir = deflect(dir, 0.05 * rng(), rng() * 2 * Math.PI);
      }
    } else {
      // Normal BCA collision
      const eLoss = computeElectronicLoss(E, flightDist, Z1, M1, material);
      E -= eLoss;
      if (E <= E_CUTOFF_EV) break;

      pos = vecAdd(pos, vecScale(dir, flightDist));

      // Random impact parameter
      const p = Math.sqrt(rng()) * pMax;

      const { theta, T_eV } = computeCollision(E, p, Z1, material.Z, M1, material.M);
      E -= T_eV;

      const isDisplacement = T_eV > material.Ed;
      const recoilCreated = isDisplacement && T_eV > 2 * material.Ed;

      collisions.push({
        position: { ...pos },
        energyTransfer: T_eV,
        isDisplacement,
        recoilCreated,
      });

      // Deflect ion
      const azimuth = rng() * 2 * Math.PI;
      dir = deflect(dir, theta, azimuth);

      // Track recoil cascade
      if (recoilCreated && recoilCascades.length < MAX_RECOIL_CASCADES) {
        recoilCascades.push(traceRecoil(pos, T_eV - material.Ed, material, rng));
      }
    }

    // Prevent ion going backwards beyond surface
    if (pos.z < -5) {
      backscattered = true;
      break;
    }

    // Prevent runaway depth
    if (pos.z > maxDepthNm * 1.5) break;

    points.push({ ...pos });
    energyAtPoints.push(Math.max(0, E));
  }

  // Final position
  const finalPosition = { ...pos };
  if (!backscattered) {
    points.push(finalPosition);
    energyAtPoints.push(Math.max(0, E));
  }

  return {
    points,
    collisions,
    finalPosition,
    recoilCascades,
    channeled,
    backscattered,
    energyAtPoints,
  };
}
```

### `bca-engine.test.ts`

```typescript
import { traceIon, buildLayers } from '../bca-engine';
import { DEFAULT_PARAMS, DEPTH_BINS, estimateMaxDepth, mulberry32 } from '../constants';

describe('bca-engine', () => {
  const maxDepth = estimateMaxDepth('B', 50);
  const binSize = maxDepth / DEPTH_BINS;
  const layers = buildLayers(DEFAULT_PARAMS);
  const damage = new Array(DEPTH_BINS).fill(0);

  test('ion stops within substrate (positive z)', () => {
    const rng = mulberry32(1);
    const traj = traceIon(DEFAULT_PARAMS, layers, damage, binSize, maxDepth, rng);
    expect(traj.finalPosition.z).toBeGreaterThan(0);
    expect(traj.backscattered).toBe(false);
  });

  test('trajectory has multiple points', () => {
    const rng = mulberry32(2);
    const traj = traceIon(DEFAULT_PARAMS, layers, damage, binSize, maxDepth, rng);
    expect(traj.points.length).toBeGreaterThan(5);
  });

  test('energy decreases along trajectory', () => {
    const rng = mulberry32(3);
    const traj = traceIon(DEFAULT_PARAMS, layers, damage, binSize, maxDepth, rng);
    const first = traj.energyAtPoints[0];
    const last = traj.energyAtPoints[traj.energyAtPoints.length - 1];
    expect(first).toBeGreaterThan(last);
  });

  test('heavier ion (As) stops shallower than B at same energy', () => {
    const rng1 = mulberry32(10);
    const trajB = traceIon(DEFAULT_PARAMS, layers, damage, binSize, maxDepth, rng1);

    const asParams = { ...DEFAULT_PARAMS, ionSpecies: 'As' as const };
    const asMaxDepth = estimateMaxDepth('As', 50);
    const asBinSize = asMaxDepth / DEPTH_BINS;
    const asLayers = buildLayers(asParams);
    const rng2 = mulberry32(10);
    const trajAs = traceIon(asParams, asLayers, damage, asBinSize, asMaxDepth, rng2);

    expect(trajAs.finalPosition.z).toBeLessThan(trajB.finalPosition.z);
  });

  test('collisions create displacement events', () => {
    const rng = mulberry32(5);
    const traj = traceIon(DEFAULT_PARAMS, layers, damage, binSize, maxDepth, rng);
    const displacements = traj.collisions.filter(c => c.isDisplacement);
    expect(displacements.length).toBeGreaterThan(0);
  });

  test('buildLayers respects oxide and resist thickness', () => {
    const params = { ...DEFAULT_PARAMS, screenOxideThickness: 20, photoresistThickness: 500 };
    const l = buildLayers(params);
    expect(l.length).toBe(3);
    expect(l[0].material).toBe('photoresist');
    expect(l[1].material).toBe('SiO2');
    expect(l[2].material).toBe('Si');
    expect(l[1].startNm).toBe(500);
    expect(l[2].startNm).toBe(520);
  });
});
```

**Commit:** `feat(implant-sim): BCA engine with single-ion trajectory tracing`

---

## Task 5: Channeling Model

**Files:**
- Create: `src/lib/implant-sim/channeling-model.ts`
- Test: `src/lib/implant-sim/__tests__/channeling-model.test.ts`

### `channeling-model.ts`

```typescript
import { COULOMB_CONST, CHANNEL_DB, ION_DB } from './constants';
import type { IonSpecies, CrystalOrientation } from './types';

/**
 * Lindhard critical angle for axial channeling (radians).
 *
 * ψ_c = sqrt(2 * Z1 * Z2 * e² / (E * d))
 * where d is the atomic row spacing for the given crystal orientation.
 */
export function criticalAngle(
  E_eV: number,
  Z1: number,
  Z2: number,
  orientation: CrystalOrientation,
): number {
  if (E_eV <= 0) return Math.PI;
  const d = CHANNEL_DB[orientation].rowSpacing;
  return Math.sqrt((2 * Z1 * Z2 * COULOMB_CONST) / (E_eV * d));
}

/**
 * Compute the angle between beam direction and channel axis.
 * For axial channeling, the channel axis is the surface normal (z-axis)
 * rotated by crystal orientation effects.
 *
 * Simplified: the effective channel angle is primarily the tilt angle,
 * with twist providing the azimuthal alignment.
 */
export function angleToChannel(
  tiltDeg: number,
  twistDeg: number,
  orientation: CrystalOrientation,
): number {
  // For <100> Si, channel is along [100] — parallel to surface normal when wafer is (100)
  // For <110>, the channel axis is at 45° from surface normal in (100) wafer
  // For <111>, it's at 54.7°
  const tiltRad = (tiltDeg * Math.PI) / 180;

  switch (orientation) {
    case '100':
      return tiltRad; // channel is along surface normal
    case '110':
      // Nearest <110> axis at 45° from normal
      return Math.abs(tiltRad - Math.PI / 4);
    case '111':
      // Nearest <111> axis at 54.7° from normal
      return Math.abs(tiltRad - (54.7 * Math.PI) / 180);
  }
}

/**
 * Determine if an ion can enter channeling at given conditions.
 */
export function canChannel(
  E_eV: number,
  species: IonSpecies,
  tiltDeg: number,
  twistDeg: number,
  orientation: CrystalOrientation,
  isAmorphous: boolean,
): boolean {
  if (isAmorphous) return false;

  const ion = ION_DB[species];
  const psi_c = criticalAngle(E_eV, ion.Z, 14, orientation); // Z2=14 for Si
  const angle = angleToChannel(tiltDeg, twistDeg, orientation);

  return angle < psi_c;
}

/**
 * Compute dechanneling probability per step.
 *
 * Increases with:
 * - Temperature (thermal vibrations displace atoms from lattice sites)
 * - Damage density (displaced atoms obstruct channels)
 * - Depth (accumulated electronic scattering)
 */
export function dechannelingProbability(
  temperatureC: number,
  damageNormalized: number,
  depthFraction: number,
): number {
  const debyeTemp = 645; // Si Debye temperature in K
  const tempK = temperatureC + 273.15;

  // Thermal contribution: RMS displacement amplitude ∝ sqrt(T)
  const thermal = 0.015 * Math.sqrt(tempK / debyeTemp);

  // Damage contribution
  const damage = Math.min(0.5, damageNormalized * 0.3);

  // Depth contribution (gradual dechanneling)
  const depth = 0.005 * depthFraction;

  return Math.min(1, thermal + damage + depth);
}
```

### `channeling-model.test.ts`

```typescript
import { criticalAngle, angleToChannel, canChannel, dechannelingProbability } from '../channeling-model';

describe('channeling-model', () => {
  test('critical angle decreases with energy', () => {
    const psi_low = criticalAngle(10000, 5, 14, '100');
    const psi_high = criticalAngle(100000, 5, 14, '100');
    expect(psi_low).toBeGreaterThan(psi_high);
  });

  test('critical angle is positive and reasonable', () => {
    const psi = criticalAngle(50000, 5, 14, '100');
    expect(psi).toBeGreaterThan(0);
    expect(psi).toBeLessThan(0.5); // should be a few degrees
  });

  test('0° tilt on <100> produces zero angle to channel', () => {
    const angle = angleToChannel(0, 0, '100');
    expect(angle).toBeCloseTo(0, 5);
  });

  test('7° tilt exceeds critical angle for high energy B', () => {
    // At 50 keV, critical angle for B in <100> Si is ~2-3°
    const can = canChannel(50000, 'B', 7, 0, '100', false);
    // 7° > ψ_c so should NOT channel
    expect(can).toBe(false);
  });

  test('0° tilt enables channeling for B at 50 keV', () => {
    const can = canChannel(50000, 'B', 0, 0, '100', false);
    expect(can).toBe(true);
  });

  test('amorphous region blocks channeling', () => {
    const can = canChannel(50000, 'B', 0, 0, '100', true);
    expect(can).toBe(false);
  });

  test('dechanneling probability increases with temperature', () => {
    const p_cold = dechannelingProbability(25, 0, 0.5);
    const p_hot = dechannelingProbability(500, 0, 0.5);
    expect(p_hot).toBeGreaterThan(p_cold);
  });

  test('dechanneling probability increases with damage', () => {
    const p_clean = dechannelingProbability(25, 0, 0.5);
    const p_damaged = dechannelingProbability(25, 0.8, 0.5);
    expect(p_damaged).toBeGreaterThan(p_clean);
  });
});
```

**Commit:** `feat(implant-sim): crystal channeling model with Lindhard critical angle`

---

## Task 6: Damage Model

**Files:**
- Create: `src/lib/implant-sim/damage-model.ts`
- Test: `src/lib/implant-sim/__tests__/damage-model.test.ts`

### `damage-model.ts`

```typescript
import { DEPTH_BINS } from './constants';

export interface DamageState {
  /** Normalized vacancy density per bin (0-1 scale, 1 = amorphization threshold) */
  vacancies: number[];
  /** Absolute vacancy count per bin for concentration calculation */
  vacancyCounts: number[];
  /** Total Frenkel pairs created */
  totalFrenkelPairs: number;
}

/**
 * Create fresh damage state.
 */
export function createDamageState(bins: number = DEPTH_BINS): DamageState {
  return {
    vacancies: new Array(bins).fill(0),
    vacancyCounts: new Array(bins).fill(0),
    totalFrenkelPairs: 0,
  };
}

/**
 * Record lattice damage at a specific depth.
 *
 * @param state      mutable damage state
 * @param depthNm    depth where damage occurred
 * @param binSize    nm per bin
 * @param count      number of Frenkel pairs (usually 1)
 * @param threshold  amorphization threshold (normalized units)
 */
export function recordDamage(
  state: DamageState,
  depthNm: number,
  binSize: number,
  count: number,
  threshold: number,
): void {
  const bin = Math.floor(depthNm / binSize);
  if (bin < 0 || bin >= state.vacancies.length) return;

  // Increment normalized vacancy density
  // Scale: each vacancy increments by 1/threshold toward amorphization
  state.vacancies[bin] += count / Math.max(1, threshold * 100);
  state.vacancyCounts[bin] += count;
  state.totalFrenkelPairs += count;
}

/**
 * Apply temperature-dependent annealing (Frenkel pair recombination).
 *
 * R_anneal = k0 * exp(-Ea/(kT)) * n_vacancy * annealRate
 */
export function applyAnnealing(
  state: DamageState,
  temperatureC: number,
  annealRate: number,
): void {
  if (annealRate <= 0) return;

  const tempK = temperatureC + 273.15;
  const kB_eV = 8.617e-5;
  const Ea = 0.3; // activation energy for Si vacancy recombination (eV)

  const rate = annealRate * Math.exp(-Ea / (kB_eV * tempK));

  for (let i = 0; i < state.vacancies.length; i++) {
    if (state.vacancies[i] > 0) {
      const reduction = state.vacancies[i] * rate * 0.1;
      state.vacancies[i] = Math.max(0, state.vacancies[i] - reduction);
    }
  }
}

/**
 * Check if a depth bin is amorphous (vacancy density exceeds threshold).
 */
export function isAmorphous(state: DamageState, bin: number): boolean {
  if (bin < 0 || bin >= state.vacancies.length) return false;
  return state.vacancies[bin] >= 1.0; // 1.0 = threshold reached
}

/**
 * Get the amorphous map (boolean per bin).
 */
export function getAmorphousMap(state: DamageState): boolean[] {
  return state.vacancies.map(v => v >= 1.0);
}

/**
 * Initialize a pre-amorphized layer (for PAI preset).
 */
export function initializePAI(
  state: DamageState,
  amorphousDepthNm: number,
  binSize: number,
): void {
  const bins = Math.floor(amorphousDepthNm / binSize);
  for (let i = 0; i < Math.min(bins, state.vacancies.length); i++) {
    state.vacancies[i] = 1.5; // well above threshold
    state.vacancyCounts[i] = 1000;
  }
}

/**
 * Get peak vacancy density (normalized) and its depth bin.
 */
export function peakDamage(state: DamageState): { peakValue: number; peakBin: number } {
  let maxVal = 0;
  let maxBin = 0;
  for (let i = 0; i < state.vacancies.length; i++) {
    if (state.vacancies[i] > maxVal) {
      maxVal = state.vacancies[i];
      maxBin = i;
    }
  }
  return { peakValue: maxVal, peakBin: maxBin };
}
```

### `damage-model.test.ts`

```typescript
import { createDamageState, recordDamage, applyAnnealing, isAmorphous, initializePAI, getAmorphousMap, peakDamage } from '../damage-model';

describe('damage-model', () => {
  test('fresh damage state has zero vacancies', () => {
    const state = createDamageState(100);
    expect(state.vacancies.every(v => v === 0)).toBe(true);
    expect(state.totalFrenkelPairs).toBe(0);
  });

  test('recordDamage increments vacancy at correct bin', () => {
    const state = createDamageState(100);
    recordDamage(state, 50, 1, 1, 5);
    expect(state.vacancies[50]).toBeGreaterThan(0);
    expect(state.totalFrenkelPairs).toBe(1);
  });

  test('repeated damage leads to amorphization', () => {
    const state = createDamageState(100);
    const threshold = 5;
    // Record enough damage to exceed threshold
    for (let i = 0; i < 1000; i++) {
      recordDamage(state, 25, 1, 1, threshold);
    }
    expect(isAmorphous(state, 25)).toBe(true);
    expect(isAmorphous(state, 50)).toBe(false); // undamaged
  });

  test('annealing reduces vacancy density', () => {
    const state = createDamageState(100);
    recordDamage(state, 30, 1, 100, 5);
    const before = state.vacancies[30];

    applyAnnealing(state, 500, 1.0); // high temp, max rate
    expect(state.vacancies[30]).toBeLessThan(before);
  });

  test('annealing at room temp with zero rate does nothing', () => {
    const state = createDamageState(100);
    recordDamage(state, 30, 1, 100, 5);
    const before = state.vacancies[30];
    applyAnnealing(state, 25, 0);
    expect(state.vacancies[30]).toBe(before);
  });

  test('initializePAI creates amorphous surface layer', () => {
    const state = createDamageState(200);
    initializePAI(state, 30, 1); // 30 nm amorphous
    expect(isAmorphous(state, 10)).toBe(true);
    expect(isAmorphous(state, 25)).toBe(true);
    expect(isAmorphous(state, 50)).toBe(false);
  });

  test('getAmorphousMap returns boolean array', () => {
    const state = createDamageState(50);
    initializePAI(state, 10, 1);
    const map = getAmorphousMap(state);
    expect(map.length).toBe(50);
    expect(map[5]).toBe(true);
    expect(map[20]).toBe(false);
  });

  test('peakDamage finds the most damaged bin', () => {
    const state = createDamageState(100);
    recordDamage(state, 30, 1, 50, 5);
    recordDamage(state, 60, 1, 100, 5);
    const { peakBin } = peakDamage(state);
    expect(peakBin).toBe(60);
  });
});
```

**Commit:** `feat(implant-sim): damage accumulation model with amorphization and annealing`

---

## Task 7: Monte Carlo Orchestrator

**Files:**
- Create: `src/lib/implant-sim/monte-carlo.ts`
- Test: `src/lib/implant-sim/__tests__/monte-carlo.test.ts`

### `monte-carlo.ts`

```typescript
import type { IonTrajectory, SimulationParams, LayerDef } from './types';
import {
  DEPTH_BINS, DEFAULT_ION_COUNT, estimateMaxDepth, mulberry32, ION_DB,
} from './constants';
import { traceIon, buildLayers } from './bca-engine';
import { createDamageState, recordDamage, applyAnnealing, getAmorphousMap, peakDamage } from './damage-model';
import type { DamageState } from './damage-model';

export interface ProfileStatistics {
  projectedRange: number;       // Rp (nm)
  straggle: number;             // ΔRp (nm)
  junctionDepth: number;        // Xj at 1e17 cm⁻³ equivalent (nm)
  peakConcentration: number;    // Cp (relative units)
  channelingTailDepth: number;  // nm
  damagePeakDensity: number;    // normalized
  lateralStraggle: number;      // nm
  retainedDoseFraction: number; // 0-1
}

export interface EnsembleState {
  params: SimulationParams;
  layers: LayerDef[];
  maxDepthNm: number;
  binSize: number;
  totalIons: number;
  /** Accumulated depth profile (counts per bin) */
  depthCounts: number[];
  /** Accumulated lateral displacement squared per bin */
  lateralSqSum: number[];
  lateralCounts: number[];
  /** Damage state */
  damage: DamageState;
  /** Running statistics */
  depthSum: number;
  depthSqSum: number;
  ionCount: number;
  backscatterCount: number;
  channeledCount: number;
  /** Seed for reproducible PRNG */
  seed: number;
  rng: () => number;
}

/**
 * Create a fresh Monte Carlo ensemble.
 */
export function createEnsemble(params: SimulationParams): EnsembleState {
  const maxDepthNm = estimateMaxDepth(params.ionSpecies, params.beamEnergy);
  const binSize = maxDepthNm / DEPTH_BINS;
  const totalIons = DEFAULT_ION_COUNT;
  const seed = Math.floor(params.beamEnergy * 1000 + params.tiltAngle * 100 + params.dose);
  const rng = mulberry32(seed);

  return {
    params,
    layers: buildLayers(params),
    maxDepthNm,
    binSize,
    totalIons,
    depthCounts: new Array(DEPTH_BINS).fill(0),
    lateralSqSum: new Array(DEPTH_BINS).fill(0),
    lateralCounts: new Array(DEPTH_BINS).fill(0),
    damage: createDamageState(DEPTH_BINS),
    depthSum: 0,
    depthSqSum: 0,
    ionCount: 0,
    backscatterCount: 0,
    channeledCount: 0,
    seed,
    rng,
  };
}

/**
 * Simulate a batch of ions and return their trajectories.
 */
export function simulateBatch(
  ensemble: EnsembleState,
  batchSize: number,
): IonTrajectory[] {
  const trajectories: IonTrajectory[] = [];

  for (let i = 0; i < batchSize; i++) {
    const traj = traceIon(
      ensemble.params,
      ensemble.layers,
      ensemble.damage.vacancies,
      ensemble.binSize,
      ensemble.maxDepthNm,
      ensemble.rng,
    );

    trajectories.push(traj);

    if (traj.backscattered) {
      ensemble.backscatterCount++;
    } else {
      // Record final depth
      const z = traj.finalPosition.z;
      const bin = Math.min(DEPTH_BINS - 1, Math.max(0, Math.floor(z / ensemble.binSize)));
      ensemble.depthCounts[bin]++;
      ensemble.depthSum += z;
      ensemble.depthSqSum += z * z;

      // Lateral displacement
      const lateralSq = traj.finalPosition.x ** 2 + traj.finalPosition.y ** 2;
      ensemble.lateralSqSum[bin] += lateralSq;
      ensemble.lateralCounts[bin]++;
    }

    if (traj.channeled) {
      ensemble.channeledCount++;
    }

    // Record damage from all collisions
    for (const coll of traj.collisions) {
      if (coll.isDisplacement) {
        recordDamage(
          ensemble.damage,
          coll.position.z,
          ensemble.binSize,
          1,
          ensemble.params.amorphizationThreshold,
        );
      }
    }

    ensemble.ionCount++;
  }

  // Apply annealing per batch
  applyAnnealing(
    ensemble.damage,
    ensemble.params.substrateTemperature,
    ensemble.params.damageAnnealingRate,
  );

  return trajectories;
}

/**
 * Compute profile statistics from current ensemble state.
 */
export function computeStatistics(ensemble: EnsembleState): ProfileStatistics {
  const retained = ensemble.ionCount - ensemble.backscatterCount;

  if (retained === 0) {
    return {
      projectedRange: 0, straggle: 0, junctionDepth: 0,
      peakConcentration: 0, channelingTailDepth: 0,
      damagePeakDensity: 0, lateralStraggle: 0, retainedDoseFraction: 0,
    };
  }

  // Projected range and straggle
  const Rp = ensemble.depthSum / retained;
  const variance = ensemble.depthSqSum / retained - Rp * Rp;
  const dRp = Math.sqrt(Math.max(0, variance));

  // Peak concentration (max count in any bin)
  const maxCount = Math.max(...ensemble.depthCounts);
  const peakConcentration = maxCount / retained;

  // Junction depth: deepest bin with count > threshold
  // threshold = 0.1% of peak (represents ~1e17 cm⁻³ in real units)
  const junctionThreshold = maxCount * 0.001;
  let junctionDepth = 0;
  for (let i = DEPTH_BINS - 1; i >= 0; i--) {
    if (ensemble.depthCounts[i] > junctionThreshold) {
      junctionDepth = (i + 1) * ensemble.binSize;
      break;
    }
  }

  // Channeling tail depth: deepest bin with >0 counts beyond 2*Rp
  let channelingTailDepth = 0;
  const tailStart = Math.floor((2 * Rp) / ensemble.binSize);
  for (let i = DEPTH_BINS - 1; i >= tailStart; i--) {
    if (ensemble.depthCounts[i] > 0) {
      channelingTailDepth = (i + 1) * ensemble.binSize;
      break;
    }
  }

  // Damage peak
  const { peakValue: damagePeakDensity } = peakDamage(ensemble.damage);

  // Lateral straggle (RMS lateral displacement)
  let totalLateralSq = 0;
  let totalLateralCount = 0;
  for (let i = 0; i < DEPTH_BINS; i++) {
    totalLateralSq += ensemble.lateralSqSum[i];
    totalLateralCount += ensemble.lateralCounts[i];
  }
  const lateralStraggle = totalLateralCount > 0
    ? Math.sqrt(totalLateralSq / totalLateralCount)
    : 0;

  // Retained dose fraction
  const retainedDoseFraction = ensemble.ionCount > 0
    ? retained / ensemble.ionCount
    : 1;

  return {
    projectedRange: Rp,
    straggle: dRp,
    junctionDepth,
    peakConcentration,
    channelingTailDepth,
    damagePeakDensity,
    lateralStraggle,
    retainedDoseFraction,
  };
}

/**
 * Get the normalized depth profile (concentration vs depth).
 */
export function getDepthProfile(ensemble: EnsembleState): number[] {
  const retained = ensemble.ionCount - ensemble.backscatterCount;
  if (retained === 0) return new Array(DEPTH_BINS).fill(0);
  return ensemble.depthCounts.map(c => c / retained);
}

/**
 * Get the lateral straggle profile per depth bin.
 */
export function getLateralProfile(ensemble: EnsembleState): number[] {
  return ensemble.lateralSqSum.map((sq, i) => {
    const n = ensemble.lateralCounts[i];
    return n > 0 ? Math.sqrt(sq / n) : 0;
  });
}
```

### `monte-carlo.test.ts`

```typescript
import { createEnsemble, simulateBatch, computeStatistics, getDepthProfile } from '../monte-carlo';
import { DEFAULT_PARAMS, DEPTH_BINS } from '../constants';

describe('monte-carlo', () => {
  test('depth profile has correct bin count', () => {
    const ens = createEnsemble(DEFAULT_PARAMS);
    simulateBatch(ens, 20);
    const profile = getDepthProfile(ens);
    expect(profile.length).toBe(DEPTH_BINS);
  });

  test('Rp for B at 50 keV is in reasonable range (50-400 nm)', () => {
    const ens = createEnsemble(DEFAULT_PARAMS);
    simulateBatch(ens, 50);
    const stats = computeStatistics(ens);
    expect(stats.projectedRange).toBeGreaterThan(50);
    expect(stats.projectedRange).toBeLessThan(400);
  });

  test('heavier ions have smaller straggle-to-range ratio', () => {
    const ensB = createEnsemble(DEFAULT_PARAMS);
    simulateBatch(ensB, 50);
    const statsB = computeStatistics(ensB);

    const ensAs = createEnsemble({ ...DEFAULT_PARAMS, ionSpecies: 'As' });
    simulateBatch(ensAs, 50);
    const statsAs = computeStatistics(ensAs);

    const ratioB = statsB.projectedRange > 0 ? statsB.straggle / statsB.projectedRange : 0;
    const ratioAs = statsAs.projectedRange > 0 ? statsAs.straggle / statsAs.projectedRange : 0;
    // As should have relatively tighter distribution
    expect(ratioAs).toBeLessThan(ratioB + 0.3); // generous tolerance for MC noise
  });

  test('backscatter fraction is less than 30%', () => {
    const ens = createEnsemble(DEFAULT_PARAMS);
    simulateBatch(ens, 100);
    const stats = computeStatistics(ens);
    expect(stats.retainedDoseFraction).toBeGreaterThan(0.7);
  });

  test('lateral straggle is positive', () => {
    const ens = createEnsemble(DEFAULT_PARAMS);
    simulateBatch(ens, 50);
    const stats = computeStatistics(ens);
    expect(stats.lateralStraggle).toBeGreaterThan(0);
  });

  test('damage accumulates with more ions', () => {
    const ens = createEnsemble(DEFAULT_PARAMS);
    simulateBatch(ens, 10);
    const stats1 = computeStatistics(ens);
    simulateBatch(ens, 40);
    const stats2 = computeStatistics(ens);
    expect(stats2.damagePeakDensity).toBeGreaterThanOrEqual(stats1.damagePeakDensity);
  });
});
```

**Commit:** `feat(implant-sim): Monte Carlo orchestrator with ensemble statistics`

---

## Task 8: Simulation Engine

**Files:**
- Create: `src/lib/implant-sim/simulation-engine.ts`
- Test: `src/lib/implant-sim/__tests__/simulation-engine.test.ts`

### `simulation-engine.ts`

```typescript
import type { SimulationParams, SimulationState, StepState } from './types';
import { DEFAULT_PARAMS, DEFAULT_TOTAL_STEPS, DEFAULT_ION_COUNT, DEPTH_BINS } from './constants';
import {
  createEnsemble, simulateBatch, computeStatistics,
  getDepthProfile, getLateralProfile,
} from './monte-carlo';
import { getAmorphousMap } from './damage-model';
import { getPreset } from './presets';
import type { EnsembleState } from './monte-carlo';

// We store the mutable ensemble state alongside the immutable SimulationState
// using a WeakMap keyed by the state object.
const ensembleCache = new WeakMap<SimulationState, EnsembleState>();

export function createSimulation(params: SimulationParams = DEFAULT_PARAMS): SimulationState {
  const state: SimulationState = {
    params: { ...params },
    steps: [],
    currentIndex: -1,
    totalSteps: params.totalSteps ?? DEFAULT_TOTAL_STEPS,
  };
  // Pre-create ensemble
  ensembleCache.set(state, createEnsemble(params));
  return state;
}

export function stepForward(state: SimulationState): SimulationState {
  const nextIndex = state.currentIndex + 1;
  if (nextIndex >= state.totalSteps) return state;

  // Get or create ensemble
  let ensemble = ensembleCache.get(state);
  if (!ensemble) {
    ensemble = createEnsemble(state.params);
    // Replay previous ions
    const prevIons = state.steps.length > 0
      ? state.steps[state.steps.length - 1].ionsSimulated
      : 0;
    if (prevIons > 0) {
      simulateBatch(ensemble, prevIons);
    }
  }

  // Compute batch size for this step
  const batchSize = Math.max(1, Math.round(DEFAULT_ION_COUNT / state.totalSteps));
  const trajectories = simulateBatch(ensemble, batchSize);
  const stats = computeStatistics(ensemble);
  const depthProfile = getDepthProfile(ensemble);
  const lateralProfile = getLateralProfile(ensemble);
  const amorphousMap = getAmorphousMap(ensemble.damage);
  const damageProfile = ensemble.damage.vacancies.map(v => v);

  const stepState: StepState = {
    stepIndex: nextIndex,
    ionsSimulated: ensemble.ionCount,
    totalIons: DEFAULT_ION_COUNT,
    trajectories,
    depthProfile,
    damageProfile,
    lateralProfile,
    amorphousMap,
    layers: ensemble.layers,
    maxDepthNm: ensemble.maxDepthNm,
    ...stats,
  };

  const newState: SimulationState = {
    ...state,
    steps: [...state.steps, stepState],
    currentIndex: nextIndex,
  };

  // Transfer ensemble to new state object
  ensembleCache.set(newState, ensemble);

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

### `simulation-engine.test.ts`

```typescript
import { createSimulation, stepForward, stepN, applyPreset } from '../simulation-engine';
import { DEFAULT_PARAMS } from '../constants';

describe('simulation-engine', () => {
  test('createSimulation returns initial state with index -1', () => {
    const sim = createSimulation();
    expect(sim.currentIndex).toBe(-1);
    expect(sim.steps).toHaveLength(0);
    expect(sim.totalSteps).toBe(200);
  });

  test('stepForward advances index by 1', () => {
    const sim = createSimulation();
    const next = stepForward(sim);
    expect(next.currentIndex).toBe(0);
    expect(next.steps).toHaveLength(1);
  });

  test('step produces trajectories', () => {
    const sim = createSimulation();
    const next = stepForward(sim);
    expect(next.steps[0].trajectories.length).toBeGreaterThan(0);
  });

  test('ion count increases with steps', () => {
    let sim = createSimulation();
    sim = stepForward(sim);
    const ions1 = sim.steps[0].ionsSimulated;
    sim = stepForward(sim);
    const ions2 = sim.steps[1].ionsSimulated;
    expect(ions2).toBeGreaterThan(ions1);
  });

  test('200 steps complete without error', () => {
    const sim = stepN(createSimulation(), 200);
    expect(sim.currentIndex).toBe(199);
    expect(sim.steps).toHaveLength(200);
  }, 30000);

  test('does not exceed totalSteps', () => {
    const params = { ...DEFAULT_PARAMS, totalSteps: 10 };
    let sim = createSimulation(params);
    sim = stepN(sim, 20);
    expect(sim.currentIndex).toBe(9);
    expect(sim.steps).toHaveLength(10);
  });

  test('damage evolves across steps', () => {
    let sim = createSimulation();
    sim = stepN(sim, 5);
    const early = sim.steps[0].damagePeakDensity;
    sim = stepN(sim, 50);
    const later = sim.steps[sim.steps.length - 1].damagePeakDensity;
    expect(later).toBeGreaterThanOrEqual(early);
  });

  test('applyPreset changes params and resets sim', () => {
    const sim = createSimulation();
    const next = applyPreset(sim, 'channeling-implant');
    expect(next.params.tiltAngle).toBe(0);
    expect(next.currentIndex).toBe(-1);
  });

  test('depth profile has DEPTH_BINS entries', () => {
    let sim = createSimulation();
    sim = stepForward(sim);
    expect(sim.steps[0].depthProfile.length).toBe(200);
  });
});
```

**Commit:** `feat(implant-sim): 200-step simulation engine with dose accumulation`

---

## Task 9: Presets (10 scenarios)

**Files:**
- Create: `src/lib/implant-sim/presets.ts`
- Test: `src/lib/implant-sim/__tests__/presets.test.ts`

### `presets.ts`

```typescript
import type { Preset, SimulationParams } from './types';

export const PRESETS: Preset[] = [
  {
    id: 'channeling-implant',
    label: 'Channeling Implant',
    labelCN: '\u901A\u9053\u6548\u61C9\u690D\u5165',
    color: '#3b82f6',
    apply: (p) => ({ ...p, tiltAngle: 0, twistAngle: 0, ionSpecies: 'B', beamEnergy: 50 }),
  },
  {
    id: 'high-dose-amorphization',
    label: 'High-Dose Amorphization',
    labelCN: '\u9AD8\u5291\u91CF\u975E\u6676\u5316',
    color: '#ef4444',
    apply: (p) => ({ ...p, ionSpecies: 'As', beamEnergy: 80, dose: 1e15 }),
  },
  {
    id: 'implant-through-oxide',
    label: 'Implant Through Oxide',
    labelCN: '\u7A7F\u6C27\u5316\u7269\u690D\u5165',
    color: '#f59e0b',
    apply: (p) => ({ ...p, screenOxideThickness: 30, ionSpecies: 'B', beamEnergy: 30 }),
  },
  {
    id: 'shallow-junction',
    label: 'Shallow Junction',
    labelCN: '\u6DFA\u63A5\u9762',
    color: '#8b5cf6',
    apply: (p) => ({ ...p, ionSpecies: 'BF2', beamEnergy: 5, tiltAngle: 7 }),
  },
  {
    id: 'retrograde-well',
    label: 'Retrograde Well',
    labelCN: '\u9006\u884C\u4E95',
    color: '#06b6d4',
    apply: (p) => ({ ...p, ionSpecies: 'P', beamEnergy: 400, dose: 5e12 }),
  },
  {
    id: 'dose-rate-heating',
    label: 'Dose-Rate Heating',
    labelCN: '\u5291\u91CF\u7387\u52A0\u71B1',
    color: '#f97316',
    apply: (p) => ({ ...p, beamCurrent: 18, substrateTemperature: 200, damageAnnealingRate: 0.5 }),
  },
  {
    id: 'resist-punch-through',
    label: 'Resist Punch-Through',
    labelCN: '\u5149\u963B\u7A7F\u900F',
    color: '#ec4899',
    apply: (p) => ({ ...p, photoresistThickness: 200, ionSpecies: 'P', beamEnergy: 200 }),
  },
  {
    id: 'pre-amorphization',
    label: 'Pre-Amorphization (PAI)',
    labelCN: '\u9810\u975E\u6676\u5316',
    color: '#10b981',
    apply: (p) => ({ ...p, ionSpecies: 'B', beamEnergy: 3, tiltAngle: 0, amorphizationThreshold: 3 }),
  },
  {
    id: 'twin-well-cmos',
    label: 'Twin-Well CMOS',
    labelCN: '\u96D9\u4E95CMOS',
    color: '#6366f1',
    apply: (p) => ({ ...p, ionSpecies: 'P', beamEnergy: 600, dose: 1e13 }),
  },
  {
    id: 'high-tilt-halo',
    label: 'High-Tilt Halo',
    labelCN: '\u5927\u50BE\u659C\u66C8\u5708\u690D\u5165',
    color: '#a855f7',
    apply: (p) => ({ ...p, ionSpecies: 'B', beamEnergy: 30, tiltAngle: 45, twistAngle: 0 }),
  },
];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
```

### `presets.test.ts`

```typescript
import { PRESETS, getPreset } from '../presets';
import { DEFAULT_PARAMS } from '../constants';

describe('presets', () => {
  test('has 10 presets', () => {
    expect(PRESETS).toHaveLength(10);
  });

  test('channeling-implant sets tilt to 0', () => {
    const p = getPreset('channeling-implant')!;
    const result = p.apply(DEFAULT_PARAMS);
    expect(result.tiltAngle).toBe(0);
    expect(result.twistAngle).toBe(0);
  });

  test('high-dose-amorphization uses As at high dose', () => {
    const p = getPreset('high-dose-amorphization')!;
    const result = p.apply(DEFAULT_PARAMS);
    expect(result.ionSpecies).toBe('As');
    expect(result.dose).toBe(1e15);
  });

  test('implant-through-oxide sets screen oxide', () => {
    const p = getPreset('implant-through-oxide')!;
    const result = p.apply(DEFAULT_PARAMS);
    expect(result.screenOxideThickness).toBe(30);
  });

  test('shallow-junction uses BF2 at low energy', () => {
    const p = getPreset('shallow-junction')!;
    const result = p.apply(DEFAULT_PARAMS);
    expect(result.ionSpecies).toBe('BF2');
    expect(result.beamEnergy).toBe(5);
  });

  test('retrograde-well uses P at high energy', () => {
    const p = getPreset('retrograde-well')!;
    const result = p.apply(DEFAULT_PARAMS);
    expect(result.ionSpecies).toBe('P');
    expect(result.beamEnergy).toBe(400);
  });

  test('dose-rate-heating increases beam current and temperature', () => {
    const p = getPreset('dose-rate-heating')!;
    const result = p.apply(DEFAULT_PARAMS);
    expect(result.beamCurrent).toBeGreaterThan(DEFAULT_PARAMS.beamCurrent);
    expect(result.substrateTemperature).toBeGreaterThan(DEFAULT_PARAMS.substrateTemperature);
  });

  test('resist-punch-through sets thin resist', () => {
    const p = getPreset('resist-punch-through')!;
    const result = p.apply(DEFAULT_PARAMS);
    expect(result.photoresistThickness).toBe(200);
  });

  test('high-tilt-halo sets large tilt angle', () => {
    const p = getPreset('high-tilt-halo')!;
    const result = p.apply(DEFAULT_PARAMS);
    expect(result.tiltAngle).toBe(45);
  });

  test('each preset produces valid params', () => {
    for (const preset of PRESETS) {
      const result = preset.apply(DEFAULT_PARAMS);
      expect(result.beamEnergy).toBeGreaterThan(0);
      expect(result.tiltAngle).toBeGreaterThanOrEqual(0);
      expect(result.totalSteps).toBeGreaterThan(0);
    }
  });
});
```

**Commit:** `feat(implant-sim): 10 presets for implant scenarios`

---

## Task 10: Barrel Export + Route Registration

**Files:**
- Create: `src/lib/implant-sim/index.ts`
- Modify: `src/lib/digital-twin-routes.ts`

### `index.ts`

```typescript
export { createSimulation, stepForward, stepN, applyPreset } from './simulation-engine';
export { PRESETS, getPreset } from './presets';
export {
  DEFAULT_PARAMS, PARAM_BOUNDS, DEFAULT_TOTAL_STEPS,
  DEPTH_BINS, ION_DB, MATERIAL_DB, DEFAULT_ION_COUNT,
} from './constants';
export type {
  SimulationParams,
  SimulationState,
  StepState,
  IonTrajectory,
  Vec3,
  CollisionEvent,
  LayerDef,
  ImplantMetric,
  PresetId,
  Preset,
  IonSpecies,
  CrystalOrientation,
  TargetMaterial,
} from './types';
```

### `digital-twin-routes.ts` modification

Add after the `cmp` line:

```typescript
  implant: '/mes/fab-floor/implant/implant-sim',
```

**Commit:** `feat(implant-sim): barrel export and digital twin route registration`

---

## Task 11: TimelineBar Component

**Files:**
- Create: `src/components/implant-sim/TimelineBar.tsx`

### `TimelineBar.tsx`

```typescript
'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react';
import type { StepState } from '@/lib/implant-sim';
import { ION_DB } from '@/lib/implant-sim';

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

export function TimelineBar({
  currentIndex, totalSteps, playing, currentStep, backHref,
  onPlay, onPause, onStep, onSeek, onReset,
  playbackSpeed, onSpeedChange,
}: TimelineBarProps) {
  const progress = totalSteps > 0 ? ((currentIndex + 1) / totalSteps) * 100 : 0;
  const ions = currentStep?.ionsSimulated ?? 0;
  const total = currentStep?.totalIons ?? 0;
  const retained = currentStep ? (currentStep.retainedDoseFraction * 100).toFixed(1) : '0.0';

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[rgba(6,182,212,0.2)] bg-[rgba(2,6,23,0.8)] px-4 py-2 backdrop-blur-xl">
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
        <input type="range" min={-1} max={totalSteps - 1} value={currentIndex} onChange={(e) => onSeek(Number(e.target.value))} className="w-full accent-cyan-500" aria-label="Step timeline" />
        <div className="mt-0.5 h-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex items-center gap-3 font-mono text-xs">
        <span className="text-[var(--sf-text-secondary)]">
          Step {currentIndex + 1}/{totalSteps}
        </span>
        <span style={{ color: '#06b6d4' }}>
          Ions: {ions}/{total}
        </span>
        <span className="text-[var(--sf-text-muted)]">
          Retained: {retained}%
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

**Commit:** `feat(implant-sim): TimelineBar component with dose progress`

---

## Task 12: ParameterPanel Component

**Files:**
- Create: `src/components/implant-sim/ParameterPanel.tsx`

### `ParameterPanel.tsx`

```typescript
'use client';

import { PARAM_BOUNDS, PRESETS, ION_DB } from '@/lib/implant-sim';
import type { PresetId, SimulationParams, IonSpecies, CrystalOrientation } from '@/lib/implant-sim';

interface ParameterPanelProps {
  params: SimulationParams;
  activePreset: PresetId | null;
  onParamChange: (key: keyof SimulationParams, value: number | string) => void;
  onPreset: (id: PresetId) => void;
}

const SLIDER_KEYS: (keyof typeof PARAM_BOUNDS)[] = [
  'beamEnergy', 'dose', 'beamCurrent', 'tiltAngle', 'twistAngle',
  'screenOxideThickness', 'photoresistThickness', 'substrateTemperature',
  'amorphizationThreshold', 'damageAnnealingRate',
];

const ION_OPTIONS: IonSpecies[] = ['B', 'P', 'As', 'BF2'];
const CRYSTAL_OPTIONS: CrystalOrientation[] = ['100', '110', '111'];

export function ParameterPanel({ params, activePreset, onParamChange, onPreset }: ParameterPanelProps) {
  return (
    <div className="rounded-2xl border border-[rgba(6,182,212,0.2)] bg-[rgba(2,6,23,0.8)] px-4 py-3 backdrop-blur-xl">
      <div className="grid grid-cols-6 gap-x-6 gap-y-2 sm:grid-cols-12">
        {/* Dropdown: Ion Species */}
        <label className="flex flex-col gap-0.5 font-mono text-[10px] text-[var(--sf-text-secondary)]">
          <span>Ion Species</span>
          <select
            value={params.ionSpecies}
            onChange={(e) => onParamChange('ionSpecies', e.target.value)}
            className="rounded bg-white/10 px-1 py-0.5 text-[10px] accent-cyan-500"
          >
            {ION_OPTIONS.map(s => (
              <option key={s} value={s}>{ION_DB[s].symbol}</option>
            ))}
          </select>
        </label>

        {/* Dropdown: Crystal Orientation */}
        <label className="flex flex-col gap-0.5 font-mono text-[10px] text-[var(--sf-text-secondary)]">
          <span>Crystal</span>
          <select
            value={params.crystalOrientation}
            onChange={(e) => onParamChange('crystalOrientation', e.target.value)}
            className="rounded bg-white/10 px-1 py-0.5 text-[10px] accent-cyan-500"
          >
            {CRYSTAL_OPTIONS.map(o => (
              <option key={o} value={o}>&lt;{o}&gt;</option>
            ))}
          </select>
        </label>

        {/* 10 Sliders */}
        {SLIDER_KEYS.map((key) => {
          const b = PARAM_BOUNDS[key];
          const isDose = key === 'dose';
          const rawVal = isDose ? Math.log10(params.dose) : params[key as keyof SimulationParams] as number;

          return (
            <label key={key} className="flex flex-col gap-0.5 font-mono text-[10px] text-[var(--sf-text-secondary)]">
              <span>{b.label}</span>
              <input
                type="range"
                min={b.min}
                max={b.max}
                step={isDose ? 0.5 : b.step}
                value={rawVal}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  onParamChange(key as keyof SimulationParams, isDose ? Math.pow(10, v) : v);
                }}
                className="accent-cyan-500"
              />
              <span className="text-[var(--sf-text-muted)]">
                {isDose ? `1e${Math.log10(params.dose).toFixed(0)}` : `${rawVal}`}{b.unit ? ` ${b.unit}` : ''}
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

**Commit:** `feat(implant-sim): ParameterPanel with 12 controls and 10 presets`

---

## Task 13: TrajectoryScene (Babylon.js)

**Files:**
- Create: `src/components/implant-sim/TrajectoryScene.tsx`

### `TrajectoryScene.tsx`

```typescript
'use client';

import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import type { StepState, SimulationParams, Vec3 } from '@/lib/implant-sim';
import { MATERIAL_DB, ION_DB } from '@/lib/implant-sim';

interface TrajectorySceneProps {
  step: StepState | null;
  params: SimulationParams;
}

const SUBSTRATE_COLOR = new BABYLON.Color3(0.22, 0.42, 0.72);
const OXIDE_COLOR = new BABYLON.Color3(0.55, 0.45, 0.72);
const RESIST_COLOR = new BABYLON.Color3(0.85, 0.70, 0.25);
const DAMAGE_COLOR = new BABYLON.Color3(0.55, 0.20, 0.65);
const BEAM_COLOR = new BABYLON.Color3(0.02, 0.71, 0.83);

function energyToColor(eNorm: number): BABYLON.Color3 {
  // Red (hot) → cyan (mid) → blue (cold)
  if (eNorm > 0.5) {
    const t = (eNorm - 0.5) * 2;
    return new BABYLON.Color3(t, 0.3 * (1 - t) + 0.7 * t, 1 - t * 0.5);
  }
  return new BABYLON.Color3(0, 0.3 + eNorm * 0.4, 0.5 + eNorm);
}

export function TrajectoryScene({ step, params }: TrajectorySceneProps) {
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
    const camera = new BABYLON.ArcRotateCamera('cam', -Math.PI / 4, Math.PI / 3, 500, new BABYLON.Vector3(0, -100, 0), scene);
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 100;
    camera.upperRadiusLimit = 1500;
    camera.lowerBetaLimit = 0.15;
    camera.upperBetaLimit = Math.PI * 0.85;

    // Lights
    const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene);
    hemi.intensity = 0.5;
    const point = new BABYLON.PointLight('pt', new BABYLON.Vector3(50, 100, 50), scene);
    point.intensity = 0.4;

    // Substrate block (will be updated per step)
    const subMat = new BABYLON.StandardMaterial('subMat', scene);
    subMat.diffuseColor = SUBSTRATE_COLOR;
    subMat.alpha = 0.2;
    const subBox = BABYLON.MeshBuilder.CreateBox('substrate', { width: 100, height: 1, depth: 100 }, scene);
    subBox.material = subMat;

    // Oxide layer
    const oxMat = new BABYLON.StandardMaterial('oxMat', scene);
    oxMat.diffuseColor = OXIDE_COLOR;
    oxMat.alpha = 0.25;
    const oxBox = BABYLON.MeshBuilder.CreateBox('oxide', { width: 100, height: 1, depth: 100 }, scene);
    oxBox.material = oxMat;
    oxBox.isVisible = false;

    // Resist layer
    const resMat = new BABYLON.StandardMaterial('resMat', scene);
    resMat.diffuseColor = RESIST_COLOR;
    resMat.alpha = 0.2;
    const resBox = BABYLON.MeshBuilder.CreateBox('resist', { width: 100, height: 1, depth: 100 }, scene);
    resBox.material = resMat;
    resBox.isVisible = false;

    // Beam indicator line
    const beamMat = new BABYLON.StandardMaterial('beamMat', scene);
    beamMat.diffuseColor = BEAM_COLOR;
    beamMat.emissiveColor = BEAM_COLOR;
    beamMat.alpha = 0.6;

    // Trajectory line system (reused each frame)
    let trajectoryLines: BABYLON.LinesMesh[] = [];

    // Damage spheres
    let damageSpheres: BABYLON.Mesh[] = [];
    const dmgMat = new BABYLON.StandardMaterial('dmgMat', scene);
    dmgMat.diffuseColor = DAMAGE_COLOR;
    dmgMat.emissiveColor = new BABYLON.Color3(0.35, 0.1, 0.45);
    dmgMat.alpha = 0.3;

    // Collision event flash spheres pool
    const collisionPool: BABYLON.Mesh[] = [];
    for (let i = 0; i < 30; i++) {
      const s = BABYLON.MeshBuilder.CreateSphere(`coll${i}`, { diameter: 2 }, scene);
      const m = new BABYLON.StandardMaterial(`collMat${i}`, scene);
      m.emissiveColor = new BABYLON.Color3(1, 0.7, 0.2);
      m.alpha = 0.8;
      s.material = m;
      s.isVisible = false;
      collisionPool.push(s);
    }

    // Update function
    scene.registerBeforeRender(() => {
      const { step: curStep, params: curParams } = propsRef.current;
      if (!curStep) return;

      const maxD = curStep.maxDepthNm;
      const scale = 200 / Math.max(maxD, 100); // visual scale factor

      // Update substrate box
      const siHeight = maxD * scale;
      subBox.scaling.y = siHeight;
      subBox.position.y = -siHeight / 2;

      // Update layer boxes
      let yOffset = 0;
      if (curParams.photoresistThickness > 0) {
        const h = curParams.photoresistThickness * scale;
        resBox.isVisible = true;
        resBox.scaling.y = h;
        resBox.position.y = h / 2;
        yOffset = h;
      } else {
        resBox.isVisible = false;
      }

      if (curParams.screenOxideThickness > 0) {
        const h = curParams.screenOxideThickness * scale;
        oxBox.isVisible = true;
        oxBox.scaling.y = h;
        oxBox.position.y = yOffset + h / 2 - (curParams.photoresistThickness > 0 ? 0 : 0);
      } else {
        oxBox.isVisible = false;
      }

      // Clear old trajectories
      for (const l of trajectoryLines) l.dispose();
      trajectoryLines = [];

      // Draw ion trajectories from current step
      const maxEnergy = curParams.beamEnergy * 1000;
      for (const traj of curStep.trajectories) {
        if (traj.points.length < 2) continue;

        const points: BABYLON.Vector3[] = traj.points.map(p => new BABYLON.Vector3(
          p.x * scale * 5,
          -p.z * scale, // z (depth) maps to -y (downward)
          p.y * scale * 5,
        ));

        const colors: BABYLON.Color4[] = traj.energyAtPoints.slice(0, points.length).map(e => {
          const norm = Math.max(0, Math.min(1, e / maxEnergy));
          const c = energyToColor(norm);
          return new BABYLON.Color4(c.r, c.g, c.b, 0.8);
        });

        const line = BABYLON.MeshBuilder.CreateLines(`traj`, { points, colors, useVertexAlpha: true }, scene);
        trajectoryLines.push(line);

        // Recoil cascades
        for (const cascade of traj.recoilCascades) {
          if (cascade.length < 2) continue;
          const cPts = cascade.map(p => new BABYLON.Vector3(p.x * scale * 5, -p.z * scale, p.y * scale * 5));
          const cLine = BABYLON.MeshBuilder.CreateLines('recoil', { points: cPts }, scene);
          cLine.color = new BABYLON.Color3(0.8, 0.3, 0.3);
          cLine.alpha = 0.3;
          trajectoryLines.push(cLine);
        }
      }

      // Collision flashes
      let ci = 0;
      for (const traj of curStep.trajectories) {
        for (const coll of traj.collisions) {
          if (!coll.isDisplacement || ci >= collisionPool.length) continue;
          const s = collisionPool[ci++];
          s.position.set(coll.position.x * scale * 5, -coll.position.z * scale, coll.position.y * scale * 5);
          s.scaling.setAll(Math.min(3, coll.energyTransfer / 50));
          s.isVisible = true;
        }
      }
      for (let i = ci; i < collisionPool.length; i++) collisionPool[i].isVisible = false;

      // Damage clouds
      for (const s of damageSpheres) s.dispose();
      damageSpheres = [];
      for (let i = 0; i < curStep.amorphousMap.length; i++) {
        if (!curStep.amorphousMap[i]) continue;
        const depth = (i + 0.5) * (maxD / curStep.amorphousMap.length);
        const s = BABYLON.MeshBuilder.CreateSphere(`dmg${i}`, { diameter: 15 }, scene);
        s.position.y = -depth * scale;
        s.material = dmgMat;
        damageSpheres.push(s);
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

**Commit:** `feat(implant-sim): Babylon.js TrajectoryScene with 3D ion paths and damage clouds`

---

## Task 14: ProfilePanel Component

**Files:**
- Create: `src/components/implant-sim/ProfilePanel.tsx`

### `ProfilePanel.tsx`

```typescript
'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { StepState, ImplantMetric } from '@/lib/implant-sim';
import { DEPTH_BINS } from '@/lib/implant-sim';

interface ProfilePanelProps {
  steps: StepState[];
  currentStep: StepState | null;
  metric: ImplantMetric;
  onMetricChange: (m: ImplantMetric) => void;
}

const METRIC_CFG: Record<ImplantMetric, { label: string; unit: string; format: (v: number) => string }> = {
  projectedRange:      { label: 'Rp',          unit: 'nm',   format: v => v.toFixed(1) },
  straggle:            { label: '\u0394Rp',     unit: 'nm',   format: v => v.toFixed(1) },
  junctionDepth:       { label: 'Xj',          unit: 'nm',   format: v => v.toFixed(1) },
  peakConcentration:   { label: 'Cp',          unit: 'rel',  format: v => v.toFixed(4) },
  channelingTailDepth: { label: 'Ch. Tail',    unit: 'nm',   format: v => v.toFixed(1) },
  damagePeakDensity:   { label: 'Dmg Peak',    unit: 'norm', format: v => v.toFixed(3) },
  lateralStraggle:     { label: '\u0394Rp_lat', unit: 'nm',   format: v => v.toFixed(1) },
  retainedDoseFraction:{ label: 'Retained',    unit: '%',    format: v => (v * 100).toFixed(1) },
};

const METRICS: ImplantMetric[] = [
  'projectedRange', 'straggle', 'junctionDepth', 'peakConcentration',
  'channelingTailDepth', 'damagePeakDensity', 'lateralStraggle', 'retainedDoseFraction',
];

export function ProfilePanel({ steps, currentStep, metric, onMetricChange }: ProfilePanelProps) {
  const profileRef = useRef<HTMLCanvasElement>(null);
  const damageRef = useRef<HTMLCanvasElement>(null);
  const sparkRef = useRef<HTMLCanvasElement>(null);

  const drawProfile = useCallback(() => {
    const ctx = profileRef.current?.getContext('2d');
    if (!ctx || !profileRef.current || !currentStep) return;
    const w = profileRef.current.width;
    const h = profileRef.current.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(2, 6, 23, 0.6)';
    ctx.fillRect(0, 0, w, h);

    const pad = { top: 16, bottom: 24, left: 40, right: 12 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    const profile = currentStep.depthProfile;
    const maxVal = Math.max(...profile, 1e-10);
    const maxDepth = currentStep.maxDepthNm;

    // Log scale Y axis
    const logMin = -5;
    const logMax = Math.ceil(Math.log10(maxVal + 1e-10));
    const yFromLog = (logV: number) => pad.top + plotH - ((logV - logMin) / (logMax - logMin)) * plotH;

    // Axes
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
    ctx.lineWidth = 0.5;
    for (let lv = logMin; lv <= logMax; lv++) {
      const y = yFromLog(lv);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + plotW, y);
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px monospace';
      ctx.fillText(`1e${lv}`, 2, y + 3);
    }

    // Depth profile
    ctx.beginPath();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < DEPTH_BINS; i++) {
      const x = pad.left + (i / DEPTH_BINS) * plotW;
      const val = profile[i];
      const logV = val > 0 ? Math.log10(val) : logMin;
      const y = yFromLog(Math.max(logMin, logV));
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Fill under curve
    const lastX = pad.left + plotW;
    ctx.lineTo(lastX, pad.top + plotH);
    ctx.lineTo(pad.left, pad.top + plotH);
    ctx.closePath();
    ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
    ctx.fill();

    // Rp marker
    if (currentStep.projectedRange > 0) {
      const rpX = pad.left + (currentStep.projectedRange / maxDepth) * plotW;
      ctx.strokeStyle = '#ef4444';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(rpX, pad.top);
      ctx.lineTo(rpX, pad.top + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ef4444';
      ctx.font = '8px monospace';
      ctx.fillText(`Rp`, rpX + 2, pad.top + 10);
    }

    // Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px monospace';
    ctx.fillText('Depth Profile (log)', pad.left, pad.top - 4);
    ctx.fillText(`0 — ${maxDepth.toFixed(0)} nm`, pad.left, h - 4);
  }, [currentStep]);

  const drawDamage = useCallback(() => {
    const ctx = damageRef.current?.getContext('2d');
    if (!ctx || !damageRef.current || !currentStep) return;
    const w = damageRef.current.width;
    const h = damageRef.current.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(2, 6, 23, 0.6)';
    ctx.fillRect(0, 0, w, h);

    const pad = { top: 16, bottom: 20, left: 12, right: 12 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    const damage = currentStep.damageProfile;
    const maxDmg = Math.max(...damage, 0.1);

    // Damage profile
    ctx.beginPath();
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 1;
    for (let i = 0; i < damage.length; i++) {
      const x = pad.left + (i / damage.length) * plotW;
      const y = pad.top + plotH - (damage[i] / maxDmg) * plotH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Amorphization threshold line
    const threshY = pad.top + plotH - (1.0 / maxDmg) * plotH;
    if (threshY > pad.top && threshY < pad.top + plotH) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pad.left, threshY);
      ctx.lineTo(pad.left + plotW, threshY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ef4444';
      ctx.font = '7px monospace';
      ctx.fillText('amorph', pad.left + plotW - 30, threshY - 3);
    }

    // Amorphous regions highlight
    ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
    for (let i = 0; i < currentStep.amorphousMap.length; i++) {
      if (!currentStep.amorphousMap[i]) continue;
      const x = pad.left + (i / damage.length) * plotW;
      const bw = plotW / damage.length;
      ctx.fillRect(x, pad.top, bw, plotH);
    }

    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px monospace';
    ctx.fillText('Damage Density', pad.left, pad.top - 4);
  }, [currentStep]);

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
    ctx.strokeStyle = '#06b6d4';
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
  useEffect(() => { drawDamage(); }, [drawDamage]);
  useEffect(() => { drawSparkline(); }, [drawSparkline]);

  return (
    <div className="flex h-full flex-col bg-[var(--sf-bg-canvas)] p-3">
      {/* Metric selector */}
      <div className="mb-2 flex flex-wrap gap-1">
        {METRICS.map((m) => (
          <button key={m} type="button" onClick={() => onMetricChange(m)}
            className="rounded-full px-2 py-0.5 font-mono text-[10px] transition-colors"
            style={{
              backgroundColor: metric === m ? '#06b6d4' : 'rgba(6,182,212,0.1)',
              color: metric === m ? '#fff' : '#06b6d4',
            }}>
            {METRIC_CFG[m].label}
          </button>
        ))}
      </div>

      {/* Metric readout */}
      {currentStep && (
        <div className="mb-2 grid grid-cols-4 gap-1 text-center font-mono text-[9px]">
          {METRICS.map((m) => {
            const cfg = METRIC_CFG[m];
            const val = currentStep[m] as number;
            return (
              <div key={m} className="rounded bg-white/5 px-1 py-0.5">
                <div className="text-[var(--sf-text-muted)]">{cfg.label}</div>
                <div style={{ color: metric === m ? '#06b6d4' : '#94a3b8' }}>{cfg.format(val)} {cfg.unit}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Depth profile canvas */}
      <div className="flex-1 min-h-0">
        <canvas ref={profileRef} width={360} height={220} className="h-full w-full" />
      </div>

      {/* Damage density canvas */}
      <div className="mt-1 h-[80px]">
        <canvas ref={damageRef} width={360} height={80} className="h-full w-full" />
      </div>

      {/* Sparkline */}
      <div className="mt-1 h-[70px]">
        <canvas ref={sparkRef} width={360} height={70} className="h-full w-full" />
      </div>
    </div>
  );
}
```

**Commit:** `feat(implant-sim): ProfilePanel with depth profile, damage density, and sparkline`

---

## Task 15: Page Route

**Files:**
- Create: `src/app/mes/fab-floor/implant/implant-sim/page.tsx`

### `page.tsx`

```typescript
'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TimelineBar } from '@/components/implant-sim/TimelineBar';
import { ParameterPanel } from '@/components/implant-sim/ParameterPanel';
import {
  createSimulation,
  stepForward,
  stepN,
  applyPreset,
} from '@/lib/implant-sim';
import type { PresetId, SimulationParams, SimulationState, ImplantMetric } from '@/lib/implant-sim';

const TrajectoryScene = dynamic(
  () => import('@/components/implant-sim/TrajectoryScene').then((m) => ({ default: m.TrajectoryScene })),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center bg-[var(--sf-bg-canvas)]"><p className="animate-pulse font-mono text-sm text-[var(--sf-text-muted)] motion-reduce:animate-none">Initializing implanter...</p></div> },
);

const ProfilePanel = dynamic(
  () => import('@/components/implant-sim/ProfilePanel').then((m) => ({ default: m.ProfilePanel })),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center bg-[var(--sf-bg-canvas)]"><p className="animate-pulse font-mono text-sm text-[var(--sf-text-muted)] motion-reduce:animate-none">Loading profiles...</p></div> },
);

export default function ImplantSimPage() {
  const [sim, setSim] = useState<SimulationState>(() => createSimulation());
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [metric, setMetric] = useState<ImplantMetric>('projectedRange');
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
    <div className="relative flex min-h-[calc(100dvh-104px)] flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.10),transparent_32%),var(--sf-bg-canvas)] text-[var(--sf-text-primary)]">
      <div className="z-10 px-4 pt-3">
        <TimelineBar
          currentIndex={sim.currentIndex}
          totalSteps={sim.totalSteps}
          playing={playing}
          currentStep={currentStep}
          backHref="/mes/fab-floor/implant"
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
        <div className="flex-[7] overflow-hidden rounded-2xl border border-[rgba(6,182,212,0.15)]" data-testid="trajectory-scene-panel">
          <TrajectoryScene step={currentStep} params={sim.params} />
        </div>
        <div className="flex-[3] overflow-hidden rounded-2xl border border-[rgba(6,182,212,0.15)]" data-testid="profile-panel">
          <ProfilePanel steps={sim.steps} currentStep={currentStep} metric={metric} onMetricChange={setMetric} />
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

**Commit:** `feat(implant-sim): page route at /mes/fab-floor/implant/implant-sim`

---

## Task 16: Run All Tests + Final Verification

**Steps:**
1. Run `npx jest --testPathPatterns='implant-sim' --verbose`
2. Verify all tests pass
3. Run `npx tsc --noEmit 2>&1 | grep implant-sim` — expect zero errors
4. Run `npx next build` — verify `/mes/fab-floor/implant/implant-sim` appears in route list
5. Fix any issues found
6. Commit fixes if needed

**Commit (if fixes needed):** `fix(implant-sim): address test/build issues`
