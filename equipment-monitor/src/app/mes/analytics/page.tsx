'use client';

import { useEffect } from 'react';
import { useAnalyticsStore } from '@/stores/analytics-store';
import { useAnalyticsSimStore } from '@/stores/analytics-sim-store';
import { AnalyticsTabBar } from '@/components/analytics/AnalyticsTabBar';
import { FabHealthHero } from '@/components/analytics/FabHealthHero';
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

  // Single tick driver for the whole /mes/analytics route. The store owns the
  // interval; here we only start it on mount and CLEAR it on unmount (mirrors
  // FacilityTab's setInterval/clearInterval pattern — exactly one driver).
  const startSim = useAnalyticsSimStore((s) => s.start);
  const stopSim = useAnalyticsSimStore((s) => s.stop);
  useEffect(() => {
    startSim();
    return () => stopSim();
  }, [startSim, stopSim]);

  return (
    <div data-testid="analytics-page" className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-0">
        <div className="text-xs text-[var(--smartfactory-text-muted)]">MES / Analytics</div>
        <h2 className="text-lg font-semibold text-[var(--smartfactory-text-primary)]">
          Advanced Analytics
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <FabHealthHero />
        </div>

        <AnalyticsTabBar activeTab={activeTab} onTabChange={setTab} />

        <div className="p-4">
          <TabComponent />
        </div>
      </div>
    </div>
  );
}
