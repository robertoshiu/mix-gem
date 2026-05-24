# Facility Command Center — Redesign Spec

> Replaces the current 5-sparkline layout with an industry-standard BMS war room design.

## Context

The existing Facility Systems tab shows 5 subsystem cards with unlabeled sparklines and tiny metric numbers. It doesn't communicate what's being measured or whether values are healthy. This redesign presents the same data using patterns from real Honeywell/Schneider BMS dashboards.

## Decisions

1. **Hybrid approach**: fab-relevant subsystems (EMS, BAS, Gas, Fire, Power) presented with industry-standard BMS visualization patterns
2. **Visual hierarchy**: KPI summary bar (top) + subsystem panels (middle) + event log (bottom)
3. **6 KPIs in top bar**: Comfort Index, Active Alarms, Power PUE, System Uptime, Energy Load, Gas Safety Score
4. **Trend charts**: single primary metric per subsystem with labeled Y-axis and threshold bands (green/red zones)
5. **Subsystem panels include**: trend chart + metrics row (with units) + equipment status list (2-3 items)
6. **Primary metrics**: EMS=Temp, BAS=Chiller Load, Gas=NH3, Fire=Smoke, Power=Total Load

---

## Layout

```
+-------------------------------------------------------------+
|  Header Banner (Facility Command Center + tick pill)         |
+-------------------------------------------------------------+
|  KPI Summary Bar (6 cards in a row)                          |
|  [Comfort] [Alarms] [PUE] [Uptime] [Energy] [Gas Safety]   |
+-------------------------------------------------------------+
|  Subsystem Panels (lg:grid-cols-3)                           |
|  +----------+ +----------+ +----------+                     |
|  | EMS      | | BAS      | | GAS      |                     |
|  | [chart]  | | [chart]  | | [chart]  |                     |
|  | metrics  | | metrics  | | metrics  |                     |
|  | equip    | | equip    | | equip    |                     |
|  +----------+ +----------+ +----------+                     |
|  +----------+ +----------+                                  |
|  | FIRE     | | POWER    |                                  |
|  +----------+ +----------+                                  |
+-------------------------------------------------------------+
|  Event Log (terminal-style, unchanged)                       |
+-------------------------------------------------------------+
```

Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`. Cards ~280px tall minimum.

---

## KPI Summary Bar

Six cards in `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`:

| KPI | Derivation | Format | Green | Amber | Red |
|-----|-----------|--------|-------|-------|-----|
| Comfort Index | Weighted EMS compliance: 40% temp + 30% RH + 20% particles + 10% dP | `XX.X /100` | >=90 | 75-90 | <75 |
| Active Alarms | Count of warning + critical metrics across all subsystems | `X warn / X crit` | 0 crit | warn-only | any crit |
| Power PUE | `1.2 + (load/capacity) * 0.4` | `1.XX` | <=1.4 | 1.4-1.6 | >1.6 |
| System Uptime | % of 5 subsystems in "normal" status | `XX%` | 100% | >=80% | <80% |
| Energy Load | Power subsystem load metric value | `XXX kW` | in spec | approaching cap | over cap |
| Gas Safety | Inverse-weighted gas concentrations vs TWA limits | `XX.X /100` | >=95 | 85-95 | <85 |

All derived from existing `generateSubsystemSnapshot` output. No new data generation.

---

## Subsystem Panel: Trend Chart

Each card's chart area (~160px tall), Canvas2D:

- **Green band**: `rgba(subsystemColor, 0.08)` fill between `warnLo` and `warnHi`
- **Red zones**: `rgba(239, 68, 68, 0.05)` above/below the green band
- **Threshold lines**: dashed, 0.5px, `rgba(255,255,255,0.2)`
- **Metric line**: solid, 2px, subsystem accent color
- **Y-axis**: 3-4 tick labels on left, unit shown below axis
- **Chart title**: metric label displayed top-right (e.g. "Cleanroom Temp")
- **Latest value**: dot + numeric readout at line endpoint

Primary metrics per subsystem:

| Subsystem | Chart Metric | Unit | warnLo | warnHi |
|-----------|-------------|------|--------|--------|
| EMS | Cleanroom Temp | C | 20.5 | 23.5 |
| BAS | Chiller Load | % | 50 | 90 |
| Gas | NH3 Concentration | ppm | 0 | 25 |
| Fire | Smoke Obscuration | %/m | 0 | 1.0 |
| Power | Total Load | kW | 600 | 950 |

---

## Subsystem Panel: Metrics Row

All 4 metrics displayed with value + unit inline + status dot:

```
22.1C  ●    45%  ●    800/m3  ●    12.5Pa  ●
Temp        RH         Part         dP
```

Status dot: green = normal, amber = warning, red = critical (per existing `metricStatus` logic).

---

## Subsystem Panel: Equipment Status

2-3 equipment items per subsystem with hash-driven operational status:

| Subsystem | Item 1 | Item 2 | Item 3 |
|-----------|--------|--------|--------|
| EMS | HEPA Filter Bank | Particle Monitor | Makeup Air Damper |
| BAS | Chiller-1 | AHU-3 | Coolant Pump P-2 |
| Gas | Scrubber | Gas Cabinet A | VMB Valve Panel |
| Fire | Fire Panel FP-1 | FM-200 Zone A | VESDA Detector |
| Power | UPS Battery | PDU-A | Generator G-1 |

Each shows: status icon + name + detail text

- Distribution: 80% running, 15% maintenance, 5% fault
- Detail text per equipment type: pumps show RPM, filters show dP, valves show position %, batteries show SoC

```
check HEPA Filter Bank       dP 11.8Pa
warn  Particle Monitor       Cal Due
check Makeup Air Damper      Auto 78%
```

---

## Data Engine Changes

Additive to `dashboard-facility-engine.ts`:

```typescript
// KPI pure functions
computeComfortIndex(emsSnapshot): number           // 0-100
computeGasSafetyScore(gasSnapshot): number         // 0-100
computePUE(powerSnapshot): number                  // ~1.2-1.8
countActiveAlarms(subsystems): { warnings, criticals }
computeSystemUptime(subsystems): number            // 0-100

