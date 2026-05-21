# Tool Health Feature Design — Tool Performance, Chamber Matching, FDC, PM, MTBF

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to create the implementation plan from this design.

**Goal:** Extend `/mes/equipment` and `/mes/spc` pages with 5 tool health capabilities: Tool Performance gauges, Preventive Maintenance schedule, MTBF prediction (Weibull), Fault Detection & Classification (FDC) trace viewer, and Chamber Matching analysis.

**Architecture:** Pure client-side. Hybrid data generation — sinusoidal drift for live KPIs, mulberry32 PRNG-seeded for statistical data (FDC traces, Weibull curves, PM history). New `src/lib/tool-health/` library with types, constants, and 5 generator functions. UI components extend two existing pages via a slide-out drawer (equipment) and new grid row (SPC).

**Tech Stack:** Next.js 15.1, React 19, Zustand, Canvas2D charts, Tailwind CSS, Vitest

---

## Capability Mapping

| Capability | Page | UI Element |
|---|---|---|
| Tool Performance (OEE/Avail/Util) | `/mes/equipment` | 480px slide-out drawer — 3 circular gauges + 24h sparklines |
| PM Schedule | `/mes/equipment` | Drawer section — countdown bar + 6-event history timeline |
| MTBF Prediction | `/mes/equipment` | Drawer section — 2×2 readout grid + Weibull survival curve (Canvas2D) |
| FDC Trace Viewer | `/mes/spc` | New bottom row — 6-param stacked traces with anomaly injection |
| Chamber Matching | `/mes/spc` | New bottom row — grouped bar chart with σ error bars |

---

## 1. Data Layer

### 1.1 Types (`src/lib/tool-health/types.ts`)

```typescript
// ── Tool Performance ──
export interface ToolPerformanceTrend {
  hour: number;
  oee: number;
  availability: number;
  utilization: number;
}

export interface ToolPerformance {
  equipmentId: string;
  oee: number;
  availability: number;
  utilization: number;
  trend24h: ToolPerformanceTrend[];
}

// ── PM Schedule ──
export type PmEventType = 'scheduled' | 'unscheduled' | 'completed';

export interface PmEvent {
  id: string;
  type: PmEventType;
  date: string;          // ISO date string
  durationHours: number;
  description: string;
}

export interface PmSchedule {
  equipmentId: string;
  nextPmDate: string;
  pmIntervalDays: number;
  lastPmDate: string;
  history: PmEvent[];    // last 6 events
}

// ── MTBF Prediction (Weibull) ──
export interface WeibullPoint {
  hours: number;
  probability: number;
}

export interface MtbfPrediction {
  equipmentId: string;
  mtbfHours: number;
  currentAgeHours: number;
  failureProbability: number;  // 0–1
  weibullShape: number;        // β
  weibullScale: number;        // η
  survivalCurve: WeibullPoint[];  // 50 points
}

// ── FDC ──
export type FdcParamId = 'pressure' | 'rfPower' | 'temperature' | 'gasFlow1' | 'gasFlow2' | 'biasVoltage';
export type FdcAnomalyType = 'drift' | 'spike' | 'oscillation' | 'step-shift';

export interface FdcParam {
  id: FdcParamId;
  label: string;
  unit: string;
  setpoint: number;
  fdcUpper: number;
  fdcLower: number;
}

export interface FdcSample {
  t: number;
  value: number;
  anomaly: boolean;
}

export interface FdcTrace {
  chamberId: string;
  paramId: FdcParamId;
  samples: FdcSample[];
}

// ── Chamber Matching ──
export interface ChamberMatchStat {
  chamberId: string;
  chamberName: string;
  paramId: FdcParamId;
  mean: number;
  sigma: number;
  min: number;
  max: number;
  n: number;
}
```

### 1.2 Constants (`src/lib/tool-health/constants.ts`)

