import {
  evaluateObjectives,
  generateParetoFrontier,
  fitResponseSurface,
  evaluateRSM,
  computeSensitivity,
  checkConstraints,
} from '../optimization-engine';
import { DEFAULT_RECIPE_KNOBS, DEFAULT_CONSTRAINTS } from '../constants';

describe('evaluateObjectives', () => {
  test('returns all four objective values', () => {
    const recipe = DEFAULT_RECIPE_KNOBS.map((k) => k.value);
    const obj = evaluateObjectives(recipe);
    expect(obj).toHaveProperty('yield');
    expect(obj).toHaveProperty('throughput');
    expect(obj).toHaveProperty('cost');
    expect(obj).toHaveProperty('defectDensity');
  });

  test('yield is between 0 and 100', () => {
    const recipe = DEFAULT_RECIPE_KNOBS.map((k) => k.value);
    const obj = evaluateObjectives(recipe);
    expect(obj.yield).toBeGreaterThanOrEqual(0);
    expect(obj.yield).toBeLessThanOrEqual(100);
  });

  test('different recipes give different results', () => {
    const r1 = DEFAULT_RECIPE_KNOBS.map((k) => k.min);
    const r2 = DEFAULT_RECIPE_KNOBS.map((k) => k.max);
    const o1 = evaluateObjectives(r1);
    const o2 = evaluateObjectives(r2);
    expect(o1.throughput).not.toBe(o2.throughput);
  });
});

describe('generateParetoFrontier', () => {
  test('returns non-empty frontier', () => {
    const frontier = generateParetoFrontier(['yield', 'throughput'], DEFAULT_CONSTRAINTS, 50);
    expect(frontier.length).toBeGreaterThan(0);
  });

  test('non-dominated points dominate no other non-dominated point', () => {
    const frontier = generateParetoFrontier(['yield', 'cost'], DEFAULT_CONSTRAINTS, 30);
    const nonDom = frontier.filter((p) => !p.dominated);
    for (const a of nonDom) {
      for (const b of nonDom) {
        if (a === b) continue;
        const aDomB = a.objectives.yield >= b.objectives.yield && a.objectives.cost <= b.objectives.cost
          && (a.objectives.yield > b.objectives.yield || a.objectives.cost < b.objectives.cost);
        expect(aDomB).toBe(false);
      }
    }
  });
});

describe('fitResponseSurface', () => {
  test('fits quadratic data with high R²', () => {
    const samples = [];
    for (let x1 = 0; x1 <= 1; x1 += 0.2) {
      for (let x2 = 0; x2 <= 1; x2 += 0.2) {
        samples.push({ inputs: [x1, x2], output: 2 * x1 * x1 + 3 * x2 + 1 });
      }
    }
    const fit = fitResponseSurface(samples);
    expect(fit.rSquared).toBeGreaterThan(0.95);
  });
});

describe('evaluateRSM', () => {
  test('returns grid of correct dimensions', () => {
    const coefficients = [1, 2, 3, 0.1, 0.2, 0.05];
    const grid = evaluateRSM(coefficients, [0, 1], [0, 1], 10);
    expect(grid).toHaveLength(10);
    expect(grid[0]).toHaveLength(10);
  });
});

describe('computeSensitivity', () => {
  test('returns one entry per recipe knob', () => {
    const recipe = DEFAULT_RECIPE_KNOBS.map((k) => k.value);
    const sens = computeSensitivity(recipe, 'yield', 0.1);
    expect(sens).toHaveLength(8);
  });

  test('entries are sorted by absolute impact', () => {
    const recipe = DEFAULT_RECIPE_KNOBS.map((k) => k.value);
    const sens = computeSensitivity(recipe, 'yield', 0.1);
    for (let i = 1; i < sens.length; i++) {
      expect(Math.abs(sens[i - 1].impact)).toBeGreaterThanOrEqual(Math.abs(sens[i].impact));
    }
  });
});

describe('checkConstraints', () => {
  test('all constraints met returns feasible=true', () => {
    const objectives = { yield: 90, throughput: 50, cost: 120, defectDensity: 0.3 };
    const result = checkConstraints(objectives, DEFAULT_CONSTRAINTS);
    expect(result.feasible).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  test('yield below minimum returns violation', () => {
    const objectives = { yield: 70, throughput: 50, cost: 120, defectDensity: 0.3 };
    const result = checkConstraints(objectives, { minYield: 85 });
    expect(result.feasible).toBe(false);
    expect(result.violations).toContain('yield');
  });
});
