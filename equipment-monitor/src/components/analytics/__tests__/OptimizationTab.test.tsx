import { render, screen, fireEvent } from '@testing-library/react';
import { OptimizationTab } from '../OptimizationTab';
import { useAnalyticsStore, INITIAL_ANALYTICS_STATE } from '@/stores/analytics-store';
import { useAnalyticsSimStore } from '@/stores/analytics-sim-store';

describe('OptimizationTab', () => {
  beforeEach(() => {
    useAnalyticsStore.setState(INITIAL_ANALYTICS_STATE);
    // Reset the shared live-data store to its deterministic tick-0 snapshot and
    // make sure the single interval driver never leaks between tests.
    useAnalyticsSimStore.getState().reset();
  });

  afterEach(() => {
    useAnalyticsSimStore.getState().stop();
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

  test('renders the three recharts chart panels', () => {
    render(<OptimizationTab />);
    const charts = screen.getAllByTestId(/opt-chart/);
    expect(charts.length).toBeGreaterThanOrEqual(3);
  });

  test('renders constraint readout', () => {
    render(<OptimizationTab />);
    expect(screen.getByText(/Min Yield/i)).toBeInTheDocument();
  });

  test('subscribes to the live sim snapshot — Current Yield reflects the store', () => {
    render(<OptimizationTab />);

    // Tick-0 optimization snapshot is deterministic; the KPI must show its
    // yield value (one decimal place) fed straight from the store.
    const liveYield =
      useAnalyticsSimStore.getState().modules.optimization.objectives.yield;
    expect(
      screen.getByText(`${liveYield.toFixed(1)}%`),
    ).toBeInTheDocument();

    // Live badge present (this tab is auto-updating, not exploring) by default.
    expect(screen.getByTestId('opt-live-badge')).toBeInTheDocument();
  });

  test('moving a slider takes over live updates (PAUSED — exploring) and Resume restores live', () => {
    render(<OptimizationTab />);

    // Starts live.
    expect(screen.getByTestId('opt-live-badge')).toBeInTheDocument();
    expect(screen.queryByTestId('opt-explore-badge')).not.toBeInTheDocument();

    // Move a slider -> tab pauses its own live updates.
    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: '950' } });

    expect(screen.getByTestId('opt-explore-badge')).toBeInTheDocument();
    expect(screen.getByText(/exploring/i)).toBeInTheDocument();
    expect(screen.queryByTestId('opt-live-badge')).not.toBeInTheDocument();

    // Resume live clears the takeover.
    fireEvent.click(screen.getByRole('button', { name: /resume live/i }));
    expect(screen.getByTestId('opt-live-badge')).toBeInTheDocument();
    expect(screen.queryByTestId('opt-explore-badge')).not.toBeInTheDocument();
  });

  test('objective toggles are real buttons with aria-pressed state', () => {
    render(<OptimizationTab />);
    // yield is selected by default (INITIAL_ANALYTICS_STATE.optimizationObjectives).
    const yieldBtn = screen.getByRole('button', { name: /^yield/i });
    expect(yieldBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('regression: renders REAL glyphs, never literal \\uXXXX escapes', () => {
    // Pick defect-density as an objective so the D₀ subscript label renders.
    useAnalyticsStore.setState({
      ...INITIAL_ANALYTICS_STATE,
      optimizationObjectives: ['defectDensity', 'throughput'],
    });
    const { container } = render(<OptimizationTab />);
    const text = container.textContent ?? '';

    // Real, decoded glyphs must appear (R² superscript, D₀ subscript, ≥, ↔, —).
    expect(text).toContain('²'); // R² in the response-surface panel
    expect(text).toContain('₀'); // D₀ in the defect-density axis label
    expect(text).toContain('≥'); // Min Yield ≥ constraint
    expect(text).toContain('↔'); // Pareto frontier relation in the chart title
    expect(text).toContain('—'); // em-dash separators

    // The bug being guarded: literal backslash-u escapes must NOT be in the DOM.
    expect(text).not.toMatch(/\\u[0-9a-fA-F]{4}/);
    expect(text).not.toContain('\\u00B2');
    expect(text).not.toContain('\\u2265');
    expect(text).not.toContain('\\u03BB');
  });
});
