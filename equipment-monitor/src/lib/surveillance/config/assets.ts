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
    // High-fidelity Meshy AI hero models (textured) — keep their own materials.
    chamber: '/models/equipment/plasma_etcher.glb',
    efem: '/models/equipment/automation_cell.glb',
    stepper: '/models/equipment/litho_scanner.glb',
    metrology: '/models/equipment/wafer_processor.glb',
    spinCoater: '/models/equipment/wet_bench.glb',
    robotArm: '/models/equipment/cluster_tool.glb',
    cmp: '/models/equipment/cmp_polisher.glb',
    furnace: '/models/equipment/diffusion_furnace.glb',
    pvd: '/models/equipment/vacuum_chamber.glb',
    // Legacy lightweight model (untextured) — flat PBR palette applied.
    waferCassette: '/models/equipment/wafer_cassette.glb',
  },
  character: {
    base: '/models/character/engineer_white.glb',
    suitBlue: '/models/character/engineer_blue.glb',
    casualWalk: '/models/character/Meshy_AI_Animation_Casual_Walk_withSkin.glb',
    walking: '/models/character/Meshy_AI_Animation_Walking_withSkin.glb',
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
  { assetKey: 'cmp', position: [4, 0, -6], label: 'CMP-01' },
  { assetKey: 'pvd', position: [8, 0, -3], label: 'PVD-01' },

  // Eastern process bay — diffusion furnace + extra CMP head
  { assetKey: 'furnace', position: [8, 0, 1], label: 'FURN-01' },
  { assetKey: 'cmp', position: [4, 0, 1], rotation: Math.PI, label: 'CMP-02' },

  // Chemical storage area (inside restricted zone)
  { assetKey: 'chamber', position: [11, 0, -7], label: 'CHEM-01' },
  { assetKey: 'efem', position: [11, 0, -5], rotation: -Math.PI / 2, label: 'EFEM-02' },
];

// Target bounding box for equipment scaling (fallback for degenerate models).
const EQUIPMENT_TARGET_SIZE = 2.2;
// Scale process tools by HEIGHT so they stand clearly taller than the ~1.7 m
// engineers (real fab tools are ~2.5–3.5 m). Most Meshy models are wider than
// tall, so the old max-dimension cap made them too short.
const EQUIPMENT_TARGET_HEIGHT = 2.8;
// Safety net: stop a pathologically wide/flat model from sprawling over neighbors.
const EQUIPMENT_MAX_FOOTPRINT = 5.0;

// PBR color palette per equipment type — used as fallback when GLB materials are bland
const EQUIPMENT_COLORS: Record<EquipmentKey, { albedo: [number, number, number]; metallic: number; roughness: number; emissive?: [number, number, number] }> = {
  chamber: { albedo: [0.55, 0.57, 0.60], metallic: 0.7, roughness: 0.3, emissive: [0.01, 0.02, 0.04] },
  efem: { albedo: [0.70, 0.72, 0.75], metallic: 0.6, roughness: 0.35 },
  stepper: { albedo: [0.35, 0.38, 0.50], metallic: 0.5, roughness: 0.4, emissive: [0.02, 0.01, 0.04] },
  metrology: { albedo: [0.45, 0.48, 0.52], metallic: 0.6, roughness: 0.3, emissive: [0.00, 0.03, 0.03] },
  spinCoater: { albedo: [0.50, 0.52, 0.55], metallic: 0.4, roughness: 0.5 },
  robotArm: { albedo: [0.85, 0.55, 0.10], metallic: 0.7, roughness: 0.25, emissive: [0.03, 0.01, 0.0] },
  cmp: { albedo: [0.55, 0.57, 0.62], metallic: 0.6, roughness: 0.35 },
  furnace: { albedo: [0.60, 0.45, 0.40], metallic: 0.5, roughness: 0.4, emissive: [0.04, 0.01, 0.0] },
  pvd: { albedo: [0.62, 0.50, 0.32], metallic: 0.75, roughness: 0.28 },
  waferCassette: { albedo: [0.25, 0.25, 0.30], metallic: 0.3, roughness: 0.6 },
};

