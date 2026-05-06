# War Room 3D — GaugeCard Redesign Learnings

## Date: 2026-05-05

## Changes Made

### 1. Enlarged SVG Canvas
- **VW**: 160 → 200
- **VH**: 100 → 124
- **PAD**: 25 → 32 (maintains 20px+ padding requirement; 32px > 20px)
- **RADIUS**: 60 → 75 (scaled proportionally to larger viewBox)
- SVG `width`/`height` attributes updated to match new viewBox (200×124)
- New textLength: 136 (200 - 2×32), comfortably fits 10-char monospace at text-sm(14px)

### 2. Value Formatting
- Changed `toFixed(1)` → `toFixed(2)` to support the full decimal precision range (-999,999.99 to +999,999.99)
- Max string length with sign: "+999999.99" = 10 chars (fits in 9-10 bucket → text-sm/14px)
- Sign prefix `+` for non-negative values maintained

### 3. Text Y-Position Recalculation
- Value text: 52 → 64 (same relative position at ~52% of VH)
- Unit label: 72 → 89 (same relative position at ~72% of VH)
- Arc center at Y=92 (VH-PAD=124-32), arc top at Y=17 (92-75)

### 4. Color Tokenization
- Card className: removed hardcoded Tailwind colors (`bg-slate-900 border-slate-700`)
- Replaced with style props using:
  - `backgroundColor: "var(--sf-bg-base)"`
  - `borderColor: "var(--sf-border-default)"`
- All other colors already used `var(--sf-*)` tokens
- Grep for hex colors confirmed zero matches in gauge-card.tsx

### 5. Pre-existing Build Error Fix
- `EventLog.tsx` line 34: `Record<SecsEventType, React.ElementType>` caused TS error when passing props to lucide-react icons
- Fixed by narrowing type to `React.ComponentType<{ className?: string; size?: number }>`
- This was necessary to achieve exit code 0 on build

## Patterns Learned
- SVG `textLength` with `lengthAdjust="spacingAndGlyphs"` is the canonical overflow-proofing mechanism for SVG text
- `.toFixed(2)` on values up to 999,999.99 + sign prefix = max 10 chars
- The 5-tier dynamic font scaling (20→18→16→14→12) handles all format lengths within the 136px textLength constraint
- All CSS variables in gauge-card.tsx: `--sf-status-red`, `--sf-status-amber`, `--sf-status-green`, `--sf-border-default`, `--sf-text-secondary`, `--sf-text-muted`, `--gauge-value-color`, `--font-family-mono`, `--font-family-sans`, `--sf-bg-base`

## Verification
- `npx next build` — exit code 0
- Hex color grep on gauge-card.tsx — zero matches
- GaugeCardProps interface unchanged

---

## Date: 2026-05-05 — KpiGaugeCard Speedometer Redesign

### Changes Applied
- Replaced pixel-based `computeValueFontSize()` (13-38px hardcoded range) with CSS `clamp(0.75rem, availableWidth/(charCount*0.6), 2.5rem)` — returns a string expression usable in SVG `fontSize` attribute.
- Enlarged gauge dimensions: GAUGE_WIDTH 170→210, GAUGE_HEIGHT 110→135, GAUGE_RADIUS 65→80, VALUE_TEXT_WIDTH 130→160, LABEL_TEXT_WIDTH 58→72.
- Container div updated from `w-[170px] h-[110px]` to `w-[210px] h-[135px]`.
- Unit textLength scaled from 80→100 to match proportional growth.
- All four SVG `<text>` elements (value, unit, min label, max label) confirmed to have `textLength`, `lengthAdjust="spacingAndGlyphs"`, and `overflow="hidden"`.

### Patterns / Conventions
- All colors in KpiGaugeCard.tsx use `var(--sf-*)` / `var(--smartfactory-*)` CSS tokens — zero hardcoded hex values.
- `--kpi-value-color` and `--kpi-arc-color` defined in `src/app/globals.css` mapped to `--sf-text-primary` / `--sf-accent-primary`.
- KpiGaugeCardProps interface unchanged (no breaking changes).
- CSS `clamp()` in SVG `fontSize` attribute: React passes the string through — the browser evaluates the `clamp()` expression at render time relative to the root font-size.

### Verification
- `npx next build` → EXIT_CODE: 0 (compiled, TypeScript passed, all 7 routes statically generated).
- Hex color grep: zero matches in KpiGaugeCard.tsx.
- Pre-existing Recharts warnings about chart width during static generation are unrelated.

---

## Date: 2026-05-06 — War Room Store + Page Implementation

### Files Created / Updated
- `src/stores/war-room-store.ts` — Zustand store with `activeZone`, `overlayOpen`, `data`, and three actions (`setActiveZone`, `closeOverlay`, `refreshData`). Store type is `WarRoomStore` with `data: ReturnType<typeof generateMockWarRoomState> | null`.
- `src/app/mes/war-room/page.tsx` — Full-viewport page layout:
  - **Status bar**: Zone buttons with lucide icons (Zap/Building/Wind/Flame), alert dot indicators, refresh button, last-updated timestamp.
  - **3D canvas**: `FactoryCanvas` wrapping `FactoryScene` + 4 `SubsystemZone` instances positioned at [±7, 0.05, ±7].
  - **Overlay**: Dynamic panel per zone (`PANEL_MAP` maps zone type to panel component). Rendered with `isOpen` and `onClose` props.
  - **Escape key**: `window.addEventListener('keydown', ...)` closes overlay on Escape.
  - **Click-outside**: Absolute backdrop `div` on the canvas wrapper with `onClick={closeOverlay}` — sits behind the panel overlay.

### Patterns / Conventions
- All 3D components (`FactoryCanvas`, `FactoryScene`, `SubsystemZone`) use `dynamic()` with `ssr: false` since they depend on WebGL / `@react-three/fiber`.
- Panel components (`PowerMonitoringPanel`, `BuildingAutoPanel`, `GasDetectionPanel`, `FireAlarmPanel`) are statically imported — they are pure React components with no WebGL dependency.
- All panels accept `{ isOpen: boolean; onClose: () => void }` as their props interface.
- Store selectors use individual `useWarRoomStore((s) => s.field)` pattern rather than destructuring the entire store — avoids unnecessary re-renders on unrelated state changes.
- `zoneAlerts` uses `useMemo` to derive alert flags from `data.subsystemData[zone].alarms.length > 0`.

### Verification
- `npx next build` → EXIT_CODE: 0 (compiled successfully, TypeScript passed, `/mes/war-room` route statically generated).
- LSP diagnostics unavailable (typescript-language-server not installed in environment) — but `next build` TypeScript check passes, which is the authoritative verification.
