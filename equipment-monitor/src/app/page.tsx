"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { EquipmentSidebar } from "@/components/equipment/equipment-sidebar";
import { useEquipmentStore } from "@/stores/equipment-store";
import {
  mockEquipment,
  mockParameters,
  mockAlarms,
  generateTrendData,
} from "@/lib/mock-data";
import { EquipmentBottomSheet } from "@/components/equipment/equipment-bottom-sheet";

import { lazy, Suspense } from "react";
import { AlertBanner } from '@/components/alerts/alert-banner';
import { ChartSyncProvider } from '@/components/charts/chart-sync-provider';
import { ErrorBoundary } from '@/components/error-boundary';
import { LoadingChart } from '@/components/charts/loading-chart';

const TrendChart = lazy(() => import('@/components/charts/trend-chart').then((m) => ({ default: m.TrendChart })));
const GaugeCard = lazy(() => import('@/components/charts/gauge-card').then((m) => ({ default: m.GaugeCard })));

export default function DashboardPage() {
  const { equipment, selectedEquipmentId, setEquipment, selectEquipment } =
    useEquipmentStore();
  const [trendData, setTrendData] = useState(generateTrendData(1, 2.3, 3));
  const [alarms, setAlarms] = useState(mockAlarms);

  const acknowledgeAlarm = (id: string) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    );
  };

  // Initialize with mock data
  useEffect(() => {
    setEquipment(mockEquipment);
    // Select first equipment by default
    if (mockEquipment.length > 0) {
      selectEquipment(mockEquipment[0].id);
    }
  }, [setEquipment, selectEquipment]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTrendData((prev) => {
        const newPoint = {
          timestamp: Date.now(),
          value: 2.3 + (Math.random() - 0.5) * 6,
        };
        return [...prev.slice(1), newPoint];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const activeAlarms = alarms.filter((a) => !a.acknowledged);
  const criticalAlarms = activeAlarms.filter((a) => a.severity === 'CRITICAL');
  const selectedEquipment = equipment.find((e) => e.id === selectedEquipmentId);

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <EquipmentSidebar
          className="hidden md:block"
        />

        <main className="flex-1 overflow-y-auto p-6">
          {selectedEquipment && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-50">
                  {selectedEquipment.name}
                </h2>
                <p className="text-sm text-slate-400">
                  {selectedEquipment.currentRecipe || "No active recipe"}
                </p>
              </div>

              {criticalAlarms.length > 0 && (
                <div className="mb-6 space-y-2">
                  {criticalAlarms.map((alarm) => (
                    <AlertBanner
                      key={alarm.id}
                      alarm={alarm}
                      onAcknowledge={acknowledgeAlarm}
                    />
                  ))}
                </div>
              )}

              {/* Gauge Cards */}
              <div
                data-testid="gauge-grid"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6"
              >
                {mockParameters.map((param) => (
                  <ErrorBoundary key={param.name}>
                    <Suspense fallback={<LoadingChart title={param.name} />}>
                      <GaugeCard parameter={param} />
                    </Suspense>
                  </ErrorBoundary>
                ))}
              </div>

              {/* Trend Charts */}
              <ChartSyncProvider>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <ErrorBoundary>
                    <Suspense fallback={<LoadingChart title="Focus Offset" />}>
                      <TrendChart
                        title="Focus Offset"
                        data={trendData}
                        unit="nm"
                        lsl={-10}
                        usl={10}
                        currentValue={trendData[trendData.length - 1]?.value}
                      />
                    </Suspense>
                  </ErrorBoundary>
                  <ErrorBoundary>
                    <Suspense fallback={<LoadingChart title="CDU" />}>
                      <TrendChart
                        title="CDU"
                        data={generateTrendData(1, 3.5, 1.5)}
                        unit="nm"
                        lsl={0}
                        usl={5}
                        currentValue={4.2}
                      />
                    </Suspense>
                  </ErrorBoundary>
                </div>
              </ChartSyncProvider>
            </>
          )}
        </main>
      </div>
      <EquipmentBottomSheet
        equipment={equipment}
        selectedId={selectedEquipmentId}
        onSelect={selectEquipment}
      />
    </div>
  );
}
