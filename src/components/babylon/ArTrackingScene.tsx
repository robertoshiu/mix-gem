'use client';

import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { GridMaterial } from '@babylonjs/materials/grid/gridMaterial';
import { WebGLFallback } from '@/components/three/WebGLFallback';
import { useWebGLSupport } from '@/hooks/use-webgl-support';
import { createCinematicPipeline } from '@/lib/babylon-pipeline';
import { createPersonnelHolographicMaterial, updateHolographicTime, updateHolographicColor } from '@/lib/holographic-material';
import {
  ALL_ZONES,
  DYNAMIC_ZONES,
  PATROL_ROUTES,
  type Personnel,
  type EquipmentState,
  type PersonnelState,
  RESTRICTED_ZONES,
  useArTrackingStore,
} from '@/stores/ar-tracking-store';

const PERSONNEL_SPEED = 2;
const HEAD_HEIGHT = 1.72;
const MODEL_BASE_PATH = '/mix-gem/models/ar-tracking/';
const MODEL_MANIFEST = 'models.json';
const MODEL_VARIANTS: Record<string, string> = {
  'OP-01': 'cleanroom-a.glb',
  'OP-02': 'cleanroom-b.glb',
  'OP-03': 'cleanroom-a.glb',
  'OP-04': 'cleanroom-c.glb',
};
const PERSONNEL_AUGMENTATION_COLORS = {
  normal: '#22d3ee',
  operating: '#f59e0b',
  avoiding: '#ef4444',
  observing: '#3b82f6',
} as const;
const EQUIPMENT_BAY_LAYOUT = [
  ['Litho Bay', -18, 10, 9, 5],
  ['Etch Bay', -17, -14, 10, 4],
  ['Diffusion Bay', 0, -13, 9, 4],
  ['Metrology', 17, -12, 8, 5],
  ['CMP Bay', 18, 3, 8, 4],
  ['Implant', -2, 5, 8, 4],
  ['Stocker', -25, 0, 5, 8],
  ['Photo Track', 8, 15, 9, 3.6],
] as const;
const RECIPE_EQUIPMENT_MAP = {
  'IMPLANT-BEAM': 'Implant',
  'LITHO-EUV': 'Litho Bay',
} as const;
const EQUIPMENT_WARMUP_SECONDS = 6;
const EQUIPMENT_COOLDOWN_SECONDS = 10;
const EQUIPMENT_WIREFRAME_MESHES: BABYLON.LinesMesh[][] = [];
const EQUIPMENT_DATA_PANEL_LABELS: BABYLON.Mesh[] = [];
const AR_TRACKING_TARGET_FPS = 30;
const AR_TRACKING_LOW_FPS_SAMPLE_MS = 2000;
const AR_TRACKING_REDUCED_GLOW_TEXTURE_SIZE = 512;

type ArTrackingSceneStats = {
  meshCount: number;
  drawCalls: number;
  activeIndices: number;
  fps: number;
};

declare global {
  interface Window {
    __arTrackingFPS?: number;
    __arTrackingSceneStats?: ArTrackingSceneStats;
    __arTrackingStore?: typeof useArTrackingStore;
  }
}

type AnimState = 'walk' | 'idle' | 'look-around';

type PersonnelAugmentations = {
  scanRing: BABYLON.Mesh;
  halo: BABYLON.Mesh;
  indicator: BABYLON.Mesh;
  indicatorTrail: BABYLON.LinesMesh;
  meshes: BABYLON.Mesh[];
  materials: BABYLON.PBRMaterial[];
  currentColor: BABYLON.Color3;
};

type PersonRuntime = {
  node: BABYLON.TransformNode;
  bodyMaterial: BABYLON.PBRMaterial;
  holographicMaterial: BABYLON.ShaderMaterial | null;
  trackingDisc: BABYLON.Mesh | null;
  armParts: BABYLON.Mesh[];
  legParts: BABYLON.Mesh[];
  direction: BABYLON.Vector3;
  waypointIndex: number;
  isGltf: boolean;
  animGroups: Partial<Record<AnimState, BABYLON.AnimationGroup>> | null;
  currentAnim: AnimState;
  idleTimer: number;
  idleLookDelay: number;
  behaviorUntilMs: number;
  augmentations: PersonnelAugmentations | null;
};

type DynamicZoneRuntime = {
  zoneId: string;
  material: BABYLON.PBRMaterial;
  wallMaterials: BABYLON.PBRMaterial[];
  wallMeshes: BABYLON.Mesh[];
  border: BABYLON.LinesMesh;
  marker: BABYLON.Mesh;
  label: BABYLON.Mesh;
  recipeLabel: BABYLON.Mesh;
  currentAlpha: number;
  visible: boolean;
};

type EquipmentStateVisual = {
  color: string;
  emissive: number;
};

type EquipmentStatusText = 'STANDBY' | 'WARMING UP' | 'PROCESSING' | 'COOLING DOWN';

type EquipmentBayRuntime = {
  label: string;
  wireframes: BABYLON.LinesMesh[];
  material: BABYLON.PBRMaterial;
  dataPanel: BABYLON.Mesh;
  displayedStatus: EquipmentStatusText;
};

type ZoneBoundaryDistance = {
  zone: (typeof ALL_ZONES)[number];
  distance: number;
};

const EQUIPMENT_STATE_VISUALS = {
  idle: { color: '#22d3ee', emissive: 0.06 },
  warmup: { color: '#f59e0b', emissive: 0.1 },
  running: { color: '#22c55e', emissive: 0.18 },
  cooldown: { color: '#3b82f6', emissive: 0.18 },
} as const satisfies Record<string, EquipmentStateVisual>;

function createPbr(scene: BABYLON.Scene, name: string, color: string, emissive = 0.08, alpha = 1) {
  const material = new BABYLON.PBRMaterial(name, scene);
  material.albedoColor = BABYLON.Color3.FromHexString(color);
  material.emissiveColor = BABYLON.Color3.FromHexString(color).scale(emissive);
  material.roughness = 0.58;
  material.metallic = 0.12;
  material.alpha = alpha;
  material.transparencyMode = alpha < 1 ? BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND : null;
  return material;
}

function createAugmentationMaterial(scene: BABYLON.Scene, name: string, color: string) {
  const material = new BABYLON.PBRMaterial(name, scene);
  const baseColor = BABYLON.Color3.FromHexString(color);
  material.albedoColor = baseColor.scale(0.45);
  material.emissiveColor = baseColor.scale(1.35);
  material.metallic = 0.9;
  material.roughness = 0.3;
  material.alpha = 0.82;
  material.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
  return material;
}

function getPersonnelAugmentationColor(personnel: Personnel | undefined) {
  if (personnel?.status === 'violation' || personnel?.state === 'avoiding') {
    return PERSONNEL_AUGMENTATION_COLORS.avoiding;
  }
  if (personnel?.state === 'operating') return PERSONNEL_AUGMENTATION_COLORS.operating;
  if (personnel?.state === 'observing') return PERSONNEL_AUGMENTATION_COLORS.observing;
  return PERSONNEL_AUGMENTATION_COLORS.normal;
}

function getPersonnelStateColor(personnel: { status?: string; state?: string } | undefined): string {
  if (personnel?.status === 'violation' || personnel?.state === 'avoiding') return '#ef4444';
  if (personnel?.state === 'operating') return '#f59e0b';
  if (personnel?.state === 'observing') return '#3b82f6';
  return '#22d3ee';
}

function animateProceduralWalk(
  armParts: BABYLON.Mesh[],
  legParts: BABYLON.Mesh[],
  moving: boolean,
): void {
  const swingSpeed = moving ? 6 : 0;
  const swingAmount = moving ? 0.3 : 0;
  const t = (performance.now() / 1000) * swingSpeed;

  if (armParts.length >= 4) {
    armParts[0].rotation.x = Math.sin(t) * swingAmount;
    armParts[1].rotation.x = Math.sin(t) * swingAmount * 0.7;
    armParts[2].rotation.x = -Math.sin(t) * swingAmount;
    armParts[3].rotation.x = -Math.sin(t) * swingAmount * 0.7;
  }
  if (legParts.length >= 4) {
    legParts[0].rotation.x = -Math.sin(t) * swingAmount;
    legParts[1].rotation.x = -Math.sin(t) * swingAmount * 0.5;
    legParts[2].rotation.x = Math.sin(t) * swingAmount;
    legParts[3].rotation.x = Math.sin(t) * swingAmount * 0.5;
  }
}

