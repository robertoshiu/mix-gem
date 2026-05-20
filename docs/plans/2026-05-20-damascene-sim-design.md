# Metallization Damascene Digital Twin — Design Document

> Date: 2026-05-20
> Process: Cu Dual-Damascene ECD + CMP
> Route: `/mes/fab-floor/metallization/damascene-sim`
> Library: `src/lib/damascene-sim/`

## 1. Architecture Overview

The damascene sim follows the same architecture as lens-sim and reactor-sim:

```
src/lib/damascene-sim/              <- Physics engine (pure TS, no React)
  types.ts                           <- Interfaces: SimulationParams, StepState, SimulationState
  constants.ts                       <- Cu ECD reference values, CMP rates, feature geometry
  current-density.ts                 <- Primary current distribution (Wagner number)
  fill-profile.ts                    <- Trench/via fill evolution with additive effects
  cmp-model.ts                       <- Preston equation material removal + dishing
  thermal-model.ts                   <- Bath temperature effects on plating rate
  wafer-metrics.ts                   <- Orchestrator: sheet resistance, via resistance, step coverage, thickness maps
  simulation-engine.ts               <- Step-by-step state machine (200 steps, 3 phases)
  presets.ts                         <- 6 what-if scenarios
  index.ts                           <- Barrel export
  __tests__/                         <- One test file per module (TDD)

src/app/mes/fab-floor/metallization/damascene-sim/page.tsx   <- UI page
src/components/damascene-sim/        <- React components (scene, metrics, timeline, params)
```

Key difference from prior sims: the simulation has **3 phases** across 200 unified steps — ECD Fill (steps 0-119), Anneal (steps 120-159), CMP (steps 160-199). Each `StepState` carries the current phase and all accumulated metrics.

## 2. Physics Models

### Current Density Distribution (`current-density.ts`)
- Primary current distribution based on Wagner number: Wa = κ/(i₀·L), where κ = electrolyte conductivity, i₀ = exchange current density, L = characteristic length
- Wafer-scale non-uniformity: radial current density profile j(r) models the "terminal effect" — current crowds at wafer edge due to thin seed layer resistance
- Applied current: j_avg = I_total / A_wafer (typical ~30 mA/cm²)
- Per-die local current density modulated by radial position (edge dies get ~15% more current than center)

### Fill Profile (`fill-profile.ts`)
- Feature-level trench fill modeled as 1D height profile across trench width (e.g., 20 discrete points across a 100nm trench)
- Bottom-up fill driven by accelerator/suppressor additive ratio: fill_rate(x) = j_local × efficiency(x), where efficiency is highest at trench bottom (accelerator accumulation) and suppressed at sidewalls
- Three fill regimes: **superfill** (bottom-up, ideal), **conformal** (uniform everywhere, leads to seam), **void** (pinch-off at top before bottom fills)
- Additive health parameter (0-1) controls the transition between regimes
- Via fill: same model but cylindrical geometry correction factor

### CMP Model (`cmp-model.ts`)
- Preston equation: removal_rate = K_p × P × V, where K_p = Preston coefficient, P = pad pressure, V = relative velocity
- Dishing: wide copper trenches see higher effective pressure → faster removal → concave profile. Dishing depth ∝ line width × overpolish time
- Erosion: dielectric loss in dense feature areas
- End-point: target is barrier exposure (copper fully cleared from field regions)

### Thermal Model (`thermal-model.ts`)
- Bath temperature affects plating rate via Arrhenius: rate_factor = exp(-Ea/(kB·T))
- Higher temp → faster but rougher deposition, larger grain size pre-anneal
- Anneal phase: grain growth modeled as resistance reduction factor (post-anneal Rs drops ~15%)

### Wafer Metrics (`wafer-metrics.ts`)
- Orchestrates all models per step, outputs 4 die-level maps:
  - **Sheet Resistance** (Ω/sq) — primary electrical metric
  - **Via Resistance** (Ω) — connectivity metric
  - **Step Coverage** (%) — fill quality indicator
  - **Thickness** (nm) — copper film thickness

