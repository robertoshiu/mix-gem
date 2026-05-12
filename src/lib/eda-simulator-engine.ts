import {
  EDA_STAGE_DEFINITIONS,
  EDA_STAGE_ORDER,
  LOG_TEMPLATES,
  TECH_NODE_PRESETS,
  TECH_NODE_SCALE,
  createInitialMetrics,
} from './eda-mock-data';
import type {
  EdaStage,
  FaultType,
  LogEntry,
  LogLevel,
  MetricSample,
  PipelineRun,
  SimulatorConfig,
  SimulatorSpeed,
  StageMetrics,
  StageState,
  TechNode,
} from './eda-types';

const TICK_MS = 500;
const MAX_LOGS_PER_STAGE = 500;

function cloneRun(run: PipelineRun): PipelineRun {
  return {
    ...run,
    stages: run.stages.map((stage) => ({
      ...stage,
      metrics: { ...stage.metrics },
      logs: stage.logs.map((log) => ({ ...log })),
      artifacts: [...stage.artifacts],
      samples: stage.samples.map((sample) => ({ ...sample })),
    })),
  };
}

function createRng(seed: number) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function stageIndex(stage: EdaStage) {
  return EDA_STAGE_ORDER.indexOf(stage);
}

function initialRun(config: SimulatorConfig): PipelineRun {
  const now = Date.now();
  return {
    id: `EDA-${now}`,
    chipName: config.chipName,
    techNode: config.techNode,
    currentStage: null,
    elapsedMs: 0,
    tick: 0,
    running: false,
    speed: 1,
    stages: EDA_STAGE_ORDER.map((stage) => ({
      stage,
      status: 'queued',
      progress: 0,
      startedAt: null,
      metrics: createInitialMetrics(stage),
      logs: [],
      artifacts: [],
      samples: [],
      retries: 0,
    })),
  };
}

function primaryValue(metrics: StageMetrics) {
  switch (metrics.kind) {
    case 'rtl':
      return metrics.coverage;
    case 'synthesis':
      return metrics.power;
    case 'floorplan':
      return metrics.utilization;
    case 'place_route':
      return metrics.congestion;
    case 'cts':
      return metrics.clockSkew;
    case 'sta':
      return metrics.wns;
    case 'drc_lvs':
      return metrics.drcErrors;
    case 'tapeout':
      return metrics.metalFill;
  }
}

function metricForStage(stage: EdaStage, progress: number, techNode: TechNode, fault: FaultType | null, rng: () => number): StageMetrics {
  const p = progress / 100;
  const preset = TECH_NODE_PRESETS[techNode];
  const noise = 0.96 + rng() * 0.08;

  switch (stage) {
    case 'rtl':
      return {
        kind: 'rtl',
        lineCount: Math.round(148_000 * p * noise),
        moduleCount: Math.round(1240 * p * noise),
        lintWarnings: Math.max(0, Math.round(42 - 35 * p + rng() * 4)),
        coverage: round(Math.min(96.4, 62 + 34.4 * p + rng() * 1.4), 1),
      };
    case 'synthesis': {
      const powerMultiplier = fault === 'power_budget_exceeded' && progress > 42 ? 1.32 : 1;
      return {
        kind: 'synthesis',
        gateCount: Math.round(18_400_000 * preset.density * p * noise),
        area: round(52.5 / preset.density + 4 * p, 2),
        maxFreq: round(1.6 + 1.65 * p - (techNode === '3nm' ? 0.12 : 0), 2),
        power: round(preset.nominalPower * p * powerMultiplier * noise, 1),
        slack: round(-0.18 + 0.32 * p - (fault === 'power_budget_exceeded' ? 0.03 : 0), 3),
      };
    }
    case 'floorplan':
      return {
        kind: 'floorplan',
        dieArea: round((72 / preset.density) * (0.72 + 0.28 * p), 2),
        utilization: round(42 + 38 * p + rng() * 1.8, 1),
        macroCount: Math.round(24 * p),
        aspectRatio: round(0.92 + 0.1 * p, 2),
      };
    case 'place_route': {
      const hotspot = fault === 'congestion_hotspot' && progress > 35;
      return {
        kind: 'place_route',
        cellCount: Math.round(12_600_000 * preset.density * p * noise),
        routedNets: Math.round(4_800_000 * p * noise),
        wireLength: round(1860 * preset.density * p * noise, 1),
        congestion: round(Math.min(96, 18 + 58 * p + (hotspot ? 22 : 0) + rng() * 3), 1),
        drcViolations: Math.max(0, Math.round((hotspot ? 220 : 76) * Math.sin(p * Math.PI) + rng() * 12)),
      };
    }
    case 'cts':
      return {
        kind: 'cts',
        clockSkew: round(Math.max(18, 78 - 45 * p + rng() * 4), 1),
        bufferCount: Math.round(54_000 * preset.density * p * noise),
        insertionDelay: round(0.14 + 0.48 * p, 3),
        powerOverhead: round(18 + 84 * p * preset.density, 1),
      };
    case 'sta': {
      const failing = fault === 'timing_closure_fail' && progress > 45;
      const wns = failing ? -0.22 + 0.06 * p : -0.11 + 0.18 * p;
      return {
        kind: 'sta',
        wns: round(wns, 3),
        tns: round(failing ? -18.6 + 8 * p : -6.4 + 6.7 * p, 2),
        failingPaths: Math.max(0, Math.round((failing ? 880 : 180) * (1 - p) + (failing ? 42 : 0))),
        holdViolations: Math.max(0, Math.round(32 * (1 - p) + (failing ? 18 : 0))),
      };
    }
    case 'drc_lvs': {
      const storm = fault === 'drc_storm' && progress > 30;
      return {
        kind: 'drc_lvs',
        drcErrors: Math.max(0, Math.round((storm ? 620 : 126) * (1 - p * 0.72) + rng() * 8)),
        lvsMismatches: Math.max(0, Math.round((storm ? 19 : 7) * (1 - p))),
        antennaViolations: Math.max(0, Math.round((storm ? 88 : 16) * (1 - p * 0.68))),
        densityViolations: Math.max(0, Math.round((storm ? 54 : 12) * (1 - p * 0.75))),
      };
    }
    case 'tapeout':
      return {
        kind: 'tapeout',
        gdsSize: round((11.8 * preset.density) * p, 2),
        layerCount: Math.round(preset.layerCount * p),
        metalFill: round(38 + 36 * p + rng() * 1.2, 1),
        maskCount: Math.round(preset.maskCount * p),
      };
  }
}

