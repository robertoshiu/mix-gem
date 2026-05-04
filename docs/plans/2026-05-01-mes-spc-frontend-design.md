# MES SPC Dashboard — Pure Frontend Demo Design

**Date:** 2026-05-01
**Status:** Approved
**Author:** Brainstorming session
**Supersedes:** `2026-05-01-mes-spc-design.md` (full-stack version — kept as reference)
**Related:** `2026-04-30-mes-design.md` (MES base design — UI sections reused)

## Overview

A pure frontend demo of a closed-loop SPC system for semiconductor lithography. No backend, no database, no Docker. All simulation, SPC evaluation, and SECS/GEM message generation runs in the browser via TypeScript. Mock data feeds the UI for instant portfolio showcase.

**Hero moment:** Page loads with 10 wafers of stable data on the control chart -> live streaming adds new wafers every 2s -> engineer clicks "Inject Fault: Sudden Shift" -> CD jumps above UCL -> violation card fires -> lot auto-holds -> equipment inhibits (fake S2F41 in event log) -> engineer acknowledges -> equipment resumes. Full closed-loop in 30 seconds, zero infrastructure.

**Deployable to:** Vercel, GitHub Pages, Netlify — static export.

---

## Architecture — Browser-Only

```
+------------------------------------------------------------------+
|                   equipment-monitor (Next.js)                     |
|                                                                   |
|  +- Pages --------+  +- Client-Side Engine ----------+           |
|  | /mes/lots       |  |                               |           |
|  | /mes/recipes    |  |  SimulatorEngine.ts            |           |
|  | /mes/spc        |  |    MetrologyGenerator.ts       |           |
|  |                 |  |    FaultInjector.ts             |           |
|  +--------+--------+  |                               |           |
|           |            |  SpcEngine.ts                  |           |
|           |  state     |    WesternElectricRules.ts     |           |
|           v            |                               |           |
|  +- Zustand Store -+   |  SecsMessageLog.ts            |           |
|  | lots[]          |   |    (visual-only, no HSMS)     |           |
|  | recipes[]       |   +--------------------+----------+           |
|  | measurements[]  |                        |                     |
|  | violations[]    |   +- Mock Data ---------+----------+          |
|  | events[]        |   |  mockLots.ts                  |          |
|  | equipmentState  |   |  mockRecipes.ts               |          |
|  | activeFault     |   |  spcParameters.ts             |          |
|  +-----------------+   +-------------------------------+          |
+------------------------------------------------------------------+
```

### What Replaces the Backend

| Was (Full-Stack) | Now (Frontend) |
|-----------------|----------------|
| PostgreSQL tables | Zustand store (in-memory arrays) |
| FastAPI endpoints | Direct function calls from components |
| SECS/GEM HSMS client | `SecsMessageLog.ts` — generates fake SECS message JSON for event feed |
| SSE event bus | Zustand subscriptions — React re-renders on state change |
| Simulator Docker service | `setInterval` in `SimulatorEngine.ts` — ticks every 2s |
| SPC engine service | `SpcEngine.ts` — pure function, called after each measurement |
| Fault injection REST API | `FaultInjector.ts` — mutates generator config in Zustand |
| Alembic migrations | Not needed — no persistence |
| Docker Compose | Not needed — `npm run dev` only |

**Key design rule:** Every SECS/GEM message (S6F11, S2F41, S2F42, S2F49, S2F50) is still generated as a JSON object and displayed in the event feed — it just never touches a wire. The demo looks identical to the real system.

---

## UI Design System — TIBCO x Applied Materials Fusion

(Unchanged from full-stack design — kept here for single-document reference)

### Design DNA

| Trait | TIBCO Spotfire | Applied Materials | Our Mix |
|-------|---------------|-------------------|---------|
| Density | High — charts fill every pixel | Moderate — corporate clean | High density with breathing room |
| Background | Medium gray `#2B2B2B` | Deep navy `#003366` | Deep navy-slate `#0A1628` |
| Accent | Data-driven multicolor | Orange `#F47920` + blue | Orange CTA + blue data + teal status |
| Charts | Interactive crossfilter, brush-select | Static KPI tiles | Interactive with live streaming |
| Typography | System sans-serif | Corporate sans | Fira Code (data) + Inter (UI) |
| Layout | Side panel filters + chart grid | Header cards + content | KPI strip + split chart grid |

