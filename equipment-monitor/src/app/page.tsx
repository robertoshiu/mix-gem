"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { EquipmentSidebar } from "@/components/equipment/equipment-sidebar";
import { GaugeCard } from "@/components/charts/gauge-card";
import { TrendChart } from "@/components/charts/trend-chart";
import { useEquipmentStore } from "@/stores/equipment-store";
import {
  mockEquipment,
  mockParameters,
  mockAlarms,
  generateTrendData,
} from "@/lib/mock-data";
import { EquipmentBottomSheet } from "@/components/equipment/equipment-bottom-sheet";

export default function DashboardPage() {
  const { equipment, selectedEquipmentId, setEquipment, selectEquipment } =
    useEquipmentStore();
  const [trendData, setTrendData] = useState(generateTrendData(1, 2.3, 3));

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

  const activeAlarms = mockAlarms.filter((a) => !a.acknowledged);
  const selectedEquipment = equipment.find((e) => e.id === selectedEquipmentId);

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      <Header alarmCount={activeAlarms.length} />

      <div className="flex flex-1 overflow-hidden">
        <EquipmentSidebar
          equipment={equipment}
          selectedId={selectedEquipmentId}
          onSelect={selectEquipment}
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

              {/* Gauge Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {mockParameters.map((param) => (
                  <GaugeCard key={param.name} parameter={param} />
                ))}
              </div>

              {/* Trend Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <TrendChart
                  title="Focus Offset"
                  data={trendData}
                  unit="nm"
                  lsl={-10}
                  usl={10}
                  currentValue={trendData[trendData.length - 1]?.value}
                />
                <TrendChart
                  title="CDU"
                  data={generateTrendData(1, 3.5, 1.5)}
                  unit="nm"
                  lsl={0}
                  usl={5}
                  currentValue={4.2}
                />
              </div>
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
