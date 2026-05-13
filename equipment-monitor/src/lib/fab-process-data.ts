export type ProcessId =
  | 'oxidation'
  | 'lithography'
  | 'etching'
  | 'deposition'
  | 'implant'
  | 'diffusion'
  | 'cmp'
  | 'metallization';

export type EquipmentStatus = 'running' | 'idle' | 'pm' | 'down';
export type KpiStatus = 'ok' | 'warning' | 'alarm';
export type WaferZone = 'center' | 'mid' | 'edge';

export interface ProcessEquipment {
  id: string;
  name: string;
  status: EquipmentStatus;
  currentRecipe: string | null;
  oee: number;
  wph: number;
}

export interface ProcessKpi {
  id: string;
  label: string;
  value: number;
  unit: string;
  lsl: number;
  usl: number;
  status: KpiStatus;
}

export interface ProcessAlarm {
  id: string;
  severity: 'warning' | 'critical';
  message: string;
  since: string;
}

export interface WaferSite {
  id: string;
  x: number;
  y: number;
  value: number;
  zone: WaferZone;
  dx?: number;
  dy?: number;
}

export interface ProcessTrendPoint {
  time: string;
  value: number;
  target: number;
  lcl: number;
  ucl: number;
}

export interface SecsGemEvent {
  id: string;
  timestamp: string;
  ceid: number;
  streamFunction: 'S6F11';
  description: string;
  dv: Record<string, string | number>;
}

export interface FabProcess {
  id: ProcessId;
  name: string;
  nameCN: string;
  shortName: string;
  color: string;
  order: number;
  position: [number, number, number];
  nominalOee: number;
  nominalWph: number;
  nominalYield: number;
  queueDepth: number;
  cycleTimeHours: number;
  equipment: ProcessEquipment[];
  kpis: ProcessKpi[];
  alarms: ProcessAlarm[];
  narrative: string;
}

export interface FabKpis {
  oee: number;
  wph: number;
  yield: number;
  cycleTime: number;
}

export const PROCESS_ORDER: ProcessId[] = [
  'oxidation',
  'lithography',
  'etching',
  'deposition',
  'implant',
  'diffusion',
  'cmp',
  'metallization',
];

export const PROCESS_COLORS: Record<ProcessId, string> = {
  oxidation: '#FF6B35',
  lithography: '#22D3EE',
  etching: '#A855F7',
  deposition: '#3B82F6',
  implant: '#F43F5E',
  diffusion: '#F59E0B',
  cmp: '#10B981',
  metallization: '#E2E8F0',
};

