'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface ChartSyncContextValue {
  activeIndex: number | null;
  setActiveIndex: (index: number | null) => void;
}

const ChartSyncContext = createContext<ChartSyncContextValue | undefined>(undefined);

export function ChartSyncProvider({ children }: { children: ReactNode }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <ChartSyncContext.Provider value={{ activeIndex, setActiveIndex }}>
      {children}
    </ChartSyncContext.Provider>
  );
}

export function useChartSync() {
  const context = useContext(ChartSyncContext);
  if (!context) {
    throw new Error('useChartSync must be used within ChartSyncProvider');
  }
  return context;
}
