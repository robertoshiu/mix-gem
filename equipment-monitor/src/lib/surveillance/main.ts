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
import { createEngineerLabels } from './systems/engineerLabels';
import { loadCharacterGLB, loadAnimatedCharacterGLB } from './config/assets';
import { patrolRoutes } from './config/patrol';

const TARGET_FPS = 30;
const FRAME_TIME = 1000 / TARGET_FPS;

export async function initSurveillanceScene(canvas: HTMLCanvasElement): Promise<() => void> {
  // iOS WKWebView (especially the installed-PWA standalone WebView) enforces a much smaller
  // per-page canvas-memory budget than a Safari tab, so cap render resolution hard on iOS /
  // standalone (and drop MSAA there); use the same light cap as the other scenes elsewhere.
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const standalone =
    (typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches === true) ||
    (typeof navigator !== 'undefined' &&
      (navigator as unknown as { standalone?: boolean }).standalone === true);
  const iOS =
    typeof navigator !== 'undefined' &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent)));
  const memoryConstrained = standalone || iOS;

  // ONE WebGL canvas; the 9 camera feeds are tiled via per-camera viewports
  // (scene.activeCameras). A single canvas/context keeps the page under iOS's per-page
  // canvas-memory ceiling — 9 separate registerView() canvases blew it (OOM crash).
  const engine = new Engine(canvas, !memoryConstrained, {
    preserveDrawingBuffer: false,
    stencil: false,
    antialias: !memoryConstrained,
  });
  engine.setHardwareScalingLevel(memoryConstrained ? Math.max(2, dpr) : dpr > 1 ? 1.2 : 1);

  const scene = new Scene(engine);
  scene.skipPointerMovePicking = true;
  // NOTE: Do NOT use blockMaterialDirtyMechanism with animated materials
  // (zone emissive pulse) — it causes stale renders across multi-view canvases.

  // Build static environment + load equipment GLBs
  const { equipment, shadowGenerator } = await buildCleanroom(scene);

  // 9 cameras tiled via per-camera viewports on the single canvas (scene.activeCameras)
  const cameraGrid = setupCameras(scene);
  scene.activeCamera = cameraGrid.cameras[0];

  // Load characters and create engineer agents
  const engineers: EngineerAgent[] = [];

  // ~16MB animated character GLBs are the single biggest GPU-memory consumer here. iPhone's
  // usable WebGL budget is only ~60-80MB, so 3 of them (~48MB) plus equipment/HDR/shadows
  // overruns it -> WKWebView is killed. On iOS/standalone, load just one engineer and skip
  // their (expensive) shadow casters.
  const routesToLoad = memoryConstrained ? patrolRoutes.slice(0, 1) : patrolRoutes;
  for (const route of routesToLoad) {
    try {
      const character = route.animatedModel
        ? await loadAnimatedCharacterGLB(scene, route.animatedModel)
        : await loadCharacterGLB(scene, route.suitVariant);
      const agent = createEngineerAgent(scene, character, route, equipment.obstacles);

      // Add character meshes as shadow casters (skipped on memory-constrained iOS)
      if (!memoryConstrained) {
        for (const mesh of character.allMeshes) {
          if (mesh.getTotalVertices() > 0) {
            shadowGenerator.addShadowCaster(mesh);
          }
        }
      }

      engineers.push(agent);
    } catch (e) {
      console.warn(`[surveillance] Failed to load engineer ${route.id}:`, (e as Error).message);
    }
  }

  console.log(`[surveillance] ${engineers.length} engineers loaded`);

  // Engineer name labels (floating above each character)
  const suitVariants = new Map(patrolRoutes.map(r => [r.id, r.suitVariant]));
  const engineerLabels = createEngineerLabels(scene, engineers, suitVariants);

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

      // Update engineers (pass neighbors for collision avoidance)
      for (const engineer of engineers) {
        engineer.update(dt, engineers);
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
    engineerLabels.dispose();
    arHud.dispose();
    alertSystem.dispose();
    for (const engineer of engineers) {
      engineer.dispose();
    }
    scene.dispose();
    engine.dispose();
  };
}
