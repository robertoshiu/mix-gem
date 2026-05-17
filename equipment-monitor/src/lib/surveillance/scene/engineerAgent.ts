/**
 * Engineer patrol agent — GLB-based character that walks waypoint routes.
 * Supports multiple agents with independent patrol state and AR head cameras.
 * Procedural walk bob for realism without skeletal animation.
 */
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Scene } from '@babylonjs/core/scene';
import { type PatrolRoute, applyJitter } from '../config/patrol';
import type { LoadedCharacter } from '../config/assets';

export type AgentState = 'walking' | 'idle';

export interface EngineerAgent {
  id: string;
  name: string;
  root: TransformNode;
  headNode: TransformNode | null;
  arCamera: FreeCamera;
  position: Vector3;
  state: AgentState;
  currentWaypointIndex: number;
  update(dt: number): void;
  dispose(): void;
}

// Walk bob parameters
const BOB_AMPLITUDE = 0.03; // meters
const BOB_FREQUENCY = 4.0;  // Hz (2 steps per second = 4 half-cycles)
const SWING_AMPLITUDE = 0.087; // ~5 degrees in radians

/**
 * Create an engineer agent from a loaded character GLB and patrol route.
 */
export function createEngineerAgent(
  scene: Scene,
  character: LoadedCharacter,
  route: PatrolRoute,
): EngineerAgent {
  const { root, headNode } = character;

  // Position at first waypoint
  const startPos = route.waypoints[0].position.clone();
  root.position = new Vector3(startPos.x, 0, startPos.z);

  // Create AR camera attached to head
  const arCamera = new FreeCamera(`arCam_${route.id}`, Vector3.Zero(), scene);
  arCamera.fov = 1.22; // ~70 degrees
  arCamera.minZ = 0.1;
  arCamera.maxZ = 50;

  // Patrol state
  let currentIndex = 0;
  let nextIndex = 1;
  let progress = 0;
  let pauseTimer = route.waypoints[0].pauseDuration;
  let state: AgentState = 'idle';
  let walkTime = 0; // Accumulator for walk bob
  let currentTarget: Vector3 = applyJitter(route.waypoints[1].position);

  function getSegmentLength(): number {
    const from = route.waypoints[currentIndex].position;
    return Vector3.Distance(from, currentTarget);
  }

  function arriveAtWaypoint(): void {
    currentIndex = nextIndex;
    nextIndex = (currentIndex + 1) % route.waypoints.length;
    progress = 0;
    state = 'idle';
    pauseTimer = route.waypoints[currentIndex].pauseDuration;
    walkTime = 0;

    // Snap position
    root.position.x = route.waypoints[currentIndex].position.x;
    root.position.z = route.waypoints[currentIndex].position.z;
    root.position.y = 0;

    // Prepare next target with jitter
    currentTarget = applyJitter(route.waypoints[nextIndex].position);
  }

  function update(dt: number): void {
    if (state === 'idle') {
      pauseTimer -= dt;
      // Idle: slowly face nearest direction
      if (pauseTimer <= 0) {
        state = 'walking';
        nextIndex = (currentIndex + 1) % route.waypoints.length;
        progress = 0;
        currentTarget = applyJitter(route.waypoints[nextIndex].position);
      }
    } else {
      // Walking
      const segLen = getSegmentLength();
      if (segLen < 0.01) {
        arriveAtWaypoint();
        return;
      }

      const step = (route.walkSpeed * dt) / segLen;
      progress += step;

      if (progress >= 1) {
        arriveAtWaypoint();
      } else {
        // Interpolate position
        const from = route.waypoints[currentIndex].position;
        const pos = Vector3.Lerp(from, currentTarget, progress);
        root.position.x = pos.x;
        root.position.z = pos.z;

        // Procedural walk bob
        walkTime += dt;
        root.position.y = Math.abs(Math.sin(walkTime * BOB_FREQUENCY * Math.PI)) * BOB_AMPLITUDE;

        // Rotation swing (subtle lean)
        root.rotation.z = Math.sin(walkTime * BOB_FREQUENCY * Math.PI * 0.5) * SWING_AMPLITUDE;

        // Face direction
        const dir = currentTarget.subtract(from);
        if (dir.length() > 0.01) {
          root.rotation.y = Math.atan2(dir.x, dir.z);
        }
      }
    }

    // Sync AR camera to head position
    if (headNode) {
      headNode.computeWorldMatrix(true);
      const headWorld = headNode.getAbsolutePosition();
      arCamera.position.copyFrom(headWorld);
      arCamera.rotation.y = root.rotation.y;
      arCamera.rotation.x = -0.1; // Slight downward tilt (natural head pose)
    } else {
      // Fallback: camera at head height
      arCamera.position.set(root.position.x, 1.6, root.position.z);
      arCamera.rotation.y = root.rotation.y;
    }
  }

  function dispose(): void {
    arCamera.dispose();
    root.dispose();
  }

  return {
    id: route.id,
    name: route.name,
    root,
    headNode,
    arCamera,
    get position() { return new Vector3(root.position.x, 0, root.position.z); },
    get state() { return state; },
    get currentWaypointIndex() { return currentIndex; },
    update,
    dispose,
  };
}
