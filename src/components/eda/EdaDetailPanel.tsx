'use client';

import dynamic from 'next/dynamic';
import { Activity, Layers, List, Terminal } from 'lucide-react';
import { EdaLogStream } from './EdaLogStream';
import { EdaMetricsChart } from './EdaMetricsChart';
import { StageInspector } from './StageInspector';
import type { EdaStage, PipelineRun, StageState } from '@/lib/eda-types';
import { cn } from '@/lib/utils';

const ChipLayerScene = dynamic(
  () => import('@/components/babylon/ChipLayerScene').then((mod) => ({ default: mod.ChipLayerScene })),
  {
    ssr: false,
    loading: () => <div className="flex h-[520px] items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-sm text-[var(--sf-text-muted)]">Initializing chip layer viewer...</div>,
  },
);

type EdaTab = 'inspector' | 'logs' | 'metrics' | 'layers';

const TABS: Array<{ id: EdaTab; label: string; icon: typeof List }> = [
  { id: 'inspector', label: 'Stage Inspector', icon: List },
  { id: 'logs', label: 'Log Stream', icon: Terminal },
  { id: 'metrics', label: 'Metrics', icon: Activity },
  { id: 'layers', label: 'Chip Layers', icon: Layers },
];

interface EdaDetailPanelProps {
  run: PipelineRun;
  selectedStage: EdaStage;
  activeTab: EdaTab;
  onTabChange: (tab: EdaTab) => void;
  onSelectStage: (stage: EdaStage) => void;
}

function allLogs(run: PipelineRun) {
  return run.stages.flatMap((stage) => stage.logs).sort((a, b) => a.timestamp - b.timestamp);
}

export function EdaDetailPanel({ run, selectedStage, activeTab, onTabChange, onSelectStage }: EdaDetailPanelProps) {
  const stage = run.stages.find((item) => item.stage === selectedStage) ?? run.stages[0] as StageState;

  return (
    <aside className="flex min-h-[720px] flex-col overflow-hidden border-l border-[rgba(34,211,238,0.16)] bg-[rgba(2,6,23,0.88)]">
      <div className="border-b border-white/10 p-3">
        <div role="tablist" aria-label="EDA detail tabs" className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => onTabChange(id)}
              className={cn(
                'min-h-[44px] rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-border-active)]',
                activeTab === id ? 'border-[#F47920] bg-[#F47920]/12 text-white' : 'border-white/10 bg-white/[0.035] text-[var(--sf-text-secondary)] hover:bg-white/[0.07]',
              )}
            >
              <Icon className="mb-1 h-4 w-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'inspector' && <StageInspector stage={stage} techNode={run.techNode} />}
        {activeTab === 'logs' && <EdaLogStream logs={allLogs(run)} />}
        {activeTab === 'metrics' && <EdaMetricsChart stage={stage} />}
        {activeTab === 'layers' && <ChipLayerScene stage={stage} techNode={run.techNode} onSelectStage={onSelectStage} />}
      </div>
    </aside>
  );
}
