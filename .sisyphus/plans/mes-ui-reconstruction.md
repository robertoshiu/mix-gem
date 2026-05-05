# MES UI Reconstruction & Bug Fixes

## TL;DR

> **Quick Summary**: Fix gauge overflow, replace company logo, and enhance the SPC dashboard to match 3 Applied SmartFactory reference screenshots — semicircular speedometer gauges, richer AI recommendations with confidence scores, process flow with yield percentages, wafer bin map, heatmap table, and footer status bar. All in dark theme.
> 
> **Deliverables**:
> - Optimized company logo in header (replacing "AM" text placeholder)
> - Overflow-proof `GaugeCard` for equipment dashboard
> - Redesigned `KpiGaugeCard` as semicircular speedometer gauges with colored zones and needles
> - Enhanced `ProcessFlow` with yield percentages at each step
> - Enhanced `AiRecommendations` with confidence scores and CTAs
> - New `WaferBinMap` component
> - New `HeatmapTable` component
> - Enhanced `FooterStatusBar` with system info
> - New mock data generators for yield, defects, and wafer maps
> - All changes verified via `next build` and agent-executed QA
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Task 1 (logo) → Task 5 (SPC page integration) → Task 7 (build verification) → F1-F4

---

## Context

### Original Request
1. Fix GitHub Pages navbar not showing on root page (COMPLETED in prior session)
2. Rename "Applied SmartFactory" → "Better SmartFactory" (COMPLETED)
3. Fix duplicate NAV_ITEMS, make root page show navbar, add company icon, fix 3D view clickability (COMPLETED)
4. Replace placeholder icon with actual company logo, fix gauge overflow, high-fidelity MES UI/UX reconstruction matching Applied SmartFactory reference screenshots

### Interview Summary
**Key Discussions**:
- **Theme**: Dark theme unified — keep current dark navy, interpret all reference elements in dark theme
- **Page mapping**: Enhance existing `/mes/spc` page with elements from all 3 references (EMS, Yield, CoWoS)
- **3D fab floor map**: CSS isometric enhancement only (no Three.js/WebGL)
- **Gauge style**: Speedometer for SPC page, half-arc (overflow-fixed) for dashboard
- **Test strategy**: No unit tests, agent-executed QA only
- **Logo**: Optimize 7.3MB PNG to <50KB, display at 48-64px height

**Research Findings**:
- Logo (`better-logo.png`) is 7.3MB circular gradient with "BETTER" + subtitle – illegible at 32px, needs 48-64px minimum
- `GaugeCard`: 100×60 SVG half-arc, `text-2xl` overflows for values like "+1205.0" (etch equipment)
- `KpiGaugeCard`: 64×64 circle, `text-[1.25rem]` overflows for values like "+2.35" or "-1.87"
- Existing components: ProcessFlow, AiRecommendations, WipDonutChart, FooterStatusBar, FabFloorMap – enhancement needed, not greenfield
- `public/` has only default Next.js SVGs + new `better-logo.png`
- `basePath: '/mix-gem'` required for all asset references
- `images: { unoptimized: true }` means no Next.js Image optimization

### Metis Review
**Identified Gaps** (addressed):
- Theme conflict across 3 references → RESOLVED: Dark theme unified
- 7.3MB logo perf disaster → RESOLVED: Mandate optimization to <50KB
- "3D fab floor" scope creep → RESOLVED: CSS isometric only, no WebGL
- Gauge value ranges unbounded → RESOLVED: Dynamic font scaling + truncation for 4+ digits
- New mock data shapes needed (yield, defects, wafer) → RESOLVED: Isolated generators in mes-mock-data.ts
- Existing test files found → RESOLVED: Leave untouched, don't delete

---

## Work Objectives

### Core Objective
High-fidelity MES UI reconstruction matching Applied SmartFactory references, with bug fixes for gauge overflow and company logo replacement. Dark theme only. No new pages or backend changes.

### Concrete Deliverables
- `equipment-monitor/public/better-logo.png` optimized to <50KB
- `equipment-monitor/src/components/layout/header.tsx` updated with logo image
- `equipment-monitor/src/components/charts/gauge-card.tsx` overflow-fixed half-arc gauge
- `equipment-monitor/src/components/spc/KpiGaugeCard.tsx` redesigned as speedometer gauges
- `equipment-monitor/src/components/spc/ProcessFlow.tsx` enhanced with yield percentages
- `equipment-monitor/src/components/spc/AiRecommendations.tsx` enhanced with confidence scores
- `equipment-monitor/src/components/spc/WaferBinMap.tsx` new component
- `equipment-monitor/src/components/spc/HeatmapTable.tsx` new component  
- `equipment-monitor/src/components/spc/FooterStatusBar.tsx` enhanced with system info
- `equipment-monitor/src/lib/mes-mock-data.ts` new yield/defect/wafer mock generators
- `equipment-monitor/src/lib/mes-types.ts` new type definitions
- `equipment-monitor/src/app/mes/spc/page.tsx` integrated SPC dashboard

### Definition of Done
- [x] `cd equipment-monitor && npm run build` exits 0
- [x] All gauge values display without text overflow at 1920×1080
- [x] Company logo renders in header at readable size
- [x] SPC dashboard shows speedometer gauges with colored zones
- [x] Process flow shows yield percentages at each step
- [x] AI recommendation cards show confidence percentages
- [x] Wafer bin map renders colored die grid
- [x] Heatmap table renders color-coded cells
- [x] Footer status bar shows system version, AI status, device count

