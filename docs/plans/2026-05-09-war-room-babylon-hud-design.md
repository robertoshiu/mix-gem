# War Room Babylon.js HUD Smart Factory Design

> Date: 2026-05-09
> Status: Approved (brainstorm complete)

## Overview

Replace `/mes/war-room` Three.js scene with a full-canvas Babylon.js cyberpunk HUD smart factory. All UI floats as transparent overlays over a maximized 3D canvas. The 4 subsystem panels (Power/BAS/Gas/Fire) become filter tabs that trigger layer isolation in the scene graph. The existing `/mes/fab-twin` route and all Three.js components remain unchanged (parallel approach).

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | Replace war-room with Babylon.js (B) | Fab-twin proves the engine works; war-room's Three.js scene is simple geometry |
| Existing code | Parallel — keep fab-twin as-is (C) | Build independently, validate, remove later |
| Subsystem panels | HUD filter tabs with layer isolation (C+B) | Preserves operational filtering, maximizes 3D immersion |
| Visual style | Cyberpunk HUD (B) | Approved 2026-05-08 design language |
| Filter behavior | Layer isolation (B) | Non-relevant assets go wireframe/hidden, active subsystem fully visible |
| HUD density | Minimal overlay (C) | No sidebar, all panels float over canvas, popup metadata near click |
| State management | React useState/useReducer, no Zustand | All state is local UI, no cross-page sharing needed |
| Data source | Extend fab-twin-data.ts | Reuse zones/tools/sensors/faults, add subsystem layer mappings |

---

## 1. Page Layout

Full-viewport Babylon.js canvas with no sidebar. All UI is transparent floating overlays.

```
+-------------------------------------------------------------+
| [top-bar] WAR ROOM 3D  | KPI chips | [PWR BAS GAS FIRE]    |
+-------------------------------------------------------------+
|                                                             |
|              Full-screen Babylon.js canvas                   |
|                                                             |
|  +-viewpoints-+                                             |
|  | overview   |                                             |
|  | operator   |                    +--picked-asset--+       |
|  | maint      |                    | metadata popup |       |
|  | pipe-rack  |                    | near click pos |       |
|  | ctrl-room  |                    +----------------+       |
|  +------------+                                             |
|                                                             |
|  +-mode--------+                                            |
|  | Normal      |    +--fault-status-banner-----------+      |
|  | Maintenance |    | trigger | impact | action      |      |
|  | Lot Transfer|    +--------------------------------+      |
|  | Alarm       |                                            |
|  +-------------+                                            |
|               +--subsystem-detail-overlay------+            |
|               | hex gauges + equipment table   |            |
|               +--------------------------------+            |
+-------------------------------------------------------------+
```

- **Top bar**: 56px, `rgba(2,6,23,0.88)` + backdrop blur. Title, 6 KPI chips (Fira Code mono, neon border by status), 4 subsystem filter toggles, fault scenario dropdown.
- **Viewpoint selector**: Top-left floating, collapsible. 5 presets, active gets cyan left-border.
- **Mode selector**: Bottom-left floating. 4 modes, active gets pulsing neon border.
- **Asset metadata popup**: Positioned near 3D click via `Vector3.Project()`. Scanline + hex corner ticks on border. Dismissed on click-away or Escape.
- **Fault banner**: Bottom-center, only when non-nominal. Red pulsing left-edge, trigger/impact/action.
- **Subsystem detail overlay**: Bottom-center, appears when filter active. 3 hex gauge chips + scrollable equipment/sensor table.

---

## 2. Scene Graph Architecture

