import { render, screen, fireEvent, within } from '@testing-library/react';
import { ReliabilityTab } from '../ReliabilityTab';
import { useAnalyticsStore, INITIAL_ANALYTICS_STATE } from '@/stores/analytics-store';
import { useAnalyticsSimStore } from '@/stores/analytics-sim-store';
import { generateModuleSnapshots } from '@/lib/analytics/analytics-sim';

// Recharts is mocked (mirrors src/app/page.test.tsx) so charts render as inert
// DOM in jsdom without needing layout measurement.
jest.mock('recharts', () => {
  const ReactActual = jest.requireActual('react') as typeof import('react');
  const DivWrap = ({ children }: { children?: import('react').ReactNode }) =>
    ReactActual.createElement('div', null, children);
  // Charts render an <svg> so nested SVG primitives (<defs>/<linearGradient>)
  // are valid and React does not warn about unknown tags.
  const SvgWrap = ({ children }: { children?: import('react').ReactNode }) =>
    ReactActual.createElement('svg', null, children);
  const Empty = () => null;
  return {
    ResponsiveContainer: DivWrap,
    ComposedChart: SvgWrap,
    AreaChart: SvgWrap,
    BarChart: SvgWrap,
    Area: Empty,
    Bar: SvgWrap,
    Line: Empty,
    Cell: Empty,
    CartesianGrid: Empty,
    XAxis: Empty,
    YAxis: Empty,
    Tooltip: Empty,
    ReferenceLine: Empty,
  };
});

describe('ReliabilityTab', () => {
  beforeEach(() => {
    useAnalyticsStore.setState(INITIAL_ANALYTICS_STATE);
    // Reset the shared live-data store to a known tick-0 snapshot (stops the
    // interval driver so tests stay deterministic).
    useAnalyticsSimStore.getState().reset();
  });

  test('renders KPI strip with System Availability', () => {
    render(<ReliabilityTab />);
    // Exact match: "Subsystem Availability" (chart heading) also contains the
    // substring, so match the KPI label precisely.
    expect(screen.getByText('System Availability')).toBeInTheDocument();
  });

  test('renders topology selector buttons', () => {
    render(<ReliabilityTab />);
    expect(screen.getByRole('button', { name: /^Series$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Parallel$/i })).toBeInTheDocument();
  });

  test('renders subsystem control rows', () => {
    render(<ReliabilityTab />);
    // Exact subsystem names; "metallization" (bottleneck KPI value) also
    // contains "Metal", so match the row label precisely.
    expect(screen.getByText('Oxidation')).toBeInTheDocument();
    expect(screen.getByText('Metal')).toBeInTheDocument();
  });

  test('renders both chart containers', () => {
    render(<ReliabilityTab />);
    const charts = screen.getAllByTestId(/reliability-chart/);
    expect(charts.length).toBeGreaterThanOrEqual(2);
  });

  test('switching topology updates store', () => {
    render(<ReliabilityTab />);
    fireEvent.click(screen.getByRole('button', { name: /^Parallel$/i }));
    expect(useAnalyticsStore.getState().rbdTopology).toBe('parallel');
  });

  test('renders a plain-language caption under the title', () => {
    render(<ReliabilityTab />);
    expect(
      screen.getByText(/how likely the whole tool stays up/i),
    ).toBeInTheDocument();
  });

  // --- Live data --------------------------------------------------------
  test('subscribes to the live sim snapshot and reflects it in the live AF KPI', () => {
    // Drive the shared store to a non-zero tick so the live snapshot differs
    // from cold-start, proving the tab is reading the live slice.
    const tick = 42;
    const snap = generateModuleSnapshots(tick);
    useAnalyticsSimStore.setState({
      tick,
      elapsedTicks: tick,
      modules: snap,
    });

    render(<ReliabilityTab />);

    // The AF KPI label embeds the live junction temperature from the snapshot.
    const expectedTemp = snap.reliability.junctionTempC.toFixed(0);
    expect(
      screen.getByText(new RegExp(`AF @${expectedTemp}°C`)),
    ).toBeInTheDocument();
  });

  test('shows LIVE badge by default and no paused badge', () => {
    render(<ReliabilityTab />);
    expect(screen.getByTestId('reliability-live-badge')).toBeInTheDocument();
    expect(screen.queryByTestId('reliability-paused-badge')).not.toBeInTheDocument();
  });

  // --- Slider takeover --------------------------------------------------
  test('moving a slider takes over: pauses live, shows PAUSED badge + Resume live', () => {
    render(<ReliabilityTab />);

    const eaSlider = screen.getByLabelText(/Activation Energy/i);
    fireEvent.change(eaSlider, { target: { value: '0.9' } });

    expect(screen.getByTestId('reliability-paused-badge')).toBeInTheDocument();
    expect(screen.getByText(/PAUSED/i)).toBeInTheDocument();
    expect(screen.queryByTestId('reliability-live-badge')).not.toBeInTheDocument();

    const resume = screen.getByRole('button', { name: /Resume live/i });
    expect(resume).toBeInTheDocument();

    fireEvent.click(resume);
    expect(screen.getByTestId('reliability-live-badge')).toBeInTheDocument();
    expect(screen.queryByTestId('reliability-paused-badge')).not.toBeInTheDocument();
  });

  test('slider takeover keeps the explored value (does not snap back to live)', () => {
    render(<ReliabilityTab />);
    const eaSlider = screen.getByLabelText(/Activation Energy/i) as HTMLInputElement;
    fireEvent.change(eaSlider, { target: { value: '0.95' } });
    expect(useAnalyticsStore.getState().reliabilityEa).toBe(0.95);
  });

  // --- Accessibility ----------------------------------------------------
  test('topology controls are real buttons exposing pressed state', () => {
    render(<ReliabilityTab />);
    const group = screen.getByRole('group', { name: /RBD topology/i });
    const series = within(group).getByRole('button', { name: /^Series$/i });
    expect(series).toHaveAttribute('aria-pressed', 'true');
  });

  // --- Unicode regression guard ----------------------------------------
  test('renders real glyphs (λ, °, ×) and never literal \\u escapes', () => {
    const { container } = render(<ReliabilityTab />);
    const text = container.textContent ?? '';

    // Real Unicode glyphs are present in labels/formulas.
    expect(text).toContain('λ'); // failure rate
    expect(text).toContain('°'); // degree (AF / temperature)
    expect(text).toContain('×'); // acceleration-factor multiplier

    // The original bug: literal backslash-u escapes leaking into the DOM.
    expect(text).not.toMatch(/\\u03BB/i); // λ
    expect(text).not.toMatch(/\\u00B0/i); // °
    expect(text).not.toMatch(/\\u00D7/i); // ×
    expect(text).not.toMatch(/\\u[0-9a-f]{4}/i); // any escape at all
  });
});
