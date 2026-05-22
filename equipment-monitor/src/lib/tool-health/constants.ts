import type { FdcParam, FdcParamId } from './types';

export const FDC_PARAMS: Record<FdcParamId, FdcParam> = {
  pressure:    { id: 'pressure',    label: 'Chamber Pressure', unit: 'mTorr', setpoint: 150,  fdcUpper: 165,  fdcLower: 135 },
  rfPower:     { id: 'rfPower',     label: 'RF Power',         unit: 'W',     setpoint: 800,  fdcUpper: 880,  fdcLower: 720 },
  temperature: { id: 'temperature', label: 'Temperature',      unit: '\u00B0C',    setpoint: 450,  fdcUpper: 470,  fdcLower: 430 },
  gasFlow1:    { id: 'gasFlow1',    label: 'Gas Flow (main)',   unit: 'sccm',  setpoint: 200,  fdcUpper: 220,  fdcLower: 180 },
  gasFlow2:    { id: 'gasFlow2',    label: 'Gas Flow (purge)',  unit: 'sccm',  setpoint: 50,   fdcUpper: 58,   fdcLower: 42 },
  biasVoltage: { id: 'biasVoltage', label: 'Bias Voltage',     unit: 'V',     setpoint: 300,  fdcUpper: 340,  fdcLower: 260 },
};

export const FDC_PARAM_IDS: FdcParamId[] = [
  'pressure', 'rfPower', 'temperature', 'gasFlow1', 'gasFlow2', 'biasVoltage',
];

export const FDC_TRACE_SAMPLES = 200;

export const WEIBULL_DEFAULTS: Record<string, { shape: number; scale: number; pmIntervalDays: number }> = {
  FUR:     { shape: 2.5, scale: 6000, pmIntervalDays: 60 },
  RTP:     { shape: 2.0, scale: 4000, pmIntervalDays: 45 },
  NXE:     { shape: 1.8, scale: 5000, pmIntervalDays: 30 },
  ETCH:    { shape: 2.2, scale: 3500, pmIntervalDays: 30 },
  DEP:     { shape: 2.0, scale: 4500, pmIntervalDays: 45 },
  IMP:     { shape: 1.5, scale: 3000, pmIntervalDays: 30 },
  CMP:     { shape: 2.3, scale: 4000, pmIntervalDays: 21 },
  PVD:     { shape: 2.1, scale: 4200, pmIntervalDays: 45 },
  ECD:     { shape: 1.9, scale: 3800, pmIntervalDays: 30 },
  ANL:     { shape: 2.4, scale: 5500, pmIntervalDays: 60 },
  MET:     { shape: 2.8, scale: 7000, pmIntervalDays: 90 },
  ASH:     { shape: 2.0, scale: 3200, pmIntervalDays: 30 },
  TRACK:   { shape: 2.1, scale: 4800, pmIntervalDays: 45 },
  CLEAN:   { shape: 2.2, scale: 3600, pmIntervalDays: 21 },
  DEFAULT: { shape: 2.0, scale: 4000, pmIntervalDays: 45 },
};

export const SURVIVAL_CURVE_POINTS = 50;

export const PERF_THRESHOLDS = {
  green: 85,
  amber: 70,
};

export const PM_THRESHOLDS = {
  green: 14,
  amber: 7,
};

export const ANOMALY_WINDOW = { start: 80, end: 120 } as const;
