import { render, screen } from '@testing-library/react';
import { ThermalBudgetPanel } from '../ThermalBudgetPanel';
import type { ThermalBudgetStep } from '@/lib/analytics/types';

describe('ThermalBudgetPanel', () => {
  const steps: ThermalBudgetStep[] = [
    { stepId: 'oxidation', temperature: 1000, time: 3600, dt: 3.6e6, cumulativeDt: 3.6e6 },
    { stepId: 'lithography', temperature: 25, time: 30, dt: 750, cumulativeDt: 3600750 },
  ];

  test('renders canvas', () => {
    render(<ThermalBudgetPanel steps={steps} ceiling={5e6} />);
    expect(screen.getByTestId('thermal-budget-canvas')).toBeInTheDocument();
  });

  test('shows warning when budget exceeds ceiling', () => {
    const over: ThermalBudgetStep[] = [
      { stepId: 'oxidation', temperature: 1000, time: 6000, dt: 6e6, cumulativeDt: 6e6 },
    ];
    render(<ThermalBudgetPanel steps={over} ceiling={5e6} />);
    expect(screen.getByText(/exceeded/i)).toBeInTheDocument();
  });
});
