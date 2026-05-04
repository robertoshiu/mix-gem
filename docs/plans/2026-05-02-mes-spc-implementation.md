# MES SPC Frontend Demo — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a pure-frontend MES SPC demo in the existing `equipment-monitor` Next.js app — no backend, no Docker, works with `npm run dev` only.

**Architecture:** Browser-only TypeScript modules (SimulatorEngine, SpcEngine, MetrologyGenerator) feed a Zustand store; React components subscribe and re-render. All SECS/GEM messages are display-only JSON objects in an event feed.

**Tech Stack:** Next.js 16 · React 19 · TypeScript 5 · Zustand v5 · Recharts v3 · Tailwind v4 · lucide-react · Jest + React Testing Library

**Design reference:** `docs/plans/2026-05-01-mes-spc-frontend-design.md`

**Working directory for all commands:** `equipment-monitor/`

---

## Color Palette Reference

Use these as Tailwind arbitrary values throughout (e.g., `bg-[#0A1628]`):

| Token | Hex | Usage |
|-------|-----|-------|
| Navy Base | `#0A1628` | MES page background |
| Panel Surface | `#111D2E` | Cards, chart bg |
| Panel Elevated | `#182840` | Hover, selected |
| Border | `#1E3A5F` | Card borders |
| Border Active | `#2563EB` | Focus, selected tab |
| AMAT Orange | `#F47920` | Inject Fault button |
| Trust Blue | `#3B82F6` | Data line, links |
| Teal | `#14B8A6` | Secondary data |
| SPC Green | `#10B981` | In-control |
| SPC Amber | `#F59E0B` | Warning, center line |
| SPC Red | `#EF4444` | Violation, UCL/LCL |
| Text Primary | `#F1F5F9` | Headings |
| Text Secondary | `#94A3B8` | Labels |
| Text Muted | `#475569` | Timestamps |

---

## Task 0: Fonts + MES Shared Layout

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/components/mes/MesNavBar.tsx`
- Create: `src/components/mes/MesNavBar.test.tsx`
- Create: `src/app/mes/layout.tsx`

### Step 1: Write the failing test

```tsx
// src/components/mes/MesNavBar.test.tsx
import { render, screen } from '@testing-library/react';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/mes/spc',
}));

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) {
    return <a href={href} {...props}>{children}</a>;
  };
});

import { MesNavBar } from './MesNavBar';

describe('MesNavBar', () => {
  it('renders all four nav items', () => {
    render(<MesNavBar />);
    expect(screen.getByText('Equipment')).toBeInTheDocument();
    expect(screen.getByText('Lot Tracker')).toBeInTheDocument();
    expect(screen.getByText('Recipe Manager')).toBeInTheDocument();
    expect(screen.getByText('SPC Dashboard')).toBeInTheDocument();
  });

  it('marks the active route with aria-current', () => {
    render(<MesNavBar />);
    const active = screen.getByRole('link', { name: 'SPC Dashboard' });
    expect(active).toHaveAttribute('aria-current', 'page');
  });
});
```

### Step 2: Run to confirm failure

```bash
cd equipment-monitor && npm test -- --testPathPattern=MesNavBar --no-coverage
```

Expected: FAIL — `Cannot find module './MesNavBar'`

### Step 3: Implement

**Add Fira Code to `src/app/globals.css`** — replace the existing `@import url(...)` line:

```css
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
```

**Create `src/components/mes/MesNavBar.tsx`:**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Equipment' },
  { href: '/mes/lots', label: 'Lot Tracker' },
  { href: '/mes/recipes', label: 'Recipe Manager' },
  { href: '/mes/spc', label: 'SPC Dashboard' },
];

export function MesNavBar() {
  const pathname = usePathname();

  return (
    <nav
      className="flex border-b border-[#1E3A5F] bg-[#111D2E] px-4 overflow-x-auto"
      aria-label="MES navigation"
    >
      {NAV_ITEMS.map(({ href, label }) => {
        const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'min-h-[44px] flex items-center px-4 text-sm font-medium whitespace-nowrap transition-colors',
              isActive
                ? 'border-b-2 border-[#2563EB] text-[#F1F5F9]'
                : 'text-[#94A3B8] hover:text-[#F1F5F9]'
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
```

**Create `src/app/mes/layout.tsx`:**

```tsx
import { Header } from '@/components/layout/header';
import { MesNavBar } from '@/components/mes/MesNavBar';

export default function MesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#0A1628]">
      <Header />
      <MesNavBar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
```

### Step 4: Run tests

```bash
npm test -- --testPathPattern=MesNavBar --no-coverage
```

Expected: PASS

### Step 5: Commit

```bash
git add src/app/globals.css src/components/mes/ src/app/mes/layout.tsx
git commit -m "feat(mes): add Fira Code font, MES nav bar, shared mes layout"
```

---

## Task 1: TypeScript Types + SPC Parameters

**Files:**
- Create: `src/lib/mes-types.ts`
- Create: `src/lib/spc-parameters.ts`

No tests needed — pure type definitions and constants. Verify by TypeScript compilation.

### Step 1: Create `src/lib/mes-types.ts`

```typescript
// Lot
export type LotStatus = 'pending' | 'in_process' | 'on_hold' | 'completed';

export interface Lot {
  id: string;
  product: string;
  recipeId: string;
  waferCount: number;
  status: LotStatus;
  startedAt: Date;
}

// Recipe
export interface Recipe {
  id: string;
  name: string;
  process: string;
  chamber: string;
  exposure: number;   // mJ/cm²
  focus: number;      // nm offset
}

// SPC Measurement — one per wafer, all 5 parameters
export interface SpcMeasurement {
  id: string;
  lotId: string;
  waferNumber: number;
  timestamp: Date;
  cd: number;
  cdu: number;
  ovl_x: number;
  ovl_y: number;
  ler: number;
}

// SPC Violation
export type SpcRule = 'rule_1' | 'rule_2' | 'rule_5';
export type SpcParameter = 'cd' | 'cdu' | 'ovl_x' | 'ovl_y' | 'ler';

export interface SpcViolation {
  id: string;
  lotId: string;
  waferNumber: number;
  parameter: SpcParameter;
  rule: SpcRule;
  value: number;
  limit: number;
  acknowledged: boolean;
  timestamp: Date;
}

// SECS Event (display only)
export type SecsEventType =
  | 's6f11_spc_data'
  | 's2f41_stop'
  | 's2f42_ack'
  | 's2f41_resume'
  | 's2f49_recipe_push'
  | 's2f50_recipe_ack';

export interface SecsEvent {
  id: string;
  type: SecsEventType;
  label: string;
  timestamp: Date;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  secsMessage: Record<string, any>;
}

// Fault
export type FaultType =
  | 'sudden_shift'
  | 'gradual_drift'
  | 'increased_variance'
  | 'overlay_excursion'
  | 'focus_degradation';

export interface FaultConfig {
  type: FaultType;
  parameter: SpcParameter;
  severity: number;
  startedAtWafer: number;
}
```

### Step 2: Create `src/lib/spc-parameters.ts`

```typescript
import type { SpcParameter } from './mes-types';

export interface SpcParamConfig {
  target: number;
  sigma: number;
  unit: string;
  label: string;
  ucl: number;
  lcl: number;
}

export const SPC_PARAMETERS: Record<SpcParameter, SpcParamConfig> = {
  cd:    { target: 45.0, sigma: 1.0, unit: 'nm', label: 'Critical Dimension', ucl: 48.0, lcl: 42.0 },
  cdu:   { target: 2.0,  sigma: 0.3, unit: 'nm', label: 'CD Uniformity',       ucl: 2.9,  lcl: 1.1  },
  ovl_x: { target: 0.0,  sigma: 1.0, unit: 'nm', label: 'Overlay X',           ucl: 3.0,  lcl: -3.0 },
  ovl_y: { target: 0.0,  sigma: 1.0, unit: 'nm', label: 'Overlay Y',           ucl: 3.0,  lcl: -3.0 },
  ler:   { target: 3.0,  sigma: 0.5, unit: 'nm', label: 'Line Edge Roughness', ucl: 4.5,  lcl: 1.5  },
};

export const SPC_PARAM_KEYS = Object.keys(SPC_PARAMETERS) as SpcParameter[];
```

### Step 3: TypeScript check

```bash
npx tsc --noEmit
```

Expected: No errors on the new files.

### Step 4: Commit

```bash
git add src/lib/mes-types.ts src/lib/spc-parameters.ts
git commit -m "feat(mes): add MES TypeScript types and SPC parameter config"
```

---

## Task 2: Mock Data

**Files:**
- Create: `src/lib/mes-mock-data.ts`
- Create: `src/lib/mes-mock-data.test.ts`

### Step 1: Write failing test

```typescript
// src/lib/mes-mock-data.test.ts
import { MOCK_LOTS, MOCK_RECIPES, generateSeedMeasurements } from './mes-mock-data';
import { SPC_PARAMETERS } from './spc-parameters';

describe('MOCK_LOTS', () => {
  it('contains 3 lots', () => {
    expect(MOCK_LOTS).toHaveLength(3);
  });

  it('first lot is in_process', () => {
    expect(MOCK_LOTS[0].status).toBe('in_process');
  });

  it('all lots have valid recipeId', () => {
    const recipeIds = MOCK_RECIPES.map((r) => r.id);
    MOCK_LOTS.forEach((lot) => {
      expect(recipeIds).toContain(lot.recipeId);
    });
  });
});

describe('MOCK_RECIPES', () => {
  it('contains 3 recipes', () => {
    expect(MOCK_RECIPES).toHaveLength(3);
  });
});

describe('generateSeedMeasurements', () => {
  it('generates 10 measurements for a lot', () => {
    const measurements = generateSeedMeasurements('LOT-2026-001', 10);
    expect(measurements).toHaveLength(10);
  });

  it('wafer numbers are sequential starting at 1', () => {
    const measurements = generateSeedMeasurements('LOT-2026-001', 5);
    expect(measurements.map((m) => m.waferNumber)).toEqual([1, 2, 3, 4, 5]);
  });

  it('all CD values are within UCL/LCL', () => {
    const { ucl, lcl } = SPC_PARAMETERS.cd;
    const measurements = generateSeedMeasurements('LOT-2026-001', 20);
    measurements.forEach((m) => {
      expect(m.cd).toBeGreaterThan(lcl);
      expect(m.cd).toBeLessThan(ucl);
    });
  });
});
```

### Step 2: Run to confirm failure

```bash
npm test -- --testPathPattern=mes-mock-data --no-coverage
```

Expected: FAIL — module not found

### Step 3: Implement `src/lib/mes-mock-data.ts`