function logLevel(stage: EdaStage, metrics: StageMetrics, fault: FaultType | null): LogLevel {
  if (fault === 'congestion_hotspot' && stage === 'place_route' && metrics.kind === 'place_route' && metrics.congestion > 85) return 'warning';
  if (fault === 'timing_closure_fail' && stage === 'sta' && metrics.kind === 'sta' && metrics.wns < 0) return 'error';
  if (fault === 'drc_storm' && stage === 'drc_lvs' && metrics.kind === 'drc_lvs' && metrics.drcErrors > 500) return 'error';
  if (fault === 'power_budget_exceeded' && stage === 'synthesis' && metrics.kind === 'synthesis' && metrics.power > 900) return 'warning';
  return 'info';
}

function logMessage(stage: EdaStage, metrics: StageMetrics, rng: () => number, level: LogLevel) {
  const templates = LOG_TEMPLATES[stage];
  const prefix = templates[Math.floor(rng() * templates.length)] ?? templates[0];
  const suffix = level === 'error' ? ' -- ECO action required' : level === 'warning' ? ' -- guard-band warning' : '';
  return `${prefix}; ${EDA_STAGE_DEFINITIONS[stage].primaryMetricLabel}=${primaryValue(metrics).toFixed(EDA_STAGE_DEFINITIONS[stage].primaryMetricUnit ? 1 : 0)}${EDA_STAGE_DEFINITIONS[stage].primaryMetricUnit}${suffix}`;
}

export class EdaSimulator {
  private config: SimulatorConfig;
  private run: PipelineRun;
  private callbacks = new Set<(state: PipelineRun) => void>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private rng: () => number;

  constructor(config: SimulatorConfig) {
    this.config = config;
    this.run = initialRun(config);
    this.rng = createRng(config.seed ?? 20260512);
  }

  getState(): PipelineRun {
    return cloneRun(this.run);
  }

  start(): void {
    if (this.timer) return;
    this.run.running = true;
    if (!this.run.currentStage) this.startStage(EDA_STAGE_ORDER[0]);
    this.emit();
    this.timer = setInterval(() => this.tick(), TICK_MS / this.run.speed);
  }

  pause(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.run.running = false;
    this.emit();
  }

  reset(): void {
    this.pause();
    this.run = initialRun(this.config);
    this.rng = createRng(this.config.seed ?? 20260512);
    this.emit();
  }

