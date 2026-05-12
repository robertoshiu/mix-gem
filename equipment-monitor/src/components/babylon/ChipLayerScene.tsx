'use client';

import { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { WebGLFallback } from '@/components/three/WebGLFallback';
import { useWebGLSupport } from '@/hooks/use-webgl-support';
import { EDA_STAGE_DEFINITIONS, EDA_STAGE_ORDER, TECH_NODE_PRESETS } from '@/lib/eda-mock-data';
import type { EdaStage, StageState, TechNode } from '@/lib/eda-types';

interface ChipLayerSceneProps {
  stage: StageState;
  techNode: TechNode;
  onSelectStage: (stage: EdaStage) => void;
}

const LAYERS = [
  ['Substrate', '#2A2A3E'],
  ['M1', '#B87333'],
  ['M2', '#2563eb'],
  ['M3', '#38bdf8'],
  ['M4', '#0ea5e9'],
  ['M5', '#059669'],
  ['M6', '#10b981'],
  ['M7', '#34d399'],
  ['M8', '#86efac'],
  ['M9', '#cbd5e1'],
  ['M10', '#e2e8f0'],
  ['M11', '#f8fafc'],
  ['M12', '#f59e0b'],
] as const;

function createMat(scene: BABYLON.Scene, name: string, color: string, alpha = 0.74) {
  const material = new BABYLON.PBRMaterial(name, scene);
  material.albedoColor = BABYLON.Color3.FromHexString(color);
  material.emissiveColor = BABYLON.Color3.FromHexString(color).scale(0.12);
  material.alpha = alpha;
  material.roughness = 0.42;
  material.metallic = 0.26;
  return material;
}

function layerCountForStage(stage: EdaStage, progress: number, techNode: TechNode) {
  const maxLayers = TECH_NODE_PRESETS[techNode].layerCount;
  const index = EDA_STAGE_ORDER.indexOf(stage);
  if (index < EDA_STAGE_ORDER.indexOf('floorplan')) return 1;
  if (stage === 'floorplan') return 1;
  if (stage === 'place_route') return Math.max(2, Math.ceil((maxLayers * progress) / 100));
  if (stage === 'cts') return Math.max(4, Math.ceil(maxLayers * 0.66));
  if (stage === 'sta') return Math.max(5, Math.ceil(maxLayers * 0.78));
  return maxLayers;
}

function createScene(canvas: HTMLCanvasElement, props: ChipLayerSceneProps, spread: number, showDrc: boolean, showClock: boolean, showVias: boolean) {
  const engine = new BABYLON.Engine(canvas, true, { stencil: true, antialias: true });
  engine.setHardwareScalingLevel(window.devicePixelRatio > 1 ? 1.2 : 1);
  const scene = new BABYLON.Scene(engine, { useGeometryUniqueIdsMap: true, useMaterialMeshMap: true, useClonedMeshMap: true });
  scene.clearColor = new BABYLON.Color4(0.01, 0.025, 0.08, 1);

  const camera = new BABYLON.ArcRotateCamera('EDA-LAYER-CAMERA', -1.2, 1.05, 8.8, new BABYLON.Vector3(0, 1.2, 0), scene);
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 5;
  camera.upperRadiusLimit = 12;
  camera.wheelPrecision = 42;

  const hemi = new BABYLON.HemisphericLight('EDA-LAYER-AMBIENT', new BABYLON.Vector3(0, 1, 0), scene);
  hemi.intensity = 0.78;
  const point = new BABYLON.PointLight('EDA-LAYER-RIM', new BABYLON.Vector3(3, 5, -3), scene);
  point.intensity = 0.65;
  point.diffuse = BABYLON.Color3.FromHexString('#22d3ee');

  const visibleLayers = layerCountForStage(props.stage.stage, props.stage.progress, props.techNode);
  const spacing = 0.08 + spread * 0.025;
  for (let index = 0; index < visibleLayers; index += 1) {
    const [label, color] = LAYERS[index];
    const layer = BABYLON.MeshBuilder.CreateBox(`chip-layer-${label}`, { width: 4.8 - index * 0.04, height: 0.045, depth: 3.2 - index * 0.025 }, scene);
    layer.position.y = index * spacing;
    layer.material = createMat(scene, `chip-layer-${label}-mat`, color, index === 0 ? 0.9 : 0.68);
    layer.metadata = { id: label, type: 'chip-layer', stage: props.stage.stage };
    layer.isPickable = true;

    if (index === 0 && props.stage.stage === 'floorplan') {
      for (let macro = 0; macro < 9; macro += 1) {
        const block = BABYLON.MeshBuilder.CreateBox(`macro-${macro}`, { width: 0.48, height: 0.055, depth: 0.36 }, scene);
        block.position = new BABYLON.Vector3(-1.7 + (macro % 3) * 1.45, layer.position.y + 0.07, -0.9 + Math.floor(macro / 3) * 0.8);
        block.material = createMat(scene, `macro-${macro}-mat`, ['#F47920', '#38bdf8', '#a78bfa'][macro % 3], 0.88);
        block.isPickable = false;
      }
    }
  }

  if (showVias && visibleLayers > 2) {
    for (let via = 0; via < 36; via += 1) {
      const column = BABYLON.MeshBuilder.CreateCylinder(`via-${via}`, { height: spacing * Math.min(visibleLayers - 1, 7), diameter: 0.045, tessellation: 10 }, scene);
      column.position = new BABYLON.Vector3(-2 + (via % 9) * 0.5, (spacing * Math.min(visibleLayers - 1, 7)) / 2, -1.2 + Math.floor(via / 9) * 0.75);
      const mat = createMat(scene, `via-${via}-mat`, '#facc15', 0.88);
      mat.emissiveColor = BABYLON.Color3.FromHexString('#facc15').scale(0.42);
      column.material = mat;
      column.isPickable = false;
    }
  }

  if (showClock && EDA_STAGE_ORDER.indexOf(props.stage.stage) >= EDA_STAGE_ORDER.indexOf('cts')) {
    const y = spacing * Math.min(visibleLayers - 1, 7) + 0.1;
    const points = [new BABYLON.Vector3(-2.2, y, 0), new BABYLON.Vector3(0, y + 0.16, 0), new BABYLON.Vector3(2.2, y, 0)];
    const clock = BABYLON.MeshBuilder.CreateTube('clock-tree-highlight', { path: points, radius: 0.035, tessellation: 12 }, scene);
    const mat = createMat(scene, 'clock-tree-highlight-mat', '#22d3ee', 0.95);
    mat.emissiveColor = BABYLON.Color3.FromHexString('#22d3ee').scale(0.9);
    clock.material = mat;
  }

  if (showDrc && props.stage.stage === 'drc_lvs') {
    for (let marker = 0; marker < 18; marker += 1) {
      const cube = BABYLON.MeshBuilder.CreateBox(`drc-marker-${marker}`, { size: 0.12 }, scene);
      cube.position = new BABYLON.Vector3(-2 + (marker % 6) * 0.8, spacing * (1 + (marker % Math.max(1, visibleLayers - 1))), -1 + Math.floor(marker / 6) * 0.9);
      const mat = createMat(scene, `drc-marker-${marker}-mat`, '#ef4444', 0.92);
      mat.emissiveColor = BABYLON.Color3.FromHexString('#ef4444').scale(0.85);
      cube.material = mat;
      cube.metadata = { id: `M${marker + 1}-SPACING`, type: 'drc-marker', rule: 'M2.S.14 min spacing', stage: 'drc_lvs' };
      cube.isPickable = true;
      scene.onBeforeRenderObservable.add(() => {
        cube.visibility = 0.35 + Math.abs(Math.sin(performance.now() / 180 + marker)) * 0.65;
      });
    }
  }

  scene.onPointerObservable.add((info) => {
    if (info.type === BABYLON.PointerEventTypes.POINTERPICK) props.onSelectStage(props.stage.stage);
  });

  const title = BABYLON.MeshBuilder.CreatePlane('layer-title', { width: 4.4, height: 0.48 }, scene);
  title.position = new BABYLON.Vector3(0, spacing * visibleLayers + 0.5, -1.95);
  const texture = new BABYLON.DynamicTexture('layer-title-texture', { width: 768, height: 120 }, scene, false);
  texture.hasAlpha = true;
  texture.drawText(`${EDA_STAGE_DEFINITIONS[props.stage.stage].label} | ${visibleLayers} layers`, 24, 64, '700 30px Fira Code, monospace', '#f8fafc', 'transparent', true);
  const textMat = new BABYLON.StandardMaterial('layer-title-mat', scene);
  textMat.diffuseTexture = texture;
  textMat.opacityTexture = texture;
  textMat.emissiveColor = BABYLON.Color3.FromHexString('#22d3ee');
  textMat.disableLighting = true;
  title.material = textMat;
  title.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
  title.isPickable = false;

  const resize = () => engine.resize();
  window.addEventListener('resize', resize);
  const render = () => {
    if (!scene.isDisposed) scene.render();
  };
  engine.runRenderLoop(render);
  return () => {
    window.removeEventListener('resize', resize);
    engine.stopRenderLoop();
    if (!scene.isDisposed) scene.dispose();
    engine.dispose();
  };
}

export function ChipLayerScene(props: ChipLayerSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const webgl = useWebGLSupport();
  const [spread, setSpread] = useState(70);
  const [showVias, setShowVias] = useState(true);
  const [showDrc, setShowDrc] = useState(true);
  const [showClock, setShowClock] = useState(true);

  useEffect(() => {
    if (!canvasRef.current || !webgl.supported) return undefined;
    return createScene(canvasRef.current, props, spread, showDrc, showClock, showVias);
  }, [props, spread, showDrc, showClock, showVias, webgl.supported]);

  if (!webgl.supported) return <WebGLFallback />;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-xs text-[var(--sf-text-secondary)] lg:grid-cols-4">
        <label className="col-span-2 flex items-center gap-2 lg:col-span-1">Spread
          <input type="range" min={0} max={100} value={spread} onChange={(event) => setSpread(Number(event.target.value))} className="w-full" />
        </label>
        <label className="flex min-h-[44px] items-center gap-2"><input type="checkbox" checked={showVias} onChange={(event) => setShowVias(event.target.checked)} /> Vias</label>
        <label className="flex min-h-[44px] items-center gap-2"><input type="checkbox" checked={showDrc} onChange={(event) => setShowDrc(event.target.checked)} /> DRC</label>
        <label className="flex min-h-[44px] items-center gap-2"><input type="checkbox" checked={showClock} onChange={(event) => setShowClock(event.target.checked)} /> Clock tree</label>
      </div>
      <canvas ref={canvasRef} data-testid="chip-layer-canvas" aria-label="Babylon.js chip layer stack scene" className="h-[560px] w-full touch-none rounded-2xl border border-white/10 bg-slate-950 outline-none" />
    </div>
  );
}
