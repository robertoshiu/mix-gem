# EDA Chip Design Flow Simulator — Design Spec

> Date: 2026-05-12
> Route: `/mes/eda`
> Status: Approved

## 1. Overview

A comprehensive Electronic Design Automation (EDA) pipeline simulator for the equipment-monitor dashboard. Simulates the full chip design flow from RTL through tape-out with:

- **Isometric pipeline factory** (3D) — 8 EDA stages as interactive tool bays connected by conveyor lines
- **Chip layer-stack viewer** (3D) — Exploded cross-section of metal layers, vias, and DRC violations
- **Stage inspector, log stream, and live metrics charts** (2D) — Detailed per-stage data

Pure client-side simulation. No backend required.

## 2. Route & Layout

**Route:** `/mes/eda`

```
+-----------------------------------------------------+
| [EDA Pipeline Simulator]  > Run  || Pause  ~ Reset  |  <- toolbar
+--------------------+--------------------------------+
|                    |                                |
|  Pipeline Factory  |   Detail Panel (tabbed)        |
|  (3D isometric)    |   +- Stage Inspector           |
|                    |   +- Log Stream                 |
|  8 tool bays in    |   +- Metrics / Charts          |
|  conveyor flow     |   +- Chip Layer Viewer (3D)    |
|                    |                                |
|  click a stage ->  |                                |
+--------------------+--------------------------------+
|  Timeline bar: RTL ==> Synth ==> FP ==> P&R ...    |  <- progress
+-----------------------------------------------------+
```

