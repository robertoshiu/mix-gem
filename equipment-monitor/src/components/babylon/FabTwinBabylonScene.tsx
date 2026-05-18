'use client';

import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import type { FabTwinFaultId, FabTwinMode, FabTwinView } from '@/lib/fab-twin-data';
import {
  FAB_TWIN_SENSORS,
  FAB_TWIN_TOOLS,
  FAB_TWIN_UNITS,
  FAB_TWIN_ZONES,
  getFaultScene,
} from '@/lib/fab-twin-data';

interface PickedAsset {
  id: string;
  path: string;
  type: string;
  metadata: unknown;
}

interface FabTwinBabylonSceneProps {
  view: FabTwinView;
  mode: FabTwinMode;
  faultId: FabTwinFaultId;
  onAssetPick: (asset: PickedAsset) => void;
}

const CAMERA_POSES: Record<FabTwinView, { alpha: number; beta: number; radius: number; target: BABYLON.Vector3 }> = {
  overview: { alpha: -Math.PI / 2, beta: 0.82, radius: 36, target: new BABYLON.Vector3(0, 0.4, -1) },
  operator: { alpha: -1.35, beta: 1.18, radius: 18, target: new BABYLON.Vector3(-6.4, 1.3, -2.6) },
  maintenance: { alpha: -0.72, beta: 1.08, radius: 17, target: new BABYLON.Vector3(5.8, 1.2, -1.6) },
  'pipe-rack': { alpha: -0.08, beta: 0.96, radius: 20, target: new BABYLON.Vector3(0, 2.7, 6.1) },
  'control-room': { alpha: -2.24, beta: 1.17, radius: 15, target: new BABYLON.Vector3(-9.8, 1.3, -8.7) },
};

function createPbr(scene: BABYLON.Scene, name: string, color: string, roughness = 0.58, metalness = 0.22) {
  const material = new BABYLON.PBRMaterial(name, scene);
  material.albedoColor = BABYLON.Color3.FromHexString(color);
  material.roughness = roughness;
  material.metallic = metalness;
  return material;
}

function createLabel(scene: BABYLON.Scene, name: string, text: string, color: string, width = 3.8, height = 0.72) {
  const texture = new BABYLON.DynamicTexture(`${name}-texture`, { width: 768, height: 160 }, scene, false);
  texture.hasAlpha = true;
  texture.drawText(text, 32, 74, '600 34px Arial', '#f8fafc', 'transparent', true);

  const material = new BABYLON.StandardMaterial(`${name}-material`, scene);
  material.diffuseTexture = texture;
  material.emissiveColor = BABYLON.Color3.FromHexString(color);
  material.opacityTexture = texture;
  material.disableLighting = true;
  material.backFaceCulling = false;

  const plane = BABYLON.MeshBuilder.CreatePlane(name, { width, height }, scene);
  plane.material = material;
  plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
  plane.isPickable = false;
  return plane;
}

function attachAssetMetadata(mesh: BABYLON.AbstractMesh, id: string, path: string, type: string, metadata: unknown) {
  mesh.name = id;
  mesh.id = id;
  mesh.metadata = { ...(metadata as Record<string, unknown>), id, path, type };
  mesh.isPickable = true;
}

function createArrow(scene: BABYLON.Scene, id: string, from: BABYLON.Vector3, to: BABYLON.Vector3, color: string) {
  const points = [from, to];
  const line = BABYLON.MeshBuilder.CreateLines(id, { points, updatable: false }, scene);
  line.color = BABYLON.Color3.FromHexString(color);
  line.metadata = { id, path: `/FAB1/FLOWS/${id}`, type: 'flow-path' };
  const head = BABYLON.MeshBuilder.CreateCylinder(`${id}-head`, { diameterTop: 0, diameterBottom: 0.34, height: 0.62, tessellation: 18 }, scene);
  head.position = to;
  head.rotation.x = Math.PI / 2;
  head.material = createPbr(scene, `${id}-head-mat`, color, 0.28, 0.2);
  head.isPickable = false;
  return line;
}

function createPipe(scene: BABYLON.Scene, id: string, path: string, position: BABYLON.Vector3, length: number, diameter: number, color: string, axis: 'x' | 'z', rackLevel: string) {
  const pipe = BABYLON.MeshBuilder.CreateCylinder(id, { height: length, diameter, tessellation: 20 }, scene);
  pipe.position = position;
  pipe.rotation.z = axis === 'x' ? Math.PI / 2 : 0;
  pipe.rotation.x = axis === 'z' ? Math.PI / 2 : pipe.rotation.x;
  pipe.material = createPbr(scene, `${id}-mat`, color, 0.25, 0.72);
  attachAssetMetadata(pipe, id, path, 'pipe', { rackLevel, colorCode: color, valveNodes: [`${id}-VLV-01`, `${id}-VLV-02`], measurementPoints: [`${id}-PT-01`] });
  return pipe;
}