```typescript
import type { Lot, Recipe, SpcMeasurement } from './mes-types';
import { SPC_PARAMETERS, SPC_PARAM_KEYS } from './spc-parameters';

export const MOCK_RECIPES: Recipe[] = [
  { id: 'LITHO-193nm-v4', name: 'LITHO-193nm-v4', process: 'Lithography', chamber: 'LITHO01', exposure: 38, focus: 0 },
  { id: 'COAT-std-v2',    name: 'COAT-std-v2',    process: 'Coat',        chamber: 'COAT01',  exposure: 0,  focus: 0 },
  { id: 'DEV-alkaline-v1',name: 'DEV-alkaline-v1',process: 'Develop',     chamber: 'DEV01',   exposure: 0,  focus: 0 },
];

export const MOCK_LOTS: Lot[] = [
  { id: 'LOT-2026-001', product: 'LOGIC-7NM', recipeId: 'LITHO-193nm-v4', waferCount: 25, status: 'in_process', startedAt: new Date('2026-05-02T08:00:00') },
  { id: 'LOT-2026-002', product: 'SRAM-7NM',  recipeId: 'COAT-std-v2',    waferCount: 25, status: 'pending',    startedAt: new Date('2026-05-02T10:00:00') },
  { id: 'LOT-2026-003', product: 'LOGIC-5NM', recipeId: 'DEV-alkaline-v1',waferCount: 25, status: 'pending',    startedAt: new Date('2026-05-02T12:00:00') },
];

// Seeded deterministic-ish normal-looking data (no real randomness for seeds)
function stableNoise(lotId: string, wafer: number, param: string): number {
  // Simple deterministic pseudo-noise using string hash
  const seed = (lotId + wafer + param).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const t = ((seed * 9301 + 49297) % 233280) / 233280;
  // Box-Muller approximation using deterministic t: map [0,1] to [-1.5, 1.5]
  return (t - 0.5) * 3;
}

export function generateSeedMeasurements(lotId: string, count: number): SpcMeasurement[] {
  return Array.from({ length: count }, (_, i) => {
    const waferNumber = i + 1;
    const base: Record<string, number> = {};
    SPC_PARAM_KEYS.forEach((param) => {
      const { target, sigma } = SPC_PARAMETERS[param];
      base[param] = target + stableNoise(lotId, waferNumber, param) * sigma * 0.6;
    });

    return {
      id: `${lotId}-w${waferNumber}`,
      lotId,
      waferNumber,
      timestamp: new Date(Date.now() - (count - waferNumber) * 2000),
      cd:    base.cd,
      cdu:   base.cdu,
      ovl_x: base.ovl_x,
      ovl_y: base.ovl_y,
      ler:   base.ler,
    };
  });
}
```

### Step 4: Run tests

```bash
npm test -- --testPathPattern=mes-mock-data --no-coverage
```

Expected: PASS

### Step 5: Commit

```bash
git add src/lib/mes-mock-data.ts src/lib/mes-mock-data.test.ts
git commit -m "feat(mes): add MES mock lots, recipes, and seed measurement generator"
```

---

## Task 3: Zustand MES SPC Store

**Files:**
- Create: `src/stores/mes-spc-store.ts`
- Create: `src/stores/mes-spc-store.test.ts`

### Step 1: Write failing tests

```typescript
// src/stores/mes-spc-store.test.ts
import { useMesSpcStore, INITIAL_MES_SPC_STATE } from '@/stores/mes-spc-store';
import { MOCK_LOTS, MOCK_RECIPES, generateSeedMeasurements } from '@/lib/mes-mock-data';
import type { SpcViolation, SecsEvent } from '@/lib/mes-types';

beforeEach(() => {
  useMesSpcStore.setState(INITIAL_MES_SPC_STATE);
});

describe('initial state', () => {
  it('has empty measurements', () => {
    expect(useMesSpcStore.getState().measurements).toHaveLength(0);
  });

  it('has equipmentState idle', () => {
    expect(useMesSpcStore.getState().equipmentState).toBe('idle');
  });
});

describe('startProcessing', () => {
  it('sets activeLotId and equipmentState to processing', () => {
    useMesSpcStore.getState().startProcessing('LOT-2026-001', 'LITHO-193nm-v4');
    const state = useMesSpcStore.getState();
    expect(state.activeLotId).toBe('LOT-2026-001');
    expect(state.equipmentState).toBe('processing');
  });
});

describe('addMeasurement', () => {
  it('appends measurement to array', () => {
    const m = generateSeedMeasurements('LOT-2026-001', 1)[0];
    useMesSpcStore.getState().addMeasurement(m);
    expect(useMesSpcStore.getState().measurements).toHaveLength(1);
  });
});

describe('addViolation', () => {
  it('appends violation and sets equipmentState to inhibited', () => {
    const v: SpcViolation = {
      id: 'v1', lotId: 'LOT-2026-001', waferNumber: 5,
      parameter: 'cd', rule: 'rule_1', value: 49.0, limit: 48.0,
      acknowledged: false, timestamp: new Date(),
    };
    useMesSpcStore.getState().addViolation(v);
    const state = useMesSpcStore.getState();
    expect(state.violations).toHaveLength(1);
    expect(state.equipmentState).toBe('inhibited');
  });
});

describe('acknowledgeViolation', () => {
  it('marks violation acknowledged and resets equipmentState', () => {
    const v: SpcViolation = {
      id: 'v1', lotId: 'LOT-2026-001', waferNumber: 5,
      parameter: 'cd', rule: 'rule_1', value: 49.0, limit: 48.0,
      acknowledged: false, timestamp: new Date(),
    };
    useMesSpcStore.setState({ violations: [v], equipmentState: 'inhibited' });
    useMesSpcStore.getState().acknowledgeViolation('v1');
    const state = useMesSpcStore.getState();
    expect(state.violations[0].acknowledged).toBe(true);
    expect(state.equipmentState).toBe('processing');
  });
});

describe('addEvent', () => {
  it('caps events at 100', () => {
    const store = useMesSpcStore.getState();
    for (let i = 0; i < 105; i++) {
      const e: SecsEvent = {
        id: `e${i}`, type: 's6f11_spc_data', label: `event ${i}`,
        timestamp: new Date(), secsMessage: {},
      };
      store.addEvent(e);
    }
    expect(useMesSpcStore.getState().events).toHaveLength(100);
  });
});

describe('injectFault / clearFault', () => {
  it('sets and clears activeFault', () => {
    useMesSpcStore.getState().injectFault({ type: 'sudden_shift', parameter: 'cd', severity: 1.0, startedAtWafer: 5 });
    expect(useMesSpcStore.getState().activeFault).not.toBeNull();
    useMesSpcStore.getState().clearFault();
    expect(useMesSpcStore.getState().activeFault).toBeNull();
  });
});
```

### Step 2: Confirm failure

```bash
npm test -- --testPathPattern=mes-spc-store --no-coverage
```

Expected: FAIL

### Step 3: Implement `src/stores/mes-spc-store.ts`

```typescript
import { create } from 'zustand';
import type {
  Lot, Recipe, SpcMeasurement, SpcViolation, SecsEvent, FaultConfig,
} from '@/lib/mes-types';
import { MOCK_LOTS, MOCK_RECIPES } from '@/lib/mes-mock-data';

interface MesSpcState {
  lots: Lot[];
  recipes: Recipe[];
  activeLotId: string | null;
  activeRecipeId: string | null;
  waferNumber: number;
  equipmentState: 'idle' | 'processing' | 'inhibited';
  activeFault: FaultConfig | null;
  measurements: SpcMeasurement[];
  violations: SpcViolation[];
  events: SecsEvent[];

  updateLot: (lotId: string, patch: Partial<Lot>) => void;
  startProcessing: (lotId: string, recipeId: string) => void;
  stopProcessing: () => void;
  addMeasurement: (m: SpcMeasurement) => void;
  addViolation: (v: SpcViolation) => void;
  acknowledgeViolation: (violationId: string) => void;
  resumeEquipment: () => void;
  addEvent: (e: SecsEvent) => void;
  injectFault: (fault: FaultConfig) => void;
  clearFault: () => void;
  incrementWafer: () => void;
}

export const INITIAL_MES_SPC_STATE: Omit<MesSpcState,
  | 'updateLot' | 'startProcessing' | 'stopProcessing'
  | 'addMeasurement' | 'addViolation' | 'acknowledgeViolation'
  | 'resumeEquipment' | 'addEvent' | 'injectFault' | 'clearFault'
  | 'incrementWafer'
> = {
  lots: MOCK_LOTS,
  recipes: MOCK_RECIPES,
  activeLotId: null,
  activeRecipeId: null,
  waferNumber: 1,
  equipmentState: 'idle',
  activeFault: null,
  measurements: [],
  violations: [],
  events: [],
};

export const useMesSpcStore = create<MesSpcState>((set, get) => ({
  ...INITIAL_MES_SPC_STATE,

  updateLot: (lotId, patch) =>
    set((s) => ({ lots: s.lots.map((l) => l.id === lotId ? { ...l, ...patch } : l) })),

  startProcessing: (lotId, recipeId) =>
    set({ activeLotId: lotId, activeRecipeId: recipeId, equipmentState: 'processing', waferNumber: 1 }),

  stopProcessing: () =>
    set({ equipmentState: 'idle' }),

  addMeasurement: (m) =>
    set((s) => ({ measurements: [...s.measurements, m] })),

  addViolation: (v) =>
    set((s) => ({
      violations: [...s.violations, v],
      equipmentState: 'inhibited' as const,
    })),

  acknowledgeViolation: (violationId) =>
    set((s) => ({
      violations: s.violations.map((v) =>
        v.id === violationId ? { ...v, acknowledged: true } : v
      ),
      equipmentState: 'processing' as const,
    })),

  resumeEquipment: () =>
    set({ equipmentState: 'processing', activeFault: null }),

  addEvent: (e) =>
    set((s) => ({
      events: [e, ...s.events].slice(0, 100),
    })),

  injectFault: (fault) =>
    set({ activeFault: fault }),

  clearFault: () =>
    set({ activeFault: null }),

  incrementWafer: () =>
    set((s) => ({ waferNumber: s.waferNumber + 1 })),
}));
```

### Step 4: Run tests

```bash
npm test -- --testPathPattern=mes-spc-store --no-coverage
```

Expected: PASS

### Step 5: Commit

```bash
git add src/stores/mes-spc-store.ts src/stores/mes-spc-store.test.ts
git commit -m "feat(mes): add MES SPC Zustand store with full action set"
```

---

## Task 4: SPC Engine (Western Electric Rules)

**Files:**
- Create: `src/lib/spc-engine.ts`
- Create: `src/lib/spc-engine.test.ts`

### Step 1: Write failing tests

