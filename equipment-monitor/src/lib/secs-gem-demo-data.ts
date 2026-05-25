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

export const SCENARIO_TEMPLATES: DemoScenarioStep[][] = [
  [ // SPC Violation Flow
    { id: 'spc-establish', label: 'Establish communications', actor: 'Host',      action: 'Open communication channel and select equipment',  primary: 'S1F13', expected: 'S1F14', status: 'pending' },
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
