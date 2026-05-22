'use client';

import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import type { StepState, SimulationParams, FEAMesh } from '@/lib/oxidation-sim';

interface OxidationSceneProps {
  step: StepState | null;
  params: SimulationParams;
  mesh: FEAMesh;
}

function tempToColor(T: number): BABYLON.Color3 {
  const norm = Math.max(0, Math.min(1, (T - 25) / (1200 - 25)));
  return new BABYLON.Color3(norm, 0.1 * (1 - norm), 0.8 * (1 - norm));
}

function stressToColor(s: number, maxS: number): BABYLON.Color3 {
  const norm = maxS > 0 ? Math.max(0, Math.min(1, Math.abs(s) / maxS)) : 0;
  if (norm < 0.5) {
    const t = norm * 2;
    return new BABYLON.Color3(t, 0.8 - 0.3 * t, 0.1);
  }
  const t = (norm - 0.5) * 2;
  return new BABYLON.Color3(1, 0.5 * (1 - t), 0.1 * (1 - t));
}

export function OxidationScene({ step, params, mesh }: OxidationSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ step, params, mesh });
  useEffect(() => { propsRef.current = { step, params, mesh }; });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new BABYLON.Engine(canvas, true, { adaptToDeviceRatio: true });
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.02, 0.03, 0.06, 1);

    const camera = new BABYLON.ArcRotateCamera('cam', -Math.PI / 4, Math.PI / 3, 300, new BABYLON.Vector3(0, -40, 0), scene);
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 80;
    camera.upperRadiusLimit = 600;
    camera.lowerBetaLimit = 0.15;
    camera.upperBetaLimit = Math.PI * 0.85;

    const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene);
    hemi.intensity = 0.5;
    const point = new BABYLON.PointLight('pt', new BABYLON.Vector3(50, 50, 50), scene);
    point.intensity = 0.4;

    // ── Substrate (Si) ──
    const siMat = new BABYLON.StandardMaterial('siMat', scene);
    siMat.diffuseColor = new BABYLON.Color3(0.15, 0.22, 0.35);
    siMat.alpha = 0.85;
    siMat.backFaceCulling = false;
    const siBox = BABYLON.MeshBuilder.CreateBox('si', { width: 120, height: 160, depth: 30 }, scene);
    siBox.material = siMat;
    siBox.position.y = -100;

    // ── Oxide Layer (SiO2) ──
    const oxMat = new BABYLON.StandardMaterial('oxMat', scene);
    oxMat.diffuseColor = new BABYLON.Color3(0.96, 0.72, 0.15);
    oxMat.alpha = 0.6;
    oxMat.backFaceCulling = false;
    const oxBox = BABYLON.MeshBuilder.CreateBox('oxide', { width: 120, height: 1, depth: 30 }, scene);
    oxBox.material = oxMat;
    oxBox.position.y = 0;
    oxBox.isVisible = false;

    // ── Nitride Mask (Si3N4) — visible for LOCOS/STI ──
    const niMat = new BABYLON.StandardMaterial('niMat', scene);
    niMat.diffuseColor = new BABYLON.Color3(0.2, 0.65, 0.3);
    niMat.alpha = 0.7;
    const niBox = BABYLON.MeshBuilder.CreateBox('nitride', { width: 40, height: 8, depth: 30 }, scene);
    niBox.material = niMat;
    niBox.position.y = 4;
    niBox.position.x = -20;
    niBox.isVisible = false;

    // ── Trench cutout — visible for STI ──
    const trMat = new BABYLON.StandardMaterial('trMat', scene);
    trMat.diffuseColor = new BABYLON.Color3(0.08, 0.12, 0.2);
    trMat.alpha = 0.5;
    const trBox = BABYLON.MeshBuilder.CreateBox('trench', { width: 15, height: 30, depth: 30 }, scene);
    trBox.material = trMat;
    trBox.position.y = -15;
    trBox.position.x = 20;
    trBox.isVisible = false;

    // ── Temperature color strips ──
    const STRIP_COUNT = 20;
    const stripHeight = 160 / STRIP_COUNT;
    const stripMats: BABYLON.StandardMaterial[] = [];
    const strips: BABYLON.Mesh[] = [];
    for (let i = 0; i < STRIP_COUNT; i++) {
      const m = new BABYLON.StandardMaterial(`strip${i}`, scene);
      m.diffuseColor = new BABYLON.Color3(0.15, 0.22, 0.35);
      m.alpha = 0.6;
      m.backFaceCulling = false;
      stripMats.push(m);
      const b = BABYLON.MeshBuilder.CreateBox(`strip${i}`, { width: 3, height: stripHeight, depth: 2 }, scene);
      b.material = m;
      b.position.x = -65;
      b.position.y = -(i + 0.5) * stripHeight + 80;
      strips.push(b);
    }

    // ── Stress indicator strips (right side) ──
    const stressMats: BABYLON.StandardMaterial[] = [];
    const stressStrips: BABYLON.Mesh[] = [];
    for (let i = 0; i < STRIP_COUNT; i++) {
      const m = new BABYLON.StandardMaterial(`sStrip${i}`, scene);
      m.emissiveColor = new BABYLON.Color3(0.1, 0.5, 0.1);
      m.alpha = 0.6;
      stressMats.push(m);
      const b = BABYLON.MeshBuilder.CreateBox(`sStrip${i}`, { width: 3, height: stripHeight, depth: 2 }, scene);
      b.material = m;
      b.position.x = 65;
      b.position.y = -(i + 0.5) * stripHeight + 80;
      stressStrips.push(b);
    }

    scene.registerBeforeRender(() => {
      const { step: curStep, params: curParams } = propsRef.current;
      if (!curStep) return;

      // Update oxide layer height
      const avgOx = (curStep.oxideThicknessCenter + curStep.oxideThicknessMid + curStep.oxideThicknessEdge) / 3;
      if (avgOx > 0) {
        const scale = Math.max(0.5, Math.min(40, avgOx * 0.2));
        oxBox.isVisible = true;
        oxBox.scaling.y = scale;
        oxBox.position.y = scale / 2 - 20;
      } else {
        oxBox.isVisible = false;
      }

      // Show/hide geometry-specific meshes
      const isLocos = curParams.geometryType === 'locos';
      const isSti = curParams.geometryType === 'sti';
      niBox.isVisible = isLocos || isSti;
      trBox.isVisible = isSti;

      if (isSti) {
        const td = curParams.trenchDepth * 0.1;
        trBox.scaling.y = td / 30;
        trBox.position.y = -td / 2 - 20;
      }

      // Temperature strips
      const nodeCount = curStep.nodeTemperatures.length;
      for (let i = 0; i < STRIP_COUNT; i++) {
        const nodeIdx = Math.floor((i / STRIP_COUNT) * nodeCount);
        const T = curStep.nodeTemperatures[nodeIdx] ?? curStep.temperature;
        stripMats[i].emissiveColor = tempToColor(T);
      }

      // Stress strips
      const maxStress = curStep.peakStress || 1;
      for (let i = 0; i < STRIP_COUNT; i++) {
        const nodeIdx = Math.floor((i / STRIP_COUNT) * nodeCount);
        const s = curStep.nodeStresses[nodeIdx] ?? 0;
        stressMats[i].emissiveColor = stressToColor(s, maxStress);
      }
    });

    engine.runRenderLoop(() => scene.render());
    const onResize = () => engine.resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      engine.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="h-full w-full" />;
}
