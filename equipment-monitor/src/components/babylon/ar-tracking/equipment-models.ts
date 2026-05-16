import * as BABYLON from '@babylonjs/core';
import { createEquipmentHolographicMaterial, updateHolographicColor, updateHolographicTime } from '@/lib/holographic-material';

export interface EquipmentModel {
  shell: BABYLON.Mesh;
  internals: BABYLON.LinesMesh[];
  holographicMaterial: BABYLON.ShaderMaterial;
}

function mergeShellMeshes(meshes: BABYLON.Mesh[], scene: BABYLON.Scene, name: string): BABYLON.Mesh {
  const merged = BABYLON.Mesh.MergeMeshes(meshes, true, true, undefined, false, true);
  if (!merged) {
    const fallback = BABYLON.MeshBuilder.CreateBox(name, { size: 1 }, scene);
    return fallback;
  }
  merged.name = name;
  return merged;
}

function createInternalLines(
  scene: BABYLON.Scene,
  name: string,
  lineSegments: BABYLON.Vector3[][],
  color: string,
): BABYLON.LinesMesh[] {
  return lineSegments.map((points, i) => {
    const line = BABYLON.MeshBuilder.CreateLines(`${name}-internal-${i}`, { points }, scene);
    line.color = BABYLON.Color3.FromHexString(color);
    line.isPickable = false;
    return line;
  });
}

function buildLithoBay(scene: BABYLON.Scene, x: number, z: number): { shells: BABYLON.Mesh[]; lines: BABYLON.Vector3[][] } {
  const platform = BABYLON.MeshBuilder.CreateBox('', { width: 8, height: 0.4, depth: 4 }, scene);
  platform.position.set(x, 0.2, z);
  const column = BABYLON.MeshBuilder.CreateCylinder('', { height: 3.5, diameter: 1.6, tessellation: 12 }, scene);
  column.position.set(x - 1.5, 1.95, z);
  const lens = BABYLON.MeshBuilder.CreateBox('', { width: 3.5, height: 0.6, depth: 2 }, scene);
  lens.position.set(x + 1, 3.0, z);

  return {
    shells: [platform, column, lens],
    lines: [
      [new BABYLON.Vector3(x - 3, 0.4, z - 1.5), new BABYLON.Vector3(x - 3, 0.4, z + 1.5)],
      [new BABYLON.Vector3(x - 1.5, 0.4, z), new BABYLON.Vector3(x - 1.5, 3.7, z)],
      [new BABYLON.Vector3(x - 0.5, 3.0, z - 0.8), new BABYLON.Vector3(x + 2.8, 3.0, z - 0.8)],
      [new BABYLON.Vector3(x - 0.5, 3.0, z + 0.8), new BABYLON.Vector3(x + 2.8, 3.0, z + 0.8)],
      [new BABYLON.Vector3(x + 1, 2.7, z), new BABYLON.Vector3(x + 1, 3.3, z)],
    ],
  };
}

function buildEtchBay(scene: BABYLON.Scene, x: number, z: number): { shells: BABYLON.Mesh[]; lines: BABYLON.Vector3[][] } {
  const chamber = BABYLON.MeshBuilder.CreateCylinder('', { height: 2.4, diameter: 3.6, tessellation: 16 }, scene);
  chamber.position.set(x, 1.2, z);
  const lid = BABYLON.MeshBuilder.CreateSphere('', { diameter: 3.6, segments: 8, slice: 0.5 }, scene);
  lid.position.set(x, 2.4, z);
  const pipe1 = BABYLON.MeshBuilder.CreateCylinder('', { height: 1.8, diameter: 0.4, tessellation: 8 }, scene);
  pipe1.rotation.z = Math.PI / 2;
  pipe1.position.set(x + 2.4, 1.2, z);
  const pipe2 = BABYLON.MeshBuilder.CreateCylinder('', { height: 1.8, diameter: 0.4, tessellation: 8 }, scene);
  pipe2.rotation.z = Math.PI / 2;
  pipe2.position.set(x - 2.4, 1.2, z);

  return {
    shells: [chamber, lid, pipe1, pipe2],
    lines: [
      [new BABYLON.Vector3(x, 0.05, z - 1.4), new BABYLON.Vector3(x, 2.4, z - 1.4)],
      [new BABYLON.Vector3(x, 0.05, z + 1.4), new BABYLON.Vector3(x, 2.4, z + 1.4)],
      [new BABYLON.Vector3(x - 1.4, 1.2, z), new BABYLON.Vector3(x + 1.4, 1.2, z)],
    ],
  };
}

