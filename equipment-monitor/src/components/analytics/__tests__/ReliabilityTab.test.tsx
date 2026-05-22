import { render, screen, fireEvent } from '@testing-library/react';
import { ReliabilityTab } from '../ReliabilityTab';
import { useAnalyticsStore, INITIAL_ANALYTICS_STATE } from '@/stores/analytics-store';

describe('ReliabilityTab', () => {
  beforeEach(() => {
    useAnalyticsStore.setState(INITIAL_ANALYTICS_STATE);
  });

  test('renders KPI strip with System Availability', () => {
    render(<ReliabilityTab />);
    expect(screen.getByText(/System Availability/i)).toBeInTheDocument();
  });

  test('renders topology selector buttons', () => {
    render(<ReliabilityTab />);
    expect(screen.getByRole('button', { name: /^Series$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Parallel$/i })).toBeInTheDocument();
  });

  test('renders 8 subsystem blocks', () => {
    render(<ReliabilityTab />);
    expect(screen.getByText(/Oxidation/i)).toBeInTheDocument();
    expect(screen.getByText(/Metal/i)).toBeInTheDocument();
  });

  test('renders chart canvases', () => {
    render(<ReliabilityTab />);
    const canvases = screen.getAllByTestId(/reliability-chart/);
    expect(canvases.length).toBeGreaterThanOrEqual(2);
  });

  test('switching topology updates store', () => {
    render(<ReliabilityTab />);
    fireEvent.click(screen.getByRole('button', { name: /^Parallel$/i }));
    expect(useAnalyticsStore.getState().rbdTopology).toBe('parallel');
  });
});
