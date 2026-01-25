# Semiconductor Equipment Monitoring Dashboard - Design Document

**Date:** 2026-01-25
**Status:** Approved
**Author:** Brainstorming session

## Overview

A multi-purpose dashboard for real-time semiconductor equipment monitoring, designed to work across:
- Control rooms (wall displays, 24/7 operations)
- Engineer workstations (detailed analysis)
- Mobile/tablet (on-the-floor quick checks)

## Architecture & Layout

### Adaptive Information Density

| Viewport | Layout | Info Density | Use Case |
|----------|--------|--------------|----------|
| **XL (1440px+)** | 4-column grid | High | Control room displays |
| **LG (1024px)** | 3-column grid | Medium | Engineer workstations |
| **MD (768px)** | 2-column, tabbed | Low | Tablets |
| **SM (375px)** | Single column | Minimal | Mobile quick checks |

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]  Equipment Monitor    [Alerts 🔴3]  [User]  [⚙️]   │  ← Sticky header (56px)
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────────────────────────────────┐ │
│ │ Equipment   │ │  Main Content Area                      │ │
│ │ List        │ │  ┌─────────────┐ ┌─────────────┐       │ │
│ │             │ │  │ Status Card │ │ Status Card │       │ │
│ │ LITHO01 🟢  │ │  └─────────────┘ └─────────────┘       │ │
│ │ LITHO02 🟡  │ │  ┌─────────────────────────────────┐   │ │
│ │ TRACK01 🟢  │ │  │ Real-time Trend Chart           │   │ │
│ │ ETCH01  🔴  │ │  │ (Focus offset, CD, Overlay)     │   │ │
│ │             │ │  └─────────────────────────────────┘   │ │
│ └─────────────┘ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

- Equipment sidebar collapses to bottom sheet on mobile
- Swipe-up gesture to select equipment on touch devices

---

## Color System

### Dark Mode Foundation

| Role | Color | Hex | Tailwind |
|------|-------|-----|----------|
| **Background** | Slate 950 | `#020617` | `bg-slate-950` |
| **Surface** | Slate 900 | `#0F172A` | `bg-slate-900` |
| **Surface Elevated** | Slate 800 | `#1E293B` | `bg-slate-800` |
| **Border** | Slate 700 | `#334155` | `border-slate-700` |
| **Text Primary** | Slate 50 | `#F8FAFC` | `text-slate-50` |
| **Text Secondary** | Slate 400 | `#94A3B8` | `text-slate-400` |
| **Primary** | Blue 500 | `#3B82F6` | `bg-blue-500` |
| **Primary Hover** | Blue 400 | `#60A5FA` | `hover:bg-blue-400` |

### Status Indicators

| Status | Color | Hex | Tailwind | Meaning |
|--------|-------|-----|----------|---------|
| **Normal** | Emerald 500 | `#10B981` | `text-emerald-500` | Operating within spec |
| **Warning** | Amber 500 | `#F59E0B` | `text-amber-500` | Attention needed |
| **Alarm** | Red 500 | `#EF4444` | `text-red-500` | Immediate action required |
| **Idle** | Blue 400 | `#60A5FA` | `text-blue-400` | Standby |
| **Offline** | Slate 500 | `#64748B` | `text-slate-500` | Disconnected |

### Status Color Rules

- Status dots: 12px minimum diameter
- Alarm states: subtle pulsing glow animation
- Never rely on color alone — include icons and text labels
- Card background tint reflects status (5% opacity)

---

## Charts & Data Visualization

### Chart Types

| Data Type | Chart | Library | Update Frequency |
|-----------|-------|---------|------------------|
| **Live Process Params** | Streaming Area | Recharts | 1-5 sec |
| **Trend Analysis** | Line with spec bands | Recharts | 30 sec |
| **Current vs Spec** | Gauge / Bullet | Custom SVG | Real-time |
| **Parameter Distribution** | Box Plot | Recharts | On-demand |
| **Alarm History** | Timeline | Custom | On event |

### Streaming Trend Chart

```
  Focus Offset (nm)                              LITHO01
  ┌─────────────────────────────────────────────────────┐
  │ ══════════════════════════════════════ USL (+10)   │
  │                          ╭──╮                      │
  │           ╭──────────────╯  ╰──────╮   Current:    │
  │ ──────────╯                        ╰── +2.3 nm     │
  │ ══════════════════════════════════════ LSL (-10)   │
  └─────────────────────────────────────────────────────┘
    -60min        -40min        -20min        Now
```

### Chart Features

- Spec limit bands: shaded region between USL/LSL
- Warning zones at 80% of spec
- Hover tooltip with timestamp, value, status
- Crosshair sync across multiple charts
- Time range selector: [1H] [4H] [24H]

