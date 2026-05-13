'use client';

import { useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import * as BABYLON from '@babylonjs/core';
import { WebGLFallback } from '@/components/three/WebGLFallback';
import { useWebGLSupport } from '@/hooks/use-webgl-support';
import type { FabProcess, ProcessId } from '@/lib/fab-process-data';

interface FabFloorSceneProps {
  processes: FabProcess[];
  selectedProcess: ProcessId | null;
  onSelectProcess: (id: ProcessId) => void;
  onClearSelection: () => void;
}

type SceneMeshMetadata = { processId?: ProcessId; type?: string };

const OVERVIEW = { alpha: -Math.PI / 2, beta: 0.92, radius: 34, target: new BABYLON.Vector3(0, 1.1, 0) };

function createPbr(scene: BABYLON.Scene, name: string, color: string, emissive = 0.14, roughness = 0.42, metallic = 0.26) {
  const material = new BABYLON.PBRMaterial(name, scene);
  material.albedoColor = BABYLON.Color3.FromHexString(color);
  material.emissiveColor = BABYLON.Color3.FromHexString(color).scale(emissive);
  material.roughness = roughness;
  material.metallic = metallic;
  return material;
}

function createHudMaterial(scene: BABYLON.Scene, name: string, color: string, alpha = 0.18) {
  const material = new BABYLON.StandardMaterial(name, scene);
  material.diffuseColor = BABYLON.Color3.FromHexString(color);
  material.emissiveColor = BABYLON.Color3.FromHexString(color).scale(0.38);
  material.alpha = alpha;
  material.backFaceCulling = false;
  return material;
}

function createLabel(scene: BABYLON.Scene, name: string, text: string, color: string) {
  const texture = new BABYLON.DynamicTexture(`${name}-texture`, { width: 768, height: 180 }, scene, false);
  texture.hasAlpha = true;
  texture.drawText(text, 24, 74, '700 32px Fira Code, monospace', '#f8fafc', 'transparent', true);
  const material = new BABYLON.StandardMaterial(`${name}-material`, scene);
  material.diffuseTexture = texture;
  material.opacityTexture = texture;
  material.emissiveColor = BABYLON.Color3.FromHexString(color);
  material.disableLighting = true;
  material.backFaceCulling = false;
  const plane = BABYLON.MeshBuilder.CreatePlane(name, { width: 4.4, height: 0.82 }, scene);
  plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
  plane.material = material;
  plane.isPickable = false;
  return plane;
}

function attachProcess(mesh: BABYLON.AbstractMesh, process: FabProcess, type: string) {
  mesh.metadata = { processId: process.id, type, id: mesh.id, processName: process.name } satisfies SceneMeshMetadata & Record<string, unknown>;
  mesh.isPickable = true;
}

function stationPosition(process: FabProcess) {
  return new BABYLON.Vector3(process.position[0], process.position[1], process.position[2]);
}

function createStationBase(scene: BABYLON.Scene, process: FabProcess, group: BABYLON.TransformNode) {
  const pad = BABYLON.MeshBuilder.CreateBox(`${process.id}-ground-pad`, { width: 7.8, height: 0.08, depth: 5.2 }, scene);
  pad.parent = group;
  pad.position.y = 0.04;
  pad.material = createHudMaterial(scene, `${process.id}-pad-mat`, process.color, process.id === 'implant' ? 0.32 : 0.18);
  attachProcess(pad, process, 'station-pad');

  const ring = BABYLON.MeshBuilder.CreateTorus(`${process.id}-status-ring`, { diameter: 4.4, thickness: 0.045, tessellation: 64 }, scene);
  ring.parent = group;
  ring.position.y = 0.12;
  ring.rotation.x = Math.PI / 2;
  ring.material = createPbr(scene, `${process.id}-ring-mat`, process.color, 0.8, 0.2, 0.08);
  ring.isPickable = false;
}

function createStationGeometry(scene: BABYLON.Scene, process: FabProcess, group: BABYLON.TransformNode) {
  const bodyMat = createPbr(scene, `${process.id}-body-mat`, '#cbd5e1', 0.05, 0.42, 0.36);
  const accentMat = createPbr(scene, `${process.id}-accent-mat`, process.color, process.alarms.length ? 0.9 : 0.42, 0.24, 0.2);

  const mkBox = (name: string, size: { width: number; height: number; depth: number }, pos: BABYLON.Vector3, mat: BABYLON.Material = bodyMat) => {
    const mesh = BABYLON.MeshBuilder.CreateBox(`${process.id}-${name}`, size, scene);
    mesh.parent = group;
    mesh.position = pos;
    mesh.material = mat;
    attachProcess(mesh, process, 'station-equipment');
    return mesh;
  };
  const mkCylinder = (name: string, opts: { height: number; diameter: number; tessellation?: number }, pos: BABYLON.Vector3, mat: BABYLON.Material = bodyMat) => {
    const mesh = BABYLON.MeshBuilder.CreateCylinder(`${process.id}-${name}`, { tessellation: 32, ...opts }, scene);
    mesh.parent = group;
    mesh.position = pos;
    mesh.material = mat;
    attachProcess(mesh, process, 'station-equipment');
    return mesh;
  };

  if (process.id === 'oxidation') {
    const tube = mkCylinder('furnace-tube', { height: 4.2, diameter: 1.1 }, new BABYLON.Vector3(0, 1.35, 0));
    tube.rotation.z = Math.PI / 2;
    for (let x = -1.6; x <= 1.6; x += 0.8) {
      const coil = BABYLON.MeshBuilder.CreateTorus(`${process.id}-coil-${x}`, { diameter: 1.2, thickness: 0.04, tessellation: 32 }, scene);
      coil.parent = group;
      coil.position = new BABYLON.Vector3(x, 1.35, 0);
      coil.rotation.y = Math.PI / 2;
      coil.material = accentMat;
      coil.isPickable = false;
    }
    mkBox('wafer-boat', { width: 2.8, height: 0.22, depth: 0.8 }, new BABYLON.Vector3(0, 0.72, -1.3), accentMat);
  } else if (process.id === 'lithography') {
    mkBox('scanner-body', { width: 3.7, height: 1.7, depth: 2.5 }, new BABYLON.Vector3(0, 1.05, 0));
    mkCylinder('illumination-column', { height: 2.2, diameter: 0.45 }, new BABYLON.Vector3(0.95, 2.7, -0.15), accentMat);
    mkBox('reticle-stage', { width: 1.9, height: 0.08, depth: 1.05 }, new BABYLON.Vector3(-0.55, 2.02, -0.85), accentMat);
    const laser = BABYLON.MeshBuilder.CreateLines(`${process.id}-laser-line`, { points: [new BABYLON.Vector3(0.95, 2.05, -0.15), new BABYLON.Vector3(-0.55, 1.28, -0.15)] }, scene);
    laser.parent = group;
    laser.color = BABYLON.Color3.FromHexString(process.color);
  } else if (process.id === 'etching') {
    mkCylinder('plasma-chamber', { height: 2.15, diameter: 2.35 }, new BABYLON.Vector3(0, 1.2, 0));
    const dome = BABYLON.MeshBuilder.CreateSphere(`${process.id}-dome`, { diameter: 2.35, segments: 32, slice: 0.5 }, scene);
    dome.parent = group;
    dome.position = new BABYLON.Vector3(0, 2.25, 0);
    dome.material = accentMat;
    attachProcess(dome, process, 'station-equipment');
    mkCylinder('gas-line-a', { height: 3.1, diameter: 0.12 }, new BABYLON.Vector3(-1.6, 1.7, 0), accentMat).rotation.z = Math.PI / 2;
  } else if (process.id === 'deposition') {
    mkCylinder('chamber-a', { height: 1.7, diameter: 1.55 }, new BABYLON.Vector3(-1.05, 1.0, 0));
    mkCylinder('chamber-b', { height: 1.7, diameter: 1.55 }, new BABYLON.Vector3(1.05, 1.0, 0));
    const shower = mkCylinder('showerhead', { height: 0.12, diameter: 2.8 }, new BABYLON.Vector3(0, 2.05, 0), accentMat);
    shower.rotation.x = Math.PI / 2;
    const plasma = BABYLON.MeshBuilder.CreateTorus(`${process.id}-plasma-ring`, { diameter: 2.8, thickness: 0.07, tessellation: 64 }, scene);
    plasma.parent = group;
    plasma.position = new BABYLON.Vector3(0, 1.92, 0);
    plasma.rotation.x = Math.PI / 2;
    plasma.material = accentMat;
  } else if (process.id === 'implant') {
    mkBox('beamline', { width: 4.8, height: 0.62, depth: 0.72 }, new BABYLON.Vector3(0, 1.25, 0), accentMat);
    const accel = mkCylinder('accelerator', { height: 2.8, diameter: 0.58 }, new BABYLON.Vector3(-1.35, 1.25, 0), accentMat);
    accel.rotation.z = Math.PI / 2;
    mkBox('endstation', { width: 1.35, height: 1.75, depth: 1.55 }, new BABYLON.Vector3(1.75, 1.2, 0));
  } else if (process.id === 'diffusion') {
    mkCylinder('vertical-furnace', { height: 2.9, diameter: 1.42 }, new BABYLON.Vector3(0, 1.65, 0));
    const quartz = mkCylinder('quartz-tube', { height: 2.4, diameter: 0.9 }, new BABYLON.Vector3(0, 1.65, 0), accentMat);
    quartz.visibility = 0.62;
    mkBox('thermal-controller', { width: 1.3, height: 1.2, depth: 0.7 }, new BABYLON.Vector3(1.55, 0.85, 0));
  } else if (process.id === 'cmp') {
    const platen = mkCylinder('platen', { height: 0.24, diameter: 2.7 }, new BABYLON.Vector3(0, 0.72, 0), accentMat);
    platen.rotation.x = Math.PI / 2;
    mkCylinder('polish-head', { height: 0.7, diameter: 1.3 }, new BABYLON.Vector3(0, 1.35, 0));
    mkBox('slurry-module', { width: 1.1, height: 1.4, depth: 1.1 }, new BABYLON.Vector3(-1.85, 0.9, 0));
  } else {
    mkBox('sputter-body', { width: 3.2, height: 1.8, depth: 2.1 }, new BABYLON.Vector3(0, 1.1, 0));
    const target = mkCylinder('target', { height: 0.16, diameter: 1.45 }, new BABYLON.Vector3(0, 2.1, -0.25), accentMat);
    target.rotation.x = Math.PI / 2;
    mkBox('wafer-chuck', { width: 1.6, height: 0.12, depth: 1.2 }, new BABYLON.Vector3(0, 1.55, 0.45), accentMat);
  }
}

function createStation(scene: BABYLON.Scene, process: FabProcess) {
  const group = new BABYLON.TransformNode(`${process.id}-station-node`, scene);
  group.position = stationPosition(process);
  group.metadata = { processId: process.id, type: 'station-node' } satisfies SceneMeshMetadata;
  createStationBase(scene, process, group);
  createStationGeometry(scene, process, group);
  const label = createLabel(scene, `${process.id}-label`, `${process.order}.${process.name.toUpperCase()}\n${process.nominalOee.toFixed(1)}% OEE | ${process.nominalWph} WPH`, process.color);
  label.parent = group;
  label.position.y = 3.55;
  const spot = new BABYLON.SpotLight(`${process.id}-spot`, group.position.add(new BABYLON.Vector3(0, 8, 0)), new BABYLON.Vector3(0, -1, 0), Math.PI / 3.5, 2, scene);
  spot.diffuse = BABYLON.Color3.FromHexString(process.color);
  spot.intensity = 0.32;
  return group;
}

function createConveyor(scene: BABYLON.Scene, processes: FabProcess[]) {
  const path = processes.map((process) => stationPosition(process).add(new BABYLON.Vector3(0, 0.25, 0)));
  const closed = [...path, path[0]];
  const rail = BABYLON.MeshBuilder.CreateTube('fab-process-conveyor-rail', { path: closed, radius: 0.08, tessellation: 14 }, scene);
  rail.material = createPbr(scene, 'conveyor-rail-mat', '#38bdf8', 0.32, 0.22, 0.48);
  rail.isPickable = false;
  const carriers = [0, 0.22, 0.43, 0.68, 0.86].map((offset, index) => {
    const carrier = BABYLON.MeshBuilder.CreateBox(`foup-carrier-${index + 1}`, { width: 0.72, height: 0.5, depth: 0.62 }, scene);
    carrier.material = createPbr(scene, `foup-carrier-${index + 1}-mat`, processes[index % processes.length].color, 0.52, 0.32, 0.18);
    carrier.isPickable = false;
    return { mesh: carrier, offset };
  });
  scene.onBeforeRenderObservable.add(() => {
    const t = (performance.now() / 18000) % 1;
    carriers.forEach(({ mesh, offset }) => {
      const progress = (t + offset) % 1;
      const segmentFloat = progress * processes.length;
      const index = Math.floor(segmentFloat) % processes.length;
      const next = (index + 1) % processes.length;
      const localT = segmentFloat - Math.floor(segmentFloat);
      mesh.position = BABYLON.Vector3.Lerp(path[index], path[next], localT).add(new BABYLON.Vector3(0, 0.38, 0));
      if (mesh.material instanceof BABYLON.PBRMaterial) {
        mesh.material.emissiveColor = BABYLON.Color3.Lerp(BABYLON.Color3.FromHexString(processes[index].color), BABYLON.Color3.FromHexString(processes[next].color), localT).scale(0.65);
      }
    });
  });
}

function animateCamera(camera: BABYLON.ArcRotateCamera, pose: typeof OVERVIEW) {
  const ease = new BABYLON.CubicEase();
  ease.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
  BABYLON.Animation.CreateAndStartAnimation('fab-camera-alpha', camera, 'alpha', 60, 45, camera.alpha, pose.alpha, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, ease);
  BABYLON.Animation.CreateAndStartAnimation('fab-camera-beta', camera, 'beta', 60, 45, camera.beta, pose.beta, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, ease);
  BABYLON.Animation.CreateAndStartAnimation('fab-camera-radius', camera, 'radius', 60, 45, camera.radius, pose.radius, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, ease);
  BABYLON.Animation.CreateAndStartAnimation('fab-camera-target', camera, 'target', 60, 45, camera.target.clone(), pose.target, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, ease);
}

function updateSelection(scene: BABYLON.Scene, camera: BABYLON.ArcRotateCamera, props: FabFloorSceneProps) {
  const selected = props.selectedProcess;
  props.processes.forEach((process) => {
    scene.meshes.forEach((mesh) => {
      const metadata = mesh.metadata as SceneMeshMetadata | undefined;
      if (metadata?.processId !== process.id) return;
      const selectedScale = selected === process.id ? 1 : selected ? 0.3 : 0.72;
      if (mesh.material instanceof BABYLON.PBRMaterial) {
        mesh.material.emissiveColor = BABYLON.Color3.FromHexString(process.color).scale(process.alarms.length ? 0.78 : selectedScale * 0.5);
      }
      mesh.visibility = selected && selected !== process.id && metadata.type !== 'station-pad' ? 0.42 : 1;
    });
  });
  const selectedProcess = props.processes.find((process) => process.id === selected);
  const desiredTarget = selectedProcess ? stationPosition(selectedProcess).add(new BABYLON.Vector3(0, 1.1, 0)) : OVERVIEW.target;
  const desiredRadius = selectedProcess ? 10 : OVERVIEW.radius;
  if (!camera.target.equalsWithEpsilon(desiredTarget, 0.2) || Math.abs(camera.radius - desiredRadius) > 0.4) {
    animateCamera(camera, { ...OVERVIEW, radius: desiredRadius, target: desiredTarget });
  }
}

function createScene(canvas: HTMLCanvasElement, propsRef: MutableRefObject<FabFloorSceneProps>) {
  const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, antialias: true });
  engine.setHardwareScalingLevel(window.devicePixelRatio > 1 ? 1.25 : 1);
  const scene = new BABYLON.Scene(engine, { useGeometryUniqueIdsMap: true, useMaterialMeshMap: true, useClonedMeshMap: true });
  scene.clearColor = new BABYLON.Color4(0.01, 0.018, 0.05, 1);

  const camera = new BABYLON.ArcRotateCamera('FAB-PROCESS-CAMERA', OVERVIEW.alpha, OVERVIEW.beta, OVERVIEW.radius, OVERVIEW.target, scene);
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 8;
  camera.upperRadiusLimit = 42;
  camera.lowerBetaLimit = 0.56;
  camera.upperBetaLimit = 1.26;
  camera.wheelPrecision = 48;

  const hemi = new BABYLON.HemisphericLight('FAB-AMBIENT', new BABYLON.Vector3(0, 1, 0), scene);
  hemi.intensity = 0.15;
  const rim = new BABYLON.DirectionalLight('FAB-RIM', new BABYLON.Vector3(-0.4, -0.8, -0.35), scene);
  rim.position = new BABYLON.Vector3(0, 12, 12);
  rim.intensity = 0.52;

  const floor = BABYLON.MeshBuilder.CreateGround('FAB-HEX-GRID-FLOOR', { width: 42, height: 27, subdivisions: 36 }, scene);
  floor.material = createHudMaterial(scene, 'fab-grid-floor-mat', '#0f172a', 0.95);
  floor.isPickable = false;

  propsRef.current.processes.forEach((process) => createStation(scene, process));
  createConveyor(scene, propsRef.current.processes);

  const glow = new BABYLON.GlowLayer('fab-process-glow', scene, { blurKernelSize: 32 });
  glow.intensity = 0.62;

  const pipeline = new BABYLON.DefaultRenderingPipeline('fab-process-pipeline', true, scene, [camera]);
  pipeline.fxaaEnabled = true;
  pipeline.bloomEnabled = true;
  pipeline.bloomThreshold = 0.78;
  pipeline.bloomWeight = 0.32;
  pipeline.grainEnabled = true;
  pipeline.grain.intensity = 4;
  pipeline.chromaticAberrationEnabled = true;
  pipeline.chromaticAberration.aberrationAmount = 8;

  scene.onPointerObservable.add((info) => {
    if (info.type !== BABYLON.PointerEventTypes.POINTERPICK) return;
    const metadata = info.pickInfo?.pickedMesh?.metadata as SceneMeshMetadata | undefined;
    if (metadata?.processId) propsRef.current.onSelectProcess(metadata.processId);
  });

  const keyHandler = (event: KeyboardEvent) => {
    if (event.key === 'Escape') propsRef.current.onClearSelection();
  };
  const resize = () => engine.resize();
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    window.removeEventListener('resize', resize);
    window.removeEventListener('pagehide', dispose);
    window.removeEventListener('keydown', keyHandler);
    engine.stopRenderLoop();
    if (!scene.isDisposed) scene.dispose();
    engine.dispose();
  };
  window.addEventListener('resize', resize);
  window.addEventListener('pagehide', dispose);
  window.addEventListener('keydown', keyHandler);
  engine.runRenderLoop(() => {
    if (!disposed && !scene.isDisposed) {
      updateSelection(scene, camera, propsRef.current);
      scene.render();
    }
  });
  return dispose;
}

export function FabFloorScene(props: FabFloorSceneProps) {
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const propsRef = useRef(props);
  const webgl = useWebGLSupport();

  useEffect(() => {
    setMounted(true);
    propsRef.current = props;
  });

  useEffect(() => {
    if (!canvasRef.current || !webgl.supported) return undefined;
    return createScene(canvasRef.current, propsRef);
  }, [webgl.supported]);

  if (!mounted) {
    return <div className="flex h-full min-h-[720px] w-full items-center justify-center bg-[var(--sf-bg-canvas)] text-sm text-[var(--sf-text-secondary)]">Initializing Babylon.js fab floor...</div>;
  }

  if (!webgl.supported) return <WebGLFallback />;

  return <canvas ref={canvasRef} data-testid="fab-floor-babylon-canvas" aria-label="Babylon.js 8 process semiconductor fab floor" className="h-full min-h-[720px] w-full touch-none outline-none" />;
}
