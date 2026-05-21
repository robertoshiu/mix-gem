import { getPreset } from '../presets';
import { DEFAULT_PARAMS } from '../constants';

describe('presets', () => {
  it('plasma-nonuniformity increases ICP power and decreases pressure', () => {
    const p = getPreset('plasma-nonuniformity')!;
    const result = p.apply(DEFAULT_PARAMS, 0);
    expect(result.icpPower).toBeGreaterThan(DEFAULT_PARAMS.icpPower);
    expect(result.chamberPressure).toBeLessThan(DEFAULT_PARAMS.chamberPressure);
  });

  it('ion-bombardment increases bias power', () => {
    const p = getPreset('ion-bombardment')!;
    const result = p.apply(DEFAULT_PARAMS, 0);
    expect(result.biasPower).toBeGreaterThan(DEFAULT_PARAMS.biasPower);
  });

  it('micro-loading decreases trench width and increases aspect ratio', () => {
    const p = getPreset('micro-loading')!;
    const result = p.apply(DEFAULT_PARAMS, 0);
    expect(result.trenchWidth).toBeLessThan(DEFAULT_PARAMS.trenchWidth);
    expect(result.aspectRatio).toBeGreaterThan(DEFAULT_PARAMS.aspectRatio);
  });

  it('polymer-buildup decreases O2 flow', () => {
    const p = getPreset('polymer-buildup')!;
    const result = p.apply(DEFAULT_PARAMS, 0);
    expect(result.o2Flow).toBeLessThan(DEFAULT_PARAMS.o2Flow);
  });

  it('selectivity-loss decreases pressure and increases chuck temp', () => {
    const p = getPreset('selectivity-loss')!;
    const result = p.apply(DEFAULT_PARAMS, 0);
    expect(result.chamberPressure).toBeLessThan(DEFAULT_PARAMS.chamberPressure);
    expect(result.chuckTemp).toBeGreaterThan(DEFAULT_PARAMS.chuckTemp);
  });

  it('endpoint-drift increases total steps and decreases bias', () => {
    const p = getPreset('endpoint-drift')!;
    const result = p.apply(DEFAULT_PARAMS, 0);
    expect(result.totalSteps).toBeGreaterThan(DEFAULT_PARAMS.totalSteps);
    expect(result.biasPower).toBeLessThan(DEFAULT_PARAMS.biasPower);
  });
});
