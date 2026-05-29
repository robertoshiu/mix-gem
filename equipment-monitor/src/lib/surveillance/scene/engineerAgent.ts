/**
 * Engineer patrol agent — GLB-based character that walks waypoint routes.
 * Supports multiple agents with independent patrol state and AR head cameras.
 * Procedural walk bob for realism without skeletal animation.
 */
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Scene } from '@babylonjs/core/scene';
import type { AnimationGroup } from '@babylonjs/core/Animations/animationGroup';
import { type PatrolRoute, applyJitter } from '../config/patrol';
import type { LoadedCharacter, EquipmentObstacle } from '../config/assets';

export type AgentState = 'walking' | 'idle';

export interface EngineerAgent {
  id: string;
  name: string;
  root: TransformNode;
  arCamera: FreeCamera;
  position: Vector3;
  heading: number; // travel direction in radians
  state: AgentState;
  currentWaypointIndex: number;
  update(dt: number, neighbors?: EngineerAgent[]): void;
  dispose(): void;
}

// Walk bob parameters
const BOB_AMPLITUDE = 0.03; // meters
const BOB_FREQUENCY = 4.0;  // Hz (2 steps per second = 4 half-cycles)
const SWING_AMPLITUDE = 0.087; // ~5 degrees in radians
// glTF models face local -Z. After nulling rotationQuaternion, add π so -Z aligns with heading.
const CHARACTER_FORWARD_YAW_OFFSET = Math.PI;
// Collision avoidance between agents (applies to all agents).
const PERSONAL_SPACE = 0.9;   // metres; repulsion radius
const MAX_AVOID_OFFSET = 0.6; // metres; max lateral displacement from path
// Hard collision against equipment footprints (engineers walk around tools).
const PERSON_RADIUS = 0.4;       // metres; body half-width kept clear of tools
const OBSTACLE_SOLVE_PASSES = 2; // resolve against multiple overlapping tools

/**
 * Create an engineer agent from a loaded character GLB and patrol route.
 */
