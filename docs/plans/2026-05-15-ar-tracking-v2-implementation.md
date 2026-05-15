# AR Tracking v2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enhance AR personnel tracking with PiP viewport, GLTF character models, and hybrid restricted zones.

**Architecture:** Modify the existing 3-file AR tracking system (store, scene, page). Replace full-screen camera swap with a Babylon.js multi-camera viewport for PiP. Load GLTF models with animation blending via `@babylonjs/loaders`. Add recipe-state simulation for dynamic restricted zones with fade transitions.

**Tech Stack:** Babylon.js 9.6 (`@babylonjs/core`, `@babylonjs/loaders`), Zustand, Next.js, React, TypeScript, Jest

**Design doc:** `docs/plans/2026-05-15-ar-tracking-v2-design.md`

---

### Task 1: Install @babylonjs/loaders

GLTF loading requires the `@babylonjs/loaders` package, which is not currently installed.

**Files:**
- Modify: `equipment-monitor/package.json`

**Step 1: Install the package**

Run:
```bash
cd /mnt/e/repo/mix-gem/equipment-monitor && npm install @babylonjs/loaders@^9.6.2
```

Expected: package.json updated, no errors.

**Step 2: Verify installation**

Run:
```bash
cd /mnt/e/repo/mix-gem/equipment-monitor && node -e "require('@babylonjs/loaders')" 2>&1 && echo "OK"
```

Expected: `OK`

**Step 3: Commit**

```bash
cd /mnt/e/repo/mix-gem/equipment-monitor
git add package.json package-lock.json
git commit -m "chore: add @babylonjs/loaders for GLTF model support"
```

---

### Task 2: Update Zustand store — remove activeView, add pipTarget + recipeStates

Replace the full-screen AR view state with PiP target tracking and add dynamic zone recipe state.

**Files:**
- Modify: `equipment-monitor/src/stores/ar-tracking-store.ts`
- Create: `equipment-monitor/src/stores/ar-tracking-store.test.ts`

**Step 1: Write tests for the updated store**

Create `equipment-monitor/src/stores/ar-tracking-store.test.ts`:

```typescript
import { useArTrackingStore, RESTRICTED_ZONES, DYNAMIC_ZONES, INITIAL_PERSONNEL } from '@/stores/ar-tracking-store';

beforeEach(() => {
  useArTrackingStore.setState({
    personnel: INITIAL_PERSONNEL.map((p) => ({ ...p })),
    alerts: [],
    pipTarget: null,
    focusPersonnelId: null,
    recipeStates: Object.fromEntries(DYNAMIC_ZONES.map((z) => [z.id, 'idle' as const])),
  });
});

describe('initial state', () => {
  it('has 4 personnel in normal status', () => {
    const state = useArTrackingStore.getState();
    expect(state.personnel).toHaveLength(4);
    state.personnel.forEach((p) => expect(p.status).toBe('normal'));
  });

  it('has pipTarget null', () => {
    expect(useArTrackingStore.getState().pipTarget).toBeNull();
  });

  it('has all recipe states idle', () => {
    const states = useArTrackingStore.getState().recipeStates;
    expect(states['IMPLANT-BEAM']).toBe('idle');
    expect(states['LITHO-EUV']).toBe('idle');
  });

  it('has 2 permanent restricted zones', () => {
    expect(RESTRICTED_ZONES).toHaveLength(2);
    expect(RESTRICTED_ZONES.map((z) => z.id)).toEqual(['HV-ZONE', 'CHEM-STORE']);
  });

  it('has 2 dynamic zones', () => {
    expect(DYNAMIC_ZONES).toHaveLength(2);
    expect(DYNAMIC_ZONES.map((z) => z.id)).toEqual(['IMPLANT-BEAM', 'LITHO-EUV']);
  });
});

describe('PiP actions', () => {
  it('openPip sets pipTarget', () => {
    useArTrackingStore.getState().openPip('OP-01');
    expect(useArTrackingStore.getState().pipTarget).toBe('OP-01');
  });

  it('closePip clears pipTarget', () => {
    useArTrackingStore.getState().openPip('OP-01');
    useArTrackingStore.getState().closePip();
    expect(useArTrackingStore.getState().pipTarget).toBeNull();
  });

  it('switchPipTarget changes target', () => {
    useArTrackingStore.getState().openPip('OP-01');
    useArTrackingStore.getState().switchPipTarget('OP-03');
    expect(useArTrackingStore.getState().pipTarget).toBe('OP-03');
  });
});

describe('triggerAlert auto-opens PiP', () => {
  it('auto-opens PiP on first alert when pipTarget is null', () => {
    useArTrackingStore.getState().triggerAlert('OP-02', 'HV-ZONE');
    const state = useArTrackingStore.getState();
    expect(state.alerts).toHaveLength(1);
    expect(state.pipTarget).toBe('OP-02');
  });

  it('does not change pipTarget if already set', () => {
    useArTrackingStore.getState().openPip('OP-01');
    useArTrackingStore.getState().triggerAlert('OP-02', 'HV-ZONE');
    expect(useArTrackingStore.getState().pipTarget).toBe('OP-01');
  });
});

describe('recipe states', () => {
  it('setRecipeState changes a zone to running', () => {
    useArTrackingStore.getState().setRecipeState('IMPLANT-BEAM', 'running');
    expect(useArTrackingStore.getState().recipeStates['IMPLANT-BEAM']).toBe('running');
    expect(useArTrackingStore.getState().recipeStates['LITHO-EUV']).toBe('idle');
  });

  it('setRecipeState changes a zone back to idle', () => {
    useArTrackingStore.getState().setRecipeState('LITHO-EUV', 'running');
    useArTrackingStore.getState().setRecipeState('LITHO-EUV', 'idle');
    expect(useArTrackingStore.getState().recipeStates['LITHO-EUV']).toBe('idle');
  });
});

describe('zone collision with dynamic zones', () => {
  it('setPersonnelZoneStatus works for dynamic zone IDs', () => {
    useArTrackingStore.getState().setPersonnelZoneStatus('OP-01', 'IMPLANT-BEAM');
    const person = useArTrackingStore.getState().personnel.find((p) => p.id === 'OP-01');
    expect(person?.inZone).toBe('IMPLANT-BEAM');
    expect(person?.status).toBe('violation');
  });
});

describe('existing actions still work', () => {
  it('acknowledgeAlert marks alert acknowledged', () => {
    useArTrackingStore.getState().triggerAlert('OP-01', 'HV-ZONE');
    const alertId = useArTrackingStore.getState().alerts[0].id;
    useArTrackingStore.getState().acknowledgeAlert(alertId);
    expect(useArTrackingStore.getState().alerts[0].acknowledged).toBe(true);
  });

  it('focusPersonnel and clearFocusPersonnel', () => {
    useArTrackingStore.getState().focusPersonnel('OP-03');
    expect(useArTrackingStore.getState().focusPersonnelId).toBe('OP-03');
    useArTrackingStore.getState().clearFocusPersonnel();
    expect(useArTrackingStore.getState().focusPersonnelId).toBeNull();
  });
});
```