function createZone(scene: BABYLON.Scene, zoneMaterial: BABYLON.Material, zone: (typeof FAB_TWIN_ZONES)[number], activeFault: FabTwinFaultId) {
  const floor = BABYLON.MeshBuilder.CreateBox(zone.id, { width: zone.sizeM[0], height: zone.sizeM[1], depth: zone.sizeM[2] }, scene);
  floor.position = new BABYLON.Vector3(...zone.positionM);
  floor.material = zoneMaterial;
  attachAssetMetadata(floor, zone.id, zone.path, 'zone', zone);

  const outline = BABYLON.MeshBuilder.CreateBox(`${zone.id}-clearance-boundary`, { width: zone.sizeM[0], height: 2.8, depth: zone.sizeM[2] }, scene);
  outline.position = new BABYLON.Vector3(zone.positionM[0], 1.44, zone.positionM[2]);
  const outlineMaterial = new BABYLON.StandardMaterial(`${zone.id}-boundary-mat`, scene);
  outlineMaterial.diffuseColor = BABYLON.Color3.FromHexString(zone.color);
  outlineMaterial.alpha = activeFault !== 'nominal' && getFaultScene(activeFault).impactZone.includes(zone.label.split(' ')[0]) ? 0.22 : 0.08;
  outlineMaterial.wireframe = true;
  outline.material = outlineMaterial;
  outline.isPickable = false;

  const label = createLabel(scene, `${zone.id}-label`, `${zone.label}\n${zone.className} | ${zone.pressurePa} Pa`, zone.color, 4.6, 0.86);
  label.position = new BABYLON.Vector3(zone.positionM[0], 3.15, zone.positionM[2]);
}

function createTool(scene: BABYLON.Scene, tool: (typeof FAB_TWIN_TOOLS)[number], mode: FabTwinMode, faultId: FabTwinFaultId) {
  const group = new BABYLON.TransformNode(`${tool.tool_id}-node`, scene);
  group.position = new BABYLON.Vector3(...tool.positionM);
  group.metadata = { ...tool, id: tool.tool_id, path: tool.path, type: 'tool-node' };

  const base = BABYLON.MeshBuilder.CreateBox(tool.tool_id, { width: tool.sizeM[0], height: tool.sizeM[1], depth: tool.sizeM[2] }, scene);
  base.parent = group;
  base.position.y = tool.sizeM[1] / 2;
  base.material = createPbr(scene, `${tool.tool_id}-pbr`, tool.heroAsset ? '#dbeafe' : '#cbd5e1', 0.42, 0.36);
  attachAssetMetadata(base, tool.tool_id, tool.path, 'process-tool', tool);

  const colorMat = createPbr(scene, `${tool.tool_id}-accent-mat`, tool.color, 0.32, 0.28);
  colorMat.emissiveColor = BABYLON.Color3.FromHexString(tool.color).scale(faultId === 'single-tool-down' && tool.tool_id === 'ETCH-ICP-02' ? 0.9 : 0.18);

  const loadPort = BABYLON.MeshBuilder.CreateBox(`${tool.tool_id}-load-port`, { width: tool.sizeM[0] * 0.48, height: 0.36, depth: 0.56 }, scene);
  loadPort.parent = group;
  loadPort.position = new BABYLON.Vector3(0, 0.52, -tool.sizeM[2] / 2 - 0.24);
  loadPort.material = colorMat;
  attachAssetMetadata(loadPort, `${tool.tool_id}-load-port`, `${tool.path}/INTERACTIVE/LOAD_PORT`, 'interactive-part', { state: mode === 'lot-transfer' ? 'carrier transfer active' : 'ready' });

  const servicePanel = BABYLON.MeshBuilder.CreateBox(`${tool.tool_id}-service-panel`, { width: tool.sizeM[0] * 0.5, height: tool.sizeM[1] * 0.68, depth: 0.08 }, scene);
  servicePanel.parent = group;
  servicePanel.position = new BABYLON.Vector3(tool.sizeM[0] / 2 + 0.05, tool.sizeM[1] * 0.58, 0);
  servicePanel.rotation.y = mode === 'maintenance' ? -0.82 : 0;
  servicePanel.material = colorMat;
  attachAssetMetadata(servicePanel, `${tool.tool_id}-door-panel`, `${tool.path}/INTERACTIVE/SERVICE_DOOR`, 'door-open-panel', { open: mode === 'maintenance', serviceSide: tool.serviceSide });

  const clearance = BABYLON.MeshBuilder.CreateBox(`${tool.tool_id}-service-clearance`, { width: tool.sizeM[0] + 1.2, height: 0.08, depth: tool.sizeM[2] + 1.8 }, scene);
  clearance.parent = group;
  clearance.position.y = 0.06;
  const clearanceMaterial = new BABYLON.StandardMaterial(`${tool.tool_id}-clearance-mat`, scene);
  clearanceMaterial.diffuseColor = BABYLON.Color3.FromHexString(tool.color);
  clearanceMaterial.alpha = mode === 'maintenance' ? 0.28 : 0.11;
  clearance.material = clearanceMaterial;
  attachAssetMetadata(clearance, `${tool.tool_id}-clearance-envelope`, `${tool.path}/CLEARANCE/SERVICE`, 'maintenance-clearance-envelope', { service_clearance_mm: tool.service_clearance_mm, collisionMesh: `${tool.tool_id}-collision-proxy` });

  const collision = BABYLON.MeshBuilder.CreateBox(`${tool.tool_id}-collision-proxy`, { width: tool.sizeM[0], height: tool.sizeM[1], depth: tool.sizeM[2] }, scene);
  collision.parent = group;
  collision.position.y = tool.sizeM[1] / 2;
  collision.visibility = 0;
  collision.checkCollisions = true;
  attachAssetMetadata(collision, `${tool.tool_id}-collision-proxy`, `${tool.path}/COLLISION/LOD2_PROXY`, 'collision-mesh', { lod: 'LOD2 simplified collision mesh' });

  const lod1 = BABYLON.MeshBuilder.CreateBox(`${tool.tool_id}-LOD1`, { width: tool.sizeM[0] * 0.94, height: tool.sizeM[1] * 0.92, depth: tool.sizeM[2] * 0.94 }, scene);
  lod1.parent = group;
  lod1.position.y = tool.sizeM[1] / 2;
  lod1.material = createPbr(scene, `${tool.tool_id}-lod1-mat`, '#94a3b8', 0.66, 0.18);
  lod1.isVisible = false;
  base.addLODLevel(22, lod1);

  const lod2 = BABYLON.MeshBuilder.CreateBox(`${tool.tool_id}-LOD2`, { width: tool.sizeM[0] * 0.84, height: tool.sizeM[1] * 0.78, depth: tool.sizeM[2] * 0.84 }, scene);
  lod2.parent = group;
  lod2.position.y = tool.sizeM[1] / 2;
  lod2.material = createPbr(scene, `${tool.tool_id}-lod2-mat`, '#64748b', 0.72, 0.1);
  lod2.isVisible = false;
  base.addLODLevel(38, lod2);

  const label = createLabel(scene, `${tool.tool_id}-label`, `${tool.tool_id}\n${tool.tool_type.toUpperCase()} | ${tool.status_tags[0]}`, tool.color, 3.9, 0.8);
  label.parent = group;
  label.position.y = tool.sizeM[1] + 0.78;

  if (faultId === 'single-tool-down' && tool.tool_id === 'ETCH-ICP-02') {
    const alarm = BABYLON.MeshBuilder.CreateSphere(`${tool.tool_id}-alarm-flash`, { diameter: 0.54, segments: 18 }, scene);
    alarm.parent = group;
    alarm.position = new BABYLON.Vector3(0, tool.sizeM[1] + 0.45, 0);
    const alarmMat = createPbr(scene, `${tool.tool_id}-alarm-mat`, '#ef4444', 0.25, 0.1);
    alarmMat.emissiveColor = BABYLON.Color3.FromHexString('#ef4444');
    alarm.material = alarmMat;
    scene.onBeforeRenderObservable.add(() => {
      alarm.visibility = 0.45 + Math.abs(Math.sin(performance.now() / 180)) * 0.55;
    });
  }
}

