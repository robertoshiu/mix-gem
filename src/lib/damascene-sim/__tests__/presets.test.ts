import { getPreset } from '../presets';
import { DEFAULT_PARAMS } from '../constants';

describe('presets', () => {
  it('current-crowding increases current and reduces seed', () => {
    const preset = getPreset('current-crowding')!;
    const result = preset.apply(DEFAULT_PARAMS, 0);
    expect(result.appliedCurrent).toBeGreaterThan(DEFAULT_PARAMS.appliedCurrent);
    expect(result.seedThickness).toBeLessThan(DEFAULT_PARAMS.seedThickness);
  });

  it('additive-depletion reduces additive concentration over steps', () => {
    const preset = getPreset('additive-depletion')!;
    const early = preset.apply(DEFAULT_PARAMS, 5);
    const late = preset.apply(DEFAULT_PARAMS, 50);
    expect(late.additiveConc).toBeLessThan(early.additiveConc);
  });

  it('seed-thinning reduces seed thickness', () => {
    const preset = getPreset('seed-thinning')!;
    const result = preset.apply(DEFAULT_PARAMS, 0);
    expect(result.seedThickness).toBeLessThan(DEFAULT_PARAMS.seedThickness);
  });

  it('over-polish increases pad pressure', () => {
    const preset = getPreset('over-polish')!;
    const result = preset.apply(DEFAULT_PARAMS, 0);
    expect(result.padPressure).toBeGreaterThan(DEFAULT_PARAMS.padPressure);
  });

  it('under-polish decreases pad pressure', () => {
    const preset = getPreset('under-polish')!;
    const result = preset.apply(DEFAULT_PARAMS, 0);
    expect(result.padPressure).toBeLessThan(DEFAULT_PARAMS.padPressure);
  });

  it('bath-temp-drift increases temperature over steps', () => {
    const preset = getPreset('bath-temp-drift')!;
    const early = preset.apply(DEFAULT_PARAMS, 0);
    const late = preset.apply(DEFAULT_PARAMS, 60);
    expect(late.bathTemp).toBeGreaterThan(early.bathTemp);
  });
});