### Must Have
- Logo displays in header replacing "AM" text placeholder
- GaugeCard displays values from -999.9 to +9999.9 without overflow
- KpiGaugeCard speedometers show green/yellow/red zones with needle position
- All new components use existing SmartFactory CSS tokens (no hardcoded hex)
- All asset paths account for `basePath: '/mix-gem'`
- Static export (`next build`) succeeds with zero errors

### Must NOT Have (Guardrails)
- No Three.js, WebGL, or any 3D rendering library
- No backend API changes or database schema changes
- No new page routes (only enhance existing `/mes/spc`)
- No deletion of existing `.test.tsx` files
- No new chart libraries (Recharts only)
- No hardcoded hex colors — use CSS variables/tokens from `globals.css`
- No light theme toggle or dual-theme system
- No i18n or mobile breakpoint changes
- No breaking changes to Zustand store interface (add new properties as optional)
- No `next.config.ts` modifications without explicit justification

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Jest/Vitest test files exist)
- **Automated tests**: NO (per user request)
- **Framework**: None (no new test files)
- **Existing tests**: Leave untouched, don't delete

### QA Policy
Every task MUST include agent-executed QA scenarios. Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright (playwright skill) — Navigate, interact, assert DOM, screenshot
- **Build verification**: Use Bash — `cd equipment-monitor && npm run build`
- **Asset verification**: Use Bash — check file sizes, paths, references

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately - foundation + independent fixes):
├── Task 1: Optimize & integrate company logo [quick]
├── Task 2: Fix GaugeCard overflow for equipment dashboard [quick]
├── Task 3: Create new mock data generators & types [quick]
├── Task 4: Redesign KpiGaugeCard as speedometer [deep]
└── Task 5: Enhance ProcessFlow with yield percentages [quick]

Wave 2 (After Wave 1 - new components, parallel):
├── Task 6: Build WaferBinMap component [unspecified-high]
├── Task 7: Build HeatmapTable component [unspecified-high]
├── Task 8: Enhance AiRecommendations with confidence + CTAs [unspecified-high]
└── Task 9: Enhance FooterStatusBar with system info [quick]

Wave 3 (After Wave 2 - integration):
└── Task 10: Integrate all components into SPC dashboard page [deep]

Wave FINAL (After Task 10 — 4 parallel reviews):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA with Playwright (unspecified-high)
└── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay

Critical Path: Task 1 → Task 10 → Wave FINAL
Parallel Speedup: ~55% faster than sequential
Max Concurrent: 5 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1 | — | 10 |
| 2 | — | — |
| 3 | — | 4, 6, 7, 8 |
| 4 | 3 | 10 |
| 5 | — | 10 |
| 6 | 3 | 10 |
| 7 | 3 | 10 |
| 8 | — | 10 |
| 9 | — | 10 |
| 10 | 1, 4, 5, 6, 7, 8, 9 | F1-F4 |
| F1-F4 | 10 | — |

### Agent Dispatch Summary

