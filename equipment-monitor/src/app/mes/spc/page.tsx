'use client';

import { useEffect, useRef, useState } from 'react';
import { useMesSpcStore } from '@/stores/mes-spc-store';
import { SimulatorEngine } from '@/lib/simulator-engine';
import { generateSeedMeasurements } from '@/lib/mes-mock-data';
import { SPC_PARAMETERS, SPC_PARAM_KEYS } from '@/lib/spc-parameters';
import { makeS2F41Resume, makeS2F42Ack } from '@/lib/secs-message-log';
import { KpiStrip } from '@/components/spc/KpiStrip';
import { ControlChart } from '@/components/spc/ControlChart';
import { ThumbnailChart } from '@/components/spc/ThumbnailChart';
import { FaultInjector } from '@/components/spc/FaultInjector';
import { ViolationCard } from '@/components/spc/ViolationCard';
import { EventLog } from '@/components/spc/EventLog';
import type { SpcParameter } from '@/lib/mes-types';

export default function SpcPage() {
  const store = useMesSpcStore();
  const engineRef = useRef<SimulatorEngine | null>(null);
  const [activeParam, setActiveParam] = useState<SpcParameter>('cd');

  // Initialize: seed measurements + start simulator
  useEffect(() => {
    const { lots, startProcessing, addMeasurement } = useMesSpcStore.getState();
    const activeLot = lots.find((l) => l.status === 'in_process') ?? lots[0];

    // Seed 10 pre-existing wafers
    const seeds = generateSeedMeasurements(activeLot.id, 10);
    seeds.forEach(addMeasurement);
    useMesSpcStore.setState({ waferNumber: 11 });

    startProcessing(activeLot.id, activeLot.recipeId);

    engineRef.current = new SimulatorEngine();
    engineRef.current.start();

    return () => engineRef.current?.stop();
  }, []);

  const { measurements, violations, events, activeFault, equipmentState, activeLotId } = store;

  const activeLot = store.lots.find((l) => l.id === activeLotId) ?? store.lots[0];
  const lotMeasurements = measurements.filter((m) => m.lotId === activeLot?.id);
  const latest = lotMeasurements[lotMeasurements.length - 1] ?? null;
  const activeViolation = violations.find((v) => !v.acknowledged) ?? null;

  // Build chart data for active parameter
  const chartData = lotMeasurements.map((m) => ({
    waferNumber: m.waferNumber,
    value: m[activeParam as keyof typeof m] as number,
    isViolation: violations.some((v) => v.waferNumber === m.waferNumber && v.parameter === activeParam),
  }));

  function handleAcknowledge(violationId: string) {
    store.acknowledgeViolation(violationId);
    store.clearFault();
    store.addEvent(makeS2F41Resume());
    store.addEvent(makeS2F42Ack());
    engineRef.current?.start();
  }

  return (
    <div className="p-4 space-y-4">
      {/* KPI Strip */}
      <KpiStrip
        latest={latest}
        hasViolation={!!activeViolation}
        violatedParam={activeViolation?.parameter}
      />

      {/* Main Control Chart */}
      <ControlChart
        paramLabel={`${SPC_PARAMETERS[activeParam].label} (${activeParam.toUpperCase()})`}
        config={SPC_PARAMETERS[activeParam]}
        data={chartData}
      />

      {/* Thumbnail Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {SPC_PARAM_KEYS.map((param) => {
          const thumbData = lotMeasurements.map((m) => ({
            waferNumber: m.waferNumber,
            value: m[param as keyof typeof m] as number,
          }));
          return (
            <ThumbnailChart
              key={param}
              label={param.toUpperCase()}
              unit={SPC_PARAMETERS[param].unit}
              data={thumbData}
              ucl={SPC_PARAMETERS[param].ucl}
              lcl={SPC_PARAMETERS[param].lcl}
              isActive={activeParam === param}
              onClick={() => setActiveParam(param)}
            />
          );
        })}
        {/* Fault Injector as 6th tile */}
        <FaultInjector
          activeFault={activeFault}
          currentWafer={store.waferNumber}
          onInject={(fault) => store.injectFault(fault)}
          onClear={() => store.clearFault()}
        />
      </div>

      {/* Bottom Row: Event Log + Violation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="min-h-40">
          <EventLog events={events} />
        </div>

        <div className="space-y-2">
          {violations.length === 0 && (
            <div className="bg-[#111D2E] border border-[#1E3A5F] rounded p-3 text-xs text-[#475569]">
              No violations — system in control
            </div>
          )}
          {violations.map((v) => (
            <ViolationCard key={v.id} violation={v} onAcknowledge={handleAcknowledge} />
          ))}
        </div>
      </div>

      {/* Equipment State Banner */}
      {equipmentState === 'inhibited' && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-950 border border-[#EF4444] rounded px-4 py-2 text-sm font-semibold text-[#EF4444] z-50">
          Equipment Inhibited — Acknowledge violation to resume
        </div>
      )}
    </div>
  );
}
