'use client';

import type { AnalyticsTab } from '@/lib/analytics/types';
import { ANALYTICS_TABS } from '@/lib/analytics/constants';

interface AnalyticsTabBarProps {
  activeTab: AnalyticsTab;
  onTabChange: (tab: AnalyticsTab) => void;
}

export function AnalyticsTabBar({ activeTab, onTabChange }: AnalyticsTabBarProps) {
  return (
    <div role="tablist" className="flex border-b border-[var(--sf-border-default)] bg-[var(--sf-surface-card)] px-2 overflow-x-auto" aria-label="Analytics tabs">
      {ANALYTICS_TABS.map(({ id, label }) => (
        <button
          key={id}
          role="tab"
          aria-selected={activeTab === id}
          onClick={() => onTabChange(id)}
          className={`min-h-[44px] px-4 text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === id
              ? 'border-b-2 border-[var(--sf-border-active)] text-[var(--sf-text-primary)]'
              : 'text-[var(--sf-text-secondary)] hover:text-[var(--sf-text-primary)]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