```typescript
// src/lib/spc-engine.test.ts
import { evaluateSpc } from './spc-engine';
import { SPC_PARAMETERS } from './spc-parameters';

const { target, sigma, ucl, lcl } = SPC_PARAMETERS.cd;
const twoSigma = target + 2 * sigma;

function makeWindow(values: number[]) {
  return values.map((v, i) => ({ waferNumber: i + 1, cd: v, cdu: 2.0, ovl_x: 0, ovl_y: 0, ler: 3.0 }));
}

describe('Rule 1 — beyond 3 sigma', () => {
  it('returns violation when point exceeds UCL', () => {
    const window = makeWindow([...Array(5).fill(target), ucl + 0.5]);
    const result = evaluateSpc(window, 'cd');
    expect(result).not.toBeNull();
    expect(result?.rule).toBe('rule_1');
  });

  it('returns violation when point is below LCL', () => {
    const window = makeWindow([...Array(5).fill(target), lcl - 0.5]);
    const result = evaluateSpc(window, 'cd');
    expect(result?.rule).toBe('rule_1');
  });

  it('returns null for in-control data', () => {
    const window = makeWindow(Array(10).fill(target));
    expect(evaluateSpc(window, 'cd')).toBeNull();
  });
});

describe('Rule 2 — 7 consecutive same side', () => {
  it('returns violation for 7 consecutive points above CL', () => {
    const window = makeWindow([target, target, ...Array(7).fill(target + sigma)]);
    const result = evaluateSpc(window, 'cd');
    expect(result?.rule).toBe('rule_2');
  });

  it('does not trigger on 6 consecutive', () => {
    const window = makeWindow([target, target, target, ...Array(6).fill(target + sigma)]);
    expect(evaluateSpc(window, 'cd')).toBeNull();
  });
});

describe('Rule 5 — 2 of 3 beyond 2 sigma', () => {
  it('returns violation when 2 of last 3 beyond +2 sigma', () => {
    const window = makeWindow([
      target, target, target,
      twoSigma + 0.1, target, twoSigma + 0.1,
    ]);
    const result = evaluateSpc(window, 'cd');
    expect(result?.rule).toBe('rule_5');
  });

  it('does not trigger on only 1 of 3', () => {
    const window = makeWindow([target, target, target, twoSigma + 0.1, target, target]);
    expect(evaluateSpc(window, 'cd')).toBeNull();
  });
});
```

### Step 2: Confirm failure

```bash
npm test -- --testPathPattern=spc-engine --no-coverage
```

### Step 3: Implement `src/lib/spc-engine.ts`

```typescript
import { SPC_PARAMETERS } from './spc-parameters';
import type { SpcParameter, SpcViolation } from './mes-types';

type PartialMeasurement = Record<SpcParameter, number> & { waferNumber: number };

export function evaluateSpc(
  window: PartialMeasurement[],
  parameter: SpcParameter,
): Omit<SpcViolation, 'id' | 'lotId' | 'acknowledged' | 'timestamp'> | null {
  if (window.length === 0) return null;

  const { target, sigma, ucl, lcl } = SPC_PARAMETERS[parameter];
  const values = window.map((m) => m[parameter] as number);
  const last = values[values.length - 1];
  const lastWafer = window[window.length - 1].waferNumber;

  // Rule 1: single point beyond 3 sigma
  if (last > ucl) return { parameter, rule: 'rule_1', waferNumber: lastWafer, value: last, limit: ucl };
  if (last < lcl) return { parameter, rule: 'rule_1', waferNumber: lastWafer, value: last, limit: lcl };

  // Rule 2: 7+ consecutive same side of center line
  if (values.length >= 7) {
    const tail = values.slice(-7);
    const allAbove = tail.every((v) => v > target);
    const allBelow = tail.every((v) => v < target);
    if (allAbove || allBelow) {
      return { parameter, rule: 'rule_2', waferNumber: lastWafer, value: last, limit: target };
    }
  }

  // Rule 5: 2 of 3 consecutive beyond +/- 2 sigma (same side)
  if (values.length >= 3) {
    const tail = values.slice(-3);
    const twoSigmaPos = target + 2 * sigma;
    const twoSigmaNeg = target - 2 * sigma;
    const aboveCount = tail.filter((v) => v > twoSigmaPos).length;
    const belowCount = tail.filter((v) => v < twoSigmaNeg).length;
    if (aboveCount >= 2) return { parameter, rule: 'rule_5', waferNumber: lastWafer, value: last, limit: twoSigmaPos };
    if (belowCount >= 2) return { parameter, rule: 'rule_5', waferNumber: lastWafer, value: last, limit: twoSigmaNeg };
  }

  return null;
}
```

### Step 4: Run tests

```bash
npm test -- --testPathPattern=spc-engine --no-coverage
```

Expected: PASS

### Step 5: Commit

```bash
git add src/lib/spc-engine.ts src/lib/spc-engine.test.ts
git commit -m "feat(mes): add SPC engine with Western Electric Rules 1, 2, 5"
```

---

## Task 5: Metrology Generator

**Files:**
- Create: `src/lib/metrology-generator.ts`
- Create: `src/lib/metrology-generator.test.ts`

### Step 1: Write failing tests

```typescript
// src/lib/metrology-generator.test.ts
import { generateMeasurement } from './metrology-generator';
import { SPC_PARAMETERS } from './spc-parameters';

describe('generateMeasurement — no fault', () => {
  it('CD stays within UCL/LCL across 1000 samples', () => {
    const { ucl, lcl } = SPC_PARAMETERS.cd;
    for (let i = 0; i < 1000; i++) {
      const result = generateMeasurement(1, null);
      expect(result.cd).toBeGreaterThan(lcl);
      expect(result.cd).toBeLessThan(ucl);
    }
  });
});

describe('generateMeasurement — sudden_shift fault', () => {
  it('shifts CD above UCL', () => {
    const { ucl } = SPC_PARAMETERS.cd;
    const fault = { type: 'sudden_shift' as const, parameter: 'cd' as const, severity: 1.0, startedAtWafer: 1 };
    let foundExceedance = false;
    for (let i = 0; i < 50; i++) {
      const result = generateMeasurement(2, fault);
      if (result.cd > ucl) { foundExceedance = true; break; }
    }
    expect(foundExceedance).toBe(true);
  });
});

describe('generateMeasurement — gradual_drift fault', () => {
  it('CD increases with each wafer', () => {
    const fault = { type: 'gradual_drift' as const, parameter: 'cd' as const, severity: 1.0, startedAtWafer: 1 };
    const w5 = Array.from({ length: 10 }, () => generateMeasurement(5, fault)).map((m) => m.cd);
    const w15 = Array.from({ length: 10 }, () => generateMeasurement(15, fault)).map((m) => m.cd);
    const avg5 = w5.reduce((a, b) => a + b) / w5.length;
    const avg15 = w15.reduce((a, b) => a + b) / w15.length;
    expect(avg15).toBeGreaterThan(avg5);
  });
});
```

### Step 2: Confirm failure

```bash
npm test -- --testPathPattern=metrology-generator --no-coverage
```

### Step 3: Implement `src/lib/metrology-generator.ts`

```typescript
import { SPC_PARAMETERS, SPC_PARAM_KEYS } from './spc-parameters';
import type { SpcMeasurement, FaultConfig, SpcParameter } from './mes-types';

function gaussianRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function generateValue(
  parameter: SpcParameter,
  waferNumber: number,
  fault: FaultConfig | null,
): number {
  const { target, sigma } = SPC_PARAMETERS[parameter];

  // Base noise: 0.6x sigma keeps normal data well within +/-2 sigma
  let value = target + gaussianRandom() * sigma * 0.6;

  if (fault && fault.parameter === parameter) {
    const wafersSinceFault = waferNumber - fault.startedAtWafer;
    switch (fault.type) {
      case 'sudden_shift':
        value += 4.0 * fault.severity;
        break;
      case 'gradual_drift':
        value += 0.3 * wafersSinceFault * fault.severity;
        break;
      case 'increased_variance':
        value = target + gaussianRandom() * sigma * 2.0;
        break;
      case 'overlay_excursion':
        value += 0.5 * wafersSinceFault * fault.severity;
        break;
      case 'focus_degradation':
        value = target + gaussianRandom() * sigma * 2.4;
        break;
    }
  }

  return value;
}

export function generateMeasurement(
  waferNumber: number,
  fault: FaultConfig | null,
): Omit<SpcMeasurement, 'id' | 'lotId' | 'timestamp'> {
  const values: Record<string, number> = {};
  SPC_PARAM_KEYS.forEach((param) => {
    values[param] = generateValue(param, waferNumber, fault);
  });

  return {
    waferNumber,
    cd:    values.cd,
    cdu:   values.cdu,
    ovl_x: values.ovl_x,
    ovl_y: values.ovl_y,
    ler:   values.ler,
  };
}
```

### Step 4: Run tests

```bash
npm test -- --testPathPattern=metrology-generator --no-coverage
```

Expected: PASS

### Step 5: Commit

```bash
git add src/lib/metrology-generator.ts src/lib/metrology-generator.test.ts
git commit -m "feat(mes): add metrology generator with fault injection formulas"
```

---

## Task 6: SECS Message Log Factory

**Files:**
- Create: `src/lib/secs-message-log.ts`
- Create: `src/lib/secs-message-log.test.ts`

### Step 1: Write failing tests

```typescript
// src/lib/secs-message-log.test.ts
import { makeS6F11, makeS2F41Stop, makeS2F42Ack, makeS2F41Resume, makeS2F49, makeS2F50 } from './secs-message-log';

describe('makeS6F11', () => {
  it('has correct stream/function', () => {
    const event = makeS6F11('LOT-001', 5, { cd: 45.2, cdu: 2.0, ovl_x: 0.1, ovl_y: -0.1, ler: 3.1 });
    expect(event.secsMessage.stream).toBe(6);
    expect(event.secsMessage.function).toBe(11);
  });

  it('label mentions wafer number', () => {
    const event = makeS6F11('LOT-001', 5, { cd: 45.2, cdu: 2.0, ovl_x: 0.1, ovl_y: -0.1, ler: 3.1 });
    expect(event.label).toMatch(/wafer 5/i);
  });
});

describe('makeS2F41Stop', () => {
  it('has rcmd STOP', () => {
    const event = makeS2F41Stop('cd', 'rule_1');
    expect(event.secsMessage.rcmd).toBe('STOP');
  });

  it('reason encodes parameter and rule', () => {
    const event = makeS2F41Stop('cd', 'rule_1');
    const reason = event.secsMessage.params[0].cpval;
    expect(reason).toContain('cd');
    expect(reason).toContain('rule_1');
  });
});

describe('makeS2F42Ack', () => {
  it('has hcack 0', () => {
    expect(makeS2F42Ack().secsMessage.hcack).toBe(0);
  });
});

describe('makeS2F49', () => {
  it('has stream 2 function 49', () => {
    const event = makeS2F49('LITHO-193nm-v4');
    expect(event.secsMessage.stream).toBe(2);
    expect(event.secsMessage.function).toBe(49);
  });
});
```