### Color System

| Role | Hex | Usage |
|------|-----|-------|
| Navy Base | `#0A1628` | Page background |
| Panel Surface | `#111D2E` | Cards, chart background |
| Panel Elevated | `#182840` | Hover, selected state |
| Border | `#1E3A5F` | Subtle card borders |
| Border Active | `#2563EB` | Focus, selected tab |
| AMAT Orange | `#F47920` | CTA, inject fault button |
| Trust Blue | `#3B82F6` | Primary data, links |
| Teal Data | `#14B8A6` | Secondary data line |
| Cool Cyan | `#22D3EE` | Tertiary data line |
| Violet Accent | `#8B5CF6` | Overlay data |
| SPC Green | `#10B981` | In-control, nominal |
| SPC Amber | `#F59E0B` | Warning zone (2 sigma) |
| SPC Red | `#EF4444` | Violation, OOC |
| UCL/LCL Line | `#EF4444` | Dashed, 50% opacity |
| Center Line | `#F59E0B` | Solid, 60% opacity |
| +/-2 sigma Band | `#F59E0B` | Fill, 8% opacity |
| +/-3 sigma Band | `#EF4444` | Fill, 5% opacity |
| Text Primary | `#F1F5F9` | Headings, values |
| Text Secondary | `#94A3B8` | Labels, descriptions |
| Text Muted | `#475569` | Timestamps, hints |

### Typography

- **Data values, measurements, chart ticks:** Fira Code 400/500
- **Labels, nav, headings:** Inter 400/500/600
- **KPI big numbers:** Fira Code 600, 2rem

### Key Effects

- Active chart border: `border-l-2 border-blue-500` (TIBCO selected-panel indicator)
- Violation pulse: `box-shadow: 0 0 12px rgba(239,68,68,0.4)` on OOC data points
- Current step glow: `text-shadow: 0 0 8px #3B82F6` (subtle)
- Chart crosshair: vertical line on hover across all charts (TIBCO signature)
- `prefers-reduced-motion`: disable pulse, glow, streaming animation

---

## SPC Dashboard Layout (`/mes/spc`)

```
+------------------------------------------------------------------+
|  EM  | Equipment | Lot Tracker | Recipe Manager | SPC Dashboard  |
+------+----------+-------------+----------------+----------------+
|                                                                   |
|  +- KPI Strip -----------------------------------------------+   |
|  |  CD: 45.02nm OK | CDU: 1.8nm OK | OVL-X: -0.3nm OK |     |   |
|  |  OVL-Y: 0.1nm OK | LER: 3.1nm OK | Lot: LOT-2026-001 |   |   |
|  +-----------------------------------------------------------+   |
|                                                                   |
|  +- Main Control Chart --------------------------------------+   |
|  |  CD (Critical Dimension)           Target: 45.0nm         |   |
|  |                                                            |   |
|  |   UCL - - - - - - - - - - - - - - - - - - - -  48.0nm     |   |
|  |   +2s ////////////////////////////////////////////////     |   |
|  |        .  . .                                              |   |
|  |   CL  --- . ---.---.---.---.---.---.---.------  45.0nm     |   |
|  |             .     .                                        |   |
|  |   -2s ////////////////////////////////////////////////     |   |
|  |   LCL - - - - - - - - - - - - - - - - - - - -  42.0nm     |   |
|  |                                                            |   |
|  |   Wafer: 1  2  3  4  5  6  7  8  9 10 11 12 13 14 15      |   |
|  +------------------------------------------------------------+   |
|                                                                   |
|  +- Thumbnail Row -------------------------------------------+   |
|  | +--CDU--+  +-OVL-X-+  +-OVL-Y-+  +--LER--+  +-Inject-+  |   |
|  | | ~~.~~ |  | ~~.~~ |  | ~~.~~ |  | ~~.~~ |  | Faults |  |   |
|  | |1.8 OK |  |-0.3 OK|  |0.1  OK|  |3.1  OK|  |  [>>]  |  |   |
|  | +-------+  +-------+  +-------+  +-------+  +--------+  |   |
|  +-----------------------------------------------------------+   |
|                                                                   |
|  +- Event Log -------------------------+- Violation ---------+   |
|  | 16:32:05  S6F11 SPC data: wafer 15  | Rule 1: CD > UCL    |   |
|  | 16:32:05  SPC violation: CD OOC     | Lot: LOT-2026-001   |   |
|  | 16:32:06  Lot LOT-2026-001 ON HOLD  | Action: Auto-hold   |   |
|  | 16:32:06  S2F41 STOP -> LITHO01     | + Equip inhibit     |   |
|  +-------------------------------------+---------------------+   |
+------------------------------------------------------------------+
```

