'use client';

import { useState, useMemo } from 'react';

export type TimeRange = '15m' | '1h' | '6h' | '24h' | '7d';

const rangeToMs: Record<TimeRange, number> = {
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
};

export function useTimeRange(defaultRange: TimeRange = '1h') {
  const [range, setRange] = useState<TimeRange>(defaultRange);

  const startTime = useMemo(() => {
    return new Date(Date.now() - rangeToMs[range]);
  }, [range]);

  const endTime = useMemo(() => new Date(), []); // Fixed end time for simplicity in this step

  return {
    range,
    setRange,
    startTime,
    endTime,
    durationMs: rangeToMs[range],
  };
}
