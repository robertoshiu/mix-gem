'use client';

import { EDA_STAGE_DEFINITIONS } from '@/lib/eda-mock-data';
import type { StageMetrics, StageState, TechNode } from '@/lib/eda-types';

function rows(metrics: StageMetrics): Array<[string, string, 'normal' | 'warn' | 'alarm']> {
  switch (metrics.kind) {
    case 'rtl':
      return [
        ['Line count', metrics.lineCount.toLocaleString(), 'normal'],
        ['Modules', metrics.moduleCount.toLocaleString(), 'normal'],
        ['Lint warnings', String(metrics.lintWarnings), metrics.lintWarnings > 12 ? 'warn' : 'normal'],
        ['Coverage', `${metrics.coverage.toFixed(1)}%`, metrics.coverage < 88 ? 'warn' : 'normal'],
      ];
    case 'synthesis':
      return [
        ['Gate count', metrics.gateCount.toLocaleString(), 'normal'],
        ['Area', `${metrics.area.toFixed(2)} um2`, 'normal'],
        ['Max freq', `${metrics.maxFreq.toFixed(2)} GHz`, 'normal'],
        ['Power', `${metrics.power.toFixed(1)} mW`, metrics.power > 900 ? 'alarm' : metrics.power > 780 ? 'warn' : 'normal'],
        ['Slack', `${metrics.slack.toFixed(3)} ns`, metrics.slack < 0 ? 'warn' : 'normal'],
      ];
    case 'floorplan':
      return [
        ['Die area', `${metrics.dieArea.toFixed(2)} mm2`, 'normal'],
        ['Utilization', `${metrics.utilization.toFixed(1)}%`, metrics.utilization > 86 ? 'alarm' : metrics.utilization > 78 ? 'warn' : 'normal'],
        ['Macros', String(metrics.macroCount), 'normal'],
        ['Aspect ratio', metrics.aspectRatio.toFixed(2), 'normal'],
      ];
    case 'place_route':
      return [
        ['Cell count', metrics.cellCount.toLocaleString(), 'normal'],
        ['Routed nets', metrics.routedNets.toLocaleString(), 'normal'],
        ['Wire length', `${metrics.wireLength.toFixed(1)} mm`, 'normal'],
        ['Congestion', `${metrics.congestion.toFixed(1)}%`, metrics.congestion > 85 ? 'alarm' : metrics.congestion > 72 ? 'warn' : 'normal'],
        ['DRC violations', String(metrics.drcViolations), metrics.drcViolations > 180 ? 'warn' : 'normal'],
      ];
    case 'cts':
      return [
        ['Clock skew', `${metrics.clockSkew.toFixed(1)} ps`, metrics.clockSkew > 65 ? 'alarm' : metrics.clockSkew > 45 ? 'warn' : 'normal'],
        ['Buffers', metrics.bufferCount.toLocaleString(), 'normal'],
        ['Insertion delay', `${metrics.insertionDelay.toFixed(3)} ns`, 'normal'],
        ['Power overhead', `${metrics.powerOverhead.toFixed(1)} mW`, 'normal'],
      ];
    case 'sta':
      return [
        ['WNS', `${metrics.wns.toFixed(3)} ns`, metrics.wns < 0 ? 'alarm' : 'normal'],
        ['TNS', `${metrics.tns.toFixed(2)} ns`, metrics.tns < 0 ? 'warn' : 'normal'],
        ['Failing paths', String(metrics.failingPaths), metrics.failingPaths > 0 ? 'warn' : 'normal'],
        ['Hold violations', String(metrics.holdViolations), metrics.holdViolations > 0 ? 'warn' : 'normal'],
      ];
    case 'drc_lvs':
      return [
        ['DRC errors', String(metrics.drcErrors), metrics.drcErrors > 500 ? 'alarm' : metrics.drcErrors > 80 ? 'warn' : 'normal'],
        ['LVS mismatches', String(metrics.lvsMismatches), metrics.lvsMismatches > 0 ? 'warn' : 'normal'],
        ['Antenna', String(metrics.antennaViolations), metrics.antennaViolations > 24 ? 'warn' : 'normal'],
        ['Density', String(metrics.densityViolations), metrics.densityViolations > 16 ? 'warn' : 'normal'],
      ];
    case 'tapeout':
      return [
        ['GDS size', `${metrics.gdsSize.toFixed(2)} GB`, 'normal'],
        ['Layer count', String(metrics.layerCount), 'normal'],
        ['Metal fill', `${metrics.metalFill.toFixed(1)}%`, metrics.metalFill < 72 ? 'warn' : 'normal'],
        ['Mask count', String(metrics.maskCount), 'normal'],
      ];
  }
}

const tone = {
  normal: 'border-white/10 bg-white/[0.035] text-[var(--sf-text-primary)]',
  warn: 'border-[rgba(245,158,11,0.45)] bg-[rgba(245,158,11,0.08)] text-[var(--sf-status-amber)]',
  alarm: 'border-[rgba(239,68,68,0.5)] bg-[rgba(239,68,68,0.1)] text-[var(--sf-status-red)]',
};

export function StageInspector({ stage, techNode }: { stage: StageState; techNode: TechNode }) {
  const definition = EDA_STAGE_DEFINITIONS[stage.stage];
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[rgba(34,211,238,0.24)] bg-[rgba(8,18,31,0.76)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--sf-text-muted)]">{definition.tool}</p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--sf-text-primary)]">{definition.label}</h2>
          </div>
          <span className="rounded-full border px-3 py-1 font-mono text-xs uppercase" style={{ borderColor: definition.color, color: definition.color }}>{stage.status}</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${stage.progress}%`, backgroundColor: definition.color }} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-[var(--sf-text-secondary)]">
          <span>Node: <b className="text-[var(--sf-text-primary)]">{techNode}</b></span>
          <span>Retry: <b className="text-[var(--sf-text-primary)]">{stage.retries}</b></span>
          <span>Artifact: <b className="text-[var(--sf-text-primary)]">{stage.artifacts[0] ?? definition.artifact}</b></span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {rows(stage.metrics).map(([label, value, status]) => (
          <div key={label} className={`rounded-2xl border p-4 ${tone[status]}`}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--sf-text-muted)]">{label}</p>
            <p className="mt-2 font-mono text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