## 3. Simulation Engine

### Types

```typescript
type ProcessPhase = 'ecd-fill' | 'anneal' | 'cmp';

interface SimulationParams {
  appliedCurrent: number;      // mA/cm²
  bathTemp: number;            // °C
  additiveConc: number;        // normalized 0-1
  seedThickness: number;       // nm
  trenchWidth: number;         // nm
  trenchDepth: number;         // nm
  padPressure: number;         // psi (CMP)
  padVelocity: number;         // m/s (CMP)
  totalSteps: number;          // 200 default
}

interface StepState {
  stepIndex: number;
  phase: ProcessPhase;
  timeSeconds: number;
  currentDensityMap: number[];
  fillProfile: number[];       // 20-point trench cross-section
  fillFraction: number;
  copperThickness: number;     // nm overburden
  sheetResistance: number;
  viaResistance: number;
  stepCoverage: number;
  dishingDepth: number;
  thicknessMap: number[];
  resistanceMap: number[];
  roughnessMap: number[];
  uniformity: number;
}
```

### Phase Boundaries

| Phase | Steps | Duration | Physics |
|-------|-------|----------|---------|
| ECD Fill | 0-119 | ~60s plating | Copper deposits, trenches fill, current density evolves |
| Anneal | 120-159 | ~200°C bake | Grain growth, resistance drops, no geometry change |
| CMP | 160-199 | ~40s polish | Material removal, planarization, dishing/erosion |

### State Machine

Same immutable pattern:
- `createSimulation(params)` → fresh state with step 0
- `stepForward(state)` → advance one step, auto-detect phase from step index
- `stepN(state, n)` → batch-step N steps
- `applyPreset(state, presetId)` → mutate params mid-run

## 4. 3D Visualization (Babylon.js)

### Left Panel — Electroplating Cell / CMP View

**ECD Fill Phase (steps 0-119):**
- Wafer (top, face-down): thin disc cathode, copper film growing downward. Film color darkens as it thickens
- Anode (bottom): flat copper plate, static
- Electrolyte bath (between): semi-transparent blue-green volume. Animated particle streamlines flow upward from anode to wafer (Cu²⁺ ion transport)
- Streamline density per region maps to local current density — edge regions denser (terminal effect)
- Current density indicators: floating labels showing j_avg, bath temp, additive health
- Seed layer ring on wafer edge: visible thin copper ring, dims if seed thinning preset active

**Anneal Phase (steps 120-159):**
- Electrolyte drains away (particles fade out)
- Wafer glows warm (amber emissive, temperature-based)
- Grain structure overlay: subtle texture transition on copper surface (fine → coarse)

**CMP Phase (steps 160-199):**
- Scene rotates: wafer now face-up on a platen
- Polishing pad (top): rotating disc pressing down, semi-transparent
- Slurry particles: small animated spheres between pad and wafer
- Copper overburden visibly thins, barrier layer (purple) revealed as copper clears
- Dishing visible as concave depression in wide features

Built with procedural geometry, no GLB. Same `propsRef` render-loop pattern.

### Right Inset — Trench Fill Cross-Section (Canvas2D overlay)
- 20-point trench profile showing sidewalls and bottom
- Fill height animated as copper (orange-brown) rises from bottom
- Void/seam highlighted in red if fill regime breaks down
- Labels: fill fraction %, copper thickness, step count

## 5. Wafer Map & Metrics Display

### Wafer Die Map
Same 9×9 die grid with DIE_MASK. Four selectable metric layers:

| Metric | Color Map | Range | Spec |
|--------|-----------|-------|------|
| Sheet Resistance (Ω/sq) | green→yellow→red | 0.02–0.06 | 0.032–0.052 |
| Via Resistance (Ω) | green→yellow→red | 0–3.0 | < 2.4 |
| Step Coverage (%) | red→yellow→green | 60–100 | > 75% |
| Thickness (nm) | blue→white→red | 0–200 | target ±10% |

