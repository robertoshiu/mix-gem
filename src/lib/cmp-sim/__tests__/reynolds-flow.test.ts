import { computeReynoldsFlow } from '../reynolds-flow';
import { DEFAULT_PARAMS, RADIAL_NODES } from '../constants';

describe('reynolds-flow', () => {
  it('film thickness is positive at all nodes', () => {
    const result = computeReynoldsFlow(DEFAULT_PARAMS);
    expect(result.filmThickness).toHaveLength(RADIAL_NODES);
    result.filmThickness.forEach((h) => {
      expect(h).toBeGreaterThan(0);
    });
  });

  it('pressure array has correct length', () => {
    const result = computeReynoldsFlow(DEFAULT_PARAMS);
    expect(result.fluidPressure).toHaveLength(RADIAL_NODES);
  });

  it('pressure drops to near-zero at pad groove locations', () => {
    const result = computeReynoldsFlow(DEFAULT_PARAMS);
    const grooveNode = Math.round(0.25 * (RADIAL_NODES - 1));
    const neighborNode = grooveNode + 1;
    expect(result.fluidPressure[grooveNode]).toBeLessThan(
      result.fluidPressure[neighborNode]
    );
  });

  it('higher RPM increases fluid pressure (hydroplaning risk)', () => {
    const normal = computeReynoldsFlow(DEFAULT_PARAMS);
    const fast = computeReynoldsFlow({ ...DEFAULT_PARAMS, platenRpm: 140, waferRpm: 140 });
    const normalMax = Math.max(...normal.fluidPressure);
    const fastMax = Math.max(...fast.fluidPressure);
    expect(fastMax).toBeGreaterThan(normalMax);
  });

  it('higher slurry flow increases film thickness', () => {
    const low = computeReynoldsFlow({ ...DEFAULT_PARAMS, slurryFlow: 80 });
    const high = computeReynoldsFlow({ ...DEFAULT_PARAMS, slurryFlow: 400 });
    const lowMean = low.filmThickness.reduce((s, v) => s + v, 0) / RADIAL_NODES;
    const highMean = high.filmThickness.reduce((s, v) => s + v, 0) / RADIAL_NODES;
    expect(highMean).toBeGreaterThan(lowMean);
  });

  it('very high RPM triggers hydroplaning (high film thickness)', () => {
    const result = computeReynoldsFlow({ ...DEFAULT_PARAMS, platenRpm: 150, waferRpm: 150, slurryFlow: 450 });
    const meanH = result.filmThickness.reduce((s, v) => s + v, 0) / RADIAL_NODES;
    expect(meanH).toBeGreaterThan(30);
  });
});