function createPersonnelAugmentations(
  person: PersonRuntime,
  scene: BABYLON.Scene,
  id: string,
): PersonnelAugmentations {
  const baseColor = PERSONNEL_AUGMENTATION_COLORS.normal;
  const scanMaterial = createAugmentationMaterial(scene, `${id}-scan-ring-material`, baseColor);
  const haloMaterial = createAugmentationMaterial(scene, `${id}-digital-halo-material`, baseColor);
  const indicatorMaterial = createAugmentationMaterial(scene, `${id}-directional-indicator-material`, baseColor);

  const scanRing = BABYLON.MeshBuilder.CreateTorus(
    `${id}-scan-ring`,
    { diameter: 0.9, thickness: 0.03, tessellation: 32 },
    scene,
  );
  scanRing.parent = person.node;
  scanRing.position.y = 0.9;
  scanRing.rotation.x = Math.PI / 2;
  scanRing.material = scanMaterial;
  scanRing.isPickable = false;

  const halo = BABYLON.MeshBuilder.CreateTorus(
    `${id}-digital-halo`,
    { diameter: 0.7, thickness: 0.02, tessellation: 48 },
    scene,
  );
  halo.parent = person.node;
  halo.position.y = person.isGltf ? 2.0 : 2.3;
  halo.rotation.x = Math.PI / 2;
  halo.material = haloMaterial;
  halo.isPickable = false;

  const indicatorTrail = BABYLON.MeshBuilder.CreateLines(
    `${id}-directional-indicator-trail`,
    {
      points: [
        new BABYLON.Vector3(0, 1.6, 0.08),
        new BABYLON.Vector3(0, 1.6, 0.44),
      ],
    },
    scene,
  );
  indicatorTrail.parent = person.node;
  indicatorTrail.color = BABYLON.Color3.FromHexString(baseColor);
  indicatorTrail.isPickable = false;

  const indicator = BABYLON.MeshBuilder.CreateCylinder(
    `${id}-directional-indicator`,
    { diameterTop: 0, diameterBottom: 0.16, height: 0.38, tessellation: 24 },
    scene,
  );
  indicator.parent = person.node;
  indicator.position = new BABYLON.Vector3(0, 1.6, 0.3);
  indicator.rotation.x = Math.PI / 2;
  indicator.material = indicatorMaterial;
  indicator.isPickable = false;

  return {
    scanRing,
    halo,
    indicator,
    indicatorTrail,
    meshes: [scanRing, halo, indicator, indicatorTrail],
    materials: [scanMaterial, haloMaterial, indicatorMaterial],
    currentColor: BABYLON.Color3.FromHexString(baseColor),
  };
}

function updatePersonnelAugmentations(
  person: PersonRuntime,
  personnel: Personnel | undefined,
  deltaSeconds: number,
) {
  const augmentations = person.augmentations;
  if (!augmentations) return;

  const targetColor = BABYLON.Color3.FromHexString(getPersonnelAugmentationColor(personnel));
  const blend = Math.min(deltaSeconds * 5, 1);
  augmentations.currentColor = BABYLON.Color3.Lerp(augmentations.currentColor, targetColor, blend);

  const scanPulse = 1 + Math.sin((performance.now() / 1000) * Math.PI) * 0.1;
  augmentations.scanRing.scaling.set(scanPulse, scanPulse, scanPulse);
  augmentations.scanRing.visibility = 0.64 + Math.abs(Math.sin(performance.now() / 1000)) * 0.28;
  augmentations.halo.rotation.y += deltaSeconds * 0.72;

  augmentations.indicatorTrail.color.copyFrom(augmentations.currentColor);
  augmentations.materials.forEach((material) => {
    material.albedoColor.copyFrom(augmentations.currentColor.scale(0.45));
    material.emissiveColor.copyFrom(augmentations.currentColor.scale(1.18 + Math.abs(scanPulse - 1) * 2));
  });
}

function createLabel(scene: BABYLON.Scene, name: string, text: string, color = '#22d3ee') {
  const texture = new BABYLON.DynamicTexture(`${name}-texture`, { width: 768, height: 192 }, scene, false);
  texture.hasAlpha = true;
  texture.drawText(text, 28, 100, '700 38px Fira Code, monospace', '#e2e8f0', 'transparent', true);

  const material = new BABYLON.StandardMaterial(`${name}-material`, scene);
  material.diffuseTexture = texture;
  material.opacityTexture = texture;
  material.emissiveColor = BABYLON.Color3.FromHexString(color);
  material.disableLighting = true;
  material.backFaceCulling = false;

  const plane = BABYLON.MeshBuilder.CreatePlane(name, { width: 4.8, height: 1.2 }, scene);
  plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
  plane.material = material;
  plane.isPickable = false;
  return plane;
}

function updateLabelText(label: BABYLON.Mesh, text: string, color: string) {
  if (!(label.material instanceof BABYLON.StandardMaterial)) return;
  const texture = label.material.diffuseTexture;
  if (!(texture instanceof BABYLON.DynamicTexture)) return;

  texture.drawText(text, 28, 100, '700 38px Fira Code, monospace', '#e2e8f0', 'transparent', true);
  label.material.emissiveColor = BABYLON.Color3.FromHexString(color);
}

function createWireframeBoxEdges(centerX: number, centerZ: number, width: number, depth: number) {
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const bottomY = 0.05;
  const topY = 2.05;
  const corners = [
    new BABYLON.Vector3(centerX - halfWidth, bottomY, centerZ - halfDepth),
    new BABYLON.Vector3(centerX + halfWidth, bottomY, centerZ - halfDepth),
    new BABYLON.Vector3(centerX + halfWidth, bottomY, centerZ + halfDepth),
    new BABYLON.Vector3(centerX - halfWidth, bottomY, centerZ + halfDepth),
    new BABYLON.Vector3(centerX - halfWidth, topY, centerZ - halfDepth),
    new BABYLON.Vector3(centerX + halfWidth, topY, centerZ - halfDepth),
    new BABYLON.Vector3(centerX + halfWidth, topY, centerZ + halfDepth),
    new BABYLON.Vector3(centerX - halfWidth, topY, centerZ + halfDepth),
  ];
  const edgeIndexes = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ] as const;

  return edgeIndexes.map(([start, end]) => [corners[start], corners[end]]);
}

function createFabLayout(scene: BABYLON.Scene, glow: BABYLON.GlowLayer): EquipmentBayRuntime[] {
  EQUIPMENT_WIREFRAME_MESHES.length = 0;
  EQUIPMENT_DATA_PANEL_LABELS.length = 0;

  const ground = BABYLON.MeshBuilder.CreateGround('AR-FAB-FLOOR', { width: 60, height: 40, subdivisions: 48 }, scene);
  const gridMaterial = new GridMaterial('ar-ground-grid-material', scene);
  gridMaterial.mainColor = BABYLON.Color3.FromHexString('#0A1628');
  gridMaterial.lineColor = BABYLON.Color3.FromHexString('#12324f');
  gridMaterial.minorUnitVisibility = 0.35;
  gridMaterial.majorUnitFrequency = 5;
  gridMaterial.gridRatio = 0.8;
  gridMaterial.opacity = 0.96;
  ground.material = gridMaterial;
  ground.isPickable = false;

  return EQUIPMENT_BAY_LAYOUT.map(([label, x, z, width, depth], index) => {
    const idleVisual = EQUIPMENT_STATE_VISUALS.idle;
    const material = createPbr(
      scene,
      `ar-equipment-${index}-wireframe-material`,
      idleVisual.color,
      idleVisual.emissive,
    );
    material.disableLighting = true;

    const wireframes = createWireframeBoxEdges(x, z, width, depth).map((points, edgeIndex) => {
      const edge = BABYLON.MeshBuilder.CreateLines(
        `ar-equipment-${index}-wireframe-${edgeIndex}`,
        { points },
        scene,
      );
      edge.color = BABYLON.Color3.FromHexString(idleVisual.color);
      edge.alpha = 0.94;
      edge.material = material;
      edge.isPickable = false;
      glow.addIncludedOnlyMesh(edge);
      return edge;
    });

    const dataPanel = createLabel(scene, `ar-equipment-${index}-panel`, `${label} STANDBY`, idleVisual.color);
    dataPanel.position = new BABYLON.Vector3(x, 3, z);
    dataPanel.scaling = new BABYLON.Vector3(0.72, 0.72, 0.72);

    EQUIPMENT_WIREFRAME_MESHES[index] = wireframes;
    EQUIPMENT_DATA_PANEL_LABELS[index] = dataPanel;

    return { label, wireframes, material, dataPanel, displayedStatus: 'STANDBY' };
  });
}

