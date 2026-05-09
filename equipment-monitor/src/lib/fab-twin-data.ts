export type FabTwinView = 'overview' | 'operator' | 'maintenance' | 'pipe-rack' | 'control-room';

export type FabTwinFaultId =
  | 'nominal'
  | 'ffu-efficiency-loss'
  | 'pressure-reversal'
  | 'temperature-humidity-drift'
  | 'toxic-gas-alarm'
  | 'single-tool-down'
  | 'queue-congestion';

export type FabTwinMode = 'normal' | 'maintenance' | 'lot-transfer' | 'alarm';

export type Subsystem = 'power' | 'bas' | 'gas' | 'fire';

export type WarRoomLayer = Subsystem | 'process' | 'environment' | 'transport';

export interface FabTwinZone {
  id: string;
  path: string;
  label: string;
  className: string;
  pressurePa: number;
  area: 'bay' | 'chase' | 'subfab' | 'control room' | 'air shower' | 'utility room';
  positionM: [number, number, number];
  sizeM: [number, number, number];
  color: string;
  criticalZone?: boolean;
  particleRisk: 'low' | 'medium' | 'high';
  amcRisk: 'low' | 'medium' | 'high';
  microclimate?: {
    temperatureSetpointC: number;
    rhSetpointPct: number;
    maxTempDriftC: number;
    maxRhDriftPct: number;
  };
  vibrationClass: string;
  isolationType: string;
}

export interface FabTwinTool {
  tool_id: string;
  path: string;
  tool_type: 'lithography' | 'etch' | 'deposition' | 'metrology' | 'test';
  vendor: string;
  model: string;
  footprint_mm: [number, number];
  height_mm: number;
  service_clearance_mm: [number, number, number, number];
  util_kw: number;
  exhaust_flow: string;
  status_tags: string[];
  zoneId: string;
  positionM: [number, number, number];
  sizeM: [number, number, number];
  serviceSide: 'north' | 'south' | 'east' | 'west';
  operatorZoneM: [number, number, number];
  color: string;
  heroAsset?: boolean;
}

export interface FabTwinSensor {
  sensor_id: string;
  path: string;
  sensor_type:
    | 'temperature'
    | 'RH'
    | 'differential_pressure'
    | 'particle_count'
    | 'vibration'
    | 'power'
    | 'gas_detection';
  unit: string;
  range: [number, number];
  sampling_rate: string;
  alarm_hi: number;
  alarm_lo: number;
  zoneId: string;
  positionM: [number, number, number];
}

export interface FabTwinFaultScene {
  id: FabTwinFaultId;
  label: string;
  triggerSource: string;
  impactZone: string;
  recommendedAction: string;
  kpiDelta: {
    oee: number;
    uptime: number;
    alarmRate: number;
    energyIntensity: number;
    particleTrend: number;
    hvacLoad: number;
  };
}

export interface FabTwinKpiSchema {
  oee: { unit: '%'; value: number };
  uptime: { unit: '%'; value: number };
  alarmRate: { unit: 'alarms/hr'; value: number };
  energyIntensity: { unit: 'kWh/wafer'; value: number };
  particleTrend: { unit: '0.1um count/ft3'; value: number };
  hvacLoad: { unit: '%'; value: number };
}

export interface SubsystemGauge {
  label: string;
  value: number;
  unit: string;
  status: 'nominal' | 'warning' | 'alarm';
}

export interface SubsystemEquipment {
  id: string;
  subsystem: Subsystem;
  label: string;
  type: string;
  path: string;
  positionM: [number, number, number];
  sizeM: [number, number, number];
  color: string;
  status: 'nominal' | 'warning' | 'alarm';
  metric: string;
  value: string;
  gauges: SubsystemGauge[];
}

export const FAB_TWIN_UNITS = {
  sceneUnit: 'meter',
  engineeringUnit: 'millimeter',
  coordinateSystem: 'Y-up',
  exportFormats: ['USD', 'glTF', 'FBX + metadata JSON', '3D Tiles'],
  textureBudget: {
    background: '512-1024 px',
    heroAsset: '2048 px',
  },
} as const;

