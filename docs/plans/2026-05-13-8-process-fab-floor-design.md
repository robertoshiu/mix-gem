# 8-Process Fab Floor & Dashboard Redesign

> Date: 2026-05-13
> Status: Approved (brainstorm complete)

## Overview

Redesign `/mes/fab-floor` from a litho-only Three.js scene into a full semiconductor 8-process flow visualization using Babylon.js. Redesign the root dashboard (`/`) into a Fab KPI Command Center. Each process gets a distinct signature color, cyberpunk HUD aesthetic, and a deep-dive sub-route.

The 8 core manufacturing processes:

1. Oxidation (氧化)
2. Lithography (光刻)
3. Etching (蝕刻)
4. Thin Film Deposition (薄膜沉積)
5. Ion Implantation (離子注入)
6. Diffusion (擴散)
7. CMP (化學機械研磨)
8. Metallization (金屬化互連)

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| fab-twin relationship | Keep fab-twin (facility view), replace fab-floor (process view) | Two complementary perspectives — facility engineer vs. process engineer |
| Scene layout | U-shape / horseshoe | Compact, shows start-to-end, mirrors real fab bay layouts |
| Click interaction | HUD side panel + sub-route deep-dive | Fast inspection without losing 3D context + full dashboard per process |
| Dashboard redesign | Fab KPI command center with pipeline bar | Elevates root page from single-equipment to fab-wide overview |
| Visual style | Process-colored cyberpunk | Builds on approved May 8 cyberpunk spec + solves 8-process wayfinding |
| Station detail | Semi-detailed PBR with emissive accents | Matches fab-twin quality, visual identity beyond just color |

---

## 1. Process Color Map

| # | Process | ID | Color | Hex | Rationale |
|---|---------|-----|-------|-----|-----------|
| 1 | Oxidation | `oxidation` | Warm Orange | `#FF6B35` | Heat / furnace glow |
| 2 | Lithography | `lithography` | Cyan | `#22D3EE` | UV light, existing litho accent |
| 3 | Etching | `etching` | Purple | `#A855F7` | Plasma glow |
| 4 | Deposition | `deposition` | Blue | `#3B82F6` | CVD/PVD chamber blue |
| 5 | Ion Implant | `implant` | Red-Pink | `#F43F5E` | High-energy beam |
| 6 | Diffusion | `diffusion` | Amber | `#F59E0B` | Furnace / thermal |
| 7 | CMP | `cmp` | Emerald | `#10B981` | Chemical / clean / polish |
| 8 | Metallization | `metallization` | Silver-White | `#E2E8F0` | Metal interconnect |

Colors are spaced across the spectrum for colorblind accessibility. No two adjacent stations share similar hues.

---

## 2. Route Architecture

### New routes

```
/                              <- Fab KPI Command Center (redesigned)
/mes/fab-floor                 <- 8-Process U-shape Babylon.js scene
/mes/fab-floor/oxidation       <- Oxidation deep-dive dashboard
/mes/fab-floor/lithography     <- Lithography deep-dive (absorbs overlay/cd/dose)
/mes/fab-floor/etching         <- Etching deep-dive
/mes/fab-floor/deposition      <- Thin Film Deposition deep-dive
/mes/fab-floor/implant         <- Ion Implantation deep-dive
/mes/fab-floor/diffusion       <- Diffusion deep-dive
/mes/fab-floor/cmp             <- CMP deep-dive
/mes/fab-floor/metallization   <- Metallization deep-dive
```

### Retired routes

- `/mes/fab-floor/overlay` — content merges into `/mes/fab-floor/lithography`
- `/mes/fab-floor/cd` — content merges into `/mes/fab-floor/lithography`
- `/mes/fab-floor/dose` — content merges into `/mes/fab-floor/lithography`

### Unchanged routes

fab-twin, war-room, SPC, equipment, lots, recipes, secs-gem, EDA — all untouched.

### New files

