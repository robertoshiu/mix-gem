import { computePrestonRemoval } from '../preston-removal';
import { DEFAULT_PARAMS, RADIAL_NODES, KP_CU, KP_BARRIER, KP_OXIDE } from '../constants';

describe('preston-removal', () => {
  const contactPressure = new Array(RADIAL_NODES).fill(20000);
  const fluidPressure = new Array(RADIAL_NODES).fill(5000);

  it('MRR scales linearly with pressure', () => {
    const lowP = new Array(RADIAL_NODES).fill(10000);
    const highP = new Array(RADIAL_NODES).fill(30000);
    const low = computePrestonRemoval(DEFAULT_PARAMS, lowP, fluidPressure, KP_CU);
    const high = computePrestonRemoval(DEFAULT_PARAMS, highP, fluidPressure, KP_CU);
    expect(high.meanRemovalRate).toBeGreaterThan(low.meanRemovalRate * 1.5);
  });

  it('Cu rate > barrier rate > oxide rate for same conditions', () => {
    const cu = computePrestonRemoval(DEFAULT_PARAMS, contactPressure, fluidPressure, KP_CU);
    const barrier = computePrestonRemoval(DEFAULT_PARAMS, contactPressure, fluidPressure, KP_BARRIER);
    const oxide = computePrestonRemoval(DEFAULT_PARAMS, contactPressure, fluidPressure, KP_OXIDE);
    expect(cu.meanRemovalRate).toBeGreaterThan(barrier.meanRemovalRate);
    expect(barrier.meanRemovalRate).toBeGreaterThan(oxide.meanRemovalRate);
  });

  it('removal rate profile has RADIAL_NODES entries', () => {
    const result = computePrestonRemoval(DEFAULT_PARAMS, contactPressure, fluidPressure, KP_CU);
    expect(result.removalRateProfile).toHaveLength(RADIAL_NODES);
  });

  it('higher RPM increases removal rate', () => {
    const slow = computePrestonRemoval(
      { ...DEFAULT_PARAMS, waferRpm: 20, platenRpm: 20 },
      contactPressure, fluidPressure, KP_CU
    );
    const fast = computePrestonRemoval(
      { ...DEFAULT_PARAMS, waferRpm: 120, platenRpm: 120 },
      contactPressure, fluidPressure, KP_CU
    );
    expect(fast.meanRemovalRate).toBeGreaterThan(slow.meanRemovalRate);
  });

  it('dishing increases with pattern density < 50%', () => {
    const dense = computePrestonRemoval(
      { ...DEFAULT_PARAMS, patternDensity: 80 }, contactPressure, fluidPressure, KP_CU
    );
    const sparse = computePrestonRemoval(
      { ...DEFAULT_PARAMS, patternDensity: 20 }, contactPressure, fluidPressure, KP_CU
    );
    expect(sparse.dishingFactor).toBeGreaterThan(dense.dishingFactor);
  });
});