export const FAB_TWIN_ZONES: FabTwinZone[] = [
  {
    id: 'zone-bay-litho',
    path: '/FAB1/L1/BAY/LITHO',
    label: 'Lithography Bay',
    className: 'ISO 3 critical mini-environment',
    pressurePa: 18,
    area: 'bay',
    positionM: [-8, 0.05, -2],
    sizeM: [14, 0.08, 10],
    color: '#38bdf8',
    criticalZone: true,
    particleRisk: 'medium',
    amcRisk: 'medium',
    microclimate: { temperatureSetpointC: 21.0, rhSetpointPct: 42, maxTempDriftC: 0.1, maxRhDriftPct: 1.0 },
    vibrationClass: 'VC-E',
    isolationType: 'active air isolation plinth',
  },
  {
    id: 'zone-bay-etch-dep',
    path: '/FAB1/L1/BAY/ETCH_DEP',
    label: 'Etch / Deposition Bay',
    className: 'ISO 4 process bay',
    pressurePa: 14,
    area: 'bay',
    positionM: [8, 0.05, -2],
    sizeM: [14, 0.08, 10],
    color: '#22c55e',
    particleRisk: 'low',
    amcRisk: 'medium',
    vibrationClass: 'VC-D',
    isolationType: 'passive inertia base',
  },
  {
    id: 'zone-chase',
    path: '/FAB1/L1/CHASE/UTILITIES',
    label: 'Utility Chase',
    className: 'ISO 6 service chase',
    pressurePa: 8,
    area: 'chase',
    positionM: [0, 0.04, 6],
    sizeM: [30, 0.08, 4.2],
    color: '#f59e0b',
    particleRisk: 'low',
    amcRisk: 'high',
    vibrationClass: 'VC-C',
    isolationType: 'building slab',
  },
  {
    id: 'zone-subfab',
    path: '/FAB1/B1/SUBFAB/SCRUBBER_EXHAUST',
    label: 'Subfab Scrubber / Exhaust',
    className: 'service subfab',
    pressurePa: -5,
    area: 'subfab',
    positionM: [0, -2.7, -2],
    sizeM: [30, 0.12, 13],
    color: '#94a3b8',
    particleRisk: 'low',
    amcRisk: 'high',
    vibrationClass: 'VC-B',
    isolationType: 'service deck',
  },
  {
    id: 'zone-control',
    path: '/FAB1/L1/CONTROL_ROOM/MCC',
    label: 'Central Control Room',
    className: 'ISO 7 occupied control room',
    pressurePa: 10,
    area: 'control room',
    positionM: [-10, 0.05, -9],
    sizeM: [9, 0.08, 4],
    color: '#a78bfa',
    particleRisk: 'low',
    amcRisk: 'low',
    vibrationClass: 'office',
    isolationType: 'raised access floor',
  },
  {
    id: 'zone-air-shower',
    path: '/FAB1/L1/GOWNING/AIR_SHOWER',
    label: 'Gowning / Air Shower',
    className: 'ISO 5 transition',
    pressurePa: 12,
    area: 'air shower',
    positionM: [3, 0.05, -9],
    sizeM: [6, 0.08, 4],
    color: '#67e8f9',
    particleRisk: 'medium',
    amcRisk: 'low',
    vibrationClass: 'VC-A',
    isolationType: 'standard cleanroom slab',
  },
  {
    id: 'zone-utility',
    path: '/FAB1/L1/UTILITY_ROOM/POWER_HVAC',
    label: 'Power / HVAC Utility Room',
    className: 'service utility room',
    pressurePa: 2,
    area: 'utility room',
    positionM: [11, 0.05, -9],
    sizeM: [8, 0.08, 4],
    color: '#60a5fa',
    particleRisk: 'low',
    amcRisk: 'medium',
    vibrationClass: 'VC-B',
    isolationType: 'equipment slab',
  },
];

