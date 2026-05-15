# AR Personnel Tracking — Design Document

> Date: 2026-05-14
> Status: Approved
> Route: `/mes/ar-tracking`

## Overview

Replace the EDA Simulator NavTab with a new "AR Tracking" tab. The EDA page (`/mes/eda`) is preserved but hidden from navigation. The new feature is a full-screen Babylon.js scene showing a simplified fab floor plan where 4 cleanroom-suited personnel wearing AR glasses patrol along predefined routes. Three static restricted zones trigger real-time alerts when entered. Clicking an alert switches the camera to the violating person's first-person AR point-of-view.

## Decisions

| Topic | Decision |
|-------|----------|
| Route | `/mes/ar-tracking`, tab label "AR Tracking" |
| EDA handling | Hide from NavBar, keep page files intact |
| Scene | New independent Babylon.js scene (not reusing FabTwin/FabFloor) |
| Personnel count | 4 capsule-style operators with individual patrol routes |
| Restricted zones | 3 static zones, red semi-transparent ground markers |
| AR view trigger | Click alert toast -> camera switches to first-person POV |
| AR view return | "Back to Overview" button or ESC key |
| Layout | Full-screen 3D canvas + floating React HUD overlays |
| Personnel model | Geometric primitives (capsule + sphere + box), no GLTF imports |

## File Structure

```
src/app/mes/ar-tracking/
  page.tsx                         # Page entry (client component, dynamic import)

src/components/babylon/
  ArTrackingScene.tsx               # Babylon.js scene

src/stores/
  ar-tracking-store.ts              # Zustand state management
```

## 1. Route & Navigation

### NavBar Change

In `MesNavBar.tsx`, remove the EDA Simulator entry from `NAV_ITEMS` and insert in the same position:

```ts
{ href: '/mes/ar-tracking', label: 'AR Tracking', icon: Activity }
```

The EDA page at `/mes/eda/page.tsx` and all its components (`EdaPipelineScene`, `EdaToolbar`, `EdaDetailPanel`, `EdaTimeline`, `EdaLogStream`, `EdaMetricsChart`, `StageInspector`, `useEdaStore`) remain untouched.

### Page Entry

`page.tsx` uses `dynamic(() => import(...), { ssr: false })` to load `ArTrackingScene`. The canvas fills the viewport. Three React HUD components are absolutely positioned on top of the canvas.

## 2. 3D Scene — Fab Layout & Restricted Zones

### Fab Floor Plan

A simplified rectangular fab floor, approximately 60x40 units.

- **Ground:** Dark PBR material (`#0A1628`) with subtle grid lines.
- **6-8 equipment bays:** Low box meshes (height 1-2 units) distributed across the floor, each labeled (Litho Bay, Etch Bay, Diffusion Bay, etc.). Cyberpunk styling with faint cyan edge emissive.
- **Walkways:** Gray ground between equipment bays. Personnel patrol along these paths.

### Camera

`ArcRotateCamera` at 45-degree overhead angle. Mouse rotate/zoom enabled. Beta range clamped to prevent clipping through the floor.

### 3 Static Restricted Zones

| Zone ID | Name | Location |
|---------|------|----------|
| `HV-ZONE` | High Voltage Area | Rear right of fab |
| `CHEM-STORE` | Chemical Storage | Left side |
| `MAINT-BAY` | Maintenance Bay | Center-rear |

Each zone rendered as:

- `MeshBuilder.CreateGround` with red semi-transparent PBR material, breathing pulse animation (alpha 0.08 to 0.18).
- `LineSystem` dashed border outline around the zone perimeter.
- Billboard warning label floating above the zone.

## 3. Personnel System

### Capsule Person Model

Each person is a `TransformNode` hierarchy:

| Part | Mesh | Material |
|------|------|----------|
| Body | `CreateCapsule` (h: 1.8, r: 0.3) | White PBR (cleanroom suit) |
| Head | `CreateSphere` (d: 0.5) | White PBR |
| AR Glasses | `CreateBox` (0.4 x 0.08 x 0.15) | Cyan emissive (`#22d3ee`) |
| Name Tag | `DynamicTexture` billboard | Above head, shows ID (OP-01..OP-04) |

### 4 Personnel with Patrol Routes

Each person has an array of waypoint coordinates defining their patrol path along walkways. Movement is interpolated at ~2 units/second. On reaching a waypoint, the person rotates (Y-axis only) toward the next waypoint.

1-2 patrol routes intentionally cross through restricted zones to ensure alerts are triggered during normal operation.

### Restricted Zone Collision

Per-frame AABB check: each person's XZ position tested against each zone's bounding box. No physics engine needed.

