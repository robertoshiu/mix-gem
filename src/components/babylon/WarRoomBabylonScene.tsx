'use client';

import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { WebGLFallback } from '@/components/three/WebGLFallback';
import { useWebGLSupport } from '@/hooks/use-webgl-support';
import '@babylonjs/loaders/glTF';
import type { FabTwinFaultId, FabTwinMode, FabTwinView, Subsystem, WarRoomLayer } from '@/lib/fab-twin-data';
import {
  FAB_TWIN_SENSORS,
  FAB_TWIN_TOOLS,
  SUBSYSTEM_EQUIPMENT,
  SUBSYSTEM_LAYERS,
  getFaultScene,
} from '@/lib/fab-twin-data';
import { loadInfrastructureAssets, SUBSYSTEM_ASSET_MAP } from '@/lib/infrastructure-assets';

export interface WarRoomPickedAsset {
  id: string;
  path: string;
  type: string;
  metadata: unknown;
}

interface WarRoomBabylonSceneProps {
  view: FabTwinView;
  mode: FabTwinMode;
  faultId: FabTwinFaultId;
  activeSubsystem: Subsystem | null;
  focusAssetId: string | null;
  onAssetPick: (asset: WarRoomPickedAsset, screenPos: { x: number; y: number }) => void;
}

type CameraPose = { alpha: number; beta: number; radius: number; target: BABYLON.Vector3 };

const CAMERA_POSES: Record<FabTwinView, CameraPose> = {
  overview: { alpha: -Math.PI / 2, beta: 0.82, radius: 34, target: new BABYLON.Vector3(0, 0.7, -1.6) },
  operator: { alpha: -1.35, beta: 1.14, radius: 17, target: new BABYLON.Vector3(-6.4, 1.3, -2.6) },
  maintenance: { alpha: -0.72, beta: 1.08, radius: 16, target: new BABYLON.Vector3(5.8, 1.2, -1.6) },
  'pipe-rack': { alpha: -0.08, beta: 0.96, radius: 19, target: new BABYLON.Vector3(0, 2.8, 6.1) },
  'control-room': { alpha: -2.24, beta: 1.15, radius: 14, target: new BABYLON.Vector3(-9.8, 1.3, -8.7) },
};

const SUBSYSTEM_VIEWS: Record<Subsystem, FabTwinView> = {
  power: 'control-room',
  bas: 'pipe-rack',
  gas: 'pipe-rack',
  fire: 'control-room',
};

const ZONE_COLORS = ['#38bdf8', '#22c55e', '#f59e0b', '#a78bfa'];

function createPbr(scene: BABYLON.Scene, name: string, color: string, roughness = 0.45, metalness = 0.28) {
  const material = new BABYLON.PBRMaterial(name, scene);
  material.albedoColor = BABYLON.Color3.FromHexString(color);
  material.emissiveColor = BABYLON.Color3.FromHexString(color).scale(0.12);
  material.roughness = roughness;
  material.metallic = metalness;
  return material;
}

function isWireframeMaterial(material: BABYLON.Material): material is BABYLON.StandardMaterial | BABYLON.PBRMaterial {
  return material instanceof BABYLON.StandardMaterial || material instanceof BABYLON.PBRMaterial;
}

function createHudMaterial(scene: BABYLON.Scene, name: string, color: string, alpha: number) {
  const material = new BABYLON.StandardMaterial(name, scene);
  material.diffuseColor = BABYLON.Color3.FromHexString(color);
  material.emissiveColor = BABYLON.Color3.FromHexString(color).scale(0.42);
  material.alpha = alpha;
  material.backFaceCulling = false;
  return material;
}

function getLayers(id: string): WarRoomLayer[] {
  return SUBSYSTEM_LAYERS[id] ?? ['environment'];
}

function attachMetadata(
  mesh: BABYLON.AbstractMesh,
  id: string,
  path: string,
  type: string,
  layers: WarRoomLayer[],
  metadata: object,
) {
  mesh.id = id;
  mesh.name = id;
  mesh.metadata = { ...metadata, id, path, type, layers };
  mesh.isPickable = true;
}

function createLabel(scene: BABYLON.Scene, name: string, text: string, color: string, width = 3.8, height = 0.7) {
  const texture = new BABYLON.DynamicTexture(`${name}-texture`, { width: 768, height: 160 }, scene, false);
  texture.hasAlpha = true;
  texture.drawText(text, 28, 74, '600 32px Fira Code, monospace', '#f8fafc', 'transparent', true);
  const material = new BABYLON.StandardMaterial(`${name}-material`, scene);
  material.diffuseTexture = texture;
  material.opacityTexture = texture;
  material.emissiveColor = BABYLON.Color3.FromHexString(color);
  material.disableLighting = true;
  material.backFaceCulling = false;
  const plane = BABYLON.MeshBuilder.CreatePlane(name, { width, height }, scene);
  plane.material = material;
  plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
  plane.isPickable = false;
  return plane;
}

