import { PRESETS, getPreset } from '../presets';
import { DEFAULT_PARAMS } from '../constants';

describe('presets', () => {
  test('has 10 presets', () => {
    expect(PRESETS).toHaveLength(10);
  });

  test('channeling-implant sets tilt to 0', () => {
    const p = getPreset('channeling-implant')!;
    const result = p.apply(DEFAULT_PARAMS);
    expect(result.tiltAngle).toBe(0);
    expect(result.twistAngle).toBe(0);
  });

  test('high-dose-amorphization uses As at high dose', () => {
    const p = getPreset('high-dose-amorphization')!;
    const result = p.apply(DEFAULT_PARAMS);
    expect(result.ionSpecies).toBe('As');
    expect(result.dose).toBe(1e15);
  });

  test('implant-through-oxide sets screen oxide', () => {
    const p = getPreset('implant-through-oxide')!;
    const result = p.apply(DEFAULT_PARAMS);
    expect(result.screenOxideThickness).toBe(30);
  });

  test('shallow-junction uses BF2 at low energy', () => {
    const p = getPreset('shallow-junction')!;
    const result = p.apply(DEFAULT_PARAMS);
    expect(result.ionSpecies).toBe('BF2');
    expect(result.beamEnergy).toBe(5);
  });

  test('retrograde-well uses P at high energy', () => {
    const p = getPreset('retrograde-well')!;
    const result = p.apply(DEFAULT_PARAMS);
    expect(result.ionSpecies).toBe('P');
    expect(result.beamEnergy).toBe(400);
  });

  test('dose-rate-heating increases beam current and temperature', () => {
    const p = getPreset('dose-rate-heating')!;
    const result = p.apply(DEFAULT_PARAMS);
    expect(result.beamCurrent).toBeGreaterThan(DEFAULT_PARAMS.beamCurrent);
    expect(result.substrateTemperature).toBeGreaterThan(DEFAULT_PARAMS.substrateTemperature);
  });

  test('resist-punch-through sets thin resist', () => {
    const p = getPreset('resist-punch-through')!;
    const result = p.apply(DEFAULT_PARAMS);
    expect(result.photoresistThickness).toBe(200);
  });

  test('high-tilt-halo sets large tilt angle', () => {
    const p = getPreset('high-tilt-halo')!;
    const result = p.apply(DEFAULT_PARAMS);
    expect(result.tiltAngle).toBe(45);
  });

  test('each preset produces valid params', () => {
    for (const preset of PRESETS) {
      const result = preset.apply(DEFAULT_PARAMS);
      expect(result.beamEnergy).toBeGreaterThan(0);
      expect(result.tiltAngle).toBeGreaterThanOrEqual(0);
      expect(result.totalSteps).toBeGreaterThan(0);
    }
  });
});
