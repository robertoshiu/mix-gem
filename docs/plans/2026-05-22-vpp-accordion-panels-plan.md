# VPP Accordion Panels Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend the VPP tab with 5 accordion sub-panels (Film Stack, Stress/Strain, Thermal Budget, Defect Density, Dopant Profile) giving a unified cross-process view of the full pipeline.

**Architecture:** 3 new pure-function engine functions added to `vpp-engine.ts`, backed by a new `vpp-constants.ts` for material/physics lookup tables. 6 new React components (1 accordion wrapper + 5 panels) using Canvas2D charts. Film Stack and Thermal Budget are read-only; Stress, Defects, and Dopant have per-panel interactive controls. All panel state is local `useState` — no Zustand changes.

**Tech Stack:** TypeScript, React 19, Canvas2D, Jest + Testing Library

**Existing code to reference:**
- `src/lib/analytics/vpp-engine.ts` — `runFederatedSim()` returns `PipelineResult` with `perStep` (yield, thickness, stress, defectDensity per step) and `filmStack`
- `src/lib/analytics/types.ts` — all shared types
- `src/lib/analytics/constants.ts` — `FILM_MATERIALS`, `DEFAULT_D0`, `PROCESS_STEPS`, `DEFAULT_RECIPE_KNOBS`, `mulberry32`, `hashCode`
- `src/lib/diffusion-sim/constants.ts` — `DOPANT_DB` with Arrhenius coefficients, `rangeCoeff`, `straggleRatio`, `BOLTZMANN_EV`
- `src/components/analytics/VppTab.tsx` — current VPP tab component to modify

**Test runner:** `npx jest` from `equipment-monitor/`. Tests use Jest globals (no vitest imports).

---

### Task 1: Types + VPP Constants

**Files:**
- Modify: `src/lib/analytics/types.ts`
- Create: `src/lib/analytics/vpp-constants.ts`

**Step 1: Add new types to `types.ts`**

Append after the existing `PipelineResult` interface (line ~205):

```typescript
// ── VPP Accordion Panels ──
export type SubstrateType = 'Si(100)' | 'Si(111)' | 'SiGe' | 'SOI';
export type StressMode = 'biaxial' | 'plane-stress' | 'plane-strain';
export type DefectSource = 'particles' | 'scratches' | 'voids' | 'inclusions';
export type DopantSpeciesId = 'B' | 'P' | 'As' | 'Sb' | 'In' | 'Ga';

export interface StressLayerResult {
  stepId: ProcessStepId;
  material: string;
  intrinsicStress: number;   // MPa
  thermalStress: number;     // MPa
  totalStress: number;       // MPa
  thickness: number;         // nm
}

export interface StressProfileResult {
  layers: StressLayerResult[];
  netStress: number;         // MPa (thickness-weighted average)
  waferBow: number;          // µm
  cumulativeStress: { depth: number; stress: number }[];
}

export interface DefectSourceBreakdown {
  source: DefectSource;
  density: number;           // /cm²
  killerDensity: number;     // /cm²
  color: string;
}

export interface DefectStepResult {
  stepId: ProcessStepId;
  totalD0: number;
  killerD0: number;
  sources: DefectSourceBreakdown[];
  yieldImpact: number;       // fractional loss
}

export interface DefectMapResult {
  perStep: DefectStepResult[];
  totalD0: number;
  totalKillerD0: number;
  totalYieldImpact: number;
  paretoPoints: { stepId: ProcessStepId; cumPct: number }[];
  waferDots: { x: number; y: number; source: DefectSource }[];
}

export interface DopantProfilePoint {
  depth: number;             // nm
  concentration: number;     // cm⁻³
  activeConcentration: number; // cm⁻³
}

export interface DopantSpeciesResult {
  species: DopantSpeciesId;
  profile: DopantProfilePoint[];
  peakConcentration: number;
  junctionDepth: number;     // nm
  dose: number;              // cm⁻²
  color: string;
}

export interface DopantProfileResult {
  species: DopantSpeciesResult[];
  backgroundDoping: number;  // cm⁻³
}

export interface ThermalBudgetStep {
  stepId: ProcessStepId;
  temperature: number;       // °C
  time: number;              // seconds
  dt: number;                // °C·s
  cumulativeDt: number;      // °C·s
}
```

**Step 2: Create `vpp-constants.ts`**

```typescript
// src/lib/analytics/vpp-constants.ts
import type { ProcessStepId, SubstrateType, DefectSource, DopantSpeciesId } from './types';

// ── Substrate Mechanical Properties ──
export interface SubstrateProperties {
  E: number;          // Young's modulus (GPa)
  nu: number;         // Poisson's ratio
  alpha: number;      // CTE (1/°C)
  yieldStrength: number; // MPa
}

export const SUBSTRATE_PROPERTIES: Record<SubstrateType, SubstrateProperties> = {
  'Si(100)': { E: 130, nu: 0.28, alpha: 2.6e-6, yieldStrength: 7000 },
  'Si(111)': { E: 187, nu: 0.26, alpha: 2.6e-6, yieldStrength: 7000 },
  'SiGe':    { E: 120, nu: 0.27, alpha: 3.5e-6, yieldStrength: 5000 },
  'SOI':     { E: 130, nu: 0.28, alpha: 2.6e-6, yieldStrength: 7000 },
};

// ── Film Stress Properties ──
export interface FilmStressProperties {
  intrinsicStress: number; // MPa (negative = compressive)
  cte: number;             // 1/°C
  E: number;               // GPa (0 = no film deposited)
  nu: number;              // Poisson's ratio
  yieldStrength: number;   // MPa
}

export const FILM_STRESS_PROPERTIES: Record<ProcessStepId, FilmStressProperties> = {
  oxidation:     { intrinsicStress: -300, cte: 0.5e-6,  E: 70,  nu: 0.17, yieldStrength: 8400 },
  lithography:   { intrinsicStress: 0,    cte: 60e-6,   E: 3,   nu: 0.35, yieldStrength: 50 },
  etching:       { intrinsicStress: 0,    cte: 0,        E: 0,   nu: 0,    yieldStrength: 0 },
  deposition:    { intrinsicStress: 200,  cte: 3.0e-6,  E: 250, nu: 0.23, yieldStrength: 14000 },
  implant:       { intrinsicStress: 0,    cte: 0,        E: 0,   nu: 0,    yieldStrength: 0 },
  diffusion:     { intrinsicStress: 0,    cte: 0,        E: 0,   nu: 0,    yieldStrength: 0 },
  cmp:           { intrinsicStress: 0,    cte: 0,        E: 0,   nu: 0,    yieldStrength: 0 },
  metallization: { intrinsicStress: 100,  cte: 17e-6,   E: 120, nu: 0.34, yieldStrength: 250 },
};

// ── Default Process Times (seconds) ──
export const DEFAULT_PROCESS_TIMES: Record<ProcessStepId, number> = {
  oxidation: 3600,
  lithography: 30,
  etching: 120,
  deposition: 300,
  implant: 60,
  diffusion: 1800,
  cmp: 180,
  metallization: 600,
};

// ── Process Temperatures (°C) — from DEFAULT_RECIPE_KNOBS defaults ──
export const DEFAULT_PROCESS_TEMPS: Record<ProcessStepId, number> = {
  oxidation: 1000,
  lithography: 25,
  etching: 25,
  deposition: 350,
  implant: 25,
  diffusion: 1000,
  cmp: 25,
  metallization: 200,
};

// ── Thermal Budget Ceiling ──
export const DEFAULT_THERMAL_BUDGET_CEILING = 5.0e6; // °C·s

// ── Wafer Geometry ──
export const WAFER_RADIUS_MM = 100;    // 200mm wafer
export const WAFER_THICKNESS_UM = 725; // µm

// ── Defect Source Distribution ──
export const DEFECT_SOURCE_FRACTIONS: Record<DefectSource, number> = {
  particles: 0.40,
  scratches: 0.20,
  voids: 0.25,
  inclusions: 0.15,
};

export const DEFECT_SOURCE_COLORS: Record<DefectSource, string> = {
  particles: '#22D3EE',
  scratches: '#F59E0B',
  voids: '#A855F7',
  inclusions: '#EF4444',
};

export const DEFECT_SOURCES: DefectSource[] = ['particles', 'scratches', 'voids', 'inclusions'];

export const DEFAULT_KILL_RATIOS: Record<DefectSource, number> = {
  particles: 0.8,
  scratches: 0.5,
  voids: 0.95,
  inclusions: 0.7,
};

// ── Dopant Implant Range Table (simplified: Rp in nm = coeff × energy_keV) ──
export interface DopantImplantData {
  rangeCoeff: number;     // nm per keV
  straggleRatio: number;  // σ/Rp
  defaultDose: number;    // cm⁻²
  defaultEnergy: number;  // keV
  color: string;
  // Arrhenius diffusivity: D = D0 × exp(-Ea / kT)
  D0: number;             // cm²/s
  Ea: number;             // eV
  // Solid solubility ceiling (active concentration limit)
  solidSolubilityCeiling: number; // cm⁻³ at 1000°C
}

export const DOPANT_IMPLANT_DATA: Record<DopantSpeciesId, DopantImplantData> = {
  B:  { rangeCoeff: 1.0,  straggleRatio: 0.40, defaultDose: 1e14, defaultEnergy: 30,  color: '#3B82F6', D0: 0.037, Ea: 3.46, solidSolubilityCeiling: 4e20 },
  P:  { rangeCoeff: 0.6,  straggleRatio: 0.35, defaultDose: 1e14, defaultEnergy: 80,  color: '#22C55E', D0: 3.85,  Ea: 3.66, solidSolubilityCeiling: 1.5e21 },
  As: { rangeCoeff: 0.3,  straggleRatio: 0.30, defaultDose: 5e14, defaultEnergy: 80,  color: '#EF4444', D0: 0.066, Ea: 3.44, solidSolubilityCeiling: 2e20 },
  Sb: { rangeCoeff: 0.2,  straggleRatio: 0.25, defaultDose: 1e14, defaultEnergy: 120, color: '#F97316', D0: 0.214, Ea: 3.65, solidSolubilityCeiling: 7e19 },
  In: { rangeCoeff: 0.15, straggleRatio: 0.25, defaultDose: 1e13, defaultEnergy: 100, color: '#8B5CF6', D0: 0.6,   Ea: 3.50, solidSolubilityCeiling: 1e18 },
  Ga: { rangeCoeff: 0.25, straggleRatio: 0.30, defaultDose: 1e13, defaultEnergy: 60,  color: '#6B7280', D0: 0.28,  Ea: 4.65, solidSolubilityCeiling: 5e19 },
};

export const ALL_DOPANT_SPECIES: DopantSpeciesId[] = ['B', 'P', 'As', 'Sb', 'In', 'Ga'];

// ── Boltzmann constant (eV/K) ──
export const BOLTZMANN_EV = 8.617333e-5;

// ── Background doping ──
export const DEFAULT_BACKGROUND_DOPING = 1e15; // cm⁻³
```

