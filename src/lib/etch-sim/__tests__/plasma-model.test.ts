import { computePlasmaState, computeIonFluxMap } from '../plasma-model';
import { DEFAULT_PARAMS, ACTIVE_DIE_COUNT, DIE_MASK } from '../constants';

describe('plasma-model', () => {
  it('electron density scales with ICP power', () => {
    const low = computePlasmaState({ ...DEFAULT_PARAMS, icpPower: 400 });
    const high = computePlasmaState({ ...DEFAULT_PARAMS, icpPower: 1600 });
    expect(high.electronDensity).toBeGreaterThan(low.electronDensity * 1.5);
    expect(high.electronDensity).toBeGreaterThan(0);
  });

  it('ion flux is positive at nominal params', () => {
    const state = computePlasmaState(DEFAULT_PARAMS);
    expect(state.ionFlux).toBeGreaterThan(0);
  });

  it('gas ratio is CF4/(CF4+O2) and in 0-1 range', () => {
    const state = computePlasmaState(DEFAULT_PARAMS);
    expect(state.gasRatio).toBeCloseTo(80 / (80 + 20));
    expect(state.gasRatio).toBeGreaterThanOrEqual(0);
    expect(state.gasRatio).toBeLessThanOrEqual(1);
  });

  it('ion flux map is center-peaked (center > edge)', () => {
    const map = computeIonFluxMap(DEFAULT_PARAMS);
    const center = map[40];
    const edgeDie = map[3];
    expect(center).toBeGreaterThan(edgeDie);
    expect(map.filter((_, i) => DIE_MASK[i] && map[i] > 0).length).toBe(ACTIVE_DIE_COUNT);
  });
});