```
FAB1-SCENE-ROOT
+-- CAMERA-RIG (ArcRotateCamera, 5 preset poses)
+-- LIGHTING
|   +-- AMBIENT-DEEP-BLUE (#060818, intensity 0.6)
|   +-- CYAN-RIM-LIGHTS (4x point lights at scene edges)
|   +-- ZONE-SPOTLIGHTS (volumetric, per-zone identity color)
+-- ENVIRONMENT
|   +-- NEON-GRID-FLOOR (scanning pulse animation)
|   +-- WALLS-HOLOGRAPHIC (semi-transparent, hex pattern, edge glow)
|   +-- CEILING-FFU-ARRAY (instanced, 45+ units)
+-- LAYER:PROCESS (toggle visibility per subsystem filter)
|   +-- LITHO-SCN-01 (hero asset, LOD0/1/2, collision, clearance)
|   +-- ETCH-ICP-02
|   +-- DEP-ALD-03
|   +-- MET-CDSEM-04
|   +-- TEST-WAT-05
+-- LAYER:POWER
|   +-- PDU-A-01, PDU-B-01
|   +-- UPS-A, UPS-B
|   +-- BUS-BAR-MAIN
|   +-- BREAKER-PANELS[]
|   +-- POWER-SENSORS[]
+-- LAYER:BAS
|   +-- FFU-CEILING-ARRAY (shared ref from ENVIRONMENT)
|   +-- AHU-SUPPLY, AHU-RETURN
|   +-- PRESSURE-GAUGES[]
|   +-- CHILLED-WATER-LOOP
|   +-- BAS-SENSORS[]
+-- LAYER:GAS
|   +-- GAS-CABINET-01..03
|   +-- SCRUBBER-SUBFAB-01
|   +-- VMB-BRANCHES[]
|   +-- EXHAUST-STACKS[]
|   +-- GAS-SENSORS[]
+-- LAYER:FIRE
|   +-- FIRE-PANEL-MCC
|   +-- DETECTOR-LOOP[] (ceiling nodes + red conduit)
|   +-- SPRINKLER-HEADS[]
|   +-- FIRE-SENSORS[]
+-- TRANSPORT
|   +-- AMHS-RAIL-LOOP
|   +-- FOUP-CARRIERS[]
+-- PIPES (color-coded, rack-leveled)
|   +-- CW-SUPPLY (blue), CW-RETURN (light blue)
|   +-- EXHAUST (orange), GAS-N2 (yellow)
|   +-- FIRE-SUPPRESSION (red)
+-- SENSORS[] (49 points, each tagged with subsystem layer)
```

- Every mesh has `metadata.layers: string[]` for filter system membership.
- Shared assets (FFU in both ENVIRONMENT and BAS) have dual-layer membership.
- Process tools always visible at reduced opacity during subsystem isolation for spatial context.
- Each TransformNode group exposes unique ID and hierarchical path on `metadata`.

---

## 3. Cyberpunk Visual Layer

### Lighting
- Deep blue ambient `#060818` at 0.6 intensity
- 4 cyan rim point lights at scene corners for edge definition
- Per-zone volumetric spotlights with zone identity colors, intensity modulated by alert state
- Indicator LEDs on equipment: small emissive spheres (green/amber/red) with glow falloff

### Floor & Walls
- Neon scanning grid: `GridMaterial` with animated pulse wave from center every 3 seconds
- Walls: semi-transparent panels (`alpha: 0.15`), hex pattern UV-mapped, edge glow via emissiveColor
- Double-line floor outline with animated dash pattern
- Corner bracket decorations at floor boundary intersections

### Materials
- Equipment bodies: PBR with boosted emissiveColor (0.08-0.18 scale of zone color)
- Hero asset (scanner): Brighter emissive, 2K texture budget placeholder
- Pipes: Metallic PBR (`metallic: 0.72`) with color-coded albedo
- Alert state: Pulsing emissive intensity (0.3-0.9 sine wave at 180ms period)

### Data Flow Particles
- `SolidParticleSystem` with ~200 particles along predefined spline paths
- Color matches zone identity; speed increases during alerts
- Center hub: rotating wireframe torus with pulsing emissive core

### Scanline Post-Process
- `PassPostProcess` with horizontal line pattern at 4% opacity
- Disabled when `prefers-reduced-motion` detected

---

## 4. Subsystem Filter & Layer Isolation

When a user clicks a subsystem tab (PWR/BAS/GAS/FIRE), the scene transitions into layer isolation mode over 300ms ease-out.

| Asset category | Active subsystem | Inactive subsystem | No filter (default) |
|---|---|---|---|
| Subsystem equipment | Solid, full emissive glow | Hidden (visibility: 0) | Solid, subtle emissive |
| Subsystem sensors | Enlarged 1.5x, pulsing | Hidden | Normal size, static |
| Subsystem pipes/conduits | Bright, particle flow active | Hidden | Normal color |
| Process tools | 20% opacity wireframe | 20% opacity wireframe | Solid PBR |
| Environment (floor/walls/ceiling) | Visible, dimmed to 40% | Visible, dimmed to 40% | Full brightness |
| Shared assets (dual-layer) | Full brightness if in active layer | Dimmed if not | Full brightness |
| Transport (AMHS/carriers) | Dimmed to 30% | Dimmed to 30% | Full, animated |