function createZoneBorder(scene: BABYLON.Scene, zoneId: string, center: [number, number], size: [number, number]) {
  const halfX = size[0] / 2;
  const halfZ = size[1] / 2;
  const y = 0.08;
  const corners = [
    new BABYLON.Vector3(center[0] - halfX, y, center[1] - halfZ),
    new BABYLON.Vector3(center[0] + halfX, y, center[1] - halfZ),
    new BABYLON.Vector3(center[0] + halfX, y, center[1] + halfZ),
    new BABYLON.Vector3(center[0] - halfX, y, center[1] + halfZ),
    new BABYLON.Vector3(center[0] - halfX, y, center[1] - halfZ),
  ];
  const border = BABYLON.MeshBuilder.CreateLines(`${zoneId}-border`, { points: corners }, scene);
  border.color = BABYLON.Color3.FromHexString('#ef4444');
  border.isPickable = false;
  return border;
}

function createForceFieldMaterial(scene: BABYLON.Scene, name: string) {
  const material = new BABYLON.PBRMaterial(name, scene);
  const fieldColor = BABYLON.Color3.FromHexString('#ef4444');
  material.albedoColor = fieldColor;
  material.emissiveColor = fieldColor.scale(0.4);
  material.alpha = 0.08;
  material.roughness = 0.1;
  material.metallic = 0.9;
  material.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
  material.backFaceCulling = false;

  const noiseTexture = new BABYLON.NoiseProceduralTexture(`${name}-noise`, 256, scene);
  noiseTexture.octaves = 3;
  noiseTexture.persistence = 0.6;
  noiseTexture.animationSpeedFactor = 2;
  material.emissiveTexture = noiseTexture;

  return material;
}

function createForceFieldWalls(
  scene: BABYLON.Scene,
  zoneId: string,
  center: [number, number],
  size: [number, number],
) {
  const halfX = size[0] / 2;
  const halfZ = size[1] / 2;
  const wallHeight = 3;
  const wallThickness = 0.02;
  const y = wallHeight / 2;
  const walls = [
    { name: 'front', width: size[0], depth: wallThickness, x: center[0], z: center[1] - halfZ },
    { name: 'back', width: size[0], depth: wallThickness, x: center[0], z: center[1] + halfZ },
    { name: 'left', width: wallThickness, depth: size[1], x: center[0] - halfX, z: center[1] },
    { name: 'right', width: wallThickness, depth: size[1], x: center[0] + halfX, z: center[1] },
  ];

  return walls.map((wall) => {
    const mesh = BABYLON.MeshBuilder.CreateBox(
      `${zoneId}-force-field-wall-${wall.name}`,
      { width: wall.width, height: wallHeight, depth: wall.depth },
      scene,
    );
    mesh.position = new BABYLON.Vector3(wall.x, y, wall.z);
    mesh.material = createForceFieldMaterial(scene, `${zoneId}-force-field-wall-${wall.name}-material`);
    mesh.isPickable = false;
    return mesh;
  });
}

function createRestrictedZones(scene: BABYLON.Scene) {
  return RESTRICTED_ZONES.map((zone) => {
    const material = createPbr(scene, `${zone.id}-material`, '#ef4444', 0.6, 0.12);
    const marker = BABYLON.MeshBuilder.CreateGround(zone.id, { width: zone.size[0], height: zone.size[1] }, scene);
    marker.position = new BABYLON.Vector3(zone.center[0], 0.035, zone.center[1]);
    marker.material = material;
    marker.isPickable = false;

    const border = createZoneBorder(scene, zone.id, zone.center, zone.size);
    const wallMeshes = createForceFieldWalls(scene, zone.id, zone.center, zone.size);

    const label = createLabel(scene, `${zone.id}-label`, `WARNING ${zone.name}`, '#f59e0b');
    label.position = new BABYLON.Vector3(zone.center[0], 2.8, zone.center[1]);
    return { zoneId: zone.id, material, border, wallMeshes, label };
  });
}

function createDynamicZones(scene: BABYLON.Scene): DynamicZoneRuntime[] {
  return DYNAMIC_ZONES.map((zone) => {
    const material = createPbr(scene, `${zone.id}-material`, '#ef4444', 0.6, 0);
    const marker = BABYLON.MeshBuilder.CreateGround(zone.id, { width: zone.size[0], height: zone.size[1] }, scene);
    marker.position = new BABYLON.Vector3(zone.center[0], 0.035, zone.center[1]);
    marker.material = material;
    marker.isPickable = false;
    marker.isVisible = false;

    const border = createZoneBorder(scene, zone.id, zone.center, zone.size);
    border.isVisible = false;

    const wallMeshes = createForceFieldWalls(scene, zone.id, zone.center, zone.size);
    wallMeshes.forEach((wallMesh) => {
      wallMesh.isVisible = false;
    });
    const wallMaterials = wallMeshes
      .map((wallMesh) => wallMesh.material)
      .filter((material): material is BABYLON.PBRMaterial => material instanceof BABYLON.PBRMaterial);

    const label = createLabel(scene, `${zone.id}-label`, `WARNING ${zone.name}`, '#f59e0b');
    label.position = new BABYLON.Vector3(zone.center[0], 2.8, zone.center[1]);
    label.isVisible = false;

    const recipeLabel = createLabel(scene, `${zone.id}-recipe-label`, 'RECIPE ACTIVE', '#f59e0b');
    recipeLabel.position = new BABYLON.Vector3(zone.center[0], 2.2, zone.center[1]);
    recipeLabel.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);
    recipeLabel.isVisible = false;

    return {
      zoneId: zone.id,
      material,
      wallMaterials,
      wallMeshes,
      border,
      marker,
      label,
      recipeLabel,
      currentAlpha: 0,
      visible: false,
    };
  });
}