### Step 2: Confirm failure

```bash
npm test -- --testPathPattern=secs-message-log --no-coverage
```

### Step 3: Implement `src/lib/secs-message-log.ts`

```typescript
import type { SecsEvent, SecsEventType, SpcParameter, SpcRule } from './mes-types';

let _seq = 0;
function nextId(prefix: SecsEventType) {
  return `${prefix}-${Date.now()}-${++_seq}`;
}

type Values = { cd: number; cdu: number; ovl_x: number; ovl_y: number; ler: number };

export function makeS6F11(lotId: string, waferNumber: number, values: Values): SecsEvent {
  return {
    id: nextId('s6f11_spc_data'),
    type: 's6f11_spc_data',
    label: `S6F11 Collection Event: ${lotId} wafer ${waferNumber}`,
    timestamp: new Date(),
    secsMessage: {
      stream: 6, function: 11, ceid: 100,
      reports: [
        { rptid: 1001, parameter: 'cd',    value: +values.cd.toFixed(3) },
        { rptid: 1002, parameter: 'cdu',   value: +values.cdu.toFixed(3) },
        { rptid: 1003, parameter: 'ovl_x', value: +values.ovl_x.toFixed(3) },
        { rptid: 1004, parameter: 'ovl_y', value: +values.ovl_y.toFixed(3) },
        { rptid: 1005, parameter: 'ler',   value: +values.ler.toFixed(3) },
      ],
    },
  };
}

export function makeS2F41Stop(parameter: SpcParameter, rule: SpcRule): SecsEvent {
  return {
    id: nextId('s2f41_stop'),
    type: 's2f41_stop',
    label: 'S2F41 STOP -> LITHO01',
    timestamp: new Date(),
    secsMessage: {
      stream: 2, function: 41, rcmd: 'STOP',
      params: [{ cpname: 'REASON', cpval: `SPC_VIOLATION:${parameter}:${rule}` }],
    },
  };
}

export function makeS2F42Ack(): SecsEvent {
  return {
    id: nextId('s2f42_ack'),
    type: 's2f42_ack',
    label: 'S2F42 ACK (HCACK=0)',
    timestamp: new Date(),
    secsMessage: { stream: 2, function: 42, hcack: 0 },
  };
}

export function makeS2F41Resume(): SecsEvent {
  return {
    id: nextId('s2f41_resume'),
    type: 's2f41_resume',
    label: 'S2F41 RESUME -> LITHO01',
    timestamp: new Date(),
    secsMessage: {
      stream: 2, function: 41, rcmd: 'RESUME',
      params: [{ cpname: 'REASON', cpval: 'OPERATOR_ACKNOWLEDGE' }],
    },
  };
}

export function makeS2F49(recipeId: string): SecsEvent {
  return {
    id: nextId('s2f49_recipe_push'),
    type: 's2f49_recipe_push',
    label: `S2F49 Recipe Push: ${recipeId}`,
    timestamp: new Date(),
    secsMessage: {
      stream: 2, function: 49, rcmd: 'PP-LOAD',
      params: [{ cpname: 'PPID', cpval: recipeId }],
    },
  };
}

export function makeS2F50(success: boolean): SecsEvent {
  return {
    id: nextId('s2f50_recipe_ack'),
    type: 's2f50_recipe_ack',
    label: `S2F50 Recipe ACK (${success ? 'OK' : 'FAIL'})`,
    timestamp: new Date(),
    secsMessage: { stream: 2, function: 50, hcack: success ? 0 : 1 },
  };
}
```

### Step 4: Run tests

```bash
npm test -- --testPathPattern=secs-message-log --no-coverage
```

Expected: PASS

### Step 5: Commit

```bash
git add src/lib/secs-message-log.ts src/lib/secs-message-log.test.ts
git commit -m "feat(mes): add SECS message factory for display-only event feed"
```

---

## Task 7: Simulator Engine

**Files:**
- Create: `src/lib/simulator-engine.ts`
- Create: `src/lib/simulator-engine.test.ts`

### Step 1: Write failing tests

```typescript
// src/lib/simulator-engine.test.ts
import { SimulatorEngine } from './simulator-engine';
import { useMesSpcStore, INITIAL_MES_SPC_STATE } from '@/stores/mes-spc-store';

jest.useFakeTimers();

beforeEach(() => {
  useMesSpcStore.setState({ ...INITIAL_MES_SPC_STATE });
  useMesSpcStore.getState().startProcessing('LOT-2026-001', 'LITHO-193nm-v4');
  // Pre-seed measurements so engine has window data
  useMesSpcStore.setState({ measurements: [] });
});

afterEach(() => {
  jest.clearAllTimers();
});

describe('SimulatorEngine', () => {
  it('adds a measurement after one tick (2000ms)', () => {
    const engine = new SimulatorEngine();
    engine.start();
    jest.advanceTimersByTime(2000);
    expect(useMesSpcStore.getState().measurements.length).toBeGreaterThan(0);
    engine.stop();
  });

  it('adds S6F11 event after one tick', () => {
    const engine = new SimulatorEngine();
    engine.start();
    jest.advanceTimersByTime(2000);
    const events = useMesSpcStore.getState().events;
    expect(events.some((e) => e.type === 's6f11_spc_data')).toBe(true);
    engine.stop();
  });

  it('stops after calling stop()', () => {
    const engine = new SimulatorEngine();
    engine.start();
    engine.stop();
    jest.advanceTimersByTime(10000);
    expect(useMesSpcStore.getState().measurements.length).toBe(0);
  });

  it('stops and sets lot completed when wafer >= 25', () => {
    useMesSpcStore.setState({ waferNumber: 25 });
    const engine = new SimulatorEngine();
    engine.start();
    jest.advanceTimersByTime(2000);
    const state = useMesSpcStore.getState();
    const lot = state.lots.find((l) => l.id === 'LOT-2026-001');
    expect(lot?.status).toBe('completed');
    engine.stop();
  });
});
```

### Step 2: Confirm failure

```bash
npm test -- --testPathPattern=simulator-engine --no-coverage
```

### Step 3: Implement `src/lib/simulator-engine.ts`

```typescript
import { useMesSpcStore } from '@/stores/mes-spc-store';
import { generateMeasurement } from './metrology-generator';
import { evaluateSpc } from './spc-engine';
import { makeS6F11, makeS2F41Stop, makeS2F42Ack } from './secs-message-log';
import { SPC_PARAM_KEYS } from './spc-parameters';
import type { SpcMeasurement, SpcViolation } from './mes-types';

const TICK_MS = 2000;
const MAX_WAFERS = 25;
const SPC_WINDOW = 20;

export class SimulatorEngine {
  private intervalId: ReturnType<typeof setInterval> | null = null;

  start() {
    if (this.intervalId !== null) return;
    this.intervalId = setInterval(() => this.tick(), TICK_MS);
  }

  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick() {
    const store = useMesSpcStore.getState();
    const { activeLotId, activeRecipeId, waferNumber, activeFault, equipmentState } = store;

    if (!activeLotId || equipmentState === 'inhibited') return;

    // Complete lot
    if (waferNumber > MAX_WAFERS) {
      store.updateLot(activeLotId, { status: 'completed' });
      store.stopProcessing();
      this.stop();
      return;
    }

    // Generate measurement
    const generated = generateMeasurement(waferNumber, activeFault);
    const measurement: SpcMeasurement = {
      id: `${activeLotId}-w${waferNumber}-${Date.now()}`,
      lotId: activeLotId,
      timestamp: new Date(),
      ...generated,
    };
    store.addMeasurement(measurement);

    // Log S6F11
    store.addEvent(makeS6F11(activeLotId, waferNumber, generated));

    // Evaluate SPC — build sliding window
    const allMeasurements = useMesSpcStore.getState().measurements
      .filter((m) => m.lotId === activeLotId)
      .slice(-SPC_WINDOW);

    for (const param of SPC_PARAM_KEYS) {
      const violation = evaluateSpc(allMeasurements, param);
      if (violation) {
        const v: SpcViolation = {
          id: `viol-${Date.now()}-${param}`,
          lotId: activeLotId,
          acknowledged: false,
          timestamp: new Date(),
          ...violation,
        };
        store.addViolation(v);
        store.updateLot(activeLotId, { status: 'on_hold' });
        store.addEvent(makeS2F41Stop(param, violation.rule));
        store.addEvent(makeS2F42Ack());
        this.stop();
        return;
      }
    }

    // Increment wafer
    store.incrementWafer();

    // Check completion after increment
    if (waferNumber >= MAX_WAFERS) {
      store.updateLot(activeLotId, { status: 'completed' });
      store.stopProcessing();
      this.stop();
    }
  }
}
```

### Step 4: Run tests

```bash
npm test -- --testPathPattern=simulator-engine --no-coverage
```

Expected: PASS

### Step 5: Commit

```bash
git add src/lib/simulator-engine.ts src/lib/simulator-engine.test.ts
git commit -m "feat(mes): add SimulatorEngine with tick loop, SPC evaluation, fault injection"
```

---

## Task 8: KpiStrip Component

**Files:**
- Create: `src/components/spc/KpiStrip.tsx`
- Create: `src/components/spc/KpiStrip.test.tsx`

### Step 1: Write failing tests

```tsx
// src/components/spc/KpiStrip.test.tsx
import { render, screen } from '@testing-library/react';
import { KpiStrip } from './KpiStrip';
import type { SpcMeasurement } from '@/lib/mes-types';

const baseMeasurement: SpcMeasurement = {
  id: 'm1', lotId: 'LOT-001', waferNumber: 5, timestamp: new Date(),
  cd: 45.0, cdu: 2.0, ovl_x: 0.0, ovl_y: 0.0, ler: 3.0,
};

describe('KpiStrip', () => {
  it('renders all 5 parameter labels', () => {
    render(<KpiStrip latest={baseMeasurement} hasViolation={false} />);
    expect(screen.getByText('Critical Dimension')).toBeInTheDocument();
    expect(screen.getByText('CD Uniformity')).toBeInTheDocument();
    expect(screen.getByText('Overlay X')).toBeInTheDocument();
    expect(screen.getByText('Overlay Y')).toBeInTheDocument();
    expect(screen.getByText('Line Edge Roughness')).toBeInTheDocument();
  });

  it('shows OK when no violation', () => {
    render(<KpiStrip latest={baseMeasurement} hasViolation={false} />);
    expect(screen.getAllByText('OK').length).toBeGreaterThan(0);
  });

  it('shows CD value formatted to 2 decimal places', () => {
    render(<KpiStrip latest={{ ...baseMeasurement, cd: 45.123 }} hasViolation={false} />);
    expect(screen.getByText('45.12')).toBeInTheDocument();
  });

  it('renders skeleton when no measurement provided', () => {
    render(<KpiStrip latest={null} hasViolation={false} />);
    expect(screen.getByTestId('kpi-strip-skeleton')).toBeInTheDocument();
  });
});
```

