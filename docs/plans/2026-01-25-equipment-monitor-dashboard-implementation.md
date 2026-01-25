# Equipment Monitoring Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a multi-purpose semiconductor equipment monitoring dashboard with real-time data visualization.

**Architecture:** Next.js 14 App Router with Tailwind CSS and shadcn/ui components. Recharts for data visualization. Zustand for client state, React Query for server state, and WebSocket for real-time updates. Dark mode only, responsive from 375px to 1440px+.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Recharts, Zustand, TanStack Query, Lucide React

**Design Document:** `docs/plans/2026-01-25-equipment-monitor-dashboard-design.md`

---

## Phase 1: Project Scaffolding

### Task 1.1: Create Next.js Project

**Files:**
- Create: `equipment-monitor/` (project root)

**Step 1: Create Next.js project with TypeScript and Tailwind**

```bash
cd /mnt/e/repo/mix-gem
npx create-next-app@latest equipment-monitor --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

Select options:
- Would you like to use TypeScript? **Yes**
- Would you like to use ESLint? **Yes**
- Would you like to use Tailwind CSS? **Yes**
- Would you like your code inside a `src/` directory? **Yes**
- Would you like to use App Router? **Yes**
- Would you like to use Turbopack? **Yes**
- Would you like to customize the import alias? **Yes** → `@/*`

**Step 2: Verify project created**

```bash
ls equipment-monitor/src/app
```

Expected: `layout.tsx`, `page.tsx`, `globals.css`

**Step 3: Commit**

```bash
cd equipment-monitor
git init
git add .
git commit -m "chore: scaffold Next.js project with TypeScript and Tailwind"
```

---

### Task 1.2: Configure Tailwind with Design System

**Files:**
- Modify: `equipment-monitor/tailwind.config.ts`
- Modify: `equipment-monitor/src/app/globals.css`

**Step 1: Update Tailwind config with fonts and dark mode**

Replace `equipment-monitor/tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
```

**Step 2: Update globals.css with Google Fonts and base styles**

Replace `equipment-monitor/src/app/globals.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
  }

  body {
    @apply bg-slate-950 text-slate-50 antialiased;
  }
}

@layer utilities {
  .status-normal {
    @apply text-emerald-500;
  }
  .status-warning {
    @apply text-amber-500;
  }
  .status-alarm {
    @apply text-red-500;
  }
  .status-idle {
    @apply text-blue-400;
  }
  .status-offline {
    @apply text-slate-500;
  }
}
```

**Step 3: Run dev server to verify**

```bash
cd equipment-monitor
npm run dev
```

Expected: Server starts on http://localhost:3000, dark background visible

**Step 4: Commit**

```bash
git add tailwind.config.ts src/app/globals.css
git commit -m "feat: configure Tailwind with design system colors and fonts"
```

---

### Task 1.3: Install Dependencies

**Files:**
- Modify: `equipment-monitor/package.json`

**Step 1: Install core dependencies**

```bash
cd equipment-monitor
npm install recharts zustand @tanstack/react-query lucide-react clsx tailwind-merge
```

**Step 2: Install dev dependencies**

```bash
npm install -D @types/node
```

**Step 3: Verify installation**

```bash
cat package.json | grep -A 20 '"dependencies"'
```

Expected: All packages listed in dependencies

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install Recharts, Zustand, React Query, Lucide"
```

---

### Task 1.4: Initialize shadcn/ui

**Files:**
- Create: `equipment-monitor/components.json`
- Create: `equipment-monitor/src/lib/utils.ts`
- Create: `equipment-monitor/src/components/ui/` (directory)

**Step 1: Initialize shadcn/ui**

```bash
cd equipment-monitor
npx shadcn@latest init
```

Select options:
- Which style would you like to use? **Default**
- Which color would you like to use as base color? **Slate**
- Would you like to use CSS variables for colors? **Yes**

**Step 2: Add required shadcn components**

```bash
npx shadcn@latest add button card badge
```

**Step 3: Verify components created**

```bash
ls src/components/ui/
```

Expected: `button.tsx`, `card.tsx`, `badge.tsx`

**Step 4: Commit**

```bash
git add .
git commit -m "feat: initialize shadcn/ui with Button, Card, Badge"
```

---

### Task 1.5: Create Project Structure

**Files:**
- Create: `equipment-monitor/src/components/layout/`
- Create: `equipment-monitor/src/components/equipment/`
- Create: `equipment-monitor/src/components/charts/`
- Create: `equipment-monitor/src/stores/`
- Create: `equipment-monitor/src/types/`
- Create: `equipment-monitor/src/lib/`

**Step 1: Create directory structure**

```bash
cd equipment-monitor
mkdir -p src/components/layout
mkdir -p src/components/equipment
mkdir -p src/components/charts
mkdir -p src/stores
mkdir -p src/types
```

**Step 2: Create types file**

Create `equipment-monitor/src/types/equipment.ts`:

```typescript
export type EquipmentStatus = "normal" | "warning" | "alarm" | "idle" | "offline";

export interface Equipment {
  id: string;
  name: string;
  type: "litho" | "track" | "etch" | "cvd" | "pvd";
  status: EquipmentStatus;
  currentRecipe: string | null;
  waferCount: number;
  lastUpdate: Date;
}

export interface ProcessParameter {
  name: string;
  value: number;
  unit: string;
  lsl: number;  // Lower Spec Limit
  usl: number;  // Upper Spec Limit
  timestamp: Date;
}

export interface Alarm {
  id: string;
  equipmentId: string;
  severity: "warning" | "alarm";
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

export interface TrendDataPoint {
  timestamp: number;
  value: number;
}
```

**Step 3: Create cn utility (if not created by shadcn)**

Verify `equipment-monitor/src/lib/utils.ts` exists with:

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: create project directory structure and types"
```

---

## Phase 2: Core Components

### Task 2.1: Create Status Indicator Component

**Files:**
- Create: `equipment-monitor/src/components/ui/status-indicator.tsx`
- Create: `equipment-monitor/src/components/ui/status-indicator.test.tsx`

**Step 1: Write the test**

Create `equipment-monitor/src/components/ui/status-indicator.test.tsx`:

```typescript
import { render, screen } from "@testing-library/react";
import { StatusIndicator } from "./status-indicator";

describe("StatusIndicator", () => {
  it("renders normal status with emerald color", () => {
    render(<StatusIndicator status="normal" />);
    const indicator = screen.getByRole("status");
    expect(indicator).toHaveClass("bg-emerald-500");
  });

  it("renders alarm status with red color and pulse", () => {
    render(<StatusIndicator status="alarm" />);
    const indicator = screen.getByRole("status");
    expect(indicator).toHaveClass("bg-red-500");
    expect(indicator).toHaveClass("animate-pulse");
  });

  it("renders with label when showLabel is true", () => {
    render(<StatusIndicator status="warning" showLabel />);
    expect(screen.getByText("Warning")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd equipment-monitor
npm install -D @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom @types/jest
npm test -- --testPathPattern=status-indicator
```

Expected: FAIL - module not found

**Step 3: Write the component**

Create `equipment-monitor/src/components/ui/status-indicator.tsx`:

```typescript
import { cn } from "@/lib/utils";
import { EquipmentStatus } from "@/types/equipment";

const statusConfig: Record<EquipmentStatus, { color: string; label: string; pulse?: boolean }> = {
  normal: { color: "bg-emerald-500", label: "Normal" },
  warning: { color: "bg-amber-500", label: "Warning" },
  alarm: { color: "bg-red-500", label: "Alarm", pulse: true },
  idle: { color: "bg-blue-400", label: "Idle" },
  offline: { color: "bg-slate-500", label: "Offline" },
};

interface StatusIndicatorProps {
  status: EquipmentStatus;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function StatusIndicator({
  status,
  size = "md",
  showLabel = false,
  className,
}: StatusIndicatorProps) {
  const config = statusConfig[status];

  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        role="status"
        aria-label={config.label}
        className={cn(
          "rounded-full",
          sizeClasses[size],
          config.color,
          config.pulse && "animate-pulse"
        )}
      />
      {showLabel && (
        <span className="text-sm text-slate-400">{config.label}</span>
      )}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- --testPathPattern=status-indicator
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/ui/status-indicator.tsx src/components/ui/status-indicator.test.tsx
git commit -m "feat: add StatusIndicator component with tests"
```

---

### Task 2.2: Create Equipment Card Component

**Files:**
- Create: `equipment-monitor/src/components/equipment/equipment-card.tsx`

**Step 1: Create the component**

Create `equipment-monitor/src/components/equipment/equipment-card.tsx`:

```typescript
"use client";

import { cn } from "@/lib/utils";
import { Equipment } from "@/types/equipment";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Card } from "@/components/ui/card";
import { Activity, Layers } from "lucide-react";

interface EquipmentCardProps {
  equipment: Equipment;
  isSelected?: boolean;
  onClick?: () => void;
}

export function EquipmentCard({
  equipment,
  isSelected = false,
  onClick,
}: EquipmentCardProps) {
  const borderColor = {
    normal: "border-l-emerald-500",
    warning: "border-l-amber-500",
    alarm: "border-l-red-500",
    idle: "border-l-blue-400",
    offline: "border-l-slate-500",
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={cn(
        "p-4 cursor-pointer transition-colors duration-200",
        "border-l-4 border-slate-700",
        "hover:bg-slate-800",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950",
        isSelected && "bg-slate-800",
        isSelected && borderColor[equipment.status],
        equipment.status === "alarm" && "bg-red-500/5"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <StatusIndicator status={equipment.status} size="md" />
          <span className="font-semibold text-slate-50">{equipment.name}</span>
        </div>
        {equipment.status === "alarm" && (
          <span className="text-xs font-medium text-red-400 uppercase">Alarm</span>
        )}
      </div>

      {equipment.currentRecipe && (
        <div className="flex items-center gap-1 text-sm text-slate-400 mb-1">
          <Activity className="w-4 h-4" />
          <span>{equipment.currentRecipe}</span>
        </div>
      )}

      <div className="flex items-center gap-1 text-sm text-slate-500">
        <Layers className="w-4 h-4" />
        <span>{equipment.waferCount} wafers</span>
      </div>
    </Card>
  );
}
```

**Step 2: Run dev server and verify visually**

```bash
npm run dev
```

(Component will be tested when integrated into main layout)

**Step 3: Commit**

```bash
git add src/components/equipment/equipment-card.tsx
git commit -m "feat: add EquipmentCard component"
```

---

### Task 2.3: Create Equipment Sidebar Component

**Files:**
- Create: `equipment-monitor/src/components/equipment/equipment-sidebar.tsx`

**Step 1: Create the component**

Create `equipment-monitor/src/components/equipment/equipment-sidebar.tsx`:

```typescript
"use client";

import { Equipment } from "@/types/equipment";
import { EquipmentCard } from "./equipment-card";
import { cn } from "@/lib/utils";

interface EquipmentSidebarProps {
  equipment: Equipment[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

export function EquipmentSidebar({
  equipment,
  selectedId,
  onSelect,
  className,
}: EquipmentSidebarProps) {
  // Sort: alarms first, then warnings, then by name
  const sortedEquipment = [...equipment].sort((a, b) => {
    const priority = { alarm: 0, warning: 1, normal: 2, idle: 3, offline: 4 };
    const priorityDiff = priority[a.status] - priority[b.status];
    if (priorityDiff !== 0) return priorityDiff;
    return a.name.localeCompare(b.name);
  });

  return (
    <aside
      className={cn(
        "w-72 bg-slate-900 border-r border-slate-700 overflow-y-auto",
        className
      )}
      aria-label="Equipment list"
    >
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold text-slate-50">Equipment</h2>
        <p className="text-sm text-slate-400">
          {equipment.filter((e) => e.status === "alarm").length} alarms
        </p>
      </div>

      <nav className="p-2 space-y-2" role="listbox" aria-label="Select equipment">
        {sortedEquipment.map((eq) => (
          <EquipmentCard
            key={eq.id}
            equipment={eq}
            isSelected={selectedId === eq.id}
            onClick={() => onSelect(eq.id)}
          />
        ))}
      </nav>
    </aside>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/equipment/equipment-sidebar.tsx
git commit -m "feat: add EquipmentSidebar component"
```

---

### Task 2.4: Create Header Component

**Files:**
- Create: `equipment-monitor/src/components/layout/header.tsx`

**Step 1: Create the component**

Create `equipment-monitor/src/components/layout/header.tsx`:

```typescript
"use client";

import { Bell, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface HeaderProps {
  alarmCount?: number;
  className?: string;
}

export function Header({ alarmCount = 0, className }: HeaderProps) {
  return (
    <header
      className={cn(
        "h-14 px-4 flex items-center justify-between",
        "bg-slate-900 border-b border-slate-700",
        "sticky top-0 z-50",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center">
          <span className="text-white font-bold text-sm">EM</span>
        </div>
        <h1 className="text-lg font-semibold text-slate-50">
          Equipment Monitor
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative text-slate-400 hover:text-slate-50 hover:bg-slate-800"
          aria-label={`Alerts: ${alarmCount} active`}
        >
          <Bell className="w-5 h-5" />
          {alarmCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs"
            >
              {alarmCount > 99 ? "99+" : alarmCount}
            </Badge>
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-slate-50 hover:bg-slate-800"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-slate-50 hover:bg-slate-800"
          aria-label="User profile"
        >
          <User className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/layout/header.tsx
git commit -m "feat: add Header component with alarm badge"
```

---

### Task 2.5: Create Gauge Card Component

**Files:**
- Create: `equipment-monitor/src/components/charts/gauge-card.tsx`

**Step 1: Create the component**

Create `equipment-monitor/src/components/charts/gauge-card.tsx`:

```typescript
"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ProcessParameter } from "@/types/equipment";

interface GaugeCardProps {
  parameter: ProcessParameter;
  className?: string;
}

function getStatus(value: number, lsl: number, usl: number) {
  const range = usl - lsl;
  const warningThreshold = range * 0.2; // 20% from limits

  if (value < lsl || value > usl) return "alarm";
  if (value < lsl + warningThreshold || value > usl - warningThreshold) return "warning";
  return "normal";
}

export function GaugeCard({ parameter, className }: GaugeCardProps) {
  const { name, value, unit, lsl, usl } = parameter;
  const status = getStatus(value, lsl, usl);

  // Calculate percentage for gauge arc
  const range = usl - lsl;
  const percentage = Math.max(0, Math.min(100, ((value - lsl) / range) * 100));

  const statusColors = {
    normal: { stroke: "#10B981", text: "text-emerald-500" },
    warning: { stroke: "#F59E0B", text: "text-amber-500" },
    alarm: { stroke: "#EF4444", text: "text-red-500" },
  };

  const { stroke, text } = statusColors[status];

  // SVG arc calculation
  const radius = 40;
  const circumference = Math.PI * radius; // Half circle
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <Card className={cn("p-4 bg-slate-900 border-slate-700", className)}>
      <div className="text-center">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          {name}
        </span>
      </div>

      <div className="relative flex justify-center my-2">
        <svg
          width="100"
          height="60"
          viewBox="0 0 100 60"
          className="overflow-visible"
        >
          {/* Background arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#334155"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
          <span className={cn("text-2xl font-mono font-medium", text)}>
            {value >= 0 ? "+" : ""}{value.toFixed(1)}
          </span>
          <span className="text-sm text-slate-400 ml-1">{unit}</span>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500">
        Spec: {lsl} to {usl} {unit}
      </div>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/charts/gauge-card.tsx
git commit -m "feat: add GaugeCard component with SVG arc gauge"
```

---

## Phase 3: Charts and Data Visualization

### Task 3.1: Create Trend Chart Component

**Files:**
- Create: `equipment-monitor/src/components/charts/trend-chart.tsx`

**Step 1: Create the component**

Create `equipment-monitor/src/components/charts/trend-chart.tsx`:

```typescript
"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { Card } from "@/components/ui/card";
import { TrendDataPoint } from "@/types/equipment";
import { cn } from "@/lib/utils";

interface TrendChartProps {
  title: string;
  data: TrendDataPoint[];
  unit: string;
  lsl: number;
  usl: number;
  currentValue?: number;
  className?: string;
}

export function TrendChart({
  title,
  data,
  unit,
  lsl,
  usl,
  currentValue,
  className,
}: TrendChartProps) {
  // Calculate warning thresholds (80% of spec)
  const range = usl - lsl;
  const warningLow = lsl + range * 0.2;
  const warningHigh = usl - range * 0.2;

  // Format timestamp for X axis
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Determine current status
  const status = useMemo(() => {
    if (currentValue === undefined) return "normal";
    if (currentValue < lsl || currentValue > usl) return "alarm";
    if (currentValue < warningLow || currentValue > warningHigh) return "warning";
    return "normal";
  }, [currentValue, lsl, usl, warningLow, warningHigh]);

  const statusColors = {
    normal: "#10B981",
    warning: "#F59E0B",
    alarm: "#EF4444",
  };

  return (
    <Card className={cn("p-4 bg-slate-900 border-slate-700", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-50">{title}</h3>
        {currentValue !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Current:</span>
            <span
              className="font-mono text-lg font-medium"
              style={{ color: statusColors[status] }}
            >
              {currentValue >= 0 ? "+" : ""}
              {currentValue.toFixed(1)} {unit}
            </span>
          </div>
        )}
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            {/* Warning zones */}
            <ReferenceArea
              y1={lsl}
              y2={warningLow}
              fill="#F59E0B"
              fillOpacity={0.1}
            />
            <ReferenceArea
              y1={warningHigh}
              y2={usl}
              fill="#F59E0B"
              fillOpacity={0.1}
            />

            {/* Spec limits */}
            <ReferenceLine
              y={usl}
              stroke="#EF4444"
              strokeDasharray="4 4"
              label={{ value: "USL", position: "right", fill: "#EF4444", fontSize: 10 }}
            />
            <ReferenceLine
              y={lsl}
              stroke="#EF4444"
              strokeDasharray="4 4"
              label={{ value: "LSL", position: "right", fill: "#EF4444", fontSize: 10 }}
            />

            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTime}
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[lsl - range * 0.1, usl + range * 0.1]}
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v.toFixed(0)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1E293B",
                border: "1px solid #334155",
                borderRadius: "6px",
                fontSize: "12px",
              }}
              labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
              formatter={(value: number) => [`${value.toFixed(2)} ${unit}`, title]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={statusColors[status]}
              fill={statusColors[status]}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-center gap-2 mt-2">
        {["1H", "4H", "24H"].map((range) => (
          <button
            key={range}
            className="px-3 py-1 text-xs font-medium text-slate-400 hover:text-slate-50 hover:bg-slate-800 rounded transition-colors"
          >
            {range}
          </button>
        ))}
      </div>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/charts/trend-chart.tsx
git commit -m "feat: add TrendChart component with Recharts"
```

---

### Task 3.2: Create Time Range Selector

**Files:**
- Create: `equipment-monitor/src/components/charts/time-range-selector.tsx`

**Step 1: Create the component**

Create `equipment-monitor/src/components/charts/time-range-selector.tsx`:

```typescript
"use client";

import { cn } from "@/lib/utils";

type TimeRange = "1H" | "4H" | "24H" | "7D";

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  className?: string;
}

