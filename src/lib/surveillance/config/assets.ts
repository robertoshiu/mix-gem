/**
 * Surveillance asset configuration + async GLB loaders.
 * Loads equipment, characters, and HDRI from public/models/.
 */
import * as BABYLON from '@babylonjs/core';
import { HDRCubeTexture } from '@babylonjs/core/Materials/Textures/hdrCubeTexture';
import '@babylonjs/loaders/glTF';

// Base path for GitHub Pages static export. Keep aligned with next.config.ts.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '/mix-gem';

export const ASSET_PATHS = {
  hdri: '/env/cleanroom.env',
  equipment: {
    chamber: '/models/equipment/chamber.glb',
    efem: '/models/equipment/efem.glb',
    stepper: '/models/equipment/stepper.glb',
    metrology: '/models/equipment/metrology.glb',
    spinCoater: '/models/equipment/spin_coater.glb',
    robotArm: '/models/equipment/robot_arm.glb',
    waferCassette: '/models/equipment/wafer_cassette.glb',
  },
  character: {
    base: '/models/character/base.glb',
    suitBlue: '/models/character/suit_blue.glb',
  },
  accessory: {
    arGlasses: '/models/accessory/ar_glasses.glb',
  },
} as const;

export type EquipmentKey = keyof typeof ASSET_PATHS.equipment;

// Equipment placement in the fab (matches zones.ts coordinate system)
export interface EquipmentPlacement {
  assetKey: EquipmentKey;
  position: [number, number, number];
  rotation?: number;
  label: string;
}

export const equipmentLayout: EquipmentPlacement[] = [
  // Litho bay (north-west, inside restricted zone)
  { assetKey: 'stepper', position: [-9, 0, 3], label: 'LITHO-01' },
  { assetKey: 'stepper', position: [-9, 0, -2], label: 'LITHO-02' },
  { assetKey: 'spinCoater', position: [-4, 0, 3], rotation: Math.PI / 2, label: 'COAT-01' },

  // Central process bay
  { assetKey: 'chamber', position: [0, 0, 4], label: 'CVD-01' },
  { assetKey: 'chamber', position: [4, 0, 4], label: 'ETCH-01' },
  { assetKey: 'robotArm', position: [2, 0, 2], label: 'ROBOT-01' },

  // South row
  { assetKey: 'efem', position: [-4, 0, -6], rotation: Math.PI, label: 'EFEM-01' },
  { assetKey: 'metrology', position: [0, 0, -6], label: 'SEM-01' },
  { assetKey: 'metrology', position: [4, 0, -6], label: 'SEM-02' },
  { assetKey: 'chamber', position: [8, 0, -3], label: 'PVD-01' },

  // Chemical storage area (inside restricted zone)
  { assetKey: 'chamber', position: [11, 0, -7], label: 'CHEM-01' },
  { assetKey: 'efem', position: [11, 0, -5], rotation: -Math.PI / 2, label: 'EFEM-02' },
];

// Target bounding box for equipment scaling
const EQUIPMENT_TARGET_SIZE = 2.2;

export interface LoadedEquipment {
  meshes: Map<string, BABYLON.AbstractMesh>;
  labels: Map<string, BABYLON.Vector3>; // label -> world position for HUD
}

/**
 * Load HDRI environment texture for PBR lighting.
 */
export async function loadEnvironment(scene: BABYLON.Scene): Promise<void> {
  try {
    const envPath = BASE_PATH + ASSET_PATHS.hdri;
    const envTexture = new HDRCubeTexture(envPath, scene, 256, false, true, false, true);
    scene.environmentTexture = envTexture;
    scene.environmentIntensity = 0.5;
  } catch (e) {
    console.warn('[surveillance] HDRI not available, using fallback lighting:', (e as Error).message);
  }
}

/**
 * Load all equipment GLBs and place them at configured positions.
 * Returns mesh map and label positions for the AR HUD.
 */
