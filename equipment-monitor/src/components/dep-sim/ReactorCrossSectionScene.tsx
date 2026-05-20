'use client';

import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import { useWebGLSupport } from '@/hooks/use-webgl-support';
import { WebGLFallback } from '@/components/three/WebGLFallback';
import type { CycleState, SimulationParams } from '@/lib/dep-sim';

interface ReactorCrossSectionSceneProps {
  cycle: CycleState | null;
  params: SimulationParams;
}

/** Interpolate pedestal temp (100-300+) to color: blue -> amber -> red */
function pedestalColor(temp: number): BABYLON.Color3 {
  const t = Math.min(Math.max((temp - 100) / 200, 0), 1);
  if (t < 0.5) {
    const s = t / 0.5;
    return BABYLON.Color3.Lerp(
      BABYLON.Color3.FromHexString('#3b82f6'),
      BABYLON.Color3.FromHexString('#f59e0b'),
      s,
    );
  }
  const s = (t - 0.5) / 0.5;
  return BABYLON.Color3.Lerp(
    BABYLON.Color3.FromHexString('#f59e0b'),
    BABYLON.Color3.FromHexString('#ef4444'),
    s,
  );
}

const PHASE_COLORS: Record<string, { hex: string; label: string }> = {
  'bdeas-pulse': { hex: '#3b82f6', label: 'BDEAS Pulse' },
  'purge-a':     { hex: '#6b7280', label: 'Purge' },
  'o3-pulse':    { hex: '#f97316', label: 'O\u2083 Pulse' },
  'purge-b':     { hex: '#6b7280', label: 'Purge' },
};

const PARTICLE_COUNT = 60;
const GRID_SIZE = 10;

