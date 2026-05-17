# Surveillance Page Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Overhaul the `/mes/surveillance` 9-grid CCTV page — fix AR camera, replace half-body models, fix colors/layout, add nav tab, collision-free patrol routes.

**Architecture:** Single Babylon.js scene rendered through 9 `engine.registerView()` viewports. Each viewport has its own FreeCamera. Engineers are GLB characters patrolling waypoint routes. AR HUD uses Babylon GUI projected labels.

**Tech Stack:** Next.js 15.1, Babylon.js 9.6.2, TypeScript, Jest + RTL for tests.

**Design Doc:** `docs/plans/2026-05-17-surveillance-redesign.md`

---

### Task 1: Add Surveillance to MesNavBar

**Files:**
- Modify: `equipment-monitor/src/components/mes/MesNavBar.tsx:13` (insert after AR Tracking)
- Modify: `equipment-monitor/src/components/mes/MesNavBar.test.tsx` (add assertion)

**Step 1: Update the test to expect Surveillance link**

Add to the first `it` block in `MesNavBar.test.tsx`, after the AR Tracking assertion (line 29):

```typescript
expect(screen.getByRole('link', { name: 'Surveillance' })).toHaveAttribute(
  'href',
  '/mes/surveillance'
);
```

**Step 2: Run test to verify it fails**

Run: `cd equipment-monitor && npx jest src/components/mes/MesNavBar.test.tsx --no-coverage`
Expected: FAIL — "Unable to find role link with name Surveillance"

**Step 3: Add nav item to MesNavBar.tsx**

Insert after line 13 (`ar-tracking` entry):

```typescript
{ href: '/mes/surveillance', label: 'Surveillance', icon: Activity },
```

**Step 4: Run test to verify it passes**

Run: `cd equipment-monitor && npx jest src/components/mes/MesNavBar.test.tsx --no-coverage`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/mes/MesNavBar.tsx src/components/mes/MesNavBar.test.tsx
git commit -m "feat(surveillance): add Surveillance nav tab to MesNavBar"
```

---

### Task 2: Dark Monitoring Color Scheme

**Files:**
- Modify: `equipment-monitor/src/lib/surveillance/scene/buildCleanroom.ts`

**Step 1: Update floor material (line 60-62)**

Change `buildFloor`:
```typescript
floorMat.albedoColor = new Color3(0.18, 0.20, 0.25);
floorMat.metallic = 0.1;
floorMat.roughness = 0.7;
```

**Step 2: Update ceiling material (lines 95-99)**

Change `buildCeiling`:
```typescript
ceilMat.albedoColor = new Color3(0.4, 0.42, 0.45);
ceilMat.metallic = 0.0;
ceilMat.roughness = 0.9;
// Remove emissiveColor line entirely
ceilMat.alpha = 0.85;
```

**Step 3: Update lighting (lines 34-39)**

In `buildCleanroom`:
```typescript
ambient.intensity = 0.15;  // was 0.3
// ...
sun.intensity = 0.5;       // was 0.7
```

**Step 4: Update HDRI intensity**

In `loadEnvironment` (`config/assets.ts` line 81):
```typescript
scene.environmentIntensity = 0.5;  // was 1.0
```

**Step 5: Update glass walls (lines 130-136)**

In `buildWalls`:
```typescript
glassMat.alpha = 0.25;  // was 0.15
glassMat.emissiveColor = new Color3(0.02, 0.06, 0.08);  // add cyan edge glow
```

**Step 6: Update restricted zone visuals (lines 170-175, 211-216)**

In `buildRestrictedZoneVisuals`:
```typescript
zoneMat.alpha = 0.04;  // was 0.1

