'use client';

import type { LithoDashboardKind, WaferSite } from '@/lib/litho-mock-data';

interface WaferMapProps {
  sites: WaferSite[];
  mode: LithoDashboardKind;
  unit: string;
}

function siteColor(mode: LithoDashboardKind, value: number) {
  if (mode === 'overlay') return value > 2.4 ? '#ef4444' : value > 1.6 ? '#f59e0b' : '#22d3ee';
  if (mode === 'cd') return value > 46.2 ? '#ef4444' : value < 44.4 ? '#38bdf8' : '#10b981';
  return value > 100.35 ? '#f59e0b' : value < 99.75 ? '#38bdf8' : '#10b981';
}

export function WaferMap({ sites, mode, unit }: WaferMapProps) {
  return (
    <div className="rounded-2xl border border-[rgba(34,211,238,0.28)] bg-[rgba(2,6,23,0.72)] p-4 shadow-[0_0_28px_rgba(34,211,238,0.1)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sf-text-primary)]">Wafer Map</h2>
        <span className="rounded-full border border-[rgba(34,211,238,0.35)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--sf-accent-cyan)]">{mode}</span>
      </div>
      <svg viewBox="0 0 320 320" role="img" aria-label={`${mode} wafer map`} className="mx-auto aspect-square w-full max-w-[520px] overflow-visible">
        <defs>
          <filter id={`wafer-glow-${mode}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <pattern id={`wafer-hex-${mode}`} width="24" height="21" patternUnits="userSpaceOnUse">
            <path d="M 12 0 L 24 7 L 24 14 L 12 21 L 0 14 L 0 7 Z" fill="none" stroke="rgba(34,211,238,0.14)" strokeWidth="0.8" />
          </pattern>
        </defs>
        <circle cx="160" cy="160" r="145" fill="#0A0A0F" stroke="#22d3ee" strokeWidth="2" filter={`url(#wafer-glow-${mode})`} />
        <circle cx="160" cy="160" r="126" fill={`url(#wafer-hex-${mode})`} stroke="rgba(148,163,184,0.28)" strokeDasharray="6 6" />
        <path d="M 145 301 Q 160 290 175 301" fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
        {mode === 'dose' && [52, 86, 118].map((r) => <circle key={r} cx="160" cy="160" r={r} fill="none" stroke="rgba(245,158,11,0.28)" strokeWidth="2" strokeDasharray="5 8" />)}
        {sites.map((site) => {
          const x = 160 + site.x * 126;
          const y = 160 + site.y * 126;
          const color = siteColor(mode, site.value);
          if (mode === 'overlay' && site.dx !== undefined && site.dy !== undefined) {
            return (
              <g key={site.id}>
                <line x1={x} y1={y} x2={x + site.dx * 9} y2={y - site.dy * 9} stroke={color} strokeWidth="1.6" strokeLinecap="round" filter={`url(#wafer-glow-${mode})`} />
                <circle cx={x} cy={y} r="3.2" fill={color}><title>{`${site.value} ${unit}`}</title></circle>
              </g>
            );
          }
          return <circle key={site.id} cx={x} cy={y} r={mode === 'dose' ? 6.5 : 5.5} fill={color} opacity="0.9" filter={`url(#wafer-glow-${mode})`}><title>{`${site.value} ${unit}`}</title></circle>;
        })}
      </svg>
    </div>
  );
}
