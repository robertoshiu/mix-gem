'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { AlarmSeverity } from '@/types/equipment';

interface AlertToastProps {
  id: string;
  severity: AlarmSeverity;
  message: string;
  equipmentId: string;
  timestamp?: Date;
  onDismiss: (id: string) => void;
}

const severityStyles = {
  CRITICAL: 'border-red-500 bg-red-500/10',
  MAJOR: 'border-amber-500 bg-amber-500/10',
  MINOR: 'border-yellow-500 bg-yellow-500/10',
  INFO: 'border-blue-500 bg-blue-500/10',
};

const severityText = {
  CRITICAL: 'text-red-400',
  MAJOR: 'text-amber-400',
  MINOR: 'text-yellow-400',
  INFO: 'text-blue-400',
};

const AUTO_DISMISS_MS = 5000;

export function AlertToast({
  id,
  severity,
  message,
  equipmentId,
  timestamp = new Date(),
  onDismiss,
}: AlertToastProps) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onDismiss(id);
    }, AUTO_DISMISS_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [id, onDismiss]);

  const handleDismiss = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onDismiss(id);
  };

  return (
    <div
      data-severity={severity}
      className={`flex items-start gap-3 rounded-md border-l-4 p-4 shadow-lg ${severityStyles[severity]}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${severityText[severity]}`}>
            {severity}
          </span>
          <span className="text-xs text-slate-400">
            {equipmentId}
          </span>
          <span className="text-xs text-slate-500">
            {timestamp.toLocaleTimeString('en-US')}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-200">{message}</p>
      </div>
      <button
        onClick={handleDismiss}
        className="text-slate-400 hover:text-slate-200 transition-colors"
        aria-label="Dismiss alert"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
