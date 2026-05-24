import { evaluateSpc } from './spc-engine';
import { SPC_PARAMETERS } from './spc-parameters';

const { target, sigma, ucl, lcl } = SPC_PARAMETERS.cd;
const twoSigma = target + 2 * sigma;

function makeWindow(values: number[]) {
  return values.map((v, i) => ({ waferNumber: i + 1, cd: v, cdu: 2.0, ovl_x: 0, ovl_y: 0, ler: 3.0 }));
}

describe('Rule 1 — beyond 3 sigma', () => {
  it('returns violation when point exceeds UCL', () => {
    const window = makeWindow([...Array(5).fill(target), ucl + 0.5]);
    const result = evaluateSpc(window, 'cd');
    expect(result).not.toBeNull();
    expect(result?.rule).toBe('rule_1');
  });

  it('returns violation when point is below LCL', () => {
    const window = makeWindow([...Array(5).fill(target), lcl - 0.5]);
    const result = evaluateSpc(window, 'cd');
    expect(result?.rule).toBe('rule_1');
  });

  it('returns null for in-control data', () => {
    const window = makeWindow(Array(10).fill(target));
    expect(evaluateSpc(window, 'cd')).toBeNull();
  });
});

describe('Rule 2 — 7 consecutive same side', () => {
  it('returns violation for 7 consecutive points above CL', () => {
    const window = makeWindow([target, target, ...Array(7).fill(target + sigma)]);
    const result = evaluateSpc(window, 'cd');
    expect(result?.rule).toBe('rule_2');
  });

  it('does not trigger on 6 consecutive', () => {
    const window = makeWindow([target, target, target, ...Array(6).fill(target + sigma)]);
    expect(evaluateSpc(window, 'cd')).toBeNull();
  });
});

describe('Rule 5 — 2 of 3 beyond 2 sigma', () => {
  it('returns violation when 2 of last 3 beyond +2 sigma', () => {
    const window = makeWindow([
      target, target, target,
      twoSigma + 0.1, target, twoSigma + 0.1,
    ]);
    const result = evaluateSpc(window, 'cd');
    expect(result?.rule).toBe('rule_5');
  });

  it('does not trigger on only 1 of 3', () => {
    const window = makeWindow([target, target, target, twoSigma + 0.1, target, target]);
    expect(evaluateSpc(window, 'cd')).toBeNull();
  });
});

describe('Rule 3 — 6 consecutive increasing or decreasing', () => {
  it('returns violation for 6 consecutive increasing points', () => {
    const window = makeWindow([44.0, 44.2, 44.4, 44.6, 44.8, 45.0]);
    const result = evaluateSpc(window, 'cd');
    expect(result?.rule).toBe('rule_3');
  });

  it('returns violation for 6 consecutive decreasing points', () => {
    const window = makeWindow([46.0, 45.8, 45.6, 45.4, 45.2, 45.0]);
    const result = evaluateSpc(window, 'cd');
    expect(result?.rule).toBe('rule_3');
  });

  it('does not trigger on only 5 consecutive', () => {
    const window = makeWindow([target, ...Array(5).fill(0).map((_, i) => 44.0 + i * 0.2)]);
    expect(evaluateSpc(window, 'cd')).toBeNull();
  });

  it('does not trigger on non-monotonic data', () => {
    const window = makeWindow([44.0, 44.5, 44.2, 44.7, 44.4, 44.9]);
    expect(evaluateSpc(window, 'cd')).toBeNull();
  });
});

describe('Rule 4 — 14 alternating up/down', () => {
  it('returns violation for 14 alternating points', () => {
    const alternating = Array.from({ length: 14 }, (_, i) =>
      i % 2 === 0 ? 45.1 : 44.9,
    );
    const window = makeWindow(alternating);
    const result = evaluateSpc(window, 'cd');
    expect(result?.rule).toBe('rule_4');
  });

  it('does not trigger on non-alternating pattern', () => {
    const values = [45.0, 45.2, 45.4, 45.2, 45.0, 44.8, 44.6, 44.8, 45.0, 45.2, 45.4, 45.2, 45.0, 44.8];
    const window = makeWindow(values);
    expect(evaluateSpc(window, 'cd')).toBeNull();
  });

  it('does not trigger with fewer than 14 points', () => {
    const alternating = Array.from({ length: 13 }, (_, i) =>
      i % 2 === 0 ? 45.1 : 44.9,
    );
    const window = makeWindow(alternating);
    expect(evaluateSpc(window, 'cd')).toBeNull();
  });
});

