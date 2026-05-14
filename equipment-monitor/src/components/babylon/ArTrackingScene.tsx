'use client';

import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { WebGLFallback } from '@/components/three/WebGLFallback';
import { useWebGLSupport } from '@/hooks/use-webgl-support';
import {
  PATROL_ROUTES,
  RESTRICTED_ZONES,
  useArTrackingStore,
} from '@/stores/ar-tracking-store';

const PERSONNEL_SPEED = 2;
const HEAD_HEIGHT = 1.72;

type PersonRuntime = {
  node: BABYLON.TransformNode;
  bodyMaterial: BABYLON.PBRMaterial;
  direction: BABYLON.Vector3;
  waypointIndex: number;
};

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

function createFabLayout(scene: BABYLON.Scene) {
  const groundMaterial = createPbr(scene, 'ar-ground-material', '#0A1628', 0.02);
  const ground = BABYLON.MeshBuilder.CreateGround('AR-FAB-FLOOR', { width: 60, height: 40, subdivisions: 48 }, scene);
  ground.material = groundMaterial;
  ground.isPickable = false;

  for (let x = -30; x <= 30; x += 5) {
    const line = BABYLON.MeshBuilder.CreateLines(`ar-grid-x-${x}`, {
      points: [new BABYLON.Vector3(x, 0.012, -20), new BABYLON.Vector3(x, 0.012, 20)],
    }, scene);
    line.color = BABYLON.Color3.FromHexString('#12324f');
    line.isPickable = false;
  }
  for (let z = -20; z <= 20; z += 5) {
    const line = BABYLON.MeshBuilder.CreateLines(`ar-grid-z-${z}`, {
      points: [new BABYLON.Vector3(-30, 0.014, z), new BABYLON.Vector3(30, 0.014, z)],
    }, scene);
    line.color = BABYLON.Color3.FromHexString('#12324f');
    line.isPickable = false;
  }

  const bays = [
    ['Litho Bay', -18, 10, 9, 5],
    ['Etch Bay', -17, -14, 10, 4],
    ['Diffusion Bay', 0, -13, 9, 4],
    ['Metrology', 17, -12, 8, 5],
    ['CMP Bay', 18, 3, 8, 4],
    ['Implant', -2, 5, 8, 4],
    ['Stocker', -25, 0, 5, 8],
    ['Photo Track', 8, 15, 9, 3.6],
  ] as const;
  bays.forEach(([label, x, z, width, depth], index) => {
    const base = BABYLON.MeshBuilder.CreateBox(`ar-equipment-${index}`, { width, height: 1.4, depth }, scene);
    base.position = new BABYLON.Vector3(x, 0.7, z);
    const material = createPbr(scene, `ar-equipment-${index}-material`, '#334155', 0.14);
    material.emissiveColor = BABYLON.Color3.FromHexString('#22d3ee').scale(0.12);
    base.material = material;
    base.isPickable = false;

    const labelMesh = createLabel(scene, `ar-equipment-${index}-label`, label, '#22d3ee');
    labelMesh.position = new BABYLON.Vector3(x, 2.15, z);
  });
}

function createRestrictedZones(scene: BABYLON.Scene) {
  return RESTRICTED_ZONES.map((zone) => {
    const material = createPbr(scene, `${zone.id}-material`, '#ef4444', 0.6, 0.12);
    const marker = BABYLON.MeshBuilder.CreateGround(zone.id, { width: zone.size[0], height: zone.size[1] }, scene);
    marker.position = new BABYLON.Vector3(zone.center[0], 0.035, zone.center[1]);
    marker.material = material;
    marker.isPickable = false;

    const halfX = zone.size[0] / 2;
    const halfZ = zone.size[1] / 2;
    const y = 0.08;
    const corners = [
      new BABYLON.Vector3(zone.center[0] - halfX, y, zone.center[1] - halfZ),
      new BABYLON.Vector3(zone.center[0] + halfX, y, zone.center[1] - halfZ),
      new BABYLON.Vector3(zone.center[0] + halfX, y, zone.center[1] + halfZ),
      new BABYLON.Vector3(zone.center[0] - halfX, y, zone.center[1] + halfZ),
      new BABYLON.Vector3(zone.center[0] - halfX, y, zone.center[1] - halfZ),
    ];
    const border = BABYLON.MeshBuilder.CreateLines(`${zone.id}-border`, { points: corners }, scene);
    border.color = BABYLON.Color3.FromHexString('#ef4444');
    border.isPickable = false;

    const label = createLabel(scene, `${zone.id}-label`, `WARNING ${zone.name}`, '#f59e0b');
    label.position = new BABYLON.Vector3(zone.center[0], 2.8, zone.center[1]);
    return { zoneId: zone.id, material, border };
  });
}

