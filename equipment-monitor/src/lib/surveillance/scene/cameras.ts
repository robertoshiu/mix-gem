/**
 * 9 camera definitions for the surveillance grid — rearranged for drama.
 * Uses engine.registerView() to render same scene through multiple cameras.
 *
 * Layout:
 *   [0] NW 走廊      [1] 俯視全景     [2] NE 走廊
 *   [3] 微影區特寫   [4] 中控追蹤     [5] 化學品特寫
 *   [6] 設備區       [7] AR 視角      [8] 出入口
 */
import { Scene } from '@babylonjs/core/scene';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Camera } from '@babylonjs/core/Cameras/camera';
import '@babylonjs/core/Engines/AbstractEngine/abstractEngine.views';
import type { EngineerAgent } from './engineerAgent';

const FOV_TIGHT = 0.87; // ~50 degrees — fills frame with characters
const FOV_WIDE = 1.2;   // ~69 degrees — corridor overview

export interface CameraGrid {
  cameras: Camera[];
  trackingCamera: FreeCamera;    // cell 4: orbit/follow
  arStandbyCamera: FreeCamera;   // cell 7: dormant / AR swap target
  birdEyeCamera: FreeCamera;     // cell 1: top-down
  views: ReturnType<Engine['registerView']>[];
  swapCenterToAR(agent: EngineerAgent): void;
  revertCenter(): void;
  isARSwapped: boolean;
  currentARAgent: EngineerAgent | null;
}

export function setupCameras(scene: Scene, engine: Engine, canvases: HTMLCanvasElement[]): CameraGrid {
  const cameras: Camera[] = [];

  // [0] NW 走廊 — looking down the litho walkway
  const camNW = new FreeCamera('cam-nw-corridor', new Vector3(-14, 5, 7), scene);
  camNW.setTarget(new Vector3(-6, 1, 0));
  camNW.fov = FOV_WIDE;
  cameras.push(camNW);

  // [1] 俯視全景 — full fab bird's-eye (orthographic)
  const camBirdEye = new FreeCamera('cam-birdeye', new Vector3(0, 22, 0), scene);
  camBirdEye.setTarget(new Vector3(0, 0, 0));
  camBirdEye.mode = Camera.ORTHOGRAPHIC_CAMERA;
  camBirdEye.orthoLeft = -16;
  camBirdEye.orthoRight = 16;
  camBirdEye.orthoTop = 11;
  camBirdEye.orthoBottom = -11;
  cameras.push(camBirdEye);

  // [2] NE 走廊 — northeast corridor near metrology bay
  const camNE = new FreeCamera('cam-ne-corridor', new Vector3(13, 5, 7), scene);
  camNE.setTarget(new Vector3(5, 1, 0));
  camNE.fov = FOV_WIDE;
  cameras.push(camNE);

  // [3] 微影區特寫 — litho bay close-up (restricted zone glow visible)
  const camLitho = new FreeCamera('cam-litho-closeup', new Vector3(-13, 3.5, -4), scene);
  camLitho.setTarget(new Vector3(-9, 1.2, 1));
  camLitho.fov = FOV_TIGHT;
  cameras.push(camLitho);

  // [4] 中控追蹤 — default: slow orbit around fab center (tracking camera)
  const camTracking = new FreeCamera('cam-tracking', new Vector3(0, 8, -10), scene);
  camTracking.setTarget(new Vector3(0, 1, 0));
  camTracking.fov = FOV_TIGHT;
  cameras.push(camTracking);

  // [5] 化學品特寫 — chemical storage close-up (restricted zone glow visible)
  const camChem = new FreeCamera('cam-chem-closeup', new Vector3(14, 3.5, -3), scene);
  camChem.setTarget(new Vector3(11, 1.2, -7));
  camChem.fov = FOV_TIGHT;
  cameras.push(camChem);

  // [6] 設備區 — south equipment row overview
  const camEquip = new FreeCamera('cam-equipment', new Vector3(-2, 4, -10), scene);
  camEquip.setTarget(new Vector3(2, 1, -5));
  camEquip.fov = FOV_TIGHT;
  cameras.push(camEquip);

  // [7] AR 視角 — dormant (black screen). Swap target for alert AR POV.
  const camARStandby = new FreeCamera('cam-ar-standby', new Vector3(0, 1.7, 0), scene);
  camARStandby.fov = 1.22; // ~70 degrees (natural human FOV)
  camARStandby.minZ = 0.1;
  camARStandby.maxZ = 50;
  cameras.push(camARStandby);

  // [8] 出入口 — entrance/exit at south side
  const camEntrance = new FreeCamera('cam-entrance', new Vector3(0, 4, -12), scene);
  camEntrance.setTarget(new Vector3(0, 1, -8));
  camEntrance.fov = FOV_TIGHT;
  cameras.push(camEntrance);

  // Register views — each canvas gets its own camera
  const views = canvases.map((canvas, i) => {
    return engine.registerView(canvas, cameras[i]);
  });

  // Tracking camera slow orbit state
  let orbitAngle = 0;
  const ORBIT_RADIUS = 12;
  const ORBIT_SPEED = 0.15; // radians per second
  const ORBIT_HEIGHT = 8;

  // AR swap state
  let isARSwapped = false;
  let currentARAgent: EngineerAgent | null = null;
  let revertTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Swap center cell (#4) to show the given agent's AR glasses POV.
   * Auto-reverts after 10 seconds.
   */
  function swapCenterToAR(agent: EngineerAgent): void {
    if (revertTimer) clearTimeout(revertTimer);

    // Swap cell #4 to the agent's AR camera
    views[4].camera = agent.arCamera;
    isARSwapped = true;
    currentARAgent = agent;

    // Auto-revert after 10s
    revertTimer = setTimeout(() => {
      revertCenter();
    }, 10000);
  }

  /**
   * Revert center cell back to tracking camera.
   */
  function revertCenter(): void {
    if (revertTimer) {
      clearTimeout(revertTimer);
      revertTimer = null;
    }
    views[4].camera = camTracking;
    isARSwapped = false;
    currentARAgent = null;
  }

  /**
   * Update tracking camera orbit each frame.
   */
  function updateTrackingOrbit(dt: number): void {
    if (isARSwapped) return; // Don't orbit while showing AR view
    orbitAngle += ORBIT_SPEED * dt;
    camTracking.position.x = Math.sin(orbitAngle) * ORBIT_RADIUS;
    camTracking.position.z = Math.cos(orbitAngle) * ORBIT_RADIUS;
    camTracking.position.y = ORBIT_HEIGHT;
    camTracking.setTarget(new Vector3(0, 1, 0));
  }

  // Attach orbit update to scene's before-render
  scene.onBeforeRenderObservable.add(() => {
    const dt = scene.getEngine().getDeltaTime() / 1000;
    updateTrackingOrbit(dt);
  });

  return {
    cameras,
    trackingCamera: camTracking,
    arStandbyCamera: camARStandby,
    birdEyeCamera: camBirdEye,
    views,
    swapCenterToAR,
    revertCenter,
    get isARSwapped() { return isARSwapped; },
    get currentARAgent() { return currentARAgent; },
  };
}