export const FAB_TWIN_TOOLS: FabTwinTool[] = [
  {
    tool_id: 'LITHO-SCN-01',
    path: '/FAB1/L1/BAY/LITHO/TOOLS/LITHO-SCN-01',
    tool_type: 'lithography',
    vendor: 'ASML-like synthetic',
    model: 'NXE-class scanner hero asset',
    footprint_mm: [12400, 5200],
    height_mm: 3400,
    service_clearance_mm: [1800, 2400, 1600, 1200],
    util_kw: 450,
    exhaust_flow: '3200 m3/h local exhaust + lens purge',
    status_tags: ['processing', 'E84 carrier present', 'overlay critical', 'microclimate tight'],
    zoneId: 'zone-bay-litho',
    positionM: [-9.8, 0.15, -2.4],
    sizeM: [5.2, 2.9, 3.4],
    serviceSide: 'north',
    operatorZoneM: [4.8, 1.2, 1.6],
    color: '#38bdf8',
    heroAsset: true,
  },
  {
    tool_id: 'ETCH-ICP-02',
    path: '/FAB1/L1/BAY/ETCH_DEP/TOOLS/ETCH-ICP-02',
    tool_type: 'etch',
    vendor: 'Lam-like synthetic',
    model: 'ICP cluster etcher',
    footprint_mm: [7200, 4200],
    height_mm: 2600,
    service_clearance_mm: [1200, 1800, 1200, 1000],
    util_kw: 280,
    exhaust_flow: '2400 m3/h acid exhaust',
    status_tags: ['idle', 'recipe qualified', 'gas cabinet linked'],
    zoneId: 'zone-bay-etch-dep',
    positionM: [5.1, 0.15, -2.6],
    sizeM: [3.8, 2.2, 2.6],
    serviceSide: 'east',
    operatorZoneM: [3.8, 1.1, 1.4],
    color: '#22c55e',
  },
  {
    tool_id: 'DEP-ALD-03',
    path: '/FAB1/L1/BAY/ETCH_DEP/TOOLS/DEP-ALD-03',
    tool_type: 'deposition',
    vendor: 'Applied-like synthetic',
    model: 'ALD thin film cluster',
    footprint_mm: [6800, 3900],
    height_mm: 2500,
    service_clearance_mm: [1200, 1600, 1200, 1000],
    util_kw: 230,
    exhaust_flow: '2100 m3/h solvent exhaust',
    status_tags: ['processing', 'precursor heated', 'N2 purge stable'],
    zoneId: 'zone-bay-etch-dep',
    positionM: [10.4, 0.15, -2.8],
    sizeM: [3.6, 2.05, 2.5],
    serviceSide: 'west',
    operatorZoneM: [3.4, 1.1, 1.4],
    color: '#14b8a6',
  },
  {
    tool_id: 'MET-CDSEM-04',
    path: '/FAB1/L1/BAY/LITHO/TOOLS/MET-CDSEM-04',
    tool_type: 'metrology',
    vendor: 'KLA-like synthetic',
    model: 'CD-SEM metrology',
    footprint_mm: [3200, 2600],
    height_mm: 2200,
    service_clearance_mm: [900, 900, 900, 900],
    util_kw: 90,
    exhaust_flow: '450 m3/h heat exhaust',
    status_tags: ['sampling', 'SPC linked', 'queue normal'],
    zoneId: 'zone-bay-litho',
    positionM: [-3.2, 0.15, 0.8],
    sizeM: [2.2, 1.7, 2.2],
    serviceSide: 'south',
    operatorZoneM: [2.2, 1.0, 1.2],
    color: '#f59e0b',
  },
  {
    tool_id: 'TEST-WAT-05',
    path: '/FAB1/L1/BAY/ETCH_DEP/TOOLS/TEST-WAT-05',
    tool_type: 'test',
    vendor: 'Teradyne-like synthetic',
    model: 'wafer acceptance test cell',
    footprint_mm: [3600, 3000],
    height_mm: 2300,
    service_clearance_mm: [1000, 1000, 900, 900],
    util_kw: 110,
    exhaust_flow: '500 m3/h electronics exhaust',
    status_tags: ['standby', 'probe card loaded', 'MES ready'],
    zoneId: 'zone-bay-etch-dep',
    positionM: [11.4, 0.15, 1.0],
    sizeM: [2.4, 1.8, 2.3],
    serviceSide: 'south',
    operatorZoneM: [2.4, 1.0, 1.2],
    color: '#a78bfa',
  },
];

const SENSOR_TYPES: Array<FabTwinSensor['sensor_type']> = [
  'temperature',
  'RH',
  'differential_pressure',
  'particle_count',
  'vibration',
  'power',
  'gas_detection',
];

