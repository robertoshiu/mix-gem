# SECS/GEM Dynamic Data Engine Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the static 7-message SECS/GEM simulator with a hash-seeded engine producing ~200 unique messages per 3-minute cycle across 7 categories, with dynamic equipment state and rolling buffer display.

**Architecture:** A pure-function `generateTick(seed, tickIndex)` engine driven by mulberry32 PRNG. The page.tsx tick loop calls it at ~900ms intervals, pushes messages into a FIFO rolling buffer (cap 50), and merges equipment state updates. Scenario templates cycle automatically as matching SxFy messages appear in the feed.

**Tech Stack:** TypeScript, React (useRef/useState/useEffect), existing DemoSecsMessage/DemoEquipment types, Jest for tests.

**Design doc:** `docs/plans/2026-05-25-secs-gem-dynamic-data-design.md`

**Review corrections applied (2026-05-25):**
- The generated feed emits S1F1/S1F2 heartbeat traffic, not S1F13/S1F14, so the first SPC scenario step must use S1F1/S1F2 or it will never advance from live messages.
- `generateTick(seed, tickIndex)` must be pure from its inputs: no module-level sequence counter and no `Date.now()` timestamps inside generated messages.
- S1F3 status requests must pick SVIDs without replacement; duplicate SVIDs are invalid and confuse host/equipment displays.
- The page tick callback must not depend on the mutable `equipment` array; mirror equipment into a ref to avoid interval teardown/rebuild on every equipment update.
- Adding `SecsEventType` members requires updating all exhaustive icon/color maps such as `src/components/spc/EventLog.tsx`.

---

## Task 1: Extend SecsEventType + Add Message Builders

**Files:**
- Modify: `src/lib/mes-types.ts:112-123` (SecsEventType union)
- Modify: `src/lib/secs-message-log.ts` (add 9 new builders)
- Modify: `src/lib/secs-message-log.test.ts` (add tests for new builders)

**Step 1: Write failing tests**

Append to `src/lib/secs-message-log.test.ts`:

```ts
import {
  makeS6F11, makeS2F41Stop, makeS2F42Ack, makeS2F41Resume, makeS2F49, makeS2F50,
  makeS5F1, makeS5F2, makeS1F1, makeS1F2, makeS1F3, makeS1F4,
  makeS10F1, makeS10F2, makeS6F12,
} from './secs-message-log';

// ... existing tests stay ...

describe('makeS5F1', () => {
  it('has stream 5 function 1 and alarm fields', () => {
    const event = makeS5F1(7042, 'CH_PRESS_OOS', 'Chamber pressure out of spec', 'CRITICAL');
    expect(event.secsMessage.stream).toBe(5);
    expect(event.secsMessage.function).toBe(1);
    expect(event.secsMessage.alid).toBe(7042);
    expect(event.secsMessage.altx).toBe('Chamber pressure out of spec');
    expect(event.type).toBe('s5f1_alarm');
  });
});

describe('makeS5F2', () => {
  it('has stream 5 function 2 with ack', () => {
    const event = makeS5F2(7042);
    expect(event.secsMessage.stream).toBe(5);
    expect(event.secsMessage.function).toBe(2);
    expect(event.secsMessage.ackc5).toBe(0);
    expect(event.type).toBe('s5f2_alarm_ack');
  });
});

describe('makeS1F1', () => {
  it('has stream 1 function 1', () => {
    const event = makeS1F1();
    expect(event.secsMessage.stream).toBe(1);
    expect(event.secsMessage.function).toBe(1);
    expect(event.type).toBe('s1f1_online');
  });
});

describe('makeS1F2', () => {
  it('has stream 1 function 2 with model and revision', () => {
    const event = makeS1F2('LITHO-01', '2026.05');
    expect(event.secsMessage.stream).toBe(1);
    expect(event.secsMessage.function).toBe(2);
    expect(event.secsMessage.mdln).toBe('LITHO-01');
    expect(event.secsMessage.softrev).toBe('2026.05');
    expect(event.type).toBe('s1f2_online_ack');
  });
});

describe('makeS1F3', () => {
  it('has stream 1 function 3 with svid array', () => {
    const event = makeS1F3([1, 2, 100]);
    expect(event.secsMessage.stream).toBe(1);
    expect(event.secsMessage.function).toBe(3);
    expect(event.secsMessage.svids).toEqual([1, 2, 100]);
    expect(event.type).toBe('s1f3_status_request');
  });
});

describe('makeS1F4', () => {
  it('has stream 1 function 4 with status variables', () => {
    const vars = [{ svid: 1, name: 'ControlState', value: 'Online Remote' }];
    const event = makeS1F4(vars);
    expect(event.secsMessage.stream).toBe(1);
    expect(event.secsMessage.function).toBe(4);
    expect(event.secsMessage.svs).toEqual(vars);
    expect(event.type).toBe('s1f4_status_reply');
  });
});

describe('makeS10F1', () => {
  it('has stream 10 function 1 with terminal text', () => {
    const event = makeS10F1(1, 'LOT COMPLETE');
    expect(event.secsMessage.stream).toBe(10);
    expect(event.secsMessage.function).toBe(1);
    expect(event.secsMessage.text).toBe('LOT COMPLETE');
    expect(event.type).toBe('s10f1_terminal');
  });
});

describe('makeS10F2', () => {
  it('has stream 10 function 2 with ack', () => {
    const event = makeS10F2(1);
    expect(event.secsMessage.stream).toBe(10);
    expect(event.secsMessage.function).toBe(2);
    expect(event.secsMessage.ackc10).toBe(0);
    expect(event.type).toBe('s10f2_terminal_ack');
  });
});

describe('makeS6F12', () => {
  it('has stream 6 function 12 with ack', () => {
    const event = makeS6F12();
    expect(event.secsMessage.stream).toBe(6);
    expect(event.secsMessage.function).toBe(12);
    expect(event.secsMessage.ceack).toBe(0);
    expect(event.type).toBe('s6f12_collection_ack');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /mnt/e/repo/mix-gem/equipment-monitor && npx jest src/lib/secs-message-log.test.ts --no-coverage 2>&1 | tail -5`
Expected: FAIL — `makeS5F1 is not a function` (or similar import error)

**Step 3: Add new SecsEventType values**

In `src/lib/mes-types.ts`, find the `SecsEventType` union (lines 112-123) and add these new members before the semicolon:

```ts
export type SecsEventType =
  | 's6f11_spc_data'
  | 's2f41_stop'
  | 's2f42_ack'
  | 's2f41_resume'
  | 's2f49_recipe_push'
  | 's2f50_recipe_ack'
  | 's2f49_apply'
  | 's2f50_apply_ack'
  | 's2f49_override'
  | 's2f50_override_ack'
  | 's6f11_notification'
  | 's5f1_alarm'
  | 's5f2_alarm_ack'
  | 's1f1_online'
  | 's1f2_online_ack'
  | 's1f3_status_request'
  | 's1f4_status_reply'
  | 's10f1_terminal'
  | 's10f2_terminal_ack'
  | 's6f12_collection_ack';
```

**Step 4: Implement new builders**

Append to `src/lib/secs-message-log.ts` (after the existing `makeS6F11Notification`):

