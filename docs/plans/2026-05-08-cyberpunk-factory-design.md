# Cyberpunk Smart Factory & Litho Fab Floor Design

> Date: 2026-05-08
> Status: Approved (brainstorm complete)

## Overview

Redesign the war-room-3d into a cyberpunk HUD-style smart factory with zone-specific equipment, add a new litho fab floor 3D scene, redesign all gauge charts with hexagonal cyberpunk frames, and add litho process dashboards (overlay, CD uniformity, dose control) with wafer maps and trend charts.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Visual theme | Cyberpunk HUD factory | Unified aesthetic across 3D and 2D |
| Color palette | Neon multi-color (zone identity) | Preserves existing zone semantics (blue/green/amber/red) |
| Gauge shape | Hexagonal frame | Distinctive cyberpunk shape language |
| 3D interactivity | Full interactive HUD | Clickable equipment, animated AMHS, hover popups |
| War room equipment | Zone-specific (transformers, HVAC, gas cabinets, fire panels) | Matches what each zone actually monitors |
| Fab floor equipment | Litho-specific (scanners, coater/developer, AMHS, metrology) | Semiconductor process focus |
| Fab floor route | `/mes/fab-floor` | Peer to war-room in MES navigation |
| Process dashboards | Wafer maps + trend charts | Most-used litho engineer views |
| Dashboard data | Synthetic client-side | No backend needed, uses litho physics models |

---

## 1. Page Structure

### Routes

```
/mes/war-room              <- enhanced cyberpunk HUD + zone-specific equipment
/mes/fab-floor             <- NEW: litho process floor 3D scene
/mes/fab-floor/overlay     <- NEW: overlay maps + trends
/mes/fab-floor/cd          <- NEW: CD uniformity maps + trends
/mes/fab-floor/dose        <- NEW: dose control maps + trends
```

### Shared Components (new)

| Component | Location | Purpose |
|-----------|----------|---------|
| `CyberpunkGaugeCard` | `components/charts/` | Hexagonal-framed gauge replacing current semicircle |
| `WaferMap` | `components/litho/` | Circular heatmap with cyberpunk styling |
| `TrendChart` | `components/litho/` | Time-series with neon glow, control limits |
| `HudOverlay` | `components/three/` | Reusable 3D HUD text/data overlay |
| `NeonWireframe` | `components/three/` | Shared cyberpunk wireframe material/effects |

### Existing Components Modified

| Component | Change |
|-----------|--------|
| `GaugeCard` | Replaced with `CyberpunkGaugeCard` |
| `KpiGaugeCard` | Replaced with `CyberpunkGaugeCard` |
| `FactoryScene` | Cyberpunk lighting, scanline grid, neon wireframes |
| `SubsystemZone` | Zone-specific 3D equipment, hover HUD popups |
| `FabScenePrimitives` | New primitives: transformers, HVAC, gas cabinets, fire panels |

### Design Tokens

```css
--sf-neon-glow-spread: 0 0 12px;
--sf-scanline-opacity: 0.04;
--sf-hex-border-width: 1.5px;
--sf-hud-font: 'Fira Code', monospace;
```

---

## 2. Cyberpunk Hexagonal Gauge

### Visual Anatomy

```
        ______
       /      \        <- hex border with neon glow edge
      /  arc    \
     |  track    |     <- 210 deg arc, color-zoned (green/amber/red)
     |  needle   |     <- needle with glow trail
     |   24.7    |     <- digital value, Fira Code mono
     |    nm     |     <- unit label
      \  LCL UCL /     <- spec limits at arc endpoints
       \______/
       status: OK      <- neon status badge below hex
```

### Visual Effects

| Effect | Implementation | Trigger |
|--------|---------------|---------|
| Neon glow border | `filter: drop-shadow(0 0 8px {zoneColor})` on hex path | Always, intensity varies |
| Arc glow trail | Blurred duplicate arc path behind value arc | Always |
| Needle pulse | `@keyframes` opacity 0.7-1.0 on needle tip | On data update |
| Hex border flicker | Brief opacity glitch keyframe (0.9-1-0.85-1) | On alert/OOC |
| Scanline overlay | Repeating horizontal lines via SVG `<pattern>` at 4% opacity | Always |
| Corner tick marks | Small lines at each hex vertex | Always |

### Color Behavior

| Status | Arc color | Hex border | Glow color |
|--------|-----------|------------|------------|
| OK/Normal | `--sf-gauge-zone-green` | Zone identity color at 40% | Zone color, subtle |
| Warning | `--sf-gauge-zone-amber` | Amber, brightened | Amber glow intensified |
| Alarm/OOC | `--sf-gauge-zone-red` | Red, flickering | Red glow + hex border glitch |

### Preserved

- `gauge-geometry.ts` math utilities
- Accessibility: `role="meter"`, `aria-valuemin/max/now/text`, sr-only announcements
- Responsive sizing within grid layouts
- `prefers-reduced-motion` disables glow pulses and glitch flicker

---

## 3. War Room 3D — Cyberpunk HUD Factory

### Scene-Wide Changes

