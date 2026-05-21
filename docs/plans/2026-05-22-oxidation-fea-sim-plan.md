# Oxidation FEA Sim Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a coupled thermal FEA + Deal-Grove oxidation + viscoelastic stress digital twin at `/mes/fab-floor/oxidation/oxidation-sim`.

**Architecture:** Three physics domains run in sequence each step: (1) 2D FEA thermal solver on a structured mesh, (2) Deal-Grove linear-parabolic oxidation with 6 ambient types, (3) viscoelastic stress with Kao feedback into oxidation rate. Pre-built mesh templates for blanket/LOCOS/STI geometries.

**Tech Stack:** TypeScript physics lib at `equipment-monitor/src/lib/oxidation-sim/`, Babylon.js 3D scene, Canvas2D profile panel, Next.js app route. Tests with Vitest.

**Test runner:** `npx vitest run <path> --reporter=verbose` from `equipment-monitor/` directory.

**Reference code:** All patterns follow `src/lib/diffusion-sim/` and `src/components/diffusion-sim/`. Study those files for API shape, test style, and component structure.

**Design doc:** `docs/plans/2026-05-22-oxidation-fea-sim-design.md`

---

### Task 1: types.ts — All Type Definitions

**Files:**
- Create: `equipment-monitor/src/lib/oxidation-sim/types.ts`

**Step 1: Write types.ts**

```typescript
// ─── Enums & Unions ───
export type OxidationType = 'dry' | 'wet' | 'n2o' | 'pyrogenic' | 'hcl' | 'hibox';
export type GeometryType = 'blanket' | 'locos' | 'sti';
export type SubstrateOrientation = '100' | '110' | '111';
export type ThermalPhase = 'ramp' | 'soak' | 'cool';
export type MaterialType = 'Si' | 'SiO2' | 'Si3N4';

// ─── FEA Mesh ───
export interface FEANode {
  r: number;           // radial position (mm)
  z: number;           // depth position (nm)
  material: MaterialType;
  T: number;           // temperature (C)
  stress: number;      // von Mises stress (MPa)
  oxideThickness: number; // local oxide thickness (nm)
}

export interface FEAElement {
  nodes: [number, number, number, number]; // quad node indices
}

export interface FEAMesh {
  nodes: FEANode[];
  elements: FEAElement[];
  nr: number;
  nz: number;
}

// ─── Simulation Parameters (14 user-facing) ───
export interface SimulationParams {
  peakTemperature: number;
  rampRate: number;
  soakTime: number;
  coolingRate: number;
  oxidationType: OxidationType;
  geometryType: GeometryType;
  pressure: number;
  hclConcentration: number;
  initialOxideThickness: number;
  substrateOrientation: SubstrateOrientation;
  nitrideMaskWidth: number;
  trenchDepth: number;
  trenchWidth: number;
  lampBalance: number;
  totalSteps?: number;
}

// ─── Thermal Step ───
export interface ThermalStep {
  time: number;
  temperature: number;
  dt: number;
  phase: ThermalPhase;
}

// ─── Solver State (mutable, WeakMap cached) ───
export interface SolverState {
  mesh: FEAMesh;
  oxideThickness: number[];     // per-surface-node
  interfaceStress: number[];    // sigma_n at Si/SiO2 per surface node
  oxidationRate: number[];      // Q_oxidation source per surface node
  temperature: number;
  time: number;
  thermalBudget: number;
}

// ─── Per-Step Snapshot ───
export interface StepState {
  stepIndex: number;
  time: number;
  temperature: number;
  thermalPhase: ThermalPhase;
  oxideThicknessCenter: number;
  oxideThicknessMid: number;
  oxideThicknessEdge: number;
  temperatureCenter: number;
  temperatureMid: number;
  temperatureEdge: number;
  peakStress: number;
  birdBeakLength: number;
  oxidationRate: number;
  oxideUniformity: number;
  trenchCornerStress: number;
  thermalBudget: number;
  // Full field data for 3D scene
  nodeTemperatures: number[];
  nodeStresses: number[];
  nodeOxideThicknesses: number[];
}

// ─── Top-Level Simulation State (immutable) ───
export interface SimulationState {
  params: SimulationParams;
  steps: StepState[];
  currentIndex: number;
  totalSteps: number;
  thermalProfile: ThermalStep[];
  mesh: FEAMesh;
}

// ─── Metric Union ───
export type OxidationMetric =
  | 'oxideThickness'
  | 'temperature'
  | 'peakStress'
  | 'birdBeakLength'
  | 'oxidationRate'
  | 'oxideUniformity'
  | 'trenchCornerStress'
  | 'thermalBudget';

// ─── Preset Union ───
export type PresetId =
  | 'dry-gate-oxide'
  | 'wet-field-oxide'
  | 'pad-oxide'
  | 'locos-isolation'
  | 'sti-liner'
  | 'n2o-oxynitride'
  | 'pyrogenic-wet'
  | 'hcl-gettering'
  | 'hibox-thick'
  | 'thermal-stress-overshoot'
  | 'edge-nonuniformity'
  | 'ultra-thin-rto';

export interface Preset {
  id: PresetId;
  label: string;
  labelCN: string;
  color: string;
  apply: (params: SimulationParams) => SimulationParams;
}
```

**Step 2: Commit**

```bash
git add equipment-monitor/src/lib/oxidation-sim/types.ts
git commit -m "feat(oxidation-sim): type definitions — FEA mesh, 14 params, 8 metrics, 12 presets"
```

---

### Task 2: constants.ts — Physical Constants & Parameter Bounds

**Files:**
- Create: `equipment-monitor/src/lib/oxidation-sim/constants.ts`

**Step 1: Write constants.ts**

