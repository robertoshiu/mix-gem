import type { SpcCapabilityResult } from './mes-types';

/** d2 constant for subgroup size 5 (from statistical tables) */
const D2_N5 = 2.326;
const DEFAULT_SUBGROUP_SIZE = 5;
const CAPABILITY_CAP = 999;
const Cpk_CAPABLE_THRESHOLD = 1.33;
const Cpk_MARGINAL_THRESHOLD = 1.0;

/**
 * Compute Cpk and Ppk process capability indices.
 *
 * Cpk uses within-subgroup sigma estimated via R̄/d2 (short-term capability).
 * Ppk uses overall sample standard deviation (long-term performance).
 *
 * @param values - Measurement values
 * @param _target - Nominal target (unused in computation, kept for API consistency)
 * @param usl - Upper specification limit
 * @param lsl - Lower specification limit
 * @param subgroupSize - Subgroup size for Cpk range method (default 5)
 * @returns Capability result or null if insufficient data
 */
export function calculateCapability(
  values: number[],
  _target: number,
  usl: number,
  lsl: number,
  subgroupSize: number = DEFAULT_SUBGROUP_SIZE,
): SpcCapabilityResult | null {
  const n = values.length;
  if (n < subgroupSize) return null;

  const mean = values.reduce((s, v) => s + v, 0) / n;

  // ── Cpk via within-subgroup sigma (R̄ / d2) ──
  const withinResult = computeWithinSigma(values, subgroupSize);
  const { cp, cpk, cpl, cpu } = computeCpCpk(mean, withinResult, usl, lsl);

  // ── Ppk via overall sample standard deviation ──
  const overallResult = computeOverallSigma(values, mean);
  const { pp, ppk } = computePpPpk(mean, overallResult, usl, lsl);

  // ── Status based on Cpk ──
  let status: SpcCapabilityResult['status'];
  if (cpk >= Cpk_CAPABLE_THRESHOLD) {
    status = 'capable';
  } else if (cpk >= Cpk_MARGINAL_THRESHOLD) {
    status = 'marginal';
  } else {
    status = 'incapable';
  }

  return { cp, cpk, cpl, cpu, pp, ppk, status, sampleSize: n };
}

/** Compute within-subgroup sigma using range method (R̄ / d2). */
function computeWithinSigma(values: number[], subgroupSize: number): number {
  const fullSubgroups = Math.floor(values.length / subgroupSize);
  let sumR = 0;

  for (let g = 0; g < fullSubgroups; g++) {
    const start = g * subgroupSize;
    const end = start + subgroupSize;
    let min = values[start];
    let max = values[start];
    for (let i = start + 1; i < end; i++) {
      if (values[i] < min) min = values[i];
      if (values[i] > max) max = values[i];
    }
    sumR += max - min;
  }

  if (fullSubgroups === 0 || sumR === 0) return 0;
  return sumR / fullSubgroups / D2_N5;
}

/** Compute overall (sample) standard deviation of all values. */
function computeOverallSigma(values: number[], mean: number): number {
  const n = values.length;
  if (n < 2) return 0;
  const sumSq = values.reduce((s, v) => s + (v - mean) ** 2, 0);
  return Math.sqrt(sumSq / (n - 1));
}

/** Compute Cp, Cpk, CPL, CPU from within-subgroup sigma. */
function computeCpCpk(
  mean: number,
  withinSigma: number,
  usl: number,
  lsl: number,
): { cp: number; cpk: number; cpl: number; cpu: number } {
  if (withinSigma === 0) {
    return { cp: CAPABILITY_CAP, cpk: CAPABILITY_CAP, cpl: CAPABILITY_CAP, cpu: CAPABILITY_CAP };
  }

  const denom = 3 * withinSigma;
  const specSpan = usl - lsl;
  const cp = specSpan / (6 * withinSigma);
  const cpl = (mean - lsl) / denom;
  const cpu = (usl - mean) / denom;
  const cpk = Math.min(cpl, cpu);

  return { cp, cpk, cpl, cpu };
}

/** Compute Pp and Ppk from overall standard deviation. */
function computePpPpk(
  mean: number,
  overallSigma: number,
  usl: number,
  lsl: number,
): { pp: number; ppk: number } {
  if (overallSigma === 0) {
    return { pp: CAPABILITY_CAP, ppk: CAPABILITY_CAP };
  }

  const denom = 3 * overallSigma;
  const specSpan = usl - lsl;
  const pp = specSpan / (6 * overallSigma);
  const ppl = (mean - lsl) / denom;
  const ppu = (usl - mean) / denom;
  const ppk = Math.min(ppl, ppu);

  return { pp, ppk };
}