- **Wave 1**: **5** — T1 → `quick`, T2 → `quick`, T3 → `quick`, T4 → `deep`, T5 → `quick`
- **Wave 2**: **4** — T6 → `unspecified-high`, T7 → `unspecified-high`, T8 → `unspecified-high`, T9 → `quick`
- **Wave 3**: **1** — T10 → `deep`
- **FINAL**: **4** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. Optimize & Integrate Company Logo

  **What to do**:
  - Optimize `public/better-logo.png` (currently 7.3MB) — resize to max 200px wide, compress to PNG <50KB (use sharp or similar, or manually resize)
  - In `header.tsx`, replace the `<div className="w-8 h-8 rounded bg-[var(--smartfactory-accent-blue)]">AM</div>` box and `<Zap>` icon with the optimized logo image
  - Use a standard `<img>` tag (not Next `<Image>` since `images.unoptimized: true`) with `src="/mix-gem/better-logo.png"` (accounting for basePath)
  - Set logo display size to approximately `h-10 w-10` (40px) or `h-12` (48px) — the circular logo needs at least 40px to be legible
  - Remove the `Zap` import from `header.tsx` since it's no longer used
  - Keep the "Equipment Monitor" title and "Better SmartFactory" subtitle text below/beside the logo

  **Must NOT do**:
  - Do NOT use Next.js `<Image>` component (unnecessary with `unoptimized: true`)
  - Do NOT remove the clock, notification bell, settings, or user avatar from the header
  - Do NOT change header height from `h-14`
  - Do NOT hardcode `/better-logo.png` — must use `/mix-gem/better-logo.png` for static export

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4, 5)
  - **Blocks**: Task 10
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `equipment-monitor/src/components/layout/header.tsx:66-78` — Current logo area with "AM" text box and Zap icon (EXACT replacement target)
  - `equipment-monitor/public/better-logo.png` — The logo file to optimize and integrate

  **API/Type References**:
  - `equipment-monitor/next.config.ts` — Contains `basePath: '/mix-gem'` and `images: { unoptimized: true }` (must account for in asset paths)

  **WHY Each Reference Matters**:
  - `header.tsx:66-78`: This is the exact code block being replaced. The new logo must fit within the same flexbox layout alongside the title text.
  - `next.config.ts`: basePath changes all static asset URLs. Using `/better-logo.png` will 404 on GitHub Pages; must use `/mix-gem/better-logo.png`.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Logo displays in header at readable size
    Tool: Playwright
    Preconditions: Dev server running at http://localhost:3000/mix-gem/
    Steps:
      1. Navigate to http://localhost:3000/mix-gem/
      2. Wait for header to render (timeout: 10s)
      3. Select the logo image element: `img[alt*="Better"]` or `img[src*="better-logo"]`
      4. Assert element is visible
      5. Assert bounding box height is >= 36px (legible)
      6. Assert bounding box width is >= 36px
    Expected Result: Logo image renders in header with visible dimensions ≥ 36×36px
    Failure Indicators: Logo not found, 0×0 dimensions, broken image icon
    Evidence: .sisyphus/evidence/task-1-logo-header.png

  Scenario: Logo image loads without 404
    Tool: Bash (curl)
    Preconditions: Static export built
    Steps:
      1. Run `cd equipment-monitor && npm run build`
      2. Check that `out/better-logo.png` exists and file size is < 50KB
      3. Run `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/mix-gem/better-logo.png` (if serving)
      4. Assert HTTP 200 response
    Expected Result: Logo file exists in output, accessible at correct basePath URL
    Failure Indicators: File missing, >50KB, HTTP 404
    Evidence: .sisyphus/evidence/task-1-logo-asset.txt
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(ui): optimize and integrate company logo in header`
  - Files: `equipment-monitor/public/better-logo.png`, `equipment-monitor/src/components/layout/header.tsx`
  - Pre-commit: `cd equipment-monitor && npm run build`

- [x] 2. Fix GaugeCard Overflow for Equipment Dashboard

  **What to do**:
  - In `equipment-monitor/src/components/charts/gauge-card.tsx`, fix the text overflow in the value display area
  - Change SVG viewBox from `"0 0 100 60"` to `"0 0 120 70"` (increase width by 20% to accommodate wider values)
  - Update arc path from `M 10 50 A 40 40 0 0 1 90 50` to `M 10 60 A 40 40 0 0 1 110 60` (wider arc)
  - Add dynamic font sizing: use `text-lg` (1.125rem) as default, but switch to `text-sm` (0.875rem) when value string (including sign, decimals, unit) exceeds 6 characters
  - Add `overflow-hidden` and `text-ellipsis` to the value container for safety
  - Ensure the unit text (`{unit}`) wraps to its own line if value is long (use `flex-col` instead of inline)
  - Test with extreme values: "+1205.0" (etch Chamber Pressure), "+847.0" (etch RF Power), "-30.5" (focus offset)

  **Must NOT do**:
  - Do NOT change the gauge visual style (keep half-arc, not speedometer — speedometer is for SPC only)
  - Do NOT modify KpiGaugeCard (that's Task 4)
  - Do NOT change any data values or mock data

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4, 5)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `equipment-monitor/src/components/charts/gauge-card.tsx` — The exact file being modified (all changes in this file)
  - `equipment-monitor/src/lib/mock-data.ts` — Contains `scannerParameters` and `etchParameters` with values that trigger overflow (e.g., Chamber Pressure 847, RF Power 1205)

  **WHY Each Reference Matters**:
  - `gauge-card.tsx`: This is the sole file to modify. Lines 44-46 define SVG dimensions (radius=40, viewBox 100×60), and lines 84-89 define the text positioning that overflows.
  - `mock-data.ts`: Contains the actual data values that cause overflow. Must test with these values to verify the fix.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Large gauge values display without overflow
    Tool: Playwright
    Preconditions: Dev server running, navigate to http://localhost:3000/mix-gem/
    Steps:
      1. Select an equipment item that uses etch parameters (or mock etch parameters)
      2. Find all `[data-testid="gauge-grid"] > div` gauge cards
      3. For each gauge card, get the value text element bounding box
      4. For each gauge card, get the SVG container bounding box
      5. Assert value text bounding box width <= SVG container width + 4px tolerance
    Expected Result: No gauge value text overflows its container
    Failure Indicators: Value text width exceeds container width by >4px
    Evidence: .sisyphus/evidence/task-2-gauge-overflow.txt

  Scenario: Negative and large values render correctly
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Navigate to http://localhost:3000/mix-gem/
      2. Inspect gauge cards for values like "-30.5", "+1205.0", "+847.0"
      3. Assert each value text is fully visible (not clipped, not wrapping to next line)
      4. Assert unit text is visible and not overlapping the value
    Expected Result: All values display fully with readable units beside them
    Failure Indicators: Text clipped, overlapping, or wrapping to newline
    Evidence: .sisyphus/evidence/task-2-gauge-extreme-values.png
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `fix(ui): prevent gauge text overflow for large and negative values`
  - Files: `equipment-monitor/src/components/charts/gauge-card.tsx`
  - Pre-commit: `cd equipment-monitor && npm run build`

- [x] 3. Create New Mock Data Generators & Type Definitions

  **What to do**:
  - In `equipment-monitor/src/lib/mes-types.ts`, add new type definitions:
    - `YieldTrendPoint`: `{ date: string; overallYield: number; targetYield: number }`
    - `DefectRecord`: `{ type: string; count: number; cumulativePercent: number }`
    - `WaferDie`: `{ row: number; col: number; status: 'pass' | 'fail' | 'retest' | 'not_tested' }`
    - `ProcessStepYield`: `{ name: string; yield: number; status: 'running' | 'warning' | 'alarm' }`
    - `HeatmapCell`: `{ lot: string; param: string; value: number; status: 'ok' | 'warning' | 'alarm' }`
    - `ConfidenceLevel`: number (0-100)
  - In `equipment-monitor/src/lib/mes-mock-data.ts`, add new mock data generators:
    - `generateYieldTrend(days: number)`: Returns array of `YieldTrendPoint` for past N days
    - `generateDefectPareto()`: Returns top 5 `DefectRecord`s sorted by count
    - `generateWaferMap()`: Returns 2D grid of `WaferDie` objects (circular pattern mimicking real wafer)
    - `generateProcessYields()`: Returns `ProcessStepYield[]` for 5 manufacturing steps (Interposer Fab → TSV Formation → Die Bonding → Warpage Test → KGD Test)
    - `generateHeatmapData()`: Returns `HeatmapCell[]` for 6 lots × 4 parameters
  - Use all existing SmartFactory CSS variable tokens for status colors (don't hardcode hex)

  **Must NOT do**:
  - Do NOT modify the existing `SpcMeasurement`, `EquipmentStatus`, or other types in mes-types.ts
  - Do NOT modify the existing Zustand store interface in a breaking way
  - Do NOT import these new types into existing components yet (Task 10 handles integration)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4, 5)
  - **Blocks**: Tasks 4, 6, 7, 8
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `equipment-monitor/src/lib/mes-types.ts` — Existing type definitions (add new types following same pattern)
  - `equipment-monitor/src/lib/mes-mock-data.ts` — Existing mock data generators (add new generators following same pattern)
  - `equipment-monitor/src/lib/spc-parameters.ts` — SPC parameter config (reference for realistic ranges)

  **WHY Each Reference Matters**:
  - `mes-types.ts`: Must follow existing TypeScript patterns (export interface, union types for status). New types should be additive, not modify existing ones.
  - `mes-mock-data.ts`: Must follow the same `generate*` naming pattern and return realistic semiconductor manufacturing data (yield 85-99%, defect types like "Particle", "Scratch", "CD Variation", etc.)
  - `spc-parameters.ts`: Provides realistic ranges for SPC data (CD target 45nm, CDU target 2.0nm, etc.) — use these as references for realistic mock values.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: New types compile and export correctly
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run `cd equipment-monitor && npx tsc --noEmit`
      2. Assert exit code 0 (no type errors)
      3. Run `cd equipment-monitor && node -e "const m = require('./src/lib/mes-mock-data'); console.log(Object.keys(m).filter(k => k.startsWith('generate')))"` to verify new generators exist
    Expected Result: TypeScript compilation succeeds, all new generators are exported
    Failure Indicators: TypeScript errors, missing exports
    Evidence: .sisyphus/evidence/task-3-types-compile.txt

  Scenario: Mock data generators produce realistic values
    Tool: Bash
    Preconditions: Dev server or node available
    Steps:
      1. Import `generateYieldTrend`, `generateDefectPareto`, `generateWaferMap`, `generateProcessYields`, `generateHeatmapData`
      2. Call each generator and assert ranges:
        - `generateYieldTrend(30)`: yield values 70-100, array length 30
        - `generateDefectPareto()`: 5 items, sorted descending by count
        - `generateWaferMap()`: circular pattern (edge dies are 'not_tested'), counts match realistic wafer (~200-300 dies)
        - `generateProcessYields()`: 5 steps, yields 75-99%
        - `generateHeatmapData()`: 6 lots × 4 params = 24 cells
    Expected Result: All generators produce data with valid ranges and correct lengths
    Failure Indicators: Out-of-range values, wrong array lengths, missing fields
    Evidence: .sisyphus/evidence/task-3-mock-data.txt
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(spc): add yield, defect, wafer map mock data and types`
  - Files: `equipment-monitor/src/lib/mes-types.ts`, `equipment-monitor/src/lib/mes-mock-data.ts`
  - Pre-commit: `cd equipment-monitor && npx tsc --noEmit`

