import { DEFAULT_PARAMS, ION_DB, MATERIAL_DB, CHANNEL_DB, estimateMaxDepth, mulberry32, DEPTH_BINS } from '../constants';

describe('constants', () => {
  test('DEFAULT_PARAMS has all required fields', () => {
    expect(DEFAULT_PARAMS.ionSpecies).toBe('B');
    expect(DEFAULT_PARAMS.beamEnergy).toBe(50);
    expect(DEFAULT_PARAMS.tiltAngle).toBe(7);
    expect(DEFAULT_PARAMS.totalSteps).toBe(200);
  });

  test('ION_DB has 4 species', () => {
    expect(Object.keys(ION_DB)).toHaveLength(4);
    expect(ION_DB.B.Z).toBe(5);
    expect(ION_DB.As.Z).toBe(33);
    expect(ION_DB.BF2.molecularMass).toBeGreaterThan(ION_DB.BF2.M);
  });

  test('MATERIAL_DB has 3 targets', () => {
    expect(Object.keys(MATERIAL_DB)).toHaveLength(3);
    expect(MATERIAL_DB.Si.crystalline).toBe(true);
    expect(MATERIAL_DB.SiO2.crystalline).toBe(false);
  });

  test('estimateMaxDepth returns reasonable range', () => {
    const dB = estimateMaxDepth('B', 50);
    expect(dB).toBeGreaterThan(100);
    expect(dB).toBeLessThan(2000);
    const dAs = estimateMaxDepth('As', 50);
    expect(dAs).toBeLessThan(dB); // heavier ion, shallower
  });

  test('mulberry32 produces deterministic sequence', () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);
    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());
    expect(seq1).toEqual(seq2);
    seq1.forEach(v => { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1); });
  });
});
