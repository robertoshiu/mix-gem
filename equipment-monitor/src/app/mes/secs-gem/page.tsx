'use client';

import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Circle,
  Database,
  Pause,
  Play,
  RefreshCw,
  Shield,
} from 'lucide-react';
import {
  getSecsGemDemoData,
  resolveDemoEquipment,
  type DemoScenarioStatus,
} from '@/lib/secs-gem-demo-data';
import { cn } from '@/lib/utils';

const statusStyles: Record<DemoScenarioStatus, string> = {
  complete: 'border-[var(--sf-status-green)] text-[var(--sf-status-green)]',
  active: 'border-[var(--sf-status-amber)] text-[var(--sf-status-amber)]',
  pending: 'border-[var(--sf-border-default)] text-[var(--sf-text-muted)]',
};

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(new Date(iso));
}

export default function SecsGemPage() {
  const data = useMemo(() => getSecsGemDemoData(), []);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(data.equipment[0]?.id ?? null);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>(data.snapshots[0]?.id ?? '');
  const [isRunning, setIsRunning] = useState(true);
  const [speed, setSpeed] = useState('1x');

  const selectedEquipment = resolveDemoEquipment(data, selectedEquipmentId);
  const selectedSnapshot =
    data.snapshots.find((snapshot) => snapshot.id === selectedSnapshotId) ?? data.snapshots[0];
  const activeStep = data.scenarios.find((step) => step.status === 'active') ?? data.scenarios[0];
  const activeAlarm = data.alarms[0];

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
                    onClick={() => setIsRunning(true)}
                    className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md bg-[var(--sf-accent-blue)] px-3 text-sm font-medium text-white"
                  >
                    <Play className="h-4 w-4" />
                    Start
                  </button>
                  <button
                    type="button"
                    aria-pressed={!isRunning}
                    onClick={() => setIsRunning(false)}
                    className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-[var(--sf-border-default)] px-3 text-sm text-[var(--sf-text-primary)]"
                  >
                    <Pause className="h-4 w-4" />
                    Pause
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSnapshotId(data.snapshots[0]?.id ?? '');
                      setIsRunning(false);
                    }}
                    className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-[var(--sf-border-default)] px-3 text-sm text-[var(--sf-text-primary)]"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reset
                  </button>
                </div>
              </div>

              <div className="grid gap-3 p-4 md:grid-cols-4">
                {data.scenarios.map((step) => (
                  <article
                    key={step.id}
                    className={cn(
                      'rounded-md border bg-[var(--sf-surface-panel)] p-3',
                      statusStyles[step.status]
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold uppercase">{step.status}</span>
                      {step.status === 'complete' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-[var(--sf-text-primary)]">
                      {step.label}
                    </h3>
                    <p className="mt-2 text-xs text-[var(--sf-text-secondary)]">{step.action}</p>
                    <p className="mt-3 font-mono text-xs text-[var(--sf-text-muted)]">
                      {step.actor}: {step.primary}/{step.expected}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-[var(--sf-border-default)] bg-[var(--sf-surface-card)]">
              <div className="flex min-h-12 items-center gap-2 border-b border-[var(--sf-border-default)] px-4">
                <Database className="h-4 w-4 text-[var(--sf-accent-cyan)]" />
                <h2 className="text-sm font-semibold">Live SECS Trace</h2>
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
                    {data.messages.map((message) => (
                      <tr
                        key={message.id}
                        className="border-b border-[var(--sf-border-default)] last:border-b-0"
                      >
                        <td className="px-4 py-3 font-mono text-xs">{formatTime(message.timestamp)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'rounded px-2 py-1 font-mono text-xs',
                              message.direction === 'H2E'
                                ? 'bg-[rgba(59,130,246,0.16)] text-[var(--sf-accent-blue)]'
                                : 'bg-[rgba(20,184,166,0.16)] text-[var(--sf-accent-teal)]'
                            )}
                          >
                            {message.direction}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[var(--sf-text-primary)]">
                          {message.sf}
                        </td>
                        <td className="px-4 py-3">{message.wbit ? 'Yes' : 'No'}</td>
                        <td className="px-4 py-3 font-mono">{message.latencyMs} ms</td>
                        <td className="px-4 py-3 font-mono">{message.systemBytes}</td>
                        <td className="px-4 py-3 text-[var(--sf-text-secondary)]">
                          {message.summary}
                        </td>
                      </tr>
                    ))}
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