### Implementation
- Iterate scene meshes, set visibility and swap material variant (solid to wireframe) based on `metadata.layers`
- Use `BABYLON.Animation` for smooth opacity transitions
- Camera auto-flies to subsystem-relevant viewpoint (Power -> utility room, BAS -> ceiling, Gas -> chase, Fire -> control room)

### Subsystem Detail Overlay
Floating panel at bottom-center with semi-transparent background + backdrop blur:
- 3 hex gauge chips showing key metrics for the active subsystem
- Scrollable equipment/sensor table with status and values
- Each row clickable: flies camera to that asset + opens metadata popup
- Close button and "Fly to" button

---

## 5. HUD Overlay Components

### Top Bar (56px, fixed)
- Title: "WAR ROOM 3D" with Activity icon
- 6 KPI chips: OEE, Uptime, Alarm rate, Energy intensity, Particle trend, HVAC load
  - Fira Code monospace, subtle neon border matching status (green/amber/red)
  - Values update reactively on fault scenario change via `getKpisForFault()`
- 4 subsystem filter buttons: toggle (click activate, click again deactivate)
  - Active: neon glow border + zone color fill
- Fault dropdown: select fault scenario

### Viewpoint Selector (top-left, collapsible)
- 5 buttons stacked vertically
- Active viewpoint gets cyan left-border accent
- Collapsed: shows only active label, click to expand

### Mode Selector (bottom-left)
- 4 buttons: Normal / Maintenance / Lot Transfer / Alarm
- Active gets pulsing neon border

### Asset Metadata Popup (near 3D click)
- Positioned via `BABYLON.Vector3.Project()` (3D pick -> screen coords)
- Shows: asset ID, hierarchy path, type badge, key fields, full JSON expandable
- Scanline overlay + hex corner ticks on border
- Dismissed on click-away or Escape

### Fault Banner (bottom-center, conditional)
- Only visible when fault is non-nominal
- Horizontal strip: Trigger | Impact | Action
- Red pulsing left-edge accent, semi-transparent background
- Auto-appears on fault change, dismissible

---

## 6. Interaction & Animation

### Camera Transitions
- `BABYLON.Animation.CreateAndStartAnimation()` on alpha/beta/radius/target
- 800ms `CubicEase` ease-in-out
- Subsystem filter auto-flies to relevant viewpoint
- User can orbit/zoom freely after auto-fly

### Equipment Interactions

| Action | Trigger | Result |
|---|---|---|
| Hover equipment | pointerMove | Edge highlight (emissive boost), floating label: tool_id + status |
| Click equipment | pointerPick | Metadata popup at screen position, camera eases closer (radius -30%) |
| Hover sensor | pointerMove | Sphere scales 1.5x, tooltip: simulated value + alarm range |
| Click pipe | pointerPick | Highlights full pipe run, popup: rack level + valve nodes + color code |
| Click carrier | pointerPick | Popup: lot ID, wafer count, destination, carrier state |

### Mode-Driven Animations

| Mode | Scene effect |
|---|---|
| Normal | Doors closed, clearance hidden, carriers stationary, steady LEDs |
| Maintenance | Service doors rotate open (-0.82 rad), clearance at 28% opacity, service-side highlighted |
| Lot Transfer | Carriers animate on AMHS rail, load ports pulse, metadata shows "transferring" |
| Alarm | Alarm spheres pulse, zone spotlights intensify, particles accelerate, zone boundary brightens |

### Fault-Specific Animations

| Fault | Visual effect |
|---|---|
| FFU efficiency loss | Litho FFU instances flash amber, downflow arrows red, particle sensors enlarge + pulse |
| Pressure reversal | Bay-chase boundary flashes red, return-air arrow reverses, pressure sensors inverted |
| Temp/RH drift | Litho zone heat-shimmer (vertex shader wobble), scanner load port dims |
| Toxic gas alarm | Chase gas sensors flash red, scrubber inlet pulses, exhaust intensifies, vapor particles at VMB |
| Tool down | ETCH-ICP-02 alarm pulses, breaker shows "tripped", upstream carriers slow |
| Queue congestion | Carrier speed 25%, extra carriers spawn, rail turns red, queue counter label |

