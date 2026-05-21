# Oxidation FEA Digital Twin — Design Document

> Date: 2026-05-22
> Route: `/mes/fab-floor/oxidation/oxidation-sim`
> Status: Approved

## 1. Overview

Thermal oxidation digital twin coupling three physics domains in a per-step feedback loop:

```
Thermal FEA --> Deal-Grove Oxidation --> Viscoelastic Stress --> (Kao feedback into oxidation rate)
```

Supports 6 oxidation ambient types, 3 wafer geometries (blanket, LOCOS, STI), 14 user-tunable parameters, 12 presets, and 8 tracked metrics. Babylon.js 3D extruded cross-section wedge visualization with Canvas2D profile panel.

## 2. File Structure

```
src/lib/oxidation-sim/
  types.ts              -- All interfaces, enums, unions
  constants.ts          -- Physical constants, Deal-Grove coefficients, param bounds
  thermal-fea.ts        -- 2D FEA heat equation solver (depth x radial)
  deal-grove.ts         -- Linear-parabolic oxidation model for 6 ambient types
  stress-model.ts       -- Viscoelastic stress with CTE mismatch + volume expansion
  kao-feedback.ts       -- Stress-dependent oxidation rate correction
  mesh-templates.ts     -- 3 pre-built structured meshes (blanket, LOCOS, STI)
  wafer-metrics.ts      -- 8 derived metrics from simulation state
  presets.ts            -- 12 presets with apply() pattern
  simulation-engine.ts  -- createSimulation / stepForward / stepN / applyPreset
  index.ts              -- Barrel exports

src/lib/oxidation-sim/__tests__/
  thermal-fea.test.ts
  deal-grove.test.ts
  stress-model.test.ts
  kao-feedback.test.ts
  mesh-templates.test.ts
  wafer-metrics.test.ts
  presets.test.ts
  simulation-engine.test.ts

src/components/oxidation-sim/
  TimelineBar.tsx        -- Playback controls + back button
  ParameterPanel.tsx     -- 14 sliders/dropdowns with conditional visibility
  OxidationScene.tsx     -- Babylon.js 3D extruded cross-section wedge
  ProfilePanel.tsx       -- Canvas2D time-series for 8 metrics

src/app/mes/fab-floor/oxidation/oxidation-sim/page.tsx
```

Total: ~26 files (11 lib + 8 tests + 4 components + 1 page + 1 barrel + 1 route update).

## 3. Physics Engine -- Thermal FEA

`thermal-fea.ts` solves the 2D heat equation on a structured mesh using implicit finite differences (Crank-Nicolson):

```
rho*Cp * dT/dt = div(k * grad(T)) + Q_oxidation
```

### Mesh

Each of the 3 geometry templates defines a 2D grid of nodes (depth z x radial r). Typical size ~20x20 = 400 nodes. Node spacing is non-uniform -- finer near surfaces, interfaces, and trench corners.

### Boundary Conditions

- **Top surface**: Radiative + convective heat transfer from lamp array. Lamp power split by `lampBalance` parameter (center vs edge %).
- **Bottom surface**: Chuck contact -- fixed temperature or thermal resistance.
- **Radial edges**: Adiabatic (symmetry at center, insulated at edge).
- **Material interfaces** (Si/SiO2/Si3N4): Continuity of temperature, discontinuity of heat flux weighted by conductivity ratio.

### Heat Source

Oxidation is exothermic. `Q_oxidation` at each node in the active oxidation zone is derived from the local oxidation rate x enthalpy of reaction (~3.6 eV/molecule for dry, ~1.6 eV for wet). This couples the thermal solver back to Deal-Grove.

### Material Properties (temperature-dependent)

| Material | k (W/m*K)         | rho*Cp (J/m^3*K) |
|----------|-------------------|-------------------|
| Si       | 150/(T/300)^1.3   | 1.63e6            |
| SiO2     | 1.4               | 1.65e6            |
| Si3N4    | 30                | 2.1e6             |

### Output

Temperature field T(r,z) across all mesh nodes, plus center/mid/edge scalar values for the metrics panel.

## 4. Physics Engine -- Deal-Grove Oxidation Model

`deal-grove.ts` implements the linear-parabolic growth law for all 6 oxidation types:

```
x^2 + Ax = B(t + tau)
```

Where `x` is oxide thickness, `A = 2D/k_s` (linear regime), `B = 2DC*/N1` (parabolic regime), and `tau` accounts for initial oxide. Solving the quadratic gives oxide thickness at each time step.

### Rate Constants (Arrhenius)

```
B/A = C1 * exp(-E1/kT)    -- linear rate (surface reaction limited)
B   = C2 * exp(-E2/kT)    -- parabolic rate (diffusion limited)
```

### 6 Ambient Types

