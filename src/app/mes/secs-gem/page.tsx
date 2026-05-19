'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  ChevronRight,
  Database,
  Pause,
  Play,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { getSecsGemDemoData, resolveDemoEquipment } from '@/lib/secs-gem-demo-data';
import { FeedPacketCard } from '@/components/secs-simulator/FeedPacketCard';
import { RecipeDetailCard } from '@/components/secs-simulator/RecipeDetailCard';
import { ScenarioStepCard } from '@/components/secs-simulator/ScenarioStepCard';
import TraceRow from '@/components/secs-simulator/TraceRow';
import { MOCK_RECIPES } from '@/lib/mes-mock-data';
import type { Recipe } from '@/lib/mes-types';
import { MAX_VISIBLE_PACKETS, USER_OVERRIDE_DURATION, useReducedMotion } from '@/lib/secs-simulator-animation';
import { cn } from '@/lib/utils';

const speedIntervals: Record<string, number> = {
  '0.5x': 2400,
  '1x': 1400,
  '5x': 700,
  '10x': 350,
};

function scenarioIndexForFeed(messageCount: number, scenarioCount: number): number {
  if (scenarioCount === 0) return 0;
  if (messageCount <= 2) return 0;
  if (messageCount <= 3) return Math.min(1, scenarioCount - 1);
  if (messageCount <= 5) return Math.min(2, scenarioCount - 1);
  return scenarioCount - 1;
}

function nextFeedCount(current: number, max: number): number {
  if (max === 0) return 0;
  return Math.min(current + 1, max);
}

