'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Eye, Shield, Users } from 'lucide-react';
import { ALL_ZONES, type AlertSeverity, useArTrackingStore } from '@/stores/ar-tracking-store';

const ALERT_SEVERITY_STYLES: Record<AlertSeverity, {
  articleClassName: string;
  color: string;
  iconClassName: string;
  label: string;
}> = {
  info: {
    articleClassName: 'alert-command-card hud-corner-panel w-[320px] max-w-full self-end rounded-2xl border border-amber-400/30 border-l-4 border-l-amber-400 bg-amber-950/30 p-3 text-slate-100 shadow-xl shadow-amber-950/20 backdrop-blur-xl transition-all duration-300',
    color: '#f59e0b',
    iconClassName: 'text-amber-300',
    label: 'NOTICE',
  },
  warning: {
    articleClassName: 'alert-command-card hud-corner-panel w-[360px] max-w-full self-end rounded-2xl border border-orange-500/35 border-l-4 border-l-orange-500 bg-orange-950/40 p-4 text-slate-100 shadow-2xl shadow-orange-950/30 backdrop-blur-xl transition-all duration-300 animate-pulse motion-reduce:animate-none',
    color: '#f97316',
    iconClassName: 'text-orange-300',
    label: 'WARNING',
  },
  critical: {
    articleClassName: 'alert-command-card hud-corner-panel w-full rounded-2xl border border-red-500/40 border-l-4 border-l-red-500 bg-red-950/45 p-4 text-slate-100 shadow-2xl shadow-red-950/40 ring-1 ring-red-500/30 backdrop-blur-xl transition-all duration-300 animate-pulse motion-reduce:animate-none',
    color: '#ef4444',
    iconClassName: 'text-red-300',
    label: 'CRITICAL',
  },
};

const ALERT_SEVERITY_ORDER: Record<AlertSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

const SIGNAL_BAR_HEIGHT_CLASSES = ['h-1.5', 'h-2.5', 'h-3.5'] as const;

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
    <section className="hud-command-panel hud-corner-panel pointer-events-auto relative w-[320px] overflow-hidden rounded-2xl border border-[rgba(34,211,238,0.42)] bg-[#060d1a]/90 p-4 text-slate-100 shadow-[0_0_34px_rgba(34,211,238,0.24),0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl" aria-label="Personnel status panel">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-cyan-400/70">SYS: TRACKING ACTIVE</p>
          <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold"><Users className="h-4 w-4" /> Cleanroom patrol</h2>
        </div>
        <span className="animate-pulse rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-1 font-mono text-[10px] text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.45)] motion-reduce:animate-none">LIVE</span>
      </div>

      <div className="space-y-2">
        {personnel.map((person) => (
          <button
            key={person.id}
            type="button"
            onClick={() => focusPersonnel(person.id)}
            onDoubleClick={() => switchPipTarget(person.id)}
            className="flex min-h-[58px] w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-[rgba(34,211,238,0.16)] bg-slate-950/70 px-3 py-2 text-left transition-colors hover:border-cyan-300/45 hover:bg-cyan-400/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className={`h-2.5 w-2.5 rounded-full ${person.status === 'violation' ? 'bg-red-400 shadow-[0_0_20px_rgba(239,68,68,0.9)]' : 'bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.8)]'}`} />
              <span className="min-w-0">
                <span className="block font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-50">
                  [{person.id}] [{person.name}] [{person.position[0].toFixed(1)},{person.position[1].toFixed(1)}] [{person.state}]
                </span>
                <span className="block truncate font-mono text-[10px] uppercase tracking-[0.08em] text-slate-400">{areaNameForPosition(person.position, person.inZone)}</span>
              </span>
            </span>
            <span className={`rounded-full px-2 py-1 font-mono text-[10px] uppercase ${person.status === 'violation' ? 'bg-red-500/15 text-red-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
              {person.status}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-slate-500">Click: center camera · double-click: PiP view.</p>
    </section>
  );
}

function AlertToastStack() {
  const allAlerts = useArTrackingStore((state) => state.alerts);
  const acknowledgeAlert = useArTrackingStore((state) => state.acknowledgeAlert);
  const switchPipTarget = useArTrackingStore((state) => state.switchPipTarget);
  const stackRef = useRef<HTMLElement | null>(null);
  const alerts = [...allAlerts]
    .sort((first, second) => (
      ALERT_SEVERITY_ORDER[first.severity] - ALERT_SEVERITY_ORDER[second.severity]
      || second.timestamp - first.timestamp
    ))
    .slice(0, 3);
  const topCriticalAlertId = alerts.find((alert) => alert.severity === 'critical')?.id;

  useEffect(() => {
    if (topCriticalAlertId) {
      stackRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' });
    }
  }, [topCriticalAlertId]);

  if (alerts.length === 0) {
    return (
      <section className="hud-corner-panel pointer-events-auto w-[360px] rounded-2xl border border-emerald-400/25 bg-black/55 p-4 text-slate-100 shadow-xl backdrop-blur-xl transition-all duration-300" aria-label="Alert stream">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-emerald-300" />
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-emerald-300">Restricted zones clear</p>
              <p className="font-mono text-sm text-slate-400">Waiting for patrol telemetry events.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={stackRef} className="pointer-events-none flex max-h-[calc(100dvh-140px)] w-[380px] flex-col gap-3 overflow-y-auto pr-1" aria-label="Critical AR alerts">
      {alerts.map((alert) => {
        const severityStyle = ALERT_SEVERITY_STYLES[alert.severity];

        return (
        <article key={alert.id} className={`pointer-events-auto ${severityStyle.articleClassName}`} style={{ borderLeftColor: severityStyle.color }} role="alert" aria-live={alert.severity === 'info' ? 'polite' : 'assertive'}>
          <div className="flex items-start gap-3">
            <AlertTriangle className={`mt-0.5 h-5 w-5 flex-none ${severityStyle.iconClassName}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold" style={{ color: severityStyle.color }}>{severityStyle.label}</span>
                <span className="font-mono text-xs text-slate-400">{new Date(alert.timestamp).toLocaleTimeString('en-US')}</span>
              </div>
              <p className="mt-1 font-mono text-sm font-medium text-slate-100">{alert.personnelId} entered {alert.zoneName}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => switchPipTarget(alert.personnelId)}
                  className="inline-flex min-h-[36px] cursor-pointer items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-300/10 px-3 py-1.5 font-mono text-xs font-semibold text-cyan-100 transition-colors hover:bg-cyan-300/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
                >
                  <Eye className="h-3.5 w-3.5" /> View PiP
                </button>
                <button
                  type="button"
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="min-h-[36px] cursor-pointer rounded-full border border-white/10 px-3 py-1.5 font-mono text-xs text-slate-300 transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-300"
                >
                  Ack
                </button>
              </div>
            </div>
          </div>
        </article>
        );
      })}
    </section>
  );
}

