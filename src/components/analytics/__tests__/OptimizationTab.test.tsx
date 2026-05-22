import { render, screen } from '@testing-library/react';
import { OptimizationTab } from '../OptimizationTab';
import { useAnalyticsStore, INITIAL_ANALYTICS_STATE } from '@/stores/analytics-store';

describe('OptimizationTab', () => {
  beforeEach(() => {
    useAnalyticsStore.setState(INITIAL_ANALYTICS_STATE);
  });

  test('renders KPI strip with Pareto Solutions', () => {
    render(<OptimizationTab />);
    expect(screen.getByText(/Pareto Solutions/i)).toBeInTheDocument();
  });

  test('renders 8 recipe knob sliders', () => {
    render(<OptimizationTab />);
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBeGreaterThanOrEqual(8);
  });

  test('renders chart canvases', () => {
    render(<OptimizationTab />);
    const canvases = screen.getAllByTestId(/opt-chart/);
    expect(canvases.length).toBeGreaterThanOrEqual(3);
  });

  test('renders constraint toggles', () => {
    render(<OptimizationTab />);
    expect(screen.getByText(/Min Yield/i)).toBeInTheDocument();
  });
});