function createPerson(scene: BABYLON.Scene, id: string, start: [number, number]): PersonRuntime {
  const node = new BABYLON.TransformNode(`${id}-node`, scene);
  node.position = new BABYLON.Vector3(start[0], 0, start[1]);

  const holoMat = createPersonnelHolographicMaterial(scene, `${id}-holo`, { baseColor: '#22d3ee' });

  // Torso
  const torso = BABYLON.MeshBuilder.CreateCapsule(`${id}-torso`, { height: 0.8, radius: 0.22, tessellation: 12 }, scene);
  torso.parent = node;
  torso.position.y = 1.15;
  torso.material = holoMat;
  torso.isPickable = false;

  // Head
  const head = BABYLON.MeshBuilder.CreateSphere(`${id}-head`, { diameter: 0.32, segments: 12 }, scene);
  head.parent = node;
  head.position.y = 1.72;
  head.material = holoMat;
  head.isPickable = false;

  // Neck
  const neck = BABYLON.MeshBuilder.CreateCylinder(`${id}-neck`, { height: 0.12, diameter: 0.12, tessellation: 8 }, scene);
  neck.parent = node;
  neck.position.y = 1.52;
  neck.material = holoMat;
  neck.isPickable = false;

  // Arms (upper + lower per side)
  const armParts: BABYLON.Mesh[] = [];
  for (const side of [-1, 1]) {
    const upper = BABYLON.MeshBuilder.CreateCylinder(`${id}-arm-upper-${side}`, { height: 0.35, diameter: 0.1, tessellation: 8 }, scene);
    upper.parent = node;
    upper.position.set(side * 0.32, 1.25, 0);
    upper.material = holoMat;
    upper.isPickable = false;
    armParts.push(upper);

    const lower = BABYLON.MeshBuilder.CreateCylinder(`${id}-arm-lower-${side}`, { height: 0.3, diameter: 0.08, tessellation: 8 }, scene);
    lower.parent = node;
    lower.position.set(side * 0.32, 0.9, 0);
    lower.material = holoMat;
    lower.isPickable = false;
    armParts.push(lower);
  }

  // Legs (upper + lower per side)
  const legParts: BABYLON.Mesh[] = [];
  for (const side of [-1, 1]) {
    const upper = BABYLON.MeshBuilder.CreateCylinder(`${id}-leg-upper-${side}`, { height: 0.4, diameter: 0.12, tessellation: 8 }, scene);
    upper.parent = node;
    upper.position.set(side * 0.12, 0.55, 0);
    upper.material = holoMat;
    upper.isPickable = false;
    legParts.push(upper);

    const lower = BABYLON.MeshBuilder.CreateCylinder(`${id}-leg-lower-${side}`, { height: 0.35, diameter: 0.09, tessellation: 8 }, scene);
    lower.parent = node;
    lower.position.set(side * 0.12, 0.17, 0);
    lower.material = holoMat;
    lower.isPickable = false;
    legParts.push(lower);
  }

  // AR glasses — one solid emissive element
  const glasses = BABYLON.MeshBuilder.CreateBox(`${id}-ar-glasses`, { width: 0.3, height: 0.06, depth: 0.12 }, scene);
  glasses.parent = node;
  glasses.position = new BABYLON.Vector3(0, 1.73, -0.16);
  glasses.material = createPbr(scene, `${id}-glasses-material`, '#22d3ee', 1.2);
  glasses.isPickable = false;

  // ID tag
  const tag = createLabel(scene, `${id}-tag`, id, '#22d3ee');
  tag.parent = node;
  tag.position.y = 2.05;
  tag.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);

  // Ground tracking disc
  const trackingDisc = BABYLON.MeshBuilder.CreateDisc(`${id}-tracking-disc`, { radius: 0.5, tessellation: 24 }, scene);
  trackingDisc.parent = node;
  trackingDisc.position.y = 0.02;
  trackingDisc.rotation.x = Math.PI / 2;
  trackingDisc.material = createPbr(scene, `${id}-disc-material`, '#22d3ee', 0.8, 0.4);
  trackingDisc.isPickable = false;

  return {
    node,
    bodyMaterial: createPbr(scene, `${id}-body-material`, '#f8fafc', 0.04),
    holographicMaterial: holoMat,
    trackingDisc,
    armParts,
    legParts,
    direction: new BABYLON.Vector3(0, 0, 1),
    waypointIndex: 0,
    isGltf: false,
    animGroups: null,
    currentAnim: 'idle',
    idleTimer: 0,
    idleLookDelay: 2 + Math.random(),
    behaviorUntilMs: 0,
    augmentations: null,
  };
}

async function createGltfPerson(
  scene: BABYLON.Scene,
  id: string,
  start: BABYLON.Vector3,
  waypointIndex: number,
  modelFile: string,
  availableModels: Set<string>,
): Promise<PersonRuntime | null> {
  try {
    if (!availableModels.has(modelFile)) {
      return null;
    }

    const result = await BABYLON.SceneLoader.ImportMeshAsync('', MODEL_BASE_PATH, modelFile, scene);
    const root = result.meshes[0];
    const node = new BABYLON.TransformNode(`${id}-node`, scene);
    root.parent = node;
    node.position.copyFrom(start);

    const holoMat = createPersonnelHolographicMaterial(scene, `${id}-holo`, { baseColor: '#22d3ee' });

    result.meshes.forEach((mesh) => {
      mesh.isPickable = false;
      if (mesh instanceof BABYLON.Mesh && mesh.getTotalVertices() > 0) {
        mesh.material = holoMat;
      }
    });

    const animGroups: Partial<Record<AnimState, BABYLON.AnimationGroup>> = {};
    result.animationGroups.forEach((group) => {
      const name = group.name.toLowerCase();
      if (name.includes('walk')) animGroups.walk = group;
      else if (name.includes('look')) animGroups['look-around'] = group;
      else if (name.includes('idle')) animGroups.idle = group;
      group.stop();
      group.setWeightForAllAnimatables(0);
    });

    if (animGroups.idle) {
      animGroups.idle.start(true, 1, animGroups.idle.from, animGroups.idle.to, false);
      animGroups.idle.setWeightForAllAnimatables(1);
    }

    const skeleton = result.skeletons[0];
    const headBone = skeleton?.bones.find((bone) => bone.name.toLowerCase().includes('head'));
    const headNode = headBone?.getTransformNode() ?? null;

    const bodyMaterial = createPbr(scene, `${id}-body-material`, '#f8fafc', 0.04);
    const glasses = BABYLON.MeshBuilder.CreateBox(`${id}-ar-glasses`, { width: 0.42, height: 0.08, depth: 0.16 }, scene);
    glasses.material = createPbr(scene, `${id}-glasses-material`, '#22d3ee', 1.2);
    glasses.isPickable = false;

    const tag = createLabel(scene, `${id}-tag`, id, '#22d3ee');
    tag.scaling = new BABYLON.Vector3(0.62, 0.62, 0.62);

    if (headNode) {
      glasses.parent = headNode;
      glasses.position = new BABYLON.Vector3(0, 0.08, -0.14);
      tag.parent = headNode;
      tag.position = new BABYLON.Vector3(0, 0.45, 0);
    } else {
      glasses.parent = node;
      glasses.position = new BABYLON.Vector3(0, 1.93, -0.24);
      tag.parent = node;
      tag.position.y = 2.55;
    }

    const person: PersonRuntime = {
      node,
      bodyMaterial,
      holographicMaterial: holoMat,
      trackingDisc: null,
      armParts: [],
      legParts: [],
      direction: new BABYLON.Vector3(0, 0, 1),
      waypointIndex,
      isGltf: true,
      animGroups,
      currentAnim: animGroups.idle ? 'idle' : 'walk',
      idleTimer: 0,
      idleLookDelay: 2 + Math.random(),
      behaviorUntilMs: 0,
      augmentations: null,
    };
    person.augmentations = createPersonnelAugmentations(person, scene, id);
    return person;
  } catch (error) {
    console.warn(`[AR-Tracking] Failed to load GLTF model ${modelFile} for ${id}, falling back to capsule:`, error);
    return null;
  }
}

async function loadAvailableModels() {
  try {
    const response = await fetch(`${MODEL_BASE_PATH}${MODEL_MANIFEST}`);
    if (!response.ok) return new Set<string>();
    const manifest = await response.json() as { models?: string[] };
    return new Set(manifest.models ?? []);
  } catch {
    return new Set<string>();
  }
}

function transitionAnim(person: PersonRuntime, target: AnimState, speedRatio = target === 'walk' ? 1.15 : 1) {
  if (!person.animGroups) return;

  if (person.currentAnim === target) {
    const active = person.animGroups[target];
    if (active) active.speedRatio = speedRatio;
    return;
  }

  const current = person.animGroups[person.currentAnim];
  const next = person.animGroups[target];
  if (!next) return;

  current?.setWeightForAllAnimatables(0);
  current?.stop();
  next.start(target !== 'look-around', speedRatio, next.from, next.to, false);
  next.setWeightForAllAnimatables(1);
  person.currentAnim = target;
  person.idleTimer = 0;
  person.idleLookDelay = 2 + Math.random();
}

function animationSpeedForState(state: PersonnelState) {
  if (state === 'avoiding') return 1.5;
  if (state === 'observing' || state === 'operating' || state === 'idle') return 0;
  return 1;
}

function animationForState(person: PersonRuntime, state: PersonnelState): AnimState {
  if (state === 'observing' && person.animGroups?.['look-around']) return 'look-around';
  if (state === 'observing' || state === 'operating' || state === 'idle') return 'idle';
  return 'walk';
}

function applyPersonnelAnimation(person: PersonRuntime, state: PersonnelState) {
  if (!person.isGltf) return;
  transitionAnim(person, animationForState(person, state), animationSpeedForState(state));
}