```ts
export function makeS5F1(alarmId: number, alarmCode: string, message: string, severity: string): SecsEvent {
  return {
    id: nextId('s5f1_alarm'),
    type: 's5f1_alarm',
    label: `S5F1 Alarm: ${alarmCode} [${severity}]`,
    timestamp: new Date(),
    secsMessage: {
      stream: 5, function: 1, alid: alarmId,
      alcd: severity === 'CRITICAL' ? 1 : severity === 'MAJOR' ? 2 : 3,
      altx: message,
    },
  };
}

export function makeS5F2(alarmId: number): SecsEvent {
  return {
    id: nextId('s5f2_alarm_ack'),
    type: 's5f2_alarm_ack',
    label: `S5F2 Alarm ACK (ALID=${alarmId})`,
    timestamp: new Date(),
    secsMessage: { stream: 5, function: 2, ackc5: 0 },
  };
}

export function makeS1F1(): SecsEvent {
  return {
    id: nextId('s1f1_online'),
    type: 's1f1_online',
    label: 'S1F1 Are You There',
    timestamp: new Date(),
    secsMessage: { stream: 1, function: 1 },
  };
}

export function makeS1F2(mdln: string, softrev: string): SecsEvent {
  return {
    id: nextId('s1f2_online_ack'),
    type: 's1f2_online_ack',
    label: `S1F2 Online (${mdln})`,
    timestamp: new Date(),
    secsMessage: { stream: 1, function: 2, mdln, softrev },
  };
}

export function makeS1F3(svids: number[]): SecsEvent {
  return {
    id: nextId('s1f3_status_request'),
    type: 's1f3_status_request',
    label: `S1F3 SV Request (${svids.length} vars)`,
    timestamp: new Date(),
    secsMessage: { stream: 1, function: 3, svids },
  };
}

export function makeS1F4(variables: Array<{ svid: number; name: string; value: string | number }>): SecsEvent {
  return {
    id: nextId('s1f4_status_reply'),
    type: 's1f4_status_reply',
    label: `S1F4 SV Reply (${variables.length} vars)`,
    timestamp: new Date(),
    secsMessage: { stream: 1, function: 4, svs: variables },
  };
}

export function makeS10F1(terminalId: number, text: string): SecsEvent {
  return {
    id: nextId('s10f1_terminal'),
    type: 's10f1_terminal',
    label: `S10F1 Terminal: ${text.slice(0, 40)}`,
    timestamp: new Date(),
    secsMessage: { stream: 10, function: 1, tid: terminalId, text },
  };
}

export function makeS10F2(terminalId: number): SecsEvent {
  return {
    id: nextId('s10f2_terminal_ack'),
    type: 's10f2_terminal_ack',
    label: `S10F2 Terminal ACK (TID=${terminalId})`,
    timestamp: new Date(),
    secsMessage: { stream: 10, function: 2, tid: terminalId, ackc10: 0 },
  };
}

export function makeS6F12(): SecsEvent {
  return {
    id: nextId('s6f12_collection_ack'),
    type: 's6f12_collection_ack',
    label: 'S6F12 Collection Event ACK',
    timestamp: new Date(),
    secsMessage: { stream: 6, function: 12, ceack: 0 },
  };
}
```

**Step 5: Run tests to verify they pass**

Run: `cd /mnt/e/repo/mix-gem/equipment-monitor && npx jest src/lib/secs-message-log.test.ts --no-coverage 2>&1 | tail -5`
Expected: All tests PASS

**Step 6: Commit**

```bash
git add src/lib/mes-types.ts src/lib/secs-message-log.ts src/lib/secs-message-log.test.ts
git commit -m "feat(secs-gem): add message builders for S5F1/2 S1F1-4 S10F1/2 S6F12"
```

---

## Task 2: Data Pools and Scenario Templates

**Files:**
- Modify: `src/lib/secs-gem-demo-data.ts` (add exports at bottom)
- Modify: `src/lib/secs-gem-demo-data.test.ts` (add pool/template tests)

**Step 1: Write failing tests**

Append to `src/lib/secs-gem-demo-data.test.ts`:

```ts
import {
  getDefaultDemoEquipment,
  getSecsGemDemoData,
  resolveDemoEquipment,
  SCENARIO_TEMPLATES,
  ALARM_TEMPLATES,
  TERMINAL_MESSAGES,
  STATUS_VARIABLES,
  SPC_NOMINAL,
} from './secs-gem-demo-data';

// ... existing tests stay ...

describe('data pools', () => {
  it('SCENARIO_TEMPLATES has 4 templates each with 4 steps', () => {
    expect(SCENARIO_TEMPLATES).toHaveLength(4);
    for (const template of SCENARIO_TEMPLATES) {
      expect(template).toHaveLength(4);
      for (const step of template) {
        expect(step).toHaveProperty('id');
        expect(step).toHaveProperty('label');
        expect(step).toHaveProperty('primary');
        expect(step).toHaveProperty('expected');
      }
    }
  });

  it('ALARM_TEMPLATES has 10 entries with required fields', () => {
    expect(ALARM_TEMPLATES).toHaveLength(10);
    for (const alarm of ALARM_TEMPLATES) {
      expect(alarm).toHaveProperty('alarmId');
      expect(alarm).toHaveProperty('code');
      expect(alarm).toHaveProperty('message');
      expect(alarm).toHaveProperty('severity');
      expect(alarm).toHaveProperty('rootCause');
      expect(alarm).toHaveProperty('action');
    }
  });

  it('TERMINAL_MESSAGES has 8 message templates', () => {
    expect(TERMINAL_MESSAGES).toHaveLength(8);
    for (const msg of TERMINAL_MESSAGES) {
      expect(typeof msg).toBe('string');
      expect(msg.length).toBeGreaterThan(0);
    }
  });

  it('STATUS_VARIABLES has 8 entries with svid, name, and values array', () => {
    expect(STATUS_VARIABLES).toHaveLength(8);
    for (const sv of STATUS_VARIABLES) {
      expect(sv).toHaveProperty('svid');
      expect(sv).toHaveProperty('name');
      expect(sv.values.length).toBeGreaterThan(0);
    }
  });

  it('SPC_NOMINAL has all 5 parameters with mean and stddev', () => {
    expect(Object.keys(SPC_NOMINAL)).toEqual(
      expect.arrayContaining(['cd', 'cdu', 'ovl_x', 'ovl_y', 'ler'])
    );
    for (const param of Object.values(SPC_NOMINAL)) {
      expect(param).toHaveProperty('mean');
      expect(param).toHaveProperty('stddev');
      expect(typeof param.mean).toBe('number');
      expect(typeof param.stddev).toBe('number');
    }
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /mnt/e/repo/mix-gem/equipment-monitor && npx jest src/lib/secs-gem-demo-data.test.ts --no-coverage 2>&1 | tail -5`
Expected: FAIL — `SCENARIO_TEMPLATES is not exported`

**Step 3: Implement data pools**

Append to `src/lib/secs-gem-demo-data.ts` (after the `resolveDemoEquipment` function):