const ranges: TimeRange[] = ["1H", "4H", "24H", "7D"];

export function TimeRangeSelector({
  value,
  onChange,
  className,
}: TimeRangeSelectorProps) {
  return (
    <div
      className={cn("inline-flex rounded-md bg-slate-800 p-1", className)}
      role="radiogroup"
      aria-label="Time range"
    >
      {ranges.map((range) => (
        <button
          key={range}
          role="radio"
          aria-checked={value === range}
          onClick={() => onChange(range)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded transition-colors min-h-[44px]",
            value === range
              ? "bg-blue-500 text-white"
              : "text-slate-400 hover:text-slate-50 hover:bg-slate-700"
          )}
        >
          {range}
        </button>
      ))}
    </div>
  );
}

export type { TimeRange };
```

**Step 2: Commit**

```bash
git add src/components/charts/time-range-selector.tsx
git commit -m "feat: add TimeRangeSelector component"
```

---

## Phase 4: State Management and Mock Data

### Task 4.1: Create Zustand Store

**Files:**
- Create: `equipment-monitor/src/stores/equipment-store.ts`

**Step 1: Create the store**

Create `equipment-monitor/src/stores/equipment-store.ts`:

```typescript
import { create } from "zustand";
import { Equipment, Alarm } from "@/types/equipment";