```
src/lib/fab-process-data.ts                      <- 8-process data model + simulator
src/stores/process-store.ts                      <- Zustand store for process state
src/components/babylon/FabFloorScene.tsx          <- Main Babylon.js U-shape scene
src/components/fab-floor/ProcessHudPanel.tsx      <- Side panel overlay on station click
src/components/fab-floor/ProcessCard.tsx          <- Dashboard mini card per process
src/components/fab-floor/ProcessPipelineBar.tsx   <- Horizontal 8-step flow indicator
src/components/fab-floor/ProcessDashboard.tsx     <- Shared layout for sub-route deep-dives
src/app/mes/fab-floor/oxidation/page.tsx          <- (and 7 more sub-route pages)
src/app/mes/fab-floor/lithography/page.tsx
src/app/mes/fab-floor/etching/page.tsx
src/app/mes/fab-floor/deposition/page.tsx
src/app/mes/fab-floor/implant/page.tsx
src/app/mes/fab-floor/diffusion/page.tsx
src/app/mes/fab-floor/cmp/page.tsx
src/app/mes/fab-floor/metallization/page.tsx
```

### Dead code to remove after migration

- `src/components/three/LithoFactoryScene.tsx`
- `src/components/three/FabScenePrimitives.tsx` (if no other consumers)

---

## 3. Babylon.js U-Shape Scene

### Layout geometry

8 stations in a U-shape, opening faces default camera:

```
  [1.氧化]  [2.光刻]  [3.蝕刻]  [4.沉積]
     |                              |
     |        conveyor belt         |
     |        (animated FOUP)       |
     |                              |
  [8.金屬化] [7.CMP]  [6.擴散]  [5.注入]
```

- Dimensions: ~40m wide x 25m deep, Y-up coordinate system
- Floor: dark grid with hex pattern, each station's ground area tinted with signature color (soft emissive)
- Conveyor: animated rail running the U-path with FOUP carriers

### Per-station 3D construction (procedural, no external glTF)

| Process | Babylon.js Primitives | Key Visual |
|---------|----------------------|------------|
| Oxidation | Cylinder (furnace tube) + Torus (coil rings) + Box (wafer boat) | Orange emissive coils |
| Lithography | Box (scanner body) + Cylinder (illumination column) + Plane (reticle stage) | Cyan laser line |
| Etching | Cylinder (chamber) + Sphere (dome lid) + Tubes (gas lines) | Purple plasma viewport glow |
| Deposition | Cylinder x2 (twin chambers) + Disc (showerhead) + Torus (plasma ring) | Blue plasma ring |
| Ion Implant | Box (beamline) + Cylinder (acceleration tube) + ParticleSystem (beam) | Red-pink beam trail |
| Diffusion | Cylinder (vertical furnace) + Cylinder (quartz tube, transparent) | Amber heat shimmer |
| CMP | Disc (platen) + Cylinder (polish head) + ParticleSystem (slurry) | Green status ring |
| Metallization | Box (sputter body) + Disc (target) + Plane (wafer chuck) | Silver arc effects |

### Materials

- `PBRMaterial` per station: base color dark gray (`#1a1a2e`)
- `emissiveColor` = process signature color
- `emissiveIntensity`: 0.3 idle, 0.8 selected, pulsing on alarm

### Lighting

- `HemisphericLight`: dim (15% intensity), dark ambient
- Per-station `SpotLight`: signature color, aimed at equipment
- `GlowLayer`: intensity 0.6, blur kernel 32

### Post-processing

- `DefaultRenderingPipeline`: bloom (threshold 0.8), chromatic aberration (0.3), grain (0.04)

### Camera

- `ArcRotateCamera` default at ~45 deg looking into U opening
- Click station: smooth lerp animation (~1s ease-out) to close-up
- Escape: reset to overview

### Conveyor animation

- Path: `CatmullRomSpline` with 16 control points tracing the U-shape
- 3-5 FOUP carriers on path simultaneously, `lerp`-ing along spline
- Carrier emissive color blends between current and next station color during transit
- Dwell time at each station: 1.5s

### Performance targets

- Triangle budget: ~50K total (all 8 stations + conveyor + floor)
- LOD: 2 levels per station (LOD0 full detail < 20m, LOD1 simplified > 20m)
- Instancing: conveyor rail segments, floor hex tiles
- Target: 60fps on integrated GPU (Intel UHD 770)
- Engine: WebGPU with WebGL2 fallback

---

## 4. Interaction Model

### Click flow

1. Click station in 3D scene (or process card in top bar)
2. Camera dolly-zooms to station (~1s ease-out)
3. `ProcessHudPanel` slides in from right (400px, glassmorphism backdrop)
4. Clicked station emissive pulses brighter, other 7 dim to 30% opacity
5. Conveyor highlights segment leading to/from this station

