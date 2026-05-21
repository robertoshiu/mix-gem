'use client';

import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import type { StepState, SimulationParams } from '@/lib/etch-sim';
import { STRIKE_END, ETCH_PROFILE_POINTS } from '@/lib/etch-sim';

interface ICPChamberSceneProps {
  step: StepState | null;
  params: SimulationParams;
}

const PURPLE = new BABYLON.Color3(0.66, 0.33, 0.97);
const PINK = new BABYLON.Color3(0.93, 0.29, 0.60);
const COPPER = new BABYLON.Color3(0.72, 0.45, 0.20);

export function ICPChamberScene({ step, params }: ICPChamberSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const insetRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ step, params });
  propsRef.current = { step, params };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new BABYLON.Engine(canvas, true, { adaptToDeviceRatio: true });
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.02, 0.03, 0.06, 1);

    const camera = new BABYLON.ArcRotateCamera('cam', -Math.PI / 2, Math.PI / 2.5, 12, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 6;
    camera.upperRadiusLimit = 20;

    const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene);
    hemi.intensity = 0.4;
    const point = new BABYLON.PointLight('point', new BABYLON.Vector3(0, 3, 0), scene);
    point.intensity = 0.6;

    // Chamber walls
    const wallMat = new BABYLON.StandardMaterial('wallMat', scene);
    wallMat.diffuseColor = new BABYLON.Color3(0.2, 0.22, 0.25);
    wallMat.specularPower = 8;

    const leftWall = BABYLON.MeshBuilder.CreateBox('leftWall', { width: 0.15, height: 6, depth: 5 }, scene);
    leftWall.position.x = -3;
    leftWall.material = wallMat;
    const rightWall = leftWall.clone('rightWall');
    rightWall.position.x = 3;
    const topLid = BABYLON.MeshBuilder.CreateBox('topLid', { width: 6.15, height: 0.15, depth: 5 }, scene);
    topLid.position.y = 3;
    topLid.material = wallMat;

    // ICP coils
    const coilMat = new BABYLON.StandardMaterial('coilMat', scene);
    coilMat.diffuseColor = COPPER;
    coilMat.specularColor = new BABYLON.Color3(1, 0.8, 0.4);
    coilMat.emissiveColor = new BABYLON.Color3(0.1, 0.05, 0);

    for (let i = 0; i < 3; i++) {
      const torus = BABYLON.MeshBuilder.CreateTorus(`coil${i}`, { diameter: 3.5 - i * 0.4, thickness: 0.12, tessellation: 32 }, scene);
      torus.position.y = 3.5 + i * 0.3;
      torus.material = coilMat;
    }

    // Quartz window
    const quartzMat = new BABYLON.StandardMaterial('quartzMat', scene);
    quartzMat.diffuseColor = new BABYLON.Color3(0.7, 0.75, 0.8);
    quartzMat.alpha = 0.4;
    const quartzDisc = BABYLON.MeshBuilder.CreateCylinder('quartz', { diameter: 5.5, height: 0.1, tessellation: 32 }, scene);
    quartzDisc.position.y = 3.0;
    quartzDisc.material = quartzMat;

    // Chuck + wafer
    const chuckMat = new BABYLON.StandardMaterial('chuckMat', scene);
    chuckMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.35);
    const chuck = BABYLON.MeshBuilder.CreateCylinder('chuck', { diameter: 4, height: 0.6, tessellation: 32 }, scene);
    chuck.position.y = -2.7;
    chuck.material = chuckMat;

    const waferMat = new BABYLON.StandardMaterial('waferMat', scene);
    waferMat.diffuseColor = new BABYLON.Color3(0.4, 0.42, 0.5);
    const wafer = BABYLON.MeshBuilder.CreateCylinder('wafer', { diameter: 3.6, height: 0.05, tessellation: 32 }, scene);
    wafer.position.y = -2.35;
    wafer.material = waferMat;

    // Film on wafer
    const filmMat = new BABYLON.StandardMaterial('filmMat', scene);
    filmMat.diffuseColor = new BABYLON.Color3(0.5, 0.6, 0.3);
    const film = BABYLON.MeshBuilder.CreateCylinder('film', { diameter: 3.4, height: 0.15, tessellation: 32 }, scene);
    film.position.y = -2.25;
    film.material = filmMat;

    // Gas inlet + exhaust
    const nozzle = BABYLON.MeshBuilder.CreateCylinder('nozzle', { diameter: 0.2, height: 0.6, tessellation: 8 }, scene);
    nozzle.position.set(-2.8, 2.7, 0);
    nozzle.rotation.z = Math.PI / 4;
    nozzle.material = wallMat;
    const exhaust = BABYLON.MeshBuilder.CreateCylinder('exhaust', { diameter: 0.3, height: 0.6, tessellation: 8 }, scene);
    exhaust.position.set(2.8, -2.7, 0);
    exhaust.rotation.z = -Math.PI / 4;
    exhaust.material = wallMat;

    // Plasma glow
    const glowMat = new BABYLON.StandardMaterial('glowMat', scene);
    glowMat.emissiveColor = PURPLE.clone();
    glowMat.alpha = 0;
    glowMat.disableLighting = true;
    const plasma = BABYLON.MeshBuilder.CreateSphere('plasma', { diameterX: 4, diameterY: 3, diameterZ: 4, segments: 16 }, scene);
    plasma.position.y = 0.5;
    plasma.material = glowMat;

    // Ion particles (SPS)
    const ionSPS = new BABYLON.SolidParticleSystem('ions', scene);
    const ionModel = BABYLON.MeshBuilder.CreateSphere('ionModel', { diameter: 0.06 }, scene);
    ionSPS.addShape(ionModel, 40);
    ionModel.dispose();
    const ionMesh = ionSPS.buildMesh();
    const ionMat = new BABYLON.StandardMaterial('ionMat', scene);
    ionMat.emissiveColor = new BABYLON.Color3(0.6, 0.8, 1.0);
    ionMat.disableLighting = true;
    ionMesh.material = ionMat;

    ionSPS.initParticles = () => {
      for (let i = 0; i < ionSPS.nbParticles; i++) {
        const p = ionSPS.particles[i];
        p.position.x = (Math.random() - 0.5) * 4;
        p.position.y = 2.5 - Math.random() * 5;
        p.position.z = (Math.random() - 0.5) * 2;
        p.isVisible = false;
      }
    };
    ionSPS.initParticles();
    ionSPS.setParticles();

    // Reactive species (SPS)
    const specSPS = new BABYLON.SolidParticleSystem('species', scene);
    const specModel = BABYLON.MeshBuilder.CreateSphere('specModel', { diameter: 0.04 }, scene);
    specSPS.addShape(specModel, 20);
    specModel.dispose();
    const specMesh = specSPS.buildMesh();
    const specMat = new BABYLON.StandardMaterial('specMat', scene);
    specMat.emissiveColor = new BABYLON.Color3(0.3, 0.9, 0.4);
    specMat.disableLighting = true;
    specMesh.material = specMat;

    specSPS.initParticles = () => {
      for (let i = 0; i < specSPS.nbParticles; i++) {
        const p = specSPS.particles[i];
        p.position.x = (Math.random() - 0.5) * 3;
        p.position.y = 1.5 - Math.random() * 3;
        p.position.z = (Math.random() - 0.5) * 2;
        p.isVisible = false;
      }
    };
    specSPS.initParticles();
    specSPS.setParticles();

    // Phase banner
    const advTex = GUI.AdvancedDynamicTexture.CreateFullscreenUI('ui', true, scene);
    const phaseBanner = new GUI.TextBlock('phaseBanner', 'Strike');
    phaseBanner.color = '#a855f7';
    phaseBanner.fontSize = 18;
    phaseBanner.fontFamily = 'monospace';
    phaseBanner.top = '16px';
    phaseBanner.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    phaseBanner.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    advTex.addControl(phaseBanner);

    // Render loop
    let frame = 0;
    scene.registerBeforeRender(() => {
      frame++;
      const { step: s } = propsRef.current;
      const idx = s?.stepIndex ?? -1;
      const phase = s?.phase ?? 'strike';

      // Plasma glow animation
      if (phase === 'strike') {
        const progress = Math.max(0, (idx + 1) / STRIKE_END);
        glowMat.alpha = progress * 0.25;
        glowMat.emissiveColor = PURPLE.clone();
        plasma.scaling.setAll(0.3 + progress * 0.7);
      } else if (phase === 'main-etch') {
        glowMat.alpha = 0.3 + Math.sin(frame * 0.05) * 0.05;
        glowMat.emissiveColor = PURPLE.clone();
        plasma.scaling.setAll(1);
      } else {
        glowMat.alpha = 0.2;
        glowMat.emissiveColor = BABYLON.Color3.Lerp(PURPLE, PINK, 0.5);
        plasma.scaling.setAll(0.9);
      }

      // Coil pulse
      const coilPulse = 0.05 + Math.sin(frame * 0.1) * 0.05;
      coilMat.emissiveColor = new BABYLON.Color3(coilPulse * 2, coilPulse, 0);

      // Film thinning
      const trenchDepth = propsRef.current.params.trenchWidth * propsRef.current.params.aspectRatio;
      const etchFraction = s ? Math.min(1, s.etchDepth / trenchDepth) : 0;
      film.scaling.y = Math.max(0.01, 1 - etchFraction);
      film.position.y = -2.25 - etchFraction * 0.07;
      filmMat.diffuseColor = etchFraction > 0.9
        ? new BABYLON.Color3(0.35, 0.35, 0.4)
        : new BABYLON.Color3(0.5, 0.6, 0.3);

      // Ion particles
      const ionSpeed = s ? Math.max(0.01, s.ionEnergy * 0.0001) : 0.01;
      const showIons = phase !== 'strike' || idx > STRIKE_END * 0.5;
      ionSPS.updateParticle = (p) => {
        p.isVisible = showIons;
        if (!showIons) { p.position.y = 10; return p; }
        p.position.y -= ionSpeed;
        if (p.position.y < -2.3) {
          p.position.y = 2.5;
          p.position.x = (Math.random() - 0.5) * 3.5 * (0.5 + Math.random() * 0.5);
          p.position.z = (Math.random() - 0.5) * 2;
        }
        return p;
      };
      ionSPS.setParticles();

      // Species particles (main etch only)
      const showSpec = phase === 'main-etch';
      specSPS.updateParticle = (p) => {
        p.isVisible = showSpec;
        if (!showSpec) { p.position.y = 10; return p; }
        p.position.y -= 0.008;
        p.position.x += (Math.random() - 0.5) * 0.02;
        if (p.position.y < -2.2) {
          p.position.y = 1.5;
          p.position.x = (Math.random() - 0.5) * 3;
          p.position.z = (Math.random() - 0.5) * 2;
        }
        return p;
      };
      specSPS.setParticles();

      // Phase banner
      const phaseLabels: Record<string, string> = { strike: 'Plasma Strike', 'main-etch': 'Main Etch', 'over-etch': 'Over-etch + Ash' };
      const phaseColors: Record<string, string> = { strike: '#a855f7', 'main-etch': '#7c3aed', 'over-etch': '#ec4899' };
      phaseBanner.text = phaseLabels[phase] ?? 'Strike';
      phaseBanner.color = phaseColors[phase] ?? '#a855f7';
    });

    engine.runRenderLoop(() => scene.render());
    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    // Etch profile inset (2D canvas)
    let animId = 0;
    const drawInset = () => {
      const ctx = insetRef.current?.getContext('2d');
      if (!ctx) { animId = requestAnimationFrame(drawInset); return; }
      const w = 180, h = 220;
      ctx.clearRect(0, 0, w, h);

      const { step: s } = propsRef.current;
      const profile = s?.etchProfile ?? new Array(ETCH_PROFILE_POINTS).fill(1);
      const isIsotropic = s?.profileAngle != null && s.profileAngle < 83;

      ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
      ctx.strokeRect(0, 0, w, h);

      ctx.fillStyle = '#a855f7';
      ctx.font = '10px monospace';
      ctx.fillText('Etch Profile', 8, 16);

      const barW = (w - 20) / ETCH_PROFILE_POINTS;
      const maxH = h - 40;
      for (let i = 0; i < profile.length; i++) {
        const barH = profile[i] * maxH;
        const x = 10 + i * barW;
        const y = 30 + (maxH - barH);
        ctx.fillStyle = profile[i] > 0.5 ? '#a855f7' : '#7c3aed';
        ctx.fillRect(x, y, barW - 1, barH);
      }

      if (isIsotropic) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('UNDERCUT', w / 2 - 28, h - 6);
      }

      animId = requestAnimationFrame(drawInset);
    };
    animId = requestAnimationFrame(drawInset);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      engine.dispose();
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <canvas ref={canvasRef} className="h-full w-full" />
      <canvas ref={insetRef} width={180} height={220} className="absolute bottom-3 right-3 rounded-lg" style={{ imageRendering: 'pixelated' }} />
    </div>
  );
}
