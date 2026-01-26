'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { Alarm } from '@/types/equipment';

const severityConfig = {
  CRITICAL: {
    icon: AlertTriangle,
    text: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500',
  },
  MAJOR: {
    icon: AlertCircle,
    text: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500',
  },
  MINOR: {
    icon: AlertCircle,
    text: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500',
  },
  INFO: {
    icon: Info,
    text: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500',
  },
};

interface AlertRowProps {
  alarm: Alarm;
  onAcknowledge: (id: string) => void;
}

export function AlertRow({ alarm, onAcknowledge }: AlertRowProps) {
  const config = severityConfig[alarm.severity];
  const Icon = config.icon;

  return (
    <div
      className="flex items-center gap-3 min-h-[56px] px-4 py-2 border-b border-slate-700/50 hover:bg-slate-800/50"
      role="listitem"
    >
      <div className="min-w-[44px] min-h-[44px] flex items-center justify-center">
        <Icon className={`h-5 w-5 ${config.text}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400">{alarm.equipmentId}</span>
        </div>
        <p className="text-sm text-slate-200 truncate">{alarm.message}</p>
        <p className="text-xs text-slate-500">{alarm.timestamp.toLocaleString()}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onAcknowledge(alarm.id)}
        className="min-h-[44px] min-w-[44px] shrink-0"
        disabled={alarm.acknowledged}
      >
        {alarm.acknowledged ? 'Done' : 'Ack'}
      </Button>
    </div>
  );
}