| Type       | B/A prefactor    | E1 (eV) | B prefactor     | E2 (eV) | Notes                            |
|------------|------------------|----------|-----------------|----------|----------------------------------|
| Dry O2     | 3.71e6 nm/s      | 2.00     | 7.72e2 nm^2/s   | 1.23     | Gate oxide baseline              |
| Wet O2     | 9.70e7 nm/s      | 2.05     | 3.86e2 nm^2/s   | 0.78     | ~10x faster than dry             |
| N2O        | 1.5e6 nm/s       | 2.00     | 3.0e2 nm^2/s    | 1.20     | Nitrogen incorporation limits    |
| Pyrogenic  | 8.5e7 nm/s       | 2.05     | 3.5e2 nm^2/s    | 0.78     | Similar to wet, cleaner          |
| HCl-doped  | 3.71e6*(1+10*%HCl) | 2.00   | 7.72e2*(1+5*%HCl) | 1.23   | Enhanced dry with gettering      |
| HIBOX      | 3.71e6*P nm/s    | 2.00     | 7.72e2*P^2 nm^2/s | 1.23   | Pressure-scaled dry              |

### Orientation Dependence

B/A is multiplied by an orientation factor -- (111) oxidizes ~1.68x faster than (100) due to higher surface atom density. B is orientation-independent.

### Per-Step Operation

For each surface node, read local T from thermal FEA, compute B/A and B, advance oxide thickness by dt using the analytical Deal-Grove solution, output local oxidation rate for the thermal source term and stress model.

## 5. Physics Engine -- Stress Model & Kao Feedback

### Thermal Stress

CTE mismatch between materials during heating/cooling:

```
sigma_thermal = E * delta_alpha * delta_T / (1 - nu)
```

| Material | CTE (1/K) | Young's E (GPa) | Poisson nu |
|----------|-----------|------------------|------------|
| Si       | 2.6e-6    | 130              | 0.28       |
| SiO2     | 0.5e-6    | 72               | 0.17       |
| Si3N4    | 3.2e-6    | 270              | 0.27       |

### Volume Expansion Stress

Si to SiO2 conversion expands by 2.2x. Growing oxide is constrained by surrounding material, generating compressive stress in oxide and tensile stress at Si/SiO2 interface. Modeled as mismatch strain of ~0.44 (= 1 - 1/2.2) applied to newly-oxidized nodes each step.

### Viscoelastic Relaxation

SiO2 flows viscously at high temperature:

```
eta(T) = eta_0 * exp(E_visc / kT)     // eta_0 ~ 4.6e-15 Pa*s, E_visc ~ 5.2 eV
```

Each step, stress in oxide nodes relaxes: `sigma(t+dt) = sigma(t) * exp(-dt*E/(eta*(1-nu)))`. At 1000C relaxation time ~minutes; at 1150C ~seconds.

### Kao Feedback (`kao-feedback.ts`)

Modifies Deal-Grove rates based on local interface stress:

```
B/A_eff = (B/A) * exp(-sigma_n * V_a / kT)
B_eff   = B * exp(-sigma_n * V_d / kT)
```

Where `sigma_n` is normal stress at Si/SiO2 interface, `V_a ~ 0.01 nm^3` (activation volume for surface reaction), `V_d ~ 0.005 nm^3` (for diffusion). Compressive stress retards oxidation -- this creates the bird's beak taper under nitride edges and slows oxidation at STI trench corners.

### Output

Von Mises stress field sigma(r,z), peak stress scalar, trench corner stress factor, bird's beak length (distance from nitride edge where oxide thickness drops to 50% of field value).

## 6. Mesh Templates & Geometry

`mesh-templates.ts` provides 3 pre-built structured meshes parameterized by user inputs.

### Blanket Mesh (~20r x 20z = 400 nodes)

- Radial: 20 nodes from center (r=0) to edge (r=150mm), cosine-spaced (denser at edge)
- Depth: 20 nodes from surface to 2um deep, geometric spacing (finer near surface)
- Materials: Optional initial SiO2 layer, rest is Si

### LOCOS Mesh (~25r x 20z = 500 nodes)

- Same radial/depth base as blanket
- Adds Si3N4 mask region: width from `nitrideMaskWidth` param (200-2000nm), thickness 150nm
- 5 extra radial nodes clustered at nitride edge to resolve bird's beak
- Oxide grows from exposed Si and creeps under nitride

### STI Mesh (~25r x 25z = 625 nodes)

- Extends LOCOS mesh with pre-etched trench
- Trench defined by `trenchDepth` (100-500nm) and `trenchWidth` (50-500nm)
- 5 extra depth nodes clustered at trench bottom corners for stress concentration
- Si substrate with trench cavity, optional thin liner oxide, Si3N4 hardmask on top

### Interface