// In the onBeforeRenderObservable callback:
const alpha = 0.03 + Math.sin(pulseTime * 2) * 0.03;  // was 0.08 + 0.04
zoneMat.alpha = alpha;
zoneMat.emissiveColor = new Color3(
  0.15 + Math.sin(pulseTime * 2) * 0.05,  // was 0.3 + 0.1
  0,
  0,
);
```

**Step 7: Verify build**

Run: `cd equipment-monitor && npx next build 2>&1 | tail -5`
Expected: Build succeeds with no TypeScript errors.

**Step 8: Commit**

```bash
git add src/lib/surveillance/scene/buildCleanroom.ts src/lib/surveillance/config/assets.ts
git commit -m "fix(surveillance): dark monitoring color scheme — reduce overexposure and improve contrast"
```

---

### Task 3: Grid Layout Restructure — Cameras

**Files:**
- Modify: `equipment-monitor/src/lib/surveillance/scene/cameras.ts`

**Step 1: Fix cell 3 (litho wide) — pull back camera (lines 59-62)**

```typescript
// [3] 微影區遠景 — litho bay wide shot (pulled back from restricted zone)
const camLitho = new FreeCamera('cam-litho-wide', new Vector3(-16, 5, -6), scene);
camLitho.setTarget(new Vector3(-9, 1.5, 0));
camLitho.fov = 1.0;  // wider than FOV_TIGHT
cameras.push(camLitho);
```

**Step 2: Replace cell 4 tracking camera with AR default (lines 65-68)**

Cell 4 is now the AR main viewport. Remove the tracking camera creation here. Instead, push a placeholder that will be swapped to ENG-01's AR camera after engineers load:

```typescript
// [4] AR 主視角 — default: first engineer's AR POV (swapped in main.ts after load)
const camARDefault = new FreeCamera('cam-ar-default', new Vector3(0, 1.55, 0), scene);
camARDefault.fov = 1.22;
camARDefault.minZ = 0.1;
camARDefault.maxZ = 50;
cameras.push(camARDefault);
```

**Step 3: Replace cell 7 AR standby with control pan camera (lines 82-87)**

```typescript
// [7] 中控平移 — slow horizontal pan, security-camera style
const camControlPan = new FreeCamera('cam-control-pan', new Vector3(0, 8, 0), scene);
camControlPan.setTarget(new Vector3(0, 0, 0));
camControlPan.fov = FOV_WIDE;
cameras.push(camControlPan);
```

**Step 4: Replace orbit logic with horizontal pan (lines 100-158)**

Replace the entire orbit state + `updateTrackingOrbit` + `onBeforeRenderObservable` block:

```typescript
// Control pan state (cell 7)
let panX = 0;
let panDir = 1;
const PAN_SPEED = 0.3;  // m/s
const PAN_RANGE = 10;   // meters
const PAN_HEIGHT = 8;
const PAN_ANGLE = -Math.PI / 4; // 45 degrees down

scene.onBeforeRenderObservable.add(() => {
  const dt = scene.getEngine().getDeltaTime() / 1000;
  panX += PAN_SPEED * panDir * dt;
  if (panX > PAN_RANGE) { panX = PAN_RANGE; panDir = -1; }
  if (panX < -PAN_RANGE) { panX = -PAN_RANGE; panDir = 1; }
  camControlPan.position.x = panX;
  camControlPan.position.y = PAN_HEIGHT;
  camControlPan.position.z = 0;
  camControlPan.setTarget(new Vector3(panX, 0, 0));
});
```

**Step 5: Update CameraGrid interface and return**

Remove `trackingCamera` and `arStandbyCamera` from the interface. Add `controlPanCamera` and `arDefaultCamera`:

```typescript
export interface CameraGrid {
  cameras: Camera[];
  arDefaultCamera: FreeCamera;     // cell 4: AR main
  controlPanCamera: FreeCamera;    // cell 7: pan
  birdEyeCamera: FreeCamera;      // cell 1: top-down
  views: ReturnType<Engine['registerView']>[];
  setDefaultAR(agent: EngineerAgent): void;
  swapToAR(agent: EngineerAgent): void;
  revertToDefaultAR(): void;
  isARSwapped: boolean;
  currentARAgent: EngineerAgent | null;
  defaultARAgent: EngineerAgent | null;
}
```

**Step 6: Implement setDefaultAR + swap logic**

```typescript
let defaultARAgent: EngineerAgent | null = null;
let isARSwapped = false;
let currentARAgent: EngineerAgent | null = null;
let revertTimer: ReturnType<typeof setTimeout> | null = null;

function setDefaultAR(agent: EngineerAgent): void {
  defaultARAgent = agent;
  if (!isARSwapped) {
    views[4].camera = agent.arCamera;
    currentARAgent = agent;
  }
}

function swapToAR(agent: EngineerAgent): void {
  if (revertTimer) clearTimeout(revertTimer);
  views[4].camera = agent.arCamera;
  isARSwapped = true;
  currentARAgent = agent;
  revertTimer = setTimeout(() => revertToDefaultAR(), 10000);
}

