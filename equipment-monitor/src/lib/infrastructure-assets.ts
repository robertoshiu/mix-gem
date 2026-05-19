/**
 * Shared infrastructure asset loader for FabTwin, WarRoom, and EDA scenes.
 * Loads GLB models from public/models/infrastructure/ when available,
 * falls back to procedural geometry (colored boxes/cylinders) otherwise.
 *
 * Asset types map to subsystem equipment:
 *   pdu        → PDU-A-01, UPS-A, FIRE-PANEL-MCC
 *   gas_cabinet → GAS-CABINET-01
 *   scrubber   → SCRUBBER-SUBFAB-01
 *   chiller    → CHILLED-WATER-LOOP
 *   amhs       → AMHS overhead carrier (WarRoom data flow)
 *   ffu        → AHU-SUPPLY-01, DETECTOR-LOOP-A
 */
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '/mix-gem';

export type InfraAssetType = 'pdu' | 'gas_cabinet' | 'scrubber' | 'chiller' | 'amhs' | 'ffu';

const GLB_PATHS: Record<InfraAssetType, string> = {
  pdu: '/models/infrastructure/pdu.glb',
  gas_cabinet: '/models/infrastructure/gas_cabinet.glb',
  scrubber: '/models/infrastructure/scrubber.glb',
  chiller: '/models/infrastructure/chiller.glb',
  amhs: '/models/infrastructure/amhs_carrier.glb',
  ffu: '/models/infrastructure/ffu.glb',
};

/** Map subsystem equipment IDs to infrastructure asset types */
export const SUBSYSTEM_ASSET_MAP: Record<string, InfraAssetType> = {
  'PDU-A-01': 'pdu',
  'UPS-A': 'pdu',
  'AHU-SUPPLY-01': 'ffu',
  'CHILLED-WATER-LOOP': 'chiller',
  'GAS-CABINET-01': 'gas_cabinet',
  'SCRUBBER-SUBFAB-01': 'scrubber',
  'FIRE-PANEL-MCC': 'pdu',
  'DETECTOR-LOOP-A': 'ffu',
};

/** Target bounding box size for infrastructure equipment */
const TARGET_SIZE = 1.8;

export interface InfraAssetCache {
  containers: Map<InfraAssetType, BABYLON.AssetContainer>;
  /** Place an instance at given position. Returns root node or null. */
  placeInstance(
    type: InfraAssetType,
    name: string,
    position: BABYLON.Vector3,
    scene: BABYLON.Scene,
    rotation?: number,
  ): BABYLON.TransformNode;
  dispose(): void;
}

/**
 * Load all infrastructure GLBs into asset containers.
 * Missing GLBs are silently skipped — placeInstance() creates procedural fallbacks.
 */
export async function loadInfrastructureAssets(
  scene: BABYLON.Scene,
): Promise<InfraAssetCache> {
  const containers = new Map<InfraAssetType, BABYLON.AssetContainer>();

  const types = Object.keys(GLB_PATHS) as InfraAssetType[];
  const loads = types.map(async (type) => {
    const path = BASE_PATH + GLB_PATHS[type];
    try {
      const container = await BABYLON.SceneLoader.LoadAssetContainerAsync('', path, scene);
      containers.set(type, container);
      console.log(`[infra] Loaded GLB: ${type}`);
    } catch {
      // GLB not available — will use procedural fallback
    }
  });

  await Promise.all(loads);
  console.log(`[infra] ${containers.size}/${types.length} GLBs loaded, rest use procedural fallback`);

  function placeInstance(
    type: InfraAssetType,
    name: string,
    position: BABYLON.Vector3,
    targetScene: BABYLON.Scene,
    rotation?: number,
  ): BABYLON.TransformNode {
    const container = containers.get(type);

    if (container) {
      return placeGLBInstance(container, name, position, targetScene, rotation);
    }
    return createProceduralFallback(type, name, position, targetScene, rotation);
  }

  function dispose(): void {
    for (const container of containers.values()) {
      container.dispose();
    }
    containers.clear();
  }

  return { containers, placeInstance, dispose };
}

/** Place a GLB instance scaled to TARGET_SIZE bounding box */
function placeGLBInstance(
  container: BABYLON.AssetContainer,
  name: string,
  position: BABYLON.Vector3,
  _scene: BABYLON.Scene,
  rotation?: number,
): BABYLON.TransformNode {
  const instance = container.instantiateModelsToScene(
    (n) => `${name}_${n}`,
  );

  const root = instance.rootNodes[0] as BABYLON.TransformNode;
  root.position = position;
  if (rotation) root.rotation.y = rotation;

  // Scale to fit target bounding box
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
      root.scaling.setAll(TARGET_SIZE / maxDim);
    }
  }

  return root;
}