**Step 2: Run tests to verify they fail**

Run:
```bash
cd /mnt/e/repo/mix-gem/equipment-monitor && npx jest src/stores/ar-tracking-store.test.ts --no-cache 2>&1 | tail -20
```

Expected: FAIL — `DYNAMIC_ZONES` not exported, `pipTarget` not in state, `openPip` not defined, etc.

**Step 3: Implement the updated store**

Replace `equipment-monitor/src/stores/ar-tracking-store.ts` with:

```typescript
import { create } from 'zustand';

export interface Personnel {
  id: string;
  name: string;
  waypointIndex: number;
  position: [number, number];
  inZone: string | null;
  status: 'normal' | 'violation';
}

export interface RestrictedZone {
  id: string;
  name: string;
  center: [number, number];
  size: [number, number];
}

export interface DynamicZone extends RestrictedZone {
  anchoredTo: string;
}

export interface ArAlert {
  id: string;
  personnelId: string;
  zoneId: string;
  zoneName: string;
  timestamp: number;
  acknowledged: boolean;
}

interface ArTrackingState {
  personnel: Personnel[];
  alerts: ArAlert[];

  // PiP
  pipTarget: string | null;
  openPip: (personnelId: string) => void;
  closePip: () => void;
  switchPipTarget: (personnelId: string) => void;

  // Dynamic zones
  recipeStates: Record<string, 'idle' | 'running'>;
  setRecipeState: (zoneId: string, state: 'idle' | 'running') => void;

  // Existing
  focusPersonnelId: string | null;
  triggerAlert: (personnelId: string, zoneId: string) => void;
  acknowledgeAlert: (alertId: string) => void;
  updatePersonnelPosition: (id: string, x: number, z: number, waypointIndex?: number) => void;
  setPersonnelZoneStatus: (id: string, zoneId: string | null) => void;
  focusPersonnel: (id: string) => void;
  clearFocusPersonnel: () => void;
}

export const RESTRICTED_ZONES: RestrictedZone[] = [
  { id: 'HV-ZONE', name: 'High Voltage Area', center: [20, 12], size: [12, 8] },
  { id: 'CHEM-STORE', name: 'Chemical Storage', center: [-22, -8], size: [10, 12] },
];

export const DYNAMIC_ZONES: DynamicZone[] = [
  { id: 'IMPLANT-BEAM', name: 'Implant Beam Active', center: [-2, 5], size: [10, 6], anchoredTo: 'Implant' },
  { id: 'LITHO-EUV', name: 'EUV Exposure Active', center: [-18, 10], size: [11, 7], anchoredTo: 'Litho Bay' },
];

export const ALL_ZONES: RestrictedZone[] = [...RESTRICTED_ZONES, ...DYNAMIC_ZONES];

export const PATROL_ROUTES: Record<string, [number, number][]> = {
  'OP-01': [[-24, -14], [-8, -14], [4, -6], [17, 9], [24, 14], [4, 15], [-16, 8], [-24, -14]],
  'OP-02': [[22, -14], [10, -8], [-2, 1], [-21, -7], [-24, -13], [-4, -15], [18, -12], [22, -14]],
  'OP-03': [[-18, 15], [-4, 14], [5, 14], [16, 13], [24, 9], [14, 2], [-5, 4], [-18, 15]],
  'OP-04': [[-27, 1], [-15, 1], [-4, -4], [8, -4], [18, -2], [26, 4], [8, 7], [-14, 6], [-27, 1]],
};

export const INITIAL_PERSONNEL: Personnel[] = [
  { id: 'OP-01', name: 'Chen Wei', waypointIndex: 0, position: PATROL_ROUTES['OP-01'][0], inZone: null, status: 'normal' },
  { id: 'OP-02', name: 'Maya Patel', waypointIndex: 0, position: PATROL_ROUTES['OP-02'][0], inZone: null, status: 'normal' },
  { id: 'OP-03', name: 'Luis Ortega', waypointIndex: 0, position: PATROL_ROUTES['OP-03'][0], inZone: null, status: 'normal' },
  { id: 'OP-04', name: 'Aiko Tanaka', waypointIndex: 0, position: PATROL_ROUTES['OP-04'][0], inZone: null, status: 'normal' },
];

const zoneNameById = new Map(ALL_ZONES.map((zone) => [zone.id, zone.name]));

export const useArTrackingStore = create<ArTrackingState>((set, get) => ({
  personnel: INITIAL_PERSONNEL,
  alerts: [],
  pipTarget: null,
  focusPersonnelId: null,
  recipeStates: Object.fromEntries(DYNAMIC_ZONES.map((z) => [z.id, 'idle' as const])),

  openPip: (personnelId) => set({ pipTarget: personnelId }),
  closePip: () => set({ pipTarget: null }),
  switchPipTarget: (personnelId) => set({ pipTarget: personnelId }),

  setRecipeState: (zoneId, state) => set((prev) => ({
    recipeStates: { ...prev.recipeStates, [zoneId]: state },
  })),

  triggerAlert: (personnelId, zoneId) => set((state) => {
    const alert: ArAlert = {
      id: `${personnelId}-${zoneId}-${Date.now()}`,
      personnelId,
      zoneId,
      zoneName: zoneNameById.get(zoneId) ?? zoneId,
      timestamp: Date.now(),
      acknowledged: false,
    };
    const nextPip = state.pipTarget === null ? personnelId : state.pipTarget;
    return { alerts: [alert, ...state.alerts].slice(0, 20), pipTarget: nextPip };
  }),

  acknowledgeAlert: (alertId) => set((state) => ({
    alerts: state.alerts.map((alert) =>
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ),
  })),

  updatePersonnelPosition: (id, x, z, waypointIndex) => set((state) => ({
    personnel: state.personnel.map((person) =>
      person.id === id
        ? { ...person, position: [x, z], waypointIndex: waypointIndex ?? person.waypointIndex }
        : person
    ),
  })),

  setPersonnelZoneStatus: (id, zoneId) => set((state) => ({
    personnel: state.personnel.map((person) =>
      person.id === id
        ? { ...person, inZone: zoneId, status: zoneId ? 'violation' : 'normal' }
        : person
    ),
  })),

  focusPersonnel: (id) => set({ focusPersonnelId: id }),
  clearFocusPersonnel: () => set({ focusPersonnelId: null }),
}));
```