function createTube(scene: BABYLON.Scene, id: string, path: string, points: BABYLON.Vector3[], color: string, layers: WarRoomLayer[]) {
  const tube = BABYLON.MeshBuilder.CreateTube(id, { path: points, radius: 0.08, tessellation: 16 }, scene);
  tube.material = createPbr(scene, `${id}-mat`, color, 0.24, 0.72);
  attachMetadata(tube, id, path, 'pipe-run', layers, { colorCode: color, valveNodes: [`${id}-VLV-01`, `${id}-VLV-02`] });
  return tube;
}

function createFactoryEnvelope(scene: BABYLON.Scene) {
  const ground = BABYLON.MeshBuilder.CreateGround('NEON-GRID-FLOOR', { width: 32, height: 22, subdivisions: 48 }, scene);
  const groundMaterial = createHudMaterial(scene, 'neon-grid-floor-mat', '#0f172a', 0.96);
  groundMaterial.emissiveColor = BABYLON.Color3.FromHexString('#22d3ee').scale(0.08);
  ground.material = groundMaterial;
  attachMetadata(ground, 'NEON-GRID-FLOOR', '/FAB1/SCENE/ENVIRONMENT/FLOOR', 'environment-grid', ['environment'], { scanPulse: '3s center wave' });

  const wallMat = createHudMaterial(scene, 'holographic-wall-mat', '#38bdf8', 0.15);
  const walls = [
    ['WALL-NORTH-HOLO', 0, 2.2, -11, 32, 4.4, 0.14],
    ['WALL-SOUTH-HOLO', 0, 2.2, 9.2, 32, 4.4, 0.14],
    ['WALL-WEST-HOLO', -16, 2.2, -1, 0.14, 4.4, 20.4],
    ['WALL-EAST-HOLO', 16, 2.2, -1, 0.14, 4.4, 20.4],
  ] as const;
  walls.forEach(([id, x, y, z, width, height, depth]) => {
    const wall = BABYLON.MeshBuilder.CreateBox(id, { width, height, depth }, scene);
    wall.position = new BABYLON.Vector3(x, y, z);
    wall.material = wallMat;
    attachMetadata(wall, id, `/FAB1/SCENE/ENVIRONMENT/${id}`, 'holographic-wall', ['environment'], { alpha: 0.15, pattern: 'hex' });
  });

  const outlinePoints = [
    new BABYLON.Vector3(-15.6, 0.04, -10.6),
    new BABYLON.Vector3(15.6, 0.04, -10.6),
    new BABYLON.Vector3(15.6, 0.04, 8.8),
    new BABYLON.Vector3(-15.6, 0.04, 8.8),
    new BABYLON.Vector3(-15.6, 0.04, -10.6),
  ];
  const outline = BABYLON.MeshBuilder.CreateLines('DOUBLE-LINE-FLOOR-OUTLINE', { points: outlinePoints }, scene);
  outline.color = BABYLON.Color3.FromHexString('#22d3ee');
  outline.metadata = { id: 'DOUBLE-LINE-FLOOR-OUTLINE', path: '/FAB1/SCENE/ENVIRONMENT/FLOOR_OUTLINE', type: 'animated-dash-outline', layers: ['environment'] };

  const ffuMaster = BABYLON.MeshBuilder.CreateBox('FFU-MASTER-LOD0', { width: 1.7, height: 0.12, depth: 1.7 }, scene);
  ffuMaster.material = createPbr(scene, 'war-room-ffu-pbr', '#e2e8f0', 0.34, 0.42);
  ffuMaster.isVisible = false;
  attachMetadata(ffuMaster, 'FFU-MASTER-LOD0', '/FAB1/L1/CEILING/FFU/MASTER', 'shared-ffu-master', ['environment', 'bas'], { filterType: 'HEPA/ULPA selectable' });
  let index = 0;
  for (let x = -14; x <= 14; x += 3.5) {
    for (let z = -10; z <= 7; z += 3.4) {
      const instance = ffuMaster.createInstance(`FFU-${String(index + 1).padStart(3, '0')}`);
      instance.position = new BABYLON.Vector3(x, 4.65, z);
      instance.metadata = { id: instance.name, path: `/FAB1/L1/CEILING/FFU/${instance.name}`, type: 'ffu-instance', layers: ['environment', 'bas'], airflow: 'downflow' };
      index += 1;
    }
  }
}