describe('Rule 6 — 4 of 5 beyond ±1σ same side', () => {
  const sigma1Pos = target + sigma; // 46.0
  const sigma1Neg = target - sigma; // 44.0

  it('returns violation when 4 of last 5 exceed +1σ', () => {
    const window = makeWindow([
      target, target, target,
      sigma1Pos + 0.5, sigma1Pos + 0.3, target, sigma1Pos + 0.1, sigma1Pos + 0.7,
    ]);
    const result = evaluateSpc(window, 'cd');
    expect(result?.rule).toBe('rule_6');
  });

  it('returns violation when 4 of last 5 below -1σ', () => {
    const window = makeWindow([
      target, target, target,
      sigma1Neg - 0.5, sigma1Neg - 0.3, target, sigma1Neg - 0.1, sigma1Neg - 0.7,
    ]);
    const result = evaluateSpc(window, 'cd');
    expect(result?.rule).toBe('rule_6');
  });

  it('does not trigger when only 3 of 5 are beyond ±1σ', () => {
    const window = makeWindow([
      target, target,
      sigma1Pos + 0.5, sigma1Pos + 0.3, target, target, sigma1Pos + 0.1,
    ]);
    expect(evaluateSpc(window, 'cd')).toBeNull();
  });

  it('does not trigger when 4 beyond but on mixed sides', () => {
    const window = makeWindow([
      target, target,
      sigma1Pos + 0.5, sigma1Pos + 0.3, sigma1Neg - 0.5, sigma1Neg - 0.3, sigma1Pos + 0.1,
    ]);
    expect(evaluateSpc(window, 'cd')).toBeNull();
  });
});

describe('Rule 7 — 15 consecutive within ±1σ', () => {
  it('returns violation for 15 points all within ±1σ', () => {
    const window = makeWindow(Array(15).fill(target));
    const result = evaluateSpc(window, 'cd');
    expect(result?.rule).toBe('rule_7');
  });

  it('does not trigger when a point falls outside ±1σ', () => {
    const values = [...Array(14).fill(target), target + sigma + 0.1];
    const window = makeWindow(values);
    expect(evaluateSpc(window, 'cd')).toBeNull();
  });

  it('does not trigger with fewer than 15 points', () => {
    // 14 values: non-alternating, non-monotonic, not all same side
    const values = [44.0, 45.0, 44.2, 45.2, 44.4, 45.4, 44.6, 45.6, 44.8, 45.8, 45.0, 44.0, 45.2, 44.2];
    const window = makeWindow(values);
    expect(evaluateSpc(window, 'cd')).toBeNull();
  });
});

describe('Rule 8 — 8 consecutive beyond ±1σ both sides', () => {
  const sigma1Pos = target + sigma; // 46.0
  const sigma1Neg = target - sigma; // 44.0

  it('returns violation for 8 points alternating above +1σ and below -1σ', () => {
    const values = Array.from({ length: 8 }, (_, i) =>
      i % 2 === 0 ? sigma1Pos + 0.5 : sigma1Neg - 0.5,
    );
    const window = makeWindow(values);
    const result = evaluateSpc(window, 'cd');
    expect(result?.rule).toBe('rule_8');
  });

  it('does not trigger when all points beyond ±1σ but only on one side', () => {
    const values = Array(8).fill(sigma1Pos + 0.5);
    const window = makeWindow(values);
    const result = evaluateSpc(window, 'cd');
    expect(result?.rule).not.toBe('rule_8');
  });

  it('does not trigger when a point is within ±1σ', () => {
    const values = [sigma1Pos + 0.5, sigma1Neg - 0.5, sigma1Pos + 0.5, target, sigma1Neg - 0.5, sigma1Pos + 0.5, sigma1Neg - 0.5, sigma1Pos + 0.5];
    const window = makeWindow(values);
    expect(evaluateSpc(window, 'cd')).toBeNull();
  });

  it('does not trigger with fewer than 8 points', () => {
    const values = Array.from({ length: 7 }, (_, i) =>
      i % 2 === 0 ? sigma1Pos + 0.5 : sigma1Neg - 0.5,
    );
    const window = makeWindow(values);
    expect(evaluateSpc(window, 'cd')).toBeNull();
  });
});

describe('Normal data — no false violations', () => {
  it('returns null for 20 normally distributed values around target', () => {
    // Values with natural variation breaking all rule patterns:
    // - Some values outside ±1σ to avoid Rule 7
    // - No 14-point alternating pattern
    // - No 7 consecutive same side of target
    const values = [
      45.0, 45.3, 44.6, 45.1, 44.4,
      45.5, 44.3, 46.0, 44.5, 45.2,
      44.0, 45.4, 44.8, 46.1, 44.7,
      45.6, 43.9, 45.0, 44.9, 44.2,
    ];
    const window = makeWindow(values);
    const result = evaluateSpc(window, 'cd');
    expect(result).toBeNull();
  });
});
