'use client';

import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Alarm } from '@/types/equipment';

interface AlertBannerProps {
  alarm: Alarm;
  onAcknowledge: (id: string) => void;
}

const severityConfig = {
  CRITICAL: {
    icon: AlertTriangle,
    bg: 'bg-red-500/20 border-red-500',
    text: 'text-red-400',
  },
  MAJOR: {
    icon: AlertCircle,
    bg: 'bg-amber-500/20 border-amber-500',
    text: 'text-amber-400',
  },
  MINOR: {
    icon: AlertCircle,
    bg: 'bg-yellow-500/20 border-yellow-500',
    text: 'text-yellow-400',
  },
  INFO: {
    icon: Info,
    bg: 'bg-blue-500/20 border-blue-500',
    text: 'text-blue-400',
  },
};

export function AlertBanner({ alarm, onAcknowledge }: AlertBannerProps) {
  if (alarm.acknowledged) return null;

  const config = severityConfig[alarm.severity];
  const Icon = config.icon;

  return (
    <div
      className={`flex items-center gap-4 rounded-md border-l-4 p-4 ${config.bg}`}
      role="alert"
      aria-live="assertive"
    >
      <Icon className={`h-6 w-6 ${config.text}`} />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-sm font-semibold ${config.text}`}>
            {alarm.severity}
          </span>
          <span className="text-sm font-medium text-slate-200">
            {alarm.equipmentId}
          </span>
          <span className="text-xs text-slate-400">
            {alarm.timestamp.toLocaleString()}
          </span>
        </div>
        <p className="text-sm text-slate-200">{alarm.message}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onAcknowledge(alarm.id)}
        className="shrink-0"
        aria-label={`Acknowledge ${alarm.severity} alarm for ${alarm.equipmentId}`}
      >
        Acknowledge
      </Button>
    </div>
  );
}