function createProcessTools(scene: BABYLON.Scene) {
  FAB_TWIN_TOOLS.forEach((tool) => {
    const group = new BABYLON.TransformNode(`${tool.tool_id}-node`, scene);
    group.position = new BABYLON.Vector3(...tool.positionM);
    group.metadata = { ...tool, id: `${tool.tool_id}-node`, path: tool.path, type: 'process-tool-node', layers: ['process'] };

    const body = BABYLON.MeshBuilder.CreateBox(tool.tool_id, { width: tool.sizeM[0], height: tool.sizeM[1], depth: tool.sizeM[2] }, scene);
    body.parent = group;
    body.position.y = tool.sizeM[1] / 2;
    const bodyMat = createPbr(scene, `${tool.tool_id}-body-mat`, tool.heroAsset ? '#dbeafe' : '#cbd5e1', 0.42, 0.36);
    bodyMat.emissiveColor = BABYLON.Color3.FromHexString(tool.color).scale(tool.heroAsset ? 0.22 : 0.12);
    body.material = bodyMat;
    attachMetadata(body, tool.tool_id, tool.path, 'process-tool', ['process'], tool);

    const port = BABYLON.MeshBuilder.CreateBox(`${tool.tool_id}-load-port`, { width: tool.sizeM[0] * 0.48, height: 0.36, depth: 0.56 }, scene);
    port.parent = group;
    port.position = new BABYLON.Vector3(0, 0.52, -tool.sizeM[2] / 2 - 0.24);
    port.material = createPbr(scene, `${tool.tool_id}-port-mat`, tool.color, 0.3, 0.28);
    attachMetadata(port, `${tool.tool_id}-load-port`, `${tool.path}/INTERACTIVE/LOAD_PORT`, 'interactive-load-port', ['process'], { state: 'ready' });

    const panel = BABYLON.MeshBuilder.CreateBox(`${tool.tool_id}-service-panel`, { width: tool.sizeM[0] * 0.48, height: tool.sizeM[1] * 0.66, depth: 0.08 }, scene);
    panel.parent = group;
    panel.position = new BABYLON.Vector3(tool.sizeM[0] / 2 + 0.06, tool.sizeM[1] * 0.58, 0);
    panel.material = createPbr(scene, `${tool.tool_id}-service-mat`, tool.color, 0.34, 0.3);
    attachMetadata(panel, `${tool.tool_id}-door-panel`, `${tool.path}/INTERACTIVE/SERVICE_DOOR`, 'door-open-panel', ['process'], { serviceSide: tool.serviceSide });

    const label = createLabel(scene, `${tool.tool_id}-label`, `${tool.tool_id}\n${tool.status_tags[0]}`, tool.color, 3.9, 0.8);
    label.parent = group;
    label.position.y = tool.sizeM[1] + 0.74;
  });
}

function createSubsystemEquipment(scene: BABYLON.Scene, faultId: FabTwinFaultId) {
  SUBSYSTEM_EQUIPMENT.forEach((equipment) => {
    const mesh = equipment.type === 'scrubber'
      ? BABYLON.MeshBuilder.CreateCylinder(equipment.id, { height: equipment.sizeM[1], diameter: equipment.sizeM[0], tessellation: 28 }, scene)
      : BABYLON.MeshBuilder.CreateBox(equipment.id, { width: equipment.sizeM[0], height: equipment.sizeM[1], depth: equipment.sizeM[2] }, scene);
    mesh.position = new BABYLON.Vector3(...equipment.positionM);
    const material = createPbr(scene, `${equipment.id}-mat`, equipment.color, 0.3, 0.46);
    const isFaultedGas = faultId === 'toxic-gas-alarm' && equipment.subsystem === 'gas';
    material.emissiveColor = BABYLON.Color3.FromHexString(isFaultedGas ? '#ef4444' : equipment.color).scale(isFaultedGas ? 0.75 : 0.22);
    mesh.material = material;
    attachMetadata(mesh, equipment.id, equipment.path, equipment.type, [equipment.subsystem], equipment);

    const led = BABYLON.MeshBuilder.CreateSphere(`${equipment.id}-LED`, { diameter: 0.18, segments: 12 }, scene);
    led.position = mesh.position.add(new BABYLON.Vector3(0, equipment.sizeM[1] / 2 + 0.2, 0));
    led.material = createPbr(scene, `${equipment.id}-led-mat`, isFaultedGas ? '#ef4444' : '#22c55e', 0.18, 0.1);
    led.isPickable = false;
  });

  createTube(scene, 'PIPE-CW-SUPPLY-L2', '/FAB1/L1/CHASE/PIPE_RACK/PIPE-CW-SUPPLY-L2', [new BABYLON.Vector3(-14, 2.75, 6.0), new BABYLON.Vector3(14, 2.75, 6.0)], '#3b82f6', ['bas']);
  createTube(scene, 'PIPE-CW-RETURN-L2', '/FAB1/L1/CHASE/PIPE_RACK/PIPE-CW-RETURN-L2', [new BABYLON.Vector3(-14, 3.1, 6.25), new BABYLON.Vector3(14, 3.1, 6.25)], '#60a5fa', ['bas']);
  createTube(scene, 'PIPE-EXHAUST-L3', '/FAB1/L1/CHASE/PIPE_RACK/PIPE-EXHAUST-L3', [new BABYLON.Vector3(-14, 3.55, 6.5), new BABYLON.Vector3(14, 3.55, 6.5)], '#f97316', ['gas']);
  createTube(scene, 'PIPE-GAS-N2-L1', '/FAB1/L1/CHASE/PIPE_RACK/PIPE-GAS-N2-L1', [new BABYLON.Vector3(-14, 2.25, 6.75), new BABYLON.Vector3(14, 2.25, 6.75)], '#facc15', ['gas']);
  createTube(scene, 'PIPE-FIRE-L1', '/FAB1/L1/CHASE/PIPE_RACK/PIPE-FIRE-L1', [new BABYLON.Vector3(-14, 1.85, 7.0), new BABYLON.Vector3(14, 1.85, 7.0)], '#ef4444', ['fire']);
  createTube(scene, 'REDUNDANT-POWER-PATH-A', '/FAB1/L1/UTILITY_ROOM/POWER/REDUNDANT-POWER-PATH-A', [new BABYLON.Vector3(12, 1.8, -7.8), new BABYLON.Vector3(8, 1.8, -2.8)], '#60a5fa', ['power']);
  createTube(scene, 'FIRE-SUPPRESSION-RING', '/FAB1/L1/CEILING/FIRE/FIRE-SUPPRESSION-RING', [new BABYLON.Vector3(-11, 4.15, -8), new BABYLON.Vector3(12, 4.15, -8), new BABYLON.Vector3(12, 4.15, 4), new BABYLON.Vector3(-11, 4.15, 4), new BABYLON.Vector3(-11, 4.15, -8)], '#ef4444', ['fire']);
}