function createPerson(scene: BABYLON.Scene, id: string, start: [number, number]) {
  const node = new BABYLON.TransformNode(`${id}-node`, scene);
  node.position = new BABYLON.Vector3(start[0], 0, start[1]);

  const bodyMaterial = createPbr(scene, `${id}-body-material`, '#f8fafc', 0.04);
  const body = BABYLON.MeshBuilder.CreateCapsule(`${id}-body`, { height: 1.8, radius: 0.3, tessellation: 18 }, scene);
  body.parent = node;
  body.position.y = 0.9;
  body.material = bodyMaterial;
  body.isPickable = false;

  const head = BABYLON.MeshBuilder.CreateSphere(`${id}-head`, { diameter: 0.5, segments: 18 }, scene);
  head.parent = node;
  head.position.y = 1.92;
  head.material = bodyMaterial;
  head.isPickable = false;

  const glasses = BABYLON.MeshBuilder.CreateBox(`${id}-ar-glasses`, { width: 0.42, height: 0.08, depth: 0.16 }, scene);
  glasses.parent = node;
  glasses.position = new BABYLON.Vector3(0, 1.93, -0.24);
  glasses.material = createPbr(scene, `${id}-glasses-material`, '#22d3ee', 1.2);
  glasses.isPickable = false;

  const tag = createLabel(scene, `${id}-tag`, id, '#22d3ee');
  tag.parent = node;
  tag.position.y = 2.55;
  tag.scaling = new BABYLON.Vector3(0.62, 0.62, 0.62);

  return { node, bodyMaterial, direction: new BABYLON.Vector3(0, 0, 1), waypointIndex: 0 };
}

function zoneForPosition(x: number, z: number) {
  return RESTRICTED_ZONES.find((zone) => {
    const halfX = zone.size[0] / 2;
    const halfZ = zone.size[1] / 2;
    return x >= zone.center[0] - halfX && x <= zone.center[0] + halfX
      && z >= zone.center[1] - halfZ && z <= zone.center[1] + halfZ;
  }) ?? null;
}

function updatePersonMovement(person: PersonRuntime, id: string, deltaSeconds: number) {
  const route = PATROL_ROUTES[id];
  const nextIndex = (person.waypointIndex + 1) % route.length;
  const target = new BABYLON.Vector3(route[nextIndex][0], 0, route[nextIndex][1]);
  const offset = target.subtract(person.node.position);
  const distance = offset.length();

  if (distance < 0.16) {
    person.waypointIndex = nextIndex;
    return;
  }

  const direction = offset.normalize();
  person.direction = direction;
  person.node.position.addInPlace(direction.scale(Math.min(distance, PERSONNEL_SPEED * deltaSeconds)));
  person.node.rotation.y = Math.atan2(direction.x, direction.z);
}

