import { PRESETS, getPreset } from '../presets';
import { DEFAULT_PARAMS } from '../constants';

describe('presets', () => {
  it('all 12 presets exist', () => {
    expect(PRESETS).toHaveLength(12);
  });

  it('each preset has unique id', () => {
    const ids = PRESETS.map(p => p.id);
    expect(new Set(ids).size).toBe(12);
  });

  it('each preset has label, labelCN, and color', () => {
    for (const p of PRESETS) {
      expect(p.label.length).toBeGreaterThan(0);
      expect(p.labelCN.length).toBeGreaterThan(0);
      expect(p.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('apply() returns valid SimulationParams', () => {
    for (const p of PRESETS) {
      const result = p.apply(DEFAULT_PARAMS);
      expect(result.peakTemperature).toBeGreaterThanOrEqual(700);
      expect(result.peakTemperature).toBeLessThanOrEqual(1200);
      expect(typeof result.oxidationType).toBe('string');
      expect(typeof result.geometryType).toBe('string');
    }
  });

  it('apply() is pure — does not mutate input', () => {
    const original = { ...DEFAULT_PARAMS };
    for (const p of PRESETS) {
      p.apply(DEFAULT_PARAMS);
      expect(DEFAULT_PARAMS).toEqual(original);
    }
  });

  it('locos-isolation preset sets geometry to locos', () => {
    const p = getPreset('locos-isolation');
    expect(p).toBeDefined();
    const result = p!.apply(DEFAULT_PARAMS);
    expect(result.geometryType).toBe('locos');
  });

  it('sti-liner preset sets geometry to sti', () => {
    const p = getPreset('sti-liner');
    expect(p).toBeDefined();
    const result = p!.apply(DEFAULT_PARAMS);
    expect(result.geometryType).toBe('sti');
  });

  it('getPreset returns undefined for unknown id', () => {
    expect(getPreset('nonexistent')).toBeUndefined();
  });
});
