# AR Tracking v4 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix three critical v3 issues — PiP ghosting, toy-like visuals, and personnel walking through equipment — by implementing RTT-based PiP, holographic materials, distinct equipment silhouettes, and a navigation graph.

**Architecture:** PiP renders to an offscreen RenderTargetTexture and blits to a CSS-positioned canvas, eliminating shared post-processing bleed. A custom holographic ShaderMaterial (fresnel + scan-lines + flicker) replaces ad-hoc PBR on both personnel and equipment. Equipment bays get distinct low-poly silhouette shells with internal wireframe. Personnel walk a validated navigation graph with 25 nodes and 44 edges along fab walkways, never crossing equipment AABBs.

**Tech Stack:** Babylon.js 9.6.2 (@babylonjs/core, @babylonjs/gui, @babylonjs/loaders, @babylonjs/materials), Next.js 15.1, React 19, Zustand 5, TypeScript, Jest 30 (jsdom)

**Design Doc:** `docs/plans/2026-05-15-ar-tracking-v4-design.md`

---

## Execution Strategy

```
Wave 1 (Foundation — 3 parallel tasks):
├── Task 1: Navigation graph + AABB validation [testable, store-level]
├── Task 2: Holographic material system [new shader file]
└── Task 3: PiP RTT + CSS composite [scene + page rewrite]

Wave 2 (Visual Upgrades — 3 parallel tasks):
├── Task 4: Equipment silhouette models [depends: Task 2]
├── Task 5: Personnel visual upgrade [depends: Task 2]
└── Task 6: Navigation graph scene integration [depends: Task 1]

Wave 3 (Polish):
└── Task 7: Integration cleanup + QA [depends: all]
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 6 | 1 |
| 2 | — | 4, 5 | 1 |
| 3 | — | 7 | 1 |
| 4 | 2 | 7 | 2 |
| 5 | 2 | 7 | 2 |
| 6 | 1 | 7 | 2 |
| 7 | all | — | 3 |

---

## Task 1: Navigation Graph + AABB Validation

**Goal:** Define a walkable corridor graph (25 nodes, 44 edges) between equipment bays. Validate no edge crosses any equipment AABB. Export patrol routes as node-ID sequences.

**Files:**
- Create: `src/lib/ar-tracking-nav-graph.ts`
- Create: `src/lib/ar-tracking-nav-graph.test.ts`

**Step 1: Write the nav graph constants and AABB types**

Create `src/lib/ar-tracking-nav-graph.ts`:

```typescript
/**
 * Navigation graph for AR tracking fab floor.
 * 25 nodes along walkable corridors, 44 edges validated against equipment AABBs.
 * Patrol routes reference node IDs — runtime resolves to [x,z] coordinates.
 */

export interface AABB {
  xMin: number;
  xMax: number;
  zMin: number;
  zMax: number;
}

export const EQUIPMENT_BAY_LAYOUT = [
  ['Litho Bay', -18, 10, 9, 5],
  ['Etch Bay', -17, -14, 10, 4],
  ['Diffusion Bay', 0, -13, 9, 4],
  ['Metrology', 17, -12, 8, 5],
  ['CMP Bay', 18, 3, 8, 4],
  ['Implant', -2, 5, 8, 4],
  ['Stocker', -25, 0, 5, 8],
  ['Photo Track', 8, 15, 9, 3.6],
] as const;

const CLEARANCE = 1.5;

export function bayToAABB(
  center: readonly [number, number],
  size: readonly [number, number],
): AABB {
  return {
    xMin: center[0] - size[0] / 2,
    xMax: center[0] + size[0] / 2,
    zMin: center[1] - size[1] / 2,
    zMax: center[1] + size[1] / 2,
  };
}

export const EQUIPMENT_AABBS: AABB[] = EQUIPMENT_BAY_LAYOUT.map(
  ([, x, z, w, d]) => bayToAABB([x, z], [w, d]),
);

export function pointClearOfAABBs(
  x: number,
  z: number,
  aabbs: AABB[],
  minClearance: number,
): boolean {
  return aabbs.every((aabb) => {
    const dx = Math.max(aabb.xMin - x, 0, x - aabb.xMax);
    const dz = Math.max(aabb.zMin - z, 0, z - aabb.zMax);
    return Math.hypot(dx, dz) >= minClearance;
  });
}

export function segmentIntersectsAABB(
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  aabb: AABB,
): boolean {
  const dx = x2 - x1;
  const dz = z2 - z1;

  let tMin = 0;
  let tMax = 1;

  for (const [origin, dir, lo, hi] of [
    [x1, dx, aabb.xMin, aabb.xMax],
    [z1, dz, aabb.zMin, aabb.zMax],
  ] as [number, number, number, number][]) {
    if (Math.abs(dir) < 1e-9) {
      if (origin < lo || origin > hi) return false;
    } else {
      let t0 = (lo - origin) / dir;
      let t1 = (hi - origin) / dir;
      if (t0 > t1) [t0, t1] = [t1, t0];
      tMin = Math.max(tMin, t0);
      tMax = Math.min(tMax, t1);
      if (tMin > tMax) return false;
    }
  }

  return true;
}

export function edgeClearsAllAABBs(
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  aabbs: AABB[],
): boolean {
  return !aabbs.some((aabb) => segmentIntersectsAABB(x1, z1, x2, z2, aabb));
}

export const NAV_NODES: Record<string, [number, number]> = {
  // West wall corridor
  'W-NW':   [-29, 14],
  'W-MID':  [-29, 0],
  'W-SW':   [-29, -14],

  // South corridor
  'S-W':    [-24, -18],
  'S-MW':   [-10, -18],
  'S-ME':   [7, -18],
  'S-E':    [24, -18],

  // Mid corridor (between equipment rows, z ~ -8)
  'MID-W':  [-21, -8],
  'GAP-ED': [-7, -8],
  'GAP-DM': [10, -8],
  'MID-E':  [24, -8],

  // Central corridor (z ~ 0)
  'C-W':    [-21, 0],
  'C-CW':   [-9, 0],
  'C-CE':   [5, 0],
  'C-E':    [12, 0],
  'CE-FAR': [24, 0],

  // North of Implant / south of Litho (z ~ 8-9)
  'N-IW':   [-10, 9],
  'N-IE':   [5, 9],
  'N-CMP':  [12, 8],

  // North corridor (z ~ 14-18)
  'NW-TOP': [-12, 18],
  'PT-W':   [0, 14],
  'N-MID':  [0, 18],
  'PT-E':   [15, 11],
  'NE-TOP': [15, 18],
  'NE-FAR': [26, 14],
};

export const NAV_EDGES: [string, string][] = [
  // West wall
  ['W-NW', 'W-MID'],
  ['W-MID', 'W-SW'],
  // West to interior
  ['W-NW', 'NW-TOP'],
  ['W-SW', 'S-W'],
  ['W-MID', 'C-W'],
  ['W-SW', 'MID-W'],
  // South corridor
  ['S-W', 'S-MW'],
  ['S-MW', 'S-ME'],
  ['S-ME', 'S-E'],
  // South to mid risers
  ['S-W', 'MID-W'],
  ['S-MW', 'GAP-ED'],
  ['S-ME', 'GAP-DM'],
  ['S-E', 'MID-E'],
  // Mid corridor
  ['MID-W', 'GAP-ED'],
  ['GAP-ED', 'GAP-DM'],
  ['GAP-DM', 'MID-E'],
  // Mid to central risers
  ['MID-W', 'C-W'],
  ['GAP-ED', 'C-CW'],
  ['GAP-DM', 'C-CE'],
  ['MID-E', 'CE-FAR'],
  // Central corridor
  ['C-W', 'C-CW'],
  ['C-CW', 'C-CE'],
  ['C-CE', 'C-E'],
  ['C-E', 'CE-FAR'],
  // Central to north risers
  ['C-CW', 'N-IW'],
  ['C-CE', 'N-IE'],
  ['C-E', 'N-CMP'],
  ['CE-FAR', 'NE-FAR'],
  // North of Implant corridor
  ['N-IW', 'N-IE'],
  ['N-IE', 'N-CMP'],
  ['N-IE', 'PT-E'],
  ['N-IE', 'PT-W'],
  ['N-CMP', 'PT-E'],
  ['N-CMP', 'NE-FAR'],
  // North corridor connections
  ['N-IW', 'PT-W'],
  ['PT-W', 'NW-TOP'],
  ['PT-W', 'N-MID'],
  ['PT-E', 'NE-TOP'],
  ['PT-E', 'NE-FAR'],
  // Top corridor
  ['NW-TOP', 'N-MID'],
  ['N-MID', 'NE-TOP'],
  ['NE-TOP', 'NE-FAR'],
  // East vertical + cross
  ['NE-FAR', 'CE-FAR'],
  ['MID-E', 'C-E'],
];