function revertToDefaultAR(): void {
  if (revertTimer) { clearTimeout(revertTimer); revertTimer = null; }
  isARSwapped = false;
  if (defaultARAgent) {
    views[4].camera = defaultARAgent.arCamera;
    currentARAgent = defaultARAgent;
  } else {
    views[4].camera = camARDefault;
    currentARAgent = null;
  }
}
```

**Step 7: Update return object**

```typescript
return {
  cameras,
  arDefaultCamera: camARDefault,
  controlPanCamera: camControlPan,
  birdEyeCamera: camBirdEye,
  views,
  setDefaultAR,
  swapToAR,
  revertToDefaultAR,
  get isARSwapped() { return isARSwapped; },
  get currentARAgent() { return currentARAgent; },
  get defaultARAgent() { return defaultARAgent; },
};
```

**Step 8: Verify build**

Run: `cd equipment-monitor && npx tsc --noEmit 2>&1 | head -20`
Expected: Errors in `main.ts` (references old API). That's expected — fixed in Task 4.

**Step 9: Commit**

```bash
git add src/lib/surveillance/scene/cameras.ts
git commit -m "feat(surveillance): restructure grid — AR main at cell 4, control pan at cell 7, litho wide at cell 3"
```

---

### Task 4: Update main.ts for New Camera API

**Files:**
- Modify: `equipment-monitor/src/lib/surveillance/main.ts`

**Step 1: Update AR wiring after engineers load (lines 44-64)**

After the engineer loading loop, set cell 4 default to first engineer:

```typescript
// Set first engineer as default AR view for cell 4
if (engineers.length > 0) {
  cameraGrid.setDefaultAR(engineers[0]);
}
```

**Step 2: Update alert onViewAR callback (lines 70-89)**

Replace `cameraGrid.swapCenterToAR` with `cameraGrid.swapToAR`:

```typescript
alertSystem.onViewAR = (engineerId: string) => {
  const agent = engineers.find(e => e.id === engineerId);
  if (agent) {
    cameraGrid.swapToAR(agent);
    arHud.setActiveEngineer(agent.id, agent.name);

    const cell4Label = document.querySelector('[data-cam-index="4"] .cam-label');
    if (cell4Label) {
      cell4Label.textContent = `AR: ${agent.name}`;
      cell4Label.classList.add('ar-active');
    }
    const cell4 = document.querySelector('[data-cam-index="4"]');
    if (cell4) cell4.setAttribute('data-ar-swap', 'true');
  }
};
```

**Step 3: Update click-to-revert handler (lines 95-111)**

Replace `cameraGrid.revertCenter` with `cameraGrid.revertToDefaultAR`:

```typescript
if (cell4) {
  cell4.addEventListener('click', () => {
    if (cameraGrid.isARSwapped) {
      cameraGrid.revertToDefaultAR();
      // When reverting, show default engineer's HUD instead of clearing
      if (cameraGrid.defaultARAgent) {
        arHud.setActiveEngineer(cameraGrid.defaultARAgent.id, cameraGrid.defaultARAgent.name);
      } else {
        arHud.clearActiveEngineer();
      }

      const cell4Label = document.querySelector('[data-cam-index="4"] .cam-label');
      if (cell4Label) {
        cell4Label.textContent = 'AR 主視角';
        cell4Label.classList.remove('ar-active');
      }
      cell4.removeAttribute('data-ar-swap');
    }
  });
}
```

**Step 4: Update patchedRevertCheck (lines 114-126)**

```typescript
const patchedRevertCheck = () => {
  if (!cameraGrid.isARSwapped) {
    if (cameraGrid.defaultARAgent) {
      arHud.setActiveEngineer(cameraGrid.defaultARAgent.id, cameraGrid.defaultARAgent.name);
    } else {
      arHud.clearActiveEngineer();
    }
    const label = document.querySelector('[data-cam-index="4"] .cam-label');
    if (label && label.classList.contains('ar-active')) {
      label.textContent = 'AR 主視角';
      label.classList.remove('ar-active');
    }
    const cell = document.querySelector('[data-cam-index="4"]');
    if (cell) cell.removeAttribute('data-ar-swap');
  }
};
```

**Step 5: Update render loop — AR HUD always active when default is set (lines 150-158)**

```typescript
// AR HUD update (always active when cell 4 shows any AR view)
if (cameraGrid.currentARAgent) {
  arHud.update();
  wasARSwapped = cameraGrid.isARSwapped;
} else if (wasARSwapped) {
  patchedRevertCheck();
  wasARSwapped = false;
}
```

**Step 6: Verify build**

Run: `cd equipment-monitor && npx tsc --noEmit 2>&1 | head -20`
Expected: Clean (or only unrelated warnings).

**Step 7: Commit**

```bash
git add src/lib/surveillance/main.ts
git commit -m "feat(surveillance): wire main.ts to new camera grid API — AR default on cell 4"
```

---

### Task 5: Fix AR Camera Position in engineerAgent.ts

**Files:**
- Modify: `equipment-monitor/src/lib/surveillance/scene/engineerAgent.ts:129-140`

**Step 1: Replace headNode-dependent camera sync**

Replace lines 129-140 (the entire "Sync AR camera to head position" block) with:

```typescript
// Sync AR camera to fixed eye position (no head bone dependency)
const fwd = Math.sin(root.rotation.y);
const fwdZ = Math.cos(root.rotation.y);
arCamera.position.set(
  root.position.x + fwd * 0.15,
  1.55,
  root.position.z + fwdZ * 0.15,
);
arCamera.rotation.y = root.rotation.y;
arCamera.rotation.x = -0.05;
```

**Step 2: Clean up headNode from interface and constructor**

In the `EngineerAgent` interface (line 19), remove `headNode`:
```typescript
export interface EngineerAgent {
  id: string;
  name: string;
  root: TransformNode;
  arCamera: FreeCamera;
  position: Vector3;
  state: AgentState;
  currentWaypointIndex: number;
  update(dt: number): void;
  dispose(): void;
}
```

In `createEngineerAgent` (line 41), remove destructuring of headNode:
```typescript
const { root } = character;
```

In return object, remove `headNode`.

**Step 3: Verify build**

Run: `cd equipment-monitor && npx tsc --noEmit 2>&1 | head -20`
Expected: Errors in `main.ts` line 52 (references `character.allMeshes` via headNode for shadows) — the headNode removal affects shadow caster loop, but `character.allMeshes` is still available, so no issue there. Check for any `headNode` references.

**Step 4: Fix any remaining headNode references**

In `main.ts` line 52-54, the shadow caster loop uses `character.allMeshes` not `headNode`, so it should be fine. Verify no other files reference `agent.headNode`.

Run: `cd equipment-monitor && grep -rn "headNode" src/lib/surveillance/ --include="*.ts"`

**Step 5: Commit**

```bash
git add src/lib/surveillance/scene/engineerAgent.ts
git commit -m "fix(surveillance): AR camera uses fixed eye height + forward offset — no head bone dependency"
```

---

### Task 6: Fix HUD Label Overlap in arHud.ts

**Files:**
- Modify: `equipment-monitor/src/lib/surveillance/systems/arHud.ts:184-253`

**Step 1: Replace the update function's equipment marker section (lines 214-235)**

Replace with proximity-culled, max-5 nearest logic:

```typescript
// Equipment markers — show nearest 5, cull overlap
// First: compute all distances and screen positions
const markerData: Array<{ marker: LabelMarker; dist: number; sx: number; sy: number }> = [];

