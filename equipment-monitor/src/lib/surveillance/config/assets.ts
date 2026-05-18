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
    base: '/models/character/engineer_white.glb',
    suitBlue: '/models/character/engineer_blue.glb',
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

// PBR color palette per equipment type — used as fallback when GLB materials are bland
const EQUIPMENT_COLORS: Record<EquipmentKey, { albedo: [number, number, number]; metallic: number; roughness: number; emissive?: [number, number, number] }> = {
  chamber: { albedo: [0.55, 0.57, 0.60], metallic: 0.7, roughness: 0.3, emissive: [0.01, 0.02, 0.04] },
  efem: { albedo: [0.70, 0.72, 0.75], metallic: 0.6, roughness: 0.35 },
  stepper: { albedo: [0.35, 0.38, 0.50], metallic: 0.5, roughness: 0.4, emissive: [0.02, 0.01, 0.04] },
  metrology: { albedo: [0.45, 0.48, 0.52], metallic: 0.6, roughness: 0.3, emissive: [0.00, 0.03, 0.03] },
  spinCoater: { albedo: [0.50, 0.52, 0.55], metallic: 0.4, roughness: 0.5 },
  robotArm: { albedo: [0.85, 0.55, 0.10], metallic: 0.7, roughness: 0.25, emissive: [0.03, 0.01, 0.0] },
  waferCassette: { albedo: [0.25, 0.25, 0.30], metallic: 0.3, roughness: 0.6 },
};

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

          // Apply colored PBR materials — replace bland/white GLB materials
          const palette = EQUIPMENT_COLORS[placement.assetKey];
          for (const mesh of childMeshes) {
            const mat = new BABYLON.PBRMaterial(`${placement.label}_mat_${mesh.name}`, scene);
            mat.albedoColor = new BABYLON.Color3(...palette.albedo);
            mat.metallic = palette.metallic;
            mat.roughness = palette.roughness;
            if (palette.emissive) {
              mat.emissiveColor = new BABYLON.Color3(...palette.emissive);
            }
            mat.freeze();
            mesh.material = mat;
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

// PBR suit colors per variant (Meshy preview models have no texture)
const SUIT_COLORS: Record<string, { albedo: [number, number, number]; emissive?: [number, number, number] }> = {
  base: { albedo: [0.88, 0.90, 0.92] }, // white cleanroom suit
  blue: { albedo: [0.35, 0.55, 0.80], emissive: [0.01, 0.02, 0.05] }, // blue cleanroom suit
};

const CHARACTER_EYE_HEIGHT_M = 1.57;
const CHARACTER_FACE_LOCAL_Z_M = -0.065;

function createArGlassesMaterial(scene: BABYLON.Scene): {
  frame: BABYLON.PBRMaterial;
  lens: BABYLON.PBRMaterial;
  emitter: BABYLON.PBRMaterial;
} {
  const frame = new BABYLON.PBRMaterial('ar_glasses_frame_mat', scene);
  frame.albedoColor = new BABYLON.Color3(0.02, 0.04, 0.05);
  frame.metallic = 0.75;
  frame.roughness = 0.22;
  frame.emissiveColor = new BABYLON.Color3(0, 0.03, 0.04);
  frame.freeze();

  const lens = new BABYLON.PBRMaterial('ar_glasses_waveguide_mat', scene);
  lens.albedoColor = new BABYLON.Color3(0.18, 0.88, 1);
  lens.emissiveColor = new BABYLON.Color3(0.02, 0.45, 0.55);
  lens.metallic = 0.05;
  lens.roughness = 0.08;
  lens.alpha = 0.38;
  lens.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
  lens.freeze();

  const emitter = new BABYLON.PBRMaterial('ar_glasses_emitter_mat', scene);
  emitter.albedoColor = new BABYLON.Color3(0.04, 0.20, 0.24);
  emitter.emissiveColor = new BABYLON.Color3(0.0, 0.75, 0.9);
  emitter.metallic = 0.35;
  emitter.roughness = 0.12;
  emitter.freeze();

  return { frame, lens, emitter };
}

function createArGlassesPart(
  scene: BABYLON.Scene,
  parent: BABYLON.TransformNode,
  name: string,
  size: { width: number; height: number; depth: number },
  position: BABYLON.Vector3,
  material: BABYLON.Material,
): BABYLON.Mesh {
  const mesh = BABYLON.MeshBuilder.CreateBox(name, size, scene);
  mesh.parent = parent;
  mesh.position = position;
  mesh.material = material;
  mesh.isPickable = false;
  mesh.receiveShadows = false;
  return mesh;
}

function createProceduralArGlasses(
  scene: BABYLON.Scene,
  variant: 'base' | 'blue',
  root: BABYLON.TransformNode,
): BABYLON.TransformNode {
  const rootScale = root.scaling.x || 1;
  const anchor = new BABYLON.TransformNode(`arGlasses_${variant}`, scene);
  anchor.parent = root;
  anchor.scaling.setAll(1 / rootScale);
  anchor.position.set(
    0,
    (CHARACTER_EYE_HEIGHT_M - root.position.y) / rootScale,
    CHARACTER_FACE_LOCAL_Z_M / rootScale,
  );

  const { frame, lens, emitter } = createArGlassesMaterial(scene);

  createArGlassesPart(scene, anchor, `arGlasses_${variant}_left_waveguide`,
    { width: 0.052, height: 0.032, depth: 0.004 }, new BABYLON.Vector3(-0.034, 0, -0.004), lens);
  createArGlassesPart(scene, anchor, `arGlasses_${variant}_right_waveguide`,
    { width: 0.052, height: 0.032, depth: 0.004 }, new BABYLON.Vector3(0.034, 0, -0.004), lens);
  createArGlassesPart(scene, anchor, `arGlasses_${variant}_brow_bar`,
    { width: 0.155, height: 0.006, depth: 0.010 }, new BABYLON.Vector3(0, 0.024, 0), frame);
  createArGlassesPart(scene, anchor, `arGlasses_${variant}_bridge`,
    { width: 0.018, height: 0.008, depth: 0.010 }, new BABYLON.Vector3(0, 0.005, -0.001), frame);
  createArGlassesPart(scene, anchor, `arGlasses_${variant}_left_temple`,
    { width: 0.010, height: 0.010, depth: 0.070 }, new BABYLON.Vector3(-0.083, 0.004, 0.040), frame);
  createArGlassesPart(scene, anchor, `arGlasses_${variant}_right_temple`,
    { width: 0.010, height: 0.010, depth: 0.070 }, new BABYLON.Vector3(0.083, 0.004, 0.040), frame);
  createArGlassesPart(scene, anchor, `arGlasses_${variant}_right_sensor_pod`,
    { width: 0.024, height: 0.016, depth: 0.026 }, new BABYLON.Vector3(0.086, 0.006, -0.014), emitter);
  createArGlassesPart(scene, anchor, `arGlasses_${variant}_micro_projector`,
    { width: 0.030, height: 0.018, depth: 0.002 }, new BABYLON.Vector3(0.043, 0.006, -0.033), lens);

  return anchor;
}

/**
 * Load a character GLB (base or blue suit), attach separate AR glasses accessory,
 * apply suit color tinting, and ground the model at Y=0.
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

  // Scale character to ~1.7m height and ground the model
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
    // Recompute after scaling to ground the feet at Y=0
    root.computeWorldMatrix(true);
    let groundMinY = Infinity;
    for (const mesh of childMeshes) {
      mesh.computeWorldMatrix(true);
      const bi = mesh.getBoundingInfo();
      groundMinY = Math.min(groundMinY, bi.boundingBox.minimumWorld.y);
    }
    if (Math.abs(groundMinY) > 0.05) {
      root.position.y = -groundMinY;
    }

    // Apply suit color tint (Meshy preview models are untextured gray)
    const colors = SUIT_COLORS[variant] ?? SUIT_COLORS.base;
    for (const mesh of childMeshes) {
      const mat = new BABYLON.PBRMaterial(`suit_${variant}_${mesh.name}`, scene);
      mat.albedoColor = new BABYLON.Color3(...colors.albedo);
      mat.metallic = 0.05;
      mat.roughness = 0.7;
      if (colors.emissive) {
        mat.emissiveColor = new BABYLON.Color3(...colors.emissive);
      }
      mat.freeze();
      mesh.material = mat;
    }
  }

  const headNode = createProceduralArGlasses(scene, variant, root);

  return { root, headNode, allMeshes };
}
