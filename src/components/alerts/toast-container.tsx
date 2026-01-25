'use client';

import { useEquipmentStore } from '@/stores/equipment-store';
import { AlertToast } from './alert-toast';

export function ToastContainer() {
  const { alarms, acknowledgeAlarm } = useEquipmentStore();

  // Show only unacknowledged alarms from the last 30 seconds
  const recentAlarms = alarms.filter(
    (alarm) =>
      !alarm.acknowledged &&
      Date.now() - alarm.timestamp.getTime() < 30000
  );

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
