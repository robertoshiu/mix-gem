'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import {
  getSecsGemDemoData,
  resolveDemoEquipment,
  SCENARIO_TEMPLATES,
  ALARM_TEMPLATES,
} from '@/lib/secs-gem-demo-data';
import type { DemoEquipment, DemoSecsMessage, DemoAlarm } from '@/lib/secs-gem-demo-data';
import {
  generateTick,
  generateEquipmentUpdate,
  createScenarioState,
  advanceScenario,
} from '@/lib/secs-gem-sim-engine';
import type { ScenarioState } from '@/lib/secs-gem-sim-engine';
import { FeedPacketCard } from '@/components/secs-simulator/FeedPacketCard';
import { RecipeDetailCard } from '@/components/secs-simulator/RecipeDetailCard';
import { ScenarioStepCard } from '@/components/secs-simulator/ScenarioStepCard';
import TraceRow from '@/components/secs-simulator/TraceRow';
import { MOCK_RECIPES } from '@/lib/mes-mock-data';
import type { Recipe } from '@/lib/mes-types';
import { MAX_VISIBLE_PACKETS, USER_OVERRIDE_DURATION, useReducedMotion } from '@/lib/secs-simulator-animation';
import { cn } from '@/lib/utils';

const SPEED_INTERVALS: Record<string, number> = {
  '0.5x': 1800,
  '1x': 900,
  '5x': 180,
  '10x': 90,
};

const TEMPLATE_NAMES = ['SPC Violation', 'Lot Changeover', 'Alarm Response', 'Preventive Maintenance'];
const INITIAL_SEED = 0;