**Step 4: Run tests to verify they pass**

Run:
```bash
cd /mnt/e/repo/mix-gem/equipment-monitor && npx jest src/stores/ar-tracking-store.test.ts --no-cache 2>&1 | tail -20
```

Expected: All tests PASS.

**Step 5: Commit**

```bash
cd /mnt/e/repo/mix-gem/equipment-monitor
git add src/stores/ar-tracking-store.ts src/stores/ar-tracking-store.test.ts
git commit -m "feat(ar-tracking): replace activeView with pipTarget, add recipeStates and dynamic zones"
```

---

### Task 3: Update page.tsx — replace ArViewHud with PipOverlay, rewire handlers

Replace the full-screen AR HUD with a small PiP overlay. Update all button handlers to use the new store actions.

**Files:**
- Modify: `equipment-monitor/src/app/mes/ar-tracking/page.tsx`

**Step 1: Update imports and remove old exports**

In `page.tsx`, change all store imports:

- Replace `ActiveView` references (none in imports, but `activeView` is used in `ArViewHud`).
- Import `DYNAMIC_ZONES` alongside `RESTRICTED_ZONES`.
- Import `ALL_ZONES` for the `areaNameForPosition` helper.

**Step 2: Replace ArViewHud with PipOverlay**

Delete the entire `ArViewHud` component (lines 130-165). Replace with:

```tsx
function PipOverlay() {
  const pipTarget = useArTrackingStore((state) => state.pipTarget);
  const closePip = useArTrackingStore((state) => state.closePip);
  if (!pipTarget) return null;

  return (
    <div className="pointer-events-auto absolute bottom-3 right-4 z-40">
      <div className="relative rounded-lg border border-cyan-400/40 bg-black/70 p-1 shadow-2xl shadow-cyan-950/40 backdrop-blur-sm">
        {/* The actual PiP viewport is rendered by Babylon.js on the canvas */}
        {/* This div just provides the border overlay and controls */}
        <div className="flex h-[180px] w-[240px] items-end justify-between rounded px-2 pb-2">
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-cyan-200">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            {pipTarget} LIVE
          </span>
          <button
            type="button"
            onClick={closePip}
            className="cursor-pointer rounded-full bg-black/50 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
            aria-label="Close picture-in-picture"
          >
            &times;
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Update PersonnelStatusPanel**

Change `switchToArView` to `switchPipTarget`:

```tsx
const switchPipTarget = useArTrackingStore((state) => state.switchPipTarget);
```

Update the double-click handler on personnel rows:
```tsx
onDoubleClick={() => switchPipTarget(person.id)}
```

Update the helper text:
```tsx
<p className="mt-3 text-xs text-slate-500">Click a row to center the overview camera. Double-click for PiP view.</p>
```

**Step 4: Update AlertToastStack**

Change the "View AR" button to call `switchPipTarget`:

```tsx
const switchPipTarget = useArTrackingStore((state) => state.switchPipTarget);
```

Update the button onClick:
```tsx
onClick={() => switchPipTarget(alert.personnelId)}
```

Change button label from "View AR" to "View PiP":
```tsx
<Eye className="h-3.5 w-3.5" /> View PiP
```

**Step 5: Update ArTrackingPage — ESC key + layout**

Replace `switchToOverview` with `closePip`:

```tsx
const closePip = useArTrackingStore((state) => state.closePip);

useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') closePip();
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [closePip]);
```

Replace `<ArViewHud />` with `<PipOverlay />` in the JSX. Move it inside the HUD container div (the one with `pointer-events-none fixed inset-0 z-30`) so it's positioned relative to the viewport:

```tsx
return (
  <div className="relative min-h-[calc(100dvh-104px)] overflow-hidden bg-[#0A1628] text-slate-100">
    <ArTrackingScene />
    <div className="pointer-events-none fixed inset-0 z-30">
      <div className="absolute left-4 top-[116px]">
        <PersonnelStatusPanel />
      </div>
      <div className="absolute right-4 top-[116px]">
        <AlertToastStack />
      </div>
      <PipOverlay />
    </div>
  </div>
);
```

Remove the `Activity` icon import if no longer used (it was only used in `ArViewHud`).

**Step 6: Verify TypeScript compiles**

Run:
```bash
cd /mnt/e/repo/mix-gem/equipment-monitor && npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors (or only pre-existing unrelated warnings).

**Step 7: Commit**

```bash
cd /mnt/e/repo/mix-gem/equipment-monitor
git add src/app/mes/ar-tracking/page.tsx
git commit -m "feat(ar-tracking): replace full-screen AR HUD with PiP overlay and rewire handlers"
```

---

### Task 4: Update ArTrackingScene — PiP viewport + dynamic zones + recipe timer

The heaviest task. Modify the Babylon.js scene to render a second camera viewport for PiP, create dynamic zone meshes with fade transitions, and add the recipe state simulation timer.

**Files:**
- Modify: `equipment-monitor/src/components/babylon/ArTrackingScene.tsx`

**Step 1: Update imports**

Add `DYNAMIC_ZONES`, `ALL_ZONES` to the store imports. Remove `ActiveView`-related references.

```typescript
import {
  ALL_ZONES,
  DYNAMIC_ZONES,
  PATROL_ROUTES,
  RESTRICTED_ZONES,
  useArTrackingStore,
} from '@/stores/ar-tracking-store';
```

**Step 2: Update zoneForPosition to use ALL_ZONES**

```typescript
function zoneForPosition(x: number, z: number, visibleDynamicZones: Set<string>) {
  return ALL_ZONES.find((zone) => {
    if (DYNAMIC_ZONES.some((dz) => dz.id === zone.id) && !visibleDynamicZones.has(zone.id)) return false;
    const halfX = zone.size[0] / 2;
    const halfZ = zone.size[1] / 2;
    return x >= zone.center[0] - halfX && x <= zone.center[0] + halfX
      && z >= zone.center[1] - halfZ && z <= zone.center[1] + halfZ;
  }) ?? null;
}
```

**Step 3: Add createDynamicZones function**

After `createRestrictedZones`, add a new function that creates the dynamic zone meshes (initially invisible):