**Step 3: Update barrel export**

In `src/lib/analytics/index.ts`, add after the existing vpp-engine re-export:

```typescript
export * from './vpp-constants';
```

**Step 4: Commit**

```bash
git add src/lib/analytics/types.ts src/lib/analytics/vpp-constants.ts src/lib/analytics/index.ts
git commit -m "feat(vpp): add types and constants for accordion panels"
```

---

### Task 2: Stress Profile Engine + Tests

**Files:**
- Modify: `src/lib/analytics/vpp-engine.ts`
- Modify: `src/lib/analytics/__tests__/vpp-engine.test.ts`

**Step 1: Write failing tests**

Append to `src/lib/analytics/__tests__/vpp-engine.test.ts`:

```typescript
import {
  createDefaultPipeline,
  runFederatedSim,
  computeFilmStack,
  computePipelineYield,
  computeStressProfile,
} from '../vpp-engine';

// ... existing tests stay ...

describe('computeStressProfile', () => {
  const pipeline = createDefaultPipeline();
  const result = runFederatedSim(pipeline);

  test('returns layers only for steps with E > 0 and thickness > 0', () => {
    const stress = computeStressProfile(result.perStep, 'Si(100)', 25, 'biaxial');
    // etching, implant, diffusion, cmp have E=0 so should be filtered
    expect(stress.layers.length).toBeGreaterThan(0);
    expect(stress.layers.length).toBeLessThan(8);
    for (const layer of stress.layers) {
      expect(layer.thickness).toBeGreaterThan(0);
    }
  });

  test('intrinsic stress matches FILM_STRESS_PROPERTIES', () => {
    const stress = computeStressProfile(result.perStep, 'Si(100)', 25, 'biaxial');
    const oxLayer = stress.layers.find((l) => l.stepId === 'oxidation');
    expect(oxLayer).toBeDefined();
    expect(oxLayer!.intrinsicStress).toBe(-300); // compressive SiO2
  });

  test('thermal stress is zero at room temperature with matching CTE', () => {
    const stress = computeStressProfile(result.perStep, 'Si(100)', 25, 'biaxial');
    // At 25°C, deltaT=0 so thermal stress should be 0
    for (const layer of stress.layers) {
      expect(layer.thermalStress).toBeCloseTo(0, 1);
    }
  });

  test('thermal stress increases with temperature', () => {
    const s25 = computeStressProfile(result.perStep, 'Si(100)', 25, 'biaxial');
    const s400 = computeStressProfile(result.perStep, 'Si(100)', 400, 'biaxial');
    const ox25 = s25.layers.find((l) => l.stepId === 'oxidation')!;
    const ox400 = s400.layers.find((l) => l.stepId === 'oxidation')!;
    expect(Math.abs(ox400.thermalStress)).toBeGreaterThan(Math.abs(ox25.thermalStress));
  });

  test('stress mode affects effective modulus', () => {
    const biax = computeStressProfile(result.perStep, 'Si(100)', 200, 'biaxial');
    const plane = computeStressProfile(result.perStep, 'Si(100)', 200, 'plane-stress');
    const oxBiax = biax.layers.find((l) => l.stepId === 'oxidation')!;
    const oxPlane = plane.layers.find((l) => l.stepId === 'oxidation')!;
    // Biaxial E/(1-nu) > plane stress E, so biaxial thermal stress magnitude is larger
    expect(Math.abs(oxBiax.thermalStress)).toBeGreaterThan(Math.abs(oxPlane.thermalStress));
  });

  test('substrate type affects thermal stress via CTE', () => {
    const si = computeStressProfile(result.perStep, 'Si(100)', 300, 'biaxial');
    const sige = computeStressProfile(result.perStep, 'SiGe', 300, 'biaxial');
    const siOx = si.layers.find((l) => l.stepId === 'oxidation')!;
    const sigeOx = sige.layers.find((l) => l.stepId === 'oxidation')!;
    // SiGe has higher CTE (3.5e-6 vs 2.6e-6), different thermal stress
    expect(siOx.thermalStress).not.toBeCloseTo(sigeOx.thermalStress, 1);
  });

  test('wafer bow is non-negative', () => {
    const stress = computeStressProfile(result.perStep, 'Si(100)', 200, 'biaxial');
    expect(stress.waferBow).toBeGreaterThanOrEqual(0);
  });

  test('wafer bow increases with film stress', () => {
    const s25 = computeStressProfile(result.perStep, 'Si(100)', 25, 'biaxial');
    const s400 = computeStressProfile(result.perStep, 'Si(100)', 400, 'biaxial');
    expect(s400.waferBow).toBeGreaterThanOrEqual(s25.waferBow);
  });

  test('cumulative stress profile starts at zero and has entries for each layer', () => {
    const stress = computeStressProfile(result.perStep, 'Si(100)', 200, 'biaxial');
    expect(stress.cumulativeStress[0]).toEqual({ depth: 0, stress: 0 });
    expect(stress.cumulativeStress.length).toBe(stress.layers.length + 1);
  });

  test('net stress is thickness-weighted average', () => {
    const stress = computeStressProfile(result.perStep, 'Si(100)', 200, 'biaxial');
    const totalST = stress.layers.reduce((s, l) => s + l.totalStress * l.thickness, 0);
    const totalT = stress.layers.reduce((s, l) => s + l.thickness, 0);
    expect(stress.netStress).toBeCloseTo(totalST / totalT, 2);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npx jest src/lib/analytics/__tests__/vpp-engine.test.ts
```
Expected: FAIL — `computeStressProfile is not a function`

**Step 3: Implement `computeStressProfile` in `vpp-engine.ts`**

Add imports at top of `vpp-engine.ts`:

```typescript
import type {
  PipelineStep, PipelineStepResult, PipelineResult, FilmLayer, ProcessStepId,
  SubstrateType, StressMode, StressLayerResult, StressProfileResult,
} from './types';
import { PROCESS_STEPS, FILM_MATERIALS, DEFAULT_D0, mulberry32, hashCode } from './constants';
import {
  SUBSTRATE_PROPERTIES, FILM_STRESS_PROPERTIES, WAFER_RADIUS_MM, WAFER_THICKNESS_UM,
} from './vpp-constants';
```

Add function at end of file:

```typescript
export function computeStressProfile(
  perStep: PipelineStepResult[],
  substrate: SubstrateType,
  tempC: number,
  mode: StressMode,
): StressProfileResult {
  const sub = SUBSTRATE_PROPERTIES[substrate];
  const deltaT = tempC - 25;

  const layers: StressLayerResult[] = [];
  let totalStressThickness = 0;
  let totalThickness = 0;

  for (const step of perStep) {
    const fp = FILM_STRESS_PROPERTIES[step.stepId];
    if (fp.E === 0 || step.thickness <= 0) continue;

    let Eeff: number;
    if (mode === 'biaxial') Eeff = fp.E / (1 - fp.nu);
    else if (mode === 'plane-strain') Eeff = fp.E / (1 - fp.nu * fp.nu);
    else Eeff = fp.E;

    // thermal stress in MPa: Eeff(GPa) × Δα(1/°C) × ΔT(°C) × 1000
    const thermalStress = Eeff * (sub.alpha - fp.cte) * deltaT * 1000;
    const totalStress = fp.intrinsicStress + thermalStress;

    layers.push({
      stepId: step.stepId,
      material: FILM_MATERIALS[step.stepId].material,
      intrinsicStress: fp.intrinsicStress,
      thermalStress,
      totalStress,
      thickness: step.thickness,
    });

    totalStressThickness += totalStress * step.thickness;
    totalThickness += step.thickness;
  }

  const netStress = totalThickness > 0 ? totalStressThickness / totalThickness : 0;

  // Stoney's equation: bow = 3 × σ × t_f × L² / (M_s × t_s²)
  // Units: σ(MPa), t_f(µm), L(µm), M_s(MPa), t_s(µm) → bow(µm)
  const L = WAFER_RADIUS_MM * 1000; // mm → µm
  const tSub = WAFER_THICKNESS_UM;
  const tFilm = totalThickness / 1000; // nm → µm
  const Ms = (sub.E / (1 - sub.nu)) * 1000; // GPa → MPa
  const waferBow = totalThickness > 0
    ? Math.abs(3 * netStress * tFilm * L * L / (Ms * tSub * tSub))
    : 0;

  const cumulativeStress: { depth: number; stress: number }[] = [{ depth: 0, stress: 0 }];
  let cumDepth = 0;
  let cumStress = 0;
  for (const layer of layers) {
    cumDepth += layer.thickness;
    cumStress += layer.totalStress;
    cumulativeStress.push({ depth: cumDepth, stress: cumStress });
  }

  return { layers, netStress, waferBow, cumulativeStress };
}
```

**Step 4: Run tests to verify they pass**

```bash
npx jest src/lib/analytics/__tests__/vpp-engine.test.ts
```
Expected: all PASS

**Step 5: Commit**

```bash
git add src/lib/analytics/vpp-engine.ts src/lib/analytics/__tests__/vpp-engine.test.ts
git commit -m "feat(vpp): computeStressProfile — Stoney bow + CTE mismatch model"
```

---

### Task 3: Defect Map Engine + Tests

**Files:**
- Modify: `src/lib/analytics/vpp-engine.ts`
- Modify: `src/lib/analytics/__tests__/vpp-engine.test.ts`

**Step 1: Write failing tests**

Append to `vpp-engine.test.ts`:

```typescript
import {
  createDefaultPipeline,
  runFederatedSim,
  computeFilmStack,
  computePipelineYield,
  computeStressProfile,
  computeDefectMap,
} from '../vpp-engine';

// ... existing tests ...

describe('computeDefectMap', () => {
  const pipeline = createDefaultPipeline();
  const result = runFederatedSim(pipeline);
  const defaultKill = { particles: 0.8, scratches: 0.5, voids: 0.95, inclusions: 0.7 };
  const allSources = ['particles', 'scratches', 'voids', 'inclusions'] as const;

  test('returns 8 per-step results for default pipeline', () => {
    const defects = computeDefectMap(result.perStep, defaultKill, [...allSources]);
    expect(defects.perStep).toHaveLength(8);
  });

  test('each step has 4 source breakdowns', () => {
    const defects = computeDefectMap(result.perStep, defaultKill, [...allSources]);
    for (const step of defects.perStep) {
      expect(step.sources).toHaveLength(4);
    }
  });

  test('killer density <= total density for each source', () => {
    const defects = computeDefectMap(result.perStep, defaultKill, [...allSources]);
    for (const step of defects.perStep) {
      for (const src of step.sources) {
        expect(src.killerDensity).toBeLessThanOrEqual(src.density + 1e-10);
      }
    }
  });

  test('disabling a source zeroes its density', () => {
    const defects = computeDefectMap(result.perStep, defaultKill, ['particles', 'voids']);
    for (const step of defects.perStep) {
      const scratches = step.sources.find((s) => s.source === 'scratches')!;
      expect(scratches.density).toBe(0);
    }
  });

  test('higher kill ratio increases killer density', () => {
    const low = computeDefectMap(result.perStep, { particles: 0.1, scratches: 0.1, voids: 0.1, inclusions: 0.1 }, [...allSources]);
    const high = computeDefectMap(result.perStep, { particles: 1.0, scratches: 1.0, voids: 1.0, inclusions: 1.0 }, [...allSources]);
    expect(high.totalKillerD0).toBeGreaterThan(low.totalKillerD0);
  });

  test('pareto points are sorted by cumulative percentage ascending', () => {
    const defects = computeDefectMap(result.perStep, defaultKill, [...allSources]);
    for (let i = 1; i < defects.paretoPoints.length; i++) {
      expect(defects.paretoPoints[i].cumPct).toBeGreaterThanOrEqual(defects.paretoPoints[i - 1].cumPct);
    }
  });

  test('last pareto point cumPct is approximately 100', () => {
    const defects = computeDefectMap(result.perStep, defaultKill, [...allSources]);
    const last = defects.paretoPoints[defects.paretoPoints.length - 1];
    expect(last.cumPct).toBeCloseTo(100, 0);
  });

  test('wafer dots are within unit circle', () => {
    const defects = computeDefectMap(result.perStep, defaultKill, [...allSources]);
    for (const dot of defects.waferDots) {
      const r = Math.sqrt(dot.x * dot.x + dot.y * dot.y);
      expect(r).toBeLessThanOrEqual(1.01); // small tolerance
    }
  });

  test('yield impact is between 0 and 1 for each step', () => {
    const defects = computeDefectMap(result.perStep, defaultKill, [...allSources]);
    for (const step of defects.perStep) {
      expect(step.yieldImpact).toBeGreaterThanOrEqual(0);
      expect(step.yieldImpact).toBeLessThanOrEqual(1);
    }
  });

  test('totalD0 equals sum of per-step totalD0', () => {
    const defects = computeDefectMap(result.perStep, defaultKill, [...allSources]);
    const sum = defects.perStep.reduce((s, step) => s + step.totalD0, 0);
    expect(defects.totalD0).toBeCloseTo(sum, 6);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npx jest src/lib/analytics/__tests__/vpp-engine.test.ts
```
Expected: FAIL — `computeDefectMap is not a function`

**Step 3: Implement `computeDefectMap`**

Add to imports at top of `vpp-engine.ts`:

```typescript
import type {
  // ... existing imports ...,
  DefectSource, DefectSourceBreakdown, DefectStepResult, DefectMapResult,
} from './types';
import {
  // ... existing imports ...,
  DEFECT_SOURCE_FRACTIONS, DEFECT_SOURCE_COLORS, DEFECT_SOURCES,
} from './vpp-constants';
```

Add function:

```typescript
export function computeDefectMap(
  perStep: PipelineStepResult[],
  killRatios: Record<DefectSource, number>,
  enabledSources: DefectSource[],
): DefectMapResult {
  const enabledSet = new Set(enabledSources);
  const stepResults: DefectStepResult[] = [];
  let totalD0 = 0;
  let totalKillerD0 = 0;

  for (const step of perStep) {
    const sources: DefectSourceBreakdown[] = DEFECT_SOURCES.map((src) => {
      const density = enabledSet.has(src) ? step.defectDensity * DEFECT_SOURCE_FRACTIONS[src] : 0;
      const killerDensity = density * (killRatios[src] ?? 0);
      return { source: src, density, killerDensity, color: DEFECT_SOURCE_COLORS[src] };
    });

    const stepTotal = sources.reduce((s, src) => s + src.density, 0);
    const stepKiller = sources.reduce((s, src) => s + src.killerDensity, 0);
    // Yield impact using Negative Binomial (alpha=2, area=100)
    const yieldImpact = 1 - Math.pow(1 + (stepKiller * 100) / 2, -2);

    stepResults.push({
      stepId: step.stepId,
      totalD0: stepTotal,
      killerD0: stepKiller,
      sources,
      yieldImpact,
    });

    totalD0 += stepTotal;
    totalKillerD0 += stepKiller;
  }

  // Pareto: sort steps by killer D0 descending, compute cumulative %
  const sorted = [...stepResults].sort((a, b) => b.killerD0 - a.killerD0);
  let cumSum = 0;
  const paretoPoints = sorted.map((step) => {
    cumSum += step.killerD0;
    return { stepId: step.stepId, cumPct: totalKillerD0 > 0 ? (cumSum / totalKillerD0) * 100 : 0 };
  });

  // Wafer dots: generate deterministic random positions within unit circle
  const rng = mulberry32(hashCode('defect-wafer-map'));
  const dotCount = Math.min(200, Math.round(totalD0 * 100));
  const waferDots: { x: number; y: number; source: DefectSource }[] = [];
  const enabledSourcesList = DEFECT_SOURCES.filter((s) => enabledSet.has(s));

  for (let i = 0; i < dotCount; i++) {
    // Rejection sampling for uniform distribution in circle
    let x: number, y: number;
    do {
      x = rng() * 2 - 1;
      y = rng() * 2 - 1;
    } while (x * x + y * y > 1);

    // Assign source based on fractions
    const r = rng();
    let cumFrac = 0;
    let source: DefectSource = enabledSourcesList[0] ?? 'particles';
    for (const src of enabledSourcesList) {
      cumFrac += DEFECT_SOURCE_FRACTIONS[src];
      if (r < cumFrac) { source = src; break; }
    }
    waferDots.push({ x, y, source });
  }

  const totalYieldImpact = 1 - Math.pow(1 + (totalKillerD0 * 100) / 2, -2);

  return { perStep: stepResults, totalD0, totalKillerD0, totalYieldImpact, paretoPoints, waferDots };
}
```

**Step 4: Run tests**

```bash
npx jest src/lib/analytics/__tests__/vpp-engine.test.ts
```
Expected: all PASS

**Step 5: Commit**

```bash
git add src/lib/analytics/vpp-engine.ts src/lib/analytics/__tests__/vpp-engine.test.ts
git commit -m "feat(vpp): computeDefectMap — source breakdown, Pareto, wafer map"
```

---

### Task 4: Dopant Profile Engine + Tests

**Files:**
- Modify: `src/lib/analytics/vpp-engine.ts`
- Modify: `src/lib/analytics/__tests__/vpp-engine.test.ts`

**Step 1: Write failing tests**

Append to `vpp-engine.test.ts`:

```typescript
import {
  // ... add computeDopantProfile ...
  computeDopantProfile,
} from '../vpp-engine';

describe('computeDopantProfile', () => {
  test('returns profiles for each requested species', () => {
    const result = computeDopantProfile(['B', 'P'], 0, 500, 1000, 30, false);
    expect(result.species).toHaveLength(2);
    expect(result.species[0].species).toBe('B');
    expect(result.species[1].species).toBe('P');
  });

  test('profile has correct depth range', () => {
    const result = computeDopantProfile(['B'], 0, 500, 1000, 30, false);
    const profile = result.species[0].profile;
    expect(profile[0].depth).toBe(0);
    expect(profile[profile.length - 1].depth).toBe(500);
  });

  test('peak concentration is positive', () => {
    const result = computeDopantProfile(['As'], 0, 500, 1000, 30, false);
    expect(result.species[0].peakConcentration).toBeGreaterThan(0);
  });

  test('Gaussian profile peaks near projected range', () => {
    const result = computeDopantProfile(['B'], 0, 200, 25, 0, false);
    // B at 30 keV: Rp ≈ 30nm (rangeCoeff=1.0, defaultEnergy=30)
    const profile = result.species[0].profile;
    const peakIdx = profile.reduce((best, pt, i) => pt.concentration > profile[best].concentration ? i : best, 0);
    const peakDepth = profile[peakIdx].depth;
    expect(peakDepth).toBeGreaterThan(10);
    expect(peakDepth).toBeLessThan(80);
  });

  test('concentration decreases away from peak', () => {
    const result = computeDopantProfile(['B'], 0, 300, 25, 0, false);
    const profile = result.species[0].profile;
    const peakIdx = profile.reduce((best, pt, i) => pt.concentration > profile[best].concentration ? i : best, 0);
    // Check concentration is lower at surface and at deep end
    if (peakIdx > 0) {
      expect(profile[0].concentration).toBeLessThan(profile[peakIdx].concentration);
    }
    expect(profile[profile.length - 1].concentration).toBeLessThan(profile[peakIdx].concentration);
  });

  test('higher anneal temperature broadens profile', () => {
    const low = computeDopantProfile(['B'], 0, 500, 800, 30, false);
    const high = computeDopantProfile(['B'], 0, 500, 1100, 30, false);
    // Higher temp → more diffusion → broader → lower peak
    expect(high.species[0].peakConcentration).toBeLessThan(low.species[0].peakConcentration);
  });

  test('longer anneal time broadens profile', () => {
    const short = computeDopantProfile(['B'], 0, 500, 1000, 1, false);
    const long = computeDopantProfile(['B'], 0, 500, 1000, 120, false);
    expect(long.species[0].peakConcentration).toBeLessThan(short.species[0].peakConcentration);
  });

  test('junction depth is where concentration crosses background doping', () => {
    const result = computeDopantProfile(['B'], 0, 500, 1000, 30, false);
    const xj = result.species[0].junctionDepth;
    // Junction depth should be somewhere between 0 and max depth
    expect(xj).toBeGreaterThan(0);
    expect(xj).toBeLessThan(500);
  });

  test('active concentration is <= total concentration', () => {
    const result = computeDopantProfile(['As'], 0, 300, 1000, 30, true);
    for (const pt of result.species[0].profile) {
      expect(pt.activeConcentration).toBeLessThanOrEqual(pt.concentration + 1e-10);
    }
  });

  test('active mode limits concentration at solid solubility ceiling', () => {
    // High-dose As implant should show activation saturation
    const result = computeDopantProfile(['As'], 0, 300, 1000, 30, true);
    const peak = result.species[0].profile.reduce(
      (best, pt) => pt.activeConcentration > best.activeConcentration ? pt : best,
      result.species[0].profile[0],
    );
    // As solid solubility ceiling is 2e20
    expect(peak.activeConcentration).toBeLessThanOrEqual(2e20 + 1e15);
  });

  test('dose is area under profile curve (trapezoidal)', () => {
    const result = computeDopantProfile(['B'], 0, 500, 1000, 30, false);
    const profile = result.species[0].profile;
    let integral = 0;
    for (let i = 1; i < profile.length; i++) {
      const dx = (profile[i].depth - profile[i - 1].depth) * 1e-7; // nm → cm
      integral += 0.5 * (profile[i].concentration + profile[i - 1].concentration) * dx;
    }
    // Should be within 50% of default dose (1e14) — analytical vs numerical
    expect(integral).toBeGreaterThan(result.species[0].dose * 0.5);
    expect(integral).toBeLessThan(result.species[0].dose * 1.5);
  });

  test('backgroundDoping defaults to 1e15', () => {
    const result = computeDopantProfile(['B'], 0, 500, 1000, 30, false);
    expect(result.backgroundDoping).toBe(1e15);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npx jest src/lib/analytics/__tests__/vpp-engine.test.ts
```
Expected: FAIL — `computeDopantProfile is not a function`

