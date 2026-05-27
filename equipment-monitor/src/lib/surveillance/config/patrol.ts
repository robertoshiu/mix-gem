import { Vector3 } from '@babylonjs/core/Maths/math.vector';

export interface Waypoint {
  position: Vector3;
  pauseDuration: number; // seconds to pause at this waypoint
}

export interface PatrolRoute {
  id: string;
  name: string;
  suitVariant: 'base' | 'blue' | 'casual' | 'walking';
  walkSpeed: number; // m/s
  waypoints: Waypoint[];
  animatedModel?: 'casualWalk' | 'walking';
}

/**
 * Add random lateral offset to a waypoint position for natural movement.
 */
export function applyJitter(pos: Vector3, amount: number = 0.15): Vector3 {
  const jitterX = (Math.random() - 0.5) * 2 * amount;
  const jitterZ = (Math.random() - 0.5) * 2 * amount;
  return new Vector3(pos.x + jitterX, pos.y, pos.z + jitterZ);
}

// ENG-01: Outer perimeter loop — 1.5m clearance from all equipment
const route01: PatrolRoute = {
  id: 'ENG-01',
  name: '王志明',
  suitVariant: 'base',
  walkSpeed: 1.0,
  waypoints: [
    { position: new Vector3(0, 0, -9), pauseDuration: 2 },
    { position: new Vector3(-7, 0, -9), pauseDuration: 1 },
    { position: new Vector3(-13, 0, -9), pauseDuration: 2 },
    { position: new Vector3(-13, 0, 0), pauseDuration: 1 },
    { position: new Vector3(-13, 0, 8), pauseDuration: 2 },
    { position: new Vector3(0, 0, 8), pauseDuration: 1 },
    { position: new Vector3(7, 0, 8), pauseDuration: 1 },
    { position: new Vector3(13, 0, 8), pauseDuration: 2 },
    { position: new Vector3(13, 0, 0), pauseDuration: 1 },
    { position: new Vector3(13, 0, -9), pauseDuration: 2 },
    { position: new Vector3(7, 0, -9), pauseDuration: 1 },
  ],
};

// ENG-02: North-half central aisle — 2m+ clearance from all equipment
const route02: PatrolRoute = {
  id: 'ENG-02',
  name: '李佩芳',
  suitVariant: 'base',
  walkSpeed: 0.85,
  waypoints: [
    { position: new Vector3(-2, 0, 7), pauseDuration: 3 },
    { position: new Vector3(-2, 0, 1), pauseDuration: 4 },
    { position: new Vector3(2, 0, 7), pauseDuration: 2 },
    { position: new Vector3(7, 0, 7), pauseDuration: 3 },
    { position: new Vector3(7, 0, 0), pauseDuration: 2 },
    { position: new Vector3(2, 0, -2), pauseDuration: 3 },
    { position: new Vector3(-2, 0, -2), pauseDuration: 2 },
    { position: new Vector3(-2, 0, 5), pauseDuration: 2 },
  ],
};

// ENG-03: South-half corridor — 2m+ clearance from all equipment
// Route loops through south gap (Z=-3.5), east perimeter (X=13),
// south wall (Z=-8.5), then back west. Avoids EFEM-02/CHEM-01 at X=11.
const route03: PatrolRoute = {
  id: 'ENG-03',
  name: '陳大偉',
  suitVariant: 'blue',
  walkSpeed: 1.15,
  waypoints: [
    { position: new Vector3(-7, 0, -3.5), pauseDuration: 3 },
    { position: new Vector3(5, 0, -3.5), pauseDuration: 2 },
    { position: new Vector3(13, 0, -3.5), pauseDuration: 2 },
    { position: new Vector3(13, 0, -8.5), pauseDuration: 2 },
    { position: new Vector3(5, 0, -8.5), pauseDuration: 2 },
    { position: new Vector3(-7, 0, -8.5), pauseDuration: 2 },
  ],
};

// ENG-04: Casual walk (skinned). Shares ENG-01's east/north outer perimeter but
// traverses it in the OPPOSITE direction (northbound east wall, westbound north wall)
// for head-on meetings. All waypoints on the outer perimeter (X=±13 / Z=±9 / Z=8),
// >=2m clear of all equipment (nearest: PVD 8,-3 / SEM-02 4,-6).
const route04: PatrolRoute = {
  id: 'ENG-04',
  name: '林淑芬',
  suitVariant: 'casual',
  animatedModel: 'casualWalk',
  walkSpeed: 0.95,
  waypoints: [
    { position: new Vector3(7, 0, -9), pauseDuration: 1.5 },
    { position: new Vector3(13, 0, -9), pauseDuration: 2.5 },
    { position: new Vector3(13, 0, 0), pauseDuration: 1.5 },
    { position: new Vector3(13, 0, 8), pauseDuration: 2.5 },
    { position: new Vector3(7, 0, 8), pauseDuration: 1.5 },
    { position: new Vector3(0, 0, 8), pauseDuration: 2.5 },
    { position: new Vector3(-7, 0, 8), pauseDuration: 1.5 },
  ],
};

// ENG-05: Walking (skinned). Crosses the south Z=-3.5 corridor (shared with ENG-03,
// traversed westbound = opposite to ENG-03's eastbound) and the central aisle shared
// with ENG-02. Stays >=2m from equipment (nearest: PVD 8,-3 / ROBOT 2,2 / SEM row Z=-6).
const route05: PatrolRoute = {
  id: 'ENG-05',
  name: '張家豪',
  suitVariant: 'walking',
  animatedModel: 'walking',
  walkSpeed: 1.05,
  waypoints: [
    { position: new Vector3(13, 0, -3.5), pauseDuration: 2 },
    { position: new Vector3(5, 0, -3.5), pauseDuration: 1.5 },
    { position: new Vector3(-7, 0, -3.5), pauseDuration: 2 },
    { position: new Vector3(-2, 0, 0), pauseDuration: 1.5 },
    { position: new Vector3(-2, 0, 6), pauseDuration: 2 },
    { position: new Vector3(5, 0, 0), pauseDuration: 1.5 },
  ],
};

export const patrolRoutes: PatrolRoute[] = [route01, route02, route03, route04, route05];

// Keep legacy export for compatibility
export const patrolPath = route01.waypoints;
export const WALK_SPEED = route01.walkSpeed;