```typescript
type DynamicZoneRuntime = {
  zoneId: string;
  material: BABYLON.PBRMaterial;
  border: BABYLON.LinesMesh;
  marker: BABYLON.Mesh;
  label: BABYLON.Mesh;
  recipeLabel: BABYLON.Mesh;
  targetAlpha: number;
  currentAlpha: number;
  visible: boolean;
};

function createDynamicZones(scene: BABYLON.Scene): DynamicZoneRuntime[] {
  return DYNAMIC_ZONES.map((zone) => {
    const material = createPbr(scene, `${zone.id}-material`, '#ef4444', 0.6, 0);
    const marker = BABYLON.MeshBuilder.CreateGround(zone.id, { width: zone.size[0], height: zone.size[1] }, scene);
    marker.position = new BABYLON.Vector3(zone.center[0], 0.035, zone.center[1]);
    marker.material = material;
    marker.isPickable = false;
    marker.isVisible = false;

    const halfX = zone.size[0] / 2;
    const halfZ = zone.size[1] / 2;
    const y = 0.08;
    const corners = [
      new BABYLON.Vector3(zone.center[0] - halfX, y, zone.center[1] - halfZ),
      new BABYLON.Vector3(zone.center[0] + halfX, y, zone.center[1] - halfZ),
      new BABYLON.Vector3(zone.center[0] + halfX, y, zone.center[1] + halfZ),
      new BABYLON.Vector3(zone.center[0] - halfX, y, zone.center[1] + halfZ),
      new BABYLON.Vector3(zone.center[0] - halfX, y, zone.center[1] - halfZ),
    ];
    const border = BABYLON.MeshBuilder.CreateLines(`${zone.id}-border`, { points: corners }, scene);
    border.color = BABYLON.Color3.FromHexString('#ef4444');
    border.isPickable = false;
    border.isVisible = false;

    const label = createLabel(scene, `${zone.id}-label`, `WARNING ${zone.name}`, '#f59e0b');
    label.position = new BABYLON.Vector3(zone.center[0], 2.8, zone.center[1]);
    label.isVisible = false;

    const recipeLabel = createLabel(scene, `${zone.id}-recipe-label`, 'RECIPE ACTIVE', '#f59e0b');
    recipeLabel.position = new BABYLON.Vector3(zone.center[0], 2.2, zone.center[1]);
    recipeLabel.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);
    recipeLabel.isVisible = false;

    return { zoneId: zone.id, material, border, marker, label, recipeLabel, targetAlpha: 0, currentAlpha: 0, visible: false };
  });
}
```

**Step 4: Add recipe simulation timer logic**

Inside `createScene`, after creating zones and persons, add the recipe timer state:

```typescript
const recipeTimers: Record<string, { nextToggle: number }> = {};
DYNAMIC_ZONES.forEach((zone, index) => {
  recipeTimers[zone.id] = { nextToggle: 5000 + index * 15000 };
});
let elapsedMs = 0;
```

In the render loop, before personnel updates, add recipe timer ticking:

```typescript
elapsedMs += deltaSeconds * 1000;
for (const zone of DYNAMIC_ZONES) {
  const timer = recipeTimers[zone.id];
  if (elapsedMs >= timer.nextToggle) {
    const currentState = store.recipeStates[zone.id];
    const nextState = currentState === 'idle' ? 'running' : 'idle';
    store.setRecipeState(zone.id, nextState);
    const duration = nextState === 'running'
      ? 45000 + Math.random() * 15000
      : 30000 + Math.random() * 15000;
    timer.nextToggle = elapsedMs + duration;
  }
}
```

**Step 5: Add dynamic zone fade animation in render loop**

After the recipe timer, update the dynamic zone visuals:

```typescript
dynamicZoneRuntimes.forEach((dz) => {
  const isRunning = store.recipeStates[dz.zoneId] === 'running';
  dz.targetAlpha = isRunning ? 0.12 : 0;

  const fadeSpeed = isRunning ? deltaSeconds / 1.5 : deltaSeconds / 2.0;
  dz.currentAlpha += (dz.targetAlpha - dz.currentAlpha) * Math.min(fadeSpeed * 4, 1);

  if (dz.currentAlpha > 0.005) {
    dz.marker.isVisible = true;
    dz.border.isVisible = true;
    dz.label.isVisible = true;
    dz.recipeLabel.isVisible = true;
    dz.material.alpha = dz.currentAlpha;
    dz.visible = true;

    const pulse = Math.abs(Math.sin(performance.now() / 520));
    dz.material.alpha = dz.currentAlpha + pulse * 0.08;
    dz.border.color = BABYLON.Color3.FromHexString('#ef4444');

    const recipePulse = Math.abs(Math.sin(performance.now() / 300));
    (dz.recipeLabel.material as BABYLON.StandardMaterial).emissiveColor =
      BABYLON.Color3.FromHexString('#f59e0b').scale(0.6 + recipePulse * 0.4);
  } else {
    dz.marker.isVisible = false;
    dz.border.isVisible = false;
    dz.label.isVisible = false;
    dz.recipeLabel.isVisible = false;
    dz.visible = false;
  }
});
```