function zoneForPosition(x: number, z: number, visibleDynamicZones: Set<string>) {
  return ALL_ZONES.find((zone) => {
    const isDynamic = DYNAMIC_ZONES.some((dynamicZone) => dynamicZone.id === zone.id);
    if (isDynamic && !visibleDynamicZones.has(zone.id)) return false;
    const halfX = zone.size[0] / 2;
    const halfZ = zone.size[1] / 2;
    return x >= zone.center[0] - halfX && x <= zone.center[0] + halfX
      && z >= zone.center[1] - halfZ && z <= zone.center[1] + halfZ;
  }) ?? null;
}

function nearestZoneBoundary(position: BABYLON.Vector3): ZoneBoundaryDistance | null {
  return ALL_ZONES.reduce<ZoneBoundaryDistance | null>((nearest, zone) => {
    const distance = Math.abs(behaviorDistanceToZoneBoundary(position, zone));
    if (!nearest || distance < nearest.distance) return { zone, distance };
    return nearest;
  }, null);
}

function behaviorDistanceToZoneBoundary(position: BABYLON.Vector3, zone: { center: [number, number]; size: [number, number] }) {
  const halfX = zone.size[0] / 2;
  const halfZ = zone.size[1] / 2;
  const dx = Math.abs(position.x - zone.center[0]) - halfX;
  const dz = Math.abs(position.z - zone.center[1]) - halfZ;
  const outsideX = Math.max(dx, 0);
  const outsideZ = Math.max(dz, 0);

  if (dx <= 0 && dz <= 0) {
    return Math.max(dx, dz);
  }

  return Math.hypot(outsideX, outsideZ);
}

function isInsideZone(position: BABYLON.Vector3, zone: { center: [number, number]; size: [number, number] }) {
  return behaviorDistanceToZoneBoundary(position, zone) <= 0;
}

function directionAwayFromZone(position: BABYLON.Vector3, zone: { center: [number, number] }) {
  const away = new BABYLON.Vector3(position.x - zone.center[0], 0, position.z - zone.center[1]);
  if (away.lengthSquared() < 0.001) return new BABYLON.Vector3(1, 0, 0);
  return away.normalize();
}

function nearestActiveDynamicZone(
  position: BABYLON.Vector3,
  store: ReturnType<typeof useArTrackingStore.getState>,
) {
  return DYNAMIC_ZONES
    .filter((zone) => store.recipeStates[zone.id] === 'running')
    .map((zone) => ({ zone, distance: behaviorDistanceToZoneBoundary(position, zone) }))
    .sort((a, b) => Math.abs(a.distance) - Math.abs(b.distance))[0] ?? null;
}

function isNearRunningEquipmentBay(
  position: BABYLON.Vector3,
  store: ReturnType<typeof useArTrackingStore.getState>,
) {
  const runningBays = new Set(
    DYNAMIC_ZONES
      .filter((zone) => store.recipeStates[zone.id] === 'running')
      .map((zone) => zone.anchoredTo),
  );

  return EQUIPMENT_BAY_LAYOUT.some(([label, x, z]) => (
    runningBays.has(label) && BABYLON.Vector3.Distance(position, new BABYLON.Vector3(x, 0, z)) <= 4
  ));
}

function setPersonnelBehavior(
  store: ReturnType<typeof useArTrackingStore.getState>,
  person: PersonRuntime,
  id: string,
  state: PersonnelState,
  nowMs: number,
  durationMs = 0,
) {
  store.setPersonnelState(id, state);
  person.behaviorUntilMs = durationMs > 0 ? nowMs + durationMs : 0;
  applyPersonnelAnimation(person, state);
}

function updatePersonMovement(
  person: PersonRuntime,
  id: string,
  deltaSeconds: number,
  speedMultiplier = 1,
  overrideDirection?: BABYLON.Vector3,
) {
  const route = PATROL_ROUTES[id];
  const nextIndex = (person.waypointIndex + 1) % route.length;
  const target = new BABYLON.Vector3(route[nextIndex][0], 0, route[nextIndex][1]);
  const offset = target.subtract(person.node.position);
  const distance = offset.length();

  if (overrideDirection) {
    const direction = overrideDirection.normalize();
    person.direction = direction;
    person.node.position.addInPlace(direction.scale(PERSONNEL_SPEED * speedMultiplier * deltaSeconds));
    person.node.rotation.y = Math.atan2(direction.x, direction.z);
    if (person.isGltf) transitionAnim(person, 'walk', animationSpeedForState('avoiding'));
    return false;
  }

  if (distance < 0.16) {
    person.waypointIndex = nextIndex;
    if (person.isGltf) transitionAnim(person, 'idle', animationSpeedForState('idle'));
    return true;
  }

  const direction = offset.normalize();
  person.direction = direction;
  person.node.position.addInPlace(direction.scale(Math.min(distance, PERSONNEL_SPEED * speedMultiplier * deltaSeconds)));
  person.node.rotation.y = Math.atan2(direction.x, direction.z);
  if (person.isGltf) transitionAnim(person, 'walk', speedMultiplier);
  return false;
}

function updateIdleAnimation(person: PersonRuntime, deltaSeconds: number) {
  if (!person.isGltf || person.currentAnim !== 'idle') return;
  person.idleTimer += deltaSeconds;
  if (person.idleTimer < person.idleLookDelay) return;

  if (Math.random() <= 0.5 && person.animGroups?.['look-around']) {
    transitionAnim(person, 'look-around');
    person.animGroups['look-around']?.onAnimationGroupEndObservable.addOnce(() => {
      transitionAnim(person, 'idle');
    });
  } else {
    person.idleTimer = 0;
    person.idleLookDelay = 2 + Math.random();
  }
}

function updateDynamicZones(dynamicZones: DynamicZoneRuntime[], deltaSeconds: number) {
  const store = useArTrackingStore.getState();
  dynamicZones.forEach((zone) => {
    const isRunning = store.recipeStates[zone.zoneId] === 'running';
    const targetAlpha = isRunning ? 0.12 : 0;
    const fadeDuration = isRunning ? 1.5 : 2;
    zone.currentAlpha += (targetAlpha - zone.currentAlpha) * Math.min((deltaSeconds / fadeDuration) * 4, 1);

    if (zone.currentAlpha > 0.005) {
      zone.marker.isVisible = true;
      zone.border.isVisible = true;
      zone.wallMeshes.forEach((wallMesh) => {
        wallMesh.isVisible = true;
      });
      zone.label.isVisible = true;
      zone.recipeLabel.isVisible = true;
      zone.visible = true;

      const pulse = Math.abs(Math.sin(performance.now() / 520));
      zone.material.alpha = zone.currentAlpha + pulse * 0.08;
      zone.wallMaterials.forEach((wallMaterial) => {
        wallMaterial.alpha = zone.currentAlpha * (0.08 / 0.12) + pulse * 0.08;
      });
      zone.border.color = BABYLON.Color3.FromHexString('#ef4444');

      const recipePulse = Math.abs(Math.sin(performance.now() / 300));
      if (zone.recipeLabel.material instanceof BABYLON.StandardMaterial) {
        zone.recipeLabel.material.emissiveColor = BABYLON.Color3.FromHexString('#f59e0b').scale(0.6 + recipePulse * 0.4);
      }
    } else {
      zone.marker.isVisible = false;
      zone.border.isVisible = false;
      zone.wallMeshes.forEach((wallMesh) => {
        wallMesh.isVisible = false;
      });
      zone.label.isVisible = false;
      zone.recipeLabel.isVisible = false;
      zone.visible = false;
      zone.material.alpha = 0;
      zone.wallMaterials.forEach((wallMaterial) => {
        wallMaterial.alpha = 0;
      });
    }
  });
}

function equipmentStatusText(state: EquipmentState): EquipmentStatusText {
  if (state === 'warmup') return 'WARMING UP';
  if (state === 'running') return 'PROCESSING';
  if (state === 'cooldown') return 'COOLING DOWN';
  return 'STANDBY';
}