export const FAB_TWIN_SENSORS: FabTwinSensor[] = FAB_TWIN_ZONES.flatMap((zone, zoneIndex) =>
  SENSOR_TYPES.map((sensorType, sensorIndex) => {
    const sensorId = `SNS-${zone.id.replace('zone-', '').toUpperCase()}-${String(sensorIndex + 1).padStart(2, '0')}`;
    const xOffset = ((sensorIndex % 4) - 1.5) * 1.2;
    const zOffset = sensorIndex < 4 ? -zone.sizeM[2] / 4 : zone.sizeM[2] / 4;
    const alarm = sensorType === 'differential_pressure' ? [zone.pressurePa - 5, zone.pressurePa + 8] : sensorType === 'temperature' ? [18, 24] : sensorType === 'RH' ? [35, 50] : sensorType === 'particle_count' ? [0, zone.criticalZone ? 35 : 80] : sensorType === 'vibration' ? [0, zone.criticalZone ? 8 : 16] : sensorType === 'power' ? [0, 900] : [0, 25];
    return {
      sensor_id: sensorId,
      path: `${zone.path}/SENSORS/${sensorId}`,
      sensor_type: sensorType,
      unit: sensorType === 'temperature' ? 'degC' : sensorType === 'RH' ? '%RH' : sensorType === 'differential_pressure' ? 'Pa' : sensorType === 'particle_count' ? 'count/ft3' : sensorType === 'vibration' ? 'um/s' : sensorType === 'power' ? 'kW' : 'ppm',
      range: sensorType === 'temperature' ? [15, 30] : sensorType === 'RH' ? [20, 70] : sensorType === 'differential_pressure' ? [-20, 30] : sensorType === 'particle_count' ? [0, 200] : sensorType === 'vibration' ? [0, 50] : sensorType === 'power' ? [0, 1200] : [0, 100],
      sampling_rate: sensorType === 'vibration' ? '100 Hz' : sensorType === 'particle_count' ? '1 Hz' : '0.2 Hz',
      alarm_lo: alarm[0],
      alarm_hi: alarm[1],
      zoneId: zone.id,
      positionM: [zone.positionM[0] + xOffset, 1.65 + (zoneIndex % 2) * 0.35, zone.positionM[2] + zOffset],
    } satisfies FabTwinSensor;
  }),
);

export const FAB_TWIN_BASE_KPIS: FabTwinKpiSchema = {
  oee: { unit: '%', value: 86.2 },
  uptime: { unit: '%', value: 97.4 },
  alarmRate: { unit: 'alarms/hr', value: 0.8 },
  energyIntensity: { unit: 'kWh/wafer', value: 42.5 },
  particleTrend: { unit: '0.1um count/ft3', value: 18 },
  hvacLoad: { unit: '%', value: 72 },
};

export const SUBSYSTEM_META: Record<Subsystem, { label: string; shortLabel: string; color: string; accent: string; viewpoint: FabTwinView }> = {
  power: { label: 'Power Monitoring', shortLabel: 'PWR', color: '#3b82f6', accent: 'var(--sf-power-primary)', viewpoint: 'control-room' },
  bas: { label: 'Building Automation', shortLabel: 'BAS', color: '#10b981', accent: 'var(--sf-ba-primary)', viewpoint: 'pipe-rack' },
  gas: { label: 'Gas Detection', shortLabel: 'GAS', color: '#f59e0b', accent: 'var(--sf-gas-primary)', viewpoint: 'pipe-rack' },
  fire: { label: 'Fire Alarm', shortLabel: 'FIRE', color: '#ef4444', accent: 'var(--sf-fire-primary)', viewpoint: 'control-room' },
};