**Step 6: Build visibleDynamicZones set for collision checks**

Replace the existing `zoneForPosition` call in the personnel loop:

```typescript
const visibleDynamicZones = new Set(
  dynamicZoneRuntimes.filter((dz) => dz.visible).map((dz) => dz.zoneId)
);

// Inside the persons.forEach loop:
const zone = zoneForPosition(person.node.position.x, person.node.position.z, visibleDynamicZones);
```

**Step 7: Replace camera swap logic with PiP viewport**

Remove the `lastActiveView` variable and the entire `activeView` camera-swap block (lines 269-294).

After creating the `arCamera`, set its viewport to PiP size:

```typescript
arCamera.viewport = new BABYLON.Viewport(0.72, 0.02, 0.26, 0.28);
```

Do NOT add `arCamera` to `scene.activeCameras` at init — it starts hidden.

In the render loop, replace the old camera swap block with PiP tracking:

```typescript
const pipTarget = store.pipTarget;
if (pipTarget) {
  const person = persons.get(pipTarget);
  if (person) {
    const headPos = person.node.position.add(new BABYLON.Vector3(0, HEAD_HEIGHT, 0));
    arCamera.position.copyFrom(BABYLON.Vector3.Lerp(arCamera.position, headPos, 0.16));
    arCamera.setTarget(headPos.add(person.direction.scale(4)));
  }
  if (!scene.activeCameras || scene.activeCameras.length < 2) {
    scene.activeCameras = [overviewCamera, arCamera];
    overviewCamera.viewport = new BABYLON.Viewport(0, 0, 1, 1);
  }
} else {
  if (scene.activeCameras && scene.activeCameras.length > 1) {
    scene.activeCameras = [];
    scene.activeCamera = overviewCamera;
    overviewCamera.viewport = new BABYLON.Viewport(0, 0, 1, 1);
  }
}
```

Note: when `scene.activeCameras` array has entries, Babylon renders each camera's viewport in order. When empty, it falls back to `scene.activeCamera`.

**Step 8: Update zone pulse logic to include dynamic zones**

The existing `zones.forEach` loop handles permanent zone pulses. Merge the dynamic zone active-person detection into the same pattern. The permanent zones array returned by `createRestrictedZones` continues to work as-is since it only covers `HV-ZONE` and `CHEM-STORE` now (MAINT-BAY was removed from `RESTRICTED_ZONES`).

**Step 9: Verify TypeScript compiles**

Run:
```bash
cd /mnt/e/repo/mix-gem/equipment-monitor && npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors.

**Step 10: Commit**

```bash
cd /mnt/e/repo/mix-gem/equipment-monitor
git add src/components/babylon/ArTrackingScene.tsx
git commit -m "feat(ar-tracking): add PiP viewport, dynamic recipe zones with fade transitions"
```

---

### Task 5: Add GLTF model loading with animation blending

Add GLTF character loading, replace capsule primitives, and implement walk/idle/look-around animation blending.

**Files:**
- Modify: `equipment-monitor/src/components/babylon/ArTrackingScene.tsx`
- Create: `equipment-monitor/public/models/ar-tracking/` (directory for GLB assets)

**Prerequisite:** GLB model files must be manually prepared and placed in `public/models/ar-tracking/` before this task. If they are not available yet, this task can be implemented with a placeholder that falls back to capsule primitives. The code structure will be ready for when the assets arrive.

**Step 1: Add the GLTF loader import**

At the top of `ArTrackingScene.tsx`, add:

```typescript
import '@babylonjs/loaders/glTF';
```

This side-effect import registers the GLTF loader plugin with Babylon's `SceneLoader`.

**Step 2: Define model variant mapping and updated PersonRuntime type**

```typescript
const MODEL_VARIANTS: Record<string, string> = {
  'OP-01': 'cleanroom-a.glb',
  'OP-02': 'cleanroom-b.glb',
  'OP-03': 'cleanroom-a.glb',
  'OP-04': 'cleanroom-c.glb',
};

const MODEL_BASE_PATH = '/models/ar-tracking/';

type AnimState = 'walk' | 'idle' | 'look-around';