function createScene(
  canvas: HTMLCanvasElement,
  propsRef: React.RefObject<ReactorCrossSectionSceneProps>,
) {
  const engine = new BABYLON.Engine(canvas, true, { stencil: true, antialias: true });
  engine.setHardwareScalingLevel(window.devicePixelRatio > 1 ? 1.2 : 1);
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.02, 0.03, 0.08, 1);

  // Camera: side view of reactor
  const camera = new BABYLON.ArcRotateCamera(
    'DEP-CAM', -Math.PI / 2, 1.2, 12,
    new BABYLON.Vector3(0, 2, 0), scene,
  );
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 6;
  camera.upperRadiusLimit = 20;
  camera.wheelPrecision = 40;

  // Lighting
  const hemi = new BABYLON.HemisphericLight('DEP-AMBIENT', new BABYLON.Vector3(0, 1, 0), scene);
  hemi.intensity = 0.5;
  hemi.diffuse = BABYLON.Color3.FromHexString('#1e293b');
  const rim = new BABYLON.PointLight('DEP-RIM', new BABYLON.Vector3(5, 6, -3), scene);
  rim.diffuse = BABYLON.Color3.FromHexString('#22d3ee');
  rim.intensity = 0.6;
  rim.range = 30;

  // ---- Chamber geometry ----
  const chamberH = 5;
  const chamberW = 5;
  const wallThick = 0.15;
  const chamberBaseY = 0;

  // Left wall
  const wallL = BABYLON.MeshBuilder.CreateBox('DEP-WALL-L', {
    width: wallThick, height: chamberH, depth: 3,
  }, scene);
  wallL.position.set(-chamberW / 2, chamberBaseY + chamberH / 2, 0);

  // Right wall
  const wallR = BABYLON.MeshBuilder.CreateBox('DEP-WALL-R', {
    width: wallThick, height: chamberH, depth: 3,
  }, scene);
  wallR.position.set(chamberW / 2, chamberBaseY + chamberH / 2, 0);

  // Top lid
  const lid = BABYLON.MeshBuilder.CreateBox('DEP-LID', {
    width: chamberW + wallThick, height: wallThick, depth: 3,
  }, scene);
  lid.position.set(0, chamberBaseY + chamberH, 0);

  // Chamber wall material
  const chamberMat = new BABYLON.PBRMaterial('DEP-CHAMBER-mat', scene);
  chamberMat.albedoColor = BABYLON.Color3.FromHexString('#334155');
  chamberMat.roughness = 0.7;
  chamberMat.metallic = 0.8;
  wallL.material = chamberMat;
  wallR.material = chamberMat;
  lid.material = chamberMat;

  // Exhaust port (on right wall, lower section)
  const exhaust = BABYLON.MeshBuilder.CreateBox('DEP-EXHAUST', {
    width: 0.5, height: 0.4, depth: 0.6,
  }, scene);
  exhaust.position.set(chamberW / 2 + 0.15, chamberBaseY + 1.2, 0);
  const exhaustMat = new BABYLON.PBRMaterial('DEP-EXHAUST-mat', scene);
  exhaustMat.albedoColor = BABYLON.Color3.FromHexString('#1e293b');
  exhaustMat.roughness = 0.5;
  exhaustMat.metallic = 0.9;
  exhaust.material = exhaustMat;

  // ---- Showerhead ----
  const showerY = chamberBaseY + chamberH - 0.5;
  const showerhead = BABYLON.MeshBuilder.CreateCylinder('DEP-SHOWERHEAD', {
    height: 0.12, diameter: 3.6, tessellation: 36,
  }, scene);
  showerhead.position.set(0, showerY, 0);
  const showerMat = new BABYLON.PBRMaterial('DEP-SHOWERHEAD-mat', scene);
  showerMat.albedoColor = BABYLON.Color3.FromHexString('#475569');
  showerMat.roughness = 0.4;
  showerMat.metallic = 0.7;
  showerMat.emissiveColor = BABYLON.Color3.FromHexString('#475569').scale(0.05);
  showerhead.material = showerMat;

  // ---- Pedestal + Wafer ----
  const pedestalTopY = chamberBaseY + 1.5;
  const pedestal = BABYLON.MeshBuilder.CreateCylinder('DEP-PEDESTAL', {
    height: 1.5, diameter: 1.2, tessellation: 24,
  }, scene);
  pedestal.position.set(0, chamberBaseY + 0.75, 0);
  const pedestalMat = new BABYLON.PBRMaterial('DEP-PEDESTAL-mat', scene);
  pedestalMat.albedoColor = BABYLON.Color3.FromHexString('#64748b');
  pedestalMat.roughness = 0.4;
  pedestalMat.metallic = 0.6;
  pedestal.material = pedestalMat;

  const waferDisc = BABYLON.MeshBuilder.CreateCylinder('DEP-WAFER', {
    height: 0.06, diameter: 3, tessellation: 48,
  }, scene);
  waferDisc.position.set(0, pedestalTopY, 0);
  const waferMat = new BABYLON.PBRMaterial('DEP-WAFER-mat', scene);
  waferMat.albedoColor = BABYLON.Color3.FromHexString('#334155');
  waferMat.roughness = 0.25;
  waferMat.metallic = 0.7;
  waferDisc.material = waferMat;

  // ---- Film growth layer ----
  const film = BABYLON.MeshBuilder.CreateCylinder('DEP-FILM', {
    height: 0.01, diameter: 2.9, tessellation: 48,
  }, scene);
  film.position.set(0, pedestalTopY + 0.035, 0);
  const filmMat = new BABYLON.PBRMaterial('DEP-FILM-mat', scene);
  filmMat.albedoColor = BABYLON.Color3.FromHexString('#bfdbfe');
  filmMat.emissiveColor = BABYLON.Color3.FromHexString('#bfdbfe').scale(0.15);
  filmMat.roughness = 0.1;
  filmMat.metallic = 0.05;
  filmMat.alpha = 0.7;
  film.material = filmMat;

  // ---- Gas particles ----
  const particles: BABYLON.Mesh[] = [];
  const particleMats: BABYLON.StandardMaterial[] = [];
  // Pre-compute a random seed per particle for drift
  const particleSeeds: number[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = BABYLON.MeshBuilder.CreateSphere(`DEP-PARTICLE-${i}`, {
      diameter: 0.07, segments: 6,
    }, scene);
    const m = new BABYLON.StandardMaterial(`DEP-PARTICLE-${i}-mat`, scene);
    m.diffuseColor = BABYLON.Color3.FromHexString('#6b7280');
    m.emissiveColor = BABYLON.Color3.FromHexString('#6b7280').scale(0.4);
    p.material = m;
    p.isPickable = false;
    // Start scattered in the chamber
    p.position.set(
      (Math.random() - 0.5) * 3,
      showerY - Math.random() * (showerY - pedestalTopY),
      (Math.random() - 0.5) * 1.5,
    );
    particles.push(p);
    particleMats.push(m);
    particleSeeds.push(Math.random());
  }

  // ---- GUI overlay ----
  const ui = GUI.AdvancedDynamicTexture.CreateFullscreenUI('DEP-UI', true, scene);

  // Phase banner (top center)
  const phaseBanner = new GUI.TextBlock('DEP-PHASE-BANNER');
  phaseBanner.text = '';
  phaseBanner.color = '#6b7280';
  phaseBanner.fontSize = 16;
  phaseBanner.fontWeight = 'bold';
  phaseBanner.fontFamily = 'monospace';
  phaseBanner.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
  phaseBanner.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
  phaseBanner.top = '12px';
  phaseBanner.heightInPixels = 30;
  ui.addControl(phaseBanner);

  // Surface coverage grid (lower-right)
  const gridContainer = new GUI.Rectangle('DEP-GRID-CONTAINER');
  gridContainer.width = '200px';
  gridContainer.height = '240px';
  gridContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
  gridContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
  gridContainer.left = '-12px';
  gridContainer.top = '-12px';
  gridContainer.background = 'rgba(10,22,40,0.85)';
  gridContainer.color = '#334155';
  gridContainer.thickness = 1;
  gridContainer.cornerRadius = 6;
  ui.addControl(gridContainer);

  const gridTitle = new GUI.TextBlock('DEP-GRID-TITLE');
  gridTitle.text = 'Surface Coverage';
  gridTitle.color = '#94a3b8';
  gridTitle.fontSize = 12;
  gridTitle.fontFamily = 'monospace';
  gridTitle.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
  gridTitle.top = '8px';
  gridTitle.heightInPixels = 20;
  gridContainer.addControl(gridTitle);

  // Grid cells - 10x10
  const cellSize = 16;
  const gridOffsetX = -(GRID_SIZE * cellSize) / 2 + cellSize / 2;
  const gridOffsetY = -20; // center vertically with slight upward shift
  const gridCells: GUI.Rectangle[] = [];
  // Pre-compute fill order: cells nearer to center fill first
  const cellOrder: number[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      cellOrder.push(r * GRID_SIZE + c);
    }
  }
  const centerR = (GRID_SIZE - 1) / 2;
  const centerC = (GRID_SIZE - 1) / 2;
  cellOrder.sort((a, b) => {
    const ar = Math.floor(a / GRID_SIZE), ac = a % GRID_SIZE;
    const br = Math.floor(b / GRID_SIZE), bc = b % GRID_SIZE;
    const da = Math.hypot(ar - centerR, ac - centerC);
    const db = Math.hypot(br - centerR, bc - centerC);
    return da - db;
  });
  // Inverse map: for cell index i, its rank in fill order
  const fillRank: number[] = new Array(GRID_SIZE * GRID_SIZE);
  cellOrder.forEach((cellIdx, rank) => { fillRank[cellIdx] = rank; });

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const cell = new GUI.Rectangle(`DEP-CELL-${r}-${c}`);
      cell.width = `${cellSize}px`;
      cell.height = `${cellSize}px`;
      cell.left = `${gridOffsetX + c * cellSize}px`;
      cell.top = `${gridOffsetY + r * cellSize}px`;
      cell.background = '#1e293b';
      cell.color = '#334155';
      cell.thickness = 0.5;
      gridContainer.addControl(cell);
      gridCells.push(cell);
    }
  }

  const gridInfo = new GUI.TextBlock('DEP-GRID-INFO');
  gridInfo.text = '0\u00c5 / Cycle 0';
  gridInfo.color = '#94a3b8';
  gridInfo.fontSize = 11;
  gridInfo.fontFamily = 'monospace';
  gridInfo.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
  gridInfo.top = '-8px';
  gridInfo.heightInPixels = 18;
  gridContainer.addControl(gridInfo);

  // ---- Per-frame update ----
  scene.onBeforeRenderObservable.add(() => {
    const { cycle, params } = propsRef.current;
    const phase = cycle?.phase ?? 'purge-a';
    const dt = engine.getDeltaTime() / 1000;
    const phaseInfo = PHASE_COLORS[phase] ?? PHASE_COLORS['purge-a'];

    // Phase banner
    phaseBanner.text = phaseInfo.label;
    phaseBanner.color = phaseInfo.hex;

    // Pedestal temperature glow
    const pColor = pedestalColor(params.pedestalTemp);
    pedestalMat.emissiveColor = pColor.scale(0.3);

    // Film thickness visualization
    const thickness = cycle?.cumulativeThickness ?? 0;
    const filmH = Math.max(0.01, (thickness / 120) * 0.15);
    film.scaling.y = filmH / 0.01; // base height is 0.01
    film.position.y = pedestalTopY + 0.03 + filmH / 2;

    // Particle color + motion
    const isPurge = phase === 'purge-a' || phase === 'purge-b';
    const particleColor = BABYLON.Color3.FromHexString(phaseInfo.hex);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];
      const m = particleMats[i];
      m.diffuseColor = particleColor;
      m.emissiveColor = particleColor.scale(0.4);

      if (isPurge) {
        // Flow sideways toward exhaust (right wall)
        p.position.x += (1.5 + particleSeeds[i]) * dt;
        p.position.y += (Math.random() - 0.5) * 0.3 * dt;
        // Recycle from left side when past exhaust
        if (p.position.x > chamberW / 2 + 0.3) {
          p.position.x = -chamberW / 2 + 0.3 + Math.random() * 0.5;
          p.position.y = showerY - Math.random() * (showerY - pedestalTopY);
          p.position.z = (Math.random() - 0.5) * 1.5;
        }
      } else {
        // Flow downward from showerhead toward wafer
        p.position.y -= (0.8 + particleSeeds[i] * 0.5) * dt;
        p.position.x += (Math.random() - 0.5) * 0.15 * dt;
        p.position.z += (Math.random() - 0.5) * 0.15 * dt;
        // Recycle from showerhead when past wafer
        if (p.position.y < pedestalTopY + 0.1) {
          p.position.x = (Math.random() - 0.5) * 3;
          p.position.y = showerY - Math.random() * 0.3;
          p.position.z = (Math.random() - 0.5) * 1.5;
        }
      }
    }

    // Surface coverage grid
    const totalCells = GRID_SIZE * GRID_SIZE;
    const coverageA = cycle?.coverageA ?? 0;
    const coverageB = cycle?.coverageB ?? 0;

    for (let i = 0; i < totalCells; i++) {
      const rank = fillRank[i];
      const normalizedRank = rank / totalCells;

      if (phase === 'bdeas-pulse') {
        gridCells[i].background = normalizedRank < coverageA ? '#22d3ee' : '#1e293b';
      } else if (phase === 'o3-pulse') {
        gridCells[i].background = normalizedRank < coverageB ? '#f97316' : '#1e293b';
      } else {
        // Purge: dim existing colors
        const cov = Math.max(coverageA, coverageB);
        if (normalizedRank < cov) {
          gridCells[i].background = '#374151';
        } else {
          gridCells[i].background = '#1e293b';
        }
      }
    }

    // Grid info text
    const thk = cycle?.cumulativeThickness ?? 0;
    const idx = cycle?.cycleIndex ?? 0;
    gridInfo.text = `${thk.toFixed(1)}\u00c5 / Cycle ${idx}`;
  });

  // ---- Engine lifecycle ----
  const resize = () => engine.resize();
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    window.removeEventListener('resize', resize);
    window.removeEventListener('pagehide', dispose);
    scene.dispose();
    engine.dispose();
  };
  window.addEventListener('resize', resize);
  window.addEventListener('pagehide', dispose);
  engine.runRenderLoop(() => { if (!disposed) scene.render(); });

  return dispose;
}

export function ReactorCrossSectionScene(props: ReactorCrossSectionSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const propsRef = useRef(props);
  const webgl = useWebGLSupport();

  useEffect(() => { propsRef.current = props; });

  useEffect(() => {
    if (!canvasRef.current || !webgl.supported) return undefined;
    return createScene(canvasRef.current, propsRef);
  }, [webgl.supported]);

  if (!webgl.supported) return <WebGLFallback />;

  return (
    <canvas
      ref={canvasRef}
      data-testid="reactor-cross-section-canvas"
      aria-label="ALD reactor cross-section simulation"
      className="h-full w-full touch-none outline-none"
    />
  );
}
