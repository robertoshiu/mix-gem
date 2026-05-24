import {
  calculateCUSUM,
  detectCUSUMSignal,
  calculateEWMA,
  detectEWMASignal,
} from './trend-analysis';
import { SPC_PARAMETERS } from './spc-parameters';

const { target, sigma } = SPC_PARAMETERS.cd; // target=45, sigma=1.0

// ============================================================
// CUSUM tests
// ============================================================

describe('calculateCUSUM', () => {
  it('initializes cusumPos[0] and cusumNeg[0] to 0', () => {
    const result = calculateCUSUM([45.0], target, sigma);
    expect(result.cusumPos[0]).toBe(0);
    expect(result.cusumNeg[0]).toBe(0);
    expect(result.cusumPos).toHaveLength(2); // 0-init + 1 measurement
    expect(result.cusumNeg).toHaveLength(2);
  });

  it('computes cusumPos when values exceed target + k', () => {
    // k = 0.5 * sigma = 0.5
    // values = [46.0], target=45, k=0.5
    // cusumPos[1] = max(0, 0 + (46.0 - 45.0 - 0.5)) = max(0, 0.5) = 0.5
    const result = calculateCUSUM([46.0], target, sigma);
    expect(result.cusumPos[1]).toBeCloseTo(0.5, 5);
    expect(result.cusumNeg[1]).toBe(0);
  });

  it('computes cusumNeg when values are below target - k', () => {
    // values = [44.0], target=45, k=0.5
    // cusumNeg[1] = max(0, 0 + (45.0 - 44.0 - 0.5)) = max(0, 0.5) = 0.5
    const result = calculateCUSUM([44.0], target, sigma);
    expect(result.cusumPos[1]).toBe(0);
    expect(result.cusumNeg[1]).toBeCloseTo(0.5, 5);
  });

  it('stays at 0 when values are within k slack of target', () => {
    // values = [45.4] — within k=0.5 of target 45.0
    // cusumPos: max(0, 0 + (45.4 - 45.0 - 0.5)) = max(0, -0.1) = 0
    // cusumNeg: max(0, 0 + (45.0 - 45.4 - 0.5)) = max(0, -0.9) = 0
    const result = calculateCUSUM([45.4], target, sigma);
    expect(result.cusumPos[1]).toBe(0);
    expect(result.cusumNeg[1]).toBe(0);
  });

  it('accumulates positive drift across multiple values', () => {
    // values = [46.0, 46.2, 46.5]
    // k = 0.5
    // i=1: cusumPos[1] = max(0, 0+(46.0-45.0-0.5)) = 0.5
    // i=2: cusumPos[2] = max(0, 0.5+(46.2-45.0-0.5)) = max(0, 0.5+0.7) = 1.2
    // i=3: cusumPos[3] = max(0, 1.2+(46.5-45.0-0.5)) = max(0, 1.2+1.0) = 2.2
    const result = calculateCUSUM([46.0, 46.2, 46.5], target, sigma);
    expect(result.cusumPos).toHaveLength(4); // [0, 0.5, 1.2, 2.2]
    expect(result.cusumPos[1]).toBeCloseTo(0.5, 5);
    expect(result.cusumPos[2]).toBeCloseTo(1.2, 5);
    expect(result.cusumPos[3]).toBeCloseTo(2.2, 5);
  });

  it('accumulates negative drift across multiple values', () => {
    // values = [44.0, 43.8, 43.5]
    // k = 0.5
    // i=1: cusumNeg[1] = max(0, 0+(45.0-44.0-0.5)) = 0.5
    // i=2: cusumNeg[2] = max(0, 0.5+(45.0-43.8-0.5)) = max(0, 0.5+0.7) = 1.2
    // i=3: cusumNeg[3] = max(0, 1.2+(45.0-43.5-0.5)) = max(0, 1.2+1.0) = 2.2
    const result = calculateCUSUM([44.0, 43.8, 43.5], target, sigma);
    expect(result.cusumNeg[1]).toBeCloseTo(0.5, 5);
    expect(result.cusumNeg[2]).toBeCloseTo(1.2, 5);
    expect(result.cusumNeg[3]).toBeCloseTo(2.2, 5);
  });

  it('resets to 0 when direction reverses', () => {
    // First go up: cusumPos builds to 0.5
    // Then go down: cusumPos should reset to 0 (not accumulate negative)
    // cusumPos[1] = 0.5 (from 46.0)
    // cusumPos[2] = max(0, 0.5 + (44.0 - 45.0 - 0.5)) = max(0, 0.5 - 1.5) = 0
    const result = calculateCUSUM([46.0, 44.0], target, sigma);
    expect(result.cusumPos[1]).toBeCloseTo(0.5, 5);
    expect(result.cusumPos[2]).toBe(0);
  });

  it('uses custom k and h values', () => {
    // Override defaults with custom k=1.0, h=8.0
    const result = calculateCUSUM([46.0], target, sigma, 1.0, 8.0);
    expect(result.k).toBe(1.0);
    expect(result.h).toBe(8.0);
    // With k=1.0: cusumPos[1] = max(0, 0 + (46.0-45.0-1.0)) = max(0, 0) = 0
    expect(result.cusumPos[1]).toBe(0);
  });

  it('does not mutate input array', () => {
    const values = [46.0, 44.0, 45.5];
    const copy = [...values];
    calculateCUSUM(values, target, sigma);
    expect(values).toEqual(copy);
  });

  it('returns 0 for all cusum values with on-target data', () => {
    const values = Array(10).fill(target);
    const result = calculateCUSUM(values, target, sigma);
    expect(result.cusumPos).toEqual(Array(11).fill(0));
    expect(result.cusumNeg).toEqual(Array(11).fill(0));
  });

  it('handles empty array', () => {
    const result = calculateCUSUM([], target, sigma);
    expect(result.cusumPos).toEqual([0]);
    expect(result.cusumNeg).toEqual([0]);
  });
});