/** Map FAB_TWIN_TOOLS tool_type to existing equipment GLB filenames */
const TOOL_GLB_MAP: Record<string, string> = {
  lithography: '/models/equipment/lithography.glb',
  etch: '/models/equipment/etch_chamber.glb',
  deposition: '/models/equipment/etch_chamber.glb',
  metrology: '/models/equipment/metrology.glb',
  test: '/models/equipment/efem.glb',
};

const INFRA_GLB_MAP: Record<string, { path: string; scale?: number; rotationY?: number }> = {
  'SCRUBBER-SUBFAB-01': { path: '/models/infrastructure/scrubber.glb' },
  'PDU-A-01': { path: '/models/infrastructure/pdu.glb' },
  'FOUP-CARRIER-A17': { path: '/models/equipment/wafer_cassette.glb', scale: 0.7 },
  'GAS-CABINET-01': { path: '/models/infrastructure/gas_cabinet.glb' },
};

const FAB_TWIN_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '/mix-gem';

/**
 * Background GLB upgrade: loads equipment GLBs and replaces base boxes.
 * Preserves interactive elements (load port, service panel, clearance, collision, LOD, labels).
 */
async function upgradeToolsWithGLB(scene: BABYLON.Scene): Promise<void> {
  try {
    // Load unique GLBs as containers
    const containers = new Map<string, BABYLON.AssetContainer>();
    const uniquePaths = [...new Set(Object.values(TOOL_GLB_MAP))];

    await Promise.all(uniquePaths.map(async (glbPath) => {
      try {
        const fullPath = FAB_TWIN_BASE_PATH + glbPath;
        const container = await BABYLON.LoadAssetContainerAsync(fullPath, scene);
        containers.set(glbPath, container);
      } catch {
        // GLB not available
      }
    }));

    if (scene.isDisposed) return;
    if (containers.size === 0) return;

    for (const tool of FAB_TWIN_TOOLS) {
      const glbPath = TOOL_GLB_MAP[tool.tool_type];
      const container = glbPath ? containers.get(glbPath) : undefined;
      if (!container) continue;

      const group = scene.getTransformNodeByName(`${tool.tool_id}-node`);
      if (!group) continue;

      // Instance GLB under the tool group
      const instance = container.instantiateModelsToScene(
        (n) => `${tool.tool_id}-glb_${n}`,
      );

      for (const root of instance.rootNodes) {
        if (root instanceof BABYLON.TransformNode) {
          root.parent = group;
          root.position.y = tool.sizeM[1] / 2;

          // Scale to fit tool dimensions
          const meshes = root.getChildMeshes();
          if (meshes.length > 0) {
            let minVec = new BABYLON.Vector3(Infinity, Infinity, Infinity);
            let maxVec = new BABYLON.Vector3(-Infinity, -Infinity, -Infinity);
            for (const mesh of meshes) {
              mesh.computeWorldMatrix(true);
              const bi = mesh.getBoundingInfo();
              minVec = BABYLON.Vector3.Minimize(minVec, bi.boundingBox.minimumWorld);
              maxVec = BABYLON.Vector3.Maximize(maxVec, bi.boundingBox.maximumWorld);
            }
            const extents = maxVec.subtract(minVec);
            const maxDim = Math.max(extents.x, extents.y, extents.z);
            if (maxDim > 0) {
              const targetDim = Math.max(tool.sizeM[0], tool.sizeM[1], tool.sizeM[2]);
              root.scaling.setAll(targetDim / maxDim);
            }
          }

          // Apply semi-transparent PBR style matching the scene
          const mat = createPbr(scene, `${tool.tool_id}-glb-mat`, tool.heroAsset ? '#dbeafe' : '#cbd5e1', 0.42, 0.36);
          for (const mesh of root.getChildMeshes()) {
            mesh.material = mat;
            mesh.isPickable = false;
          }
        }
      }

      // Hide the original procedural base box but keep as invisible picking proxy
      const baseBox = scene.getMeshByName(tool.tool_id);
      if (baseBox) baseBox.visibility = 0;
    }
  } catch {
    // GLBs not available — procedural fallbacks remain
  }
}

