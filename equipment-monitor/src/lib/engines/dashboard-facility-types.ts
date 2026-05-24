// ---------------------------------------------------------------------------
// Dashboard Facility Subsystem Types & Definitions
// ---------------------------------------------------------------------------

/** Canonical subsystem identifiers */
export const SUBSYSTEM_IDS = ['ems', 'bas', 'gas', 'fire', 'power'] as const;

/** Union of subsystem identifiers */
export type SubsystemId = (typeof SUBSYSTEM_IDS)[number];

// ---------------------------------------------------------------------------
// Metric definitions
// ---------------------------------------------------------------------------

export interface MetricDef {
  key: string;
  label: string;
  unit: string;
  baseline: number;
  amplitude: number;
  frequency: number;
  precision: number;
  warnLo: number;
  warnHi: number;
}

export interface SubsystemDef {
  label: string;
  shortLabel: string;
  color: string;
  metrics: [MetricDef, MetricDef, MetricDef, MetricDef];
}

// ---------------------------------------------------------------------------
// Runtime snapshot types
// ---------------------------------------------------------------------------

export interface MetricSnapshot {
  key: string;
  value: number;
  status: MetricStatus;
}

export interface SubsystemSnapshot {
  id: SubsystemId;
  metrics: [MetricSnapshot, MetricSnapshot, MetricSnapshot, MetricSnapshot];
  status: MetricStatus;
}

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------

export type EventSeverity = 'info' | 'warning' | 'critical';
export type MetricStatus = 'normal' | 'warning' | 'critical';

export interface FacilityEvent {
  id: string;
  tick: number;
  timestamp: string;
  subsystem: SubsystemId;
  severity: EventSeverity;
  message: string;
}

export interface EventTemplate {
  msg: string;
  severity: EventSeverity;
}

// ---------------------------------------------------------------------------
// Subsystem definitions
// ---------------------------------------------------------------------------