const BASE_PROCESSES: FabProcess[] = [
  {
    id: 'oxidation',
    name: 'Oxidation',
    nameCN: '氧化',
    shortName: 'OX',
    color: PROCESS_COLORS.oxidation,
    order: 1,
    position: [-15, 0, -7],
    nominalOee: 93.8,
    nominalWph: 34,
    nominalYield: 98.7,
    queueDepth: 18,
    cycleTimeHours: 7.8,
    narrative: 'Thermal growth furnaces control oxide thickness and uniformity before pattern transfer.',
    equipment: [
      { id: 'FUR-OX-01', name: 'Horizontal Furnace A', status: 'running', currentRecipe: 'OX-DRY-950C', oee: 94.2, wph: 12 },
      { id: 'FUR-OX-02', name: 'Wet Ox Furnace B', status: 'running', currentRecipe: 'OX-WET-1050C', oee: 92.8, wph: 11 },
      { id: 'MET-OX-01', name: 'Ellipsometer', status: 'idle', currentRecipe: null, oee: 89.3, wph: 11 },
    ],
    kpis: [
      { id: 'oxide-thickness', label: 'Oxide Thickness', value: 102.4, unit: 'nm', lsl: 95, usl: 110, status: 'ok' },
      { id: 'uniformity', label: 'Uniformity', value: 1.8, unit: '%', lsl: 0, usl: 3, status: 'ok' },
      { id: 'growth-rate', label: 'Growth Rate', value: 8.1, unit: 'nm/min', lsl: 6.5, usl: 9.5, status: 'ok' },
    ],
    alarms: [],
  },
  {
    id: 'lithography',
    name: 'Lithography',
    nameCN: '光刻',
    shortName: 'LITHO',
    color: PROCESS_COLORS.lithography,
    order: 2,
    position: [-5, 0, -7],
    nominalOee: 97.2,
    nominalWph: 42,
    nominalYield: 99.1,
    queueDepth: 24,
    cycleTimeHours: 5.2,
    narrative: 'Scanner, track, overlay, CD, focus, and dose loops align each mask layer to nanometer tolerances.',
    equipment: [
      { id: 'NXE-3800-01', name: 'NXE:3800E', status: 'running', currentRecipe: 'M2-193I-OPC', oee: 97.4, wph: 15 },
      { id: 'NXE-3600-02', name: 'NXE:3600D', status: 'pm', currentRecipe: 'PM-SCHEDULED', oee: 91.1, wph: 12 },
      { id: 'TRACK-8-01', name: 'Coater Developer Track', status: 'running', currentRecipe: 'CAR-7A', oee: 96.8, wph: 15 },
    ],
    kpis: [
      { id: 'overlay-3sigma', label: 'Overlay 3σ', value: 2.1, unit: 'nm', lsl: 0, usl: 3, status: 'ok' },
      { id: 'cdu', label: 'CDU', value: 2.4, unit: 'nm', lsl: 0, usl: 3, status: 'ok' },
      { id: 'dose-error', label: 'Dose Error', value: 0.3, unit: '%', lsl: -1, usl: 1, status: 'ok' },
      { id: 'focus-offset', label: 'Focus Offset', value: -8.5, unit: 'nm', lsl: -20, usl: 20, status: 'ok' },
    ],
    alarms: [],
  },
  {
    id: 'etching',
    name: 'Etching',
    nameCN: '蝕刻',
    shortName: 'ETCH',
    color: PROCESS_COLORS.etching,
    order: 3,
    position: [5, 0, -7],
    nominalOee: 91.6,
    nominalWph: 39,
    nominalYield: 98.4,
    queueDepth: 31,
    cycleTimeHours: 8.6,
    narrative: 'Plasma chambers transfer resist patterns into film stacks while holding profile angle and CD bias.',
    equipment: [
      { id: 'ETCH-ICP-01', name: 'ICP Poly Etcher', status: 'running', currentRecipe: 'POLY-GATE-45', oee: 92.3, wph: 14 },
      { id: 'ETCH-ICP-02', name: 'Dielectric Etcher', status: 'running', currentRecipe: 'VIA-LOWK-12', oee: 90.4, wph: 13 },
      { id: 'ASH-01', name: 'Resist Asher', status: 'idle', currentRecipe: null, oee: 88.7, wph: 12 },
    ],
    kpis: [
      { id: 'etch-rate', label: 'Etch Rate', value: 238, unit: 'nm/min', lsl: 220, usl: 255, status: 'ok' },
      { id: 'selectivity', label: 'Selectivity', value: 16.8, unit: ':1', lsl: 12, usl: 22, status: 'ok' },
      { id: 'cd-bias', label: 'CD Bias', value: -1.2, unit: 'nm', lsl: -3, usl: 3, status: 'ok' },
      { id: 'profile-angle', label: 'Profile Angle', value: 88.7, unit: 'deg', lsl: 87, usl: 90, status: 'ok' },
    ],
    alarms: [{ id: 'ETCH-WARN-01', severity: 'warning', message: 'Queue depth above 30 lots', since: '08:42' }],
  },
  {
    id: 'deposition',
    name: 'Thin Film Deposition',
    nameCN: '薄膜沉積',
    shortName: 'DEP',
    color: PROCESS_COLORS.deposition,
    order: 4,
    position: [15, 0, -7],
    nominalOee: 95.4,
    nominalWph: 37,
    nominalYield: 98.9,
    queueDepth: 21,
    cycleTimeHours: 6.1,
    narrative: 'CVD, ALD, and PVD chambers build conformal film stacks with stress and particle controls.',
    equipment: [
      { id: 'DEP-ALD-01', name: 'ALD Cluster', status: 'running', currentRecipe: 'HFO2-ALD-68', oee: 96.1, wph: 10 },
      { id: 'DEP-CVD-04', name: 'PECVD Twin', status: 'running', currentRecipe: 'SIN-PECVD-33', oee: 94.8, wph: 15 },
      { id: 'DEP-PVD-02', name: 'PVD Metal Seed', status: 'running', currentRecipe: 'TI-TIN-02', oee: 93.9, wph: 12 },
    ],
    kpis: [
      { id: 'film-thickness', label: 'Film Thickness', value: 54.6, unit: 'nm', lsl: 50, usl: 58, status: 'ok' },
      { id: 'stress', label: 'Film Stress', value: -118, unit: 'MPa', lsl: -180, usl: 60, status: 'ok' },
      { id: 'dep-rate', label: 'Dep Rate', value: 3.2, unit: 'nm/s', lsl: 2.6, usl: 3.9, status: 'ok' },
      { id: 'particle-count', label: 'Particles', value: 7, unit: 'adders', lsl: 0, usl: 12, status: 'warning' },
    ],
    alarms: [],
  },
  {
    id: 'implant',
    name: 'Ion Implantation',
    nameCN: '離子注入',
    shortName: 'IMP',
    color: PROCESS_COLORS.implant,
    order: 5,
    position: [15, 0, 7],
    nominalOee: 89.8,
    nominalWph: 31,
    nominalYield: 97.8,
    queueDepth: 36,
    cycleTimeHours: 10.4,
    narrative: 'High-energy ion beams set dopant profiles; queue pressure marks this station as today\'s bottleneck.',
    equipment: [
      { id: 'IMP-HC-01', name: 'High Current Implanter', status: 'running', currentRecipe: 'BF2-7DEG-22', oee: 90.2, wph: 11 },
      { id: 'IMP-HE-02', name: 'High Energy Implanter', status: 'down', currentRecipe: null, oee: 63.4, wph: 5 },
      { id: 'IMP-MC-03', name: 'Medium Current Implanter', status: 'running', currentRecipe: 'P31-LDD-09', oee: 91.8, wph: 15 },
    ],
    kpis: [
      { id: 'dose-uniformity', label: 'Dose Uniformity', value: 1.4, unit: '%', lsl: 0, usl: 2, status: 'warning' },
      { id: 'energy', label: 'Energy', value: 78.5, unit: 'keV', lsl: 76, usl: 81, status: 'ok' },
      { id: 'beam-current', label: 'Beam Current', value: 9.2, unit: 'mA', lsl: 8, usl: 12, status: 'ok' },
      { id: 'tilt-angle', label: 'Tilt Angle', value: 7.1, unit: 'deg', lsl: 6.8, usl: 7.2, status: 'ok' },
    ],
    alarms: [{ id: 'IMP-CRIT-02', severity: 'critical', message: 'High energy implanter beamline trip', since: '07:15' }],
  },
  {
    id: 'diffusion',
    name: 'Diffusion',
    nameCN: '擴散',
    shortName: 'DIFF',
    color: PROCESS_COLORS.diffusion,
    order: 6,
    position: [5, 0, 7],
    nominalOee: 94.1,
    nominalWph: 32,
    nominalYield: 98.2,
    queueDepth: 17,
    cycleTimeHours: 7.1,
    narrative: 'Anneal and drive-in steps tune junction depth and sheet resistance after implant.',
    equipment: [
      { id: 'RTP-01', name: 'Rapid Thermal Processor', status: 'running', currentRecipe: 'RTA-N2-1050', oee: 94.7, wph: 14 },
      { id: 'FUR-DIFF-02', name: 'Vertical Diffusion Furnace', status: 'running', currentRecipe: 'DRIVE-IN-B', oee: 93.5, wph: 10 },
      { id: 'MET-RS-01', name: 'Sheet Resistance Probe', status: 'idle', currentRecipe: null, oee: 89.9, wph: 8 },
    ],
    kpis: [
      { id: 'junction-depth', label: 'Junction Depth', value: 62.5, unit: 'nm', lsl: 58, usl: 68, status: 'ok' },
      { id: 'sheet-resistance', label: 'Sheet Resistance', value: 94.2, unit: 'ohm/sq', lsl: 88, usl: 102, status: 'ok' },
      { id: 'uniformity', label: 'Uniformity', value: 2.3, unit: '%', lsl: 0, usl: 4, status: 'ok' },
    ],
    alarms: [],
  },
  {
    id: 'cmp',
    name: 'CMP',
    nameCN: '化學機械研磨',
    shortName: 'CMP',
    color: PROCESS_COLORS.cmp,
    order: 7,
    position: [-5, 0, 7],
    nominalOee: 92.7,
    nominalWph: 44,
    nominalYield: 98.5,
    queueDepth: 20,
    cycleTimeHours: 4.9,
    narrative: 'Polish modules planarize dielectric and metal layers while limiting dishing and erosion.',
    equipment: [
      { id: 'CMP-OX-01', name: 'Oxide Polish Module', status: 'running', currentRecipe: 'ILD-CMP-41', oee: 93.1, wph: 16 },
      { id: 'CMP-CU-02', name: 'Copper Polish Module', status: 'running', currentRecipe: 'CU-DAM-17', oee: 92.3, wph: 15 },
      { id: 'CLEAN-CMP-01', name: 'Post-CMP Cleaner', status: 'running', currentRecipe: 'BRUSH-MEG', oee: 94.4, wph: 13 },
    ],
    kpis: [
      { id: 'removal-rate', label: 'Removal Rate', value: 364, unit: 'nm/min', lsl: 330, usl: 390, status: 'ok' },
      { id: 'wiwnu', label: 'WIWNU', value: 3.1, unit: '%', lsl: 0, usl: 5, status: 'ok' },
      { id: 'dishing', label: 'Dishing', value: 18, unit: 'nm', lsl: 0, usl: 28, status: 'ok' },
      { id: 'erosion', label: 'Erosion', value: 12, unit: 'nm', lsl: 0, usl: 22, status: 'ok' },
    ],
    alarms: [],
  },
  {
    id: 'metallization',
    name: 'Metallization',
    nameCN: '金屬化互連',
    shortName: 'MET',
    color: PROCESS_COLORS.metallization,
    order: 8,
    position: [-15, 0, 7],
    nominalOee: 93.5,
    nominalWph: 53,
    nominalYield: 98.6,
    queueDepth: 15,
    cycleTimeHours: 5.4,
    narrative: 'Barrier, seed, fill, and anneal modules form low-resistance interconnect stacks.',
    equipment: [
      { id: 'PVD-BAR-01', name: 'Barrier Sputter', status: 'running', currentRecipe: 'TA-TAN-M3', oee: 94.1, wph: 18 },
      { id: 'ECD-CU-02', name: 'Copper ECD', status: 'running', currentRecipe: 'CU-FILL-09', oee: 92.7, wph: 20 },
      { id: 'ANL-MET-01', name: 'Metal Anneal', status: 'running', currentRecipe: 'CU-ANNEAL-200C', oee: 93.6, wph: 15 },
    ],
    kpis: [
      { id: 'sheet-resistance', label: 'Sheet Resistance', value: 0.041, unit: 'ohm/sq', lsl: 0.032, usl: 0.052, status: 'ok' },
      { id: 'via-resistance', label: 'Via Resistance', value: 1.8, unit: 'ohm', lsl: 0, usl: 2.4, status: 'ok' },
      { id: 'step-coverage', label: 'Step Coverage', value: 82, unit: '%', lsl: 75, usl: 92, status: 'ok' },
    ],
    alarms: [],
  },
];