type PersonRuntime = {
  node: BABYLON.TransformNode;
  bodyMaterial: BABYLON.PBRMaterial;
  direction: BABYLON.Vector3;
  waypointIndex: number;
  isGltf: boolean;
  animGroups: Record<string, BABYLON.AnimationGroup> | null;
  currentAnim: AnimState;
  idleTimer: number;
};
```

**Step 3: Create the GLTF person loader function**

```typescript
async function createGltfPerson(
  scene: BABYLON.Scene,
  id: string,
  start: [number, number],
  modelFile: string,
): Promise<PersonRuntime | null> {
  try {
    const result = await BABYLON.SceneLoader.ImportMeshAsync('', MODEL_BASE_PATH, modelFile, scene);
    const root = result.meshes[0];
    const node = new BABYLON.TransformNode(`${id}-node`, scene);
    root.parent = node;
    node.position = new BABYLON.Vector3(start[0], 0, start[1]);

    result.meshes.forEach((mesh) => { mesh.isPickable = false; });

    const animGroups: Record<string, BABYLON.AnimationGroup> = {};
    for (const group of result.animationGroups) {
      const name = group.name.toLowerCase();
      if (name.includes('walk')) animGroups['walk'] = group;
      else if (name.includes('look')) animGroups['look-around'] = group;
      else if (name.includes('idle')) animGroups['idle'] = group;
      group.stop();
    }

    if (animGroups['idle']) {
      animGroups['idle'].start(true, 1.0, animGroups['idle'].from, animGroups['idle'].to, false);
    }

    // Attach AR glasses and name tag to head bone
    const skeleton = result.skeletons[0];
    let headBone: BABYLON.TransformNode | null = null;
    if (skeleton) {
      const bone = skeleton.bones.find((b) => b.name.toLowerCase().includes('head'));
      if (bone) headBone = bone.getTransformNode();
    }

    const bodyMaterial = createPbr(scene, `${id}-body-material`, '#f8fafc', 0.04);
    const glasses = BABYLON.MeshBuilder.CreateBox(`${id}-ar-glasses`, { width: 0.42, height: 0.08, depth: 0.16 }, scene);
    glasses.material = createPbr(scene, `${id}-glasses-material`, '#22d3ee', 1.2);
    glasses.isPickable = false;

    const tag = createLabel(scene, `${id}-tag`, id, '#22d3ee');
    tag.scaling = new BABYLON.Vector3(0.62, 0.62, 0.62);

    if (headBone) {
      glasses.parent = headBone;
      glasses.position = new BABYLON.Vector3(0, 0.08, -0.14);
      tag.parent = headBone;
      tag.position = new BABYLON.Vector3(0, 0.45, 0);
    } else {
      glasses.parent = node;
      glasses.position = new BABYLON.Vector3(0, 1.93, -0.24);
      tag.parent = node;
      tag.position.y = 2.55;
    }

    return {
      node, bodyMaterial, direction: new BABYLON.Vector3(0, 0, 1),
      waypointIndex: 0, isGltf: true, animGroups, currentAnim: 'idle', idleTimer: 0,
    };
  } catch (err) {
    console.warn(`[AR-Tracking] Failed to load GLTF model ${modelFile} for ${id}, falling back to capsule:`, err);
    return null;
  }
}
```

**Step 4: Update createPerson to return PersonRuntime with animation fields**

Add the new fields to the existing capsule fallback:

```typescript
function createPerson(scene: BABYLON.Scene, id: string, start: [number, number]): PersonRuntime {
  // ... existing capsule creation code unchanged ...
  return {
    node, bodyMaterial, direction: new BABYLON.Vector3(0, 0, 1),
    waypointIndex: 0, isGltf: false, animGroups: null, currentAnim: 'idle', idleTimer: 0,
  };
}
```

**Step 5: Add animation blend helper**

```typescript
function transitionAnim(person: PersonRuntime, target: AnimState) {
  if (!person.animGroups || person.currentAnim === target) return;
  const current = person.animGroups[person.currentAnim];
  const next = person.animGroups[target];
  if (!next) return;

  if (current) {
    // Blend out over 300ms (Babylon weight transition)
    current.setWeightForAllAnimatables(0);
    current.stop();
  }
  const loop = target !== 'look-around';
  next.start(loop, target === 'walk' ? 1.0 : 1.0, next.from, next.to, false);
  next.setWeightForAllAnimatables(1);
  person.currentAnim = target;
  person.idleTimer = 0;
}
```

**Step 6: Update updatePersonMovement to handle animation**

After the existing movement logic, add animation transitions:

```typescript
function updatePersonMovement(person: PersonRuntime, id: string, deltaSeconds: number) {
  const route = PATROL_ROUTES[id];
  const nextIndex = (person.waypointIndex + 1) % route.length;
  const target = new BABYLON.Vector3(route[nextIndex][0], 0, route[nextIndex][1]);
  const offset = target.subtract(person.node.position);
  const distance = offset.length();

  if (distance < 0.16) {
    person.waypointIndex = nextIndex;
    if (person.isGltf) transitionAnim(person, 'idle');
    return;
  }

  const direction = offset.normalize();
  person.direction = direction;
  person.node.position.addInPlace(direction.scale(Math.min(distance, PERSONNEL_SPEED * deltaSeconds)));
  person.node.rotation.y = Math.atan2(direction.x, direction.z);

  if (person.isGltf && person.currentAnim !== 'walk') {
    transitionAnim(person, 'walk');
  }
}
```

**Step 7: Add idle look-around logic in render loop**

Inside the `persons.forEach` loop, after movement update:

```typescript
if (person.isGltf && person.currentAnim === 'idle') {
  person.idleTimer += deltaSeconds;
  if (person.idleTimer > 2 + Math.random() && person.animGroups?.['look-around']) {
    transitionAnim(person, 'look-around');
    const lookGroup = person.animGroups['look-around'];
    if (lookGroup) {
      lookGroup.onAnimationGroupEndObservable.addOnce(() => {
        transitionAnim(person, 'idle');
      });
    }
  }
}
```

**Step 8: Update createScene to load GLTF models asynchronously**

Change the person creation from synchronous to async. Wrap the initialization in an async IIFE inside `createScene`:

```typescript
// Replace:
// const persons = new Map(Object.entries(PATROL_ROUTES).map(([id, route]) => [id, createPerson(scene, id, route[0])]));

