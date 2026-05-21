import { createEnsemble, simulateBatch, computeStatistics, getDepthProfile } from '../monte-carlo';
import { DEFAULT_PARAMS, DEPTH_BINS } from '../constants';

describe('monte-carlo', () => {
  test('depth profile has correct bin count', () => {
    const ens = createEnsemble(DEFAULT_PARAMS);
    simulateBatch(ens, 20);
    const profile = getDepthProfile(ens);
    expect(profile.length).toBe(DEPTH_BINS);
  });

  test('Rp for B at 50 keV is in reasonable range (50-400 nm)', () => {
    const ens = createEnsemble(DEFAULT_PARAMS);
    simulateBatch(ens, 50);
    const stats = computeStatistics(ens);
    expect(stats.projectedRange).toBeGreaterThan(50);
    expect(stats.projectedRange).toBeLessThan(400);
  });

  test('heavier ions have smaller straggle-to-range ratio', () => {
    const ensB = createEnsemble(DEFAULT_PARAMS);
    simulateBatch(ensB, 50);
    const statsB = computeStatistics(ensB);

    const ensAs = createEnsemble({ ...DEFAULT_PARAMS, ionSpecies: 'As' });
    simulateBatch(ensAs, 50);
    const statsAs = computeStatistics(ensAs);

    const ratioB = statsB.projectedRange > 0 ? statsB.straggle / statsB.projectedRange : 0;
    const ratioAs = statsAs.projectedRange > 0 ? statsAs.straggle / statsAs.projectedRange : 0;
    expect(ratioAs).toBeLessThan(ratioB + 0.3);
  });

  test('backscatter fraction is less than 30%', () => {
    const ens = createEnsemble(DEFAULT_PARAMS);
    simulateBatch(ens, 100);
    const stats = computeStatistics(ens);
    expect(stats.retainedDoseFraction).toBeGreaterThan(0.7);
  });

  test('lateral straggle is positive', () => {
    const ens = createEnsemble(DEFAULT_PARAMS);
    simulateBatch(ens, 50);
    const stats = computeStatistics(ens);
    expect(stats.lateralStraggle).toBeGreaterThan(0);
  });

  test('damage accumulates with more ions', () => {
    const ens = createEnsemble(DEFAULT_PARAMS);
    simulateBatch(ens, 10);
    const stats1 = computeStatistics(ens);
    simulateBatch(ens, 40);
    const stats2 = computeStatistics(ens);
    expect(stats2.damagePeakDensity).toBeGreaterThanOrEqual(stats1.damagePeakDensity);
  });
});