- [x] 4. Redesign KpiGaugeCard as Semicircular Speedometer

  **What to do**:
  - Replace the current `KpiGaugeCard.tsx` circular progress ring design with a semicircular speedometer gauge matching the CoWoS reference:
    - Semicircular arc (180°) with colored zones: green (0-60% of range), yellow (60-80%), red (80-100%)
    - Needle/pointer pointing to current value position on the arc
    - Large value display centered below the arc
    - Status indicator (OK/OOC) beside the value
    - Sub-metrics: Target, Sigma, Delta (below the value)
  - Increase the SVG container size from 64×64 to at least 120×80 to accommodate speedometer proportions
  - Add dynamic font sizing for the value: `text-xl` for ≤4 chars, `text-base` for 5-6 chars, `text-sm` for >6 chars
  - Use existing SmartFactory CSS tokens for zone colors: `--smartfactory-status-green`, `--smartfactory-status-amber`, `--smartfactory-status-red`
  - Keep the sparkline and delta trend arrow (they're in the reference too)
  - Keep the `onParamSelect` interaction and `isActive` visual state

  **Must NOT do**:
  - Do NOT change GaugeCard (that's Task 2)
  - Do NOT add any new chart library — use SVG only
  - Do NOT hardcode hex colors
  - Do NOT break the existing `KpiGaugeCardProps` interface (add new props as optional)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (depends only on Task 3 for types)
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 5)
  - **Blocks**: Task 10
  - **Blocked By**: Task 3 (new types)

  **References**:

  **Pattern References**:
  - `equipment-monitor/src/components/spc/KpiGaugeCard.tsx` — The exact file being redesigned (current circular ring design)
  - `equipment-monitor/src/lib/spc-parameters.ts` — SPC parameter config (provides lcl, ucl, target, sigma for gauge zone calculation)

  **API/Type References**:
  - `equipment-monitor/src/lib/mes-types.ts` — New types from Task 3 (if gauge needs new prop types)

  **WHY Each Reference Matters**:
  - `KpiGaugeCard.tsx`: This is the sole file being redesigned. Current design has circular progress ring (radius 28, 64×64 container). New design must be semicircular speedometer with colored zones and needle.
  - `spc-parameters.ts`: Provides `lcl`, `ucl`, `target`, `sigma` for each SPC parameter — these define the green/yellow/red zone boundaries for the speedometer.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Speedometer gauges render with colored zones and needle
    Tool: Playwright
    Preconditions: Dev server running at http://localhost:3000/mix-gem/mes/spc/
    Steps:
      1. Navigate to http://localhost:3000/mix-gem/mes/spc/
      2. Wait for KPI gauge cards to render
      3. For each gauge card (`[data-testid^="kpi-gauge-"]`):
        a. Assert SVG element contains `<path>` or `<line>` elements (arc and needle)
        b. Assert there are at least 2 distinct stroke colors on arc paths (green zone + yellow/red zone)
        c. Assert the value text is visible and not clipped
    Expected Result: Each of the 5 SPC gauges shows a semicircular arc with colored zones and a needle indicator
    Failure Indicators: Missing SVG paths, no colored zones, text overflow, circular ring still showing
    Evidence: .sisyphus/evidence/task-4-speedometer-gauges.png

  Scenario: Gauge values display without overflow for edge cases
    Tool: Playwright
    Preconditions: Dev server running with SPC page loaded
    Steps:
      1. Navigate to http://localhost:3000/mix-gem/mes/spc/
      2. Find all gauge value text elements
      3. For each gauge card, assert value text bounding box is within the card bounding box (no overflow)
      4. Specifically check for negative values (ovl_x, ovl_y can be negative)
    Expected Result: All gauge values display fully without text overflow
    Failure Indicators: Value text exceeds card boundaries
    Evidence: .sisyphus/evidence/task-4-speedometer-overflow.txt
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(spc): redesign KPI gauges as semicircular speedometers with colored zones`
  - Files: `equipment-monitor/src/components/spc/KpiGaugeCard.tsx`
  - Pre-commit: `cd equipment-monitor && npm run build`

- [x] 5. Enhance ProcessFlow with Yield Percentages

  **What to do**:
  - In `equipment-monitor/src/components/spc/ProcessFlow.tsx`, enhance the existing 5-step process flow to show yield percentages at each step
  - Each step should display: step name, current yield percentage, and a color-coded status indicator (green ≥95%, yellow 85-95%, red <85%)
  - Add yield labels like "96.5%" in each process step box
  - Keep the horizontal layout with arrows between steps
  - Use `generateProcessYields()` from Task 3 for data (or wire to store data)
  - Keep the existing click interaction and state management

  **Must NOT do**:
  - Do NOT change the step order (COAT → EXPOSE → DEVELOP → METROLOGY → SPC)
  - Do NOT add new pages or navigation — stays inline in SPC page
  - Do NOT hardcode yield values — use mock data generator

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 4)
  - **Blocks**: Task 10
  - **Blocked By**: None (can start with placeholder data, wire generator later)

  **References**:

  **Pattern References**:
  - `equipment-monitor/src/components/spc/ProcessFlow.tsx` — Current process flow component to enhance (shows COAT → EXPOSE → DEVELOP → METROLOGY → SPC)

  **API/Type References**:
  - `equipment-monitor/src/lib/mes-types.ts` — `ProcessStepYield` type from Task 3

  **WHY Each Reference Matters**:
  - `ProcessFlow.tsx`: This is the component being enhanced. Currently shows 5 steps with status badges but no yield percentages. Must add yield% and color-coded indicators within each step.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Process flow shows yield percentages with color coding
    Tool: Playwright
    Preconditions: Dev server running at http://localhost:3000/mix-gem/mes/spc/
    Steps:
      1. Navigate to http://localhost:3000/mix-gem/mes/spc/
      2. Find the ProcessFlow component
      3. For each step element, assert yield percentage text is visible (matches pattern /\d+\.\d+%/)
      4. Assert each step has a color indicator (green/yellow/red based on yield threshold)
    Expected Result: Each of the 5 process steps shows a yield percentage with correct color coding
    Failure Indicators: Missing yield text, no color indicators, steps not visible
    Evidence: .sisyphus/evidence/task-5-process-flow-yields.png
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(spc): add yield percentages to process flow steps`
  - Files: `equipment-monitor/src/components/spc/ProcessFlow.tsx`
  - Pre-commit: `cd equipment-monitor && npm run build`

---

- [x] 6. Build WaferBinMap Component

  **What to do**:
  - Create new file `equipment-monitor/src/components/spc/WaferBinMap.tsx`
  - Render a circular wafer map as an SVG grid of die cells, where each cell is colored based on status:
    - Green (`--smartfactory-status-green`): Pass
    - Red (`--smartfactory-status-red`): Fail
    - Yellow/Amber (`--smartfactory-status-amber`): Retest
    - Gray (`--smartfactory-text-muted`): Not Tested
  - The grid should form a circular pattern (edge dies culled) mimicking a real silicon wafer
  - Include a legend showing color → label mapping (Pass/Fail/Retest/Not Tested)
  - Add a title showing lot ID (e.g., "Wafer Map — Lot A03")
  - Use `generateWaferMap()` from Task 3 for die data
  - Make the component responsive but readable at 1920×1080

  **Must NOT do**:
  - Do NOT use any chart library — pure SVG only
  - Do NOT hardcode hex colors — use CSS variable tokens
  - Do NOT create a new page route — this component integrates into SPC page in Task 10

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7, 8, 9)
  - **Blocks**: Task 10
  - **Blocked By**: Task 3 (needs `WaferDie` type and `generateWaferMap()`)

  **References**:

  **Pattern References**:
  - `equipment-monitor/src/components/spc/WipDonutChart.tsx` — Existing donut chart component (reference for SVG rendering pattern in this codebase)
  - `equipment-monitor/src/components/charts/gauge-card.tsx` — SVG rendering pattern (reference for arc/path drawing approach)

  **API/Type References**:
  - `equipment-monitor/src/lib/mes-types.ts` — `WaferDie` type from Task 3
  - `equipment-monitor/src/lib/mes-mock-data.ts` — `generateWaferMap()` from Task 3

  **External References**:
  - Reference screenshot `MES_Applied.png` — Shows circular die-level wafer bin map with Pass (green), Fail (red), Retest (yellow), Not tested (gray) cells

  **WHY Each Reference Matters**:
  - `WipDonutChart.tsx`: Shows how SVG visualizations are structured in this codebase — container sizing, CSS variable usage, responsive layout. Follow the same patterns.
  - `mes-types.ts` + `mes-mock-data.ts`: Provides the data contract (`WaferDie` with row/col/status) and generator function that this component must consume.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Wafer bin map renders circular die grid with color coding
    Tool: Playwright
    Preconditions: Dev server running, SPC page loaded (component rendered in Task 10 integration)
    Steps:
      1. Navigate to http://localhost:3000/mix-gem/mes/spc/
      2. Find the WaferBinMap component (data-testid="wafer-bin-map")
      3. Assert the SVG grid contains die cells (rect or path elements)
      4. Assert at least 3 distinct fill colors are present (green, red, yellow/amber, or gray)
      5. Assert legend is visible with "Pass", "Fail" labels
    Expected Result: Circular wafer map renders with colored die cells and legend
    Failure Indicators: No SVG rendered, no color variation, missing legend
    Evidence: .sisyphus/evidence/task-6-wafer-bin-map.png
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(spc): add wafer bin map component with die-level color coding`
  - Files: `equipment-monitor/src/components/spc/WaferBinMap.tsx`
  - Pre-commit: `cd equipment-monitor && npx tsc --noEmit`

- [x] 7. Build HeatmapTable Component

  **What to do**:
  - Create new file `equipment-monitor/src/components/spc/HeatmapTable.tsx`
  - Render a table where each cell's background color corresponds to the parameter's status:
    - Green (`--smartfactory-status-green/10`): OK (value within spec)
    - Yellow/Amber (`--smartfactory-status-amber/10`): Warning (approaching limits)
    - Red (`--smartfactory-status-red/10`): Alarm (out of spec)
  - Rows represent lots (CoWoS-A01 through A06), columns represent parameters (Yield, TSV Pass, Bonding, Warpage, KGD)
  - Include "Overall Status" column with pill badges: PASS (green), MONITOR (amber), HOLD (red)
  - Use `generateHeatmapData()` from Task 3 for data
  - Table headers should be sticky for scrolling
  - Match the CoWoS reference's heatmap table style (color-coded cells with values)

  **Must NOT do**:
  - Do NOT use any external table library — plain HTML table with Tailwind
  - Do NOT hardcode hex colors
  - Do NOT create new page routes

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 8, 9)
  - **Blocks**: Task 10
  - **Blocked By**: Task 3 (needs `HeatmapCell` type and `generateHeatmapData()`)

  **References**:

  **Pattern References**:
  - `equipment-monitor/src/app/mes/lots/page.tsx` — Existing lot tracking table (reference for table styling and data display patterns)
  - `equipment-monitor/src/components/spc/ViolationCard.tsx` — Status badge pattern (OK/OOC) with color coding

  **API/Type References**:
  - `equipment-monitor/src/lib/mes-types.ts` — `HeatmapCell` type from Task 3
  - `equipment-monitor/src/lib/mes-mock-data.ts` — `generateHeatmapData()` from Task 3

  **External References**:
  - Reference screenshot `CoWoS_Applied.png` — Shows heatmap table with color-coded cells and "PASS"/"MONITOR"/"HOLD" status pills

  **WHY Each Reference Matters**:
  - `lots/page.tsx`: Shows how tables are styled in this codebase — sticky headers, row interactions, responsive patterns.
  - `ViolationCard.tsx`: Shows the color-coded status badge pattern that the "Overall Status" column should follow.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Heatmap table renders with color-coded cells and status badges
    Tool: Playwright
    Preconditions: Dev server running, SPC page loaded (after Task 10 integration)
    Steps:
      1. Navigate to http://localhost:3000/mix-gem/mes/spc/
      2. Find the HeatmapTable component (data-testid="heatmap-table")
      3. Assert table headers include parameter names (Yield, TSV, etc.)
      4. Assert rows contain lot IDs (CoWoS-A01 through A06)
      5. Assert at least 3 distinct background colors are visible in cells (green, amber, red variants)
      6. Assert "Overall Status" column contains badge elements with PASS/MONITOR/HOLD text
    Expected Result: Heatmap table with 6 lots × 5 parameters, color-coded cells, and status badges
    Failure Indicators: No table rendered, no color variation, missing status badges
    Evidence: .sisyphus/evidence/task-7-heatmap-table.png
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(spc): add heatmap table component with color-coded cells and status badges`
  - Files: `equipment-monitor/src/components/spc/HeatmapTable.tsx`
  - Pre-commit: `cd equipment-monitor && npx tsc --noEmit`