/**
 * Background GLB upgrade: loads infrastructure GLBs and replaces procedural geometry.
 * Preserves metadata and picking behavior.
 */
async function upgradeInfrastructureWithGLB(scene: BABYLON.Scene): Promise<void> {
  try {
    const containers = new Map<string, BABYLON.AssetContainer>();
    const uniquePaths = [...new Set(Object.values(INFRA_GLB_MAP).map(v => v.path))];

    await Promise.all(uniquePaths.map(async (glbPath) => {
      try {
        const fullPath = FAB_TWIN_BASE_PATH + glbPath;
        const container = await BABYLON.LoadAssetContainerAsync(fullPath, scene);
        containers.set(glbPath, container);
      } catch {
        // GLB not available — procedural fallback remains
      }
    }));

    if (scene.isDisposed) return;
    if (containers.size === 0) return;

    for (const [meshName, config] of Object.entries(INFRA_GLB_MAP)) {
      const container = containers.get(config.path);
      if (!container) continue;

      const originalMesh = scene.getMeshByName(meshName);
      if (!originalMesh) continue;

      const instance = container.instantiateModelsToScene(
        (n) => `${meshName}-glb_${n}`,
      );

      for (const root of instance.rootNodes) {
        if (root instanceof BABYLON.TransformNode) {
          root.parent = originalMesh.parent;
          root.position = originalMesh.position.clone();
          if (config.rotationY) root.rotation.y = config.rotationY;

          // Scale to fit original mesh bounding box
          const meshes = root.getChildMeshes();
          if (meshes.length > 0) {
            let minVec = new BABYLON.Vector3(Infinity, Infinity, Infinity);
            let maxVec = new BABYLON.Vector3(-Infinity, -Infinity, -Infinity);
            for (const mesh of meshes) {
              mesh.computeWorldMatrix(true);
              const bi = mesh.getBoundingInfo();
              minVec = BABYLON.Vector3.Minimize(minVec, bi.boundingBox.minimumWorld);
              maxVec = BABYLON.Vector3.Maximize(maxVec, bi.boundingBox.maximumWorld);
            }
            const extents = maxVec.subtract(minVec);
            const maxDim = Math.max(extents.x, extents.y, extents.z);
            if (maxDim > 0) {
              const origBi = originalMesh.getBoundingInfo();
              const origExtents = origBi.boundingBox.maximumWorld.subtract(origBi.boundingBox.minimumWorld);
              const targetDim = Math.max(origExtents.x, origExtents.y, origExtents.z);
              const scaleFactor = (config.scale ?? 1) * (targetDim / maxDim);
              root.scaling.setAll(scaleFactor);
            }
          }

          // Keep original PBR textures from the GLB (realistic industrial style)
          for (const mesh of root.getChildMeshes()) {
            mesh.isPickable = false;
          }
        }
      }

      // Hide procedural mesh but keep as invisible picking proxy
      originalMesh.visibility = 0;
    }
  } catch {
    // GLBs not available — procedural fallbacks remain
  }
}

