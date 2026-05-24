import type { Lot, Recipe, SpcMeasurement, AiRecommendation, Equipment, Notification, YieldTrendPoint, DefectRecord, WaferDie, ProcessStepYield, HeatmapCell } from './mes-types';
import { SPC_PARAMETERS, SPC_PARAM_KEYS } from './spc-parameters';
import { generatePlaybackSeedMeasurements } from './spc-playback-data';

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
    source: 'process-optimization', confidenceHistory: [{ timestamp: new Date('2026-05-04T08:00:00'), confidence: 94 }],
  },
  {
    id: 'ai-rec-002', type: 'predictive-maintenance', title: 'LITHO-01 chiller efficiency declining',
    description: 'Chiller coolant temperature trending +0.8°C above baseline over last 48 hours. Predictive model forecasts 94% probability of thermal shutdown within 72 hours if unaddressed.',
    confidence: 89, impact: 'Prevents 4-6hr unplanned downtime | Risk: lens thermal drift',
    status: 'pending', createdAt: new Date('2026-05-04T10:00:00'),
    source: 'trend-drift', relatedParameter: 'cd', trendDirection: 'degrading',
    confidenceHistory: [{ timestamp: new Date('2026-05-04T10:00:00'), confidence: 89 }],
  },
  {
    id: 'ai-rec-003', type: 'production-optimization', title: 'Batch 5 lots on ETCH-05 to reduce queue time',
    description: 'Queue time at ETCH-05 exceeds 45min threshold. Batching LOT-2026-002 and LOT-2026-003 reduces total processing time by 22% based on historical throughput models.',
    confidence: 92, impact: 'Throughput increase: +22% | WIP reduction: 8 lots',
    status: 'pending', createdAt: new Date('2026-05-04T09:15:00'),
    source: 'process-optimization', confidenceHistory: [{ timestamp: new Date('2026-05-04T09:15:00'), confidence: 92 }],
  },
  {
    id: 'ai-rec-004', type: 'carbon-reduction', title: 'Solar peak at 14:00 — schedule energy-intensive steps',
    description: 'Solar generation forecast shows 98% capacity at 14:00-16:00. Shifting exposure and bake steps to this window reduces grid draw by 42%, saving 1.2 metric tons CO₂ equivalent.',
    confidence: 91, impact: 'CO₂ reduction: 1.2t | Grid cost savings: $1,800/day',
    status: 'pending', createdAt: new Date('2026-05-04T07:30:00'),
    source: 'process-optimization', confidenceHistory: [{ timestamp: new Date('2026-05-04T07:30:00'), confidence: 91 }],
  },
  {
    id: 'ai-rec-005', type: 'quality', title: 'CD uniformity degrading on LITHO-01 — adjust exposure dose',
    description: 'CDU trend shows +0.12nm drift per 50 wafers. Compensation model recommends exposure dose adjustment from 38 to 37.6 mJ/cm² to maintain within 3-sigma window.',
    confidence: 96, impact: 'Prevents CDU excursion | Maintains CpK > 1.33',
    status: 'pending', createdAt: new Date('2026-05-04T11:00:00'),
    source: 'trend-drift', relatedParameter: 'cdu', trendDirection: 'degrading',
    confidenceHistory: [{ timestamp: new Date('2026-05-04T11:00:00'), confidence: 96 }],
  },
  {
    id: 'ai-rec-006', type: 'scheduling', title: 'Optimize DEV-01 chemical refresh schedule',
    description: 'Developer concentration dropping 5% faster than baseline after LOT-2026-001. Recommend advancing chemical refresh by 3 hours to avoid pattern collapse risk on upcoming 5nm lots.',
    confidence: 87, impact: 'Eliminates 3% scrap risk on LOGIC-5NM | Refresh cost: $1,200',
    status: 'pending', createdAt: new Date('2026-05-04T06:45:00'),
    source: 'process-optimization', confidenceHistory: [{ timestamp: new Date('2026-05-04T06:45:00'), confidence: 87 }],
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

// Balanced deterministic offsets keep the initial baseline in control while
// still crossing both sides of the center line and +/-1 sigma.
const SEED_OFFSETS = [-1.2, -0.35, 0.85, 1.25, -0.75, 0.2, -1.1, 0.65, 1.1, -0.45];

const SEED_ANCHOR = new Date('2026-05-02T08:00:00').getTime();

export function generateSeedMeasurements(lotId: string, count: number): SpcMeasurement[] {
  if (count > 0) return generatePlaybackSeedMeasurements(lotId, count);

  return Array.from({ length: count }, (_, i) => {
    const waferNumber = i + 1;
    const base: Record<string, number> = {};
    SPC_PARAM_KEYS.forEach((param) => {
      const { target, sigma } = SPC_PARAMETERS[param];
      const paramPhase = SPC_PARAM_KEYS.indexOf(param) * 2;
      const offset = SEED_OFFSETS[(i + paramPhase) % SEED_OFFSETS.length];
      base[param] = target + offset * sigma;
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

// --- MES UI Reconstruction Generators ---

export function generateYieldTrend(days: number): YieldTrendPoint[] {
  const targetYield = 95;
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(SEED_ANCHOR + i * 86400000);
    const dateStr = date.toISOString().slice(0, 10);
    // Realistic yield trending toward target with slight noise (70-100%)
    const baseYield = 85 + (i / days) * 10;
    const noise = Math.sin(i * 1.3) * 2 + Math.cos(i * 0.7) * 1.5;
    const overallYield = Math.min(100, Math.max(70, baseYield + noise));
    return { date: dateStr, overallYield: Math.round(overallYield * 10) / 10, targetYield };
  });
}

export function generateDefectPareto(): DefectRecord[] {
  const defects = [
    { type: 'Particle', count: 142 },
    { type: 'Scratch', count: 87 },
    { type: 'CD Variation', count: 53 },
    { type: 'Pattern Collapse', count: 31 },
    { type: 'Residue', count: 19 },
  ];
  const total = defects.reduce((sum, d) => sum + d.count, 0);
  let cumulative = 0;
  return defects.map((d) => {
    cumulative += d.count;
    return { ...d, cumulativePercent: Math.round((cumulative / total) * 1000) / 10 };
  });
}

export function generateWaferMap(): WaferDie[] {
  const radius = 9; // ~250 dies in circular pattern
  const dies: WaferDie[] = [];
  for (let row = -radius; row <= radius; row++) {
    for (let col = -radius; col <= radius; col++) {
      if (row * row + col * col <= radius * radius) {
        // ~85% pass, ~8% fail, ~4% retest, ~3% not_tested
        const r = ((row * 31 + col * 17 + 7) % 100);
        let status: WaferDie['status'] = 'pass';
        if (r < 8) status = 'fail';
        else if (r < 12) status = 'retest';
        else if (r < 15) status = 'not_tested';
        dies.push({ row: row + radius, col: col + radius, status });
      }
    }
  }
  return dies;
}

export function generateProcessYields(): ProcessStepYield[] {
  const steps = [
    { name: 'COAT', baseYield: 98.2 },
    { name: 'EXPOSE', baseYield: 96.5 },
    { name: 'DEVELOP', baseYield: 97.1 },
    { name: 'METROLOGY', baseYield: 99.0 },
    { name: 'SPC', baseYield: 95.8 },
  ];
  return steps.map((s) => {
    const yieldVal = Math.round(s.baseYield * 10) / 10;
    let status: ProcessStepYield['status'] = 'running';
    if (yieldVal < 96) status = 'alarm';
    else if (yieldVal < 97) status = 'warning';
    return { name: s.name, yield: yieldVal, status };
  });
}

export function generateHeatmapData(): HeatmapCell[] {
  const lots = ['LOT-2026-001', 'LOT-2026-002', 'LOT-2026-003', 'LOT-2026-004', 'LOT-2026-005', 'LOT-2026-006'];
  const params = ['CD', 'CDU', 'OVL_X', 'OVL_Y'];
  const cells: HeatmapCell[] = [];
  for (const lot of lots) {
    for (const param of params) {
      const idx = lots.indexOf(lot) * params.length + params.indexOf(param);
      // Generate values around spec limits
      const base = 45 + (idx * 3.7) % 10;
      const value = Math.round(base * 100) / 100;
      let status: HeatmapCell['status'] = 'ok';
      if (value > 52 || value < 38) status = 'alarm';
      else if (value > 50 || value < 40) status = 'warning';
      cells.push({ lot, param, value, status });
    }
  }
  return cells;
}