```typescript
import type { FdcParam, FdcParamId } from './types';

export const FDC_PARAMS: Record<FdcParamId, FdcParam> = {
  pressure:    { id: 'pressure',    label: 'Chamber Pressure', unit: 'mTorr', setpoint: 150,  fdcUpper: 165,  fdcLower: 135 },
  rfPower:     { id: 'rfPower',     label: 'RF Power',         unit: 'W',     setpoint: 800,  fdcUpper: 880,  fdcLower: 720 },
  temperature: { id: 'temperature', label: 'Temperature',      unit: '°C',    setpoint: 450,  fdcUpper: 470,  fdcLower: 430 },
  gasFlow1:    { id: 'gasFlow1',    label: 'Gas Flow (main)',   unit: 'sccm',  setpoint: 200,  fdcUpper: 220,  fdcLower: 180 },
  gasFlow2:    { id: 'gasFlow2',    label: 'Gas Flow (purge)',  unit: 'sccm',  setpoint: 50,   fdcUpper: 58,   fdcLower: 42 },
  biasVoltage: { id: 'biasVoltage', label: 'Bias Voltage',     unit: 'V',     setpoint: 300,  fdcUpper: 340,  fdcLower: 260 },
};

export const FDC_PARAM_IDS: FdcParamId[] = [
  'pressure', 'rfPower', 'temperature', 'gasFlow1', 'gasFlow2', 'biasVoltage',
];

export const FDC_TRACE_SAMPLES = 200;

// Weibull defaults per equipment type prefix
export const WEIBULL_DEFAULTS: Record<string, { shape: number; scale: number; pmIntervalDays: number }> = {
  'FUR':  { shape: 2.5, scale: 6000, pmIntervalDays: 60 },  // furnaces
  'RTP':  { shape: 2.0, scale: 4000, pmIntervalDays: 45 },  // RTP
  'NXE':  { shape: 1.8, scale: 5000, pmIntervalDays: 30 },  // scanners
  'ETCH': { shape: 2.2, scale: 3500, pmIntervalDays: 30 },  // etch
  'DEP':  { shape: 2.0, scale: 4500, pmIntervalDays: 45 },  // deposition
  'IMP':  { shape: 1.5, scale: 3000, pmIntervalDays: 30 },  // implant
  'CMP':  { shape: 2.3, scale: 4000, pmIntervalDays: 21 },  // CMP (consumables)
  'PVD':  { shape: 2.1, scale: 4200, pmIntervalDays: 45 },  // PVD
  'ECD':  { shape: 1.9, scale: 3800, pmIntervalDays: 30 },  // electroplating
  'ANL':  { shape: 2.4, scale: 5500, pmIntervalDays: 60 },  // anneal
  'MET':  { shape: 2.8, scale: 7000, pmIntervalDays: 90 },  // metrology
  'ASH':  { shape: 2.0, scale: 3200, pmIntervalDays: 30 },  // asher
  'TRACK':{ shape: 2.1, scale: 4800, pmIntervalDays: 45 },  // track
  'CLEAN':{ shape: 2.2, scale: 3600, pmIntervalDays: 21 },  // cleaner
  'DEFAULT': { shape: 2.0, scale: 4000, pmIntervalDays: 45 },
};

export const SURVIVAL_CURVE_POINTS = 50;

// Performance gauge thresholds
export const PERF_THRESHOLDS = {
  green: 85,   // >= 85% green
  amber: 70,   // >= 70% amber, < 70% red
};

// PM countdown thresholds (days)
export const PM_THRESHOLDS = {
  green: 14,   // > 14 days: green
  amber: 7,    // 7–14 days: amber, < 7 days: red
};

// Anomaly injection window
export const ANOMALY_WINDOW = { start: 80, end: 120 } as const;
```

### 1.3 Mock Data Generators (`src/lib/tool-health/mock-data.ts`)

Five pure, deterministic functions:

1. **`generateToolPerformance(equipmentId, baseOee)`** → `ToolPerformance`
   - Seed: hash of equipmentId
   - availability = baseOee + PRNG offset (0–5%)
   - utilization = availability × (0.85–0.95) via PRNG
   - trend24h: 24 points, sinusoidal base `sin(hour/3.8 + seed)` ± 2% + one PRNG-picked dip at a random hour (drops 8–15%)

2. **`generatePmSchedule(equipmentId)`** → `PmSchedule`
   - Lookup WEIBULL_DEFAULTS by equipment ID prefix → pmIntervalDays
   - Generate 6 past PM events, working backwards from "today"
   - 80% completed, 20% unscheduled (PRNG roll)
   - nextPmDate = lastPmDate + pmIntervalDays

