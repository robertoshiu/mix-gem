'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { AlertTriangle, Eye, Shield, Users } from 'lucide-react';
import { ALL_ZONES, useArTrackingStore } from '@/stores/ar-tracking-store';

const ArTrackingScene = dynamic(
  () => import('@/components/babylon/ArTrackingScene').then((mod) => ({ default: mod.ArTrackingScene })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[calc(100dvh-104px)] items-center justify-center bg-[#0A1628] text-sm text-slate-300">
        <div className="rounded-2xl border border-cyan-400/30 bg-black/60 px-6 py-5 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl">
          <p className="animate-pulse font-mono motion-reduce:animate-none">Initializing AR tracking fab scene...</p>
        </div>
      </div>
    ),
  },
);

function areaNameForPosition(position: [number, number], inZone: string | null) {
  if (inZone) return ALL_ZONES.find((zone) => zone.id === inZone)?.name ?? inZone;
  const [x, z] = position;
  if (x < -12 && z > 5) return 'Litho walkway';
  if (x < -12 && z < -4) return 'Chemical aisle';
  if (x > 12 && z > 0) return 'Utility corridor';
  if (x > 8 && z < -4) return 'Metrology bay';
  return 'Central spine';
}

function PersonnelStatusPanel() {
  const personnel = useArTrackingStore((state) => state.personnel);
  const focusPersonnel = useArTrackingStore((state) => state.focusPersonnel);
  const switchPipTarget = useArTrackingStore((state) => state.switchPipTarget);

  return (
    <section className="pointer-events-auto w-[320px] rounded-2xl border border-cyan-400/20 bg-black/60 p-4 text-slate-100 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl" aria-label="Personnel status panel">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-300">Personnel telemetry</p>
          <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold"><Users className="h-4 w-4" /> Cleanroom patrol</h2>
        </div>
        <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 font-mono text-[10px] text-emerald-300">LIVE</span>
      </div>

      <div className="space-y-2">
        {personnel.map((person) => (
          <button
            key={person.id}
            type="button"
            onClick={() => focusPersonnel(person.id)}
            onDoubleClick={() => switchPipTarget(person.id)}
            className="flex min-h-[52px] w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/55 px-3 py-2 text-left transition-colors hover:border-cyan-300/45 hover:bg-cyan-400/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className={`h-2.5 w-2.5 rounded-full ${person.status === 'violation' ? 'bg-red-400 shadow-[0_0_16px_rgba(239,68,68,0.9)]' : 'bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.75)]'}`} />
              <span className="min-w-0">
                <span className="block font-mono text-sm font-semibold text-slate-50">{person.id} / {person.name}</span>
                <span className="block truncate text-xs text-slate-400">{areaNameForPosition(person.position, person.inZone)}</span>
              </span>
            </span>
            <span className={`rounded-full px-2 py-1 font-mono text-[10px] uppercase ${person.status === 'violation' ? 'bg-red-500/15 text-red-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
              {person.status}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">Click a row to center the overview camera. Double-click for PiP view.</p>
    </section>
  );
}

function AlertToastStack() {
  const allAlerts = useArTrackingStore((state) => state.alerts);
  const acknowledgeAlert = useArTrackingStore((state) => state.acknowledgeAlert);
  const switchPipTarget = useArTrackingStore((state) => state.switchPipTarget);
  const alerts = allAlerts.slice(0, 3);

  if (alerts.length === 0) {
    return (
      <section className="pointer-events-auto w-[360px] rounded-2xl border border-emerald-400/20 bg-black/50 p-4 text-slate-100 shadow-xl backdrop-blur-xl" aria-label="Alert stream">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-emerald-300" />
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-emerald-300">Restricted zones clear</p>
            <p className="text-sm text-slate-400">Waiting for patrol telemetry events.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pointer-events-none flex w-[380px] flex-col gap-3" aria-label="Critical AR alerts">
      {alerts.map((alert) => (
        <article key={alert.id} className="pointer-events-auto rounded-2xl border-l-4 border-red-500 bg-red-950/45 p-4 text-slate-100 shadow-2xl shadow-red-950/35 backdrop-blur-xl" role="alert" aria-live="assertive">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-red-300" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-red-300">CRITICAL</span>
                <span className="font-mono text-xs text-slate-400">{new Date(alert.timestamp).toLocaleTimeString('en-US')}</span>
              </div>
              <p className="mt-1 text-sm font-medium text-slate-100">{alert.personnelId} entered {alert.zoneName}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => switchPipTarget(alert.personnelId)}
                  className="inline-flex min-h-[36px] cursor-pointer items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition-colors hover:bg-cyan-300/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
                >
                  <Eye className="h-3.5 w-3.5" /> View PiP
                </button>
                <button
                  type="button"
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="min-h-[36px] cursor-pointer rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-300"
                >
                  Ack
                </button>
              </div>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

function PipOverlay() {
  const pipTarget = useArTrackingStore((state) => state.pipTarget);
  const closePip = useArTrackingStore((state) => state.closePip);
  if (!pipTarget) return null;

  return (
    <div className="pointer-events-auto absolute bottom-3 right-4 z-40">
      <div className="relative rounded-lg border border-cyan-400/40 bg-black/70 p-1 shadow-2xl shadow-cyan-950/40 backdrop-blur-sm">
        <div className="flex h-[180px] w-[240px] items-end justify-between rounded px-2 pb-2">
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-cyan-200">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            {pipTarget} LIVE
          </span>
          <button
            type="button"
            onClick={closePip}
            className="min-h-[28px] min-w-[28px] cursor-pointer rounded-full bg-black/50 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
            aria-label="Close picture-in-picture"
          >
            &times;
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ArTrackingPage() {
  const closePip = useArTrackingStore((state) => state.closePip);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePip();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closePip]);

  return (
    <div className="relative min-h-[calc(100dvh-104px)] overflow-hidden bg-[#0A1628] text-slate-100">
      <ArTrackingScene />
      <div className="pointer-events-none fixed inset-0 z-30">
        <div className="absolute left-4 top-[116px]">
          <PersonnelStatusPanel />
        </div>
        <div className="absolute right-4 top-[116px]">
          <AlertToastStack />
        </div>
        <PipOverlay />
      </div>
    </div>
  );
}
