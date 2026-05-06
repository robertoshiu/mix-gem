/**
 * War Room Mock Data Generators
 * Realistic industrial subsystem simulation with fluctuation and probabilistic alarms.
 */

import type {
  SubsystemZoneType,
  PowerSubsystemData,
  BuildingAutoSubsystemData,
  GasDetectionSubsystemData,
  FireAlarmSubsystemData,
  WarRoomState,
  AlarmEntry,
} from './war-room-types';

// Seed for deterministic baseline values (stable across calls)
const BASE_SEED = new Date('2026-05-05T00:00:00').getTime();

/** Returns ±2% fluctuation factor */
function fluctuate(base: number): number {
  const noise = ((Math.sin(BASE_SEED + Date.now() * 0.001) * 0.5 + 0.5) * 0.04) - 0.02;
  return base * (1 + noise);
}

/** Returns ±1% fluctuation factor for gentler variation */
function fluctuateSmall(base: number): number {
  const noise = ((Math.sin(BASE_SEED + Date.now() * 0.002) * 0.5 + 0.5) * 0.02) - 0.01;
  return base * (1 + noise);
}

/** Generate probabilistic alarm with 5% chance */
function maybeAlarm(message: string, severity: AlarmEntry['severity'] = 'warning'): AlarmEntry | null {
  if (Math.random() < 0.05) {
    return { message, severity, timestamp: new Date() };
  }
  return null;
}

/** Randomly pick one item from array */
function randomPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------------------------------------------------------------------
// Power Subsystem Generator
// ---------------------------------------------------------------------------

export function generatePowerSubsystemData(): PowerSubsystemData {
  const alarms: AlarmEntry[] = [];

  const baseVoltage = fluctuate(230);            // 220-240V typical
  const baseCurrent = fluctuate(85);             // ~85A under load
  const basePowerFactor = fluctuateSmall(0.92);  // ~0.92 typical
  const activePower = baseVoltage * baseCurrent * basePowerFactor / 1000; // kW
  const reactivePower = Math.sqrt((activePower / basePowerFactor) ** 2 - activePower ** 2); // kVAr

  // Probabilistic alarms
  const voltageAlarm = maybeAlarm('Voltage deviation detected: ' + baseVoltage.toFixed(1) + 'V outside normal range', 'warning');
  if (voltageAlarm) alarms.push(voltageAlarm);

  const transformerAlarm = maybeAlarm('Transformer T1 thermal warning: temperature exceed 85°C threshold', 'critical');
  if (transformerAlarm) alarms.push(transformerAlarm);

  const loadAlarm = maybeAlarm('Power load approaching 80% capacity', 'info');
  if (loadAlarm) alarms.push(loadAlarm);

  return {
    voltage: Math.round(baseVoltage * 10) / 10,
    current: Math.round(baseCurrent * 10) / 10,
    powerFactor: Math.round(basePowerFactor * 1000) / 1000,
    activePower: Math.round(activePower * 100) / 100,
    reactivePower: Math.round(reactivePower * 100) / 100,
    energyConsumption: Math.round(fluctuate(12450) * 10) / 10, // kWh
    loadPercentage: Math.round(fluctuateSmall(62) * 10) / 10,
    transformer1Status: Math.random() < 0.98 ? 'online' : (Math.random() < 0.5 ? 'alarm' : 'offline'),
    transformer2Status: Math.random() < 0.98 ? 'online' : (Math.random() < 0.5 ? 'alarm' : 'offline'),
    alarms,
  };
}

// ---------------------------------------------------------------------------
// Building Automation Subsystem Generator
// ---------------------------------------------------------------------------

const HVAC_ZONES = [
  { id: 'hvac-01', name: 'Zone A - Production Floor' },
  { id: 'hvac-02', name: 'Zone B - Clean Room' },
  { id: 'hvac-03', name: 'Zone C - Storage' },
  { id: 'hvac-04', name: 'Zone D - Office Area' },
];

const LIGHTING_AREAS = [
  { id: 'light-01', area: 'Production Floor Main' },
  { id: 'light-02', area: 'Clean Room A' },
  { id: 'light-03', area: 'Corridor Zone 1-4' },
  { id: 'light-04', area: 'Loading Bay' },
  { id: 'light-05', area: 'Utility Room' },
];

const ELEVATOR_IDS = ['elev-a', 'elev-b', 'elev-c'];

const ELEVATOR_STATUSES = ['operational', 'maintenance', 'out_of_service'] as const;

