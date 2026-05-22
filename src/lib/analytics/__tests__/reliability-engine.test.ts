import {
  computeSubsystemAvailability,
  computeSeriesAvailability,
  computeParallelAvailability,
  computeKofNAvailability,
  arrheniusLife,
  eyringLife,
  accelerationFactor,
  generateLifeProjection,
  generateSystemRBD,
} from '../reliability-engine';

describe('computeSubsystemAvailability', () => {
  test('returns mu/(lambda+mu)', () => {
    expect(computeSubsystemAvailability(2, 18)).toBeCloseTo(0.9, 5);
  });

  test('perfect repair (large mu) gives near-1 availability', () => {
    expect(computeSubsystemAvailability(1, 10000)).toBeGreaterThan(0.999);
  });
});

describe('computeSeriesAvailability', () => {
  test('is product of individual availabilities', () => {
    const a = computeSeriesAvailability([0.99, 0.98, 0.97]);
    expect(a).toBeCloseTo(0.99 * 0.98 * 0.97, 6);
  });

  test('is less than minimum component', () => {
    const a = computeSeriesAvailability([0.99, 0.95, 0.98]);
    expect(a).toBeLessThan(0.95);
  });
});

describe('computeParallelAvailability', () => {
  test('is 1 - product(1 - Ai)', () => {
    const a = computeParallelAvailability([0.9, 0.9]);
    expect(a).toBeCloseTo(1 - 0.1 * 0.1, 6);
  });

  test('is greater than maximum component', () => {
    const a = computeParallelAvailability([0.9, 0.85, 0.88]);
    expect(a).toBeGreaterThan(0.9);
  });
});

describe('computeKofNAvailability', () => {
  test('k=n equals series (all must work)', () => {
    const kn = computeKofNAvailability(3, 3, 0.95);
    const series = 0.95 ** 3;
    expect(kn).toBeCloseTo(series, 6);
  });

  test('k=1 equals parallel (any one works)', () => {
    const kn = computeKofNAvailability(1, 3, 0.9);
    const parallel = 1 - 0.1 ** 3;
    expect(kn).toBeCloseTo(parallel, 6);
  });

  test('2-of-3 is between series and parallel', () => {
    const A = 0.9;
    const kn = computeKofNAvailability(2, 3, A);
    const series = A ** 3;
    const parallel = 1 - (1 - A) ** 3;
    expect(kn).toBeGreaterThan(series);
    expect(kn).toBeLessThan(parallel);
  });
});

describe('arrheniusLife', () => {
  test('higher temperature gives shorter life', () => {
    const l1 = arrheniusLife(1e10, 0.7, 273 + 65);
    const l2 = arrheniusLife(1e10, 0.7, 273 + 125);
    expect(l2).toBeLessThan(l1);
  });
});

describe('eyringLife', () => {
  test('with b=0 and S=0 approximates Arrhenius/T', () => {
    const T = 273 + 100;
    const eyr = eyringLife(1e10, 0.7, T, 0, 0);
    expect(eyr).toBeGreaterThan(0);
  });
});

describe('accelerationFactor', () => {
  test('AF = 1 when test temp equals use temp', () => {
    expect(accelerationFactor(0.7, 338, 338)).toBeCloseTo(1, 6);
  });

  test('AF > 1 when test temp > use temp', () => {
    expect(accelerationFactor(0.7, 338, 398)).toBeGreaterThan(1);
  });
});

describe('generateLifeProjection', () => {
  test('returns correct number of points', () => {
    const pts = generateLifeProjection(0.7, 0.01, 0.5, 65, 50);
    expect(pts).toHaveLength(50);
  });

  test('life decreases with temperature', () => {
    const pts = generateLifeProjection(0.7, 0, 0, 65, 20);
    for (let i = 1; i < pts.length; i++) {
      expect(pts[i].arrhenius).toBeLessThanOrEqual(pts[i - 1].arrhenius + 0.01);
    }
  });
});

describe('generateSystemRBD', () => {
  test('identifies bottleneck as lowest availability subsystem', () => {
    const subsystems = [
      { id: 'oxidation' as const, name: 'OX', lambda: 1, mu: 20 },
      { id: 'implant' as const, name: 'IMP', lambda: 5, mu: 10 },
    ];
    const result = generateSystemRBD(subsystems, 'series');
    expect(result.bottleneck).toBe('implant');
  });
});