/**
 * Background GLB upgrade: loads infrastructure GLBs and swaps procedural meshes.
 * Preserves existing metadata, LED indicators, and layer assignments.
 */
async function upgradeSubsystemWithGLB(scene: BABYLON.Scene, faultId: FabTwinFaultId): Promise<void> {
  try {
    const cache = await loadInfrastructureAssets(scene);
    if (scene.isDisposed) { cache.dispose(); return; }

    for (const equipment of SUBSYSTEM_EQUIPMENT) {
      const assetType = SUBSYSTEM_ASSET_MAP[equipment.id];
      if (!assetType || !cache.containers.has(assetType)) continue;

      const existing = scene.getMeshByName(equipment.id);
      if (!existing) continue;

      // Place GLB instance at the equipment position
      const glbRoot = cache.placeInstance(
        assetType,
        `${equipment.id}-glb`,
        new BABYLON.Vector3(...equipment.positionM),
        scene,
      );

      // Apply scene's PBR style to GLB meshes (semi-transparent emissive)
      const isFaultedGas = faultId === 'toxic-gas-alarm' && equipment.subsystem === 'gas';
      const mat = createPbr(scene, `${equipment.id}-glb-mat`, equipment.color, 0.3, 0.46);
      mat.emissiveColor = BABYLON.Color3.FromHexString(
        isFaultedGas ? '#ef4444' : equipment.color,
      ).scale(isFaultedGas ? 0.75 : 0.22);
      for (const child of glbRoot.getChildMeshes()) {
        child.material = mat;
        attachMetadata(child, equipment.id, equipment.path, equipment.type, [equipment.subsystem], equipment);
      }

      // Hide procedural mesh, keep LED
      existing.isVisible = false;
    }
  } catch {
    // GLBs not available — procedural fallbacks remain visible
  }
}

function createSensors(scene: BABYLON.Scene, faultId: FabTwinFaultId) {
  FAB_TWIN_SENSORS.forEach((sensor) => {
    const layers = getLayers(sensor.sensor_id);
    const active =
      (faultId === 'toxic-gas-alarm' && sensor.sensor_type === 'gas_detection' && sensor.zoneId === 'zone-chase') ||
      (faultId === 'ffu-efficiency-loss' && sensor.sensor_type === 'particle_count' && sensor.zoneId === 'zone-bay-litho') ||
      (faultId === 'pressure-reversal' && sensor.sensor_type === 'differential_pressure');
    const color = active ? '#ef4444' : layers.includes('gas') ? '#f59e0b' : layers.includes('power') ? '#60a5fa' : layers.includes('bas') ? '#10b981' : '#94a3b8';
    const sphere = BABYLON.MeshBuilder.CreateSphere(sensor.sensor_id, { diameter: active ? 0.25 : 0.16, segments: 12 }, scene);
    sphere.position = new BABYLON.Vector3(...sensor.positionM);
    const mat = createPbr(scene, `${sensor.sensor_id}-mat`, color, 0.26, 0.08);
    mat.emissiveColor = BABYLON.Color3.FromHexString(color).scale(active ? 0.95 : 0.34);
    sphere.material = mat;
    attachMetadata(sphere, sensor.sensor_id, sensor.path, 'sensor', layers, sensor);
  });
}

