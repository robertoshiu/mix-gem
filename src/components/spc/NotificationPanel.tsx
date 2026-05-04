'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle, AlertCircle, Info, CheckCheck, BellOff } from 'lucide-react';
import { useMesSpcStore } from '@/stores/mes-spc-store';
import { slideInRight, useReducedMotion } from '@/lib/animation';

function formatTimestamp(date: Date): string {
  const d = date instanceof Date ? date : new Date(date);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  const ss = d.getSeconds().toString().padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

const SEVERITY_CONFIG: Record<string, { icon: React.FC<React.SVGProps<SVGSVGElement>>; color: string }> = {
  critical: { icon: AlertTriangle, color: 'var(--smartfactory-status-red)' },
  warning: { icon: AlertCircle, color: 'var(--smartfactory-status-amber)' },
  info: { icon: Info, color: 'var(--smartfactory-accent-blue)' },
};

export function NotificationPanel() {
  const {
    notifications,
    markAllNotificationsRead,
    dismissNotification,
    closeAllPanels,
  } = useMesSpcStore();

  const unreadCount = notifications.filter((n) => !n.read).length;
  const reduced = useReducedMotion();
  const slideInRightProps = reduced ? {} : { variants: slideInRight, initial: 'initial' as const, animate: 'animate' as const };

  const handleClearAll = () => {
    notifications.forEach((n) => dismissNotification(n.id));
    closeAllPanels();
  };

  return (
    <motion.div {...slideInRightProps}>
    <div
      className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-lg shadow-lg z-50 border"
      style={{
        backgroundColor: 'var(--smartfactory-surface-panel)',
        borderColor: 'var(--smartfactory-border-default)',
      }}
      data-testid="notification-panel"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b sticky top-0"
        style={{
          backgroundColor: 'var(--smartfactory-surface-panel)',
          borderColor: 'var(--smartfactory-border-default)',
        }}
      >
        <span
          className="text-sm font-semibold flex items-center gap-2"
          style={{ color: 'var(--smartfactory-text-primary)' }}
        >
          Notifications
          {unreadCount > 0 && (
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded-full"
              style={{
                color: 'var(--smartfactory-text-primary)',
                backgroundColor: 'var(--smartfactory-accent-blue)',
              }}
            >
              {unreadCount}
            </span>
          )}
        </span>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllNotificationsRead}
            className="flex items-center gap-1 text-xs font-medium cursor-pointer transition-colors hover:opacity-80"
            style={{ color: 'var(--smartfactory-accent-blue)' }}
            data-testid="mark-all-read"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Notification list or empty state */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <BellOff
            className="w-8 h-8"
            style={{ color: 'var(--smartfactory-text-muted)' }}
          />
          <span
            className="text-xs"
            style={{ color: 'var(--smartfactory-text-muted)' }}
          >
            No notifications
          </span>
        </div>
      ) : (
        <div
          className="divide-y"
          style={{ borderColor: 'var(--smartfactory-border-default)' }}
        >
          {notifications.slice(0, 5).map((n) => {
            const severityIcon = SEVERITY_CONFIG[n.severity]?.icon ?? Info;
            const severityColor = SEVERITY_CONFIG[n.severity]?.color ?? 'var(--smartfactory-accent-blue)';
            const SeverityIcon = severityIcon;

            return (
              <div
                key={n.id}
                className="flex items-start gap-3 px-4 py-3"
                style={{
                  backgroundColor: !n.read ? 'var(--smartfactory-surface-elevated)' : undefined,
                }}
                data-testid={`notification-item-${n.id}`}
              >
                <SeverityIcon
                  className="w-4 h-4 mt-0.5 shrink-0"
                  style={{ color: severityColor }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: 'var(--smartfactory-text-muted)' }}
                    >
                      {formatTimestamp(n.timestamp)}
                    </span>
                  </div>
                  <p
                    className={`text-xs ${!n.read ? 'font-semibold' : 'font-medium'} truncate`}
                    style={{ color: 'var(--smartfactory-text-primary)' }}
                  >
                    {n.title}
                  </p>
                  <p
                    className="text-[11px] line-clamp-2 mt-0.5"
                    style={{ color: 'var(--smartfactory-text-secondary)' }}
                  >
                    {n.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => dismissNotification(n.id)}
                  className="shrink-0 cursor-pointer transition-colors hover:opacity-80 p-0.5 rounded"
                  style={{ color: 'var(--smartfactory-text-muted)' }}
                  aria-label={`Dismiss notification: ${n.title}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      {notifications.length > 0 && (
        <div
          className="px-4 py-2 border-t sticky bottom-0"
          style={{
            backgroundColor: 'var(--smartfactory-surface-panel)',
            borderColor: 'var(--smartfactory-border-default)',
          }}
        >
          <button
            type="button"
            onClick={handleClearAll}
            className="w-full text-xs font-medium py-1.5 rounded cursor-pointer transition-colors hover:opacity-80 text-center"
            style={{ color: 'var(--smartfactory-text-secondary)' }}
            data-testid="clear-all"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
    </motion.div>
  );
}

export default NotificationPanel;