// Equipment status
interface EquipmentStatus {
  name: string;
  status: 'running' | 'maintenance' | 'fault';
  detail: string;
}
generateEquipmentStatuses(tick, subsystemId): [EquipmentStatus, EquipmentStatus, EquipmentStatus]
```

No changes to: `mulberry32`, `hashSeed`, `generateMetricValue`, `generateSubsystemSnapshot`, `generateEvents`.

---

## Store Changes

Add computed fields to `dashboard-facility-store.ts`:

```typescript
kpis: {
  comfortIndex: number;
  activeAlarms: { warnings: number; criticals: number };
  pue: number;
  systemUptime: number;
  energyLoad: number;
  gasSafety: number;
}
equipmentStatuses: Record<SubsystemId, [EquipmentStatus, EquipmentStatus, EquipmentStatus]>
```

Computed inside `tick_()` after generating snapshots. No new history buffers.

---

## Component Changes

| File | Action |
|------|--------|
| `SubsystemCard.tsx` | Rewrite: taller card, threshold-band chart, metrics with units, equipment status |
| `FacilityTab.tsx` | Modify: add KPI bar, change grid to `lg:grid-cols-3` |
| `FacilityKpiBar.tsx` | New: 6-card KPI summary row |
| `EventFeed.tsx` | Keep as-is |
| `DashboardTabs.tsx` | Keep as-is |

---

## Test Plan

| Test File | Covers |
|-----------|--------|
| `dashboard-facility-engine.test.ts` | Add tests for KPI functions + equipment status generation |
| `SubsystemCard.test.tsx` | Update for new props (equipmentStatuses) + chart canvas |
| `FacilityKpiBar.test.tsx` | New: renders 6 KPIs, correct thresholds/colors |
| Existing integration test | Verify tab switching still works |
