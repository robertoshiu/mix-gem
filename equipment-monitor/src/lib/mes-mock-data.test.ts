import { MOCK_LOTS, MOCK_RECIPES, generateSeedMeasurements } from './mes-mock-data';
import { evaluateSpc } from './spc-engine';
import { SPC_PARAMETERS, SPC_PARAM_KEYS } from './spc-parameters';

describe('MOCK_LOTS', () => {
  it('contains 3 lots', () => {
    expect(MOCK_LOTS).toHaveLength(3);
  });

  it('first lot is in_process', () => {
    expect(MOCK_LOTS[0].status).toBe('in_process');
  });

  it('all lots have valid recipeId', () => {
    const recipeIds = MOCK_RECIPES.map((r) => r.id);
    MOCK_LOTS.forEach((lot) => {
      expect(recipeIds).toContain(lot.recipeId);
    });
  });
});

describe('MOCK_RECIPES', () => {
  it('contains 3 recipes', () => {
    expect(MOCK_RECIPES).toHaveLength(3);
  });
});

describe('generateSeedMeasurements', () => {
  it('generates 10 measurements for a lot', () => {
    const measurements = generateSeedMeasurements('LOT-2026-001', 10);
    expect(measurements).toHaveLength(10);
  });

  it('wafer numbers are sequential starting at 1', () => {
    const measurements = generateSeedMeasurements('LOT-2026-001', 5);
    expect(measurements.map((m) => m.waferNumber)).toEqual([1, 2, 3, 4, 5]);
  });

  it('all CD values are within UCL/LCL', () => {
    const { ucl, lcl } = SPC_PARAMETERS.cd;
    const measurements = generateSeedMeasurements('LOT-2026-001', 20);
    measurements.forEach((m) => {
      expect(m.cd).toBeGreaterThan(lcl);
      expect(m.cd).toBeLessThan(ucl);
    });
  });

  it('starts with an in-control SPC baseline', () => {
    const measurements = generateSeedMeasurements('LOT-2026-001', 10);
    SPC_PARAM_KEYS.forEach((param) => {
      expect(evaluateSpc(measurements, param)).toBeNull();
    });
  });
});
