import type { SecsEvent, SecsEventType, SpcParameter, SpcRule } from './mes-types';

let _seq = 0;
function nextId(prefix: SecsEventType) {
  return `${prefix}-${Date.now()}-${++_seq}`;
}

type Values = { cd: number; cdu: number; ovl_x: number; ovl_y: number; ler: number };

export function makeS6F11(lotId: string, waferNumber: number, values: Values): SecsEvent {
  return {
    id: nextId('s6f11_spc_data'),
    type: 's6f11_spc_data',
    label: `S6F11 Collection Event: ${lotId} wafer ${waferNumber}`,
    timestamp: new Date(),
    secsMessage: {
      stream: 6, function: 11, ceid: 100,
      reports: [
        { rptid: 1001, parameter: 'cd',    value: +values.cd.toFixed(3) },
        { rptid: 1002, parameter: 'cdu',   value: +values.cdu.toFixed(3) },
        { rptid: 1003, parameter: 'ovl_x', value: +values.ovl_x.toFixed(3) },
        { rptid: 1004, parameter: 'ovl_y', value: +values.ovl_y.toFixed(3) },
        { rptid: 1005, parameter: 'ler',   value: +values.ler.toFixed(3) },
      ],
    },
  };
}

export function makeS2F41Stop(parameter: SpcParameter, rule: SpcRule): SecsEvent {
  return {
    id: nextId('s2f41_stop'),
    type: 's2f41_stop',
    label: 'S2F41 STOP -> LITHO01',
    timestamp: new Date(),
    secsMessage: {
      stream: 2, function: 41, rcmd: 'STOP',
      params: [{ cpname: 'REASON', cpval: `SPC_VIOLATION:${parameter}:${rule}` }],
    },
  };
}

export function makeS2F42Ack(): SecsEvent {
  return {
    id: nextId('s2f42_ack'),
    type: 's2f42_ack',
    label: 'S2F42 ACK (HCACK=0)',
    timestamp: new Date(),
    secsMessage: { stream: 2, function: 42, hcack: 0 },
  };
}

export function makeS2F41Resume(): SecsEvent {
  return {
    id: nextId('s2f41_resume'),
    type: 's2f41_resume',
    label: 'S2F41 RESUME -> LITHO01',
    timestamp: new Date(),
    secsMessage: {
      stream: 2, function: 41, rcmd: 'RESUME',
      params: [{ cpname: 'REASON', cpval: 'OPERATOR_ACKNOWLEDGE' }],
    },
  };
}

export function makeS2F49(recipeId: string): SecsEvent {
  return {
    id: nextId('s2f49_recipe_push'),
    type: 's2f49_recipe_push',
    label: `S2F49 Recipe Push: ${recipeId}`,
    timestamp: new Date(),
    secsMessage: {
      stream: 2, function: 49, rcmd: 'PP-LOAD',
      params: [{ cpname: 'PPID', cpval: recipeId }],
    },
  };
}

export function makeS2F50(success: boolean): SecsEvent {
  return {
    id: nextId('s2f50_recipe_ack'),
    type: 's2f50_recipe_ack',
    label: `S2F50 Recipe ACK (${success ? 'OK' : 'FAIL'})`,
    timestamp: new Date(),
    secsMessage: { stream: 2, function: 50, hcack: success ? 0 : 1 },
  };
}

export function makeS2F49ApplyRecommendation(recommendationId: string, rcmd: string): SecsEvent {
  return {
    id: nextId('s2f49_apply'),
    type: 's2f49_apply',
    label: `S2F49 Apply Recommendation: ${recommendationId} (${rcmd})`,
    timestamp: new Date(),
    secsMessage: {
      stream: 2, function: 49, rcmd: rcmd,
      params: [
        { cpname: 'RECOMMENDATION_ID', cpval: recommendationId },
        { cpname: 'ACTION', cpval: 'APPLY' },
      ],
    },
  };
}

export function makeS2F50ApplyAck(recommendationId: string, accepted: boolean = true): SecsEvent {
  return {
    id: nextId('s2f50_apply_ack'),
    type: 's2f50_apply_ack',
    label: `S2F50 Apply ACK (${accepted ? 'HCACK=0' : 'HCACK=1'}): ${recommendationId}`,
    timestamp: new Date(),
    secsMessage: {
      stream: 2, function: 50, hcack: accepted ? 0 : 1,
      params: [{ cpname: 'RECOMMENDATION_ID', cpval: recommendationId }],
    },
  };
}

export function makeS2F49OverrideRecommendation(recommendationId: string, rcmd: string): SecsEvent {
  return {
    id: nextId('s2f49_override'),
    type: 's2f49_override',
    label: `S2F49 Override Recommendation: ${recommendationId} (${rcmd})`,
    timestamp: new Date(),
    secsMessage: {
      stream: 2, function: 49, rcmd: rcmd,
      params: [
        { cpname: 'RECOMMENDATION_ID', cpval: recommendationId },
        { cpname: 'ACTION', cpval: 'OVERRIDE' },
      ],
    },
  };
}

export function makeS2F50OverrideAck(recommendationId: string): SecsEvent {
  return {
    id: nextId('s2f50_override_ack'),
    type: 's2f50_override_ack',
    label: `S2F50 Override ACK (HCACK=1): ${recommendationId}`,
    timestamp: new Date(),
    secsMessage: {
      stream: 2, function: 50, hcack: 1,
      params: [{ cpname: 'RECOMMENDATION_ID', cpval: recommendationId }],
    },
  };
}

export function makeS6F11Notification(eventType: string, data: Record<string, unknown>): SecsEvent {
  return {
    id: nextId('s6f11_notification'),
    type: 's6f11_notification',
    label: `S6F11 Notification: ${eventType}`,
    timestamp: new Date(),
    secsMessage: {
      stream: 6, function: 11, ceid: 200,
      reports: [
        { rptid: 2001, parameter: 'eventType', value: eventType },
        ...Object.entries(data).map(([key, value]) => ({ rptid: 2002, parameter: key, value })),
      ],
    },
  };
}

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