/**
 * Upgrade FFU ceiling instances with GLB model.
 * Loads one GLB and replaces the instancing master mesh geometry.
 */
async function upgradeFFUWithGLB(scene: BABYLON.Scene): Promise<void> {
  try {
    const fullPath = FAB_TWIN_BASE_PATH + '/models/infrastructure/ffu.glb';
    const container = await BABYLON.LoadAssetContainerAsync(fullPath, scene);
    if (scene.isDisposed) return;

    const master = scene.getMeshByName('FFU-MASTER-LOD0');
    if (!master) return;

    const entries = container.instantiateModelsToScene((n) => `FFU-glb_${n}`);
    for (const root of entries.rootNodes) {
      if (root instanceof BABYLON.TransformNode) {
        root.parent = master;
        root.position = BABYLON.Vector3.Zero();
        // Scale GLB to match FFU master box (1.7 x 0.12 x 1.7)
        const meshes = root.getChildMeshes();
        if (meshes.length > 0) {
          let minVec = new BABYLON.Vector3(Infinity, Infinity, Infinity);
          let maxVec = new BABYLON.Vector3(-Infinity, -Infinity, -Infinity);
          for (const mesh of meshes) {
            mesh.computeWorldMatrix(true);
            const bi = mesh.getBoundingInfo();
            minVec = BABYLON.Vector3.Minimize(minVec, bi.boundingBox.minimumWorld);
            maxVec = BABYLON.Vector3.Maximize(maxVec, bi.boundingBox.maximumWorld);
          }
          const extents = maxVec.subtract(minVec);
          const maxDim = Math.max(extents.x, extents.y, extents.z);
          if (maxDim > 0) {
            root.scaling.setAll(1.7 / maxDim);
          }
        }
        for (const mesh of root.getChildMeshes()) {
          mesh.isPickable = false;
        }
      }
    }
  } catch {
    // FFU GLB not available
  }
}

function createInstancedCeiling(scene: BABYLON.Scene) {
  const ffuMaster = BABYLON.MeshBuilder.CreateBox('FFU-MASTER-LOD0', { width: 1.7, height: 0.12, depth: 1.7 }, scene);
  ffuMaster.material = createPbr(scene, 'ffu-pbr', '#e2e8f0', 0.34, 0.42);
  ffuMaster.isVisible = false;
  attachAssetMetadata(ffuMaster, 'FFU-MASTER-LOD0', '/FAB1/L1/CEILING/FFU/MASTER', 'instancing-master', { lod: 'LOD0', filterType: 'HEPA/ULPA selectable' });

  let index = 0;
  for (let x = -14; x <= 14; x += 3.5) {
    for (let z = -10; z <= 7; z += 3.4) {
      const instance = ffuMaster.createInstance(`FFU-${String(index + 1).padStart(3, '0')}`);
      instance.position = new BABYLON.Vector3(x, 4.65, z);
      instance.metadata = { id: instance.name, path: `/FAB1/L1/CEILING/FFU/${instance.name}`, type: 'ffu-instance', filter: index % 5 === 0 ? 'ULPA' : 'HEPA', airflow: 'downflow' };
      index += 1;
    }
  }

  const lightMaster = BABYLON.MeshBuilder.CreateBox('LIGHT-MASTER-NEUTRAL-WHITE', { width: 1.4, height: 0.06, depth: 0.22 }, scene);
  const lightMat = createPbr(scene, 'neutral-light-mat', '#f8fafc', 0.24, 0.18);
  lightMat.emissiveColor = BABYLON.Color3.FromHexString('#e0f2fe').scale(0.26);
  lightMaster.material = lightMat;
  lightMaster.isVisible = false;
  for (let x = -13; x <= 13; x += 4) {
    for (let z = -9; z <= 7; z += 4) {
      const instance = lightMaster.createInstance(`CLEANROOM-LIGHT-${x}-${z}`);
      instance.position = new BABYLON.Vector3(x, 4.52, z);
      instance.metadata = { id: instance.name, path: `/FAB1/L1/CEILING/LIGHTING/${instance.name}`, type: 'light-fixture-instance', colorTemperature: '4000K neutral white' };
    }
  }
}

