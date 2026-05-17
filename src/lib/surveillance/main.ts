/**
 * Surveillance scene entry point.
 * Async init: loads GLBs → creates 3 engineers → wires alerts + AR HUD.
 * Returns a cleanup function for React useEffect.
 */
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { buildCleanroom } from './scene/buildCleanroom';
import { setupCameras } from './scene/cameras';
import { createEngineerAgent, type EngineerAgent } from './scene/engineerAgent';
import { createAlertSystem } from './systems/alertSystem';
import { createArHud } from './systems/arHud';
import { loadCharacterGLB } from './config/assets';
import { patrolRoutes } from './config/patrol';

const TARGET_FPS = 30;
const FRAME_TIME = 1000 / TARGET_FPS;

export async function initSurveillanceScene(canvases: HTMLCanvasElement[]): Promise<() => void> {
  if (canvases.length !== 9) {
    throw new Error('Surveillance grid requires exactly 9 canvases');
  }

  // Create engine on first canvas
  const engine = new Engine(canvases[0], true, {
    preserveDrawingBuffer: false,
    stencil: false,
    antialias: true,
  });

  const scene = new Scene(engine);
  scene.skipPointerMovePicking = true;
  // NOTE: Do NOT use blockMaterialDirtyMechanism with animated materials
  // (zone emissive pulse) — it causes stale renders across multi-view canvases.

  // Build static environment + load equipment GLBs
  const { equipment, shadowGenerator } = await buildCleanroom(scene);

  // Setup 9 cameras + multi-view
  const cameraGrid = setupCameras(scene, engine, canvases);
  scene.activeCamera = cameraGrid.cameras[0];

  // Load characters and create engineer agents
  const engineers: EngineerAgent[] = [];

  for (const route of patrolRoutes) {
    try {
      const character = await loadCharacterGLB(scene, route.suitVariant);
      const agent = createEngineerAgent(scene, character, route);

      // Add character meshes as shadow casters
      for (const mesh of character.allMeshes) {
        if (mesh.getTotalVertices() > 0) {
          shadowGenerator.addShadowCaster(mesh);
        }
      }

      engineers.push(agent);
    } catch (e) {
      console.warn(`[surveillance] Failed to load engineer ${route.id}:`, (e as Error).message);
    }
  }

  console.log(`[surveillance] ${engineers.length} engineers loaded`);

  // Set first engineer as default AR view for cell 4
  if (engineers.length > 0) {
    cameraGrid.setDefaultAR(engineers[0]);
    // Hide STANDBY overlay since we have an AR view
    const standby = document.getElementById('standby-overlay');
    if (standby) standby.style.display = 'none';
  }

  // Alert system
  const alertSystem = createAlertSystem();

  // Wire "查看 AR" button → camera swap
  alertSystem.onViewAR = (engineerId: string) => {
    const agent = engineers.find(e => e.id === engineerId);
    if (agent) {
      cameraGrid.swapToAR(agent);
      arHud.setActiveEngineer(agent.id, agent.name);

      // Update cell #4 label in DOM
      const cell4Label = document.querySelector('[data-cam-index="4"] .cam-label');
      if (cell4Label) {
        cell4Label.textContent = `AR: ${agent.name}`;
        cell4Label.classList.add('ar-active');
      }

      // Set cell #4 border to red glow
      const cell4 = document.querySelector('[data-cam-index="4"]');
      if (cell4) {
        cell4.setAttribute('data-ar-swap', 'true');
      }
    }
  };

  // AR HUD (renders on AR camera's GUI layer)
  const arHud = createArHud(scene, equipment);

  // Listen for center cell revert
  const cell4 = document.querySelector('[data-cam-index="4"]');
  if (cell4) {
    cell4.addEventListener('click', () => {
      if (cameraGrid.isARSwapped) {
        cameraGrid.revertToDefaultAR();
        if (cameraGrid.defaultARAgent) {
          arHud.setActiveEngineer(cameraGrid.defaultARAgent.id, cameraGrid.defaultARAgent.name);
        } else {
          arHud.clearActiveEngineer();
        }
        const cell4Label = document.querySelector('[data-cam-index="4"] .cam-label');
        if (cell4Label) {
          cell4Label.textContent = 'AR 主視角';
          cell4Label.classList.remove('ar-active');
        }
        cell4.removeAttribute('data-ar-swap');
      }
    });
  }

  // Sync HUD when cameras.ts auto-reverts after timeout
  const patchedRevertCheck = () => {
    if (!cameraGrid.isARSwapped) {
      if (cameraGrid.defaultARAgent) {
        arHud.setActiveEngineer(cameraGrid.defaultARAgent.id, cameraGrid.defaultARAgent.name);
      } else {
        arHud.clearActiveEngineer();
      }
      const label = document.querySelector('[data-cam-index="4"] .cam-label');
      if (label && label.classList.contains('ar-active')) {
        label.textContent = 'AR 主視角';
        label.classList.remove('ar-active');
      }
      const cell = document.querySelector('[data-cam-index="4"]');
      if (cell) cell.removeAttribute('data-ar-swap');
    }
  };

  // Render loop — simulation capped at 30fps, rendering at full rAF rate
  // IMPORTANT: scene.render() must run every frame for multi-view canvases.
  // Skipping it causes blank frames (preserveDrawingBuffer=false + 9 canvases).
  let lastSim = 0;
  let wasARSwapped = false;

  engine.runRenderLoop(() => {
    const now = performance.now();

    // Simulation updates at 30fps
    if (now - lastSim >= FRAME_TIME) {
      lastSim = now;
      const dt = scene.getEngine().getDeltaTime() / 1000;

      // Update engineers
      for (const engineer of engineers) {
        engineer.update(dt);
      }

      // Alert system checks all engineers
      alertSystem.update(engineers);

      // AR HUD update (always active when cell 4 shows any AR view)
      if (cameraGrid.currentARAgent) {
        arHud.update();
        wasARSwapped = cameraGrid.isARSwapped;
      } else if (wasARSwapped) {
        patchedRevertCheck();
        wasARSwapped = false;
      }
    }

    // Render all viewports every frame (required for multi-view stability)
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
    for (const engineer of engineers) {
      engineer.dispose();
    }
    scene.dispose();
    engine.dispose();
  };
}