interface EquipmentState {
  equipment: Equipment[];
  selectedEquipmentId: string | null;
  alarms: Alarm[];

  // Actions
  setEquipment: (equipment: Equipment[]) => void;
  selectEquipment: (id: string | null) => void;
  updateEquipmentStatus: (id: string, status: Equipment["status"]) => void;
  addAlarm: (alarm: Alarm) => void;
  acknowledgeAlarm: (id: string) => void;
}

export const useEquipmentStore = create<EquipmentState>((set) => ({
  equipment: [],
  selectedEquipmentId: null,
  alarms: [],

  setEquipment: (equipment) => set({ equipment }),

  selectEquipment: (id) => set({ selectedEquipmentId: id }),

  updateEquipmentStatus: (id, status) =>
    set((state) => ({
      equipment: state.equipment.map((eq) =>
        eq.id === id ? { ...eq, status } : eq
      ),
    })),

  addAlarm: (alarm) =>
    set((state) => ({
      alarms: [alarm, ...state.alarms],
    })),

  acknowledgeAlarm: (id) =>
    set((state) => ({
      alarms: state.alarms.map((a) =>
        a.id === id ? { ...a, acknowledged: true } : a
      ),
    })),
}));
```

**Step 2: Commit**

```bash
git add src/stores/equipment-store.ts
git commit -m "feat: add Zustand store for equipment state"
```

---

### Task 4.2: Create Mock Data Generator

**Files:**
- Create: `equipment-monitor/src/lib/mock-data.ts`

**Step 1: Create mock data**

Create `equipment-monitor/src/lib/mock-data.ts`:

```typescript
import { Equipment, ProcessParameter, TrendDataPoint, Alarm } from "@/types/equipment";