function createUtilities(scene: BABYLON.Scene, faultId: FabTwinFaultId) {
  const pipeSpecs = [
    ['PIPE-CW-SUPPLY-L2', '#3b82f6', 2.75, 'rack L2 chilled water supply'],
    ['PIPE-CW-RETURN-L2', '#60a5fa', 3.1, 'rack L2 chilled water return'],
    ['PIPE-EXHAUST-L3', '#f97316', 3.55, 'rack L3 solvent/acid exhaust'],
    ['PIPE-GAS-N2-L1', '#facc15', 2.25, 'rack L1 nitrogen bulk gas'],
    ['PIPE-FIRE-L1', '#ef4444', 1.85, 'rack L1 fire suppression'],
  ] as const;

  pipeSpecs.forEach(([id, color, y, rackLevel], index) => {
    createPipe(scene, id, `/FAB1/L1/CHASE/PIPE_RACK/${id}`, new BABYLON.Vector3(0, y, 6 + index * 0.22), 28, 0.16, color, 'x', rackLevel);
  });

  for (let x = -13; x <= 13; x += 4.2) {
    const hanger = BABYLON.MeshBuilder.CreateBox(`PIPE-HANGER-${x}`, { width: 0.12, height: 2.2, depth: 0.12 }, scene);
    hanger.position = new BABYLON.Vector3(x, 2.75, 6.35);
    hanger.material = createPbr(scene, `pipe-hanger-${x}-mat`, '#94a3b8', 0.38, 0.6);
    attachAssetMetadata(hanger, hanger.name, `/FAB1/L1/CHASE/PIPE_RACK/HANGERS/${hanger.name}`, 'pipe-hanger-instance', { rackLevel: 'L1-L3', instancedPreferred: true });
  }

  const scrubber = BABYLON.MeshBuilder.CreateCylinder('SCRUBBER-SUBFAB-01', { height: 3.2, diameter: 1.2, tessellation: 32 }, scene);
  scrubber.position = new BABYLON.Vector3(8, -1.05, 2.8);
  scrubber.material = createPbr(scene, 'scrubber-mat', '#64748b', 0.32, 0.62);
  attachAssetMetadata(scrubber, 'SCRUBBER-SUBFAB-01', '/FAB1/B1/SUBFAB/SCRUBBER/SCRUBBER-SUBFAB-01', 'scrubber', { exhaustCapacity: '18000 m3/h', linkedTools: ['ETCH-ICP-02', 'DEP-ALD-03'], faultHighlighted: faultId === 'toxic-gas-alarm' });

  const pdu = BABYLON.MeshBuilder.CreateBox('PDU-A-01', { width: 2.2, height: 2.4, depth: 0.5 }, scene);
  pdu.position = new BABYLON.Vector3(11, 1.25, -8.1);
  pdu.material = createPbr(scene, 'pdu-mat', '#1d4ed8', 0.36, 0.48);
  attachAssetMetadata(pdu, 'PDU-A-01', '/FAB1/L1/UTILITY_ROOM/POWER/PDU-A-01', 'power-distribution-panel', { incoming: '22.8kV -> 480V', upsPath: 'UPS-A/B redundant', breakerState: faultId === 'single-tool-down' ? 'ETCH feeder tripped' : 'closed-normal' });

  const gasCabinet = BABYLON.MeshBuilder.CreateBox('GAS-CABINET-01', { width: 1.0, height: 2.0, depth: 0.8 }, scene);
  gasCabinet.position = new BABYLON.Vector3(10, 1.05, 2.8);
  gasCabinet.material = createPbr(scene, 'gas-cabinet-mat', '#94a3b8', 0.32, 0.52);
  attachAssetMetadata(gasCabinet, 'GAS-CABINET-01', '/FAB1/B1/SUBFAB/GAS/GAS-CABINET-01', 'gas-cabinet', { gasTypes: ['N2', 'Ar', 'He'], pressureRange: '0-200 psi', linkedTools: ['DEP-ALD-03'] });

  createArrow(scene, 'REDUNDANT-POWER-PATH-A', new BABYLON.Vector3(12, 1.8, -7.8), new BABYLON.Vector3(8, 1.8, -2.8), '#60a5fa');
  createArrow(scene, 'SUPPLY-AIR-DOWNFLOW', new BABYLON.Vector3(-8, 4.35, -2), new BABYLON.Vector3(-8, 0.8, -2), faultId === 'ffu-efficiency-loss' ? '#ef4444' : '#67e8f9');
  createArrow(scene, 'RETURN-AIR-CHASE', new BABYLON.Vector3(-2, 0.5, 2.6), new BABYLON.Vector3(0, 1.6, 5.6), faultId === 'pressure-reversal' ? '#ef4444' : '#22c55e');
  createArrow(scene, 'RELIEF-PATH-SUBFAB', new BABYLON.Vector3(7, 0.7, 4.2), new BABYLON.Vector3(8, -1.3, 2.8), '#f59e0b');
}