export const SUBSYSTEM_DEFS: Record<SubsystemId, SubsystemDef> = {
  ems: {
    label: 'Environmental Monitoring',
    shortLabel: 'EMS',
    color: '#22d3ee',
    metrics: [
      { key: 'temp', label: 'Temp', unit: '\u00B0C', baseline: 22, amplitude: 1.2, frequency: 0.05, precision: 1, warnLo: 20, warnHi: 24 },
      { key: 'rh', label: 'RH', unit: '%', baseline: 45, amplitude: 5, frequency: 0.03, precision: 1, warnLo: 38, warnHi: 52 },
      { key: 'particles', label: 'Particles', unit: '/m\u00B3', baseline: 800, amplitude: 600, frequency: 0.07, precision: 0, warnLo: 0, warnHi: 1500 },
      { key: 'dp', label: '\u0394P', unit: 'Pa', baseline: 12.5, amplitude: 3, frequency: 0.04, precision: 1, warnLo: 8, warnHi: 18 },
    ],
  },
  bas: {
    label: 'Building Automation',
    shortLabel: 'BAS',
    color: '#a78bfa',
    metrics: [
      { key: 'hvac', label: 'HVAC', unit: '%', baseline: 85, amplitude: 10, frequency: 0.02, precision: 0, warnLo: 70, warnHi: 100 },
      { key: 'chiller', label: 'Chiller', unit: '%', baseline: 72, amplitude: 15, frequency: 0.04, precision: 0, warnLo: 50, warnHi: 95 },
      { key: 'ahuFan', label: 'AHU Fan', unit: 'RPM', baseline: 1200, amplitude: 200, frequency: 0.06, precision: 0, warnLo: 900, warnHi: 1500 },
      { key: 'coolant', label: 'Coolant', unit: 'L/min', baseline: 42, amplitude: 8, frequency: 0.03, precision: 1, warnLo: 30, warnHi: 55 },
    ],
  },
  gas: {
    label: 'Gas Monitoring',
    shortLabel: 'GAS',
    color: '#fbbf24',
    metrics: [
      { key: 'nh3', label: 'NH\u2083', unit: 'ppm', baseline: 12, amplitude: 10, frequency: 0.05, precision: 1, warnLo: 0, warnHi: 25 },
      { key: 'cl2', label: 'Cl\u2082', unit: 'ppm', baseline: 0.8, amplitude: 1.5, frequency: 0.04, precision: 2, warnLo: 0, warnHi: 3 },
      { key: 'h2', label: 'H\u2082', unit: 'ppm', baseline: 5, amplitude: 8, frequency: 0.06, precision: 1, warnLo: 0, warnHi: 15 },
      { key: 'scrubber', label: 'Scrubber', unit: '%', baseline: 96, amplitude: 4, frequency: 0.02, precision: 1, warnLo: 90, warnHi: 100 },
    ],
  },
  fire: {
    label: 'Fire & Safety',
    shortLabel: 'FIRE',
    color: '#f43f5e',
    metrics: [
      { key: 'smoke', label: 'Smoke', unit: '%/m', baseline: 0.3, amplitude: 0.5, frequency: 0.08, precision: 2, warnLo: 0, warnHi: 1.0 },
      { key: 'sprinkler', label: 'Sprinkler', unit: 'zones', baseline: 12, amplitude: 0, frequency: 0, precision: 0, warnLo: 10, warnHi: 14 },
      { key: 'fm200', label: 'FM-200', unit: 'bar', baseline: 25, amplitude: 2, frequency: 0.01, precision: 1, warnLo: 22, warnHi: 28 },
      { key: 'evac', label: 'Evac', unit: 'status', baseline: 0, amplitude: 0, frequency: 0, precision: 0, warnLo: 0, warnHi: 1 },
    ],
  },
  power: {
    label: 'Power & Energy',
    shortLabel: 'PWR',
    color: '#4ade80',
    metrics: [
      { key: 'voltage', label: 'Voltage', unit: 'V', baseline: 480, amplitude: 8, frequency: 0.03, precision: 0, warnLo: 468, warnHi: 492 },
      { key: 'load', label: 'Load', unit: 'kW', baseline: 850, amplitude: 80, frequency: 0.05, precision: 0, warnLo: 700, warnHi: 1000 },
      { key: 'pf', label: 'PF', unit: '', baseline: 0.96, amplitude: 0.04, frequency: 0.02, precision: 2, warnLo: 0.90, warnHi: 1.0 },
      { key: 'upsSoc', label: 'UPS SoC', unit: '%', baseline: 94, amplitude: 6, frequency: 0.01, precision: 0, warnLo: 85, warnHi: 100 },
    ],
  },
};

// ---------------------------------------------------------------------------
// Event templates  (30 per subsystem, ~21 info / ~6 warning / ~3 critical)
// Placeholders: {zone}, {bay}, {val}
// ---------------------------------------------------------------------------