### Step 2: Confirm failure

```bash
npm test -- --testPathPattern=KpiStrip --no-coverage
```

### Step 3: Implement `src/components/spc/KpiStrip.tsx`

```tsx
'use client';

import { SPC_PARAMETERS, SPC_PARAM_KEYS } from '@/lib/spc-parameters';
import type { SpcMeasurement, SpcParameter } from '@/lib/mes-types';
import { cn } from '@/lib/utils';

interface KpiStripProps {
  latest: SpcMeasurement | null;
  hasViolation: boolean;
  violatedParam?: SpcParameter;
}

export function KpiStrip({ latest, hasViolation, violatedParam }: KpiStripProps) {
  if (!latest) {
    return (
      <div data-testid="kpi-strip-skeleton" className="grid grid-cols-2 md:grid-cols-5 gap-2 p-3 bg-[#111D2E] rounded border border-[#1E3A5F] animate-pulse">
        {SPC_PARAM_KEYS.map((param) => (
          <div key={param} className="h-14 bg-[#182840] rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 p-3 bg-[#111D2E] rounded border border-[#1E3A5F]">
      {SPC_PARAM_KEYS.map((param) => {
        const config = SPC_PARAMETERS[param];
        const value = latest[param as keyof SpcMeasurement] as number;
        const isViolating = hasViolation && violatedParam === param;
        const isOk = value > config.lcl && value < config.ucl;

        return (
          <div
            key={param}
            className={cn(
              'flex flex-col gap-0.5 px-3 py-2 rounded',
              isViolating ? 'bg-red-950/40 border border-[#EF4444]' : 'bg-[#182840]'
            )}
          >
            <span className="text-xs text-[#94A3B8] truncate">{config.label}</span>
            <span className="font-['Fira_Code',monospace] text-lg font-semibold text-[#F1F5F9]">
              {value.toFixed(2)}
              <span className="text-xs font-normal text-[#94A3B8] ml-1">{config.unit}</span>
            </span>
            <span className={cn('text-xs font-medium', isOk ? 'text-[#10B981]' : 'text-[#EF4444]')}>
              {isOk ? 'OK' : 'OOC'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
```

### Step 4: Run tests

```bash
npm test -- --testPathPattern=KpiStrip --no-coverage
```

Expected: PASS

### Step 5: Commit

```bash
git add src/components/spc/KpiStrip.tsx src/components/spc/KpiStrip.test.tsx
git commit -m "feat(mes): add KpiStrip component with 5-parameter display and skeleton"
```

---

## Task 9: ThumbnailChart Component

**Files:**
- Create: `src/components/spc/ThumbnailChart.tsx`
- Create: `src/components/spc/ThumbnailChart.test.tsx`

### Step 1: Write failing tests

```tsx
// src/components/spc/ThumbnailChart.test.tsx
import { render, screen } from '@testing-library/react';

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(), unobserve: jest.fn(), disconnect: jest.fn(),
}));

import { ThumbnailChart } from './ThumbnailChart';

const mockData = Array.from({ length: 10 }, (_, i) => ({ waferNumber: i + 1, value: 45 + Math.sin(i) }));

describe('ThumbnailChart', () => {
  it('renders the parameter label', () => {
    render(
      <ThumbnailChart label="CDU" unit="nm" data={mockData} ucl={2.9} lcl={1.1} isActive={false} />
    );
    expect(screen.getByText('CDU')).toBeInTheDocument();
  });

  it('shows ACTIVE badge when isActive is true', () => {
    render(
      <ThumbnailChart label="CDU" unit="nm" data={mockData} ucl={2.9} lcl={1.1} isActive={true} />
    );
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('renders the chart container', () => {
    const { container } = render(
      <ThumbnailChart label="CDU" unit="nm" data={mockData} ucl={2.9} lcl={1.1} isActive={false} />
    );
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });
});
```

### Step 2: Confirm failure

```bash
npm test -- --testPathPattern=ThumbnailChart --no-coverage
```

### Step 3: Implement `src/components/spc/ThumbnailChart.tsx`

```tsx
'use client';

import { LineChart, Line, ReferenceLine, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface ThumbnailChartProps {
  label: string;
  unit: string;
  data: { waferNumber: number; value: number }[];
  ucl: number;
  lcl: number;
  isActive: boolean;
  onClick?: () => void;
}

export function ThumbnailChart({ label, unit, data, ucl, lcl, isActive, onClick }: ThumbnailChartProps) {
  const latest = data[data.length - 1]?.value;
  const isOk = latest !== undefined && latest > lcl && latest < ucl;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col gap-1 p-2 rounded border cursor-pointer transition-colors w-full text-left',
        isActive
          ? 'border-l-2 border-l-[#2563EB] border-[#2563EB] bg-[#182840]'
          : 'border-[#1E3A5F] bg-[#111D2E] hover:bg-[#182840]'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#94A3B8]">{label}</span>
        {isActive && (
          <span className="text-[10px] font-semibold text-[#2563EB] bg-blue-900/30 px-1 rounded">ACTIVE</span>
        )}
      </div>

      <div className="h-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <ReferenceLine y={ucl} stroke="#EF4444" strokeDasharray="3 3" strokeOpacity={0.5} />
            <ReferenceLine y={lcl} stroke="#EF4444" strokeDasharray="3 3" strokeOpacity={0.5} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={isOk ? '#3B82F6' : '#EF4444'}
              dot={false}
              strokeWidth={1.5}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {latest !== undefined && (
        <span className={cn('font-[\'Fira_Code\',monospace] text-sm font-semibold', isOk ? 'text-[#10B981]' : 'text-[#EF4444]')}>
          {latest.toFixed(2)}
          <span className="text-[10px] font-normal text-[#94A3B8] ml-1">{unit}</span>
        </span>
      )}
    </button>
  );
}
```

### Step 4: Run tests

```bash
npm test -- --testPathPattern=ThumbnailChart --no-coverage
```

Expected: PASS

### Step 5: Commit

```bash
git add src/components/spc/ThumbnailChart.tsx src/components/spc/ThumbnailChart.test.tsx
git commit -m "feat(mes): add ThumbnailChart sparkline with active/violation states"
```

---

## Task 10: ControlChart Component

**Files:**
- Create: `src/components/spc/ControlChart.tsx`
- Create: `src/components/spc/ControlChart.test.tsx`

### Step 1: Write failing tests

```tsx
// src/components/spc/ControlChart.test.tsx
import { render, screen } from '@testing-library/react';

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(), unobserve: jest.fn(), disconnect: jest.fn(),
}));

import { ControlChart } from './ControlChart';

const mockData = Array.from({ length: 10 }, (_, i) => ({
  waferNumber: i + 1, value: 45.0 + (Math.random() - 0.5), isViolation: false,
}));

const config = { target: 45, sigma: 1, ucl: 48, lcl: 42, unit: 'nm', label: 'Critical Dimension' };

describe('ControlChart', () => {
  it('renders the parameter label as heading', () => {
    render(<ControlChart paramLabel="CD (Critical Dimension)" config={config} data={mockData} />);
    expect(screen.getByText('CD (Critical Dimension)')).toBeInTheDocument();
  });

  it('shows UCL value', () => {
    render(<ControlChart paramLabel="CD" config={config} data={mockData} />);
    expect(screen.getByText(/48\.0/)).toBeInTheDocument();
  });

  it('shows LCL value', () => {
    render(<ControlChart paramLabel="CD" config={config} data={mockData} />);
    expect(screen.getByText(/42\.0/)).toBeInTheDocument();
  });

  it('renders chart wrapper', () => {
    const { container } = render(<ControlChart paramLabel="CD" config={config} data={mockData} />);
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });
});
```

### Step 2: Confirm failure

```bash
npm test -- --testPathPattern=ControlChart --no-coverage
```

### Step 3: Implement `src/components/spc/ControlChart.tsx`

```tsx
'use client';

import {
  ComposedChart, Line, ReferenceLine, ReferenceArea,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot,
} from 'recharts';
import type { SpcParamConfig } from '@/lib/spc-parameters';

interface ChartDataPoint {
  waferNumber: number;
  value: number;
  isViolation: boolean;
}

interface ControlChartProps {
  paramLabel: string;
  config: SpcParamConfig;
  data: ChartDataPoint[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomDot(props: any) {
  const { cx, cy, payload } = props;
  if (payload?.isViolation) {
    return (
      <circle
        cx={cx} cy={cy} r={5}
        fill="#EF4444"
        style={{ filter: 'drop-shadow(0 0 4px rgba(239,68,68,0.7))' }}
      />
    );
  }
  return <Dot cx={cx} cy={cy} r={3} fill="#3B82F6" />;
}

export function ControlChart({ paramLabel, config, data }: ControlChartProps) {
  const { target, sigma, ucl, lcl } = config;
  const twoSigmaPos = target + 2 * sigma;
  const twoSigmaNeg = target - 2 * sigma;

  const yPad = sigma * 0.5;
  const yDomain = [lcl - yPad, ucl + yPad];

  return (
    <div className="bg-[#111D2E] rounded border border-[#1E3A5F] p-4 border-l-2 border-l-[#2563EB]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#F1F5F9]">{paramLabel}</h3>
        <div className="flex gap-4 text-xs text-[#94A3B8] font-['Fira_Code',monospace]">
          <span>UCL <span className="text-[#EF4444]">{ucl.toFixed(1)}</span></span>
          <span>CL <span className="text-[#F59E0B]">{target.toFixed(1)}</span></span>
          <span>LCL <span className="text-[#EF4444]">{lcl.toFixed(1)}</span></span>
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
            <XAxis dataKey="waferNumber" tick={{ fill: '#475569', fontSize: 10 }} />
            <YAxis domain={yDomain} tick={{ fill: '#475569', fontSize: 10 }} width={40} />
            <Tooltip
              contentStyle={{ background: '#111D2E', border: '1px solid #1E3A5F', fontSize: 12 }}
              labelStyle={{ color: '#94A3B8' }}
              itemStyle={{ color: '#F1F5F9', fontFamily: 'Fira Code, monospace' }}
              cursor={{ stroke: '#2563EB', strokeWidth: 1 }}
            />

            {/* 3-sigma bands */}
            <ReferenceArea y1={ucl} y2={ucl + sigma} fill="#EF4444" fillOpacity={0.05} />
            <ReferenceArea y1={lcl - sigma} y2={lcl} fill="#EF4444" fillOpacity={0.05} />

            {/* 2-sigma bands */}
            <ReferenceArea y1={twoSigmaPos} y2={ucl} fill="#F59E0B" fillOpacity={0.08} />
            <ReferenceArea y1={lcl} y2={twoSigmaNeg} fill="#F59E0B" fillOpacity={0.08} />

            {/* Control lines */}
            <ReferenceLine y={ucl} stroke="#EF4444" strokeDasharray="5 5" strokeOpacity={0.6} />
            <ReferenceLine y={lcl} stroke="#EF4444" strokeDasharray="5 5" strokeOpacity={0.6} />
            <ReferenceLine y={target} stroke="#F59E0B" strokeOpacity={0.7} />
            <ReferenceLine y={twoSigmaPos} stroke="#F59E0B" strokeDasharray="3 3" strokeOpacity={0.4} />
            <ReferenceLine y={twoSigmaNeg} stroke="#F59E0B" strokeDasharray="3 3" strokeOpacity={0.4} />

            <Line
              type="linear"
              dataKey="value"
              stroke="#3B82F6"
              strokeWidth={1.5}
              dot={<CustomDot />}
              activeDot={{ r: 6, fill: '#3B82F6' }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

### Step 4: Run tests

```bash
npm test -- --testPathPattern=ControlChart --no-coverage
```

Expected: PASS

### Step 5: Commit

```bash
git add src/components/spc/ControlChart.tsx src/components/spc/ControlChart.test.tsx
git commit -m "feat(mes): add ControlChart with UCL/LCL bands, violation dots, crosshair"
```

---

## Task 11: FaultInjector Component

**Files:**
- Create: `src/components/spc/FaultInjector.tsx`
- Create: `src/components/spc/FaultInjector.test.tsx`

### Step 1: Write failing tests

```tsx
// src/components/spc/FaultInjector.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { FaultInjector } from './FaultInjector';