function buildDiffusionBay(scene: BABYLON.Scene, x: number, z: number): { shells: BABYLON.Mesh[]; lines: BABYLON.Vector3[][] } {
  const tube = BABYLON.MeshBuilder.CreateCylinder('', { height: 7, diameter: 2.4, tessellation: 12 }, scene);
  tube.rotation.z = Math.PI / 2;
  tube.position.set(x, 1.5, z);
  const door = BABYLON.MeshBuilder.CreateBox('', { width: 0.3, height: 2, depth: 2.2 }, scene);
  door.position.set(x - 3.6, 1.2, z);

  return {
    shells: [tube, door],
    lines: [
      [new BABYLON.Vector3(x - 3.2, 0.3, z), new BABYLON.Vector3(x + 3.2, 0.3, z)],
      [new BABYLON.Vector3(x - 3.2, 2.7, z), new BABYLON.Vector3(x + 3.2, 2.7, z)],
      [new BABYLON.Vector3(x, 0.3, z - 1.0), new BABYLON.Vector3(x, 0.3, z + 1.0)],
    ],
  };
}

function buildMetrology(scene: BABYLON.Scene, x: number, z: number): { shells: BABYLON.Mesh[]; lines: BABYLON.Vector3[][] } {
  const body = BABYLON.MeshBuilder.CreateBox('', { width: 4, height: 2, depth: 3 }, scene);
  body.position.set(x, 1.0, z);
  const arm = BABYLON.MeshBuilder.CreateBox('', { width: 0.4, height: 1.5, depth: 0.4 }, scene);
  arm.position.set(x, 2.75, z);
  const turret = BABYLON.MeshBuilder.CreateCylinder('', { height: 0.8, diameter: 1.2, tessellation: 10 }, scene);
  turret.position.set(x, 3.9, z);

  return {
    shells: [body, arm, turret],
    lines: [
      [new BABYLON.Vector3(x - 1.5, 0.05, z - 1.2), new BABYLON.Vector3(x - 1.5, 2.0, z - 1.2)],
      [new BABYLON.Vector3(x + 1.5, 0.05, z + 1.2), new BABYLON.Vector3(x + 1.5, 2.0, z + 1.2)],
      [new BABYLON.Vector3(x, 2.0, z), new BABYLON.Vector3(x, 3.5, z)],
    ],
  };
}

function buildCmpBay(scene: BABYLON.Scene, x: number, z: number): { shells: BABYLON.Mesh[]; lines: BABYLON.Vector3[][] } {
  const platen = BABYLON.MeshBuilder.CreateCylinder('', { height: 0.6, diameter: 4, tessellation: 20 }, scene);
  platen.position.set(x, 0.8, z);
  const arm = BABYLON.MeshBuilder.CreateBox('', { width: 3, height: 0.3, depth: 0.5 }, scene);
  arm.position.set(x + 0.5, 1.6, z);
  const conditioner = BABYLON.MeshBuilder.CreateCylinder('', { height: 0.3, diameter: 1.2, tessellation: 12 }, scene);
  conditioner.position.set(x + 2.2, 1.9, z);

  return {
    shells: [platen, arm, conditioner],
    lines: [
      [new BABYLON.Vector3(x, 0.5, z - 1.6), new BABYLON.Vector3(x, 0.5, z + 1.6)],
      [new BABYLON.Vector3(x - 1.6, 0.5, z), new BABYLON.Vector3(x + 1.6, 0.5, z)],
      [new BABYLON.Vector3(x, 1.1, z), new BABYLON.Vector3(x, 1.6, z)],
    ],
  };
}

function buildImplant(scene: BABYLON.Scene, x: number, z: number): { shells: BABYLON.Mesh[]; lines: BABYLON.Vector3[][] } {
  const column = BABYLON.MeshBuilder.CreateBox('', { width: 1.6, height: 4, depth: 1.6 }, scene);
  column.position.set(x - 1.5, 2.0, z);
  const beamLine = BABYLON.MeshBuilder.CreateCylinder('', { height: 4, diameter: 0.6, tessellation: 8 }, scene);
  beamLine.rotation.z = Math.PI / 4;
  beamLine.position.set(x, 2.5, z);
  const endStation = BABYLON.MeshBuilder.CreateBox('', { width: 2.5, height: 1.8, depth: 2.5 }, scene);
  endStation.position.set(x + 1.5, 0.9, z);

  return {
    shells: [column, beamLine, endStation],
    lines: [
      [new BABYLON.Vector3(x - 1.5, 0.05, z), new BABYLON.Vector3(x - 1.5, 4.0, z)],
      [new BABYLON.Vector3(x - 1.5, 3.5, z), new BABYLON.Vector3(x + 1.5, 1.5, z)],
      [new BABYLON.Vector3(x + 0.5, 0.05, z - 1.0), new BABYLON.Vector3(x + 2.5, 0.05, z - 1.0)],
      [new BABYLON.Vector3(x + 0.5, 0.05, z + 1.0), new BABYLON.Vector3(x + 2.5, 0.05, z + 1.0)],
    ],
  };
}

