# SECS/GEM Frontend Demo Design

**Date:** 2026-05-11
**Status:** Approved for implementation
**Project:** `equipment-monitor`

## Overview

Build a pure frontend SECS/GEM simulator demo inside the existing `equipment-monitor`
Next.js app. The demo lives at `/mes/secs-gem` and uses existing mock data, MES state,
SPC simulation helpers, and SECS event utilities as its datasource. It must not require
Scavenger, Docker Compose, a database, HSMS sockets, or any backend service.

## Goals

1. Add an operator-facing SECS/GEM simulator dashboard route under MES navigation.
2. Adapt existing `equipment-monitor/src/lib/*` data into simulator concepts:
   equipment instances, HSMS sessions, scenario steps, SECS messages, snapshots, and alarms.
3. Show a believable host/equipment workflow based on the approved simulator architecture:
   establish communications, collect SPC data, issue stop/resume commands, push recipes,
   and replay snapshots.
4. Keep the implementation small, testable, and consistent with the current SmartFactory UI.

## Non-Goals

- No real HSMS/SECS-II networking.
- No API routes, server actions, database writes, Redis, or Docker changes.
- No changes to the existing `/mes/spc`, war room, fab floor, or dashboard behavior beyond
  adding a navigation link.
- No full scenario authoring DSL; the demo uses curated frontend scenarios.

## Architecture

The route will be implemented as a client-side Next.js page:

```text
equipment-monitor/src/app/mes/secs-gem/page.tsx
        |
        v
equipment-monitor/src/lib/secs-gem-demo-data.ts
        |
        +-- adapts mes-mock-data.ts equipment/lots/recipes
        +-- uses secs-message-log.ts message examples
        +-- exposes deterministic snapshots and scenario steps
```

The datasource module is the boundary between existing mock data and the new page. The
page consumes view-ready objects and contains only UI state such as selected equipment,
selected scenario, replay speed, and active snapshot.

## User Experience

Add a `SECS/GEM Sim` item to `MesNavBar`. The page layout is dense and operational:

- Header strip: selected equipment, HSMS role, connection state, active lot, active recipe,
  device ID, T3/T5/T6/T7 timers, and last message time.
- Equipment/session rail: simulator equipment list with status, role, port, and current
  connection state.
- Scenario console: scenario step list, start/pause/reset controls, current step, direction,
  expected reply, and progress.
- Live SECS trace: message table with timestamp, direction, stream/function, W-bit,
  latency, system bytes, and SML-like summary.
- Replay/state panel: snapshot timeline, replay speed selector, selected snapshot state
  variables, pending transaction count, and active alarm/root-cause context.

## Data Model

The demo datasource exposes these TypeScript concepts:

- `DemoEquipment`: derived from `MOCK_EQUIPMENT`, with HSMS role, port, device ID,
  session state, and current recipe.
- `DemoScenarioStep`: id, label, actor, action, primary SxFy, expected SxFy, and status.
- `DemoSecsMessage`: timestamp, direction, stream, function, wait bit, latency, system bytes,
  raw SML summary, and parsed payload.
- `DemoSnapshot`: sequence number, timestamp, equipment state variables, pending transaction
  count, and scenario step id.
- `DemoAlarm`: selected alarm/root-cause context derived from existing equipment monitor
  mock alarms where possible.

All generated data is deterministic enough for tests. Timestamps may be anchored relative
to a fixed base time inside the datasource rather than `Date.now()` for initial fixtures.

## Error Handling

Because the demo is frontend-only, error handling focuses on empty and unknown selections:

- If no equipment is selected, select the first equipment from the datasource.
- If a selected equipment id is not found, show the first equipment instead.
- If a scenario has no messages or snapshots, render an empty state in that panel.
- Controls that have no backend effect remain local and accessible; they update page state
  only.

## Accessibility And Responsive Behavior

- Buttons use visible focus states and `aria-pressed` or labels where stateful.
- Tables include text labels and avoid color-only status communication.
- Controls meet the existing 44px touch target convention.
- Desktop uses a multi-column operator dashboard. Mobile collapses to a single-column flow:
  session summary, controls, trace, then replay/state.

## Testing

Add focused tests:

1. Datasource test verifies that the adapter returns equipment, scenario steps, messages,
   snapshots, and a valid default selected equipment.
2. Route test verifies that `/mes/secs-gem` renders the simulator title, session state,
   scenario controls, SECS trace, and replay panel.
3. Navigation test updates the existing MES nav expectations so `SECS/GEM Sim` is present.

Run targeted Jest tests first, then `npm run lint` and a production build if time permits.

## Implementation Scope

Expected file changes:

- Create `equipment-monitor/src/lib/secs-gem-demo-data.ts`.
- Create `equipment-monitor/src/lib/secs-gem-demo-data.test.ts`.
- Create `equipment-monitor/src/app/mes/secs-gem/page.tsx`.
- Create `equipment-monitor/src/app/mes/secs-gem/page.test.tsx`.
- Modify `equipment-monitor/src/components/mes/MesNavBar.tsx`.
- Modify or add navigation tests for the new link.

This is a single implementation unit: one route backed by one datasource adapter.
