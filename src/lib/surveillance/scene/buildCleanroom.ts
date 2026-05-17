/**
 * Constructs the fab cleanroom scene with PBR materials and loaded GLB assets.
 * Async — loads HDRI environment and equipment models.
 */
import { Scene } from '@babylonjs/core/scene';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import { restrictedZones } from '../config/zones';
import { loadEnvironment, loadEquipmentGLBs, type LoadedEquipment } from '../config/assets';

const FAB_WIDTH = 30;
const FAB_DEPTH = 20;
const FAB_HEIGHT = 3.5;
const TILE_SIZE = 2;

export interface CleanroomScene {
  equipment: LoadedEquipment;
  shadowGenerator: ShadowGenerator;
}

export async function buildCleanroom(scene: Scene): Promise<CleanroomScene> {
  scene.clearColor = new Color4(0.01, 0.01, 0.02, 1);

  // Load HDRI environment for PBR reflections
  await loadEnvironment(scene);

  // Lighting
  const ambient = new HemisphericLight('ambient', new Vector3(0, 1, 0), scene);
  ambient.intensity = 0.15;
  ambient.diffuse = new Color3(0.92, 0.95, 1.0);

  const sun = new DirectionalLight('sun', new Vector3(-0.5, -1, 0.3), scene);
  sun.position = new Vector3(10, 20, -10);
  sun.intensity = 0.5;

  const shadowGen = new ShadowGenerator(512, sun);
  shadowGen.useBlurExponentialShadowMap = true;
  shadowGen.blurKernel = 16;

  // Static geometry
  buildFloor(scene);
  buildCeiling(scene);
  buildWalls(scene);
  buildRestrictedZoneVisuals(scene);

  // Load equipment GLBs
  const equipment = await loadEquipmentGLBs(scene, shadowGen);

  return { equipment, shadowGenerator: shadowGen };
}

function buildFloor(scene: Scene): void {
  const floorMat = new PBRMaterial('floorMat', scene);
  floorMat.albedoColor = new Color3(0.18, 0.20, 0.25);
  floorMat.metallic = 0.1;
  floorMat.roughness = 0.7;
  floorMat.freeze();

  const tile = MeshBuilder.CreateBox('floorTile', {
    width: TILE_SIZE,
    height: 0.05,
    depth: TILE_SIZE,
  }, scene);
  tile.material = floorMat;
  tile.receiveShadows = true;
  tile.isVisible = false;

  const tilesX = Math.ceil(FAB_WIDTH / TILE_SIZE);
  const tilesZ = Math.ceil(FAB_DEPTH / TILE_SIZE);
  const offsetX = -FAB_WIDTH / 2;
  const offsetZ = -FAB_DEPTH / 2;

  for (let x = 0; x < tilesX; x++) {
    for (let z = 0; z < tilesZ; z++) {
      const inst = tile.createInstance(`floor_${x}_${z}`);
      inst.position.set(
        offsetX + x * TILE_SIZE + TILE_SIZE / 2,
        -0.025,
        offsetZ + z * TILE_SIZE + TILE_SIZE / 2,
      );
      inst.receiveShadows = true;
      inst.freezeWorldMatrix();
    }
  }
}

function buildCeiling(scene: Scene): void {
  const ceilMat = new PBRMaterial('ceilMat', scene);
  ceilMat.albedoColor = new Color3(0.4, 0.42, 0.45);
  ceilMat.metallic = 0.0;
  ceilMat.roughness = 0.9;
  ceilMat.alpha = 0.85;
  ceilMat.freeze();

  const tile = MeshBuilder.CreateBox('ceilTile', {
    width: TILE_SIZE,
    height: 0.08,
    depth: TILE_SIZE,
  }, scene);
  tile.material = ceilMat;
  tile.isVisible = false;

  const tilesX = Math.ceil(FAB_WIDTH / TILE_SIZE);
  const tilesZ = Math.ceil(FAB_DEPTH / TILE_SIZE);
  const offsetX = -FAB_WIDTH / 2;
  const offsetZ = -FAB_DEPTH / 2;

  for (let x = 0; x < tilesX; x++) {
    for (let z = 0; z < tilesZ; z++) {
      const inst = tile.createInstance(`ceil_${x}_${z}`);
      inst.position.set(
        offsetX + x * TILE_SIZE + TILE_SIZE / 2,
        FAB_HEIGHT,
        offsetZ + z * TILE_SIZE + TILE_SIZE / 2,
      );
      inst.freezeWorldMatrix();
    }
  }
}

