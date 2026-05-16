/**
 * Surveillance scene entry point.
 * Wires together: engine → scene → cameras → engineer → alerts → AR HUD.
 * Returns a cleanup function for React useEffect.
 */
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { buildCleanroom } from './scene/buildCleanroom';
import { setupCameras } from './scene/cameras';
import { createEngineerAgent } from './scene/engineerAgent';
import { createAlertSystem } from './systems/alertSystem';
import { createArHud } from './systems/arHud';

export function initSurveillanceScene(canvases: HTMLCanvasElement[]): () => void {
  if (canvases.length !== 9) {
    throw new Error('Surveillance grid requires exactly 9 canvases');
  }

  // Use the first canvas as the primary engine canvas
  const engine = new Engine(canvases[0], true, {
    preserveDrawingBuffer: false,
    stencil: false,
    antialias: true,
  });

  const scene = new Scene(engine);
  scene.skipPointerMovePicking = true;
  scene.blockMaterialDirtyMechanism = true;

  // Build static environment
  const { equipmentMeshes, shadowGenerator } = buildCleanroom(scene);

  // Setup 9 cameras + multi-view
  const cameraGrid = setupCameras(scene, engine, canvases);

  // Create patrol engineer
  const engineer = createEngineerAgent(scene);
  engineer.attachARCamera(cameraGrid.arCamera);
  shadowGenerator.addShadowCaster(engineer.mesh);

  // Alert system
  const alertSystem = createAlertSystem();

  // AR HUD (renders on the AR camera's GUI layer)
  const arHud = createArHud(scene, cameraGrid.arCamera, equipmentMeshes);

  // Click to switch main view to AR POV
  const mainCell = document.querySelector('[data-cam-index="4"]');
  if (mainCell) {
    mainCell.addEventListener('dblclick', () => {
      cameraGrid.switchMainToAR();
      // Double-click again to switch back
      setTimeout(() => {
        const handler = () => {
          cameraGrid.switchMainToTracking();
          mainCell.removeEventListener('dblclick', handler);
        };
        mainCell.addEventListener('dblclick', handler, { once: true });
      }, 100);
    });
  }

  // Render loop
  let lastTime = performance.now();

  engine.runRenderLoop(() => {
    const now = performance.now();
    const dt = (now - lastTime) / 1000; // seconds
    lastTime = now;

    // Update systems
    engineer.update(dt);
    alertSystem.update(engineer.position);
    arHud.update();

    // Render scene (multi-view handles all 9 cameras)
    scene.render();
  });

  // Handle resize
  const onResize = () => engine.resize();
  window.addEventListener('resize', onResize);

  // Cleanup function
  return () => {
    window.removeEventListener('resize', onResize);
    engine.stopRenderLoop();
    arHud.dispose();
    alertSystem.dispose();
    scene.dispose();
    engine.dispose();
  };
}
