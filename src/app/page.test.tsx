import { render } from '@testing-library/react';
import Page from './page';

// Mock the store to avoid issues
jest.mock('@/stores/equipment-store', () => ({
  useEquipmentStore: () => ({
    alarms: [],
    selectedEquipmentId: 'eq-1',
    equipment: [{ id: 'eq-1', name: 'Test Eq', status: 'IDLE' }],
    selectEquipment: jest.fn(),
    acknowledgeAlarm: jest.fn(),
    setEquipment: jest.fn(),
  }),
}));

jest.mock('@/lib/mock-data', () => ({
  mockEquipment: [{ id: 'eq-1', name: 'Test Eq' }],
  mockParameters: [
      { name: 'Param 1', value: 10, unit: 'nm', lsl: 0, usl: 20 },
      { name: 'Param 2', value: 12, unit: 'nm', lsl: 0, usl: 20 },
      { name: 'Param 3', value: 14, unit: 'nm', lsl: 0, usl: 20 },
      { name: 'Param 4', value: 16, unit: 'nm', lsl: 0, usl: 20 }
  ],
  mockAlarms: [],
  generateTrendData: () => [],
}));

// Mock child components that might cause issues in shallow render
jest.mock('@/components/charts/gauge-card', () => ({
  GaugeCard: () => <div data-testid="gauge-card" />,
}));
jest.mock('@/components/equipment/equipment-sidebar', () => ({
  EquipmentSidebar: () => <div data-testid="sidebar" />,
}));
jest.mock('@/components/alerts/alert-banner', () => ({
  AlertBanner: () => <div data-testid="alert-banner" />,
}));
jest.mock('@/components/charts/trend-chart', () => ({
    TrendChart: () => <div data-testid="trend-chart" />,
}));
jest.mock('@/components/layout/header', () => ({
    Header: () => <div data-testid="header" />,
}));
jest.mock('@/components/equipment/equipment-bottom-sheet', () => ({
    EquipmentBottomSheet: () => <div data-testid="bottom-sheet" />,
}));


describe('Page Layout', () => {
  it('should use 3-column grid at lg breakpoint', () => {
    const { container } = render(<Page />);
    // Note: The data-testid "gauge-grid" might not exist yet in the implementation,
    // so we expect this to fail either because element is missing or classes are wrong.
    const grid = container.querySelector('[data-testid="gauge-grid"]');
    
    // If grid is null, we can't check className, but the test should still fail if we expect it to match.
    // However, to be cleaner, we might want to assert grid exists if we were TDDing strictly.
    // But the plan says "expect(grid?.className).toMatch...".
    // If grid is null, grid?.className is undefined. expect(undefined).toMatch(...) will fail.
    
    expect(grid?.className).toMatch(/lg:grid-cols-3/);
    expect(grid?.className).not.toMatch(/lg:grid-cols-4/);
  });

  it('should use gap-3 (12px) for grid spacing', () => {
    const { container } = render(<Page />);
    const grid = container.querySelector('[data-testid="gauge-grid"]');
    expect(grid?.className).toMatch(/gap-3/);
  });
});