export const EMS_TEMPLATES: EventTemplate[] = [
  // info (21)
  { msg: 'Zone {zone} temperature nominal at {val}\u00B0C', severity: 'info' },
  { msg: 'Bay {bay} humidity within spec at {val}%', severity: 'info' },
  { msg: 'Particle count in zone {zone}: {val}/m\u00B3 (normal)', severity: 'info' },
  { msg: 'Differential pressure zone {zone} stable at {val} Pa', severity: 'info' },
  { msg: 'HEPA filter bank {bay} flow rate nominal', severity: 'info' },
  { msg: 'Environmental sensor calibration zone {zone} passed', severity: 'info' },
  { msg: 'Cleanroom class verified in bay {bay}: ISO 5', severity: 'info' },
  { msg: 'Temperature trend zone {zone} within \u00B10.5\u00B0C over 1h', severity: 'info' },
  { msg: 'RH sensor {bay} self-test OK', severity: 'info' },
  { msg: 'Airflow velocity bay {bay} nominal at {val} m/s', severity: 'info' },
  { msg: 'Zone {zone} makeup air damper at {val}%', severity: 'info' },
  { msg: 'Condensation check zone {zone}: clear', severity: 'info' },
  { msg: 'Bay {bay} recirculation fan running at {val} RPM', severity: 'info' },
  { msg: 'Dew point zone {zone} at {val}\u00B0C — safe margin', severity: 'info' },
  { msg: 'Particle sensor bay {bay} background count normal', severity: 'info' },
  { msg: 'Zone {zone} air exchange rate {val} ACH nominal', severity: 'info' },
  { msg: 'Bay {bay} ceiling plenum pressure balanced', severity: 'info' },
  { msg: 'Environmental log rotation for zone {zone} completed', severity: 'info' },
  { msg: 'Zone {zone} static pressure set-point verified', severity: 'info' },
  { msg: 'Bay {bay} gowning room DP at {val} Pa OK', severity: 'info' },
  { msg: 'Scheduled sensor sweep zone {zone} all nominal', severity: 'info' },
  // warning (6)
  { msg: 'Zone {zone} temperature drifting: {val}\u00B0C exceeds \u00B11\u00B0C band', severity: 'warning' },
  { msg: 'Bay {bay} humidity rising to {val}% — approaching limit', severity: 'warning' },
  { msg: 'Particle spike zone {zone}: {val}/m\u00B3 above threshold', severity: 'warning' },
  { msg: 'HEPA filter bay {bay} differential pressure high', severity: 'warning' },
  { msg: 'Zone {zone} DP dropping below {val} Pa set-point', severity: 'warning' },
  { msg: 'Temperature sensor bay {bay} reading intermittent', severity: 'warning' },
  // critical (3)
  { msg: 'CRITICAL: Zone {zone} temperature excursion — {val}\u00B0C out of spec', severity: 'critical' },
  { msg: 'CRITICAL: Particle count zone {zone} at {val}/m\u00B3 — cleanroom breach', severity: 'critical' },
  { msg: 'CRITICAL: Bay {bay} differential pressure lost — contamination risk', severity: 'critical' },
];

export const BAS_TEMPLATES: EventTemplate[] = [
  // info (21)
  { msg: 'HVAC unit {zone} operating at {val}% capacity', severity: 'info' },
  { msg: 'Chiller {bay} condenser temp nominal at {val}\u00B0C', severity: 'info' },
  { msg: 'AHU fan {zone} speed holding at {val} RPM', severity: 'info' },
  { msg: 'Coolant loop {bay} flow rate {val} L/min — steady', severity: 'info' },
  { msg: 'BAS controller heartbeat zone {zone} OK', severity: 'info' },
  { msg: 'Damper actuator {bay} position at {val}% — nominal', severity: 'info' },
  { msg: 'Chilled water supply temp {val}\u00B0C in range', severity: 'info' },
  { msg: 'Cooling tower {zone} fan running at design speed', severity: 'info' },
  { msg: 'Return air temp zone {zone} at {val}\u00B0C', severity: 'info' },
  { msg: 'BAS network latency zone {zone}: {val} ms (OK)', severity: 'info' },
  { msg: 'Economizer mode active for AHU {bay}', severity: 'info' },
  { msg: 'Variable speed drive {zone} output at {val} Hz', severity: 'info' },
  { msg: 'Hot water boiler {bay} standby temp {val}\u00B0C', severity: 'info' },
  { msg: 'Building pressure zone {zone} balanced at {val} Pa', severity: 'info' },
  { msg: 'AHU {bay} filter bank life remaining {val}%', severity: 'info' },
  { msg: 'Chiller {zone} oil pressure normal at {val} kPa', severity: 'info' },
  { msg: 'Coolant glycol concentration bay {bay}: {val}% OK', severity: 'info' },
  { msg: 'BAS schedule zone {zone} occupancy mode active', severity: 'info' },
  { msg: 'Fan coil unit bay {bay} operating normally', severity: 'info' },
  { msg: 'Chiller {zone} evaporator approach {val}\u00B0C nominal', severity: 'info' },
  { msg: 'AHU {bay} mixed air temp at {val}\u00B0C set-point', severity: 'info' },
  // warning (6)
  { msg: 'HVAC unit {zone} load rising to {val}% — nearing max', severity: 'warning' },
  { msg: 'Chiller {bay} discharge temp {val}\u00B0C above set-point', severity: 'warning' },
  { msg: 'AHU fan {zone} vibration level {val} mm/s elevated', severity: 'warning' },
  { msg: 'Coolant loop {bay} flow reduced to {val} L/min', severity: 'warning' },
  { msg: 'BAS zone {zone} sensor comm timeout ({val} retries)', severity: 'warning' },
  { msg: 'Damper actuator {bay} slow response — {val}s lag', severity: 'warning' },
  // critical (3)
  { msg: 'CRITICAL: Chiller {bay} tripped — compressor fault', severity: 'critical' },
  { msg: 'CRITICAL: AHU {zone} fan failure — airflow stopped', severity: 'critical' },
  { msg: 'CRITICAL: Coolant leak detected in bay {bay} — {val} L/min loss', severity: 'critical' },
];