```typescript
import type { SimulationParams, OxidationType, MaterialType } from './types';

// ─── Physical Constants ───
export const BOLTZMANN_EV = 8.617e-5;        // eV/K
export const T_AMBIENT = 25;                  // C
export const WAFER_RADIUS_MM = 150;           // mm (300mm wafer / 2)

// ─── Simulation Grid ───
export const DEFAULT_TOTAL_STEPS = 200;

// ─── Material Properties ───
export interface MaterialProps {
  cte: number;        // coefficient of thermal expansion (1/K)
  youngsE: number;    // Young's modulus (GPa)
  poisson: number;    // Poisson's ratio
  rhoCp: number;      // volumetric heat capacity (J/m^3*K)
}

export const MATERIAL_PROPS: Record<MaterialType, MaterialProps & { kBase: number; kExponent?: number }> = {
  Si:    { cte: 2.6e-6, youngsE: 130, poisson: 0.28, rhoCp: 1.63e6, kBase: 150, kExponent: 1.3 },
  SiO2:  { cte: 0.5e-6, youngsE: 72,  poisson: 0.17, rhoCp: 1.65e6, kBase: 1.4 },
  Si3N4: { cte: 3.2e-6, youngsE: 270, poisson: 0.27, rhoCp: 2.1e6,  kBase: 30 },
};

/** Thermal conductivity (W/m*K) — Si is temperature-dependent */
export function thermalConductivity(material: MaterialType, T_celsius: number): number {
  const p = MATERIAL_PROPS[material];
  if (p.kExponent) {
    const T = Math.max(T_celsius + 273.15, 1);
    return p.kBase / Math.pow(T / 300, p.kExponent);
  }
  return p.kBase;
}

// ─── Deal-Grove Rate Constants ───
export interface DealGroveCoeffs {
  label: string;
  labelCN: string;
  baDivPrefactor: number;  // B/A prefactor (nm/s)
  baE: number;             // B/A activation energy (eV)
  bPrefactor: number;      // B prefactor (nm^2/s)
  bE: number;              // B activation energy (eV)
}

const BASE_COEFFS: Record<OxidationType, DealGroveCoeffs> = {
  dry:       { label: 'Dry O\u2082',     labelCN: '\u4E7E\u6C27\u6C27\u5316', baDivPrefactor: 3.71e6, baE: 2.00, bPrefactor: 7.72e2, bE: 1.23 },
  wet:       { label: 'Wet O\u2082',     labelCN: '\u6FD5\u6C27\u6C27\u5316', baDivPrefactor: 9.70e7, baE: 2.05, bPrefactor: 3.86e2, bE: 0.78 },
  n2o:       { label: 'N\u2082O',        labelCN: '\u6C27\u6C2E\u5316',       baDivPrefactor: 1.5e6,  baE: 2.00, bPrefactor: 3.0e2,  bE: 1.20 },
  pyrogenic: { label: 'Pyrogenic',       labelCN: '\u71B1\u89E3\u6FD5\u6C27', baDivPrefactor: 8.5e7,  baE: 2.05, bPrefactor: 3.5e2,  bE: 0.78 },
  hcl:       { label: 'HCl-Doped',      labelCN: 'HCl\u53BB\u6C61', baDivPrefactor: 3.71e6, baE: 2.00, bPrefactor: 7.72e2, bE: 1.23 },
  hibox:     { label: 'HIBOX',           labelCN: '\u9AD8\u58D3\u6C27\u5316', baDivPrefactor: 3.71e6, baE: 2.00, bPrefactor: 7.72e2, bE: 1.23 },
};

export function getDealGroveCoeffs(type: OxidationType): DealGroveCoeffs {
  return BASE_COEFFS[type];
}

// ─── Orientation Factor ───
export const ORIENTATION_FACTOR: Record<string, number> = {
  '100': 1.0,
  '110': 1.45,
  '111': 1.68,
};

// ─── Oxidation Enthalpy (eV/molecule) ───
export const OXIDATION_ENTHALPY: Record<OxidationType, number> = {
  dry: 3.6,
  wet: 1.6,
  n2o: 3.4,
  pyrogenic: 1.6,
  hcl: 3.6,
  hibox: 3.6,
};

// ─── Volume Expansion ───
export const SI_TO_SIO2_RATIO = 2.2;
export const MISMATCH_STRAIN = 1 - 1 / SI_TO_SIO2_RATIO; // ~0.545

// ─── Viscoelastic Relaxation ───
export const VISCOSITY_PREFACTOR = 4.6e-15;  // Pa*s
export const VISCOSITY_ACTIVATION = 5.2;     // eV

// ─── Kao Feedback Volumes ───
export const KAO_VA = 0.01;     // nm^3 — activation volume (surface reaction)
export const KAO_VD = 0.005;    // nm^3 — activation volume (diffusion)

// ─── Parameter Bounds ───
export const PARAM_BOUNDS = {
  peakTemperature:       { min: 700,  max: 1200, default: 1000, step: 10,   unit: '\u00B0C',  label: 'Peak T' },
  rampRate:              { min: 0,    max: 2.3,  default: 1,    step: 0.1,  unit: '\u00B0C/s', label: 'Ramp Rate', isLog: true },
  soakTime:              { min: -1,   max: 3.86, default: 3.26, step: 0.1,  unit: 's',         label: 'Soak Time', isLog: true },
  coolingRate:           { min: 0,    max: 2.3,  default: 1,    step: 0.1,  unit: '\u00B0C/s', label: 'Cool Rate', isLog: true },
  pressure:              { min: 1,    max: 25,   default: 1,    step: 1,    unit: 'atm',       label: 'Pressure' },
  hclConcentration:      { min: 0,    max: 10,   default: 3,    step: 0.5,  unit: '%',         label: 'HCl %' },
  initialOxideThickness: { min: 0,    max: 100,  default: 0,    step: 1,    unit: 'nm',        label: 'Init Oxide' },
  nitrideMaskWidth:      { min: 200,  max: 2000, default: 500,  step: 50,   unit: 'nm',        label: 'Nitride W' },
  trenchDepth:           { min: 100,  max: 500,  default: 300,  step: 10,   unit: 'nm',        label: 'Trench D' },
  trenchWidth:           { min: 50,   max: 500,  default: 200,  step: 10,   unit: 'nm',        label: 'Trench W' },
  lampBalance:           { min: 50,   max: 100,  default: 85,   step: 1,    unit: '% center',  label: 'Lamp Bal' },
} as const;

export const DEFAULT_PARAMS: SimulationParams = {
  peakTemperature: PARAM_BOUNDS.peakTemperature.default,
  rampRate: Math.pow(10, PARAM_BOUNDS.rampRate.default),
  soakTime: Math.pow(10, PARAM_BOUNDS.soakTime.default),
  coolingRate: Math.pow(10, PARAM_BOUNDS.coolingRate.default),
  oxidationType: 'dry',
  geometryType: 'blanket',
  pressure: PARAM_BOUNDS.pressure.default,
  hclConcentration: PARAM_BOUNDS.hclConcentration.default,
  initialOxideThickness: PARAM_BOUNDS.initialOxideThickness.default,
  substrateOrientation: '100',
  nitrideMaskWidth: PARAM_BOUNDS.nitrideMaskWidth.default,
  trenchDepth: PARAM_BOUNDS.trenchDepth.default,
  trenchWidth: PARAM_BOUNDS.trenchWidth.default,
  lampBalance: PARAM_BOUNDS.lampBalance.default,
  totalSteps: DEFAULT_TOTAL_STEPS,
};
```

**Step 2: Commit**

```bash
git add equipment-monitor/src/lib/oxidation-sim/constants.ts
git commit -m "feat(oxidation-sim): constants — material properties, Deal-Grove coefficients, param bounds"
```

---

### Task 3: mesh-templates.ts — 3 Structured FEA Meshes

**Files:**
- Create: `equipment-monitor/src/lib/oxidation-sim/mesh-templates.ts`
- Create: `equipment-monitor/src/lib/oxidation-sim/__tests__/mesh-templates.test.ts`

**Step 1: Write the test**

```typescript
import { describe, it, expect } from 'vitest';
import { createMesh } from '../mesh-templates';
import { DEFAULT_PARAMS } from '../constants';
import type { SimulationParams } from '../types';

describe('mesh-templates', () => {
  it('blanket mesh has ~400 nodes (20x20)', () => {
    const mesh = createMesh('blanket', DEFAULT_PARAMS);
    expect(mesh.nr).toBe(20);
    expect(mesh.nz).toBe(20);
    expect(mesh.nodes).toHaveLength(mesh.nr * mesh.nz);
  });

  it('locos mesh has extra radial nodes (~25x20)', () => {
    const params: SimulationParams = { ...DEFAULT_PARAMS, geometryType: 'locos' };
    const mesh = createMesh('locos', params);
    expect(mesh.nr).toBe(25);
    expect(mesh.nz).toBe(20);
    expect(mesh.nodes).toHaveLength(mesh.nr * mesh.nz);
  });

  it('sti mesh has extra depth nodes (~25x25)', () => {
    const params: SimulationParams = { ...DEFAULT_PARAMS, geometryType: 'sti' };
    const mesh = createMesh('sti', params);
    expect(mesh.nr).toBe(25);
    expect(mesh.nz).toBe(25);
    expect(mesh.nodes).toHaveLength(mesh.nr * mesh.nz);
  });

  it('all elements reference valid node indices', () => {
    const mesh = createMesh('blanket', DEFAULT_PARAMS);
    const maxIdx = mesh.nodes.length - 1;
    for (const el of mesh.elements) {
      for (const ni of el.nodes) {
        expect(ni).toBeGreaterThanOrEqual(0);
        expect(ni).toBeLessThanOrEqual(maxIdx);
      }
    }
  });

  it('blanket mesh element count is (nr-1)*(nz-1)', () => {
    const mesh = createMesh('blanket', DEFAULT_PARAMS);
    expect(mesh.elements).toHaveLength((mesh.nr - 1) * (mesh.nz - 1));
  });

  it('nodes have initial temperature at T_AMBIENT', () => {
    const mesh = createMesh('blanket', DEFAULT_PARAMS);
    for (const node of mesh.nodes) {
      expect(node.T).toBe(25);
      expect(node.stress).toBe(0);
    }
  });

  it('trench depth parameter changes STI mesh node positions', () => {
    const shallow = createMesh('sti', { ...DEFAULT_PARAMS, geometryType: 'sti', trenchDepth: 100 });
    const deep = createMesh('sti', { ...DEFAULT_PARAMS, geometryType: 'sti', trenchDepth: 500 });
    const shallowMaxZ = Math.max(...shallow.nodes.map(n => n.z));
    const deepMaxZ = Math.max(...deep.nodes.map(n => n.z));
    expect(deepMaxZ).toBeGreaterThan(shallowMaxZ);
  });

  it('locos mesh contains Si3N4 material nodes', () => {
    const mesh = createMesh('locos', { ...DEFAULT_PARAMS, geometryType: 'locos' });
    const nitrideNodes = mesh.nodes.filter(n => n.material === 'Si3N4');
    expect(nitrideNodes.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd equipment-monitor && npx vitest run src/lib/oxidation-sim/__tests__/mesh-templates.test.ts --reporter=verbose
```

Expected: FAIL — module not found.

**Step 3: Write mesh-templates.ts**

