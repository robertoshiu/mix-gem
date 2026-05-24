import type { Notification, Alarm } from '@/lib/mes-types';
import { AlarmManager } from '@/lib/alarm-system';

type SliceSetter<TState> = (fn: (state: TState) => Partial<TState>) => void;

// ── Initial State ──────────────────────────────────────────────────

export const INITIAL_ALARM_STATE = {
  notifications: [] as Notification[],
  isNotificationPanelOpen: false,
  isSettingsPanelOpen: false,
  isUserDropdownOpen: false,
  activeAlarms: [] as Alarm[],
  alarmManager: new AlarmManager(),
  settings: {
    refreshInterval: 2000,
    showAnimations: true,
    compactMode: false,
    simulatorPaused: false,
  },
};

// ── Type Definitions ───────────────────────────────────────────────

export interface AlarmSliceState {
  notifications: Notification[];
  isNotificationPanelOpen: boolean;
  isSettingsPanelOpen: boolean;
  isUserDropdownOpen: boolean;
  activeAlarms: Alarm[];
  alarmManager: AlarmManager;
  settings: {
    refreshInterval: number;
    showAnimations: boolean;
    compactMode: boolean;
    simulatorPaused: boolean;
  };
}

export interface AlarmSliceActions {
  toggleNotificationPanel: () => void;
  toggleSettingsPanel: () => void;
  toggleUserDropdown: () => void;
  closeAllPanels: () => void;
  addNotification: (n: Notification) => void;
  dismissNotification: (id: string) => void;
  markAllNotificationsRead: () => void;
  updateSettings: (patch: Partial<AlarmSliceState['settings']>) => void;
  setActiveAlarms: (alarms: Alarm[]) => void;
  acknowledgeAlarm: (alarmId: string) => void;
}

export type AlarmSlice = AlarmSliceState & AlarmSliceActions;

// ── Slice Creator ──────────────────────────────────────────────────

export const createAlarmSlice = (
  set: SliceSetter<AlarmSliceState>,
): AlarmSlice => ({
  ...INITIAL_ALARM_STATE,

  toggleNotificationPanel: () =>
    set((s: AlarmSliceState) => ({
      isNotificationPanelOpen: !s.isNotificationPanelOpen,
      isSettingsPanelOpen: false,
      isUserDropdownOpen: false,
    })),

  toggleSettingsPanel: () =>
    set((s: AlarmSliceState) => ({
      isSettingsPanelOpen: !s.isSettingsPanelOpen,
      isNotificationPanelOpen: false,
      isUserDropdownOpen: false,
    })),

  toggleUserDropdown: () =>
    set((s: AlarmSliceState) => ({
      isUserDropdownOpen: !s.isUserDropdownOpen,
      isNotificationPanelOpen: false,
      isSettingsPanelOpen: false,
    })),

  closeAllPanels: () =>
    set(() => ({
      isNotificationPanelOpen: false,
      isSettingsPanelOpen: false,
      isUserDropdownOpen: false,
    })),

  addNotification: (n) =>
    set((s: AlarmSliceState) => ({
      notifications: [...s.notifications, n],
    })),

  dismissNotification: (id) =>
    set((s: AlarmSliceState) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
    })),

  markAllNotificationsRead: () =>
    set((s: AlarmSliceState) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),

  updateSettings: (patch) =>
    set((s: AlarmSliceState) => ({
      settings: { ...s.settings, ...patch },
    })),

  setActiveAlarms: (alarms) =>
    set(() => ({
      activeAlarms: alarms,
    })),

  acknowledgeAlarm: (alarmId) =>
    set((s: AlarmSliceState) => {
      s.alarmManager.acknowledgeAlarm(alarmId);
      return { activeAlarms: s.alarmManager.getActiveAlarms() };
    }),
});