export const GAS_TEMPLATES: EventTemplate[] = [
  // info (21)
  { msg: 'NH\u2083 level zone {zone} at {val} ppm — within limits', severity: 'info' },
  { msg: 'Cl\u2082 detector bay {bay} reading {val} ppm — nominal', severity: 'info' },
  { msg: 'H\u2082 sensor zone {zone}: {val} ppm — safe', severity: 'info' },
  { msg: 'Scrubber {bay} efficiency at {val}% — operational', severity: 'info' },
  { msg: 'Gas cabinet {zone} leak check passed', severity: 'info' },
  { msg: 'Exhaust duct bay {bay} velocity {val} m/s nominal', severity: 'info' },
  { msg: 'Gas panel {zone} manifold pressure stable at {val} kPa', severity: 'info' },
  { msg: 'Toxic gas monitor zone {zone} self-test OK', severity: 'info' },
  { msg: 'SiH\u2084 supply bay {bay} cylinder at {val}% capacity', severity: 'info' },
  { msg: 'Gas detector calibration zone {zone} verified', severity: 'info' },
  { msg: 'Purge cycle zone {zone} completed in {val}s', severity: 'info' },
  { msg: 'N\u2082 purge panel {bay} flow at {val} SLPM — steady', severity: 'info' },
  { msg: 'VOC sensor bay {bay} reading {val} ppb — background', severity: 'info' },
  { msg: 'Gas interlock zone {zone} armed and healthy', severity: 'info' },
  { msg: 'Scrubber {zone} inlet temp at {val}\u00B0C — in range', severity: 'info' },
  { msg: 'Bulk gas yard NF\u2083 tank level {val}% — sufficient', severity: 'info' },
  { msg: 'Bay {bay} process exhaust fan running at {val} RPM', severity: 'info' },
  { msg: 'Gas monitoring network zone {zone} latency {val} ms OK', severity: 'info' },
  { msg: 'Cylinder change bay {bay} completed — new bottle at {val}%', severity: 'info' },
  { msg: 'Abatement system {zone} burn chamber temp {val}\u00B0C stable', severity: 'info' },
  { msg: 'Zone {zone} LEL reading {val}% — well below alarm', severity: 'info' },
  // warning (6)
  { msg: 'NH\u2083 rising in zone {zone}: {val} ppm approaching TWA', severity: 'warning' },
  { msg: 'Cl\u2082 detector bay {bay} elevated: {val} ppm above baseline', severity: 'warning' },
  { msg: 'H\u2082 buildup zone {zone}: {val} ppm — ventilation check needed', severity: 'warning' },
  { msg: 'Scrubber {bay} efficiency dropped to {val}% — media aging', severity: 'warning' },
  { msg: 'Gas cabinet {zone} minor leak indication at {val} sccm', severity: 'warning' },
  { msg: 'Exhaust duct bay {bay} velocity low: {val} m/s below spec', severity: 'warning' },
  // critical (3)
  { msg: 'CRITICAL: Cl\u2082 alarm zone {zone} — {val} ppm exceeds IDLH', severity: 'critical' },
  { msg: 'CRITICAL: H\u2082 explosive limit bay {bay} — {val}% LEL reached', severity: 'critical' },
  { msg: 'CRITICAL: Gas cabinet {zone} major leak — auto-shutdown engaged', severity: 'critical' },
];

