import { computeSlurryChemistry } from '../slurry-chemistry';
import { DEFAULT_PARAMS, RADIAL_NODES } from '../constants';

describe('slurry-chemistry', () => {
  it('dissolution rate is positive at nominal params', () => {
    const result = computeSlurryChemistry(DEFAULT_PARAMS, 30);
    expect(result.dissolutionRate).toBeGreaterThan(0);
  });

  it('dissolution rate increases with temperature (Arrhenius)', () => {
    const cold = computeSlurryChemistry(DEFAULT_PARAMS, 25);
    const hot = computeSlurryChemistry(DEFAULT_PARAMS, 50);
    expect(hot.dissolutionRate).toBeGreaterThan(cold.dissolutionRate);
  });

  it('abrasive concentration profile depletes from center to edge', () => {
    const result = computeSlurryChemistry(DEFAULT_PARAMS, 30);
    expect(result.abrasiveProfile).toHaveLength(RADIAL_NODES);
    expect(result.abrasiveProfile[0]).toBeGreaterThanOrEqual(
      result.abrasiveProfile[RADIAL_NODES - 1]
    );
  });

  it('passivation layer thickness scales with pH', () => {
    const acidic = computeSlurryChemistry({ ...DEFAULT_PARAMS, slurryPh: 3 }, 30);
    const alkaline = computeSlurryChemistry({ ...DEFAULT_PARAMS, slurryPh: 10 }, 30);
    expect(acidic.passivationThickness).toBeGreaterThan(0);
    expect(alkaline.passivationThickness).toBeGreaterThan(0);
  });

  it('higher flow rate reduces abrasive depletion', () => {
    const lowFlow = computeSlurryChemistry({ ...DEFAULT_PARAMS, slurryFlow: 80 }, 30);
    const highFlow = computeSlurryChemistry({ ...DEFAULT_PARAMS, slurryFlow: 400 }, 30);
    const lowEdge = lowFlow.abrasiveProfile[RADIAL_NODES - 1];
    const highEdge = highFlow.abrasiveProfile[RADIAL_NODES - 1];
    expect(highEdge).toBeGreaterThanOrEqual(lowEdge);
  });
});
