# Lithography Lens Heating + Immersion Fluid Digital Twin

> Date: 2026-05-19
> Status: Approved (brainstorm complete)

## Overview

Semi-quantitative physics simulation for DUV ArFi (193nm immersion) scanners, visualizing how lens thermal absorption and immersion water dynamics affect wafer-level CD, overlay, LER, and defectivity during lot exposure. Built as a Babylon.js interactive digital twin within the equipment-monitor dashboard.

**Route:** `/mes/fab-floor/lithography/lens-sim`

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Location | Sub-route under `/mes/fab-floor/lithography` | Part of the 8-process fab floor hierarchy |
| Layout | Horizontal split-screen (lens cross-section + wafer map) | Cross-section shows physics, wafer map shows consequence |
| Platform | DUV ArFi 193nm immersion | Richest physics case: both lens heating and fluid dynamics |
| Fidelity | Semi-quantitative | Real Zernike coefficients and Sellmeier model, synthetic but bounded to published ArFi ranges |
| Interaction | Auto-play lot with parameter override | Time-lapse exposure + "what-if" sandbox via sliders |
| Wafer metrics | Full quad-metric (CD, Overlay, LER, Defectivity) | CD/Overlay from lens heating, Defectivity from fluid, LER from stochastic dose margin |

---

## 1. Page Layout

```
+-------------------------------------------------------------+
|  Top Bar: timeline scrubber + lot progress (Wafer 1/25)     |
+----------------------------+--------------------------------+
|                            |                                |
|   Lens Cross-Section       |    Wafer Impact Map            |
|   (Babylon.js 3D)          |    (Babylon.js 2D/3D)          |
|                            |                                |
|   - Lens elements L1-L5   |    - Top-down wafer heatmap    |
|   - Thermal heatmap        |    - Metric selector:          |
|   - Immersion water gap    |      CD | Overlay | LER | Def  |
|   - Flow vectors           |    - Die grid with values      |
|   - Meniscus edge          |    - Zernike decomposition     |
|                            |                                |
+----------------------------+--------------------------------+
|  Parameter Panel: sliders (dose, scan speed, cooling, flow) |
|  + What-If presets (cooling fail, flow drop, dose drift)    |
+-------------------------------------------------------------+
```

Both panels share a single Babylon.js engine with two viewports (or two canvases if isolation is needed for performance). The timeline drives the simulation state; parameter sliders override inputs in real-time.

---

## 2. Physics Model -- Lens Heating Chain

Causal chain: laser energy absorption -> lens temperature rise -> refractive index drift -> wavefront error (Zernike) -> CD/overlay/LER impact. All values synthetic but bounded to published ArFi ranges.

### Thermal model (per lens element L1-L5)

- Each element absorbs a fraction of the 193nm beam energy. L1 (closest to wafer) absorbs most (~0.1-0.3% per pass of ~30mJ/cm2 pulse energy).
- Temperature modeled as exponential rise-to-steady-state: `T(t) = T_ambient + dT_max * (1 - e^(-t/tau))` where tau ~ 60-300s depending on element mass and cooling.
- dT_max ranges 0.02-0.15 C per element (small, but optically significant).

### Refractive index drift (Sellmeier)

- Fused silica dn/dT ~ 10e-6 /C at 193nm.
- Per-element optical path change: `dOPL = dn/dT * dT * thickness` (element thickness ~15-40mm).

### Wavefront error (Zernike decomposition)

Accumulated OPL changes decomposed into Zernike coefficients Z4-Z16. Key sensitivities:

| Zernike | Name | Sensitivity | Heating pattern |
|---------|------|-------------|-----------------|
| Z4 | Defocus | ~0.5-2.0 nm wavefront per 0.1C | Dominant, rotationally symmetric |
| Z5/Z6 | Astigmatism | ~0.1-0.5 nm | Asymmetric heating |
| Z9 | Spherical | ~0.2-0.8 nm | Rotationally symmetric |
| Z7/Z8 | Coma | ~0.05-0.3 nm | Off-axis illumination |

### Wafer impact (first-order sensitivities)

