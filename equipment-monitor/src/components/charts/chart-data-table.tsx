'use client';

interface ChartDataPoint {
  timestamp: Date | number;
  value: number;
}

interface ChartDataTableProps {
  data: ChartDataPoint[];
  title: string;
  unit: string;
  className?: string;
}

export function ChartDataTable({ data, title, unit, className }: ChartDataTableProps) {
  // Show last 10 data points for accessibility
  const recentData = data.slice(-10);

  return (
    <details className={`mt-4 ${className || ''}`}>
      <summary className="text-sm text-slate-400 cursor-pointer hover:text-slate-200 min-h-[44px] flex items-center">
        View data table (accessibility)
      </summary>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-sm" aria-label={`${title} data`}>
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-2 px-2 text-slate-400 font-medium">Time</th>
              <th className="text-right py-2 px-2 text-slate-400 font-medium">
                Value ({unit})
              </th>
            </tr>
          </thead>
          <tbody>
            {recentData.length === 0 ? (
              <tr>
                <td colSpan={2} className="py-4 text-center text-slate-500">
                  No data available
                </td>
              </tr>
            ) : (
              recentData.map((point, idx) => (
                <tr key={idx} className="border-b border-slate-800">
                  <td className="py-2 px-2 text-slate-300">
                    {typeof point.timestamp === 'number'
                      ? new Date(point.timestamp).toLocaleTimeString()
                      : point.timestamp.toLocaleTimeString()}
                  </td>
                  <td className="py-2 px-2 text-right text-slate-200 font-mono">
                    {point.value.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {data.length > 10 && (
          <p className="mt-2 text-xs text-slate-500 text-center">
            Showing last 10 of {data.length} data points
          </p>
        )}
      </div>
    </details>
  );
}
