# MES SPC (Statistical Process Control) - Design Document

**Date:** 2026-05-01
**Status:** Approved
**Author:** Brainstorming session
**Extends:** `2026-04-30-mes-design.md` (MES base design)

## Overview

A full closed-loop SPC system extending the existing MES design. The SECS/GEM simulator generates realistic lithography metrology data per wafer, delivers it via S6F11, the MES SPC engine evaluates Western Electric rules, and on violation: auto-holds the lot and sends S2F41 STOP to inhibit the equipment. The UI provides TIBCO Spotfire x Applied Materials-styled control charts with live fault injection.

**Hero moment:** Engineer watches control chart streaming stable data -> clicks "Inject Fault: Sudden Shift" -> CD jumps above UCL -> violation card fires -> lot auto-holds -> equipment inhibits via S2F41 -> engineer acknowledges -> equipment resumes. Full closed-loop in 30 seconds.

---

## Architecture

```
+-----------------------------------------------+
|         equipment-monitor (Next.js)            |
|  Lots | Recipes | SPC Dashboard                |
+-------------------+---------------------------+
                    | REST + SSE
+-------------------v---------------------------+
|              MES Server (FastAPI)              |
|  Lot Svc | Recipe Svc | SPC Engine | Event Bus|
+------+------------------+--------+-----------+
       | SECS/GEM (HSMS)  | Postgres
+------v-----------+  +---v-------------------+
|  SECS/GEM Sim    |  |  PostgreSQL            |
|  + Metrology Gen |  |  + spc_measurements    |
|  + Fault Inject  |  |  + spc_violations      |
+------------------+  +-----------------------+
```

**New components (extending MES base):**

1. **Metrology Generator** (in simulator) -- After each process complete, generates 5 lithography measurements per wafer with configurable noise. Delivers via S6F11 collection event with CEID=100 (SPC data available). Exposes `/faults/inject` endpoint for the UI.

2. **SPC Engine** (in MES server) -- Receives metrology from simulator, stores in `spc_measurements`, evaluates Western Electric Rules 1/2/5 per parameter. On violation: creates `spc_violations` record, sets lot to `on_hold`, sends S2F41 STOP to simulator, publishes to SSE event bus.

3. **SPC Dashboard** (new Next.js page at `/mes/spc`) -- Split-view control charts with fault injection button, TIBCO x Applied Materials design system.

---

## UI Design System -- TIBCO x Applied Materials Fusion

Merges TIBCO Spotfire's information-dense data visualization and interactive crossfiltering with Applied Materials' deep navy brand, precision engineering confidence, and industrial orange accents.

### Design DNA

| Trait | TIBCO Spotfire | Applied Materials | Our Mix |
|-------|---------------|-------------------|---------|
| Density | High -- charts fill every pixel | Moderate -- corporate clean | High density with breathing room |
| Background | Medium gray `#2B2B2B` | Deep navy `#003366` | Deep navy-slate `#0A1628` |
| Accent | Data-driven multicolor | Orange `#F47920` + blue | Orange CTA + blue data + teal status |
| Charts | Interactive crossfilter, brush-select | Static KPI tiles | Interactive with live streaming |
| Typography | System sans-serif | Corporate sans | Fira Code (data) + Inter (UI) |
| Layout | Side panel filters + chart grid | Header cards + content | Left nav + split chart grid |

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

- **Data values, measurements, chart ticks:** Fira Code 400/500 -- precision monospace feel
- **Labels, nav, headings:** Inter 400/500/600 -- clean industrial readability
- **KPI big numbers:** Fira Code 600, 2rem -- TIBCO-style prominent metrics

### Key Effects

