# AR Tracking v2 — PiP + GLTF Models + Hybrid Zones

> Date: 2026-05-15
> Status: Approved
> Route: `/mes/ar-tracking`
> Builds on: `docs/plans/2026-05-14-ar-tracking-design.md`

## Overview

Three enhancements to the existing AR personnel tracking scene:

1. **PiP (Picture-in-Picture)** — replace full-screen camera swap with a small bottom-right viewport showing the selected person's first-person POV while the overhead view stays active.
2. **GLTF Personnel Models** — replace capsule primitives with 2-3 low-poly cleanroom suit character variants with walk, idle, and look-around animations.
3. **Hybrid Restricted Zones** — reduce static zones from 3 to 2 permanent, add 2 dynamic recipe-triggered zones that fade in/out based on simulated equipment state.

## Decisions

| Topic | Decision |
|-------|----------|
| PiP trigger | Auto-open on first alert, stays sticky until manually closed |
| PiP size | Small & passive (~240x180px), view-only, no mouse interaction |
| PiP control | Personnel panel click switches PiP target; close via X button or ESC |
| GLTF variants | 2-3 GLB files, ~300KB each, under 5K triangles |
| Animations | Walk + idle + look-around, blended with 300ms transitions |
| Animation extras | 50% chance to play look-around after 2-3s idle |
| AR glasses/tag | Still created programmatically, parented to GLTF head bone |
| Permanent zones | HV-ZONE + CHEM-STORE (MAINT-BAY removed) |
| Dynamic zones | IMPLANT-BEAM + LITHO-EUV, recipe-state triggered |
| Dynamic visuals | Fade in 1.5s / fade out 2s on recipe state change |
| Recipe simulation | 45-60s running, 30-45s idle, staggered intervals |
| Full-screen AR view | Removed entirely (replaced by PiP) |

## 1. PiP System

The current full-screen camera swap is replaced with a Picture-in-Picture viewport. The overhead `ArcRotateCamera` always remains the main view.

### Behavior

- PiP is hidden on load. When the first restricted-zone alert fires, it auto-opens showing that person's first-person POV.
- Once open, the PiP stays sticky — it never auto-closes. The user can manually close it via a small X button.
- Clicking a different personnel row in the Personnel Status Panel switches the PiP to that person's POV.
- The "View AR" button on alert toasts also switches the PiP target (instead of doing a full camera swap).

### Rendering

- A second Babylon.js `ViewPort` rendered on the same engine/scene using the existing `UniversalCamera`. Babylon's `camera.viewport` property crops it to the bottom-right corner — no second canvas or engine needed.
- Viewport rect: `new BABYLON.Viewport(0.72, 0.02, 0.26, 0.28)` — roughly 240x180px equivalent, bottom-right.
- A thin cyan border (`#22d3ee`, 1px) drawn via a React overlay `div` positioned to match the viewport rect.
- Small label inside the border: person ID + "LIVE" badge.

### Store Changes

- `pipTarget: string | null` replaces the camera-switching role of `activeView`. `activeView` is removed.
- `openPip(personnelId)`, `closePip()`, `switchPipTarget(personnelId)` actions.
- `triggerAlert` auto-calls `openPip` if PiP is currently closed.

## 2. GLTF Personnel Models

Replace the capsule+sphere+box primitives with low-poly cleanroom suit characters loaded from GLB files.

### Assets

- 2-3 GLB files in `public/models/ar-tracking/`: `cleanroom-a.glb`, `cleanroom-b.glb`, `cleanroom-c.glb`.
- Each GLB contains the mesh + 3 animation clips: `walk`, `idle`, `look-around`.
- Target budget: ~200-400KB per file, under 5K triangles each. Sourced from Mixamo or similar free rigged humanoid, re-exported with cleanroom suit coloring.
- The AR glasses (`CreateBox` with cyan emissive) and name tag (`DynamicTexture` billboard) are still created programmatically and parented to the GLTF skeleton's head bone.

### Loading Strategy

- Use `BABYLON.SceneLoader.ImportMeshAsync` to load all variants during scene init (before render loop starts).
- Clone the loaded mesh for each operator using `instantiateModelsToScene()` — shares geometry/material GPU buffers, independent animation state.
- Operator-to-variant mapping: `OP-01` & `OP-03` use variant A, `OP-02` uses variant B, `OP-04` uses variant C. Hardcoded.

### Animation Blending

- `BABYLON.AnimationGroup` per operator instance.
- While moving toward a waypoint: play `walk` loop, speed scaled to match `PERSONNEL_SPEED`.
- On reaching a waypoint (distance < 0.16): blend to `idle` over 300ms using `AnimationGroup.start()` with blending weight transitions.
- After 2-3 seconds idle: 50% chance to play `look-around` once, then return to `idle`. On next waypoint advance, blend back to `walk`.

### Fallback

If GLB fails to load (network/parse error), fall back to the current capsule primitives. Log a console warning.

## 3. Hybrid Restricted Zones

Reduce static zones from 3 to 2 permanent and add 2 dynamic recipe-based hot zones.

### Permanent Zones (always visible)