function createScene(canvas: HTMLCanvasElement) {
  const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, antialias: true });
  engine.setHardwareScalingLevel(window.devicePixelRatio > 1 ? 1.15 : 1);
  const scene = new BABYLON.Scene(engine, { useGeometryUniqueIdsMap: true, useMaterialMeshMap: true, useClonedMeshMap: true });
  scene.clearColor = BABYLON.Color4.FromHexString('#0A1628ff');

  const overviewCamera = new BABYLON.ArcRotateCamera('AR-OVERVIEW-CAMERA', -Math.PI / 2.35, 0.92, 58, new BABYLON.Vector3(0, 0, 0), scene);
  overviewCamera.attachControl(canvas, true);
  overviewCamera.lowerRadiusLimit = 28;
  overviewCamera.upperRadiusLimit = 78;
  overviewCamera.lowerBetaLimit = 0.54;
  overviewCamera.upperBetaLimit = 1.18;
  overviewCamera.wheelPrecision = 42;

  const arCamera = new BABYLON.UniversalCamera('AR-FIRST-PERSON-CAMERA', new BABYLON.Vector3(0, HEAD_HEIGHT, 0), scene);
  arCamera.fov = 1.05;
  arCamera.minZ = 0.04;
  arCamera.speed = 0;
  scene.activeCamera = overviewCamera;

  const ambient = new BABYLON.HemisphericLight('AR-AMBIENT', new BABYLON.Vector3(0, 1, 0), scene);
  ambient.intensity = 0.76;
  const rim = new BABYLON.DirectionalLight('AR-RIM', new BABYLON.Vector3(-0.45, -0.88, -0.28), scene);
  rim.position = new BABYLON.Vector3(16, 24, 14);
  rim.intensity = 0.52;

  createFabLayout(scene);
  const zones = createRestrictedZones(scene);
  const persons = new Map(Object.entries(PATROL_ROUTES).map(([id, route]) => [id, createPerson(scene, id, route[0])]));
  let lastActiveView = useArTrackingStore.getState().activeView;

  const resize = () => engine.resize();
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    window.removeEventListener('resize', resize);
    window.removeEventListener('pagehide', dispose);
    engine.stopRenderLoop();
    if (!scene.isDisposed) scene.dispose();
    engine.dispose();
  };

  window.addEventListener('resize', resize);
  window.addEventListener('pagehide', dispose);

  engine.runRenderLoop(() => {
    if (disposed || scene.isDisposed) return;
    const deltaSeconds = Math.min(engine.getDeltaTime() / 1000, 0.05);
    const store = useArTrackingStore.getState();

    persons.forEach((person, id) => {
      updatePersonMovement(person, id, deltaSeconds);
      const zone = zoneForPosition(person.node.position.x, person.node.position.z);
      const current = store.personnel.find((item) => item.id === id);
      const zoneId = zone?.id ?? null;
      if (current?.inZone !== zoneId) {
        store.setPersonnelZoneStatus(id, zoneId);
        if (zoneId) store.triggerAlert(id, zoneId);
      }
      store.updatePersonnelPosition(id, person.node.position.x, person.node.position.z, person.waypointIndex);

      const pulse = current?.status === 'violation' ? Math.abs(Math.sin(performance.now() / 180)) : 0;
      person.bodyMaterial.albedoColor = current?.status === 'violation'
        ? BABYLON.Color3.FromHexString('#fee2e2')
        : BABYLON.Color3.FromHexString('#f8fafc');
      person.bodyMaterial.emissiveColor = current?.status === 'violation'
        ? BABYLON.Color3.FromHexString('#ef4444').scale(0.35 + pulse * 0.45)
        : BABYLON.Color3.FromHexString('#f8fafc').scale(0.04);
    });

    zones.forEach((zone) => {
      const active = store.personnel.some((person) => person.inZone === zone.zoneId);
      const pulse = Math.abs(Math.sin(performance.now() / 520));
      zone.material.alpha = active ? 0.2 + pulse * 0.14 : 0.08 + pulse * 0.1;
      zone.border.color = BABYLON.Color3.FromHexString(active ? '#ff1744' : '#ef4444');
    });

    if (store.focusPersonnelId) {
      const person = persons.get(store.focusPersonnelId);
      if (person) {
        overviewCamera.setTarget(person.node.position.add(new BABYLON.Vector3(0, 0.8, 0)));
      }
      store.clearFocusPersonnel();
    }

    if (store.activeView !== lastActiveView) {
      if (store.activeView === 'overview') {
        scene.activeCamera = overviewCamera;
        overviewCamera.attachControl(canvas, true);
      } else {
        const person = persons.get(store.activeView.personnelId);
        if (person) {
          const targetPosition = person.node.position.add(new BABYLON.Vector3(0, HEAD_HEIGHT, 0));
          arCamera.position.copyFrom(overviewCamera.globalPosition);
          scene.activeCamera = arCamera;
          const easing = new BABYLON.CubicEase();
          easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
          BABYLON.Animation.CreateAndStartAnimation('ar-camera-position', arCamera, 'position', 60, 30, arCamera.position.clone(), targetPosition, 0, easing);
        }
      }
      lastActiveView = store.activeView;
    }

    if (store.activeView !== 'overview') {
      const person = persons.get(store.activeView.personnelId);
      if (person) {
        const position = person.node.position.add(new BABYLON.Vector3(0, HEAD_HEIGHT, 0));
        arCamera.position.copyFrom(BABYLON.Vector3.Lerp(arCamera.position, position, 0.16));
        arCamera.setTarget(position.add(person.direction.scale(4)));
      }
    }

    scene.render();
  });

  return dispose;
}

export function ArTrackingScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const webgl = useWebGLSupport();

  useEffect(() => {
    if (!canvasRef.current || !webgl.supported) return undefined;
    return createScene(canvasRef.current);
  }, [webgl.supported]);

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