- [x] 8. Enhance AiRecommendations with Confidence & CTAs

  **What to do**:
  - In `equipment-monitor/src/components/spc/AiRecommendations.tsx`, enhance the existing AI recommendation cards:
    - Add confidence score display (e.g., "94%" with a visual progress bar or badge)
    - Add action buttons: "Apply", "Schedule", "View Details", "Optimize Now" (matching reference)
    - Add recommendation type icon/badge (Energy Optimization, Predictive Maintenance, Production Optimization, Carbon Reduction)
    - Style cards with subtle border glow/accent color on the left edge
    - Keep existing store integration (`useMesSpcStore` for recommendations)
  - Mock data should include `confidenceLevel` (75-99%) and `type` fields

  **Must NOT do**:
  - Do NOT implement actual AI inference — UI-only mock data with preset confidence values
  - Do NOT add new Zustand store slices — extend the existing `recommendations` array items with `confidence?` and `type?` optional fields
  - Do NOT break existing `AiRecommendationsProps` interface

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 9)
  - **Blocks**: Task 10
  - **Blocked By**: None (existing component, mock data can be added inline)

  **References**:

  **Pattern References**:
  - `equipment-monitor/src/components/spc/AiRecommendations.tsx` — Current AI recommendations component (enhance in place)
  - `equipment-monitor/src/stores/mes-spc-store.ts` — Store with `recommendations` array and `applyRecommendation()`, `overrideRecommendation()` actions

  **External References**:
  - Reference screenshot `Applied_SmartFactory_Dashboard_EMS.png` — Shows AI recommendation cards with confidence percentages (89-94%), action CTAs (Apply/Schedule/View Details), and type icons

  **WHY Each Reference Matters**:
  - `AiRecommendations.tsx`: This is the component being enhanced. Must understand current structure (cards, store integration, action handlers) before adding confidence and CTAs.
  - `mes-spc-store.ts`: The store that provides `recommendations` data and action handlers. New optional fields (`confidence`, `type`) must be compatible with existing interface.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: AI recommendation cards show confidence scores and action buttons
    Tool: Playwright
    Preconditions: Dev server running at http://localhost:3000/mix-gem/mes/spc/
    Steps:
      1. Navigate to http://localhost:3000/mes/spc/ (with basePath)
      2. Find AI recommendation cards (data-testid or text matching "confidence" or "%")
      3. Assert each card has a confidence percentage visible (matching /\d+%/ pattern)
      4. Assert each card has at least one action button (Apply, Schedule, View Details, or Optimize Now)
      5. Click an "Apply" button — verify it triggers state change (recommendation marked as applied)
    Expected Result: AI cards display confidence % and interactive action buttons
    Failure Indicators: No confidence display, no action buttons, clicking Apply does nothing
    Evidence: .sisyphus/evidence/task-8-ai-recommendations.png
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(spc): enhance AI recommendations with confidence scores and action CTAs`
  - Files: `equipment-monitor/src/components/spc/AiRecommendations.tsx`, `equipment-monitor/src/stores/mes-spc-store.ts`, `equipment-monitor/src/lib/mes-mock-data.ts`
  - Pre-commit: `cd equipment-monitor && npm run build`

- [x] 9. Enhance FooterStatusBar with System Info

  **What to do**:
  - In `equipment-monitor/src/components/spc/FooterStatusBar.tsx`, enhance the existing footer status bar to match the EMS reference:
    - Add system version display (e.g., "SmartFactory Analytics v9.2")
    - Add AI status indicator: "AI Optimization: Active" with pulsing green dot (or "Inactive" with gray)
    - Add refresh rate display (from store settings)
    - Add connected device count display
    - Add uptime or timestamp display
    - Add AI prediction message line (e.g., "AI predicts yield recovery to 96% with recommended adjustments")
    - Use SmartFactory CSS tokens for all colors
    - Keep the existing live clock

  **Must NOT do**:
  - Do NOT create a new component — enhance the existing one
  - Do NOT add real system monitoring — mock data only
  - Do NOT hardcode hex colors

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 8)
  - **Blocks**: Task 10
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `equipment-monitor/src/components/spc/FooterStatusBar.tsx` — Current footer component (enhance in place)

  **External References**:
  - Reference screenshot `Applied_SmartFactory_Dashboard_EMS.png` — Shows footer bar with: version, AI status, refresh rate, device count, uptime
  - Reference screenshot `CoWoS_Applied.png` — Shows footer with "SmartFactory Analytics v9.2", "AI-Powered Quality Intelligence", "Predictive Analytics: ON"

  **WHY Each Reference Matters**:
  - `FooterStatusBar.tsx`: The exact file to enhance. Currently shows a simple status bar — need to add version, AI status, prediction message, and device count.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Footer status bar displays system info and AI status
    Tool: Playwright
    Preconditions: Dev server running at http://localhost:3000/mix-gem/mes/spc/
    Steps:
      1. Navigate to http://localhost:3000/mix-gem/mes/spc/
      2. Scroll to bottom of page
      3. Find the footer status bar element
      4. Assert version text is visible (contains "SmartFactory" or "v")
      5. Assert AI status indicator is visible (contains "AI" and shows "Active" or "ON")
      6. Assert at least 2 other info items are visible (refresh rate, device count, or uptime)
    Expected Result: Footer bar shows version, AI status, and 2+ additional system info items
    Failure Indicators: No footer visible, missing AI status, no version text
    Evidence: .sisyphus/evidence/task-9-footer-status.png
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(spc): enhance footer status bar with system info and AI status`
  - Files: `equipment-monitor/src/components/spc/FooterStatusBar.tsx`
  - Pre-commit: `cd equipment-monitor && npm run build`