```ts
// ── Data Pools for Dynamic Simulation Engine ──────────────────

export const SPC_NOMINAL: Record<string, { mean: number; stddev: number }> = {
  cd:    { mean: 50.0, stddev: 1.5 },
  cdu:   { mean: 3.5,  stddev: 0.8 },
  ovl_x: { mean: 0.0,  stddev: 1.2 },
  ovl_y: { mean: 0.0,  stddev: 1.2 },
  ler:   { mean: 2.8,  stddev: 0.5 },
};

export const ALARM_TEMPLATES = [
  { alarmId: 7042, code: 'CH_PRESS_OOS',  message: 'Chamber pressure out of spec',        severity: 'CRITICAL', rootCause: 'Throttle valve drift causing pressure regulation failure',   action: 'Hold current wafer and lot for inspection' },
  { alarmId: 3021, code: 'WS_FOCUS_WARN', message: 'Focus offset approaching limit',       severity: 'MAJOR',    rootCause: 'Wafer stage leveling correction drifting',                   action: 'Run focus calibration sequence' },
  { alarmId: 5003, code: 'TEMP_HIGH',     message: 'Chiller temperature above threshold',  severity: 'MAJOR',    rootCause: 'Coolant flow restriction in recirculation loop',             action: 'Check coolant lines and filter condition' },
  { alarmId: 1015, code: 'GAS_FLOW_LOW',  message: 'Process gas flow below minimum',       severity: 'CRITICAL', rootCause: 'MFC calibration drift or supply pressure drop',              action: 'Verify gas supply pressure and MFC zero' },
  { alarmId: 2088, code: 'RF_REFLECT',    message: 'RF reflected power exceeds limit',     severity: 'MAJOR',    rootCause: 'Impedance mismatch from process drift or arcing',            action: 'Check matching network and clean chamber' },
  { alarmId: 4055, code: 'VACUUM_LEAK',   message: 'Base pressure not reached in time',    severity: 'CRITICAL', rootCause: 'O-ring seal degradation or chamber crack',                   action: 'Perform helium leak check on all ports' },
  { alarmId: 6012, code: 'WFR_MISALIGN',  message: 'Wafer pre-alignment failed',           severity: 'MINOR',    rootCause: 'Wafer notch detection sensor contaminated',                  action: 'Clean notch sensor and retry alignment' },
  { alarmId: 8077, code: 'PUMP_VIB',      message: 'Turbo pump vibration above threshold', severity: 'MAJOR',    rootCause: 'Bearing wear or rotor imbalance',                            action: 'Schedule pump replacement within 48h' },
  { alarmId: 9001, code: 'INTLK_TRIP',    message: 'Safety interlock triggered',           severity: 'CRITICAL', rootCause: 'Door sensor or emergency stop activated',                    action: 'Inspect interlocks and reset when safe' },
  { alarmId: 1234, code: 'DOSE_DRIFT',    message: 'Exposure dose uniformity degrading',   severity: 'MINOR',    rootCause: 'Lamp aging or pulse energy variance',                        action: 'Monitor and schedule lamp replacement' },
] as const;

export const TERMINAL_MESSAGES = [
  'LOT {lot} COMPLETE — UNLOAD FOUP',
  'PM CYCLE {n} STARTED ON {tool}',
  'OPERATOR: CHECK ALIGNMENT ON {tool}',
  'RECIPE {recipe} DOWNLOADED TO {tool}',
  'WAFER {wafer} OF {total} PROCESSED',
  'MAINTENANCE WINDOW IN {mins} MIN',
  'QUAL WAFER RUN INITIATED ON {tool}',
  'SHIFT CHANGE: B-SHIFT STARTING',
] as const;

export const STATUS_VARIABLES = [
  { svid: 1,   name: 'ControlState',     values: ['Online Remote', 'Online Local', 'Offline'] },
  { svid: 2,   name: 'ProcessState',     values: ['Processing', 'Idle', 'Setup', 'Ready'] },
  { svid: 3,   name: 'PPExecName',       values: ['LITHO-193nm-v4', 'COAT-std-v2', 'DEV-alkaline-v1'] },
  { svid: 4,   name: 'PrevProcessState', values: ['Processing', 'Idle', 'Paused'] },
  { svid: 100, name: 'Temperature',      values: ['23.4', '24.1', '22.8', '23.9', '24.5'] },
  { svid: 101, name: 'ChamberPressure',  values: ['800', '812', '795', '808', '821'] },
  { svid: 102, name: 'GasFlowRate',      values: ['150.2', '149.8', '151.0', '148.5', '150.8'] },
  { svid: 103, name: 'WaferCount',       values: ['0', '5', '12', '18', '24', '25'] },
] as const;

export type ScenarioTemplateId = 'spc-violation' | 'lot-changeover' | 'alarm-response' | 'preventive-maintenance';

export const SCENARIO_TEMPLATES: DemoScenarioStep[][] = [
  [ // SPC Violation Flow
    { id: 'spc-heartbeat', label: 'Verify online heartbeat', actor: 'Host',      action: 'Confirm equipment is present and online',           primary: 'S1F1',  expected: 'S1F2',  status: 'pending' },
    { id: 'spc-collect',   label: 'Collect SPC report',      actor: 'Equipment', action: 'Publish wafer metrology collection event',          primary: 'S6F11', expected: 'S6F12', status: 'pending' },
    { id: 'spc-inhibit',   label: 'Inhibit on violation',    actor: 'Host',      action: 'Send remote STOP after SPC rule breach',            primary: 'S2F41', expected: 'S2F42', status: 'pending' },
    { id: 'spc-recipe',    label: 'Push corrected recipe',   actor: 'Host',      action: 'Load updated process program',                      primary: 'S2F49', expected: 'S2F50', status: 'pending' },
  ],
  [ // Lot Changeover
    { id: 'lot-unload',  label: 'Unload current lot', actor: 'Equipment', action: 'Complete lot processing and unload FOUP',        primary: 'S6F11', expected: 'S6F12', status: 'pending' },
    { id: 'lot-load',    label: 'Load new lot',       actor: 'Host',      action: 'Issue lot start command',                        primary: 'S2F41', expected: 'S2F42', status: 'pending' },
    { id: 'lot-verify',  label: 'Verify recipe',      actor: 'Host',      action: 'Confirm process program loaded',                 primary: 'S1F3',  expected: 'S1F4',  status: 'pending' },
    { id: 'lot-start',   label: 'Start process',      actor: 'Host',      action: 'Begin wafer processing sequence',                primary: 'S2F49', expected: 'S2F50', status: 'pending' },
  ],
  [ // Alarm Response
    { id: 'alarm-report', label: 'Alarm report',        actor: 'Equipment', action: 'Equipment reports fault condition',                primary: 'S5F1',  expected: 'S5F2',  status: 'pending' },
    { id: 'alarm-ack',    label: 'Operator acknowledge', actor: 'Host',      action: 'Operator acknowledges alarm and inspects state',  primary: 'S1F3',  expected: 'S1F4',  status: 'pending' },
    { id: 'alarm-clear',  label: 'Clear alarm',          actor: 'Host',      action: 'Issue resume after condition resolved',           primary: 'S2F41', expected: 'S2F42', status: 'pending' },
    { id: 'alarm-resume', label: 'Resume processing',    actor: 'Host',      action: 'Restart process with verified parameters',        primary: 'S2F49', expected: 'S2F50', status: 'pending' },
  ],
  [ // Preventive Maintenance
    { id: 'pm-pause',  label: 'Pause tool',           actor: 'Host',      action: 'Suspend processing for scheduled maintenance',   primary: 'S2F41', expected: 'S2F42', status: 'pending' },
    { id: 'pm-diag',   label: 'Run diagnostics',      actor: 'Equipment', action: 'Execute self-test and report results',           primary: 'S6F11', expected: 'S6F12', status: 'pending' },
    { id: 'pm-config', label: 'Update configuration', actor: 'Host',      action: 'Push calibrated parameters to equipment',        primary: 'S2F49', expected: 'S2F50', status: 'pending' },
    { id: 'pm-resume', label: 'Resume tool',           actor: 'Host',      action: 'Restart process with updated calibration',       primary: 'S2F41', expected: 'S2F42', status: 'pending' },
  ],
];
```

**Step 4: Run tests to verify they pass**

Run: `cd /mnt/e/repo/mix-gem/equipment-monitor && npx jest src/lib/secs-gem-demo-data.test.ts --no-coverage 2>&1 | tail -5`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/lib/secs-gem-demo-data.ts src/lib/secs-gem-demo-data.test.ts
git commit -m "feat(secs-gem): add data pools and scenario templates for sim engine"
```

---

## Task 3: PRNG Core (mulberry32, pick, gaussian)

**Files:**
- Create: `src/lib/secs-gem-sim-engine.ts`
- Create: `src/lib/secs-gem-sim-engine.test.ts`

**Step 1: Write failing tests**

Create `src/lib/secs-gem-sim-engine.test.ts`:

```ts
import { mulberry32, pick, gaussian, selectCategory, type MessageCategory } from './secs-gem-sim-engine';