export default function SecsGemPage() {
  const data = useMemo(() => getSecsGemDemoData(), []);
  const reducedMotion = useReducedMotion();
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(data.equipment[0]?.id ?? null);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>(data.snapshots[0]?.id ?? '');
  const [isRunning, setIsRunning] = useState(true);
  const [speed, setSpeed] = useState('1x');
  const [visibleMessageCount, setVisibleMessageCount] = useState(Math.min(3, data.messages.length));
  const [overrideStepId, setOverrideStepId] = useState<string | null>(null);
  const overrideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedEquipment = resolveDemoEquipment(data, selectedEquipmentId);
  const activeScenarioIndex = scenarioIndexForFeed(visibleMessageCount, data.scenarios.length);
  const scenarioSteps = data.scenarios.map((step, index) => ({
    ...step,
    status:
      index < activeScenarioIndex
        ? ('complete' as const)
        : index === activeScenarioIndex
          ? ('active' as const)
          : ('pending' as const),
  }));
  const visibleMessages = data.messages.slice(0, visibleMessageCount);
  const visibleFeedMessages = visibleMessages.slice(Math.max(0, visibleMessageCount - 3));
  const traceMessages =
    visibleMessages.length > MAX_VISIBLE_PACKETS ? visibleMessages.slice(-MAX_VISIBLE_PACKETS) : visibleMessages;
  const latestMessage = visibleMessages[visibleMessages.length - 1];
  const activeSnapshot = data.snapshots[activeScenarioIndex] ?? data.snapshots[0];
  const selectedSnapshot =
    (isRunning ? activeSnapshot : data.snapshots.find((snapshot) => snapshot.id === selectedSnapshotId)) ??
    data.snapshots[0];
  const activeStep = scenarioSteps[activeScenarioIndex] ?? scenarioSteps[0];
  const activeAlarm = data.alarms[0];
  const feedProgress = data.messages.length === 0 ? 0 : Math.round((visibleMessageCount / data.messages.length) * 100);
  const feedInterval = speedIntervals[speed] ?? speedIntervals['1x'];
  const hasS2F49 = visibleMessages.some((message) => message.stream === 2 && message.function === 49);
  const s2f49Message = visibleMessages.find((message) => message.stream === 2 && message.function === 49);
  const s2f50Message = visibleMessages.find((message) => message.stream === 2 && message.function === 50);
  const s2f49Payload = s2f49Message?.payload as { params?: Array<{ cpval?: unknown }> } | undefined;
  const recipeId = s2f49Payload?.params?.[0]?.cpval;
  const matchedRecipe: Recipe | undefined =
    typeof recipeId === 'string' ? MOCK_RECIPES.find((candidate) => candidate.id === recipeId) : undefined;

  useEffect(() => {
    if (!isRunning || data.messages.length === 0) return undefined;

    const interval = window.setInterval(() => {
      setVisibleMessageCount((current) => {
        const next = nextFeedCount(current, data.messages.length);
        if (next === data.messages.length) {
          window.setTimeout(() => setIsRunning(false), 0);
        }
        return next;
      });
    }, feedInterval);

    return () => window.clearInterval(interval);
  }, [data.messages.length, feedInterval, isRunning]);

  useEffect(() => {
    return () => {
      if (overrideTimerRef.current) {
        clearTimeout(overrideTimerRef.current);
      }
    };
  }, []);

  const handleUserExpand = (index: number) => {
    const step = scenarioSteps[index];
    if (!step) return;

    if (overrideTimerRef.current) {
      clearTimeout(overrideTimerRef.current);
    }

    setOverrideStepId(step.id);
    overrideTimerRef.current = setTimeout(() => {
      setOverrideStepId(null);
      overrideTimerRef.current = null;
    }, USER_OVERRIDE_DURATION);
  };

  const advanceFeed = () => {
    setVisibleMessageCount((current) => nextFeedCount(current, data.messages.length));
    setIsRunning(false);
  };

  const resetFeed = () => {
    setVisibleMessageCount(Math.min(1, data.messages.length));
    setSelectedSnapshotId(data.snapshots[0]?.id ?? '');
    setIsRunning(false);
  };

  const scenarioStepCards = scenarioSteps.map((step, index) => {
    const isComplete = index < activeScenarioIndex;
    const isActive = index === activeScenarioIndex || (isComplete && overrideStepId === step.id);
    const message = data.messages.find((candidate) => candidate.sf === step.primary);

    return (
      <ScenarioStepCard
        key={step.id}
        step={step}
        isActive={isActive}
        isComplete={isComplete}
        message={message}
        snapshot={data.snapshots[index]}
        onUserExpand={() => handleUserExpand(index)}
      />
    );
  });

  return (
    <div className="min-h-screen bg-[var(--sf-bg-base)] p-4 text-[var(--sf-text-primary)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <header className="grid gap-4 rounded-lg border border-[var(--sf-border-default)] bg-[var(--sf-surface-card)] p-4 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--sf-accent-cyan)]">
              Pure frontend datasource
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal text-[var(--sf-text-primary)]">
              SECS/GEM Simulator
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-[var(--sf-text-secondary)]">
              Demo scenario sourced from equipment-monitor mock equipment, lots, recipes,
              alarms, and SECS event helpers. No HSMS socket or backend service is required.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 lg:min-w-[520px]">
            {[
              ['Tool', selectedEquipment.name],
              ['State', selectedEquipment.connectionState],
              ['Lot', selectedEquipment.activeLot],
              ['Recipe', selectedEquipment.currentRecipe],
              ['T3/T5', `${selectedEquipment.timers.t3}/${selectedEquipment.timers.t5}`],
              ['T6/T7', `${selectedEquipment.timers.t6}/${selectedEquipment.timers.t7}`],
              ['Last SxFy', latestMessage?.sf ?? 'Idle'],
              ['Feed', isRunning ? `${speed} live` : 'Paused'],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-md border border-[var(--sf-border-default)] bg-[var(--sf-surface-panel)] p-3"
              >
                <dt className="text-xs uppercase text-[var(--sf-text-muted)]">{label}</dt>
                <dd className="mt-1 truncate font-mono text-sm text-[var(--sf-text-primary)]">
                  {value}
                </dd>
              </div>
            ))}
          </div>
        </header>

        <section className="grid gap-4 xl:grid-cols-[300px_1fr_360px]">
          <aside className="rounded-lg border border-[var(--sf-border-default)] bg-[var(--sf-surface-card)]">
            <div className="flex min-h-12 items-center gap-2 border-b border-[var(--sf-border-default)] px-4">
              <Shield className="h-4 w-4 text-[var(--sf-accent-cyan)]" />
              <h2 className="text-sm font-semibold">HSMS Session</h2>
            </div>
            <div className="space-y-2 p-3">
              {data.equipment.map((equipment) => (
                <button
                  key={equipment.id}
                  type="button"
                  onClick={() => setSelectedEquipmentId(equipment.id)}
                  className={cn(
                    'min-h-16 w-full cursor-pointer rounded-md border p-3 text-left transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-[var(--sf-accent-cyan)]',
                    selectedEquipment.id === equipment.id
                      ? 'border-[var(--sf-border-active)] bg-[var(--sf-surface-elevated)]'
                      : 'border-[var(--sf-border-default)] bg-[var(--sf-surface-panel)] hover:bg-[var(--sf-surface-panel-alt)]'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm">{equipment.name}</span>
                    <span className="rounded border border-[var(--sf-border-default)] px-2 py-1 text-xs uppercase text-[var(--sf-text-secondary)]">
                      {equipment.connectionState}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[var(--sf-text-muted)]">
                    <span>{equipment.host}</span>
                    <span>:{equipment.port}</span>
                    <span>Device {equipment.deviceId}</span>
                    <span>{equipment.waferProgress} wafers</span>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <main className="flex flex-col gap-4">
            <section className="rounded-lg border border-[var(--sf-border-default)] bg-[var(--sf-surface-card)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--sf-border-default)] px-4 py-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[var(--sf-accent-teal)]" />
                  <h2 className="text-sm font-semibold">Scenario Console</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    aria-pressed={isRunning}
                    onClick={() => {
                      if (visibleMessageCount >= data.messages.length) {
                        setVisibleMessageCount(Math.min(1, data.messages.length));
                      }
                      setIsRunning(true);
                    }}
                    className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md bg-[var(--sf-accent-blue)] px-3 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-[var(--sf-accent-cyan)]"
                  >
                    <Play className="h-4 w-4" />
                    Start
                  </button>
                  <button
                    type="button"
                    aria-pressed={!isRunning}
                    onClick={() => setIsRunning(false)}
                    className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-[var(--sf-border-default)] px-3 text-sm text-[var(--sf-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sf-accent-cyan)]"
                  >
                    <Pause className="h-4 w-4" />
                    Pause
                  </button>
                  <button
                    type="button"
                    onClick={advanceFeed}
                    className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-[var(--sf-border-default)] px-3 text-sm text-[var(--sf-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sf-accent-cyan)]"
                  >
                    <ChevronRight className="h-4 w-4" />
                    Step
                  </button>
                  <button
                    type="button"
                    onClick={resetFeed}
                    className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-[var(--sf-border-default)] px-3 text-sm text-[var(--sf-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sf-accent-cyan)]"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reset
                  </button>
                </div>
              </div>

              <div className="grid gap-3 p-4 md:grid-cols-2">
                {reducedMotion ? (
                  scenarioStepCards
                ) : (
                  <AnimatePresence mode="wait" initial={false}>
                    {scenarioStepCards}
                  </AnimatePresence>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-[var(--sf-border-default)] bg-[var(--sf-surface-card)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--sf-border-default)] px-4 py-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[var(--sf-accent-cyan)]" />
                  <h2 className="text-sm font-semibold">Dynamic Data Feed</h2>
                </div>
                <div className="font-mono text-xs text-[var(--sf-text-muted)]" aria-live="polite" aria-atomic="true">
                  {visibleMessageCount}/{data.messages.length} packets ingested · {feedProgress}% replayed
                </div>
              </div>
              <div className="p-4">
                <div className="h-2 overflow-hidden rounded-full bg-[var(--sf-surface-panel)]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,var(--sf-accent-blue),var(--sf-accent-cyan),var(--sf-accent-teal))] transition-[width] duration-500 motion-reduce:transition-none"
                    style={{ width: `${feedProgress}%` }}
                  />
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  {reducedMotion ? (
                    visibleFeedMessages.map((message, index) => (
                      <FeedPacketCard
                        key={message.id}
                        message={message}
                        isActive={message.id === latestMessage?.id}
                        index={index}
                        enableTypewriter={message.id === latestMessage?.id}
                      />
                    ))
                  ) : (
                    <AnimatePresence initial={false} mode="popLayout">
                      {visibleFeedMessages.map((message, index) => (
                        <FeedPacketCard
                          key={message.id}
                          message={message}
                          isActive={message.id === latestMessage?.id}
                          index={index}
                          enableTypewriter={message.id === latestMessage?.id}
                        />
                      ))}
                    </AnimatePresence>
                  )}
                </div>
                {visibleMessageCount > 3 && (
                  <div className="mt-2 text-xs text-[var(--sf-text-muted)]">
                    Showing {Math.min(visibleMessageCount, 3)} of {data.messages.length} packets in feed ·{' '}
                    {traceMessages.length} rows in trace
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-[var(--sf-border-default)] bg-[var(--sf-surface-card)]">
              <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-[var(--sf-border-default)] px-4 py-2">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-[var(--sf-accent-cyan)]" />
                  <h2 className="text-sm font-semibold">Live SECS Trace</h2>
                </div>
                <span className="rounded-full border border-[var(--sf-border-default)] px-3 py-1 font-mono text-xs text-[var(--sf-text-secondary)]">
                  {isRunning ? 'streaming' : 'hold'} · {speed}
                </span>
              </div>
              {data.messages.length > MAX_VISIBLE_PACKETS && (
                <div className="mb-2 px-4 pt-3 text-xs text-[var(--sf-text-muted)]">
                  Trace buffer: showing latest {MAX_VISIBLE_PACKETS} of {data.messages.length} messages
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="text-xs uppercase text-[var(--sf-text-muted)]">
                    <tr className="border-b border-[var(--sf-border-default)]">
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Dir</th>
                      <th className="px-4 py-3">SxFy</th>
                      <th className="px-4 py-3">W</th>
                      <th className="px-4 py-3">Latency</th>
                      <th className="px-4 py-3">System bytes</th>
                      <th className="px-4 py-3">Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reducedMotion ? (
                      traceMessages.map((msg, i) => (
                        <TraceRow key={msg.id} message={msg} isLatest={msg.id === latestMessage?.id} index={i} />
                      ))
                    ) : (
                      <AnimatePresence initial={false}>
                        {traceMessages.map((msg, i) => (
                          <TraceRow key={msg.id} message={msg} isLatest={msg.id === latestMessage?.id} index={i} />
                        ))}
                      </AnimatePresence>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </main>

          <aside className="flex flex-col gap-4">
            <section className="rounded-lg border border-[var(--sf-border-default)] bg-[var(--sf-surface-card)]">
              <div className="flex min-h-12 items-center gap-2 border-b border-[var(--sf-border-default)] px-4">
                <Database className="h-4 w-4 text-[var(--sf-accent-violet)]" />
                <h2 className="text-sm font-semibold">Replay State</h2>
              </div>
              <div className="space-y-4 p-4">
                <div>
                  <label
                    htmlFor="replay-speed"
                    className="text-xs font-semibold uppercase text-[var(--sf-text-muted)]"
                  >
                    Speed
                  </label>
                  <select
                    id="replay-speed"
                    value={speed}
                    onChange={(event) => setSpeed(event.target.value)}
                    className="mt-2 min-h-11 w-full rounded-md border border-[var(--sf-border-default)] bg-[var(--sf-surface-panel)] px-3 text-sm"
                  >
                    {['0.5x', '1x', '5x', '10x'].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {data.snapshots.map((snapshot) => (
                    <button
                      key={snapshot.id}
                      type="button"
                      onClick={() => setSelectedSnapshotId(snapshot.id)}
                      className={cn(
                        'min-h-11 cursor-pointer rounded-md border px-3 text-left text-xs',
                        selectedSnapshot?.id === snapshot.id
                          ? 'border-[var(--sf-border-active)] bg-[var(--sf-surface-elevated)]'
                          : 'border-[var(--sf-border-default)] bg-[var(--sf-surface-panel)]'
                      )}
                    >
                      <span className="block font-mono">#{snapshot.sequence}</span>
                      <span className="block truncate text-[var(--sf-text-muted)]">
                        {snapshot.label}
                      </span>
                    </button>
                  ))}
                </div>

                {selectedSnapshot && (
                  <dl className="space-y-2 rounded-md border border-[var(--sf-border-default)] bg-[var(--sf-surface-panel)] p-3">
                    {selectedSnapshot.stateVariables.map((variable) => (
                      <div key={variable.name} className="flex justify-between gap-3 text-sm">
                        <dt className="text-[var(--sf-text-muted)]">{variable.name}</dt>
                        <dd className="truncate font-mono">{variable.value}</dd>
                      </div>
                    ))}
                    <div className="flex justify-between gap-3 border-t border-[var(--sf-border-default)] pt-2 text-sm">
                      <dt className="text-[var(--sf-text-muted)]">Pending transactions</dt>
                      <dd className="font-mono">{selectedSnapshot.pendingTransactions}</dd>
                    </div>
                  </dl>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-[var(--sf-accent-violet)] bg-[rgba(139,92,246,0.08)] p-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[var(--sf-accent-violet)]" />
                <h2 className="text-sm font-semibold">Recipe Detail</h2>
              </div>
              <div className="mt-3">
                <RecipeDetailCard
                  recipe={matchedRecipe || null}
                  isVisible={hasS2F49 && !!matchedRecipe}
                  messageS2F49={s2f49Message}
                  messageS2F50={s2f50Message}
                />
              </div>
            </section>

            <section className="rounded-lg border border-[var(--sf-status-red)] bg-[rgba(239,68,68,0.08)] p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[var(--sf-status-red)]" />
                <h2 className="text-sm font-semibold">Alarm Context</h2>
              </div>
              {activeAlarm && (
                <div className="mt-3 space-y-3 text-sm">
                  <p className="font-semibold text-[var(--sf-text-primary)]">{activeAlarm.message}</p>
                  <p className="text-[var(--sf-text-secondary)]">{activeAlarm.rootCause}</p>
                  <p className="rounded-md border border-[var(--sf-border-default)] bg-[var(--sf-surface-panel)] p-3 text-[var(--sf-text-secondary)]">
                    {activeAlarm.action}
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-lg border border-[var(--sf-border-default)] bg-[var(--sf-surface-card)] p-4">
              <h2 className="text-sm font-semibold">Active Step</h2>
              <p className="mt-2 text-sm text-[var(--sf-text-secondary)]">{activeStep.action}</p>
              <p className="mt-3 font-mono text-xs text-[var(--sf-text-muted)]">
                {activeStep.primary}/{activeStep.expected}
              </p>
            </section>
          </aside>
        </section>
      </div>
    </div>
  );
}
