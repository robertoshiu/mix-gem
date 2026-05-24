import type { SpcMeasurement, AggregatedMeasurement } from './mes-types';

/**
 * Trim an array to at most `maxCount` items, keeping the most recent (last) ones.
 * Returns the array as-is if its length does not exceed `maxCount`.
 */
export function trimMeasurements<T>(items: T[], maxCount: number = 5000): T[] {
  if (items.length <= maxCount) {
    return items;
  }
  return items.slice(-maxCount);
}

/**
 * Group SpcMeasurements by hour (rounded down) and compute per-hour statistics.
 * Returns an array of AggregatedMeasurement sorted by hour ascending.
 *
 * Aggregation uses the `cd` value of each measurement.
 */
export function aggregateToHourly(
  measurements: SpcMeasurement[],
): AggregatedMeasurement[] {
  if (measurements.length === 0) {
    return [];
  }

  // Group by hour key (ISO string of hour boundary)
  const groups = new Map<string, number[]>();

  for (const m of measurements) {
    const hourKey = roundToHour(m.timestamp).toISOString();
    const bucket = groups.get(hourKey);
    if (bucket) {
      bucket.push(m.cd);
    } else {
      groups.set(hourKey, [m.cd]);
    }
  }

  // Build result sorted by hour
  const sortedKeys = Array.from(groups.keys()).sort();

  return sortedKeys.map((key) => {
    const values = groups.get(key)!;
    const sum = values.reduce((acc, v) => acc + v, 0);
    return {
      hour: new Date(key),
      mean: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    };
  });
}

/**
 * Return the last `windowSize` items from the array.
 * If the array is shorter than `windowSize`, return all items.
 * If `windowSize` is less than 1, return an empty array.
 */
export function createRollingWindow<T>(
  items: T[],
  windowSize: number,
): T[] {
  if (windowSize < 1) {
    return [];
  }
  if (items.length <= windowSize) {
    return items;
  }
  return items.slice(-windowSize);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Round a Date down to the nearest hour boundary (zero minutes, seconds, ms).
 */
function roundToHour(date: Date): Date {
  const d = new Date(date);
  d.setMinutes(0, 0, 0);
  return d;
}