export const FIRE_TEMPLATES: EventTemplate[] = [
  // info (21)
  { msg: 'Smoke detector zone {zone} status: clear ({val}%/m)', severity: 'info' },
  { msg: 'Sprinkler system bay {bay} pressure at {val} bar — OK', severity: 'info' },
  { msg: 'FM-200 tank {zone} pressure at {val} bar — nominal', severity: 'info' },
  { msg: 'Evacuation panel zone {zone} self-test passed', severity: 'info' },
  { msg: 'Fire alarm control panel heartbeat zone {zone} OK', severity: 'info' },
  { msg: 'Smoke detector bay {bay} sensitivity at {val}%/m — calibrated', severity: 'info' },
  { msg: 'Fire door zone {zone} magnetic hold OK', severity: 'info' },
  { msg: 'Extinguisher bay {bay} inspection tag current', severity: 'info' },
  { msg: 'Emergency lighting zone {zone} battery {val}% charged', severity: 'info' },
  { msg: 'Fire pump {bay} test run: {val} PSI discharge normal', severity: 'info' },
  { msg: 'Duct smoke detector zone {zone} clear — {val}%/m', severity: 'info' },
  { msg: 'Zone {zone} manual pull station cover intact', severity: 'info' },
  { msg: 'Bay {bay} heat detector nominal at {val}\u00B0C', severity: 'info' },
  { msg: 'Fire suppression nozzle check zone {zone} OK', severity: 'info' },
  { msg: 'Stairwell pressurization zone {zone} at {val} Pa', severity: 'info' },
  { msg: 'Fire riser bay {bay} flow switch armed', severity: 'info' },
  { msg: 'Zone {zone} beam detector alignment verified', severity: 'info' },
  { msg: 'Emergency voice/alarm zone {zone} speaker test OK', severity: 'info' },
  { msg: 'Fire hydrant bay {bay} flow test: {val} L/min adequate', severity: 'info' },
  { msg: 'Clean agent system {zone} room integrity test passed', severity: 'info' },
  { msg: 'Zone {zone} fire watch patrol logged at {val}:00', severity: 'info' },
  // warning (6)
  { msg: 'Smoke detector zone {zone} obscuration rising: {val}%/m', severity: 'warning' },
  { msg: 'FM-200 tank {zone} pressure low: {val} bar — recharge needed', severity: 'warning' },
  { msg: 'Fire pump bay {bay} failed weekly start test', severity: 'warning' },
  { msg: 'Sprinkler zone {zone} pressure drop to {val} bar', severity: 'warning' },
  { msg: 'Emergency exit bay {bay} door ajar — seal compromised', severity: 'warning' },
  { msg: 'Fire alarm loop zone {zone} ground fault detected', severity: 'warning' },
  // critical (3)
  { msg: 'CRITICAL: Smoke alarm zone {zone} — {val}%/m exceeds threshold', severity: 'critical' },
  { msg: 'CRITICAL: FM-200 discharge zone {zone} — suppression activated', severity: 'critical' },
  { msg: 'CRITICAL: Fire detected bay {bay} — evacuation initiated', severity: 'critical' },
];

