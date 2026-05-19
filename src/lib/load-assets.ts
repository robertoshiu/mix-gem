/**
 * Babylon.js asset loader for the semiconductor cleanroom scene.
 * Loads HDRI environment, equipment GLBs, character avatars with
 * cleanroom suit + accessories, and configures rendering pipeline.
 */
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
import { createCinematicPipeline } from './babylon-pipeline';

// Asset paths (relative to public/)
const ASSETS = {
  hdri: '/env/cleanroom.env',
  equipment: {
    chamber: '/models/equipment/chamber.glb',
    efem: '/models/equipment/efem.glb',
    wafer_cassette: '/models/equipment/wafer_cassette.glb',
    spin_coater: '/models/equipment/spin_coater.glb',
    stepper: '/models/equipment/stepper.glb',
    metrology: '/models/equipment/metrology.glb',
    robot_arm: '/models/equipment/robot_arm.glb',
  },
  character: {
    base: '/models/character/base.glb',
    suit: '/models/character/suit.glb',
  },
  accessory: {
    ar_glasses: '/models/accessory/ar_glasses.glb',
  },
} as const;

// Equipment layout grid (positions in the fab bay)
const EQUIPMENT_GRID: Array<{ id: keyof typeof ASSETS.equipment; pos: [number, number, number]; rot?: number }> = [
  { id: 'chamber', pos: [-8, 0, 0], rot: 0 },
  { id: 'chamber', pos: [-8, 0, 6], rot: 0 },
  { id: 'efem', pos: [-4, 0, 0], rot: Math.PI / 2 },
  { id: 'efem', pos: [-4, 0, 6], rot: Math.PI / 2 },
  { id: 'spin_coater', pos: [0, 0, 0] },
  { id: 'stepper', pos: [4, 0, 0] },
  { id: 'stepper', pos: [4, 0, 6] },
  { id: 'metrology', pos: [8, 0, 0] },
  { id: 'metrology', pos: [8, 0, 6] },
  { id: 'robot_arm', pos: [-6, 0, 3] },
  { id: 'robot_arm', pos: [2, 0, 3] },
  { id: 'wafer_cassette', pos: [-3, 0.8, 1] },
  { id: 'wafer_cassette', pos: [5, 0.8, 1] },
];

export interface LoadedAssets {
  equipment: Map<string, BABYLON.AbstractMesh[]>;
  workers: BABYLON.AbstractMesh[];
  environment: BABYLON.BaseTexture;
}

/**
 * Load all cleanroom assets into the scene.
 * Gracefully skips missing assets (logs warning).
 */