export const NAV_PATROL_ROUTES: Record<string, string[]> = {
  'OP-01': [
    'W-MID', 'C-W', 'MID-W', 'S-W', 'S-MW', 'GAP-ED',
    'C-CW', 'N-IW', 'PT-W', 'NW-TOP', 'W-NW', 'W-MID',
  ],
  'OP-02': [
    'CE-FAR', 'MID-E', 'S-E', 'S-ME', 'GAP-DM',
    'C-CE', 'C-E', 'N-CMP', 'NE-FAR', 'CE-FAR',
  ],
  'OP-03': [
    'NW-TOP', 'N-MID', 'NE-TOP', 'NE-FAR', 'PT-E',
    'N-IE', 'PT-W', 'NW-TOP',
  ],
  'OP-04': [
    'C-CW', 'C-CE', 'C-E', 'CE-FAR', 'NE-FAR',
    'N-CMP', 'N-IE', 'N-IW', 'C-CW',
  ],
};

export function resolvePatrolRoute(routeNodeIds: string[]): [number, number][] {
  return routeNodeIds.map((nodeId) => {
    const node = NAV_NODES[nodeId];
    if (!node) throw new Error(`Unknown nav node: ${nodeId}`);
    return node;
  });
}

export function nearestNavNode(x: number, z: number): string {
  let nearest = '';
  let bestDist = Infinity;
  for (const [id, [nx, nz]] of Object.entries(NAV_NODES)) {
    const dist = Math.hypot(x - nx, z - nz);
    if (dist < bestDist) {
      bestDist = dist;
      nearest = id;
    }
  }
  return nearest;
}
```

**Step 2: Write failing tests**

Create `src/lib/ar-tracking-nav-graph.test.ts`:

```typescript
import {
  EQUIPMENT_AABBS,
  NAV_EDGES,
  NAV_NODES,
  NAV_PATROL_ROUTES,
  edgeClearsAllAABBs,
  nearestNavNode,
  pointClearOfAABBs,
  resolvePatrolRoute,
  segmentIntersectsAABB,
} from './ar-tracking-nav-graph';

describe('ar-tracking-nav-graph', () => {
  describe('segmentIntersectsAABB', () => {
    const box = { xMin: 0, xMax: 4, zMin: 0, zMax: 4 };

    it('detects intersection when segment crosses box', () => {
      expect(segmentIntersectsAABB(-1, 2, 5, 2, box)).toBe(true);
    });

    it('returns false when segment misses box', () => {
      expect(segmentIntersectsAABB(-1, 5, 5, 5, box)).toBe(false);
    });

    it('returns false when segment ends before box', () => {
      expect(segmentIntersectsAABB(-5, 2, -1, 2, box)).toBe(false);
    });
  });

  describe('pointClearOfAABBs', () => {
    it('returns true for a point far from all equipment', () => {
      expect(pointClearOfAABBs(0, -20, EQUIPMENT_AABBS, 1.5)).toBe(true);
    });

    it('returns false for a point inside an equipment bay', () => {
      // Center of Litho Bay (-18, 10)
      expect(pointClearOfAABBs(-18, 10, EQUIPMENT_AABBS, 1.5)).toBe(false);
    });
  });

  describe('all nav nodes clear of equipment AABBs', () => {
    it.each(Object.entries(NAV_NODES))(
      'node %s at [%j] has >= 1.5m clearance from all equipment',
      (id, [x, z]) => {
        expect(pointClearOfAABBs(x, z, EQUIPMENT_AABBS, 1.5)).toBe(true);
      },
    );
  });

  describe('all nav edges clear of equipment AABBs', () => {
    it.each(NAV_EDGES)(
      'edge %s -> %s does not cross any equipment bay',
      (fromId, toId) => {
        const [x1, z1] = NAV_NODES[fromId];
        const [x2, z2] = NAV_NODES[toId];
        expect(edgeClearsAllAABBs(x1, z1, x2, z2, EQUIPMENT_AABBS)).toBe(true);
      },
    );
  });

  describe('patrol routes', () => {
    it.each(Object.entries(NAV_PATROL_ROUTES))(
      'route %s uses only valid node IDs',
      (_, nodeIds) => {
        nodeIds.forEach((nodeId) => {
          expect(NAV_NODES).toHaveProperty(nodeId);
        });
      },
    );

    it.each(Object.entries(NAV_PATROL_ROUTES))(
      'route %s uses only connected edges',
      (_, nodeIds) => {
        for (let i = 0; i < nodeIds.length - 1; i++) {
          const a = nodeIds[i];
          const b = nodeIds[i + 1];
          const hasEdge = NAV_EDGES.some(
            ([from, to]) => (from === a && to === b) || (from === b && to === a),
          );
          expect(hasEdge).toBe(true);
        }
      },
    );

    it.each(Object.entries(NAV_PATROL_ROUTES))(
      'route %s loops (first === last)',
      (_, nodeIds) => {
        expect(nodeIds[0]).toBe(nodeIds[nodeIds.length - 1]);
      },
    );
  });

  describe('resolvePatrolRoute', () => {
    it('converts node IDs to coordinates', () => {
      const coords = resolvePatrolRoute(['W-NW', 'W-MID']);
      expect(coords).toEqual([[-29, 14], [-29, 0]]);
    });

    it('throws for unknown node ID', () => {
      expect(() => resolvePatrolRoute(['NONEXISTENT'])).toThrow('Unknown nav node');
    });
  });

  describe('nearestNavNode', () => {
    it('finds closest node to a given position', () => {
      // Position very close to W-NW (-29, 14)
      expect(nearestNavNode(-28, 13)).toBe('W-NW');
    });
  });

  describe('known bad edges are rejected', () => {
    it('N-CMP to CE-FAR crosses CMP Bay', () => {
      const [x1, z1] = NAV_NODES['N-CMP'];
      const [x2, z2] = NAV_NODES['CE-FAR'];
      expect(edgeClearsAllAABBs(x1, z1, x2, z2, EQUIPMENT_AABBS)).toBe(false);
    });

    it('W-NW to N-IW crosses Litho Bay', () => {
      const [x1, z1] = NAV_NODES['W-NW'];
      const [x2, z2] = NAV_NODES['N-IW'];
      expect(edgeClearsAllAABBs(x1, z1, x2, z2, EQUIPMENT_AABBS)).toBe(false);
    });
  });
});
```

**Step 3: Run tests**

```bash
cd equipment-monitor && npx jest src/lib/ar-tracking-nav-graph.test.ts --no-cache --verbose
```

Expected: ALL PASS

**Step 4: TypeScript check**

```bash
cd equipment-monitor && npx tsc --noEmit
```

Expected: 0 errors

**Step 5: Commit**

```bash
git add src/lib/ar-tracking-nav-graph.ts src/lib/ar-tracking-nav-graph.test.ts
git commit -m "feat(ar-tracking): add navigation graph with AABB-validated walkways"
```

---

## Task 2: Holographic Material System

**Goal:** Create a custom ShaderMaterial factory producing a consistent holographic aesthetic — fresnel edge glow, scrolling scan-lines, projection flicker — for both personnel and equipment.

**Files:**
- Create: `src/lib/holographic-material.ts`

**Step 1: Create the holographic shader material factory**

Create `src/lib/holographic-material.ts`:

```typescript
import * as BABYLON from '@babylonjs/core';

const HOLOGRAPHIC_VERTEX_SHADER = `
precision highp float;

attribute vec3 position;
attribute vec3 normal;

uniform mat4 world;
uniform mat4 worldViewProjection;
uniform float time;
uniform float flickerIntensity;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec3 vLocalPosition;

void main() {
  vec3 displaced = position;
  float flicker = sin(time * 18.7 + position.y * 4.0) * flickerIntensity * 0.003;
  displaced += normal * flicker;

  vLocalPosition = displaced;
  vWorldNormal = normalize((world * vec4(normal, 0.0)).xyz);
  vWorldPosition = (world * vec4(displaced, 1.0)).xyz;

  gl_Position = worldViewProjection * vec4(displaced, 1.0);
}
`;