  setSpeed(multiplier: SimulatorSpeed): void {
    this.run.speed = multiplier;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = setInterval(() => this.tick(), TICK_MS / multiplier);
    }
    this.emit();
  }

  injectFault(fault: FaultType, stage: EdaStage): void {
    this.config = { ...this.config, fault: { type: fault, stage } };
    this.emit();
  }

  onTick(callback: (state: PipelineRun) => void): () => void {
    this.callbacks.add(callback);
    callback(this.getState());
    return () => this.callbacks.delete(callback);
  }

  dispose(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.callbacks.clear();
  }

  tick(): void {
    if (!this.run.currentStage) this.startStage(EDA_STAGE_ORDER[0]);
    const current = this.run.stages.find((stage) => stage.stage === this.run.currentStage);
    if (!current) return;

    const definition = EDA_STAGE_DEFINITIONS[current.stage];
    const scaledDuration = definition.baseTicks * TECH_NODE_SCALE[this.run.techNode];
    const increment = 100 / scaledDuration;
    current.progress = Math.min(100, current.progress + increment);
    this.run.elapsedMs += TICK_MS;
    this.run.tick += 1;

    const activeFault = this.config.fault?.stage === current.stage ? this.config.fault.type : null;
    current.metrics = metricForStage(current.stage, current.progress, this.run.techNode, activeFault, this.rng);
    current.samples = [...current.samples, this.createSample(current)].slice(-160);
    current.logs = [...current.logs, ...this.createLogs(current, activeFault)].slice(-MAX_LOGS_PER_STAGE);

    if (current.progress >= 100) this.completeStage(current, activeFault);
    this.emit();
  }

  private startStage(stage: EdaStage) {
    const current = this.run.stages.find((item) => item.stage === stage);
    if (!current) return;
    current.status = 'running';
    current.startedAt = Date.now();
    this.run.currentStage = stage;
    current.logs = [
      ...current.logs,
      {
        id: `${stage}-${this.run.tick}-start`,
        timestamp: Date.now(),
        stage,
        level: 'milestone',
        message: `${EDA_STAGE_DEFINITIONS[stage].tool}: stage started for ${this.run.chipName} ${this.run.techNode}`,
      },
    ];
  }

  private completeStage(stage: StageState, fault: FaultType | null) {
    const blocked =
      (fault === 'timing_closure_fail' && stage.stage === 'sta' && stage.retries < 1) ||
      (fault === 'congestion_hotspot' && stage.stage === 'place_route' && stage.retries < 1) ||
      (fault === 'drc_storm' && stage.stage === 'drc_lvs' && stage.retries < 1) ||
      (fault === 'power_budget_exceeded' && stage.stage === 'synthesis' && stage.retries < 1);

    if (blocked) {
      stage.status = 'warning';
      stage.retries += 1;
      stage.progress = Math.max(42, stage.progress - 38);
      stage.logs = [
        ...stage.logs,
        {
          id: `${stage.stage}-${this.run.tick}-retry`,
          timestamp: Date.now(),
          stage: stage.stage,
          level: 'warning',
          message: `${EDA_STAGE_DEFINITIONS[stage.stage].tool}: automatic ECO retry inserted after ${fault}`,
        },
      ];
      return;
    }

    stage.status = fault ? 'warning' : 'completed';
    stage.progress = 100;
    stage.artifacts = [EDA_STAGE_DEFINITIONS[stage.stage].artifact];
    stage.logs = [
      ...stage.logs,
      {
        id: `${stage.stage}-${this.run.tick}-done`,
        timestamp: Date.now(),
        stage: stage.stage,
        level: 'milestone',
        message: `${EDA_STAGE_DEFINITIONS[stage.stage].tool}: completed, artifact=${EDA_STAGE_DEFINITIONS[stage.stage].artifact}`,
      },
    ];

    const next = EDA_STAGE_ORDER[stageIndex(stage.stage) + 1];
    if (!next) {
      this.run.currentStage = null;
      this.pause();
      return;
    }
    this.startStage(next);
  }

  private createSample(stage: StageState): MetricSample {
    const load = 58 + stageIndex(stage.stage) * 3 + stage.progress * 0.28;
    return {
      tick: this.run.tick,
      stage: stage.stage,
      primary: primaryValue(stage.metrics),
      cpu: round(Math.min(99, load + this.rng() * 8), 1),
      memory: round(14 + stageIndex(stage.stage) * 3.5 + stage.progress * 0.12, 1),
      diskIo: round(120 + stage.progress * 8 + this.rng() * 140, 1),
    };
  }

  private createLogs(stage: StageState, fault: FaultType | null): LogEntry[] {
    const count = 1 + Math.floor(this.rng() * 3);
    const entries: LogEntry[] = [];
    for (let index = 0; index < count; index += 1) {
      const level = logLevel(stage.stage, stage.metrics, fault);
      entries.push({
        id: `${stage.stage}-${this.run.tick}-${index}`,
        timestamp: Date.now(),
        stage: stage.stage,
        level,
        message: logMessage(stage.stage, stage.metrics, this.rng, level),
      });
    }
    return entries;
  }

  private emit() {
    const state = this.getState();
    this.callbacks.forEach((callback) => callback(state));
  }
}