function createTransport(scene: BABYLON.Scene, faultId: FabTwinFaultId) {
  const points = [
    new BABYLON.Vector3(-13, 3.3, -5.8),
    new BABYLON.Vector3(13, 3.3, -5.8),
    new BABYLON.Vector3(13, 3.3, 2.8),
    new BABYLON.Vector3(-13, 3.3, 2.8),
    new BABYLON.Vector3(-13, 3.3, -5.8),
  ];
  const rail = BABYLON.MeshBuilder.CreateLines('AMHS-RAIL-LOOP-01', { points }, scene);
  rail.color = BABYLON.Color3.FromHexString(faultId === 'queue-congestion' ? '#ef4444' : '#cbd5e1');
  rail.metadata = { id: 'AMHS-RAIL-LOOP-01', path: '/FAB1/L1/AMHS/RAIL/LOOP-01', type: 'lot-carrier-path', layers: ['transport'], queueState: faultId === 'queue-congestion' ? 'congested' : 'normal' };

  const carrier = BABYLON.MeshBuilder.CreateBox('FOUP-CARRIER-A17', { width: 0.72, height: 0.5, depth: 0.62 }, scene);
  carrier.position = new BABYLON.Vector3(-13, 3.05, -5.8);
  carrier.material = createPbr(scene, 'war-room-foup-carrier-mat', faultId === 'queue-congestion' ? '#ef4444' : '#f8fafc', 0.32, 0.28);
  attachMetadata(carrier, 'FOUP-CARRIER-A17', '/FAB1/L1/AMHS/CARRIERS/FOUP-CARRIER-A17', 'lot-carrier', ['transport'], { lot: 'LOT-2026-0412', wafers: 25 });

  const restPos = new BABYLON.Vector3(-13, 3.05, -5.8);
  scene.onBeforeRenderObservable.add(() => {
    const currentMode = (scene.metadata as Record<string, unknown>)?.currentMode as FabTwinMode | undefined;
    const shouldAnimate = currentMode === 'lot-transfer' || faultId === 'queue-congestion';
    if (!shouldAnimate) {
      carrier.position.copyFrom(restPos);
      return;
    }
    const speed = faultId === 'queue-congestion' ? 0.06 : 0.24;
    const t = (performance.now() / 1000 * speed) % 4;
    const index = Math.floor(t);
    const local = t - index;
    const from = points[index];
    const to = points[index + 1];
    carrier.position = BABYLON.Vector3.Lerp(from, to, local);
    carrier.position.y = 3.05;
  });
}

function createDataParticles(scene: BABYLON.Scene, reducedMotion: boolean) {
  if (reducedMotion) return;
  const hub = BABYLON.MeshBuilder.CreateTorus('CENTER-HUB-WIREFRAME', { diameter: 1.6, thickness: 0.06, tessellation: 48 }, scene);
  hub.position = new BABYLON.Vector3(0, 1.1, -1.4);
  const mat = createHudMaterial(scene, 'center-hub-mat', '#22d3ee', 0.8);
  mat.wireframe = true;
  hub.material = mat;
  hub.isPickable = false;
  scene.onBeforeRenderObservable.add(() => {
    hub.rotation.y += 0.008;
    hub.rotation.x += 0.003;
  });

  const particles: BABYLON.Mesh[] = [];
  for (let i = 0; i < 48; i += 1) {
    const particle = BABYLON.MeshBuilder.CreateSphere(`DATA-FLOW-${i}`, { diameter: 0.055, segments: 6 }, scene);
    const color = ZONE_COLORS[i % ZONE_COLORS.length];
    const pm = createPbr(scene, `DATA-FLOW-${i}-mat`, color, 0.2, 0.1);
    pm.emissiveColor = BABYLON.Color3.FromHexString(color).scale(0.75);
    particle.material = pm;
    particle.isPickable = false;
    particles.push(particle);
  }

  scene.onBeforeRenderObservable.add(() => {
    particles.forEach((particle, i) => {
      const t = ((performance.now() / 1000 + i * 0.08) % 6) / 6;
      const angle = t * Math.PI * 2 + i * 0.31;
      particle.position = new BABYLON.Vector3(Math.cos(angle) * (3 + (i % 7)), 1.1 + (i % 4) * 0.22, Math.sin(angle) * 2.6 - 1.4);
    });
  });
}

function applyLayerIsolation(scene: BABYLON.Scene, activeSubsystem: Subsystem | null) {
  scene.meshes.forEach((mesh) => {
    const metadata = mesh.metadata as { layers?: WarRoomLayer[] } | null;
    const layers = metadata?.layers ?? ['environment'];
    const material = mesh.material;

    if (!activeSubsystem) {
      mesh.visibility = 1;
      if (material && isWireframeMaterial(material)) {
        material.alpha = 1;
        material.wireframe = false;
      }
      return;
    }

    if (layers.includes(activeSubsystem)) {
      mesh.visibility = 1;
      if (material && isWireframeMaterial(material)) {
        material.alpha = 1;
        material.wireframe = false;
      }
      mesh.scaling = mesh.name.startsWith('SNS-') ? new BABYLON.Vector3(1.5, 1.5, 1.5) : new BABYLON.Vector3(1, 1, 1);
      return;
    }

    if (layers.includes('process')) {
      mesh.visibility = 0.2;
      if (material && isWireframeMaterial(material)) {
        material.alpha = 0.28;
        material.wireframe = true;
      }
      return;
    }

    if (layers.includes('environment')) {
      mesh.visibility = 0.4;
      if (material && isWireframeMaterial(material)) material.alpha = Math.min(material.alpha, 0.4);
      return;
    }

    if (layers.includes('transport')) {
      mesh.visibility = 0.3;
      return;
    }

    mesh.visibility = 0;
  });
}

