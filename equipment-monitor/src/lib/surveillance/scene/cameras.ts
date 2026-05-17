/**
 * 9 camera definitions for the surveillance grid — rearranged for drama.
 * Uses engine.registerView() to render same scene through multiple cameras.
 *
 * Layout:
 *   [0] 西側走廊     [1] 俯視全景     [2] NE 走廊
 *   [3] 微影區遠景   [4] AR 主視角    [5] 化學品特寫
 *   [6] 設備區       [7] 中央設備近景  [8] 出入口
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
  arDefaultCamera: FreeCamera;
  centralBayCamera: FreeCamera;
  birdEyeCamera: FreeCamera;
  views: ReturnType<Engine['registerView']>[];
  setDefaultAR(agent: EngineerAgent): void;
  swapToAR(agent: EngineerAgent): void;
  revertToDefaultAR(): void;
  isARSwapped: boolean;
  currentARAgent: EngineerAgent | null;
  defaultARAgent: EngineerAgent | null;
}

export function setupCameras(scene: Scene, engine: Engine, canvases: HTMLCanvasElement[]): CameraGrid {
  const cameras: Camera[] = [];

  // [0] 西側走廊 — high oblique along west wall, distinct from the south entrance view
  const camWest = new FreeCamera('cam-west-corridor', new Vector3(-14, 2.4, 7), scene);
  camWest.setTarget(new Vector3(-13, 1.2, -4));
  camWest.fov = 0.95;
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

  // Register views — each canvas gets its own camera
  const views = canvases.map((canvas, i) => {
    return engine.registerView(canvas, cameras[i]);
  });

  // AR swap state
  let defaultARAgent: EngineerAgent | null = null;
  let isARSwapped = false;
  let currentARAgent: EngineerAgent | null = null;
  let revertTimer: ReturnType<typeof setTimeout> | null = null;

  function setDefaultAR(agent: EngineerAgent): void {
    defaultARAgent = agent;
    if (!isARSwapped) {
      views[4].camera = agent.arCamera;
      currentARAgent = agent;
    }
  }

  function swapToAR(agent: EngineerAgent): void {
    if (revertTimer) clearTimeout(revertTimer);
    views[4].camera = agent.arCamera;
    isARSwapped = true;
    currentARAgent = agent;
    revertTimer = setTimeout(() => revertToDefaultAR(), 10000);
  }

  function revertToDefaultAR(): void {
    if (revertTimer) { clearTimeout(revertTimer); revertTimer = null; }
    isARSwapped = false;
    if (defaultARAgent) {
      views[4].camera = defaultARAgent.arCamera;
      currentARAgent = defaultARAgent;
    } else {
      views[4].camera = camARDefault;
      currentARAgent = null;
    }
  }

  return {
    cameras,
    arDefaultCamera: camARDefault,
    centralBayCamera: camCentralBay,
    birdEyeCamera: camBirdEye,
    views,
    setDefaultAR,
    swapToAR,
    revertToDefaultAR,
    get isARSwapped() { return isARSwapped; },
    get currentARAgent() { return currentARAgent; },
    get defaultARAgent() { return defaultARAgent; },
  };
}