- [x] 10. Integrate All Components into SPC Dashboard Page

  **What to do**:
  - In `equipment-monitor/src/app/mes/spc/page.tsx`, integrate all new and enhanced components:
    - Replace existing `KpiGaugeCard` usage with redesigned speedometer version
    - Add `WaferBinMap` component (from Task 6)
    - Add `HeatmapTable` component (from Task 7)
    - Ensure enhanced `AiRecommendations` (from Task 8) renders
    - Ensure enhanced `ProcessFlow` (from Task 5) renders with yields
    - Ensure enhanced `FooterStatusBar` (from Task 9) renders
    - Rearrange the SPC page layout to match the reference dashboard structure:
      - Top row: KPI gauges (existing but redesigned)
      - Middle row: Wafer bin map (left) + Process flow (right) OR Heatmap table + control charts
      - Bottom row: AI recommendations (left) + event log (right)
      - Footer: Enhanced status bar
    - Wire all new mock data generators to the components
    - Ensure the company logo (Task 1) appears in the header (already integrated via MesLayout)

  **Must NOT do**:
  - Do NOT create new page routes
  - Do NOT remove existing functionality (ControlChart, EventLog, FaultInjector must still work)
  - Do NOT import unused components or leave dead code

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (sequential, depends on all Wave 1 + Wave 2)
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 1, 4, 5, 6, 7, 8, 9

  **References**:

  **Pattern References**:
  - `equipment-monitor/src/app/mes/spc/page.tsx` — Current SPC page (integration target)
  - `equipment-monitor/src/app/mes/layout.tsx` — MES layout with Header + MesNavBar

  **API/Type References**:
  - `equipment-monitor/src/lib/mes-mock-data.ts` — All mock data generators from Task 3
  - `equipment-monitor/src/lib/mes-types.ts` — All new type definitions from Task 3

  **WHY Each Reference Matters**:
  - `spc/page.tsx`: This is the integration point. Currently imports KpiGaugeCard, ControlChart, ThumbnailChart, etc. Must add WaferBinMap, HeatmapTable imports and arrange layout to match reference dashboard structure.
  - `mes/layout.tsx`: Confirms Header and MesNavBar are shared across all MES pages — logo integration from Task 1 will automatically show on SPC page.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: SPC dashboard renders all integrated components
    Tool: Playwright
    Preconditions: Dev server running at http://localhost:3000/mix-gem/mes/spc/
    Steps:
      1. Navigate to http://localhost:3000/mix-gem/mes/spc/
      2. Wait for page to fully render (timeout: 15s)
      3. Assert header with company logo is visible
      4. Assert KPI speedometer gauges are rendered (at least 3 gauge cards)
      5. Assert wafer bin map is visible (SVG with colored cells)
      6. Assert heatmap table is visible (table with color-coded cells)
      7. Assert process flow shows yield percentages
      8. Assert AI recommendations show confidence scores
      9. Assert footer status bar shows version and AI status
      10. Take full-page screenshot
    Expected Result: SPC dashboard shows all new components integrated in a coherent layout
    Failure Indicators: Missing components, layout broken, components overlapping, blank areas
    Evidence: .sisyphus/evidence/task-10-spc-dashboard-full.png

  Scenario: Build succeeds with all new components
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run `cd equipment-monitor && npm run build`
      2. Assert exit code 0
      3. Assert no TypeScript errors
      4. Assert `out/index.html` and `out/mes/spc/index.html` exist
    Expected Result: Build succeeds cleanly with all components integrated
    Failure Indicators: Build errors, missing output pages
    Evidence: .sisyphus/evidence/task-10-build-success.txt

  Scenario: No text overflow at 1920×1080 viewport
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Set viewport to 1920×1080
      2. Navigate to http://localhost:3000/mix-gem/mes/spc/
      3. Find all gauge value text elements
      4. For each gauge text, compare text bounding box width to parent container width
      5. Assert no text element exceeds its container width
    Expected Result: All text fits within containers with no overflow at desktop resolution
    Failure Indicators: Text bounding box wider than container bounding box
    Evidence: .sisyphus/evidence/task-10-no-overflow-1920.txt
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `feat(spc): integrate all enhanced components into SPC dashboard`
  - Files: `equipment-monitor/src/app/mes/spc/page.tsx`
  - Pre-commit: `cd equipment-monitor && npm run build`

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [x] F1. **Plan Compliance Audit** — `oracle` — APPROVED
- [x] F2. **Code Quality Review** — `unspecified-high` — APPROVED
- [x] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill) — APPROVED
- [x] F4. **Scope Fidelity Check** — `deep` — APPROVED
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Verify no Three.js imports, no new page routes, no `.test.tsx` deletions, no hardcoded colors. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Wave 1**: `feat(ui): add company logo and fix gauge overflow` — header.tsx, gauge-card.tsx, mes-types.ts, mes-mock-data.ts, KpiGaugeCard.tsx, ProcessFlow.tsx
- **Wave 2**: `feat(spc): add wafer bin map, heatmap table, and enhanced components` — WaferBinMap.tsx, HeatmapTable.tsx, AiRecommendations.tsx, FooterStatusBar.tsx
- **Wave 3**: `feat(spc): integrate all components into SPC dashboard` — spc/page.tsx, related imports

---

## Success Criteria

### Verification Commands
```bash
cd equipment-monitor && npm run build  # Expected: exit 0, no errors
```

### Final Checklist
- [x] All "Must Have" present
- [x] All "Must NOT Have" absent
- [x] Static export `out/` directory contains all new assets
- [x] Logo file size < 50KB
- [x] Gauge text never overflows at 1920×1080
- [x] Speedometer gauges show green/yellow/red color zones
- [x] All colors use CSS variable tokens (no hardcoded hex)