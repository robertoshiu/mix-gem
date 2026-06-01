# PWA Design — equipment-monitor (Semiconductor SmartFactory MES)

- **Date:** 2026-06-02
- **Status:** Approved (design), pending implementation plan
- **Scope:** Add an installable, offline-capable Progressive Web App layer to the
  existing `equipment-monitor` Next.js app. App-shell offline only (Approach A).

## 1. Context

`equipment-monitor` is a semiconductor fab MES dashboard, built as a portfolio/demo.
Current state established during brainstorming:

- **RWD already exists and is extensive** — 166 Tailwind responsive-breakpoint usages
  across analytics, war-room, charts, layout, etc.; App Router injects the default
  `width=device-width, initial-scale=1` viewport. The app already adapts to phone/tablet/desktop.
- **No PWA infrastructure at all** — no manifest, no service worker, no `next-pwa`/
  `workbox`/`serwist` dependency.
- **Static export** — the app ships via `next build` static export (`out/`), served under
  **basePath `/mix-gem`**. Any PWA tooling must be static-export compatible and basePath-aware.
- **Live data is client-simulated** — the facility/SPC "live" telemetry ticks in-browser
  (Zustand stores), so once the app shell is cached the dashboards keep animating **offline**.
  This makes offline genuinely useful, not an empty shell.
- **Heavy 3D assets** — Babylon scenes load large GLB hero models. Whether to precache these
  is the main axis of the offline-depth decision.

### Why (goal)

RWD and PWA are orthogonal. RWD = layout adapts to screen size. PWA = installability +
offline + app-like behavior (home-screen icon, standalone launch, service-worker caching).
Having RWD does not provide PWA capabilities. The user's chosen goal is **install + offline +
app feel**, which RWD cannot deliver — hence a PWA is warranted.

## 2. Goals / Non-Goals

**Goals**
- Installable to the home screen (Android/Chrome auto-prompt; iOS Add-to-Home-Screen).
- Launches standalone/full-screen (app feel).
- Opens offline: app shell + client-simulated dashboards work with no network; previously
  visited 3D scenes work offline.
- Brand-consistent: reuse the existing inline silicon-wafer mark as the app icon.

**Non-Goals (YAGNI for this demo)**
- Push notifications (iOS-limited, requires a backend/push service).
- Background sync / periodic background update.
- Full precache of all GLB 3D assets (that is Approach B — large install, iOS storage eviction risk).

## 3. Chosen Approach

**Approach A — Lightweight installable PWA with app-shell offline.** Precache the app shell;
runtime-cache GLB scenes on first view (capped). Rejected alternatives:

- **B (full offline incl. all GLBs):** precaches tens–hundreds of MB on first install; large
  storage; iOS may evict. Overkill for a demo.
- **C (manifest only, no SW):** installable + standalone but **no offline** — fails the chosen goal.

## 4. Detailed Design

### 4.1 Web App Manifest + Icons

- **File:** hand-authored `equipment-monitor/public/manifest.webmanifest` (avoids basePath
  auto-prefix surprises). The `<link rel="manifest">` is injected via Next metadata
  `manifest: '/manifest.webmanifest'`, which Next prefixes to `/mix-gem/manifest.webmanifest`.
- **Icons** (derived from the existing inline wafer SVG mark, dark `#0B0F19` field + centered
  cyan `#22D3EE` wafer), placed in `public/`:
  - `icon-192.png`, `icon-512.png` (purpose `any`)
  - `icon-192-maskable.png`, `icon-512-maskable.png` (purpose `maskable`, with safe-zone padding)
  - `apple-touch-icon.png` (180×180, iOS home screen)
- **Manifest fields (locked):**
  | field | value |
  |-------|-------|
  | `name` | `Equipment Monitor — Semiconductor SmartFactory` |
  | `short_name` | `EquipMon` |
  | `description` | `Semiconductor fab MES dashboard` |
  | `start_url` | `/mix-gem/` |
  | `scope` | `/mix-gem/` |
  | `display` | `standalone` |
  | `orientation` | `any` |
  | `theme_color` | `#0B0F19` |
  | `background_color` | `#0B0F19` |
  | `icons` | the five icons above |