export function createEngineerAgent(
  scene: Scene,
  character: LoadedCharacter,
  route: PatrolRoute,
  obstacles: EquipmentObstacle[] = [],
): EngineerAgent {
  const { root } = character;
  // glTF loader sets rotationQuaternion which overrides Euler .rotation — null it
  // so that rotation.y (facing) and rotation.z (walk swing) actually take effect.
  root.rotationQuaternion = null;
  const groundedY = root.position.y;

  // Skeletal walk: textured models drive limb motion via AnimationGroup instead of
  // the procedural bob/swing. Playback is toggled on walking/idle state changes.
  const animated = character.hasSkeletalWalk === true;
  const walkGroups: AnimationGroup[] = character.animationGroups ?? [];

  // Persistent smoothed avoidance offset (lateral displacement from path).
  let avoidX = 0;
  let avoidZ = 0;

  // Position at first waypoint
  const startPos = route.waypoints[0].position.clone();
  root.position = new Vector3(startPos.x, groundedY, startPos.z);

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
  let travelHeading = 0; // radians — direction of travel
  let currentTarget: Vector3 = applyJitter(route.waypoints[1].position);

  function playWalk(): void {
    if (!animated) return;
    for (const group of walkGroups) {
      if (!group.isPlaying) group.play(true);
    }
  }

  function pauseWalk(): void {
    if (!animated) return;
    for (const group of walkGroups) {
      group.pause();
    }
  }

  function faceTarget(from: Vector3, target: Vector3): void {
    const dir = target.subtract(from);
    if (dir.length() > 0.01) {
      travelHeading = Math.atan2(dir.x, dir.z);
      root.rotation.y = travelHeading + CHARACTER_FORWARD_YAW_OFFSET;
    }
  }

  faceTarget(route.waypoints[0].position, currentTarget);

  function getSegmentLength(): number {
    const from = route.waypoints[currentIndex].position;
    return Vector3.Distance(from, currentTarget);
  }

  function arriveAtWaypoint(): void {
    currentIndex = nextIndex;
    nextIndex = (currentIndex + 1) % route.waypoints.length;
    progress = 0;
    state = 'idle';
    pauseWalk();
    pauseTimer = route.waypoints[currentIndex].pauseDuration;
    walkTime = 0;

    // Snap position
    root.position.x = route.waypoints[currentIndex].position.x;
    root.position.z = route.waypoints[currentIndex].position.z;
    root.position.y = groundedY;

    // Prepare next target with jitter
    currentTarget = applyJitter(route.waypoints[nextIndex].position);
    faceTarget(route.waypoints[currentIndex].position, currentTarget);
  }

  function update(dt: number, neighbors?: EngineerAgent[]): void {
    // Base path position for this frame (idle: current waypoint; walking: lerped).
    let bx = root.position.x;
    let bz = root.position.z;

    if (state === 'idle') {
      pauseTimer -= dt;
      bx = route.waypoints[currentIndex].position.x;
      bz = route.waypoints[currentIndex].position.z;
      root.position.y = groundedY;
      // Idle: slowly face nearest direction
      if (pauseTimer <= 0) {
        state = 'walking';
        playWalk();
        nextIndex = (currentIndex + 1) % route.waypoints.length;
        progress = 0;
        currentTarget = applyJitter(route.waypoints[nextIndex].position);
        faceTarget(route.waypoints[currentIndex].position, currentTarget);
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
        return;
      } else {
        // Interpolate position
        const from = route.waypoints[currentIndex].position;
        const pos = Vector3.Lerp(from, currentTarget, progress);
        bx = pos.x;
        bz = pos.z;

        if (animated) {
          // Skeletal animation handles bob/limb motion — keep grounded and level.
          root.position.y = groundedY;
        } else {
          // Procedural walk bob
          walkTime += dt;
          root.position.y = groundedY
            + Math.abs(Math.sin(walkTime * BOB_FREQUENCY * Math.PI)) * BOB_AMPLITUDE;

          // Rotation swing (subtle lean)
          root.rotation.z = Math.sin(walkTime * BOB_FREQUENCY * Math.PI * 0.5) * SWING_AMPLITUDE;
        }

        // Face direction of travel
        faceTarget(from, currentTarget);
      }
    }

    // Collision avoidance: weighted repulsion from neighbors within PERSONAL_SPACE,
    // applied as a smoothed lateral offset on top of the base path position.
    let ox = 0, oz = 0;
    if (neighbors) for (const o of neighbors) {
      if (o.id === route.id) continue;
      const dx = bx - o.position.x, dz = bz - o.position.z;
      const d2 = dx * dx + dz * dz;
      if (d2 > 1e-6 && d2 < PERSONAL_SPACE * PERSONAL_SPACE) {
        const d = Math.sqrt(d2);
        const w = (PERSONAL_SPACE - d) / PERSONAL_SPACE; // 1 at contact -> 0 at edge
        ox += (dx / d) * w; oz += (dz / d) * w;
      }
    }
    const olen = Math.hypot(ox, oz);
    let tx = 0, tz = 0;
    if (olen > 1e-6) { const mag = Math.min(olen, 1) * MAX_AVOID_OFFSET; tx = (ox / olen) * mag; tz = (oz / olen) * mag; }
    avoidX += (tx - avoidX) * Math.min(1, dt * 8);
    avoidZ += (tz - avoidZ) * Math.min(1, dt * 8);
    root.position.x = bx + avoidX;
    root.position.z = bz + avoidZ;

    // Hard collision against equipment footprints: if the engineer ends up inside a
    // tool's circle, push them radially out to its edge. Multiple passes resolve
    // overlapping tools. This guarantees no clipping even if a path crosses a tool.
    for (let pass = 0; pass < OBSTACLE_SOLVE_PASSES; pass++) {
      let pushed = false;
      for (const ob of obstacles) {
        const dx = root.position.x - ob.x;
        const dz = root.position.z - ob.z;
        const minDist = ob.radius + PERSON_RADIUS;
        const d2 = dx * dx + dz * dz;
        if (d2 < minDist * minDist) {
          const d = Math.sqrt(d2);
          if (d > 1e-4) {
            const push = (minDist - d) / d;
            root.position.x += dx * push;
            root.position.z += dz * push;
          } else {
            // Dead-center: eject along +X by the full clearance.
            root.position.x += minDist;
          }
          pushed = true;
        }
      }
      if (!pushed) break;
    }

    // Sync AR camera — use setTarget for unambiguous forward direction
    const fwdX = Math.sin(travelHeading);
    const fwdZ = Math.cos(travelHeading);
    const eyeX = root.position.x + fwdX * 0.15;
    const eyeZ = root.position.z + fwdZ * 0.15;
    arCamera.position.set(eyeX, 1.55, eyeZ);
    arCamera.setTarget(new Vector3(
      eyeX + fwdX * 5,
      1.45,
      eyeZ + fwdZ * 5,
    ));
  }

  function dispose(): void {
    for (const group of walkGroups) {
      group.stop();
      group.dispose();
    }
    arCamera.dispose();
    root.dispose();
  }

  return {
    id: route.id,
    name: route.name,
    root,
    arCamera,
    get position() { return new Vector3(root.position.x, 0, root.position.z); },
    get heading() { return travelHeading; },
    get state() { return state; },
    get currentWaypointIndex() { return currentIndex; },
    update,
    dispose,
  };
}
