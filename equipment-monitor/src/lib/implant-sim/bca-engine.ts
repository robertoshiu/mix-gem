import type { Vec3, CollisionEvent, IonTrajectory, LayerDef, SimulationParams } from './types';
import {
  ION_DB, MATERIAL_DB, E_CUTOFF_EV, MAX_TRAJECTORY_POINTS,
  MAX_RECOIL_CASCADES, P_MAX_FACTOR,
} from './constants';
import type { MaterialData } from './constants';
import { computeCollision } from './zbl-potential';
import { computeElectronicLoss } from './stopping-power';

function vecAdd(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function vecScale(v: Vec3, s: number): Vec3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

function vecLen(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function vecNorm(v: Vec3): Vec3 {
  const l = vecLen(v);
  return l > 0 ? { x: v.x / l, y: v.y / l, z: v.z / l } : { x: 0, y: 0, z: 1 };
}

/**
 * Deflect a direction vector by scattering angle theta and random azimuthal phi.
 */
function deflect(dir: Vec3, theta: number, phi: number): Vec3 {
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  const cp = Math.cos(phi);
  const sp = Math.sin(phi);

  const d = vecNorm(dir);

  // Handle near-vertical case
  if (Math.abs(d.z) > 0.999) {
    return vecNorm({
      x: st * cp,
      y: st * sp,
      z: d.z > 0 ? ct : -ct,
    });
  }

  const denom = Math.sqrt(1 - d.z * d.z);
  return vecNorm({
    x: (st * (d.x * d.z * cp - d.y * sp)) / denom + d.x * ct,
    y: (st * (d.y * d.z * cp + d.x * sp)) / denom + d.y * ct,
    z: -st * cp * denom + d.z * ct,
  });
}

/**
 * Get the material at a given depth, given the layer stack.
 */
function getMaterialAtDepth(depthNm: number, layers: LayerDef[]): MaterialData | null {
  if (depthNm < 0) return null;
  for (const layer of layers) {
    if (depthNm >= layer.startNm && depthNm < layer.endNm) {
      return MATERIAL_DB[layer.material];
    }
  }
  return MATERIAL_DB.Si;
}

/**
 * Build layer stack from simulation params.
 */
export function buildLayers(params: SimulationParams): LayerDef[] {
  const layers: LayerDef[] = [];
  let z = 0;

  if (params.photoresistThickness > 0) {
    layers.push({ material: 'photoresist', startNm: z, endNm: z + params.photoresistThickness });
    z += params.photoresistThickness;
  }
  if (params.screenOxideThickness > 0) {
    layers.push({ material: 'SiO2', startNm: z, endNm: z + params.screenOxideThickness });
    z += params.screenOxideThickness;
  }
  layers.push({ material: 'Si', startNm: z, endNm: z + 10000 });

  return layers;
}

/**
 * Trace a single recoil cascade (limited depth).
 */
function traceRecoil(
  startPos: Vec3,
  startEnergy: number,
  material: MaterialData,
  rng: () => number,
): Vec3[] {
  const points: Vec3[] = [{ ...startPos }];
  let pos = { ...startPos };
  let E = startEnergy;

  const phi0 = rng() * 2 * Math.PI;
  const cosTheta0 = 2 * rng() - 1;
  const sinTheta0 = Math.sqrt(1 - cosTheta0 * cosTheta0);
  let dir: Vec3 = { x: sinTheta0 * Math.cos(phi0), y: sinTheta0 * Math.sin(phi0), z: cosTheta0 };

  let steps = 0;
  while (E > E_CUTOFF_EV && steps < 20) {
    steps++;
    const meanFree = 1 / (material.density * Math.PI * 0.01);
    const flightDist = meanFree * (-Math.log(Math.max(rng(), 1e-10)));
    const eLoss = computeElectronicLoss(E, flightDist, material.Z, material.M, material);
    E -= eLoss;
    if (E <= E_CUTOFF_EV) break;

    pos = vecAdd(pos, vecScale(dir, flightDist));
    points.push({ ...pos });

    const p = Math.sqrt(rng()) * 0.05;
    const { theta, T_eV } = computeCollision(E, p, material.Z, material.M, material.Z, material.M);
    E -= T_eV;
    const azimuth = rng() * 2 * Math.PI;
    dir = deflect(dir, theta, azimuth);
  }

  return points;
}

/**
 * Compute initial beam direction from tilt and twist angles.
 */
function beamDirection(tiltDeg: number, twistDeg: number): Vec3 {
  const tilt = (tiltDeg * Math.PI) / 180;
  const twist = (twistDeg * Math.PI) / 180;
  return vecNorm({
    x: Math.sin(tilt) * Math.cos(twist),
    y: Math.sin(tilt) * Math.sin(twist),
    z: Math.cos(tilt),
  });
}

/**
 * Trace a single ion through the target.
 */
export function traceIon(
  params: SimulationParams,
  layers: LayerDef[],
  damageState: number[],
  depthBinSize: number,
  maxDepthNm: number,
  rng: () => number,
): IonTrajectory {
  const ion = ION_DB[params.ionSpecies];
  const Z1 = ion.Z;
  const M1 = ion.M;

  // BF2: energy partition
  let E = params.beamEnergy * 1000;
  if (params.ionSpecies === 'BF2' && ion.molecularMass) {
    E = E * (ion.M / ion.molecularMass);
  }

  let dir = beamDirection(params.tiltAngle, params.twistAngle);
  let pos: Vec3 = {
    x: (rng() - 0.5) * 2,
    y: (rng() - 0.5) * 2,
    z: 0,
  };

  const points: Vec3[] = [{ ...pos }];
  const energyAtPoints: number[] = [E];
  const collisions: CollisionEvent[] = [];
  const recoilCascades: Vec3[][] = [];
  let channeled = false;
  let backscattered = false;
  let steps = 0;

  while (E > E_CUTOFF_EV && steps < MAX_TRAJECTORY_POINTS) {
    steps++;

    const material = getMaterialAtDepth(pos.z, layers);
    if (!material) {
      backscattered = true;
      break;
    }

    const pMax = P_MAX_FACTOR / Math.cbrt(material.density);
    const meanFree = 1 / (material.density * Math.PI * pMax * pMax);
    const flightDist = meanFree * (-Math.log(Math.max(rng(), 1e-10)));

    // Check channeling
    const depthBin = Math.min(Math.floor(pos.z / depthBinSize), damageState.length - 1);
    const isAmorphous = depthBin >= 0 && depthBin < damageState.length &&
      damageState[depthBin] >= params.amorphizationThreshold * 1e21 / (1e21);

    const inChannel = material.crystalline && !isAmorphous &&
      params.tiltAngle < 5 && Math.acos(Math.abs(dir.z)) < 0.1 &&
      rng() < 0.6;

    if (inChannel) {
      channeled = true;
      const chanFlight = flightDist * 3;
      const eLoss = computeElectronicLoss(E, chanFlight, Z1, M1, material);
      E -= eLoss;
      pos = vecAdd(pos, vecScale(dir, chanFlight));

      const debyeTemp = 645;
      const tempK = params.substrateTemperature + 273.15;
      const thermalDechannel = 0.02 * (tempK / debyeTemp);
      const defectDechannel = isAmorphous ? 1.0 : (depthBin >= 0 ? damageState[depthBin] * 0.1 : 0);

      if (rng() < thermalDechannel + defectDechannel) {
        dir = deflect(dir, 0.05 * rng(), rng() * 2 * Math.PI);
      }
    } else {
      const eLoss = computeElectronicLoss(E, flightDist, Z1, M1, material);
      E -= eLoss;
      if (E <= E_CUTOFF_EV) break;

      pos = vecAdd(pos, vecScale(dir, flightDist));

      const p = Math.sqrt(rng()) * pMax;

      const { theta, T_eV } = computeCollision(E, p, Z1, material.Z, M1, material.M);
      E -= T_eV;

      const isDisplacement = T_eV > material.Ed;
      const recoilCreated = isDisplacement && T_eV > 2 * material.Ed;

      collisions.push({
        position: { ...pos },
        energyTransfer: T_eV,
        isDisplacement,
        recoilCreated,
      });

      const azimuth = rng() * 2 * Math.PI;
      dir = deflect(dir, theta, azimuth);

      if (recoilCreated && recoilCascades.length < MAX_RECOIL_CASCADES) {
        recoilCascades.push(traceRecoil(pos, T_eV - material.Ed, material, rng));
      }
    }

    if (pos.z < -5) {
      backscattered = true;
      break;
    }

    if (pos.z > maxDepthNm * 1.5) break;

    points.push({ ...pos });
    energyAtPoints.push(Math.max(0, E));
  }

  const finalPosition = { ...pos };
  if (!backscattered) {
    points.push(finalPosition);
    energyAtPoints.push(Math.max(0, E));
  }

  return {
    points,
    collisions,
    finalPosition,
    recoilCascades,
    channeled,
    backscattered,
    energyAtPoints,
  };
}