function round(value: number, digits = 1) {
  return Number(value.toFixed(digits));
}

function kpiStatus(value: number, lsl: number, usl: number): KpiStatus {
  if (value < lsl || value > usl) return 'alarm';
  const warningBand = (usl - lsl) * 0.18;
  return value < lsl + warningBand || value > usl - warningBand ? 'warning' : 'ok';
}

function cloneProcess(process: FabProcess): FabProcess {
  return {
    ...process,
    equipment: process.equipment.map((equipment) => ({ ...equipment })),
    kpis: process.kpis.map((kpi) => ({ ...kpi })),
    alarms: process.alarms.map((alarm) => ({ ...alarm })),
  };
}

export function createInitialProcesses(): FabProcess[] {
  return BASE_PROCESSES.map(cloneProcess);
}

export function calculateFabKpis(processes: FabProcess[]): FabKpis {
  const count = processes.length || 1;
  const wph = processes.reduce((sum, process) => sum + process.nominalWph, 0);
  return {
    oee: round(processes.reduce((sum, process) => sum + process.nominalOee, 0) / count, 1),
    wph,
    yield: round(processes.reduce((sum, process) => sum + process.nominalYield, 0) / count, 1),
    cycleTime: round(processes.reduce((sum, process) => sum + process.cycleTimeHours, 0) / 24, 1),
  };
}