export default function SecsGemPage() {
  const initialData = useMemo(() => getSecsGemDemoData(), []);
  const reducedMotion = useReducedMotion();

  const [equipment, setEquipment] = useState<DemoEquipment[]>(initialData.equipment);
  const [messages, setMessages] = useState<DemoSecsMessage[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(
    initialData.equipment[0]?.id ?? null,
  );
  const tickRef = useRef(0);
  const seedRef = useRef(INITIAL_SEED);
  const equipmentRef = useRef(equipment);
  const scenarioRef = useRef<ScenarioState>(createScenarioState());
  const [scenarioState, setScenarioState] = useState<ScenarioState>(createScenarioState());
  const [activeAlarm, setActiveAlarm] = useState<DemoAlarm | null>(initialData.alarms[0] ?? null);
  const [isRunning, setIsRunning] = useState(true);
  const [speed, setSpeed] = useState('1x');
  const [totalGenerated, setTotalGenerated] = useState(0);

  const [overrideStepId, setOverrideStepId] = useState<string | null>(null);
  const overrideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived state
  const selectedEquipment = resolveDemoEquipment({ ...initialData, equipment }, selectedEquipmentId);
  const template = SCENARIO_TEMPLATES[scenarioState.templateIndex] ?? SCENARIO_TEMPLATES[0];
  const scenarioSteps = template.map((step, index) => ({
    ...step,
    status:
      index < scenarioState.stepIndex
        ? ('complete' as const)
        : index === scenarioState.stepIndex
          ? ('active' as const)
          : ('pending' as const),
  }));
  const visibleFeedMessages = messages.slice(-3);
  const traceMessages = messages.slice(-MAX_VISIBLE_PACKETS);
  const latestMessage = messages[messages.length - 1];
  const messagesNewestFirst = useMemo(() => [...messages].reverse(), [messages]);
  const s2f49Message = messagesNewestFirst.find((m) => m.stream === 2 && m.function === 49);
  const s2f50Message = messagesNewestFirst.find((m) => m.stream === 2 && m.function === 50);
  const hasS2F49 = !!s2f49Message;
  const s2f49Payload = s2f49Message?.payload as { params?: Array<{ cpval?: unknown }> } | undefined;
  const recipeId = s2f49Payload?.params?.[0]?.cpval;
  const matchedRecipe: Recipe | undefined =
    typeof recipeId === 'string' ? MOCK_RECIPES.find((candidate) => candidate.id === recipeId) : undefined;

  const activeStep = scenarioSteps[scenarioState.stepIndex] ?? scenarioSteps[0];

  // Build active snapshot from current state
  const activeSnapshot = useMemo(() => {
    const step = template[scenarioState.stepIndex] ?? template[0];
    return {
      id: `snap-${scenarioState.templateIndex}-${scenarioState.stepIndex}`,
      sequence: scenarioState.stepIndex + 1,
      timestamp: latestMessage?.timestamp ?? '2026-05-25T00:00:00.000Z',
      stepId: step?.id ?? 'unknown',
      label: step?.label ?? 'Unknown',
      stateVariables: [
        { name: 'ControlState', value: selectedEquipment.connectionState === 'selected' ? 'Online Remote' : 'Online Local' },
        { name: 'ProcessState', value: selectedEquipment.status === 'running' ? 'Processing' : selectedEquipment.status === 'idle' ? 'Idle' : 'Down' },
        { name: 'PPExecName', value: selectedEquipment.currentRecipe },
        { name: 'ActiveLot', value: selectedEquipment.activeLot },
        { name: 'WaferProgress', value: selectedEquipment.waferProgress },
      ],
      pendingTransactions: messages.length > 0 ? messages.length % 3 : 0,
    };
  }, [scenarioState, template, selectedEquipment, messages.length, latestMessage?.timestamp]);

  // doTick: generate messages, update equipment, advance scenario
  const doTick = useCallback(() => {
    const currentTick = tickRef.current;
    const currentSeed = seedRef.current;

    // Seed cycling: every 200 ticks, increment seed
    if (currentTick > 0 && currentTick % 200 === 0) {
      seedRef.current = currentSeed + 1;
    }

    const tickResult = generateTick(currentSeed, currentTick);
    const eqUpdates = generateEquipmentUpdate(
      currentSeed,
      currentTick,
      equipmentRef.current.map((eq) => ({
        id: eq.id,
        connectionState: eq.connectionState,
        status: eq.status,
        waferProgress: eq.waferProgress,
        timers: eq.timers,
      })),
    );

    // Advance scenario for each generated message
    let nextScenario = scenarioRef.current;
    for (const msg of tickResult.messages) {
      nextScenario = advanceScenario(nextScenario, msg.sf);
    }
    scenarioRef.current = nextScenario;
    setScenarioState(nextScenario);

    // Update alarm on S5F1
    const alarmMsg = tickResult.messages.find((m) => m.stream === 5 && m.function === 1);
    if (alarmMsg) {
      const payload = alarmMsg.payload as { alid?: number; altx?: string };
      const matched = ALARM_TEMPLATES.find((t) => t.alarmId === payload.alid);
      if (matched) {
        setActiveAlarm({
          id: `alarm-${payload.alid}`,
          severity: matched.severity,
          equipmentId: selectedEquipmentId ?? '',
          message: matched.message,
          rootCause: matched.rootCause,
          action: matched.action,
        });
      }
    }

    // Push to rolling buffer
    setMessages((prev) => {
      const next = [...prev, ...tickResult.messages];
      return next.length > MAX_VISIBLE_PACKETS ? next.slice(-MAX_VISIBLE_PACKETS) : next;
    });

    setTotalGenerated((prev) => prev + tickResult.messages.length);

    // Merge equipment updates
    if (eqUpdates.length > 0) {
      setEquipment((prev) =>
        prev.map((eq) => {
          const update = eqUpdates.find((u) => u.equipmentId === eq.id);
          if (!update) return eq;
          return { ...eq, ...update.changes } as DemoEquipment;
        }),
      );
    }

    tickRef.current = currentTick + 1;
  }, [selectedEquipmentId]);

  useEffect(() => {
    equipmentRef.current = equipment;
  }, [equipment]);

  // Tick loop
  useEffect(() => {
    if (!isRunning) return undefined;

    const interval = SPEED_INTERVALS[speed] ?? SPEED_INTERVALS['1x'];
    const timer = window.setInterval(doTick, interval);

    return () => window.clearInterval(timer);
  }, [isRunning, speed, doTick]);

  // Cleanup override timer
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

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStep = () => {
    doTick();
    setIsRunning(false);
  };

  const handleReset = () => {
    setMessages([]);
    tickRef.current = 0;
    seedRef.current = INITIAL_SEED;
    scenarioRef.current = createScenarioState();
    setScenarioState(createScenarioState());
    setTotalGenerated(0);
    setEquipment(initialData.equipment);
    setActiveAlarm(initialData.alarms[0] ?? null);
    setIsRunning(false);
  };

  const scenarioStepCards = scenarioSteps.map((step, index) => {
    const isComplete = index < scenarioState.stepIndex;
    const isActive = index === scenarioState.stepIndex || (isComplete && overrideStepId === step.id);
    const message = messagesNewestFirst.find((candidate) => candidate.sf === step.primary);

    return (
      <ScenarioStepCard
        key={step.id}
        step={step}
        isActive={isActive}
        isComplete={isComplete}
        message={message}
        snapshot={activeSnapshot}
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
              Dynamic simulation with 7 message categories, hash-seeded PRNG engine, and 3-minute
              auto-cycling data. No HSMS socket or backend required.
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
              {equipment.map((eq) => (
                <button
                  key={eq.id}
                  type="button"
                  onClick={() => setSelectedEquipmentId(eq.id)}
                  className={cn(
                    'min-h-16 w-full cursor-pointer rounded-md border p-3 text-left transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-[var(--sf-accent-cyan)]',
                    selectedEquipment.id === eq.id
                      ? 'border-[var(--sf-border-active)] bg-[var(--sf-surface-elevated)]'
                      : 'border-[var(--sf-border-default)] bg-[var(--sf-surface-panel)] hover:bg-[var(--sf-surface-panel-alt)]',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm">{eq.name}</span>
                    <span className="rounded border border-[var(--sf-border-default)] px-2 py-1 text-xs uppercase text-[var(--sf-text-secondary)]">
                      {eq.connectionState}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[var(--sf-text-muted)]">
                    <span>{eq.host}</span>
                    <span>:{eq.port}</span>
                    <span>Device {eq.deviceId}</span>
                    <span>{eq.waferProgress} wafers</span>
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
                  <span className="rounded-full border border-[var(--sf-border-default)] bg-[var(--sf-surface-panel)] px-2 py-0.5 text-xs text-[var(--sf-text-secondary)]">
                    {TEMPLATE_NAMES[scenarioState.templateIndex] ?? TEMPLATE_NAMES[0]}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    aria-pressed={isRunning}
                    onClick={handleStart}
                    className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md bg-[var(--sf-accent-blue)] px-3 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-[var(--sf-accent-cyan)]"
                  >
                    <Play className="h-4 w-4" />
                    Start
                  </button>
                  <button
                    type="button"
                    aria-pressed={!isRunning}
                    onClick={handlePause}
                    className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-[var(--sf-border-default)] px-3 text-sm text-[var(--sf-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sf-accent-cyan)]"
                  >
                    <Pause className="h-4 w-4" />
                    Pause
                  </button>
                  <button
                    type="button"
                    onClick={handleStep}
                    className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-[var(--sf-border-default)] px-3 text-sm text-[var(--sf-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sf-accent-cyan)]"
                  >
                    <ChevronRight className="h-4 w-4" />
                    Step
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
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
                  {totalGenerated} packets generated · {messages.length} in buffer
                </div>
              </div>
              <div className="p-4">
                <div className="grid gap-2 md:grid-cols-3">
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
              </div>
            </section>

            <section className="rounded-lg border border-[var(--sf-border-default)] bg-[var(--sf-surface-card)]">
              <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-[var(--sf-border-default)] px-4 py-2">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-[var(--sf-accent-cyan)]" />
                  <h2 className="text-sm font-semibold">Live SECS Trace</h2>
                </div>
                <span className="rounded-full border border-[var(--sf-border-default)] px-3 py-1 font-mono text-xs text-[var(--sf-text-secondary)]">
                  {isRunning ? 'streaming' : 'hold'} · {speed} · {traceMessages.length}/{MAX_VISIBLE_PACKETS} rows
                </span>
              </div>
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
                <h2 className="text-sm font-semibold">Replay Controls</h2>
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

                {activeSnapshot && (
                  <dl className="space-y-2 rounded-md border border-[var(--sf-border-default)] bg-[var(--sf-surface-panel)] p-3">
                    {activeSnapshot.stateVariables.map((variable) => (
                      <div key={variable.name} className="flex justify-between gap-3 text-sm">
                        <dt className="text-[var(--sf-text-muted)]">{variable.name}</dt>
                        <dd className="truncate font-mono">{variable.value}</dd>
                      </div>
                    ))}
                    <div className="flex justify-between gap-3 border-t border-[var(--sf-border-default)] pt-2 text-sm">
                      <dt className="text-[var(--sf-text-muted)]">Pending transactions</dt>
                      <dd className="font-mono">{activeSnapshot.pendingTransactions}</dd>
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
              <p className="mt-2 text-sm text-[var(--sf-text-secondary)]">
                {activeStep?.action ?? 'Waiting for scenario'}
              </p>
              <p className="mt-3 font-mono text-xs text-[var(--sf-text-muted)]">
                {activeStep?.primary ?? '--'}/{activeStep?.expected ?? '--'}
              </p>
            </section>
          </aside>
        </section>
      </div>
    </div>
  );
}