export const POWER_TEMPLATES: EventTemplate[] = [
  // info (21)
  { msg: 'Bus voltage zone {zone} at {val} V — nominal', severity: 'info' },
  { msg: 'Load center bay {bay} drawing {val} kW — normal', severity: 'info' },
  { msg: 'Power factor zone {zone}: {val} — in spec', severity: 'info' },
  { msg: 'UPS bay {bay} state-of-charge {val}% — healthy', severity: 'info' },
  { msg: 'PDU {zone} output balanced across phases', severity: 'info' },
  { msg: 'Generator {bay} block heater temp {val}\u00B0C OK', severity: 'info' },
  { msg: 'Transfer switch zone {zone} position: utility source', severity: 'info' },
  { msg: 'Transformer {bay} winding temp {val}\u00B0C — normal', severity: 'info' },
  { msg: 'Harmonic distortion zone {zone} THD at {val}% — acceptable', severity: 'info' },
  { msg: 'Battery string bay {bay} float voltage {val} V/cell OK', severity: 'info' },
  { msg: 'Main breaker zone {zone} amp reading {val} A — within rating', severity: 'info' },
  { msg: 'Energy meter zone {zone} daily consumption {val} kWh logged', severity: 'info' },
  { msg: 'Surge protector bay {bay} indicator: protected', severity: 'info' },
  { msg: 'Bus tie breaker zone {zone} sync check OK', severity: 'info' },
  { msg: 'Capacitor bank {bay} reactive power {val} kVAR — engaged', severity: 'info' },
  { msg: 'Ground fault monitor zone {zone}: {val} mA — safe', severity: 'info' },
  { msg: 'UPS fan bay {bay} running at {val} RPM — normal', severity: 'info' },
  { msg: 'Power quality zone {zone} sag count: {val} today', severity: 'info' },
  { msg: 'Generator {bay} fuel level {val}% — sufficient', severity: 'info' },
  { msg: 'Busbar temp zone {zone} at {val}\u00B0C — within limit', severity: 'info' },
  { msg: 'UPS {zone} bypass circuit test passed', severity: 'info' },
  // warning (6)
  { msg: 'Bus voltage zone {zone} sagging to {val} V — below nominal', severity: 'warning' },
  { msg: 'Load center bay {bay} at {val} kW — approaching capacity', severity: 'warning' },
  { msg: 'Power factor zone {zone} dropped to {val} — penalty risk', severity: 'warning' },
  { msg: 'UPS bay {bay} SoC declining: {val}% — monitor closely', severity: 'warning' },
  { msg: 'Generator {zone} failed auto-start test — retry scheduled', severity: 'warning' },
  { msg: 'Transformer {bay} winding temp {val}\u00B0C — elevated', severity: 'warning' },
  // critical (3)
  { msg: 'CRITICAL: Power outage zone {zone} — UPS active, {val} min remaining', severity: 'critical' },
  { msg: 'CRITICAL: UPS bay {bay} failure — load on bypass', severity: 'critical' },
  { msg: 'CRITICAL: Bus fault zone {zone} — breaker tripped at {val} A', severity: 'critical' },
];

/** All event templates grouped by subsystem */
export const ALL_TEMPLATES: Record<SubsystemId, EventTemplate[]> = {
  ems: EMS_TEMPLATES,
  bas: BAS_TEMPLATES,
  gas: GAS_TEMPLATES,
  fire: FIRE_TEMPLATES,
  power: POWER_TEMPLATES,
};

// ---------------------------------------------------------------------------
// Equipment status types & definitions
// ---------------------------------------------------------------------------

export interface EquipmentStatus {
  name: string;
  status: 'running' | 'maintenance' | 'fault';
  detail: string;
}

export interface EquipmentDef {
  name: string;
  runningDetails: string[];
  maintenanceDetails: string[];
  faultDetails: string[];
}