export function simulateProcesses(processes: FabProcess[], now = Date.now()): FabProcess[] {
  return processes.map((process) => {
    const phase = Math.sin(now / 12000 + process.order * 0.8);
    const local = Math.cos(now / 9000 + process.order * 0.43);
    const nextOee = Math.max(82, Math.min(99.3, process.nominalOee + phase * 0.45));
    const nextWph = Math.max(0, Math.round(process.nominalWph + local * 1.5));
    return {
      ...process,
      nominalOee: round(nextOee, 1),
      nominalWph: nextWph,
      equipment: process.equipment.map((equipment, index) => ({
        ...equipment,
        oee: round(Math.max(60, Math.min(99.5, equipment.oee + Math.sin(now / 10000 + index + process.order) * 0.22)), 1),
        wph: Math.max(0, Math.round(equipment.wph + Math.cos(now / 11000 + index) * 0.6)),
      })),
      kpis: process.kpis.map((kpi, index) => {
        const span = Math.max(0.01, kpi.usl - kpi.lsl);
        const value = round(kpi.value + Math.sin(now / 15000 + index + process.order) * span * 0.004, kpi.unit === 'ohm/sq' ? 3 : 1);
        return { ...kpi, value, status: kpiStatus(value, kpi.lsl, kpi.usl) };
      }),
    };
  });
}

