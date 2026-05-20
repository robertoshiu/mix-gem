# Deposition Reactor Digital Twin — Design Document

> Date: 2026-05-20
> Chemistry: SiO2 BDEAS/O3 ALD
> Route: `/mes/fab-floor/deposition/reactor-sim`
> Library: `src/lib/dep-sim/`

## 1. Architecture Overview

The deposition reactor sim follows the same architecture as lens-sim:

```
src/lib/dep-sim/              <- Physics engine (pure TS, no React)
  types.ts                     <- Interfaces: SimulationParams, CycleState, WaferState
  constants.ts                 <- SiO2 BDEAS/O3 reference values, ALD window bounds
  langmuir.ts                  <- Langmuir adsorption isotherm
  growth-model.ts              <- GPC calculation, film thickness per cycle
  reactor-flow.ts              <- Gas residence time, precursor delivery, ozone decomposition
  thermal-model.ts             <- Arrhenius kinetics, ALD window enforcement
  wafer-metrics.ts             <- Orchestrator: thickness map, uniformity, roughness, RI
  simulation-engine.ts         <- Cycle-by-cycle state machine
  presets.ts                   <- 5 what-if scenarios
  index.ts                     <- Barrel export
  __tests__/                   <- One test file per module (TDD)

src/app/mes/fab-floor/deposition/reactor-sim/page.tsx   <- UI page
src/components/dep-sim/        <- React components (scene, wafer map, timeline, params)
```

Key difference from lens-sim: the simulation steps by ALD cycle (not wafer). A cycle = 4 phases: BDEAS pulse -> purge -> O3 pulse -> purge. The timeline shows cycle count (e.g., 0-200 cycles for ~120A SiO2 film).

## 2. Physics Models

### Langmuir Adsorption (`langmuir.ts`)
- Surface coverage: theta = K*P*t / (1 + K*P*t) where K is adsorption equilibrium constant, P is precursor partial pressure, t is pulse time
- Self-limiting behavior: theta saturates -> 1.0 as exposure dose increases
- Two separate calculations: BDEAS adsorption (half-cycle A) and O3 oxidation (half-cycle B)
- Output: surface coverage fraction (0-1) for each half-cycle

### Growth Model (`growth-model.ts`)
- GPC = GPC_max * theta_A * theta_B -- growth per cycle depends on both half-cycle coverages
- GPC_max for SiO2 BDEAS/O3 ~ 0.6 A/cycle at saturation
- Cumulative film thickness = sum of GPC over all cycles
- Radial non-uniformity modeled as center-to-edge coverage gradient (showerhead flow profile)

### Reactor Flow (`reactor-flow.ts`)
- Residence time tau = V_chamber / Q_flow -- determines precursor utilization
- Ozone-specific: O3 decomposes thermally (half-life drops with temperature), so effective O3 concentration = f(T_pedestal, tau)
- Purge efficiency: residual precursor fraction = exp(-t_purge / tau) -- incomplete purge -> CVD parasitic reactions

### Thermal Model (`thermal-model.ts`)
- ALD window: 100-300 degC. Below -> condensation/physisorption. Above -> precursor decomposition
- Arrhenius rate constant for surface reaction: k = A*exp(-Ea/RT)
- Outside the window: GPC deviates from ideal, roughness increases

### Wafer Metrics (`wafer-metrics.ts`)
- Orchestrates all models per cycle, outputs 4 die-level maps:
  - **Thickness** (A) -- cumulative film, primary metric
  - **Uniformity** (%) -- within-wafer 1-sigma/mean
  - **Roughness** (A RMS) -- increases with parasitic CVD or decomposition
  - **Refractive Index** -- stoichiometry indicator (ideal SiO2 ~ 1.46 @ 633nm)

## 3. Simulation Engine

Cycle state machine (immutable, same pattern as lens-sim):

- `createSimulation(params)` -> fresh state with cycle count = 0
- `stepCycle(state)` -> advance one full ALD cycle (4 phases), returns new state
- `stepN(state, n)` -> batch-step N cycles (for fast-forward)
- `applyPreset(state, presetId)` -> mutate params mid-run for what-if scenarios