### Performance Guards
- `onBeforeRenderObservable` callbacks skip non-critical animations when `engine.getFps() < 30`
- Particle system: 200 cap, auto-reduces to 80 on low FPS
- `prefers-reduced-motion`: disables pulse/shimmer/scanline, keeps functional state changes

---

## 7. State Management & Data Layer

### State (React local, no Zustand)

```typescript
interface WarRoomHudState {
  view: FabTwinView;                    // 5 camera presets
  mode: FabTwinMode;                    // normal/maintenance/lot-transfer/alarm
  faultId: FabTwinFaultId;             // 7 fault scenarios
  activeSubsystem: Subsystem | null;   // 'power' | 'bas' | 'gas' | 'fire' | null
  pickedAsset: PickedAsset | null;     // metadata popup content
  pickScreenPos: { x: number; y: number } | null;
  viewSelectorExpanded: boolean;
  faultBannerDismissed: boolean;
}
```

### Data Sources (all from fab-twin-data.ts)

| Data | Source | Usage |
|---|---|---|
| Zones (7) | FAB_TWIN_ZONES | Zone floors + labels |
| Tools (5) | FAB_TWIN_TOOLS | Equipment meshes + metadata |
| Sensors (49) | FAB_TWIN_SENSORS | Sensor spheres + alarm state |
| Faults (7) | FAB_TWIN_FAULT_SCENES | Fault banner + scene effects |
| KPIs (6) | getKpisForFault() | Top bar KPI chips |
| Units | FAB_TWIN_UNITS | Scene graph contract labels |

### New Data (added to fab-twin-data.ts)

```typescript
export type Subsystem = 'power' | 'bas' | 'gas' | 'fire';

// Layer membership for every asset
export const SUBSYSTEM_LAYERS: Record<string, Subsystem[]> = {
  'PDU-A-01': ['power'],
  'FFU-001': ['bas'],
  'GAS-CABINET-01': ['gas'],
  'FIRE-PANEL-MCC': ['fire'],
  'LITHO-SCN-01': ['process'],
  // ... every asset mapped
};

// New subsystem-specific equipment not in current fab-twin
export const SUBSYSTEM_EQUIPMENT: SubsystemEquipment[] = [
  // Power: transformer banks, switchgear, bus bars
  // BAS: AHU units, pressure gauges, chilled water loop
  // Gas: gas cabinets, VMB branches, exhaust stacks
  // Fire: detector loop nodes, sprinkler heads, suppression panel
];
```

### Scene-React Communication
- Page passes view, mode, faultId, activeSubsystem as props to WarRoomBabylonScene
- Scene calls onAssetPick(asset, screenPos) callback on pointer pick
- Scene rebuilds on prop change (same pattern as FabTwinBabylonScene)

---

## 8. File Structure

### New Files

```
equipment-monitor/src/
  app/mes/war-room/
    page.tsx                          # REWRITE: full-canvas Babylon + HUD overlays
  components/babylon/
    WarRoomBabylonScene.tsx           # NEW: cyberpunk scene with layer isolation
  components/war-room-hud/
    TopBar.tsx                        # NEW: KPI chips + subsystem filter toggles
    ViewpointSelector.tsx             # NEW: collapsible 5-viewpoint panel
    ModeSelector.tsx                  # NEW: 4-mode toggle panel
    AssetMetadataPopup.tsx            # NEW: positioned near 3D click point
    FaultBanner.tsx                   # NEW: bottom-center fault status strip
    SubsystemDetailOverlay.tsx        # NEW: hex gauges + equipment table
    HexGaugeChip.tsx                  # NEW: small inline hex gauge
  lib/
    fab-twin-data.ts                  # EXTEND: add SUBSYSTEM_LAYERS, SUBSYSTEM_EQUIPMENT
```

### Unchanged Files
- `components/babylon/FabTwinBabylonScene.tsx` - fab-twin route stays
- `components/three/*` - Three.js war-room components stay (not used by new page)
- `components/war-room/*` - 4 panel components stay (not used, not deleted)
- `stores/war-room-store.ts` - stays (old page imported it, new page does not)

### Summary
- 8 new files, 1 modified file, 0 deleted files
- No new npm packages (Babylon.js v9.6 already installed)

### Not In Scope
- Hex gauge replacing GaugeCard/KpiGaugeCard on other pages
- `/mes/fab-floor` litho process dashboards
- Backend/API integration
- Real sensor data (all synthetic from fab-twin-data.ts)