const HOLOGRAPHIC_FRAGMENT_SHADER = `
precision highp float;

uniform vec3 baseColor;
uniform vec3 cameraPosition;
uniform float time;
uniform float fresnelPower;
uniform float scanLineSpacing;
uniform float scanLineSpeed;
uniform float alphaCenter;
uniform float alphaEdge;
uniform float gridStrength;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec3 vLocalPosition;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float fresnel = pow(1.0 - max(dot(vWorldNormal, viewDir), 0.0), fresnelPower);

  float scanLine = sin((vWorldPosition.y + time * scanLineSpeed) * scanLineSpacing);
  scanLine = smoothstep(0.2, 0.8, scanLine * 0.5 + 0.5);
  float scanDim = mix(0.7, 1.0, scanLine);

  float gridX = step(0.96, fract(vLocalPosition.x * 2.0));
  float gridZ = step(0.96, fract(vLocalPosition.z * 2.0));
  float grid = max(gridX, gridZ) * gridStrength;

  float alpha = mix(alphaCenter, alphaEdge, fresnel);
  vec3 color = baseColor * (0.4 + fresnel * 0.8) * scanDim;
  color += baseColor * grid * 0.5;
  color += baseColor * fresnel * 0.6;

  gl_FragColor = vec4(color, alpha);
}
`;

BABYLON.Effect.ShadersStore['holographicVertexShader'] = HOLOGRAPHIC_VERTEX_SHADER;
BABYLON.Effect.ShadersStore['holographicFragmentShader'] = HOLOGRAPHIC_FRAGMENT_SHADER;

export interface HolographicOptions {
  baseColor: string;
  fresnelPower?: number;
  scanLineSpacing?: number;
  scanLineSpeed?: number;
  alphaCenter?: number;
  alphaEdge?: number;
  flickerIntensity?: number;
  gridStrength?: number;
}

function createHolographicMaterial(
  scene: BABYLON.Scene,
  name: string,
  options: Required<HolographicOptions>,
): BABYLON.ShaderMaterial {
  const material = new BABYLON.ShaderMaterial(name, scene, 'holographic', {
    attributes: ['position', 'normal'],
    uniforms: [
      'world', 'worldViewProjection', 'cameraPosition', 'time',
      'baseColor', 'fresnelPower', 'scanLineSpacing', 'scanLineSpeed',
      'alphaCenter', 'alphaEdge', 'flickerIntensity', 'gridStrength',
    ],
    needAlphaBlending: true,
  });

  const color = BABYLON.Color3.FromHexString(options.baseColor);
  material.setColor3('baseColor', color);
  material.setFloat('fresnelPower', options.fresnelPower);
  material.setFloat('scanLineSpacing', options.scanLineSpacing);
  material.setFloat('scanLineSpeed', options.scanLineSpeed);
  material.setFloat('alphaCenter', options.alphaCenter);
  material.setFloat('alphaEdge', options.alphaEdge);
  material.setFloat('flickerIntensity', options.flickerIntensity);
  material.setFloat('gridStrength', options.gridStrength);
  material.setFloat('time', 0);

  material.backFaceCulling = false;
  material.alphaMode = BABYLON.Constants.ALPHA_COMBINE;

  return material;
}

export function createPersonnelHolographicMaterial(
  scene: BABYLON.Scene,
  name: string,
  options: HolographicOptions,
): BABYLON.ShaderMaterial {
  return createHolographicMaterial(scene, name, {
    baseColor: options.baseColor,
    fresnelPower: options.fresnelPower ?? 2.5,
    scanLineSpacing: options.scanLineSpacing ?? 12.0,
    scanLineSpeed: options.scanLineSpeed ?? 0.8,
    alphaCenter: options.alphaCenter ?? 0.7,
    alphaEdge: options.alphaEdge ?? 1.0,
    flickerIntensity: options.flickerIntensity ?? 1.0,
    gridStrength: options.gridStrength ?? 0.0,
  });
}

export function createEquipmentHolographicMaterial(
  scene: BABYLON.Scene,
  name: string,
  options: HolographicOptions,
): BABYLON.ShaderMaterial {
  return createHolographicMaterial(scene, name, {
    baseColor: options.baseColor,
    fresnelPower: options.fresnelPower ?? 3.0,
    scanLineSpacing: options.scanLineSpacing ?? 8.0,
    scanLineSpeed: options.scanLineSpeed ?? 0.4,
    alphaCenter: options.alphaCenter ?? 0.3,
    alphaEdge: options.alphaEdge ?? 0.85,
    flickerIntensity: options.flickerIntensity ?? 0.5,
    gridStrength: options.gridStrength ?? 0.6,
  });
}

export function updateHolographicTime(material: BABYLON.ShaderMaterial, time: number) {
  material.setFloat('time', time);
}