- **Left panel (~45%):** Isometric pipeline factory (Babylon.js)
- **Right panel (~55%):** Tabbed detail view for selected stage
- **Bottom bar:** Linear timeline with stage completion percentages
- Both 3D views use Babylon.js (matching fab-twin's engine)

## 3. EDA Pipeline Stages & Data Model

### 8 Stages

| Stage | Key Metrics | Output Artifact |
|-------|------------|-----------------|
| **RTL Design** | Line count, module count, lint warnings, coverage % | Verilog/VHDL netlist |
| **Synthesis** | Gate count, area (um2), max freq (GHz), power (mW), slack (ns) | Gate-level netlist |
| **Floorplan** | Die area, utilization %, macro count, aspect ratio | DEF floorplan |
| **Place & Route** | Cell count, routed nets, wire length (mm), congestion %, DRC violations | Routed DEF + GDS |
| **CTS** | Clock skew (ps), buffer count, insertion delay (ns), power overhead (mW) | Clock tree netlist |
| **STA** | WNS (ns), TNS (ns), failing paths, hold violations | Timing report |
| **DRC/LVS** | DRC errors by rule, LVS mismatches, antenna violations, density violations | Signoff report |
| **Tape-out** | GDS size (GB), layer count, metal fill %, mask count | Final GDS-II |

### Core Types (eda-types.ts)

```typescript
type EdaStage = 'rtl' | 'synthesis' | 'floorplan' | 'place_route' | 'cts' | 'sta' | 'drc_lvs' | 'tapeout'

interface StageState {
  stage: EdaStage
  status: 'queued' | 'running' | 'completed' | 'failed' | 'warning'
  progress: number          // 0-100
  startedAt: number | null
  metrics: StageMetrics     // discriminated union per stage
  logs: LogEntry[]
  artifacts: string[]
}

interface PipelineRun {
  id: string
  chipName: string
  techNode: '3nm' | '5nm' | '7nm'
  stages: StageState[]
  currentStage: EdaStage | null
  elapsedMs: number
}
```

Each stage's `StageMetrics` is a discriminated union — e.g. `SynthesisMetrics` has `gateCount`, `area`, `maxFreq`, `slack`, while `StaMetrics` has `wns`, `tns`, `failingPaths`.

## 4. Simulator Engine

**File:** `eda-simulator-engine.ts`

Tick-based simulation at 500ms intervals:

```
tick() -> advance current stage progress -> generate metrics incrementally
       -> emit log entries -> check completion -> transition to next stage
```

### Key Mechanics

- **Stage duration:** Base duration (in ticks) scaled by tech node. 3nm takes ~1.8x longer than 7nm. RTL ~20 ticks, P&R ~60 ticks (bottleneck), Tape-out ~30 ticks.
- **Progressive metric generation:** Metrics climb incrementally as progress advances — gate count ramps during synthesis, wire length accumulates during P&R.
- **Fault injection:** Configurable scenarios:
  - `timing_closure_fail` — STA reports negative slack, pipeline stalls, optimizer retries
  - `congestion_hotspot` — P&R congestion spikes >85%, triggers reroute pass
  - `drc_storm` — DRC generates 500+ violations, requiring ECO fix loop
  - `power_budget_exceeded` — Synthesis power overshoots target, triggers clock gating insertion
- **Log generation:** 1-3 realistic log lines per tick matching Synopsys/Cadence style output.
- **State machine:** `queued -> running -> completed|failed|warning`. Failed stages can retry. Warning stages flag issues for downstream.

### API

```typescript
class EdaSimulator {
  constructor(config: SimulatorConfig)
  start(): void
  pause(): void
  reset(): void
  setSpeed(multiplier: 1 | 2 | 5 | 10): void
  injectFault(fault: FaultType, stage: EdaStage): void
  onTick(callback: (state: PipelineRun) => void): void
}
```

React page subscribes via `onTick` and updates Zustand store each cycle.

## 5. Isometric Pipeline Factory (3D View #1)

**File:** `components/babylon/EdaPipelineScene.tsx`

Bird's-eye isometric cleanroom. Each EDA stage is a tool bay arranged left-to-right in a zigzag pattern, connected by conveyor tracks carrying a glowing data packet.

### Per-Bay Visuals

| Stage | Bay Appearance | Active Animation |
|-------|---------------|-----------------|
| RTL | Code terminal with scrolling green text | Characters typing on screen |
| Synthesis | Logic gate mesh cluster | Gates assembling, snapping together |
| Floorplan | Flat chip outline with colored macro blocks | Blocks sliding into position |
| P&R | Dense wire mesh above a grid | Wires routing, drawing themselves |
| CTS | Tree structure branching downward | Branches growing, buffers pulsing |
| STA | Waveform display panel | Timing arcs sweeping across |
| DRC/LVS | Magnifying glass over chip surface | Scan beam sweeping, violations flashing red |
| Tape-out | Sealed GDS package on a pedestal | Package sealing shut, glow intensifies |

### Interaction

- Click a bay -> selects it, highlights border in AMAT Orange `#F47920`, detail panel switches to that stage
- Hover -> tooltip with stage name + progress %
- Conveyor packet glows cyan in transit, pulses red on fault
- Completed bays dim slightly with green checkmark beacon
- Failed bay pulses red with sparks particle effect
- Fixed isometric camera (~30 deg elevation), slight orbit via drag, zoom locked to fit all 8 bays
- PBR materials matching FabTwinBabylonScene.tsx approach

## 6. Chip Layer-Stack Viewer (3D View #2)

**File:** `components/babylon/ChipLayerScene.tsx`

Exploded cross-section of chip physical layers. Lives inside the detail panel's "Chip Layers" tab, updates based on selected stage.

### Layer Stack (bottom to top)

| Layer | Color | Content |
|-------|-------|---------|
| Silicon substrate | Dark gray `#2A2A3E` | Transistor outlines (after P&R) |
| M1 (Metal 1) | Copper `#B87333` | Local interconnects |
| M2-M4 | Graduated blues | Intermediate routing |
| M5-M8 | Graduated greens | Semi-global routing |
| M9-M12 | Silver/white | Global routing, power grid |
| Via columns | Yellow dots | Vertical connections between layers |
| RDL / Bumps | Gold spheres | Top-level pad connections (tape-out) |

### Stage-Driven Content

- **Floorplan:** Only substrate visible, macro blocks as colored rectangles
- **P&R:** Metal layers populate progressively — M1 first, then upward
- **CTS:** Clock tree highlighted as bright cyan traces spanning layers
- **DRC/LVS:** Violation markers as pulsing red cubes at layer intersections — click for rule name and coordinates
- **Tape-out:** All layers populated, metal fill patterns visible

### Interaction

- Slider controls layer spread (0 = collapsed, 100 = fully exploded)
- Click layer to isolate (others go 90% transparent)
- Toggle switches: vias, DRC markers, clock tree, power grid
- Hover on via/trace shows tooltip with net name and layer info
- Layer thickness scales with tech node (3nm thinner/denser than 7nm)

## 7. Detail Panel

### Tab 1: Stage Inspector (`StageInspector.tsx`)

Structured card view with real-time metric animation. Values approaching limits turn amber; exceeding limits turn red. Shows tech node, tool name (Synopsys/Cadence style), elapsed time, and progress bar.

### Tab 2: Log Stream (`EdaLogStream.tsx`)

Auto-scrolling terminal with syntax coloring:
- White — info
- Yellow — warnings
- Red — errors
- Cyan — milestones

Capped at 500 lines with virtual scrolling. Filter buttons: All / Warnings / Errors.

### Tab 3: Metrics Charts (`EdaMetricsChart.tsx`)

Two live-updating Recharts charts:
- **Top:** Stage-specific primary metric over time (gate count, congestion %, etc.)
- **Bottom:** Simulated resource metrics (CPU %, memory GB, disk I/O)

Control limit lines as dashed red/amber horizontals (matching SPC chart pattern).

### Tab 4: Chip Layers (`ChipLayerScene.tsx`)

The 3D layer-stack viewer described in Section 6.

## 8. File Structure

```
equipment-monitor/src/
+-- app/mes/eda/
|   +-- page.tsx                          # Route page, layout shell
+-- components/eda/
|   +-- EdaToolbar.tsx                    # Run/Pause/Reset/Speed controls
|   +-- EdaTimeline.tsx                   # Bottom progress bar
|   +-- StageInspector.tsx                # Tab 1: metrics card
|   +-- EdaLogStream.tsx                  # Tab 2: terminal log
|   +-- EdaMetricsChart.tsx               # Tab 3: live charts
|   +-- EdaDetailPanel.tsx                # Tabbed container for right panel
+-- components/babylon/
|   +-- EdaPipelineScene.tsx              # 3D isometric factory
|   +-- ChipLayerScene.tsx                # 3D layer-stack viewer
+-- lib/
    +-- eda-types.ts                      # All type definitions
    +-- eda-simulator-engine.ts           # Tick-based simulation
    +-- eda-simulator-engine.test.ts      # Engine unit tests
    +-- eda-mock-data.ts                  # Tech-node presets, log templates
    +-- eda-store.ts                      # Zustand store
```

**14 new files.** No modifications to existing files except adding `/mes/eda` to the MES nav sidebar.

**Dependencies:** None new. Uses existing Babylon.js 9.6, Recharts, Zustand, Tailwind.

## 9. Exclusions

- No backend API — pure client-side simulation
- No persistence — resets on page refresh
- No multi-run comparison — single pipeline run at a time
- No custom chip definition — preset tech-node profiles only (3nm/5nm/7nm)