function animateCamera(camera: BABYLON.ArcRotateCamera, scene: BABYLON.Scene, pose: CameraPose) {
  const ease = new BABYLON.CubicEase();
  ease.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
  const frameRate = 60;
  const frames = 48;
  BABYLON.Animation.CreateAndStartAnimation('camera-alpha', camera, 'alpha', frameRate, frames, camera.alpha, pose.alpha, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, ease);
  BABYLON.Animation.CreateAndStartAnimation('camera-beta', camera, 'beta', frameRate, frames, camera.beta, pose.beta, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, ease);
  BABYLON.Animation.CreateAndStartAnimation('camera-radius', camera, 'radius', frameRate, frames, camera.radius, pose.radius, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, ease);
  BABYLON.Animation.CreateAndStartAnimation('camera-target', camera, 'target', frameRate, frames, camera.target, pose.target, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, ease, undefined, scene);
}

function projectToScreen(scene: BABYLON.Scene, camera: BABYLON.Camera, point: BABYLON.Vector3) {
  const engine = scene.getEngine();
  const viewport = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
  const projected = BABYLON.Vector3.Project(point, BABYLON.Matrix.Identity(), scene.getTransformMatrix(), viewport);
  return { x: projected.x, y: projected.y };
}

function createScene(canvas: HTMLCanvasElement, props: WarRoomBabylonSceneProps) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const engine = new BABYLON.Engine(canvas, true, { stencil: true, antialias: true });
  engine.setHardwareScalingLevel(window.devicePixelRatio > 1 ? 1.2 : 1);
  const scene = new BABYLON.Scene(engine, { useGeometryUniqueIdsMap: true, useMaterialMeshMap: true, useClonedMeshMap: true });
  scene.clearColor = new BABYLON.Color4(0.01, 0.025, 0.09, 1);
  scene.metadata = { id: 'FAB1-SCENE-ROOT', path: '/FAB1/WAR_ROOM/BABYLON_HUD', type: 'cyberpunk-hud-scene', activeSubsystem: props.activeSubsystem };

  const pose = CAMERA_POSES[props.activeSubsystem ? SUBSYSTEM_VIEWS[props.activeSubsystem] : props.view];
  const camera = new BABYLON.ArcRotateCamera('CAMERA-RIG', pose.alpha, pose.beta, pose.radius, pose.target, scene);
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 7;
  camera.upperRadiusLimit = 46;
  camera.upperBetaLimit = Math.PI / 2.02;
  camera.wheelPrecision = 38;

  const ambient = new BABYLON.HemisphericLight('AMBIENT-DEEP-BLUE', new BABYLON.Vector3(0, 1, 0), scene);
  ambient.intensity = 0.6;
  ambient.diffuse = BABYLON.Color3.FromHexString('#060818');
  ambient.groundColor = BABYLON.Color3.FromHexString('#020617');
  [
    [-14, 3.5, -9],
    [14, 3.5, -9],
    [-14, 3.5, 8],
    [14, 3.5, 8],
  ].forEach(([x, y, z], index) => {
    const light = new BABYLON.PointLight(`CYAN-RIM-LIGHT-${index + 1}`, new BABYLON.Vector3(x, y, z), scene);
    light.diffuse = BABYLON.Color3.FromHexString('#22d3ee');
    light.intensity = 0.48;
    light.range = 34;
  });

  createFactoryEnvelope(scene);
  createProcessTools(scene);
  createSubsystemEquipment(scene, props.faultId);
  // Background: upgrade subsystem equipment with GLB models when available
  void upgradeSubsystemWithGLB(scene, props.faultId);
  createSensors(scene, props.faultId);
  createTransport(scene, props.faultId);
  createDataParticles(scene, reducedMotion);

  const fault = getFaultScene(props.faultId);
  const faultLabel = createLabel(scene, 'FAULT-SCENE-STATUS-LABEL', `${fault.label}\n${fault.triggerSource}`, props.faultId === 'nominal' ? '#22c55e' : '#ef4444', 8.8, 0.9);
  faultLabel.position = new BABYLON.Vector3(0, 4.35, -10.2);

  applyLayerIsolation(scene, props.activeSubsystem);
  const focusMesh = props.focusAssetId ? scene.getMeshById(props.focusAssetId) : null;
  if (focusMesh) {
    pose.target = focusMesh.getAbsolutePosition();
    pose.radius = Math.max(8, pose.radius * 0.62);
  }
  animateCamera(camera, scene, pose);

  scene.onPointerObservable.add((pointerInfo) => {
    if (pointerInfo.type !== BABYLON.PointerEventTypes.POINTERPICK) return;
    const picked = pointerInfo.pickInfo?.pickedMesh;
    if (!picked?.metadata) return;
    const metadata = picked.metadata as { id?: string; path?: string; type?: string };
    const screenPos = projectToScreen(scene, camera, picked.getAbsolutePosition());
    props.onAssetPick(
      {
        id: metadata.id ?? picked.id,
        path: metadata.path ?? '/FAB1/UNKNOWN',
        type: metadata.type ?? 'asset',
        metadata: picked.metadata,
      },
      screenPos,
    );
  });

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
  engine.runRenderLoop(() => {
    if (disposed) return;
    const fps = engine.getFps();
    if (fps < 30) scene.skipPointerMovePicking = true;
    scene.render();
  });

  return dispose;
}