for (const marker of markers) {
  marker.rect.isVisible = false; // Reset all
  const dist = Vector3.Distance(camPos, marker.worldPos);
  if (dist > 12) continue; // Too far

  const projected = Vector3.Project(
    marker.worldPos,
    scene.getTransformMatrix(),
    activeCamera.getViewMatrix().multiply(activeCamera.getProjectionMatrix()),
    activeCamera.viewport.toGlobal(
      scene.getEngine().getRenderWidth(),
      scene.getEngine().getRenderHeight(),
    ),
  );

  // Behind camera check
  if (projected.z > 1 || projected.z < 0) continue;

  const sx = (projected.x / scene.getEngine().getRenderWidth() - 0.5) * ui.idealWidth!;
  const sy = (projected.y / scene.getEngine().getRenderHeight() - 0.5) * ui.idealHeight!;
  markerData.push({ marker, dist, sx, sy });
}

// Sort by distance, keep nearest 5
markerData.sort((a, b) => a.dist - b.dist);
const visible = markerData.slice(0, 5);

// Proximity culling: remove overlapping labels (< 30px apart)
const accepted: typeof visible = [];
for (const item of visible) {
  const tooClose = accepted.some(a =>
    Math.abs(a.sx - item.sx) < 30 && Math.abs(a.sy - item.sy) < 30
  );
  if (!tooClose) accepted.push(item);
}

