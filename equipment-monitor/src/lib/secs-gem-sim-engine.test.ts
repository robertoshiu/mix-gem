import { mulberry32, pick, gaussian, selectCategory, type MessageCategory } from './secs-gem-sim-engine';

describe('mulberry32', () => {
  it('returns deterministic sequence for same seed', () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);
    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());
    expect(seq1).toEqual(seq2);
  });

  it('returns different sequences for different seeds', () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(99);
    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());
    expect(seq1).not.toEqual(seq2);
  });

  it('returns values in [0, 1) range', () => {
    const rng = mulberry32(123);
    const values = Array.from({ length: 1000 }, () => rng());
    for (const v of values) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('pick', () => {
  it('picks element from array based on rand value', () => {
    const arr = ['a', 'b', 'c', 'd'];
    expect(pick(arr, 0.0)).toBe('a');
    expect(pick(arr, 0.24)).toBe('a');
    expect(pick(arr, 0.25)).toBe('b');
    expect(pick(arr, 0.99)).toBe('d');
  });
});

describe('gaussian', () => {
  it('returns values centered around mean', () => {
    const rng = mulberry32(42);
    const values = Array.from({ length: 500 }, () => gaussian(50, 1.5, rng(), rng()));
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    expect(avg).toBeGreaterThan(48);
    expect(avg).toBeLessThan(52);
  });

  it('respects stddev spread', () => {
    const rng = mulberry32(42);
    const values = Array.from({ length: 500 }, () => gaussian(50, 1.5, rng(), rng()));
    const min = Math.min(...values);
    const max = Math.max(...values);
    expect(min).toBeGreaterThan(40);
    expect(max).toBeLessThan(60);
  });
});

describe('selectCategory', () => {
  it('returns collection for low values (weight 0.35)', () => {
    expect(selectCategory(0.0)).toBe('collection');
    expect(selectCategory(0.34)).toBe('collection');
  });

  it('returns status for values in [0.35, 0.50)', () => {
    expect(selectCategory(0.35)).toBe('status');
    expect(selectCategory(0.49)).toBe('status');
  });

  it('distributes all 7 categories across full range', () => {
    const categories = new Set<MessageCategory>();
    for (let i = 0; i < 100; i++) {
      categories.add(selectCategory(i / 100));
    }
    expect(categories.size).toBe(7);
  });
});
