import { render, screen } from '@testing-library/react';
import { WipDonutChart } from './WipDonutChart';
import type { Lot } from '@/lib/mes-types';

// matchMedia needed by useReducedMotion in animation.ts
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// ResizeObserver needed by recharts ResponsiveContainer
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock the zustand store
jest.mock('@/stores/mes-spc-store', () => ({
  useMesSpcStore: jest.fn(),
}));

import { useMesSpcStore } from '@/stores/mes-spc-store';

const mockUseMesSpcStore = useMesSpcStore as jest.Mock;

describe('WipDonutChart', () => {
  beforeEach(() => {
    mockUseMesSpcStore.mockReset();
  });

  it('renders with wip-donut testid', () => {
    mockUseMesSpcStore.mockReturnValue({ lots: [] });
    render(<WipDonutChart />);
    expect(screen.getByTestId('wip-donut')).toBeInTheDocument();
  });

  it('shows empty state when no lots exist', () => {
    mockUseMesSpcStore.mockReturnValue({ lots: [] });
    render(<WipDonutChart />);
    expect(screen.getByText('No lots')).toBeInTheDocument();
  });

  it('shows total lot count when lots exist', () => {
    const lots: Lot[] = [
      { id: 'LOT-001', product: 'Product A', recipeId: 'r1', waferCount: 25, status: 'in_process', startedAt: new Date() },
      { id: 'LOT-002', product: 'Product B', recipeId: 'r2', waferCount: 25, status: 'pending', startedAt: new Date() },
    ];
    mockUseMesSpcStore.mockReturnValue({ lots });
    render(<WipDonutChart />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Total Lots')).toBeInTheDocument();
  });
});
