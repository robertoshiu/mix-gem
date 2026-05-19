'use client';

import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { WebGLFallback } from '@/components/three/WebGLFallback';
import { useWebGLSupport } from '@/hooks/use-webgl-support';
import type { SimulationParams, WaferState } from '@/lib/lens-sim';
import { LENS_COUNT } from '@/lib/lens-sim/constants';

interface LensCrossSectionSceneProps {
  wafer: WaferState | null;
  params: SimulationParams;
}

/** Map deltaT to a color between cyan -> amber -> red */
function heatColor(deltaT: number, maxDeltaT: number): BABYLON.Color3 {
  const t = Math.min(deltaT / Math.max(maxDeltaT, 0.01), 1);
  if (t < 0.5) {
    const s = t / 0.5;
    return BABYLON.Color3.Lerp(
      BABYLON.Color3.FromHexString('#22d3ee'),
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

function createScene(
  canvas: HTMLCanvasElement,
  propsRef: React.MutableRefObject<LensCrossSectionSceneProps>,
) {
  const engine = new BABYLON.Engine(canvas, true, { stencil: true, antialias: true });
  engine.setHardwareScalingLevel(window.devicePixelRatio > 1 ? 1.2 : 1);
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.02, 0.03, 0.08, 1);

  // Camera: side view
  const camera = new BABYLON.ArcRotateCamera('LENS-CAM', -Math.PI / 2, 1.1, 14, new BABYLON.Vector3(0, 3, 0), scene);
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 6;
  camera.upperRadiusLimit = 22;
  camera.wheelPrecision = 40;

  // Lighting
  const hemi = new BABYLON.HemisphericLight('LENS-AMBIENT', new BABYLON.Vector3(0, 1, 0), scene);
  hemi.intensity = 0.5;
  hemi.diffuse = BABYLON.Color3.FromHexString('#1e293b');
  const rim = new BABYLON.PointLight('LENS-RIM', new BABYLON.Vector3(5, 8, -3), scene);
  rim.diffuse = BABYLON.Color3.FromHexString('#22d3ee');
  rim.intensity = 0.6;
  rim.range = 30;

  // ---- Lens elements (L1 at bottom, L5 at top) ----
  const lensMeshes: BABYLON.Mesh[] = [];
  const lensMaterials: BABYLON.PBRMaterial[] = [];
  const elementGap = 0.3;
  const elementHeight = 0.6;
  const baseY = 1.0; // L1 bottom

  for (let i = 0; i < LENS_COUNT; i++) {
    const y = baseY + i * (elementHeight + elementGap);
    const diameter = 3.2 - i * 0.15; // L1 widest, L5 narrowest
    const lens = BABYLON.MeshBuilder.CreateCylinder(`LENS-L${i + 1}`, {
      height: elementHeight,
      diameter,
      tessellation: 36,
    }, scene);
    lens.position.y = y + elementHeight / 2;

    const mat = new BABYLON.PBRMaterial(`LENS-L${i + 1}-mat`, scene);
    mat.albedoColor = BABYLON.Color3.FromHexString('#bfdbfe');
    mat.emissiveColor = BABYLON.Color3.FromHexString('#22d3ee').scale(0.1);
    mat.roughness = 0.15;
    mat.metallic = 0.05;
    mat.alpha = 0.85;
    lens.material = mat;
    lens.metadata = { type: 'lens-element', index: i };
    lensMeshes.push(lens);
    lensMaterials.push(mat);
  }

  // ---- Immersion water gap ----
  const waterY = baseY - 0.15;
  const water = BABYLON.MeshBuilder.CreateBox('IMMERSION-WATER', { width: 3.4, height: 0.2, depth: 3.4 }, scene);
  water.position.y = waterY;
  const waterMat = new BABYLON.PBRMaterial('WATER-mat', scene);
  waterMat.albedoColor = BABYLON.Color3.FromHexString('#0ea5e9');
  waterMat.emissiveColor = BABYLON.Color3.FromHexString('#0ea5e9').scale(0.2);
  waterMat.roughness = 0.05;
  waterMat.metallic = 0;
  waterMat.alpha = 0.5;
  water.material = waterMat;

  // ---- Flow particles in water ----
  const flowParticles: BABYLON.Mesh[] = [];
  for (let i = 0; i < 80; i++) {
    const p = BABYLON.MeshBuilder.CreateSphere(`FLOW-P-${i}`, { diameter: 0.04, segments: 6 }, scene);
    const pm = new BABYLON.PBRMaterial(`FLOW-P-${i}-mat`, scene);
    pm.albedoColor = BABYLON.Color3.FromHexString('#7dd3fc');
    pm.emissiveColor = BABYLON.Color3.FromHexString('#7dd3fc').scale(0.5);
    pm.roughness = 0.1;
    pm.metallic = 0;
    p.material = pm;
    p.isPickable = false;
    p.position.y = waterY;
    flowParticles.push(p);
  }

  // ---- Wafer surface ----
  const waferDisc = BABYLON.MeshBuilder.CreateCylinder('WAFER-DISC', { height: 0.08, diameter: 5, tessellation: 48 }, scene);
  waferDisc.position.y = waterY - 0.25;
  const waferMat = new BABYLON.PBRMaterial('WAFER-mat', scene);
  waferMat.albedoColor = BABYLON.Color3.FromHexString('#334155');
  waferMat.emissiveColor = BABYLON.Color3.FromHexString('#475569').scale(0.1);
  waferMat.roughness = 0.3;
  waferMat.metallic = 0.6;
  waferDisc.material = waferMat;

  // ---- Resist layer ----
  const resist = BABYLON.MeshBuilder.CreateCylinder('RESIST-LAYER', { height: 0.03, diameter: 4.9, tessellation: 48 }, scene);
  resist.position.y = waterY - 0.195;
  const resistMat = new BABYLON.PBRMaterial('RESIST-mat', scene);
  resistMat.albedoColor = BABYLON.Color3.FromHexString('#a78bfa');
  resistMat.emissiveColor = BABYLON.Color3.FromHexString('#a78bfa').scale(0.15);
  resistMat.roughness = 0.5;
  resistMat.metallic = 0;
  resist.material = resistMat;

  // ---- 193nm beam cone ----
  const beamTop = LENS_COUNT * (elementHeight + elementGap) + baseY + 0.5;
  const beam = BABYLON.MeshBuilder.CreateCylinder('UV-BEAM', {
    height: beamTop - waterY,
    diameterTop: 1.0,
    diameterBottom: 2.8,
    tessellation: 24,
  }, scene);
  beam.position.y = (beamTop + waterY) / 2;
  const beamMat = new BABYLON.StandardMaterial('UV-BEAM-mat', scene);
  beamMat.diffuseColor = BABYLON.Color3.FromHexString('#22d3ee');
  beamMat.emissiveColor = BABYLON.Color3.FromHexString('#22d3ee').scale(0.3);
  beamMat.alpha = 0.08;
  beamMat.backFaceCulling = false;
  beam.material = beamMat;
  beam.isPickable = false;

  // ---- Meniscus edges (curved arcs at water boundary) ----
  const meniscusL = BABYLON.MeshBuilder.CreateTorus('MENISCUS-L', { diameter: 0.5, thickness: 0.04, tessellation: 24 }, scene);
  meniscusL.position = new BABYLON.Vector3(-1.7, waterY, 0);
  meniscusL.rotation.z = Math.PI / 2;
  const meniscusMat = new BABYLON.StandardMaterial('MENISCUS-mat', scene);
  meniscusMat.diffuseColor = BABYLON.Color3.FromHexString('#38bdf8');
  meniscusMat.emissiveColor = BABYLON.Color3.FromHexString('#38bdf8').scale(0.4);
  meniscusMat.alpha = 0.6;
  meniscusL.material = meniscusMat;
  const meniscusR = meniscusL.clone('MENISCUS-R');
  meniscusR.position.x = 1.7;

  // ---- Scan line indicator on wafer ----
  const scanLine = BABYLON.MeshBuilder.CreateBox('SCAN-LINE', { width: 5, height: 0.01, depth: 0.06 }, scene);
  scanLine.position.y = waterY - 0.18;
  const scanMat = new BABYLON.StandardMaterial('SCAN-LINE-mat', scene);
  scanMat.diffuseColor = BABYLON.Color3.FromHexString('#22d3ee');
  scanMat.emissiveColor = BABYLON.Color3.FromHexString('#22d3ee');
  scanMat.alpha = 0.7;
  scanLine.material = scanMat;
  scanLine.isPickable = false;

  // ---- Per-frame update ----
  scene.onBeforeRenderObservable.add(() => {
    const props = propsRef.current;
    const now = performance.now() / 1000;

    // Update lens element thermal colors
    const maxDT = 0.2; // scale reference
    for (let i = 0; i < LENS_COUNT; i++) {
      const deltaT = props.wafer?.lensElements[i]?.deltaT ?? 0;
      const color = heatColor(deltaT, maxDT);
      lensMaterials[i].emissiveColor = color.scale(0.35);
      lensMaterials[i].albedoColor = BABYLON.Color3.Lerp(
        BABYLON.Color3.FromHexString('#bfdbfe'),
        color,
        Math.min(deltaT / maxDT, 1) * 0.5,
      );
    }

    // Animate flow particles (parabolic velocity profile)
    const scanSpeed = props.params.scanSpeed / 1000;
    flowParticles.forEach((p, i) => {
      const phase = ((now * scanSpeed + i * 0.15) % 4) / 4;
      const x = (phase - 0.5) * 3.2;
      const z = ((i % 8) - 3.5) * 0.4;
      const yOffset = Math.sin(phase * Math.PI) * 0.04;
      p.position.set(x, waterY + yOffset, z);
    });

    // Scan line sweep
    const scanPhase = (now * scanSpeed * 0.5) % 2;
    const scanZ = scanPhase < 1 ? (scanPhase - 0.5) * 4 : (1.5 - scanPhase) * 4;
    scanLine.position.z = scanZ;
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

export function LensCrossSectionScene(props: LensCrossSectionSceneProps) {
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
      data-testid="lens-cross-section-canvas"
      aria-label="Lens heating cross-section simulation"
      className="h-full w-full touch-none outline-none"
    />
  );
}
