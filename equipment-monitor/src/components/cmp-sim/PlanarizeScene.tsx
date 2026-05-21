'use client';

import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import type { StepState, SimulationParams } from '@/lib/cmp-sim';

interface PlanarizeSceneProps {
  step: StepState | null;
  params: SimulationParams;
}

const COPPER_COLOR = new BABYLON.Color3(0.72, 0.45, 0.20);
const BARRIER_COLOR = new BABYLON.Color3(0.55, 0.55, 0.60);
const OXIDE_COLOR = new BABYLON.Color3(0.30, 0.50, 0.75);
const PAD_COLOR = new BABYLON.Color3(0.15, 0.12, 0.10);
const AMBER = new BABYLON.Color3(0.96, 0.62, 0.04);

export function PlanarizeScene({ step, params }: PlanarizeSceneProps) {
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

    // Camera
    const camera = new BABYLON.ArcRotateCamera('cam', -Math.PI / 2, Math.PI / 3, 14, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 7;
    camera.upperRadiusLimit = 22;
    camera.lowerBetaLimit = 0.3;
    camera.upperBetaLimit = 1.2;

    // Lights
    const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene);
    hemi.intensity = 0.5;
    const point = new BABYLON.PointLight('point', new BABYLON.Vector3(3, 5, 2), scene);
    point.intensity = 0.5;

    // --- Platen (large rotating cylinder, dark polyurethane) ---
    const platenMat = new BABYLON.StandardMaterial('platenMat', scene);
    platenMat.diffuseColor = PAD_COLOR;
    platenMat.specularPower = 4;
    const platen = BABYLON.MeshBuilder.CreateCylinder('platen', { diameter: 10, height: 0.4, tessellation: 48 }, scene);
    platen.position.y = -0.2;
    platen.material = platenMat;

    // Concentric grooves (4 tori on the pad surface)
    const grooveMat = new BABYLON.StandardMaterial('grooveMat', scene);
    grooveMat.diffuseColor = new BABYLON.Color3(0.08, 0.06, 0.05);
    for (let i = 0; i < 4; i++) {
      const groove = BABYLON.MeshBuilder.CreateTorus(`groove${i}`, { diameter: 2.5 + i * 1.8, thickness: 0.06, tessellation: 48 }, scene);
      groove.position.y = 0.01;
      groove.material = grooveMat;
      groove.parent = platen;
    }

    // --- Wafer Carrier (smaller cylinder, offset from center) ---
    const carrierMat = new BABYLON.StandardMaterial('carrierMat', scene);
    carrierMat.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.35);
    carrierMat.specularPower = 16;
    const carrier = BABYLON.MeshBuilder.CreateCylinder('carrier', { diameter: 4.2, height: 0.5, tessellation: 32 }, scene);
    carrier.position.set(2.2, 0.7, 0);
    carrier.material = carrierMat;

    // Retaining ring (torus around wafer)
    const ringMat = new BABYLON.StandardMaterial('ringMat', scene);
    ringMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.42);
    const retainingRing = BABYLON.MeshBuilder.CreateTorus('retainingRing', { diameter: 4.2, thickness: 0.2, tessellation: 32 }, scene);
    retainingRing.position.set(2.2, 0.45, 0);
    retainingRing.material = ringMat;

    // --- Wafer (thin disc, color changes by phase) ---
    const waferMat = new BABYLON.StandardMaterial('waferMat', scene);
    waferMat.diffuseColor = COPPER_COLOR.clone();
    const wafer = BABYLON.MeshBuilder.CreateCylinder('wafer', { diameter: 3.8, height: 0.06, tessellation: 32 }, scene);
    wafer.position.set(2.2, 0.4, 0);
    wafer.material = waferMat;

    // --- Slurry film (semi-transparent disc between pad and wafer) ---
    const slurryMat = new BABYLON.StandardMaterial('slurryMat', scene);
    slurryMat.diffuseColor = AMBER.clone();
    slurryMat.alpha = 0.35;
    slurryMat.backFaceCulling = false;
    const slurryDisc = BABYLON.MeshBuilder.CreateCylinder('slurryDisc', { diameter: 9.6, height: 0.04, tessellation: 48 }, scene);
    slurryDisc.position.y = 0.05;
    slurryDisc.material = slurryMat;

    // --- Slurry abrasive particles (SPS) ---
    const abrasiveSPS = new BABYLON.SolidParticleSystem('abrasives', scene);
    const abrasiveModel = BABYLON.MeshBuilder.CreateSphere('abModel', { diameter: 0.06 }, scene);
    abrasiveSPS.addShape(abrasiveModel, 60);
    abrasiveModel.dispose();
    const abrasiveMesh = abrasiveSPS.buildMesh();
    const abrasiveMat = new BABYLON.StandardMaterial('abMat', scene);
    abrasiveMat.emissiveColor = new BABYLON.Color3(0.9, 0.7, 0.3);
    abrasiveMat.disableLighting = true;
    abrasiveMesh.material = abrasiveMat;

    abrasiveSPS.initParticles = () => {
      for (let i = 0; i < abrasiveSPS.nbParticles; i++) {
        const p = abrasiveSPS.particles[i];
        const angle = Math.random() * Math.PI * 2;
        const r = 0.5 + Math.random() * 4.3;
        p.position.x = Math.cos(angle) * r;
        p.position.y = 0.05 + (Math.random() - 0.5) * 0.04;
        p.position.z = Math.sin(angle) * r;
        p.isVisible = true;
      }
    };
    abrasiveSPS.initParticles();
    abrasiveSPS.setParticles();

    // --- Conditioner arm (cosmetic box + disc) ---
    const condArmMat = new BABYLON.StandardMaterial('condArmMat', scene);
    condArmMat.diffuseColor = new BABYLON.Color3(0.45, 0.45, 0.48);
    const condArm = BABYLON.MeshBuilder.CreateBox('condArm', { width: 3.5, height: 0.15, depth: 0.3 }, scene);
    condArm.position.set(-2.5, 0.5, 2.5);
    condArm.rotation.y = -Math.PI / 6;
    condArm.material = condArmMat;

    const condDiscMat = new BABYLON.StandardMaterial('condDiscMat', scene);
    condDiscMat.diffuseColor = new BABYLON.Color3(0.6, 0.6, 0.55);
    const condDisc = BABYLON.MeshBuilder.CreateCylinder('condDisc', { diameter: 1.0, height: 0.12, tessellation: 24 }, scene);
    condDisc.position.set(-3.8, 0.35, 3.2);
    condDisc.material = condDiscMat;

    // --- Phase banner via GUI ---
    const advTex = GUI.AdvancedDynamicTexture.CreateFullscreenUI('ui', true, scene);
    const phaseBanner = new GUI.TextBlock('phaseBanner', 'Ramp-Up');
    phaseBanner.color = '#6366f1';
    phaseBanner.fontSize = 18;
    phaseBanner.fontFamily = 'monospace';
    phaseBanner.top = '16px';
    phaseBanner.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    phaseBanner.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    advTex.addControl(phaseBanner);

    // --- Render loop ---
    scene.registerBeforeRender(() => {
      const { step: s, params: pr } = propsRef.current;
      const phase = s?.phase ?? 'ramp-up';
      const dt = 0.016;

      // Platen rotation
      const platenSpeed = (pr.platenRpm / 60) * Math.PI * 2 * dt;
      platen.rotation.y += platenSpeed * 0.3;

      // Carrier counter-rotation
      const waferSpeed = (pr.waferRpm / 60) * Math.PI * 2 * dt;
      carrier.rotation.y -= waferSpeed * 0.3;
      retainingRing.rotation.y -= waferSpeed * 0.3;
      wafer.rotation.y -= waferSpeed * 0.3;

      // Conditioner disc rotation
      condDisc.rotation.y += 0.02;

      // Wafer color changes by phase
      if (phase === 'ramp-up' || phase === 'bulk-cu') {
        waferMat.diffuseColor = COPPER_COLOR.clone();
      } else if (phase === 'barrier') {
        waferMat.diffuseColor = BARRIER_COLOR.clone();
      } else {
        waferMat.diffuseColor = OXIDE_COLOR.clone();
      }

      // Slurry color: amber for Cu steps, blue for barrier/buff
      if (phase === 'ramp-up' || phase === 'bulk-cu') {
        slurryMat.diffuseColor = AMBER.clone();
      } else {
        slurryMat.diffuseColor = new BABYLON.Color3(0.25, 0.45, 0.80);
      }

      // Abrasive particles rotate with platen
      abrasiveSPS.updateParticle = (p) => {
        const angle = platenSpeed * 0.3;
        const nx = p.position.x * Math.cos(angle) - p.position.z * Math.sin(angle);
        const nz = p.position.x * Math.sin(angle) + p.position.z * Math.cos(angle);
        p.position.x = nx;
        p.position.z = nz;
        p.isVisible = true;
        return p;
      };
      abrasiveSPS.setParticles();

      // Phase banner update
      const phaseLabels: Record<string, string> = { 'ramp-up': 'Ramp-Up', 'bulk-cu': 'Bulk Cu Removal', 'barrier': 'Barrier Polish', 'buff': 'Buff / Oxide' };
      const phaseColors: Record<string, string> = { 'ramp-up': '#6366f1', 'bulk-cu': '#f59e0b', 'barrier': '#8b5cf6', 'buff': '#10b981' };
      phaseBanner.text = phaseLabels[phase] ?? 'Ramp-Up';
      phaseBanner.color = phaseColors[phase] ?? '#6366f1';
    });

    engine.runRenderLoop(() => scene.render());
    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    // --- 2D Inset canvas (bottom-right, 200x240) ---
    let animId = 0;
    const drawInset = () => {
      const ctx = insetRef.current?.getContext('2d');
      if (!ctx) { animId = requestAnimationFrame(drawInset); return; }
      const w = 200, h = 240;
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
      ctx.strokeRect(0, 0, w, h);

      const { step: s, params: pr } = propsRef.current;
      const phase = s?.phase ?? 'ramp-up';
      const cuRem = s?.cuRemaining ?? pr.cuThickness;
      const barrierRem = s?.barrierRemaining ?? 25;
      const contactArea = s?.realContactArea ?? 0;
      const contactPressure = s?.contactPressure ?? [];
      const asperity = pr.asperityDensity;

      // Title
      ctx.fillStyle = '#f59e0b';
      ctx.font = '10px monospace';
      ctx.fillText('Cross-Section', 8, 14);

      // --- Pad asperities (jagged surface from sin waves, scaled by asperityDensity) ---
      const padY = 50;
      const padH = 20;
      const asperityScale = Math.min(1, asperity / 1000);
      ctx.fillStyle = '#2a2218';
      ctx.fillRect(8, padY, w - 16, padH);

      ctx.strokeStyle = '#5a4a30';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 8; x <= w - 8; x++) {
        const t = (x - 8) / (w - 16);
        const jag = Math.sin(t * 40) * 2 * asperityScale + Math.sin(t * 80) * 1.2 * asperityScale + Math.sin(t * 120) * 0.6 * asperityScale;
        if (x === 8) ctx.moveTo(x, padY + jag);
        else ctx.lineTo(x, padY + jag);
      }
      ctx.stroke();

      // --- Slurry film (colored band, thickness from step data) ---
      const slurryY = padY + padH + 2;
      const filmData = s?.filmThickness ?? [];
      const avgFilm = filmData.length > 0 ? filmData.reduce((a, b) => a + b, 0) / filmData.length : 10;
      const slurryH = Math.max(4, Math.min(18, avgFilm * 0.8));
      const slurryColor = (phase === 'ramp-up' || phase === 'bulk-cu') ? 'rgba(245, 158, 11, 0.5)' : 'rgba(59, 130, 246, 0.5)';
      ctx.fillStyle = slurryColor;
      ctx.fillRect(8, slurryY, w - 16, slurryH);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px monospace';
      ctx.fillText(`Film: ${avgFilm.toFixed(1)} \u00B5m`, w - 80, slurryY + slurryH - 2);

      // --- Wafer layer stack (Cu orange / barrier grey / oxide blue) ---
      const stackY = slurryY + slurryH + 4;
      const maxCu = pr.cuThickness;
      const cuH = Math.max(2, (cuRem / maxCu) * 50);
      const barrierH = Math.max(2, (barrierRem / 25) * 10);
      const oxideH = 20;

      // Cu layer
      ctx.fillStyle = '#c67b2e';
      ctx.fillRect(8, stackY, w - 16, cuH);
      ctx.fillStyle = '#fff';
      ctx.font = '8px monospace';
      ctx.fillText(`Cu: ${cuRem.toFixed(0)} nm`, 12, stackY + Math.max(10, cuH / 2 + 3));

      // Barrier layer
      ctx.fillStyle = '#888';
      ctx.fillRect(8, stackY + cuH, w - 16, barrierH);
      if (barrierH > 6) {
        ctx.fillStyle = '#fff';
        ctx.fillText('TaN', 12, stackY + cuH + barrierH - 2);
      }

      // Oxide layer
      ctx.fillStyle = '#4a7ab5';
      ctx.fillRect(8, stackY + cuH + barrierH, w - 16, oxideH);
      ctx.fillStyle = '#fff';
      ctx.fillText('SiO\u2082', 12, stackY + cuH + barrierH + 13);

      // --- Contact points (yellow dots, count from realContactArea) ---
      const contactY = stackY - 4;
      const dotCount = Math.max(2, Math.min(20, Math.round(contactArea * 200)));
      ctx.fillStyle = '#facc15';
      for (let i = 0; i < dotCount; i++) {
        const dx = 12 + ((w - 24) * i) / dotCount + Math.sin(i * 3.7) * 3;
        ctx.beginPath();
        ctx.arc(dx, contactY, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- Pressure arrows (5 arrows sized by contactPressure) ---
      const arrowY = 170;
      const meanPressure = contactPressure.length > 0
        ? contactPressure.reduce((a, b) => a + b, 0) / contactPressure.length
        : 0;
      ctx.strokeStyle = '#f59e0b';
      ctx.fillStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) {
        const ax = 30 + i * 35;
        const arrowLen = Math.max(8, Math.min(35, meanPressure * 0.3));
        // Arrow shaft
        ctx.beginPath();
        ctx.moveTo(ax, arrowY);
        ctx.lineTo(ax, arrowY + arrowLen);
        ctx.stroke();
        // Arrow head
        ctx.beginPath();
        ctx.moveTo(ax - 3, arrowY + arrowLen - 4);
        ctx.lineTo(ax, arrowY + arrowLen);
        ctx.lineTo(ax + 3, arrowY + arrowLen - 4);
        ctx.fill();
      }

      // Labels and stats
      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px monospace';
      ctx.fillText(`Pressure: ${meanPressure.toFixed(1)} kPa`, 8, arrowY + 42);
      ctx.fillText(`Contact: ${(contactArea * 100).toFixed(2)}%`, 8, arrowY + 54);
      ctx.fillText(`Phase: ${phase}`, 8, arrowY + 66);

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
      <canvas ref={insetRef} width={200} height={240} className="absolute bottom-3 right-3 rounded-lg" style={{ imageRendering: 'pixelated' }} />
    </div>
  );
}
