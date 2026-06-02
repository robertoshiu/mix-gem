/**
 * 9 camera definitions for the surveillance grid — rearranged for drama.
 *
 * Rendering model: ONE WebGL canvas. Each camera gets a viewport rectangle (one grid
 * cell) and all 9 are pushed to scene.activeCameras, so Babylon tiles all 9 feeds onto
 * a single canvas/context. (Previously this used engine.registerView() = 9 separate
 * canvases, which blew iOS WKWebView's per-page canvas-memory budget -> OOM crash.)
 *
 * Layout:
 *   [0] 機械手臂特寫 [1] 俯視全景     [2] NE 走廊
 *   [3] 微影區遠景   [4] AR 主視角    [5] 化學品特寫
 *   [6] 設備區       [7] 中央設備近景  [8] 出入口
 */
import { Scene } from '@babylonjs/core/scene';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Viewport } from '@babylonjs/core/Maths/math.viewport';
import { Camera } from '@babylonjs/core/Cameras/camera';
import type { EngineerAgent } from './engineerAgent';

const FOV_TIGHT = 0.87; // ~50 degrees — fills frame with characters
const FOV_WIDE = 1.2;   // ~69 degrees — corridor overview

// Cell index -> normalized viewport on a single canvas. 3x3 grid, row 0 = top.
// Babylon viewports use a bottom-left origin, so y is flipped.
function cellViewport(i: number): Viewport {
  const col = i % 3;
  const row = Math.floor(i / 3);
  return new Viewport(col / 3, (2 - row) / 3, 1 / 3, 1 / 3);
}

export interface CameraGrid {
  cameras: Camera[];
  arDefaultCamera: FreeCamera;
  centralBayCamera: FreeCamera;
  birdEyeCamera: FreeCamera;
  setDefaultAR(agent: EngineerAgent): void;
  swapToAR(agent: EngineerAgent): void;
  revertToDefaultAR(): void;
  isARSwapped: boolean;
  currentARAgent: EngineerAgent | null;
  defaultARAgent: EngineerAgent | null;
}

export function setupCameras(scene: Scene): CameraGrid {
  const cameras: Camera[] = [];

  // [0] 機械手臂特寫 — elevated north-west view of ROBOT-01 and central bay
  const camWest = new FreeCamera('cam-robot-closeup', new Vector3(-12, 5, 8), scene);
  camWest.setTarget(new Vector3(2, 1.0, 2));
  camWest.fov = 1.05;
  camWest.minZ = 0.1;
  camWest.maxZ = 50;
  cameras.push(camWest);

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

  // [3] 微影區遠景 — litho bay wide shot (pulled back from restricted zone)
  const camLitho = new FreeCamera('cam-litho-wide', new Vector3(-16, 5, -6), scene);
  camLitho.setTarget(new Vector3(-9, 1.5, 0));
  camLitho.fov = 1.0;
  cameras.push(camLitho);

  // [4] AR 主視角 — default: first engineer's AR POV (swapped in main.ts after load)
  const camARDefault = new FreeCamera('cam-ar-default', new Vector3(0, 1.55, 0), scene);
  camARDefault.fov = 1.22;
  camARDefault.minZ = 0.1;
  camARDefault.maxZ = 50;
  cameras.push(camARDefault);

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

  // [7] 中央設備近景 — eye-level view of central process bay (CVD/ETCH/ROBOT)
  const camCentralBay = new FreeCamera('cam-central-bay', new Vector3(-1, 1.6, 1), scene);
  camCentralBay.setTarget(new Vector3(3, 1.2, 3));
  camCentralBay.fov = FOV_TIGHT;
  cameras.push(camCentralBay);

  // [8] 出入口 — south-east entrance checkpoint, opposite corner from cell 0
  const camEntrance = new FreeCamera('cam-south-entrance', new Vector3(13, 2.0, -10), scene);
  camEntrance.setTarget(new Vector3(7, 1.1, -8));
  camEntrance.fov = FOV_TIGHT;
  cameras.push(camEntrance);

  // Assign each camera its grid-cell viewport and render all 9 on the one canvas.
  cameras.forEach((cam, i) => {
    cam.viewport = cellViewport(i);
  });
  const AR_CELL = 4;
  scene.activeCameras = [...cameras];

  // The camera occupying the AR cell (index 4). Swapping AR = replace this entry and
  // move cell 4's viewport onto the new camera.
  function setCell4Camera(cam: Camera): void {
    cam.viewport = cellViewport(AR_CELL);
    if (scene.activeCameras) scene.activeCameras[AR_CELL] = cam;
  }

  // AR swap state
  let defaultARAgent: EngineerAgent | null = null;
  let isARSwapped = false;
  let currentARAgent: EngineerAgent | null = null;
  let revertTimer: ReturnType<typeof setTimeout> | null = null;

  function setDefaultAR(agent: EngineerAgent): void {
    defaultARAgent = agent;
    if (!isARSwapped) {
      setCell4Camera(agent.arCamera);
      currentARAgent = agent;
    }
  }

  function swapToAR(agent: EngineerAgent): void {
    if (revertTimer) clearTimeout(revertTimer);
    setCell4Camera(agent.arCamera);
    isARSwapped = true;
    currentARAgent = agent;
    revertTimer = setTimeout(() => revertToDefaultAR(), 10000);
  }

  function revertToDefaultAR(): void {
    if (revertTimer) { clearTimeout(revertTimer); revertTimer = null; }
    isARSwapped = false;
    if (defaultARAgent) {
      setCell4Camera(defaultARAgent.arCamera);
      currentARAgent = defaultARAgent;
    } else {
      setCell4Camera(camARDefault);
      currentARAgent = null;
    }
  }

  return {
    cameras,
    arDefaultCamera: camARDefault,
    centralBayCamera: camCentralBay,
    birdEyeCamera: camBirdEye,
    setDefaultAR,
    swapToAR,
    revertToDefaultAR,
    get isARSwapped() { return isARSwapped; },
    get currentARAgent() { return currentARAgent; },
    get defaultARAgent() { return defaultARAgent; },
  };
}