describe('mulberry32', () => {
  it('returns deterministic sequence for same seed', () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);
    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());
    expect(seq1).toEqual(seq2);
  });

  it('returns different sequences for different seeds', () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(99);
    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());
    expect(seq1).not.toEqual(seq2);
  });

  it('returns values in [0, 1) range', () => {
    const rng = mulberry32(123);
    const values = Array.from({ length: 1000 }, () => rng());
    for (const v of values) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('pick', () => {
  it('picks element from array based on rand value', () => {
    const arr = ['a', 'b', 'c', 'd'];
    expect(pick(arr, 0.0)).toBe('a');
    expect(pick(arr, 0.24)).toBe('a');
    expect(pick(arr, 0.25)).toBe('b');
    expect(pick(arr, 0.99)).toBe('d');
  });
});

describe('gaussian', () => {
  it('returns values centered around mean', () => {
    const rng = mulberry32(42);
    const values = Array.from({ length: 500 }, () => gaussian(50, 1.5, rng(), rng()));
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    expect(avg).toBeGreaterThan(48);
    expect(avg).toBeLessThan(52);
  });

  it('respects stddev spread', () => {
    const rng = mulberry32(42);
    const values = Array.from({ length: 500 }, () => gaussian(50, 1.5, rng(), rng()));
    const min = Math.min(...values);
    const max = Math.max(...values);
    // 99.7% should be within 3 sigma = 50 +/- 4.5
    expect(min).toBeGreaterThan(40);
    expect(max).toBeLessThan(60);
  });
});

describe('selectCategory', () => {
  it('returns collection for low values (weight 0.35)', () => {
    expect(selectCategory(0.0)).toBe('collection');
    expect(selectCategory(0.34)).toBe('collection');
  });

  it('returns status for values in [0.35, 0.50)', () => {
    expect(selectCategory(0.35)).toBe('status');
    expect(selectCategory(0.49)).toBe('status');
  });

  it('distributes all 7 categories across full range', () => {
    const categories = new Set<MessageCategory>();
    for (let i = 0; i < 100; i++) {
      categories.add(selectCategory(i / 100));
    }
    expect(categories.size).toBe(7);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /mnt/e/repo/mix-gem/equipment-monitor && npx jest src/lib/secs-gem-sim-engine.test.ts --no-coverage 2>&1 | tail -5`
Expected: FAIL — Cannot find module `./secs-gem-sim-engine`

**Step 3: Implement PRNG core**

Create `src/lib/secs-gem-sim-engine.ts`:

```ts
import type { DemoDirection, DemoSecsMessage, DemoEquipment, DemoScenarioStep } from './secs-gem-demo-data';

// ── PRNG ──────────────────────────────────────────────

/** Mulberry32 — fast 32-bit PRNG from a single integer seed. */
export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick element from array using a PRNG value in [0, 1). */
export function pick<T>(arr: readonly T[], rand: number): T {
  return arr[Math.floor(rand * arr.length)];
}

/** Gaussian approximation via Box-Muller transform. r1, r2 are uniform [0, 1). */
export function gaussian(mean: number, stddev: number, r1: number, r2: number): number {
  const u = r1 < 0.0001 ? 0.0001 : r1;
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r2);
  return mean + stddev * z;
}

// ── Category Selection ────────────────────────────────

export type MessageCategory = 'collection' | 'status' | 'remote' | 'recipe' | 'alarm' | 'heartbeat' | 'terminal';

export const CATEGORY_WEIGHTS: { category: MessageCategory; weight: number }[] = [
  { category: 'collection', weight: 0.35 },
  { category: 'status',     weight: 0.15 },
  { category: 'remote',     weight: 0.12 },
  { category: 'recipe',     weight: 0.10 },
  { category: 'alarm',      weight: 0.10 },
  { category: 'heartbeat',  weight: 0.08 },
  { category: 'terminal',   weight: 0.10 },
];

export function selectCategory(rand: number): MessageCategory {
  let cumulative = 0;
  for (const entry of CATEGORY_WEIGHTS) {
    cumulative += entry.weight;
    if (rand < cumulative) return entry.category;
  }
  return 'collection';
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /mnt/e/repo/mix-gem/equipment-monitor && npx jest src/lib/secs-gem-sim-engine.test.ts --no-coverage 2>&1 | tail -5`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/lib/secs-gem-sim-engine.ts src/lib/secs-gem-sim-engine.test.ts
git commit -m "feat(secs-gem): add PRNG core for simulation engine"
```

---

## Task 4: generateTick — Message Generation

**Files:**
- Modify: `src/lib/secs-gem-sim-engine.ts` (add generateTick + helpers)
- Modify: `src/lib/secs-gem-sim-engine.test.ts` (add generateTick tests)

**Step 1: Write failing tests**

Append to `src/lib/secs-gem-sim-engine.test.ts`:

```ts
import {
  mulberry32, pick, gaussian, selectCategory,
  generateTick, type MessageCategory, type TickResult,
} from './secs-gem-sim-engine';

// ... existing PRNG tests stay ...

describe('generateTick', () => {
  it('returns at least 1 message per tick', () => {
    const result = generateTick(42, 0);
    expect(result.messages.length).toBeGreaterThanOrEqual(1);
  });

  it('returns at most 2 messages per tick (request + reply pair)', () => {
    for (let i = 0; i < 50; i++) {
      const result = generateTick(42, i);
      expect(result.messages.length).toBeLessThanOrEqual(2);
    }
  });

  it('is deterministic for same seed and tick', () => {
    const r1 = generateTick(42, 5);
    const r2 = generateTick(42, 5);
    expect(r1.messages.map(m => m.sf)).toEqual(r2.messages.map(m => m.sf));
    expect(r1.messages.map(m => m.summary)).toEqual(r2.messages.map(m => m.summary));
  });

  it('produces different messages for different ticks', () => {
    const results = Array.from({ length: 20 }, (_, i) => generateTick(42, i));
    const allSummaries = results.flatMap(r => r.messages.map(m => m.summary));
    const uniqueSummaries = new Set(allSummaries);
    // At least 50% should be unique (hash variety)
    expect(uniqueSummaries.size).toBeGreaterThan(allSummaries.length * 0.4);
  });

  it('covers all 7 message categories over 200 ticks', () => {
    const sfSet = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const result = generateTick(42, i);
      for (const msg of result.messages) {
        sfSet.add(msg.sf);
      }
    }
    // Should have messages from all 7 categories
    expect(sfSet.has('S6F11')).toBe(true);  // collection
    expect(sfSet.has('S1F3')).toBe(true);   // status
    expect(sfSet.has('S2F41')).toBe(true);  // remote
    expect(sfSet.has('S2F49')).toBe(true);  // recipe
    expect(sfSet.has('S5F1')).toBe(true);   // alarm
    expect(sfSet.has('S1F1')).toBe(true);   // heartbeat
    expect(sfSet.has('S10F1')).toBe(true);  // terminal
  });

  it('no duplicate message ids in 200 ticks', () => {
    const allIds = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const result = generateTick(42, i);
      for (const msg of result.messages) {
        expect(allIds.has(msg.id)).toBe(false);
        allIds.add(msg.id);
      }
    }
  });

  it('messages have valid DemoSecsMessage shape', () => {
    const result = generateTick(42, 0);
    for (const msg of result.messages) {
      expect(msg).toHaveProperty('id');
      expect(msg).toHaveProperty('timestamp');
      expect(msg).toHaveProperty('direction');
      expect(msg).toHaveProperty('sf');
      expect(msg).toHaveProperty('stream');
      expect(msg).toHaveProperty('function');
      expect(msg).toHaveProperty('wbit');
      expect(msg).toHaveProperty('latencyMs');
      expect(msg).toHaveProperty('systemBytes');
      expect(msg).toHaveProperty('summary');
      expect(msg).toHaveProperty('payload');
      expect(['H2E', 'E2H']).toContain(msg.direction);
      expect(msg.latencyMs).toBeGreaterThanOrEqual(0);
    }
  });

  it('burst pairs have matching request/reply streams', () => {
    let foundPair = false;
    for (let i = 0; i < 100; i++) {
      const result = generateTick(42, i);
      if (result.messages.length === 2) {
        const [req, reply] = result.messages;
        expect(req.stream).toBe(reply.stream);
        expect(reply.function).toBe(req.function + 1);
        foundPair = true;
      }
    }
    expect(foundPair).toBe(true);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /mnt/e/repo/mix-gem/equipment-monitor && npx jest src/lib/secs-gem-sim-engine.test.ts --no-coverage 2>&1 | tail -5`
Expected: FAIL — `generateTick is not exported` (or not a function)

**Step 3: Implement generateTick**

Add to `src/lib/secs-gem-sim-engine.ts` (after the existing code):

```ts
import {
  ALARM_TEMPLATES, TERMINAL_MESSAGES, STATUS_VARIABLES, SPC_NOMINAL,
  type DemoDirection, type DemoSecsMessage,
} from './secs-gem-demo-data';
import { MOCK_LOTS, MOCK_RECIPES } from './mes-mock-data';

// ── Types ─────────────────────────────────────────────

export interface TickResult {
  messages: DemoSecsMessage[];
}

// ── Message Factory ───────────────────────────────────

const SIMULATION_BASE_TIME = Date.UTC(2026, 4, 25, 0, 0, 0);

function makeDemoMsg(
  direction: DemoDirection,
  stream: number,
  func: number,
  latencyMs: number,
  summary: string,
  payload: Record<string, unknown>,
  tickKey: string,
  tickIndex: number,
  messageIndex: number,
): DemoSecsMessage {
  const sequence = tickIndex * 2 + messageIndex;
  return {
    id: `sim-${tickKey}-${messageIndex}`,
    timestamp: new Date(SIMULATION_BASE_TIME + tickIndex * 900 + messageIndex * 75).toISOString(),
    direction,
    sf: `S${stream}F${func}`,
    stream,
    function: func,
    wbit: func % 2 === 1,
    latencyMs,
    systemBytes: `0x${(0x2000 + (sequence & 0xFFF)).toString(16).toUpperCase()}`,
    summary,
    payload,
  };
}

// ── Tick Generator ────────────────────────────────────

const SPC_KEYS = ['cd', 'cdu', 'ovl_x', 'ovl_y', 'ler'] as const;
const REMOTE_CMDS = ['STOP', 'RESUME', 'ABORT', 'PAUSE'] as const;
const REMOTE_REASONS = [
  'SPC_VIOLATION:cd:rule_1', 'SPC_VIOLATION:cdu:rule_2',
  'OPERATOR_REQUEST', 'SCHEDULE_MAINTENANCE',
  'QUAL_RUN_COMPLETE', 'LOT_HOLD_RELEASE',
] as const;
const TOOL_MODELS = ['LITHO-01', 'COAT-01', 'DEV-01', 'LITHO-02', 'COAT-02', 'DEV-02'] as const;

export function generateTick(seed: number, tickIndex: number): TickResult {
  const rng = mulberry32(seed + tickIndex * 7919);
  const category = selectCategory(rng());
  const messages: DemoSecsMessage[] = [];
  const tickKey = `${seed}-${tickIndex}`;

  switch (category) {
    case 'collection': {
      const lot = pick(MOCK_LOTS, rng());
      const wafer = Math.floor(rng() * 25) + 1;
      const values: Record<string, number> = {};
      for (const key of SPC_KEYS) {
        const nom = SPC_NOMINAL[key];
        values[key] = +gaussian(nom.mean, nom.stddev, rng(), rng()).toFixed(3);
      }
      const ceid = 100 + Math.floor(rng() * 16);
      messages.push(makeDemoMsg('E2H', 6, 11, Math.floor(rng() * 30) + 10,
        `S6F11 Collection Event: ${lot.id} wafer ${wafer}`,
        { stream: 6, function: 11, ceid, reports: SPC_KEYS.map((k, i) => ({ rptid: 1001 + i, parameter: k, value: values[k] })) },
        tickKey,
        tickIndex,
        messages.length,
      ));
      messages.push(makeDemoMsg('H2E', 6, 12, Math.floor(rng() * 8) + 2,
        'S6F12 Collection Event ACK',
        { stream: 6, function: 12, ceack: 0 },
        tickKey,
        tickIndex,
        messages.length,
      ));
      break;
    }
    case 'status': {
      const count = Math.floor(rng() * 3) + 2;
      const svids: number[] = [];
      const vars: Array<{ svid: number; name: string; value: string }> = [];
      const statusPool = [...STATUS_VARIABLES];
      while (svids.length < count && statusPool.length > 0) {
        const index = Math.floor(rng() * statusPool.length);
        const sv = statusPool.splice(index, 1)[0];
        svids.push(sv.svid);
        vars.push({ svid: sv.svid, name: sv.name, value: pick(sv.values, rng()) });
      }
      messages.push(makeDemoMsg('H2E', 1, 3, Math.floor(rng() * 15) + 5,
        `S1F3 SV Request (${count} vars)`,
        { stream: 1, function: 3, svids },
        tickKey,
        tickIndex,
        messages.length,
      ));
      messages.push(makeDemoMsg('E2H', 1, 4, Math.floor(rng() * 20) + 8,
        `S1F4 SV Reply (${count} vars)`,
        { stream: 1, function: 4, svs: vars },
        tickKey,
        tickIndex,
        messages.length,
      ));
      break;
    }
    case 'remote': {
      const rcmd = pick(REMOTE_CMDS, rng());
      const reason = pick(REMOTE_REASONS, rng());
      const tool = pick(TOOL_MODELS, rng());
      messages.push(makeDemoMsg('H2E', 2, 41, Math.floor(rng() * 20) + 10,
        `S2F41 ${rcmd} -> ${tool}`,
        { stream: 2, function: 41, rcmd, params: [{ cpname: 'REASON', cpval: reason }] },
        tickKey,
        tickIndex,
        messages.length,
      ));
      messages.push(makeDemoMsg('E2H', 2, 42, Math.floor(rng() * 12) + 5,
        `S2F42 ACK (HCACK=0)`,
        { stream: 2, function: 42, hcack: 0 },
        tickKey,
        tickIndex,
        messages.length,
      ));
      break;
    }
    case 'recipe': {
      const recipe = pick(MOCK_RECIPES, rng());
      const tool = pick(TOOL_MODELS, rng());
      const success = rng() > 0.1;
      messages.push(makeDemoMsg('H2E', 2, 49, Math.floor(rng() * 25) + 12,
        `S2F49 Recipe Push: ${recipe.id} -> ${tool}`,
        { stream: 2, function: 49, rcmd: 'PP-LOAD', params: [{ cpname: 'PPID', cpval: recipe.id }] },
        tickKey,
        tickIndex,
        messages.length,
      ));
      messages.push(makeDemoMsg('E2H', 2, 50, Math.floor(rng() * 20) + 15,
        `S2F50 Recipe ACK (${success ? 'OK' : 'FAIL'})`,
        { stream: 2, function: 50, hcack: success ? 0 : 1 },
        tickKey,
        tickIndex,
        messages.length,
      ));
      break;
    }
    case 'alarm': {
      const alarm = pick(ALARM_TEMPLATES, rng());
      const tool = pick(TOOL_MODELS, rng());
      messages.push(makeDemoMsg('E2H', 5, 1, Math.floor(rng() * 10) + 3,
        `S5F1 Alarm: ${alarm.code} [${alarm.severity}] on ${tool}`,
        { stream: 5, function: 1, alid: alarm.alarmId, alcd: alarm.severity === 'CRITICAL' ? 1 : alarm.severity === 'MAJOR' ? 2 : 3, altx: alarm.message },
        tickKey,
        tickIndex,
        messages.length,
      ));
      messages.push(makeDemoMsg('H2E', 5, 2, Math.floor(rng() * 8) + 2,
        `S5F2 Alarm ACK (ALID=${alarm.alarmId})`,
        { stream: 5, function: 2, ackc5: 0 },
        tickKey,
        tickIndex,
        messages.length,
      ));
      break;
    }
    case 'heartbeat': {
      const tool = pick(TOOL_MODELS, rng());
      messages.push(makeDemoMsg('H2E', 1, 1, Math.floor(rng() * 5) + 1,
        `S1F1 Are You There -> ${tool}`,
        { stream: 1, function: 1 },
        tickKey,
        tickIndex,
        messages.length,
      ));
      messages.push(makeDemoMsg('E2H', 1, 2, Math.floor(rng() * 8) + 3,
        `S1F2 Online (${tool} v2026.05)`,
        { stream: 1, function: 2, mdln: tool, softrev: '2026.05' },
        tickKey,
        tickIndex,
        messages.length,
      ));
      break;
    }
    case 'terminal': {
      const template = pick(TERMINAL_MESSAGES, rng());
      const lot = pick(MOCK_LOTS, rng());
      const recipe = pick(MOCK_RECIPES, rng());
      const tool = pick(TOOL_MODELS, rng());
      const wafer = Math.floor(rng() * 25) + 1;
      const text = template
        .replace('{lot}', lot.id)
        .replace('{recipe}', recipe.id)
        .replace('{tool}', tool)
        .replace('{wafer}', String(wafer))
        .replace('{total}', '25')
        .replace('{n}', String(Math.floor(rng() * 50) + 1))
        .replace('{mins}', String(Math.floor(rng() * 60) + 5));
      const tid = Math.floor(rng() * 4) + 1;
      messages.push(makeDemoMsg('H2E', 10, 1, Math.floor(rng() * 10) + 5,
        `S10F1 Terminal: ${text.slice(0, 50)}`,
        { stream: 10, function: 1, tid, text },
        tickKey,
        tickIndex,
        messages.length,
      ));
      messages.push(makeDemoMsg('E2H', 10, 2, Math.floor(rng() * 5) + 2,
        `S10F2 Terminal ACK (TID=${tid})`,
        { stream: 10, function: 2, tid, ackc10: 0 },
        tickKey,
        tickIndex,
        messages.length,
      ));
      break;
    }
  }

  return { messages };
}
```

Note: Update the imports at the top of the file. The full import block should be:

```ts
import {
  ALARM_TEMPLATES, TERMINAL_MESSAGES, STATUS_VARIABLES, SPC_NOMINAL,
  type DemoDirection, type DemoSecsMessage,
} from './secs-gem-demo-data';
import { MOCK_LOTS, MOCK_RECIPES } from './mes-mock-data';
```

**Step 4: Run tests to verify they pass**

Run: `cd /mnt/e/repo/mix-gem/equipment-monitor && npx jest src/lib/secs-gem-sim-engine.test.ts --no-coverage 2>&1 | tail -10`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/lib/secs-gem-sim-engine.ts src/lib/secs-gem-sim-engine.test.ts
git commit -m "feat(secs-gem): implement generateTick with 7-category message generation"
```

---

## Task 5: Equipment Updates + Scenario Cycling

**Files:**
- Modify: `src/lib/secs-gem-sim-engine.ts` (add generateEquipmentUpdate, advanceScenario)
- Modify: `src/lib/secs-gem-sim-engine.test.ts` (add tests)

**Step 1: Write failing tests**

Append to `src/lib/secs-gem-sim-engine.test.ts`:

```ts
import {
  mulberry32, pick, gaussian, selectCategory,
  generateTick, generateEquipmentUpdate, createScenarioState, advanceScenario,
  type MessageCategory, type TickResult, type EquipmentUpdate, type ScenarioState,
} from './secs-gem-sim-engine';
import { SCENARIO_TEMPLATES } from './secs-gem-demo-data';

// ... existing tests stay ...

describe('generateEquipmentUpdate', () => {
  const mockEquipment = [
    { id: 'litho-01', connectionState: 'selected' as const, status: 'running' as const, waferProgress: '14/25', timers: { t3: '45s', t5: '10s', t6: '5s', t7: '10s' } },
    { id: 'coat-01', connectionState: 'connected' as const, status: 'idle' as const, waferProgress: '0/25', timers: { t3: '45s', t5: '10s', t6: '5s', t7: '10s' } },
  ];

  it('returns array of updates', () => {
    const updates = generateEquipmentUpdate(42, 0, mockEquipment);
    expect(Array.isArray(updates)).toBe(true);
  });

  it('updates are deterministic for same seed', () => {
    const u1 = generateEquipmentUpdate(42, 10, mockEquipment);
    const u2 = generateEquipmentUpdate(42, 10, mockEquipment);
    expect(u1).toEqual(u2);
  });

  it('each update has equipmentId and changes', () => {
    // Run many ticks to find one with updates
    for (let i = 0; i < 200; i++) {
      const updates = generateEquipmentUpdate(42, i, mockEquipment);
      for (const u of updates) {
        expect(u).toHaveProperty('equipmentId');
        expect(u).toHaveProperty('changes');
        expect(mockEquipment.some(e => e.id === u.equipmentId)).toBe(true);
      }
    }
  });
});

describe('scenario cycling', () => {
  it('createScenarioState starts at template 0 step 0', () => {
    const state = createScenarioState();
    expect(state.templateIndex).toBe(0);
    expect(state.stepIndex).toBe(0);
  });

  it('advanceScenario moves to next step when matching sf arrives', () => {
    const state = createScenarioState();
    const template = SCENARIO_TEMPLATES[0]; // SPC violation
    // Step 0 primary is S1F1 so generated heartbeat traffic can advance it.
    const result = advanceScenario(state, 'S1F1');
    expect(result.stepIndex).toBe(1);
  });

  it('advanceScenario does not advance on non-matching sf', () => {
    const state = createScenarioState();
    const result = advanceScenario(state, 'S10F1');
    expect(result.stepIndex).toBe(0);
  });

  it('cycles to next template when all steps complete', () => {
    let state = createScenarioState();
    // SPC violation template: S1F1, S6F11, S2F41, S2F49
    state = advanceScenario(state, 'S1F1');
    state = advanceScenario(state, 'S6F11');
    state = advanceScenario(state, 'S2F41');
    state = advanceScenario(state, 'S2F49');
    // Should wrap to next template
    expect(state.templateIndex).toBe(1);
    expect(state.stepIndex).toBe(0);
  });

  it('wraps around to template 0 after last template completes', () => {
    let state: ScenarioState = { templateIndex: 3, stepIndex: 0 };
    // PM template: S2F41, S6F11, S2F49, S2F41
    state = advanceScenario(state, 'S2F41');
    state = advanceScenario(state, 'S6F11');
    state = advanceScenario(state, 'S2F49');
    state = advanceScenario(state, 'S2F41');
    expect(state.templateIndex).toBe(0);
    expect(state.stepIndex).toBe(0);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /mnt/e/repo/mix-gem/equipment-monitor && npx jest src/lib/secs-gem-sim-engine.test.ts --no-coverage 2>&1 | tail -5`
Expected: FAIL — `generateEquipmentUpdate is not exported`

**Step 3: Implement equipment updates + scenario cycling**

Append to `src/lib/secs-gem-sim-engine.ts`:

```ts
// ── Equipment Updates ─────────────────────────────────

export interface EquipmentUpdate {
  equipmentId: string;
  changes: Record<string, unknown>;
}

interface EquipmentSnapshot {
  id: string;
  connectionState: 'not_connected' | 'connected' | 'selected';
  status: 'running' | 'idle' | 'down';
  waferProgress: string;
  timers: { t3: string; t5: string; t6: string; t7: string };
}

const CONNECTION_CYCLE: Array<'not_connected' | 'connected' | 'selected'> = ['not_connected', 'connected', 'selected'];

export function generateEquipmentUpdate(
  seed: number,
  tickIndex: number,
  equipment: EquipmentSnapshot[],
): EquipmentUpdate[] {
  const rng = mulberry32(seed + tickIndex * 6197);
  const updates: EquipmentUpdate[] = [];

  for (const eq of equipment) {
    const r = rng();

    // Connection state change (~2% chance)
    if (r < 0.02) {
      const idx = CONNECTION_CYCLE.indexOf(eq.connectionState);
      const next = CONNECTION_CYCLE[(idx + 1) % CONNECTION_CYCLE.length];
      updates.push({ equipmentId: eq.id, changes: { connectionState: next } });
      break; // At most 1 connection change per tick
    }

    // Status change
    const r2 = rng();
    if (eq.status === 'running' && r2 < 0.03) {
      updates.push({ equipmentId: eq.id, changes: { status: 'idle' } });
    } else if (eq.status === 'idle' && r2 < 0.08) {
      updates.push({ equipmentId: eq.id, changes: { status: 'running' } });
    } else if (eq.status === 'running' && r2 >= 0.03 && r2 < 0.04) {
      updates.push({ equipmentId: eq.id, changes: { status: 'down' } });
    } else if (eq.status === 'down' && r2 < 0.05) {
      updates.push({ equipmentId: eq.id, changes: { status: 'idle' } });
    }

    // Wafer progress advance every ~10 ticks for running tools
    if (eq.status === 'running' && tickIndex % 10 === 0) {
      const parts = eq.waferProgress.split('/');
      const current = parseInt(parts[0], 10);
      const total = parseInt(parts[1], 10);
      if (current < total) {
        updates.push({ equipmentId: eq.id, changes: { waferProgress: `${current + 1}/${total}` } });
      } else if (current >= total && total > 0) {
        const newLot = pick(MOCK_LOTS, rng());
        const newRecipe = pick(MOCK_RECIPES, rng());
        updates.push({
          equipmentId: eq.id,
          changes: { waferProgress: '1/25', activeLot: newLot.id, currentRecipe: newRecipe.id },
        });
      }
    }

    // Timer jitter
    if (rng() < 0.15) {
      const jitter = Math.floor(rng() * 5) - 2;
      const baseT3 = 45 + jitter;
      updates.push({
        equipmentId: eq.id,
        changes: { timers: { t3: `${baseT3}s`, t5: `${10 + Math.floor(rng() * 3)}s`, t6: `${5 + Math.floor(rng() * 2)}s`, t7: `${10 + Math.floor(rng() * 3)}s` } },
      });
    }
  }

  return updates;
}

// ── Scenario Cycling ──────────────────────────────────

export interface ScenarioState {
  templateIndex: number;
  stepIndex: number;
}

export function createScenarioState(): ScenarioState {
  return { templateIndex: 0, stepIndex: 0 };
}

export function advanceScenario(state: ScenarioState, sf: string): ScenarioState {
  const template = SCENARIO_TEMPLATES[state.templateIndex];
  if (!template) return { templateIndex: 0, stepIndex: 0 };

  const currentStep = template[state.stepIndex];
  if (!currentStep) return state;

  if (currentStep.primary === sf) {
    const nextStep = state.stepIndex + 1;
    if (nextStep >= template.length) {
      // Cycle to next template
      const nextTemplate = (state.templateIndex + 1) % SCENARIO_TEMPLATES.length;
      return { templateIndex: nextTemplate, stepIndex: 0 };
    }
    return { templateIndex: state.templateIndex, stepIndex: nextStep };
  }

  return state;
}
```

Also add the missing import at the top:

```ts
import { SCENARIO_TEMPLATES } from './secs-gem-demo-data';
```

**Step 4: Run tests to verify they pass**

Run: `cd /mnt/e/repo/mix-gem/equipment-monitor && npx jest src/lib/secs-gem-sim-engine.test.ts --no-coverage 2>&1 | tail -10`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/lib/secs-gem-sim-engine.ts src/lib/secs-gem-sim-engine.test.ts
git commit -m "feat(secs-gem): add equipment state updates and scenario cycling"
```

---

## Task 6: Wire Engine Into page.tsx

**Files:**
- Modify: `src/app/mes/secs-gem/page.tsx` (rewrite to use sim engine + rolling buffer)
- Modify: `src/app/mes/secs-gem/page.test.tsx` (update test if needed)

**Context files to read first:**
- `src/app/mes/secs-gem/page.test.tsx` — understand existing test assertions before modifying
- `src/lib/secs-simulator-animation.ts:10` — `MAX_VISIBLE_PACKETS = 50`

**Step 1: Read existing test**

Read `src/app/mes/secs-gem/page.test.tsx` to understand what assertions exist. The test likely checks for page render, equipment display, and message feed. We need to preserve or adapt those assertions.

**Step 2: Rewrite page.tsx**

Replace the entire `src/app/mes/secs-gem/page.tsx` with the new rolling-buffer implementation. Key changes:

1. **Replace `useMemo(getSecsGemDemoData)`** with initial state from `getSecsGemDemoData()` (for equipment baseline) plus `useRef` rolling buffers.

2. **Add tick loop** via `useEffect` calling `generateTick` + `generateEquipmentUpdate` + `advanceScenario`.

3. **Remove progress bar** (infinite feed has no "end"). Replace with live stats.

4. **Rolling buffer**: `messagesRef` holds max `MAX_VISIBLE_PACKETS` messages, FIFO.

5. **Equipment state**: `useState<DemoEquipment[]>` merges updates each tick.

6. **Scenario state**: `useRef<ScenarioState>` cycles through templates.

Here is the complete replacement for `page.tsx`:

```tsx
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
  type DemoEquipment,
  type DemoSecsMessage,
  type DemoScenarioStep,
  type DemoSnapshot,
  type DemoAlarm,
} from '@/lib/secs-gem-demo-data';
import {
  generateTick,
  generateEquipmentUpdate,
  createScenarioState,
  advanceScenario,
  type ScenarioState,
} from '@/lib/secs-gem-sim-engine';
import { FeedPacketCard } from '@/components/secs-simulator/FeedPacketCard';
import { RecipeDetailCard } from '@/components/secs-simulator/RecipeDetailCard';
import { ScenarioStepCard } from '@/components/secs-simulator/ScenarioStepCard';
import TraceRow from '@/components/secs-simulator/TraceRow';
import { MOCK_RECIPES } from '@/lib/mes-mock-data';
import type { Recipe } from '@/lib/mes-types';
import { MAX_VISIBLE_PACKETS, USER_OVERRIDE_DURATION, useReducedMotion } from '@/lib/secs-simulator-animation';
import { cn } from '@/lib/utils';

const TICK_INTERVALS: Record<string, number> = {
  '0.5x': 1800,
  '1x': 900,
  '5x': 180,
  '10x': 90,
};

const CYCLE_DURATION = 180_000; // 3 minutes in ms

export default function SecsGemPage() {
  const initialData = useMemo(() => getSecsGemDemoData(), []);
  const reducedMotion = useReducedMotion();

  // Equipment state (mutable, merges updates each tick)
  const [equipment, setEquipment] = useState<DemoEquipment[]>(initialData.equipment);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(initialData.equipment[0]?.id ?? null);

  // Rolling message buffer
  const [messages, setMessages] = useState<DemoSecsMessage[]>([]);
  const tickRef = useRef(0);
  const seedRef = useRef(0);
  const equipmentRef = useRef(equipment);

  // Scenario state
  const scenarioRef = useRef<ScenarioState>(createScenarioState());
  const [scenarioState, setScenarioState] = useState<ScenarioState>(createScenarioState());

  // Active alarm (from latest S5F1)
  const [activeAlarm, setActiveAlarm] = useState<DemoAlarm | null>(
    initialData.alarms[0] ?? null
  );

  // Controls
  const [isRunning, setIsRunning] = useState(true);
  const [speed, setSpeed] = useState('1x');
  const [overrideStepId, setOverrideStepId] = useState<string | null>(null);
  const overrideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [totalGenerated, setTotalGenerated] = useState(0);

  // Derived state
  const selectedEquipment = resolveDemoEquipment(
    { ...initialData, equipment },
    selectedEquipmentId,
  );

  const template = SCENARIO_TEMPLATES[scenarioState.templateIndex] ?? SCENARIO_TEMPLATES[0];
  const scenarioSteps: DemoScenarioStep[] = template.map((step, index) => ({
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

  // Snapshot for current scenario step
  const activeSnapshot: DemoSnapshot = {
    id: `snapshot-${scenarioState.stepIndex}`,
    sequence: scenarioState.stepIndex + 1,
    timestamp: latestMessage?.timestamp ?? '2026-05-25T00:00:00.000Z',
    stepId: template[scenarioState.stepIndex]?.id ?? '',
    label: template[scenarioState.stepIndex]?.label ?? '',
    pendingTransactions: 1,
    stateVariables: [
      { name: 'Control state', value: scenarioState.stepIndex > 0 ? 'Online Remote' : 'Remote' },
      { name: 'Process state', value: template[scenarioState.stepIndex]?.id.includes('inhibit') || template[scenarioState.stepIndex]?.id.includes('alarm') ? 'Inhibited' : 'Processing' },
      { name: 'Active lot', value: selectedEquipment.activeLot },
      { name: 'Recipe', value: selectedEquipment.currentRecipe },
    ],
  };

  // Find latest recipe-related messages for Recipe Detail panel
  const s2f49Message = messagesNewestFirst.find((m) => m.stream === 2 && m.function === 49);
  const s2f50Message = messagesNewestFirst.find((m) => m.stream === 2 && m.function === 50);
  const hasS2F49 = !!s2f49Message;
  const s2f49Payload = s2f49Message?.payload as { params?: Array<{ cpval?: unknown }> } | undefined;
  const recipeId = s2f49Payload?.params?.[0]?.cpval;
  const matchedRecipe: Recipe | undefined =
    typeof recipeId === 'string' ? MOCK_RECIPES.find((c) => c.id === recipeId) : undefined;

  // ── Tick loop ──────────────────────────────────────

  const doTick = useCallback(() => {
    const currentSeed = seedRef.current;
    const currentTick = tickRef.current;
    tickRef.current += 1;

    // Cycle seed every 3 minutes worth of ticks
    // At 900ms interval, ~200 ticks per cycle
    if (currentTick > 0 && currentTick % 200 === 0) {
      seedRef.current += 1;
    }

    // Generate messages
    const tickResult = generateTick(currentSeed, currentTick);

    // Generate equipment updates
    const eqSnapshots = equipmentRef.current.map((eq) => ({
      id: eq.id,
      connectionState: eq.connectionState,
      status: eq.status,
      waferProgress: eq.waferProgress,
      timers: eq.timers,
    }));
    const eqUpdates = generateEquipmentUpdate(currentSeed, currentTick, eqSnapshots);

    // Advance scenario for each generated message
    let newScenario = scenarioRef.current;
    for (const msg of tickResult.messages) {
      newScenario = advanceScenario(newScenario, msg.sf);
    }
    scenarioRef.current = newScenario;
    setScenarioState({ ...newScenario });

    // Update alarm if S5F1 arrived
    const alarmMsg = tickResult.messages.find((m) => m.sf === 'S5F1');
    if (alarmMsg) {
      const alarmPayload = alarmMsg.payload as { alid?: number; altx?: string; alcd?: number };
      const alarmTemplate = ALARM_TEMPLATES.find((a) => a.alarmId === alarmPayload.alid);
      setActiveAlarm({
        id: `alarm-${currentTick}`,
        severity: alarmTemplate?.severity ?? 'MAJOR',
        equipmentId: selectedEquipmentId ?? '',
        message: alarmPayload.altx ?? 'Unknown alarm',
        rootCause: alarmTemplate?.rootCause ?? 'Investigating root cause',
        action: alarmTemplate?.action ?? 'Review equipment state',
      });
    }

    // Push messages to rolling buffer
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
          return update ? { ...eq, ...update.changes } : eq;
        }),
      );
    }
  }, [selectedEquipmentId]);

  useEffect(() => {
    equipmentRef.current = equipment;
  }, [equipment]);

  useEffect(() => {
    if (!isRunning) return undefined;
    const interval = window.setInterval(doTick, TICK_INTERVALS[speed] ?? TICK_INTERVALS['1x']);
    return () => window.clearInterval(interval);
  }, [doTick, isRunning, speed]);

  useEffect(() => {
    return () => {
      if (overrideTimerRef.current) clearTimeout(overrideTimerRef.current);
    };
  }, []);

  // ── Handlers ───────────────────────────────────────

  const handleUserExpand = (index: number) => {
    const step = scenarioSteps[index];
    if (!step) return;
    if (overrideTimerRef.current) clearTimeout(overrideTimerRef.current);
    setOverrideStepId(step.id);
    overrideTimerRef.current = setTimeout(() => {
      setOverrideStepId(null);
      overrideTimerRef.current = null;
    }, USER_OVERRIDE_DURATION);
  };

  const advanceFeed = () => {
    doTick();
    setIsRunning(false);
  };

  const resetFeed = () => {
    setMessages([]);
    tickRef.current = 0;
    seedRef.current = 0;
    scenarioRef.current = createScenarioState();
    setScenarioState(createScenarioState());
    setTotalGenerated(0);
    setIsRunning(false);
  };

  // ── Scenario step cards ────────────────────────────

  const scenarioStepCards = scenarioSteps.map((step, index) => {
    const isComplete = index < scenarioState.stepIndex;
    const isActive = index === scenarioState.stepIndex || (isComplete && overrideStepId === step.id);
    const message = messagesNewestFirst.find((m) => m.sf === step.primary);

    return (
      <ScenarioStepCard
        key={step.id}
        step={step}
        isActive={isActive}
        isComplete={isComplete}
        message={message}
        snapshot={index === scenarioState.stepIndex ? activeSnapshot : undefined}
        onUserExpand={() => handleUserExpand(index)}
      />
    );
  });

  // ── Render ─────────────────────────────────────────

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
              Dynamic simulation with 7 message categories, hash-seeded PRNG engine,
              and 3-minute auto-cycling data. No HSMS socket or backend required.
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
                      : 'border-[var(--sf-border-default)] bg-[var(--sf-surface-panel)] hover:bg-[var(--sf-surface-panel-alt)]'
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
                  <span className="rounded-full border border-[var(--sf-border-default)] px-2 py-0.5 text-[10px] uppercase text-[var(--sf-text-muted)]">
                    {['SPC Violation', 'Lot Changeover', 'Alarm Response', 'Preventive Maintenance'][scenarioState.templateIndex]}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    aria-pressed={isRunning}
                    onClick={() => setIsRunning(true)}
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
                    <div className="flex justify-between gap-3 text-xs text-[var(--sf-text-muted)]">
                      <span>Snapshot #{activeSnapshot.sequence}</span>
                      <span>{activeSnapshot.label}</span>
                    </div>
                    {activeSnapshot.stateVariables.map((variable) => (
                      <div key={variable.name} className="flex justify-between gap-3 text-sm">
                        <dt className="text-[var(--sf-text-muted)]">{variable.name}</dt>
                        <dd className="truncate font-mono">{variable.value}</dd>
                      </div>
                    ))}
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
                {template[scenarioState.stepIndex]?.action ?? 'Waiting for scenario'}
              </p>
              <p className="mt-3 font-mono text-xs text-[var(--sf-text-muted)]">
                {template[scenarioState.stepIndex]?.primary ?? '—'}/{template[scenarioState.stepIndex]?.expected ?? '—'}
              </p>
            </section>
          </aside>
        </section>
      </div>
    </div>
  );
}
```

**Step 3: Update the existing page test**

Read the test first, then update assertions. The test should verify:
- Page renders with "SECS/GEM Simulator" heading
- Equipment sidebar renders at least one tool
- Controls (Start/Pause/Step/Reset) are present

The test likely uses shallow rendering and mock data. Preserve the spirit of the assertions while accounting for the new dynamic behavior. Since the engine auto-starts, the test should find messages appearing.

**Step 4: Run all related tests**

```bash
cd /mnt/e/repo/mix-gem/equipment-monitor && npx jest --testPathPattern='secs' --no-coverage 2>&1 | tail -15
```

Expected: All tests PASS (secs-message-log, secs-gem-demo-data, secs-gem-sim-engine, page.test)

**Step 5: Verify existing tests still pass**

```bash
cd /mnt/e/repo/mix-gem/equipment-monitor && npx jest --no-coverage 2>&1 | tail -5
```

Expected: All existing tests still PASS (no regressions)

**Step 6: Commit**

```bash
git add src/app/mes/secs-gem/page.tsx src/app/mes/secs-gem/page.test.tsx
git commit -m "feat(secs-gem): wire dynamic sim engine with rolling buffer and scenario cycling"
```

---

## Summary

| Task | Description | New/Modified Files | Tests |
|------|-------------|-------------------|-------|
| 1 | Message builders (S5F1/2, S1F1-4, S10F1/2, S6F12) | mes-types.ts, secs-message-log.ts | 9 new test cases |
| 2 | Data pools + scenario templates | secs-gem-demo-data.ts | 5 new test cases |
| 3 | PRNG core (mulberry32, pick, gaussian, selectCategory) | secs-gem-sim-engine.ts (new) | 7 new test cases |
| 4 | generateTick message generation | secs-gem-sim-engine.ts | 8 new test cases |
| 5 | Equipment updates + scenario cycling | secs-gem-sim-engine.ts | 7 new test cases |
| 6 | Wire engine into page.tsx | page.tsx, page.test.tsx | Update existing |
