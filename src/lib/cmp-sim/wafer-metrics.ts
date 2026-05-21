import type { SimulationParams, ProcessPhase } from './types';
import {
  DIE_MASK, DIE_GRID_COLS, DIE_GRID_ROWS, ACTIVE_DIE_COUNT,
  PHASE_CHEMISTRY, RADIAL_NODES, PAD_GROOVE_POSITIONS,
} from './constants';
import { computeReynoldsFlow } from './reynolds-flow';
import { computeContactState } from './contact-model';
import { computePrestonRemoval } from './preston-removal';
import { computeSlurryChemistry } from './slurry-chemistry';
import { computeThermalState } from './thermal-model';

export interface StepMetrics {
  filmThickness: number[];
  fluidPressure: number[];
  realContactArea: number;
  padCreepStrain: number;
  contactPressure: number[];
  removalRate: number;
  cuRemaining: number;
  barrierRemaining: number;
  removalRateMap: number[];
  wiwnuMap: number[];
  dishingMap: number[];
  erosionMap: number[];
  roughnessMap: number[];
  thicknessMap: number[];
  wiwnu: number;
  dieCount: number;
  dieGridCols: number;
  dieGridRows: number;
}

/**
 * Calibration scale bridging the simplified GW contact model
 * (which under-predicts contact pressure by ~1e6 due to the
 * Preston model's MPa-to-dyne shortcut) to realistic Cu CMP
 * removal rates of 100-800 nm/min.
 */
const CALIBRATION_SCALE = 400;

/**
 * Build a normalized radial non-uniformity profile for die mapping.
 *
 * The raw Preston profile has artefacts (r=0 singularity, groove zeros,
 * ~10x edge/center ratio) that don't appear in real CMP die-level data
 * because the wafer oscillates and a retaining ring equalises edge rates.
 *
 * Strategy:
 *  1. Interpolate across groove nodes and the r=0 node.
 *  2. Normalize so the mean of valid nodes is 1.0.
 *  3. Compress to a small variation band: factor = 1 + (norm - 1) * damping.
 *     With damping = 0.05 a raw 2x edge rate becomes only 5% higher,
 *     matching typical <5% WIWNU on a well-tuned CMP tool.
 */
const RADIAL_DAMPING = 0.05;

function buildNormalizedProfile(profile: number[]): number[] {
  const n = profile.length;
  const gapSet = new Set(
    PAD_GROOVE_POSITIONS.map((g) => Math.round(g * (n - 1))),
  );
  gapSet.add(0); // center singularity

  // Step 1: interpolate gaps
  const filled = [...profile];
  for (const gi of gapSet) {
    let lo = gi - 1;
    while (lo >= 0 && gapSet.has(lo)) lo--;
    let hi = gi + 1;
    while (hi < n && gapSet.has(hi)) hi++;

    const vLo = lo >= 0 ? profile[lo] : (hi < n ? profile[hi] : 0);
    const vHi = hi < n  ? profile[hi] : (lo >= 0 ? profile[lo] : 0);

    if (lo < 0 && hi < n) {
      filled[gi] = vHi;
    } else if (hi >= n && lo >= 0) {
      filled[gi] = vLo;
    } else if (lo >= 0 && hi < n) {
      const t = (gi - lo) / (hi - lo);
      filled[gi] = vLo + t * (vHi - vLo);
    }
  }

  // Step 2: compute mean of filled profile
  const sum = filled.reduce((s, v) => s + v, 0);
  const mean = sum / n;
  if (mean <= 0) return new Array(n).fill(1);

  // Step 3: normalize and damp to small variation
  return filled.map((v) => {
    const norm = v / mean;
    return 1 + (norm - 1) * RADIAL_DAMPING;
  });
}