- CD sensitivity to defocus: ~3-5 nm CD per 10 nm defocus (pattern-dependent).
- Overlay sensitivity to distortion Zernikes (Z2/Z3, Z7/Z8): ~0.3-0.8 nm overlay per nm wavefront.
- Sensitivities stored as a config table, adjustable via sliders.

The model updates per-wafer in the lot. Wafer 1 sees a cold lens; wafer 25 sees near-steady-state heating. This creates the characteristic "first-wafer effect" drift.

---

## 3. Physics Model -- Immersion Fluid Dynamics

The immersion layer between L1 and the wafer surface is a ~100um water gap.

### Fluid flow model (simplified 2D Navier-Stokes)

- Water injected at leading edge of immersion hood, extracted at trailing edge. Flow velocity ~0.1-0.5 m/s depending on scan speed.
- Modeled as steady-state laminar flow (Re < 100) with parabolic Poiseuille velocity profile: `v(z) = v_max * 4z(h-z)/h^2`.
- Scan direction reversal at wafer edge causes transient flow disruption -- this is when defects form.

### Meniscus dynamics

- Contact angle at immersion hood edge: ~50-70 deg (hydrophilic topcoat).
- At high scan speeds (>500mm/s), meniscus can't follow -> water loss (film pulling) or air bubble entrapment.
- Critical scan speed: `v_crit = gamma * cos(theta) / (3 * mu * L)` where gamma = surface tension, mu = viscosity, L = meniscus length.
- Bubble probability increases exponentially above v_crit.

### Thermal coupling

- Immersion water acts as heat sink for L1, removing ~60-80% of absorbed energy.
- Water temperature rises ~0.01-0.05 C per wafer pass.
- Water refractive index at 193nm: n ~ 1.437, dn/dT ~ -100e-6 /C (negative, opposite to fused silica).
- Partial self-compensation: lens heats up (n increases), water heats up (n decreases).

### Defectivity output (4 categories)

| Defect Type | Cause | Spatial Pattern |
|-------------|-------|-----------------|
| Watermark | Residual droplet after scan | Spot on wafer map |
| Bubble | Air entrapped at meniscus edge | Cluster at scan-reversal zones |
| Particle | Contamination in fluid supply | Random scatter |
| Film-pull | Meniscus break at high speed | Edge-die arc pattern |

Each defect type has a probability function driven by scan speed, flow rate, and meniscus stability. Defect map accumulates across the lot.

---

## 4. Babylon.js Cross-Section Scene (Left Panel)

Cutaway view of the projection lens column bottom section + immersion gap + wafer surface.

### Scene geometry (bottom-up)

```
        +----------+
        |    L5    |  <- top element (least heating)
        +----------+
        |    L4    |
        +----------+
        |    L3    |
        +----------+
        |    L2    |
        +----------+
        |    L1    |  <- last element (most heating)
        +----+-----+
     ~~~~~~~~|~~~~~~~~  <- immersion water (~100um)
     +-------+--------+
     |     Wafer      |  <- resist-coated silicon
     +----------------+
```

### Lens elements (L1-L5)

