import {
  trimMeasurements,
  aggregateToHourly,
  createRollingWindow,
} from './data-retention';
import type { SpcMeasurement } from './mes-types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMeasurement(
  overrides: Partial<SpcMeasurement> & { timestamp: Date },
): SpcMeasurement {
  return {
    id: 'm-001',
    lotId: 'lot-1',
    waferNumber: 1,
    cd: 20,
    cdu: 1.5,
    ovl_x: 0.1,
    ovl_y: 0.2,
    ler: 0.8,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// trimMeasurements
// ---------------------------------------------------------------------------

describe('trimMeasurements', () => {
  it('returns empty array when given empty array', () => {
    expect(trimMeasurements([])).toEqual([]);
  });

  it('returns all items when count <= maxCount', () => {
    const items = [1, 2, 3];
    expect(trimMeasurements(items, 5)).toEqual([1, 2, 3]);
  });

  it('keeps only the most recent items when count exceeds maxCount', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(trimMeasurements(items, 5)).toEqual([6, 7, 8, 9, 10]);
  });

  it('keeps exactly maxCount items when over the limit', () => {
    const items = Array.from({ length: 100 }, (_, i) => i);
    const result = trimMeasurements(items, 50);
    expect(result.length).toBe(50);
    expect(result[0]).toBe(50);
    expect(result[49]).toBe(99);
  });

  it('uses default maxCount of 5000', () => {
    const items = Array.from({ length: 6000 }, (_, i) => i);
    const result = trimMeasurements(items);
    expect(result.length).toBe(5000);
    expect(result[0]).toBe(1000);
  });

  it('works with SpcMeasurement objects', () => {
    const ms = [
      makeMeasurement({ id: 'old', timestamp: new Date('2026-01-01T00:00:00Z') }),
      makeMeasurement({ id: 'new', timestamp: new Date('2026-01-02T00:00:00Z') }),
    ];
    const result = trimMeasurements(ms, 1);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('new');
  });
});

// ---------------------------------------------------------------------------
// aggregateToHourly
// ---------------------------------------------------------------------------

describe('aggregateToHourly', () => {
  it('returns empty array when given empty array', () => {
    expect(aggregateToHourly([])).toEqual([]);
  });

  it('produces one group for a single measurement', () => {
    const t = new Date('2026-05-23T10:15:00Z');
    const result = aggregateToHourly([makeMeasurement({ cd: 25, timestamp: t })]);
    expect(result.length).toBe(1);
    expect(result[0]).toEqual({
      hour: new Date('2026-05-23T10:00:00Z'),
      mean: 25,
      min: 25,
      max: 25,
      count: 1,
    });
  });

  it('groups measurements in the same hour and computes aggregates', () => {
    const hour = new Date('2026-05-23T10:00:00Z');
    const ms = [
      makeMeasurement({ id: 'a', cd: 10, timestamp: new Date('2026-05-23T10:01:00Z') }),
      makeMeasurement({ id: 'b', cd: 20, timestamp: new Date('2026-05-23T10:30:00Z') }),
      makeMeasurement({ id: 'c', cd: 30, timestamp: new Date('2026-05-23T10:59:00Z') }),
    ];
    const result = aggregateToHourly(ms);
    expect(result.length).toBe(1);
    expect(result[0].hour).toEqual(hour);
    expect(result[0].mean).toBe(20);  // (10 + 20 + 30) / 3
    expect(result[0].min).toBe(10);
    expect(result[0].max).toBe(30);
    expect(result[0].count).toBe(3);
  });

  it('separates measurements across different hours', () => {
    const ms = [
      makeMeasurement({ id: 'a', cd: 10, timestamp: new Date('2026-05-23T09:01:00Z') }),
      makeMeasurement({ id: 'b', cd: 20, timestamp: new Date('2026-05-23T10:01:00Z') }),
      makeMeasurement({ id: 'c', cd: 30, timestamp: new Date('2026-05-23T11:01:00Z') }),
    ];
    const result = aggregateToHourly(ms);
    expect(result.length).toBe(3);
    expect(result[0].hour).toEqual(new Date('2026-05-23T09:00:00Z'));
    expect(result[0].mean).toBe(10);
    expect(result[1].hour).toEqual(new Date('2026-05-23T10:00:00Z'));
    expect(result[1].mean).toBe(20);
    expect(result[2].hour).toEqual(new Date('2026-05-23T11:00:00Z'));
    expect(result[2].mean).toBe(30);
  });

  it('returns groups sorted by hour ascending regardless of input order', () => {
    const ms = [
      makeMeasurement({ id: 'c', cd: 30, timestamp: new Date('2026-05-23T11:01:00Z') }),
      makeMeasurement({ id: 'a', cd: 10, timestamp: new Date('2026-05-23T09:01:00Z') }),
      makeMeasurement({ id: 'b', cd: 20, timestamp: new Date('2026-05-23T10:01:00Z') }),
    ];
    const result = aggregateToHourly(ms);
    expect(result[0].hour).toEqual(new Date('2026-05-23T09:00:00Z'));
    expect(result[1].hour).toEqual(new Date('2026-05-23T10:00:00Z'));
    expect(result[2].hour).toEqual(new Date('2026-05-23T11:00:00Z'));
  });

  it('uses cd parameter for aggregation by default', () => {
    const ms = [
      makeMeasurement({ cd: 15, timestamp: new Date('2026-05-23T10:00:00Z') }),
      makeMeasurement({ cd: 25, timestamp: new Date('2026-05-23T10:30:00Z') }),
    ];
    const result = aggregateToHourly(ms);
    expect(result[0].mean).toBe(20);
  });

  it('handles many measurements in one hour correctly', () => {
    const base = new Date('2026-05-23T10:00:00Z');
    const ms = Array.from({ length: 10 }, (_, i) =>
      makeMeasurement({
        id: `m-${i}`,
        cd: i * 10,
        timestamp: new Date(base.getTime() + i * 60_000),
      }),
    );
    const result = aggregateToHourly(ms);
    expect(result.length).toBe(1);
    expect(result[0].count).toBe(10);
    expect(result[0].min).toBe(0);
    expect(result[0].max).toBe(90);
    expect(result[0].mean).toBe(45);
  });
});

// ---------------------------------------------------------------------------
// createRollingWindow
// ---------------------------------------------------------------------------

describe('createRollingWindow', () => {
  it('returns empty array when given empty array', () => {
    expect(createRollingWindow([], 10)).toEqual([]);
  });

  it('returns all items when count <= windowSize', () => {
    const items = [1, 2, 3];
    expect(createRollingWindow(items, 5)).toEqual([1, 2, 3]);
  });

  it('returns last windowSize items when count exceeds windowSize', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(createRollingWindow(items, 3)).toEqual([8, 9, 10]);
  });

  it('works with SpcMeasurement objects', () => {
    const ms = [
      makeMeasurement({ id: 'a', timestamp: new Date('2026-01-01T00:00:00Z') }),
      makeMeasurement({ id: 'b', timestamp: new Date('2026-01-02T00:00:00Z') }),
      makeMeasurement({ id: 'c', timestamp: new Date('2026-01-03T00:00:00Z') }),
    ];
    expect(createRollingWindow(ms, 2)).toEqual([
      ms[1], ms[2],
    ]);
  });

  it('handles windowSize of 0', () => {
    const items = [1, 2, 3];
    expect(createRollingWindow(items, 0)).toEqual([]);
  });

  it('handles negative windowSize', () => {
    const items = [1, 2, 3];
    expect(createRollingWindow(items, -1)).toEqual([]);
  });
});