**Responsive behavior:**
- >=1024px: full layout as shown
- 768px: KPI strip wraps to 2 rows, thumbnails become horizontal scroll
- 375px: single column, main chart full-width, thumbnails as swipeable row

---

## Simulator Engine — Client-Side Processing Loop

### Initialization (on page mount)

```
1. Populate store with:
   - 3 mock lots (LOT-2026-001/002/003), first lot status "in_process"
   - 3 mock recipes (LITHO-193nm-v4, COAT-std-v2, DEV-alkaline-v1)
   - 10 pre-seeded wafers x 5 parameters = 50 measurements (all in-control)

2. Start setInterval(tick, 2000)
```

### Tick Loop (every 2 seconds)

```
+-------------------------------------------+
|  Tick: process wafer N for active lot      |
|                                            |
|  1. MetrologyGenerator.generate(params)    |
|     - 5 values, noise = gauss(0, 0.6*sig) |
|     - If fault active: apply fault formula |
|                                            |
|  2. Push to store.measurements[]           |
|                                            |
|  3. Log fake S6F11 to store.events[]       |
|     { stream:6, function:11, ceid:100,     |
|       values: {cd:45.2, cdu:1.9, ...} }   |
|                                            |
|  4. SpcEngine.evaluate(measurements)       |
|     - Check Rules 1, 2, 5 per parameter   |
|     - Returns: violation | null            |
|                                            |
|  5. If violation:                          |
|     - Push to store.violations[]           |
|     - Set lot.status = "on_hold"           |
|     - Set equipmentState = "inhibited"     |
|     - Log fake S2F41 STOP to events[]      |
|     - Log fake S2F42 ACK to events[]       |
|     - Stop interval (equipment halted)     |
|                                            |
|  6. If wafer_number >= 25:                 |
|     - Set lot.status = "completed"         |
|     - Stop interval                        |
|                                            |
|  7. Increment wafer_number                 |
+-------------------------------------------+
```

### Fault Injection

When user clicks "Inject Fault":
1. `store.activeFault` is set (e.g., `{type: "sudden_shift", parameter: "cd", severity: 1.0, startedAtWafer: 15}`)
2. Next tick, `MetrologyGenerator` reads `activeFault` and applies the formula
3. "Clear Fault" resets `activeFault` to null

### Resume After Violation

User clicks "Acknowledge" on violation card:
1. `violation.acknowledged = true`
2. `equipmentState` resets to `"processing"`
3. `activeFault` cleared
4. Interval restarts
5. Log fake S2F41 RESUME + S2F42 ACK to events

---

## SPC Parameters

```typescript
const SPC_PARAMETERS = {
  cd:    { target: 45.0, sigma: 1.0, unit: "nm", label: "Critical Dimension" },
  cdu:   { target: 2.0,  sigma: 0.3, unit: "nm", label: "CD Uniformity" },
  ovl_x: { target: 0.0,  sigma: 1.0, unit: "nm", label: "Overlay X" },
  ovl_y: { target: 0.0,  sigma: 1.0, unit: "nm", label: "Overlay Y" },
  ler:   { target: 3.0,  sigma: 0.5, unit: "nm", label: "Line Edge Roughness" },
} as const;
```

UCL = target + 3 * sigma, LCL = target - 3 * sigma (computed from config).

---

## SPC Engine — Western Electric Rules

Pure functions. Called after each measurement batch (5 values per wafer).

**Rule 1 — "Beyond 3 sigma"**
- Condition: ANY single point > UCL or < LCL
- Catches: sudden shift, overlay excursion

**Rule 2 — "7 Consecutive Same Side"**
- Condition: 7+ consecutive points all above or all below center line
- Catches: gradual drift, focus degradation

