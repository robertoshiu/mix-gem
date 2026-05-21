'use client';

import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import type { StepState, SimulationParams } from '@/lib/implant-sim';

interface TrajectorySceneProps {
  step: StepState | null;
  params: SimulationParams;
}

const SUBSTRATE_COLOR = new BABYLON.Color3(0.22, 0.42, 0.72);
const OXIDE_COLOR = new BABYLON.Color3(0.55, 0.45, 0.72);
const RESIST_COLOR = new BABYLON.Color3(0.85, 0.70, 0.25);
const DAMAGE_COLOR = new BABYLON.Color3(0.55, 0.20, 0.65);
const BEAM_COLOR = new BABYLON.Color3(0.02, 0.71, 0.83);

function energyToColor(eNorm: number): BABYLON.Color3 {
  if (eNorm > 0.5) {
    const t = (eNorm - 0.5) * 2;
    return new BABYLON.Color3(t, 0.3 * (1 - t) + 0.7 * t, 1 - t * 0.5);
  }
  return new BABYLON.Color3(0, 0.3 + eNorm * 0.4, 0.5 + eNorm);
}

export function TrajectoryScene({ step, params }: TrajectorySceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ step, params });
  propsRef.current = { step, params };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new BABYLON.Engine(canvas, true, { adaptToDeviceRatio: true });
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.02, 0.03, 0.06, 1);

    // Camera
    const camera = new BABYLON.ArcRotateCamera('cam', -Math.PI / 4, Math.PI / 3, 500, new BABYLON.Vector3(0, -100, 0), scene);
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 100;
    camera.upperRadiusLimit = 1500;
    camera.lowerBetaLimit = 0.15;
    camera.upperBetaLimit = Math.PI * 0.85;

    // Lights
    const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene);
    hemi.intensity = 0.5;
    const point = new BABYLON.PointLight('pt', new BABYLON.Vector3(50, 100, 50), scene);
    point.intensity = 0.4;

    // Substrate block
    const subMat = new BABYLON.StandardMaterial('subMat', scene);
    subMat.diffuseColor = SUBSTRATE_COLOR;
    subMat.alpha = 0.2;
    const subBox = BABYLON.MeshBuilder.CreateBox('substrate', { width: 100, height: 1, depth: 100 }, scene);
    subBox.material = subMat;

    // Oxide layer
    const oxMat = new BABYLON.StandardMaterial('oxMat', scene);
    oxMat.diffuseColor = OXIDE_COLOR;
    oxMat.alpha = 0.25;
    const oxBox = BABYLON.MeshBuilder.CreateBox('oxide', { width: 100, height: 1, depth: 100 }, scene);
    oxBox.material = oxMat;
    oxBox.isVisible = false;

    // Resist layer
    const resMat = new BABYLON.StandardMaterial('resMat', scene);
    resMat.diffuseColor = RESIST_COLOR;
    resMat.alpha = 0.2;
    const resBox = BABYLON.MeshBuilder.CreateBox('resist', { width: 100, height: 1, depth: 100 }, scene);
    resBox.material = resMat;
    resBox.isVisible = false;

    // Beam indicator
    const beamMat = new BABYLON.StandardMaterial('beamMat', scene);
    beamMat.diffuseColor = BEAM_COLOR;
    beamMat.emissiveColor = BEAM_COLOR;
    beamMat.alpha = 0.6;

    // Trajectory line system
    let trajectoryLines: BABYLON.LinesMesh[] = [];

    // Damage spheres
    let damageSpheres: BABYLON.Mesh[] = [];
    const dmgMat = new BABYLON.StandardMaterial('dmgMat', scene);
    dmgMat.diffuseColor = DAMAGE_COLOR;
    dmgMat.emissiveColor = new BABYLON.Color3(0.35, 0.1, 0.45);
    dmgMat.alpha = 0.3;

    // Collision event flash spheres pool
    const collisionPool: BABYLON.Mesh[] = [];
    for (let i = 0; i < 30; i++) {
      const s = BABYLON.MeshBuilder.CreateSphere(`coll${i}`, { diameter: 2 }, scene);
      const m = new BABYLON.StandardMaterial(`collMat${i}`, scene);
      m.emissiveColor = new BABYLON.Color3(1, 0.7, 0.2);
      m.alpha = 0.8;
      s.material = m;
      s.isVisible = false;
      collisionPool.push(s);
    }

    // Update function
    scene.registerBeforeRender(() => {
      const { step: curStep, params: curParams } = propsRef.current;
      if (!curStep) return;

      const maxD = curStep.maxDepthNm;
      const scale = 200 / Math.max(maxD, 100);

      // Update substrate box
      const siHeight = maxD * scale;
      subBox.scaling.y = siHeight;
      subBox.position.y = -siHeight / 2;

      // Update layer boxes
      let yOffset = 0;
      if (curParams.photoresistThickness > 0) {
        const h = curParams.photoresistThickness * scale;
        resBox.isVisible = true;
        resBox.scaling.y = h;
        resBox.position.y = h / 2;
        yOffset = h;
      } else {
        resBox.isVisible = false;
      }

      if (curParams.screenOxideThickness > 0) {
        const h = curParams.screenOxideThickness * scale;
        oxBox.isVisible = true;
        oxBox.scaling.y = h;
        oxBox.position.y = yOffset + h / 2;
      } else {
        oxBox.isVisible = false;
      }

      // Clear old trajectories
      for (const l of trajectoryLines) l.dispose();
      trajectoryLines = [];

      // Draw ion trajectories from current step
      const maxEnergy = curParams.beamEnergy * 1000;
      for (const traj of curStep.trajectories) {
        if (traj.points.length < 2) continue;

        const points: BABYLON.Vector3[] = traj.points.map(p => new BABYLON.Vector3(
          p.x * scale * 5,
          -p.z * scale,
          p.y * scale * 5,
        ));

        const colors: BABYLON.Color4[] = traj.energyAtPoints.slice(0, points.length).map(e => {
          const norm = Math.max(0, Math.min(1, e / maxEnergy));
          const c = energyToColor(norm);
          return new BABYLON.Color4(c.r, c.g, c.b, 0.8);
        });

        const line = BABYLON.MeshBuilder.CreateLines('traj', { points, colors, useVertexAlpha: true }, scene);
        trajectoryLines.push(line);

        // Recoil cascades
        for (const cascade of traj.recoilCascades) {
          if (cascade.length < 2) continue;
          const cPts = cascade.map(p => new BABYLON.Vector3(p.x * scale * 5, -p.z * scale, p.y * scale * 5));
          const cLine = BABYLON.MeshBuilder.CreateLines('recoil', { points: cPts }, scene);
          cLine.color = new BABYLON.Color3(0.8, 0.3, 0.3);
          cLine.alpha = 0.3;
          trajectoryLines.push(cLine);
        }
      }

      // Collision flashes
      let ci = 0;
      for (const traj of curStep.trajectories) {
        for (const coll of traj.collisions) {
          if (!coll.isDisplacement || ci >= collisionPool.length) continue;
          const s = collisionPool[ci++];
          s.position.set(coll.position.x * scale * 5, -coll.position.z * scale, coll.position.y * scale * 5);
          s.scaling.setAll(Math.min(3, coll.energyTransfer / 50));
          s.isVisible = true;
        }
      }
      for (let i = ci; i < collisionPool.length; i++) collisionPool[i].isVisible = false;

      // Damage clouds
      for (const s of damageSpheres) s.dispose();
      damageSpheres = [];
      for (let i = 0; i < curStep.amorphousMap.length; i++) {
        if (!curStep.amorphousMap[i]) continue;
        const depth = (i + 0.5) * (maxD / curStep.amorphousMap.length);
        const s = BABYLON.MeshBuilder.CreateSphere(`dmg${i}`, { diameter: 15 }, scene);
        s.position.y = -depth * scale;
        s.material = dmgMat;
        damageSpheres.push(s);
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
