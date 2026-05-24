import { calculateCapability } from './spc-capability';
import { SPC_PARAMETERS } from './spc-parameters';

const { target, ucl, lcl } = SPC_PARAMETERS.cd; // target=45, ucl=48, lcl=42
const usl = ucl; // 48
const lslTarget = lcl; // 42

function repeat<T>(arr: T[], times: number): T[] {
  return Array.from({ length: times }, () => arr).flat();
}

describe('calculateCapability — Cpk within-subgroup sigma (R̄/d2 method)', () => {
  it('computes cp, cpk, cpl, cpu from subgroup ranges', () => {
    // 5 subgroups of [44.0, 44.5, 45.0, 45.5, 46.0] → each R = 2.0
    // R̄ = 2.0, within_sigma = 2.0 / 2.326 ≈ 0.8598
    // Cp = 6 / (6 * 0.8598) ≈ 1.163
    const values = repeat([44.0, 44.5, 45.0, 45.5, 46.0], 5);
    const result = calculateCapability(values, target, usl, lslTarget);

    expect(result).not.toBeNull();
    expect(result!.cp).toBeCloseTo(1.163, 1);
    expect(result!.cpl).toBeCloseTo(1.163, 1);
    expect(result!.cpu).toBeCloseTo(1.163, 1);
    expect(result!.cpk).toBeCloseTo(1.163, 1);
    expect(result!.sampleSize).toBe(25);
  });

  it('computes Cpk < Cp when mean is off-center within spec', () => {
    // Mean shifted toward USL: subgroups centered at 46.5 instead of 45
    // Subgroup: [45.5, 46.0, 46.5, 47.0, 47.5] → R = 2.0, mean = 46.5
    // R̄ = 2.0, within_sigma = 2.0 / 2.326 ≈ 0.8598
    // Cp = same ≈ 1.163
    // CPL = (46.5 - 42) / (3 * 0.8598) ≈ 1.744
    // CPU = (48 - 46.5) / (3 * 0.8598) ≈ 0.581
    // Cpk = min(1.744, 0.581) = 0.581 < Cp
    const values = repeat([45.5, 46.0, 46.5, 47.0, 47.5], 5);
    const result = calculateCapability(values, target, usl, lslTarget);

    expect(result).not.toBeNull();
    expect(result!.cp).toBeCloseTo(1.163, 1);
    expect(result!.cpk).toBeCloseTo(0.581, 1);
    expect(result!.cpk).toBeLessThan(result!.cp);
  });

  it('handles 1 subgroup (5 values minimum)', () => {
    const values = [44.0, 44.5, 45.0, 45.5, 46.0];
    const result = calculateCapability(values, target, usl, lslTarget);

    expect(result).not.toBeNull();
    expect(result!.sampleSize).toBe(5);
    expect(result!.cpk).toBeGreaterThan(0);
  });

  it('returns null for fewer than subgroupSize values', () => {
    const values = [44.0, 45.0, 44.5, 45.5]; // 4 values < 5
    const result = calculateCapability(values, target, usl, lslTarget);
    expect(result).toBeNull();
  });
});

describe('calculateCapability — Ppk overall sigma (std dev of all values)', () => {
  it('computes pp and ppk from overall standard deviation', () => {
    // Same data as marginal test: [44.0, 44.5, 45.0, 45.5, 46.0] × 5
    // Sample std dev:
    //   deviations: -1, -0.5, 0, 0.5, 1
    //   sum squares = (1 + 0.25 + 0 + 0.25 + 1) × 5 = 2.5 × 5 = 12.5
    //   variance (n-1) = 12.5 / 24 = 0.5208, σ = 0.7217
    // Pp = 6 / (6 * 0.7217) ≈ 1.386
    const values = repeat([44.0, 44.5, 45.0, 45.5, 46.0], 5);
    const result = calculateCapability(values, target, usl, lslTarget);

    expect(result).not.toBeNull();
    expect(result!.pp).toBeCloseTo(1.386, 1);
    expect(result!.ppk).toBeCloseTo(1.386, 1);
  });

  it('shows Cpk ≠ Ppk when within-subgroup variation differs from overall', () => {
    // 3 subgroups, each tight (R = 0.1) but centered at different levels:
    //   G1: [43.0, 43.1, 43.0, 43.1, 43.0] — center ~43.04
    //   G2: [45.0, 45.1, 45.0, 45.1, 45.0] — center ~45.04
    //   G3: [47.0, 47.1, 47.0, 47.1, 47.0] — center ~47.04
    // R̄ = 0.1 → within_sigma ≈ 0.043 → very high Cp/Cpk
    // Overall σ ≈ 1.69 → much lower Pp/Ppk
    const values = [
      43.0, 43.1, 43.0, 43.1, 43.0,
      45.0, 45.1, 45.0, 45.1, 45.0,
      47.0, 47.1, 47.0, 47.1, 47.0,
    ];
    const result = calculateCapability(values, target, usl, lslTarget);

    expect(result).not.toBeNull();
    expect(result!.cpk).toBeGreaterThan(10); // very capable within-subgroup
    expect(result!.ppk).toBeLessThan(2);     // much worse overall
    expect(result!.cpk).not.toBeCloseTo(result!.ppk, 0);
  });
});

