'use client';

import { useMemo } from 'react';
import { useEquipmentStore } from '@/stores/equipment-store';
import { AlertToast } from './alert-toast';

const TOAST_WINDOW_MS = 30000;

export function ToastContainer() {
  const { alarms, acknowledgeAlarm } = useEquipmentStore();

  // Show only unacknowledged alarms from the last 30 seconds
  const recentAlarms = useMemo(() => {
    const now = Date.now();
    return alarms.filter(
      (alarm) =>
        !alarm.acknowledged &&
        now - alarm.timestamp.getTime() < TOAST_WINDOW_MS
    );
  }, [alarms]);

  return (
    <div
      className="fixed top-20 right-4 z-50 flex flex-col gap-2 w-96"
      aria-live="polite"
      aria-atomic="false"
    >
      {recentAlarms.map((alarm) => (
        <AlertToast
          key={alarm.id}
          id={alarm.id}
          severity={alarm.severity}
          message={alarm.message}
          equipmentId={alarm.equipmentId}
          timestamp={alarm.timestamp}
          onDismiss={acknowledgeAlarm}
        />
      ))}
    </div>
  );
}
