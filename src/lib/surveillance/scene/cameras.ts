/**
 * 9 camera definitions for the surveillance grid — rearranged for drama.
 * Uses engine.registerView() to render same scene through multiple cameras.
 *
 * Layout:
 *   [0] NW 走廊      [1] 俯視全景     [2] NE 走廊
 *   [3] 微影區遠景   [4] AR 主視角    [5] 化學品特寫
 *   [6] 設備區       [7] 中控平移     [8] 出入口
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
  controlPanCamera: FreeCamera;
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

  // [7] 中控平移 — slow horizontal pan, security-camera style
  const camControlPan = new FreeCamera('cam-control-pan', new Vector3(0, 8, 0), scene);
  camControlPan.setTarget(new Vector3(0, 0, 0));
  camControlPan.fov = FOV_WIDE;
  cameras.push(camControlPan);

  // [8] 出入口 — entrance/exit at south side
  const camEntrance = new FreeCamera('cam-entrance', new Vector3(0, 4, -12), scene);
  camEntrance.setTarget(new Vector3(0, 1, -8));
  camEntrance.fov = FOV_TIGHT;
  cameras.push(camEntrance);

  // Register views — each canvas gets its own camera
  const views = canvases.map((canvas, i) => {
    return engine.registerView(canvas, cameras[i]);
  });

  // Control pan state (cell 7)
  let panX = 0;
  let panDir = 1;
  const PAN_SPEED = 0.3;
  const PAN_RANGE = 10;
  const PAN_HEIGHT = 8;

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

  // Horizontal pan animation for cell 7
  scene.onBeforeRenderObservable.add(() => {
    const dt = scene.getEngine().getDeltaTime() / 1000;
    panX += PAN_SPEED * panDir * dt;
    if (panX > PAN_RANGE) { panX = PAN_RANGE; panDir = -1; }
    if (panX < -PAN_RANGE) { panX = -PAN_RANGE; panDir = 1; }
    camControlPan.position.x = panX;
    camControlPan.position.y = PAN_HEIGHT;
    camControlPan.position.z = 0;
    camControlPan.setTarget(new Vector3(panX, 0, 0));
  });

  return {
    cameras,
    arDefaultCamera: camARDefault,
    controlPanCamera: camControlPan,
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
