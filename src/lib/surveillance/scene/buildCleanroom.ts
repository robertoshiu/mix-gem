/**
 * Constructs the static fab cleanroom geometry.
 * Uses instanced meshes for floor tiles, HEPA ceiling tiles, and glass walls.
 * Places equipment as placeholder boxes (replaced by GLBs via loadAssets).
 */
import { Scene } from '@babylonjs/core/scene';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import { restrictedZones } from '../config/zones';
import { equipmentLayout } from '../config/assets';

const FAB_WIDTH = 30;  // x-axis
const FAB_DEPTH = 20;  // z-axis
const FAB_HEIGHT = 3.5;
const TILE_SIZE = 2;

export interface CleanroomScene {
  equipmentMeshes: Map<string, Mesh>;
  shadowGenerator: ShadowGenerator;
}

export function buildCleanroom(scene: Scene): CleanroomScene {
  scene.clearColor = new Color4(0.02, 0.02, 0.04, 1);

  // Lighting
  const ambient = new HemisphericLight('ambient', new Vector3(0, 1, 0), scene);
  ambient.intensity = 0.4;
  ambient.diffuse = new Color3(0.9, 0.95, 1.0); // cool cleanroom white

  const sun = new DirectionalLight('sun', new Vector3(-0.5, -1, 0.3), scene);
  sun.position = new Vector3(10, 20, -10);
  sun.intensity = 0.8;

  const shadowGen = new ShadowGenerator(512, sun);
  shadowGen.useBlurExponentialShadowMap = true;
  shadowGen.blurKernel = 16;

  // Floor (instanced tiles)
  buildFloor(scene);

  // Ceiling
  buildCeiling(scene);

  // Walls (glass partitions)
  buildWalls(scene);

  // Restricted zones (visual volumes)
  buildRestrictedZoneVisuals(scene);

  // Equipment placeholders
  const equipmentMeshes = buildEquipmentPlaceholders(scene, shadowGen);

  return { equipmentMeshes, shadowGenerator: shadowGen };
}

function buildFloor(scene: Scene): void {
  const tileMat = new StandardMaterial('floorMat', scene);
  tileMat.diffuseColor = new Color3(0.75, 0.78, 0.8);
  tileMat.specularColor = new Color3(0.2, 0.2, 0.2);
  tileMat.freeze();

  const tile = MeshBuilder.CreateBox('floorTile', {
    width: TILE_SIZE - 0.02,
    height: 0.05,
    depth: TILE_SIZE - 0.02,
  }, scene);
  tile.material = tileMat;
  tile.receiveShadows = true;
  tile.isVisible = false; // template mesh

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
  const ceilMat = new StandardMaterial('ceilMat', scene);
  ceilMat.diffuseColor = new Color3(0.9, 0.92, 0.95);
  ceilMat.emissiveColor = new Color3(0.1, 0.1, 0.12);
  ceilMat.alpha = 0.85;
  ceilMat.freeze();

  const tile = MeshBuilder.CreateBox('ceilTile', {
    width: TILE_SIZE - 0.02,
    height: 0.08,
    depth: TILE_SIZE - 0.02,
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
  const glassMat = new StandardMaterial('glassMat', scene);
  glassMat.diffuseColor = new Color3(0.7, 0.85, 0.9);
  glassMat.alpha = 0.2;
  glassMat.specularColor = new Color3(1, 1, 1);
  glassMat.freeze();

  // Four perimeter walls
  const walls: Array<{ w: number; d: number; x: number; z: number; ry?: number }> = [
    { w: FAB_WIDTH, d: 0.1, x: 0, z: -FAB_DEPTH / 2 },    // south
    { w: FAB_WIDTH, d: 0.1, x: 0, z: FAB_DEPTH / 2 },     // north
    { w: 0.1, d: FAB_DEPTH, x: -FAB_WIDTH / 2, z: 0 },    // west
    { w: 0.1, d: FAB_DEPTH, x: FAB_WIDTH / 2, z: 0 },     // east
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
  for (const zone of restrictedZones) {
    const size = zone.max.subtract(zone.min);
    const center = zone.min.add(size.scale(0.5));

    // Red translucent volume
    const volume = MeshBuilder.CreateBox(`zone_${zone.id}`, {
      width: size.x,
      height: size.y,
      depth: size.z,
    }, scene);
    const zoneMat = new StandardMaterial(`zoneMat_${zone.id}`, scene);
    zoneMat.diffuseColor = new Color3(1, 0, 0);
    zoneMat.emissiveColor = new Color3(0.3, 0, 0);
    zoneMat.alpha = 0.12;
    zoneMat.backFaceCulling = false;
    zoneMat.freeze();

    volume.material = zoneMat;
    volume.position = center;
    volume.isPickable = false;
    volume.freezeWorldMatrix();

    // Warning pillars at corners (ground level)
    const corners = [
      new Vector3(zone.min.x, 0, zone.min.z),
      new Vector3(zone.max.x, 0, zone.min.z),
      new Vector3(zone.min.x, 0, zone.max.z),
      new Vector3(zone.max.x, 0, zone.max.z),
    ];

    const pillarMat = new StandardMaterial(`pillarMat_${zone.id}`, scene);
    pillarMat.diffuseColor = new Color3(0.9, 0.7, 0);
    pillarMat.emissiveColor = new Color3(0.2, 0.1, 0);
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
  }
}

function buildEquipmentPlaceholders(scene: Scene, shadowGen: ShadowGenerator): Map<string, Mesh> {
  const meshes = new Map<string, Mesh>();

  const placeholderMat = new StandardMaterial('equipMat', scene);
  placeholderMat.diffuseColor = new Color3(0.85, 0.88, 0.9);
  placeholderMat.specularColor = new Color3(0.3, 0.3, 0.3);
  placeholderMat.freeze();

  for (const eq of equipmentLayout) {
    const box = MeshBuilder.CreateBox(`equip_${eq.label}`, {
      width: 2,
      height: 2.2,
      depth: 1.8,
    }, scene);
    box.material = placeholderMat;
    box.position = new Vector3(eq.position[0], eq.position[1] + 1.1, eq.position[2]);
    if (eq.rotation) box.rotation.y = eq.rotation;
    box.freezeWorldMatrix();
    shadowGen.addShadowCaster(box);
    meshes.set(eq.label, box);
  }

  return meshes;
}