3. **`generateMtbfPrediction(equipmentId)`** → `MtbfPrediction`
   - Lookup Weibull β, η from WEIBULL_DEFAULTS by prefix
   - MTBF = η × Γ(1 + 1/β) (use Stirling approximation for gamma)
   - currentAge = PRNG × (0.1–0.8) × η
   - survivalCurve: 50 points, `S(t) = exp(-(t/η)^β)` for t ∈ [0, 2η]
   - failureProbability = 1 − S(currentAge)

4. **`generateFdcTraces(chamberId, anomalyType?)`** → `FdcTrace[]`
   - One trace per FDC param (6 total)
   - 200 samples: `setpoint + gaussianNoise(σ = 2% of setpoint)`
   - If anomalyType specified, inject into samples 80–120 on 1–2 PRNG-selected params:
     - `drift`: linear ramp, 0 → +3σ over 40 samples
     - `spike`: single sample at ±5σ at midpoint
     - `oscillation`: added sine wave, amplitude 2σ, period 8 samples
     - `step-shift`: +2.5σ offset from sample 80 onward

5. **`generateChamberMatchStats(processId, paramId)`** → `ChamberMatchStat[]`
   - For each chamber in process (from fab-process-data), generate stats from its FDC trace
   - One PRNG-selected chamber gets deliberate 1.5–2.5σ offset on mean

### 1.4 Barrel Export (`src/lib/tool-health/index.ts`)

Export all types, constants, and generator functions.

---

## 2. Equipment Drawer (`/mes/equipment`)

### 2.1 EquipmentDrawer (`src/components/equipment/EquipmentDrawer.tsx`)

- **Width:** 480px, slides in from right with `transform: translateX` transition (200ms ease-out)
- **Trigger:** `selectedEquipmentId !== null` — replaces the current `w-72` sidebar
- **Close:** X button in header, Escape key, or click outside
- **Position:** `absolute right-0 top-0 h-full z-20` over the map area
- **Scroll:** `overflow-y-auto` for content taller than viewport

**Layout (top to bottom):**

```
┌──────────────────────────────────┐
│ [X]  NXE:3800E                   │
│      NXE-3800-01  ● RUNNING      │
│      Recipe: M2-193I-OPC          │
│      Wafers: 18/25 ███████░░ 72% │
├──────────────────────────────────┤
│ PERFORMANCE                       │
│  ┌──────┐ ┌──────┐ ┌──────┐      │
│  │ OEE  │ │ Avail│ │ Util │      │
│  │ 97.4%│ │ 98.1%│ │ 93.2%│      │
│  └──┬───┘ └──┬───┘ └──┬───┘      │
│   ~~sparkline~~ per gauge         │
├──────────────────────────────────┤
│ PREVENTIVE MAINTENANCE            │
│ Next PM in 23 days ████████████░  │
│ ●──●──●──●──○──●                  │
│ (6 past PM events on timeline)    │
├──────────────────────────────────┤
│ MTBF PREDICTION                   │
│ MTBF   4,230h │ Age    1,850h     │
│ P(fail)  8.2% │ β        2.1     │
│ ┌────────────────────────────┐    │
│ │  Weibull survival curve    │    │
│ │  S(t) with age marker |    │    │
│ └────────────────────────────┘    │
└──────────────────────────────────┘
```

### 2.2 PerformanceGauges (`src/components/equipment/PerformanceGauges.tsx`)

- Three circular arc gauges, each 80px diameter
- Arc fills: green (>=85%), amber (70–85%), red (<70%)
- Numeric value centered inside the arc
- Below each gauge: 80×24px SVG sparkline (24 points, last 24 hours)
- Props: `performance: ToolPerformance`

### 2.3 PmTimeline (`src/components/equipment/PmTimeline.tsx`)

- **Countdown bar:** Full-width horizontal bar, filled proportionally (daysElapsed / interval)
  - Green >14d remaining, amber 7–14d, red <7d
  - Label: "Next PM in X days" or "PM OVERDUE" if past due
- **History timeline:** Horizontal line with 6 dots
  - Green dot = completed, blue = scheduled (future), orange = unscheduled
  - Hover tooltip: date + description + duration