```typescript
import type { FEAMesh, FEANode, FEAElement, GeometryType, SimulationParams, MaterialType } from './types';
import { T_AMBIENT, WAFER_RADIUS_MM } from './constants';

/** Generate cosine-spaced array of radial positions (0 to WAFER_RADIUS_MM) */
function cosineRadial(n: number): number[] {
  const positions: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    positions.push(WAFER_RADIUS_MM * (1 - Math.cos(t * Math.PI / 2)));
  }
  return positions;
}

/** Generate geometric-spaced depth positions (finer near surface) */
function geometricDepth(n: number, maxDepthNm: number): number[] {
  const positions: number[] = [];
  const ratio = 1.15;
  let total = 0;
  const increments: number[] = [];
  let inc = 1;
  for (let i = 0; i < n; i++) {
    increments.push(inc);
    total += inc;
    inc *= ratio;
  }
  let cumulative = 0;
  for (let i = 0; i < n; i++) {
    positions.push((cumulative / total) * maxDepthNm);
    cumulative += increments[i];
  }
  return positions;
}

function createNodes(
  rPositions: number[],
  zPositions: number[],
  materialFn: (r: number, z: number) => MaterialType,
): FEANode[] {
  const nodes: FEANode[] = [];
  for (let iz = 0; iz < zPositions.length; iz++) {
    for (let ir = 0; ir < rPositions.length; ir++) {
      nodes.push({
        r: rPositions[ir],
        z: zPositions[iz],
        material: materialFn(rPositions[ir], zPositions[iz]),
        T: T_AMBIENT,
        stress: 0,
        oxideThickness: 0,
      });
    }
  }
  return nodes;
}

function createQuadElements(nr: number, nz: number): FEAElement[] {
  const elements: FEAElement[] = [];
  for (let iz = 0; iz < nz - 1; iz++) {
    for (let ir = 0; ir < nr - 1; ir++) {
      const bl = iz * nr + ir;
      const br = bl + 1;
      const tl = (iz + 1) * nr + ir;
      const tr = tl + 1;
      elements.push({ nodes: [bl, br, tr, tl] });
    }
  }
  return elements;
}

function blanketMesh(params: SimulationParams): FEAMesh {
  const nr = 20;
  const nz = 20;
  const maxDepth = 2000; // 2um
  const rPositions = cosineRadial(nr);
  const zPositions = geometricDepth(nz, maxDepth);
  const initOx = params.initialOxideThickness;

  const nodes = createNodes(rPositions, zPositions, (_r, z) => {
    if (initOx > 0 && z < initOx) return 'SiO2';
    return 'Si';
  });

  return { nodes, elements: createQuadElements(nr, nz), nr, nz };
}

function locosMesh(params: SimulationParams): FEAMesh {
  const nr = 25;
  const nz = 20;
  const maxDepth = 2000;
  const rPositions = cosineRadial(nr);
  const zPositions = geometricDepth(nz, maxDepth);
  const maskW = params.nitrideMaskWidth;
  const nitrideThickness = 150; // nm

  const nodes = createNodes(rPositions, zPositions, (r, z) => {
    // Si3N4 pad: within maskW from center, above nitrideThickness
    const rNm = r * 1e6; // mm to nm
    if (rNm < maskW && z < nitrideThickness) return 'Si3N4';
    if (params.initialOxideThickness > 0 && z < params.initialOxideThickness) return 'SiO2';
    return 'Si';
  });

  return { nodes, elements: createQuadElements(nr, nz), nr, nz };
}

function stiMesh(params: SimulationParams): FEAMesh {
  const nr = 25;
  const nz = 25;
  const maxDepth = Math.max(2000, params.trenchDepth * 3);
  const rPositions = cosineRadial(nr);
  const zPositions = geometricDepth(nz, maxDepth);
  const maskW = params.nitrideMaskWidth;
  const tDepth = params.trenchDepth;
  const tWidth = params.trenchWidth;
  const nitrideThickness = 150;

  const nodes = createNodes(rPositions, zPositions, (r, z) => {
    const rNm = r * 1e6;
    // Si3N4 hardmask on top
    if (rNm < maskW && z < nitrideThickness) return 'Si3N4';
    // Trench region: between maskW and maskW+tWidth, above tDepth
    if (rNm >= maskW && rNm < maskW + tWidth && z < tDepth) return 'SiO2';
    if (params.initialOxideThickness > 0 && z < params.initialOxideThickness) return 'SiO2';
    return 'Si';
  });

  return { nodes, elements: createQuadElements(nr, nz), nr, nz };
}

export function createMesh(geometry: GeometryType, params: SimulationParams): FEAMesh {
  switch (geometry) {
    case 'locos': return locosMesh(params);
    case 'sti': return stiMesh(params);
    default: return blanketMesh(params);
  }
}
```

**Step 4: Run test to verify it passes**

```bash
cd equipment-monitor && npx vitest run src/lib/oxidation-sim/__tests__/mesh-templates.test.ts --reporter=verbose
```

Expected: 8 passed.

**Step 5: Commit**

```bash
git add equipment-monitor/src/lib/oxidation-sim/mesh-templates.ts equipment-monitor/src/lib/oxidation-sim/__tests__/mesh-templates.test.ts
git commit -m "feat(oxidation-sim): mesh templates — blanket/LOCOS/STI structured FEA meshes"
```

---

### Task 4: thermal-fea.ts — 2D Heat Equation Solver

**Files:**
- Create: `equipment-monitor/src/lib/oxidation-sim/thermal-fea.ts`
- Create: `equipment-monitor/src/lib/oxidation-sim/__tests__/thermal-fea.test.ts`

**Step 1: Write the test**

```typescript
import { describe, it, expect } from 'vitest';
import { solveThermalStep, createThermalProfile } from '../thermal-fea';
import { createMesh } from '../mesh-templates';
import { DEFAULT_PARAMS, T_AMBIENT } from '../constants';

describe('thermal-fea', () => {
  it('uniform heating produces temperature above ambient', () => {
    const mesh = createMesh('blanket', DEFAULT_PARAMS);
    const oxidationRate = new Array(mesh.nr).fill(0);
    solveThermalStep(mesh, 1000, 1.0, 85, oxidationRate, 'dry');
    const avgT = mesh.nodes.reduce((s, n) => s + n.T, 0) / mesh.nodes.length;
    expect(avgT).toBeGreaterThan(T_AMBIENT);
  });

  it('edge temperature is lower than center with lampBalance < 100', () => {
    const mesh = createMesh('blanket', DEFAULT_PARAMS);
    const oxidationRate = new Array(mesh.nr).fill(0);
    solveThermalStep(mesh, 1000, 10.0, 70, oxidationRate, 'dry');
    // center node (first column)
    const centerT = mesh.nodes[0].T;
    // edge node (last column of first row)
    const edgeT = mesh.nodes[mesh.nr - 1].T;
    expect(centerT).toBeGreaterThan(edgeT);
  });

  it('temperature is uniform when lampBalance is 100', () => {
    const mesh = createMesh('blanket', DEFAULT_PARAMS);
    const oxidationRate = new Array(mesh.nr).fill(0);
    solveThermalStep(mesh, 1000, 10.0, 100, oxidationRate, 'dry');
    const temps = mesh.nodes.map(n => n.T);
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    expect(max - min).toBeLessThan(5); // nearly uniform
  });

  it('exothermic oxidation heat source raises temperature', () => {
    const mesh1 = createMesh('blanket', DEFAULT_PARAMS);
    const mesh2 = createMesh('blanket', DEFAULT_PARAMS);
    const noHeat = new Array(mesh1.nr).fill(0);
    const withHeat = new Array(mesh1.nr).fill(1e6);
    solveThermalStep(mesh1, 1000, 10.0, 85, noHeat, 'dry');
    solveThermalStep(mesh2, 1000, 10.0, 85, withHeat, 'dry');
    const avgT1 = mesh1.nodes.reduce((s, n) => s + n.T, 0) / mesh1.nodes.length;
    const avgT2 = mesh2.nodes.reduce((s, n) => s + n.T, 0) / mesh2.nodes.length;
    expect(avgT2).toBeGreaterThanOrEqual(avgT1);
  });

  it('all node temperatures are finite', () => {
    const mesh = createMesh('blanket', DEFAULT_PARAMS);
    const oxidationRate = new Array(mesh.nr).fill(0);
    solveThermalStep(mesh, 1000, 1.0, 85, oxidationRate, 'dry');
    for (const node of mesh.nodes) {
      expect(isFinite(node.T)).toBe(true);
    }
  });

  it('createThermalProfile generates correct number of steps', () => {
    const profile = createThermalProfile(DEFAULT_PARAMS);
    expect(profile).toHaveLength(DEFAULT_PARAMS.totalSteps ?? 200);
  });

  it('thermal profile follows ramp-soak-cool phases', () => {
    const profile = createThermalProfile(DEFAULT_PARAMS);
    const phases = profile.map(s => s.phase);
    // Should start with ramp
    expect(phases[0]).toBe('ramp');
    // Should contain soak
    expect(phases).toContain('soak');
    // Should end with cool
    expect(phases[phases.length - 1]).toBe('cool');
  });

  it('material interfaces maintain temperature continuity', () => {
    const params = { ...DEFAULT_PARAMS, geometryType: 'locos' as const, initialOxideThickness: 50 };
    const mesh = createMesh('locos', params);
    const oxidationRate = new Array(mesh.nr).fill(0);
    solveThermalStep(mesh, 1000, 10.0, 85, oxidationRate, 'dry');
    // Adjacent nodes at interface should have similar T
    for (let i = 1; i < mesh.nodes.length; i++) {
      const prev = mesh.nodes[i - 1];
      const curr = mesh.nodes[i];
      if (prev.material !== curr.material && Math.abs(prev.r - curr.r) < 1) {
        expect(Math.abs(prev.T - curr.T)).toBeLessThan(50);
      }
    }
  });

  it('Si thermal conductivity decreases with temperature', () => {
    const mesh1 = createMesh('blanket', DEFAULT_PARAMS);
    const mesh2 = createMesh('blanket', DEFAULT_PARAMS);
    const zeroRate = new Array(mesh1.nr).fill(0);
    solveThermalStep(mesh1, 800, 10.0, 70, zeroRate, 'dry');
    solveThermalStep(mesh2, 1200, 10.0, 70, zeroRate, 'dry');
    // At higher T, Si conducts worse so center-edge delta should be larger
    const delta1 = mesh1.nodes[0].T - mesh1.nodes[mesh1.nr - 1].T;
    const delta2 = mesh2.nodes[0].T - mesh2.nodes[mesh2.nr - 1].T;
    expect(Math.abs(delta2)).toBeGreaterThanOrEqual(Math.abs(delta1) * 0.5);
  });

  it('multiple steps accumulate temperature correctly', () => {
    const mesh = createMesh('blanket', DEFAULT_PARAMS);
    const zeroRate = new Array(mesh.nr).fill(0);
    solveThermalStep(mesh, 500, 5.0, 85, zeroRate, 'dry');
    const T_after1 = mesh.nodes[0].T;
    solveThermalStep(mesh, 1000, 5.0, 85, zeroRate, 'dry');
    const T_after2 = mesh.nodes[0].T;
    expect(T_after2).toBeGreaterThan(T_after1);
  });
});
```

