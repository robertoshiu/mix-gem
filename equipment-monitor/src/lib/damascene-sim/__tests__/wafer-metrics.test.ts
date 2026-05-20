import { computeStepMetrics } from '../wafer-metrics';
import { DEFAULT_PARAMS, FILL_PROFILE_POINTS } from '../constants';

describe('wafer-metrics', () => {
  it('ECD fill step produces valid metrics', () => {
    const prevProfile = new Array(FILL_PROFILE_POINTS).fill(0);
    const result = computeStepMetrics(DEFAULT_PARAMS, 10, 0, prevProfile);
    expect(result.thicknessMap).toHaveLength(81);
    expect(result.resistanceMap).toHaveLength(81);
    expect(result.fillProfile).toHaveLength(FILL_PROFILE_POINTS);
  });

  it('sheet resistance is within spec at nominal ECD', () => {
    const prevProfile = new Array(FILL_PROFILE_POINTS).fill(0);
    const result = computeStepMetrics(DEFAULT_PARAMS, 60, 0, prevProfile);
    expect(result.sheetResistance).toBeGreaterThan(0.01);
    expect(result.sheetResistance).toBeLessThan(10);
  });

  it('step coverage is above 40% at nominal conditions', () => {
    const prevProfile = new Array(FILL_PROFILE_POINTS).fill(0);
    const result = computeStepMetrics(DEFAULT_PARAMS, 60, 0, prevProfile);
    expect(result.stepCoverage).toBeGreaterThan(40);
  });

  it('copper thickness grows with accumulated deposition', () => {
    const prevProfile = new Array(FILL_PROFILE_POINTS).fill(0);
    const r1 = computeStepMetrics(DEFAULT_PARAMS, 10, 0, prevProfile);
    const r2 = computeStepMetrics(DEFAULT_PARAMS, 20, r1.copperThickness, r1.fillProfile);
    expect(r2.copperThickness).toBeGreaterThan(r1.copperThickness);
  });

  it('uniformity is below 10% at nominal', () => {
    const prevProfile = new Array(FILL_PROFILE_POINTS).fill(0);
    const result = computeStepMetrics(DEFAULT_PARAMS, 60, 0, prevProfile);
    expect(result.uniformity).toBeGreaterThanOrEqual(0);
    expect(result.uniformity).toBeLessThan(10);
  });
});