```typescript
interface FEAMesh {
  nodes: FEANode[];        // {r, z, material, T, stress, oxideThickness}
  elements: FEAElement[];  // quad elements referencing 4 node indices
  nr: number;              // radial node count
  nz: number;              // depth node count
}

function createMesh(geometry: GeometryType, params: SimulationParams): FEAMesh;
```

Mesh generated once at `createSimulation()` and reused for all steps. Node positions fixed -- only field values update.

## 7. Simulation Engine & Step API

Same API pattern as diffusion-sim:

```typescript
createSimulation(params?: Partial<SimulationParams>): SimulationState
stepForward(state: SimulationState): SimulationState
stepN(state: SimulationState, n: number): SimulationState
applyPreset(state: SimulationState, id: PresetId): SimulationState
```

### Per-Step Physics Loop

```
1. Thermal FEA:   T(r,z)  <-- solve heat equation with current Q_oxidation
2. Deal-Grove:    dx(r,z) <-- compute oxide growth from T(r,z) + Kao-modified rates
3. Stress update: sigma(r,z) <-- thermal stress + volume expansion - viscous relaxation
4. Kao feedback:  store sigma_n at interfaces --> used by Deal-Grove next step
5. Metrics:       extract 8 scalar metrics from fields
6. Snapshot:      push StepState to steps[]
```

### Solver State (WeakMap cached)

```typescript
interface SolverState {
  mesh: FEAMesh;
  oxideThickness: number[];     // per-surface-node
  interfaceStress: number[];    // sigma_n at Si/SiO2 per node
  oxidationRate: number[];      // Q_oxidation source term per node
  temperature: number;          // representative wafer temperature
  time: number;
  thermalBudget: number;
}
```

### Timing

`totalSteps` defaults to 200. dt derived from `soakTime / totalSteps` with ramp/cool phases proportionally allocated. Each step ~1-3ms on 400-625 node mesh.

## 8. Types & Parameters

### Type Unions

```typescript
type OxidationType = 'dry' | 'wet' | 'n2o' | 'pyrogenic' | 'hcl' | 'hibox';
type GeometryType = 'blanket' | 'locos' | 'sti';
type SubstrateOrientation = '100' | '110' | '111';
type ThermalPhase = 'ramp' | 'soak' | 'cool';

type OxidationMetric =
  | 'oxideThickness' | 'temperature' | 'peakStress'
  | 'birdBeakLength' | 'oxidationRate' | 'oxideUniformity'
  | 'trenchCornerStress' | 'thermalBudget';

type PresetId =
  | 'dry-gate-oxide' | 'wet-field-oxide' | 'pad-oxide'
  | 'locos-isolation' | 'sti-liner' | 'n2o-oxynitride'
  | 'pyrogenic-wet' | 'hcl-gettering' | 'hibox-thick'
  | 'thermal-stress-overshoot' | 'edge-nonuniformity'
  | 'ultra-thin-rto';
```

### 14 User-Facing Parameters

| # | Key                    | Range         | Default | Unit      | Conditional        |
|---|------------------------|---------------|---------|-----------|--------------------|
| 1 | peakTemperature        | 700-1200      | 1000    | C         | --                 |
| 2 | rampRate               | 1-200 (log)   | 10      | C/s       | --                 |
| 3 | soakTime               | 0.1-7200 (log)| 1800    | s         | --                 |
| 4 | coolingRate             | 1-200 (log)   | 10      | C/s       | --                 |
| 5 | oxidationType          | 6 values      | dry     | --        | --                 |
| 6 | geometryType           | 3 values      | blanket | --        | --                 |
| 7 | pressure               | 1-25          | 1       | atm       | active for hibox   |
| 8 | hclConcentration       | 0-10          | 3       | %         | active for hcl     |
| 9 | initialOxideThickness  | 0-100         | 0       | nm        | --                 |
| 10| substrateOrientation   | 3 values      | 100     | --        | --                 |
| 11| nitrideMaskWidth       | 200-2000      | 500     | nm        | locos/sti only     |
| 12| trenchDepth            | 100-500       | 300     | nm        | sti only           |
| 13| trenchWidth            | 50-500        | 200     | nm        | sti only           |
| 14| lampBalance            | 50-100        | 85      | % center  | --                 |

## 9. Presets