/**
 * Apply dramatic visual changes per mode to all scene meshes.
 * Called incrementally — no scene rebuild needed.
 */
function applyMode(scene: BABYLON.Scene, mode: FabTwinMode) {
  const isAlarm = mode === 'alarm';
  const isMaintenance = mode === 'maintenance';
  const isLotTransfer = mode === 'lot-transfer';

  scene.meshes.forEach((mesh) => {
    const meta = mesh.metadata as { type?: string; layers?: WarRoomLayer[]; id?: string } | null;
    if (!meta) return;

    // --- Service panels: swing open in maintenance ---
    if (meta.type === 'door-open-panel') {
      mesh.rotation.y = isMaintenance ? -0.82 : 0;

      // Maintenance glow on panel material
      const mat = mesh.material;
      if (mat instanceof BABYLON.PBRMaterial) {
        mat.emissiveColor = isMaintenance
          ? BABYLON.Color3.FromHexString('#f59e0b').scale(0.6)
          : BABYLON.Color3.FromHexString('#cbd5e1').scale(0.12);
      }
    }

    // --- Load ports: glow in lot-transfer ---
    if (meta.type === 'interactive-load-port') {
      const mat = mesh.material;
      if (mat instanceof BABYLON.PBRMaterial) {
        mat.emissiveColor = isLotTransfer
          ? BABYLON.Color3.FromHexString('#22d3ee').scale(0.7)
          : BABYLON.Color3.FromHexString('#cbd5e1').scale(0.12);
      }
    }

    // --- Process tools: tint red in alarm mode ---
    if (meta.type === 'process-tool') {
      const mat = mesh.material;
      if (mat instanceof BABYLON.PBRMaterial) {
        if (isAlarm) {
          mat.emissiveColor = BABYLON.Color3.FromHexString('#ef4444').scale(0.35);
        } else if (isMaintenance) {
          mat.emissiveColor = BABYLON.Color3.FromHexString('#f59e0b').scale(0.18);
        } else {
          mat.emissiveColor = BABYLON.Color3.FromHexString('#cbd5e1').scale(0.12);
        }
      }
    }

    // --- Alarm beacons: show/hide ---
    if (meta.type === 'alarm-beacon') {
      mesh.setEnabled(isAlarm);
    }
  });

  // --- Global scene tint via clear color ---
  if (isAlarm) {
    scene.clearColor = new BABYLON.Color4(0.08, 0.01, 0.01, 1);
  } else if (isMaintenance) {
    scene.clearColor = new BABYLON.Color4(0.04, 0.03, 0.01, 1);
  } else if (isLotTransfer) {
    scene.clearColor = new BABYLON.Color4(0.01, 0.025, 0.06, 1);
  } else {
    scene.clearColor = new BABYLON.Color4(0.01, 0.025, 0.09, 1);
  }

  // --- Ambient light color shift ---
  const ambient = scene.getLightByName('AMBIENT-DEEP-BLUE') as BABYLON.HemisphericLight | null;
  if (ambient) {
    if (isAlarm) {
      ambient.diffuse = BABYLON.Color3.FromHexString('#1a0505');
      ambient.intensity = 0.75;
    } else if (isMaintenance) {
      ambient.diffuse = BABYLON.Color3.FromHexString('#181205');
      ambient.intensity = 0.7;
    } else {
      ambient.diffuse = BABYLON.Color3.FromHexString('#060818');
      ambient.intensity = 0.6;
    }
  }

  // --- Rim lights: shift color per mode ---
  for (let i = 1; i <= 4; i++) {
    const rim = scene.getLightByName(`CYAN-RIM-LIGHT-${i}`) as BABYLON.PointLight | null;
    if (!rim) continue;
    if (isAlarm) {
      rim.diffuse = BABYLON.Color3.FromHexString('#ef4444');
      rim.intensity = 0.65;
    } else if (isMaintenance) {
      rim.diffuse = BABYLON.Color3.FromHexString('#f59e0b');
      rim.intensity = 0.55;
    } else if (isLotTransfer) {
      rim.diffuse = BABYLON.Color3.FromHexString('#3b82f6');
      rim.intensity = 0.55;
    } else {
      rim.diffuse = BABYLON.Color3.FromHexString('#22d3ee');
      rim.intensity = 0.48;
    }
  }

  // --- Floor outline color ---
  const outline = scene.getMeshByName('DOUBLE-LINE-FLOOR-OUTLINE');
  if (outline instanceof BABYLON.LinesMesh) {
    outline.color = isAlarm
      ? BABYLON.Color3.FromHexString('#ef4444')
      : isMaintenance
        ? BABYLON.Color3.FromHexString('#f59e0b')
        : BABYLON.Color3.FromHexString('#22d3ee');
  }

  // Store current mode in scene metadata for transport animation
  if (scene.metadata) {
    (scene.metadata as Record<string, unknown>).currentMode = mode;
  }
}

