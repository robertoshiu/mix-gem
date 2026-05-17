# Surveillance Page Redesign

Date: 2026-05-17

## Summary

Complete overhaul of the `/mes/surveillance` 9-grid CCTV page to fix AR camera angles, replace half-body character models with full-body cleanroom engineers, fix visual issues (white-out, red zone overdrive, dizzy rotation), add collision-free patrol routes, and register the page in MesNavBar.

## Problems Addressed

1. AR camera shows back-of-head or ambiguous angles (hair/chin)
2. Equipment distance HUD labels overlap with ghosting artifacts
3. Character models are upper-body only mannequins
4. Engineers walk through equipment (no collision avoidance)
5. Grid layout issues: cell 7 always STANDBY, cell 3 all-red, cell 4 dizzying rotation, washed-out colors
6. No nav tab entry for surveillance page

## Design

### 1. Grid Layout Restructure

```
[0 NW Corridor]     [1 Bird's Eye]      [2 NE Corridor]
[3 Litho Wide]      [4 AR Main POV]     [5 Chemical Wide]
[6 Equipment Row]   [7 Control Pan]     [8 Entrance]
```

#### Cell 4 (Center) - AR Main POV
- Default: shows ENG-01 first-person AR view (not STANDBY)
- Alert "View AR" button switches to that engineer's POV, auto-reverts to ENG-01 after 10s
- Thin `#0ff` border always present to mark as primary monitor
- STANDBY overlay only shown when zero engineers loaded (error state)

#### Cell 7 (Bottom Center) - Control Pan
- Replaces rotating orbit with slow horizontal pan along X-axis
- Range: -10m to +10m at 0.3m/s
- Fixed height 8m, fixed 45-degree down angle
- Looks at fab center, security-camera-style left-right sweep

#### Cell 3 (Litho Wide) - Pull Back
- Camera position: `(-16, 5, -6)` (was `(-13, 3.5, -4)`)
- Camera target: `(-9, 1.5, 0)` (was `(-9, 1.2, 1)`)
- FOV: 1.0 (was 0.87) - wider to show corridor context, less red zone fill

### 2. Character Model Replacement

#### Remove
- `public/models/character/base.glb` (1.7MB half-body)
- `public/models/character/suit_blue.glb` (1.2MB half-body)

#### Download from Meshy (free, no auth)
- `public/models/character/engineer_white.glb` - White cleanroom suit, full body, realistic
- `public/models/character/engineer_blue.glb` - Blue cleanroom suit, full body, realistic
- Search keywords: `cleanroom engineer`, `hazmat suit`, `bunny suit`, `clean suit worker`
- Target: < 30K faces each, with skeleton preferred but not required

#### AR Glasses
- Keep existing `public/models/accessory/ar_glasses.glb` (3.4MB)
- Attach at fixed offset from root (not head bone)

### 3. AR Camera Fix

Stop depending on GLB head bone position. Use manual sync:

```typescript
// In engineerAgent.ts update():
const forward = Math.sin(root.rotation.y);
const forwardZ = Math.cos(root.rotation.y);
arCamera.position.set(
  root.position.x + forward * 0.15,   // eye forward offset
  1.55,                                 // eye height (fixed)
  root.position.z + forwardZ * 0.15
);
arCamera.rotation.y = root.rotation.y;
arCamera.rotation.x = -0.05;           // subtle downward tilt
```

No dependency on skeleton/head bone. Works with any character GLB.

### 4. HUD Label Overlap Fix (arHud.ts)

- Limit visible labels to nearest 5 (was all 12)
- Hide labels where `projected.z > 1` or `projected.z < 0` (behind camera)
- Proximity culling: if two labels < 30px apart on screen, hide the farther one
- Clear all label positions each frame before re-projecting (prevents ghosting)

### 5. Dark Monitoring Color Scheme

| Element | Old | New |
|---------|-----|-----|
| Floor albedo | (0.72, 0.75, 0.78) | (0.18, 0.20, 0.25) |
| Ceiling albedo | (0.9, 0.92, 0.95) | (0.4, 0.42, 0.45) |
| Ceiling emissive | (0.08, 0.08, 0.1) | (0, 0, 0) removed |
| HDRI intensity | 1.0 | 0.5 |
| Ambient light | 0.3 | 0.15 |
| Sun intensity | 0.7 | 0.5 |
| Glass wall alpha | 0.15 | 0.25 |
| Glass wall emissive | none | (0.02, 0.06, 0.08) cyan edge glow |
| Restricted zone alpha | 0.08-0.12 | 0.03-0.06 |
| Restricted zone emissive | (0.3, 0, 0) pulse | (0.15, 0, 0) subtle pulse |

### 6. Collision-Free Patrol Routes

Redesign all 3 patrol routes to stay in corridors, maintaining 1.5m clearance from all 12 equipment positions in `equipmentLayout`.

- **ENG-01 (Wang Zhiming)** - Outer perimeter loop: south entrance -> west corridor -> north corridor -> east corridor -> back south
- **ENG-02 (Li Peifang)** - North-half central aisle: between CVD/ETCH equipment row, back-and-forth
- **ENG-03 (Chen Dawei)** - South-half corridor: along EFEM -> SEM row

All waypoint X/Z coordinates verified against equipment bounding boxes + 1.5m buffer.

### 7. MesNavBar Entry

Add to `NAV_ITEMS` array after AR Tracking:

```typescript
{ href: '/mes/surveillance', label: 'Surveillance', icon: Activity },
```

## Implementation Order

1. Add nav tab (trivial, immediate visibility)
2. Fix color scheme in `buildCleanroom.ts`
3. Fix grid layout: swap cell 4/7 roles, adjust cell 3 camera, replace cell 7 orbit with pan
4. Fix AR camera in `engineerAgent.ts` (fixed height + forward offset)
5. Fix HUD labels in `arHud.ts` (proximity culling + max 5)
6. Download new character models from Meshy
7. Update `assets.ts` paths and `loadCharacterGLB` to use new models
8. Redesign patrol routes in `patrol.ts` with collision-free waypoints
9. Update `page.tsx` to remove hardcoded STANDBY on cell 7

## Files Modified

- `src/app/mes/surveillance/page.tsx` - Remove cell 7 STANDBY, update labels
- `src/lib/surveillance/main.ts` - Swap AR logic from cell 4 to cell 4 as default
- `src/lib/surveillance/scene/cameras.ts` - Restructure cell 3/4/7 cameras
- `src/lib/surveillance/scene/buildCleanroom.ts` - Dark color scheme
- `src/lib/surveillance/scene/engineerAgent.ts` - Fixed AR camera position
- `src/lib/surveillance/systems/arHud.ts` - Label culling + overlap fix
- `src/lib/surveillance/config/patrol.ts` - Collision-free routes
- `src/lib/surveillance/config/assets.ts` - New model paths
- `src/components/mes/MesNavBar.tsx` - Add surveillance entry
- `public/models/character/` - Replace GLB files