### Gauge Cards

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Focus Offset  │  │      CDU        │  │    Overlay      │
│    ╭───────╮    │  │    ╭───────╮    │  │    ╭───────╮    │
│   ╱ 🟢     ╲   │  │   ╱    🟡  ╲   │  │   ╱ 🟢     ╲   │
│  │   +2.3   │   │  │  │   4.2   │   │  │  │   1.8   │   │
│   ╲   nm   ╱    │  │   ╲   nm  ╱    │  │   ╲   nm  ╱    │
│    ╰───────╯    │  │    ╰───────╯    │  │    ╰───────╯    │
│   Spec: ±10     │  │   Spec: <5      │  │   Spec: <3      │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Performance

- Canvas rendering for >1000 data points
- LTTB downsampling for historical data
- Pause updates when tab not visible
- `prefers-reduced-motion`: disable streaming, show static with refresh

---

## Components

### Equipment Card States

| State | Border | Background | Extra |
|-------|--------|------------|-------|
| Default | `border-slate-700` | `bg-slate-900` | — |
| Selected | `border-l-blue-500` | `bg-slate-800` | 3px left accent |
| Alarm | `border-l-red-500` | `bg-red-500/5` | Pulse animation |

### Button Hierarchy

| Type | Style | Usage |
|------|-------|-------|
| **Primary** | `bg-blue-500 text-white` | Main actions (Acknowledge) |
| **Secondary** | `border-slate-600 text-slate-200` | Secondary actions |
| **Ghost** | `text-slate-400 hover:bg-slate-800` | Tertiary actions |
| **Danger** | `bg-red-600 text-white` | Destructive (requires confirm) |

### Alert Patterns

**Toast (auto-dismiss 5s)**
```
┌───────────────────────────────────────────────────────┐
│ 🟡 Warning: LITHO02 focus offset approaching limit [✕]│
└───────────────────────────────────────────────────────┘
```

**Persistent Banner (requires action)**
```
┌──────────────────────────────────────────────────────┐
│ 🔴 ETCH01 chamber pressure out of spec               │
│    Detected 2 min ago | [View Details] [Acknowledge] │
└──────────────────────────────────────────────────────┘
```

### Touch Targets

| Component | Minimum Size |
|-----------|--------------|
| Equipment Card | 64px height |
| Status Badge | 44x44px |
| Action Button | 48px height |
| Time Range Pills | 44px height |
| Alert Row | 56px height |

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Navigate between cards/controls |
| `Enter/Space` | Select, trigger buttons |
| `Arrow keys` | Navigate equipment list |
| `Esc` | Close modals, deselect |

### Mobile Gestures

- Swipe left on card: Quick actions
- Pull-to-refresh: Update all data
- Long-press chart: Show crosshair
- Bottom sheet: Equipment selection

---

## Typography

### Font Stack

| Role | Font | Weight | Size |
|------|------|--------|------|
| **Headings** | Inter | 600 | 18-24px |
| **Body** | Inter | 400 | 14-16px |
| **Data Values** | JetBrains Mono | 500 | 16-32px |
| **Status Text** | Inter | 500 | 12-14px |

### Google Fonts

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
```

### Tailwind Config

```js
theme: {
  extend: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
  },
}
```

---

## Tech Stack

### Recommended Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Framework** | Next.js 14+ (App Router) | SSR, great DX |
| **Styling** | Tailwind CSS | Fast iteration |
| **Components** | shadcn/ui | Accessible, customizable |
| **Charts** | Recharts | React-native, performant |
| **Real-time** | React Query + WebSocket | Efficient sync |
| **State** | Zustand | Lightweight |
| **Icons** | Lucide React | Consistent, tree-shakeable |

### Alternative: Lightweight

| Layer | Choice |
|-------|--------|
| **Base** | HTML + Tailwind |
| **Interactivity** | Alpine.js |
| **Charts** | ApexCharts |

---

## Pre-Delivery Checklist

### Visual Quality
- [ ] No emojis as icons (use Lucide SVG)
- [ ] Consistent icon sizing (24x24 viewBox, w-5 h-5)
- [ ] Hover states don't cause layout shift
- [ ] Status colors have text/icon fallback

### Interaction
- [ ] All clickable elements have `cursor-pointer`
- [ ] Transitions 150-300ms
- [ ] Focus rings visible (2px blue-500)
- [ ] Touch targets 44px minimum

### Accessibility
- [ ] Color contrast 4.5:1 minimum
- [ ] `prefers-reduced-motion` respected
- [ ] ARIA labels on icon buttons
- [ ] Keyboard navigation works

### Responsive
- [ ] Test at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll
- [ ] Bottom sheet works on mobile
- [ ] Charts resize gracefully

---

## Next Steps

1. Set up project with Next.js + Tailwind + shadcn/ui
2. Implement equipment list sidebar with status indicators
3. Build gauge card components
4. Integrate Recharts for streaming trends
5. Add WebSocket connection for real-time updates
6. Implement alert/notification system
7. Add mobile responsive adaptations
8. Test across viewports and devices

---

## References

- RAG Engine Design: `docs/plans/2026-01-24-rag-engine-design-v2.md`
- SECS/GEM Simulator: `docs/plans/2026-01-23-secs-gem-simulator-design.md`
- UI/UX Pro Max Skill: `.claude/skills/ui-ux-pro-max/`
