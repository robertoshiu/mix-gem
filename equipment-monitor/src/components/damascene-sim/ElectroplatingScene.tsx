'use client';

import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import { useWebGLSupport } from '@/hooks/use-webgl-support';
import { WebGLFallback } from '@/components/three/WebGLFallback';
import type { StepState, SimulationParams } from '@/lib/damascene-sim';

interface ElectroplatingSceneProps {
  step: StepState | null;
  params: SimulationParams;
}

const PHASE_COLORS: Record<string, { hex: string; label: string }> = {
  'ecd-fill': { hex: '#22d3ee', label: 'ECD Fill' },
  'anneal':   { hex: '#f59e0b', label: 'Anneal' },
  'cmp':      { hex: '#a855f7', label: 'CMP' },
};

const ION_COUNT = 40;
const SLURRY_COUNT = 20;
const FILL_PROFILE_POINTS = 20;

function createScene(
  canvas: HTMLCanvasElement,
  propsRef: React.RefObject<ElectroplatingSceneProps>,
) {
  const engine = new BABYLON.Engine(canvas, true, { stencil: true, antialias: true });
  engine.setHardwareScalingLevel(window.devicePixelRatio > 1 ? 1.2 : 1);
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.02, 0.03, 0.08, 1);

  // Camera: side view of electroplating cell
  const camera = new BABYLON.ArcRotateCamera(
    'DAM-CAM', -Math.PI / 2, 1.2, 12,
    new BABYLON.Vector3(0, 2, 0), scene,
  );
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 6;
  camera.upperRadiusLimit = 20;
  camera.wheelPrecision = 40;

  // Lighting
  const hemi = new BABYLON.HemisphericLight('DAM-AMBIENT', new BABYLON.Vector3(0, 1, 0), scene);
  hemi.intensity = 0.5;
  hemi.diffuse = BABYLON.Color3.FromHexString('#1e293b');
  const rim = new BABYLON.PointLight('DAM-RIM', new BABYLON.Vector3(5, 6, -3), scene);
  rim.diffuse = BABYLON.Color3.FromHexString('#22d3ee');
  rim.intensity = 0.6;
  rim.range = 30;

  // ---- ECD Cell Geometry ----

  // Wafer (top, face-down cathode)
  const waferY = 4.5;
  const wafer = BABYLON.MeshBuilder.CreateCylinder('DAM-WAFER', {
    height: 0.1, diameter: 4, tessellation: 48,
  }, scene);
  wafer.position.set(0, waferY, 0);
  const waferMat = new BABYLON.PBRMaterial('DAM-WAFER-mat', scene);
  waferMat.albedoColor = BABYLON.Color3.FromHexString('#475569');
  waferMat.roughness = 0.25;
  waferMat.metallic = 0.7;
  wafer.material = waferMat;

  // Copper film growing on wafer bottom surface
  const film = BABYLON.MeshBuilder.CreateCylinder('DAM-CU-FILM', {
    height: 0.01, diameter: 3.8, tessellation: 48,
  }, scene);
  film.position.set(0, waferY - 0.06, 0);
  const filmMat = new BABYLON.PBRMaterial('DAM-CU-FILM-mat', scene);
  filmMat.albedoColor = BABYLON.Color3.FromHexString('#d97706');
  filmMat.emissiveColor = BABYLON.Color3.FromHexString('#d97706').scale(0.1);
  filmMat.roughness = 0.3;
  filmMat.metallic = 0.85;
  film.material = filmMat;

  // Seed layer ring (torus on wafer edge)
  const seedRing = BABYLON.MeshBuilder.CreateTorus('DAM-SEED-RING', {
    diameter: 3.9, thickness: 0.08, tessellation: 48,
  }, scene);
  seedRing.position.set(0, waferY - 0.05, 0);
  const seedMat = new BABYLON.PBRMaterial('DAM-SEED-mat', scene);
  seedMat.albedoColor = BABYLON.Color3.FromHexString('#b45309');
  seedMat.emissiveColor = BABYLON.Color3.FromHexString('#b45309').scale(0.3);
  seedMat.roughness = 0.4;
  seedMat.metallic = 0.8;
  seedRing.material = seedMat;

  // Anode (bottom copper plate)
  const anodeY = 0.15;
  const anode = BABYLON.MeshBuilder.CreateCylinder('DAM-ANODE', {
    height: 0.3, diameter: 4.5, tessellation: 36,
  }, scene);
  anode.position.set(0, anodeY, 0);
  const anodeMat = new BABYLON.PBRMaterial('DAM-ANODE-mat', scene);
  anodeMat.albedoColor = BABYLON.Color3.FromHexString('#92400e');
  anodeMat.roughness = 0.5;
  anodeMat.metallic = 0.9;
  anode.material = anodeMat;

  // Electrolyte bath (semi-transparent blue-green box)
  const bathH = waferY - anodeY - 0.3;
  const bath = BABYLON.MeshBuilder.CreateBox('DAM-ELECTROLYTE', {
    width: 4.2, height: bathH, depth: 2.5,
  }, scene);
  bath.position.set(0, anodeY + 0.15 + bathH / 2, 0);
  const bathMat = new BABYLON.PBRMaterial('DAM-BATH-mat', scene);
  bathMat.albedoColor = BABYLON.Color3.FromHexString('#0d9488');
  bathMat.roughness = 0.9;
  bathMat.metallic = 0.0;
  bathMat.alpha = 0.25;
  bath.material = bathMat;

  // ---- Cu2+ ion particles ----
  const ions: BABYLON.Mesh[] = [];
  const ionMats: BABYLON.StandardMaterial[] = [];
  const ionSeeds: number[] = [];
  for (let i = 0; i < ION_COUNT; i++) {
    const p = BABYLON.MeshBuilder.CreateSphere(`DAM-ION-${i}`, {
      diameter: 0.09, segments: 6,
    }, scene);
    const m = new BABYLON.StandardMaterial(`DAM-ION-${i}-mat`, scene);
    m.diffuseColor = BABYLON.Color3.FromHexString('#22d3ee');
    m.emissiveColor = BABYLON.Color3.FromHexString('#22d3ee').scale(0.5);
    p.material = m;
    p.isPickable = false;
    // Distribute: edge particles denser (terminal effect)
    const angle = Math.random() * Math.PI * 2;
    const edgeBias = Math.pow(Math.random(), 0.6); // bias toward edge
    const r = edgeBias * 1.8;
    p.position.set(
      Math.cos(angle) * r,
      anodeY + 0.4 + Math.random() * (bathH - 0.5),
      Math.sin(angle) * Math.min(r, 1.0),
    );
    ions.push(p);
    ionMats.push(m);
    ionSeeds.push(Math.random());
  }

  // ---- CMP geometry (initially hidden) ----

  // Polishing pad (top, rotating)
  const pad = BABYLON.MeshBuilder.CreateCylinder('DAM-CMP-PAD', {
    height: 0.2, diameter: 5, tessellation: 36,
  }, scene);
  pad.position.set(0, waferY + 0.25, 0);
  const padMat = new BABYLON.PBRMaterial('DAM-CMP-PAD-mat', scene);
  padMat.albedoColor = BABYLON.Color3.FromHexString('#64748b');
  padMat.roughness = 0.8;
  padMat.metallic = 0.2;
  padMat.alpha = 0.6;
  pad.material = padMat;
  pad.setEnabled(false);

  // Slurry particles
  const slurryParticles: BABYLON.Mesh[] = [];
  const slurrySeeds: number[] = [];
  for (let i = 0; i < SLURRY_COUNT; i++) {
    const sp = BABYLON.MeshBuilder.CreateSphere(`DAM-SLURRY-${i}`, {
      diameter: 0.06, segments: 6,
    }, scene);
    const sm = new BABYLON.StandardMaterial(`DAM-SLURRY-${i}-mat`, scene);
    sm.diffuseColor = BABYLON.Color3.FromHexString('#e2e8f0');
    sm.emissiveColor = BABYLON.Color3.FromHexString('#e2e8f0').scale(0.3);
    sp.material = sm;
    sp.isPickable = false;
    sp.setEnabled(false);
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * 2;
    sp.position.set(Math.cos(angle) * r, waferY + 0.1, Math.sin(angle) * Math.min(r, 1.0));
    slurryParticles.push(sp);
    slurrySeeds.push(Math.random());
  }

  // Barrier layer (thin purple disc, revealed during CMP)
  const barrier = BABYLON.MeshBuilder.CreateCylinder('DAM-BARRIER', {
    height: 0.03, diameter: 3.8, tessellation: 48,
  }, scene);
  barrier.position.set(0, waferY - 0.08, 0);
  const barrierMat = new BABYLON.PBRMaterial('DAM-BARRIER-mat', scene);
  barrierMat.albedoColor = BABYLON.Color3.FromHexString('#7c3aed');
  barrierMat.emissiveColor = BABYLON.Color3.FromHexString('#7c3aed').scale(0.15);
  barrierMat.roughness = 0.3;
  barrierMat.metallic = 0.6;
  barrier.material = barrierMat;
  barrier.setEnabled(false);

  // ---- GUI overlay ----
  const ui = GUI.AdvancedDynamicTexture.CreateFullscreenUI('DAM-UI', true, scene);

  // Phase banner (top center)
  const phaseBanner = new GUI.TextBlock('DAM-PHASE-BANNER');
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

  // Trench fill inset (lower-right, 180x220px)
  const insetContainer = new GUI.Rectangle('DAM-INSET-CONTAINER');
  insetContainer.width = '180px';
  insetContainer.height = '220px';
  insetContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
  insetContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
  insetContainer.left = '-12px';
  insetContainer.top = '-12px';
  insetContainer.background = 'rgba(10,22,40,0.85)';
  insetContainer.color = '#334155';
  insetContainer.thickness = 1;
  insetContainer.cornerRadius = 6;
  ui.addControl(insetContainer);

  const insetTitle = new GUI.TextBlock('DAM-INSET-TITLE');
  insetTitle.text = 'Trench Fill Profile';
  insetTitle.color = '#94a3b8';
  insetTitle.fontSize = 11;
  insetTitle.fontFamily = 'monospace';
  insetTitle.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
  insetTitle.top = '8px';
  insetTitle.heightInPixels = 16;
  insetContainer.addControl(insetTitle);

  // Fill profile bars (20 copper-colored bars)
  const barWidth = 6;
  const barMaxH = 120;
  const barsOffsetX = -(FILL_PROFILE_POINTS * barWidth) / 2 + barWidth / 2;
  const barsBaseY = 40; // offset from center downward
  const fillBars: GUI.Rectangle[] = [];
  for (let i = 0; i < FILL_PROFILE_POINTS; i++) {
    const bar = new GUI.Rectangle(`DAM-BAR-${i}`);
    bar.width = `${barWidth}px`;
    bar.height = '1px';
    bar.left = `${barsOffsetX + i * barWidth}px`;
    bar.top = `${barsBaseY + barMaxH / 2}px`;
    bar.background = '#d97706';
    bar.color = '#b4530900';
    bar.thickness = 0;
    insetContainer.addControl(bar);
    fillBars.push(bar);
  }

  const fillInfo = new GUI.TextBlock('DAM-FILL-INFO');
  fillInfo.text = '0% / 0nm';
  fillInfo.color = '#94a3b8';
  fillInfo.fontSize = 11;
  fillInfo.fontFamily = 'monospace';
  fillInfo.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
  fillInfo.top = '-24px';
  fillInfo.heightInPixels = 16;
  insetContainer.addControl(fillInfo);

  const voidLabel = new GUI.TextBlock('DAM-VOID-LABEL');
  voidLabel.text = '';
  voidLabel.color = '#ef4444';
  voidLabel.fontSize = 11;
  voidLabel.fontWeight = 'bold';
  voidLabel.fontFamily = 'monospace';
  voidLabel.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
  voidLabel.top = '-8px';
  voidLabel.heightInPixels = 16;
  insetContainer.addControl(voidLabel);

  // ---- Per-frame update ----
  let prevPhase = '';
  scene.onBeforeRenderObservable.add(() => {
    const { step, params } = propsRef.current;
    const phase = step?.phase ?? 'ecd-fill';
    const phaseInfo = PHASE_COLORS[phase] ?? PHASE_COLORS['ecd-fill'];
    const dt = engine.getDeltaTime() / 1000;

    // Phase banner
    phaseBanner.text = phaseInfo.label;
    phaseBanner.color = phaseInfo.hex;

    // ---- Phase-specific visibility transitions ----
    const isEcd = phase === 'ecd-fill';
    const isAnneal = phase === 'anneal';
    const isCmp = phase === 'cmp';

    // Electrolyte bath alpha
    if (isEcd) {
      bathMat.alpha = 0.25;
    } else if (isAnneal) {
      bathMat.alpha = Math.max(0, bathMat.alpha - 0.4 * dt);
    } else {
      bathMat.alpha = 0;
    }
    bath.setEnabled(bathMat.alpha > 0.01);

    // Anode visibility (only in ECD)
    anode.setEnabled(isEcd);

    // Ions visibility
    for (let i = 0; i < ION_COUNT; i++) {
      ions[i].setEnabled(isEcd);
    }

    // Seed ring dims when seedThickness < 30nm
    const seedAlpha = params.seedThickness < 30 ? 0.3 : 1.0;
    seedMat.alpha = seedAlpha;
    seedMat.emissiveColor = BABYLON.Color3.FromHexString('#b45309').scale(
      seedAlpha * 0.3,
    );

    // ---- ECD Fill: ion particle motion ----
    if (isEcd) {
      for (let i = 0; i < ION_COUNT; i++) {
        const p = ions[i];
        // Flow upward from anode to wafer
        p.position.y += (0.6 + ionSeeds[i] * 0.4) * dt;
        p.position.x += (Math.random() - 0.5) * 0.1 * dt;
        p.position.z += (Math.random() - 0.5) * 0.1 * dt;
        // Recycle from bottom when past wafer
        if (p.position.y > waferY - 0.15) {
          const angle = Math.random() * Math.PI * 2;
          const edgeBias = Math.pow(Math.random(), 0.6);
          const r = edgeBias * 1.8;
          p.position.set(
            Math.cos(angle) * r,
            anodeY + 0.4 + Math.random() * 0.5,
            Math.sin(angle) * Math.min(r, 1.0),
          );
        }
      }
    }

    // ---- Anneal: emissive glow ----
    if (isAnneal) {
      const glowIntensity = 0.4;
      waferMat.emissiveColor = BABYLON.Color3.FromHexString('#f59e0b').scale(glowIntensity);
      // Copper film transitions from bright to matte (grain growth)
      const annealProgress = step ? (step.stepIndex - 120) / 40 : 0;
      const matteT = Math.min(Math.max(annealProgress, 0), 1);
      filmMat.roughness = 0.3 + matteT * 0.4;
      filmMat.emissiveColor = BABYLON.Color3.FromHexString('#d97706').scale(
        0.1 * (1 - matteT * 0.6),
      );
    } else {
      waferMat.emissiveColor = BABYLON.Color3.Black();
    }

    // ---- CMP: pad rotation, slurry, barrier reveal ----
    if (isCmp && prevPhase !== 'cmp') {
      // Transition: flip wafer face-up conceptually (just reposition)
      pad.setEnabled(true);
      barrier.setEnabled(true);
      for (let i = 0; i < SLURRY_COUNT; i++) {
        slurryParticles[i].setEnabled(true);
      }
      seedRing.setEnabled(false);
    }
    if (!isCmp) {
      pad.setEnabled(false);
      barrier.setEnabled(false);
      seedRing.setEnabled(true);
      for (let i = 0; i < SLURRY_COUNT; i++) {
        slurryParticles[i].setEnabled(false);
      }
    }

    if (isCmp) {
      // Rotate polishing pad
      pad.rotation.y += params.padVelocity * 0.3 * dt;

      // Slurry particle orbital motion
      for (let i = 0; i < SLURRY_COUNT; i++) {
        const sp = slurryParticles[i];
        const angle = Math.atan2(sp.position.z, sp.position.x) + (0.8 + slurrySeeds[i]) * dt;
        const r = Math.sqrt(sp.position.x ** 2 + sp.position.z ** 2);
        sp.position.x = Math.cos(angle) * r;
        sp.position.z = Math.sin(angle) * Math.min(r, 1.0);
        sp.position.y = waferY + 0.05 + Math.sin(angle * 3) * 0.03;
      }

      // Copper overburden decreases visually
      const cuThickness = step?.copperThickness ?? 200;
      const filmScale = Math.max(0.1, cuThickness / 200);
      film.scaling.y = filmScale;

      // Barrier visibility increases as copper clears
      const barrierAlpha = cuThickness < 50 ? 1.0 - cuThickness / 50 : 0;
      barrierMat.alpha = Math.min(1, barrierAlpha);
    }

    // ---- Film thickness for ECD/Anneal ----
    if (!isCmp) {
      const cuThickness = step?.copperThickness ?? 0;
      const filmH = Math.max(0.01, (cuThickness / 300) * 0.15);
      film.scaling.y = filmH / 0.01;
      film.position.y = waferY - 0.06 - filmH / 2 + 0.005;
    }

    // ---- Trench fill inset ----
    const profile = step?.fillProfile ?? [];
    const fillFrac = step?.fillFraction ?? 0;
    const cuThk = step?.copperThickness ?? 0;

    for (let i = 0; i < FILL_PROFILE_POINTS; i++) {
      const h = i < profile.length ? profile[i] : 0;
      const barH = Math.max(1, h * barMaxH);
      fillBars[i].height = `${barH}px`;
      // Bars grow upward from bottom of the inset area
      fillBars[i].top = `${barsBaseY + (barMaxH - barH) / 2}px`;
      // Color: copper for fill, dimmer for low
      fillBars[i].background = h > 0.05 ? '#d97706' : '#1e293b';
    }

    fillInfo.text = `${(fillFrac * 100).toFixed(0)}% / ${cuThk.toFixed(0)}nm`;

    // Void risk detection: edges > center by >30%
    if (profile.length >= FILL_PROFILE_POINTS) {
      const edgeAvg = (profile[0] + profile[1] + profile[profile.length - 2] + profile[profile.length - 1]) / 4;
      const centerAvg = (profile[9] + profile[10]) / 2;
      const hasVoid = centerAvg > 0.05 && edgeAvg > centerAvg * 1.3;
      voidLabel.text = hasVoid ? 'VOID RISK' : '';
    } else {
      voidLabel.text = '';
    }

    prevPhase = phase;
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

export function ElectroplatingScene(props: ElectroplatingSceneProps) {
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
      data-testid="electroplating-scene-canvas"
      aria-label="Cu Damascene electroplating cell simulation"
      className="h-full w-full touch-none outline-none"
    />
  );
}