function createSensors(scene: BABYLON.Scene, faultId: FabTwinFaultId) {
  FAB_TWIN_SENSORS.forEach((sensor) => {
    const color = sensor.sensor_type === 'gas_detection' ? '#f59e0b' : sensor.sensor_type === 'particle_count' ? '#38bdf8' : sensor.sensor_type === 'power' ? '#60a5fa' : '#22c55e';
    const active =
      (faultId === 'toxic-gas-alarm' && sensor.sensor_type === 'gas_detection' && sensor.zoneId === 'zone-chase') ||
      (faultId === 'ffu-efficiency-loss' && sensor.sensor_type === 'particle_count' && sensor.zoneId === 'zone-bay-litho') ||
      (faultId === 'temperature-humidity-drift' && (sensor.sensor_type === 'temperature' || sensor.sensor_type === 'RH') && sensor.zoneId === 'zone-bay-litho') ||
      (faultId === 'pressure-reversal' && sensor.sensor_type === 'differential_pressure');
    const sphere = BABYLON.MeshBuilder.CreateSphere(sensor.sensor_id, { diameter: active ? 0.24 : 0.16, segments: 12 }, scene);
    sphere.position = new BABYLON.Vector3(...sensor.positionM);
    const material = createPbr(scene, `${sensor.sensor_id}-mat`, active ? '#ef4444' : color, 0.28, 0.1);
    material.emissiveColor = BABYLON.Color3.FromHexString(active ? '#ef4444' : color).scale(active ? 0.9 : 0.32);
    sphere.material = material;
    attachAssetMetadata(sphere, sensor.sensor_id, sensor.path, 'sensor', sensor);
  });
}

function createCarrierFlow(scene: BABYLON.Scene, mode: FabTwinMode, faultId: FabTwinFaultId) {
  const railPoints = [
    new BABYLON.Vector3(-13, 3.3, -5.8),
    new BABYLON.Vector3(13, 3.3, -5.8),
    new BABYLON.Vector3(13, 3.3, 2.8),
    new BABYLON.Vector3(-13, 3.3, 2.8),
    new BABYLON.Vector3(-13, 3.3, -5.8),
  ];
  const rail = BABYLON.MeshBuilder.CreateLines('AMHS-RAIL-LOOP-01', { points: railPoints }, scene);
  rail.color = BABYLON.Color3.FromHexString(faultId === 'queue-congestion' ? '#ef4444' : '#cbd5e1');
  rail.metadata = { id: 'AMHS-RAIL-LOOP-01', path: '/FAB1/L1/AMHS/RAIL/LOOP-01', type: 'lot-carrier-path', queueState: faultId === 'queue-congestion' ? 'congested' : 'normal' };

  const carrier = BABYLON.MeshBuilder.CreateBox('FOUP-CARRIER-A17', { width: 0.72, height: 0.5, depth: 0.62 }, scene);
  carrier.position = new BABYLON.Vector3(-13, 3.05, -5.8);
  const mat = createPbr(scene, 'foup-carrier-mat', faultId === 'queue-congestion' ? '#ef4444' : '#f8fafc', 0.32, 0.28);
  mat.emissiveColor = BABYLON.Color3.FromHexString(faultId === 'queue-congestion' ? '#ef4444' : '#38bdf8').scale(0.2);
  carrier.material = mat;
  attachAssetMetadata(carrier, 'FOUP-CARRIER-A17', '/FAB1/L1/AMHS/CARRIERS/FOUP-CARRIER-A17', 'lot-carrier', { lot: 'LOT-2026-0412', wafers: 25, state: mode === 'lot-transfer' ? 'transferring' : faultId === 'queue-congestion' ? 'waiting-congested' : 'waiting' });

  scene.onBeforeRenderObservable.add(() => {
    if (mode !== 'lot-transfer' && faultId !== 'queue-congestion') return;
    const speed = faultId === 'queue-congestion' ? 0.06 : 0.24;
    const t = (performance.now() / 1000 * speed) % 4;
    const index = Math.floor(t);
    const local = t - index;
    const from = railPoints[index];
    const to = railPoints[index + 1];
    carrier.position = BABYLON.Vector3.Lerp(from, to, local);
    carrier.position.y = 3.05;
  });
}