**Rule 5 — "2 of 3 Beyond 2 sigma"**
- Condition: 2 out of 3 consecutive points beyond +/-2 sigma (same side)
- Catches: increased variance

Sliding window: last 20 measurements for that parameter.

---

## Fault Injection — Five Types

| Fault | Affected Param | Behavior | Wafers to Trigger |
|-------|---------------|----------|-------------------|
| `sudden_shift` | CD | Adds +4nm offset instantly | 1 (Rule 1) |
| `gradual_drift` | CD | Adds +0.3nm per wafer, accumulating | ~8 (Rule 2) |
| `increased_variance` | CDU | Doubles sigma from 0.3 to 0.6 | ~3 (Rule 5) |
| `overlay_excursion` | OVL-X | Ramps +0.5nm per wafer | ~8 (Rule 2) |
| `focus_degradation` | LER | Spikes sigma from 0.5 to 1.2 | ~3 (Rule 5) |

### Normal Generation (no fault)

```typescript
value = target + gaussianRandom() * sigma * 0.6
// 0.6x sigma keeps normal data well within +/-2 sigma
```

### Fault Generation (modifies formula)

```typescript
switch (fault.type) {
  case "sudden_shift":
    value += 4.0 * fault.severity
  case "gradual_drift":
    value += 0.3 * (wafer - fault.startedAtWafer) * fault.severity
  case "increased_variance":
    // replace 0.6 multiplier with 2.0
    value = target + gaussianRandom() * sigma * 2.0
  case "overlay_excursion":
    value += 0.5 * (wafer - fault.startedAtWafer) * fault.severity
  case "focus_degradation":
    value = target + gaussianRandom() * sigma * 2.4
}
```

---

## Fake SECS/GEM Messages

`SecsMessageLog.ts` generates display-only SECS message objects. These appear in the event feed to make the demo look like a real SECS/GEM system.

### S6F11 — Collection Event (SPC Data)

```typescript
{
  type: "s6f11_spc_data",
  label: "S6F11 Collection Event: wafer 15",
  secsMessage: {
    stream: 6, function: 11,
    ceid: 100,
    reports: [
      { rptid: 1001, parameter: "cd", value: 45.23 },
      { rptid: 1002, parameter: "cdu", value: 1.87 },
      // ...
    ]
  }
}
```

### S2F41 — Host Command STOP

```typescript
{
  type: "s2f41_stop",
  label: "S2F41 STOP -> LITHO01",
  secsMessage: {
    stream: 2, function: 41,
    rcmd: "STOP",
    params: [{ cpname: "REASON", cpval: "SPC_VIOLATION:cd:rule_1" }]
  }
}
```

### S2F42 — Host Command ACK

```typescript
{
  type: "s2f42_ack",
  label: "S2F42 ACK (HCACK=0)",
  secsMessage: { stream: 2, function: 42, hcack: 0 }
}
```

### S2F49/S2F50 — Recipe Push (from Recipe Manager page)

Generated when user clicks "Push Recipe" on the Recipe Manager page.

---

## Zustand Store

```typescript
interface MesSpcStore {
  // --- Lots ---
  lots: Lot[]
  updateLot: (lotId: string, patch: Partial<Lot>) => void

  // --- Recipes ---
  recipes: Recipe[]

  // --- Active Simulation ---
  activeLotId: string | null
  activeRecipeId: string | null
  waferNumber: number
  equipmentState: "idle" | "processing" | "inhibited"
  activeFault: FaultConfig | null

  // --- SPC Data ---
  measurements: SpcMeasurement[]
  violations: SpcViolation[]
  addMeasurement: (m: SpcMeasurement) => void
  addViolation: (v: SpcViolation) => void

  // --- Event Log ---
  events: SecsEvent[]               // capped at 100 entries
  addEvent: (e: SecsEvent) => void

  // --- Actions ---
  startProcessing: (lotId: string, recipeId: string) => void
  stopProcessing: () => void
  injectFault: (fault: FaultConfig) => void
  clearFault: () => void
  acknowledgeViolation: (violationId: string) => void
  resumeEquipment: () => void
}
```