function buildWalls(scene: Scene): void {
  const glassMat = new PBRMaterial('glassMat', scene);
  glassMat.albedoColor = new Color3(0.7, 0.85, 0.9);
  glassMat.metallic = 0.0;
  glassMat.roughness = 0.05;
  glassMat.alpha = 0.25;
  glassMat.emissiveColor = new Color3(0.02, 0.06, 0.08);
  glassMat.subSurface.isRefractionEnabled = true;
  glassMat.subSurface.refractionIntensity = 0.6;
  glassMat.freeze();

  const walls: Array<{ w: number; d: number; x: number; z: number }> = [
    { w: FAB_WIDTH, d: 0.1, x: 0, z: -FAB_DEPTH / 2 },
    { w: FAB_WIDTH, d: 0.1, x: 0, z: FAB_DEPTH / 2 },
    { w: 0.1, d: FAB_DEPTH, x: -FAB_WIDTH / 2, z: 0 },
    { w: 0.1, d: FAB_DEPTH, x: FAB_WIDTH / 2, z: 0 },
  ];

  walls.forEach((def, i) => {
    const wall = MeshBuilder.CreateBox(`wall_${i}`, {
      width: def.w,
      height: FAB_HEIGHT,
      depth: def.d,
    }, scene);
    wall.material = glassMat;
    wall.position.set(def.x, FAB_HEIGHT / 2, def.z);
    wall.freezeWorldMatrix();
  });
}

function buildRestrictedZoneVisuals(scene: Scene): void {
  let pulseTime = 0;

  for (const zone of restrictedZones) {
    const size = zone.max.subtract(zone.min);
    const center = zone.min.add(size.scale(0.5));

    // Red translucent PBR volume
    const volume = MeshBuilder.CreateBox(`zone_${zone.id}`, {
      width: size.x,
      height: size.y,
      depth: size.z,
    }, scene);
    const zoneMat = new PBRMaterial(`zoneMat_${zone.id}`, scene);
    zoneMat.albedoColor = new Color3(1, 0, 0);
    zoneMat.emissiveColor = new Color3(0.3, 0, 0);
    zoneMat.alpha = 0.04;
    zoneMat.metallic = 0;
    zoneMat.roughness = 1;
    zoneMat.backFaceCulling = false;

    volume.material = zoneMat;
    volume.position = center;
    volume.isPickable = false;
    volume.freezeWorldMatrix();

    // Warning pillars at corners
    const corners = [
      new Vector3(zone.min.x, 0, zone.min.z),
      new Vector3(zone.max.x, 0, zone.min.z),
      new Vector3(zone.min.x, 0, zone.max.z),
      new Vector3(zone.max.x, 0, zone.max.z),
    ];

    const pillarMat = new PBRMaterial(`pillarMat_${zone.id}`, scene);
    pillarMat.albedoColor = new Color3(0.9, 0.7, 0);
    pillarMat.emissiveColor = new Color3(0.3, 0.15, 0);
    pillarMat.metallic = 0.3;
    pillarMat.roughness = 0.6;
    pillarMat.freeze();

    corners.forEach((pos, i) => {
      const pillar = MeshBuilder.CreateCylinder(`pillar_${zone.id}_${i}`, {
        diameter: 0.15,
        height: 2.5,
      }, scene);
      pillar.material = pillarMat;
      pillar.position = pos.add(new Vector3(0, 1.25, 0));
      pillar.freezeWorldMatrix();
    });

    // Animated emissive pulse on zone volume
    scene.onBeforeRenderObservable.add(() => {
      pulseTime += scene.getEngine().getDeltaTime() / 1000;
      const alpha = 0.03 + Math.sin(pulseTime * 2) * 0.03;
      zoneMat.alpha = alpha;
      zoneMat.emissiveColor = new Color3(
        0.15 + Math.sin(pulseTime * 2) * 0.05,
        0,
        0,
      );
    });
  }
}
