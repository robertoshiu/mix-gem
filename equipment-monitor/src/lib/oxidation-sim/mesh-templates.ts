import type { FEAMesh, FEANode, FEAElement, GeometryType, SimulationParams, MaterialType } from './types';
import { T_AMBIENT, WAFER_RADIUS_MM } from './constants';

/** Generate cosine-spaced array of radial positions (0 to WAFER_RADIUS_MM) */
function cosineRadial(n: number): number[] {
  const positions: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    positions.push(WAFER_RADIUS_MM * (1 - Math.cos(t * Math.PI / 2)));
  }
  return positions;
}

/** Generate geometric-spaced depth positions (finer near surface) */
function geometricDepth(n: number, maxDepthNm: number): number[] {
  const positions: number[] = [];
  const ratio = 1.15;
  let total = 0;
  const increments: number[] = [];
  let inc = 1;
  for (let i = 0; i < n; i++) {
    increments.push(inc);
    total += inc;
    inc *= ratio;
  }
  let cumulative = 0;
  for (let i = 0; i < n; i++) {
    positions.push((cumulative / total) * maxDepthNm);
    cumulative += increments[i];
  }
  return positions;
}

function createNodes(
  rPositions: number[],
  zPositions: number[],
  materialFn: (r: number, z: number) => MaterialType,
): FEANode[] {
  const nodes: FEANode[] = [];
  for (let iz = 0; iz < zPositions.length; iz++) {
    for (let ir = 0; ir < rPositions.length; ir++) {
      nodes.push({
        r: rPositions[ir],
        z: zPositions[iz],
        material: materialFn(rPositions[ir], zPositions[iz]),
        T: T_AMBIENT,
        stress: 0,
        oxideThickness: 0,
      });
    }
  }
  return nodes;
}

function createQuadElements(nr: number, nz: number): FEAElement[] {
  const elements: FEAElement[] = [];
  for (let iz = 0; iz < nz - 1; iz++) {
    for (let ir = 0; ir < nr - 1; ir++) {
      const bl = iz * nr + ir;
      const br = bl + 1;
      const tl = (iz + 1) * nr + ir;
      const tr = tl + 1;
      elements.push({ nodes: [bl, br, tr, tl] });
    }
  }
  return elements;
}

function blanketMesh(params: SimulationParams): FEAMesh {
  const nr = 20;
  const nz = 20;
  const maxDepth = 2000; // 2um
  const rPositions = cosineRadial(nr);
  const zPositions = geometricDepth(nz, maxDepth);
  const initOx = params.initialOxideThickness;

  const nodes = createNodes(rPositions, zPositions, (_r, z) => {
    if (initOx > 0 && z < initOx) return 'SiO2';
    return 'Si';
  });

  return { nodes, elements: createQuadElements(nr, nz), nr, nz };
}

function locosMesh(params: SimulationParams): FEAMesh {
  const nr = 25;
  const nz = 20;
  const maxDepth = 2000;
  const rPositions = cosineRadial(nr);
  const zPositions = geometricDepth(nz, maxDepth);
  const maskW = params.nitrideMaskWidth;
  const nitrideThickness = 150; // nm

  const nodes = createNodes(rPositions, zPositions, (r, z) => {
    // Si3N4 pad: within maskW from center, above nitrideThickness
    const rNm = r * 1e6; // mm to nm
    if (rNm < maskW && z < nitrideThickness) return 'Si3N4';
    if (params.initialOxideThickness > 0 && z < params.initialOxideThickness) return 'SiO2';
    return 'Si';
  });

  return { nodes, elements: createQuadElements(nr, nz), nr, nz };
}

function stiMesh(params: SimulationParams): FEAMesh {
  const nr = 25;
  const nz = 25;
  const maxDepth = 2000 + params.trenchDepth * 2;
  const rPositions = cosineRadial(nr);
  const zPositions = geometricDepth(nz, maxDepth);
  const maskW = params.nitrideMaskWidth;
  const tDepth = params.trenchDepth;
  const tWidth = params.trenchWidth;
  const nitrideThickness = 150;

  const nodes = createNodes(rPositions, zPositions, (r, z) => {
    const rNm = r * 1e6;
    // Si3N4 hardmask on top
    if (rNm < maskW && z < nitrideThickness) return 'Si3N4';
    // Trench region: between maskW and maskW+tWidth, above tDepth
    if (rNm >= maskW && rNm < maskW + tWidth && z < tDepth) return 'SiO2';
    if (params.initialOxideThickness > 0 && z < params.initialOxideThickness) return 'SiO2';
    return 'Si';
  });

  return { nodes, elements: createQuadElements(nr, nz), nr, nz };
}

export function createMesh(geometry: GeometryType, params: SimulationParams): FEAMesh {
  switch (geometry) {
    case 'locos': return locosMesh(params);
    case 'sti': return stiMesh(params);
    default: return blanketMesh(params);
  }
}