### ProcessHudPanel content

```
+-----------------------------+
| [color] LITHOGRAPHY    [x]  |  <- process name + accent + close
| ----------------------------+
| OEE    97.2%   ========--   |  <- mini bar in process color
| WPH    42      ^ +3        |
| Yield  99.1%               |
| Alarms 0  active           |
| ----------------------------+
| EQUIPMENT (3)               |
|  NXE-3800  * Running       |  <- status dot
|  NXE-3600  * PM scheduled  |
|  TRACK-8   * Running       |
| ----------------------------+
| KEY METRICS                 |
|  Overlay   2.1nm 3s        |  <- process-specific KPIs
|  CDU       2.4nm            |
|  Dose d    +0.3%           |
| ----------------------------+
| [> View Details]            |  <- navigates to sub-route
+-----------------------------+
```

### Keyboard / accessibility

- `Tab` cycles through stations 1-8
- `Escape` closes panel and resets camera
- Panel: `role="dialog"` with `aria-label`
- Each station: `aria-label="Process 2: Lithography, OEE 97.2%"`

---

## 5. Dashboard — Fab KPI Command Center

### Layout (root `/` page, top to bottom)

**Row 1: Aggregate KPIs** — 4 cyberpunk hexagonal gauge cards

| Gauge | Typical Value |
|-------|--------------|
| Fab OEE | 94.7% |
| Total WPH | 312 wph |
| Fab Yield | 98.6% |
| Cycle Time | 4.2 days |

Uses hexagonal frame design from May 8 cyberpunk spec.

**Row 2: Process Pipeline Bar** — horizontal 8-step flow

- Each dot = process color
- Bar thickness between dots = throughput / WIP level
- Bottleneck station pulses its color
- Tooltip on hover shows WPH and queue depth
- Click dot = navigate to `/mes/fab-floor` with station pre-selected

**Row 3: Process Cards** — 2x4 grid

- 8 cards, one per process
- Each card: process name (EN + CN), OEE, WPH, active alarm count
- Border color = process signature color
- Bottleneck card gets glow effect
- Click = navigate to `/mes/fab-floor` with station pre-selected

**Row 4: Live Trend** — Fab WPH over last 24h

- Recharts `AreaChart` with 8 stacked layers, each in process color
- Shows throughput contribution per process over time

### Data source

All synthetic from `fab-process-data.ts`. No backend required.

---

## 6. Per-Process Sub-Route Dashboards

### Shared layout (`ProcessDashboard`)

```
+-----------------------------------------------------+
| <- Back to Fab Floor    *=*=*=*=*=*=*=*  mini-pipe  |
|                         (current highlighted)        |
+------------+-----------------------------------------+
| LEFT (30%) | RIGHT (70%)                             |
|            |                                         |
| Process    | Tabs: [KPI Charts] [Wafer Map] [Trends] |
| color bar  |                                         |
|            | +-------------------------------------+ |
| Equipment  | |                                     | |
| list with  | |   Active tab content                | |
| status     | |                                     | |
|            | +-------------------------------------+ |
| Active     |                                         |
| alarms     | BOTTOM: SECS/GEM event log              |
|            | (S6F11 collection events for process)   |
+------------+-----------------------------------------+
| [<- Prev process]              [Next process ->]     |
+-----------------------------------------------------+
```

### Process-specific KPIs

| Process | Key Metrics | Chart Types |
|---------|------------|-------------|
| Oxidation | Oxide thickness, uniformity, growth rate | Wafer map (thickness), trend |
| Lithography | Overlay, CDU, dose error, focus offset | Wafer map (overlay vector), 4 trends |
| Etching | Etch rate, selectivity, CD bias, profile angle | Etch depth map, trend |
| Deposition | Film thickness, stress, dep rate, particle count | Thickness map, trend |
| Ion Implant | Dose uniformity, energy, beam current, tilt angle | Dose map, trend |
| Diffusion | Junction depth, sheet resistance, uniformity | Rs map, trend |
| CMP | Removal rate, WIWNU, dishing, erosion | Removal map, trend |
| Metallization | Sheet resistance, via resistance, step coverage | Rs map, via yield map |

### Wafer map component