describe('calculateCapability — status determination', () => {
  it('returns capable when Cpk ≥ 1.33', () => {
    // Tight process: [44.3, 44.7, 45.0, 45.3, 45.7] × 5
    // R = 1.4, within_sigma ≈ 0.602, Cpk ≈ 1.66
    const values = repeat([44.3, 44.7, 45.0, 45.3, 45.7], 5);
    const result = calculateCapability(values, target, usl, lslTarget);

    expect(result).not.toBeNull();
    expect(result!.cpk).toBeGreaterThan(1.33);
    expect(result!.status).toBe('capable');
  });

  it('returns marginal when 1.0 ≤ Cpk < 1.33', () => {
    // Marginal spread: [44.0, 44.5, 45.0, 45.5, 46.0] × 5
    // Cpk ≈ 1.16
    const values = repeat([44.0, 44.5, 45.0, 45.5, 46.0], 5);
    const result = calculateCapability(values, target, usl, lslTarget);

    expect(result).not.toBeNull();
    expect(result!.cpk).toBeGreaterThan(1.0);
    expect(result!.cpk).toBeLessThan(1.33);
    expect(result!.status).toBe('marginal');
  });

  it('returns incapable when Cpk < 1.0', () => {
    // Very wide: [40.0, 42.5, 45.0, 47.5, 50.0] × 5
    // R = 10.0, within_sigma ≈ 4.30, Cpk ≈ 0.23
    const values = repeat([40.0, 42.5, 45.0, 47.5, 50.0], 5);
    const result = calculateCapability(values, target, usl, lslTarget);

    expect(result).not.toBeNull();
    expect(result!.cpk).toBeGreaterThan(0);
    expect(result!.cpk).toBeLessThan(1.0);
    expect(result!.status).toBe('incapable');
  });
});

describe('calculateCapability — edge cases', () => {
  it('handles negative Cpk when mean exceeds USL', () => {
    // All values above USL: [48.0, 48.2, 48.4, 48.6, 48.8] × 5
    // mean = 48.4 > USL(48)
    // CPU = (48 - 48.4) / (3 * within_sigma) → negative
    const values = repeat([48.0, 48.2, 48.4, 48.6, 48.8], 5);
    const result = calculateCapability(values, target, usl, lslTarget);

    expect(result).not.toBeNull();
    expect(result!.cpk).toBeLessThan(0);
    expect(result!.cpu).toBeLessThan(0); // CPU negative
    expect(result!.cpl).toBeGreaterThan(0); // CPL still positive
    expect(result!.status).toBe('incapable');
  });

  it('handles negative Cpk when mean is below LSL', () => {
    // All values below LSL: [41.0, 41.3, 41.6, 41.9, 42.2] × 5
    // mean = 41.6 < LSL(42)
    const values = repeat([41.0, 41.3, 41.6, 41.9, 42.2], 5);
    const result = calculateCapability(values, target, usl, lslTarget);

    expect(result).not.toBeNull();
    expect(result!.cpk).toBeLessThan(0);
    expect(result!.cpl).toBeLessThan(0); // CPL negative
    expect(result!.cpu).toBeGreaterThan(0); // CPU still positive
    expect(result!.status).toBe('incapable');
  });

  it('caps at 999 when all subgroups have zero range', () => {
    // All values identical → R = 0 → within_sigma = 0 → would be Infinite
    const values = Array(5).fill(45.0);
    const result = calculateCapability(values, target, usl, lslTarget);

    expect(result).not.toBeNull();
    expect(result!.cp).toBe(999);
    expect(result!.cpk).toBe(999);
    expect(result!.cpl).toBe(999);
    expect(result!.cpu).toBe(999);
    expect(result!.status).toBe('capable');
  });

  it('caps at 999 when overall sigma is zero', () => {
    // Same as above — overall sigma = 0
    const values = Array(5).fill(45.0);
    const result = calculateCapability(values, target, usl, lslTarget);

    expect(result).not.toBeNull();
    expect(result!.pp).toBe(999);
    expect(result!.ppk).toBe(999);
  });

  it('returns null for empty array', () => {
    expect(calculateCapability([], target, usl, lslTarget)).toBeNull();
  });

  it('discards incomplete trailing subgroup and uses complete subgroups only', () => {
    // 13 values = 2 full subgroups + 3 remainder — should use first 10 values
    const subgroup = [44.0, 44.5, 45.0, 45.5, 46.0]; // R = 2.0
    const values = [...subgroup, ...subgroup, 30, 40, 50]; // 13 values
    const result = calculateCapability(values, target, usl, lslTarget);

    expect(result).not.toBeNull();
    expect(result!.sampleSize).toBe(13);
    // Only 2 subgroups used for within-sigma; R̄ = 2.0
    expect(result!.cp).toBeCloseTo(1.163, 1);
  });
});