**Step 3: Implement `computeDopantProfile`**

Add to imports:

```typescript
import type {
  // ... existing ...,
  DopantSpeciesId, DopantProfilePoint, DopantSpeciesResult, DopantProfileResult,
} from './types';
import {
  // ... existing ...,
  DOPANT_IMPLANT_DATA, BOLTZMANN_EV as VPP_BOLTZMANN_EV, DEFAULT_BACKGROUND_DOPING,
} from './vpp-constants';
```

Add function:

```typescript
export function computeDopantProfile(
  speciesList: DopantSpeciesId[],
  depthMin: number,
  depthMax: number,
  annealTempC: number,
  annealTimeMin: number,
  showActive: boolean,
): DopantProfileResult {
  const nPoints = 200;
  const depthStep = (depthMax - depthMin) / (nPoints - 1);
  const annealTimeSec = annealTimeMin * 60;
  const T_K = annealTempC + 273.15;

  const speciesResults: DopantSpeciesResult[] = speciesList.map((id) => {
    const data = DOPANT_IMPLANT_DATA[id];
    const Rp = data.rangeCoeff * data.defaultEnergy; // nm
    const sigma0 = data.straggleRatio * Rp; // nm

    // Diffusion coefficient: D = D0 × exp(-Ea / kT)
    const D_cm2s = data.D0 * Math.exp(-data.Ea / (VPP_BOLTZMANN_EV * T_K));
    const D_nm2s = D_cm2s * 1e14; // cm² → nm²
    const Dt = D_nm2s * annealTimeSec;
    const sigmaEff = Math.sqrt(sigma0 * sigma0 + 2 * Dt);

    // Gaussian: C(x) = dose / (√(2π) × σ) × exp(-(x-Rp)²/(2σ²))
    const dose = data.defaultDose; // cm⁻²
    const doseNm = dose * 1e-14; // cm⁻² → nm⁻² (for nm depth axis)
    const prefactor = doseNm / (Math.sqrt(2 * Math.PI) * sigmaEff);

    let peakConc = 0;
    let junctionDepth = 0;
    let foundJunction = false;

    const profile: DopantProfilePoint[] = [];
    for (let i = 0; i < nPoints; i++) {
      const depth = depthMin + i * depthStep;
      const dx = depth - Rp;
      // Concentration in cm⁻³ (multiply nm⁻³ by 1e21)
      const concentration = prefactor * Math.exp(-(dx * dx) / (2 * sigmaEff * sigmaEff)) * 1e21;
      const activeConcentration = showActive
        ? Math.min(concentration, data.solidSolubilityCeiling)
        : concentration;

      profile.push({ depth, concentration, activeConcentration });
      if (concentration > peakConc) peakConc = concentration;

      // Junction: where concentration crosses background doping (going down)
      if (!foundJunction && i > 0 && depth > Rp && concentration < DEFAULT_BACKGROUND_DOPING) {
        // Linear interpolation
        const prev = profile[i - 1];
        const frac = (DEFAULT_BACKGROUND_DOPING - concentration) / (prev.concentration - concentration);
        junctionDepth = depth - frac * depthStep;
        foundJunction = true;
      }
    }

    if (!foundJunction) junctionDepth = depthMax;

    return {
      species: id,
      profile,
      peakConcentration: peakConc,
      junctionDepth,
      dose,
      color: data.color,
    };
  });

  return { species: speciesResults, backgroundDoping: DEFAULT_BACKGROUND_DOPING };
}
```

**Step 4: Run tests**

```bash
npx jest src/lib/analytics/__tests__/vpp-engine.test.ts
```
Expected: all PASS

**Step 5: Commit**

```bash
git add src/lib/analytics/vpp-engine.ts src/lib/analytics/__tests__/vpp-engine.test.ts
git commit -m "feat(vpp): computeDopantProfile — Gaussian implant + Arrhenius diffusion"
```

---

### Task 5: AccordionPanel Component + Tests

**Files:**
- Create: `src/components/analytics/vpp-panels/AccordionPanel.tsx`
- Create: `src/components/analytics/vpp-panels/__tests__/AccordionPanel.test.tsx`

**Step 1: Write failing test**

```typescript
// src/components/analytics/vpp-panels/__tests__/AccordionPanel.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { AccordionPanel } from '../AccordionPanel';

describe('AccordionPanel', () => {
  test('renders title and summary', () => {
    render(
      <AccordionPanel title="Film Stack" summary="8 layers" defaultOpen={false}>
        <div>content</div>
      </AccordionPanel>,
    );
    expect(screen.getByText('Film Stack')).toBeInTheDocument();
    expect(screen.getByText('8 layers')).toBeInTheDocument();
  });

  test('toggles content visibility on header click', () => {
    render(
      <AccordionPanel title="Film Stack" summary="8 layers" defaultOpen={false}>
        <div>inner content</div>
      </AccordionPanel>,
    );
    expect(screen.queryByText('inner content')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('inner content')).toBeInTheDocument();
  });

  test('renders content when defaultOpen is true', () => {
    render(
      <AccordionPanel title="Film Stack" summary="8 layers" defaultOpen={true}>
        <div>visible content</div>
      </AccordionPanel>,
    );
    expect(screen.getByText('visible content')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify fail**

```bash
npx jest src/components/analytics/vpp-panels/__tests__/AccordionPanel.test.tsx
```
Expected: FAIL — cannot find module

**Step 3: Implement AccordionPanel**

```typescript
// src/components/analytics/vpp-panels/AccordionPanel.tsx
'use client';

import { useState } from 'react';

interface Props {
  title: string;
  summary: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}

export function AccordionPanel({ title, summary, defaultOpen, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-[var(--smartfactory-border-default)] rounded bg-[var(--smartfactory-surface-card)]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--smartfactory-text-muted)]">{open ? '▾' : '▸'}</span>
          <span className="text-sm font-semibold text-[var(--smartfactory-text-primary)]">{title}</span>
          <span className="text-xs text-[var(--smartfactory-text-secondary)]">{summary}</span>
        </div>
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}
```

**Step 4: Run tests**

```bash
npx jest src/components/analytics/vpp-panels/__tests__/AccordionPanel.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/analytics/vpp-panels/
git commit -m "feat(vpp): AccordionPanel — expand/collapse wrapper component"
```

---

### Task 6: FilmStackPanel + ThermalBudgetPanel + Tests

**Files:**
- Create: `src/components/analytics/vpp-panels/FilmStackPanel.tsx`
- Create: `src/components/analytics/vpp-panels/ThermalBudgetPanel.tsx`
- Create: `src/components/analytics/vpp-panels/__tests__/FilmStackPanel.test.tsx`
- Create: `src/components/analytics/vpp-panels/__tests__/ThermalBudgetPanel.test.tsx`

**Step 1: Write failing tests**

```typescript
// src/components/analytics/vpp-panels/__tests__/FilmStackPanel.test.tsx
import { render, screen } from '@testing-library/react';
import { FilmStackPanel } from '../FilmStackPanel';
import type { FilmLayer } from '@/lib/analytics/types';

describe('FilmStackPanel', () => {
  const layers: FilmLayer[] = [
    { material: 'SiO₂', thickness: 100, color: '#60A5FA' },
    { material: 'Cu', thickness: 150, color: '#FB923C' },
  ];

  test('renders canvas and summary', () => {
    render(<FilmStackPanel filmStack={layers} />);
    expect(screen.getByTestId('film-stack-canvas')).toBeInTheDocument();
    expect(screen.getByText(/250/)).toBeInTheDocument(); // total thickness
  });

  test('renders layer labels', () => {
    render(<FilmStackPanel filmStack={layers} />);
    expect(screen.getByText(/SiO₂/)).toBeInTheDocument();
    expect(screen.getByText(/Cu/)).toBeInTheDocument();
  });
});
```

```typescript
// src/components/analytics/vpp-panels/__tests__/ThermalBudgetPanel.test.tsx
import { render, screen } from '@testing-library/react';
import { ThermalBudgetPanel } from '../ThermalBudgetPanel';
import type { ThermalBudgetStep } from '@/lib/analytics/types';

describe('ThermalBudgetPanel', () => {
  const steps: ThermalBudgetStep[] = [
    { stepId: 'oxidation', temperature: 1000, time: 3600, dt: 3.6e6, cumulativeDt: 3.6e6 },
    { stepId: 'lithography', temperature: 25, time: 30, dt: 750, cumulativeDt: 3600750 },
  ];

  test('renders canvas', () => {
    render(<ThermalBudgetPanel steps={steps} ceiling={5e6} />);
    expect(screen.getByTestId('thermal-budget-canvas')).toBeInTheDocument();
  });

  test('shows warning when budget exceeds ceiling', () => {
    const over: ThermalBudgetStep[] = [
      { stepId: 'oxidation', temperature: 1000, time: 6000, dt: 6e6, cumulativeDt: 6e6 },
    ];
    render(<ThermalBudgetPanel steps={over} ceiling={5e6} />);
    expect(screen.getByText(/exceeded/i)).toBeInTheDocument();
  });
});
```

**Step 2: Implement FilmStackPanel**

```typescript
// src/components/analytics/vpp-panels/FilmStackPanel.tsx
'use client';