### Trend Sparkline
- X-axis: step index (0-199)
- Y-axis: selected metric aggregate
- Phase dividers: two vertical dashed lines at step 120 (anneal) and step 160 (CMP)
- Spec limits as horizontal dashed red lines
- Area fill below trend line

### Page Layout (3 horizontal zones)
1. **Top**: Timeline bar (step progress, play/pause/step/seek/reset, phase indicator: blue=ECD, amber=Anneal, emerald=CMP, speed control)
2. **Middle**: Split panels — left: electroplating cell + trench inset, right: wafer die map + trend sparkline
3. **Bottom**: Parameter panel (8 sliders + 6 preset buttons)

## 6. What-If Presets (6 Scenarios)

| Preset | Trigger | Physics Effect | Visual Signal |
|--------|---------|---------------|---------------|
| Current Crowding | Current +40%, seed -30% | Terminal effect amplified, edge overplate, center starve, uniformity >5% | Edge streamlines dense, center sparse, resistance map red ring |
| Additive Depletion | additiveConc decays 3%/step | Bottom-up → conformal → void, via resistance climbs | Trench inset shows red void, fill fraction stalls |
| Seed Layer Thinning | seedThickness -50% | Current avoidance at via sidewalls, incomplete fill | Seed ring dims, step coverage drops below 75% |
| Over-polish (Dishing) | padPressure +60%, extra steps | Wide trenches over-eroded, Rs rises | Trench inset concave copper, thickness map red |
| Under-polish (Residual Cu) | padPressure -40%, fewer steps | Copper not cleared → shorts risk | Copper remains on surface, thickness stays high |
| Bath Temp Drift | bathTemp +15°C, +0.5°C/step | Faster but rougher plating, higher post-anneal Rs | Bath particles speed up, rough surface texture |

Each preset has `id`, `label`, `labelCN`, `color`, and `apply(params, stepIndex) => params`.

## 7. Entry Points from Fab Floor

### Digital Twin Routes Update
Add to `src/lib/digital-twin-routes.ts`:
```typescript
metallization: '/mes/fab-floor/metallization/damascene-sim'
```

No changes needed in FabFloorScene.tsx or ProcessHudPanel.tsx — they already read from DIGITAL_TWIN_ROUTES dynamically. Adding the entry automatically provides:
- Pulsing "DT" diamond badge on the metallization station
- "Digital Twin 數位孿生" button in ProcessHudPanel

### Process Accent Color
Metallization slate gray (#E2E8F0) is too light for dark UI. Use **#94A3B8** (slate-400) for timeline/parameter panel borders: `rgba(148, 163, 184, 0.2)`.

## 8. Testing Plan

TDD — one test file per physics module:

| Module | Tests | Key Assertions |
|--------|-------|----------------|
| `current-density.test.ts` | 4 | Wagner number calculation, terminal effect profile, edge vs center ratio, seed resistance effect |
| `fill-profile.test.ts` | 5 | Superfill regime, conformal regime, void formation, fill fraction monotonic, additive effect |
| `cmp-model.test.ts` | 4 | Preston removal rate, dishing ∝ width, endpoint detection, erosion |
| `thermal-model.test.ts` | 3 | Arrhenius rate increase, anneal resistance reduction, roughness vs temp |
| `wafer-metrics.test.ts` | 5 | All 4 maps correct, resistance within spec at nominal, step coverage >75% |
| `simulation-engine.test.ts` | 6 | createSimulation, stepForward, phase transitions at correct steps, stepN, applyPreset, 200 steps completes |
| `presets.test.ts` | 6 | One test per preset verifying param mutation and expected impact |

Total: ~33 tests across 7 test files. All pure TypeScript, no DOM/React dependencies.

UI component tests follow in the UI implementation phase.
