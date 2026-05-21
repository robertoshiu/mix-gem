# CMP Planarization Digital Twin — Design Document

> Date: 2026-05-21
> Process: Multi-Step Cu + Barrier CMP (Chemical Mechanical Planarization)
> Route: `/mes/fab-floor/cmp/planarization-sim`
> Library: `src/lib/cmp-sim/`

## 1. Architecture Overview

The planarization-sim follows the established digital twin pattern with the largest scope yet: 4 phases, 8 presets, 6 metrics, 10 parameters.

```
src/lib/cmp-sim/                         <- Physics engine (pure TS, no React)
  types.ts                                <- Interfaces: SimulationParams, StepState, etc.
  constants.ts                            <- CMP reference values, phase boundaries
  reynolds-flow.ts                        <- Radially-discretized Reynolds equation for slurry film
  slurry-chemistry.ts                     <- pH-dependent dissolution rate, abrasive transport
  contact-model.ts                        <- Greenwood-Williamson asperity + viscoelastic pad
  preston-removal.ts                      <- Preston MRR with pattern-dependent pressure (Winkler)
  thermal-model.ts                        <- Frictional heating from pad-wafer contact
  wafer-metrics.ts                        <- Orchestrator: 6 die-level maps
  simulation-engine.ts                    <- 200-step state machine, 4 phases
  presets.ts                              <- 8 what-if scenarios
  index.ts                                <- Barrel export
  __tests__/                              <- One test file per module (TDD)

src/components/cmp-sim/
  TimelineBar.tsx                         <- With backHref="/mes/fab-floor/cmp"
  ParameterPanel.tsx                      <- 10 sliders + 8 presets
  PlanarizeScene.tsx                      <- Babylon.js: 3D rotational + cross-section inset
  WaferMetricsPanel.tsx                   <- 6-metric die map + trend sparkline

src/app/mes/fab-floor/cmp/planarization-sim/page.tsx
```

Route: `/mes/fab-floor/cmp/planarization-sim`
Back button: -> `/mes/fab-floor/cmp` (via TimelineBar `backHref`)

## 2. Physics Models

### 2.1 Reynolds Flow (`reynolds-flow.ts`)

The slurry film between pad and wafer is modeled as a thin viscous film under the Reynolds lubrication equation, discretized radially (exploiting axial symmetry from dual rotation):

```
d/dr [r * h^3 * dp/dr] = 6*mu*r*omega*dh/dtheta + 12*mu*r*dh/dt
```

Simplification for browser: We discretize the wafer radius into 20 radial nodes (center -> edge). At each node:

- **Gap height** `h(r)` = pad deformation - wafer bow + asperity penetration depth
- **Effective velocity** `V(r) = r * (omega_wafer + omega_platen)` — increases linearly from center to edge
- **Pressure** `p(r)` solved via tridiagonal matrix (Thomas algorithm) — O(n) per step
- **Slurry film thickness** output per node, used by contact model

Pad grooves: Modeled as 4 concentric channels where pressure resets to atmospheric. Creates discontinuities in the pressure profile that redistribute slurry — this is what drives center-vs-edge non-uniformity.

### 2.2 Slurry Chemistry (`slurry-chemistry.ts`)

- **Chemical removal component:** Cu dissolution rate via `R_chem = k0 * exp(-Ea/RT) * [H+]^n` for acidic (Cu step) or `[OH-]^n` for alkaline (barrier step)
- **Abrasive transport:** Particle concentration depletes along flow direction (center -> edge for inward flow). Depletion factor: `C(r) = C0 * exp(-k_dep * r / Q)` where Q is flow rate
- **Passivation layer:** Cu forms a soft oxide layer (thickness proportional to pH). This layer is what gets mechanically removed — without it, pure mechanical polishing would scratch. Layer regrowth rate competes with removal rate.

### 2.3 Greenwood-Williamson Asperity Contact (`contact-model.ts`)

The pad surface is modeled as a statistical distribution of hemispherical asperities:

- **Asperity heights:** Gaussian distribution phi(z) with mean z_bar and std sigma_s derived from pad conditioning state
- **Real contact area** at separation d: `A_real = pi * eta * R_asp * integral_d^inf (z-d) * phi(z) dz` where eta = asperity density (slider), R_asp = tip radius
- **Contact pressure:** `P_contact = (4/3) * E* * eta * sqrt(R_asp) * integral_d^inf (z-d)^1.5 * phi(z) dz` where E* = composite elastic modulus
- **Key insight:** Real contact area is only ~0.1-1% of nominal area. This is why asperity density matters so much — it directly scales removal rate

The integrals are pre-computed as a lookup table (20 separation values) at init time, then interpolated per step. No runtime numerical integration.

### 2.4 Viscoelastic Pad Response

The pad doesn't respond instantly — it creeps under sustained load:

- **Kelvin-Voigt model:** `epsilon(t) = (sigma/E) * [1 - exp(-t/tau)]` where tau = relaxation time (~2-5s for polyurethane IC1000 pad)
- **Effect:** During ramp-up phase, contact area gradually increases as asperities deform. Steady state reached after ~3*tau. This is why Phase 0 (ramp-up) exists — the removal rate is unstable until the pad "seats"
- **Pad glazing preset:** Reduces sigma_s (asperity height variance) -> flatter pad -> less real contact -> removal rate drops

### 2.5 Preston Removal with Winkler Foundation (`preston-removal.ts`)

Combines everything into material removal:

- **Local pressure** at each radial node: `P(r) = P_contact(r) + P_fluid(r)` — asperity contact dominates at low speed, fluid pressure dominates at high speed (hydroplaning)
- **Preston equation:** `MRR(r) = k_p * P(r) * V(r)` where k_p differs per material (Cu: ~5e-14, barrier: ~1e-14, oxide: ~0.3e-14 cm^2/dyne)
- **Pattern-dependent Winkler:** Die-level step height modifies local pad deflection. High features -> more pressure -> faster removal (self-planarizing). Low features -> pad bridges over -> dishing

### 2.6 Thermal Model (`thermal-model.ts`)

- Frictional heat from pad-wafer contact raises local temperature
- Higher RPM -> more heating
- Temperature feeds back into Arrhenius chemistry rate

## 3. Simulation Engine

### 3.1 Phases

200 steps total, dt = 0.5s per step (100s total process time):

| Phase | Steps | Duration | Description |
|-------|-------|----------|-------------|
| `ramp-up` | 0-19 | 10s | Pad wetting, viscoelastic creep settling, slurry fills grooves. MRR ramps from 0 to steady-state. |
| `bulk-cu` | 20-119 | 50s | Acidic slurry (pH 4), high down-force. Cu removed at ~500 nm/min. Dishing begins as Cu clears in sparse areas first. |
| `barrier` | 120-169 | 25s | Slurry swap to alkaline (pH 10), reduced pressure. Ta/TaN removed at ~50 nm/min. Erosion accumulates in dense areas. Selectivity to oxide is critical. |
| `buff` | 170-199 | 15s | Ultra-low pressure (0.5 PSI), low speed. Surface roughness reduction, micro-scratch removal. Minimal material removal. |

### 3.2 Phase Transitions

At each boundary the engine applies a slurry swap — chemistry parameters (pH, abrasive concentration, k_p) switch to phase-appropriate values. The viscoelastic pad state carries over (no reset), but contact conditions change due to new pressure setpoint. This creates a visible transient in the metrics at each transition.

### 3.3 Types

