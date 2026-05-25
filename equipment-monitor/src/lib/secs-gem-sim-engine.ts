import type { DemoDirection, DemoSecsMessage } from './secs-gem-demo-data';
import { ALARM_TEMPLATES, TERMINAL_MESSAGES, STATUS_VARIABLES, SPC_NOMINAL, SCENARIO_TEMPLATES } from './secs-gem-demo-data';
import { MOCK_LOTS, MOCK_RECIPES } from './mes-mock-data';

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

// ── Types ─────────────────────────────────────────────

export interface TickResult {
  messages: DemoSecsMessage[];
}

// ── Message Factory ───────────────────────────────────

let _globalSeq = 0;

function makeDemoMsg(
  direction: DemoDirection,
  stream: number,
  func: number,
  latencyMs: number,
  summary: string,
  payload: Record<string, unknown>,
  tickSeed: number,
): DemoSecsMessage {
  _globalSeq++;
  return {
    id: `sim-${tickSeed}-${_globalSeq}`,
    timestamp: new Date().toISOString(),
    direction,
    sf: `S${stream}F${func}`,
    stream,
    function: func,
    wbit: func % 2 === 1,
    latencyMs,
    systemBytes: `0x${(0x2000 + (_globalSeq & 0xFFF)).toString(16).toUpperCase()}`,
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
  const ts = seed + tickIndex;

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
        ts,
      ));
      messages.push(makeDemoMsg('H2E', 6, 12, Math.floor(rng() * 8) + 2,
        'S6F12 Collection Event ACK',
        { stream: 6, function: 12, ceack: 0 },
        ts,
      ));
      break;
    }
    case 'status': {
      const count = Math.floor(rng() * 3) + 2;
      const svids: number[] = [];
      const vars: Array<{ svid: number; name: string; value: string }> = [];
      for (let i = 0; i < count; i++) {
        const sv = pick([...STATUS_VARIABLES], rng());
        svids.push(sv.svid);
        vars.push({ svid: sv.svid, name: sv.name, value: pick([...sv.values], rng()) });
      }
      messages.push(makeDemoMsg('H2E', 1, 3, Math.floor(rng() * 15) + 5,
        `S1F3 SV Request (${count} vars)`,
        { stream: 1, function: 3, svids },
        ts,
      ));
      messages.push(makeDemoMsg('E2H', 1, 4, Math.floor(rng() * 20) + 8,
        `S1F4 SV Reply (${count} vars)`,
        { stream: 1, function: 4, svs: vars },
        ts,
      ));
      break;
    }
    case 'remote': {
      const rcmd = pick([...REMOTE_CMDS], rng());
      const reason = pick([...REMOTE_REASONS], rng());
      const tool = pick([...TOOL_MODELS], rng());
      messages.push(makeDemoMsg('H2E', 2, 41, Math.floor(rng() * 20) + 10,
        `S2F41 ${rcmd} -> ${tool}`,
        { stream: 2, function: 41, rcmd, params: [{ cpname: 'REASON', cpval: reason }] },
        ts,
      ));
      messages.push(makeDemoMsg('E2H', 2, 42, Math.floor(rng() * 12) + 5,
        'S2F42 ACK (HCACK=0)',
        { stream: 2, function: 42, hcack: 0 },
        ts,
      ));
      break;
    }
    case 'recipe': {
      const recipe = pick(MOCK_RECIPES, rng());
      const tool = pick([...TOOL_MODELS], rng());
      const success = rng() > 0.1;
      messages.push(makeDemoMsg('H2E', 2, 49, Math.floor(rng() * 25) + 12,
        `S2F49 Recipe Push: ${recipe.id} -> ${tool}`,
        { stream: 2, function: 49, rcmd: 'PP-LOAD', params: [{ cpname: 'PPID', cpval: recipe.id }] },
        ts,
      ));
      messages.push(makeDemoMsg('E2H', 2, 50, Math.floor(rng() * 20) + 15,
        `S2F50 Recipe ACK (${success ? 'OK' : 'FAIL'})`,
        { stream: 2, function: 50, hcack: success ? 0 : 1 },
        ts,
      ));
      break;
    }
    case 'alarm': {
      const alarm = pick([...ALARM_TEMPLATES], rng());
      const tool = pick([...TOOL_MODELS], rng());
      messages.push(makeDemoMsg('E2H', 5, 1, Math.floor(rng() * 10) + 3,
        `S5F1 Alarm: ${alarm.code} [${alarm.severity}] on ${tool}`,
        { stream: 5, function: 1, alid: alarm.alarmId, alcd: alarm.severity === 'CRITICAL' ? 1 : alarm.severity === 'MAJOR' ? 2 : 3, altx: alarm.message },
        ts,
      ));
      messages.push(makeDemoMsg('H2E', 5, 2, Math.floor(rng() * 8) + 2,
        `S5F2 Alarm ACK (ALID=${alarm.alarmId})`,
        { stream: 5, function: 2, ackc5: 0 },
        ts,
      ));
      break;
    }
    case 'heartbeat': {
      const tool = pick([...TOOL_MODELS], rng());
      messages.push(makeDemoMsg('H2E', 1, 1, Math.floor(rng() * 5) + 1,
        `S1F1 Are You There -> ${tool}`,
        { stream: 1, function: 1 },
        ts,
      ));
      messages.push(makeDemoMsg('E2H', 1, 2, Math.floor(rng() * 8) + 3,
        `S1F2 Online (${tool} v2026.05)`,
        { stream: 1, function: 2, mdln: tool, softrev: '2026.05' },
        ts,
      ));
      break;
    }
    case 'terminal': {
      const template = pick([...TERMINAL_MESSAGES], rng());
      const lot = pick(MOCK_LOTS, rng());
      const recipe = pick(MOCK_RECIPES, rng());
      const tool = pick([...TOOL_MODELS], rng());
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
        ts,
      ));
      messages.push(makeDemoMsg('E2H', 10, 2, Math.floor(rng() * 5) + 2,
        `S10F2 Terminal ACK (TID=${tid})`,
        { stream: 10, function: 2, tid, ackc10: 0 },
        ts,
      ));
      break;
    }
  }

  return { messages };
}

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
        changes: {
          timers: {
            t3: `${baseT3}s`,
            t5: `${10 + Math.floor(rng() * 3)}s`,
            t6: `${5 + Math.floor(rng() * 2)}s`,
            t7: `${10 + Math.floor(rng() * 3)}s`,
          },
        },
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
      const nextTemplate = (state.templateIndex + 1) % SCENARIO_TEMPLATES.length;
      return { templateIndex: nextTemplate, stepIndex: 0 };
    }
    return { templateIndex: state.templateIndex, stepIndex: nextStep };
  }

  return state;
}