- Active chart border: `border-l-2 border-blue-500` (TIBCO's selected-panel indicator)
- Violation pulse: `box-shadow: 0 0 12px rgba(239,68,68,0.4)` on OOC data points
- Current step glow: `text-shadow: 0 0 8px #3B82F6` (subtle, not cyberpunk)
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
|  +-----------------------------------------+------------------+   |
+------------------------------------------------------------------+
```

**Layout components:**

- **KPI Strip** -- Fira Code big numbers, green/red status dot per parameter. Clicking a KPI swaps that parameter into the main chart.
- **Main Control Chart** -- Recharts ComposedChart with scatter points + reference lines (UCL/LCL dashed red, CL solid amber, +/-2 sigma shaded bands). Violation points rendered as red circles with glow. Crosshair on hover.
- **Thumbnail Row** -- 4 sparkline charts for non-active parameters + 1 Inject Fault panel. Each thumbnail shows latest value + green/red status. Click to swap into main view. Red border glow on any OOC thumbnail.
- **Inject Fault Panel** -- Dropdown with 5 fault types. Orange "Inject" button. Shows active fault status.
- **Bottom Split** -- Left: scrolling event log. Right: active violation card with rule name, affected parameter, lot, and actions taken.

**Responsive behavior:**
- >=1024px: full layout as shown
- 768px: KPI strip wraps to 2 rows, thumbnails become horizontal scroll
- 375px: single column, main chart full-width, thumbnails as swipeable row

---

## Data Model -- SPC Extension

### spc_measurements

```sql
spc_measurements (
    measurement_id    UUID PRIMARY KEY,
    lot_id            UUID REFERENCES mes_lots,
    recipe_id         UUID REFERENCES mes_recipes,
    wafer_number      INT,               -- 1..25 within lot
    parameter_name    TEXT,               -- 'cd', 'cdu', 'ovl_x', 'ovl_y', 'ler'
    value             FLOAT,             -- measured value in nm
    target            FLOAT,             -- nominal target
    ucl               FLOAT,             -- upper control limit (target + 3 sigma)
    lcl               FLOAT,             -- lower control limit (target - 3 sigma)
    in_control        BOOLEAN,           -- quick filter flag
    secs_message      JSONB,             -- raw S6F11 payload
    timestamp         TIMESTAMPTZ
);

CREATE INDEX ix_spc_measurements_lot_param
    ON spc_measurements (lot_id, parameter_name, timestamp);
```

### spc_violations

```sql
spc_violations (
    violation_id      UUID PRIMARY KEY,
    measurement_id    UUID REFERENCES spc_measurements,
    lot_id            UUID REFERENCES mes_lots,
    parameter_name    TEXT,
    rule_name         TEXT,               -- 'rule_1_beyond_3sigma',
                                          -- 'rule_2_seven_consecutive',
                                          -- 'rule_5_two_of_three_beyond_2sigma'
    description       TEXT,               -- "CD 48.3nm > UCL 48.0nm"
    action_taken      TEXT,               -- 'lot_hold', 'equipment_inhibit'
    acknowledged      BOOLEAN DEFAULT FALSE,
    timestamp         TIMESTAMPTZ
);

CREATE INDEX ix_spc_violations_lot
    ON spc_violations (lot_id, timestamp);
```

### SPC Parameter Specs (static config)

```python
SPC_PARAMETERS = {
    "cd":    {"target": 45.0, "sigma": 1.0, "unit": "nm", "label": "Critical Dimension"},
    "cdu":   {"target": 2.0,  "sigma": 0.3, "unit": "nm", "label": "CD Uniformity"},
    "ovl_x": {"target": 0.0,  "sigma": 1.0, "unit": "nm", "label": "Overlay X"},
    "ovl_y": {"target": 0.0,  "sigma": 1.0, "unit": "nm", "label": "Overlay Y"},
    "ler":   {"target": 3.0,  "sigma": 0.5, "unit": "nm", "label": "Line Edge Roughness"},
}
```

---

## SPC Engine

### Location

`mes-server/src/mes/spc/engine.py`

### Western Electric Rules

The engine evaluates three rules per parameter using a sliding window of the last 20 measurements:

**Rule 1 -- "Beyond 3 sigma"**
- Condition: ANY single point > UCL or < LCL
- Catches: sudden shift, overlay excursion

**Rule 2 -- "7 Consecutive Same Side"**
- Condition: 7+ consecutive points all above or all below center line
- Catches: gradual drift, focus degradation

**Rule 5 -- "2 of 3 Beyond 2 sigma"**
- Condition: 2 out of 3 consecutive points beyond +/-2 sigma (same side)
- Catches: increased variance

### Violation Response Sequence

```
1. Create spc_violations record
2. Set lot.status = "on_hold"
3. Create process_event (event_type="spc_violation")
4. Send S2F41 to simulator:
     RCMD = "STOP"
     CPNAME = "REASON"
     CPVAL = "SPC_VIOLATION:{parameter}:{rule}"
5. Await S2F42 ACK from simulator
6. Create process_event (event_type="equipment_inhibited")
7. Publish all events to SSE bus
```

---

## Fault Injection

### Simulator REST API

```
POST /faults/inject
{
  "fault_type": "sudden_shift",
  "parameter": "cd",
  "severity": 1.0
}

DELETE /faults/active
  -- clears active fault, returns to nominal
```

### Five Fault Types

| Fault | Affected Param | Behavior | Wafers to Trigger |
|-------|---------------|----------|-------------------|
| `sudden_shift` | CD | Adds +4nm offset instantly | 1 (Rule 1) |
| `gradual_drift` | CD | Adds +0.3nm per wafer, accumulating | ~8 (Rule 2) |
| `increased_variance` | CDU | Doubles sigma from 0.3 to 0.6 | ~3 (Rule 5) |
| `overlay_excursion` | OVL-X | Ramps +0.5nm per wafer | ~8 (Rule 2) |
| `focus_degradation` | LER | Spikes sigma from 0.5 to 1.2 | ~3 (Rule 5) |

### Normal Generation (no fault active)

```python
value = target + random.gauss(0, sigma * 0.6)
# Uses 0.6x sigma so normal operation stays well within +/-2 sigma
# Looks realistic, never accidentally triggers violations
```

Fault generation modifies the formula per type. The `severity` multiplier scales the effect.

---

## SECS/GEM Message Additions

### S6F11 -- Collection Event Report (SPC Data)

Simulator -> MES after each wafer completes:

```
S6F11 W
  <L[3]
    <U4 100>                          -- CEID 100 = SPC_DATA_AVAILABLE
    <L[5]                             -- 5 reports, one per parameter
      <L[2]
        <U4 1001>                     -- RPTID for CD
        <L[2]
          <A "cd">                    -- parameter name
          <F4 45.23>                  -- measured value (nm)
        >
      >
      <L[2]
        <U4 1002>                     -- RPTID for CDU
        <L[2]
          <A "cdu">
          <F4 1.87>
        >
      >
      ... (ovl_x, ovl_y, ler)
    >
  >
```

MES replies with S6F12 (acknowledge).

### S2F41 -- Host Command Send (Equipment Inhibit)

MES -> Simulator when SPC violation detected:

```
S2F41 W
  <L[2]
    <A "STOP">                        -- RCMD
    <L[1]
      <L[2]
        <A "REASON">                  -- CPNAME
        <A "SPC_VIOLATION:cd:rule_1"> -- CPVAL
      >
    >
  >
```

Simulator replies:

```
S2F42
  <L[2]
    <B 0x00>                          -- HCACK = 0 (accepted)
    <L[0]>                            -- no per-command errors
  >
```

### S2F41 -- Host Command Send (Equipment Resume)

MES -> Simulator when engineer acknowledges violation:

```
S2F41 W
  <L[2]
    <A "RESUME">
    <L[0]>
  >
```

### Simulator State Machine

```
                    S2F41 STOP
  PROCESSING ---------------------------> INHIBITED
       ^                                      |
       |         S2F41 RESUME                 |
       +--------------------------------------+
```

When inhibited, simulator rejects S2F49 recipe pushes with HCACK=2 (not accepted).

### MES Client Additions

```python
async def send_stop(self, reason: str) -> bool:
    """Send S2F41 STOP. Returns True on HCACK=0."""

async def send_resume(self) -> bool:
    """Send S2F41 RESUME. Returns True on HCACK=0."""

async def on_s6f11(self, callback) -> None:
    """Register callback for incoming S6F11 collection events.
    MES listens for CEID=100 (SPC data)."""
```

The MES client maintains a persistent HSMS connection (connect on startup) to listen for S6F11 events, instead of the connect-send-disconnect pattern used for recipe push.

---

## Implementation Phases

Extends the existing 12-task MES plan with 6 new tasks (Tasks 13-18).

### Phase 6: SPC Foundation

**Task 13: SPC DB models + migration**

Files:
- Create: `mes-server/src/mes/db/spc_models.py`
- Create: `mes-server/alembic/versions/0002_spc_tables.py`

Depends on: Task 2 (DB models)

**Task 14: SPC engine (rules evaluator)**

Files:
- Create: `mes-server/src/mes/spc/__init__.py`
- Create: `mes-server/src/mes/spc/engine.py`
- Create: `mes-server/src/mes/spc/parameters.py`
- Create: `mes-server/tests/test_spc_engine.py`

Depends on: Task 13

### Phase 7: Simulator SPC Extension

**Task 15: Metrology generator + fault injection**

Files:
- Create: `mes-server/src/mes/secs/metrology.py`
- Create: `mes-server/src/mes/secs/faults.py`
- Create: `mes-server/tests/test_metrology.py`

Depends on: Task 14

**Task 16: Persistent HSMS listener + S6F11->SPC pipeline + S2F41 STOP/RESUME**

Files:
- Modify: `mes-server/src/mes/secs/client.py`
- Create: `mes-server/src/mes/secs/listener.py`
- Create: `mes-server/src/mes/api/routers/spc.py`
- Create: `mes-server/tests/test_spc_pipeline.py`

Depends on: Task 7, Task 15

### Phase 8: SPC Dashboard UI

**Task 17: SPC Dashboard page (main chart + thumbnails + KPI strip)**

Files:
- Create: `equipment-monitor/src/app/mes/spc/page.tsx`
- Create: `equipment-monitor/src/components/spc/ControlChart.tsx`
- Create: `equipment-monitor/src/components/spc/KpiStrip.tsx`
- Create: `equipment-monitor/src/components/spc/ThumbnailChart.tsx`
- Create: `equipment-monitor/src/lib/spc-api.ts`

Depends on: Task 9 (Lot page patterns)

**Task 18: Fault injection panel + violation card + event log integration**

Files:
- Create: `equipment-monitor/src/components/spc/FaultInjector.tsx`
- Create: `equipment-monitor/src/components/spc/ViolationCard.tsx`
- Modify: `equipment-monitor/src/app/mes/spc/page.tsx`

Depends on: Task 17

### Task Execution Order

```
Existing Plan                    SPC Extension
-----------------                -------------
Tasks 1-3 (Server + DB + Alembic)
Tasks 4-5 (Lot + Recipe CRUD)
Tasks 6-7 (Event Bus + S2F49)
Task 8    (Docker)
                          -->    Task 13 (SPC models)
                          -->    Task 14 (SPC engine)
                          -->    Task 15 (Metrology + faults)
                          -->    Task 16 (HSMS listener + pipeline)
Tasks 9-11 (UI pages + nav)
                          -->    Task 17 (SPC Dashboard)
Task 12   (Seed data)
                          -->    Task 18 (Fault panel + violations)
```

Tasks 13-16 (backend) can run in parallel with Tasks 9-11 (existing UI).

---

## Updated Hero Demo Flow

```
1. Open /mes/recipes -> push LITHO-193nm-v4 to LOT-2026-001
2. Open /mes/spc -> watch control chart populate as wafers process
3. All 5 parameters stable, green KPIs
4. Click "Inject Fault" -> select "Sudden Shift" -> click Inject
5. Watch CD chart: next wafer point jumps above UCL
6. Violation card appears: "Rule 1: CD 49.1nm > UCL 48.0nm"
7. Lot status flips to ON HOLD (amber badge)
8. Event log: S2F41 STOP -> LITHO01, equipment inhibited
9. Switch to /mes/recipes -> try pushing recipe -> NACK (equipment inhibited)
10. Return to /mes/spc -> acknowledge violation -> equipment resumes
```

---

## Pre-Delivery Checklist

- [ ] No emoji icons -- Lucide icons throughout
- [ ] `cursor-pointer` on all clickable elements (KPIs, thumbnails, buttons)
- [ ] `prefers-reduced-motion` respected (disable pulse, glow, streaming animation)
- [ ] Skeleton loaders on chart areas and KPI strip
- [ ] Streaming chart has pause button (accessibility)
- [ ] SECS/GEM raw payloads visible in event feed (showcase transparency)
- [ ] Violation points have red glow effect on control chart
- [ ] UCL/LCL dashed lines + 2-sigma/3-sigma shaded bands visible
- [ ] Crosshair on hover shows exact value (TIBCO signature)
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] Focus states visible for keyboard navigation
- [ ] Color contrast minimum 4.5:1 for all text
- [ ] Fault injection button uses AMAT Orange (#F47920)
- [ ] Navy Base (#0A1628) background throughout SPC page
- [ ] Fira Code for all data values, Inter for labels