```typescript
interface SimulationParams {
  bdeasFlowRate: number;     // sccm
  bdeasPulseTime: number;    // seconds
  o3FlowRate: number;        // sccm
  o3PulseTime: number;       // seconds
  purgeTime: number;         // seconds
  pedestalTemp: number;      // degC
  chamberPressure: number;   // Torr
  carrierGasFlow: number;    // sccm (N2)
  totalCycles: number;       // target cycle count (e.g. 200)
}

interface CycleState {
  cycleIndex: number;
  phase: 'bdeas-pulse' | 'purge-a' | 'o3-pulse' | 'purge-b';
  coverageA: number;         // BDEAS surface coverage theta_A
  coverageB: number;         // O3 oxidation coverage theta_B
  gpc: number;               // A this cycle
  cumulativeThickness: number; // A total
  thicknessMap: number[];    // per-die thickness
  roughnessMap: number[];    // per-die roughness
  riMap: number[];           // per-die refractive index
  uniformity: number;        // % 1-sigma/mean
}
```

Timeline granularity: Each `stepCycle` produces one `CycleState`. At 200 target cycles, this gives 200 data points. The timeline bar shows cycle progress with phase indicators (color-coded: blue=BDEAS, gray=purge, orange=O3).

## 4. 3D Visualization (Babylon.js)

### Left Panel -- Reactor Chamber Cross-Section
- **Showerhead** (top): perforated plate with gas inlet ports. During pulse phases, animated particle streamlines flow downward -- blue particles for BDEAS, orange for O3, no particles during purge
- **Wafer on pedestal** (bottom): heated chuck with temperature glow (color maps to pedestal temp). The wafer surface shows a thin film layer that visibly grows cycle-by-cycle
- **Exhaust port** (side): particles exit during purge phases
- **Gas phase indicators**: floating labels show current precursor partial pressure, residence time, and O3 concentration
- **Phase banner**: top of scene shows current phase with color (BDEAS pulse / Purge / O3 pulse / Purge) cycling in real-time

Built with procedural geometry (rectangles, circles, particle systems) -- no GLB needed. Same `propsRef` pattern as EdaPipelineScene for render-loop updates.

### Right Panel -- Surface Adsorption Inset
- Grid of adsorption sites (e.g., 20x20 cells)
- Each cell color represents surface coverage: empty (dark) -> occupied (bright cyan for BDEAS chemisorbed, bright orange after O3 oxidation)
- Coverage fills progressively during pulse phase, showing the Langmuir saturation visually -- fast fill at start, slowing as sites fill up
- After a complete cycle, all sites dim slightly and a new monolayer "locks in" -- film thickness counter increments
- Implemented as Canvas2D overlay for simplicity and performance

## 5. Wafer Map & Metrics Display

### Wafer Die Map
- Same die grid layout as lens-sim (row-major flat array)
- Color-mapped per die, metric selectable via toggle buttons:
  - **Thickness** (A) -- blue-to-red gradient, target +/-2% of nominal
  - **Uniformity** (%) -- green-to-yellow-to-red, spec < 2% 1-sigma
  - **Roughness** (A RMS) -- green-to-red, spec < 3A
  - **Refractive Index** -- narrow band around 1.46 +/-0.02

### Trend Chart
- Below the wafer map: a small sparkline showing the selected metric's evolution across cycles (x-axis = cycle number, y-axis = metric value)
- Highlights the moment a what-if preset kicks in (vertical marker line)
- Shows spec limits as dashed horizontal lines

### Page Layout (3 horizontal zones):
1. **Top**: Timeline bar (cycle progress, play/pause/step, speed control, phase indicator)
2. **Middle**: Split panels -- left: reactor scene + surface inset, right: wafer map + trend chart
3. **Bottom**: Parameter panel with sliders + preset buttons

## 6. What-If Presets (5 Scenarios)