export function computeStepMetrics(
  params: SimulationParams,
  stepIndex: number,
  phase: ProcessPhase,
  prevCreepStrain: number,
  prevCuRemaining: number,
  prevBarrierRemaining: number,
): StepMetrics {
  const dt = 0.5;
  const timeSeconds = stepIndex * dt;
  const phaseChem = PHASE_CHEMISTRY[phase];

  const thermal = computeThermalState(params, timeSeconds);
  const reynolds = computeReynoldsFlow(params);
  const contact = computeContactState(
    params, reynolds.filmThickness, prevCreepStrain, timeSeconds
  );
  const chemistry = computeSlurryChemistry(params, thermal.temperature);
  const preston = computePrestonRemoval(
    params, contact.contactPressure, reynolds.fluidPressure, phaseChem.kp
  );

  const effectiveRate = preston.meanRemovalRate * phaseChem.pressureFactor * thermal.arrheniusFactor * CALIBRATION_SCALE;

  const removed = effectiveRate * (dt / 60);
  let cuRemaining = prevCuRemaining;
  let barrierRemaining = prevBarrierRemaining;

  if (phase === 'bulk-cu' || phase === 'ramp-up') {
    cuRemaining = Math.max(0, prevCuRemaining - removed);
  } else if (phase === 'barrier') {
    barrierRemaining = Math.max(0, prevBarrierRemaining - removed * 0.2);
  }

  const totalDies = DIE_GRID_COLS * DIE_GRID_ROWS;
  const removalRateMap = new Array(totalDies).fill(0);
  const wiwnuMap = new Array(totalDies).fill(0);
  const dishingMap = new Array(totalDies).fill(0);
  const erosionMap = new Array(totalDies).fill(0);
  const roughnessMap = new Array(totalDies).fill(0);
  const thicknessMap = new Array(totalDies).fill(0);

  const centerCol = (DIE_GRID_COLS - 1) / 2;
  const centerRow = (DIE_GRID_ROWS - 1) / 2;
  const maxR = Math.sqrt(centerCol ** 2 + centerRow ** 2);
  const density = params.patternDensity / 100;

  // Build a normalized radial profile (mean = 1, small variation)
  // that captures the shape of non-uniformity without raw-model artefacts
  const radialFactor = buildNormalizedProfile(preston.removalRateProfile);

  for (let i = 0; i < totalDies; i++) {
    if (!DIE_MASK[i]) continue;
    const col = i % DIE_GRID_COLS;
    const row = Math.floor(i / DIE_GRID_COLS);
    const r = Math.sqrt((col - centerCol) ** 2 + (row - centerRow) ** 2);
    const rNorm = r / maxR;

    const nodeIdx = Math.min(RADIAL_NODES - 1, Math.round(rNorm * (RADIAL_NODES - 1)));

    // Die rate = effective rate * radial factor * slurry concentration factor
    const abrasiveFactor = chemistry.abrasiveProfile[nodeIdx] / Math.max(1, params.abrasiveConc);
    removalRateMap[i] = effectiveRate * radialFactor[nodeIdx] * abrasiveFactor;
    wiwnuMap[i] = removalRateMap[i];

    if (phase === 'bulk-cu' || phase === 'ramp-up') {
      dishingMap[i] = preston.dishingFactor * removalRateMap[i] * 0.01 * (1 + rNorm * 0.2);
    }

    if (phase === 'barrier') {
      erosionMap[i] = preston.erosionFactor * removalRateMap[i] * 0.005 * (1 + density);
    }

    const baseRoughness = contact.realContactArea * 50 + 0.5;
    roughnessMap[i] = phase === 'buff' ? baseRoughness * 0.3 : baseRoughness * (1 + rNorm * 0.1);

    thicknessMap[i] = cuRemaining + barrierRemaining;
  }

  const activeRates = removalRateMap.filter((_, i) => DIE_MASK[i]);
  const mean = activeRates.length > 0 ? activeRates.reduce((s, v) => s + v, 0) / activeRates.length : 0;
  const variance = activeRates.length > 0 ? activeRates.reduce((s, v) => s + (v - mean) ** 2, 0) / activeRates.length : 0;
  const wiwnu = mean > 0 ? (Math.sqrt(variance) / mean) * 100 : 0;

  return {
    filmThickness: reynolds.filmThickness,
    fluidPressure: reynolds.fluidPressure,
    realContactArea: contact.realContactArea,
    padCreepStrain: contact.padCreepStrain,
    contactPressure: contact.contactPressure,
    removalRate: effectiveRate,
    cuRemaining,
    barrierRemaining,
    removalRateMap,
    wiwnuMap,
    dishingMap,
    erosionMap,
    roughnessMap,
    thicknessMap,
    wiwnu,
    dieCount: ACTIVE_DIE_COUNT,
    dieGridCols: DIE_GRID_COLS,
    dieGridRows: DIE_GRID_ROWS,
  };
}
