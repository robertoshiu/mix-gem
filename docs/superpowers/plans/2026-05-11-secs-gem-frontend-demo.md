# SECS/GEM Frontend Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pure frontend SECS/GEM simulator demo at `/mes/secs-gem` using `equipment-monitor` mock data as the datasource.

**Architecture:** Add one deterministic datasource adapter in `src/lib` and one client route under `src/app/mes/secs-gem`. The route renders operational panels for equipment sessions, scenario steps, live SECS message trace, and replay snapshots. The only existing component change is adding a `SECS/GEM Sim` navigation item.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Lucide React, Jest, Testing Library.

---

## File Structure

- `equipment-monitor/src/lib/secs-gem-demo-data.ts`: creates typed, deterministic demo data from existing mock equipment, recipes, lots, alarms, and SECS helper functions.
- `equipment-monitor/src/lib/secs-gem-demo-data.test.ts`: verifies the datasource contract and default selection behavior.
- `equipment-monitor/src/app/mes/secs-gem/page.tsx`: client page that renders the simulator dashboard.
- `equipment-monitor/src/app/mes/secs-gem/page.test.tsx`: verifies key route panels render from the datasource.
- `equipment-monitor/src/components/mes/MesNavBar.tsx`: adds the route link.
- `equipment-monitor/src/components/mes/MesNavBar.test.tsx`: updates navigation expectations.

## Task 1: Datasource Adapter

**Files:**
- Create: `equipment-monitor/src/lib/secs-gem-demo-data.test.ts`
- Create: `equipment-monitor/src/lib/secs-gem-demo-data.ts`

- [ ] **Step 1: Write the failing datasource test**

```typescript
import {
  getDefaultDemoEquipment,
  getSecsGemDemoData,
  resolveDemoEquipment,
} from './secs-gem-demo-data';

describe('secs-gem-demo-data', () => {
  it('builds deterministic simulator data from equipment monitor fixtures', () => {
    const data = getSecsGemDemoData();

    expect(data.equipment.length).toBeGreaterThan(0);
    expect(data.scenarios.length).toBeGreaterThan(0);
    expect(data.messages.length).toBeGreaterThan(0);
    expect(data.snapshots.length).toBeGreaterThan(0);
    expect(data.alarms.length).toBeGreaterThan(0);
    expect(data.equipment[0]).toMatchObject({
      role: 'equipment',
      connectionState: 'selected',
      deviceId: expect.any(Number),
    });
    expect(data.messages.map((message) => message.sf)).toEqual(
      expect.arrayContaining(['S1F13', 'S1F14', 'S6F11', 'S2F41', 'S2F42'])
    );
  });

  it('resolves missing or unknown equipment ids to the default equipment', () => {
    const data = getSecsGemDemoData();
    const defaultEquipment = getDefaultDemoEquipment(data);

    expect(resolveDemoEquipment(data, null)).toBe(defaultEquipment);
    expect(resolveDemoEquipment(data, 'missing-equipment')).toBe(defaultEquipment);
  });
});
```

- [ ] **Step 2: Run the datasource test and verify RED**

Run: `cd equipment-monitor && npm test -- --runTestsByPath src/lib/secs-gem-demo-data.test.ts`

Expected: FAIL because `./secs-gem-demo-data` does not exist.

- [ ] **Step 3: Implement the datasource**

Create `equipment-monitor/src/lib/secs-gem-demo-data.ts` with exported types and functions:

```typescript
import { MOCK_EQUIPMENT, MOCK_LOTS, MOCK_RECIPES } from './mes-mock-data';
import { mockAlarms } from './mock-data';
import {
  makeS2F41Resume,
  makeS2F41Stop,
  makeS2F42Ack,
  makeS2F49,
  makeS2F50,
  makeS6F11,
} from './secs-message-log';

export type DemoConnectionState = 'not_connected' | 'connected' | 'selected';
export type DemoScenarioStatus = 'complete' | 'active' | 'pending';
export type DemoDirection = 'H2E' | 'E2H';

export interface DemoEquipment {
  id: string;
  name: string;
  type: string;
  role: 'equipment' | 'host';
  host: string;
  port: number;
  deviceId: number;
  connectionState: DemoConnectionState;
  currentRecipe: string;
  activeLot: string;
  waferProgress: string;
  timers: { t3: string; t5: string; t6: string; t7: string };
  status: 'running' | 'idle' | 'down';
}

export interface DemoScenarioStep {
  id: string;
  label: string;
  actor: 'Host' | 'Equipment';
  action: string;
  primary: string;
  expected: string;
  status: DemoScenarioStatus;
}

export interface DemoSecsMessage {
  id: string;
  timestamp: string;
  direction: DemoDirection;
  sf: string;
  stream: number;
  function: number;
  wbit: boolean;
  latencyMs: number;
  systemBytes: string;
  summary: string;
  payload: Record<string, unknown>;
}

export interface DemoSnapshot {
  id: string;
  sequence: number;
  timestamp: string;
  stepId: string;
  label: string;
  stateVariables: Array<{ name: string; value: string }>;
  pendingTransactions: number;
}

export interface DemoAlarm {
  id: string;
  severity: string;
  equipmentId: string;
  message: string;
  rootCause: string;
  action: string;
}

export interface SecsGemDemoData {
  equipment: DemoEquipment[];
  scenarios: DemoScenarioStep[];
  messages: DemoSecsMessage[];
  snapshots: DemoSnapshot[];
  alarms: DemoAlarm[];
}

const BASE_TIME = new Date('2026-05-11T08:00:00.000Z');

function at(seconds: number): string {
  return new Date(BASE_TIME.getTime() + seconds * 1000).toISOString();
}

function messageFromEvent(
  index: number,
  direction: DemoDirection,
  latencyMs: number,
  event: ReturnType<
    | typeof makeS2F41Resume
    | typeof makeS2F41Stop
    | typeof makeS2F42Ack
    | typeof makeS2F49
    | typeof makeS2F50
    | typeof makeS6F11
  >
): DemoSecsMessage {
  const stream = Number(event.secsMessage.stream);
  const func = Number(event.secsMessage.function);
  const sf = `S${stream}F${func}`;

  return {
    id: `msg-${index.toString().padStart(2, '0')}`,
    timestamp: at(index * 7),
    direction,
    sf,
    stream,
    function: func,
    wbit: func % 2 === 1,
    latencyMs,
    systemBytes: `0x${(4096 + index).toString(16).toUpperCase()}`,
    summary: event.label,
    payload: event.secsMessage,
  };
}

export function getSecsGemDemoData(): SecsGemDemoData {
  const lots = MOCK_LOTS;
  const recipes = MOCK_RECIPES;

  const equipment: DemoEquipment[] = MOCK_EQUIPMENT.slice(0, 6).map((tool, index) => ({
    id: tool.id,
    name: tool.name,
    type: tool.type,
    role: 'equipment',
    host: index === 0 ? '127.0.0.1' : `192.168.10.${20 + index}`,
    port: 5000 + index,
    deviceId: 100 + index,
    connectionState: index < 4 ? 'selected' : index === 4 ? 'connected' : 'not_connected',
    currentRecipe: tool.totalWafers > 0 && tool.recipe ? tool.recipe : recipes[index % recipes.length].id,
    activeLot: lots[index % lots.length].id,
    waferProgress: `${tool.currentWafer}/${tool.totalWafers || 25}`,
    timers: { t3: '45s', t5: '10s', t6: '5s', t7: '10s' },
    status: tool.status,
  }));

  const scenarios: DemoScenarioStep[] = [
    {
      id: 'establish-comm',
      label: 'Establish communications',
      actor: 'Host',
      action: 'Open HSMS session and select equipment',
      primary: 'S1F13',
      expected: 'S1F14',
      status: 'complete',
    },
    {
      id: 'collect-spc',
      label: 'Collect SPC report',
      actor: 'Equipment',
      action: 'Publish wafer metrology collection event',
      primary: 'S6F11',
      expected: 'S6F12',
      status: 'complete',
    },
    {
      id: 'inhibit-tool',
      label: 'Inhibit on violation',
      actor: 'Host',
      action: 'Send remote STOP after SPC rule breach',
      primary: 'S2F41',
      expected: 'S2F42',
      status: 'active',
    },
    {
      id: 'recipe-push',
      label: 'Push corrected recipe',
      actor: 'Host',
      action: 'Load updated process program',
      primary: 'S2F49',
      expected: 'S2F50',
      status: 'pending',
    },
  ];

  const measurement = { cd: 49.1, cdu: 3.8, ovl_x: 1.4, ovl_y: -1.1, ler: 2.7 };
  const messages: DemoSecsMessage[] = [
    {
      id: 'msg-00',
      timestamp: at(0),
      direction: 'H2E',
      sf: 'S1F13',
      stream: 1,
      function: 13,
      wbit: true,
      latencyMs: 0,
      systemBytes: '0x1000',
      summary: 'S1F13 Establish Communications Request',
      payload: { stream: 1, function: 13, mdln: 'MIX-GEM-DEMO', softrev: '2026.05' },
    },
    {
      id: 'msg-01',
      timestamp: at(4),
      direction: 'E2H',
      sf: 'S1F14',
      stream: 1,
      function: 14,
      wbit: false,
      latencyMs: 42,
      systemBytes: '0x1000',
      summary: 'S1F14 Establish Communications Ack (COMMACK=0)',
      payload: { stream: 1, function: 14, commack: 0 },
    },
    messageFromEvent(2, 'E2H', 18, makeS6F11(lots[0].id, 15, measurement)),
    messageFromEvent(3, 'H2E', 24, makeS2F41Stop('cd', 'rule_1')),
    messageFromEvent(4, 'E2H', 17, makeS2F42Ack()),
    messageFromEvent(5, 'H2E', 21, makeS2F49(recipes[0].id)),
    messageFromEvent(6, 'E2H', 31, makeS2F50(true)),
  ];

  const snapshots: DemoSnapshot[] = scenarios.map((step, index) => ({
    id: `snapshot-${index + 1}`,
    sequence: index + 1,
    timestamp: at(index * 14),
    stepId: step.id,
    label: step.label,
    pendingTransactions: step.status === 'active' ? 1 : 0,
    stateVariables: [
      { name: 'Control state', value: step.status === 'pending' ? 'Remote' : 'Online Remote' },
      { name: 'Process state', value: step.id === 'inhibit-tool' ? 'Inhibited' : 'Processing' },
      { name: 'Active lot', value: lots[0].id },
      { name: 'Recipe', value: recipes[0].id },
    ],
  }));

  const alarms: DemoAlarm[] = mockAlarms.slice(0, 3).map((alarm) => ({
    id: alarm.id,
    severity: alarm.severity,
    equipmentId: alarm.equipmentId,
    message: alarm.message,
    rootCause: alarm.rootCause?.cause ?? 'Synthetic alarm context unavailable',
    action: alarm.rootCause?.containmentAction ?? 'Review equipment state and hold affected lot',
  }));

  return { equipment, scenarios, messages, snapshots, alarms };
}

export function getDefaultDemoEquipment(data: SecsGemDemoData): DemoEquipment {
  if (data.equipment.length === 0) {
    throw new Error('SECS/GEM demo datasource has no equipment');
  }

  return data.equipment[0];
}

export function resolveDemoEquipment(
  data: SecsGemDemoData,
  equipmentId: string | null
): DemoEquipment {
  return data.equipment.find((equipment) => equipment.id === equipmentId) ?? getDefaultDemoEquipment(data);
}
```

