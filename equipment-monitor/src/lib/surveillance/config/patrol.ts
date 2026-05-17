import { Vector3 } from '@babylonjs/core/Maths/math.vector';

export interface Waypoint {
  position: Vector3;
  pauseDuration: number; // seconds to pause at this waypoint
}

export interface PatrolRoute {
  id: string;
  name: string;
  suitVariant: 'base' | 'blue';
  walkSpeed: number; // m/s
  waypoints: Waypoint[];
}

/**
 * Add random lateral offset to a waypoint position for natural movement.
 */
export function applyJitter(pos: Vector3, amount: number = 0.3): Vector3 {
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
const route03: PatrolRoute = {
  id: 'ENG-03',
  name: '陳大偉',
  suitVariant: 'blue',
  walkSpeed: 1.15,
  waypoints: [
    { position: new Vector3(-7, 0, -3.5), pauseDuration: 3 },
    { position: new Vector3(-2, 0, -3.5), pauseDuration: 2 },
    { position: new Vector3(2, 0, -3.5), pauseDuration: 3 },
    { position: new Vector3(6, 0, -1), pauseDuration: 2 },
    { position: new Vector3(10, 0, -1), pauseDuration: 2 },
    { position: new Vector3(10, 0, -9), pauseDuration: 2 },
    { position: new Vector3(2, 0, -9), pauseDuration: 2 },
    { position: new Vector3(-7, 0, -9), pauseDuration: 2 },
  ],
};

export const patrolRoutes: PatrolRoute[] = [route01, route02, route03];

// Keep legacy export for compatibility
export const patrolPath = route01.waypoints;
export const WALK_SPEED = route01.walkSpeed;