function buildStocker(scene: BABYLON.Scene, x: number, z: number): { shells: BABYLON.Mesh[]; lines: BABYLON.Vector3[][] } {
  const lines: BABYLON.Vector3[][] = [];
  const shelves: BABYLON.Mesh[] = [];
  for (let row = 0; row < 4; row++) {
    const shelf = BABYLON.MeshBuilder.CreateBox('', { width: 3.5, height: 0.15, depth: 6 }, scene);
    shelf.position.set(x, 0.8 + row * 0.9, z);
    shelves.push(shelf);
    lines.push([
      new BABYLON.Vector3(x - 1.5, 0.8 + row * 0.9, z - 2.5),
      new BABYLON.Vector3(x + 1.5, 0.8 + row * 0.9, z - 2.5),
    ]);
  }
  const frame = BABYLON.MeshBuilder.CreateBox('', { width: 3.8, height: 4.2, depth: 0.15 }, scene);
  frame.position.set(x, 2.1, z - 3.1);
  shelves.push(frame);
  const frameBack = BABYLON.MeshBuilder.CreateBox('', { width: 3.8, height: 4.2, depth: 0.15 }, scene);
  frameBack.position.set(x, 2.1, z + 3.1);
  shelves.push(frameBack);

  lines.push(
    [new BABYLON.Vector3(x - 1.5, 0.05, z - 2.5), new BABYLON.Vector3(x - 1.5, 4.2, z - 2.5)],
    [new BABYLON.Vector3(x + 1.5, 0.05, z - 2.5), new BABYLON.Vector3(x + 1.5, 4.2, z - 2.5)],
    [new BABYLON.Vector3(x - 1.5, 0.05, z + 2.5), new BABYLON.Vector3(x - 1.5, 4.2, z + 2.5)],
    [new BABYLON.Vector3(x + 1.5, 0.05, z + 2.5), new BABYLON.Vector3(x + 1.5, 4.2, z + 2.5)],
  );

  return { shells: shelves, lines };
}

function buildPhotoTrack(scene: BABYLON.Scene, x: number, z: number): { shells: BABYLON.Mesh[]; lines: BABYLON.Vector3[][] } {
  const body = BABYLON.MeshBuilder.CreateBox('', { width: 7, height: 1.8, depth: 2.5 }, scene);
  body.position.set(x, 0.9, z);
  const cups: BABYLON.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const cup = BABYLON.MeshBuilder.CreateCylinder('', { height: 0.6, diameter: 1.0, tessellation: 10 }, scene);
    cup.position.set(x - 2.5 + i * 2.5, 2.1, z);
    cups.push(cup);
  }

  return {
    shells: [body, ...cups],
    lines: [
      [new BABYLON.Vector3(x - 3.2, 0.05, z - 1.0), new BABYLON.Vector3(x + 3.2, 0.05, z - 1.0)],
      [new BABYLON.Vector3(x - 3.2, 0.05, z + 1.0), new BABYLON.Vector3(x + 3.2, 0.05, z + 1.0)],
      [new BABYLON.Vector3(x - 3.2, 1.8, z), new BABYLON.Vector3(x + 3.2, 1.8, z)],
      [new BABYLON.Vector3(x - 2.5, 1.8, z), new BABYLON.Vector3(x - 2.5, 2.4, z)],
      [new BABYLON.Vector3(x, 1.8, z), new BABYLON.Vector3(x, 2.4, z)],
      [new BABYLON.Vector3(x + 2.5, 1.8, z), new BABYLON.Vector3(x + 2.5, 2.4, z)],
    ],
  };
}

type BayBuilder = (scene: BABYLON.Scene, x: number, z: number) => { shells: BABYLON.Mesh[]; lines: BABYLON.Vector3[][] };

const BAY_BUILDERS: Record<string, BayBuilder> = {
  'Litho Bay': buildLithoBay,
  'Etch Bay': buildEtchBay,
  'Diffusion Bay': buildDiffusionBay,
  'Metrology': buildMetrology,
  'CMP Bay': buildCmpBay,
  'Implant': buildImplant,
  'Stocker': buildStocker,
  'Photo Track': buildPhotoTrack,
};

export function createEquipmentModel(
  scene: BABYLON.Scene,
  bayLabel: string,
  x: number,
  z: number,
  color: string,
  glow: BABYLON.GlowLayer,
): EquipmentModel {
  const builder = BAY_BUILDERS[bayLabel];
  if (!builder) {
    const fallback = BABYLON.MeshBuilder.CreateBox(`${bayLabel}-fallback`, { size: 2 }, scene);
    fallback.position.set(x, 1, z);
    const mat = createEquipmentHolographicMaterial(scene, `${bayLabel}-holo`, { baseColor: color });
    fallback.material = mat;
    return { shell: fallback, internals: [], holographicMaterial: mat };
  }

  const { shells, lines } = builder(scene, x, z);
  const shell = mergeShellMeshes(shells, scene, `${bayLabel}-shell`);
  const holoMat = createEquipmentHolographicMaterial(scene, `${bayLabel}-holo`, { baseColor: color });
  shell.material = holoMat;
  shell.isPickable = false;
  glow.addIncludedOnlyMesh(shell);

  const internals = createInternalLines(scene, bayLabel, lines, color);
  internals.forEach((line) => glow.addIncludedOnlyMesh(line));

  return { shell, internals, holographicMaterial: holoMat };
}

export { updateHolographicColor, updateHolographicTime };
