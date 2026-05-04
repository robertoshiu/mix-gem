import type { Lot, Recipe, SpcMeasurement, AiRecommendation, Equipment, Notification } from './mes-types';
import { SPC_PARAMETERS, SPC_PARAM_KEYS } from './spc-parameters';

export const MOCK_RECIPES: Recipe[] = [
  { id: 'LITHO-193nm-v4',  name: 'LITHO-193nm-v4',  process: 'Lithography', chamber: 'LITHO01', exposure: 38, focus: 0 },
  { id: 'COAT-std-v2',     name: 'COAT-std-v2',     process: 'Coat',        chamber: 'COAT01',  exposure: 0,  focus: 0 },
  { id: 'DEV-alkaline-v1', name: 'DEV-alkaline-v1', process: 'Develop',     chamber: 'DEV01',   exposure: 0,  focus: 0 },
];

export const MOCK_LOTS: Lot[] = [
  { id: 'LOT-2026-001', product: 'LOGIC-7NM', recipeId: 'LITHO-193nm-v4',  waferCount: 25, status: 'in_process', startedAt: new Date('2026-05-02T08:00:00') },
  { id: 'LOT-2026-002', product: 'SRAM-7NM',  recipeId: 'COAT-std-v2',     waferCount: 25, status: 'pending',    startedAt: new Date('2026-05-02T10:00:00') },
  { id: 'LOT-2026-003', product: 'LOGIC-5NM', recipeId: 'DEV-alkaline-v1', waferCount: 25, status: 'pending',    startedAt: new Date('2026-05-02T12:00:00') },
];

export const MOCK_AI_RECOMMENDATIONS: AiRecommendation[] = [
  {
    id: 'ai-rec-001', type: 'energy', title: 'Shift CMP-03 maintenance to off-peak hours',
    description: 'CMP-03 currently scheduled at peak demand. Shifting to 02:00-04:00 reduces energy cost by 35% based on last 30 days pricing patterns.',
    confidence: 94, impact: 'Estimated savings: $4,200/week | Energy reduction: 18%',
    status: 'pending', createdAt: new Date('2026-05-04T08:00:00'),
  },
  {
    id: 'ai-rec-002', type: 'predictive-maintenance', title: 'LITHO-01 chiller efficiency declining',
    description: 'Chiller coolant temperature trending +0.8°C above baseline over last 48 hours. Predictive model forecasts 94% probability of thermal shutdown within 72 hours if unaddressed.',
    confidence: 89, impact: 'Prevents 4-6hr unplanned downtime | Risk: lens thermal drift',
    status: 'pending', createdAt: new Date('2026-05-04T10:00:00'),
  },
  {
    id: 'ai-rec-003', type: 'production-optimization', title: 'Batch 5 lots on ETCH-05 to reduce queue time',
    description: 'Queue time at ETCH-05 exceeds 45min threshold. Batching LOT-2026-002 and LOT-2026-003 reduces total processing time by 22% based on historical throughput models.',
    confidence: 92, impact: 'Throughput increase: +22% | WIP reduction: 8 lots',
    status: 'pending', createdAt: new Date('2026-05-04T09:15:00'),
  },
  {
    id: 'ai-rec-004', type: 'carbon-reduction', title: 'Solar peak at 14:00 — schedule energy-intensive steps',
    description: 'Solar generation forecast shows 98% capacity at 14:00-16:00. Shifting exposure and bake steps to this window reduces grid draw by 42%, saving 1.2 metric tons CO₂ equivalent.',
    confidence: 91, impact: 'CO₂ reduction: 1.2t | Grid cost savings: $1,800/day',
    status: 'pending', createdAt: new Date('2026-05-04T07:30:00'),
  },
  {
    id: 'ai-rec-005', type: 'quality', title: 'CD uniformity degrading on LITHO-01 — adjust exposure dose',
    description: 'CDU trend shows +0.12nm drift per 50 wafers. Compensation model recommends exposure dose adjustment from 38 to 37.6 mJ/cm² to maintain within 3-sigma window.',
    confidence: 96, impact: 'Prevents CDU excursion | Maintains CpK > 1.33',
    status: 'pending', createdAt: new Date('2026-05-04T11:00:00'),
  },
  {
    id: 'ai-rec-006', type: 'scheduling', title: 'Optimize DEV-01 chemical refresh schedule',
    description: 'Developer concentration dropping 5% faster than baseline after LOT-2026-001. Recommend advancing chemical refresh by 3 hours to avoid pattern collapse risk on upcoming 5nm lots.',
    confidence: 87, impact: 'Eliminates 3% scrap risk on LOGIC-5NM | Refresh cost: $1,200',
    status: 'pending', createdAt: new Date('2026-05-04T06:45:00'),
  },
];

