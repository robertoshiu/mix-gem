import {
  DEFAULT_PARAMS, DOPANT_DB, THERMAL_MODES,
  PARAM_BOUNDS, estimateMaxDepth, mulberry32,
} from '../constants';

describe('diffusion-sim constants', () => {
  it('DEFAULT_PARAMS has all required fields', () => {
    expect(DEFAULT_PARAMS.peakTemperature).toBe(1000);
    expect(DEFAULT_PARAMS.dopantSpecies).toBe('B');
    expect(DEFAULT_PARAMS.thermalMode).toBe('rta');
    expect(DEFAULT_PARAMS.ambientGas).toBe('N2');
    expect(DEFAULT_PARAMS.initialDose).toBeCloseTo(1e14, -10);
    expect(DEFAULT_PARAMS.totalSteps).toBe(200);
  });

  it('DOPANT_DB has all 6 species with valid data', () => {
    const species = Object.keys(DOPANT_DB);
    expect(species).toHaveLength(6);
    expect(species).toEqual(expect.arrayContaining(['B', 'P', 'As', 'Sb', 'In', 'Ge']));
    for (const s of species) {
      const d = DOPANT_DB[s as keyof typeof DOPANT_DB];
      expect(d.dI).toHaveLength(4);
      expect(d.dV).toHaveLength(4);
      expect(d.fI).toBeGreaterThanOrEqual(0);
      expect(d.fI).toBeLessThanOrEqual(1);
    }
  });

  it('THERMAL_MODES has all 5 modes with increasing timescale', () => {
    expect(Object.keys(THERMAL_MODES)).toHaveLength(5);
    expect(THERMAL_MODES.furnace.typicalDt).toBeGreaterThan(THERMAL_MODES.rta.typicalDt);
    expect(THERMAL_MODES.rta.typicalDt).toBeGreaterThan(THERMAL_MODES.spike.typicalDt);
    expect(THERMAL_MODES.spike.typicalDt).toBeGreaterThan(THERMAL_MODES.flash.typicalDt);
    expect(THERMAL_MODES.flash.typicalDt).toBeGreaterThan(THERMAL_MODES.laser.typicalDt);
  });

  it('estimateMaxDepth returns reasonable range', () => {
    const d = estimateMaxDepth('B', 50);
    expect(d).toBeGreaterThanOrEqual(200);
    expect(d).toBeLessThan(5000);
  });

  it('mulberry32 produces deterministic sequence', () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);
    for (let i = 0; i < 10; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it('PARAM_BOUNDS covers all 11 slider parameters', () => {
    expect(Object.keys(PARAM_BOUNDS)).toHaveLength(11);
    for (const [, b] of Object.entries(PARAM_BOUNDS)) {
      expect(b.min).toBeLessThan(b.max);
      expect(b.default).toBeGreaterThanOrEqual(b.min);
      expect(b.default).toBeLessThanOrEqual(b.max);
    }
  });
});
