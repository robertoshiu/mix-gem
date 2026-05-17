# Surveillance Page Redesign — Realistic CCTV with Meshy Assets

> Date: 2026-05-17
> Status: Approved
> Route: `/mes/surveillance`

## Problem

The current surveillance page renders all equipment as primitive boxes and the engineer as a blue capsule + sphere. The Meshy-generated GLB assets (6 equipment, 3 characters, 3 accessories, 2 HDRI envmaps) exist in `public/models/` but are never loaded. The result looks toy-like and unrealistic.

## Design Decisions

| Decision | Choice |
|----------|--------|
| Relationship to ar-tracking | Separate pages, shared GLB assets |
| Alert → AR view | Cell swap: center cell (#4) temporarily becomes AR POV, auto-reverts 10s |
| Asset status | All GLBs already downloaded, just need GLTF loading wired up |
| Personnel count | 2-3 engineers with distinct patrol routes |
| Camera layout | Rearranged for drama (zone close-ups, dedicated AR cell) |

## Camera Grid (3x3)

```
NW 走廊        俯視全景       NE 走廊
微影區特寫      中控追蹤       化學品特寫
設備區          AR 視角        出入口
```

| Cell | Label | Camera Type | What it shows |
|------|-------|-------------|---------------|
| 0 | NW 走廊 | Fixed | Northwest corridor, looking down the litho walkway |
| 1 | 俯視全景 | Fixed top-down | Full fab bird's-eye, personnel dots visible |
| 2 | NE 走廊 | Fixed | Northeast corridor near metrology bay |
| 3 | 微影區特寫 | Fixed | Litho bay close-up (stepper + spin coater), restricted zone glow |
| 4 | 中控追蹤 | Tracking | Overhead follow-cam on nearest-to-alert person. Default: slow orbit around fab center |
| 5 | 化學品特寫 | Fixed | Chemical storage close-up (CHEM-01, EFEM-02), restricted zone glow |
| 6 | 設備區 | Fixed | South equipment row (CVD, ETCH, robot arm) |
| 7 | AR 視角 | Dormant | Black with "STANDBY" text. Activates on alert -> first-person AR glasses POV |
| 8 | 出入口 | Fixed | Entrance/exit at south side, captures personnel entering/leaving |

## Asset Loading

1. HDRI first: `cleanroom.env` as environment texture for PBR reflections + IBL
2. Equipment batch: All 6 equipment GLBs loaded in parallel via `SceneLoader.ImportMeshAsync`, placed at `equipmentLayout` positions. Scale to fit ~2m x 2.2m x 1.8m bounding box.
3. Characters last: 2-3 `base.glb` instances with `ar_glasses.glb` attached to head bone

### Material Upgrade

- Scene-wide PBR via HDRI environment (no more StandardMaterial)
- Floor: instanced tiles, metalness 0.1, roughness 0.7 (subtle reflection)
- Glass walls: PBR transparent, alpha 0.15, roughness 0.05
- Restricted zones: red translucent volumes with animated emissive pulse (sine 0.1-0.3 alpha)

## Personnel System

| ID | Name | Route | Suit |
|----|------|-------|------|
| ENG-01 | 王志明 | Full loop, enters both restricted zones | White (base.glb) |
| ENG-02 | 李佩芳 | North-only: litho bay -> coating -> metrology | White (base.glb) |
| ENG-03 | 陳大偉 | South-only: EFEM -> SEM -> chemical area edge | Blue (suit_blue.glb) |

### Patrol Behavior

- Independent waypoint arrays, walk speed 0.8-1.2 m/s (varied)
- Pause 2-4s at equipment (inspection simulation)
- Random +/-0.3m lateral offset per waypoint
- Idle rotation toward nearest equipment

### Personnel GLB Composition

Each engineer = `base.glb` + `ar_glasses.glb` parented to head node.
Procedural walk cycle: body Y bob +/-0.03m at 2Hz, rotation swing +/-5 degrees on stride.

## Alert UX Flow

1. Engineer steps into restricted zone -> `isInsideZone` triggers
2. Audio beep (square wave, frequency by severity)
3. Zone camera cell (#3 or #5) red border flash 3s
4. Alert toast slides into right panel with engineer ID, zone name, timestamp
5. Operator clicks "查看 AR":
   - Cell #4 label: `中控追蹤` -> `AR: 王志明` (red text)
   - Cell #4 viewport swaps to engineer's head camera
   - Cell #4 border turns red, steady glow
   - HUD overlays: equipment labels with distance, zone wireframe, warning banner
6. After 10s or click cell #4 -> reverts to tracking cam

### AR Feed HUD Elements

- Equipment labels: white text + line leader, e.g. `LITHO-01 [2.3m]`
- Zone boundary: red dashed wireframe at floor level
- Top-left: `REC` blinking dot + timestamp
- Top-right: engineer ID + signal bars
- Bottom: warning banner when inside zone

### Alert Panel

- Max 5 visible, scrollable
- Unacknowledged alerts pulse gently
- Acknowledged alerts grey out, auto-remove 15s
- Cooldown 8s per person x zone pair

## Performance Guardrails

- Single Babylon engine, single scene, 9 viewports
- GLBs loaded once, characters via `instantiateModelsToScene()`
- Freeze world matrix on all static equipment
- Shadow map 512px (soft CCTV aesthetic)
- Cap to 30fps (CCTV doesn't need 60fps)
- Camera FOV 50 degrees (tighter framing, characters fill cells)

## File Changes

| File | Change |
|------|--------|
| config/assets.ts | Add `loadEquipmentGLBs()` and `loadCharacterGLBs()` async loaders |
| config/patrol.ts | Export 3 patrol routes, add lateral jitter |
| scene/buildCleanroom.ts | Async GLB loading, HDRI env, PBR floor/walls |
| scene/engineerAgent.ts | Accept GLB mesh, support multiple instances, procedural walk bob |
| scene/cameras.ts | New 9 viewport layout, `swapCenterToAR()` / `revertCenter()` |
| systems/alertSystem.ts | Multi-person tracking, "查看 AR" button triggers swap |
| systems/arHud.ts | Equipment labels + zone wireframe + warning banner via Babylon GUI |
| main.ts | Async init, load GLBs -> create 3 engineers -> wire alerts |
| page.tsx | New camera labels, async init, cell #4 red glow CSS |

No new files needed. Zone definitions (`zones.ts`) unchanged.