export function updateHolographicColor(material: BABYLON.ShaderMaterial, color: string) {
  material.setColor3('baseColor', BABYLON.Color3.FromHexString(color));
}
```

**Step 2: TypeScript check**

```bash
cd equipment-monitor && npx tsc --noEmit
```

Expected: 0 errors

**Step 3: Commit**

```bash
git add src/lib/holographic-material.ts
git commit -m "feat(ar-tracking): add holographic ShaderMaterial factory"
```

---

## Task 3: PiP RTT + CSS Composite

**Goal:** Replace `scene.activeCameras` multi-viewport with RTT rendering to an offscreen texture, blitted to a CSS-positioned `<canvas>` element. Eliminate all shared post-processing bleed.

**Files:**
- Modify: `src/components/babylon/ArTrackingScene.tsx` (lines 1152-1593 — createScene + component)
- Modify: `src/app/mes/ar-tracking/page.tsx` (lines 183-293 — PipOverlay, lines 306-317 — layout)
- Delete: `src/components/babylon/ar-tracking/pip-scanline-shader.ts`

**Step 1: Add RTT rendering and pip canvas callback to createScene**

In `ArTrackingScene.tsx`, make these changes:

1. Remove imports for `createPipScanlinePostProcess` (line 11) and `PIP_HUD_LAYER_MASK` constant (line 39).

2. Change the `ArTrackingScene` export to expose a pip canvas ref callback:

```typescript
export function ArTrackingScene({ pipCanvasRef }: { pipCanvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const webgl = useWebGLSupport();

  useEffect(() => {
    if (!canvasRef.current || !webgl.supported) return undefined;
    return createScene(canvasRef.current, pipCanvasRef);
  }, [webgl.supported, pipCanvasRef]);

  if (!webgl.supported) return <WebGLFallback />;

  return (
    <canvas
      ref={canvasRef}
      data-testid="ar-tracking-canvas"
      aria-label="Babylon.js AR personnel tracking fab floor scene"
      className="h-full min-h-[calc(100dvh-104px)] w-full touch-none outline-none"
    />
  );
}
```

3. In `createScene`, replace the PiP camera setup (lines 1168-1180) with RTT:

```typescript
// Replace the arCamera viewport + PostProcess + PipArHud setup with:
const arCamera = new BABYLON.UniversalCamera('AR-FIRST-PERSON-CAMERA', new BABYLON.Vector3(0, HEAD_HEIGHT, 0), scene);
arCamera.fov = 1.05;
arCamera.minZ = 0.04;
arCamera.speed = 0;
// No viewport — RTT renders offscreen, not into the main canvas

const PIP_RTT_WIDTH = 512;
const PIP_RTT_HEIGHT = 384;
const pipRtt = new BABYLON.RenderTargetTexture(
  'pip-rtt',
  { width: PIP_RTT_WIDTH, height: PIP_RTT_HEIGHT },
  scene,
  { generateMipMaps: false, type: BABYLON.Constants.TEXTURETYPE_UNSIGNED_BYTE },
);
pipRtt.activeCamera = arCamera;
// Include all scene meshes in RTT render list
pipRtt.renderList = null; // null = render all meshes
scene.customRenderTargets.push(pipRtt);
pipRtt.refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE; // Manual control
```

4. Remove `scene.activeCameras` logic (lines 1554-1564). Replace with RTT refresh + canvas blit:

```typescript
// In the render loop, replace the pipTarget camera switching block with:
const pipTarget = store.pipTarget;
if (pipTarget) {
  const person = persons.get(pipTarget);
  if (person) {
    const headPosition = person.node.position.add(new BABYLON.Vector3(0, HEAD_HEIGHT, 0));
    arCamera.position.copyFrom(BABYLON.Vector3.Lerp(arCamera.position, headPosition, 0.16));
    arCamera.setTarget(headPosition.add(person.direction.scale(4)));

    pipRtt.refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONEVERYFRAME;

    // Blit RTT to pip canvas
    const pipCanvas = pipCanvasRef?.current;
    if (pipCanvas) {
      const ctx = pipCanvas.getContext('2d');
      if (ctx && pipRtt.readPixels()) {
        const pixels = pipRtt.readPixels()!;
        const imageData = new ImageData(
          new Uint8ClampedArray(pixels.buffer),
          PIP_RTT_WIDTH,
          PIP_RTT_HEIGHT,
        );
        ctx.putImageData(imageData, 0, 0);
      }
    }
  }
} else {
  pipRtt.refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
}
```

5. Remove all `PIP_HUD_LAYER_MASK` references, `pipArHud` creation, `pipArHud.texture.rootContainer.isVisible` toggling, and `pipPostProcess` creation.

6. Remove `pipArHud.texture.dispose()` and `pipPostProcess.dispose()` from the dispose function. Add `pipRtt.dispose()` instead.

7. Remove all `PipArHudRuntime` type, `createPipArHud` function, `updatePipArHud` function, and all Babylon.js GUI code for PiP HUD elements (the zone marker, distance warning, path line, etc. from lines 717-875).

**Step 2: Update PipOverlay in page.tsx to include a real canvas**

In `page.tsx`, update the PipOverlay component (lines 183-293):

```typescript
function PipOverlay({ pipCanvasRef }: { pipCanvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  const pipTarget = useArTrackingStore((state) => state.pipTarget);
  const closePip = useArTrackingStore((state) => state.closePip);
  const alerts = useArTrackingStore((state) => state.alerts);
  const personnel = useArTrackingStore((state) => state.personnel);
  const [timeStr, setTimeStr] = useState('');
  const [recVisible, setRecVisible] = useState(true);
  const [signalBars, setSignalBars] = useState(3);

  const activePipAlert = pipTarget
    ? alerts.filter((alert) => !alert.acknowledged).find((alert) => alert.personnelId === pipTarget)
    : undefined;
  const pipSeverityStyle = activePipAlert ? ALERT_SEVERITY_STYLES[activePipAlert.severity] : undefined;
  const trackedPerson = pipTarget ? personnel.find((p) => p.id === pipTarget) : undefined;
  const nearZone = trackedPerson?.inZone;

  useEffect(() => {
    const updateTime = () => setTimeStr(new Date().toLocaleTimeString('en-US', { hour12: false }));
    updateTime();
    const timerId = setInterval(updateTime, 1000);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    const blinkId = setInterval(() => setRecVisible((v) => !v), 500);
    return () => clearInterval(blinkId);
  }, []);

  useEffect(() => {
    const signalId = setInterval(() => setSignalBars(2 + Math.floor(Math.random() * 2)), 1500);
    return () => clearInterval(signalId);
  }, []);

  if (!pipTarget) return null;

  const camId = `CAM-${pipTarget.split('-')[1] ?? pipTarget}`;

  return (
    <div className="pointer-events-auto absolute bottom-3 right-4 z-40">
      <div
        className={`pip-surveillance-frame hud-corner-panel relative overflow-hidden rounded-lg border-2 border-[var(--sf-accent-cyan)] bg-[var(--sf-overlay-backdrop)] p-1 shadow-2xl shadow-cyan-950/40 backdrop-blur-sm ${pipSeverityStyle ? 'animate-pulse motion-reduce:animate-none' : ''}`}
        style={pipSeverityStyle ? { boxShadow: `0 0 22px ${pipSeverityStyle.color}66` } : undefined}
      >
        <div className="relative h-[180px] w-[240px] rounded bg-slate-950/80">
          {/* RTT canvas — actual 3D content */}
          <canvas
            ref={pipCanvasRef}
            width={512}
            height={384}
            className="pointer-events-none absolute inset-0 h-full w-full rounded object-cover"
          />

          {/* CRT scan-line overlay via CSS */}
          <div
            className="pip-scanline-overlay pointer-events-none absolute inset-0 rounded"
            aria-hidden="true"
          />

          {/* HUD overlay elements */}
          <div className="pointer-events-none absolute inset-0 px-2 py-1.5 font-mono">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-[9px] font-semibold tracking-[0.18em] text-[var(--sf-status-red)]">
                <span className={`inline-block h-1.5 w-1.5 rounded-full bg-[var(--sf-status-red)] shadow-[0_0_8px_var(--sf-status-red)] transition-opacity duration-200 ${recVisible ? 'opacity-100' : 'opacity-25'}`} />
                REC
              </span>
              <span className="text-[9px] font-semibold tracking-[0.18em] text-[var(--sf-accent-cyan)]">{camId}</span>
              <span className="flex h-3 items-end gap-0.5" aria-label={`${signalBars} of 3 signal bars`}>
                {[1, 2, 3].map((bar, index) => (
                  <span
                    key={bar}
                    className={`${SIGNAL_BAR_HEIGHT_CLASSES[index]} w-1 rounded-sm transition-colors duration-200 ${bar <= signalBars ? 'bg-[var(--sf-accent-cyan)]' : 'bg-[var(--sf-text-muted)]/40'}`}
                    aria-hidden="true"
                  />
                ))}
              </span>
            </div>
            {/* Zone proximity indicator — replaces Babylon GUI zone marker */}
            {nearZone && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 rounded border border-red-500/40 bg-red-950/60 px-2 py-0.5 text-center">
                <p className="text-[9px] font-bold text-red-400">ZONE: {nearZone}</p>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-2 pb-1">
              <span className="text-[9px] tabular-nums tracking-[0.12em] text-[var(--sf-text-secondary)]">{timeStr}</span>
              <button
                type="button"
                onClick={closePip}
                className="pointer-events-auto min-h-[28px] min-w-[28px] cursor-pointer rounded-full bg-black/50 px-1.5 py-0.5 text-[10px] text-[var(--sf-text-secondary)] transition-colors hover:bg-white/10 hover:text-[var(--sf-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sf-accent-cyan)]"
                aria-label="Close picture-in-picture"
              >
                &times;
              </button>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .pip-surveillance-frame {
          --pip-sweep-distance: 188px;
        }
        .pip-surveillance-frame::after {
          animation: pip-overlay-sweep 2s linear infinite;
          background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--sf-accent-cyan) 72%, transparent), transparent);
          content: '';
          height: 2px;
          left: 0;
          opacity: 0.78;
          pointer-events: none;
          position: absolute;
          right: 0;
          top: 0;
        }
        .pip-scanline-overlay {
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.08) 2px,
            rgba(0, 0, 0, 0.08) 4px
          );
        }
        @keyframes pip-overlay-sweep {
          from { transform: translateY(0); }
          to { transform: translateY(var(--pip-sweep-distance)); }
        }
        @media (prefers-reduced-motion: reduce) {
          .pip-surveillance-frame::after { animation: none; }
        }
      `}</style>
    </div>
  );
}
```

**Step 3: Update ArTrackingPage to wire pip canvas ref**

In the `ArTrackingPage` component (lines 295-317):

```typescript
export default function ArTrackingPage() {
  const closePip = useArTrackingStore((state) => state.closePip);
  const pipCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePip();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closePip]);

  return (
    <div className="relative min-h-[calc(100dvh-104px)] overflow-hidden bg-[#0A1628] text-slate-100">
      <ArTrackingScene pipCanvasRef={pipCanvasRef} />
      <div className="pointer-events-none fixed inset-0 z-30">
        <div className="absolute left-4 top-[116px]">
          <PersonnelStatusPanel />
        </div>
        <div className="absolute right-4 top-[116px]">
          <AlertToastStack />
        </div>
        <PipOverlay pipCanvasRef={pipCanvasRef} />
      </div>
    </div>
  );
}
```

**Step 4: Delete pip-scanline-shader.ts**

```bash
rm src/components/babylon/ar-tracking/pip-scanline-shader.ts
```

**Step 5: Remove GUI import if no longer needed**

If `@babylonjs/gui` is no longer used in ArTrackingScene.tsx after removing the PiP HUD, remove the import. Check if any other code in the file uses `GUI.*` — if the PiP AR HUD was the only GUI usage, remove `import * as GUI from '@babylonjs/gui'`.

**Step 6: TypeScript check**

```bash
cd equipment-monitor && npx tsc --noEmit
```

Expected: 0 errors

**Step 7: Commit**

```bash
git add -A
git commit -m "feat(ar-tracking): replace multi-viewport PiP with RTT + CSS composite"
```

---

## Task 4: Equipment Silhouette Models

**Goal:** Replace identical wireframe box edges with distinct low-poly silhouette shells per bay type, with internal wireframe structure. Apply equipment holographic material.

