import { computeContactState, buildGWLookup } from '../contact-model';
import { DEFAULT_PARAMS, RADIAL_NODES } from '../constants';

describe('contact-model', () => {
  it('real contact area is 0.1%-1% of nominal at default params', () => {
    const filmThickness = new Array(RADIAL_NODES).fill(20);
    const result = computeContactState(DEFAULT_PARAMS, filmThickness, 0, 0);
    expect(result.realContactArea).toBeGreaterThan(0.0005);
    expect(result.realContactArea).toBeLessThan(0.02);
  });

  it('contact pressure array has correct length', () => {
    const filmThickness = new Array(RADIAL_NODES).fill(20);
    const result = computeContactState(DEFAULT_PARAMS, filmThickness, 0, 0);
    expect(result.contactPressure).toHaveLength(RADIAL_NODES);
  });

  it('GW lookup table has monotonic contact area vs separation', () => {
    const lookup = buildGWLookup(DEFAULT_PARAMS);
    for (let i = 1; i < lookup.length; i++) {
      expect(lookup[i].contactArea).toBeLessThanOrEqual(lookup[i - 1].contactArea);
    }
  });

  it('viscoelastic creep: contact area increases with time', () => {
    const filmThickness = new Array(RADIAL_NODES).fill(20);
    const early = computeContactState(DEFAULT_PARAMS, filmThickness, 0, 1);
    const late = computeContactState(DEFAULT_PARAMS, filmThickness, 0, 15);
    expect(late.realContactArea).toBeGreaterThanOrEqual(early.realContactArea);
  });

  it('creep reaches steady state after ~3*tau', () => {
    const filmThickness = new Array(RADIAL_NODES).fill(20);
    const at3tau = computeContactState(DEFAULT_PARAMS, filmThickness, 0, 9);
    const at5tau = computeContactState(DEFAULT_PARAMS, filmThickness, 0, 15);
    const diff = Math.abs(at5tau.realContactArea - at3tau.realContactArea);
    expect(diff).toBeLessThan(at3tau.realContactArea * 0.1);
  });

  it('pad glazing (low asperity density) reduces contact area', () => {
    const filmThickness = new Array(RADIAL_NODES).fill(20);
    const normal = computeContactState(DEFAULT_PARAMS, filmThickness, 0, 10);
    const glazed = computeContactState(
      { ...DEFAULT_PARAMS, asperityDensity: 150 },
      filmThickness, 0, 10
    );
    expect(glazed.realContactArea).toBeLessThan(normal.realContactArea);
  });
});
