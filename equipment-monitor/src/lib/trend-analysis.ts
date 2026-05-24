import type { CUSUMResult, EWMAResult, TrendSignal } from './mes-types';

// ============================================================
// CUSUM — Cumulative Sum Control Chart
// ============================================================

/**
 * Calculate CUSUM statistics for process mean shift detection.
 *
 * CUSUM+ detects upward shifts; CUSUM- detects downward shifts.
 * Each array is prefixed with 0 (starting point before any measurement),
 * so they have length = values.length + 1.
 *
 * @param values  Measurement values
 * @param target  Process target (center line)
 * @param sigma   Process standard deviation
 * @param k       Allowable slack (default: 0.5 * sigma)
 * @param h       Decision interval / threshold (default: 4 * sigma)
 */
export function calculateCUSUM(
  values: number[],
  target: number,
  sigma: number,
  k: number = 0.5 * sigma,
  h: number = 4 * sigma,
): CUSUMResult {
  const n = values.length;
  const cusumPos: number[] = [0];
  const cusumNeg: number[] = [0];

  for (let i = 0; i < n; i++) {
    const deviationPos = values[i] - target - k;
    const deviationNeg = target - values[i] - k;

    cusumPos.push(Math.max(0, cusumPos[i] + deviationPos));
    cusumNeg.push(Math.max(0, cusumNeg[i] + deviationNeg));
  }

  return { cusumPos, cusumNeg, k, h };
}

/**
 * Detect the first CUSUM signal where either CUSUM+ or CUSUM- exceeds h.
 *
 * Returns the signal (with value index) or null if no crossing.
 * Preference: whichever direction crosses first.
 */
export function detectCUSUMSignal(result: CUSUMResult): TrendSignal | null {
  const { cusumPos, cusumNeg, h } = result;

  // Start from index 1 (cusumPos[0] is initialization, not a measurement)
  for (let i = 1; i < cusumPos.length; i++) {
    if (cusumPos[i] > h) {
      return { signal: true, index: i - 1, direction: 'up' };
    }
    if (cusumNeg[i] > h) {
      return { signal: true, index: i - 1, direction: 'down' };
    }
  }

  return null;
}

// ============================================================
// EWMA — Exponentially Weighted Moving Average
// ============================================================

/**
 * Calculate EWMA values and control limits for detecting small persistent shifts.
 *
 * Uses time-varying control limits for early points that gradually approach
 * the asymptotic steady-state limits.
 *
 * @param values       Measurement values
 * @param lambda       Smoothing constant (default: 0.2)
 * @param target       Process target
 * @param sigma        Process standard deviation
 * @param initialValue Starting EWMA value (defaults to target)
 */
export function calculateEWMA(
  values: number[],
  lambda: number = 0.2,
  target: number,
  sigma: number,
  initialValue?: number,
): EWMAResult {
  const n = values.length;
  if (n === 0) {
    return { ewmaValues: [], ucl: [], lcl: [], lambda };
  }

  const ewmaValues: number[] = new Array(n);
  const ucl: number[] = new Array(n);
  const lcl: number[] = new Array(n);

  const start = initialValue ?? target;
  const asympFactor = lambda / (2 - lambda); // asymptotic variance factor
  const L = 3; // control limit multiplier (3 sigma for EWMA)

  for (let i = 0; i < n; i++) {
    // EWMA statistic
    if (i === 0) {
      ewmaValues[i] = lambda * values[i] + (1 - lambda) * start;
    } else {
      ewmaValues[i] = lambda * values[i] + (1 - lambda) * ewmaValues[i - 1];
    }

    // Time-varying control limit factor:
    // factor(i) = lambda/(2-lambda) * (1 - (1-lambda)^(2*(i+1)))
    const decay = Math.pow(1 - lambda, 2 * (i + 1));
    const factor = asympFactor * (1 - decay);
    const limit = L * sigma * Math.sqrt(factor);

    ucl[i] = target + limit;
    lcl[i] = target - limit;
  }

  return { ewmaValues, ucl, lcl, lambda };
}

/**
 * Detect the first EWMA signal where the smoothed value breaches
 * the corresponding control limit.
 */
export function detectEWMASignal(result: EWMAResult): TrendSignal | null {
  const { ewmaValues, ucl, lcl } = result;

  for (let i = 0; i < ewmaValues.length; i++) {
    if (ewmaValues[i] > ucl[i]) {
      return { signal: true, index: i, direction: 'up' };
    }
    if (ewmaValues[i] < lcl[i]) {
      return { signal: true, index: i, direction: 'down' };
    }
  }

  return null;
}
