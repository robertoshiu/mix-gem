'use client';

import { Card } from '@/components/ui/card';
import type { BoxPlotDataPoint } from '@/lib/chart-types';

interface BoxPlotProps {
  data: BoxPlotDataPoint[];
  title?: string;
  height?: number;
}

export function BoxPlot({ data, title = 'Parameter Distribution', height = 300 }: BoxPlotProps) {
  // Safe calculation for min/max to avoid -Infinity/Infinity on empty data
  const allValues = data.flatMap((d) => [d.max, ...d.outliers, d.min]);
  const maxValue = allValues.length ? Math.max(...allValues) : 100;
  const minValue = allValues.length ? Math.min(...allValues) : 0;
  const range = maxValue - minValue || 1; // Prevent division by zero

  const scale = (value: number) => {
    return ((value - minValue) / range) * 100;
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold text-slate-50 mb-4">{title}</h3>
      <div className="space-y-6" style={{ height }}>
        {data.map((item) => (
          <div key={item.parameter} className="relative">
            <div className="text-sm text-slate-400 mb-2">{item.parameter}</div>
            <div className="relative h-12 bg-slate-900 rounded">
              {/* Min-Max line */}
              <div
                className="absolute top-1/2 h-0.5 bg-slate-600"
                style={{
                  left: `${scale(item.min)}%`,
                  right: `${100 - scale(item.max)}%`,
                }}
              />
              {/* Box (Q1 to Q3) */}
              <div
                className="absolute top-1/4 h-1/2 bg-blue-500/30 border border-blue-500 rounded"
                style={{
                  left: `${scale(item.q1)}%`,
                  right: `${100 - scale(item.q3)}%`,
                }}
              >
                {/* Median line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-blue-400"
                  style={{
                    left: `${((item.median - item.q1) / (item.q3 - item.q1 || 1)) * 100}%`,
                  }}
                />
              </div>
              {/* Outliers */}
              {item.outliers.map((outlier, idx) => (
                <div
                  key={idx}
                  data-testid="outlier"
                  className="absolute top-1/2 w-2 h-2 bg-red-500 rounded-full -translate-y-1/2"
                  style={{ left: `${scale(outlier)}%` }}
                  title={`Outlier: ${outlier}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