/**
 * Create alarm beacons on all process tools (hidden by default).
 * applyMode toggles their visibility.
 */
function createAlarmBeacons(scene: BABYLON.Scene) {
  FAB_TWIN_TOOLS.forEach((tool) => {
    const group = scene.getTransformNodeByName(`${tool.tool_id}-node`);
    if (!group) return;
    const alarm = BABYLON.MeshBuilder.CreateSphere(`${tool.tool_id}-alarm-beacon`, { diameter: 0.58, segments: 18 }, scene);
    alarm.parent = group;
    alarm.position = new BABYLON.Vector3(0, tool.sizeM[1] + 0.42, 0);
    const alarmMat = createPbr(scene, `${tool.tool_id}-alarm-beacon-mat`, '#ef4444', 0.22, 0.1);
    alarmMat.emissiveColor = BABYLON.Color3.FromHexString('#ef4444');
    alarm.material = alarmMat;
    attachMetadata(alarm, `${tool.tool_id}-alarm-beacon`, `${tool.path}/ALARM`, 'alarm-beacon', ['process'], { faultId: 'alarm-mode' });
    alarm.setEnabled(false);
  });
}

export function WarRoomBabylonScene(props: WarRoomBabylonSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<{ scene: BABYLON.Scene; camera: BABYLON.ArcRotateCamera; dispose: () => void } | null>(null);
  const webgl = useWebGLSupport();

  // Create scene once on mount
  useEffect(() => {
    if (!canvasRef.current || !webgl.supported) return undefined;
    const dispose = createScene(canvasRef.current, props);
    // Capture scene and camera refs from the engine
    const canvas = canvasRef.current;
    const engine = BABYLON.Engine.Instances.find((e) => e.getRenderingCanvas() === canvas);
    const scene = engine?.scenes[0];
    const camera = scene?.activeCamera as BABYLON.ArcRotateCamera | undefined;
    if (scene && camera) {
      createAlarmBeacons(scene);
      applyMode(scene, props.mode);
      sceneRef.current = { scene, camera, dispose: dispose ?? (() => {}) };
    }
    return () => {
      sceneRef.current = null;
      dispose?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, [webgl.supported]);

  // Apply mode changes incrementally
  useEffect(() => {
    if (!sceneRef.current) return;
    applyMode(sceneRef.current.scene, props.mode);
  }, [props.mode]);

  // Apply view changes (camera animation)
  useEffect(() => {
    if (!sceneRef.current) return;
    const { scene, camera } = sceneRef.current;
    const pose = CAMERA_POSES[props.activeSubsystem ? SUBSYSTEM_VIEWS[props.activeSubsystem] : props.view];
    animateCamera(camera, scene, pose);
  }, [props.view, props.activeSubsystem]);

  // Apply layer isolation
  useEffect(() => {
    if (!sceneRef.current) return;
    applyLayerIsolation(sceneRef.current.scene, props.activeSubsystem);
  }, [props.activeSubsystem]);

  // Apply focus asset
  useEffect(() => {
    if (!sceneRef.current || !props.focusAssetId) return;
    const { scene, camera } = sceneRef.current;
    const focusMesh = scene.getMeshById(props.focusAssetId);
    if (!focusMesh) return;
    const pose = { ...CAMERA_POSES[props.view], target: focusMesh.getAbsolutePosition(), radius: 8 };
    animateCamera(camera, scene, pose);
  }, [props.focusAssetId, props.view]);

  if (!webgl.supported) {
    return <WebGLFallback />;
  }

  return (
    <canvas
      ref={canvasRef}
      data-testid="war-room-babylon-canvas"
      aria-label="Babylon.js cyberpunk smart factory war room scene"
      className="h-full min-h-[calc(100dvh-104px)] w-full touch-none outline-none"
    />
  );
}