```typescript
type ProcessPhase = 'ramp-up' | 'bulk-cu' | 'barrier' | 'buff';

interface SimulationParams {
  downForce: number;           // PSI (1-10, default 3)
  waferRpm: number;            // RPM (10-150, default 60)
  platenRpm: number;           // RPM (10-150, default 60)
  slurryFlow: number;          // mL/min (50-500, default 200)
  abrasiveConc: number;        // wt% (1-15, default 5)
  slurryPh: number;            // pH (2-12, default 4)
  padStiffness: number;        // MPa (10-100, default 50)
  asperityDensity: number;     // 1/mm^2 (100-2000, default 500)
  cuThickness: number;         // nm (500-2000, default 1000)
  patternDensity: number;      // % (10-90, default 50)
  totalSteps: number;
}

interface StepState {
  stepIndex: number;
  phase: ProcessPhase;
  timeSeconds: number;
  // Reynolds flow
  filmThickness: number[];       // 20 radial nodes
  fluidPressure: number[];       // 20 radial nodes
  // Contact
  realContactArea: number;       // fraction (0.001-0.01)
  padCreepStrain: number;        // viscoelastic state
  contactPressure: number[];     // 20 radial nodes
  // Removal
  removalRate: number;           // nm/min (aggregate)
  cuRemaining: number;           // nm
  barrierRemaining: number;      // nm
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

interface SimulationState {
  params: SimulationParams;
  steps: StepState[];
  currentIndex: number;
  totalSteps: number;
}

type WaferMetric = 'removalRate' | 'wiwnu' | 'dishing' | 'erosion' | 'roughness' | 'thickness';

type PresetId =
  | 'slurry-starvation'
  | 'pad-glazing'
  | 'over-polish'
  | 'downforce-imbalance'
  | 'retaining-ring-wear'
  | 'slurry-ph-drift'
  | 'hydroplaning'
  | 'pattern-density';
```

## 4. Babylon.js Scene — Split View

### 4.1 Main View: 3D Rotational CMP Machine

The macro scene shows a recognizable CMP tool from an angled perspective (~30 degrees from horizontal):

- **Platen** — Large rotating disc (bottom), textured with concentric pad grooves (4 rings). Rotation driven by omega_platen parameter. PBR material: dark polyurethane with subtle roughness
- **Wafer** — Smaller disc on top, held by carrier/retaining ring. Counter-rotates at omega_wafer. Surface color-mapped by phase: copper orange -> barrier grey -> oxide blue as layers are removed
- **Slurry** — Semi-transparent fluid layer between pad and wafer. Particle system for abrasive particles flowing radially. Flow density responds to slurry flow rate slider. Color shifts with pH (amber for acidic Cu step, blue-tint for alkaline barrier step)
- **Conditioner arm** — Rotating diamond disc that sweeps across pad (cosmetic, shows pad conditioning concept)
- **Retaining ring** — Visible annulus around wafer edge, subtle glow on the retaining-ring-wear preset

Camera: ArcRotateCamera with constrained beta (20-60 degrees from top). Slow auto-rotate disabled during user interaction.

### 4.2 Inset: Cross-Section Cutaway (bottom-right corner, ~30% viewport)

A 2D-style side view showing the pad-wafer interface at one radial slice:

- **Pad asperities** — Jagged surface profile generated from Gaussian distribution. Heights update with pad glazing / conditioning state
- **Slurry film** — Thin colored band between asperity tips and wafer. Thickness from Reynolds solver, visually exaggerated ~50x
- **Wafer layer stack** — Cu (orange) / barrier (grey) / oxide (blue) layers. Cu thins during bulk-cu phase, barrier thins during barrier phase. Dishing visible as Cu surface dipping below oxide in wide trenches
- **Contact points** — Bright dots where asperities touch wafer surface. Count reflects real contact area fraction
- **Pressure arrows** — Small downward arrows at contact points, sized by local pressure

The inset updates every step, driven by `propsRef` pattern (no React re-render of Babylon).

## 5. Presets

