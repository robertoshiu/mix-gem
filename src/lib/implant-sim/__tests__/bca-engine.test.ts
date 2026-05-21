import { traceIon, buildLayers } from '../bca-engine';
import { DEFAULT_PARAMS, DEPTH_BINS, estimateMaxDepth, mulberry32 } from '../constants';

describe('bca-engine', () => {
  const maxDepth = estimateMaxDepth('B', 50);
  const binSize = maxDepth / DEPTH_BINS;
  const layers = buildLayers(DEFAULT_PARAMS);
  const damage = new Array(DEPTH_BINS).fill(0);

  test('ion stops within substrate (positive z)', () => {
    const rng = mulberry32(1);
    const traj = traceIon(DEFAULT_PARAMS, layers, damage, binSize, maxDepth, rng);
    expect(traj.finalPosition.z).toBeGreaterThan(0);
    expect(traj.backscattered).toBe(false);
  });

  test('trajectory has multiple points', () => {
    const rng = mulberry32(2);
    const traj = traceIon(DEFAULT_PARAMS, layers, damage, binSize, maxDepth, rng);
    expect(traj.points.length).toBeGreaterThan(5);
  });

  test('energy decreases along trajectory', () => {
    const rng = mulberry32(3);
    const traj = traceIon(DEFAULT_PARAMS, layers, damage, binSize, maxDepth, rng);
    const first = traj.energyAtPoints[0];
    const last = traj.energyAtPoints[traj.energyAtPoints.length - 1];
    expect(first).toBeGreaterThan(last);
  });

  test('heavier ion (As) stops shallower than B at same energy', () => {
    const rng1 = mulberry32(10);
    const trajB = traceIon(DEFAULT_PARAMS, layers, damage, binSize, maxDepth, rng1);

    const asParams = { ...DEFAULT_PARAMS, ionSpecies: 'As' as const };
    const asMaxDepth = estimateMaxDepth('As', 50);
    const asBinSize = asMaxDepth / DEPTH_BINS;
    const asLayers = buildLayers(asParams);
    const rng2 = mulberry32(10);
    const trajAs = traceIon(asParams, asLayers, damage, asBinSize, asMaxDepth, rng2);

    expect(trajAs.finalPosition.z).toBeLessThan(trajB.finalPosition.z);
  });

  test('collisions create displacement events', () => {
    const rng = mulberry32(5);
    const traj = traceIon(DEFAULT_PARAMS, layers, damage, binSize, maxDepth, rng);
    const displacements = traj.collisions.filter(c => c.isDisplacement);
    expect(displacements.length).toBeGreaterThan(0);
  });

  test('buildLayers respects oxide and resist thickness', () => {
    const params = { ...DEFAULT_PARAMS, screenOxideThickness: 20, photoresistThickness: 500 };
    const l = buildLayers(params);
    expect(l.length).toBe(3);
    expect(l[0].material).toBe('photoresist');
    expect(l[1].material).toBe('SiO2');
    expect(l[2].material).toBe('Si');
    expect(l[1].startNm).toBe(500);
    expect(l[2].startNm).toBe(520);
  });
});