export const MOCK_EQUIPMENT: Equipment[] = [
  { id: 'litho-01', name: 'LITHO-01', type: 'lithography', status: 'running', x: 0, y: 0, zone: 'Zone-A', powerKw: 285, recipe: 'LITHO-193nm-v4', currentWafer: 14, totalWafers: 25 },
  { id: 'litho-02', name: 'LITHO-02', type: 'lithography', status: 'idle', x: 1, y: 0, zone: 'Zone-A', powerKw: 12, recipe: '—', currentWafer: 0, totalWafers: 0 },
  { id: 'coat-01', name: 'COAT-01', type: 'coater', status: 'running', x: 0, y: 1, zone: 'Zone-B', powerKw: 145, recipe: 'COAT-std-v2', currentWafer: 22, totalWafers: 25 },
  { id: 'coat-02', name: 'COAT-02', type: 'coater', status: 'down', x: 1, y: 1, zone: 'Zone-B', powerKw: 0, recipe: 'COAT-std-v2', currentWafer: 0, totalWafers: 0 },
  { id: 'dev-01', name: 'DEV-01', type: 'developer', status: 'running', x: 0, y: 2, zone: 'Zone-C', powerKw: 98, recipe: 'DEV-alkaline-v1', currentWafer: 18, totalWafers: 25 },
  { id: 'dev-02', name: 'DEV-02', type: 'developer', status: 'idle', x: 1, y: 2, zone: 'Zone-C', powerKw: 8, recipe: '—', currentWafer: 0, totalWafers: 0 },
  { id: 'metro-01', name: 'METRO-01', type: 'metrology', status: 'running', x: 0, y: 3, zone: 'Zone-D', powerKw: 52, recipe: 'METRO-std-v1', currentWafer: 14, totalWafers: 25 },
  { id: 'cmp-01', name: 'CMP-01', type: 'cmp', status: 'running', x: 1, y: 3, zone: 'Zone-D', powerKw: 210, recipe: 'CMP-std-v1', currentWafer: 20, totalWafers: 25 },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'notif-001', type: 'equipment_state', severity: 'info', title: 'LITHO-01 Processing Started', message: 'Lot LOT-2026-001 started processing on LITHO-01 at 08:00', timestamp: new Date('2026-05-04T08:00:00'), read: false },
  { id: 'notif-002', type: 'lot_status', severity: 'warning', title: 'LOT-2026-002 Queue Time Warning', message: 'LOT-2026-002 has been queued for 45+ minutes exceeding threshold', timestamp: new Date('2026-05-04T09:45:00'), read: false },
  { id: 'notif-003', type: 'violation', severity: 'critical', title: 'SPC Violation Detected', message: 'Rule 1 violation on CD parameter: value 49.1nm exceeds UCL 48.0nm on wafer 15', timestamp: new Date('2026-05-04T10:30:00'), read: false },
  { id: 'notif-004', type: 'recipe', severity: 'info', title: 'Recipe Pushed to LITHO-01', message: 'Recipe LITHO-193nm-v4 successfully pushed to LITHO-01 via S2F49', timestamp: new Date('2026-05-04T08:05:00'), read: true },
  { id: 'notif-005', type: 'system', severity: 'warning', title: 'COAT-02 Equipment Down', message: 'COAT-02 reported DOWN status at 07:15. Maintenance ticket #MT-2847 created.', timestamp: new Date('2026-05-04T07:15:00'), read: false },
];

// Deterministic pseudo-noise using a string hash — NOT Math.random()
// Returns a value in [-1.5, 1.5]
function stableNoise(lotId: string, wafer: number, param: string): number {
  const str = `${lotId}:${wafer}:${param}`;
  let hash = 2166136261; // FNV-1a offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0; // FNV prime, keep 32-bit unsigned
  }
  // Normalize to [-1.5, 1.5]
  const t = (hash / 0xffffffff);
  return (t - 0.5) * 3;
}

const SEED_ANCHOR = new Date('2026-05-02T08:00:00').getTime();

export function generateSeedMeasurements(lotId: string, count: number): SpcMeasurement[] {
  return Array.from({ length: count }, (_, i) => {
    const waferNumber = i + 1;
    const base: Record<string, number> = {};
    SPC_PARAM_KEYS.forEach((param) => {
      const { target, sigma } = SPC_PARAMETERS[param];
      base[param] = target + stableNoise(lotId, waferNumber, param) * sigma * 0.6;
    });

    return {
      id: `${lotId}-w${waferNumber}`,
      lotId,
      waferNumber,
      timestamp: new Date(SEED_ANCHOR + waferNumber * 2000),
      cd:    base.cd,
      cdu:   base.cdu,
      ovl_x: base.ovl_x,
      ovl_y: base.ovl_y,
      ler:   base.ler,
    };
  });
}