export const mockEquipment: Equipment[] = [
  {
    id: "litho01",
    name: "LITHO01",
    type: "litho",
    status: "normal",
    currentRecipe: "L42-CONTACT",
    waferCount: 847,
    lastUpdate: new Date(),
  },
  {
    id: "litho02",
    name: "LITHO02",
    type: "litho",
    status: "warning",
    currentRecipe: "L42-METAL1",
    waferCount: 423,
    lastUpdate: new Date(),
  },
  {
    id: "track01",
    name: "TRACK01",
    type: "track",
    status: "normal",
    currentRecipe: "COAT-STD",
    waferCount: 1205,
    lastUpdate: new Date(),
  },
  {
    id: "etch01",
    name: "ETCH01",
    type: "etch",
    status: "alarm",
    currentRecipe: "POLY-ETCH",
    waferCount: 156,
    lastUpdate: new Date(),
  },
  {
    id: "cvd01",
    name: "CVD01",
    type: "cvd",
    status: "idle",
    currentRecipe: null,
    waferCount: 0,
    lastUpdate: new Date(),
  },
  {
    id: "pvd01",
    name: "PVD01",
    type: "pvd",
    status: "offline",
    currentRecipe: null,
    waferCount: 0,
    lastUpdate: new Date(),
  },
];

