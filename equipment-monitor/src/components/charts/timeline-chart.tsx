'use client';

import { Card } from '@/components/ui/card';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import type { Alarm } from '@/types/equipment'; // Use shared types

interface TimelineChartProps {
  alarms: Alarm[];
  title?: string;
  height?: number;
}

const severityConfig = {
  CRITICAL: { color: 'bg-red-500', icon: AlertTriangle, text: 'text-red-400' },
  MAJOR: { color: 'bg-amber-500', icon: AlertCircle, text: 'text-amber-400' },
  MINOR: { color: 'bg-yellow-500', icon: AlertCircle, text: 'text-yellow-400' },
  INFO: { color: 'bg-blue-500', icon: Info, text: 'text-blue-400' },
};

export function TimelineChart({ alarms, title = 'Alarm History', height = 400 }: TimelineChartProps) {
  const sortedAlarms = [...alarms].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold text-slate-50 mb-4">{title}</h3>
      <div className="relative" style={{ height, overflowY: 'auto' }}>
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-700" />
        <div className="space-y-4 pl-4">
          {sortedAlarms.map((alarm) => {
            const config = severityConfig[alarm.severity];
            const Icon = config.icon;

            return (
              <div key={alarm.id} className="relative flex gap-4">
                <div className="relative flex flex-col items-center">
                  <div className={`${config.color} rounded-full p-2 z-10`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  {alarm.acknowledged && (
                    <CheckCircle className="h-3 w-3 text-emerald-500 mt-1" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold ${config.text}`}>
                      {alarm.severity}
                    </span>
                    <span className="text-xs text-slate-400">
                      {alarm.equipmentId}
                    </span>
                    <span className="text-xs text-slate-500">
                      {alarm.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200">{alarm.message}</p>
                  {alarm.acknowledged && (
                    <span className="text-xs text-emerald-500 mt-1 inline-block">
                      Acknowledged
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