- `HV-ZONE` — High Voltage Area (rear right, unchanged)
- `CHEM-STORE` — Chemical Storage (left side, unchanged)
- `MAINT-BAY` is removed as a permanent zone.

### Dynamic Zones (recipe-triggered)

| Zone ID | Name | Anchored To | Trigger |
|---------|------|-------------|---------|
| `IMPLANT-BEAM` | Implant Beam Active | Implant bay (center, `[-2, 5]`) | Implant recipe running |
| `LITHO-EUV` | EUV Exposure Active | Litho Bay (left, `[-18, 10]`) | Litho exposure recipe running |

### Simulated Recipe State

- New store field: `recipeStates: Record<string, 'idle' | 'running'>` for `IMPLANT-BEAM` and `LITHO-EUV`.
- A simple timer cycle simulates recipes: each dynamic zone toggles between `running` (45-60s) and `idle` (30-45s) on randomized intervals. Offsets staggered so they don't always fire together.
- Store action: `setRecipeState(zoneId, state)` called from the render loop timer.

### Visual Behavior

- When recipe starts (`idle` to `running`): zone ground marker and border fade in over 1.5s (alpha 0 to target). Warning label fades in simultaneously.
- When recipe ends (`running` to `idle`): fade out over 2s (alpha to 0), then meshes set `isVisible = false`.
- Same red semi-transparent PBR + dashed border + billboard warning label as permanent zones, plus a pulsing amber `RECIPE ACTIVE` sub-label.

### Collision

Same AABB check as permanent zones. Dynamic zones only trigger alerts when visible (recipe running).

## 4. Store & Data Flow

### Updated Zustand Store Shape

```typescript
interface ArTrackingState {
  personnel: Personnel[];
  alerts: ArAlert[];

  // PiP (replaces activeView)
  pipTarget: string | null;
  openPip: (personnelId: string) => void;
  closePip: () => void;
  switchPipTarget: (personnelId: string) => void;

  // Dynamic zones
  recipeStates: Record<string, 'idle' | 'running'>;
  setRecipeState: (zoneId: string, state: 'idle' | 'running') => void;

  // Existing (kept)
  focusPersonnelId: string | null;
  triggerAlert: (personnelId: string, zoneId: string) => void;
  acknowledgeAlert: (alertId: string) => void;
  updatePersonnelPosition: (id: string, x: number, z: number, waypointIndex?: number) => void;
  setPersonnelZoneStatus: (id: string, zoneId: string | null) => void;
  focusPersonnel: (id: string) => void;
  clearFocusPersonnel: () => void;
}
```

**Removed:** `activeView`, `switchToArView`, `switchToOverview`.

### Data Flow Per Frame

1. Recipe timer ticks — calls `setRecipeState` — dynamic zone meshes fade in/out.
2. Personnel waypoint movement + GLTF animation blend.
3. AABB collision against all visible zones (permanent + active dynamic).
4. If alert fires and `pipTarget === null` — auto `openPip(personnelId)`.
5. PiP viewport camera tracks `pipTarget` person's head position + facing direction.
6. React HUD reads `pipTarget` to render the PiP border overlay and label.

### React Component Changes

- `ArViewHud` (full-screen green border) — removed entirely.
- New `PipOverlay` component: positioned bottom-right, shows person ID + LIVE badge + close button. Only rendered when `pipTarget !== null`.
- `PersonnelStatusPanel`: click calls `focusPersonnel` (pan camera), double-click calls `switchPipTarget` (was `switchToArView`).
- Alert toast "View AR" button calls `switchPipTarget` instead of `switchToArView`.
- ESC key calls `closePip` instead of `switchToOverview`.

## 5. File Structure & Asset Management

### New/Modified Files

```
equipment-monitor/
  public/models/ar-tracking/
    cleanroom-a.glb              # Variant A (~300KB)
    cleanroom-b.glb              # Variant B (~300KB)
    cleanroom-c.glb              # Variant C (~300KB)

  src/stores/
    ar-tracking-store.ts         # Modified: remove activeView, add pipTarget + recipeStates

  src/components/babylon/
    ArTrackingScene.tsx           # Modified: GLTF loading, PiP viewport, dynamic zones, animation

  src/app/mes/ar-tracking/
    page.tsx                     # Modified: remove ArViewHud, add PipOverlay, update handlers
```

No new source files beyond the 3 GLBs. All logic changes fit within the existing 3 source files. `PipOverlay` is defined inline in `page.tsx` alongside the existing `PersonnelStatusPanel` and `AlertToastStack`.

### Asset Sourcing (manual, pre-implementation)

1. Download a free rigged humanoid from Mixamo (e.g., "X Bot" or "Y Bot").
2. Apply 3 animations in Mixamo: walking, idle, looking around.
3. Export as GLB with skin, under 5K tris, bake animations.
4. Re-color in Blender to white cleanroom suit look (2-3 color variants).
5. Place in `public/models/ar-tracking/`.

### Loading Budget

- 3 GLBs x ~300KB = ~900KB total, loaded once at scene init.
- Acceptable for a dashboard app — comparable to a single hero image.