Why Zustand: the simulator engine runs in a `setInterval` outside React. Zustand's `getState()`/`setState()` works outside components. Charts subscribe to `measurements` slice, event log to `events` slice — minimal re-renders.

---

## File Structure

```
equipment-monitor/src/
  app/mes/
    spc/page.tsx                    -- SPC Dashboard page
    lots/page.tsx                   -- Lot Tracker page
    recipes/page.tsx                -- Recipe Manager page
  components/spc/
    ControlChart.tsx                -- Main chart with UCL/LCL/bands
    ThumbnailChart.tsx              -- Sparkline mini-chart
    KpiStrip.tsx                    -- Parameter KPI bar
    FaultInjector.tsx               -- Fault dropdown + inject button
    ViolationCard.tsx               -- Active violation display
    EventLog.tsx                    -- Scrolling SECS message feed
  lib/
    store.ts                        -- Zustand store
    simulator-engine.ts             -- setInterval processing loop
    metrology-generator.ts          -- Value generation + fault formulas
    spc-engine.ts                   -- WE Rules 1, 2, 5 evaluation
    secs-message-log.ts             -- Fake SECS message factory
    mock-data.ts                    -- Initial lots, recipes, seed measurements
    spc-parameters.ts               -- Target/sigma/UCL/LCL config
```

---

## Implementation Tasks

| Task | What | Key Files | Depends On |
|------|------|-----------|------------|
| 1 | Store + mock data + engines | `store.ts`, `mock-data.ts`, `spc-parameters.ts`, `simulator-engine.ts`, `metrology-generator.ts`, `spc-engine.ts`, `secs-message-log.ts` | -- |
| 2 | SPC Dashboard: ControlChart + KpiStrip + ThumbnailChart | `spc/page.tsx`, `ControlChart.tsx`, `KpiStrip.tsx`, `ThumbnailChart.tsx` | Task 1 |
| 3 | FaultInjector + ViolationCard + EventLog | `FaultInjector.tsx`, `ViolationCard.tsx`, `EventLog.tsx`, modify `spc/page.tsx` | Task 2 |
| 4 | Lot Tracker + Recipe Manager + nav integration | `lots/page.tsx`, `recipes/page.tsx`, header modification | Task 1 |

Tasks 2 and 4 can run in parallel after Task 1. Task 3 depends on Task 2.

---

## Hero Demo Flow

```
1. Open /mes/spc
2. Chart shows 10 wafers of stable CD data, all green KPIs
3. Live streaming: new wafer every 2 seconds, points appear on chart
4. Click "Inject Fault" -> select "Sudden Shift" -> click Inject
5. Next wafer: CD jumps to ~49nm, red dot above UCL with glow
6. Violation card: "Rule 1: CD 49.1nm > UCL 48.0nm"
7. KPI strip: CD turns red
8. Lot badge: ON HOLD (amber)
9. Event log: "S2F41 STOP -> LITHO01", "S2F42 ACK (HCACK=0)"
10. Processing stops (equipment inhibited)
11. Click "Acknowledge" on violation card
12. Event log: "S2F41 RESUME -> LITHO01", "S2F42 ACK"
13. Processing resumes, chart continues with normal data
14. Switch to /mes/recipes -> try push -> works again (equipment resumed)
```

---

## Pre-Delivery Checklist

- [ ] No emoji icons -- Lucide icons throughout
- [ ] `cursor-pointer` on all clickable elements (KPIs, thumbnails, buttons, cards)
- [ ] `prefers-reduced-motion` respected (disable pulse, glow, streaming)
- [ ] Skeleton loaders on chart areas and KPI strip during initialization
- [ ] Chart crosshair on hover shows exact value
- [ ] Violation points have red glow on control chart
- [ ] UCL/LCL dashed lines + 2-sigma/3-sigma shaded bands visible
- [ ] Fake SECS payloads visible in event feed (showcase transparency)
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] Focus states visible for keyboard navigation
- [ ] Color contrast minimum 4.5:1 for all text
- [ ] Fault injection button uses AMAT Orange (#F47920)
- [ ] Navy Base (#0A1628) background throughout
- [ ] Fira Code for data values, Inter for labels
- [ ] Page loads with pre-seeded data (chart never empty)
- [ ] No backend dependencies -- works with `npm run dev` only