export async function loadCleanroomAssets(
  scene: BABYLON.Scene,
  camera: BABYLON.Camera,
  basePath: string = '',
): Promise<LoadedAssets> {
  const loaded: LoadedAssets = {
    equipment: new Map(),
    workers: [],
    environment: scene.environmentTexture!,
  };

  // 1. Load HDRI environment
  try {
    const envPath = basePath + ASSETS.hdri;
    const envTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(envPath, scene);
    scene.environmentTexture = envTexture;
    scene.environmentIntensity = 1.2;
    loaded.environment = envTexture;
    console.log('[loadAssets] Environment HDRI loaded');
  } catch (e) {
    console.warn('[loadAssets] HDRI not found, using default environment:', (e as Error).message);
  }

  // 2. Load equipment models
  const equipmentMeshes = new Map<string, BABYLON.AssetContainer>();

  for (const equipId of Object.keys(ASSETS.equipment) as Array<keyof typeof ASSETS.equipment>) {
    const modelPath = basePath + ASSETS.equipment[equipId];
    try {
      const container = await BABYLON.SceneLoader.LoadAssetContainerAsync(
        '',
        modelPath,
        scene,
      );
      equipmentMeshes.set(equipId, container);
    } catch {
      console.warn(`[loadAssets] Equipment model not found: ${equipId} (${modelPath})`);
    }
  }

  // 3. Instance equipment on the grid
  for (const placement of EQUIPMENT_GRID) {
    const container = equipmentMeshes.get(placement.id);
    if (!container) continue;

    const entries = container.instantiateModelsToScene(
      (name) => `${placement.id}_${name}_${placement.pos.join('_')}`,
    );

    for (const entry of entries.rootNodes) {
      if (entry instanceof BABYLON.TransformNode) {
        entry.position = new BABYLON.Vector3(...placement.pos);
        if (placement.rot) {
          entry.rotation.y = placement.rot;
        }
      }
    }

    const meshes = entries.rootNodes.flatMap(n =>
      n.getChildMeshes ? n.getChildMeshes() : []
    );
    loaded.equipment.set(placement.id, [
      ...(loaded.equipment.get(placement.id) || []),
      ...meshes,
    ]);
  }

  console.log(`[loadAssets] Equipment placed: ${EQUIPMENT_GRID.length} instances`);

  // 4. Load character (base + suit + accessories)
  try {
    const workerMeshes = await loadWorker(scene, basePath);
    loaded.workers.push(...workerMeshes);
    console.log('[loadAssets] Worker character loaded');
  } catch (e) {
    console.warn('[loadAssets] Worker character not available:', (e as Error).message);
  }

  // 5. Configure rendering pipeline
  createCinematicPipeline(scene, camera, {
    bloomThreshold: 0.85,
    bloomWeight: 0.3,
    bloomKernel: 64,
    glowIntensity: 0.4,
    enableSSAO: true,
    enableSSR: false, // Disabled for GitHub Pages compatibility
  });

  console.log('[loadAssets] Rendering pipeline configured');

  return loaded;
}

/**
 * Load a worker character: base avatar + cleanroom suit merged onto skeleton + AR glasses on head bone.
 */
async function loadWorker(scene: BABYLON.Scene, basePath: string): Promise<BABYLON.AbstractMesh[]> {
  const allMeshes: BABYLON.AbstractMesh[] = [];

  // Load base avatar
  const baseResult = await BABYLON.SceneLoader.ImportMeshAsync(
    null,
    '',
    basePath + ASSETS.character.base,
    scene,
  );

  const baseSkeleton = baseResult.skeletons[0];
  const baseRoot = baseResult.meshes[0];
  allMeshes.push(...baseResult.meshes);

  // Load cleanroom suit and parent to skeleton
  try {
    const suitResult = await BABYLON.SceneLoader.ImportMeshAsync(
      null,
      '',
      basePath + ASSETS.character.suit,
      scene,
    );

    for (const mesh of suitResult.meshes) {
      if (mesh === suitResult.meshes[0]) {
        // Parent suit root to base root
        mesh.parent = baseRoot;
      }
      // If suit has its own skeleton, try to retarget to base skeleton
      if (baseSkeleton && suitResult.skeletons.length > 0) {
        mesh.skeleton = baseSkeleton;
      }
      allMeshes.push(mesh);
    }
    console.log('[loadAssets] Cleanroom suit attached to avatar');
  } catch {
    console.warn('[loadAssets] Cleanroom suit not available');
  }

  // Load AR glasses and attach to head bone
  try {
    const glassesResult = await BABYLON.SceneLoader.ImportMeshAsync(
      null,
      '',
      basePath + ASSETS.accessory.ar_glasses,
      scene,
    );

    if (baseSkeleton) {
      const headBone = baseSkeleton.bones.find(b =>
        b.name.toLowerCase().includes('head')
      );

      if (headBone) {
        const glassesMesh = glassesResult.meshes[0];
        glassesMesh.attachToBone(headBone, baseRoot as BABYLON.Mesh);
        // Adjust position relative to head
        glassesMesh.position = new BABYLON.Vector3(0, 0.05, 0.08);
        glassesMesh.scaling = new BABYLON.Vector3(0.01, 0.01, 0.01);
      }
    }

    allMeshes.push(...glassesResult.meshes);
    console.log('[loadAssets] AR glasses attached to head bone');
  } catch {
    console.warn('[loadAssets] AR glasses not available');
  }

  return allMeshes;
}