import { useRef, useEffect } from 'react';
import type { FilmLayer } from '@/lib/analytics/types';

interface Props {
  filmStack: FilmLayer[];
}

export function FilmStackPanel({ filmStack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const totalThickness = filmStack.reduce((s, l) => s + l.thickness, 0);

  useEffect(() => {
    drawFilmStack(canvasRef.current, filmStack);
  });

  return (
    <div className="space-y-2">
      <canvas ref={canvasRef} data-testid="film-stack-canvas" width={500} height={200}
        className="w-full bg-[var(--smartfactory-bg-base)] rounded" />
      <div className="flex flex-wrap gap-2 text-xs text-[var(--smartfactory-text-secondary)]">
        {filmStack.map((l, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: l.color }} />
            {l.material} — {l.thickness.toFixed(0)} nm
          </span>
        ))}
      </div>
      <div className="text-xs text-[var(--smartfactory-text-muted)]">
        Total: {totalThickness.toFixed(0)} nm | {filmStack.length} layers | Thickest: {filmStack.length > 0 ? filmStack.reduce((a, b) => a.thickness > b.thickness ? a : b).material : '—'}
      </div>
    </div>
  );
}

function drawFilmStack(canvas: HTMLCanvasElement | null, stack: FilmLayer[]) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  if (stack.length === 0) return;

  const pad = 20;
  const totalThickness = stack.reduce((s, l) => s + l.thickness, 0);
  const drawH = H - 2 * pad;
  const barW = W * 0.4;
  const barX = (W - barW) / 2;

  // Draw substrate
  ctx.fillStyle = '#475569';
  ctx.fillRect(barX, H - pad - 20, barW, 20);
  ctx.fillStyle = '#94A3B8';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Si Substrate', barX + barW / 2, H - pad - 6);

  // Draw layers bottom-up
  let y = H - pad - 20;
  for (let i = stack.length - 1; i >= 0; i--) {
    const layerH = Math.max(15, (stack[i].thickness / totalThickness) * (drawH - 20));
    y -= layerH;
    ctx.fillStyle = stack[i].color + '88';
    ctx.strokeStyle = stack[i].color;
    ctx.lineWidth = 1;
    ctx.fillRect(barX, y, barW, layerH);
    ctx.strokeRect(barX, y, barW, layerH);
    // Label on right
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${stack[i].material} ${stack[i].thickness.toFixed(0)}nm`, barX + barW + 8, y + layerH / 2 + 4);
  }
}
```

**Step 3: Implement ThermalBudgetPanel**

```typescript
// src/components/analytics/vpp-panels/ThermalBudgetPanel.tsx
'use client';

import { useRef, useEffect } from 'react';
import type { ThermalBudgetStep } from '@/lib/analytics/types';
import { STEP_SHORT_NAMES } from '@/lib/analytics/constants';

interface Props {
  steps: ThermalBudgetStep[];
  ceiling: number;
}

export function ThermalBudgetPanel({ steps, ceiling }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const totalDt = steps.length > 0 ? steps[steps.length - 1].cumulativeDt : 0;
  const exceeded = totalDt > ceiling;

  useEffect(() => {
    drawThermalBudget(canvasRef.current, steps, ceiling);
  });

  return (
    <div className="space-y-2">
      <canvas ref={canvasRef} data-testid="thermal-budget-canvas" width={500} height={200}
        className="w-full bg-[var(--smartfactory-bg-base)] rounded" />
      {exceeded && (
        <div className="text-xs text-red-400 font-semibold">
          Budget exceeded: {totalDt.toExponential(2)} > {ceiling.toExponential(2)} °C·s
        </div>
      )}
    </div>
  );
}

const STEP_COLORS = ['#FF6B35', '#22D3EE', '#A855F7', '#3B82F6', '#F43F5E', '#F59E0B', '#10B981', '#E2E8F0'];

function drawThermalBudget(canvas: HTMLCanvasElement | null, steps: ThermalBudgetStep[], ceiling: number) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  if (steps.length === 0) return;

  const pad = 40;
  const maxDt = Math.max(ceiling, steps[steps.length - 1].cumulativeDt) * 1.1;
  const barW = (W - 2 * pad) / steps.length * 0.7;
  const gap = (W - 2 * pad) / steps.length * 0.3;

  // Ceiling line
  const ceilingY = H - pad - (ceiling / maxDt) * (H - 2 * pad);
  ctx.strokeStyle = '#EF4444';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(pad, ceilingY);
  ctx.lineTo(W - pad, ceilingY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#EF4444';
  ctx.font = '10px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`Ceiling ${ceiling.toExponential(1)}`, W - pad, ceilingY - 4);

  // Waterfall bars
  steps.forEach((step, i) => {
    const x = pad + i * (barW + gap);
    const barH = (step.cumulativeDt / maxDt) * (H - 2 * pad);
    const isHot = step.temperature > 1000;
    ctx.fillStyle = (isHot ? '#F59E0B' : STEP_COLORS[i % STEP_COLORS.length]) + '88';
    ctx.fillRect(x, H - pad - barH, barW, barH);
    if (isHot) {
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, H - pad - barH, barW, barH);
    }
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(STEP_SHORT_NAMES[step.stepId] ?? step.stepId, x + barW / 2, H - pad + 12);
    ctx.fillText(step.cumulativeDt.toExponential(1), x + barW / 2, H - pad - barH - 4);
  });

  // Y-axis label
  ctx.fillStyle = '#94A3B8';
  ctx.font = '10px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('Cumulative Dt (°C·s)', pad, pad - 8);
}
```

**Step 4: Run tests**

```bash
npx jest src/components/analytics/vpp-panels/__tests__/FilmStackPanel.test.tsx src/components/analytics/vpp-panels/__tests__/ThermalBudgetPanel.test.tsx
```
Expected: all PASS

**Step 5: Commit**

```bash
git add src/components/analytics/vpp-panels/FilmStackPanel.tsx src/components/analytics/vpp-panels/ThermalBudgetPanel.tsx src/components/analytics/vpp-panels/__tests__/
git commit -m "feat(vpp): FilmStackPanel + ThermalBudgetPanel — read-only accordion panels"
```

---

### Task 7: StressPanel + Tests

**Files:**
- Create: `src/components/analytics/vpp-panels/StressPanel.tsx`
- Create: `src/components/analytics/vpp-panels/__tests__/StressPanel.test.tsx`

**Step 1: Write failing test**

```typescript
// src/components/analytics/vpp-panels/__tests__/StressPanel.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { StressPanel } from '../StressPanel';
import type { PipelineStepResult } from '@/lib/analytics/types';
import { createDefaultPipeline, runFederatedSim } from '@/lib/analytics/vpp-engine';

describe('StressPanel', () => {
  const result = runFederatedSim(createDefaultPipeline());

  test('renders canvases and controls', () => {
    render(<StressPanel perStep={result.perStep} />);
    expect(screen.getByTestId('stress-bar-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('stress-cumulative-canvas')).toBeInTheDocument();
    expect(screen.getByText('Biaxial')).toBeInTheDocument();
  });

  test('stress mode buttons are interactive', () => {
    render(<StressPanel perStep={result.perStep} />);
    const planeBtn = screen.getByText('Plane Stress');
    fireEvent.click(planeBtn);
    // Should not crash, button should still be there
    expect(screen.getByText('Plane Stress')).toBeInTheDocument();
  });

  test('shows wafer bow readout', () => {
    render(<StressPanel perStep={result.perStep} />);
    expect(screen.getByText(/Bow:/)).toBeInTheDocument();
  });
});
```

**Step 2: Implement StressPanel**

```typescript
// src/components/analytics/vpp-panels/StressPanel.tsx
'use client';

import { useRef, useEffect, useState } from 'react';
import type { PipelineStepResult, SubstrateType, StressMode } from '@/lib/analytics/types';
import { computeStressProfile } from '@/lib/analytics/vpp-engine';
import { STEP_SHORT_NAMES } from '@/lib/analytics/constants';

interface Props {
  perStep: PipelineStepResult[];
}

const SUBSTRATE_OPTIONS: SubstrateType[] = ['Si(100)', 'Si(111)', 'SiGe', 'SOI'];
const MODE_OPTIONS: { value: StressMode; label: string }[] = [
  { value: 'biaxial', label: 'Biaxial' },
  { value: 'plane-stress', label: 'Plane Stress' },
  { value: 'plane-strain', label: 'Plane Strain' },
];

export function StressPanel({ perStep }: Props) {
  const [mode, setMode] = useState<StressMode>('biaxial');
  const [substrate, setSubstrate] = useState<SubstrateType>('Si(100)');
  const [tempC, setTempC] = useState(25);
  const [showYield, setShowYield] = useState(false);
  const [hiddenSteps, setHiddenSteps] = useState<Set<string>>(new Set());

  const barRef = useRef<HTMLCanvasElement>(null);
  const cumRef = useRef<HTMLCanvasElement>(null);

  const profile = computeStressProfile(perStep, substrate, tempC, mode);
  const visibleLayers = profile.layers.filter((l) => !hiddenSteps.has(l.stepId));

  useEffect(() => {
    drawStressBar(barRef.current, visibleLayers, showYield);
    drawCumulativeStress(cumRef.current, profile.cumulativeStress);
  });

  const bowColor = profile.waferBow < 25 ? 'text-green-400' : profile.waferBow < 50 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 items-center">
        {MODE_OPTIONS.map((m) => (
          <button key={m.value} onClick={() => setMode(m.value)}
            className={`px-2 py-1 text-xs rounded ${mode === m.value ? 'bg-blue-600 text-white' : 'bg-[var(--smartfactory-bg-base)] text-[var(--smartfactory-text-secondary)] border border-[var(--smartfactory-border-default)]'}`}>
            {m.label}
          </button>
        ))}
        <select value={substrate} onChange={(e) => setSubstrate(e.target.value as SubstrateType)}
          className="text-xs bg-[var(--smartfactory-bg-base)] border border-[var(--smartfactory-border-default)] rounded px-2 py-1 text-[var(--smartfactory-text-primary)]">
          {SUBSTRATE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex items-center gap-1">
          <label className="text-xs text-[var(--smartfactory-text-muted)]">T:</label>
          <input type="range" min={25} max={400} value={tempC} onChange={(e) => setTempC(Number(e.target.value))}
            className="w-20" />
          <span className="text-xs text-[var(--smartfactory-text-secondary)]">{tempC}°C</span>
        </div>
        <label className="flex items-center gap-1 text-xs text-[var(--smartfactory-text-muted)]">
          <input type="checkbox" checked={showYield} onChange={(e) => setShowYield(e.target.checked)} />
          Yield Strength
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {profile.layers.map((l) => (
          <label key={l.stepId} className="flex items-center gap-1 text-xs text-[var(--smartfactory-text-muted)]">
            <input type="checkbox" checked={!hiddenSteps.has(l.stepId)}
              onChange={(e) => {
                const next = new Set(hiddenSteps);
                if (e.target.checked) next.delete(l.stepId); else next.add(l.stepId);
                setHiddenSteps(next);
              }} />
            {STEP_SHORT_NAMES[l.stepId]}
          </label>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <canvas ref={barRef} data-testid="stress-bar-canvas" width={400} height={180}
          className="w-full bg-[var(--smartfactory-bg-base)] rounded" />
        <canvas ref={cumRef} data-testid="stress-cumulative-canvas" width={400} height={180}
          className="w-full bg-[var(--smartfactory-bg-base)] rounded" />
      </div>

      <div className="flex gap-4 text-xs">
        <span className="text-[var(--smartfactory-text-muted)]">Net: <strong className="text-[var(--smartfactory-text-primary)]">{profile.netStress > 0 ? '+' : ''}{profile.netStress.toFixed(0)} MPa</strong> ({profile.netStress > 0 ? 'tensile' : 'compressive'})</span>
        <span className="text-[var(--smartfactory-text-muted)]">Bow: <strong className={bowColor}>{profile.waferBow.toFixed(1)} µm</strong></span>
      </div>
    </div>
  );
}

const STEP_COLORS = ['#FF6B35', '#22D3EE', '#A855F7', '#3B82F6', '#F43F5E', '#F59E0B', '#10B981', '#E2E8F0'];

function drawStressBar(canvas: HTMLCanvasElement | null, layers: { stepId: string; totalStress: number; material: string }[], showYield: boolean) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  if (layers.length === 0) return;

  const pad = 30;
  const maxAbs = Math.max(...layers.map((l) => Math.abs(l.totalStress)), 100);
  const midY = H / 2;
  const barH = (H - 2 * pad) / layers.length * 0.7;
  const gap = (H - 2 * pad) / layers.length * 0.3;

  // Zero line
  const zeroX = W / 2;
  ctx.strokeStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(zeroX, pad);
  ctx.lineTo(zeroX, H - pad);
  ctx.stroke();

  layers.forEach((l, i) => {
    const y = pad + i * (barH + gap);
    const barLen = (l.totalStress / maxAbs) * (W / 2 - pad);
    const x = l.totalStress >= 0 ? zeroX : zeroX + barLen;
    const w = Math.abs(barLen);
    ctx.fillStyle = l.totalStress >= 0 ? '#3B82F688' : '#EF444488';
    ctx.fillRect(x, y, w, barH);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(STEP_SHORT_NAMES[l.stepId as keyof typeof STEP_SHORT_NAMES] ?? l.stepId, zeroX - (W / 2 - pad) - 4, y + barH / 2 + 4);
    ctx.textAlign = l.totalStress >= 0 ? 'left' : 'right';
    ctx.fillText(`${l.totalStress > 0 ? '+' : ''}${l.totalStress.toFixed(0)}`, x + (l.totalStress >= 0 ? w + 4 : -4), y + barH / 2 + 4);
  });

  ctx.fillStyle = '#64748B';
  ctx.font = '9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Compressive', pad + (zeroX - pad) / 2, H - 4);
  ctx.fillText('Tensile', zeroX + (W - pad - zeroX) / 2, H - 4);
}

function drawCumulativeStress(canvas: HTMLCanvasElement | null, points: { depth: number; stress: number }[]) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  if (points.length < 2) return;

  const pad = 30;
  const maxDepth = Math.max(...points.map((p) => p.depth));
  const stresses = points.map((p) => p.stress);
  const minS = Math.min(...stresses, 0);
  const maxS = Math.max(...stresses, 0);
  const sRange = maxS - minS || 1;

  const toX = (s: number) => pad + ((s - minS) / sRange) * (W - 2 * pad);
  const toY = (d: number) => pad + (d / (maxDepth || 1)) * (H - 2 * pad);

  // Zero line
  ctx.strokeStyle = '#475569';
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.moveTo(toX(0), pad);
  ctx.lineTo(toX(0), H - pad);
  ctx.stroke();
  ctx.setLineDash([]);

  // Profile line
  ctx.strokeStyle = '#22D3EE';
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = toX(p.stress);
    const y = toY(p.depth);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();

  points.forEach((p) => {
    ctx.fillStyle = '#22D3EE';
    ctx.beginPath();
    ctx.arc(toX(p.stress), toY(p.depth), 3, 0, 2 * Math.PI);
    ctx.fill();
  });

  ctx.fillStyle = '#94A3B8';
  ctx.font = '10px monospace';
  ctx.fillText('Stress (MPa)', pad, pad - 8);
  ctx.textAlign = 'right';
  ctx.fillText('Depth →', W - pad, H - 4);
}
```

**Step 3: Run tests**

```bash
npx jest src/components/analytics/vpp-panels/__tests__/StressPanel.test.tsx
```
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/analytics/vpp-panels/StressPanel.tsx src/components/analytics/vpp-panels/__tests__/StressPanel.test.tsx
git commit -m "feat(vpp): StressPanel — dual canvas with mode/substrate/temperature controls"
```

---

### Task 8: DefectPanel + Tests

**Files:**
- Create: `src/components/analytics/vpp-panels/DefectPanel.tsx`
- Create: `src/components/analytics/vpp-panels/__tests__/DefectPanel.test.tsx`

**Step 1: Write failing test**

```typescript
// src/components/analytics/vpp-panels/__tests__/DefectPanel.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { DefectPanel } from '../DefectPanel';
import { createDefaultPipeline, runFederatedSim } from '@/lib/analytics/vpp-engine';

describe('DefectPanel', () => {
  const result = runFederatedSim(createDefaultPipeline());

  test('renders canvases and controls', () => {
    render(<DefectPanel perStep={result.perStep} />);
    expect(screen.getByTestId('defect-bar-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('defect-wafer-canvas')).toBeInTheDocument();
  });

  test('sort buttons are interactive', () => {
    render(<DefectPanel perStep={result.perStep} />);
    fireEvent.click(screen.getByText('By Severity'));
    expect(screen.getByText('By Severity')).toBeInTheDocument();
  });

  test('shows total D₀ and killer D₀', () => {
    render(<DefectPanel perStep={result.perStep} />);
    expect(screen.getByText(/Total D/)).toBeInTheDocument();
    expect(screen.getByText(/Killer/)).toBeInTheDocument();
  });
});
```

**Step 2: Implement DefectPanel**

```typescript
// src/components/analytics/vpp-panels/DefectPanel.tsx
'use client';

import { useRef, useEffect, useState } from 'react';
import type { PipelineStepResult, DefectSource } from '@/lib/analytics/types';
import { computeDefectMap } from '@/lib/analytics/vpp-engine';
import { STEP_SHORT_NAMES } from '@/lib/analytics/constants';
import {
  DEFECT_SOURCES, DEFECT_SOURCE_COLORS, DEFAULT_KILL_RATIOS,
} from '@/lib/analytics/vpp-constants';

interface Props {
  perStep: PipelineStepResult[];
}

type SortOrder = 'by-step' | 'by-severity' | 'by-layer';
type ViewMode = 'per-step' | 'cumulative';

export function DefectPanel({ perStep }: Props) {
  const [sortOrder, setSortOrder] = useState<SortOrder>('by-step');
  const [viewMode, setViewMode] = useState<ViewMode>('per-step');
  const [ceiling, setCeiling] = useState(1.5);
  const [killRatios, setKillRatios] = useState<Record<DefectSource, number>>({ ...DEFAULT_KILL_RATIOS });
  const [enabledSources, setEnabledSources] = useState<DefectSource[]>([...DEFECT_SOURCES]);

  const barRef = useRef<HTMLCanvasElement>(null);
  const waferRef = useRef<HTMLCanvasElement>(null);

  const defects = computeDefectMap(perStep, killRatios, enabledSources);

  const sortedSteps = [...defects.perStep];
  if (sortOrder === 'by-severity') sortedSteps.sort((a, b) => b.killerD0 - a.killerD0);

  useEffect(() => {
    drawDefectBars(barRef.current, sortedSteps, defects.paretoPoints, ceiling, viewMode);
    drawWaferMap(waferRef.current, defects.waferDots);
  });

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 items-center">
        {([['by-step', 'By Step'], ['by-severity', 'By Severity'], ['by-layer', 'By Layer']] as const).map(([val, label]) => (
          <button key={val} onClick={() => setSortOrder(val)}
            className={`px-2 py-1 text-xs rounded ${sortOrder === val ? 'bg-blue-600 text-white' : 'bg-[var(--smartfactory-bg-base)] text-[var(--smartfactory-text-secondary)] border border-[var(--smartfactory-border-default)]'}`}>
            {label}
          </button>
        ))}
        {([['per-step', 'Per-Step'], ['cumulative', 'Cumulative']] as const).map(([val, label]) => (
          <button key={val} onClick={() => setViewMode(val)}
            className={`px-2 py-1 text-xs rounded ${viewMode === val ? 'bg-blue-600 text-white' : 'bg-[var(--smartfactory-bg-base)] text-[var(--smartfactory-text-secondary)] border border-[var(--smartfactory-border-default)]'}`}>
            {label}
          </button>
        ))}
        <div className="flex items-center gap-1">
          <label className="text-xs text-[var(--smartfactory-text-muted)]">D₀ Ceiling:</label>
          <input type="range" min={0.1} max={3} step={0.1} value={ceiling} onChange={(e) => setCeiling(Number(e.target.value))} className="w-16" />
          <span className="text-xs text-[var(--smartfactory-text-secondary)]">{ceiling.toFixed(1)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {DEFECT_SOURCES.map((src) => (
          <div key={src} className="flex items-center gap-1">
            <label className="flex items-center gap-1 text-xs text-[var(--smartfactory-text-muted)]">
              <input type="checkbox" checked={enabledSources.includes(src)}
                onChange={(e) => {
                  if (e.target.checked) setEnabledSources([...enabledSources, src]);
                  else setEnabledSources(enabledSources.filter((s) => s !== src));
                }} />
              <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: DEFECT_SOURCE_COLORS[src] }} />
              {src}
            </label>
            <input type="range" min={0} max={1} step={0.05} value={killRatios[src]}
              onChange={(e) => setKillRatios({ ...killRatios, [src]: Number(e.target.value) })}
              className="w-12" />
            <span className="text-xs text-[var(--smartfactory-text-secondary)]">{killRatios[src].toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <canvas ref={barRef} data-testid="defect-bar-canvas" width={400} height={200}
          className="w-full bg-[var(--smartfactory-bg-base)] rounded" />
        <canvas ref={waferRef} data-testid="defect-wafer-canvas" width={400} height={200}
          className="w-full bg-[var(--smartfactory-bg-base)] rounded" />
      </div>

      <div className="flex gap-4 text-xs text-[var(--smartfactory-text-muted)]">
        <span>Total D₀: <strong className="text-[var(--smartfactory-text-primary)]">{defects.totalD0.toFixed(2)} /cm²</strong></span>
        <span>Killer: <strong className="text-[var(--smartfactory-text-primary)]">{defects.totalKillerD0.toFixed(2)} /cm²</strong></span>
        <span>Yield Impact: <strong className="text-red-400">−{(defects.totalYieldImpact * 100).toFixed(1)}%</strong></span>
      </div>
    </div>
  );
}

const STEP_COLORS = ['#FF6B35', '#22D3EE', '#A855F7', '#3B82F6', '#F43F5E', '#F59E0B', '#10B981', '#E2E8F0'];

function drawDefectBars(
  canvas: HTMLCanvasElement | null,
  steps: { stepId: string; totalD0: number; killerD0: number; sources: { source: string; density: number; color: string }[] }[],
  paretoPoints: { stepId: string; cumPct: number }[],
  ceiling: number,
  viewMode: string,
) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  if (steps.length === 0) return;

  const pad = 30;
  const maxD0 = Math.max(...steps.map((s) => s.totalD0), ceiling) * 1.1;
  const barW = (W - 2 * pad) / steps.length * 0.7;
  const gap = (W - 2 * pad) / steps.length * 0.3;

  // Ceiling line
  const ceilY = H - pad - (ceiling / maxD0) * (H - 2 * pad);
  ctx.strokeStyle = '#EF4444';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(pad, ceilY);
  ctx.lineTo(W - pad, ceilY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Stacked bars
  steps.forEach((step, i) => {
    const x = pad + i * (barW + gap);
    let y = H - pad;
    for (const src of step.sources) {
      const segH = (src.density / maxD0) * (H - 2 * pad);
      y -= segH;
      ctx.fillStyle = src.color + '88';
      ctx.fillRect(x, y, barW, segH);
    }
    ctx.fillStyle = '#94A3B8';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(STEP_SHORT_NAMES[step.stepId as keyof typeof STEP_SHORT_NAMES] ?? step.stepId, x + barW / 2, H - pad + 12);
  });

  // Pareto overlay
  ctx.strokeStyle = '#F97316';
  ctx.lineWidth = 2;
  ctx.beginPath();
  paretoPoints.forEach((pt, i) => {
    const stepIdx = steps.findIndex((s) => s.stepId === pt.stepId);
    if (stepIdx < 0) return;
    const x = pad + stepIdx * (barW + gap) + barW / 2;
    const y = pad + (1 - pt.cumPct / 100) * (H - 2 * pad);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function drawWaferMap(canvas: HTMLCanvasElement | null, dots: { x: number; y: number; source: string }[]) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2;
  const cy = H / 2;
  const r = Math.min(W, H) / 2 - 20;

  // Wafer outline
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.stroke();

  // Edge exclusion
  ctx.strokeStyle = '#47456944';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.95, 0, 2 * Math.PI);
  ctx.stroke();

  // Dots
  for (const dot of dots) {
    const x = cx + dot.x * r * 0.93;
    const y = cy + dot.y * r * 0.93;
    ctx.fillStyle = DEFECT_SOURCE_COLORS_MAP[dot.source] ?? '#94A3B8';
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, 2 * Math.PI);
    ctx.fill();
  }

  ctx.fillStyle = '#94A3B8';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Wafer Defect Map', cx, H - 4);
}

const DEFECT_SOURCE_COLORS_MAP: Record<string, string> = {
  particles: '#22D3EE',
  scratches: '#F59E0B',
  voids: '#A855F7',
  inclusions: '#EF4444',
};
```

**Step 3: Run tests**

```bash
npx jest src/components/analytics/vpp-panels/__tests__/DefectPanel.test.tsx
```
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/analytics/vpp-panels/DefectPanel.tsx src/components/analytics/vpp-panels/__tests__/DefectPanel.test.tsx
git commit -m "feat(vpp): DefectPanel — stacked bar/Pareto + wafer defect map"
```

---

### Task 9: DopantPanel + Tests

**Files:**
- Create: `src/components/analytics/vpp-panels/DopantPanel.tsx`
- Create: `src/components/analytics/vpp-panels/__tests__/DopantPanel.test.tsx`

**Step 1: Write failing test**

```typescript
// src/components/analytics/vpp-panels/__tests__/DopantPanel.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { DopantPanel } from '../DopantPanel';

describe('DopantPanel', () => {
  test('renders canvas and species checkboxes', () => {
    render(<DopantPanel />);
    expect(screen.getByTestId('dopant-profile-canvas')).toBeInTheDocument();
    expect(screen.getByLabelText('B')).toBeInTheDocument();
    expect(screen.getByLabelText('P')).toBeInTheDocument();
  });

  test('scale toggle switches between Log and Linear', () => {
    render(<DopantPanel />);
    fireEvent.click(screen.getByText('Linear'));
    expect(screen.getByText('Linear')).toBeInTheDocument();
  });

  test('shows junction depth readout', () => {
    render(<DopantPanel />);
    expect(screen.getByText(/Xj/)).toBeInTheDocument();
  });
});
```

**Step 2: Implement DopantPanel**

```typescript
// src/components/analytics/vpp-panels/DopantPanel.tsx
'use client';

import { useRef, useEffect, useState } from 'react';
import type { DopantSpeciesId } from '@/lib/analytics/types';
import { computeDopantProfile } from '@/lib/analytics/vpp-engine';
import { ALL_DOPANT_SPECIES, DOPANT_IMPLANT_DATA, DEFAULT_BACKGROUND_DOPING } from '@/lib/analytics/vpp-constants';

type Scale = 'log' | 'linear';

export function DopantPanel() {
  const [selected, setSelected] = useState<DopantSpeciesId[]>(['B', 'P', 'As']);
  const [depthMax, setDepthMax] = useState(500);
  const [scale, setScale] = useState<Scale>('log');
  const [annealTemp, setAnnealTemp] = useState(1000);
  const [annealTime, setAnnealTime] = useState(30);
  const [showActive, setShowActive] = useState(false);
  const [showJunction, setShowJunction] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const result = computeDopantProfile(selected, 0, depthMax, annealTemp, annealTime, showActive);

  useEffect(() => {
    drawDopantProfile(canvasRef.current, result, scale, showJunction, showActive);
  });

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 items-center">
        {ALL_DOPANT_SPECIES.map((sp) => (
          <label key={sp} className="flex items-center gap-1 text-xs text-[var(--smartfactory-text-muted)]">
            <input type="checkbox" aria-label={sp} checked={selected.includes(sp)}
              onChange={(e) => {
                if (e.target.checked) setSelected([...selected, sp]);
                else setSelected(selected.filter((s) => s !== sp));
              }} />
            <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: DOPANT_IMPLANT_DATA[sp].color }} />
            {sp}
          </label>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1">
          <label className="text-xs text-[var(--smartfactory-text-muted)]">Depth:</label>
          <input type="range" min={100} max={2000} step={50} value={depthMax}
            onChange={(e) => setDepthMax(Number(e.target.value))} className="w-20" />
          <span className="text-xs text-[var(--smartfactory-text-secondary)]">{depthMax} nm</span>
        </div>
        {([['log', 'Log'], ['linear', 'Linear']] as const).map(([val, label]) => (
          <button key={val} onClick={() => setScale(val)}
            className={`px-2 py-1 text-xs rounded ${scale === val ? 'bg-blue-600 text-white' : 'bg-[var(--smartfactory-bg-base)] text-[var(--smartfactory-text-secondary)] border border-[var(--smartfactory-border-default)]'}`}>
            {label}
          </button>
        ))}
        {([['Total', false], ['Active', true]] as const).map(([label, val]) => (
          <button key={label} onClick={() => setShowActive(val as boolean)}
            className={`px-2 py-1 text-xs rounded ${showActive === val ? 'bg-blue-600 text-white' : 'bg-[var(--smartfactory-bg-base)] text-[var(--smartfactory-text-secondary)] border border-[var(--smartfactory-border-default)]'}`}>
            {label}
          </button>
        ))}
        <label className="flex items-center gap-1 text-xs text-[var(--smartfactory-text-muted)]">
          <input type="checkbox" checked={showJunction} onChange={(e) => setShowJunction(e.target.checked)} />
          Junction Xj
        </label>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1">
          <label className="text-xs text-[var(--smartfactory-text-muted)]">Anneal T:</label>
          <input type="range" min={800} max={1200} step={10} value={annealTemp}
            onChange={(e) => setAnnealTemp(Number(e.target.value))} className="w-20" />
          <span className="text-xs text-[var(--smartfactory-text-secondary)]">{annealTemp}°C</span>
        </div>
        <div className="flex items-center gap-1">
          <label className="text-xs text-[var(--smartfactory-text-muted)]">Time:</label>
          <input type="range" min={1} max={120} step={1} value={annealTime}
            onChange={(e) => setAnnealTime(Number(e.target.value))} className="w-20" />
          <span className="text-xs text-[var(--smartfactory-text-secondary)]">{annealTime} min</span>
        </div>
      </div>

      <canvas ref={canvasRef} data-testid="dopant-profile-canvas" width={500} height={250}
        className="w-full bg-[var(--smartfactory-bg-base)] rounded" />

      <div className="flex flex-wrap gap-3 text-xs text-[var(--smartfactory-text-muted)]">
        {result.species.map((sp) => (
          <span key={sp.species}>
            <span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ backgroundColor: sp.color }} />
            {sp.species}: Peak {sp.peakConcentration.toExponential(1)} cm⁻³ | Xj {sp.junctionDepth.toFixed(0)} nm | Dose {sp.dose.toExponential(1)} cm⁻²
          </span>
        ))}
      </div>
    </div>
  );
}

function drawDopantProfile(
  canvas: HTMLCanvasElement | null,
  result: ReturnType<typeof computeDopantProfile>,
  scale: 'log' | 'linear',
  showJunction: boolean,
  showActive: boolean,
) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  if (result.species.length === 0) return;

  const pad = 50;
  const allProfiles = result.species.flatMap((s) => s.profile);
  const maxDepth = Math.max(...allProfiles.map((p) => p.depth));
  const toX = (d: number) => pad + (d / (maxDepth || 1)) * (W - 2 * pad);

  let toY: (c: number) => number;
  if (scale === 'log') {
    const logMin = 14; // 1e14
    const logMax = 21; // 1e21
    toY = (c: number) => {
      const logC = Math.log10(Math.max(c, 1e14));
      return H - pad - ((logC - logMin) / (logMax - logMin)) * (H - 2 * pad);
    };
    // Y-axis grid
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 0.5;
    for (let exp = logMin; exp <= logMax; exp++) {
      const y = toY(Math.pow(10, exp));
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(W - pad, y);
      ctx.stroke();
      ctx.fillStyle = '#64748B';
      ctx.font = '9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`10^${exp}`, pad - 4, y + 3);
    }
  } else {
    const maxC = Math.max(...allProfiles.map((p) => p.concentration));
    toY = (c: number) => H - pad - (c / (maxC || 1)) * (H - 2 * pad);
  }

  // Background doping line
  ctx.strokeStyle = '#475569';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  const bgY = toY(result.backgroundDoping);
  ctx.moveTo(pad, bgY);
  ctx.lineTo(W - pad, bgY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#475569';
  ctx.font = '9px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('N_sub', W - pad + 4, bgY + 3);

  // Draw profiles
  for (const sp of result.species) {
    ctx.strokeStyle = sp.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    sp.profile.forEach((pt, i) => {
      const x = toX(pt.depth);
      const c = showActive ? pt.activeConcentration : pt.concentration;
      const y = toY(c);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Active overlay (dashed thinner line)
    if (showActive) {
      ctx.strokeStyle = sp.color + '88';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      sp.profile.forEach((pt, i) => {
        const x = toX(pt.depth);
        const y = toY(pt.concentration);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Junction depth marker
    if (showJunction && sp.junctionDepth > 0 && sp.junctionDepth < maxDepth) {
      const jx = toX(sp.junctionDepth);
      ctx.strokeStyle = sp.color;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(jx, pad);
      ctx.lineTo(jx, H - pad);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = sp.color;
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Xj=${sp.junctionDepth.toFixed(0)}`, jx, pad - 4);
    }
  }

  // Axis labels
  ctx.fillStyle = '#94A3B8';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Depth (nm)', W / 2, H - 4);
  ctx.save();
  ctx.translate(12, H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Concentration (cm⁻³)', 0, 0);
  ctx.restore();
}
```

**Step 3: Run tests**

```bash
npx jest src/components/analytics/vpp-panels/__tests__/DopantPanel.test.tsx
```
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/analytics/vpp-panels/DopantPanel.tsx src/components/analytics/vpp-panels/__tests__/DopantPanel.test.tsx
git commit -m "feat(vpp): DopantPanel — log/linear depth profile with anneal controls"
```

---

### Task 10: VppTab Integration + Tests

**Files:**
- Modify: `src/components/analytics/VppTab.tsx`
- Modify: `src/components/analytics/__tests__/VppTab.test.tsx`

**Step 1: Update VppTab.test.tsx**

Replace the existing test file:

```typescript
// src/components/analytics/__tests__/VppTab.test.tsx
import { render, screen } from '@testing-library/react';
import { VppTab } from '../VppTab';

jest.mock('@/lib/analytics/vpp-engine', () => {
  const actual = jest.requireActual('@/lib/analytics/vpp-engine');
  return actual;
});

describe('VppTab', () => {
  test('renders KPI strip', () => {
    render(<VppTab />);
    expect(screen.getByText(/Active Sims/)).toBeInTheDocument();
    expect(screen.getByText(/Cumulative Yield/)).toBeInTheDocument();
  });

  test('renders pipeline steps section', () => {
    render(<VppTab />);
    expect(screen.getByText(/Pipeline Steps/)).toBeInTheDocument();
  });

  test('renders film stack section', () => {
    render(<VppTab />);
    expect(screen.getByText(/Film Stack/)).toBeInTheDocument();
  });

  test('renders all 5 accordion panels', () => {
    render(<VppTab />);
    expect(screen.getByText(/Film Stack/)).toBeInTheDocument();
    expect(screen.getByText(/Thermal Budget/)).toBeInTheDocument();
    expect(screen.getByText(/Stress/)).toBeInTheDocument();
    expect(screen.getByText(/Defect/)).toBeInTheDocument();
    expect(screen.getByText(/Dopant/)).toBeInTheDocument();
  });

  test('renders VPP charts', () => {
    render(<VppTab />);
    expect(screen.getByTestId('vpp-chart-waterfall')).toBeInTheDocument();
    expect(screen.getByTestId('vpp-chart-metric')).toBeInTheDocument();
  });
});
```

**Step 2: Rewrite VppTab.tsx**

```typescript
// src/components/analytics/VppTab.tsx
'use client';

import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import {
  createDefaultPipeline, runFederatedSim, computePipelineYield,
} from '@/lib/analytics/vpp-engine';
import { STEP_SHORT_NAMES } from '@/lib/analytics/constants';
import { DEFAULT_PROCESS_TEMPS, DEFAULT_PROCESS_TIMES, DEFAULT_THERMAL_BUDGET_CEILING } from '@/lib/analytics/vpp-constants';
import type { PipelineStep, ThermalBudgetStep } from '@/lib/analytics/types';
import { AccordionPanel } from './vpp-panels/AccordionPanel';
import { FilmStackPanel } from './vpp-panels/FilmStackPanel';
import { ThermalBudgetPanel } from './vpp-panels/ThermalBudgetPanel';
import { StressPanel } from './vpp-panels/StressPanel';
import { DefectPanel } from './vpp-panels/DefectPanel';
import { DopantPanel } from './vpp-panels/DopantPanel';

export function VppTab() {
  const [pipeline] = useState<PipelineStep[]>(createDefaultPipeline);

  const result = useMemo(() => runFederatedSim(pipeline), [pipeline]);
  useMemo(() => computePipelineYield(result.perStep), [result]);

  // Thermal budget computed from process temps/times
  const thermalSteps: ThermalBudgetStep[] = useMemo(() => {
    let cumDt = 0;
    return result.perStep.map((step) => {
      const temp = DEFAULT_PROCESS_TEMPS[step.stepId];
      const time = DEFAULT_PROCESS_TIMES[step.stepId];
      const dt = temp * time;
      cumDt += dt;
      return { stepId: step.stepId, temperature: temp, time, dt, cumulativeDt: cumDt };
    });
  }, [result]);

  const waterfallRef = useRef<HTMLCanvasElement>(null);
  const metricRef = useRef<HTMLCanvasElement>(null);

  const drawCharts = useCallback(() => {
    drawPipelineWaterfall(waterfallRef.current, result.perStep);
    drawMetricTrend(metricRef.current, result.perStep);
  }, [result]);

  useEffect(() => { drawCharts(); }, [drawCharts]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2">
        <KpiBox label="Active Sims" value={`${pipeline.length}`} />
        <KpiBox label="Pipeline Steps" value={`${pipeline.length}`} />
        <KpiBox label="Cumulative Yield" value={`${(result.cumulativeYield * 100).toFixed(1)}%`} />
        <KpiBox label="Total Thickness" value={`${result.filmStack.reduce((s, l) => s + l.thickness, 0).toFixed(0)} nm`} />
        <KpiBox label="Layers" value={`${result.filmStack.length}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
        </div>

        <div className="space-y-4">
          <canvas ref={waterfallRef} data-testid="vpp-chart-waterfall" width={500} height={220}
            className="w-full bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded" />
          <canvas ref={metricRef} data-testid="vpp-chart-metric" width={500} height={220}
            className="w-full bg-[var(--smartfactory-surface-card)] border border-[var(--smartfactory-border-default)] rounded" />
        </div>
      </div>

      <div className="space-y-2">
        <AccordionPanel title="Film Stack" summary={`${result.filmStack.length} layers, ${result.filmStack.reduce((s, l) => s + l.thickness, 0).toFixed(0)} nm`} defaultOpen={true}>
          <FilmStackPanel filmStack={result.filmStack} />
        </AccordionPanel>

        <AccordionPanel title="Thermal Budget" summary={`${thermalSteps.length > 0 ? thermalSteps[thermalSteps.length - 1].cumulativeDt.toExponential(2) : '0'} °C·s`} defaultOpen={false}>
          <ThermalBudgetPanel steps={thermalSteps} ceiling={DEFAULT_THERMAL_BUDGET_CEILING} />
        </AccordionPanel>

        <AccordionPanel title="Stress / Strain" summary="CTE + intrinsic stress analysis" defaultOpen={false}>
          <StressPanel perStep={result.perStep} />
        </AccordionPanel>

        <AccordionPanel title="Defect Density" summary="Source breakdown + wafer map" defaultOpen={false}>
          <DefectPanel perStep={result.perStep} />
        </AccordionPanel>

        <AccordionPanel title="Dopant Profile" summary="Implant + diffusion depth profiles" defaultOpen={false}>
          <DopantPanel />
        </AccordionPanel>
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
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
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

**Step 3: Run tests**

```bash
npx jest src/components/analytics/__tests__/VppTab.test.tsx
```
Expected: all PASS

**Step 4: Run full analytics test suite**

```bash
npx jest --testPathPattern="analytics" --no-coverage
```
Expected: all PASS

**Step 5: Run build**

```bash
npm run build
```
Expected: static export success

**Step 6: Commit**

```bash
git add src/components/analytics/VppTab.tsx src/components/analytics/__tests__/VppTab.test.tsx
git commit -m "feat(vpp): integrate 5 accordion panels into VPP tab"
```

---

### Task Summary

| Task | Description | New Files | Tests |
|------|-------------|-----------|-------|
| 1 | Types + VPP constants | 1 create, 2 modify | 0 |
| 2 | computeStressProfile engine | 0 create, 2 modify | ~10 |
| 3 | computeDefectMap engine | 0 create, 2 modify | ~10 |
| 4 | computeDopantProfile engine | 0 create, 2 modify | ~12 |
| 5 | AccordionPanel component | 2 create | 3 |
| 6 | FilmStackPanel + ThermalBudgetPanel | 4 create | 4 |
| 7 | StressPanel | 2 create | 3 |
| 8 | DefectPanel | 2 create | 3 |
| 9 | DopantPanel | 2 create | 3 |
| 10 | VppTab integration | 0 create, 2 modify | 6 |
| **Total** | | **13 create, 8 modify** | **~54** |
