/**
 * 9 camera definitions for the surveillance grid.
 * Uses engine.registerView() to render same scene through multiple cameras.
 */
import { Scene } from '@babylonjs/core/scene';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Camera } from '@babylonjs/core/Cameras/camera';

export interface CameraGrid {
  cameras: Camera[];
  mainCamera: FreeCamera;      // cam-5: third-person follow
  arCamera: FreeCamera;        // attached to engineer head
  minimapCamera: FreeCamera;   // cam-2: top-down
  views: ReturnType<Engine['registerView']>[];
  switchMainToAR(): void;
  switchMainToTracking(): void;
}

export function setupCameras(scene: Scene, engine: Engine, canvases: HTMLCanvasElement[]): CameraGrid {
  const cameras: Camera[] = [];

  // cam-1: CCTV NW
  const cam1 = new FreeCamera('cctv-nw', new Vector3(-12, 6, 8), scene);
  cam1.setTarget(new Vector3(-5, 0, 0));
  cam1.fov = 1.2;
  cameras.push(cam1);

  // cam-2: Top-down minimap
  const cam2 = new FreeCamera('minimap', new Vector3(0, 25, 0), scene);
  cam2.setTarget(new Vector3(0, 0, 0));
  cam2.fov = 1.4;
  cam2.mode = Camera.ORTHOGRAPHIC_CAMERA;
  cam2.orthoLeft = -18;
  cam2.orthoRight = 18;
  cam2.orthoTop = 12;
  cam2.orthoBottom = -12;
  cameras.push(cam2);

  // cam-3: CCTV NE
  const cam3 = new FreeCamera('cctv-ne', new Vector3(12, 6, 8), scene);
  cam3.setTarget(new Vector3(5, 0, 0));
  cam3.fov = 1.2;
  cameras.push(cam3);

  // cam-4: Lithography bay close-up
  const cam4 = new FreeCamera('litho-closeup', new Vector3(-12, 4, -6), scene);
  cam4.setTarget(new Vector3(-9, 1, 0));
  cam4.fov = 0.9;
  cameras.push(cam4);

  // cam-5: Main view — third-person follow (default)
  const cam5 = new FreeCamera('main-follow', new Vector3(0, 5, -12), scene);
  cam5.setTarget(new Vector3(0, 1, 0));
  cam5.fov = 0.8;
  cameras.push(cam5);

  // cam-6: Chemical storage close-up
  const cam6 = new FreeCamera('chem-closeup', new Vector3(14, 4, -4), scene);
  cam6.setTarget(new Vector3(11, 1, -7));
  cam6.fov = 0.9;
  cameras.push(cam6);

  // cam-7: CCTV SW
  const cam7 = new FreeCamera('cctv-sw', new Vector3(-12, 6, -8), scene);
  cam7.setTarget(new Vector3(-5, 0, 0));
  cam7.fov = 1.2;
  cameras.push(cam7);

  // cam-8: AR POV (permanent small view — will be attached to engineer head)
  const cam8 = new FreeCamera('ar-pov', new Vector3(0, 1.7, 0), scene);
  cam8.fov = 75 * (Math.PI / 180); // 75 degrees
  cam8.minZ = 0.1;
  cameras.push(cam8);

  // cam-9: CCTV SE
  const cam9 = new FreeCamera('cctv-se', new Vector3(12, 6, -8), scene);
  cam9.setTarget(new Vector3(5, 0, 0));
  cam9.fov = 1.2;
  cameras.push(cam9);

  // Register views — each canvas gets its own camera
  const views = canvases.map((canvas, i) => {
    return engine.registerView(canvas, cameras[i]);
  });

  // Main view switch functions
  let isARMode = false;

  function switchMainToAR() {
    if (isARMode) return;
    views[4].camera = cam8;
    isARMode = true;
  }

  function switchMainToTracking() {
    if (!isARMode) return;
    views[4].camera = cam5;
    isARMode = false;
  }

  return {
    cameras,
    mainCamera: cam5,
    arCamera: cam8,
    minimapCamera: cam2,
    views,
    switchMainToAR,
    switchMainToTracking,
  };
}
