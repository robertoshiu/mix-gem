'use client';

import { Button } from '@/components/ui/button';
import { useTimeRange, type TimeRange } from '@/hooks/useTimeRange';

interface TimeRangeSelectorProps {
  onChange?: (range: TimeRange) => void;
}

const ranges: { label: string; value: TimeRange }[] = [
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '6h', value: '6h' },
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
];

export function TimeRangeSelector({ onChange }: TimeRangeSelectorProps) {
  const { range, setRange } = useTimeRange();

  const handleRangeChange = (newRange: TimeRange) => {
    setRange(newRange);
    onChange?.(newRange);
  };

  return (
    <div className="flex gap-2" role="group" aria-label="Time range selector">
      {ranges.map((r) => (
        <Button
          key={r.value}
          variant={range === r.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleRangeChange(r.value)}
          className="min-h-[44px] min-w-[44px]"
        >
          {r.label}
        </Button>
      ))}
    </div>
  );
}
