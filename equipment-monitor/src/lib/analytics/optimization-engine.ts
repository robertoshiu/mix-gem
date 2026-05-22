import type {
  ObjectiveId, ParetoPoint, RsmFit, SensitivityBar, ConstraintSet,
} from './types';
import { DEFAULT_RECIPE_KNOBS, STEP_SHORT_NAMES, mulberry32 } from './constants';

export function evaluateObjectives(recipe: number[]): Record<ObjectiveId, number> {
  const norm = recipe.map((v, i) => {
    const knob = DEFAULT_RECIPE_KNOBS[i];
    return (v - knob.min) / (knob.max - knob.min || 1);
  });
  const avgNorm = norm.reduce((s, v) => s + v, 0) / norm.length;
  const yieldPenalty = norm.reduce((s, v) => s + (v - 0.5) ** 2, 0);
  const yieldVal = Math.max(0, Math.min(100, 96 - yieldPenalty * 12));
  const throughput = Math.max(0, Math.min(80, 30 + avgNorm * 40 + norm[1] * 10));
  const cost = Math.max(50, Math.min(250, 80 + avgNorm * 100 + norm[4] * 20));
  const defectDensity = Math.max(0.01, Math.min(2, 0.1 + yieldPenalty * 0.6));
  return { yield: yieldVal, throughput, cost, defectDensity };
}

export function generateParetoFrontier(
  objectiveIds: ObjectiveId[],
  constraints: ConstraintSet,
  gridPoints = 50,
): ParetoPoint[] {
  const rng = mulberry32(12345);
  const points: ParetoPoint[] = [];
  for (let i = 0; i < gridPoints; i++) {
    const recipe = DEFAULT_RECIPE_KNOBS.map((k) => k.min + rng() * (k.max - k.min));
    const objectives = evaluateObjectives(recipe);
    const { feasible } = checkConstraints(objectives, constraints);
    if (!feasible) continue;
    points.push({ objectives, recipe, dominated: false });
  }
  const [id1, id2] = objectiveIds;
  const dir1 = id1 === 'cost' || id1 === 'defectDensity' ? -1 : 1;
  const dir2 = id2 === 'cost' || id2 === 'defectDensity' ? -1 : 1;
  for (let i = 0; i < points.length; i++) {
    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      const a = points[j].objectives;
      const b = points[i].objectives;
      const better1 = (a[id1] - b[id1]) * dir1 >= 0;
      const better2 = (a[id2] - b[id2]) * dir2 >= 0;
      const strict1 = (a[id1] - b[id1]) * dir1 > 0;
      const strict2 = (a[id2] - b[id2]) * dir2 > 0;
      if (better1 && better2 && (strict1 || strict2)) {
        points[i].dominated = true;
        break;
      }
    }
  }
  return points;
}

export function fitResponseSurface(
  samples: { inputs: number[]; output: number }[],
): RsmFit {
  const n = samples.length;
  const p = 6;
  const X = samples.map((s) => {
    const [x1, x2] = s.inputs;
    return [1, x1, x2, x1 * x1, x2 * x2, x1 * x2];
  });
  const y = samples.map((s) => s.output);
  const XtX = Array.from({ length: p }, (_, i) =>
    Array.from({ length: p }, (_, j) =>
      X.reduce((s, row) => s + row[i] * row[j], 0),
    ),
  );
  const Xty = Array.from({ length: p }, (_, i) =>
    X.reduce((s, row, k) => s + row[i] * y[k], 0),
  );
  const aug = XtX.map((row, i) => [...row, Xty[i]]);
  for (let col = 0; col < p; col++) {
    let maxRow = col;
    for (let row = col + 1; row < p; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-12) continue;
    for (let j = col; j <= p; j++) aug[col][j] /= pivot;
    for (let row = 0; row < p; row++) {
      if (row === col) continue;
      const factor = aug[row][col];
      for (let j = col; j <= p; j++) aug[row][j] -= factor * aug[col][j];
    }
  }
  const coefficients = aug.map((row) => row[p]);
  const yMean = y.reduce((s, v) => s + v, 0) / n;
  const ssTot = y.reduce((s, v) => s + (v - yMean) ** 2, 0);
  const ssRes = samples.reduce((s, sample, k) => {
    const predicted = X[k].reduce((sum, xi, j) => sum + xi * coefficients[j], 0);
    return s + (sample.output - predicted) ** 2;
  }, 0);
  const rSquared = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  return { coefficients, rSquared };
}

export function evaluateRSM(
  coefficients: number[],
  x1Range: [number, number],
  x2Range: [number, number],
  gridSize = 50,
): number[][] {
  const [x1Min, x1Max] = x1Range;
  const [x2Min, x2Max] = x2Range;
  const dx1 = (x1Max - x1Min) / Math.max(1, gridSize - 1);
  const dx2 = (x2Max - x2Min) / Math.max(1, gridSize - 1);
  return Array.from({ length: gridSize }, (_, i) => {
    const x1 = x1Min + i * dx1;
    return Array.from({ length: gridSize }, (_, j) => {
      const x2 = x2Min + j * dx2;
      const [b0 = 0, b1 = 0, b2 = 0, b11 = 0, b22 = 0, b12 = 0] = coefficients;
      return b0 + b1 * x1 + b2 * x2 + b11 * x1 * x1 + b22 * x2 * x2 + b12 * x1 * x2;
    });
  });
}

export function computeSensitivity(
  baseRecipe: number[],
  objective: ObjectiveId,
  perturbation = 0.1,
): SensitivityBar[] {
  const bars: SensitivityBar[] = DEFAULT_RECIPE_KNOBS.map((knob, i) => {
    const delta = (knob.max - knob.min) * perturbation;
    const recipeUp = [...baseRecipe];
    recipeUp[i] = Math.min(knob.max, baseRecipe[i] + delta);
    const recipeDown = [...baseRecipe];
    recipeDown[i] = Math.max(knob.min, baseRecipe[i] - delta);
    const valUp = evaluateObjectives(recipeUp)[objective];
    const valDown = evaluateObjectives(recipeDown)[objective];
    const impact = (valUp - valDown) / 2;
    return { stepId: knob.stepId, label: `${STEP_SHORT_NAMES[knob.stepId]} ${knob.label}`, impact };
  });
  bars.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  return bars;
}

export function checkConstraints(
  objectives: Record<ObjectiveId, number>,
  constraints: ConstraintSet,
): { feasible: boolean; violations: string[] } {
  const violations: string[] = [];
  if (constraints.minYield != null && objectives.yield < constraints.minYield) violations.push('yield');
  if (constraints.maxD0 != null && objectives.defectDensity > constraints.maxD0) violations.push('defectDensity');
  if (constraints.minThroughput != null && objectives.throughput < constraints.minThroughput) violations.push('throughput');
  if (constraints.maxCost != null && objectives.cost > constraints.maxCost) violations.push('cost');
  return { feasible: violations.length === 0, violations };
}
