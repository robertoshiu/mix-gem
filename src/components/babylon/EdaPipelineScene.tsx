'use client';

import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import * as BABYLON from '@babylonjs/core';
import { WebGLFallback } from '@/components/three/WebGLFallback';
import { useWebGLSupport } from '@/hooks/use-webgl-support';
import { EDA_STAGE_DEFINITIONS, EDA_STAGE_ORDER } from '@/lib/eda-mock-data';
import type { EdaStage, StageState } from '@/lib/eda-types';

interface EdaPipelineSceneProps {
  stages: StageState[];
  selectedStage: EdaStage;
  onSelectStage: (stage: EdaStage) => void;
}

function createPbr(scene: BABYLON.Scene, name: string, color: string, roughness = 0.46, metalness = 0.24) {
  const material = new BABYLON.PBRMaterial(name, scene);
  material.albedoColor = BABYLON.Color3.FromHexString(color);
  material.emissiveColor = BABYLON.Color3.FromHexString(color).scale(0.1);
  material.roughness = roughness;
  material.metallic = metalness;
  return material;
}

function createLabel(scene: BABYLON.Scene, name: string, text: string, color: string) {
  const texture = new BABYLON.DynamicTexture(`${name}-texture`, { width: 640, height: 150 }, scene, false);
  texture.hasAlpha = true;
  texture.drawText(text, 26, 70, '700 30px Fira Code, monospace', '#f8fafc', 'transparent', true);
  const material = new BABYLON.StandardMaterial(`${name}-mat`, scene);
  material.diffuseTexture = texture;
  material.opacityTexture = texture;
  material.emissiveColor = BABYLON.Color3.FromHexString(color);
  material.disableLighting = true;
  material.backFaceCulling = false;
  const plane = BABYLON.MeshBuilder.CreatePlane(name, { width: 3.4, height: 0.7 }, scene);
  plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
  plane.material = material;
  plane.isPickable = false;
  return plane;
}

function stagePosition(index: number) {
  const row = index % 2 === 0 ? -2.2 : 2.2;
  return new BABYLON.Vector3(-10.5 + index * 3, 0.35, row);
}

function createBay(scene: BABYLON.Scene, stage: StageState, selectedStage: EdaStage) {
  const definition = EDA_STAGE_DEFINITIONS[stage.stage];
  const index = EDA_STAGE_ORDER.indexOf(stage.stage);
  const group = new BABYLON.TransformNode(`${stage.stage}-node`, scene);
  group.position = stagePosition(index);

  const statusColor = stage.status === 'failed' ? '#ef4444' : stage.status === 'warning' ? '#f59e0b' : stage.status === 'completed' ? '#22c55e' : definition.color;
  const base = BABYLON.MeshBuilder.CreateBox(`${stage.stage}-bay`, { width: 2.25, height: 0.34, depth: 1.8 }, scene);
  base.parent = group;
  base.material = createPbr(scene, `${stage.stage}-base-mat`, selectedStage === stage.stage ? '#F47920' : '#334155', 0.54, 0.18);
  base.metadata = { id: stage.stage, type: 'eda-stage-bay', stage: stage.stage, label: definition.label, progress: stage.progress };
  base.isPickable = true;

  const tool = BABYLON.MeshBuilder.CreateBox(`${stage.stage}-tool`, { width: 1.42, height: 0.92, depth: 1.08 }, scene);
  tool.parent = group;
  tool.position.y = 0.62;
  const toolMat = createPbr(scene, `${stage.stage}-tool-mat`, '#cbd5e1', 0.36, 0.38);
  toolMat.emissiveColor = BABYLON.Color3.FromHexString(statusColor).scale(stage.status === 'running' ? 0.45 : 0.16);
  tool.material = toolMat;
  tool.metadata = base.metadata;
  tool.isPickable = true;

  const progress = BABYLON.MeshBuilder.CreateBox(`${stage.stage}-progress`, { width: 1.75, height: 0.08, depth: 0.12 }, scene);
  progress.parent = group;
  progress.scaling.x = Math.max(stage.progress, 2) / 100;
  progress.position = new BABYLON.Vector3(-0.88 + (1.75 * Math.max(stage.progress, 2) / 100) / 2, 1.14, -0.63);
  const progressMat = createPbr(scene, `${stage.stage}-progress-mat`, statusColor, 0.18, 0.1);
  progressMat.emissiveColor = BABYLON.Color3.FromHexString(statusColor).scale(0.8);
  progress.material = progressMat;
  progress.isPickable = false;

  if (stage.status === 'running' || stage.status === 'warning') {
    const pulse = BABYLON.MeshBuilder.CreateTorus(`${stage.stage}-pulse`, { diameter: 1.9, thickness: 0.035, tessellation: 48 }, scene);
    pulse.parent = group;
    pulse.position.y = 1.18;
    pulse.rotation.x = Math.PI / 2;
    const pulseMat = createPbr(scene, `${stage.stage}-pulse-mat`, statusColor, 0.16, 0.06);
    pulseMat.emissiveColor = BABYLON.Color3.FromHexString(statusColor).scale(0.9);
    pulse.material = pulseMat;
    pulse.isPickable = false;
    scene.onBeforeRenderObservable.add(() => {
      const t = Math.abs(Math.sin(performance.now() / 280));
      pulse.scaling = new BABYLON.Vector3(1 + t * 0.16, 1 + t * 0.16, 1 + t * 0.16);
      pulse.visibility = 0.45 + t * 0.55;
    });
  }

  const label = createLabel(scene, `${stage.stage}-label`, `${definition.shortLabel} ${Math.round(stage.progress)}%`, statusColor);
  label.parent = group;
  label.position.y = 1.65;
}