function createScene(canvas: HTMLCanvasElement, props: FabTwinBabylonSceneProps) {
  const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, antialias: true });
  engine.setHardwareScalingLevel(window.devicePixelRatio > 1 ? 1.25 : 1);
  const scene = new BABYLON.Scene(engine, { useGeometryUniqueIdsMap: true, useMaterialMeshMap: true, useClonedMeshMap: true });
  scene.clearColor = new BABYLON.Color4(0.03, 0.06, 0.1, 1);
  scene.collisionsEnabled = true;
  scene.metadata = {
    id: 'FAB-TWIN-SCENE-001',
    path: '/FAB1/DIGITAL_TWIN/BABYLON_SCENE',
    type: 'engineering-scene-graph',
    units: FAB_TWIN_UNITS,
    assetNaming: 'unique IDs with hierarchical paths on mesh.metadata.path',
  };

  const pose = CAMERA_POSES[props.view];
  const camera = new BABYLON.ArcRotateCamera('FAB-TWIN-CAMERA', pose.alpha, pose.beta, pose.radius, pose.target, scene);
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 8;
  camera.upperRadiusLimit = 46;
  camera.upperBetaLimit = Math.PI / 2.02;
  camera.wheelPrecision = 38;

  const hemi = new BABYLON.HemisphericLight('CLEANROOM-AMBIENT-4000K', new BABYLON.Vector3(0, 1, 0), scene);
  hemi.intensity = 0.82;
  hemi.diffuse = new BABYLON.Color3(0.92, 0.97, 1);
  hemi.groundColor = new BABYLON.Color3(0.28, 0.34, 0.42);
  const directional = new BABYLON.DirectionalLight('EVEN-MAINTENANCE-LIGHT', new BABYLON.Vector3(-0.35, -1, -0.2), scene);
  directional.position = new BABYLON.Vector3(4, 10, 5);
  directional.intensity = 0.32;

  const ground = BABYLON.MeshBuilder.CreateGround('FAB1-L1-ENGINEERING-GRID', { width: 32, height: 22, subdivisions: 32 }, scene);
  ground.position.y = 0;
  ground.material = createPbr(scene, 'cleanroom-floor-pbr', '#dbe3ea', 0.62, 0.12);
  ground.checkCollisions = true;
  attachAssetMetadata(ground, 'FAB1-L1-ENGINEERING-GRID', '/FAB1/L1/FLOOR/RAISED_ACCESS_GRID', 'floor-grid', { unit: 'meter', zUpAlternative: 'Export transforms documented as Y-up native Babylon scene' });

  const wallMat = createPbr(scene, 'cleanroom-wall-pbr', '#e5edf4', 0.48, 0.18);
  const wallSpecs = [
    ['WALL-NORTH', 0, 2.1, -11, 32, 4.2, 0.18],
    ['WALL-SOUTH-CHASE', 0, 2.1, 9.2, 32, 4.2, 0.18],
    ['WALL-WEST', -16, 2.1, -1, 0.18, 4.2, 20.4],
    ['WALL-EAST', 16, 2.1, -1, 0.18, 4.2, 20.4],
  ] as const;
  wallSpecs.forEach(([id, x, y, z, width, height, depth]) => {
    const wall = BABYLON.MeshBuilder.CreateBox(id, { width, height, depth }, scene);
    wall.position = new BABYLON.Vector3(x, y, z);
    wall.material = wallMat;
    wall.checkCollisions = true;
    attachAssetMetadata(wall, id, `/FAB1/L1/ARCHITECTURE/${id}`, 'wall', { cleanroomPanel: 'modular wipe-down sandwich panel' });
  });

  FAB_TWIN_ZONES.forEach((zone) => createZone(scene, createPbr(scene, `${zone.id}-mat`, zone.color, 0.7, 0.08), zone, props.faultId));
  createInstancedCeiling(scene);
  FAB_TWIN_TOOLS.forEach((tool) => createTool(scene, tool, props.mode, props.faultId));
  // Background: upgrade tool base boxes with GLB models when available
  void upgradeToolsWithGLB(scene);
  void upgradeInfrastructureWithGLB(scene);
  void upgradeFFUWithGLB(scene);
  createUtilities(scene, props.faultId);
  createSensors(scene, props.faultId);
  createCarrierFlow(scene, props.mode, props.faultId);

  const fault = getFaultScene(props.faultId);
  const faultLabel = createLabel(scene, 'FAULT-SCENE-STATUS-LABEL', `${fault.label}\nTrigger: ${fault.triggerSource}`, props.faultId === 'nominal' ? '#22c55e' : '#ef4444', 8.8, 0.9);
  faultLabel.position = new BABYLON.Vector3(0, 4.1, -10.2);

  scene.onPointerObservable.add((pointerInfo: BABYLON.PointerInfo) => {
    if (pointerInfo.type !== BABYLON.PointerEventTypes.POINTERPICK) return;
    const picked = pointerInfo.pickInfo?.pickedMesh;
    if (!picked?.metadata) return;
    const metadata = picked.metadata as { id?: string; path?: string; type?: string };
    props.onAssetPick({
      id: metadata.id ?? picked.id,
      path: metadata.path ?? '/FAB1/UNKNOWN',
      type: metadata.type ?? 'asset',
      metadata: picked.metadata,
    });
  });

  const resize = () => engine.resize();
  window.addEventListener('resize', resize);
  engine.runRenderLoop(() => scene.render());

  return () => {
    window.removeEventListener('resize', resize);
    scene.dispose();
    engine.dispose();
  };
}

export function FabTwinBabylonScene(props: FabTwinBabylonSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onAssetPickRef = useRef(props.onAssetPick);
  useEffect(() => { onAssetPickRef.current = props.onAssetPick; });

  const { view, mode, faultId } = props;

  useEffect(() => {
    if (!canvasRef.current) return undefined;
    return createScene(canvasRef.current, {
      view,
      mode,
      faultId,
      onAssetPick: (asset: PickedAsset) => onAssetPickRef.current(asset),
    });
  }, [view, mode, faultId]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="fab-twin-babylon-canvas"
      aria-label="Babylon.js enterprise semiconductor cleanroom digital twin scene"
      className="h-full min-h-[620px] w-full touch-none outline-none"
    />
  );
}