| ID | Label | Label (CN) | Color | Effect |
|----|-------|-----------|-------|--------|
| `slurry-starvation` | Slurry Starvation | Jiang Ye Ji E | `#EF4444` red | Flow rate -> 80 mL/min. Center dries, WIWNU spikes |
| `pad-glazing` | Pad Glazing | Yan Mo Dian Dun Hua | `#F59E0B` amber | Asperity density -> 150/mm^2, stiffness -> 20 MPa. MRR crashes |
| `over-polish` | Over-Polish | Guo Du Yan Mo | `#8B5CF6` purple | Extends bulk-cu phase +40 steps. Dishing & erosion explode |
| `downforce-imbalance` | Down-Force Imbalance | Xia Ya Li Bu Jun | `#EC4899` pink | Adds edge-heavy pressure gradient. Edge-fast, center residual |
| `retaining-ring-wear` | Retaining Ring Wear | Gu Ding Huan Mo Sun | `#F97316` orange | Edge exclusion widens, outer 2 die rings fail |
| `slurry-ph-drift` | Slurry pH Drift | pH Piao Yi | `#06B6D4` cyan | pH shifts +2 during barrier step. Selectivity loss, oxide attack |
| `hydroplaning` | Hydroplaning | Shui Mo Shang Fu | `#3B82F6` blue | Platen RPM -> 140, flow -> 450. Fluid lifts wafer off pad, MRR near-zero |
| `pattern-density` | Pattern Density Effect | Tu An Mi Du Xiao Ying | `#10B981` green | Density -> 85%. Dense areas erode, sparse areas dish |

## 6. Parameter Panel — 10 Sliders

| Group | Parameter | Unit | Range | Default |
|-------|-----------|------|-------|---------|
| Mechanical | Down-force pressure | PSI | 1-10 | 3 |
| Mechanical | Wafer rotation | RPM | 10-150 | 60 |
| Mechanical | Platen rotation | RPM | 10-150 | 60 |
| Fluid | Slurry flow rate | mL/min | 50-500 | 200 |
| Fluid | Abrasive concentration | wt% | 1-15 | 5 |
| Fluid | Slurry pH | - | 2-12 | 4 |
| Pad | Pad stiffness | MPa | 10-100 | 50 |
| Pad | Asperity density | /mm^2 | 100-2000 | 500 |
| Wafer | Cu thickness | nm | 500-2000 | 1000 |
| Wafer | Pattern density | % | 10-90 | 50 |

## 7. Testing Strategy

One test file per physics module:

| Test file | Key assertions |
|-----------|---------------|
| `reynolds-flow.test.ts` | Film thickness positive at all nodes; pressure drops across pad grooves; hydroplaning threshold at high RPM; conservation of flow |
| `slurry-chemistry.test.ts` | Dissolution rate increases with temperature (Arrhenius); abrasive depletes center->edge; passivation thickness scales with pH |
| `contact-model.test.ts` | Real contact area 0.1-1% of nominal; Greenwood-Williamson integral matches analytical limit; viscoelastic creep reaches steady state after 3*tau; pad glazing reduces contact area |
| `preston-removal.test.ts` | MRR scales linearly with P*V; Cu rate > barrier rate > oxide rate; Winkler: high features remove faster; dishing increases with over-polish time |
| `thermal-model.test.ts` | Frictional heat raises temperature; higher RPM -> more heating; temperature affects chemistry rate |
| `wafer-metrics.test.ts` | All 6 maps have correct die count; WIWNU computed as sigma/mu*100; dishing only on Cu-over-trench dies; erosion only on dense-pattern dies |
| `presets.test.ts` | Each preset modifies expected parameters; round-trip: apply then check param values |
| `simulation-engine.test.ts` | 200 steps complete without error; phase transitions at correct indices; slurry swap changes chemistry; buff phase has minimal removal |

## 8. Scope Boundaries

**In scope:**
- 6 physics modules, 4 components, 8 test files, 1 page route
- Pure client-side simulation, procedural Babylon.js geometry
- Back button via TimelineBar backHref

**Not in scope:**
- No backend / WebSocket
- No GLB models — fully procedural geometry
- No shared state with damascene-sim
- No persistence — reset on page leave

## 9. Summary

| Metric | Count |
|--------|-------|
| Physics modules | 6 |
| Components | 4 |
| Test files | 8 |
| Presets | 8 |
| Sliders | 10 |
| Die-level metrics | 6 |
| Phases | 4 |
| Total steps | 200 |
| Estimated source files | ~23 |