// With:
const persons = new Map<string, PersonRuntime>();

// Synchronous fallback first (so render loop can start immediately)
Object.entries(PATROL_ROUTES).forEach(([id, route]) => {
  persons.set(id, createPerson(scene, id, route[0]));
});

// Then try GLTF async replacement
(async () => {
  for (const [id, route] of Object.entries(PATROL_ROUTES)) {
    const modelFile = MODEL_VARIANTS[id];
    if (!modelFile) continue;
    const gltfPerson = await createGltfPerson(scene, id, route, modelFile);
    if (gltfPerson && !disposed) {
      const old = persons.get(id);
      if (old) old.node.dispose();
      persons.set(id, gltfPerson);
    }
  }
})();
```

This ensures the scene renders immediately with capsule fallbacks, then swaps in GLTF models as they load.

**Step 9: Verify TypeScript compiles**

Run:
```bash
cd /mnt/e/repo/mix-gem/equipment-monitor && npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors.

**Step 10: Commit**

```bash
cd /mnt/e/repo/mix-gem/equipment-monitor
git add src/components/babylon/ArTrackingScene.tsx
git commit -m "feat(ar-tracking): add GLTF model loading with walk/idle/look-around animation blending"
```

---

### Task 6: Create placeholder GLB assets directory

Create the directory and a README so the asset sourcing workflow is documented for whoever prepares the models.

**Files:**
- Create: `equipment-monitor/public/models/ar-tracking/README.md`

**Step 1: Create directory and README**

```bash
mkdir -p /mnt/e/repo/mix-gem/equipment-monitor/public/models/ar-tracking
```

Create `equipment-monitor/public/models/ar-tracking/README.md`:

```markdown
# AR Tracking GLTF Models

Place cleanroom suit character GLB files here:

- `cleanroom-a.glb` — Variant A (used by OP-01, OP-03)
- `cleanroom-b.glb` — Variant B (used by OP-02)
- `cleanroom-c.glb` — Variant C (used by OP-04)

## Requirements

- Format: GLB (binary glTF)
- Triangle budget: under 5K per model
- File size: under 400KB each
- Required animation clips (names must contain these substrings):
  - `walk` — looping walk cycle
  - `idle` — looping idle stance
  - `look` — single-play head look-around

## Sourcing Workflow

1. Download rigged humanoid from Mixamo (e.g., "X Bot" or "Y Bot")
2. Apply animations in Mixamo: Walking, Idle, Looking Around
3. Export as GLB with skin, bake animations
4. Re-color in Blender to white cleanroom suit (2-3 tint variants)
5. Verify triangle count and file size

Until these files are placed here, the scene falls back to capsule primitives.
```

**Step 2: Commit**

```bash
cd /mnt/e/repo/mix-gem/equipment-monitor
git add public/models/ar-tracking/README.md
git commit -m "docs(ar-tracking): add GLTF asset directory with sourcing instructions"
```

---

### Task 7: Verify full build and all tests pass

**Step 1: Run all AR tracking store tests**

```bash
cd /mnt/e/repo/mix-gem/equipment-monitor && npx jest src/stores/ar-tracking-store.test.ts --no-cache --verbose 2>&1 | tail -30
```

Expected: All tests PASS.

**Step 2: Run full test suite to check for regressions**

```bash
cd /mnt/e/repo/mix-gem/equipment-monitor && npx jest --no-cache 2>&1 | tail -20
```

Expected: All tests PASS (no regressions from store changes).

**Step 3: Run TypeScript compiler**

```bash
cd /mnt/e/repo/mix-gem/equipment-monitor && npx tsc --noEmit 2>&1 | tail -20
```

Expected: No errors.

**Step 4: Run Next.js build**

```bash
cd /mnt/e/repo/mix-gem/equipment-monitor && npx next build 2>&1 | tail -20
```

Expected: Build succeeds.

**Step 5: Commit any fixes if needed, then final verification commit**

If all checks pass with no changes needed, no commit required for this task.
