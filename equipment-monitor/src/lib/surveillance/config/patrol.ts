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

// ENG-01: Full loop — enters both litho_bay and chemical_storage restricted zones
const route01: PatrolRoute = {
  id: 'ENG-01',
  name: '王志明',
  suitVariant: 'base',
  walkSpeed: 1.0,
  waypoints: [
    { position: new Vector3(0, 0, -8), pauseDuration: 2 },
    { position: new Vector3(-8, 0, -8), pauseDuration: 2 },
    // Enter litho bay (RESTRICTED)
    { position: new Vector3(-9, 0, -3), pauseDuration: 2 },
    { position: new Vector3(-9, 0, 2), pauseDuration: 3 },
    // Exit litho bay
    { position: new Vector3(-9, 0, 7), pauseDuration: 2 },
    { position: new Vector3(0, 0, 7), pauseDuration: 2 },
    { position: new Vector3(5, 0, 7), pauseDuration: 2 },
    // Toward chemical storage
    { position: new Vector3(10, 0, 2), pauseDuration: 2 },
    // Enter chemical storage (RESTRICTED)
    { position: new Vector3(11, 0, -6), pauseDuration: 3 },
    { position: new Vector3(11, 0, -8), pauseDuration: 2 },
    // Return to center
    { position: new Vector3(5, 0, -5), pauseDuration: 2 },
    { position: new Vector3(0, 0, -5), pauseDuration: 2 },
  ],
};

// ENG-02: North-only loop — litho bay → coating → metrology. Mostly legal.
const route02: PatrolRoute = {
  id: 'ENG-02',
  name: '李佩芳',
  suitVariant: 'base',
  walkSpeed: 0.85,
  waypoints: [
    { position: new Vector3(-4, 0, 7), pauseDuration: 3 },
    { position: new Vector3(-4, 0, 3), pauseDuration: 4 }, // Inspecting COAT-01
    { position: new Vector3(0, 0, 4), pauseDuration: 3 },  // Inspecting CVD-01
    { position: new Vector3(4, 0, 4), pauseDuration: 3 },  // Inspecting ETCH-01
    { position: new Vector3(2, 0, 2), pauseDuration: 2 },  // Near ROBOT-01
    { position: new Vector3(0, 0, 7), pauseDuration: 2 },
    // Occasionally approaches litho bay edge
    { position: new Vector3(-6, 0, 3), pauseDuration: 3 },
    { position: new Vector3(-4, 0, 7), pauseDuration: 2 },
  ],
};

// ENG-03: South-only loop — EFEM → SEM → chemical area edge. Occasional chemical breach.
const route03: PatrolRoute = {
  id: 'ENG-03',
  name: '陳大偉',
  suitVariant: 'blue',
  walkSpeed: 1.15,
  waypoints: [
    { position: new Vector3(-4, 0, -6), pauseDuration: 3 }, // EFEM-01
    { position: new Vector3(0, 0, -6), pauseDuration: 4 },  // SEM-01
    { position: new Vector3(4, 0, -6), pauseDuration: 3 },  // SEM-02
    { position: new Vector3(8, 0, -3), pauseDuration: 2 },  // PVD-01
    // Approaches chemical storage edge
    { position: new Vector3(10, 0, -5), pauseDuration: 2 },
    // Enters chemical storage briefly (RESTRICTED)
    { position: new Vector3(11, 0, -6), pauseDuration: 2 },
    // Back out
    { position: new Vector3(8, 0, -5), pauseDuration: 2 },
    { position: new Vector3(4, 0, -8), pauseDuration: 2 },
    { position: new Vector3(0, 0, -8), pauseDuration: 2 },
  ],
};

export const patrolRoutes: PatrolRoute[] = [route01, route02, route03];

// Keep legacy export for compatibility
export const patrolPath = route01.waypoints;
export const WALK_SPEED = route01.walkSpeed;
