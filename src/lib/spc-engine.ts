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

  // Rule 3: 6 consecutive increasing or decreasing
  if (values.length >= 6) {
    const tail = values.slice(-6);
    const increasing = tail.every((v, i) => i === 0 || v > tail[i - 1]);
    const decreasing = tail.every((v, i) => i === 0 || v < tail[i - 1]);
    if (increasing || decreasing) {
      return { parameter, rule: 'rule_3', waferNumber: lastWafer, value: last, limit: 0 };
    }
  }

  // Rule 4: 14 alternating up/down
  if (values.length >= 14) {
    const tail = values.slice(-14);
    let alternates = true;
    for (let i = 2; i < tail.length; i++) {
      const prevDelta = tail[i - 1] - tail[i - 2];
      const currDelta = tail[i] - tail[i - 1];
      if (prevDelta === 0 || currDelta === 0 || Math.sign(prevDelta) === Math.sign(currDelta)) {
        alternates = false;
        break;
      }
    }
    if (alternates) {
      return { parameter, rule: 'rule_4', waferNumber: lastWafer, value: last, limit: 0 };
    }
  }

  // Rule 6: 4 of last 5 beyond ±1 sigma on the SAME side
  if (values.length >= 5) {
    const tail = values.slice(-5);
    const sigma1Pos = target + sigma;
    const sigma1Neg = target - sigma;
    const aboveCount = tail.filter((v) => v > sigma1Pos).length;
    const belowCount = tail.filter((v) => v < sigma1Neg).length;
    if (aboveCount >= 4) return { parameter, rule: 'rule_6', waferNumber: lastWafer, value: last, limit: sigma1Pos };
    if (belowCount >= 4) return { parameter, rule: 'rule_6', waferNumber: lastWafer, value: last, limit: sigma1Neg };
  }

  // Rule 7: 15 consecutive ALL within ±1 sigma
  if (values.length >= 15) {
    const tail = values.slice(-15);
    const sigma1Pos = target + sigma;
    const sigma1Neg = target - sigma;
    const allWithin = tail.every((v) => v >= sigma1Neg && v <= sigma1Pos);
    if (allWithin) {
      return { parameter, rule: 'rule_7', waferNumber: lastWafer, value: last, limit: 0 };
    }
  }

  // Rule 8: 8 consecutive ALL beyond ±1 sigma, BOTH sides
  if (values.length >= 8) {
    const tail = values.slice(-8);
    const sigma1Pos = target + sigma;
    const sigma1Neg = target - sigma;
    const allBeyond = tail.every((v) => v > sigma1Pos || v < sigma1Neg);
    const hasAbove = tail.some((v) => v > sigma1Pos);
    const hasBelow = tail.some((v) => v < sigma1Neg);
    if (allBeyond && hasAbove && hasBelow) {
      return { parameter, rule: 'rule_8', waferNumber: lastWafer, value: last, limit: 0 };
    }
  }

  return null;
}