export const mockParameters: ProcessParameter[] = [
  { name: "Focus Offset", value: 2.3, unit: "nm", lsl: -10, usl: 10, timestamp: new Date() },
  { name: "CDU", value: 4.2, unit: "nm", lsl: 0, usl: 5, timestamp: new Date() },
  { name: "Overlay", value: 1.8, unit: "nm", lsl: 0, usl: 3, timestamp: new Date() },
  { name: "Dose", value: 15.2, unit: "mJ", lsl: 14, usl: 16, timestamp: new Date() },
];

export function generateTrendData(
  hours: number,
  baseValue: number,
  variance: number
): TrendDataPoint[] {
  const points: TrendDataPoint[] = [];
  const now = Date.now();
  const interval = (hours * 60 * 60 * 1000) / 60; // 60 data points

  for (let i = 60; i >= 0; i--) {
    const timestamp = now - i * interval;
    const noise = (Math.random() - 0.5) * variance * 2;
    const trend = Math.sin(i / 10) * variance * 0.3; // Slow drift
    points.push({
      timestamp,
      value: baseValue + noise + trend,
    });
  }

  return points;
}

export const mockAlarms: Alarm[] = [
  {
    id: "alarm-1",
    equipmentId: "etch01",
    severity: "alarm",
    message: "Chamber pressure out of spec (847 mTorr)",
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    acknowledged: false,
  },
  {
    id: "alarm-2",
    equipmentId: "litho02",
    severity: "warning",
    message: "Focus offset approaching limit (+8.2 nm)",
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    acknowledged: false,
  },
  {
    id: "alarm-3",
    equipmentId: "litho01",
    severity: "warning",
    message: "CDU trending upward",
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    acknowledged: true,
  },
];
```

**Step 2: Commit**

```bash
git add src/lib/mock-data.ts
git commit -m "feat: add mock data generators"
```

---

## Phase 5: Main Dashboard Layout

### Task 5.1: Create Dashboard Page

**Files:**
- Modify: `equipment-monitor/src/app/page.tsx`
- Create: `equipment-monitor/src/app/providers.tsx`

**Step 1: Create providers wrapper**

Create `equipment-monitor/src/app/providers.tsx`:

```typescript
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 1000, // 5 seconds
            refetchInterval: 5 * 1000, // Refetch every 5 seconds
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