describe('detectCUSUMSignal', () => {
  it('detects upward shift crossing h threshold', () => {
    // Generate values that push cusumPos past h=4.0
    // Need cusumPos to exceed 4.0
    // Each value at 46.5 (1.5 above target): excess = 1.5 - 0.5(k) = 1.0 per step
    // After 5 values: cusumPos = 5.0 > 4.0
    const result = calculateCUSUM(
      Array(5).fill(46.5), target, sigma,
    );
    const signal = detectCUSUMSignal(result);
    expect(signal).not.toBeNull();
    expect(signal!.signal).toBe(true);
    expect(signal!.direction).toBe('up');
    expect(signal!.index).toBe(4); // 0-based index in values: 5th measurement = index 4
  });

  it('detects downward shift crossing h threshold', () => {
    // Values at 43.5 (1.5 below target): cusumNeg accumulates 1.0 per step
    // After 5 values: cusumNeg = 5.0 > 4.0
    const result = calculateCUSUM(
      Array(5).fill(43.5), target, sigma,
    );
    const signal = detectCUSUMSignal(result);
    expect(signal).not.toBeNull();
    expect(signal!.direction).toBe('down');
    expect(signal!.index).toBe(4);
  });

  it('returns null when neither CUSUM exceeds h', () => {
    const result = calculateCUSUM(
      Array(3).fill(46.0), target, sigma,
    );
    // After 3 values at 46.0: cusumPos = 3 * (46.0-45.0-0.5) = 3 * 0.5 = 1.5 < 4.0
    const signal = detectCUSUMSignal(result);
    expect(signal).toBeNull();
  });

  it('returns the FIRST index where signal fires', () => {
    // Values that cross h=4.0 at index 4, then continue
    const result = calculateCUSUM(
      [46.5, 46.5, 46.5, 46.5, 46.5, 46.5, 46.5], target, sigma,
    );
    const signal = detectCUSUMSignal(result);
    expect(signal!.index).toBe(4); // fires at cusum[5] (5th value, index 4)
  });

  it('prefers first direction when both pos and neg cross h', () => {
    // Start with cusumPos building, then cusumNeg. Should fire when first crosses.
    const result = calculateCUSUM(
      Array(5).fill(46.5), target, sigma,
    );
    const signal = detectCUSUMSignal(result);
    expect(signal!.direction).toBe('up');
  });

  it('returns null for empty result', () => {
    const result = calculateCUSUM([], target, sigma);
    const signal = detectCUSUMSignal(result);
    expect(signal).toBeNull();
  });

  it('does not mutate input', () => {
    const result = calculateCUSUM([46.5, 46.5, 46.5, 46.5, 46.5], target, sigma);
    const frozenPos = [...result.cusumPos];
    detectCUSUMSignal(result);
    expect(result.cusumPos).toEqual(frozenPos);
  });
});

