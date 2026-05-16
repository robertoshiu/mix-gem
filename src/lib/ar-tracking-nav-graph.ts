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
    'W-MID', 'W-NW', 'NW-TOP', 'PT-W', 'N-IW', 'C-CW',
    'GAP-ED', 'S-MW', 'S-W', 'MID-W', 'W-SW', 'W-MID',
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