/** Procedural fallback colors per asset type */
const FALLBACK_COLORS: Record<InfraAssetType, [number, number, number]> = {
  pdu: [0.3, 0.35, 0.4],      // steel grey
  gas_cabinet: [0.7, 0.6, 0.2], // safety yellow
  scrubber: [0.4, 0.5, 0.45],   // industrial green-grey
  chiller: [0.25, 0.45, 0.6],   // cooling blue
  amhs: [0.5, 0.5, 0.5],        // neutral grey
  ffu: [0.85, 0.85, 0.85],      // clean white
};

/** Create simple procedural geometry as fallback when GLB is missing */
function createProceduralFallback(
  type: InfraAssetType,
  name: string,
  position: BABYLON.Vector3,
  scene: BABYLON.Scene,
  rotation?: number,
): BABYLON.TransformNode {
  const root = new BABYLON.TransformNode(name, scene);
  root.position = position;
  if (rotation) root.rotation.y = rotation;

  const color = FALLBACK_COLORS[type];
  const mat = new BABYLON.PBRMaterial(`${name}_mat`, scene);
  mat.albedoColor = new BABYLON.Color3(...color);
  mat.metallic = 0.3;
  mat.roughness = 0.7;

  let mesh: BABYLON.Mesh;

  switch (type) {
    case 'pdu': {
      // Tall cabinet box
      mesh = BABYLON.MeshBuilder.CreateBox(`${name}_box`, { width: 0.6, height: 1.8, depth: 0.5 }, scene);
      mesh.position.y = 0.9;
      break;
    }
    case 'gas_cabinet': {
      // Cylinder cluster
      mesh = BABYLON.MeshBuilder.CreateCylinder(`${name}_cyl`, { height: 1.5, diameter: 0.4, tessellation: 12 }, scene);
      mesh.position.y = 0.75;
      const cyl2 = BABYLON.MeshBuilder.CreateCylinder(`${name}_cyl2`, { height: 1.5, diameter: 0.4, tessellation: 12 }, scene);
      cyl2.position.set(0.35, 0.75, 0);
      cyl2.material = mat;
      cyl2.parent = root;
      break;
    }
    case 'scrubber': {
      // Tall cylinder with dome top
      mesh = BABYLON.MeshBuilder.CreateCylinder(`${name}_body`, { height: 2.0, diameter: 0.8, tessellation: 16 }, scene);
      mesh.position.y = 1.0;
      const dome = BABYLON.MeshBuilder.CreateSphere(`${name}_dome`, { diameter: 0.8, segments: 8, slice: 0.5 }, scene);
      dome.position.y = 2.0;
      dome.material = mat;
      dome.parent = root;
      break;
    }
    case 'chiller': {
      // Wide box with fan circles
      mesh = BABYLON.MeshBuilder.CreateBox(`${name}_body`, { width: 1.5, height: 1.2, depth: 0.8 }, scene);
      mesh.position.y = 0.6;
      const fan = BABYLON.MeshBuilder.CreateTorus(`${name}_fan`, { diameter: 0.5, thickness: 0.04, tessellation: 16 }, scene);
      fan.position.set(0, 0.6, 0.41);
      fan.material = mat;
      fan.parent = root;
      break;
    }
    case 'amhs': {
      // Rail + carrier box
      const rail = BABYLON.MeshBuilder.CreateBox(`${name}_rail`, { width: 3, height: 0.08, depth: 0.15 }, scene);
      rail.position.y = 2.8;
      rail.material = mat;
      rail.parent = root;
      mesh = BABYLON.MeshBuilder.CreateBox(`${name}_carrier`, { width: 0.5, height: 0.3, depth: 0.5 }, scene);
      mesh.position.y = 2.5;
      break;
    }
    case 'ffu': {
      // Flat ceiling panel
      mesh = BABYLON.MeshBuilder.CreateBox(`${name}_panel`, { width: 1.2, height: 0.15, depth: 0.6 }, scene);
      mesh.position.y = 2.9;
      break;
    }
  }

  mesh.material = mat;
  mesh.parent = root;

  return root;
}