export function getProcessById(id: ProcessId, processes = BASE_PROCESSES) {
  return processes.find((process) => process.id === id);
}

export function getAdjacentProcess(id: ProcessId, direction: -1 | 1): ProcessId {
  const index = PROCESS_ORDER.indexOf(id);
  return PROCESS_ORDER[(index + direction + PROCESS_ORDER.length) % PROCESS_ORDER.length];
}

export function generateWaferSites(process: FabProcess, pointCount: 49 | 121 = 49): WaferSite[] {
  const grid = pointCount === 121 ? [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5] : [-3, -2, -1, 0, 1, 2, 3];
  const denominator = pointCount === 121 ? 5.4 : 3.45;
  const primary = process.kpis[0];
  const sites: WaferSite[] = [];
  for (const row of grid) {
    for (const col of grid) {
      const radius = Math.sqrt(row * row + col * col);
      if (radius > denominator) continue;
      const edge = radius / denominator;
      const swirl = Math.sin(row * 0.85 + process.order) + Math.cos(col * 0.68);
      const value = round(primary.value + swirl * (primary.usl - primary.lsl) * 0.035 + edge * (primary.usl - primary.lsl) * 0.04, primary.unit === 'ohm/sq' ? 3 : 1);
      sites.push({
        id: `${process.id}-${row}-${col}`,
        x: col / denominator,
        y: row / denominator,
        value,
        zone: edge > 0.72 ? 'edge' : edge > 0.36 ? 'mid' : 'center',
        dx: process.id === 'lithography' ? round(col * 0.16 + Math.sin(row) * 0.32, 2) : undefined,
        dy: process.id === 'lithography' ? round(row * -0.15 + Math.cos(col) * 0.28, 2) : undefined,
      });
    }
  }
  return sites;
}

export function generateProcessTrend(process: FabProcess, metric = process.kpis[0]): ProcessTrendPoint[] {
  return Array.from({ length: 36 }, (_, index) => {
    const drift = Math.sin(index / 4 + process.order) * (metric.usl - metric.lsl) * 0.04;
    const step = index > 26 && process.id === 'implant' ? (metric.usl - metric.lsl) * 0.04 : 0;
    return {
      time: `${String((index + 6) % 24).padStart(2, '0')}:00`,
      value: round(metric.value + drift + step, metric.unit === 'ohm/sq' ? 3 : 1),
      target: round((metric.lsl + metric.usl) / 2, metric.unit === 'ohm/sq' ? 3 : 1),
      lcl: metric.lsl,
      ucl: metric.usl,
    };
  });
}

export function generateFabThroughputTrend(processes = BASE_PROCESSES) {
  return Array.from({ length: 24 }, (_, hour) => {
    const point: { time: string } & Record<ProcessId, number> = {
      time: `${String(hour).padStart(2, '0')}:00`,
      oxidation: 0,
      lithography: 0,
      etching: 0,
      deposition: 0,
      implant: 0,
      diffusion: 0,
      cmp: 0,
      metallization: 0,
    };
    processes.forEach((process) => {
      point[process.id] = Math.max(0, round(process.nominalWph + Math.sin(hour / 3 + process.order) * 3, 0));
    });
    return point;
  });
}

export function generateSecsGemEvents(process: FabProcess): SecsGemEvent[] {
  return process.kpis.slice(0, 4).map((kpi, index) => ({
    id: `${process.id}-s6f11-${index + 1}`,
    timestamp: `${String(10 + index).padStart(2, '0')}:${String((index * 13 + process.order * 3) % 60).padStart(2, '0')}:12`,
    ceid: 6100 + process.order * 10 + index,
    streamFunction: 'S6F11',
    description: `${process.name} ${kpi.label} collection event`,
    dv: {
      PROCESS: process.shortName,
      LOT_ID: `L${6400 + process.order * 11 + index}`,
      KPI: kpi.label,
      VALUE: kpi.value,
      UNIT: kpi.unit,
      STATUS: kpi.status.toUpperCase(),
    },
  }));
}

export const INITIAL_PROCESSES = createInitialProcesses();