// Apply positions
for (const { marker, dist, sx, sy } of accepted) {
  marker.rect.isVisible = true;
  marker.text.text = `${marker.label} [${dist.toFixed(1)}m]`;
  marker.rect.alpha = Math.max(0.4, 1 - dist / 12);
  marker.rect.left = `${sx}px`;
  marker.rect.top = `${sy}px`;
}
```

**Step 2: Verify build**

Run: `cd equipment-monitor && npx tsc --noEmit 2>&1 | head -20`
Expected: Clean.

**Step 3: Commit**

```bash
git add src/lib/surveillance/systems/arHud.ts
git commit -m "fix(surveillance): HUD labels — nearest-5 culling, overlap rejection, behind-camera filter"
```

---

### Task 7: Update page.tsx — Labels + Remove STANDBY

**Files:**
- Modify: `equipment-monitor/src/app/mes/surveillance/page.tsx`

**Step 1: Update CAMERA_LABELS array (lines 6-10)**

```typescript
const CAMERA_LABELS = [
  'NW 走廊', '俯視全景', 'NE 走廊',
  '微影區遠景', 'AR 主視角', '化學品遠景',
  '設備區', '中控平移', '出入口',
];
```

**Step 2: Move STANDBY overlay from cell 7 to cell 4 (line 66-69)**

Change `i === 7` to `i === 4`:

```typescript
{i === 4 && (
  <div className="standby-overlay" id="standby-overlay">
    <span className="standby-text">STANDBY</span>
  </div>
)}
```

**Step 3: Update CSS for cell 4 styling (lines 176-183)**

Replace cell 4 CSS selector references:

```css
.cam-cell[data-cam-index="4"] {
  outline: 1px solid #0ff;
}