export const SUBSYSTEM_EQUIPMENT: SubsystemEquipment[] = [
  {
    id: 'PDU-A-01',
    subsystem: 'power',
    label: 'PDU A Main',
    type: 'power-distribution-panel',
    path: '/FAB1/L1/UTILITY_ROOM/POWER/PDU-A-01',
    positionM: [11, 1.25, -8.1],
    sizeM: [2.2, 2.4, 0.5],
    color: '#3b82f6',
    status: 'nominal',
    metric: 'Load',
    value: '68%',
    gauges: [
      { label: 'Load', value: 68, unit: '%', status: 'nominal' },
      { label: 'Voltage THD', value: 2.1, unit: '%', status: 'nominal' },
      { label: 'UPS Autonomy', value: 42, unit: 'min', status: 'nominal' },
    ],
  },
  {
    id: 'UPS-A',
    subsystem: 'power',
    label: 'UPS A Redundant Feed',
    type: 'ups-bank',
    path: '/FAB1/L1/UTILITY_ROOM/POWER/UPS-A',
    positionM: [13.2, 1.05, -8.2],
    sizeM: [1.4, 1.8, 0.8],
    color: '#60a5fa',
    status: 'nominal',
    metric: 'Battery',
    value: '92%',
    gauges: [
      { label: 'Battery', value: 92, unit: '%', status: 'nominal' },
      { label: 'Bypass Ready', value: 100, unit: '%', status: 'nominal' },
      { label: 'Temp', value: 27, unit: 'degC', status: 'nominal' },
    ],
  },
  {
    id: 'AHU-SUPPLY-01',
    subsystem: 'bas',
    label: 'AHU Supply Loop',
    type: 'air-handling-unit',
    path: '/FAB1/L1/UTILITY_ROOM/BAS/AHU-SUPPLY-01',
    positionM: [8.2, 3.9, -8.7],
    sizeM: [2.8, 0.7, 1.1],
    color: '#10b981',
    status: 'nominal',
    metric: 'Flow',
    value: '94k CMH',
    gauges: [
      { label: 'Airflow', value: 94, unit: 'kCMH', status: 'nominal' },
      { label: 'Delta P', value: 18, unit: 'Pa', status: 'nominal' },
      { label: 'HVAC Load', value: 72, unit: '%', status: 'nominal' },
    ],
  },
  {
    id: 'CHILLED-WATER-LOOP',
    subsystem: 'bas',
    label: 'Chilled Water Loop',
    type: 'utility-loop',
    path: '/FAB1/L1/CHASE/BAS/CHILLED-WATER-LOOP',
    positionM: [-3.8, 2.55, 6.4],
    sizeM: [5.6, 0.22, 0.22],
    color: '#34d399',
    status: 'nominal',
    metric: 'Supply',
    value: '7.1 degC',
    gauges: [
      { label: 'Supply', value: 7.1, unit: 'degC', status: 'nominal' },
      { label: 'Return', value: 12.4, unit: 'degC', status: 'nominal' },
      { label: 'Valve', value: 61, unit: '%', status: 'nominal' },
    ],
  },
  {
    id: 'GAS-CABINET-01',
    subsystem: 'gas',
    label: 'Specialty Gas Cabinet',
    type: 'gas-cabinet',
    path: '/FAB1/L1/CHASE/GAS/GAS-CABINET-01',
    positionM: [-10.8, 1.15, 7.6],
    sizeM: [1.2, 2.1, 0.8],
    color: '#f59e0b',
    status: 'nominal',
    metric: 'Cabinet ppm',
    value: '0.0',
    gauges: [
      { label: 'Cabinet ppm', value: 0, unit: 'ppm', status: 'nominal' },
      { label: 'Exhaust', value: 112, unit: '%', status: 'nominal' },
      { label: 'VMB Flow', value: 78, unit: '%', status: 'nominal' },
    ],
  },
  {
    id: 'SCRUBBER-SUBFAB-01',
    subsystem: 'gas',
    label: 'Subfab Scrubber',
    type: 'scrubber',
    path: '/FAB1/B1/SUBFAB/SCRUBBER/SCRUBBER-SUBFAB-01',
    positionM: [8, -1.05, 2.8],
    sizeM: [1.2, 3.2, 1.2],
    color: '#f97316',
    status: 'nominal',
    metric: 'Inlet flow',
    value: '18k m3/h',
    gauges: [
      { label: 'Inlet', value: 18, unit: 'kCMH', status: 'nominal' },
      { label: 'pH', value: 7.2, unit: '', status: 'nominal' },
      { label: 'Fan', value: 84, unit: '%', status: 'nominal' },
    ],
  },
  {
    id: 'FIRE-PANEL-MCC',
    subsystem: 'fire',
    label: 'MCC Fire Panel',
    type: 'fire-control-panel',
    path: '/FAB1/L1/CONTROL_ROOM/FIRE/FIRE-PANEL-MCC',
    positionM: [-12.8, 1.25, -8.7],
    sizeM: [1.4, 2.0, 0.36],
    color: '#ef4444',
    status: 'nominal',
    metric: 'Loops',
    value: '4 armed',
    gauges: [
      { label: 'Loops Armed', value: 4, unit: '/4', status: 'nominal' },
      { label: 'Panel Health', value: 99, unit: '%', status: 'nominal' },
      { label: 'Suppression', value: 100, unit: '%', status: 'nominal' },
    ],
  },
  {
    id: 'DETECTOR-LOOP-A',
    subsystem: 'fire',
    label: 'Ceiling Detector Loop A',
    type: 'detector-loop',
    path: '/FAB1/L1/CEILING/FIRE/DETECTOR-LOOP-A',
    positionM: [-5.5, 4.2, -5.6],
    sizeM: [7.6, 0.12, 0.12],
    color: '#f87171',
    status: 'nominal',
    metric: 'Detectors',
    value: '12 OK',
    gauges: [
      { label: 'Detectors', value: 12, unit: 'ok', status: 'nominal' },
      { label: 'Loop mA', value: 18, unit: 'mA', status: 'nominal' },
      { label: 'Water PSI', value: 132, unit: 'psi', status: 'nominal' },
    ],
  },
];