describe('FaultInjector', () => {
  it('renders "Inject Fault" button', () => {
    render(<FaultInjector onInject={jest.fn()} onClear={jest.fn()} activeFault={null} />);
    expect(screen.getByRole('button', { name: /inject fault/i })).toBeInTheDocument();
  });

  it('inject button uses AMAT Orange style', () => {
    render(<FaultInjector onInject={jest.fn()} onClear={jest.fn()} activeFault={null} />);
    const btn = screen.getByRole('button', { name: /inject fault/i });
    expect(btn.className).toMatch(/F47920|\[#F47920\]/);
  });

  it('shows Clear Fault button when fault is active', () => {
    const fault = { type: 'sudden_shift' as const, parameter: 'cd' as const, severity: 1.0, startedAtWafer: 5 };
    render(<FaultInjector onInject={jest.fn()} onClear={jest.fn()} activeFault={fault} />);
    expect(screen.getByRole('button', { name: /clear fault/i })).toBeInTheDocument();
  });

  it('calls onInject with selected fault when injected', () => {
    const onInject = jest.fn();
    render(<FaultInjector onInject={onInject} onClear={jest.fn()} activeFault={null} />);
    // Select fault type via select element
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'sudden_shift' } });
    fireEvent.click(screen.getByRole('button', { name: /inject fault/i }));
    expect(onInject).toHaveBeenCalledWith(expect.objectContaining({ type: 'sudden_shift' }));
  });

  it('calls onClear when Clear Fault is clicked', () => {
    const onClear = jest.fn();
    const fault = { type: 'sudden_shift' as const, parameter: 'cd' as const, severity: 1.0, startedAtWafer: 5 };
    render(<FaultInjector onInject={jest.fn()} onClear={onClear} activeFault={fault} />);
    fireEvent.click(screen.getByRole('button', { name: /clear fault/i }));
    expect(onClear).toHaveBeenCalled();
  });
});
```

### Step 2: Confirm failure

```bash
npm test -- --testPathPattern=FaultInjector --no-coverage
```

### Step 3: Implement `src/components/spc/FaultInjector.tsx`

```tsx
'use client';

import { useState } from 'react';
import { Zap, X } from 'lucide-react';
import type { FaultConfig, FaultType } from '@/lib/mes-types';

const FAULT_OPTIONS: { value: FaultType; label: string; param: 'cd' | 'cdu' | 'ovl_x' | 'ler' }[] = [
  { value: 'sudden_shift',       label: 'Sudden Shift (CD)',         param: 'cd' },
  { value: 'gradual_drift',      label: 'Gradual Drift (CD)',        param: 'cd' },
  { value: 'increased_variance', label: 'Increased Variance (CDU)',  param: 'cdu' },
  { value: 'overlay_excursion',  label: 'Overlay Excursion (OVL-X)', param: 'ovl_x' },
  { value: 'focus_degradation',  label: 'Focus Degradation (LER)',   param: 'ler' },
];

interface FaultInjectorProps {
  activeFault: FaultConfig | null;
  currentWafer?: number;
  onInject: (fault: FaultConfig) => void;
  onClear: () => void;
}

export function FaultInjector({ activeFault, currentWafer = 1, onInject, onClear }: FaultInjectorProps) {
  const [selected, setSelected] = useState<FaultType>('sudden_shift');

  function handleInject() {
    const option = FAULT_OPTIONS.find((o) => o.value === selected)!;
    onInject({ type: option.value, parameter: option.param, severity: 1.0, startedAtWafer: currentWafer });
  }

  return (
    <div className="bg-[#111D2E] rounded border border-[#1E3A5F] p-3 flex flex-col gap-2">
      <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide">Fault Injection</span>

      <select
        className="bg-[#182840] border border-[#1E3A5F] text-[#F1F5F9] text-sm rounded px-2 py-1.5 cursor-pointer focus:outline-none focus:border-[#2563EB]"
        value={selected}
        onChange={(e) => setSelected(e.target.value as FaultType)}
        disabled={!!activeFault}
      >
        {FAULT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {activeFault ? (
        <button
          type="button"
          onClick={onClear}
          className="flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 rounded text-sm font-semibold bg-slate-700 hover:bg-slate-600 text-[#F1F5F9] cursor-pointer transition-colors"
          aria-label="Clear fault"
        >
          <X className="w-4 h-4" />
          Clear Fault
        </button>
      ) : (
        <button
          type="button"
          onClick={handleInject}
          className="flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 rounded text-sm font-semibold bg-[#F47920] hover:bg-[#e06a18] text-white cursor-pointer transition-colors"
          aria-label="Inject fault"
        >
          <Zap className="w-4 h-4" />
          Inject Fault
        </button>
      )}

      {activeFault && (
        <span className="text-xs text-[#F59E0B]">
          Active: {FAULT_OPTIONS.find((o) => o.value === activeFault.type)?.label}
        </span>
      )}
    </div>
  );
}
```

### Step 4: Run tests

```bash
npm test -- --testPathPattern=FaultInjector --no-coverage
```

Expected: PASS

### Step 5: Commit

```bash
git add src/components/spc/FaultInjector.tsx src/components/spc/FaultInjector.test.tsx
git commit -m "feat(mes): add FaultInjector with 5 fault types and AMAT Orange CTA"
```

---

## Task 12: ViolationCard Component

**Files:**
- Create: `src/components/spc/ViolationCard.tsx`
- Create: `src/components/spc/ViolationCard.test.tsx`

### Step 1: Write failing tests

```tsx
// src/components/spc/ViolationCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ViolationCard } from './ViolationCard';
import type { SpcViolation } from '@/lib/mes-types';

const mockViolation: SpcViolation = {
  id: 'v1', lotId: 'LOT-2026-001', waferNumber: 11,
  parameter: 'cd', rule: 'rule_1', value: 49.1, limit: 48.0,
  acknowledged: false, timestamp: new Date('2026-05-02T10:00:00'),
};

describe('ViolationCard', () => {
  it('displays rule and parameter', () => {
    render(<ViolationCard violation={mockViolation} onAcknowledge={jest.fn()} />);
    expect(screen.getByText(/Rule 1/i)).toBeInTheDocument();
    expect(screen.getByText(/cd/i)).toBeInTheDocument();
  });

  it('shows lot ID', () => {
    render(<ViolationCard violation={mockViolation} onAcknowledge={jest.fn()} />);
    expect(screen.getByText(/LOT-2026-001/)).toBeInTheDocument();
  });

  it('shows Acknowledge button when not acknowledged', () => {
    render(<ViolationCard violation={mockViolation} onAcknowledge={jest.fn()} />);
    expect(screen.getByRole('button', { name: /acknowledge/i })).toBeInTheDocument();
  });

  it('calls onAcknowledge with violation id', () => {
    const onAck = jest.fn();
    render(<ViolationCard violation={mockViolation} onAcknowledge={onAck} />);
    fireEvent.click(screen.getByRole('button', { name: /acknowledge/i }));
    expect(onAck).toHaveBeenCalledWith('v1');
  });

  it('shows "Acknowledged" text when already acknowledged', () => {
    render(<ViolationCard violation={{ ...mockViolation, acknowledged: true }} onAcknowledge={jest.fn()} />);
    expect(screen.getByText(/acknowledged/i)).toBeInTheDocument();
  });
});
```

### Step 2: Confirm failure

```bash
npm test -- --testPathPattern=ViolationCard --no-coverage
```

### Step 3: Implement `src/components/spc/ViolationCard.tsx`

```tsx
'use client';

import { AlertTriangle, CheckCircle } from 'lucide-react';
import type { SpcViolation } from '@/lib/mes-types';
import { SPC_PARAMETERS } from '@/lib/spc-parameters';

const RULE_LABELS: Record<string, string> = {
  rule_1: 'Rule 1: Beyond 3 Sigma',
  rule_2: 'Rule 2: 7 Consecutive Same Side',
  rule_5: 'Rule 5: 2 of 3 Beyond 2 Sigma',
};

interface ViolationCardProps {
  violation: SpcViolation;
  onAcknowledge: (id: string) => void;
}

export function ViolationCard({ violation, onAcknowledge }: ViolationCardProps) {
  const { parameter, rule, value, limit, lotId, waferNumber, acknowledged } = violation;
  const config = SPC_PARAMETERS[parameter];

  return (
    <div
      className="bg-red-950/30 border border-[#EF4444] rounded p-3 flex flex-col gap-2"
      style={acknowledged ? {} : { boxShadow: '0 0 12px rgba(239,68,68,0.3)' }}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-[#EF4444] mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#EF4444]">{RULE_LABELS[rule]}</p>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            {config.label} (<span className="font-['Fira_Code',monospace]">{value.toFixed(2)}</span>
            {' '}{value > limit ? '>' : '<'}{' '}
            {limit === config.ucl ? 'UCL' : 'LCL'}{' '}
            <span className="font-['Fira_Code',monospace]">{limit.toFixed(1)}</span>)
          </p>
        </div>
      </div>

      <div className="text-xs text-[#94A3B8] space-y-0.5">
        <div>Lot: <span className="text-[#F1F5F9]">{lotId}</span></div>
        <div>Wafer: <span className="text-[#F1F5F9] font-['Fira_Code',monospace]">{waferNumber}</span></div>
        <div>Action: <span className="text-[#F59E0B]">Auto-hold + Equip inhibit</span></div>
      </div>

      {acknowledged ? (
        <div className="flex items-center gap-1.5 text-sm text-[#10B981]">
          <CheckCircle className="w-4 h-4" />
          <span>Acknowledged</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onAcknowledge(violation.id)}
          className="min-h-[44px] px-3 py-2 rounded text-sm font-semibold bg-[#182840] hover:bg-[#1E3A5F] border border-[#EF4444] text-[#F1F5F9] cursor-pointer transition-colors"
          aria-label="Acknowledge violation"
        >
          Acknowledge
        </button>
      )}
    </div>
  );
}
```

### Step 4: Run tests

```bash
npm test -- --testPathPattern=ViolationCard --no-coverage
```

Expected: PASS

### Step 5: Commit

```bash
git add src/components/spc/ViolationCard.tsx src/components/spc/ViolationCard.test.tsx
git commit -m "feat(mes): add ViolationCard with rule label, lot info, acknowledge action"
```

---

## Task 13: EventLog Component

**Files:**
- Create: `src/components/spc/EventLog.tsx`
- Create: `src/components/spc/EventLog.test.tsx`

### Step 1: Write failing tests

```tsx
// src/components/spc/EventLog.test.tsx
import { render, screen } from '@testing-library/react';
import { EventLog } from './EventLog';
import type { SecsEvent } from '@/lib/mes-types';