function PipOverlay() {
  const pipTarget = useArTrackingStore((state) => state.pipTarget);
  const closePip = useArTrackingStore((state) => state.closePip);
  const alerts = useArTrackingStore((state) => state.alerts);
  const [timeStr, setTimeStr] = useState('');
  const [recVisible, setRecVisible] = useState(true);
  const [signalBars, setSignalBars] = useState(3);
  const activePipAlert = pipTarget
    ? alerts.filter((alert) => !alert.acknowledged).find((alert) => alert.personnelId === pipTarget)
    : undefined;
  const pipSeverityStyle = activePipAlert ? ALERT_SEVERITY_STYLES[activePipAlert.severity] : undefined;

  useEffect(() => {
    const updateTime = () => setTimeStr(new Date().toLocaleTimeString('en-US', { hour12: false }));

    updateTime();
    const timerId = setInterval(updateTime, 1000);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    const blinkId = setInterval(() => setRecVisible((visible) => !visible), 500);
    return () => clearInterval(blinkId);
  }, []);

  useEffect(() => {
    const signalId = setInterval(() => setSignalBars(2 + Math.floor(Math.random() * 2)), 1500);
    return () => clearInterval(signalId);
  }, []);

  if (!pipTarget) return null;

  const camId = `CAM-${pipTarget.split('-')[1] ?? pipTarget}`;

  return (
    <div className="pointer-events-auto absolute bottom-3 right-4 z-40">
      <div
        className={`pip-surveillance-frame hud-corner-panel relative overflow-hidden rounded-lg border-2 border-[var(--sf-accent-cyan)] bg-[var(--sf-overlay-backdrop)] p-1 shadow-2xl shadow-cyan-950/40 backdrop-blur-sm ${pipSeverityStyle ? 'animate-pulse motion-reduce:animate-none' : ''}`}
        style={pipSeverityStyle ? { boxShadow: `0 0 22px ${pipSeverityStyle.color}66` } : undefined}
      >
        <div className="relative flex h-[180px] w-[240px] rounded bg-slate-950/10 px-2 py-1.5 font-mono">
          <div className="absolute left-2 right-2 top-1 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 text-[9px] font-semibold tracking-[0.18em] text-[var(--sf-status-red)]">
              <span className={`inline-block h-1.5 w-1.5 rounded-full bg-[var(--sf-status-red)] shadow-[0_0_8px_var(--sf-status-red)] transition-opacity duration-200 ${recVisible ? 'opacity-100' : 'opacity-25'}`} />
              REC
            </span>
            <span className="text-[9px] font-semibold tracking-[0.18em] text-[var(--sf-accent-cyan)]">{camId}</span>
            <span className="flex h-3 items-end gap-0.5" aria-label={`${signalBars} of 3 signal bars`}>
              {[1, 2, 3].map((bar, index) => (
                <span
                  key={bar}
                  className={`${SIGNAL_BAR_HEIGHT_CLASSES[index]} w-1 rounded-sm transition-colors duration-200 ${bar <= signalBars ? 'bg-[var(--sf-accent-cyan)]' : 'bg-[var(--sf-text-muted)]/40'}`}
                  aria-hidden="true"
                />
              ))}
            </span>
          </div>
          <div className="absolute bottom-1 left-2 right-2 flex items-end justify-between gap-2">
            <span className="text-[9px] tabular-nums tracking-[0.12em] text-[var(--sf-text-secondary)]">{timeStr}</span>
          <button
            type="button"
            onClick={closePip}
              className="min-h-[28px] min-w-[28px] cursor-pointer rounded-full bg-black/50 px-1.5 py-0.5 text-[10px] text-[var(--sf-text-secondary)] transition-colors hover:bg-white/10 hover:text-[var(--sf-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sf-accent-cyan)]"
            aria-label="Close picture-in-picture"
          >
            &times;
          </button>
          </div>
        </div>
      </div>
      <style jsx>{`
        .pip-surveillance-frame {
          --pip-sweep-distance: 188px;
        }

        .pip-surveillance-frame::after {
          animation: pip-overlay-sweep 2s linear infinite;
          background: linear-gradient(
            90deg,
            transparent,
            color-mix(in srgb, var(--sf-accent-cyan) 72%, transparent),
            transparent
          );
          content: '';
          height: 2px;
          left: 0;
          opacity: 0.78;
          pointer-events: none;
          position: absolute;
          right: 0;
          top: 0;
        }

        @keyframes pip-overlay-sweep {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(var(--pip-sweep-distance));
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .pip-surveillance-frame::after {
            animation: none;
          }
        }
      `}</style>
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
      <style jsx>{`
        :global(body)::after {
          content: '';
          position: fixed;
          inset: 0;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 20, 40, 0.03) 2px, rgba(0, 20, 40, 0.03) 4px);
          pointer-events: none;
          z-index: 9999;
        }

        :global(.hud-corner-panel) {
          --hud-corner-color: rgba(34, 211, 238, 0.72);
          position: relative;
        }

        :global(.hud-corner-panel)::before {
          background:
            linear-gradient(var(--hud-corner-color), var(--hud-corner-color)) left top / 28px 1px no-repeat,
            linear-gradient(var(--hud-corner-color), var(--hud-corner-color)) left top / 1px 28px no-repeat,
            linear-gradient(var(--hud-corner-color), var(--hud-corner-color)) right top / 28px 1px no-repeat,
            linear-gradient(var(--hud-corner-color), var(--hud-corner-color)) right top / 1px 28px no-repeat,
            linear-gradient(var(--hud-corner-color), var(--hud-corner-color)) left bottom / 28px 1px no-repeat,
            linear-gradient(var(--hud-corner-color), var(--hud-corner-color)) left bottom / 1px 28px no-repeat,
            linear-gradient(var(--hud-corner-color), var(--hud-corner-color)) right bottom / 28px 1px no-repeat,
            linear-gradient(var(--hud-corner-color), var(--hud-corner-color)) right bottom / 1px 28px no-repeat;
          border-radius: inherit;
          content: '';
          inset: 0;
          opacity: 0.82;
          pointer-events: none;
          position: absolute;
          z-index: 1;
        }

        :global(.hud-command-panel)::after {
          background: linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.52), transparent);
          content: '';
          height: 1px;
          left: 0;
          opacity: 0.75;
          pointer-events: none;
          position: absolute;
          right: 0;
          top: 0;
        }

        :global(.alert-command-card) {
          animation: hud-toast-slide-in 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes hud-toast-slide-in {
          from {
            opacity: 0;
            transform: translateX(18px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          :global(.alert-command-card) {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
