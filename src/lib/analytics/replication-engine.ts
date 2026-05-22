import type {
  FabId, TostResult, TransferFit, DistributionCurvePoint, ReplicationParam,
} from './types';
import { mulberry32, hashCode, FAB_CONFIGS, FAB_IDS, REPLICATION_PARAMS } from './constants';

function gaussianNoise(rng: () => number): number {
  const u1 = rng();
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1 || 1e-10)) * Math.cos(2 * Math.PI * u2);
}

export function generateFabData(
  fabId: FabId,
  parameter: ReplicationParam,
  sampleSize: number,
  bias: number,
  spreadFactor: number,
  seed: number,
): number[] {
  const paramDef = REPLICATION_PARAMS.find((p) => p.id === parameter)!;
  const target = paramDef.target;
  const baseSpread = (paramDef.usl - paramDef.lsl) / 6;
  const sigma = baseSpread * spreadFactor;
  const mean = target * (1 + bias);
  const rng = mulberry32(seed + hashCode(fabId + parameter));
  return Array.from({ length: sampleSize }, (_, i) => {
    let driftBias = 0;
    if (fabId === 'new-build' && i < sampleSize * 0.4) {
      driftBias = target * 0.02;
    }
    return mean + driftBias + gaussianNoise(rng) * sigma;
  });
}

export function tostEquivalence(
  sample1: number[],
  sample2: number[],
  margin: number,
  confidence: number,
): TostResult {
  const n1 = sample1.length;
  const n2 = sample2.length;
  const mean1 = sample1.reduce((s, v) => s + v, 0) / n1;
  const mean2 = sample2.reduce((s, v) => s + v, 0) / n2;
  const meanDiff = mean2 - mean1;
  const var1 = sample1.reduce((s, v) => s + (v - mean1) ** 2, 0) / (n1 - 1);
  const var2 = sample2.reduce((s, v) => s + (v - mean2) ** 2, 0) / (n2 - 1);
  const se = Math.sqrt(var1 / n1 + var2 / n2);
  const alpha = 1 - confidence;
  const zMap: Record<number, number> = { 0.1: 1.282, 0.05: 1.645, 0.01: 2.326 };
  const z = zMap[alpha] ?? 1.645;
  const ciLower = meanDiff - z * se;
  const ciUpper = meanDiff + z * se;
  const pass = ciLower > -margin && ciUpper < margin;
  return {
    fab1: 'hq',
    fab2: 'satellite',
    meanDiff,
    ciLower,
    ciUpper,
    equivalenceLower: -margin,
    equivalenceUpper: margin,
    pass,
  };
}

export function computeCpk(samples: number[], usl: number, lsl: number): number {
  const n = samples.length;
  const mean = samples.reduce((s, v) => s + v, 0) / n;
  const sigma = Math.sqrt(samples.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1));
  if (sigma === 0) return Infinity;
  return Math.min((usl - mean) / (3 * sigma), (mean - lsl) / (3 * sigma));
}

export function fitTransferFunction(
  xData: number[],
  yData: number[],
  order: 1 | 2,
): TransferFit {
  const n = xData.length;
  const p = order + 1;
  const X = xData.map((x) => {
    const row = [1, x];
    if (order === 2) row.push(x * x);
    return row;
  });
  const XtX = Array.from({ length: p }, (_, i) =>
    Array.from({ length: p }, (_, j) =>
      X.reduce((s, row) => s + row[i] * row[j], 0),
    ),
  );
  const Xty = Array.from({ length: p }, (_, i) =>
    X.reduce((s, row, k) => s + row[i] * yData[k], 0),
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
      const f = aug[row][col];
      for (let j = col; j <= p; j++) aug[row][j] -= f * aug[col][j];
    }
  }
  const coefficients = aug.map((row) => row[p]);
  const yMean = yData.reduce((s, v) => s + v, 0) / n;
  const ssTot = yData.reduce((s, v) => s + (v - yMean) ** 2, 0);
  const ssRes = xData.reduce((s, x, k) => {
    const pred = X[k].reduce((sum, xi, j) => sum + xi * coefficients[j], 0);
    return s + (yData[k] - pred) ** 2;
  }, 0);
  const rSquared = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  const xMean = xData.reduce((s, v) => s + v, 0) / n;
  const yPred = coefficients[0] + coefficients[1] * xMean + (order === 2 ? coefficients[2] * xMean * xMean : 0);
  const bias = yPred - xMean;
  return { fromFab: 'hq' as FabId, toFab: 'satellite' as FabId, coefficients, rSquared, bias };
}

export function generateDistributionCurve(
  mean: number,
  std: number,
  points = 200,
): DistributionCurvePoint[] {
  const xMin = mean - 4 * std;
  const xMax = mean + 4 * std;
  const dx = (xMax - xMin) / Math.max(1, points - 1);
  const coeff = 1 / (std * Math.sqrt(2 * Math.PI));
  return Array.from({ length: points }, (_, i) => {
    const x = xMin + i * dx;
    const z = (x - mean) / std;
    return { x, pdf: coeff * Math.exp(-0.5 * z * z) };
  });
}

export function generateFabComparison(
  parameter: ReplicationParam,
  config: { sampleSize: number; confidence: number; margin: number },
): {
  fabData: Map<FabId, number[]>;
  tostResults: TostResult[];
  transferFits: TransferFit[];
} {
  const fabData = new Map<FabId, number[]>();
  for (const fabId of FAB_IDS) {
    const fabCfg = FAB_CONFIGS[fabId];
    fabData.set(fabId, generateFabData(
      fabId, parameter, config.sampleSize,
      fabCfg.bias, fabCfg.spreadFactor, 42,
    ));
  }
  const pairs: [FabId, FabId][] = [['hq', 'satellite'], ['hq', 'new-build'], ['satellite', 'new-build']];
  const tostResults = pairs.map(([f1, f2]) => {
    const result = tostEquivalence(
      fabData.get(f1)!, fabData.get(f2)!,
      config.margin, config.confidence,
    );
    return { ...result, fab1: f1, fab2: f2 };
  });
  const hqData = fabData.get('hq')!;
  const transferFits: TransferFit[] = (['satellite', 'new-build'] as FabId[]).map((toFab) => {
    const toData = fabData.get(toFab)!;
    const minLen = Math.min(hqData.length, toData.length);
    const fit = fitTransferFunction(hqData.slice(0, minLen), toData.slice(0, minLen), 1);
    return { ...fit, fromFab: 'hq' as FabId, toFab };
  });
  return { fabData, tostResults, transferFits };
}