- Props: `schedule: PmSchedule`

### 2.4 MtbfChart (`src/components/equipment/MtbfChart.tsx`)

- Canvas2D, 440×120px
- X axis: hours (0 to 2η), Y axis: survival probability (0–1)
- Curve: smooth Weibull `S(t) = exp(-(t/η)^β)`, filled beneath with gradient (green→amber→red as S drops)
- Vertical dashed line at `currentAge` with label
- Readout grid above chart: 2×2, monospace numbers
- Props: `prediction: MtbfPrediction`

### 2.5 Equipment Page Changes (`src/app/mes/equipment/page.tsx`)

- Remove the existing `w-72` detail panel div (lines ~71–172)
- Add `<EquipmentDrawer equipmentId={selectedEquipmentId} equipment={selectedEquipment} />` as a sibling to the map container
- The drawer reads tool-health data via generator functions called with the selected equipment ID
- Wrap map + drawer in a `relative` container for absolute positioning

---

## 3. SPC Page Extensions (`/mes/spc`)

### 3.1 FdcTraceViewer (`src/components/spc/FdcTraceViewer.tsx`)

- **Card** with same styling as existing SPC cards (`bg-[var(--smartfactory-surface-card)]`, border, rounded)
- **Header bar:**
  - Dropdown 1: Select chamber (populated from all equipment across all processes in fab-process-data)
  - Dropdown 2: Anomaly injection (None / Drift / Spike / Oscillation / Step-shift)
- **Chart area (~full width × 280px, Canvas2D):**
  - 6 stacked horizontal mini-traces, each ~40px tall
  - Shared X axis at bottom (time in seconds, 0–200)
  - Each trace: signal line (colored per param), dashed setpoint line, shaded FDC limit band (light translucent)
  - Anomaly samples highlighted with translucent red overlay band
  - Y axis labels on left (value + unit)
- **Legend strip:** 6 colored chips with param name, clickable to toggle trace visibility
- **State:** `selectedChamberId`, `anomalyType`, `visibleParams` (Set)
- Regenerates traces when chamber or anomaly type changes

### 3.2 ChamberMatchPanel (`src/components/spc/ChamberMatchPanel.tsx`)

- **Card** with same styling
- **Header bar:**
  - Dropdown 1: Select process (8 processes from PROCESS_ORDER)
  - Dropdown 2: Select KPI/param to compare (from FDC_PARAM_IDS)
- **Chart area (~full width × 240px, Canvas2D):**
  - Grouped vertical bars, one per chamber in the selected process
  - Bar height = mean value, error whiskers = ±3σ
  - Horizontal dashed line = group mean
  - Bar colors: green if within ±2σ of group mean, amber if 2–3σ, red if >3σ
  - Chamber name labels on X axis
- **Summary strip:** Text below chart
  - All matched: "3 chambers matched ✓" (green)
  - Mismatch: "Chamber B drifted — Δμ = 1.8σ" (amber/red icon)
- **State:** `selectedProcess`, `selectedParam`
- Regenerates stats when process or param changes

### 3.3 SPC Page Changes (`src/app/mes/spc/page.tsx`)

Add new grid row after the violations panel (before `<FooterStatusBar />`):

```tsx
{/* FDC & Chamber Matching Row */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <FdcTraceViewer />
  <ChamberMatchPanel />
</div>
```

---

## 4. Test Plan

### 4.1 Data Layer Tests (`src/lib/tool-health/__tests__/`)

**`constants.test.ts`** (~5 tests):
- FDC_PARAMS has all 6 entries with valid bounds (upper > setpoint > lower)
- WEIBULL_DEFAULTS has DEFAULT key
- FDC_PARAM_IDS matches FDC_PARAMS keys
- PM_THRESHOLDS and PERF_THRESHOLDS have green > amber
- ANOMALY_WINDOW start < end

