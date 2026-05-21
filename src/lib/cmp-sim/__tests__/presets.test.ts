import { PRESETS, getPreset } from '../presets';
import { DEFAULT_PARAMS } from '../constants';

describe('presets', () => {
  it('has 8 presets', () => {
    expect(PRESETS).toHaveLength(8);
  });

  it('slurry-starvation reduces flow rate', () => {
    const p = getPreset('slurry-starvation')!;
    const result = p.apply(DEFAULT_PARAMS, 0);
    expect(result.slurryFlow).toBeLessThan(DEFAULT_PARAMS.slurryFlow);
  });

  it('pad-glazing reduces asperity density and stiffness', () => {
    const p = getPreset('pad-glazing')!;
    const result = p.apply(DEFAULT_PARAMS, 0);
    expect(result.asperityDensity).toBeLessThan(DEFAULT_PARAMS.asperityDensity);
    expect(result.padStiffness).toBeLessThan(DEFAULT_PARAMS.padStiffness);
  });

  it('over-polish increases total steps', () => {
    const p = getPreset('over-polish')!;
    const result = p.apply(DEFAULT_PARAMS, 0);
    expect(result.totalSteps).toBeGreaterThan(DEFAULT_PARAMS.totalSteps);
  });

  it('downforce-imbalance changes downForce', () => {
    const p = getPreset('downforce-imbalance')!;
    const result = p.apply(DEFAULT_PARAMS, 0);
    expect(result.downForce).not.toBe(DEFAULT_PARAMS.downForce);
  });

  it('retaining-ring-wear changes downForce', () => {
    const p = getPreset('retaining-ring-wear')!;
    const result = p.apply(DEFAULT_PARAMS, 0);
    expect(result.downForce).not.toBe(DEFAULT_PARAMS.downForce);
  });

  it('slurry-ph-drift changes pH', () => {
    const p = getPreset('slurry-ph-drift')!;
    const result = p.apply(DEFAULT_PARAMS, 0);
    expect(result.slurryPh).not.toBe(DEFAULT_PARAMS.slurryPh);
  });

  it('hydroplaning increases RPM and flow', () => {
    const p = getPreset('hydroplaning')!;
    const result = p.apply(DEFAULT_PARAMS, 0);
    expect(result.platenRpm).toBeGreaterThan(DEFAULT_PARAMS.platenRpm);
    expect(result.slurryFlow).toBeGreaterThan(DEFAULT_PARAMS.slurryFlow);
  });

  it('pattern-density increases pattern density', () => {
    const p = getPreset('pattern-density')!;
    const result = p.apply(DEFAULT_PARAMS, 0);
    expect(result.patternDensity).toBeGreaterThan(DEFAULT_PARAMS.patternDensity);
  });
});
