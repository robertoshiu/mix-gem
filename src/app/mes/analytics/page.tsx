'use client';

import { useAnalyticsStore } from '@/stores/analytics-store';
import { AnalyticsTabBar } from '@/components/analytics/AnalyticsTabBar';
import { YieldTab } from '@/components/analytics/YieldTab';
import { ApcTab } from '@/components/analytics/ApcTab';
import { ReliabilityTab } from '@/components/analytics/ReliabilityTab';
import { OptimizationTab } from '@/components/analytics/OptimizationTab';
import { ReplicationTab } from '@/components/analytics/ReplicationTab';
import { VppTab } from '@/components/analytics/VppTab';

const TAB_COMPONENTS = {
  vpp: VppTab,
  apc: ApcTab,
  yield: YieldTab,
  reliability: ReliabilityTab,
  optimization: OptimizationTab,
  replication: ReplicationTab,
} as const;

export default function AnalyticsPage() {
  const { activeTab, setTab } = useAnalyticsStore();
  const TabComponent = TAB_COMPONENTS[activeTab];

  return (
    <div data-testid="analytics-page" className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-0">
        <div className="text-xs text-[var(--smartfactory-text-muted)]">MES / Analytics</div>
        <h2 className="text-lg font-semibold text-[var(--smartfactory-text-primary)]">
          Advanced Analytics
        </h2>
      </div>

      <AnalyticsTabBar activeTab={activeTab} onTabChange={setTab} />

      <div className="flex-1 overflow-y-auto p-4">
        <TabComponent />
      </div>
    </div>
  );
}