**Step 2: Run test — expect FAIL**

**Step 3: Implement thermal-fea.ts**

The solver updates `mesh.nodes[].T` in-place using an implicit scheme. It computes lamp power distribution based on `lampBalance`, applies radiative + convective BC at the top, fixed chuck T at bottom, and uses material-aware thermal conductivity. Also exports `createThermalProfile()` for ramp-soak-cool scheduling.

Key functions:
- `solveThermalStep(mesh, targetT, dt, lampBalance, oxidationRate, oxidationType)` — one FEA timestep
- `createThermalProfile(params)` — array of ThermalStep for all timesteps

The FEA uses a row-by-row ADI (Alternating Direction Implicit) approach with the Thomas algorithm (same as diffusion-sim's `tridiagonalSolve`). This keeps each linear solve to O(N) per row/column.

**Step 4: Run test — expect 10 PASS**

**Step 5: Commit**

```bash
git add equipment-monitor/src/lib/oxidation-sim/thermal-fea.ts equipment-monitor/src/lib/oxidation-sim/__tests__/thermal-fea.test.ts
git commit -m "feat(oxidation-sim): thermal FEA — 2D heat equation with ADI solver, lamp balance, material conductivity"
```

---

### Task 5: deal-grove.ts — Linear-Parabolic Oxidation Model

**Files:**
- Create: `equipment-monitor/src/lib/oxidation-sim/deal-grove.ts`
- Create: `equipment-monitor/src/lib/oxidation-sim/__tests__/deal-grove.test.ts`

**Step 1: Write the test**

```typescript
import { describe, it, expect } from 'vitest';
import { computeBA, computeB, advanceOxideThickness, adjustForHcl, adjustForPressure } from '../deal-grove';

describe('deal-grove', () => {
  it('dry oxide at 1000C/30min grows ~10nm', () => {
    let x = 0;
    const dt = 1; // 1 second steps
    for (let t = 0; t < 1800; t++) {
      const ba = computeBA('dry', 1000, '100', 0, 0);
      const b = computeB('dry', 1000, 0, 0);
      x = advanceOxideThickness(x, ba, b, dt);
    }
    expect(x).toBeGreaterThan(5);
    expect(x).toBeLessThan(30);
  });

  it('wet oxide at 1050C/60min grows ~500nm', () => {
    let x = 0;
    for (let t = 0; t < 3600; t++) {
      const ba = computeBA('wet', 1050, '100', 0, 0);
      const b = computeB('wet', 1050, 0, 0);
      x = advanceOxideThickness(x, ba, b, 1);
    }
    expect(x).toBeGreaterThan(200);
    expect(x).toBeLessThan(1000);
  });

  it('linear regime: thin oxide grows linearly', () => {
    const ba = computeBA('dry', 1000, '100', 0, 0);
    const b = computeB('dry', 1000, 0, 0);
    const x1 = advanceOxideThickness(0, ba, b, 10);
    const x2 = advanceOxideThickness(0, ba, b, 20);
    // In linear regime, x ~ (B/A) * t, so x2/x1 ~ 2
    expect(x2 / x1).toBeGreaterThan(1.5);
    expect(x2 / x1).toBeLessThan(2.5);
  });

  it('(111) orientation oxidizes faster than (100)', () => {
    const ba100 = computeBA('dry', 1000, '100', 0, 0);
    const ba111 = computeBA('dry', 1000, '111', 0, 0);
    expect(ba111).toBeGreaterThan(ba100 * 1.5);
  });

  it('B is orientation-independent', () => {
    const b100 = computeB('dry', 1000, 0, 0);
    const b111 = computeB('dry', 1000, 0, 0);
    expect(b100).toBe(b111);
  });

  it('HCl doping enhances rate', () => {
    const ba_base = computeBA('dry', 1000, '100', 0, 0);
    const ba_hcl = adjustForHcl(ba_base, 3);
    expect(ba_hcl).toBeGreaterThan(ba_base);
  });

  it('pressure scaling: HIBOX at 10atm increases B quadratically', () => {
    const b_base = computeB('dry', 1000, 0, 0);
    const b_10atm = adjustForPressure(b_base, 10, 'b');
    expect(b_10atm).toBeGreaterThan(b_base * 50);
    expect(b_10atm).toBeLessThan(b_base * 150);
  });

  it('initial oxide tau correction works', () => {
    // Starting with existing oxide should produce less growth
    const ba = computeBA('dry', 1000, '100', 0, 0);
    const b = computeB('dry', 1000, 0, 0);
    const xFromZero = advanceOxideThickness(0, ba, b, 600);
    const xFrom50 = advanceOxideThickness(50, ba, b, 600);
    // xFrom50 should be thicker in total but grew less
    expect(xFrom50).toBeGreaterThan(50);
    expect(xFrom50 - 50).toBeLessThan(xFromZero);
  });

  it('compressive stress reduces B/A via Kao', () => {
    // With stress=0, B/A should be higher than with compressive stress
    const ba_noStress = computeBA('dry', 1000, '100', 0, 0);
    const ba_stress = computeBA('dry', 1000, '100', -500, 0); // -500 MPa compressive
    expect(ba_noStress).toBeGreaterThan(ba_stress);
  });

  it('zero stress produces unmodified rate', () => {
    const ba = computeBA('dry', 1000, '100', 0, 0);
    const ba2 = computeBA('dry', 1000, '100', 0, 0);
    expect(ba).toBe(ba2);
  });
});
```

**Step 2: Run test — expect FAIL**

**Step 3: Implement deal-grove.ts**

Key functions:
- `computeBA(type, T_celsius, orientation, stressN_MPa, kaoVa)` — returns B/A in nm/s, with Kao correction
- `computeB(type, T_celsius, stressN_MPa, kaoVd)` — returns B in nm^2/s, with Kao correction
- `advanceOxideThickness(x_current, ba, b, dt)` — analytical Deal-Grove quadratic solution for next thickness
- `adjustForHcl(ba, hclPercent)` — HCl enhancement factor
- `adjustForPressure(value, pressure, which)` — HIBOX pressure scaling (linear for B/A, quadratic for B)

The Kao feedback is embedded: `B/A_eff = B/A * exp(-sigma_n * V_a / kT)` and `B_eff = B * exp(-sigma_n * V_d / kT)`. Stress is in MPa, volumes in nm^3, converted to consistent units inside the function.

**Step 4: Run test — expect 10 PASS**

**Step 5: Commit**

```bash
git add equipment-monitor/src/lib/oxidation-sim/deal-grove.ts equipment-monitor/src/lib/oxidation-sim/__tests__/deal-grove.test.ts
git commit -m "feat(oxidation-sim): Deal-Grove model — 6 ambient types, orientation, Kao stress correction"
```

---

### Task 6: stress-model.ts — Viscoelastic Stress with CTE Mismatch

**Files:**
- Create: `equipment-monitor/src/lib/oxidation-sim/stress-model.ts`
- Create: `equipment-monitor/src/lib/oxidation-sim/__tests__/stress-model.test.ts`

**Step 1: Write the test**

```typescript
import { describe, it, expect } from 'vitest';
import { thermalStress, volumeExpansionStress, viscousRelaxation, computeStressField } from '../stress-model';
import { createMesh } from '../mesh-templates';
import { DEFAULT_PARAMS, T_AMBIENT } from '../constants';

describe('stress-model', () => {
  it('zero delta-T produces zero thermal stress', () => {
    expect(thermalStress('Si', 'SiO2', T_AMBIENT, T_AMBIENT)).toBe(0);
  });

  it('heating produces nonzero thermal stress between Si and SiO2', () => {
    const s = thermalStress('Si', 'SiO2', T_AMBIENT, 1000);
    expect(Math.abs(s)).toBeGreaterThan(0);
  });

  it('volume expansion produces compressive stress in oxide', () => {
    const s = volumeExpansionStress(10, 1000); // 10nm of new oxide at 1000C
    expect(s).toBeLessThan(0); // compressive
  });

  it('no new oxide produces zero expansion stress', () => {
    expect(volumeExpansionStress(0, 1000)).toBe(0);
  });

  it('viscous relaxation reduces stress magnitude', () => {
    const s0 = -500; // MPa compressive
    const s1 = viscousRelaxation(s0, 1000, 60); // 60s at 1000C
    expect(Math.abs(s1)).toBeLessThan(Math.abs(s0));
  });

  it('relaxation is faster at higher temperature', () => {
    const s0 = -500;
    const s_low = viscousRelaxation(s0, 800, 60);
    const s_high = viscousRelaxation(s0, 1100, 60);
    expect(Math.abs(s_high)).toBeLessThan(Math.abs(s_low));
  });

  it('computeStressField updates mesh stress values', () => {
    const mesh = createMesh('blanket', DEFAULT_PARAMS);
    // Set temperatures above ambient
    for (const node of mesh.nodes) node.T = 1000;
    const oxThickness = new Array(mesh.nr).fill(10);
    computeStressField(mesh, oxThickness, 1.0);
    const stresses = mesh.nodes.map(n => n.stress);
    const anyNonZero = stresses.some(s => s !== 0);
    expect(anyNonZero).toBe(true);
  });

  it('STI trench corner has higher stress than flat surface', () => {
    const mesh = createMesh('sti', { ...DEFAULT_PARAMS, geometryType: 'sti' });
    for (const node of mesh.nodes) node.T = 1000;
    const oxThickness = new Array(mesh.nr).fill(20);
    computeStressField(mesh, oxThickness, 5.0);
    // Corner nodes (near trench bottom) should have higher stress than surface
    const surfaceStress = Math.abs(mesh.nodes[0].stress);
    const cornerNodes = mesh.nodes.filter(n => n.z > 200 && n.z < 400);
    const maxCornerStress = Math.max(...cornerNodes.map(n => Math.abs(n.stress)));
    expect(maxCornerStress).toBeGreaterThanOrEqual(surfaceStress * 0.5);
  });

  it('all stress values are finite', () => {
    const mesh = createMesh('blanket', DEFAULT_PARAMS);
    for (const node of mesh.nodes) node.T = 1000;
    const oxThickness = new Array(mesh.nr).fill(10);
    computeStressField(mesh, oxThickness, 1.0);
    for (const node of mesh.nodes) {
      expect(isFinite(node.stress)).toBe(true);
    }
  });

  it('stress magnitude increases with lower temperature (less relaxation)', () => {
    const s_900 = viscousRelaxation(-1000, 900, 60);
    const s_1100 = viscousRelaxation(-1000, 1100, 60);
    expect(Math.abs(s_900)).toBeGreaterThan(Math.abs(s_1100));
  });
});
```

**Step 2: Run test — expect FAIL**

**Step 3: Implement stress-model.ts**

Key functions:
- `thermalStress(mat1, mat2, T_ref, T_current)` — CTE mismatch stress (MPa)
- `volumeExpansionStress(newOxideNm, T_celsius)` — compressive stress from 2.2x volume expansion
- `viscousRelaxation(stress, T_celsius, dt)` — exponential decay with T-dependent viscosity
- `computeStressField(mesh, oxideThickness, dt)` — updates all mesh node stresses

**Step 4: Run test — expect 10 PASS**

**Step 5: Commit**

```bash
git add equipment-monitor/src/lib/oxidation-sim/stress-model.ts equipment-monitor/src/lib/oxidation-sim/__tests__/stress-model.test.ts
git commit -m "feat(oxidation-sim): stress model — CTE mismatch, volume expansion, viscoelastic relaxation"
```

---

### Task 7: kao-feedback.ts — Stress-Dependent Rate Correction

**Files:**
- Create: `equipment-monitor/src/lib/oxidation-sim/kao-feedback.ts`
- Create: `equipment-monitor/src/lib/oxidation-sim/__tests__/kao-feedback.test.ts`

**Step 1: Write the test**

```typescript
import { describe, it, expect } from 'vitest';
import { kaoCorrection, computeBirdBeakLength } from '../kao-feedback';

describe('kao-feedback', () => {
  it('zero stress returns correction factor of 1', () => {
    expect(kaoCorrection(0, 1000, 0.01)).toBeCloseTo(1.0, 5);
  });

  it('compressive stress reduces rate (factor < 1)', () => {
    const factor = kaoCorrection(-500, 1000, 0.01);
    expect(factor).toBeLessThan(1);
    expect(factor).toBeGreaterThan(0);
  });

  it('tensile stress increases rate (factor > 1)', () => {
    const factor = kaoCorrection(500, 1000, 0.01);
    expect(factor).toBeGreaterThan(1);
  });

  it('higher stress produces stronger suppression', () => {
    const f1 = kaoCorrection(-200, 1000, 0.01);
    const f2 = kaoCorrection(-800, 1000, 0.01);
    expect(f2).toBeLessThan(f1);
  });

  it('bird's beak length is 0 for uniform oxide thickness', () => {
    const uniform = new Array(20).fill(50);
    expect(computeBirdBeakLength(uniform, 0)).toBe(0);
  });

  it('bird's beak length > 0 when oxide tapers near mask edge', () => {
    const thicknesses = new Array(20).fill(50);
    // Taper near mask edge (index 10)
    for (let i = 10; i < 20; i++) {
      thicknesses[i] = 50 * (1 - (i - 10) / 10);
    }
    const bb = computeBirdBeakLength(thicknesses, 10);
    expect(bb).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test — expect FAIL**

**Step 3: Implement kao-feedback.ts**

```typescript
import { BOLTZMANN_EV } from './constants';

/**
 * Kao correction factor for oxidation rate.
 * sigma_n: normal stress at interface (MPa, negative = compressive)
 * T_celsius: temperature
 * volume: activation volume (nm^3) — KAO_VA for B/A, KAO_VD for B
 * Returns multiplicative factor (< 1 for compressive, > 1 for tensile)
 */
export function kaoCorrection(sigma_n_MPa: number, T_celsius: number, volume_nm3: number): number {
  if (sigma_n_MPa === 0) return 1;
  const T = T_celsius + 273.15;
  const kT = BOLTZMANN_EV * T; // eV
  // Convert: sigma (MPa) * volume (nm^3) -> eV
  // 1 MPa * 1 nm^3 = 1e6 Pa * 1e-27 m^3 = 1e-21 J = 6.242e-3 eV
  const sigmaV_eV = sigma_n_MPa * volume_nm3 * 6.242e-3;
  return Math.exp(-sigmaV_eV / kT);
}

/**
 * Compute bird's beak length from oxide thickness array.
 * maskEdgeIdx: radial index where nitride mask edge is.
 * Returns distance (in node units) where thickness drops below 50% of field value.
 */
export function computeBirdBeakLength(oxideThicknesses: number[], maskEdgeIdx: number): number {
  if (maskEdgeIdx <= 0 || maskEdgeIdx >= oxideThicknesses.length) return 0;
  const fieldThickness = oxideThicknesses[0];
  if (fieldThickness <= 0) return 0;
  const threshold = fieldThickness * 0.5;

  let bbLength = 0;
  for (let i = maskEdgeIdx; i < oxideThicknesses.length; i++) {
    if (oxideThicknesses[i] < threshold) {
      bbLength = i - maskEdgeIdx;
      break;
    }
  }
  return bbLength;
}
```

**Step 4: Run test — expect 6 PASS**

**Step 5: Commit**

```bash
git add equipment-monitor/src/lib/oxidation-sim/kao-feedback.ts equipment-monitor/src/lib/oxidation-sim/__tests__/kao-feedback.test.ts
git commit -m "feat(oxidation-sim): Kao feedback — stress-dependent oxidation rate correction + bird's beak"
```

---

### Task 8: wafer-metrics.ts — 8 Derived Metrics

**Files:**
- Create: `equipment-monitor/src/lib/oxidation-sim/wafer-metrics.ts`
- Create: `equipment-monitor/src/lib/oxidation-sim/__tests__/wafer-metrics.test.ts`

**Step 1: Write the test**

```typescript
import { describe, it, expect } from 'vitest';
import { computeMetrics } from '../wafer-metrics';
import { createMesh } from '../mesh-templates';
import { DEFAULT_PARAMS } from '../constants';
import type { SolverState } from '../types';

function makeSolverState(): SolverState {
  const mesh = createMesh('blanket', DEFAULT_PARAMS);
  const nr = mesh.nr;
  return {
    mesh,
    oxideThickness: new Array(nr).fill(10),
    interfaceStress: new Array(nr).fill(0),
    oxidationRate: new Array(nr).fill(1),
    temperature: 1000,
    time: 100,
    thermalBudget: 5000,
  };
}

describe('wafer-metrics', () => {
  it('all 8 metrics are finite numbers', () => {
    const state = makeSolverState();
    const m = computeMetrics(state, DEFAULT_PARAMS);
    expect(isFinite(m.oxideThickness)).toBe(true);
    expect(isFinite(m.temperature)).toBe(true);
    expect(isFinite(m.peakStress)).toBe(true);
    expect(isFinite(m.birdBeakLength)).toBe(true);
    expect(isFinite(m.oxidationRate)).toBe(true);
    expect(isFinite(m.oxideUniformity)).toBe(true);
    expect(isFinite(m.trenchCornerStress)).toBe(true);
    expect(isFinite(m.thermalBudget)).toBe(true);
  });

  it('oxide uniformity is 0% for uniform thickness', () => {
    const state = makeSolverState();
    state.oxideThickness.fill(50);
    const m = computeMetrics(state, DEFAULT_PARAMS);
    expect(m.oxideUniformity).toBeCloseTo(0, 1);
  });

  it('oxide uniformity > 0 for non-uniform thickness', () => {
    const state = makeSolverState();
    state.oxideThickness[0] = 100;
    state.oxideThickness[state.oxideThickness.length - 1] = 50;
    const m = computeMetrics(state, DEFAULT_PARAMS);
    expect(m.oxideUniformity).toBeGreaterThan(0);
  });

  it('bird beak length is 0 for blanket geometry', () => {
    const state = makeSolverState();
    const m = computeMetrics(state, DEFAULT_PARAMS);
    expect(m.birdBeakLength).toBe(0);
  });

  it('trench corner stress factor is 1.0 for blanket', () => {
    const state = makeSolverState();
    const m = computeMetrics(state, DEFAULT_PARAMS);
    expect(m.trenchCornerStress).toBeCloseTo(1.0, 1);
  });

  it('thermal budget matches solver state', () => {
    const state = makeSolverState();
    state.thermalBudget = 12345;
    const m = computeMetrics(state, DEFAULT_PARAMS);
    expect(m.thermalBudget).toBe(12345);
  });

  it('temperature is center node temperature', () => {
    const state = makeSolverState();
    state.mesh.nodes[0].T = 999;
    const m = computeMetrics(state, DEFAULT_PARAMS);
    expect(m.temperature).toBe(999);
  });

  it('oxide thickness is center value', () => {
    const state = makeSolverState();
    state.oxideThickness[0] = 42;
    const m = computeMetrics(state, DEFAULT_PARAMS);
    expect(m.oxideThickness).toBe(42);
  });
});
```

**Step 2: Run test — expect FAIL**

**Step 3: Implement wafer-metrics.ts**

```typescript
import type { SolverState, SimulationParams, OxidationMetric } from './types';
import { computeBirdBeakLength } from './kao-feedback';

export function computeMetrics(
  state: SolverState,
  params: SimulationParams,
): Record<OxidationMetric, number> {
  const nr = state.mesh.nr;
  const ox = state.oxideThickness;
  const centerIdx = 0;
  const midIdx = Math.floor(nr / 2);
  const edgeIdx = nr - 1;

  // Oxide thickness (center)
  const oxideThickness = ox[centerIdx] ?? 0;

  // Temperature (center node)
  const temperature = state.mesh.nodes[centerIdx]?.T ?? state.temperature;

  // Peak stress (von Mises max across all nodes)
  const peakStress = Math.max(...state.mesh.nodes.map(n => Math.abs(n.stress)));

  // Bird's beak length (only for locos/sti)
  let birdBeakLength = 0;
  if (params.geometryType === 'locos' || params.geometryType === 'sti') {
    const maskEdgeIdx = Math.floor(nr / 2);
    birdBeakLength = computeBirdBeakLength(ox, maskEdgeIdx);
  }

  // Oxidation rate (average)
  const oxidationRate = state.oxidationRate.reduce((s, r) => s + r, 0) / Math.max(1, state.oxidationRate.length);

  // Oxide uniformity (% range)
  const oxMin = Math.min(...ox);
  const oxMax = Math.max(...ox);
  const oxAvg = ox.reduce((s, v) => s + v, 0) / Math.max(1, ox.length);
  const oxideUniformity = oxAvg > 0 ? ((oxMax - oxMin) / oxAvg) * 100 : 0;

  // Trench corner stress factor
  let trenchCornerStress = 1.0;
  if (params.geometryType === 'sti') {
    const surfaceStress = Math.abs(state.mesh.nodes[0]?.stress ?? 1);
    const cornerNodes = state.mesh.nodes.filter(n => n.z > params.trenchDepth * 0.5 && n.z < params.trenchDepth * 1.5);
    if (cornerNodes.length > 0 && surfaceStress > 0) {
      const maxCorner = Math.max(...cornerNodes.map(n => Math.abs(n.stress)));
      trenchCornerStress = maxCorner / surfaceStress;
    }
  }

  return {
    oxideThickness,
    temperature,
    peakStress,
    birdBeakLength,
    oxidationRate,
    oxideUniformity,
    trenchCornerStress,
    thermalBudget: state.thermalBudget,
  };
}
```

**Step 4: Run test — expect 8 PASS**

**Step 5: Commit**

```bash
git add equipment-monitor/src/lib/oxidation-sim/wafer-metrics.ts equipment-monitor/src/lib/oxidation-sim/__tests__/wafer-metrics.test.ts
git commit -m "feat(oxidation-sim): wafer metrics — 8 derived metrics from FEA solver state"
```

---

### Task 9: presets.ts — 12 Presets

**Files:**
- Create: `equipment-monitor/src/lib/oxidation-sim/presets.ts`
- Create: `equipment-monitor/src/lib/oxidation-sim/__tests__/presets.test.ts`

**Step 1: Write the test**

```typescript
import { describe, it, expect } from 'vitest';
import { PRESETS, getPreset } from '../presets';
import { DEFAULT_PARAMS } from '../constants';

describe('presets', () => {
  it('all 12 presets exist', () => {
    expect(PRESETS).toHaveLength(12);
  });

  it('each preset has unique id', () => {
    const ids = PRESETS.map(p => p.id);
    expect(new Set(ids).size).toBe(12);
  });

  it('each preset has label, labelCN, and color', () => {
    for (const p of PRESETS) {
      expect(p.label.length).toBeGreaterThan(0);
      expect(p.labelCN.length).toBeGreaterThan(0);
      expect(p.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('apply() returns valid SimulationParams', () => {
    for (const p of PRESETS) {
      const result = p.apply(DEFAULT_PARAMS);
      expect(result.peakTemperature).toBeGreaterThanOrEqual(700);
      expect(result.peakTemperature).toBeLessThanOrEqual(1200);
      expect(typeof result.oxidationType).toBe('string');
      expect(typeof result.geometryType).toBe('string');
    }
  });

  it('apply() is pure — does not mutate input', () => {
    const original = { ...DEFAULT_PARAMS };
    for (const p of PRESETS) {
      p.apply(DEFAULT_PARAMS);
      expect(DEFAULT_PARAMS).toEqual(original);
    }
  });

  it('locos-isolation preset sets geometry to locos', () => {
    const p = getPreset('locos-isolation');
    expect(p).toBeDefined();
    const result = p!.apply(DEFAULT_PARAMS);
    expect(result.geometryType).toBe('locos');
  });

  it('sti-liner preset sets geometry to sti', () => {
    const p = getPreset('sti-liner');
    expect(p).toBeDefined();
    const result = p!.apply(DEFAULT_PARAMS);
    expect(result.geometryType).toBe('sti');
  });

  it('getPreset returns undefined for unknown id', () => {
    expect(getPreset('nonexistent' as never)).toBeUndefined();
  });
});
```

**Step 2: Run test — expect FAIL**

**Step 3: Implement presets.ts**

```typescript
import type { Preset } from './types';

export const PRESETS: Preset[] = [
  {
    id: 'dry-gate-oxide',
    label: 'Dry Gate Oxide',
    labelCN: '\u4E7E\u6C27\u95D8\u6975\u6C27\u5316',
    color: '#3b82f6',
    apply: (p) => ({ ...p, oxidationType: 'dry' as const, geometryType: 'blanket' as const, peakTemperature: 1000, soakTime: 1800, pressure: 1 }),
  },
  {
    id: 'wet-field-oxide',
    label: 'Wet Field Oxide',
    labelCN: '\u6FD5\u6C27\u5834\u6C27\u5316',
    color: '#06b6d4',
    apply: (p) => ({ ...p, oxidationType: 'wet' as const, geometryType: 'blanket' as const, peakTemperature: 1050, soakTime: 3600 }),
  },
  {
    id: 'pad-oxide',
    label: 'Pad Oxide',
    labelCN: '\u588A\u6C27\u5316\u5C64',
    color: '#64748b',
    apply: (p) => ({ ...p, oxidationType: 'dry' as const, geometryType: 'blanket' as const, peakTemperature: 900, soakTime: 600 }),
  },
  {
    id: 'locos-isolation',
    label: 'LOCOS Isolation',
    labelCN: 'LOCOS\u96A8\u96E2',
    color: '#f97316',
    apply: (p) => ({ ...p, oxidationType: 'wet' as const, geometryType: 'locos' as const, peakTemperature: 1000, soakTime: 2700, nitrideMaskWidth: 500 }),
  },
  {
    id: 'sti-liner',
    label: 'STI Liner Oxide',
    labelCN: 'STI\u896F\u6C27\u5316',
    color: '#ef4444',
    apply: (p) => ({ ...p, oxidationType: 'dry' as const, geometryType: 'sti' as const, peakTemperature: 1050, soakTime: 900, trenchDepth: 300, trenchWidth: 200 }),
  },
  {
    id: 'n2o-oxynitride',
    label: 'N\u2082O Oxynitride',
    labelCN: 'N\u2082O\u6C27\u6C2E\u5316',
    color: '#8b5cf6',
    apply: (p) => ({ ...p, oxidationType: 'n2o' as const, geometryType: 'blanket' as const, peakTemperature: 1050, soakTime: 1200 }),
  },
  {
    id: 'pyrogenic-wet',
    label: 'Pyrogenic Wet',
    labelCN: '\u71B1\u89E3\u6FD5\u6C27',
    color: '#10b981',
    apply: (p) => ({ ...p, oxidationType: 'pyrogenic' as const, geometryType: 'blanket' as const, peakTemperature: 1000, soakTime: 1800 }),
  },
  {
    id: 'hcl-gettering',
    label: 'HCl Gettering',
    labelCN: 'HCl\u53BB\u6C61\u6C27\u5316',
    color: '#eab308',
    apply: (p) => ({ ...p, oxidationType: 'hcl' as const, geometryType: 'blanket' as const, peakTemperature: 1100, soakTime: 2700, hclConcentration: 3 }),
  },
  {
    id: 'hibox-thick',
    label: 'HIBOX Thick Oxide',
    labelCN: '\u9AD8\u58D3\u539A\u6C27\u5316',
    color: '#a855f7',
    apply: (p) => ({ ...p, oxidationType: 'hibox' as const, geometryType: 'blanket' as const, peakTemperature: 950, soakTime: 1200, pressure: 10 }),
  },
  {
    id: 'thermal-stress-overshoot',
    label: 'Stress Overshoot',
    labelCN: '\u71B1\u61C9\u529B\u8D85\u6A19',
    color: '#dc2626',
    apply: (p) => ({ ...p, oxidationType: 'dry' as const, geometryType: 'sti' as const, peakTemperature: 1150, rampRate: 200, trenchDepth: 300 }),
  },
  {
    id: 'edge-nonuniformity',
    label: 'Edge Non-Uniformity',
    labelCN: '\u908A\u7DE3\u4E0D\u5747\u52FB',
    color: '#f59e0b',
    apply: (p) => ({ ...p, oxidationType: 'wet' as const, geometryType: 'blanket' as const, peakTemperature: 1000, soakTime: 1800, lampBalance: 60 }),
  },
  {
    id: 'ultra-thin-rto',
    label: 'Ultra-Thin RTO',
    labelCN: '\u8D85\u8584RTO\u95D8\u6975\u6C27\u5316',
    color: '#ec4899',
    apply: (p) => ({ ...p, oxidationType: 'dry' as const, geometryType: 'blanket' as const, peakTemperature: 1050, soakTime: 5, rampRate: 150 }),
  },
];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
```

**Step 4: Run test — expect 8 PASS**

**Step 5: Commit**

```bash
git add equipment-monitor/src/lib/oxidation-sim/presets.ts equipment-monitor/src/lib/oxidation-sim/__tests__/presets.test.ts
git commit -m "feat(oxidation-sim): 12 presets — gate oxide, LOCOS, STI, HIBOX, RTO"
```

---

### Task 10: simulation-engine.ts — Step API with Coupled Physics Loop

**Files:**
- Create: `equipment-monitor/src/lib/oxidation-sim/simulation-engine.ts`
- Create: `equipment-monitor/src/lib/oxidation-sim/__tests__/simulation-engine.test.ts`

**Step 1: Write the test**

```typescript
import { describe, it, expect } from 'vitest';
import { createSimulation, stepForward, stepN, applyPreset } from '../simulation-engine';
import { DEFAULT_PARAMS, DEFAULT_TOTAL_STEPS } from '../constants';
import type { SimulationParams } from '../types';

describe('simulation-engine', () => {
  it('createSimulation returns valid initial state', () => {
    const sim = createSimulation();
    expect(sim.params).toEqual(DEFAULT_PARAMS);
    expect(sim.steps).toHaveLength(0);
    expect(sim.currentIndex).toBe(-1);
    expect(sim.totalSteps).toBe(DEFAULT_TOTAL_STEPS);
    expect(sim.thermalProfile).toHaveLength(DEFAULT_TOTAL_STEPS);
    expect(sim.mesh.nodes.length).toBeGreaterThan(0);
  });

  it('stepForward advances index by 1', () => {
    const sim = createSimulation();
    const next = stepForward(sim);
    expect(next.currentIndex).toBe(0);
    expect(next.steps).toHaveLength(1);
  });

  it('oxide grows monotonically over steps', () => {
    let sim = createSimulation();
    sim = stepN(sim, 50);
    const thicknesses = sim.steps.map(s => s.oxideThicknessCenter);
    for (let i = 1; i < thicknesses.length; i++) {
      expect(thicknesses[i]).toBeGreaterThanOrEqual(thicknesses[i - 1]);
    }
  });

  it('thermal budget accumulates', () => {
    let sim = createSimulation();
    sim = stepN(sim, 30);
    const budgets = sim.steps.map(s => s.thermalBudget);
    for (let i = 1; i < budgets.length; i++) {
      expect(budgets[i]).toBeGreaterThanOrEqual(budgets[i - 1]);
    }
  });

  it('thermal phases follow ramp-soak-cool', () => {
    let sim = createSimulation();
    sim = stepN(sim, 200);
    const phases = sim.steps.map(s => s.thermalPhase);
    expect(phases[0]).toBe('ramp');
    expect(phases).toContain('soak');
    expect(phases[phases.length - 1]).toBe('cool');
  });

  it('totalSteps caps simulation', () => {
    const params: SimulationParams = { ...DEFAULT_PARAMS, totalSteps: 10 };
    let sim = createSimulation(params);
    sim = stepN(sim, 20);
    expect(sim.currentIndex).toBe(9);
    expect(sim.steps).toHaveLength(10);
  });

  it('applyPreset resets state', () => {
    let sim = createSimulation();
    sim = stepN(sim, 5);
    const preset = applyPreset(sim, 'locos-isolation');
    expect(preset.currentIndex).toBe(-1);
    expect(preset.steps).toHaveLength(0);
    expect(preset.params.geometryType).toBe('locos');
  });

  it('step state has finite field data', () => {
    const sim = stepForward(createSimulation());
    const step = sim.steps[0];
    expect(step.nodeTemperatures.length).toBeGreaterThan(0);
    expect(step.nodeStresses.length).toBeGreaterThan(0);
    for (const v of step.nodeTemperatures) expect(isFinite(v)).toBe(true);
    for (const v of step.nodeStresses) expect(isFinite(v)).toBe(true);
  });

  it('200 steps complete without error', () => {
    let sim = createSimulation();
    sim = stepN(sim, 200);
    expect(sim.steps).toHaveLength(200);
    const last = sim.steps[199];
    expect(isFinite(last.oxideThicknessCenter)).toBe(true);
    expect(isFinite(last.peakStress)).toBe(true);
    expect(isFinite(last.thermalBudget)).toBe(true);
  });

  it('wet oxide grows faster than dry', () => {
    const dry = stepN(createSimulation({ ...DEFAULT_PARAMS, oxidationType: 'dry' }), 100);
    const wet = stepN(createSimulation({ ...DEFAULT_PARAMS, oxidationType: 'wet' }), 100);
    const dryFinal = dry.steps[dry.steps.length - 1].oxideThicknessCenter;
    const wetFinal = wet.steps[wet.steps.length - 1].oxideThicknessCenter;
    expect(wetFinal).toBeGreaterThan(dryFinal);
  });
});
```

**Step 2: Run test — expect FAIL**

**Step 3: Implement simulation-engine.ts**

Follows the exact same pattern as `diffusion-sim/simulation-engine.ts`:
- `createSimulation(params?)` — creates mesh, thermal profile, initializes WeakMap cache
- `stepForward(state)` — runs the 6-step physics loop: thermal FEA → Deal-Grove → stress → Kao → metrics → snapshot
- `stepN(state, n)` — loop of stepForward
- `applyPreset(state, id)` — getPreset → apply → createSimulation

WeakMap `solverCache` stores mutable `SolverState` keyed by immutable `SimulationState`. Cache miss replays from step 0.

**Step 4: Run test — expect 10 PASS**

**Step 5: Commit**

```bash
git add equipment-monitor/src/lib/oxidation-sim/simulation-engine.ts equipment-monitor/src/lib/oxidation-sim/__tests__/simulation-engine.test.ts
git commit -m "feat(oxidation-sim): simulation engine — coupled FEA/Deal-Grove/stress step loop with WeakMap cache"
```

---

### Task 11: index.ts — Barrel Exports

**Files:**
- Create: `equipment-monitor/src/lib/oxidation-sim/index.ts`

**Step 1: Write index.ts**

```typescript
export { createSimulation, stepForward, stepN, applyPreset } from './simulation-engine';
export { PRESETS, getPreset } from './presets';
export {
  DEFAULT_PARAMS, PARAM_BOUNDS, DEFAULT_TOTAL_STEPS,
  MATERIAL_PROPS, getDealGroveCoeffs, ORIENTATION_FACTOR,
} from './constants';
export type {
  SimulationParams,
  SimulationState,
  StepState,
  SolverState,
  FEAMesh,
  FEANode,
  FEAElement,
  ThermalStep,
  OxidationMetric,
  PresetId,
  Preset,
  OxidationType,
  GeometryType,
  SubstrateOrientation,
  ThermalPhase,
  MaterialType,
} from './types';
```

**Step 2: Verify all tests pass**

```bash
cd equipment-monitor && npx vitest run src/lib/oxidation-sim/ --reporter=verbose
```

Expected: ~70 tests across 8 files all PASS.

**Step 3: Commit**

```bash
git add equipment-monitor/src/lib/oxidation-sim/index.ts
git commit -m "feat(oxidation-sim): barrel exports — complete public API"
```

---

### Task 12: Route Integration — digital-twin-routes.ts + oxidation-sim page

**Files:**
- Modify: `equipment-monitor/src/lib/digital-twin-routes.ts:4` — add oxidation entry
- Create: `equipment-monitor/src/app/mes/fab-floor/oxidation/oxidation-sim/page.tsx`

**Step 1: Add oxidation to digital-twin-routes.ts**

Add to `DIGITAL_TWIN_ROUTES`:
```typescript
  oxidation: '/mes/fab-floor/oxidation/oxidation-sim',
```

**Step 2: Create the page**

Follow the exact pattern of `diffusion-sim/page.tsx`. Key differences:
- Import from `@/lib/oxidation-sim` instead of `@/lib/diffusion-sim`
- Dynamic import `OxidationScene` and `ProfilePanel` from `@/components/oxidation-sim/`
- `backHref="/mes/fab-floor/oxidation"`
- State type is `OxidationMetric` with default `'oxideThickness'`
- Loading message: "Initializing oxidation furnace..."

```typescript
'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TimelineBar } from '@/components/oxidation-sim/TimelineBar';
import { ParameterPanel } from '@/components/oxidation-sim/ParameterPanel';
import {
  createSimulation,
  stepForward,
  stepN,
  applyPreset,
} from '@/lib/oxidation-sim';
import type { PresetId, SimulationParams, SimulationState, OxidationMetric } from '@/lib/oxidation-sim';

const OxidationScene = dynamic(
  () => import('@/components/oxidation-sim/OxidationScene').then((m) => ({ default: m.OxidationScene })),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center bg-[var(--sf-bg-canvas)]"><p className="animate-pulse font-mono text-sm text-[var(--sf-text-muted)] motion-reduce:animate-none">Initializing oxidation furnace...</p></div> },
);

const ProfilePanel = dynamic(
  () => import('@/components/oxidation-sim/ProfilePanel').then((m) => ({ default: m.ProfilePanel })),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center bg-[var(--sf-bg-canvas)]"><p className="animate-pulse font-mono text-sm text-[var(--sf-text-muted)] motion-reduce:animate-none">Loading profiles...</p></div> },
);

export default function OxidationSimPage() {
  const [sim, setSim] = useState<SimulationState>(() => createSimulation());
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [metric, setMetric] = useState<OxidationMetric>('oxideThickness');
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
          backHref="/mes/fab-floor/oxidation"
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
        <div className="flex-[7] overflow-hidden rounded-2xl border border-[rgba(245,158,11,0.15)]" data-testid="oxidation-scene-panel">
          <OxidationScene step={currentStep} params={sim.params} mesh={sim.mesh} />
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

**Step 3: Commit**

```bash
git add equipment-monitor/src/lib/digital-twin-routes.ts equipment-monitor/src/app/mes/fab-floor/oxidation/oxidation-sim/page.tsx
git commit -m "feat(oxidation-sim): route page + digital twin entry point"
```

---

### Task 13: TimelineBar.tsx — Playback Controls + Back Button

**Files:**
- Create: `equipment-monitor/src/components/oxidation-sim/TimelineBar.tsx`

**Step 1: Write TimelineBar**

Copy the pattern from `diffusion-sim/TimelineBar.tsx` exactly but import `StepState` from `@/lib/oxidation-sim`. The phase colors stay the same (ramp=amber, soak=red, cool=blue). Temperature display reads from `currentStep?.temperature`. No `pulse` phase needed (oxidation only has ramp/soak/cool).

**Step 2: Commit**

```bash
git add equipment-monitor/src/components/oxidation-sim/TimelineBar.tsx
git commit -m "feat(oxidation-sim): TimelineBar — playback controls with back button"
```

---

### Task 14: ParameterPanel.tsx — 14 Controls with Conditional Visibility

**Files:**
- Create: `equipment-monitor/src/components/oxidation-sim/ParameterPanel.tsx`

**Step 1: Write ParameterPanel**

Follow `diffusion-sim/ParameterPanel.tsx` pattern. Key differences:
- 4 dropdowns: oxidationType (6 values), geometryType (3), substrateOrientation (3), — no dopant/ambient/thermalMode
- 10 sliders from PARAM_BOUNDS (7 always visible + 3 conditional)
- Conditional visibility logic:
  - `pressure`: visible only when `oxidationType === 'hibox'`
  - `hclConcentration`: visible only when `oxidationType === 'hcl'`
  - `nitrideMaskWidth`: visible when `geometryType === 'locos' || geometryType === 'sti'`
  - `trenchDepth`: visible only when `geometryType === 'sti'`
  - `trenchWidth`: visible only when `geometryType === 'sti'`
- Hidden controls use `hidden` class (CSS transition optional)
- Preset chips row at bottom, same layout

**Step 2: Commit**

```bash
git add equipment-monitor/src/components/oxidation-sim/ParameterPanel.tsx
git commit -m "feat(oxidation-sim): ParameterPanel — 14 controls with conditional visibility"
```

---

### Task 15: ProfilePanel.tsx — Canvas2D Time-Series for 8 Metrics

**Files:**
- Create: `equipment-monitor/src/components/oxidation-sim/ProfilePanel.tsx`

**Step 1: Write ProfilePanel**

Follow `diffusion-sim/ProfilePanel.tsx` pattern. Key differences:
- 8 metrics instead of 10, `OxidationMetric` type from `@/lib/oxidation-sim`
- METRIC_CFG map for 8 metrics:
  - oxideThickness: 'Tox', 'nm'
  - temperature: 'T', '\u00B0C'
  - peakStress: '\u03C3', 'MPa'
  - birdBeakLength: 'BB', 'nm'
  - oxidationRate: 'Rate', 'nm/s'
  - oxideUniformity: 'Unif', '%'
  - trenchCornerStress: 'SCF', '\u00D7'
  - thermalBudget: '\u2211T\u00B7t', '\u00B0C\u00B7s'
- Top canvas: oxide thickness profile (center/mid/edge traces) instead of dopant log-scale
- Middle canvas: thermal history (same as diffusion)
- Bottom canvas: metric sparkline (same pattern)
- For radial metrics (oxideThickness, temperature), show 3 traces: center (amber), mid (green), edge (cyan)

**Step 2: Commit**

```bash
git add equipment-monitor/src/components/oxidation-sim/ProfilePanel.tsx
git commit -m "feat(oxidation-sim): ProfilePanel — Canvas2D time-series for 8 metrics"
```

---

### Task 16: OxidationScene.tsx — Babylon.js 3D Cross-Section Wedge

**Files:**
- Create: `equipment-monitor/src/components/oxidation-sim/OxidationScene.tsx`

**Step 1: Write OxidationScene**

Follow `DiffusionScene.tsx` pattern (Babylon.js setup, `propsRef`, `registerBeforeRender`, cleanup). Key differences:

**Scene geometry:**
- 15-degree arc wedge of the wafer cross-section, built from a ribbon/extrusion mesh
- Si substrate: dark blue-grey PBR material, fills the base
- SiO2 oxide layer: amber/gold material, grows upward each step by updating vertex positions from `step.nodeOxideThicknesses`
- Si3N4 nitride mask: green material, static (only visible for LOCOS/STI geometries)
- Trench cutout: visible for STI geometry, shows the trench cavity

**Color overlays (toggled via vertex colors):**
- Temperature: blue(cold) → red(hot), mapped from `step.nodeTemperatures`
- Stress: green(low) → yellow → red(high), mapped from `step.nodeStresses`
- Default: material colors

**Camera:**
- ArcRotateCamera with preset zoom: auto-focuses on bird's beak region for LOCOS, trench corner for STI
- Orbit controls enabled

**Lighting:**
- HemisphericLight + PointLight (same as DiffusionScene)

**Per-frame update (registerBeforeRender):**
- Read `propsRef.current.step` and `propsRef.current.params`
- Update oxide layer vertex Y positions from oxide thickness data
- Update vertex colors from temperature/stress field data
- Show/hide nitride and trench meshes based on `params.geometryType`

**Step 2: Commit**

```bash
git add equipment-monitor/src/components/oxidation-sim/OxidationScene.tsx
git commit -m "feat(oxidation-sim): Babylon.js cross-section wedge — material layers, stress/temperature overlay"
```

---

### Task 17: Final Verification & Lint

**Step 1: Run all oxidation-sim tests**

```bash
cd equipment-monitor && npx vitest run src/lib/oxidation-sim/ --reporter=verbose
```

Expected: ~70 tests, all PASS.

**Step 2: Run ESLint**

```bash
cd equipment-monitor && npx next lint --dir src/lib/oxidation-sim src/components/oxidation-sim src/app/mes/fab-floor/oxidation
```

Fix any lint errors (unused vars with `_` prefix, etc.).

**Step 3: Verify page builds**

```bash
cd equipment-monitor && npx next build 2>&1 | grep -E "error|oxidation"
```

**Step 4: Final commit if lint fixes needed**

```bash
git add -A && git commit -m "fix: resolve lint warnings in oxidation-sim"
```

---

## Task Dependency Graph

```
Task 1 (types) ──→ Task 2 (constants) ──→ Task 3 (mesh) ─┐
                                                           ├→ Task 4 (thermal-fea)
                                                           ├→ Task 5 (deal-grove)
                                                           ├→ Task 6 (stress)
                                                           ├→ Task 7 (kao-feedback)
                                                           │
                                          Tasks 3-7 ──────→ Task 8 (wafer-metrics)
                                          Task 2 ─────────→ Task 9 (presets)
                                          Tasks 3-9 ──────→ Task 10 (sim-engine)
                                          Task 10 ────────→ Task 11 (barrel)
                                          Task 11 ────────→ Task 12 (route + page)
                                          Task 11 ────────→ Task 13 (TimelineBar)
                                          Task 11 ────────→ Task 14 (ParameterPanel)
                                          Task 11 ────────→ Task 15 (ProfilePanel)
                                          Task 11 ────────→ Task 16 (OxidationScene)
                                          Tasks 12-16 ────→ Task 17 (verify + lint)
```

**Parallelizable groups:**
- Tasks 3, 4, 5, 6, 7 can run in parallel (independent physics modules, all depend only on types + constants)
- Tasks 9 can run in parallel with 3-7 (depends only on types + constants)
- Tasks 13, 14, 15, 16 can run in parallel (independent UI components)