| # | PresetId                  | Oxidation  | Geometry | Key Settings                  | Showcase                    |
|---|---------------------------|------------|----------|-------------------------------|-----------------------------|
| 1 | dry-gate-oxide            | dry        | blanket  | 1000C, 30min, 1atm           | Thin ~10nm gate oxide       |
| 2 | wet-field-oxide           | wet        | blanket  | 1050C, 60min                 | Thick ~500nm field oxide    |
| 3 | pad-oxide                 | dry        | blanket  | 900C, 10min                  | Thin ~5nm protective layer  |
| 4 | locos-isolation           | wet        | locos    | 1000C, 45min, 500nm mask     | Bird's beak formation       |
| 5 | sti-liner                 | dry        | sti      | 1050C, 15min, 300nm trench   | Trench corner stress        |
| 6 | n2o-oxynitride            | n2o        | blanket  | 1050C, 20min                 | Nitrogen-limited thin oxide |
| 7 | pyrogenic-wet             | pyrogenic  | blanket  | 1000C, 30min                 | Clean thick oxide           |
| 8 | hcl-gettering             | hcl        | blanket  | 1100C, 45min, 3% HCl        | Mobile ion gettering        |
| 9 | hibox-thick               | hibox      | blanket  | 950C, 20min, 10atm           | Rapid thick oxide at lower T|
| 10| thermal-stress-overshoot  | dry        | sti      | 200C/s ramp, 1150C           | High ramp transient stress  |
| 11| edge-nonuniformity        | wet        | blanket  | 1000C, lampBalance=60%       | Deliberate center-edge dT   |
| 12| ultra-thin-rto            | dry        | blanket  | 1050C, 5s soak, 150C/s ramp  | Sub-3nm RTO gate oxide      |

Each preset includes `label` (English), `labelCN` (Chinese), and `color` (UI chip), matching the diffusion-sim `Preset` interface.

## 10. Babylon.js Scene & UI Components

### OxidationScene.tsx (left 70%)

- **Wedge geometry**: 15 degree arc slice of wafer, ~50mm radial span, extruded to show depth. PBR material with emissive overlay driven by field data.
- **Material layers**: Si (dark blue-grey), SiO2 (amber/gold, grows each step), Si3N4 (green, static). Layer boundaries update each step by moving vertex positions of the oxide front mesh.
- **Color overlays** (user-togglable): Temperature (blue to red), von Mises stress (green to yellow to red), oxidation rate (dark to bright). Applied as vertex colors, interpolated across elements.
- **Bird's beak / trench detail**: When geometry is LOCOS or STI, camera auto-zooms to feature region. Oxide front visually creeps under nitride edge or rounds trench corner.
- **GLB fallback pattern**: Procedural geometry by default, consistent with all other sims.

### ProfilePanel.tsx (right 30%)

- 8 metrics selectable via dropdown
- Line chart with step index on X-axis, metric value on Y-axis
- For radial metrics (oxide thickness, temperature), shows 3 traces: center/mid/edge

### TimelineBar.tsx

- Play/pause/step/seek/reset controls
- `backHref="/mes/fab-floor/oxidation"` for the back button

### ParameterPanel.tsx

- Sliders for continuous params, dropdowns for enums
- Conditional visibility: params #7-8 and #11-13 show/hide with CSS transition based on oxidationType and geometryType
- Preset chips row at bottom

## 11. Route Integration & Navigation

### New Route

`src/app/mes/fab-floor/oxidation/oxidation-sim/page.tsx` -- same structure as diffusion-sim page with dynamic imports, state management, interval-driven playback.

### Entry Point

Add `simHref?: string` field to `FabProcess` interface in `fab-process-data.ts`. When present, ProcessDashboard renders a "Launch Digital Twin" button in the header. Populate for oxidation and retroactively for all existing sims.

### Route Map

```
/mes/fab-floor                         --> FabFloorScene (8 process stations)
/mes/fab-floor/oxidation               --> ProcessDashboard + "Launch Digital Twin" button
/mes/fab-floor/oxidation/oxidation-sim --> OxidationSimPage
    Back button --> /mes/fab-floor/oxidation
```

## 12. Testing Strategy

~70 tests across 8 test files:

- **thermal-fea.test.ts** (~10): Steady-state uniform T, edge roll-off, interface continuity, energy conservation, nonlinear conductivity
- **deal-grove.test.ts** (~10): Known dry/wet thicknesses, linear/parabolic regimes, orientation factor, pressure scaling, tau correction
- **stress-model.test.ts** (~10): Zero stress baseline, compressive in oxide, tensile at interface, viscous relaxation, trench corner concentration
- **kao-feedback.test.ts** (~6): Zero stress passthrough, compressive retardation, bird's beak taper, exponential suppression
- **mesh-templates.test.ts** (~8): Node counts, edge clustering, trench corners, valid quads, parameterized positions
- **wafer-metrics.test.ts** (~8): Finite values, zero uniformity for uniform T, zero bird's beak for blanket, corner factor > 1 for STI
- **presets.test.ts** (~8): Valid params for all 12, correct oxidationType/geometryType, pure apply()
- **simulation-engine.test.ts** (~10): Initial state, step advancement, monotonic oxide growth, thermal phases, preset application, stepN identity