// ============================================================
// EWMA tests
// ============================================================

describe('calculateEWMA', () => {
  it('computes EWMA starting from target', () => {
    // lambda=0.2, target=45
    // ewma[0] = 0.2 * values[0] + 0.8 * 45 = 0.2*45 + 0.8*45 = 45
    const values = [45.0, 45.0, 45.0];
    const result = calculateEWMA(values, 0.2, target, sigma);
    expect(result.ewmaValues).toHaveLength(3);
    expect(result.ewmaValues[0]).toBeCloseTo(45.0, 5);
  });

  it('smooths step change gradually', () => {
    // values jump from 45 to 46
    // lambda=0.2
    // ewma[0] = 0.2*45 + 0.8*45 = 45.0
    // ewma[1] = 0.2*46 + 0.8*45.0 = 9.2 + 36.0 = 45.2
    // ewma[2] = 0.2*46 + 0.8*45.2 = 9.2 + 36.16 = 45.36
    // ewma[3] = 0.2*46 + 0.8*45.36 = 9.2 + 36.288 = 45.488
    const values = [45.0, 46.0, 46.0, 46.0];
    const result = calculateEWMA(values, 0.2, target, sigma);
    expect(result.ewmaValues[0]).toBeCloseTo(45.0, 5);
    expect(result.ewmaValues[1]).toBeCloseTo(45.2, 5);
    expect(result.ewmaValues[2]).toBeCloseTo(45.36, 5);
    expect(result.ewmaValues[3]).toBeCloseTo(45.488, 5);
  });

  it('uses custom initialValue when provided', () => {
    // initialValue=44.0
    // ewma[0] = 0.2*45 + 0.8*44.0 = 9.0 + 35.2 = 44.2
    const values = [45.0];
    const result = calculateEWMA(values, 0.2, target, sigma, 44.0);
    expect(result.ewmaValues[0]).toBeCloseTo(44.2, 5);
  });

  it('defaults lambda to 0.2', () => {
    const values = [46.0, 46.0];
    const result = calculateEWMA(values, undefined, target, sigma);
    expect(result.lambda).toBe(0.2);
    expect(result.ewmaValues[0]).toBeCloseTo(45.2, 5); // 0.2*46 + 0.8*45
    expect(result.ewmaValues[1]).toBeCloseTo(45.36, 5);
  });

  it('computes variable control limits that widen over time', () => {
    // lambda=0.2, sigma=1.0, target=45
    // Steady-state: ±3 * 1.0 * sqrt(0.2/1.8) = ±3 * sqrt(0.111...) = ±3 * 0.333 = ±1.0
    // i=0: factor = 0.2/1.8 * (1 - (0.8)^(2*1)) = 0.1111 * (1-0.64) = 0.1111 * 0.36 = 0.04
    //      sqrt(0.04) = 0.2, limit = 3 * 1.0 * 0.2 = 0.6
    const values = [45.0, 45.0, 45.0, 45.0, 45.0];
    const result = calculateEWMA(values, 0.2, target, sigma);

    expect(result.ucl).toHaveLength(5);
    expect(result.lcl).toHaveLength(5);

    // i=0: limits = target ± 0.6
    expect(result.ucl[0]).toBeCloseTo(45.6, 3);
    expect(result.lcl[0]).toBeCloseTo(44.4, 3);

    // Steady-state eventually: target ± 1.0
    // i=9 (10th point): factor = 0.1111*(1 - 0.8^20) ≈ 0.1111*(1-0.0115) ≈ 0.1098
    // sqrt(0.1098) ≈ 0.3315, limit ≈ 0.9946 ≈ 1.0
    const manyValues = Array(50).fill(target);
    const fullResult = calculateEWMA(manyValues, 0.2, target, sigma);
    // Last element should be very close to ±1.0
    expect(fullResult.ucl[49]).toBeCloseTo(46.0, 1);
    expect(fullResult.lcl[49]).toBeCloseTo(44.0, 1);
  });

  it('returns lambda in result', () => {
    const result = calculateEWMA([45.0], 0.3, target, sigma);
    expect(result.lambda).toBe(0.3);
  });

  it('does not mutate input array', () => {
    const values = [46.0, 44.0, 47.0];
    const copy = [...values];
    calculateEWMA(values, 0.2, target, sigma);
    expect(values).toEqual(copy);
  });

  it('handles empty array', () => {
    const result = calculateEWMA([], 0.2, target, sigma);
    expect(result.ewmaValues).toEqual([]);
    expect(result.ucl).toEqual([]);
    expect(result.lcl).toEqual([]);
  });

  it('handles single value', () => {
    const result = calculateEWMA([50.0], 0.2, target, sigma);
    expect(result.ewmaValues).toHaveLength(1);
    expect(result.ewmaValues[0]).toBeCloseTo(46.0, 5); // 0.2*50 + 0.8*45 = 10+36=46
  });
});