const mockEvents: SecsEvent[] = [
  {
    id: 'e1', type: 's6f11_spc_data', label: 'S6F11 Collection Event: LOT-001 wafer 5',
    timestamp: new Date('2026-05-02T10:32:05'), secsMessage: { stream: 6, function: 11 },
  },
  {
    id: 'e2', type: 's2f41_stop', label: 'S2F41 STOP -> LITHO01',
    timestamp: new Date('2026-05-02T10:32:06'), secsMessage: { stream: 2, function: 41, rcmd: 'STOP' },
  },
];

describe('EventLog', () => {
  it('renders event labels', () => {
    render(<EventLog events={mockEvents} />);
    expect(screen.getByText(/S6F11 Collection Event/)).toBeInTheDocument();
    expect(screen.getByText(/S2F41 STOP/)).toBeInTheDocument();
  });

  it('renders timestamps', () => {
    render(<EventLog events={mockEvents} />);
    expect(screen.getAllByText(/10:32/).length).toBeGreaterThan(0);
  });

  it('renders empty state when no events', () => {
    render(<EventLog events={[]} />);
    expect(screen.getByText(/no events/i)).toBeInTheDocument();
  });
});
```

### Step 2: Confirm failure

```bash
npm test -- --testPathPattern=EventLog --no-coverage
```

### Step 3: Implement `src/components/spc/EventLog.tsx`

```tsx
'use client';

import type { SecsEvent, SecsEventType } from '@/lib/mes-types';
import { cn } from '@/lib/utils';

const EVENT_COLORS: Record<SecsEventType, string> = {
  s6f11_spc_data:    'text-[#14B8A6]',
  s2f41_stop:        'text-[#EF4444]',
  s2f42_ack:         'text-[#94A3B8]',
  s2f41_resume:      'text-[#10B981]',
  s2f49_recipe_push: 'text-[#3B82F6]',
  s2f50_recipe_ack:  'text-[#94A3B8]',
};

interface EventLogProps {
  events: SecsEvent[];
}