// Hero models shipped with their own baked Meshy textures — keep those materials
// instead of overriding with the flat PBR palette (which is only for bland GLBs).
const TEXTURED_EQUIPMENT = new Set<EquipmentKey>([
  'chamber', 'efem', 'stepper', 'metrology', 'spinCoater', 'robotArm', 'cmp', 'furnace', 'pvd',
]);

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
      const container = await BABYLON.LoadAssetContainerAsync(path, scene);
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
          const footprint = Math.max(extents.x, extents.z);
          let scale = 0;
          if (extents.y > 0.001) {
            scale = EQUIPMENT_TARGET_HEIGHT / extents.y;
            if (footprint > 0 && footprint * scale > EQUIPMENT_MAX_FOOTPRINT) {
              scale = EQUIPMENT_MAX_FOOTPRINT / footprint;
            }
          } else if (maxDim > 0) {
            scale = EQUIPMENT_TARGET_SIZE / maxDim;
          }
          if (scale > 0) {
            root.scaling.setAll(scale);
          }

          // Ground the model. Meshy GLB origins sit at the geometric center, so
          // after scaling the base lands below the floor (only the top half shows).
          // Recompute the scaled world bounds and drop the base to placement Y.
          root.computeWorldMatrix(true);
          let groundMinY = Infinity;
          for (const child of childMeshes) {
            child.computeWorldMatrix(true);
            groundMinY = Math.min(groundMinY, child.getBoundingInfo().boundingBox.minimumWorld.y);
          }
          if (Number.isFinite(groundMinY)) {
            root.position.y += placement.position[1] - groundMinY;
          }

          // Textured hero models keep their own baked materials; only the legacy
          // bland GLBs get the flat colored PBR palette.
          const keepTextures = TEXTURED_EQUIPMENT.has(placement.assetKey);
          const palette = EQUIPMENT_COLORS[placement.assetKey];
          for (const mesh of childMeshes) {
            if (!keepTextures) {
              const mat = new BABYLON.PBRMaterial(`${placement.label}_mat_${mesh.name}`, scene);
              mat.albedoColor = new BABYLON.Color3(...palette.albedo);
              mat.metallic = palette.metallic;
              mat.roughness = palette.roughness;
              if (palette.emissive) {
                mat.emissiveColor = new BABYLON.Color3(...palette.emissive);
              }
              mat.freeze();
              mesh.material = mat;
            }
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
  animationGroups?: BABYLON.AnimationGroup[];
  hasSkeletalWalk?: boolean;
}

// PBR suit colors per variant (Meshy preview models have no texture)
const SUIT_COLORS: Record<string, { albedo: [number, number, number]; emissive?: [number, number, number] }> = {
  base: { albedo: [0.88, 0.90, 0.92] }, // white cleanroom suit
  blue: { albedo: [0.35, 0.55, 0.80], emissive: [0.01, 0.02, 0.05] }, // blue cleanroom suit
};

// Anchor at forehead level — model centering pulls the visor down to eye level
const CHARACTER_EYE_HEIGHT_M = 1.65;
const CHARACTER_FACE_LOCAL_Z_M = 0.08;
const AR_HEADSET_TARGET_WIDTH_M = 0.22;

async function loadArHeadsetGLB(
  scene: BABYLON.Scene,
  variant: 'base' | 'blue',
  root: BABYLON.TransformNode,
): Promise<BABYLON.TransformNode | null> {
  const rootScale = root.scaling.x || 1;
  const anchor = new BABYLON.TransformNode(`arGlasses_${variant}`, scene);
  anchor.parent = root;
  anchor.scaling.setAll(1 / rootScale);
  anchor.position.set(
    0,
    (CHARACTER_EYE_HEIGHT_M - root.position.y) / rootScale,
    CHARACTER_FACE_LOCAL_Z_M / rootScale,
  );

  try {
    const headsetPath = BASE_PATH + ASSET_PATHS.accessory.arGlasses;
    const headsetResult = await BABYLON.ImportMeshAsync(headsetPath, scene);
    const modelRoot = new BABYLON.TransformNode(`arGlasses_${variant}_model`, scene);

    for (const mesh of headsetResult.meshes) {
      mesh.isPickable = false;
      mesh.receiveShadows = false;
      if (!mesh.parent) {
        mesh.parent = modelRoot;
      }
    }

    const childMeshes = modelRoot.getChildMeshes();
    if (childMeshes.length > 0) {
      let minVec = new BABYLON.Vector3(Infinity, Infinity, Infinity);
      let maxVec = new BABYLON.Vector3(-Infinity, -Infinity, -Infinity);
      for (const mesh of childMeshes) {
        mesh.computeWorldMatrix(true);
        const bounds = mesh.getBoundingInfo().boundingBox;
        minVec = BABYLON.Vector3.Minimize(minVec, bounds.minimumWorld);
        maxVec = BABYLON.Vector3.Maximize(maxVec, bounds.maximumWorld);
      }

      const center = minVec.add(maxVec).scale(0.5);
      const extents = maxVec.subtract(minVec);
      if (extents.x > 0) {
        const scale = AR_HEADSET_TARGET_WIDTH_M / extents.x;
        modelRoot.scaling.setAll(scale);
        // Center X/Z but align bottom (visor) to anchor — don't center Y
        const bottomOffset = -minVec.y * scale;
        modelRoot.position.set(-center.x * scale, bottomOffset, -center.z * scale);
      }
    }

    for (const group of headsetResult.animationGroups) {
      group.stop();
    }

    modelRoot.parent = anchor;
  } catch (e) {
    anchor.dispose();
    console.warn('[surveillance] AR headset not loaded:', (e as Error).message);
    return null;
  }

  return anchor;
}

