'use client';

import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import type { StepState, SimulationParams } from '@/lib/diffusion-sim';
import { DEPTH_BINS } from '@/lib/diffusion-sim';

interface DiffusionSceneProps {
  step: StepState | null;
  params: SimulationParams;
}

const STRIP_COUNT = 40;

function concToColor(logC: number): BABYLON.Color3 {
  if (logC >= 20) return new BABYLON.Color3(0.96, 0.62, 0.04);
  if (logC >= 17) return new BABYLON.Color3(0.92, 0.35, 0.05);
  if (logC >= 14) return new BABYLON.Color3(0.50, 0.11, 0.11);
  return new BABYLON.Color3(0.12, 0.23, 0.37);
}

export function DiffusionScene({ step, params }: DiffusionSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ step, params });
  propsRef.current = { step, params };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new BABYLON.Engine(canvas, true, { adaptToDeviceRatio: true });
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.02, 0.03, 0.06, 1);

    const camera = new BABYLON.ArcRotateCamera('cam', -Math.PI / 4, Math.PI / 3, 350, new BABYLON.Vector3(0, -80, 0), scene);
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 100;
    camera.upperRadiusLimit = 800;
    camera.lowerBetaLimit = 0.15;
    camera.upperBetaLimit = Math.PI * 0.85;

    const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene);
    hemi.intensity = 0.5;
    const point = new BABYLON.PointLight('pt', new BABYLON.Vector3(50, 50, 50), scene);
    point.intensity = 0.4;

    const strips: BABYLON.Mesh[] = [];
    const stripMats: BABYLON.StandardMaterial[] = [];
    const stripHeight = 200 / STRIP_COUNT;

    for (let i = 0; i < STRIP_COUNT; i++) {
      const mat = new BABYLON.StandardMaterial(`strip${i}`, scene);
      mat.diffuseColor = new BABYLON.Color3(0.12, 0.23, 0.37);
      mat.alpha = 0.7;
      mat.backFaceCulling = false;
      stripMats.push(mat);

      const box = BABYLON.MeshBuilder.CreateBox(`strip${i}`, { width: 100, height: stripHeight, depth: 20 }, scene);
      box.material = mat;
      box.position.y = -(i + 0.5) * stripHeight;
      strips.push(box);
    }

    const oxMat = new BABYLON.StandardMaterial('oxMat', scene);
    oxMat.diffuseColor = new BABYLON.Color3(0.55, 0.45, 0.72);
    oxMat.alpha = 0.25;
    const oxBox = BABYLON.MeshBuilder.CreateBox('oxide', { width: 100, height: 1, depth: 20 }, scene);
    oxBox.material = oxMat;
    oxBox.isVisible = false;

    const junctionMat = new BABYLON.StandardMaterial('jMat', scene);
    junctionMat.diffuseColor = new BABYLON.Color3(0.96, 0.62, 0.04);
    junctionMat.emissiveColor = new BABYLON.Color3(0.96, 0.62, 0.04);
    junctionMat.alpha = 0.5;
    const junctionPlane = BABYLON.MeshBuilder.CreateBox('junction', { width: 110, height: 0.5, depth: 25 }, scene);
    junctionPlane.material = junctionMat;
    junctionPlane.isVisible = false;

    const interstitialPool: BABYLON.Mesh[] = [];
    const vacancyPool: BABYLON.Mesh[] = [];

    const iMat = new BABYLON.StandardMaterial('iMat', scene);
    iMat.emissiveColor = new BABYLON.Color3(0.02, 0.71, 0.83);
    iMat.alpha = 0.7;

    const vMat = new BABYLON.StandardMaterial('vMat', scene);
    vMat.emissiveColor = new BABYLON.Color3(0.66, 0.33, 0.97);
    vMat.alpha = 0.7;

    for (let i = 0; i < 50; i++) {
      const si = BABYLON.MeshBuilder.CreateSphere(`iP${i}`, { diameter: 1.5 }, scene);
      si.material = iMat;
      si.isVisible = false;
      interstitialPool.push(si);

      const sv = BABYLON.MeshBuilder.CreateSphere(`vP${i}`, { diameter: 1.5 }, scene);
      sv.material = vMat;
      sv.isVisible = false;
      vacancyPool.push(sv);
    }

    const tempStrips: BABYLON.Mesh[] = [];
    const tempMats: BABYLON.StandardMaterial[] = [];
    const tempBarStrips = 20;
    for (let i = 0; i < tempBarStrips; i++) {
      const m = new BABYLON.StandardMaterial(`tBar${i}`, scene);
      m.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.5);
      m.alpha = 0.8;
      tempMats.push(m);
      const b = BABYLON.MeshBuilder.CreateBox(`tBar${i}`, { width: 3, height: 200 / tempBarStrips, depth: 2 }, scene);
      b.material = m;
      b.position.x = -55;
      b.position.y = -(i + 0.5) * (200 / tempBarStrips);
      tempStrips.push(b);
    }

    scene.registerBeforeRender(() => {
      const { step: curStep, params: curParams } = propsRef.current;
      if (!curStep) return;

      const maxD = curStep.maxDepthNm;
      const scale = 200 / Math.max(maxD, 100);
      const binsPerStrip = Math.floor(DEPTH_BINS / STRIP_COUNT);

      for (let s = 0; s < STRIP_COUNT; s++) {
        let avgConc = 0;
        for (let b = 0; b < binsPerStrip; b++) {
          const idx = s * binsPerStrip + b;
          if (idx < DEPTH_BINS) avgConc += curStep.dopantProfile[idx];
        }
        avgConc /= binsPerStrip;
        const logC = avgConc > 0 ? Math.log10(avgConc) : 8;
        stripMats[s].diffuseColor = concToColor(logC);
      }

      if (curParams.screenOxideThickness > 0) {
        const h = curParams.screenOxideThickness * scale;
        oxBox.isVisible = true;
        oxBox.scaling.y = h;
        oxBox.position.y = h / 2;
      } else {
        oxBox.isVisible = false;
      }

      if (curStep.junctionDepth > 0) {
        junctionPlane.isVisible = true;
        junctionPlane.position.y = -curStep.junctionDepth * scale;
      } else {
        junctionPlane.isVisible = false;
      }

      let iIdx = 0;
      let vIdx = 0;
      for (let bin = 0; bin < DEPTH_BINS; bin += 10) {
        const sI = curStep.interstitialProfile[bin] ?? 1;
        const sV = curStep.vacancyProfile[bin] ?? 1;
        const y = -(bin + 0.5) * (200 / DEPTH_BINS);

        if (sI > 1.2 && iIdx < interstitialPool.length) {
          const p = interstitialPool[iIdx++];
          p.position.set((Math.random() - 0.5) * 80, y + Math.random() * 2, (Math.random() - 0.5) * 16);
          p.isVisible = true;
        }

        if (sV > 1.2 && vIdx < vacancyPool.length) {
          const p = vacancyPool[vIdx++];
          p.position.set((Math.random() - 0.5) * 80, y, (Math.random() - 0.5) * 16);
          p.isVisible = true;
        }
      }
      for (let i = iIdx; i < interstitialPool.length; i++) interstitialPool[i].isVisible = false;
      for (let i = vIdx; i < vacancyPool.length; i++) vacancyPool[i].isVisible = false;

      for (let i = 0; i < tempBarStrips; i++) {
        const binIdx = Math.floor((i / tempBarStrips) * DEPTH_BINS);
        const T = curStep.temperatureProfile[binIdx] ?? curStep.temperature;
        const norm = Math.max(0, Math.min(1, (T - 25) / (1410 - 25)));
        tempMats[i].emissiveColor = new BABYLON.Color3(norm, 0.1 * (1 - norm), 0.8 * (1 - norm));
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