**Files:**
- Create: `src/components/babylon/ar-tracking/equipment-models.ts`
- Modify: `src/components/babylon/ArTrackingScene.tsx` (lines 341-389 — `createFabLayout`)

**Step 1: Create equipment model builders**

Create `src/components/babylon/ar-tracking/equipment-models.ts`:

```typescript
import * as BABYLON from '@babylonjs/core';
import { createEquipmentHolographicMaterial, updateHolographicColor, updateHolographicTime } from '@/lib/holographic-material';

export interface EquipmentModel {
  shell: BABYLON.Mesh;
  internals: BABYLON.LinesMesh[];
  holographicMaterial: BABYLON.ShaderMaterial;
}

function mergeShellMeshes(meshes: BABYLON.Mesh[], scene: BABYLON.Scene, name: string): BABYLON.Mesh {
  const merged = BABYLON.Mesh.MergeMeshes(meshes, true, true, undefined, false, true);
  if (!merged) {
    const fallback = BABYLON.MeshBuilder.CreateBox(name, { size: 1 }, scene);
    return fallback;
  }
  merged.name = name;
  return merged;
}

function createInternalLines(
  scene: BABYLON.Scene,
  name: string,
  lineSegments: BABYLON.Vector3[][],
  color: string,
): BABYLON.LinesMesh[] {
  return lineSegments.map((points, i) => {
    const line = BABYLON.MeshBuilder.CreateLines(`${name}-internal-${i}`, { points }, scene);
    line.color = BABYLON.Color3.FromHexString(color);
    line.isPickable = false;
    return line;
  });
}

function buildLithoBay(scene: BABYLON.Scene, x: number, z: number): { shells: BABYLON.Mesh[]; lines: BABYLON.Vector3[][] } {
  const platform = BABYLON.MeshBuilder.CreateBox('', { width: 8, height: 0.4, depth: 4 }, scene);
  platform.position.set(x, 0.2, z);
  const column = BABYLON.MeshBuilder.CreateCylinder('', { height: 3.5, diameter: 1.6, tessellation: 12 }, scene);
  column.position.set(x - 1.5, 1.95, z);
  const lens = BABYLON.MeshBuilder.CreateBox('', { width: 3.5, height: 0.6, depth: 2 }, scene);
  lens.position.set(x + 1, 3.0, z);

  return {
    shells: [platform, column, lens],
    lines: [
      [new BABYLON.Vector3(x - 3, 0.4, z - 1.5), new BABYLON.Vector3(x - 3, 0.4, z + 1.5)],
      [new BABYLON.Vector3(x - 1.5, 0.4, z), new BABYLON.Vector3(x - 1.5, 3.7, z)],
      [new BABYLON.Vector3(x - 0.5, 3.0, z - 0.8), new BABYLON.Vector3(x + 2.8, 3.0, z - 0.8)],
      [new BABYLON.Vector3(x - 0.5, 3.0, z + 0.8), new BABYLON.Vector3(x + 2.8, 3.0, z + 0.8)],
      [new BABYLON.Vector3(x + 1, 2.7, z), new BABYLON.Vector3(x + 1, 3.3, z)],
    ],
  };
}

function buildEtchBay(scene: BABYLON.Scene, x: number, z: number): { shells: BABYLON.Mesh[]; lines: BABYLON.Vector3[][] } {
  const chamber = BABYLON.MeshBuilder.CreateCylinder('', { height: 2.4, diameter: 3.6, tessellation: 16 }, scene);
  chamber.position.set(x, 1.2, z);
  const lid = BABYLON.MeshBuilder.CreateSphere('', { diameter: 3.6, segments: 8, slice: 0.5 }, scene);
  lid.position.set(x, 2.4, z);
  const pipe1 = BABYLON.MeshBuilder.CreateCylinder('', { height: 1.8, diameter: 0.4, tessellation: 8 }, scene);
  pipe1.rotation.z = Math.PI / 2;
  pipe1.position.set(x + 2.4, 1.2, z);
  const pipe2 = BABYLON.MeshBuilder.CreateCylinder('', { height: 1.8, diameter: 0.4, tessellation: 8 }, scene);
  pipe2.rotation.z = Math.PI / 2;
  pipe2.position.set(x - 2.4, 1.2, z);

  return {
    shells: [chamber, lid, pipe1, pipe2],
    lines: [
      [new BABYLON.Vector3(x, 0.05, z - 1.4), new BABYLON.Vector3(x, 2.4, z - 1.4)],
      [new BABYLON.Vector3(x, 0.05, z + 1.4), new BABYLON.Vector3(x, 2.4, z + 1.4)],
      [new BABYLON.Vector3(x - 1.4, 1.2, z), new BABYLON.Vector3(x + 1.4, 1.2, z)],
    ],
  };
}

function buildDiffusionBay(scene: BABYLON.Scene, x: number, z: number): { shells: BABYLON.Mesh[]; lines: BABYLON.Vector3[][] } {
  const tube = BABYLON.MeshBuilder.CreateCylinder('', { height: 7, diameter: 2.4, tessellation: 12 }, scene);
  tube.rotation.z = Math.PI / 2;
  tube.position.set(x, 1.5, z);
  const door = BABYLON.MeshBuilder.CreateBox('', { width: 0.3, height: 2, depth: 2.2 }, scene);
  door.position.set(x - 3.6, 1.2, z);

  return {
    shells: [tube, door],
    lines: [
      [new BABYLON.Vector3(x - 3.2, 0.3, z), new BABYLON.Vector3(x + 3.2, 0.3, z)],
      [new BABYLON.Vector3(x - 3.2, 2.7, z), new BABYLON.Vector3(x + 3.2, 2.7, z)],
      [new BABYLON.Vector3(x, 0.3, z - 1.0), new BABYLON.Vector3(x, 0.3, z + 1.0)],
    ],
  };
}

function buildMetrology(scene: BABYLON.Scene, x: number, z: number): { shells: BABYLON.Mesh[]; lines: BABYLON.Vector3[][] } {
  const body = BABYLON.MeshBuilder.CreateBox('', { width: 4, height: 2, depth: 3 }, scene);
  body.position.set(x, 1.0, z);
  const arm = BABYLON.MeshBuilder.CreateBox('', { width: 0.4, height: 1.5, depth: 0.4 }, scene);
  arm.position.set(x, 2.75, z);
  const turret = BABYLON.MeshBuilder.CreateCylinder('', { height: 0.8, diameter: 1.2, tessellation: 10 }, scene);
  turret.position.set(x, 3.9, z);

  return {
    shells: [body, arm, turret],
    lines: [
      [new BABYLON.Vector3(x - 1.5, 0.05, z - 1.2), new BABYLON.Vector3(x - 1.5, 2.0, z - 1.2)],
      [new BABYLON.Vector3(x + 1.5, 0.05, z + 1.2), new BABYLON.Vector3(x + 1.5, 2.0, z + 1.2)],
      [new BABYLON.Vector3(x, 2.0, z), new BABYLON.Vector3(x, 3.5, z)],
    ],
  };
}

function buildCmpBay(scene: BABYLON.Scene, x: number, z: number): { shells: BABYLON.Mesh[]; lines: BABYLON.Vector3[][] } {
  const platen = BABYLON.MeshBuilder.CreateCylinder('', { height: 0.6, diameter: 4, tessellation: 20 }, scene);
  platen.position.set(x, 0.8, z);
  const arm = BABYLON.MeshBuilder.CreateBox('', { width: 3, height: 0.3, depth: 0.5 }, scene);
  arm.position.set(x + 0.5, 1.6, z);
  const conditioner = BABYLON.MeshBuilder.CreateCylinder('', { height: 0.3, diameter: 1.2, tessellation: 12 }, scene);
  conditioner.position.set(x + 2.2, 1.9, z);

  return {
    shells: [platen, arm, conditioner],
    lines: [
      [new BABYLON.Vector3(x, 0.5, z - 1.6), new BABYLON.Vector3(x, 0.5, z + 1.6)],
      [new BABYLON.Vector3(x - 1.6, 0.5, z), new BABYLON.Vector3(x + 1.6, 0.5, z)],
      [new BABYLON.Vector3(x, 1.1, z), new BABYLON.Vector3(x, 1.6, z)],
    ],
  };
}

function buildImplant(scene: BABYLON.Scene, x: number, z: number): { shells: BABYLON.Mesh[]; lines: BABYLON.Vector3[][] } {
  const column = BABYLON.MeshBuilder.CreateBox('', { width: 1.6, height: 4, depth: 1.6 }, scene);
  column.position.set(x - 1.5, 2.0, z);
  const beamLine = BABYLON.MeshBuilder.CreateCylinder('', { height: 4, diameter: 0.6, tessellation: 8 }, scene);
  beamLine.rotation.z = Math.PI / 4;
  beamLine.position.set(x, 2.5, z);
  const endStation = BABYLON.MeshBuilder.CreateBox('', { width: 2.5, height: 1.8, depth: 2.5 }, scene);
  endStation.position.set(x + 1.5, 0.9, z);

  return {
    shells: [column, beamLine, endStation],
    lines: [
      [new BABYLON.Vector3(x - 1.5, 0.05, z), new BABYLON.Vector3(x - 1.5, 4.0, z)],
      [new BABYLON.Vector3(x - 1.5, 3.5, z), new BABYLON.Vector3(x + 1.5, 1.5, z)],
      [new BABYLON.Vector3(x + 0.5, 0.05, z - 1.0), new BABYLON.Vector3(x + 2.5, 0.05, z - 1.0)],
      [new BABYLON.Vector3(x + 0.5, 0.05, z + 1.0), new BABYLON.Vector3(x + 2.5, 0.05, z + 1.0)],
    ],
  };
}

function buildStocker(scene: BABYLON.Scene, x: number, z: number): { shells: BABYLON.Mesh[]; lines: BABYLON.Vector3[][] } {
  const lines: BABYLON.Vector3[][] = [];
  const shelves: BABYLON.Mesh[] = [];
  for (let row = 0; row < 4; row++) {
    const shelf = BABYLON.MeshBuilder.CreateBox('', { width: 3.5, height: 0.15, depth: 6 }, scene);
    shelf.position.set(x, 0.8 + row * 0.9, z);
    shelves.push(shelf);
    lines.push([
      new BABYLON.Vector3(x - 1.5, 0.8 + row * 0.9, z - 2.5),
      new BABYLON.Vector3(x + 1.5, 0.8 + row * 0.9, z - 2.5),
    ]);
  }
  const frame = BABYLON.MeshBuilder.CreateBox('', { width: 3.8, height: 4.2, depth: 0.15 }, scene);
  frame.position.set(x, 2.1, z - 3.1);
  shelves.push(frame);
  const frameBack = BABYLON.MeshBuilder.CreateBox('', { width: 3.8, height: 4.2, depth: 0.15 }, scene);
  frameBack.position.set(x, 2.1, z + 3.1);
  shelves.push(frameBack);

  // Vertical posts
  lines.push(
    [new BABYLON.Vector3(x - 1.5, 0.05, z - 2.5), new BABYLON.Vector3(x - 1.5, 4.2, z - 2.5)],
    [new BABYLON.Vector3(x + 1.5, 0.05, z - 2.5), new BABYLON.Vector3(x + 1.5, 4.2, z - 2.5)],
    [new BABYLON.Vector3(x - 1.5, 0.05, z + 2.5), new BABYLON.Vector3(x - 1.5, 4.2, z + 2.5)],
    [new BABYLON.Vector3(x + 1.5, 0.05, z + 2.5), new BABYLON.Vector3(x + 1.5, 4.2, z + 2.5)],
  );

  return { shells: shelves, lines };
}

function buildPhotoTrack(scene: BABYLON.Scene, x: number, z: number): { shells: BABYLON.Mesh[]; lines: BABYLON.Vector3[][] } {
  const body = BABYLON.MeshBuilder.CreateBox('', { width: 7, height: 1.8, depth: 2.5 }, scene);
  body.position.set(x, 0.9, z);
  const cups: BABYLON.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const cup = BABYLON.MeshBuilder.CreateCylinder('', { height: 0.6, diameter: 1.0, tessellation: 10 }, scene);
    cup.position.set(x - 2.5 + i * 2.5, 2.1, z);
    cups.push(cup);
  }

  return {
    shells: [body, ...cups],
    lines: [
      [new BABYLON.Vector3(x - 3.2, 0.05, z - 1.0), new BABYLON.Vector3(x + 3.2, 0.05, z - 1.0)],
      [new BABYLON.Vector3(x - 3.2, 0.05, z + 1.0), new BABYLON.Vector3(x + 3.2, 0.05, z + 1.0)],
      [new BABYLON.Vector3(x - 3.2, 1.8, z), new BABYLON.Vector3(x + 3.2, 1.8, z)],
      [new BABYLON.Vector3(x - 2.5, 1.8, z), new BABYLON.Vector3(x - 2.5, 2.4, z)],
      [new BABYLON.Vector3(x, 1.8, z), new BABYLON.Vector3(x, 2.4, z)],
      [new BABYLON.Vector3(x + 2.5, 1.8, z), new BABYLON.Vector3(x + 2.5, 2.4, z)],
    ],
  };
}

type BayBuilder = (scene: BABYLON.Scene, x: number, z: number) => { shells: BABYLON.Mesh[]; lines: BABYLON.Vector3[][] };

const BAY_BUILDERS: Record<string, BayBuilder> = {
  'Litho Bay': buildLithoBay,
  'Etch Bay': buildEtchBay,
  'Diffusion Bay': buildDiffusionBay,
  'Metrology': buildMetrology,
  'CMP Bay': buildCmpBay,
  'Implant': buildImplant,
  'Stocker': buildStocker,
  'Photo Track': buildPhotoTrack,
};

export function createEquipmentModel(
  scene: BABYLON.Scene,
  bayLabel: string,
  x: number,
  z: number,
  color: string,
  glow: BABYLON.GlowLayer,
): EquipmentModel {
  const builder = BAY_BUILDERS[bayLabel];
  if (!builder) {
    const fallback = BABYLON.MeshBuilder.CreateBox(`${bayLabel}-fallback`, { size: 2 }, scene);
    fallback.position.set(x, 1, z);
    const mat = createEquipmentHolographicMaterial(scene, `${bayLabel}-holo`, { baseColor: color });
    fallback.material = mat;
    return { shell: fallback, internals: [], holographicMaterial: mat };
  }

  const { shells, lines } = builder(scene, x, z);
  const shell = mergeShellMeshes(shells, scene, `${bayLabel}-shell`);
  const holoMat = createEquipmentHolographicMaterial(scene, `${bayLabel}-holo`, { baseColor: color });
  shell.material = holoMat;
  shell.isPickable = false;
  glow.addIncludedOnlyMesh(shell);

  const internals = createInternalLines(scene, bayLabel, lines, color);
  internals.forEach((line) => glow.addIncludedOnlyMesh(line));

  return { shell, internals, holographicMaterial: holoMat };
}

export { updateHolographicColor, updateHolographicTime };
```