- Circular heatmap, 49-point or 121-point grid (user selectable)
- Colorscale uses process signature color (light-to-dark gradient)
- Spatial correlation modeled: center-to-edge gradients

### Mini pipeline nav

- Top bar shows all 8 process dots, current highlighted
- Click any dot to jump to that process's dashboard directly

---

## 7. Data Model

### Core types (`fab-process-data.ts`)

```typescript
type ProcessId =
  | 'oxidation' | 'lithography' | 'etching' | 'deposition'
  | 'implant' | 'diffusion' | 'cmp' | 'metallization';

interface FabProcess {
  id: ProcessId;
  name: string;           // "Lithography"
  nameCN: string;         // "光刻"
  color: string;          // "#22D3EE"
  order: number;          // 1-8 in U-shape sequence
  position: Vector3;      // Babylon.js world position in U-shape
  equipment: ProcessEquipment[];
  kpis: ProcessKpi[];
  alarms: ProcessAlarm[];
}

interface ProcessEquipment {
  id: string;             // "NXE-3800-01"
  name: string;           // "NXE:3800E"
  status: 'running' | 'idle' | 'pm' | 'down';
  currentRecipe: string | null;
  oee: number;
  wph: number;
}

interface ProcessKpi {
  id: string;             // "overlay-3sigma"
  label: string;          // "Overlay 3s"
  value: number;
  unit: string;           // "nm"
  lsl: number;
  usl: number;
  status: 'ok' | 'warning' | 'alarm';
}

interface WaferSite {
  x: number;              // -1 to 1 normalized
  y: number;
  value: number;
  zone: 'center' | 'mid' | 'edge';
}
```

### Zustand store (`process-store.ts`)

```typescript
interface ProcessStore {
  processes: FabProcess[];
  selectedProcess: ProcessId | null;
  panelOpen: boolean;
  cameraTarget: Vector3 | null;
  fabKpis: { oee: number; wph: number; yield: number; cycleTime: number };
  selectProcess: (id: ProcessId) => void;
  clearSelection: () => void;
  tick: () => void;       // called by setInterval, updates all synthetic data
}
```

### Data generation

- Synthetic, client-side only, no backend
- `tick()` runs every 2s: randomized KPI updates around nominal values with process-specific physics
- Wafer map: 49 or 121 sites with spatial correlation (center-to-edge gradients)
- SECS/GEM log: S6F11 collection event entries with process-relevant DVs

### Relationship to existing data

- `fab-twin-data.ts` (zones, sensors, faults) stays untouched — used only by fab-twin route
- `fab-process-data.ts` is a new parallel file focused on process flow

---

## 8. Component Inventory

### New components

| Component | Location | Purpose |
|-----------|----------|---------|
| `FabFloorScene` | `components/babylon/` | Babylon.js U-shape 8-process scene |
| `ProcessHudPanel` | `components/fab-floor/` | Side panel overlay on station click |
| `ProcessCard` | `components/fab-floor/` | Dashboard mini card per process |
| `ProcessPipelineBar` | `components/fab-floor/` | Horizontal 8-step flow indicator |
| `ProcessDashboard` | `components/fab-floor/` | Shared layout for sub-route pages |

### Existing components reused

| Component | Usage |
|-----------|-------|
| `CyberpunkGaugeCard` | Hex gauges on root dashboard (from May 8 spec) |
| `WaferMap` | Per-process wafer heatmap in sub-routes |
| `TrendChart` | Per-process trend charts in sub-routes |
| `MesNavBar` | Navigation (add fab-floor link if not present) |

### Retired components (after migration)

| Component | Reason |
|-----------|--------|
| `LithoFactoryScene` | Replaced by `FabFloorScene` (Babylon.js) |
| `FabScenePrimitives` | Only consumed by `LithoFactoryScene` |
| `FactoryCanvas` (R3F wrapper) | No longer needed for fab-floor |

---

## 9. Migration Notes

- The Three.js `LithoFactoryScene` content (scanners, track, metrology) is conceptually absorbed into the Lithography station of the new 8-process scene
- Overlay, CD, and dose dashboards move under `/mes/fab-floor/lithography` as tabs within the KPI Charts view
- The root dashboard (`/`) page.tsx gets a full rewrite — the existing equipment sidebar and gauge grid are replaced by the command center layout
- `fab-twin` route and all its components remain completely untouched