- **On enter:** Trigger alert event once, push to Zustand store. Person's capsule body switches to red pulsing emissive material.
- **On exit:** Person material reverts to white. Alert remains in the log.

## 4. Alert & AR First-Person View

### Alert Trigger Flow

1. Person enters restricted zone (AABB collision detected).
2. Alert object created: `{ id, personnelId, zoneId, zoneName, timestamp, acknowledged: false }`.
3. Pushed to Zustand store `alerts[]`.
4. Zone border intensifies (solid line + stronger red pulse).
5. Toast notification appears (top-right), CRITICAL severity styling.

### Camera Switch to AR POV

1. User clicks "View AR" on the toast (or clicks the personnel row in the HUD panel).
2. A `UniversalCamera` is created at the person's head position (height 1.7), facing the person's current movement direction.
3. `scene.activeCamera` switches to the FPS camera with a 0.5s easing transition.
4. Store updates: `activeView` changes from `'overview'` to `{ type: 'ar', personnelId }`.

### AR View HUD Overlay (React)

While in first-person mode, a React overlay renders:

- Semi-transparent green border (2px, `border-emerald-400/40`) simulating AR glasses frame.
- Corner brackets (L-shaped decorations) at all four corners.
- Top status bar: person ID, simulated GPS coordinates, simulated heart rate, current time.
- Bottom center: "Back to Overview" button.

### Return to Overview

- Click "Back to Overview" button, or press `ESC`.
- `scene.activeCamera` switches back to the `ArcRotateCamera`.
- Store updates: `activeView` reverts to `'overview'`.

## 5. HUD Floating Components (React Overlay)

Three absolutely-positioned React components layered on the full-screen canvas. Use `pointer-events-none` on the container with `pointer-events-auto` on interactive elements.

### 5.1 Personnel Status Panel (Top-Left)

- Semi-transparent dark card (`bg-black/60 backdrop-blur`).
- Lists 4 personnel rows: status dot (green normal / red violation) + ID + current area name.
- Click a row to pan the overview camera to that person's position.

### 5.2 Alert Toast Stack (Top-Right)

- Reuses existing `alert-toast.tsx` styling with CRITICAL severity.
- Max 3 visible at once; new alerts push older ones down.
- Each toast shows: person ID + zone name + timestamp + "View AR" button.
- Clicking "View AR" triggers the first-person camera switch.

### 5.3 AR View HUD (Full-Screen, First-Person Mode Only)

- Only rendered when `activeView.type === 'ar'`.
- Green border frame + corner brackets + top status bar + bottom "Back to Overview" button.
- Described in Section 4.

## 6. State Management — Zustand Store

```typescript
// ar-tracking-store.ts

interface Personnel {
  id: string;                        // "OP-01"
  name: string;                      // "Chen Wei"
  waypointIndex: number;             // Current path waypoint index
  position: [number, number];        // XZ coordinates
  inZone: string | null;             // Current restricted zone ID or null
  status: 'normal' | 'violation';
}

interface Alert {
  id: string;
  personnelId: string;
  zoneId: string;
  zoneName: string;
  timestamp: number;
  acknowledged: boolean;
}

type ActiveView =
  | 'overview'
  | { type: 'ar'; personnelId: string };

interface ArTrackingState {
  personnel: Personnel[];
  alerts: Alert[];
  activeView: ActiveView;

  // Actions
  triggerAlert: (personnelId: string, zoneId: string) => void;
  acknowledgeAlert: (alertId: string) => void;
  switchToArView: (personnelId: string) => void;
  switchToOverview: () => void;
  updatePersonnelPosition: (id: string, x: number, z: number) => void;
  setPersonnelZoneStatus: (id: string, zoneId: string | null) => void;
}
```

### Scene-Store Interaction

- Babylon.js render loop updates personnel positions each frame and writes to store via `updatePersonnelPosition`.
- AABB collision check runs each frame; on zone enter/exit, calls `setPersonnelZoneStatus` and `triggerAlert`.
- React HUD components subscribe to store via `useArTrackingStore` selectors.
- Camera switch: React triggers `switchToArView(personnelId)` -> store updates `activeView` -> scene reads on next frame and swaps `scene.activeCamera`.

## 7. Design Tokens

Consistent with existing cyberpunk design system:

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0A1628` | Scene clear color, ground |
| Accent Cyan | `#22d3ee` | AR glasses emissive, equipment edge glow |
| Alert Red | `#ef4444` | Restricted zones, violation pulse |
| Warning Amber | `#f59e0b` | Zone warning labels |
| AR Green | `emerald-400/40` | AR view HUD border |
| Text | `#e2e8f0` | HUD text, labels |
| Surface | `black/60` | HUD panel backgrounds |