export function EventLog({ events }: EventLogProps) {
  return (
    <div className="bg-[#111D2E] rounded border border-[#1E3A5F] p-3 flex flex-col gap-1 h-full overflow-hidden">
      <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide shrink-0">Event Log</span>

      {events.length === 0 ? (
        <p className="text-xs text-[#475569] mt-2">No events yet</p>
      ) : (
        <div className="overflow-y-auto flex flex-col gap-0.5 flex-1">
          {events.map((event) => (
            <div key={event.id} className="flex items-start gap-2 py-0.5">
              <span className="text-[10px] text-[#475569] font-['Fira_Code',monospace] shrink-0 mt-0.5">
                {event.timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className={cn('text-xs truncate', EVENT_COLORS[event.type])}>
                {event.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Step 4: Run tests

```bash
npm test -- --testPathPattern=EventLog --no-coverage
```

Expected: PASS

### Step 5: Commit

```bash
git add src/components/spc/EventLog.tsx src/components/spc/EventLog.test.tsx
git commit -m "feat(mes): add EventLog with color-coded SECS message types"
```

---

## Task 14: SPC Dashboard Page

**Files:**
- Create: `src/app/mes/spc/page.tsx`
- Create: `src/app/mes/spc/page.test.tsx`

### Step 1: Write failing tests

```tsx
// src/app/mes/spc/page.test.tsx
import { render, screen } from '@testing-library/react';

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(), unobserve: jest.fn(), disconnect: jest.fn(),
}));

// Simulator engine should not run in tests
jest.mock('@/lib/simulator-engine', () => ({
  SimulatorEngine: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
  })),
}));

import SpcPage from './page';

describe('SpcPage', () => {
  it('renders the KPI strip skeleton on initial load', () => {
    render(<SpcPage />);
    // Page starts with no measurements — skeleton should show
    expect(screen.getByTestId('kpi-strip-skeleton')).toBeInTheDocument();
  });

  it('renders FaultInjector section', () => {
    render(<SpcPage />);
    expect(screen.getByText(/Fault Injection/i)).toBeInTheDocument();
  });

  it('renders EventLog section', () => {
    render(<SpcPage />);
    expect(screen.getByText(/Event Log/i)).toBeInTheDocument();
  });
});
```

### Step 2: Confirm failure

```bash
npm test -- --testPathPattern="mes/spc" --no-coverage
```

### Step 3: Implement `src/app/mes/spc/page.tsx`

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useMesSpcStore } from '@/stores/mes-spc-store';
import { SimulatorEngine } from '@/lib/simulator-engine';
import { generateSeedMeasurements } from '@/lib/mes-mock-data';
import { SPC_PARAMETERS, SPC_PARAM_KEYS } from '@/lib/spc-parameters';
import { makeS2F41Resume, makeS2F42Ack } from '@/lib/secs-message-log';
import { KpiStrip } from '@/components/spc/KpiStrip';
import { ControlChart } from '@/components/spc/ControlChart';
import { ThumbnailChart } from '@/components/spc/ThumbnailChart';
import { FaultInjector } from '@/components/spc/FaultInjector';
import { ViolationCard } from '@/components/spc/ViolationCard';
import { EventLog } from '@/components/spc/EventLog';
import type { SpcParameter } from '@/lib/mes-types';

export default function SpcPage() {
  const store = useMesSpcStore();
  const engineRef = useRef<SimulatorEngine | null>(null);
  const [activeParam, setActiveParam] = useState<SpcParameter>('cd');

  // Initialize: seed measurements + start simulator
  useEffect(() => {
    const { lots, startProcessing, addMeasurement } = useMesSpcStore.getState();
    const activeLot = lots.find((l) => l.status === 'in_process') ?? lots[0];

    // Seed 10 pre-existing wafers
    const seeds = generateSeedMeasurements(activeLot.id, 10);
    seeds.forEach(addMeasurement);
    useMesSpcStore.setState({ waferNumber: 11 });

    startProcessing(activeLot.id, activeLot.recipeId);

    engineRef.current = new SimulatorEngine();
    engineRef.current.start();

    return () => engineRef.current?.stop();
  }, []);

  const { measurements, violations, events, activeFault, equipmentState, activeLotId } = store;

  const activeLot = store.lots.find((l) => l.id === activeLotId) ?? store.lots[0];
  const lotMeasurements = measurements.filter((m) => m.lotId === activeLot?.id);
  const latest = lotMeasurements[lotMeasurements.length - 1] ?? null;
  const activeViolation = violations.find((v) => !v.acknowledged) ?? null;

  // Build chart data for active parameter
  const chartData = lotMeasurements.map((m) => ({
    waferNumber: m.waferNumber,
    value: m[activeParam as keyof typeof m] as number,
    isViolation: violations.some((v) => v.waferNumber === m.waferNumber && v.parameter === activeParam),
  }));

  function handleAcknowledge(violationId: string) {
    store.acknowledgeViolation(violationId);
    store.clearFault();
    store.addEvent(makeS2F41Resume());
    store.addEvent(makeS2F42Ack());
    engineRef.current?.start();
  }

  return (
    <div className="p-4 space-y-4">
      {/* KPI Strip */}
      <KpiStrip
        latest={latest}
        hasViolation={!!activeViolation}
        violatedParam={activeViolation?.parameter}
      />

      {/* Main Control Chart */}
      <ControlChart
        paramLabel={`${SPC_PARAMETERS[activeParam].label} (${activeParam.toUpperCase()})`}
        config={SPC_PARAMETERS[activeParam]}
        data={chartData}
      />

      {/* Thumbnail Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {SPC_PARAM_KEYS.map((param) => {
          const thumbData = lotMeasurements.map((m) => ({
            waferNumber: m.waferNumber,
            value: m[param as keyof typeof m] as number,
          }));
          return (
            <ThumbnailChart
              key={param}
              label={param.toUpperCase()}
              unit={SPC_PARAMETERS[param].unit}
              data={thumbData}
              ucl={SPC_PARAMETERS[param].ucl}
              lcl={SPC_PARAMETERS[param].lcl}
              isActive={activeParam === param}
              onClick={() => setActiveParam(param)}
            />
          );
        })}
        {/* Fault Injector as 6th tile */}
        <FaultInjector
          activeFault={activeFault}
          currentWafer={store.waferNumber}
          onInject={(fault) => store.injectFault(fault)}
          onClear={() => store.clearFault()}
        />
      </div>

      {/* Bottom Row: Event Log + Violation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="min-h-40">
          <EventLog events={events} />
        </div>

        <div className="space-y-2">
          {violations.length === 0 && (
            <div className="bg-[#111D2E] border border-[#1E3A5F] rounded p-3 text-xs text-[#475569]">
              No violations — system in control
            </div>
          )}
          {violations.map((v) => (
            <ViolationCard key={v.id} violation={v} onAcknowledge={handleAcknowledge} />
          ))}
        </div>
      </div>

      {/* Equipment State Banner */}
      {equipmentState === 'inhibited' && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-950 border border-[#EF4444] rounded px-4 py-2 text-sm font-semibold text-[#EF4444] z-50">
          Equipment Inhibited — Acknowledge violation to resume
        </div>
      )}
    </div>
  );
}
```

### Step 4: Run tests

```bash
npm test -- --testPathPattern="mes/spc" --no-coverage
```

Expected: PASS

### Step 5: Manual smoke test

```bash
npm run dev
# Open http://localhost:3000/mes/spc
# Verify: 10 pre-seeded wafers on chart, live streaming every 2s
# Inject Fault -> Sudden Shift -> confirm violation fires
```

### Step 6: Commit

```bash
git add src/app/mes/spc/
git commit -m "feat(mes): add SPC dashboard page with live simulator, fault injection, hero flow"
```

---

## Task 15: Lot Tracker Page

**Files:**
- Create: `src/app/mes/lots/page.tsx`
- Create: `src/app/mes/lots/page.test.tsx`

### Step 1: Write failing tests

```tsx
// src/app/mes/lots/page.test.tsx
import { render, screen } from '@testing-library/react';
import { useMesSpcStore, INITIAL_MES_SPC_STATE } from '@/stores/mes-spc-store';
import LotsPage from './page';

beforeEach(() => {
  useMesSpcStore.setState(INITIAL_MES_SPC_STATE);
});

describe('LotsPage', () => {
  it('renders table headers', () => {
    render(<LotsPage />);
    expect(screen.getByText('Lot ID')).toBeInTheDocument();
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders all 3 mock lots', () => {
    render(<LotsPage />);
    expect(screen.getByText('LOT-2026-001')).toBeInTheDocument();
    expect(screen.getByText('LOT-2026-002')).toBeInTheDocument();
    expect(screen.getByText('LOT-2026-003')).toBeInTheDocument();
  });

  it('shows in_process badge for first lot', () => {
    render(<LotsPage />);
    expect(screen.getByText(/in.?process/i)).toBeInTheDocument();
  });
});
```

### Step 2: Confirm failure

```bash
npm test -- --testPathPattern="mes/lots" --no-coverage
```

### Step 3: Implement `src/app/mes/lots/page.tsx`

```tsx
'use client';

import { useMesSpcStore } from '@/stores/mes-spc-store';
import type { LotStatus } from '@/lib/mes-types';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<LotStatus, string> = {
  in_process: 'bg-blue-900/40 text-blue-300 border-blue-700',
  completed:  'bg-emerald-900/40 text-emerald-300 border-emerald-700',
  on_hold:    'bg-amber-900/40 text-amber-300 border-amber-700',
  pending:    'bg-slate-800 text-slate-400 border-slate-600',
};

export default function LotsPage() {
  const { lots, recipes, measurements } = useMesSpcStore();

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold text-[#F1F5F9]">Lot Tracker</h2>

      <div className="bg-[#111D2E] rounded border border-[#1E3A5F] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1E3A5F]">
              {['Lot ID', 'Product', 'Recipe', 'Wafers Run', 'Status', 'Started'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lots.map((lot, i) => {
              const recipe = recipes.find((r) => r.id === lot.recipeId);
              const wafersRun = measurements.filter((m) => m.lotId === lot.id).length;
              return (
                <tr
                  key={lot.id}
                  className={cn(
                    'border-b border-[#1E3A5F] last:border-0 hover:bg-[#182840] transition-colors',
                    i % 2 === 0 ? '' : 'bg-[#0D1825]'
                  )}
                >
                  <td className="px-4 py-3 font-['Fira_Code',monospace] text-[#F1F5F9]">{lot.id}</td>
                  <td className="px-4 py-3 text-[#94A3B8]">{lot.product}</td>
                  <td className="px-4 py-3 text-[#94A3B8]">{recipe?.name ?? lot.recipeId}</td>
                  <td className="px-4 py-3 font-['Fira_Code',monospace] text-[#F1F5F9]">{wafersRun} / {lot.waferCount}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs px-2 py-0.5 rounded border font-medium', STATUS_STYLES[lot.status])}>
                      {lot.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#475569] font-['Fira_Code',monospace]">
                    {lot.startedAt.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### Step 4: Run tests

```bash
npm test -- --testPathPattern="mes/lots" --no-coverage
```

Expected: PASS

### Step 5: Commit

```bash
git add src/app/mes/lots/
git commit -m "feat(mes): add Lot Tracker page with status badges and wafer progress"
```

---

## Task 16: Recipe Manager Page

**Files:**
- Create: `src/app/mes/recipes/page.tsx`
- Create: `src/app/mes/recipes/page.test.tsx`

### Step 1: Write failing tests

```tsx
// src/app/mes/recipes/page.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { useMesSpcStore, INITIAL_MES_SPC_STATE } from '@/stores/mes-spc-store';
import RecipesPage from './page';

beforeEach(() => {
  useMesSpcStore.setState(INITIAL_MES_SPC_STATE);
});

describe('RecipesPage', () => {
  it('renders all 3 recipe names', () => {
    render(<RecipesPage />);
    expect(screen.getByText('LITHO-193nm-v4')).toBeInTheDocument();
    expect(screen.getByText('COAT-std-v2')).toBeInTheDocument();
    expect(screen.getByText('DEV-alkaline-v1')).toBeInTheDocument();
  });

  it('renders Push Recipe buttons', () => {
    render(<RecipesPage />);
    const buttons = screen.getAllByRole('button', { name: /push recipe/i });
    expect(buttons).toHaveLength(3);
  });

  it('adds S2F49 event to store when Push Recipe clicked', () => {
    render(<RecipesPage />);
    const firstPush = screen.getAllByRole('button', { name: /push recipe/i })[0];
    fireEvent.click(firstPush);
    const events = useMesSpcStore.getState().events;
    expect(events.some((e) => e.type === 's2f49_recipe_push')).toBe(true);
  });
});
```

### Step 2: Confirm failure

```bash
npm test -- --testPathPattern="mes/recipes" --no-coverage
```

### Step 3: Implement `src/app/mes/recipes/page.tsx`

```tsx
'use client';

import { Upload } from 'lucide-react';
import { useMesSpcStore } from '@/stores/mes-spc-store';
import { makeS2F49, makeS2F50 } from '@/lib/secs-message-log';

export default function RecipesPage() {
  const { recipes, activeRecipeId, addEvent, equipmentState } = useMesSpcStore();

  function handlePush(recipeId: string) {
    addEvent(makeS2F49(recipeId));
    // Simulate equipment ACK after 500ms
    setTimeout(() => {
      const ok = equipmentState !== 'inhibited';
      addEvent(makeS2F50(ok));
    }, 500);
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold text-[#F1F5F9]">Recipe Manager</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recipes.map((recipe) => {
          const isActive = recipe.id === activeRecipeId;
          return (
            <div
              key={recipe.id}
              className={`bg-[#111D2E] rounded border p-4 space-y-3 ${
                isActive ? 'border-[#2563EB] border-l-2' : 'border-[#1E3A5F]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-[#F1F5F9] font-['Fira_Code',monospace] text-sm">
                    {recipe.name}
                  </h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">{recipe.process}</p>
                </div>
                {isActive && (
                  <span className="text-[10px] font-semibold text-[#2563EB] bg-blue-900/30 px-1.5 py-0.5 rounded">
                    ACTIVE
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="text-[#94A3B8]">Chamber</div>
                <div className="text-[#F1F5F9] font-['Fira_Code',monospace]">{recipe.chamber}</div>
                {recipe.exposure > 0 && (
                  <>
                    <div className="text-[#94A3B8]">Exposure</div>
                    <div className="text-[#F1F5F9] font-['Fira_Code',monospace]">{recipe.exposure} mJ/cm²</div>
                  </>
                )}
                <div className="text-[#94A3B8]">Focus</div>
                <div className="text-[#F1F5F9] font-['Fira_Code',monospace]">{recipe.focus} nm</div>
              </div>

              <button
                type="button"
                onClick={() => handlePush(recipe.id)}
                disabled={equipmentState === 'inhibited'}
                className="w-full min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded text-sm font-semibold bg-[#182840] hover:bg-[#1E3A5F] border border-[#1E3A5F] text-[#F1F5F9] cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Push Recipe"
              >
                <Upload className="w-4 h-4" />
                Push Recipe
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-[#475569]">
        Push Recipe sends a S2F49 command to the equipment. S2F50 ACK appears in the SPC event log.
        {equipmentState === 'inhibited' && (
          <span className="text-[#EF4444] ml-2">Equipment inhibited — acknowledge SPC violation first.</span>
        )}
      </p>
    </div>
  );
}
```

### Step 4: Run tests

```bash
npm test -- --testPathPattern="mes/recipes" --no-coverage
```

Expected: PASS

### Step 5: Commit

```bash
git add src/app/mes/recipes/
git commit -m "feat(mes): add Recipe Manager page with Push Recipe -> S2F49/S2F50 flow"
```

---

## Task 17: Full Test Suite + Build Verification

### Step 1: Run all tests

```bash
cd equipment-monitor && npm test -- --no-coverage
```

Expected: All tests PASS (existing + new)

### Step 2: TypeScript check

```bash
npx tsc --noEmit
```

Expected: No errors

### Step 3: Production build check

```bash
npm run build
```

Expected: Build succeeds with no errors

### Step 4: Final commit

```bash
git add -A
git commit -m "feat(mes): MES SPC frontend demo complete — all tests passing, build clean"
```

---

## Pre-Delivery Checklist

Before merging to main, verify each item by running `npm run dev` and visiting `http://localhost:3000/mes/spc`:

- [ ] Page loads with 10 pre-seeded wafers on control chart (chart never empty)
- [ ] New wafer appears every ~2 seconds
- [ ] Inject Fault -> Sudden Shift -> CD jumps above UCL, red dot with glow
- [ ] Violation card appears: "Rule 1: Beyond 3 Sigma"
- [ ] KPI strip: CD turns red
- [ ] Event log: `S6F11 Collection Event`, `S2F41 STOP -> LITHO01`, `S2F42 ACK`
- [ ] Processing stops (equipment inhibited banner appears)
- [ ] Click Acknowledge -> `S2F41 RESUME`, `S2F42 ACK` in log
- [ ] Processing resumes, chart continues with normal data
- [ ] Navigate to `/mes/lots` -> lot shows ON HOLD badge
- [ ] Navigate to `/mes/recipes` -> Push Recipe disabled while inhibited
- [ ] All Lucide icons (no emoji)
- [ ] `cursor-pointer` on all interactive elements
- [ ] Fira Code on data values (KPI numbers, chart ticks, lot IDs)
- [ ] Navy Base `#0A1628` background on all MES pages
- [ ] AMAT Orange `#F47920` on Inject Fault button
- [ ] Responsive at 375px (thumbnails scroll), 768px, 1024px+
- [ ] `prefers-reduced-motion`: animations disabled (already in globals.css)
- [ ] No backend — `npm run dev` is the only requirement

---

## Execution Options

**Plan complete and saved to `docs/plans/2026-05-02-mes-spc-implementation.md`. Two execution options:**

**1. Subagent-Driven (this session)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** — Open new session in the worktree with executing-plans skill, batch execution with checkpoints

**Which approach?**