/**
 * Load a character GLB (base or blue suit), attach separate AR glasses accessory,
 * apply suit color tinting, and ground the model at Y=0.
 */
export async function loadCharacterGLB(
  scene: BABYLON.Scene,
  variant: 'base' | 'blue' | 'casual' | 'walking' = 'base',
): Promise<LoadedCharacter> {
  // Only base/blue are static-suit GLBs; other variants fall back to the base model.
  const suitVariant: 'base' | 'blue' = variant === 'blue' ? 'blue' : 'base';
  const charPath = suitVariant === 'blue'
    ? BASE_PATH + ASSET_PATHS.character.suitBlue
    : BASE_PATH + ASSET_PATHS.character.base;

  const charResult = await BABYLON.ImportMeshAsync(charPath, scene);
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
    const colors = SUIT_COLORS[suitVariant] ?? SUIT_COLORS.base;
    for (const mesh of childMeshes) {
      const mat = new BABYLON.PBRMaterial(`suit_${suitVariant}_${mesh.name}`, scene);
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

  const headNode = await loadArHeadsetGLB(scene, suitVariant, root);

  return { root, headNode, allMeshes };
}

// Probe-derived root-motion flags for the skinned walk models (both in-place).
const ANIMATED_HAS_ROOT_MOTION: Record<'casualWalk' | 'walking', boolean> = {
  casualWalk: false,
  walking: false,
};

/**
 * Load a textured skinned-walk character GLB and return its walk AnimationGroup(s).
 * Keeps the model's original materials (the '*_withSkin' models are textured).
 * The engineer agent plays/pauses the walk group based on walking/idle state.
 */
export async function loadAnimatedCharacterGLB(
  scene: BABYLON.Scene,
  modelKey: 'casualWalk' | 'walking',
): Promise<LoadedCharacter> {
  const charPath = BASE_PATH + ASSET_PATHS.character[modelKey];
  const charResult = await BABYLON.ImportMeshAsync(charPath, scene);
  const root = charResult.meshes[0] as unknown as BABYLON.TransformNode;
  const allMeshes = [...charResult.meshes];

  // Scale character to ~1.7m height and ground the model (same logic as loadCharacterGLB).
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
  }

  // Collect walk animation groups; stop initially (agent drives playback by state).
  const groups = charResult.animationGroups ?? [];
  for (const group of groups) {
    group.stop();
  }
  // Pick the walk group: longest-duration group, falling back to index 0.
  let walkGroups: BABYLON.AnimationGroup[] = [];
  if (groups.length === 1) {
    walkGroups = [groups[0]];
  } else if (groups.length > 1) {
    let best = groups[0];
    for (const group of groups) {
      if (group.to - group.from > best.to - best.from) best = group;
    }
    walkGroups = [best];
  }

  // If the model carries root motion, strip top-level position channels so the walk
  // plays in place (defensive — both probed models report hasRootMotion=false).
  if (ANIMATED_HAS_ROOT_MOTION[modelKey]) {
    for (const group of walkGroups) {
      const targeted = group.targetedAnimations ?? [];
      for (let i = targeted.length - 1; i >= 0; i--) {
        const ta = targeted[i];
        const isPosition = ta?.animation?.targetProperty === 'position';
        const isRoot = ta?.target === root || (ta?.target as BABYLON.Node)?.parent == null;
        if (isPosition && isRoot) {
          targeted.splice(i, 1);
        }
      }
    }
  }

  return {
    root,
    headNode: null,
    allMeshes,
    animationGroups: walkGroups,
    hasSkeletalWalk: true,
  };
}