**Step 2: TypeScript check**

```bash
cd equipment-monitor && npx tsc --noEmit
```

Expected: 0 errors

**Step 3: Commit**

```bash
git add src/components/babylon/ar-tracking/equipment-models.ts
git commit -m "feat(ar-tracking): add distinct equipment silhouette model builders"
```

---

## Task 5: Personnel Visual Upgrade

**Goal:** Replace capsule+sphere+torus augmentations with holographic shader on GLTF models (or articulated procedural fallback). Remove toy augmentation meshes, add ground tracking disc.

**Files:**
- Modify: `src/components/babylon/ArTrackingScene.tsx`

**Step 1: Replace createPerson with articulated procedural builder**

Replace the `createPerson` function (lines 520-563) with one that builds an articulated humanoid:

```typescript
function createPerson(scene: BABYLON.Scene, id: string, start: [number, number]): PersonRuntime {
  const node = new BABYLON.TransformNode(`${id}-node`, scene);
  node.position = new BABYLON.Vector3(start[0], 0, start[1]);

  const holoMat = createPersonnelHolographicMaterial(scene, `${id}-holo`, { baseColor: '#22d3ee' });

  // Torso
  const torso = BABYLON.MeshBuilder.CreateCapsule(`${id}-torso`, { height: 0.8, radius: 0.22, tessellation: 12 }, scene);
  torso.parent = node;
  torso.position.y = 1.15;
  torso.material = holoMat;
  torso.isPickable = false;

  // Head
  const head = BABYLON.MeshBuilder.CreateSphere(`${id}-head`, { diameter: 0.32, segments: 12 }, scene);
  head.parent = node;
  head.position.y = 1.72;
  head.material = holoMat;
  head.isPickable = false;

  // Neck
  const neck = BABYLON.MeshBuilder.CreateCylinder(`${id}-neck`, { height: 0.12, diameter: 0.12, tessellation: 8 }, scene);
  neck.parent = node;
  neck.position.y = 1.52;
  neck.material = holoMat;
  neck.isPickable = false;

  // Arms (upper + lower per side)
  const armParts: BABYLON.Mesh[] = [];
  for (const side of [-1, 1]) {
    const upper = BABYLON.MeshBuilder.CreateCylinder(`${id}-arm-upper-${side}`, { height: 0.35, diameter: 0.1, tessellation: 8 }, scene);
    upper.parent = node;
    upper.position.set(side * 0.32, 1.25, 0);
    upper.material = holoMat;
    upper.isPickable = false;
    armParts.push(upper);

    const lower = BABYLON.MeshBuilder.CreateCylinder(`${id}-arm-lower-${side}`, { height: 0.3, diameter: 0.08, tessellation: 8 }, scene);
    lower.parent = node;
    lower.position.set(side * 0.32, 0.9, 0);
    lower.material = holoMat;
    lower.isPickable = false;
    armParts.push(lower);
  }

  // Legs (upper + lower per side)
  const legParts: BABYLON.Mesh[] = [];
  for (const side of [-1, 1]) {
    const upper = BABYLON.MeshBuilder.CreateCylinder(`${id}-leg-upper-${side}`, { height: 0.4, diameter: 0.12, tessellation: 8 }, scene);
    upper.parent = node;
    upper.position.set(side * 0.12, 0.55, 0);
    upper.material = holoMat;
    upper.isPickable = false;
    legParts.push(upper);

    const lower = BABYLON.MeshBuilder.CreateCylinder(`${id}-leg-lower-${side}`, { height: 0.35, diameter: 0.09, tessellation: 8 }, scene);
    lower.parent = node;
    lower.position.set(side * 0.12, 0.17, 0);
    lower.material = holoMat;
    lower.isPickable = false;
    legParts.push(lower);
  }

  // AR glasses — one solid element
  const glasses = BABYLON.MeshBuilder.CreateBox(`${id}-ar-glasses`, { width: 0.3, height: 0.06, depth: 0.12 }, scene);
  glasses.parent = node;
  glasses.position = new BABYLON.Vector3(0, 1.73, -0.16);
  glasses.material = createPbr(scene, `${id}-glasses-material`, '#22d3ee', 1.2);
  glasses.isPickable = false;

  // ID tag with backing panel
  const tag = createLabel(scene, `${id}-tag`, id, '#22d3ee');
  tag.parent = node;
  tag.position.y = 2.05;
  tag.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);

  // Ground tracking disc
  const trackingDisc = BABYLON.MeshBuilder.CreateDisc(`${id}-tracking-disc`, { radius: 0.5, tessellation: 24 }, scene);
  trackingDisc.parent = node;
  trackingDisc.position.y = 0.02;
  trackingDisc.rotation.x = Math.PI / 2;
  trackingDisc.material = createPbr(scene, `${id}-disc-material`, '#22d3ee', 0.8, 0.4);
  trackingDisc.isPickable = false;

  return {
    node,
    bodyMaterial: holoMat as unknown as BABYLON.PBRMaterial, // kept for interface compat
    holographicMaterial: holoMat,
    trackingDisc,
    armParts,
    legParts,
    direction: new BABYLON.Vector3(0, 0, 1),
    waypointIndex: 0,
    isGltf: false,
    animGroups: null,
    currentAnim: 'idle',
    idleTimer: 0,
    idleLookDelay: 2 + Math.random(),
    behaviorUntilMs: 0,
    augmentations: null,
  };
}
```

