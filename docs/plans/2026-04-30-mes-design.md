# MES (Manufacturing Execution System) - Design Document

**Date:** 2026-04-30
**Status:** Approved
**Author:** Brainstorming session

## Overview

A lightweight, demo/showcase MES built to complete the full stack:
**equipment-monitor (Next.js) → MES Server (FastAPI) → SECS/GEM Simulator → PostgreSQL**

**Purpose:** Portfolio showcase demonstrating real-time semiconductor equipment integration end-to-end.

**Hero moment:** Engineer selects a recipe → pushes it to equipment via SECS/GEM (S2F49) → equipment acknowledges (S2F50) → simulator fires process complete event (S6F11) → lot advances → dashboard updates live via SSE.

---

## Architecture

```
+-----------------------------------------------+
|         equipment-monitor (Next.js)            |
|  Lot Tracker  |  Recipe Manager  |  Charts     |
+-------------------+---------------------------+
                    | REST + SSE
+-------------------v---------------------------+
|              MES Server (FastAPI)              |
|   Lot Service | Recipe Service | Event Bus     |
+------+---------------------------+------------+
       | SECS/GEM (HSMS)           | Postgres
+------v-----------+   +-----------v-----------+
|  SECS/GEM Sim    |   |  PostgreSQL            |
|  (Python/secsgem)|   |  lots, recipes, events |
+------------------+   +-----------------------+
```

**Three new pieces:**
1. **MES Server** — FastAPI + asyncio, talks SECS/GEM to simulator, REST/SSE to dashboard
2. **MES DB schema** — lots, wafers, recipes, process steps, events (existing Postgres)
3. **MES UI pages** — two new pages in equipment-monitor: Lot Tracker + Recipe Manager

---

## Data Model

### Lot
```sql
lot_id        UUID PRIMARY KEY
lot_name      TEXT               -- e.g. "LOT-2026-001"
status        TEXT               -- queued | in_process | completed | on_hold
current_step  INT                -- index into PROCESS_FLOW
wafer_count   INT                -- e.g. 25
created_at    TIMESTAMPTZ
updated_at    TIMESTAMPTZ
```

### Recipe
```sql
recipe_id     UUID PRIMARY KEY
recipe_name   TEXT               -- e.g. "LITHO-193nm-v4"
equipment_id  TEXT               -- target equipment
parameters    JSONB              -- focus_offset, exposure_dose, scan_speed, etc.
created_at    TIMESTAMPTZ
```

### ProcessEvent
```sql
event_id      UUID PRIMARY KEY
lot_id        UUID REFERENCES lots
recipe_id     UUID REFERENCES recipes  -- nullable
event_type    TEXT               -- dispatched | recipe_sent | ack_received | process_complete | lot_advanced
secs_message  JSONB              -- raw S2F49 / S6F11 payload (showcase transparency)
timestamp     TIMESTAMPTZ
```

### Process Flow (static config)
```python
PROCESS_FLOW = [
    {"step": 0, "name": "Coat",    "recipe_type": "coat"},
    {"step": 1, "name": "Expose",  "recipe_type": "litho"},
    {"step": 2, "name": "Develop", "recipe_type": "develop"},
]
```

A lot tracks `current_step` as an integer index, advancing after each `process_complete` event.

---

## MES Server (FastAPI + asyncio)

**Location:** `mes-server/`
**Port:** 8001
**Docker:** added to `docker-compose.dev.yml`, depends on `postgres` and `secs-simulator`

### Lot Router `/lots`
```
POST /lots              -- create lot (name, wafer_count)
GET  /lots              -- list all lots with status
GET  /lots/{id}         -- lot detail + event history
POST /lots/{id}/advance -- manually advance step (demo control)
GET  /lots/stream       -- SSE stream of lot state changes
```

### Recipe Router `/recipes`
```
GET  /recipes           -- list available recipes
POST /recipes           -- create recipe with parameters
POST /recipes/{id}/push -- HERO ACTION: push recipe to equipment
```

### Events Router `/events`
```
GET  /events            -- recent process events (live feed UI)
```

### SECS/GEM Integration (`services/secs_client.py`)

Uses `secsgem` in active mode (MES initiates connection to simulator):

