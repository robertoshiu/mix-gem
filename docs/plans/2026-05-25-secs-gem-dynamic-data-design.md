# SECS/GEM Dynamic Data Engine Design

> Date: 2026-05-25
> Status: Approved
> Route: `/mes/secs-gem/`

## Problem

The current SECS/GEM simulator page has only 7 hardcoded messages in a single linear scenario. Once all messages play through, the feed stops. No variety, no looping, no dynamic equipment state changes.

## Goal

Build a hash-seeded simulation engine that generates ~200 unique SECS/GEM messages per 3-minute cycle across 7 message categories, with dynamic equipment state changes, rolling buffer display, and seamless auto-loop.

## Design Decisions

- **Rolling buffer (no reset)**: oldest messages drop as new ones arrive. The 3-min hash seed cycles, but users never see a "restart" moment.
- **~200 messages per 3-min cycle**: base interval ~900ms at 1x speed, ~30% of ticks produce burst pairs (request + reply), yielding ~200 total messages.
- **All data stays within container bounds**: fixed buffer caps, no overflow, no scrollbars.

---

## 1. Hash Engine Architecture

New file: `src/lib/secs-gem-sim-engine.ts`

**Seed & PRNG:**
- `mulberry32` hash function seeded from `Math.floor(Date.now() / 180_000)` (180s = 3 min)
- Each tick: `next()` hashes `(seed + tickIndex)` to pick category, hashes again for parameters
- Deterministic: same seed = same sequence, enabling seamless 3-min replay

**Tick rate:**
- Base interval: ~900ms at 1x speed
- Burst pairs: ~30% of ticks produce request + reply pair
- Speed multiplier: 0.5x=1800ms, 1x=900ms, 5x=180ms, 10x=90ms

**Data pools (hash targets):**
- `LOT_POOL`: 12 lot IDs (existing MOCK_LOTS + generated)
- `RECIPE_POOL`: 8 recipe IDs (existing MOCK_RECIPES + generated)
- `EQUIPMENT_POOL`: 6 tools from MOCK_EQUIPMENT
- `ALARM_POOL`: 10 alarm templates (message + rootCause + action)
- `SPC_PARAM_POOL`: 5 params (cd/cdu/ovl_x/ovl_y/ler) with value ranges
- `STATUS_VAR_POOL`: 8 status variables with realistic value ranges
- `TERMINAL_MSG_POOL`: 8 operator message templates

**Core API:**
```ts
generateTick(seed: number, tickIndex: number): {
  messages: DemoSecsMessage[];
  equipmentUpdates: EquipmentUpdate[];
  scenarioEvent: ScenarioEvent | null;
}
```

Pure function, no side effects, fully testable.

---

## 2. Message Categories

Weighted distribution per tick:

| Category | Weight | Msgs/cycle | Pattern |
|----------|--------|------------|---------|
| S6F11/12 Collection Events | 35% | ~70 | Burst pair (event + ack) |
| S1F3/4 Status Requests | 15% | ~30 | Burst pair (request + reply) |
| S2F41/42 Remote Commands | 12% | ~24 | Burst pair (command + ack) |
| S2F49/50 Recipe Management | 10% | ~20 | Burst pair (push + ack) |
| S5F1/2 Alarms | 10% | ~20 | Burst pair (report + ack) |
| S1F1/2 Heartbeat/Comms | 8% | ~16 | Burst pair (are-you-there + reply) |
| S10F1/2 Terminal Services | 10% | ~20 | Burst pair (display + ack) |

**Per-category hash logic:**
- **S6F11**: hash picks lot, wafer number (1-25), generates 5 SPC values with gaussian-like spread around nominal. ~5% chance of SPC breach triggering follow-up S2F41 STOP.
- **S5F1**: hash picks alarm template, equipment, severity (warning 60% / error 30% / critical 10%).
- **S2F41**: hash picks command (STOP 40% / RESUME 35% / ABORT 15% / PAUSE 10%) and reason from pool.
- **S10F1**: hash picks terminal text (lot complete, PM cycle, operator check, etc.).
- **S1F3**: hash picks 2-4 status variables to request, reply contains current simulated values.
- **S1F1/2**: simple are-you-there / online heartbeat pair.
- **S2F49**: hash picks recipe from pool, reply has success (90%) or fail (10%).

