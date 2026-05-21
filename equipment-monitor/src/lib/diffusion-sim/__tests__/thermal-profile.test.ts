import { generateThermalProfile, thermalBudget } from '../thermal-profile';
import { DEFAULT_PARAMS, DEFAULT_TOTAL_STEPS } from '../constants';
import type { ThermalMode, SimulationParams } from '../types';

const DEPTH_BINS = 200;

function makeParams(mode: ThermalMode, overrides: Partial<SimulationParams> = {}): SimulationParams {
  return { ...DEFAULT_PARAMS, thermalMode: mode, ...overrides };
}

describe('thermal-profile', () => {
  it('generates correct number of steps for all modes', () => {
    for (const mode of ['furnace', 'rta', 'spike', 'flash', 'laser'] as ThermalMode[]) {
      const steps = generateThermalProfile(mode, makeParams(mode));
      expect(steps).toHaveLength(DEFAULT_TOTAL_STEPS);
    }
  });

  it('furnace mode has dt on order of seconds', () => {
    const steps = generateThermalProfile('furnace', makeParams('furnace'));
    expect(steps[0].dt).toBeGreaterThan(1);
    expect(steps[0].dt).toBeLessThan(100);
  });

  it('laser mode has dt on order of microseconds', () => {
    const steps = generateThermalProfile('laser', makeParams('laser'));
    expect(steps[0].dt).toBeLessThan(1e-4);
    expect(steps[0].dt).toBeGreaterThan(0);
  });

  it('spike mode has Gaussian-like shape peaking mid-process', () => {
    const steps = generateThermalProfile('spike', makeParams('spike', { peakTemperature: 1080 }));
    const temps = steps.map(s => s.temperature);
    const maxT = Math.max(...temps);
    const maxIdx = temps.indexOf(maxT);
    expect(maxIdx).toBeGreaterThan(steps.length * 0.2);
    expect(maxIdx).toBeLessThan(steps.length * 0.8);
    expect(maxT).toBeGreaterThan(900);
  });

  it('all modes contain only valid phases', () => {
    const validPhases = new Set(['ramp', 'soak', 'cool', 'pulse']);
    for (const mode of ['furnace', 'rta', 'spike', 'flash', 'laser'] as ThermalMode[]) {
      const steps = generateThermalProfile(mode, makeParams(mode));
      for (const s of steps) {
        expect(validPhases.has(s.phase)).toBe(true);
      }
    }
  });

  it('furnace ramp phase reaches near peak temperature', () => {
    const steps = generateThermalProfile('furnace', makeParams('furnace', { peakTemperature: 1050 }));
    const maxT = Math.max(...steps.map(s => s.temperature));
    expect(maxT).toBeGreaterThan(1000);
  });

  it('cooling phase decreases temperature', () => {
    const steps = generateThermalProfile('rta', makeParams('rta', { peakTemperature: 1050, soakTime: 5 }));
    const coolSteps = steps.filter(s => s.phase === 'cool');
    if (coolSteps.length >= 2) {
      expect(coolSteps[coolSteps.length - 1].temperature).toBeLessThan(coolSteps[0].temperature);
    }
  });

  it('laser mode has depth-dependent temperature', () => {
    const steps = generateThermalProfile('laser', makeParams('laser', { peakTemperature: 1400 }));
    const midStep = steps[Math.floor(steps.length * 0.3)];
    const surfaceT = midStep.tempProfile[0];
    const deepT = midStep.tempProfile[DEPTH_BINS - 1];
    if (surfaceT > 500) {
      expect(deepT).toBeLessThan(surfaceT);
    }
  });

  it('thermalBudget accumulates correctly', () => {
    const steps = generateThermalProfile('rta', makeParams('rta'));
    const budget = thermalBudget(steps, () => 1e-12);
    const totalTime = steps.reduce((s, st) => s + st.dt, 0);
    expect(budget).toBeCloseTo(1e-12 * totalTime, 20);
  });
});