.cam-cell[data-cam-index="4"] .cam-label {
  color: #0ff;
}
```

Remove the hover rule for cell 4 (line 181-183) — cell 4 is always the AR focus.

**Step 4: Add logic to hide STANDBY when engineers load**

In `main.ts`, after `setDefaultAR`, hide the STANDBY overlay:

```typescript
if (engineers.length > 0) {
  cameraGrid.setDefaultAR(engineers[0]);
  // Hide STANDBY overlay since we have an AR view
  const standby = document.getElementById('standby-overlay');
  if (standby) standby.style.display = 'none';
}
```

**Step 5: Verify build**

Run: `cd equipment-monitor && npx next build 2>&1 | tail -5`
Expected: Build succeeds.

**Step 6: Commit**

```bash
git add src/app/mes/surveillance/page.tsx src/lib/surveillance/main.ts
git commit -m "fix(surveillance): update grid labels, move STANDBY to cell 4, auto-hide on engineer load"
```

---

### Task 8: Collision-Free Patrol Routes

**Files:**
- Modify: `equipment-monitor/src/lib/surveillance/config/patrol.ts`

Equipment positions (from `assets.ts` equipmentLayout) for reference:
```
(-9,0,3)  LITHO-01     (-9,0,-2)  LITHO-02    (-4,0,3)  COAT-01
(0,0,4)   CVD-01       (4,0,4)    ETCH-01     (2,0,2)   ROBOT-01
(-4,0,-6) EFEM-01      (0,0,-6)   SEM-01      (4,0,-6)  SEM-02
(8,0,-3)  PVD-01       (11,0,-7)  CHEM-01     (11,0,-5) EFEM-02
```

Fab bounds: X=[-15,15], Z=[-10,10]. All waypoints must be >= 1.5m from any equipment.

**Step 1: Replace route01 — Outer perimeter loop**

```typescript
const route01: PatrolRoute = {
  id: 'ENG-01',
  name: '王志明',
  suitVariant: 'base',
  walkSpeed: 1.0,
  waypoints: [
    { position: new Vector3(0, 0, -9), pauseDuration: 2 },     // South entrance
    { position: new Vector3(-7, 0, -9), pauseDuration: 1 },    // SW corner approach
    { position: new Vector3(-13, 0, -9), pauseDuration: 2 },   // West wall south
    { position: new Vector3(-13, 0, 0), pauseDuration: 1 },    // West wall mid
    { position: new Vector3(-13, 0, 8), pauseDuration: 2 },    // NW corner
    { position: new Vector3(0, 0, 8), pauseDuration: 1 },      // North wall center
    { position: new Vector3(7, 0, 8), pauseDuration: 1 },      // NE approach
    { position: new Vector3(13, 0, 8), pauseDuration: 2 },     // NE corner
    { position: new Vector3(13, 0, 0), pauseDuration: 1 },     // East wall mid
    { position: new Vector3(13, 0, -9), pauseDuration: 2 },    // SE corner
    { position: new Vector3(7, 0, -9), pauseDuration: 1 },     // SE approach
  ],
};
```

**Step 2: Replace route02 — North-half central aisle**

```typescript
const route02: PatrolRoute = {
  id: 'ENG-02',
  name: '李佩芳',
  suitVariant: 'base',
  walkSpeed: 0.85,
  waypoints: [
    { position: new Vector3(-2, 0, 7), pauseDuration: 3 },     // North aisle west
    { position: new Vector3(-2, 0, 3), pauseDuration: 4 },     // Near COAT-01 (safe distance)
    { position: new Vector3(2, 0, 6), pauseDuration: 2 },      // Between CVD and ETCH
    { position: new Vector3(6, 0, 6), pauseDuration: 3 },      // East of ETCH-01
    { position: new Vector3(6, 0, 2), pauseDuration: 2 },      // South of ETCH row
    { position: new Vector3(2, 0, 0), pauseDuration: 3 },      // Central spine
    { position: new Vector3(-2, 0, 0), pauseDuration: 2 },     // West of central
    { position: new Vector3(-2, 0, 5), pauseDuration: 2 },     // Return north
  ],
};
```

**Step 3: Replace route03 — South-half corridor**

```typescript
const route03: PatrolRoute = {
  id: 'ENG-03',
  name: '陳大偉',
  suitVariant: 'blue',
  walkSpeed: 1.15,
  waypoints: [
    { position: new Vector3(-7, 0, -4), pauseDuration: 3 },    // West of EFEM-01
    { position: new Vector3(-2, 0, -4), pauseDuration: 2 },    // Between EFEM and SEM
    { position: new Vector3(2, 0, -4), pauseDuration: 3 },     // Near SEM-01
    { position: new Vector3(6, 0, -4), pauseDuration: 2 },     // Between SEM-02 and PVD
    { position: new Vector3(6, 0, -8), pauseDuration: 2 },     // South of PVD
    { position: new Vector3(2, 0, -8), pauseDuration: 2 },     // South aisle
    { position: new Vector3(-2, 0, -8), pauseDuration: 2 },    // SW aisle
    { position: new Vector3(-7, 0, -8), pauseDuration: 2 },    // Return west
  ],
};
```

**Step 4: Verify no waypoint collides with equipment**

Manual check: all waypoints are in corridors at Y=0, with X/Z values >= 1.5m from nearest equipment position. Closest approaches:
- route01 at (-13,0,0): nearest equipment is LITHO-01 at (-9,0,3) = 5m away. Safe.
- route02 at (-2,0,3): nearest is COAT-01 at (-4,0,3) = 2m away. Safe.
- route03 at (-2,0,-4): nearest is SEM-01 at (0,0,-6) = 2.8m away. Safe.

**Step 5: Verify build**

Run: `cd equipment-monitor && npx tsc --noEmit 2>&1 | head -10`
Expected: Clean.

**Step 6: Commit**

```bash
git add src/lib/surveillance/config/patrol.ts
git commit -m "fix(surveillance): collision-free patrol routes — 1.5m equipment clearance on all waypoints"
```

---

### Task 9: Download New Character Models from Meshy

**Files:**
- Download to: `equipment-monitor/public/models/character/engineer_white.glb`
- Download to: `equipment-monitor/public/models/character/engineer_blue.glb`

**Step 1: Search Meshy for cleanroom engineer models**

Use WebFetch to browse Meshy tag pages:
- Search `cleanroom engineer`, `hazmat suit character`, `bunny suit worker`, `clean suit`
- Look for full-body, realistic style, < 30K faces
- Prefer GLB format with CC0 license

**Step 2: Download best candidates**

Use WebFetch to get the CDN-signed GLB URL from the model page, then download to `public/models/character/`.

**Step 3: If no suitable cleanroom models found, broaden search**

Try: `scientist character`, `lab worker`, `protective suit`, `space suit character`
The key requirement is: full body, standing, realistic proportions.

**Step 4: Verify downloads**

```bash
ls -la equipment-monitor/public/models/character/engineer_*.glb
```

Expected: Two files, each < 5MB.

**Step 5: Update models.json**

```json
{
  "models": ["engineer_white.glb", "engineer_blue.glb"]
}
```

**Step 6: Commit**

```bash
git add public/models/character/engineer_white.glb public/models/character/engineer_blue.glb public/models/character/models.json
git commit -m "feat(surveillance): add full-body cleanroom engineer GLB models from Meshy"
```

---

### Task 10: Update assets.ts for New Character Models

**Files:**
- Modify: `equipment-monitor/src/lib/surveillance/config/assets.ts`

**Step 1: Update ASSET_PATHS character section (lines 24-27)**

```typescript
character: {
  base: '/models/character/engineer_white.glb',
  suitBlue: '/models/character/engineer_blue.glb',
},
```

**Step 2: Simplify loadCharacterGLB — remove head bone search (lines 181-258)**

Replace the entire function. Since we no longer need headNode:

```typescript
export async function loadCharacterGLB(
  scene: BABYLON.Scene,
  variant: 'base' | 'blue' = 'base',
): Promise<LoadedCharacter> {
  const charPath = variant === 'blue'
    ? BASE_PATH + ASSET_PATHS.character.suitBlue
    : BASE_PATH + ASSET_PATHS.character.base;

  const charResult = await BABYLON.SceneLoader.ImportMeshAsync(null, '', charPath, scene);
  const root = charResult.meshes[0] as unknown as BABYLON.TransformNode;
  const allMeshes = [...charResult.meshes];

  // Load AR glasses and attach at fixed head position
  try {
    const glassesPath = BASE_PATH + ASSET_PATHS.accessory.arGlasses;
    const glassesResult = await BABYLON.SceneLoader.ImportMeshAsync(null, '', glassesPath, scene);
    const glassesRoot = glassesResult.meshes[0];
    glassesRoot.parent = root;
    glassesRoot.position = new BABYLON.Vector3(0, 1.6, 0.08);
    glassesRoot.scaling = new BABYLON.Vector3(0.6, 0.6, 0.6);
    allMeshes.push(...glassesResult.meshes);
  } catch {
    console.warn(`[surveillance] AR glasses not available for ${variant}`);
  }

  // Scale character to ~1.7m height
  const childMeshes = root.getChildMeshes();
  if (childMeshes.length > 0) {
    root.computeWorldMatrix(true);
    let minY = Infinity;
    let maxY = -Infinity;
    for (const mesh of childMeshes) {
      mesh.computeWorldMatrix(true);
      const bi = mesh.getBoundingInfo();
      minY = Math.min(minY, bi.boundingBox.minimumWorld.y);
      maxY = Math.max(maxY, bi.boundingBox.maximumWorld.y);
    }
    const currentHeight = maxY - minY;
    if (currentHeight > 0 && Math.abs(currentHeight - 1.7) > 0.3) {
      const scale = 1.7 / currentHeight;
      root.scaling.scaleInPlace(scale);
    }
  }

  return { root, headNode: null, allMeshes };
}
```

**Step 3: Verify build**

Run: `cd equipment-monitor && npx tsc --noEmit 2>&1 | head -10`
Expected: Clean. (headNode is still in LoadedCharacter interface but set to null — consumers already handle null.)

**Step 4: Commit**

```bash
git add src/lib/surveillance/config/assets.ts
git commit -m "feat(surveillance): update asset paths for new full-body engineer models, simplify character loader"
```

---

### Task 11: Final Integration Verification

**Step 1: Run full test suite**

```bash
cd equipment-monitor && npx jest --no-coverage 2>&1 | tail -20
```

Expected: All 54+ tests pass. The MesNavBar test now includes Surveillance assertion.

**Step 2: Run TypeScript check**

```bash
cd equipment-monitor && npx tsc --noEmit
```

Expected: Clean.

**Step 3: Run build**

```bash
cd equipment-monitor && npx next build 2>&1 | tail -10
```

Expected: Static export succeeds, `/mes/surveillance` route included.

**Step 4: Commit any remaining fixes**

If any issues found, fix and commit with appropriate message.