### 4.2 Service Worker — Serwist (contingency: next-pwa)

Use **Serwist** (`@serwist/next`), the actively-maintained Workbox successor, configured for
static export + basePath. **Contingency:** if `@serwist/next` proves incompatible with
`output: export` during implementation, fall back to `next-pwa` (also Workbox-based, proven
with static export); the caching strategy below is tooling-agnostic.

- **Precache (at build):** app shell — `_next/static/**`, route HTML, Google fonts, manifest, icons.
- **Runtime caching rules:**
  | resource | strategy | policy |
  |----------|----------|--------|
  | `*.glb` / `/models/**` | CacheFirst | maxEntries ~30, maxAgeSeconds ~30d, purgeOnQuotaError |
  | Google Fonts (css + font files) | CacheFirst | keep fonts available offline |
  | other images / textures | StaleWhileRevalidate | |
  | navigation (document) | NetworkFirst | offline fallback → precached shell, so any route opens |
- **Update flow:** `skipWaiting` + `clientsClaim` for immediate activation; surface a subtle
  "Updated — refresh to apply" message via the **existing `ToastContainer`**. SW disabled in dev.

### 4.3 Install UX

- **Android/Chrome:** browser auto-prompts once installability criteria are met. Additionally,
  capture `beforeinstallprompt`, stash the event, and render an **"Install app" button in the
  header** that appears **only when installable and not yet installed**; clicking calls `prompt()`.
- **iOS (no `beforeinstallprompt`):** show a one-time hint — "Use Safari Share → Add to Home Screen".
- Hidden when already installed (`display-mode: standalone`). This affordance is optional and may
  be cut without affecting the core goal.

### 4.4 Integration / File Layout

- `next.config.*`: register the Serwist plugin; disable SW in dev.
- New: `public/manifest.webmanifest` + 5 icon files.
- `app/layout.tsx`: add `metadata.manifest`, `metadata.appleWebApp` (capable + title + status-bar
  style), `metadata.icons`, and `export const viewport = { themeColor: '#0B0F19' }`.
- New client component for SW registration (scope `/mix-gem/`) + the optional install button.

## 5. Error Handling / Edge Cases

- **Offline navigation:** NetworkFirst document strategy falls back to the precached shell so
  routes open offline; client-simulated stores keep dashboards live.
- **Unvisited 3D scene offline:** GLB is CacheFirst-on-first-view, so an unvisited scene needs one
  online load; show the existing Babylon loading placeholder, and if fetch fails offline, the
  existing `WebGLFallback`/error UI applies (no crash).
- **Storage quota:** GLB cache is capped with `purgeOnQuotaError`; iOS eviction is acceptable
  (re-fetched when next online).
- **SW update races:** `skipWaiting`/`clientsClaim` + refresh toast avoids stale-asset confusion.
- **Dev mode:** SW off to prevent caching interference during development.

## 6. Testing / Verification

- **Playwright e2e** (against the existing `out/` static server):
  - manifest `<link>` present; `GET /mix-gem/manifest.webmanifest` returns 200 with required fields.
  - service worker registers (registration/controller present) in the production build.
  - **offline:** load page → `context.setOffline(true)` → reload → assert app shell still renders.
- **Lighthouse** PWA / installability audit (one-time manual check).
- Tests must remain green under the existing `CI=1` serial e2e configuration and must not
  reintroduce 3D-scene flakiness (see `war-room.spec.ts` WebGL-fallback stabilization).

## 7. Scope Boundary

In: manifest, wafer-derived icons, Serwist SW (shell precache + GLB/font/image runtime cache),
iOS meta, optional header install button, offline shell. Out: push, background sync, full-GLB
precache. This is a single, self-contained implementation plan.