export const SUBSYSTEM_LAYERS: Record<string, WarRoomLayer[]> = {
  ...Object.fromEntries(FAB_TWIN_TOOLS.map((tool) => [tool.tool_id, ['process'] as WarRoomLayer[]])),
  ...Object.fromEntries(FAB_TWIN_SENSORS.map((sensor) => [sensor.sensor_id, [sensor.sensor_type === 'power' ? 'power' : sensor.sensor_type === 'gas_detection' ? 'gas' : sensor.sensor_type === 'differential_pressure' || sensor.sensor_type === 'temperature' || sensor.sensor_type === 'RH' || sensor.sensor_type === 'particle_count' ? 'bas' : 'environment'] as WarRoomLayer[]])),
  ...Object.fromEntries(SUBSYSTEM_EQUIPMENT.map((equipment) => [equipment.id, [equipment.subsystem] as WarRoomLayer[]])),
  'FFU-MASTER-LOD0': ['environment', 'bas'],
  'AMHS-RAIL-LOOP-01': ['transport'],
  'FOUP-CARRIER-A17': ['transport'],
  'PIPE-CW-SUPPLY-L2': ['bas'],
  'PIPE-CW-RETURN-L2': ['bas'],
  'PIPE-EXHAUST-L3': ['gas'],
  'PIPE-GAS-N2-L1': ['gas'],
  'PIPE-FIRE-L1': ['fire'],
  'REDUNDANT-POWER-PATH-A': ['power'],
  'SUPPLY-AIR-DOWNFLOW': ['bas'],
  'RETURN-AIR-CHASE': ['bas'],
  'FIRE-SUPPRESSION-RING': ['fire'],
};

