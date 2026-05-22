import type { Subsystem, RbdTopology, RbdResult, LifeProjectionPoint } from './types';
import { BOLTZMANN_EV } from './constants';

export function computeSubsystemAvailability(lambda: number, mu: number): number {
  return mu / (lambda + mu);
}

export function computeSeriesAvailability(availabilities: number[]): number {
  return availabilities.reduce((acc, a) => acc * a, 1);
}

export function computeParallelAvailability(availabilities: number[]): number {
  return 1 - availabilities.reduce((acc, a) => acc * (1 - a), 1);
}

export function computeKofNAvailability(k: number, n: number, A: number): number {
  let sum = 0;
  for (let i = k; i <= n; i++) {
    sum += binomial(n, i) * Math.pow(A, i) * Math.pow(1 - A, n - i);
  }
  return sum;
}

function binomial(n: number, k: number): number {
  if (k > n) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = result * (n - i) / (i + 1);
  }
  return result;
}

export function arrheniusLife(A: number, Ea: number, T_kelvin: number): number {
  return A * Math.exp(Ea / (BOLTZMANN_EV * T_kelvin));
}

export function eyringLife(A: number, Ea: number, T_kelvin: number, b: number, S: number): number {
  return (A / T_kelvin) * Math.exp(Ea / (BOLTZMANN_EV * T_kelvin)) * Math.exp(-b * S);
}

export function accelerationFactor(Ea: number, T_use: number, T_test: number): number {
  return Math.exp((Ea / BOLTZMANN_EV) * (1 / T_use - 1 / T_test));
}

export function generateLifeProjection(
  Ea: number,
  b: number,
  S: number,
  T_use_C: number,
  points = 100,
): LifeProjectionPoint[] {
  const tempMin = 50;
  const tempMax = 250;
  const step = (tempMax - tempMin) / Math.max(1, points - 1);
  const A_arr = 1e-5;
  const A_eyr = 1e-2;
  return Array.from({ length: points }, (_, i) => {
    const tempC = tempMin + i * step;
    const T = tempC + 273.15;
    return {
      tempC,
      arrhenius: arrheniusLife(A_arr, Ea, T),
      eyring: eyringLife(A_eyr, Ea, T, b, S),
    };
  });
}

export function generateSystemRBD(
  subsystems: Subsystem[],
  topology: RbdTopology,
): RbdResult {
  const subsystemAvails = subsystems.map((s) => ({
    id: s.id,
    availability: computeSubsystemAvailability(s.lambda, s.mu),
  }));
  const avails = subsystemAvails.map((s) => s.availability);
  let systemAvail: number;
  switch (topology) {
    case 'series':
      systemAvail = computeSeriesAvailability(avails);
      break;
    case 'parallel':
      systemAvail = computeParallelAvailability(avails);
      break;
    case 'series-parallel':
      systemAvail = subsystems.reduce((acc, s, i) => {
        const a = s.k != null && s.n != null
          ? computeKofNAvailability(s.k, s.n, avails[i])
          : avails[i];
        return acc * a;
      }, 1);
      break;
    default:
      systemAvail = computeSeriesAvailability(avails);
  }
  let bottleneckIdx = 0;
  for (let i = 1; i < subsystemAvails.length; i++) {
    if (subsystemAvails[i].availability < subsystemAvails[bottleneckIdx].availability) {
      bottleneckIdx = i;
    }
  }
  const systemLambda = subsystems.reduce((s, sub) => s + sub.lambda, 0);
  const systemMtbf = 1000 / systemLambda;
  return {
    systemAvail,
    subsystemAvails,
    bottleneck: subsystemAvails[bottleneckIdx].id,
    systemMtbf,
  };
}