- Fused silica cylinders with PBR glass material (high transparency, slight blue tint).
- Thermal heatmap overlay: CustomMaterial with vertex color driven by per-element T(t). Gradient from cool blue (#22d3ee) -> warm amber (#f59e0b) -> hot red (#ef4444).
- 193nm beam rendered as a semi-transparent cyan cone narrowing through the stack.

### Immersion water gap

- Thin slab between L1 and wafer with animated ShaderMaterial.
- Flow vectors: particle system with ~200 particles moving in parabolic velocity profile.
- Meniscus edges: curved mesh at left/right boundaries, deforming based on scan speed parameter.
- Color tinted by water temperature (subtle blue shift as it warms).

### Wafer surface

- Flat disc with resist layer (thin colored band on top).
- Scan position indicator: glowing line sweeping left-right, speed tied to scan speed slider.

### Interactive camera

- Default: side cutaway view showing full stack.
- User can orbit/zoom. Scroll to zoom into immersion gap detail.
- Click any lens element -> tooltip showing its current T, dT, dOPL, dominant Zernike contribution.

---

## 5. Wafer Impact Map (Right Panel)

Top-down wafer view showing spatial fingerprint of lens heating + immersion effects.

### Wafer geometry

- Circular wafer disc (300mm) divided into a die grid (~60-80 dies).
- Notch at 6 o'clock for orientation.
- Rendered as flat Babylon.js plane with DynamicTexture or separate 2D canvas overlay.

### Metric selector (4 tabs)

| Tab | Colormap | Range (synthetic) | Source |
|-----|----------|-------------------|--------|
| CD | Blue-White-Red | +/-3 nm from target | Zernike Z4,Z9 -> defocus -> CD |
| Overlay | Green-Yellow-Red | 0-2.5 nm | Zernike Z2,Z3,Z7,Z8 -> distortion |
| LER | Cyan-Magenta | 2.0-4.5 nm (3 sigma) | Dose margin + stochastic model |
| Defectivity | Green-Red | 0-5 defects/die | Fluid model -> watermark/bubble map |

### Spatial fingerprints

- **CD:** Radial bowl shape (center-to-edge from spherical Z9) + slight asymmetry from astigmatism Z5/Z6. Deepens as lens heats up across the lot.
- **Overlay:** Clover-leaf pattern from coma Z7/Z8 + linear tilt from Z2/Z3 thermal drift.
- **LER:** Relatively uniform but degrades at wafer edge where dose margin is tighter.
- **Defectivity:** Concentrated at scan-reversal zones (left/right wafer edges) + occasional random spots. Cluster density grows if flow rate drops.

### Per-die interaction

- Hover any die -> tooltip with numeric value for selected metric.
- Click die -> small inset shows local Zernike bar chart (Z4-Z16 coefficients at that field position).

### Wafer-to-wafer progression

As timeline advances (wafer 1-25), fingerprints evolve. CD bowl deepens, overlay clover intensifies, defect count accumulates. A sparkline chart below the wafer shows the selected metric's wafer-average trend across the lot.

---

## 6. Timeline and Parameter Controls

### Top bar -- timeline scrubber

```
<< >> ||  [====o========================] Wafer 3/25  |  t=72s  |  L1: +0.08C  |  dCD: 0.4nm
```

- Play/pause/step buttons (step = advance one wafer).
- Draggable scrubber -- jump to any wafer in the lot.
- Live readouts: current wafer number, elapsed time, L1 temperature delta, worst-case CD drift.
- Playback speed selector: 1x, 2x, 5x, 10x (default 2x, one full lot ~30s real-time).

### Bottom panel -- parameter sliders

| Parameter | Range | Default | Unit | Affects |
|-----------|-------|---------|------|---------|
| Dose | 20-45 | 30 | mJ/cm2 | Lens heating rate, CD, LER |
| Scan speed | 200-700 | 500 | mm/s | Meniscus stability, throughput |
| Cooling power | 0-100 | 80 | % | Lens tau and dT_max |
| Fluid flow rate | 0.5-2.0 | 1.2 | L/min | Meniscus stability, defectivity |
| Resist thickness | 60-120 | 90 | nm | LER sensitivity |
| Ambient temp | 22.0-23.0 | 22.5 | C | Baseline refractive index |

Sliders update the simulation in real-time (debounced 100ms). Each slider shows its current value and resets to default on double-click.

### What-If preset buttons

| Preset | Action | Expected Visual Impact |
|--------|--------|----------------------|
| Cooling Failure | Cooling -> 0% at current wafer | L1 temp spikes, CD bowl explodes |
| Flow Rate Drop | Flow -> 0.3 L/min | Meniscus breaks, defectivity surge at edges |
| Dose Drift | Dose +15% ramp over 5 wafers | Gradual CD shift + LER degradation |
| Cold Start | Reset to wafer 1, cold lens | Shows first-wafer effect from scratch |

Presets inject a parameter change at the current timeline position. A banner appears with the scenario name and a dismiss/reset button.

---

## 7. File Structure

```
equipment-monitor/src/
  app/mes/fab-floor/lithography/lens-sim/
    page.tsx                          # Route page, layout shell
  components/lens-sim/
    LensCrossSectionScene.tsx         # Babylon.js left panel
    WaferImpactMap.tsx                # Babylon.js/Canvas right panel
    TimelineBar.tsx                   # Top scrubber + readouts
    ParameterPanel.tsx                # Sliders + what-if presets
    ZernikeInset.tsx                  # Bar chart popup (per-die)
  lib/lens-sim/
    types.ts                          # All interfaces and enums
    thermal-model.ts                  # Lens heating: T(t), dT, dOPL
    sellmeier.ts                      # Refractive index vs temperature
    zernike.ts                        # Zernike decomposition and sensitivities
    fluid-model.ts                    # Flow profile, meniscus, defect probability
    wafer-metrics.ts                  # CD, overlay, LER, defectivity calculators
    simulation-engine.ts              # Orchestrator: step(wafer) -> full state
    presets.ts                        # What-if scenario definitions
    constants.ts                      # Physical constants, default params, ranges
```

### State management

- `simulation-engine.ts` exposes a SimulationState updated per wafer-step.
- Page holds state via useRef for the engine + useState for UI-reactive values (current wafer, selected metric, slider values).
- No Zustand store needed -- self-contained page, not shared across routes.

### Key interfaces

```typescript
interface SimulationParams {
  dose: number;           // mJ/cm2
  scanSpeed: number;      // mm/s
  coolingPower: number;   // 0-1
  fluidFlowRate: number;  // L/min
  resistThickness: number;// nm
  ambientTemp: number;    // C
}

interface WaferState {
  waferIndex: number;     // 0-24
  lensTemps: number[];    // L1-L5 temperatures (C)
  zernikes: number[];     // Z1-Z16 coefficients (nm wavefront)
  cdMap: number[][];      // per-die CD deviation (nm)
  overlayMap: number[][]; // per-die overlay (nm)
  lerMap: number[][];     // per-die LER 3sigma (nm)
  defectMap: number[][];  // per-die defect count
}

interface SimulationState {
  params: SimulationParams;
  wafers: WaferState[];   // history for all exposed wafers
  currentIndex: number;
  elapsed: number;        // seconds
}
```

The engine is pure functions: `stepWafer(state, params) -> WaferState`. Fully unit-testable without Babylon.js.

---

## 8. Testing and Acceptance Criteria

### Physics model unit tests (~12 tests)

| Test | Assertion |
|------|-----------|
| Thermal exponential rise | L1 reaches 63% of dT_max at t=tau |
| Steady-state convergence | All elements within 1% of dT_max by wafer 25 |
| Sellmeier dn/dT (silica) | Returns ~10e-6 /C at 193nm +/-5% |
| Sellmeier dn/dT (water) | Returns ~-100e-6 /C (negative) |
| Zernike Z4 dominance | Defocus is largest coefficient under symmetric heating |
| CD sensitivity | 10nm defocus -> 3-5nm CD change |
| Overlay sensitivity | 1nm coma wavefront -> 0.3-0.8nm overlay |
| Meniscus critical speed | v_crit increases when surface tension increases |
| Defect surge | Flow rate < 0.5 L/min -> defect probability > 50% |
| First-wafer effect | Wafer 1 CD differs from wafer 25 CD by > 1nm |
| Cooling failure | Cooling=0 -> dT_max doubles within 5 wafers |
| Parameter clamping | Out-of-range values clamped to bounds |

### Component tests (~6 tests)

| Test | Assertion |
|------|-----------|
| Page renders | `/mes/fab-floor/lithography/lens-sim` mounts without error |
| Metric tab switch | Clicking "Overlay" updates wafer map data-testid |
| Timeline scrub | Dragging to wafer 15 updates currentIndex to 14 |
| Slider reactivity | Changing dose slider updates SimulationParams.dose |
| What-if preset | "Cooling Failure" sets cooling to 0, shows banner |
| Canvas present | Both Babylon.js canvases render with correct data-testid |

### Acceptance criteria (must-pass for PR)

1. `tsc --noEmit` passes
2. All physics unit tests green
3. All component tests green
4. Page loads under 3 seconds on desktop
5. Mode switch from parent fab-floor page navigates correctly
6. Timeline plays full 25-wafer lot without frame drops below 30fps
7. All synthetic values labeled "illustrative" in tooltips