export const FAB_TWIN_FAULT_SCENES: FabTwinFaultScene[] = [
  {
    id: 'nominal',
    label: 'Nominal Operations',
    triggerSource: 'No active fault',
    impactZone: 'All zones in pressure cascade',
    recommendedAction: 'Continue routine monitoring and lot dispatch.',
    kpiDelta: { oee: 0, uptime: 0, alarmRate: 0, energyIntensity: 0, particleTrend: 0, hvacLoad: 0 },
  },
  {
    id: 'ffu-efficiency-loss',
    label: 'HEPA / FFU Efficiency Loss',
    triggerSource: 'SNS-BAY-LITHO-04 particle counter trend + FFU current draw',
    impactZone: 'Lithography Bay critical zone and scanner load port',
    recommendedAction: 'Throttle lot starts, inspect FFU-ROW-A filters, raise bay make-up air verification ticket.',
    kpiDelta: { oee: -4.5, uptime: -1.2, alarmRate: 1.8, energyIntensity: 3.2, particleTrend: 42, hvacLoad: 9 },
  },
  {
    id: 'pressure-reversal',
    label: 'Pressure Cascade Reversal',
    triggerSource: 'Bay-to-chase differential pressure crossed -2 Pa for 90 seconds',
    impactZone: 'Air shower, lithography bay, utility chase boundary',
    recommendedAction: 'Close bay doors, verify exhaust damper position, command BAS pressure recovery scene.',
    kpiDelta: { oee: -6.8, uptime: -2.4, alarmRate: 2.4, energyIntensity: 1.8, particleTrend: 65, hvacLoad: 12 },
  },
  {
    id: 'temperature-humidity-drift',
    label: 'Local Temperature / RH Drift',
    triggerSource: 'Lithography microclimate exceeds +/-0.1 degC or +/-1% RH guard band',
    impactZone: 'Scanner lens bay, coat/develop track wait station',
    recommendedAction: 'Hold overlay-sensitive lots, check chilled water valve and local mini-environment controller.',
    kpiDelta: { oee: -3.2, uptime: -0.8, alarmRate: 1.1, energyIntensity: 2.1, particleTrend: 8, hvacLoad: 7 },
  },
  {
    id: 'toxic-gas-alarm',
    label: 'Specialty Gas Alarm',
    triggerSource: 'Chase VMB gas detector Cl2 high alarm',
    impactZone: 'Utility chase, etch tool gas box, subfab scrubber inlet',
    recommendedAction: 'Evacuate local area, isolate VMB branch, verify scrubber flow and EPO interlock state.',
    kpiDelta: { oee: -12.5, uptime: -4.8, alarmRate: 4.2, energyIntensity: 1.2, particleTrend: 5, hvacLoad: 4 },
  },
  {
    id: 'single-tool-down',
    label: 'Single Equipment Stop',
    triggerSource: 'ETCH-ICP-02 RF generator fault and chamber pressure abort',
    impactZone: 'Etch / deposition bay and upstream WIP queue',
    recommendedAction: 'Dispatch maintenance, reroute qualified lots to alternate chamber, preserve fault snapshot.',
    kpiDelta: { oee: -8.1, uptime: -3.5, alarmRate: 1.9, energyIntensity: 0.8, particleTrend: 0, hvacLoad: -1 },
  },
  {
    id: 'queue-congestion',
    label: 'Lot / Carrier Queue Congestion',
    triggerSource: 'AMHS carrier dwell exceeds 18 minutes at lithography handoff',
    impactZone: 'Lithography bay, metrology sampling loop, MES dispatch queue',
    recommendedAction: 'Rebalance dispatch priority, release metrology hold, open temporary buffer lane.',
    kpiDelta: { oee: -5.6, uptime: 0, alarmRate: 0.6, energyIntensity: 1.5, particleTrend: 2, hvacLoad: 0 },
  },
];

export function getFaultScene(id: FabTwinFaultId): FabTwinFaultScene {
  return FAB_TWIN_FAULT_SCENES.find((fault) => fault.id === id) ?? FAB_TWIN_FAULT_SCENES[0];
}

export function getKpisForFault(id: FabTwinFaultId): FabTwinKpiSchema {
  const fault = getFaultScene(id);
  return {
    oee: { unit: '%', value: FAB_TWIN_BASE_KPIS.oee.value + fault.kpiDelta.oee },
    uptime: { unit: '%', value: FAB_TWIN_BASE_KPIS.uptime.value + fault.kpiDelta.uptime },
    alarmRate: { unit: 'alarms/hr', value: FAB_TWIN_BASE_KPIS.alarmRate.value + fault.kpiDelta.alarmRate },
    energyIntensity: { unit: 'kWh/wafer', value: FAB_TWIN_BASE_KPIS.energyIntensity.value + fault.kpiDelta.energyIntensity },
    particleTrend: { unit: '0.1um count/ft3', value: FAB_TWIN_BASE_KPIS.particleTrend.value + fault.kpiDelta.particleTrend },
    hvacLoad: { unit: '%', value: FAB_TWIN_BASE_KPIS.hvacLoad.value + fault.kpiDelta.hvacLoad },
  };
}