function equipmentVisualForState(state: EquipmentState, stateTimer: number) {
  if (state === 'warmup') {
    const color = BABYLON.Color3.FromHexString(EQUIPMENT_STATE_VISUALS.warmup.color);
    const pulse = Math.abs(Math.sin(performance.now() / 1000));
    return {
      color,
      colorHex: EQUIPMENT_STATE_VISUALS.warmup.color,
      emissiveColor: color.scale(0.1 + pulse * 0.2),
    };
  }

  if (state === 'running') {
    const color = BABYLON.Color3.FromHexString(EQUIPMENT_STATE_VISUALS.running.color);
    return {
      color,
      colorHex: EQUIPMENT_STATE_VISUALS.running.color,
      emissiveColor: color.scale(EQUIPMENT_STATE_VISUALS.running.emissive),
    };
  }

  if (state === 'cooldown') {
    const color = BABYLON.Color3.FromHexString(EQUIPMENT_STATE_VISUALS.cooldown.color);
    const progress = Math.min(Math.max(stateTimer / EQUIPMENT_COOLDOWN_SECONDS, 0), 1);
    return {
      color,
      colorHex: EQUIPMENT_STATE_VISUALS.cooldown.color,
      emissiveColor: color.scale(BABYLON.Scalar.Lerp(0.18, 0.06, progress)),
    };
  }

  const color = BABYLON.Color3.FromHexString(EQUIPMENT_STATE_VISUALS.idle.color);
  return {
    color,
    colorHex: EQUIPMENT_STATE_VISUALS.idle.color,
    emissiveColor: color.scale(EQUIPMENT_STATE_VISUALS.idle.emissive),
  };
}

function syncRecipeDrivenEquipmentState(store: ReturnType<typeof useArTrackingStore.getState>) {
  Object.entries(RECIPE_EQUIPMENT_MAP).forEach(([recipeId, bay]) => {
    const equipment = store.equipment.find((item) => item.bay === bay);
    if (!equipment) return;

    const recipeRunning = store.recipeStates[recipeId] === 'running';
    if (recipeRunning) {
      if (equipment.state === 'idle' || equipment.state === 'cooldown') {
        store.setEquipmentState(equipment.id, 'warmup');
        return;
      }

      if (equipment.state === 'warmup' && equipment.stateTimer >= EQUIPMENT_WARMUP_SECONDS) {
        store.setEquipmentState(equipment.id, 'running');
      }
      return;
    }

    if (equipment.state === 'running' || equipment.state === 'warmup') {
      store.setEquipmentState(equipment.id, 'cooldown');
      return;
    }

    if (equipment.state === 'cooldown' && equipment.stateTimer >= EQUIPMENT_COOLDOWN_SECONDS) {
      store.setEquipmentState(equipment.id, 'idle');
    }
  });
}

function publishArTrackingSceneStats(engine: BABYLON.Engine, scene: BABYLON.Scene) {
  const fps = engine.getFps();
  const caps = engine.getCaps() as { maxDrawCalls?: number };
  const statsScene = scene as BABYLON.Scene & { activeIndices?: number; _activeIndices?: number };

  window.__arTrackingFPS = fps;
  window.__arTrackingSceneStats = {
    meshCount: scene.meshes.length,
    drawCalls: caps.maxDrawCalls ?? scene.getActiveMeshes().length,
    activeIndices: statsScene.activeIndices ?? statsScene._activeIndices ?? 0,
    fps,
  };

  return fps;
}

function updateEquipmentBays(equipmentBays: EquipmentBayRuntime[], store: ReturnType<typeof useArTrackingStore.getState>) {
  const equipmentByBay = new Map(store.equipment.map((equipment) => [equipment.bay, equipment]));

  equipmentBays.forEach((bay, index) => {
    const equipment = equipmentByBay.get(bay.label);
    const state = equipment?.state ?? 'idle';
    const status = equipmentStatusText(state);
    const visual = equipmentVisualForState(state, equipment?.stateTimer ?? 0);
    const wireframes = EQUIPMENT_WIREFRAME_MESHES[index] ?? bay.wireframes;
    const dataPanel = EQUIPMENT_DATA_PANEL_LABELS[index] ?? bay.dataPanel;

    bay.material.albedoColor.copyFrom(visual.color);
    bay.material.emissiveColor.copyFrom(visual.emissiveColor);
    wireframes.forEach((wireframe) => {
      wireframe.color.copyFrom(visual.color);
    });

    if (bay.displayedStatus !== status) {
      updateLabelText(dataPanel, `${bay.label} ${status}`, visual.colorHex);
      bay.displayedStatus = status;
    }
  });
}

