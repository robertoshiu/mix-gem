'use client';

import { useEffect } from 'react';
import { useDashboardFacilityStore } from '@/stores/dashboard-facility-store';
import { SUBSYSTEM_IDS } from '@/lib/engines/dashboard-facility-types';
import { SubsystemCard } from '@/components/dashboard/SubsystemCard';
import { EventFeed } from '@/components/dashboard/EventFeed';

// ---------------------------------------------------------------------------
// FacilityTab — live synthetic monitoring for 5 facility subsystems
// ---------------------------------------------------------------------------

export function FacilityTab() {
  const tick_ = useDashboardFacilityStore((s) => s.tick_);
  const tick = useDashboardFacilityStore((s) => s.tick);
  const subsystems = useDashboardFacilityStore((s) => s.subsystems);
  const sparklines = useDashboardFacilityStore((s) => s.sparklines);
  const events = useDashboardFacilityStore((s) => s.events);

  // 1 Hz tick loop — only while mounted
  useEffect(() => {
    const id = window.setInterval(tick_, 1000);
    return () => window.clearInterval(id);
  }, [tick_]);

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <header className="rounded-3xl border border-[rgba(34,211,238,0.24)] bg-[rgba(2,6,23,0.72)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--sf-accent-cyan)]">
              Facility Subsystem Monitor
            </p>
            <h1 className="mt-2 text-3xl font-semibold uppercase tracking-[0.16em] md:text-4xl">
              Facility Systems
            </h1>
            <p className="mt-2 max-w-4xl text-sm text-[var(--sf-text-secondary)]">
              Live synthetic monitoring across EMS, BAS, Gas, Fire, and Power
              EMS &mdash; 3-minute deterministic cycle at 1&nbsp;Hz.
            </p>
          </div>
          <div
            className="rounded-full border border-[rgba(34,211,238,0.35)] px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--sf-accent-cyan)]"
            aria-live="polite"
          >
            Tick {tick}/180 &middot; 1Hz hash-mix
          </div>
        </div>
      </header>

      {/* Subsystem cards grid */}
      <section
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        aria-label="Facility subsystem cards"
      >
        {SUBSYSTEM_IDS.map((id) => (
          <SubsystemCard
            key={id}
            subsystemId={id}
            snapshot={subsystems[id]}
            sparklineData={sparklines[id].toArray()}
          />
        ))}
      </section>

      {/* Event feed */}
      <section aria-label="Facility event log">
        <EventFeed events={events.toArray()} currentTick={tick} />
      </section>
    </div>
  );
}
