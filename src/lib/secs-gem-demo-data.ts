import { MOCK_EQUIPMENT, MOCK_LOTS, MOCK_RECIPES } from './mes-mock-data';
import { mockAlarms } from './mock-data';
import {
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
  event: { label: string; secsMessage: Record<string, unknown> }
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
      action: 'Open communication channel and select equipment',
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