Note: The `PersonRuntime` type needs new fields: `holographicMaterial: BABYLON.ShaderMaterial`, `trackingDisc: BABYLON.Mesh`, `armParts: BABYLON.Mesh[]`, `legParts: BABYLON.Mesh[]`.

**Step 2: Update createGltfPerson to apply holographic material**

In `createGltfPerson` (lines 565-646), after loading the model, strip materials and apply holographic shader:

```typescript
// After const result = await BABYLON.SceneLoader.ImportMeshAsync(...)
const holoMat = createPersonnelHolographicMaterial(scene, `${id}-holo`, { baseColor: '#22d3ee' });

result.meshes.forEach((mesh) => {
  mesh.isPickable = false;
  if (mesh instanceof BABYLON.Mesh && mesh.geometry) {
    mesh.material = holoMat;
  }
});
```

**Step 3: Remove all augmentation code**

Delete the following functions entirely:
- `createAugmentationMaterial` (lines 176-186)
- `getPersonnelAugmentationColor` (lines 188-195)
- `createPersonnelAugmentations` (lines 197-263)
- `updatePersonnelAugmentations` (lines 265-287)
- `PersonnelAugmentations` type (lines 88-96)

Remove `augmentations` field from `PersonRuntime` type and all references.

**Step 4: Update the render loop personnel visual code**

Replace the violation-based body color pulsing (lines 1504-1512) with holographic color updates:

```typescript
const visualState = useArTrackingStore.getState().personnel.find((item) => item.id === id);
const stateColor = getPersonnelStateColor(visualState);
if (person.holographicMaterial) {
  updateHolographicColor(person.holographicMaterial, stateColor);
}
if (person.trackingDisc?.material instanceof BABYLON.PBRMaterial) {
  person.trackingDisc.material.albedoColor = BABYLON.Color3.FromHexString(stateColor);
  person.trackingDisc.material.emissiveColor = BABYLON.Color3.FromHexString(stateColor).scale(0.8);
}
```

Where `getPersonnelStateColor` replaces the old augmentation color function:

```typescript
function getPersonnelStateColor(personnel: Personnel | undefined): string {
  if (personnel?.status === 'violation' || personnel?.state === 'avoiding') return '#ef4444';
  if (personnel?.state === 'operating') return '#f59e0b';
  if (personnel?.state === 'observing') return '#3b82f6';
  return '#22d3ee';
}
```

**Step 5: Add procedural walk animation for non-GLTF personnel**

Add a simple limb swing function called in the render loop for capsule-fallback personnel:

```typescript
function animateProceduralWalk(person: PersonRuntime, deltaSeconds: number, moving: boolean) {
  if (person.isGltf || !person.armParts?.length || !person.legParts?.length) return;

  const swingSpeed = moving ? 6 : 0;
  const swingAmount = moving ? 0.3 : 0;
  const t = performance.now() / 1000 * swingSpeed;

  // Arms swing opposite to legs
  person.armParts[0].rotation.x = Math.sin(t) * swingAmount; // left upper
  person.armParts[1].rotation.x = Math.sin(t) * swingAmount * 0.7; // left lower
  person.armParts[2].rotation.x = -Math.sin(t) * swingAmount; // right upper
  person.armParts[3].rotation.x = -Math.sin(t) * swingAmount * 0.7; // right lower

  // Legs
  person.legParts[0].rotation.x = -Math.sin(t) * swingAmount; // left upper
  person.legParts[1].rotation.x = -Math.sin(t) * swingAmount * 0.5; // left lower
  person.legParts[2].rotation.x = Math.sin(t) * swingAmount; // right upper
  person.legParts[3].rotation.x = Math.sin(t) * swingAmount * 0.5; // right lower
}
```

**Step 6: Update holographic material time uniform in render loop**

At the top of the render loop, after computing `deltaSeconds`:

```typescript
const elapsedTime = performance.now() / 1000;
persons.forEach((person) => {
  if (person.holographicMaterial) {
    updateHolographicTime(person.holographicMaterial, elapsedTime);
  }
});
```

**Step 7: TypeScript check + build**

```bash
cd equipment-monitor && npx tsc --noEmit
```

Expected: 0 errors

**Step 8: Commit**

```bash
git add -A
git commit -m "feat(ar-tracking): holographic personnel with articulated fallback"
```

---

## Task 6: Navigation Graph Scene Integration

**Goal:** Replace hardcoded `PATROL_ROUTES` waypoint interpolation with navigation graph traversal. Personnel follow graph edges along fab walkways.

**Files:**
- Modify: `src/components/babylon/ArTrackingScene.tsx`
- Modify: `src/stores/ar-tracking-store.ts`

**Step 1: Update the store to use nav graph routes**

In `ar-tracking-store.ts`, replace the `PATROL_ROUTES` import with resolved nav graph routes:

```typescript
import { NAV_PATROL_ROUTES, resolvePatrolRoute, nearestNavNode, NAV_NODES } from '@/lib/ar-tracking-nav-graph';

export const PATROL_ROUTES: Record<string, [number, number][]> = Object.fromEntries(
  Object.entries(NAV_PATROL_ROUTES).map(([id, nodeIds]) => [id, resolvePatrolRoute(nodeIds)]),
);
```