export async function loadEquipmentGLBs(
  scene: BABYLON.Scene,
  shadowGen: BABYLON.ShadowGenerator,
): Promise<LoadedEquipment> {
  const result: LoadedEquipment = {
    meshes: new Map(),
    labels: new Map(),
  };

  // Load each unique asset type as a container
  const containers = new Map<EquipmentKey, BABYLON.AssetContainer>();

  const uniqueKeys = [...new Set(equipmentLayout.map(e => e.assetKey))];
  const loadPromises = uniqueKeys.map(async (key) => {
    const path = BASE_PATH + ASSET_PATHS.equipment[key];
    try {
      const container = await BABYLON.SceneLoader.LoadAssetContainerAsync('', path, scene);
      containers.set(key, container);
    } catch {
      console.warn(`[surveillance] Equipment not found: ${key}`);
    }
  });

  await Promise.all(loadPromises);

  // Instance equipment at each placement position
  for (const placement of equipmentLayout) {
    const container = containers.get(placement.assetKey);
    if (!container) continue;

    const instance = container.instantiateModelsToScene(
      (name) => `${placement.label}_${name}`,
    );

    for (const root of instance.rootNodes) {
      if (root instanceof BABYLON.TransformNode) {
        root.position = new BABYLON.Vector3(...placement.position);
        if (placement.rotation) {
          root.rotation.y = placement.rotation;
        }

        // Scale to fit target bounding box
        const childMeshes = root.getChildMeshes();
        if (childMeshes.length > 0) {
          let minVec = new BABYLON.Vector3(Infinity, Infinity, Infinity);
          let maxVec = new BABYLON.Vector3(-Infinity, -Infinity, -Infinity);
          for (const child of childMeshes) {
            child.computeWorldMatrix(true);
            const bi = child.getBoundingInfo();
            minVec = BABYLON.Vector3.Minimize(minVec, bi.boundingBox.minimumWorld);
            maxVec = BABYLON.Vector3.Maximize(maxVec, bi.boundingBox.maximumWorld);
          }
          const extents = maxVec.subtract(minVec);
          const maxDim = Math.max(extents.x, extents.y, extents.z);
          if (maxDim > 0) {
            const scale = EQUIPMENT_TARGET_SIZE / maxDim;
            root.scaling.setAll(scale);
          }

          // Add shadow casters
          for (const mesh of childMeshes) {
            shadowGen.addShadowCaster(mesh);
            mesh.receiveShadows = true;
          }
        }

        root.freezeWorldMatrix();
        const worldPos = new BABYLON.Vector3(
          placement.position[0],
          placement.position[1] + 2.5,
          placement.position[2],
        );
        result.meshes.set(placement.label, root as unknown as BABYLON.AbstractMesh);
        result.labels.set(placement.label, worldPos);
      }
    }
  }

  console.log(`[surveillance] Equipment loaded: ${result.meshes.size}/${equipmentLayout.length}`);
  return result;
}

export interface LoadedCharacter {
  root: BABYLON.TransformNode;
  headNode: BABYLON.TransformNode | null;
  allMeshes: BABYLON.AbstractMesh[];
}

/**
 * Load a character GLB (base or blue suit) with AR glasses attached to head.
 */
export async function loadCharacterGLB(
  scene: BABYLON.Scene,
  variant: 'base' | 'blue' = 'base',
): Promise<LoadedCharacter> {
  const charPath = variant === 'blue'
    ? BASE_PATH + ASSET_PATHS.character.suitBlue
    : BASE_PATH + ASSET_PATHS.character.base;

  const charResult = await BABYLON.SceneLoader.ImportMeshAsync(null, '', charPath, scene);
  const root = charResult.meshes[0] as unknown as BABYLON.TransformNode;
  const allMeshes = [...charResult.meshes];

  // Find head bone or node for AR glasses attachment
  let headNode: BABYLON.TransformNode | null = null;
  const skeleton = charResult.skeletons[0];

  if (skeleton) {
    const headBone = skeleton.bones.find(b =>
      b.name.toLowerCase().includes('head'),
    );
    if (headBone) {
      // Create a TransformNode attached to head bone
      headNode = new BABYLON.TransformNode(`${variant}_headAttach`, scene);
      headNode.attachToBone(headBone, root as unknown as BABYLON.Mesh);
      headNode.position = new BABYLON.Vector3(0, 0.12, 0);
    }
  }

  // If no skeleton, find a child node named "head" or similar
  if (!headNode) {
    const descendants = root.getDescendants(false);
    const headChild = descendants.find(d =>
      d.name.toLowerCase().includes('head'),
    );
    if (headChild && headChild instanceof BABYLON.TransformNode) {
      headNode = headChild;
    } else {
      // Fallback: create a node at top of bounding box
      headNode = new BABYLON.TransformNode(`${variant}_headFallback`, scene);
      headNode.parent = root;
      headNode.position = new BABYLON.Vector3(0, 1.6, 0);
    }
  }

  // Load AR glasses and attach to head
  try {
    const glassesPath = BASE_PATH + ASSET_PATHS.accessory.arGlasses;
    const glassesResult = await BABYLON.SceneLoader.ImportMeshAsync(null, '', glassesPath, scene);
    const glassesRoot = glassesResult.meshes[0];
    glassesRoot.parent = headNode;
    glassesRoot.position = new BABYLON.Vector3(0, 0.02, 0.08);
    glassesRoot.scaling = new BABYLON.Vector3(0.6, 0.6, 0.6);
    allMeshes.push(...glassesResult.meshes);
  } catch {
    console.warn(`[surveillance] AR glasses not available for ${variant}`);
  }

  // Scale character to ~1.7m height
  const childMeshes = root.getChildMeshes();
  if (childMeshes.length > 0) {
    root.computeWorldMatrix(true);
    let minY = Infinity;
    let maxY = -Infinity;
    for (const mesh of childMeshes) {
      mesh.computeWorldMatrix(true);
      const bi = mesh.getBoundingInfo();
      minY = Math.min(minY, bi.boundingBox.minimumWorld.y);
      maxY = Math.max(maxY, bi.boundingBox.maximumWorld.y);
    }
    const currentHeight = maxY - minY;
    if (currentHeight > 0 && Math.abs(currentHeight - 1.7) > 0.3) {
      const scale = 1.7 / currentHeight;
      root.scaling.scaleInPlace(scale);
    }
  }

  return { root, headNode, allMeshes };
}
