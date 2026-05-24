'use client';

import type { KeyboardEvent, ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DashboardTabId = 'fab-flow' | 'facility';

interface DashboardTabsProps {
  activeTab: DashboardTabId;
  onTabChange: (tab: DashboardTabId) => void;
  children: ReactNode;
}

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS: { id: DashboardTabId; label: string }[] = [
  { id: 'fab-flow', label: 'Fab Flow' },
  { id: 'facility', label: 'Facility Systems' },
];

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const ACTIVE_CLS =
  'bg-[rgba(34,211,238,0.12)] text-[var(--sf-accent-cyan)] shadow-[0_0_12px_rgba(34,211,238,0.15)]';
const INACTIVE_CLS =
  'text-[var(--sf-text-muted)] hover:text-[var(--sf-text-secondary)]';
const BTN_BASE =
  'rounded-lg px-5 py-2 font-mono text-xs font-semibold uppercase tracking-[0.2em] transition-colors';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DashboardTabs({ activeTab, onTabChange, children }: DashboardTabsProps) {
  const activeIndex = TABS.findIndex((tab) => tab.id === activeTab);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      onTabChange(TABS[(activeIndex + 1) % TABS.length].id);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      onTabChange(TABS[(activeIndex - 1 + TABS.length) % TABS.length].id);
    }
    if (event.key === 'Home') {
      event.preventDefault();
      onTabChange(TABS[0].id);
    }
    if (event.key === 'End') {
      event.preventDefault();
      onTabChange(TABS[TABS.length - 1].id);
    }
  };

  return (
    <div>
      {/* Tab bar */}
      <div
        className="mb-6 inline-flex rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(2,6,23,0.5)] p-1 backdrop-blur-sm"
        role="tablist"
        aria-label="Dashboard views"
        onKeyDown={handleKeyDown}
      >
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          const tabId = `dashboard-tab-${tab.id}`;
          const panelId = `dashboard-panel-${tab.id}`;
          return (
            <button
              key={tab.id}
              id={tabId}
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId}
              tabIndex={isActive ? 0 : -1}
              className={`${BTN_BASE} ${isActive ? ACTIVE_CLS : INACTIVE_CLS}`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div
        id={`dashboard-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`dashboard-tab-${activeTab}`}
      >
        {children}
      </div>
    </div>
  );
}
