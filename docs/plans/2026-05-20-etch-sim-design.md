# ICP Etching Digital Twin — Design Document

> Date: 2026-05-20
> Process: ICP Plasma Etching (CF4/O2)
> Route: `/mes/fab-floor/etching/etch-sim`
> Library: `src/lib/etch-sim/`

## 1. Architecture Overview

The etch-sim follows the same architecture as lens-sim, dep-sim, and damascene-sim:

```
src/lib/etch-sim/                    <- Physics engine (pure TS, no React)
  types.ts                            <- Interfaces: SimulationParams, StepState, SimulationState
  constants.ts                        <- ICP plasma reference values, phase boundaries
  plasma-model.ts                     <- Electron density, ion flux from ICP/bias power
  sheath-model.ts                     <- Sheath potential, ion energy/angle distribution
  etch-profile.ts                     <- Feature-level trench etch evolution (material removal)
  thermal-model.ts                    <- Chuck temperature effects on etch chemistry
  wafer-metrics.ts                    <- Orchestrator: etch rate, selectivity, CD bias, profile angle maps
  simulation-engine.ts                <- 200-step state machine, 3 phases
  presets.ts                           <- 6 what-if scenarios
  index.ts                            <- Barrel export
  __tests__/                           <- One test file per module (TDD)

src/components/etch-sim/
  TimelineBar.tsx                      <- With backHref prop (new pattern)
  ParameterPanel.tsx                   <- 8 sliders + 6 presets
  ICPChamberScene.tsx                  <- Babylon.js ICP cross-section + etch profile inset
  WaferMetricsPanel.tsx                <- Die map + trend sparkline

src/app/mes/fab-floor/etching/etch-sim/page.tsx
```

Key difference from prior sims: the simulation models **material removal** (inverse of deposition/fill). The etch profile starts full and material is removed from top down. The ICP coil geometry is visually distinctive.

## 2. Physics Models

### Plasma Model (`plasma-model.ts`)
- Electron density from ICP power: `n_e = k × P_ICP / (pressure × volume)`, where k is an ionization efficiency factor
- Ion flux to wafer: `Γ_i = n_e × v_Bohm`, where Bohm velocity `v_Bohm = sqrt(kT_e / m_i)`
- Per-die ion flux map: radial non-uniformity — center-peaked for ICP (opposite of damascene terminal effect). Edge dies get ~10% less flux
- Gas chemistry ratio: CF4/(CF4+O2) controls etch-vs-passivation balance. High CF4 → faster etch, less sidewall protection. High O2 → more passivation, better anisotropy but slower

### Sheath Model (`sheath-model.ts`)
- Sheath potential: `V_sh ≈ V_bias × (1 + P_ICP/P_bias × 0.1)`
- Ion energy: `E_ion = q × V_sh` (eV). Higher energy → more physical sputtering, profile bowing risk
- Ion angular distribution: half-angle `θ = arctan(T_i / E_ion)^0.5`. Low pressure + high bias → narrow angular spread → vertical profiles. High pressure → broad angles → tapered profiles

### Etch Profile (`etch-profile.ts`)
- 20-point cross-section (inverse of damascene fill — material removed from top down)
- Three regimes based on chemistry ratio: **anisotropic** (vertical sidewalls, ratio > 0.6), **tapered** (sloped, 0.3-0.6), **isotropic** (undercut, < 0.3)
- Profile angle derived from ion angular distribution + passivation strength
- Micro-loading: dense features etch slower (local reactant depletion)

### Thermal Model (`thermal-model.ts`)
- Chuck temperature affects etch rate via Arrhenius: higher temp → faster chemical etch component
- Also affects selectivity — resist erodes faster at higher temp
- Roughness increases with ion energy (bombardment damage)

### Wafer Metrics (`wafer-metrics.ts`)
- Orchestrates all models per step, outputs 4 die-level maps:
  - **Etch Rate** (nm/min) — primary process metric
  - **Selectivity** (:1) — film-to-resist ratio
  - **CD Bias** (nm) — critical dimension shift from target
  - **Profile Angle** (°) — sidewall verticality

