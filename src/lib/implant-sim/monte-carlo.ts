import type { IonTrajectory, SimulationParams, LayerDef } from './types';
import {
  DEPTH_BINS, DEFAULT_ION_COUNT, estimateMaxDepth, mulberry32,
} from './constants';
import { traceIon, buildLayers } from './bca-engine';
import { createDamageState, recordDamage, applyAnnealing, peakDamage } from './damage-model';
import type { DamageState } from './damage-model';

export interface ProfileStatistics {
  projectedRange: number;
  straggle: number;
  junctionDepth: number;
  peakConcentration: number;
  channelingTailDepth: number;
  damagePeakDensity: number;
  lateralStraggle: number;
  retainedDoseFraction: number;
}

export interface EnsembleState {
  params: SimulationParams;
  layers: LayerDef[];
  maxDepthNm: number;
  binSize: number;
  totalIons: number;
  depthCounts: number[];
  lateralSqSum: number[];
  lateralCounts: number[];
  damage: DamageState;
  depthSum: number;
  depthSqSum: number;
  ionCount: number;
  backscatterCount: number;
  channeledCount: number;
  seed: number;
  rng: () => number;
}

export function createEnsemble(params: SimulationParams): EnsembleState {
  const maxDepthNm = estimateMaxDepth(params.ionSpecies, params.beamEnergy);
  const binSize = maxDepthNm / DEPTH_BINS;
  const totalIons = DEFAULT_ION_COUNT;
  const seed = Math.floor(params.beamEnergy * 1000 + params.tiltAngle * 100 + params.dose);
  const rng = mulberry32(seed);

  return {
    params,
    layers: buildLayers(params),
    maxDepthNm,
    binSize,
    totalIons,
    depthCounts: new Array(DEPTH_BINS).fill(0),
    lateralSqSum: new Array(DEPTH_BINS).fill(0),
    lateralCounts: new Array(DEPTH_BINS).fill(0),
    damage: createDamageState(DEPTH_BINS),
    depthSum: 0,
    depthSqSum: 0,
    ionCount: 0,
    backscatterCount: 0,
    channeledCount: 0,
    seed,
    rng,
  };
}

export function simulateBatch(
  ensemble: EnsembleState,
  batchSize: number,
): IonTrajectory[] {
  const trajectories: IonTrajectory[] = [];

  for (let i = 0; i < batchSize; i++) {
    const traj = traceIon(
      ensemble.params,
      ensemble.layers,
      ensemble.damage.vacancies,
      ensemble.binSize,
      ensemble.maxDepthNm,
      ensemble.rng,
    );

    trajectories.push(traj);

    if (traj.backscattered) {
      ensemble.backscatterCount++;
    } else {
      const z = traj.finalPosition.z;
      const bin = Math.min(DEPTH_BINS - 1, Math.max(0, Math.floor(z / ensemble.binSize)));
      ensemble.depthCounts[bin]++;
      ensemble.depthSum += z;
      ensemble.depthSqSum += z * z;

      const lateralSq = traj.finalPosition.x ** 2 + traj.finalPosition.y ** 2;
      ensemble.lateralSqSum[bin] += lateralSq;
      ensemble.lateralCounts[bin]++;
    }

    if (traj.channeled) {
      ensemble.channeledCount++;
    }

    for (const coll of traj.collisions) {
      if (coll.isDisplacement) {
        recordDamage(
          ensemble.damage,
          coll.position.z,
          ensemble.binSize,
          1,
          ensemble.params.amorphizationThreshold,
        );
      }
    }

    ensemble.ionCount++;
  }

  applyAnnealing(
    ensemble.damage,
    ensemble.params.substrateTemperature,
    ensemble.params.damageAnnealingRate,
  );

  return trajectories;
}

export function computeStatistics(ensemble: EnsembleState): ProfileStatistics {
  const retained = ensemble.ionCount - ensemble.backscatterCount;

  if (retained === 0) {
    return {
      projectedRange: 0, straggle: 0, junctionDepth: 0,
      peakConcentration: 0, channelingTailDepth: 0,
      damagePeakDensity: 0, lateralStraggle: 0, retainedDoseFraction: 0,
    };
  }

  const Rp = ensemble.depthSum / retained;
  const variance = ensemble.depthSqSum / retained - Rp * Rp;
  const dRp = Math.sqrt(Math.max(0, variance));

  const maxCount = Math.max(...ensemble.depthCounts);
  const peakConcentration = maxCount / retained;

  const junctionThreshold = maxCount * 0.001;
  let junctionDepth = 0;
  for (let i = DEPTH_BINS - 1; i >= 0; i--) {
    if (ensemble.depthCounts[i] > junctionThreshold) {
      junctionDepth = (i + 1) * ensemble.binSize;
      break;
    }
  }

  let channelingTailDepth = 0;
  const tailStart = Math.floor((2 * Rp) / ensemble.binSize);
  for (let i = DEPTH_BINS - 1; i >= tailStart; i--) {
    if (ensemble.depthCounts[i] > 0) {
      channelingTailDepth = (i + 1) * ensemble.binSize;
      break;
    }
  }

  const { peakValue: damagePeakDensity } = peakDamage(ensemble.damage);

  let totalLateralSq = 0;
  let totalLateralCount = 0;
  for (let i = 0; i < DEPTH_BINS; i++) {
    totalLateralSq += ensemble.lateralSqSum[i];
    totalLateralCount += ensemble.lateralCounts[i];
  }
  const lateralStraggle = totalLateralCount > 0
    ? Math.sqrt(totalLateralSq / totalLateralCount)
    : 0;

  const retainedDoseFraction = ensemble.ionCount > 0
    ? retained / ensemble.ionCount
    : 1;

  return {
    projectedRange: Rp,
    straggle: dRp,
    junctionDepth,
    peakConcentration,
    channelingTailDepth,
    damagePeakDensity,
    lateralStraggle,
    retainedDoseFraction,
  };
}

export function getDepthProfile(ensemble: EnsembleState): number[] {
  const retained = ensemble.ionCount - ensemble.backscatterCount;
  if (retained === 0) return new Array(DEPTH_BINS).fill(0);
  return ensemble.depthCounts.map(c => c / retained);
}

export function getLateralProfile(ensemble: EnsembleState): number[] {
  return ensemble.lateralSqSum.map((sq, i) => {
    const n = ensemble.lateralCounts[i];
    return n > 0 ? Math.sqrt(sq / n) : 0;
  });
}