export function generateBuildingAutoSubsystemData(): BuildingAutoSubsystemData {
  const alarms: AlarmEntry[] = [];

  const hvacZones = HVAC_ZONES.map((z) => {
    const baseTemp = fluctuateSmall(randomPick([20, 21, 22, 23, 24]));
    return {
      id: z.id,
      name: z.name,
      temperature: Math.round(baseTemp * 10) / 10,
      humidity: Math.round(fluctuateSmall(randomPick([45, 50, 55, 60])) * 10) / 10,
      setpoint: randomPick([20, 21, 22, 23]),
      mode: randomPick(['heating', 'cooling', 'auto'] as const),
    };
  });

  const lightingGroups = LIGHTING_AREAS.map((l) => ({
    id: l.id,
    area: l.area,
    brightnessPercent: Math.round(fluctuate(randomPick([80, 85, 90, 95, 100]))),
    schedule: randomPick(['06:00-22:00', '07:00-21:00', '00:00-24:00', '08:00-18:00']),
  }));

  const elevators = ELEVATOR_IDS.map((id) => ({
    id,
    status: randomPick(ELEVATOR_STATUSES),
    currentFloor: Math.floor(Math.random() * 6) + 1,
  }));

  // Probabilistic alarms
  const tempAlarm = maybeAlarm('HVAC Zone B temperature exceeds setpoint by 2°C', 'warning');
  if (tempAlarm) alarms.push(tempAlarm);

  const humidityAlarm = maybeAlarm('Humidity alert: Zone A clean room at 58% RH (threshold: 55%)', 'warning');
  if (humidityAlarm) alarms.push(humidityAlarm);

  const elevatorAlarm = maybeAlarm('Elevator C requires scheduled maintenance (overdue 3 days)', 'info');
  if (elevatorAlarm) alarms.push(elevatorAlarm);

  return { hvacZones, lightingGroups, elevators, alarms };
}

// ---------------------------------------------------------------------------
// Gas Detection Subsystem Generator
// ---------------------------------------------------------------------------

const GAS_SENSOR_CONFIG: Array<{
  id: string;
  gasType: 'O2' | 'H2' | 'NH3' | 'CO' | 'Cl2' | 'H2S';
  unit: 'ppm' | '%';
  baseline: number;
  lowAlarm: number;
  highAlarm: number;
}> = [
  { id: 'gas-01', gasType: 'O2', unit: '%', baseline: 20.9, lowAlarm: 19.5, highAlarm: 23.5 },
  { id: 'gas-02', gasType: 'O2', unit: '%', baseline: 20.8, lowAlarm: 19.5, highAlarm: 23.5 },
  { id: 'gas-03', gasType: 'CO', unit: 'ppm', baseline: 5, lowAlarm: 25, highAlarm: 50 },
  { id: 'gas-04', gasType: 'H2', unit: 'ppm', baseline: 8, lowAlarm: 100, highAlarm: 500 },
  { id: 'gas-05', gasType: 'NH3', unit: 'ppm', baseline: 2, lowAlarm: 25, highAlarm: 50 },
  { id: 'gas-06', gasType: 'H2S', unit: 'ppm', baseline: 0.5, lowAlarm: 5, highAlarm: 10 },
  { id: 'gas-07', gasType: 'Cl2', unit: 'ppm', baseline: 0.1, lowAlarm: 0.5, highAlarm: 1 },
  { id: 'gas-08', gasType: 'CO', unit: 'ppm', baseline: 3, lowAlarm: 25, highAlarm: 50 },
];

export function generateGasDetectionSubsystemData(): GasDetectionSubsystemData {
  const alarms: AlarmEntry[] = [];

  const sensors = GAS_SENSOR_CONFIG.map((cfg) => {
    // O2 oscillates slightly around baseline; others stay low unless alarm triggered
    let concentration: number;
    let status: 'normal' | 'alarm' | 'fault' = 'normal';

    if (cfg.gasType === 'O2') {
      concentration = fluctuateSmall(cfg.baseline);
      // 3% chance of O2 alarm (low oxygen)
      if (Math.random() < 0.03) {
        concentration = randomPick([19.2, 19.0, 18.8]);
        status = 'alarm';
      }
    } else {
      concentration = cfg.baseline;
      // 2% chance of fault per sensor
      if (Math.random() < 0.02) {
        status = 'fault';
        concentration = 0;
      }
      // 5% chance of alarm for hazardous gases
      if (Math.random() < 0.05) {
        status = 'alarm';
        concentration = cfg.highAlarm * randomPick([1.1, 1.2, 1.3]);
      }
    }

    return {
      id: cfg.id,
      gasType: cfg.gasType,
      concentration: Math.round(concentration * 100) / 100,
      unit: cfg.unit,
      lowAlarm: cfg.lowAlarm,
      highAlarm: cfg.highAlarm,
      status,
    };
  });

  // Probabilistic system alarms
  const multiAlarm = maybeAlarm('Multiple gas sensors showing elevated readings — investigate area Zone B', 'critical');
  if (multiAlarm) alarms.push(multiAlarm);

  const sensorFault = maybeAlarm('Gas sensor gas-06 (H2S) communication fault — check wiring', 'warning');
  if (sensorFault) alarms.push(sensorFault);

  return { sensors, alarms };
}