Payloads vary within same SxFy: different CEIDs (100-115), different report counts, different parameter sets.

---

## 3. Dynamic Equipment State

Each tick, alongside messages, the engine evaluates equipment state changes:

- **Connection cycling**: ~2% chance per tick an equipment toggles state (selected <-> connected <-> not_connected). At most 1 equipment changes per tick.
- **Wafer progress**: active tools advance `currentWafer` by 1 every ~10 ticks. When wafer hits total, lot switches and wafer resets to 1.
- **Recipe rotation**: when lot completes, next recipe picked from RECIPE_POOL via hash.
- **Status flips**: running->idle (~3%), idle->running (~8%), running->down (~1%), down->idle (~5%). Keeps most tools running.
- **Timer jitter**: T3/T5/T6/T7 values wiggle +/-2s each tick for visual liveliness.

Equipment sidebar always reflects live status without layout shifts.

---

## 4. Rolling Buffer Constraints

| UI Section | Buffer Cap | Behavior |
|------------|-----------|----------|
| Live SECS Trace table | 50 rows (MAX_VISIBLE_PACKETS) | FIFO: oldest row drops when 51st arrives |
| Dynamic Data Feed cards | 3 cards | Always latest 3 messages |
| Scenario Console | 4 steps | Cycles through scenario templates |
| Replay State snapshots | 4 snapshots | Overwritten in-place each scenario cycle |
| Alarm Context | 1 active alarm | Replaced when new S5F1 fires |

All containers use fixed heights or max-h with overflow-hidden. No scrollbars, no content spilling.

---

## 5. Scenario Cycling

4 scenario templates rotate based on feed events:

| Template | Steps | Trigger |
|----------|-------|---------|
| SPC Violation Flow | Establish Comms -> Collect SPC -> Inhibit Tool -> Push Recipe | Default / after SPC breach |
| Lot Changeover | Unload Lot -> Load New Lot -> Verify Recipe -> Start Process | After wafer count hits total |
| Alarm Response | Alarm Report -> Operator Ack -> Clear Alarm -> Resume | After S5F1 alarm fires |
| Preventive Maintenance | Pause Tool -> Run Diagnostics -> Update Config -> Resume Tool | ~Every 60 ticks (~1 min) |

Steps cycle `pending -> active -> complete` as matching messages arrive in feed.

Snapshot state variables update in-place reflecting live equipment state:
- Control state: Remote / Online Remote / Local
- Process state: Processing / Inhibited / Idle / Maintenance
- Active lot / Recipe: from current equipment state
- Pending transactions: 1 when active step awaits reply, 0 otherwise

Recipe Detail panel shows detail when S2F49 passes through buffer.
Alarm Context panel updates on S5F1, clears on S5F2 ack.

---

## 6. File Structure

### New files

| File | Purpose |
|------|---------|
| `src/lib/secs-gem-sim-engine.ts` | Pure-function hash engine: PRNG, pools, generateTick(), generateEquipmentUpdate() |
| `src/lib/secs-gem-sim-engine.test.ts` | Tests: determinism, distribution, burst pairs, no duplicates in 200 ticks, equipment transitions |

### Modified files

| File | Changes |
|------|---------|
| `src/lib/secs-gem-demo-data.ts` | Add pool constants, scenario templates, new alarm/terminal/status data |
| `src/lib/secs-message-log.ts` | Add builders: makeS5F1, makeS5F2, makeS1F1, makeS1F2, makeS1F3, makeS1F4, makeS10F1, makeS10F2 |
| `src/app/mes/secs-gem/page.tsx` | Replace useMemo static data with useRef rolling buffer + useEffect tick loop. Remove progress bar. Add scenario cycling. Merge equipment updates from ticks. |

### Unchanged

- All existing types (DemoSecsMessage, DemoEquipment, DemoScenarioStep, DemoSnapshot, DemoAlarm)
- All existing components (FeedPacketCard, TraceRow, ScenarioStepCard, PayloadViewer, RecipeDetailCard) — no prop changes
- Speed selector, play/pause/step/reset controls
- Animation system (secs-simulator-animation.ts)
