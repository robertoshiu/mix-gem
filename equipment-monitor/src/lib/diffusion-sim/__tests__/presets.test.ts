import { PRESETS, getPreset } from '../presets';
import { DEFAULT_PARAMS } from '../constants';

describe('presets', () => {
  it('has 12 presets', () => {
    expect(PRESETS).toHaveLength(12);
  });

  it('each preset produces valid params', () => {
    for (const preset of PRESETS) {
      const params = preset.apply(DEFAULT_PARAMS);
      expect(params.peakTemperature).toBeGreaterThanOrEqual(700);
      expect(params.peakTemperature).toBeLessThanOrEqual(1410);
      expect(params.dopantSpecies).toBeTruthy();
      expect(params.thermalMode).toBeTruthy();
    }
  });

  it('furnace-drive-in has long soak time', () => {
    const p = getPreset('furnace-drive-in')!.apply(DEFAULT_PARAMS);
    expect(p.soakTime).toBeGreaterThanOrEqual(3600);
    expect(p.thermalMode).toBe('furnace');
  });

  it('laser-anneal has microsecond soak time', () => {
    const p = getPreset('laser-anneal')!.apply(DEFAULT_PARAMS);
    expect(p.soakTime).toBeLessThan(0.001);
    expect(p.thermalMode).toBe('laser');
  });

  it('ted-showcase has high interstitial factor', () => {
    const p = getPreset('ted-showcase')!.apply(DEFAULT_PARAMS);
    expect(p.interstitialFactor).toBeGreaterThan(1);
  });

  it('all 5 thermal modes covered by presets', () => {
    const modes = new Set(PRESETS.map(p => p.apply(DEFAULT_PARAMS).thermalMode));
    expect(modes.size).toBe(5);
  });

  it('co-diffusion sets P dopant', () => {
    const p = getPreset('co-diffusion')!.apply(DEFAULT_PARAMS);
    expect(p.dopantSpecies).toBe('P');
  });

  it('thermal-budget-overshoot has longest total time', () => {
    const p = getPreset('thermal-budget-overshoot')!.apply(DEFAULT_PARAMS);
    expect(p.soakTime).toBe(7200);
    expect(p.peakTemperature).toBeGreaterThan(1100);
  });
});
