# Design System — equipment-monitor (SmartFactory MES)

Codified by /design-consultation on 2026-05-28 from the existing de-facto system
in `src/app/globals.css` + the home dashboard. This is the source of truth for all
visual decisions. Read it before any UI work; flag code that deviates.

## Product Context
- **What this is:** Semiconductor fab Manufacturing Execution System (MES) dashboard —
  equipment monitoring, SECS/GEM, SPC, facility command center, advanced analytics.
- **Who it's for:** Two audiences, clarity-first: semiconductor insiders (fab engineers)
  AND general technical viewers (portfolio/demo). Progressive disclosure serves both.
- **Space/industry:** Semiconductor manufacturing / industrial control software.
- **Project type:** Data-dense web app (dashboards), dark-first.
- **Memorable thing:** A fab control room that feels alive and credible — live data that
  keeps moving, premium glassmorphism, "this is serious software."

## Aesthetic Direction
- **Direction:** Cyberpunk fab control-room. Dark glassmorphism, neon-accent telemetry.
- **Decoration level:** Intentional — frosted glass, radial-gradient glows, soft glow shadows.
  Decoration serves depth and status, never ornament.
- **Mood:** Calm dark surface, high-signal color, premium and intentional. Dense but readable.
- **Classifier:** APP UI (workspace-driven, data-dense) — apply App UI rules, not landing-page rules.

## Typography
- **Body / Sans:** Inter (400/500/600/700) — `--font-family-sans`. *Current; AI-default —
  candidate for a future upgrade to Geist / General Sans / Instrument Sans for more character.*
- **UI / Mono:** JetBrains Mono (400/500) — `--font-family-mono`. Used for status pills,
  labels, terminal/event-log rows.
- **Data / Tables:** Fira Code (400/500/600) — `--font-family-data`. Must support tabular-nums
  for aligned metric columns.
- **Loading:** Google Fonts `<link>` (globals.css:1).
- **Section labels:** uppercase, letter-spacing 0.2em–0.28em, 11px, accent-cyan, weight 600.
- **Headlines:** uppercase tracked, 30–40px, weight 600.
- **Body line-height:** 1.625 (leading-relaxed); prose max-width 65ch.

## Color (dark-first)
- **Canvas:** `--smartfactory-bg-canvas` #0B0F19 / `--bg-base` #0A1628.
- **Surfaces:** card #111D2E, elevated #182840, panel #151B2B, glass overlay rgba(2,6,23,0.66–0.78).
- **Borders:** default #1E3A5F, active #2563EB, glass-border rgba(34,211,238,0.18–0.35).
- **Text:** primary #F1F5F9, secondary #94A3B8 (~7:1 — use for captions, ≥14px), muted #64748B
  (large text / decorative only — verify ≥4.5:1 before using on body copy).
- **Accents:** cyan #22D3EE (primary), violet #8B5CF6, orange #F47920, blue #3B82F6, teal #14B8A6.
- **Semantic:** success #10B981, warning #F59E0B, error #EF4444 (neon variants
  #00E676 / #FFC107 / #FF1744 for high-emphasis live states).
- **Token note:** `--sf-*` are aliases of `--smartfactory-*` (globals.css:194+) — same palette,
  two namespaces. Prefer `--sf-*` in new components for consistency with the home dashboard.
- **Dark mode:** this app is dark-first; there is no light theme in scope.

## Spacing
- **Base unit:** 4px (Tailwind scale).
- **Density:** comfortable for marketing/header areas, compact for data panels.
- **Section gaps:** 16–24px between cards, 4–6px within data rows.

## Layout
- **Approach:** grid-disciplined for data panels; composed (not card-mosaic) for overview/Hero.
- **Max content width:** 1800px (`max-w-[1800px]`), centered with `p-4 md:p-6`.
- **Border radius:** base 0.625rem (10px); cards `rounded-3xl` (banners/sections),
  `rounded-2xl` (feeds), `rounded` (small chips); pills `rounded-full`.
- **Glass treatment (the signature):** `bg rgba(2,6,23,0.72)` + `backdrop-blur-xl` +
  `border 1px rgba(34,211,238,0.22)` + `shadow 0 24px 80px rgba(0,0,0,0.35)`.
- **Page background:** layered radial-gradient glows (cyan top-left, violet top-right) over canvas.
- **Cards earn existence:** no decorative card grids; a card must contain a real unit of
  interaction or a distinct data object. Prefer one composed layout over a mosaic of cards.

## Motion
- **Approach:** intentional. Live telemetry ticks at 1 Hz; entrance/hover transitions are subtle.
- **WCAG 2.2.2:** any auto-updating region (>5s) MUST have a visible play/pause control
  (default playing). Required on live dashboards (Hero, live tabs).
- **Reduced motion:** honor `prefers-reduced-motion` — freeze animation to the latest snapshot.
- **`animate-pulse-slow`:** 3s pulse for LIVE indicators; `animate-ping` for live dots.
- **Easing/duration:** enter ease-out, exit ease-in; micro 50–100ms, short 150–250ms.

## Accessibility
- **Live regions:** `aria-live="off"` on per-tick high-frequency values; ONE `aria-live="polite"`
  region announcing only meaningful changes (new critical events), never every tick.
- **Keyboard:** interactive tiles/pills are real `<button>`s, focusable, visible cyan focus ring.
- **Touch targets:** ≥44px.
- **Contrast:** body/caption text ≥4.5:1 (use `--text2` #94A3B8, not `--muted` for captions);
  captions ≥14px. Never rely on color alone for status — pair with icon/label.

## Charting
- **Library:** recharts (matches home dashboard). New charts use recharts; legacy hand-rolled
  canvas charts in analytics are being migrated to recharts.
- **Chart colors:** draw from the accent palette; theme tooltips to surface #0f172a + cyan border.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-28 | Codified existing system into DESIGN.md | /design-consultation; make the de-facto home-dashboard system the standard so reviews have a baseline |
| 2026-05-28 | App UI classifier, dark-first, glassmorphism treatment as signature | Matches shipping home/facility dashboards; the /mes/analytics redesign aligns to this |
| 2026-05-28 | Live dashboards require play/pause + reduced-motion + smart aria-live | WCAG 2.2.2 + screen-reader/vestibular safety on 1 Hz auto-updating pages |
| 2026-05-28 | Inter flagged for future upgrade | Only AI-default font in the stack; works but lacks character |
