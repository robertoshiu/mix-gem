import { Vector3 } from '@babylonjs/core/Maths/math.vector';

export interface Waypoint {
  position: Vector3;
  pauseDuration: number; // seconds to pause at this waypoint
}

// Patrol route deliberately routes through litho_bay and chemical_storage zones
export const patrolPath: Waypoint[] = [
  // Start at entrance (south side)
  { position: new Vector3(0, 0, -8), pauseDuration: 2 },
  // Walk west along south corridor
  { position: new Vector3(-8, 0, -8), pauseDuration: 2 },
  // Move north into lithography bay (RESTRICTED)
  { position: new Vector3(-9, 0, -3), pauseDuration: 2 },
  // Through litho bay center
  { position: new Vector3(-9, 0, 2), pauseDuration: 3 },
  // Exit litho bay north
  { position: new Vector3(-9, 0, 7), pauseDuration: 2 },
  // Cross to east side via north corridor
  { position: new Vector3(0, 0, 7), pauseDuration: 2 },
  { position: new Vector3(5, 0, 7), pauseDuration: 2 },
  // Turn south toward chemical storage
  { position: new Vector3(10, 0, 2), pauseDuration: 2 },
  // Enter chemical storage (RESTRICTED)
  { position: new Vector3(11, 0, -6), pauseDuration: 3 },
  { position: new Vector3(11, 0, -8), pauseDuration: 2 },
  // Exit and return to center
  { position: new Vector3(5, 0, -5), pauseDuration: 2 },
  { position: new Vector3(0, 0, -5), pauseDuration: 2 },
];

export const WALK_SPEED = 1.2; // meters per second