**Step 2: Update layout**

Replace `equipment-monitor/src/app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Equipment Monitor",
  description: "Semiconductor equipment monitoring dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**Step 3: Create dashboard page**

Replace `equipment-monitor/src/app/page.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { EquipmentSidebar } from "@/components/equipment/equipment-sidebar";
import { GaugeCard } from "@/components/charts/gauge-card";
import { TrendChart } from "@/components/charts/trend-chart";
import { useEquipmentStore } from "@/stores/equipment-store";
import {
  mockEquipment,
  mockParameters,
  mockAlarms,
  generateTrendData,
} from "@/lib/mock-data";

export default function DashboardPage() {
  const { equipment, selectedEquipmentId, alarms, setEquipment, selectEquipment } =
    useEquipmentStore();
  const [trendData, setTrendData] = useState(generateTrendData(1, 2.3, 3));

  // Initialize with mock data
  useEffect(() => {
    setEquipment(mockEquipment);
    // Select first equipment by default
    if (mockEquipment.length > 0) {
      selectEquipment(mockEquipment[0].id);
    }
  }, [setEquipment, selectEquipment]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTrendData((prev) => {
        const newPoint = {
          timestamp: Date.now(),
          value: 2.3 + (Math.random() - 0.5) * 6,
        };
        return [...prev.slice(1), newPoint];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const activeAlarms = mockAlarms.filter((a) => !a.acknowledged);
  const selectedEquipment = equipment.find((e) => e.id === selectedEquipmentId);

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      <Header alarmCount={activeAlarms.length} />

      <div className="flex flex-1 overflow-hidden">
        <EquipmentSidebar
          equipment={equipment}
          selectedId={selectedEquipmentId}
          onSelect={selectEquipment}
          className="hidden md:block"
        />

        <main className="flex-1 overflow-y-auto p-6">
          {selectedEquipment && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-50">
                  {selectedEquipment.name}
                </h2>
                <p className="text-sm text-slate-400">
                  {selectedEquipment.currentRecipe || "No active recipe"}
                </p>
              </div>

              {/* Gauge Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {mockParameters.map((param) => (
                  <GaugeCard key={param.name} parameter={param} />
                ))}
              </div>

              {/* Trend Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <TrendChart
                  title="Focus Offset"
                  data={trendData}
                  unit="nm"
                  lsl={-10}
                  usl={10}
                  currentValue={trendData[trendData.length - 1]?.value}
                />
                <TrendChart
                  title="CDU"
                  data={generateTrendData(1, 3.5, 1.5)}
                  unit="nm"
                  lsl={0}
                  usl={5}
                  currentValue={4.2}
                />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
```

**Step 4: Run and verify**

```bash
cd equipment-monitor
npm run dev
```

Open http://localhost:3000 - verify:
- Header with alarm badge
- Equipment sidebar with status indicators
- Gauge cards showing parameters
- Trend charts with live updates

**Step 5: Commit**

```bash
git add src/app/providers.tsx src/app/layout.tsx src/app/page.tsx
git commit -m "feat: create main dashboard layout with all components"
```

---

## Phase 6: Responsive Adaptations

### Task 6.1: Create Mobile Bottom Sheet

**Files:**
- Create: `equipment-monitor/src/components/equipment/equipment-bottom-sheet.tsx`

**Step 1: Install Radix Dialog for bottom sheet**

```bash
cd equipment-monitor
npx shadcn@latest add dialog
```

**Step 2: Create bottom sheet component**

Create `equipment-monitor/src/components/equipment/equipment-bottom-sheet.tsx`:

```typescript
"use client";

import { Equipment } from "@/types/equipment";
import { EquipmentCard } from "./equipment-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronUp } from "lucide-react";
import { StatusIndicator } from "@/components/ui/status-indicator";

interface EquipmentBottomSheetProps {
  equipment: Equipment[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function EquipmentBottomSheet({
  equipment,
  selectedId,
  onSelect,
}: EquipmentBottomSheetProps) {
  const selectedEquipment = equipment.find((e) => e.id === selectedId);
  const alarmCount = equipment.filter((e) => e.status === "alarm").length;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="fixed bottom-4 left-4 right-4 h-14 bg-slate-900 border-slate-700 justify-between md:hidden"
        >
          <div className="flex items-center gap-2">
            {selectedEquipment && (
              <>
                <StatusIndicator status={selectedEquipment.status} />
                <span className="font-medium">{selectedEquipment.name}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {alarmCount > 0 && (
              <span className="text-sm text-red-400">{alarmCount} alarms</span>
            )}
            <ChevronUp className="w-5 h-5" />
          </div>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-slate-50">Select Equipment</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
          {equipment.map((eq) => (
            <DialogTrigger key={eq.id} asChild>
              <div>
                <EquipmentCard
                  equipment={eq}
                  isSelected={selectedId === eq.id}
                  onClick={() => onSelect(eq.id)}
                />
              </div>
            </DialogTrigger>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 3: Update page to include bottom sheet**

Add to `equipment-monitor/src/app/page.tsx` after the main closing tag:

```typescript
// Add import at top
import { EquipmentBottomSheet } from "@/components/equipment/equipment-bottom-sheet";

// Add before closing </div> of the flex container
<EquipmentBottomSheet
  equipment={equipment}
  selectedId={selectedEquipmentId}
  onSelect={selectEquipment}
/>
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add mobile bottom sheet for equipment selection"
```

---

### Task 6.2: Add Reduced Motion Support

**Files:**
- Modify: `equipment-monitor/src/app/globals.css`
- Modify: `equipment-monitor/src/components/ui/status-indicator.tsx`

**Step 1: Add reduced motion styles**

Add to `equipment-monitor/src/app/globals.css`:

```css
@layer utilities {
  @media (prefers-reduced-motion: reduce) {
    .animate-pulse,
    .animate-pulse-slow {
      animation: none;
    }

    * {
      transition-duration: 0.01ms !important;
    }
  }
}
```

**Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add prefers-reduced-motion support"
```

---

## Phase 7: Final Polish

### Task 7.1: Add Index Exports

**Files:**
- Create: `equipment-monitor/src/components/index.ts`

**Step 1: Create barrel exports**

Create `equipment-monitor/src/components/index.ts`:

```typescript
// Layout
export { Header } from "./layout/header";

// Equipment
export { EquipmentCard } from "./equipment/equipment-card";
export { EquipmentSidebar } from "./equipment/equipment-sidebar";
export { EquipmentBottomSheet } from "./equipment/equipment-bottom-sheet";

// Charts
export { GaugeCard } from "./charts/gauge-card";
export { TrendChart } from "./charts/trend-chart";
export { TimeRangeSelector } from "./charts/time-range-selector";

// UI
export { StatusIndicator } from "./ui/status-indicator";
```

**Step 2: Commit**

```bash
git add src/components/index.ts
git commit -m "chore: add barrel exports for components"
```

---

### Task 7.2: Final Verification

**Step 1: Run linting**

```bash
cd equipment-monitor
npm run lint
```

Fix any issues reported.

**Step 2: Build for production**

```bash
npm run build
```

Expected: Build succeeds with no errors.

**Step 3: Test responsive breakpoints**

Open http://localhost:3000 and test:
- [ ] 1440px+ (XL) - Full layout with sidebar
- [ ] 1024px (LG) - Sidebar visible, 2-col charts
- [ ] 768px (MD) - Sidebar hidden, bottom sheet appears
- [ ] 375px (SM) - Single column, bottom sheet

**Step 4: Final commit**

```bash
git add .
git commit -m "chore: final polish and verification"
```

---

## Summary

| Phase | Tasks | Commits |
|-------|-------|---------|
| 1. Scaffolding | 5 tasks | 5 commits |
| 2. Core Components | 5 tasks | 5 commits |
| 3. Charts | 2 tasks | 2 commits |
| 4. State & Data | 2 tasks | 2 commits |
| 5. Dashboard Layout | 1 task | 1 commit |
| 6. Responsive | 2 tasks | 2 commits |
| 7. Final Polish | 2 tasks | 2 commits |
| **Total** | **19 tasks** | **19 commits** |

## Next Steps After Implementation

1. Connect to real SECS/GEM data via WebSocket
2. Add alarm acknowledgment flow
3. Add equipment detail drill-down pages
4. Implement chart zoom and pan
5. Add dark/light mode toggle
6. Deploy to Vercel

## References

- Design Document: `docs/plans/2026-01-25-equipment-monitor-dashboard-design.md`
- @ui-ux-pro-max skill for design guidelines
- @shadcn for component patterns