**`mock-data.test.ts`** (~20 tests):
- generateToolPerformance: deterministic (same ID → same output), OEE/avail/util in 0–100, trend24h has 24 points, one dip event exists
- generatePmSchedule: 6 history events, nextPmDate > lastPmDate, interval matches equipment type
- generateMtbfPrediction: survivalCurve has 50 points, S(0)≈1, S(2η)≈0, failureProbability in 0–1, MTBF > 0
- generateFdcTraces: 6 traces × 200 samples each, no anomalies when type=undefined, anomaly flags present when injected, anomaly window within 80–120
- generateChamberMatchStats: one chamber has offset > 1σ from group mean, all stats have positive σ and n

### 4.2 Component Tests (`src/components/`)

**`EquipmentDrawer.test.tsx`** (~5 tests):
- Renders when equipmentId provided, hidden when null
- Shows equipment name, status badge, wafer progress
- Contains Performance, PM, MTBF sections
- Close button calls handler
- Escape key closes drawer

**`PerformanceGauges.test.tsx`** (~3 tests) — SKIP (Canvas2D visual)

**`PmTimeline.test.tsx`** (~3 tests):
- Shows countdown text with correct days
- Renders 6 history dots
- Overdue PM shows red indicator

**`MtbfChart.test.tsx`** (~2 tests) — SKIP (Canvas2D visual)

**`FdcTraceViewer.test.tsx`** (~4 tests):
- Renders chamber dropdown with equipment options
- Anomaly selector has 5 options (none + 4 types)
- Legend strip shows 6 params
- Toggling param visibility updates visible set

**`ChamberMatchPanel.test.tsx`** (~4 tests):
- Renders process dropdown with 8 processes
- Param dropdown has 6 FDC params
- Summary strip shows match/mismatch status
- Changing process regenerates chart

**Estimated total: ~40 tests across 7 files**

---

## 5. File Inventory

### New Files (10 source + 7 test = 17)

| File | Purpose |
|---|---|
| `src/lib/tool-health/types.ts` | All types for 5 capabilities |
| `src/lib/tool-health/constants.ts` | FDC params, Weibull defaults, thresholds |
| `src/lib/tool-health/mock-data.ts` | 5 generator functions |
| `src/lib/tool-health/index.ts` | Barrel export |
| `src/components/equipment/EquipmentDrawer.tsx` | 480px slide-out drawer |
| `src/components/equipment/PerformanceGauges.tsx` | 3 circular gauges + sparklines |
| `src/components/equipment/PmTimeline.tsx` | PM countdown + history timeline |
| `src/components/equipment/MtbfChart.tsx` | Canvas2D Weibull survival curve |
| `src/components/spc/FdcTraceViewer.tsx` | 6-trace stacked FDC chart |
| `src/components/spc/ChamberMatchPanel.tsx` | Grouped bar chart + matching summary |
| `src/lib/tool-health/__tests__/constants.test.ts` | Constants validation |
| `src/lib/tool-health/__tests__/mock-data.test.ts` | Generator determinism, bounds, anomalies |
| `src/components/equipment/__tests__/EquipmentDrawer.test.tsx` | Drawer open/close, sections |
| `src/components/equipment/__tests__/PmTimeline.test.tsx` | Countdown, history dots |
| `src/components/spc/__tests__/FdcTraceViewer.test.tsx` | Dropdowns, legend, visibility |
| `src/components/spc/__tests__/ChamberMatchPanel.test.tsx` | Process/param selectors, summary |

### Modified Files (2)

| File | Change |
|---|---|
| `src/app/mes/equipment/page.tsx` | Replace w-72 sidebar with EquipmentDrawer |
| `src/app/mes/spc/page.tsx` | Add FDC + Chamber Matching grid row |

---

## 6. Task Breakdown (13 tasks)

1. Types and constants (`types.ts` + `constants.ts` + `constants.test.ts`)
2. Performance generator (`generateToolPerformance` + tests)
3. PM generator (`generatePmSchedule` + tests)
4. MTBF generator (`generateMtbfPrediction` + tests)
5. FDC generator (`generateFdcTraces` + tests)
6. Chamber matching generator (`generateChamberMatchStats` + tests)
7. Barrel export (`index.ts`)
8. PerformanceGauges component
9. PmTimeline component (+ tests)
10. MtbfChart component (Canvas2D)
11. EquipmentDrawer component (+ tests, modify equipment page)
12. FdcTraceViewer component (+ tests, modify SPC page)
13. ChamberMatchPanel component (+ tests, modify SPC page)