function createConveyors(scene: BABYLON.Scene, propsRef: MutableRefObject<EdaPipelineSceneProps>) {
  for (let index = 0; index < EDA_STAGE_ORDER.length - 1; index += 1) {
    const from = stagePosition(index).add(new BABYLON.Vector3(1.15, 0.18, 0));
    const to = stagePosition(index + 1).add(new BABYLON.Vector3(-1.15, 0.18, 0));
    const line = BABYLON.MeshBuilder.CreateLines(`eda-conveyor-${index}`, { points: [from, to] }, scene);
    line.color = BABYLON.Color3.FromHexString('#38bdf8');
    line.metadata = { id: line.name, type: 'eda-conveyor' };
  }

  const packet = BABYLON.MeshBuilder.CreateSphere('eda-data-packet', { diameter: 0.24, segments: 18 }, scene);
  const packetMat = createPbr(scene, 'eda-data-packet-mat', '#22d3ee', 0.16, 0.08);
  packetMat.emissiveColor = packetMat.albedoColor.scale(0.9);
  packet.material = packetMat;
  packet.isPickable = false;
  scene.onBeforeRenderObservable.add(() => {
    const activeIndex = Math.max(0, propsRef.current.stages.findIndex((stage) => stage.status === 'running'));
    const from = stagePosition(activeIndex);
    const to = stagePosition(Math.min(EDA_STAGE_ORDER.length - 1, activeIndex + 1));
    const t = (Math.sin(performance.now() / 600) + 1) / 2;
    packet.position = BABYLON.Vector3.Lerp(from, to, t).add(new BABYLON.Vector3(0, 1.45, 0));
  });
}

function updateScene(scene: BABYLON.Scene, props: EdaPipelineSceneProps) {
  props.stages.forEach((stage) => {
    const progress = scene.getMeshByName(`${stage.stage}-progress`);
    if (progress) {
      const width = 1.75 * Math.max(stage.progress, 2) / 100;
      progress.scaling.x = Math.max(stage.progress, 2) / 100;
      progress.position.x = -0.88 + width / 2;
    }
    const base = scene.getMeshByName(`${stage.stage}-bay`);
    const material = base?.material;
    if (material instanceof BABYLON.PBRMaterial) {
      material.albedoColor = BABYLON.Color3.FromHexString(props.selectedStage === stage.stage ? '#F47920' : '#334155');
    }
  });
}

function createScene(canvas: HTMLCanvasElement, propsRef: MutableRefObject<EdaPipelineSceneProps>) {
  const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, antialias: true });
  engine.setHardwareScalingLevel(window.devicePixelRatio > 1 ? 1.2 : 1);
  const scene = new BABYLON.Scene(engine, { useGeometryUniqueIdsMap: true, useMaterialMeshMap: true, useClonedMeshMap: true });
  scene.clearColor = new BABYLON.Color4(0.01, 0.025, 0.08, 1);

  const camera = new BABYLON.ArcRotateCamera('EDA-ISO-CAMERA', -Math.PI / 2, 0.96, 17.5, new BABYLON.Vector3(0, 0.6, 0), scene);
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 14;
  camera.upperRadiusLimit = 20;
  camera.upperBetaLimit = 1.22;
  camera.lowerBetaLimit = 0.68;
  camera.wheelPrecision = 58;

  const hemi = new BABYLON.HemisphericLight('EDA-AMBIENT', new BABYLON.Vector3(0, 1, 0), scene);
  hemi.intensity = 0.74;
  const rim = new BABYLON.DirectionalLight('EDA-RIM', new BABYLON.Vector3(-0.4, -0.9, -0.35), scene);
  rim.position = new BABYLON.Vector3(4, 9, 5);
  rim.intensity = 0.42;

  const floor = BABYLON.MeshBuilder.CreateGround('EDA-CLEANROOM-GRID', { width: 26, height: 9, subdivisions: 24 }, scene);
  floor.material = createPbr(scene, 'eda-grid-mat', '#0f172a', 0.7, 0.1);
  floor.isPickable = false;
  propsRef.current.stages.forEach((stage) => createBay(scene, stage, propsRef.current.selectedStage));
  createConveyors(scene, propsRef);

  scene.onPointerObservable.add((info) => {
    if (info.type !== BABYLON.PointerEventTypes.POINTERPICK) return;
    const metadata = info.pickInfo?.pickedMesh?.metadata as { stage?: EdaStage } | undefined;
    if (metadata?.stage) propsRef.current.onSelectStage(metadata.stage);
  });

  const resize = () => engine.resize();
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    window.removeEventListener('resize', resize);
    window.removeEventListener('pagehide', dispose);
    engine.stopRenderLoop();
    if (!scene.isDisposed) scene.dispose();
    engine.dispose();
  };
  window.addEventListener('resize', resize);
  window.addEventListener('pagehide', dispose);
  const render = () => {
    if (!disposed && !scene.isDisposed) {
      updateScene(scene, propsRef.current);
      scene.render();
    }
  };
  engine.runRenderLoop(render);
  return dispose;
}

export function EdaPipelineScene(props: EdaPipelineSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const propsRef = useRef(props);
  const webgl = useWebGLSupport();
  propsRef.current = props;

  useEffect(() => {
    if (!canvasRef.current || !webgl.supported) return undefined;
    return createScene(canvasRef.current, propsRef);
  }, [webgl.supported]);

  if (!webgl.supported) return <WebGLFallback />;

  return <canvas ref={canvasRef} data-testid="eda-pipeline-canvas" aria-label="Babylon.js EDA pipeline factory scene" className="h-full min-h-[720px] w-full touch-none outline-none" />;
}