## 3. Simulation Engine

### Types

```typescript
type ProcessPhase = 'strike' | 'main-etch' | 'over-etch';

interface SimulationParams {
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

interface StepState {
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
```

### Phase Boundaries

| Phase | Steps | Duration | Physics |
|-------|-------|----------|---------|
| Plasma Strike | 0-39 | ~2s ignition | Gas ionizes, electron density ramps up, no etching yet |
| Main Etch | 40-159 | ~60s etch | Active material removal, profile evolves, metrics track |
| Over-etch + Ash | 160-199 | ~20s cleanup | Residual clearing, selectivity critical, resist ash |

### State Machine

Same immutable pattern:
- `createSimulation(params)` → fresh state with step 0
- `stepForward(state)` → advance one step, auto-detect phase from step index
- `stepN(state, n)` → batch-step N steps
- `applyPreset(state, presetId)` → mutate params mid-run

## 4. 3D Visualization (Babylon.js)

### ICP Chamber Cross-Section (`ICPChamberScene.tsx`)

**Static geometry:**
- ICP coil (top): 3-4 horizontal torus rings above a flat dielectric window (quartz). Copper-colored PBR metallic
- Dielectric window: flat translucent disc below coil
- Chamber walls: left/right box walls + top lid
- Electrostatic chuck (bottom): cylinder pedestal with wafer disc on top (face-up)
- Gas inlet (top-left): small nozzle
- Exhaust port (bottom-right): pump-out port

**Strike Phase (steps 0-39):**
- Plasma glow volume: semi-transparent purple ellipsoid, starts dim/small, expands + brightens
- ICP coil emissive glow pulses (RF energy coupling)
- Sparse initial ion particles appear