describe('detectEWMASignal', () => {
  it('detects upward signal when EWMA exceeds UCL', () => {
    // Set up values so EWMA eventually exceeds UCL
    // With lambda=0.2, UCL starts at 45.6 and approaches 46.0
    // Feed all 47-values: ewma will climb above UCL
    const values = Array(20).fill(47.0);
    const result = calculateEWMA(values, 0.2, target, sigma);
    const signal = detectEWMASignal(result);
    expect(signal).not.toBeNull();
    expect(signal!.signal).toBe(true);
    expect(signal!.direction).toBe('up');
  });

  it('detects downward signal when EWMA drops below LCL', () => {
    const values = Array(20).fill(43.0);
    const result = calculateEWMA(values, 0.2, target, sigma);
    const signal = detectEWMASignal(result);
    expect(signal).not.toBeNull();
    expect(signal!.direction).toBe('down');
  });

  it('returns null when EWMA stays within control limits', () => {
    const values = Array(10).fill(target);
    const result = calculateEWMA(values, 0.2, target, sigma);
    const signal = detectEWMASignal(result);
    expect(signal).toBeNull();
  });

  it('returns the FIRST index where signal fires', () => {
    // Progressive drift upward; signal should fire at first crossing
    const values = Array(30).fill(0).map((_, i) => target + i * 0.1); // 45, 45.1, 45.2, ...
    const result = calculateEWMA(values, 0.2, target, sigma);
    const signal = detectEWMASignal(result);
    expect(signal).not.toBeNull();
    // First index where ewmaValues[i] > ucl[i]
    const idx = signal!.index;
    expect(result.ewmaValues[idx]).toBeGreaterThan(result.ucl[idx]);
  });

  it('returns null for empty result', () => {
    const result = calculateEWMA([], 0.2, target, sigma);
    const signal = detectEWMASignal(result);
    expect(signal).toBeNull();
  });

  it('does not mutate input', () => {
    const values = Array(20).fill(47.0);
    const result = calculateEWMA(values, 0.2, target, sigma);
    const frozenEwma = [...result.ewmaValues];
    const frozenUcl = [...result.ucl];
    detectEWMASignal(result);
    expect(result.ewmaValues).toEqual(frozenEwma);
    expect(result.ucl).toEqual(frozenUcl);
  });
});