function createScene(canvas: HTMLCanvasElement, pipCanvasRef: React.RefObject<HTMLCanvasElement | null>): () => void {
  const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, antialias: true });
  engine.setHardwareScalingLevel(window.devicePixelRatio > 1 ? 1.15 : 1);
  const scene = new BABYLON.Scene(engine, { useGeometryUniqueIdsMap: true, useMaterialMeshMap: true, useClonedMeshMap: true });
  scene.clearColor = new BABYLON.Color4(0.02, 0.02, 0.06, 1);

  const overviewCamera = new BABYLON.ArcRotateCamera('AR-OVERVIEW-CAMERA', -Math.PI / 2.35, 0.92, 58, new BABYLON.Vector3(0, 0, 0), scene);
  overviewCamera.attachControl(canvas, true);
  overviewCamera.lowerRadiusLimit = 28;
  overviewCamera.upperRadiusLimit = 78;
  overviewCamera.lowerBetaLimit = 0.54;
  overviewCamera.upperBetaLimit = 1.18;
  overviewCamera.wheelPrecision = 42;
  overviewCamera.viewport = new BABYLON.Viewport(0, 0, 1, 1);

  const arCamera = new BABYLON.UniversalCamera('AR-FIRST-PERSON-CAMERA', new BABYLON.Vector3(0, HEAD_HEIGHT, 0), scene);
  arCamera.fov = 1.05;
  arCamera.minZ = 0.04;
  arCamera.speed = 0;
  // No viewport — RTT renders offscreen

  let blitInFlight = false;
  const PIP_RTT_WIDTH = 512;
  const PIP_RTT_HEIGHT = 384;
  const pipRtt = new BABYLON.RenderTargetTexture(
    'pip-rtt',
    { width: PIP_RTT_WIDTH, height: PIP_RTT_HEIGHT },
    scene,
    { generateMipMaps: false, type: BABYLON.Constants.TEXTURETYPE_UNSIGNED_BYTE },
  );
  pipRtt.activeCamera = arCamera;
  pipRtt.renderList = null; // null = render all meshes
  scene.customRenderTargets.push(pipRtt);
  pipRtt.refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;

  scene.activeCamera = overviewCamera;

  const ambient = new BABYLON.HemisphericLight('AR-AMBIENT', new BABYLON.Vector3(0, 1, 0), scene);
  ambient.intensity = 0.15;
  const bayLights: [string, number, number, string][] = [
    ['Litho Bay', -18, 10, '#22d3ee'],
    ['Etch Bay', -17, -14, '#22d3ee'],
    ['Diffusion Bay', 0, -13, '#f59e0b'],
    ['Metrology', 17, -12, '#22d3ee'],
    ['CMP Bay', 18, 3, '#22d3ee'],
    ['Implant', -2, 5, '#f59e0b'],
    ['Stocker', -25, 0, '#22d3ee'],
    ['Photo Track', 8, 15, '#22d3ee'],
  ];
  bayLights.forEach(([name, x, z, color]) => {
    const light = new BABYLON.PointLight(name, new BABYLON.Vector3(x, 1.5, z), scene);
    light.intensity = 0.35;
    light.diffuse = BABYLON.Color3.FromHexString(color);
    light.range = 10;
  });
  const rim = new BABYLON.DirectionalLight('AR-RIM', new BABYLON.Vector3(-0.45, -0.88, -0.28), scene);
  rim.position = new BABYLON.Vector3(16, 24, 14);
  rim.intensity = 0.52;

  const effects = createCinematicPipeline(scene, overviewCamera, {
    glowIntensity: 0.5,
    glowKernel: 16,
    glowTextureSize: AR_TRACKING_REDUCED_GLOW_TEXTURE_SIZE,
    bloomWeight: 0.28,
    grainIntensity: 3,
    chromaticAberration: 5,
    vignetteWeight: 1.2,
    enableSSR: true,
    enableSSAO: true,
  });
  const { pipeline, glow, ssao } = effects;
  let ssr = effects.ssr;
  let lowFpsElapsedMs = 0;
  let reducedPostEffects = false;

  glow.customEmissiveColorSelector = (mesh, _subMesh, material, result) => {
    const name = mesh.name.toLowerCase();
    let color: BABYLON.Color3 | null = null;

    if (name.includes('ar-equipment') && name.includes('wireframe') && mesh instanceof BABYLON.LinesMesh) {
      color = mesh.color;
    } else if (name.includes('violation')) {
      color = BABYLON.Color3.FromHexString('#ef4444');
    } else if (name.includes('force-field-wall')) {
      color = BABYLON.Color3.FromHexString('#ef4444');
    } else if (name.includes('label') || name.includes('warning')) {
      color = BABYLON.Color3.FromHexString('#f59e0b');
    } else if (name.includes('ar-glasses') || name.includes('border')) {
      color = BABYLON.Color3.FromHexString('#22d3ee');
    } else if (name.includes('scan-ring') || name.includes('digital-halo') || name.includes('directional-indicator')) {
      if (material instanceof BABYLON.PBRMaterial) {
        color = material.emissiveColor;
      } else if (mesh instanceof BABYLON.LinesMesh) {
        color = mesh.color;
      }
    }

    if (color) {
      result.r = color.r;
      result.g = color.g;
      result.b = color.b;
      result.a = 1;
      return;
    }

    result.r = 0;
    result.g = 0;
    result.b = 0;
    result.a = 0;
  };

  const highlightLayer = new BABYLON.HighlightLayer('ar-highlight', scene);
  let highlightedPersonnelId: string | null = null;

  const clearFocusedPersonnelHighlight = () => {
    if (!highlightedPersonnelId) return;

    const highlightedPerson = persons.get(highlightedPersonnelId);
    highlightedPerson?.node.getChildMeshes().forEach((mesh) => {
      if (mesh instanceof BABYLON.Mesh) {
        highlightLayer.removeMesh(mesh);
      }
    });
    highlightedPersonnelId = null;
  };

  const focusPersonnelHighlight = (personId: string) => {
    if (highlightedPersonnelId === personId) return;

    clearFocusedPersonnelHighlight();
    const person = persons.get(personId);
    if (!person) return;

    person.node.getChildMeshes().forEach((mesh) => {
      if (mesh instanceof BABYLON.Mesh) {
        highlightLayer.addMesh(mesh, BABYLON.Color3.FromHexString('#22d3ee'));
      }
    });
    highlightedPersonnelId = personId;
  };

  const equipmentBays = createFabLayout(scene, glow);
  const zones = createRestrictedZones(scene);
  const dynamicZones = createDynamicZones(scene);
  zones.forEach((zone) => {
    glow.addIncludedOnlyMesh(zone.border);
    glow.addIncludedOnlyMesh(zone.label);
    zone.wallMeshes.forEach((wallMesh) => glow.addIncludedOnlyMesh(wallMesh));
  });
  dynamicZones.forEach((zone) => {
    glow.addIncludedOnlyMesh(zone.border);
    glow.addIncludedOnlyMesh(zone.label);
    glow.addIncludedOnlyMesh(zone.recipeLabel);
    zone.wallMeshes.forEach((wallMesh) => glow.addIncludedOnlyMesh(wallMesh));
  });
  const persons = new Map<string, PersonRuntime>();
  const includePersonnelAugmentationsInGlow = (person: PersonRuntime) => {
    person.augmentations?.meshes.forEach((mesh) => {
      glow.addIncludedOnlyMesh(mesh);
    });
    person.node.getChildMeshes().forEach((mesh) => {
      if (mesh instanceof BABYLON.Mesh && (mesh.name.includes('ar-glasses') || mesh.name.includes('-tag'))) {
        glow.addIncludedOnlyMesh(mesh);
      }
    });
  };
  Object.entries(PATROL_ROUTES).forEach(([id, route]) => {
    const person = createPerson(scene, id, route[0]);
    persons.set(id, person);
    includePersonnelAugmentationsInGlow(person);
  });

  const recipeTimers = Object.fromEntries(DYNAMIC_ZONES.map((zone, index) => [
    zone.id,
    { nextToggle: 5000 + index * 15000 },
  ]));
  let elapsedMs = 0;

  const resize = () => engine.resize();
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    window.removeEventListener('resize', resize);
    window.removeEventListener('pagehide', dispose);
    engine.stopRenderLoop();
    highlightLayer.removeAllMeshes();
    pipRtt.dispose();
    glow.dispose();
    ssr?.dispose();
    ssao?.dispose();
    pipeline.dispose();
    highlightLayer.dispose();
    if (!scene.isDisposed) scene.dispose();
    engine.dispose();
  };

  window.addEventListener('resize', resize);
  window.addEventListener('pagehide', dispose);
  window.__arTrackingStore = useArTrackingStore;

  const tunePostEffectsForFps = (fps: number, deltaSeconds: number) => {
    if (fps >= AR_TRACKING_TARGET_FPS || (!ssr && !ssao)) {
      lowFpsElapsedMs = 0;
      return;
    }

    lowFpsElapsedMs += deltaSeconds * 1000;
    if (lowFpsElapsedMs < AR_TRACKING_LOW_FPS_SAMPLE_MS) return;

    lowFpsElapsedMs = 0;
    if (!reducedPostEffects) {
      // These defaults preserve the AR look while keeping the scene aimed at 30fps.
      // If scene complexity changes, tune SSR steps, SSAO samples, and glow size together.
      if (ssr) ssr.maxSteps = 32;
      if (ssao) ssao.samples = 8;
      glow.blurKernelSize = 16;
      reducedPostEffects = true;
      return;
    }

    if (ssr) {
      ssr.dispose();
      ssr = undefined;
    }
  };

  void (async () => {
    const availableModels = await loadAvailableModels();
    for (const [id] of Object.entries(PATROL_ROUTES)) {
      const modelFile = MODEL_VARIANTS[id];
      const current = persons.get(id);
      if (!modelFile || !current) continue;
      const gltfPerson = await createGltfPerson(
        scene,
        id,
        current.node.position,
        current.waypointIndex,
        modelFile,
        availableModels,
      );
      if (gltfPerson && disposed) {
        gltfPerson.node.dispose(false, true);
        continue;
      }

      if (gltfPerson) {
        gltfPerson.direction.copyFrom(current.direction);
        current.node.dispose(false, true);
        persons.set(id, gltfPerson);
        includePersonnelAugmentationsInGlow(gltfPerson);
      }
    }
  })();

  engine.runRenderLoop(() => {
    if (disposed || scene.isDisposed) return;
    const deltaSeconds = Math.min(engine.getDeltaTime() / 1000, 0.05);
    let store = useArTrackingStore.getState();

    elapsedMs += deltaSeconds * 1000;
    DYNAMIC_ZONES.forEach((zone) => {
      const timer = recipeTimers[zone.id];
      if (elapsedMs < timer.nextToggle) return;

      const currentState = useArTrackingStore.getState().recipeStates[zone.id];
      const nextState = currentState === 'idle' ? 'running' : 'idle';
      store.setRecipeState(zone.id, nextState);
      timer.nextToggle = elapsedMs + (nextState === 'running'
        ? 45000 + Math.random() * 15000
        : 30000 + Math.random() * 15000);
    });

    store = useArTrackingStore.getState();

    updateDynamicZones(dynamicZones, deltaSeconds);
    store.tickPersonnelTimers(deltaSeconds * 1000);
    store.tickEquipmentTimers(deltaSeconds * 1000);
    syncRecipeDrivenEquipmentState(useArTrackingStore.getState());
    store = useArTrackingStore.getState();
    updateEquipmentBays(equipmentBays, store);
    const visibleDynamicZones = new Set(dynamicZones.filter((zone) => zone.visible).map((zone) => zone.zoneId));

    persons.forEach((person, id) => {
      const currentBeforeMovement = store.personnel.find((item) => item.id === id);
      let personnelState = currentBeforeMovement?.state ?? 'patrolling';
      const activeZone = nearestActiveDynamicZone(person.node.position, store);
      const shouldAvoid = Boolean(
        activeZone && activeZone.distance <= 6 && !isInsideZone(person.node.position, activeZone.zone),
      );

      if (personnelState === 'observing' || personnelState === 'operating') {
        if (person.behaviorUntilMs > elapsedMs) {
          applyPersonnelAnimation(person, personnelState);
        } else {
          setPersonnelBehavior(store, person, id, 'patrolling', elapsedMs);
          personnelState = 'patrolling';
        }
      }

      if (personnelState !== 'observing' && personnelState !== 'operating') {
        if (personnelState === 'avoiding') {
          const clearOfActiveZones = DYNAMIC_ZONES
            .filter((dynamicZone) => store.recipeStates[dynamicZone.id] === 'running')
            .every((dynamicZone) => behaviorDistanceToZoneBoundary(person.node.position, dynamicZone) >= 3)
            && !shouldAvoid;
          if (clearOfActiveZones) {
            setPersonnelBehavior(store, person, id, 'patrolling', elapsedMs);
            personnelState = 'patrolling';
          }
        } else if (shouldAvoid && activeZone) {
          setPersonnelBehavior(store, person, id, 'avoiding', elapsedMs);
          personnelState = 'avoiding';
        }
      }

      let reachedWaypoint = false;
      if (personnelState === 'observing' || personnelState === 'operating') {
        applyPersonnelAnimation(person, personnelState);
      } else if (personnelState === 'avoiding' && activeZone) {
        reachedWaypoint = updatePersonMovement(
          person,
          id,
          deltaSeconds,
          1.5,
          directionAwayFromZone(person.node.position, activeZone.zone),
        );
      } else {
        reachedWaypoint = updatePersonMovement(person, id, deltaSeconds, 1);
        updateIdleAnimation(person, deltaSeconds);
      }

      if (personnelState === 'patrolling' || personnelState === 'idle') {
        if (shouldAvoid && activeZone) {
          setPersonnelBehavior(store, person, id, 'avoiding', elapsedMs);
          personnelState = 'avoiding';
        } else if (isNearRunningEquipmentBay(person.node.position, store) && Math.random() <= 0.2) {
          setPersonnelBehavior(store, person, id, 'operating', elapsedMs, 8000 + Math.random() * 7000);
          personnelState = 'operating';
        } else if (reachedWaypoint && Math.random() <= 0.3) {
          setPersonnelBehavior(store, person, id, 'observing', elapsedMs, 3000 + Math.random() * 2000);
          personnelState = 'observing';
        } else if (personnelState === 'idle') {
          setPersonnelBehavior(store, person, id, 'patrolling', elapsedMs);
          personnelState = 'patrolling';
        }
      }

      const zone = zoneForPosition(person.node.position.x, person.node.position.z, visibleDynamicZones);
      const current = useArTrackingStore.getState().personnel.find((item) => item.id === id);
      const zoneId = zone?.id ?? null;
      if (current?.inZone !== zoneId) {
        store.setPersonnelZoneStatus(id, zoneId);
        if (zoneId) store.triggerAlert(id, zoneId);
      }
      store.updatePersonnelPosition(id, person.node.position.x, person.node.position.z, person.waypointIndex);

      const visualState = useArTrackingStore.getState().personnel.find((item) => item.id === id);
      const pulse = visualState?.status === 'violation' ? Math.abs(Math.sin(performance.now() / 180)) : 0;
      person.bodyMaterial.albedoColor = visualState?.status === 'violation'
        ? BABYLON.Color3.FromHexString('#fee2e2')
        : BABYLON.Color3.FromHexString('#f8fafc');
      person.bodyMaterial.emissiveColor = visualState?.status === 'violation'
        ? BABYLON.Color3.FromHexString('#ef4444').scale(0.35 + pulse * 0.45)
        : BABYLON.Color3.FromHexString('#f8fafc').scale(0.04);

      const personnelData = useArTrackingStore.getState().personnel.find((p) => p.id === id);
      const stateColor = getPersonnelStateColor(personnelData);
      if (person.holographicMaterial) {
        updateHolographicColor(person.holographicMaterial, stateColor);
        updateHolographicTime(person.holographicMaterial, performance.now() / 1000);
      }

      if (!person.isGltf && person.armParts.length > 0) {
        const isMoving = person.currentAnim === 'walk';
        animateProceduralWalk(person.armParts, person.legParts, isMoving);
      }

      updatePersonnelAugmentations(person, visualState, deltaSeconds);
    });

    zones.forEach((zone) => {
      const active = store.personnel.some((person) => person.inZone === zone.zoneId);
      const pulse = Math.abs(Math.sin(performance.now() / 520));
      zone.material.alpha = active ? 0.2 + pulse * 0.14 : 0.08 + pulse * 0.1;
      zone.wallMeshes.forEach((wallMesh) => {
        if (wallMesh.material instanceof BABYLON.PBRMaterial) {
          wallMesh.material.alpha = 0.06 + pulse * 0.08;
        }
      });
      zone.border.color = BABYLON.Color3.FromHexString(active ? '#ff1744' : '#ef4444');
    });

    if (store.focusPersonnelId) {
      focusPersonnelHighlight(store.focusPersonnelId);
      const person = persons.get(store.focusPersonnelId);
      if (person) {
        overviewCamera.setTarget(person.node.position.add(new BABYLON.Vector3(0, 0.8, 0)));
      }
      store.clearFocusPersonnel();
    } else {
      clearFocusedPersonnelHighlight();
    }

    const currentPipTarget = useArTrackingStore.getState().pipTarget;
    if (currentPipTarget) {
      const person = persons.get(currentPipTarget);
      if (person) {
        const headPosition = person.node.position.add(new BABYLON.Vector3(0, HEAD_HEIGHT, 0));
        arCamera.position.copyFrom(BABYLON.Vector3.Lerp(arCamera.position, headPosition, 0.16));
        arCamera.setTarget(headPosition.add(person.direction.scale(4)));

        pipRtt.refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONEVERYFRAME;

        const pipCanvas = pipCanvasRef?.current;
        if (pipCanvas) {
          const ctx = pipCanvas.getContext('2d');
          if (ctx && !blitInFlight) {
            blitInFlight = true;
            const pixelsPromise = pipRtt.readPixels();
            if (pixelsPromise) {
              void pixelsPromise.then((pixels) => {
                blitInFlight = false;
                const u8 = new Uint8ClampedArray(pixels.buffer as ArrayBuffer);
                const flipped = new Uint8ClampedArray(PIP_RTT_WIDTH * PIP_RTT_HEIGHT * 4);
                const rowBytes = PIP_RTT_WIDTH * 4;
                for (let row = 0; row < PIP_RTT_HEIGHT; row++) {
                  const srcRow = PIP_RTT_HEIGHT - 1 - row;
                  flipped.set(u8.subarray(srcRow * rowBytes, (srcRow + 1) * rowBytes), row * rowBytes);
                }
                const imageData = new ImageData(flipped, PIP_RTT_WIDTH, PIP_RTT_HEIGHT);
                ctx.putImageData(imageData, 0, 0);
              }).catch(() => { blitInFlight = false; });
            } else {
              blitInFlight = false;
            }
          }
        }
      }
    } else {
      pipRtt.refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
    }

    const fps = publishArTrackingSceneStats(engine, scene);
    tunePostEffectsForFps(fps, deltaSeconds);
    scene.render();
  });

  return dispose;
}

export function ArTrackingScene({ pipCanvasRef }: { pipCanvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const webgl = useWebGLSupport();

  useEffect(() => {
    if (!canvasRef.current || !webgl.supported) return undefined;
    return createScene(canvasRef.current, pipCanvasRef);
  }, [webgl.supported, pipCanvasRef]);

  if (!webgl.supported) return <WebGLFallback />;

  return (
    <canvas
      ref={canvasRef}
      data-testid="ar-tracking-canvas"
      aria-label="Babylon.js AR personnel tracking fab floor scene"
      className="h-full min-h-[calc(100dvh-104px)] w-full touch-none outline-none"
    />
  );
}
