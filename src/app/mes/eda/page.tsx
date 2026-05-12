'use client';

import dynamic from 'next/dynamic';
import { EdaDetailPanel } from '@/components/eda/EdaDetailPanel';
import { EdaTimeline } from '@/components/eda/EdaTimeline';
import { EdaToolbar } from '@/components/eda/EdaToolbar';
import { useEdaStore } from '@/lib/eda-store';

const EdaPipelineScene = dynamic(
  () => import('@/components/babylon/EdaPipelineScene').then((mod) => ({ default: mod.EdaPipelineScene })),
  {
    ssr: false,
    loading: () => <div className="flex h-full min-h-[720px] items-center justify-center bg-[var(--sf-bg-canvas)] text-sm text-[var(--sf-text-muted)]">Initializing EDA pipeline factory...</div>,
  },
);

export default function EdaPage() {
  const run = useEdaStore((state) => state.run);
  const selectedStage = useEdaStore((state) => state.selectedStage);
  const activeTab = useEdaStore((state) => state.activeTab);
  const techNode = useEdaStore((state) => state.techNode);
  const selectStage = useEdaStore((state) => state.selectStage);
  const setActiveTab = useEdaStore((state) => state.setActiveTab);
  const setTechNode = useEdaStore((state) => state.setTechNode);
  const start = useEdaStore((state) => state.start);
  const pause = useEdaStore((state) => state.pause);
  const reset = useEdaStore((state) => state.reset);
  const setSpeed = useEdaStore((state) => state.setSpeed);
  const injectFault = useEdaStore((state) => state.injectFault);

  return (
    <div className="flex min-h-[calc(100dvh-101px)] flex-col overflow-hidden bg-[var(--sf-bg-canvas)]">
      <EdaToolbar
        running={run.running}
        speed={run.speed}
        techNode={techNode}
        elapsedMs={run.elapsedMs}
        currentStage={run.currentStage}
        onStart={start}
        onPause={pause}
        onReset={reset}
        onSpeedChange={setSpeed}
        onTechNodeChange={setTechNode}
        onFaultInject={injectFault}
      />

      <main className="grid flex-1 grid-cols-1 overflow-hidden 2xl:grid-cols-[minmax(0,45fr)_minmax(520px,55fr)]">
        <section className="relative min-h-[720px] overflow-hidden">
          <EdaPipelineScene stages={run.stages} selectedStage={selectedStage} onSelectStage={selectStage} />
        </section>

        <EdaDetailPanel
          run={run}
          selectedStage={selectedStage}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onSelectStage={selectStage}
        />
      </main>

      <EdaTimeline stages={run.stages} selectedStage={selectedStage} onSelectStage={selectStage} />
    </div>
  );
}
