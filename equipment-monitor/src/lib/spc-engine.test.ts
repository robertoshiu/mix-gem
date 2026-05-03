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