```python
async def push_recipe(recipe, equipment_id) -> bool:
    # 1. Build S2F49 Remote Command with recipe parameters
    # 2. Send via HSMS to simulator
    # 3. Await S2F50 acknowledgement
    # 4. Persist ProcessEvent to DB
    # 5. Publish lot state change to SSE event bus
```

**Event Bus:** asyncio `Queue` inside the process — no Redis needed for demo scope. SSE consumers subscribe and receive lot updates in real time.

---

## MES UI Pages (equipment-monitor)

### `/mes/lots` — Lot Tracker

Layout:
```
+--------------------------------------------------+
|  Lot Tracker                      [+ New Lot]    |
+--------------------------------------------------+
|  LOT-2026-001  25w  [Coat][Expose][Develop]  IN PROCESS  |
|  LOT-2026-002  25w  [Coat][ ][ ]            QUEUED       |
|  LOT-2026-003  25w  [Coat][Expose][Develop]  COMPLETED   |
+--------------------------------------------------+
```

- Process steps shown as React-Flow DAG: emerald thick edges (happy path), pulsing blue (current), faded (pending)
- Status badge uses existing color system: amber=queued, blue=in_process, emerald=completed
- Live updates via SSE (no polling)
- Skeleton loaders while SSE connects

### `/mes/recipes` — Recipe Manager (Hero Page)

Layout:
```
+-------------------+------------------------------+
|  Recipes          |  LITHO-193nm-v4              |
|  LITHO-193nm-v4   |  Focus Offset:  -0.05 um    |
|  COAT-std-v2      |  Exposure Dose: 28.5 mJ/cm2  |
|  DEV-alkaline-v1  |  Scan Speed:    400 mm/s     |
|                   |  Target: LITHO01             |
|                   |  Lot:    LOT-2026-001        |
|                   |                              |
|                   |  [Push Recipe to Equipment]  |  <- orange CTA
|                   +---------+--------------------+
|                   |  Live Event Feed             |
|                   |  Streaming Area Chart        |
|                   |  (message latency/throughput)|
|                   |  [Pause]                     |
|                   +---------+--------------------+
|                   |  S2F49 sent -> LITHO01       |
|                   |  S2F50 ACK received          |
|                   |  Lot advanced -> Develop     |
+-------------------+------------------------------+
```

**Nav:** Add "MES" section to existing header tabs.

---

## Design System

### Typography
- **Headings / data values / recipe params:** Fira Code (monospace, precision feel)
- **Labels / navigation / body:** Fira Sans
- Applied at root `layout.tsx` via `next/font/google`

### Colors
Extends existing equipment-monitor color system:

| Role | Color | Hex |
|------|-------|-----|
| Background | Slate 950 | `#020617` |
| Surface | Slate 900 | `#0F172A` |
| Primary action | Blue 500 | `#3B82F6` |
| Hero CTA | Orange 500 | `#F97316` |
| Normal/complete | Emerald 500 | `#10B981` |
| Warning | Amber 500 | `#F59E0B` |
| Alarm | Red 500 | `#EF4444` |
| Current step glow | Blue 400 + glow | `#60A5FA` |

### Charts
- **Live Event Feed:** Streaming Area Chart (Recharts) — message latency over time, with pause button
- **Lot Process Flow:** React-Flow DAG — directed graph of process steps
- **Existing:** Recharts line/area charts from equipment-monitor (reused for parameter trends)

### Key Effects
- Current process step: `text-shadow: 0 0 10px #60A5FA` pulsing glow
- Streaming chart: bright current value, fading opacity for history
- Transitions: 150-300ms, `transform/opacity` only (no layout-shifting)
- `prefers-reduced-motion`: disable pulse + streaming animations

---

## Pre-Delivery Checklist

- [ ] No emoji icons — Lucide icons throughout
- [ ] `cursor-pointer` on recipe cards and lot rows
- [ ] `prefers-reduced-motion` respected (disable streaming animation, pulse)
- [ ] Skeleton loaders on lot list and event feed
- [ ] Streaming Area Chart has pause button (accessibility)
- [ ] SECS/GEM raw payloads visible in event feed (showcase transparency)
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] Focus states visible for keyboard navigation