// ---------------------------------------------------------------------------
// Fire Alarm Subsystem Generator
// ---------------------------------------------------------------------------

const DETECTOR_ZONES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const DETECTOR_TYPES = ['smoke', 'heat', 'flame', 'manual'] as const;
const SUPPRESSION_TYPES = ['sprinkler', 'gas'] as const;

export function generateFireAlarmSubsystemData(): FireAlarmSubsystemData {
  const alarms: AlarmEntry[] = [];

  // Generate detectors (30 total, ~4 per zone)
  const detectors = Array.from({ length: 32 }, (_, i) => {
    const zone = DETECTOR_ZONES[i % DETECTOR_ZONES.length];
    const type = DETECTOR_TYPES[i % DETECTOR_TYPES.length];
    let status: 'normal' | 'alarm' | 'fault' = 'normal';

    // 2% chance of alarm per detector
    if (Math.random() < 0.02) {
      status = 'alarm';
    } else if (Math.random() < 0.01) {
      status = 'fault';
    }

    return {
      id: `det-${String(i + 1).padStart(3, '0')}`,
      type,
      zone: `Zone ${zone}`,
      status,
      lastTestDate: new Date(BASE_SEED + i * 86400000 * 7),
    };
  });

  // Suppression systems (4 zones)
  const suppressionSystems = Array.from({ length: 4 }, (_, i) => {
    const type = SUPPRESSION_TYPES[i % SUPPRESSION_TYPES.length];
    let status: 'armed' | 'discharged' | 'fault' = 'armed';

    // 1% chance of discharged, 1% fault
    if (Math.random() < 0.01) {
      status = Math.random() < 0.5 ? 'discharged' : 'fault';
    }

    return {
      id: `sup-${String(i + 1).padStart(2, '0')}`,
      type,
      status,
    };
  });

  // Evacuation zones
  const evacuationZones = DETECTOR_ZONES.map((zone, i) => ({
    zone: `Zone ${zone}`,
    occupancy: Math.floor(fluctuate(randomPick([50, 75, 100, 120, 80]))),
    status: (['normal', 'normal', 'normal', 'partial'] as const)[i % 4],
  }));

  // Probabilistic alarms
  const detectorAlarm = maybeAlarm('Fire detector det-007 Zone C triggered — possible smoke detection', 'critical');
  if (detectorAlarm) alarms.push(detectorAlarm);

  const suppressionAlarm = maybeAlarm('Suppression system sup-02 pressure slightly below optimal (85 PSI)', 'info');
  if (suppressionAlarm) alarms.push(suppressionAlarm);

  const zoneAlarm = maybeAlarm('Evacuation Zone F occupancy sensor offline — manual check required', 'warning');
  if (zoneAlarm) alarms.push(zoneAlarm);

  return { detectors, suppressionSystems, evacuationZones, alarms };
}

// ---------------------------------------------------------------------------
// Main Generator: WarRoomState
// ---------------------------------------------------------------------------

/**
 * Generates complete mock WarRoomState with all 4 subsystems.
 * Call repeatedly to simulate live data with ±2% fluctuation per call.
 */
export function generateMockWarRoomState(): WarRoomState {
  return {
    activeZone: null,
    overlayOpen: false,
    subsystemData: {
      power: generatePowerSubsystemData(),
      'building-auto': generateBuildingAutoSubsystemData(),
      gas: generateGasDetectionSubsystemData(),
      fire: generateFireAlarmSubsystemData(),
    },
    lastUpdated: new Date(),
  };
}

/**
 * Generates mock data for a specific subsystem zone.
 */
export function generateMockSubsystemData(zone: SubsystemZoneType) {
  switch (zone) {
    case 'power':
      return generatePowerSubsystemData();
    case 'building-auto':
      return generateBuildingAutoSubsystemData();
    case 'gas':
      return generateGasDetectionSubsystemData();
    case 'fire':
      return generateFireAlarmSubsystemData();
  }
}