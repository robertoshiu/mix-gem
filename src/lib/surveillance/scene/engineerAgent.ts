/**
 * Engineer patrol agent — walks a waypoint route at constant speed,
 * rotates to face travel direction, pauses at each waypoint.
 * Exposes position for zone-check and AR camera attachment.
 */
import { Scene } from '@babylonjs/core/scene';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { patrolPath, WALK_SPEED } from '../config/patrol';

export type AgentState = 'walking' | 'idle';

export interface EngineerAgent {
  mesh: Mesh;
  position: Vector3;
  state: AgentState;
  currentWaypointIndex: number;
  update(dt: number): void;
  attachARCamera(camera: FreeCamera): void;
}

export function createEngineerAgent(scene: Scene): EngineerAgent {
  // Capsule body
  const body = MeshBuilder.CreateCapsule('engineer_body', {
    height: 1.7,
    radius: 0.25,
  }, scene);
  body.position = patrolPath[0].position.clone();
  body.position.y = 0.85; // half height

  const bodyMat = new StandardMaterial('engineerMat', scene);
  bodyMat.diffuseColor = new Color3(0.2, 0.4, 0.8);
  bodyMat.emissiveColor = new Color3(0.05, 0.1, 0.2);
  bodyMat.freeze();
  body.material = bodyMat;

  // Head sphere (for AR camera attachment point)
  const head = MeshBuilder.CreateSphere('engineer_head', { diameter: 0.3 }, scene);
  head.parent = body;
  head.position = new Vector3(0, 0.85, 0); // top of capsule

  const headMat = new StandardMaterial('headMat', scene);
  headMat.diffuseColor = new Color3(0.9, 0.75, 0.6);
  headMat.freeze();
  head.material = headMat;

  // State
  let currentIndex = 0;
  let nextIndex = 1;
  let progress = 0; // 0..1 between waypoints
  let pauseTimer = patrolPath[0].pauseDuration;
  let state: AgentState = 'idle';
  let arCamera: FreeCamera | null = null;

  function getSegmentLength(): number {
    const from = patrolPath[currentIndex].position;
    const to = patrolPath[nextIndex].position;
    return Vector3.Distance(from, to);
  }

  function update(dt: number): void {
    if (state === 'idle') {
      pauseTimer -= dt;
      if (pauseTimer <= 0) {
        state = 'walking';
        nextIndex = (currentIndex + 1) % patrolPath.length;
        progress = 0;
      }
    } else {
      // Walking
      const segLen = getSegmentLength();
      if (segLen < 0.01) {
        // Skip zero-length segments
        arriveAtWaypoint();
        return;
      }

      const step = (WALK_SPEED * dt) / segLen;
      progress += step;

      if (progress >= 1) {
        arriveAtWaypoint();
      } else {
        // Interpolate position
        const from = patrolPath[currentIndex].position;
        const to = patrolPath[nextIndex].position;
        const pos = Vector3.Lerp(from, to, progress);
        body.position.x = pos.x;
        body.position.z = pos.z;
        body.position.y = 0.85;

        // Face direction
        const dir = to.subtract(from);
        if (dir.length() > 0.01) {
          body.rotation.y = Math.atan2(dir.x, dir.z);
        }
      }
    }

    // Sync AR camera to head world position
    if (arCamera) {
      const headWorld = head.getAbsolutePosition();
      arCamera.position.copyFrom(headWorld);
      arCamera.rotation.y = body.rotation.y;
    }
  }

  function arriveAtWaypoint(): void {
    currentIndex = nextIndex;
    nextIndex = (currentIndex + 1) % patrolPath.length;
    progress = 0;
    state = 'idle';
    pauseTimer = patrolPath[currentIndex].pauseDuration;

    // Snap position
    body.position.x = patrolPath[currentIndex].position.x;
    body.position.z = patrolPath[currentIndex].position.z;
    body.position.y = 0.85;
  }

  function attachARCamera(camera: FreeCamera): void {
    arCamera = camera;
  }

  return {
    mesh: body,
    get position() { return new Vector3(body.position.x, 0, body.position.z); },
    get state() { return state; },
    get currentWaypointIndex() { return currentIndex; },
    update,
    attachARCamera,
  };
}