| Element | Current | Cyberpunk |
|---------|---------|-----------|
| Lighting | Warm ambient + directional | Deep blue ambient `#060818`, cyan rim lights, volumetric zone spotlights |
| Grid | Solid cyan/blue lines | Neon scanning grid with pulse wave animation from center |
| Walls | Wireframe box geometry | Holographic panels, semi-transparent with edge glow, hex pattern |
| Floor outline | Simple cyan border | Double-line border with corner brackets, animated dash pattern |
| Data flow lines | Static dashed lines | Animated particle streams (glowing dots traveling along paths) |
| Center hub | Wireframe box + ring | Holographic core with rotating ring, pulsing data nexus |

### Zone-Specific Equipment

| Zone | 3D Equipment | Details |
|------|-------------|---------|
| Power | Transformer banks, switchgear, bus bars | Rectangular units with insulator posts, glowing power conduits |
| Building Auto | HVAC units, FFU ceiling array, pressure gauges | Cylindrical fans on ceiling, duct lines, floating pressure readouts |
| Gas Detection | Gas cabinets, scrubber towers, exhaust stacks | Tall cylinder scrubbers, box cabinets with pipe connections, vapor particles on alert |
| Fire Alarm | Suppression panel, detector nodes, sprinkler heads | Wall-mounted panel, ceiling detectors connected by red conduit loop |

### Hover-Reactive HUD

When hovering any 3D equipment piece:
- Equipment edges brighten with neon outline
- Floating HUD panel (Billboard) shows: equipment ID, status dot, 1-2 key metrics
- Nearby data flow lines brighten

### Animated Data Transport

- Particle streams flow along DataFlowLine paths toward center hub
- Speed increases during active alerts
- Color matches zone identity
- Center hub pulses when receiving data

---

## 4. Fab Floor — Litho Process 3D Scene

### Page: `/mes/fab-floor`

Layout mirrors war-room: full-screen 3D canvas + header + bottom info cards.

### 3D Equipment

| Element | Description |
|---------|-------------|
| Scanner/Stepper | Tall rectangular body, wafer stage, lens column, illuminator. 2-3 units in row. |
| Coater/Developer track | Multi-chamber track (HMDS, coat, soft bake, develop, hard bake). Connected with transport rail. |
| AMHS overhead rail | Elevated monorail loop. Animated FOUP carriers travel along path. |
| Metrology tools | Overlay measurement, CD-SEM, scatterometry. Near scanner output. |
| Central data hub | Holographic nexus receiving data streams from all tools. |

### Interaction Model

| Action | Result |
|--------|--------|
| Hover tool | HUD popup: tool ID, lot in process, recipe, status |
| Click tool | Side panel with tool detail |
| Click FOUP on rail | Shows lot ID, wafer count, destination, ETA |
| Header nav buttons | Links to overlay/cd/dose dashboards |

### Shared With War Room

- `FactoryCanvas` wrapper
- `NeonWireframe` material and `HudOverlay` component
- Cyberpunk grid, lighting, scanline effects
- New `LithoScenePrimitives.tsx` for fab-specific shapes

---

## 5. Process Dashboards

### Shared Layout (overlay, cd, dose)

```
+-------------------------+---------------------------+
| Header: breadcrumb + controls                       |
+-------------------------+---------------------------+
|                         |                           |
|    Wafer Map            |    Trend Chart            |
|    (circular heatmap)   |    (lot-to-lot series)    |
|                         |                           |
+-------------------------+---------------------------+
|  Hexagonal Gauge Cards row (3-4 key metrics)        |
+----------------------------------------------------|
```

### Wafer Map Visualization

| Dashboard | Visualization | Data |
|-----------|--------------|------|
| Overlay | Vector arrows (X/Y shift per site), color = magnitude | ~50 sites |
| CD Uniformity | Color gradient heatmap (blue=thin, red=thick) | ~50 sites |
| Dose Control | Contour bands showing dose variation | ~50 sites |

### Cyberpunk Wafer Map Styling

- Circular wafer outline with neon border glow
- Dark background `#0A0A0F` inside wafer
- Notch/flat indicator at bottom
- Hex grid overlay at low opacity
- Site markers glow on hover with value tooltip
- Edge exclusion zone as dashed ring

### Trend Chart

- X-axis: lot/wafer sequence (last 25-50 points)
- Y-axis: parameter value
- Control limits as neon dashed lines (UCL/LCL red, target cyan)
- Data line with glow trail (`filter: drop-shadow`)
- OOC points: pulsing red dot
- Built with Recharts (existing dependency)

### Key Metrics (Hexagonal Gauges)

| Dashboard | Gauge 1 | Gauge 2 | Gauge 3 |
|-----------|---------|---------|---------|
| Overlay | Overlay X mean | Overlay Y mean | Overlay 3-sigma |
| CD | CD mean | CDU (range) | CD-to-target bias |
| Dose | Dose mean | Dose uniformity % | Dose-to-target error |

### Data Generation

All synthetic, client-side, using lithography-expert skill physics models for plausible ranges. No backend dependency.