- [ ] **Step 4: Run the datasource test and verify GREEN**

Run: `cd equipment-monitor && npm test -- --runTestsByPath src/lib/secs-gem-demo-data.test.ts`

Expected: PASS.

## Task 2: SECS/GEM Demo Route

**Files:**
- Create: `equipment-monitor/src/app/mes/secs-gem/page.test.tsx`
- Create: `equipment-monitor/src/app/mes/secs-gem/page.tsx`

- [ ] **Step 1: Write the failing route test**

```typescript
import { render, screen } from '@testing-library/react';
import SecsGemPage from './page';

describe('SecsGemPage', () => {
  it('renders the simulator console, SECS trace, and replay state panels', () => {
    render(<SecsGemPage />);

    expect(screen.getByRole('heading', { name: /SECS\/GEM Simulator/i })).toBeInTheDocument();
    expect(screen.getByText(/HSMS Session/i)).toBeInTheDocument();
    expect(screen.getByText(/Scenario Console/i)).toBeInTheDocument();
    expect(screen.getByText(/Live SECS Trace/i)).toBeInTheDocument();
    expect(screen.getByText(/Replay State/i)).toBeInTheDocument();
    expect(screen.getByText('S1F13')).toBeInTheDocument();
    expect(screen.getByText('S6F11')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the route test and verify RED**

Run: `cd equipment-monitor && npm test -- --runTestsByPath src/app/mes/secs-gem/page.test.tsx`

Expected: FAIL because `./page` does not exist.

- [ ] **Step 3: Implement the route**

Create a client component in `equipment-monitor/src/app/mes/secs-gem/page.tsx` that:

- Imports `useMemo`, `useState`, Lucide icons, and datasource helpers.
- Renders the title `SECS/GEM Simulator`.
- Selects default equipment via `resolveDemoEquipment`.
- Provides local Start/Pause/Reset buttons using `aria-pressed` for running state.
- Renders four panels: HSMS Session, Scenario Console, Live SECS Trace, Replay State.
- Uses existing SmartFactory CSS variables and compact table/grid layouts.

- [ ] **Step 4: Run the route test and verify GREEN**

Run: `cd equipment-monitor && npm test -- --runTestsByPath src/app/mes/secs-gem/page.test.tsx`

Expected: PASS.

## Task 3: MES Navigation

**Files:**
- Modify: `equipment-monitor/src/components/mes/MesNavBar.test.tsx`
- Modify: `equipment-monitor/src/components/mes/MesNavBar.tsx`

- [ ] **Step 1: Update the nav test first**

Add an expectation that `SECS/GEM Sim` links to `/mes/secs-gem`.

- [ ] **Step 2: Run the nav test and verify RED**

Run: `cd equipment-monitor && npm test -- --runTestsByPath src/components/mes/MesNavBar.test.tsx`

Expected: FAIL because the link is missing.

- [ ] **Step 3: Add the nav item**

Add `{ href: '/mes/secs-gem', label: 'SECS/GEM Sim', icon: Activity }` to `NAV_ITEMS` in `MesNavBar.tsx`.

- [ ] **Step 4: Run the nav test and verify GREEN**

Run: `cd equipment-monitor && npm test -- --runTestsByPath src/components/mes/MesNavBar.test.tsx`

Expected: PASS.

## Task 4: Verification

**Files:**
- No expected code changes.

- [ ] **Step 1: Run targeted tests**

Run: `cd equipment-monitor && npm test -- --runTestsByPath src/lib/secs-gem-demo-data.test.ts src/app/mes/secs-gem/page.test.tsx src/components/mes/MesNavBar.test.tsx`

Expected: PASS.

- [ ] **Step 2: Run lint**

Run: `cd equipment-monitor && npm run lint`

Expected: exit code 0.

- [ ] **Step 3: Run production build**

Run: `cd equipment-monitor && npm run build`

Expected: exit code 0.

- [ ] **Step 4: Review changed files**

Run: `git status --short`

Expected: only intended SECS/GEM demo files, nav test/source files, and existing unrelated user changes.
