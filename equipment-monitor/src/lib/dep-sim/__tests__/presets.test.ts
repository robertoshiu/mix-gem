import { getPreset } from '../presets';
import { DEFAULT_PARAMS } from '../constants';

describe('presets', () => {
  it('precursor-starvation reduces BDEAS flow by 60%', () => {
    const preset = getPreset('precursor-starvation')!;
    const result = preset.apply(DEFAULT_PARAMS, 0);
    expect(result.bdeasFlowRate).toBeCloseTo(DEFAULT_PARAMS.bdeasFlowRate * 0.4);
  });

  it('purge-leak-through cuts purge time to 30%', () => {
    const preset = getPreset('purge-leak-through')!;
    const result = preset.apply(DEFAULT_PARAMS, 0);
    expect(result.purgeTime).toBeCloseTo(DEFAULT_PARAMS.purgeTime * 0.3);
  });

  it('temperature-excursion adds 80 degC', () => {
    const preset = getPreset('temperature-excursion')!;
    const result = preset.apply(DEFAULT_PARAMS, 0);
    expect(result.pedestalTemp).toBe(DEFAULT_PARAMS.pedestalTemp + 80);
  });

  it('o3-degradation reduces O3 flow progressively', () => {
    const preset = getPreset('o3-degradation')!;
    const early = preset.apply(DEFAULT_PARAMS, 0);
    const late = preset.apply(DEFAULT_PARAMS, 16);
    expect(late.o3FlowRate).toBeLessThan(early.o3FlowRate);
  });

  it('chamber-seasoning resets to default params', () => {
    const preset = getPreset('chamber-seasoning')!;
    const modified = { ...DEFAULT_PARAMS, pedestalTemp: 350, bdeasFlowRate: 10 };
    const result = preset.apply(modified, 0);
    expect(result.pedestalTemp).toBe(DEFAULT_PARAMS.pedestalTemp);
    expect(result.bdeasFlowRate).toBe(DEFAULT_PARAMS.bdeasFlowRate);
  });
});