export const EQUIPMENT_DEFS: Record<SubsystemId, [EquipmentDef, EquipmentDef, EquipmentDef]> = {
  ems: [
    {
      name: 'HEPA Filter Bank',
      runningDetails: ['ΔP 11.2Pa', 'ΔP 12.0Pa', 'ΔP 10.8Pa', 'Flow 3200 CFM'],
      maintenanceDetails: ['Filter life 12%', 'Scheduled swap', 'ΔP high 18Pa'],
      faultDetails: ['ΔP exceeded limit', 'Fan overload'],
    },
    {
      name: 'Particle Monitor',
      runningDetails: ['Sampling OK', 'Count 450/m³', 'Count 620/m³', 'Self-test pass'],
      maintenanceDetails: ['Cal due 3 days', 'Sensor drift', 'Cal overdue'],
      faultDetails: ['Laser failure', 'Comm lost'],
    },
    {
      name: 'Makeup Air Damper',
      runningDetails: ['Auto 78%', 'Auto 82%', 'Auto 65%', 'Tracking setpoint'],
      maintenanceDetails: ['Actuator slow', 'Linkage wear', 'Response lag 4s'],
      faultDetails: ['Stuck closed', 'Actuator fault'],
    },
  ],
  bas: [
    {
      name: 'Chiller-1',
      runningDetails: ['COP 5.8', 'COP 6.1', 'Load 72%', 'Evap 6.2°C'],
      maintenanceDetails: ['Oil change due', 'Condenser fouled', 'Vibration elevated'],
      faultDetails: ['Compressor trip', 'Low refrigerant'],
    },
    {
      name: 'AHU-3',
      runningDetails: ['Fan 1420 RPM', 'Fan 1380 RPM', 'Supply 14°C', 'Filter OK'],
      maintenanceDetails: ['Filter ΔP high', 'Belt wear 80%', 'VFD alarm pending'],
      faultDetails: ['Fan failure', 'VFD fault'],
    },
    {
      name: 'Coolant Pump P-2',
      runningDetails: ['Flow 42 L/min', 'Flow 44 L/min', '1450 RPM', 'Pressure 3.2 bar'],
      maintenanceDetails: ['Seal drip', 'Bearing temp 68°C', 'Impeller cavitation'],
      faultDetails: ['Motor overload', 'No flow'],
    },
  ],
  gas: [
    {
      name: 'Scrubber',
      runningDetails: ['Eff 97.2%', 'Eff 96.8%', 'Inlet 320°C', 'Outlet clear'],
      maintenanceDetails: ['Media 15% life', 'Pressure drop high', 'Regen needed'],
      faultDetails: ['Bypass active', 'Heater fault'],
    },
    {
      name: 'Gas Cabinet A',
      runningDetails: ['Sealed OK', 'N₂ purge active', 'Pressure 45 kPa', 'Interlocks armed'],
      maintenanceDetails: ['Regulator drift', 'Valve cycle 90%', 'Leak test due'],
      faultDetails: ['Leak detected', 'Valve stuck'],
    },
    {
      name: 'VMB Valve Panel',
      runningDetails: ['All closed', 'Standby OK', 'Pneumatic 5.5 bar', 'Sensors online'],
      maintenanceDetails: ['Actuator slow V3', 'Position sensor drift', 'Cycle count high'],
      faultDetails: ['V2 open stuck', 'Pneumatic loss'],
    },
  ],
  fire: [
    {
      name: 'Fire Panel FP-1',
      runningDetails: ['All zones clear', 'Network OK', 'Battery 100%', 'Supervision OK'],
      maintenanceDetails: ['Loop fault zone C', 'Battery aging', 'Sounder test due'],
      faultDetails: ['Comm failure', 'Power fault'],
    },
    {
      name: 'FM-200 Zone A',
      runningDetails: ['Armed 25.1 bar', 'Armed 24.8 bar', 'Hold active', 'Integrity OK'],
      maintenanceDetails: ['Cylinder weight low', 'Nozzle inspect due', 'Door seal worn'],
      faultDetails: ['Pressure lost', 'Abort switch open'],
    },
    {
      name: 'VESDA Detector',
      runningDetails: ['Alert 0.02%/m', 'Sampling OK', 'Flow 3.2 L/min', 'Normal'],
      maintenanceDetails: ['Filter dirty', 'Pipe clean due', 'Sensitivity drift'],
      faultDetails: ['Aspirator fault', 'Chamber dirty'],
    },
  ],
  power: [
    {
      name: 'UPS Battery',
      runningDetails: ['SoC 96%', 'SoC 94%', 'Float 54.2V', 'Healthy'],
      maintenanceDetails: ['Cell imbalance', 'Capacity test due', 'Temp 32°C high'],
      faultDetails: ['String fault', 'Charger fail'],
    },
    {
      name: 'PDU-A',
      runningDetails: ['Load 78%', 'Load 82%', 'Balanced ±2%', 'Breakers OK'],
      maintenanceDetails: ['Phase C high', 'Thermal scan due', 'Branch near trip'],
      faultDetails: ['Breaker tripped', 'Overload'],
    },
    {
      name: 'Generator G-1',
      runningDetails: ['Standby OK', 'Fuel 88%', 'Block heater 42°C', 'Battery 12.8V'],
      maintenanceDetails: ['Fuel filter due', 'Coolant low', 'Test run failed'],
      faultDetails: ['Start failure', 'Oil pressure low'],
    },
  ],
};