**Main Etch Phase (steps 40-159):**
- Full plasma glow (bright purple #A855F7)
- 40 ion trajectory particles flowing downward through sheath to wafer. Center-peaked density
- Particle speed maps to ion energy (bias power)
- Wafer surface film visibly thins
- Smaller green-tinted reactive species particles (chemical etch component)

**Over-etch + Ash Phase (steps 160-199):**
- Plasma color shifts from purple to pinkish-white (O2 ash)
- Ion particles slow down
- Film nearly gone, underlayer exposed (different color)

**GUI Overlay:**
- Phase banner (top center): phase name + color
- Etch profile inset (lower-right, 180×220px): 20 bars starting full, removed from top down. Profile angle visible as sidewall slope. Red "UNDERCUT" label if isotropic regime

Built with procedural geometry, no GLB. Same `propsRef` render-loop pattern.

## 5. Wafer Map & Metrics Display

### Wafer Die Map
Same 9×9 die grid with DIE_MASK. Four selectable metric layers:

| Metric | Color Map | Range | Spec |
|--------|-----------|-------|------|
| Etch Rate (nm/min) | blue→white→red | 150–300 | 220–255 |
| Selectivity (:1) | red→yellow→green | 5–25 | > 12 |
| CD Bias (nm) | green→white→red | -5 to +5 | -3 to +3 |
| Profile Angle (°) | red→yellow→green | 80–90 | > 87 |

Accent color: purple #A855F7, borders `rgba(168, 85, 247, 0.2)`.

### Trend Sparkline
- X-axis: step index (0-199)
- Two phase divider lines at step 40 (labeled "Main Etch") and step 160 (labeled "Over-etch")
- Spec limits as horizontal dashed red lines
- Area fill below trend line

### Page Layout (3 horizontal zones)
1. **Top**: TimelineBar — back button (← to /mes/fab-floor/etching), play/pause/step/reset, phase indicator: purple=Strike, violet=Main Etch, pink=Over-etch, speed control
2. **Middle**: Split panels — left: ICP chamber scene + etch profile inset, right: wafer die map + trend sparkline
3. **Bottom**: ParameterPanel (8 sliders + 6 preset buttons)

Background gradient: `rgba(168, 85, 247, 0.10)`.

## 6. What-If Presets (6 Scenarios)

| Preset | Trigger | Physics Effect | Visual Signal |
|--------|---------|---------------|---------------|
| Plasma Non-uniformity | ICP power +30%, pressure -40% | Center-peaked flux amplified, edge starved, uniformity >5% | Plasma glow brighter center, etch rate map red center/blue edge |
| Ion Bombardment Damage | Bias power +80% | Ion energy too high, profile bowing, roughness spikes | Particles faster, profile barrel shape, roughness map red |
| Micro-loading | trenchWidth -50%, aspectRatio +60% | Dense features deplete reactants, etch rate drops, CD bias drifts | Profile inset slows, CD bias map shifts |
| Polymer Buildup | O2 flow -70%, CF4 flow +20% | Sidewall polymer thickens, etch rate -30%, profile angle <85° | Tapered sidewalls in profile, etch rate trend drops |
| Selectivity Loss | pressure -50%, chuckTemp +25°C | Underlayer attacked, selectivity <10:1, resist erosion | Underlayer exposed, selectivity map red |
| Endpoint Drift | totalSteps +40, biasPower -30% | Over-etch extends, non-uniform clearing | Over-etch elongated, etch depth exceeds target |

Chinese labels: 電漿不均勻, 離子轟擊損傷, 微負載效應, 聚合物堆積, 選擇比喪失, 終點漂移

Each preset has `id`, `label`, `labelCN`, `color`, and `apply(params, stepIndex) => params`.

## 7. Back Button Retrofit

### TimelineBar backHref Prop (all 4 sims)

Add optional `backHref` prop to TimelineBar interface. When provided, render a Next.js `Link` with `ChevronLeft` icon as the first button before Play/Pause. Same 36×36 rounded-full styling.

**Files to modify:**
- `src/components/lens-sim/TimelineBar.tsx` — add backHref prop
- `src/components/dep-sim/TimelineBar.tsx` — add backHref prop
- `src/components/damascene-sim/TimelineBar.tsx` — add backHref prop
- `src/app/mes/fab-floor/lithography/lens-sim/page.tsx` — pass `backHref="/mes/fab-floor/lithography"`
- `src/app/mes/fab-floor/deposition/reactor-sim/page.tsx` — pass `backHref="/mes/fab-floor/deposition"`
- `src/app/mes/fab-floor/metallization/damascene-sim/page.tsx` — pass `backHref="/mes/fab-floor/metallization"`

New etch-sim TimelineBar and page.tsx get backHref built in from the start.

### Digital Twin Routes Update

Add to `src/lib/digital-twin-routes.ts`:
```typescript
etching: '/mes/fab-floor/etching/etch-sim',
```

No changes needed in FabFloorScene.tsx or ProcessHudPanel.tsx — they read DIGITAL_TWIN_ROUTES dynamically.

## 8. Testing Plan

TDD — one test file per physics module:

| Module | Tests | Key Assertions |
|--------|-------|----------------|
| `plasma-model.test.ts` | 4 | Electron density ∝ ICP power, ion flux positive, center > edge, gas ratio effect |
| `sheath-model.test.ts` | 4 | Sheath potential ∝ bias, ion energy range, angular spread vs pressure, low bias = low energy |
| `etch-profile.test.ts` | 5 | Anisotropic/tapered/isotropic regimes, etch depth monotonic, micro-loading effect |
| `thermal-model.test.ts` | 3 | Etch rate Arrhenius, selectivity vs temp, roughness vs ion energy |
| `wafer-metrics.test.ts` | 5 | All 4 maps valid, etch rate in spec at nominal, uniformity <5% |
| `simulation-engine.test.ts` | 6 | createSimulation, stepForward, phase transitions at 40/160, stepN, applyPreset, 200 steps cap |
| `presets.test.ts` | 6 | One per preset, verify param mutation and expected direction |

Total: ~33 tests across 7 test files. All pure TypeScript, no DOM/React dependencies.

UI component tests follow in the UI implementation phase.
