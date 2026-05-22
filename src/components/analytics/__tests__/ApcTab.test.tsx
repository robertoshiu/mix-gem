import { render, screen, fireEvent } from '@testing-library/react';
import { ApcTab } from '../ApcTab';
import { useAnalyticsStore, INITIAL_ANALYTICS_STATE } from '@/stores/analytics-store';

describe('ApcTab', () => {
  beforeEach(() => {
    useAnalyticsStore.setState(INITIAL_ANALYTICS_STATE);
  });

  test('renders KPI strip with Current Offset', () => {
    render(<ApcTab />);
    expect(screen.getByText(/Current Offset/i)).toBeInTheDocument();
  });

  test('renders mode toggle for EWMA/d-EWMA', () => {
    render(<ApcTab />);
    expect(screen.getByRole('button', { name: /^EWMA$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /d-EWMA/i })).toBeInTheDocument();
  });

  test('renders drift type selector', () => {
    render(<ApcTab />);
    expect(screen.getByLabelText(/Drift Type/i)).toBeInTheDocument();
  });

  test('renders 3 chart canvases', () => {
    render(<ApcTab />);
    const canvases = screen.getAllByTestId(/apc-chart/);
    expect(canvases.length).toBeGreaterThanOrEqual(3);
  });

  test('switching to EWMA mode sets lambdaSlope to 0', () => {
    render(<ApcTab />);
    fireEvent.click(screen.getByRole('button', { name: /^EWMA$/i }));
    expect(useAnalyticsStore.getState().apcLambdaSlope).toBe(0);
  });
});
