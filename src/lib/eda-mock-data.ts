import type { EdaStage, FaultType, StageDefinition, StageMetrics, TechNode } from './eda-types';

export const EDA_STAGE_ORDER: EdaStage[] = [
  'rtl',
  'synthesis',
  'floorplan',
  'place_route',
  'cts',
  'sta',
  'drc_lvs',
  'tapeout',
];

export const EDA_STAGE_DEFINITIONS: Record<EdaStage, StageDefinition> = {
  rtl: {
    stage: 'rtl',
    label: 'RTL Design',
    shortLabel: 'RTL',
    tool: 'VCS + Verdi Lint',
    artifact: 'Verilog/VHDL netlist',
    baseTicks: 20,
    color: '#22c55e',
    primaryMetricLabel: 'Coverage',
    primaryMetricUnit: '%',
    warningLimit: 88,
  },
  synthesis: {
    stage: 'synthesis',
    label: 'Synthesis',
    shortLabel: 'Synth',
    tool: 'Design Compiler NXT',
    artifact: 'Gate-level netlist',
    baseTicks: 36,
    color: '#38bdf8',
    primaryMetricLabel: 'Power',
    primaryMetricUnit: 'mW',
    warningLimit: 780,
    criticalLimit: 900,
  },
  floorplan: {
    stage: 'floorplan',
    label: 'Floorplan',
    shortLabel: 'FP',
    tool: 'Innovus Floorplan',
    artifact: 'DEF floorplan',
    baseTicks: 28,
    color: '#f59e0b',
    primaryMetricLabel: 'Utilization',
    primaryMetricUnit: '%',
    warningLimit: 78,
    criticalLimit: 86,
  },
  place_route: {
    stage: 'place_route',
    label: 'Place & Route',
    shortLabel: 'P&R',
    tool: 'Cadence Innovus',
    artifact: 'Routed DEF + GDS',
    baseTicks: 60,
    color: '#a78bfa',
    primaryMetricLabel: 'Congestion',
    primaryMetricUnit: '%',
    warningLimit: 72,
    criticalLimit: 85,
  },
  cts: {
    stage: 'cts',
    label: 'CTS',
    shortLabel: 'CTS',
    tool: 'Tempus CTS Planner',
    artifact: 'Clock tree netlist',
    baseTicks: 26,
    color: '#06b6d4',
    primaryMetricLabel: 'Clock skew',
    primaryMetricUnit: 'ps',
    warningLimit: 45,
    criticalLimit: 65,
  },
  sta: {
    stage: 'sta',
    label: 'STA',
    shortLabel: 'STA',
    tool: 'PrimeTime Signoff',
    artifact: 'Timing report',
    baseTicks: 34,
    color: '#60a5fa',
    primaryMetricLabel: 'WNS',
    primaryMetricUnit: 'ns',
    warningLimit: 0,
  },
  drc_lvs: {
    stage: 'drc_lvs',
    label: 'DRC/LVS',
    shortLabel: 'DRC',
    tool: 'Calibre nmDRC/nmLVS',
    artifact: 'Signoff report',
    baseTicks: 48,
    color: '#ef4444',
    primaryMetricLabel: 'DRC errors',
    primaryMetricUnit: '',
    warningLimit: 80,
    criticalLimit: 500,
  },
  tapeout: {
    stage: 'tapeout',
    label: 'Tape-out',
    shortLabel: 'GDS',
    tool: 'GDS-II StreamOut',
    artifact: 'Final GDS-II',
    baseTicks: 30,
    color: '#f97316',
    primaryMetricLabel: 'Metal fill',
    primaryMetricUnit: '%',
    warningLimit: 72,
  },
};

export const TECH_NODE_SCALE: Record<TechNode, number> = {
  '3nm': 1.8,
  '5nm': 1.28,
  '7nm': 1,
};

export const TECH_NODE_PRESETS: Record<TechNode, { density: number; layerCount: number; maskCount: number; nominalPower: number }> = {
  '3nm': { density: 1.85, layerCount: 12, maskCount: 86, nominalPower: 760 },
  '5nm': { density: 1.34, layerCount: 10, maskCount: 72, nominalPower: 640 },
  '7nm': { density: 1, layerCount: 9, maskCount: 58, nominalPower: 540 },
};

export const FAULT_LABELS: Record<FaultType, string> = {
  timing_closure_fail: 'Timing closure fail',
  congestion_hotspot: 'Congestion hotspot',
  drc_storm: 'DRC storm',
  power_budget_exceeded: 'Power budget exceeded',
};

export function createInitialMetrics(stage: EdaStage): StageMetrics {
  switch (stage) {
    case 'rtl':
      return { kind: 'rtl', lineCount: 0, moduleCount: 0, lintWarnings: 0, coverage: 0 };
    case 'synthesis':
      return { kind: 'synthesis', gateCount: 0, area: 0, maxFreq: 0, power: 0, slack: 0 };
    case 'floorplan':
      return { kind: 'floorplan', dieArea: 0, utilization: 0, macroCount: 0, aspectRatio: 1 };
    case 'place_route':
      return { kind: 'place_route', cellCount: 0, routedNets: 0, wireLength: 0, congestion: 0, drcViolations: 0 };
    case 'cts':
      return { kind: 'cts', clockSkew: 0, bufferCount: 0, insertionDelay: 0, powerOverhead: 0 };
    case 'sta':
      return { kind: 'sta', wns: 0, tns: 0, failingPaths: 0, holdViolations: 0 };
    case 'drc_lvs':
      return { kind: 'drc_lvs', drcErrors: 0, lvsMismatches: 0, antennaViolations: 0, densityViolations: 0 };
    case 'tapeout':
      return { kind: 'tapeout', gdsSize: 0, layerCount: 0, metalFill: 0, maskCount: 0 };
  }
}

export const LOG_TEMPLATES: Record<EdaStage, string[]> = {
  rtl: [
    'vlogan: analyzing parameterized RTL hierarchy',
    'verdi-lint: checking CDC reset intent and naming rules',
    'urg: merging simulation coverage database',
  ],
  synthesis: [
    'dc_shell: compile_ultra -gate_clock enabled',
    'design_vision: mapping arithmetic cones to stdcell library',
    'power_compiler: evaluating clock gating opportunities',
  ],
  floorplan: [
    'innovus: initializing die boundary and IO ring',
    'floorplan: legalizing SRAM macros with halo constraints',
    'routeDesign: reserving power straps and blockages',
  ],
  place_route: [
    'place_opt: global placement density optimization',
    'nanoRoute: detailed route iteration with SI aware cost',
    'qor: reporting congestion heatmap and routed net count',
  ],
  cts: [
    'ccopt_design: balancing useful skew targets',
    'cts: inserting clock buffers and shielding critical trunks',
    'timing: propagating clock latency through generated tree',
  ],
  sta: [
    'pt_shell: update_timing -full',
    'report_timing: scanning setup and hold endpoints',
    'eco_opt: preparing buffer sizing candidates',
  ],
  drc_lvs: [
    'calibre: running nmDRC deck with density windows',
    'calibre: extracting LVS netlist and device correspondence',
    'signoff: classifying antenna and metal spacing violations',
  ],
  tapeout: [
    'streamOut: writing final GDS-II database',
    'maskprep: validating layer map and OPC handoff package',
    'archive: sealing tape-out bundle with manifest checksum',
  ],
};