This is a drop-in replacement — the existing `PATROL_ROUTES` type signature (`Record<string, [number, number][]>`) is preserved, so `ArTrackingScene.tsx` continues to work without changes to `updatePersonMovement`.

**Step 2: Update INITIAL_PERSONNEL starting positions**

In `ar-tracking-store.ts`, update `INITIAL_PERSONNEL` to use the first waypoint of the new routes:

```typescript
export const INITIAL_PERSONNEL: Personnel[] = [
  { id: 'OP-01', name: 'Chen Wei', waypointIndex: 0, position: PATROL_ROUTES['OP-01'][0], inZone: null, status: 'normal', state: 'idle', stateTimer: 0 },
  { id: 'OP-02', name: 'Maya Patel', waypointIndex: 0, position: PATROL_ROUTES['OP-02'][0], inZone: null, status: 'normal', state: 'idle', stateTimer: 0 },
  { id: 'OP-03', name: 'Luis Ortega', waypointIndex: 0, position: PATROL_ROUTES['OP-03'][0], inZone: null, status: 'normal', state: 'idle', stateTimer: 0 },
  { id: 'OP-04', name: 'Aiko Tanaka', waypointIndex: 0, position: PATROL_ROUTES['OP-04'][0], inZone: null, status: 'normal', state: 'idle', stateTimer: 0 },
];
```

This is already how it works — it reads from `PATROL_ROUTES[id][0]`. No structural change needed, just the routes now resolve to graph node coordinates.

**Step 3: Update avoidance to re-enter graph**

In `ArTrackingScene.tsx`, update the avoidance logic to snap back to the nearest graph node when clearing a zone:

```typescript
// In the render loop, when clearing avoidance:
if (clearOfActiveZones) {
  // Find nearest nav node and set waypoint to it
  const nearestNode = nearestNavNode(person.node.position.x, person.node.position.z);
  const route = PATROL_ROUTES[id];
  const nodeCoords = NAV_NODES[nearestNode];
  // Find the closest route waypoint to this nav node
  let closestIdx = 0;
  let closestDist = Infinity;
  route.forEach(([wx, wz], idx) => {
    const d = Math.hypot(wx - nodeCoords[0], wz - nodeCoords[1]);
    if (d < closestDist) { closestDist = d; closestIdx = idx; }
  });
  person.waypointIndex = closestIdx;
  setPersonnelBehavior(store, person, id, 'patrolling', elapsedMs);
  personnelState = 'patrolling';
}
```

**Step 4: Remove old PATROL_ROUTES from store**

Delete the old hardcoded `PATROL_ROUTES` constant (lines 99-104 in `ar-tracking-store.ts`). It's now generated from the nav graph.

**Step 5: Run existing store tests**

```bash
cd equipment-monitor && npx jest src/stores/ar-tracking-store.test.ts --no-cache --verbose
```

Expected: ALL PASS (the store test uses `PATROL_ROUTES` which now resolves from the graph but has the same type)

**Step 6: Run nav graph tests**

```bash
cd equipment-monitor && npx jest src/lib/ar-tracking-nav-graph.test.ts --no-cache --verbose
```

Expected: ALL PASS

**Step 7: TypeScript check**

```bash
cd equipment-monitor && npx tsc --noEmit
```

Expected: 0 errors

**Step 8: Commit**

```bash
git add -A
git commit -m "feat(ar-tracking): integrate navigation graph walkways into patrol routes"
```

---

## Task 7: Integration Cleanup + QA

**Goal:** Wire equipment models into the scene, update holographic time uniforms for equipment, clean up removed code, run full build, verify all tests pass.

**Files:**
- Modify: `src/components/babylon/ArTrackingScene.tsx`

**Step 1: Replace createFabLayout with equipment model builders**

Replace the `createFabLayout` function (lines 341-389) to use `createEquipmentModel`:

```typescript
import { createEquipmentModel, type EquipmentModel } from './ar-tracking/equipment-models';

function createFabLayout(scene: BABYLON.Scene, glow: BABYLON.GlowLayer): EquipmentModel[] {
  const ground = BABYLON.MeshBuilder.CreateGround('AR-FAB-FLOOR', { width: 60, height: 40, subdivisions: 48 }, scene);
  const gridMaterial = new GridMaterial('ar-ground-grid-material', scene);
  gridMaterial.mainColor = BABYLON.Color3.FromHexString('#0A1628');
  gridMaterial.lineColor = BABYLON.Color3.FromHexString('#12324f');
  gridMaterial.minorUnitVisibility = 0.35;
  gridMaterial.majorUnitFrequency = 5;
  gridMaterial.gridRatio = 0.8;
  gridMaterial.opacity = 0.96;
  ground.material = gridMaterial;
  ground.isPickable = false;

  return EQUIPMENT_BAY_LAYOUT.map(([label, x, z]) =>
    createEquipmentModel(scene, label, x, z, '#22d3ee', glow),
  );
}
```

**Step 2: Update equipment state visuals to use holographic materials**

Replace `updateEquipmentBays` to work with `EquipmentModel[]`:

```typescript
function updateEquipmentBays(
  models: EquipmentModel[],
  store: ReturnType<typeof useArTrackingStore.getState>,
  time: number,
) {
  const equipmentByBay = new Map(store.equipment.map((eq) => [eq.bay, eq]));

  EQUIPMENT_BAY_LAYOUT.forEach(([label], index) => {
    const model = models[index];
    if (!model) return;
    const equipment = equipmentByBay.get(label);
    const state = equipment?.state ?? 'idle';
    const visual = EQUIPMENT_STATE_VISUALS[state];

    updateHolographicColor(model.holographicMaterial, visual.color);
    updateHolographicTime(model.holographicMaterial, time);
    model.internals.forEach((line) => {
      line.color = BABYLON.Color3.FromHexString(visual.color);
    });
  });
}
```

**Step 3: Update data panels**

Add DynamicTexture data panels above each equipment model (same `createLabel` pattern but attached to model position). The existing `EQUIPMENT_DATA_PANEL_LABELS` and status text logic can be preserved but simplified.

**Step 4: Remove dead code**

Remove all code that's no longer referenced:
- `EQUIPMENT_WIREFRAME_MESHES` array (line 65)
- `EQUIPMENT_DATA_PANEL_LABELS` array (line 66)
- `EquipmentBayRuntime` type (lines 132-138)
- `createWireframeBoxEdges` function (lines 317-339)
- Old `createFabLayout` (replaced)
- Old `updateEquipmentBays` (replaced)
- `PersonnelAugmentations` type and all augmentation functions (if not already removed in Task 5)
- `PipArHudRuntime` type and functions (if not already removed in Task 3)
- `PIP_HUD_COLORS` constant (line 40-48) — only if no longer used

**Step 5: Run all tests**

```bash
cd equipment-monitor && npx jest --no-cache --verbose
```

Expected: ALL PASS

**Step 6: TypeScript check**

```bash
cd equipment-monitor && npx tsc --noEmit
```

Expected: 0 errors

**Step 7: Build check**

```bash
cd equipment-monitor && npx next build
```

Expected: SUCCESS

**Step 8: Commit**

```bash
git add -A
git commit -m "feat(ar-tracking): integrate equipment models and clean up v3 dead code"
```

---

## Verification Commands

```bash
cd equipment-monitor && npx tsc --noEmit                                    # 0 errors
cd equipment-monitor && npx jest --no-cache --verbose                        # ALL PASS
cd equipment-monitor && npx next build                                       # SUCCESS
cd equipment-monitor && npx jest src/lib/ar-tracking-nav-graph.test.ts -v    # Nav graph tests PASS
cd equipment-monitor && npx jest src/stores/ar-tracking-store.test.ts -v     # Store tests PASS
```

## Commit Strategy

| Task | Commit Message |
|------|---------------|
| 1 | `feat(ar-tracking): add navigation graph with AABB-validated walkways` |
| 2 | `feat(ar-tracking): add holographic ShaderMaterial factory` |
| 3 | `feat(ar-tracking): replace multi-viewport PiP with RTT + CSS composite` |
| 4 | `feat(ar-tracking): add distinct equipment silhouette model builders` |
| 5 | `feat(ar-tracking): holographic personnel with articulated fallback` |
| 6 | `feat(ar-tracking): integrate navigation graph walkways into patrol routes` |
| 7 | `feat(ar-tracking): integrate equipment models and clean up v3 dead code` |