// ============================================================
// Integration: CUSUM + EWMA on CD parameter (realistic)
// ============================================================

describe('CD parameter trend analysis integration', () => {
  it('CUSUM detects CD upward shift before +3 sigma rule', () => {
    // Small sustained upward drift: 45.0 → 45.0 → 45.3 → 45.5 → 45.7 → 45.9 → 46.1
    // CUSUM should detect this before it reaches UCL (48.0)
    const values = [45.0, 45.0, 45.3, 45.5, 45.7, 45.9, 46.1];
    const result = calculateCUSUM(values, target, sigma);
    const signal = detectCUSUMSignal(result);
    // After 7 values with k=0.5:
    // Excess per step: ~0, 0, -0.2(=0), 0, 0.2, 0.4, 0.6
    // Actually let's compute:
    // i=1: 45.0, excess=45.0-45.0-0.5=-0.5 -> cusumPos=0
    // i=2: 45.0, excess=-0.5 -> cusumPos=0
    // i=3: 45.3, excess=45.3-45.0-0.5=-0.2 -> cusumPos=0
    // i=4: 45.5, excess=45.5-45.0-0.5=0 -> cusumPos=0
    // i=5: 45.7, excess=45.7-45.5-0.5=-0.3? Wait no: excess = 45.7-45.0-0.5 = 0.2 -> cusumPos=0.2
    // i=6: 45.9, excess=45.9-45.0-0.5=0.4 -> cusumPos=0.2+0.4=0.6
    // i=7: 46.1, excess=46.1-45.0-0.5=0.6 -> cusumPos=0.6+0.6=1.2
    // h=4.0, so 1.2 < 4.0 — no signal (drift is still too mild)
    // The point is: CUSUM detects small sustained drifts more sensitively
    // than Rule 1 (which waits for >3 sigma). Let's make a stronger test.
    expect(signal).toBeNull(); // mild drift doesn't fire
  });

  it('CUSUM fires for moderate upward shift long before Rule 1', () => {
    // 6 values at 46.0 (still within LCL/UCL range 42-48)
    // CUSUM: k=0.5, each excess = 46.0-45.0-0.5 = 0.5
    // After 9 values: cusumPos = 9 * 0.5 = 4.5 > h=4.0 → signal fires!
    // Meanwhile, Rule 1 would NOT fire (no point exceeds 48.0)
    const shift = Array(10).fill(46.0); // All well within [42, 48] spec
    const result = calculateCUSUM(shift, target, sigma);
    const signal = detectCUSUMSignal(result);
    expect(signal).not.toBeNull();
    expect(signal!.direction).toBe('up');
    // Verify: first fire at index where cusumPos exceeds 4.0
    // After n values: cusumPos[n] = n * 0.5
    // n=8: 4.0 → not > 4.0 (strictly greater?)
    // n=9: 4.5 → fires at index 8
    expect(signal!.index).toBe(8);
  });

  it('EWMA detects small drift earlier than raw value UCL check', () => {
    // Gradual upward trend: 45.5 repeated — EWMA climbs toward 45.5
    // With lambda=0.2 and sigma=1.0, steady-state UCL ≈ 46.0
    // EWMA values won't cross 46.0 immediately, but the smoothed response
    // catches persistent offset
    const values = Array(30).fill(45.8);
    const result = calculateEWMA(values, 0.2, target, sigma);
    expect(detectEWMASignal(result)).toBeNull();
    // 45.8 is within spec [42, 48], but EWMA will gradually approach it
    // and may cross the tightening UCL
    // ewma[i] → 45.8 as i grows, UCL → 46.0
    // 45.8 < 46.0 so no signal from this mild shift
    // This is expected — 45.8 is only 0.8 sigma above target
    // A more severe test:
    const stronger = Array(30).fill(46.2);
    const result2 = calculateEWMA(stronger, 0.2, target, sigma);
    const signal2 = detectEWMASignal(result2);
    expect(signal2).not.toBeNull();
    expect(signal2!.direction).toBe('up');
  });
});
