import type { SecsEvent, SecsEventType, SpcParameter, SpcRule, NotificationType, NotificationSeverity } from './mes-types';

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