| Preset | Trigger | Physics Effect | Visual Signal |
|--------|---------|---------------|---------------|
| Precursor Starvation | BDEAS flow drops 60% | theta_A drops below saturation, GPC falls, edge dies starve first | Blue particles thin out, surface coverage patchy |
| Purge Leak-Through | Purge time cut to 30% | Residual BDEAS meets O3, gas-phase CVD reaction, rough film, particles | Both colored particles appear simultaneously, roughness spikes red |
| Temperature Excursion | Pedestal temp +80 degC above window | BDEAS decomposes in gas phase, uncontrolled deposition, carbon contamination | Pedestal glows hot red, GPC jumps, RI deviates from 1.46 |
| O3 Generator Degradation | O3 concentration decays 5%/cycle | Incomplete oxidation, sub-stoichiometric SiOx, low RI, poor film quality | Orange particles fade progressively, RI map drifts blue |
| Chamber Seasoning Drift | GPC offset for first 20 cycles | Fresh chamber walls compete for precursor, thickness ramp-up before steady state | Trend chart shows characteristic GPC rise, first-wafer effect |

Each preset has `id`, `label`, `labelCN` (Chinese), `color`, and an `apply(params, cycleIndex) => params` function -- identical interface to lens-sim presets.

## 7. Entry Points from Fab Floor

### Babylon.js Scene Badge
- Process stations with a digital twin (lithography, deposition) get a floating animated icon -- a small pulsing diamond with a "DT" label
- Badge uses `ActionManager.OnPickTrigger` -- clicking navigates to the sub-route via Next.js `router.push()`
- Badge color matches process color (cyan for lithography, blue for deposition)
- Subtle glow animation (sinusoidal alpha) to draw attention

### HUD Panel Button
- `ProcessHudPanel` conditionally renders an "Open Digital Twin" button when selected process has a sim route
- Lookup map: `DIGITAL_TWIN_ROUTES: Partial<Record<ProcessId, string>>`
  - `lithography: '/mes/fab-floor/lithography/lens-sim'`
  - `deposition: '/mes/fab-floor/deposition/reactor-sim'`
- Button styled as CTA with process color, bilingual label ("Digital Twin / Digital Twin")

### Implementation scope:
- Modify `FabFloorScene.tsx` -- add badge meshes for processes with sims
- Modify `ProcessHudPanel.tsx` -- add conditional DT button
- New constant: `DIGITAL_TWIN_ROUTES` in fab-process-data or separate file

## 8. Testing Plan

TDD -- one test file per physics module, tests written before implementation:

| Module | Tests | Key Assertions |
|--------|-------|----------------|
| `langmuir.test.ts` | 5 | theta=0 at zero dose, theta->1.0 at saturation, monotonic increase, self-limiting behavior, temperature dependence via K |
| `growth-model.test.ts` | 4 | GPC = GPC_max when both theta=1, GPC=0 when either theta=0, cumulative thickness sums correctly, radial non-uniformity gradient |
| `reactor-flow.test.ts` | 4 | Residence time = V/Q, O3 decomposition increases with temperature, purge efficiency exponential decay, incomplete purge returns residual >0 |
| `thermal-model.test.ts` | 4 | GPC nominal inside ALD window, GPC deviates below 100 degC, GPC deviates above 300 degC, Arrhenius rate increases with temperature |
| `wafer-metrics.test.ts` | 5 | Orchestrates all models, outputs all 4 maps, thickness within spec at nominal, roughness increases with parasitic CVD, RI ~1.46 at stoichiometric |
| `simulation-engine.test.ts` | 6 | createSimulation returns initial state, stepCycle advances index, 200 cycles produces ~120A, applyPreset modifies params, stepN batch steps, phases rotate |
| `presets.test.ts` | 5 | One test per preset verifying param mutation and expected physics impact |

Total: ~33 tests across 7 test files. All pure TypeScript, no DOM/React dependencies.

UI component tests (scene, wafer map, timeline) follow in the UI implementation phase.
