import { render, screen, fireEvent, within } from '@testing-library/react';

// recharts' ResponsiveContainer needs a ResizeObserver; jsdom has none.
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

import { ApcTab } from '../ApcTab';
import { useAnalyticsStore, INITIAL_ANALYTICS_STATE } from '@/stores/analytics-store';
import { useAnalyticsSimStore } from '@/stores/analytics-sim-store';
import { generateAnalyticsTick } from '@/lib/analytics/analytics-sim';

describe('ApcTab', () => {
  beforeEach(() => {
    useAnalyticsStore.setState(INITIAL_ANALYTICS_STATE);
    // Reset the live-data store to its deterministic tick-0 snapshot.
    useAnalyticsSimStore.getState().reset();
  });

  test('renders KPI strip with Current offset', () => {
    render(<ApcTab />);
    expect(screen.getByText(/Current offset/i)).toBeInTheDocument();
  });

  test('renders the plain-language caption under the title', () => {
    render(<ApcTab />);
    expect(screen.getByText(/Run-to-run control nudges every wafer back to target/i)).toBeInTheDocument();
  });

  test('renders mode toggle for EWMA/d-EWMA', () => {
    render(<ApcTab />);
    expect(screen.getByRole('button', { name: /^EWMA$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /d-EWMA/i })).toBeInTheDocument();
  });

  test('renders drift type selector', () => {
    render(<ApcTab />);
    expect(screen.getByLabelText(/Drift type/i)).toBeInTheDocument();
  });

  test('renders 3 recharts chart containers', () => {
    render(<ApcTab />);
    const charts = screen.getAllByTestId(/apc-chart/);
    expect(charts.length).toBeGreaterThanOrEqual(3);
  });

  test('renders the live EWMA lambda from the analytics sim snapshot', () => {
    // The KPI value must equal the deterministic tick-0 lambda, proving the tab
    // reads its live snapshot from the shared analytics-sim store.
    const expected = generateAnalyticsTick(0).modules.apc.lambda.toFixed(2);
    render(<ApcTab />);
    const boxes = screen.getAllByTestId('kpi-box');
    const lambdaBox = boxes.find((b) => within(b).queryByText(/EWMA/));
    expect(lambdaBox).toBeDefined();
    expect(within(lambdaBox!).getByText(expected)).toBeInTheDocument();
  });

  test('moving a slider takes over: shows PAUSED badge + Resume live, then resumes', () => {
    render(<ApcTab />);
    // Live badge first, no pause controls.
    expect(screen.getByTestId('apc-live-badge')).toBeInTheDocument();
    expect(screen.queryByTestId('apc-paused-badge')).not.toBeInTheDocument();

    // Move the lambda slider → takeover.
    fireEvent.change(screen.getByLabelText(/EWMA λ/), { target: { value: '0.55' } });
    expect(screen.getByTestId('apc-paused-badge')).toBeInTheDocument();
    expect(screen.getByText(/exploring/i)).toBeInTheDocument();

    // Resume live returns to the live badge.
    fireEvent.click(screen.getByRole('button', { name: /resume live/i }));
    expect(screen.getByTestId('apc-live-badge')).toBeInTheDocument();
    expect(screen.queryByTestId('apc-paused-badge')).not.toBeInTheDocument();
  });

  test('the explored lambda value is reflected in the KPI strip', () => {
    render(<ApcTab />);
    fireEvent.change(screen.getByLabelText(/EWMA λ/), { target: { value: '0.55' } });
    const boxes = screen.getAllByTestId('kpi-box');
    const lambdaBox = boxes.find((b) => within(b).queryByText(/EWMA/));
    expect(within(lambdaBox!).getByText('0.55')).toBeInTheDocument();
  });

  test('switching to EWMA mode sets the explored slope to 0 (local, store untouched)', () => {
    render(<ApcTab />);
    // d-EWMA first so a slope exists, then EWMA zeroes it.
    fireEvent.click(screen.getByRole('button', { name: /d-EWMA/i }));
    fireEvent.click(screen.getByRole('button', { name: /^EWMA$/i }));
    // The shared analytics store is never written by the slider takeover.
    expect(useAnalyticsStore.getState().apcLambdaSlope).toBe(INITIAL_ANALYTICS_STATE.apcLambdaSlope);
    // The d-EWMA-only slope slider is gone once back in EWMA mode.
    expect(screen.queryByLabelText(/Slope λ/)).not.toBeInTheDocument();
  });

  test('renders real Unicode glyphs, never literal \\u escapes', () => {
    const { container } = render(<ApcTab />);
    const text = container.textContent ?? '';
    // Real glyphs are present (λ in the EWMA label).
    expect(text).toContain('λ');
    // Regression guard: no literal escape sequences leaked into the DOM.
    expect(text).not.toContain('\\u03BB');
    expect(text).not.toContain('\\u2014');
    expect(text).not.toMatch(/\\u[0-9A-Fa-f]{4}/);
  });
});
