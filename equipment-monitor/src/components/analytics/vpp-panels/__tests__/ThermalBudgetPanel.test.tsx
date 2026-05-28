import { render, screen } from '@testing-library/react';

// recharts' ResponsiveContainer needs ResizeObserver, which jsdom lacks.
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

import { ThermalBudgetPanel } from '../ThermalBudgetPanel';
import type { ThermalBudgetStep } from '@/lib/analytics/types';

jest.mock('@/hooks/use-client-ready', () => ({ useClientReady: () => true }));

describe('ThermalBudgetPanel', () => {
  const steps: ThermalBudgetStep[] = [
    { stepId: 'oxidation', temperature: 1000, time: 3600, dt: 3.6e6, cumulativeDt: 3.6e6 },
    { stepId: 'lithography', temperature: 25, time: 30, dt: 750, cumulativeDt: 3600750 },
  ];

  test('renders a recharts chart (not canvas)', () => {
    const { container } = render(<ThermalBudgetPanel steps={steps} ceiling={5e6} />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
    expect(container.querySelector('canvas')).toBeNull();
  });

  test('shows warning with real degree glyph when budget exceeds ceiling', () => {
    const over: ThermalBudgetStep[] = [
      { stepId: 'oxidation', temperature: 1000, time: 6000, dt: 6e6, cumulativeDt: 6e6 },
    ];
    const { container } = render(<ThermalBudgetPanel steps={over} ceiling={5e6} />);
    expect(screen.getByText(/exceeded/i)).toBeInTheDocument();
    // Regression: the degree sign renders as a glyph, never as a literal escape.
    expect(container.textContent ?? '').toContain('°');
    expect(container.textContent ?? '').not.toContain('\\u00B0');
  });
});
