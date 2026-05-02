import { SPC_PARAMETERS } from './spc-parameters';
import type { SpcParameter, SpcViolation } from './mes-types';

type PartialMeasurement = Record<SpcParameter, number> & { waferNumber: number };

export function evaluateSpc(
  window: PartialMeasurement[],
  parameter: SpcParameter,
): Omit<SpcViolation, 'id' | 'lotId' | 'acknowledged' | 'timestamp'> | null {
  if (window.length === 0) return null;

  const { target, sigma, ucl, lcl } = SPC_PARAMETERS[parameter];
  const values = window.map((m) => m[parameter] as number);
  const last = values[values.length - 1];
  const lastWafer = window[window.length - 1].waferNumber;

  // Rule 1: single point beyond 3 sigma
  if (last > ucl) return { parameter, rule: 'rule_1', waferNumber: lastWafer, value: last, limit: ucl };
  if (last < lcl) return { parameter, rule: 'rule_1', waferNumber: lastWafer, value: last, limit: lcl };

  // Rule 2: 7+ consecutive same side of center line
  if (values.length >= 7) {
    const tail = values.slice(-7);
    const allAbove = tail.every((v) => v > target);
    const allBelow = tail.every((v) => v < target);
    if (allAbove || allBelow) {
      return { parameter, rule: 'rule_2', waferNumber: lastWafer, value: last, limit: target };
    }
  }

  // Rule 5: 2 of 3 consecutive beyond +/- 2 sigma (same side)
  if (values.length >= 3) {
    const tail = values.slice(-3);
    const twoSigmaPos = target + 2 * sigma;
    const twoSigmaNeg = target - 2 * sigma;
    const aboveCount = tail.filter((v) => v > twoSigmaPos).length;
    const belowCount = tail.filter((v) => v < twoSigmaNeg).length;
    if (aboveCount >= 2) return { parameter, rule: 'rule_5', waferNumber: lastWafer, value: last, limit: twoSigmaPos };
    if (belowCount >= 2) return { parameter, rule: 'rule_5', waferNumber: lastWafer, value: last, limit: twoSigmaNeg };
  }

  return null;
}
