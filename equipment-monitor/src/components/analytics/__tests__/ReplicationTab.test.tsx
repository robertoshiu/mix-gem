import { render, screen, fireEvent } from '@testing-library/react';
import { ReplicationTab } from '../ReplicationTab';
import { useAnalyticsStore, INITIAL_ANALYTICS_STATE } from '@/stores/analytics-store';
import { useAnalyticsSimStore } from '@/stores/analytics-sim-store';
import { generateAnalyticsTick } from '@/lib/analytics/analytics-sim';
import { SYM } from '@/lib/analytics/symbols';

// Recharts renders an async-measured SVG that jsdom can't size; mock it to a
// lightweight DOM tree so the component's structure/data wiring is testable.
jest.mock('recharts', () => {
  const Passthrough = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  const Noop = () => null;
  return {
    ComposedChart: Passthrough,
    ScatterChart: Passthrough,
    LineChart: Passthrough,
    ResponsiveContainer: Passthrough,
    Scatter: Noop,
    Line: Passthrough,
    ErrorBar: Noop,
    XAxis: Noop,
    YAxis: Noop,
    ZAxis: Noop,
    CartesianGrid: Noop,
    Tooltip: Noop,
    ReferenceLine: Noop,
  };
});

describe('ReplicationTab', () => {
  beforeEach(() => {
    useAnalyticsStore.setState(INITIAL_ANALYTICS_STATE);
    // Reset the live sim store to a known tick-0 snapshot (deterministic).
    useAnalyticsSimStore.getState().reset();
  });

  test('renders KPI strip with Fab Count', () => {
    render(<ReplicationTab />);
    expect(screen.getByText(/Fab Count/i)).toBeInTheDocument();
  });

  test('renders 3 fab cards', () => {
    render(<ReplicationTab />);
    expect(screen.getByText('HQ Fab')).toBeInTheDocument();
    expect(screen.getByText('Satellite Fab')).toBeInTheDocument();
    expect(screen.getByText('New-Build Fab')).toBeInTheDocument();
  });

  test('renders parameter selector', () => {
    render(<ReplicationTab />);
    expect(screen.getByLabelText(/Parameter/i)).toBeInTheDocument();
  });

  test('renders all three chart containers', () => {
    render(<ReplicationTab />);
    const charts = screen.getAllByTestId(/replication-chart/);
    expect(charts.length).toBeGreaterThanOrEqual(3);
  });

  test('renders a plain-language caption under the title', () => {
    render(<ReplicationTab />);
    expect(screen.getByText(/statistically equivalent/i)).toBeInTheDocument();
  });

  test('shows the LIVE badge by default', () => {
    render(<ReplicationTab />);
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  test('drives the Transfer R² KPI from the live sim snapshot', () => {
    render(<ReplicationTab />);
    const snapshot = generateAnalyticsTick(0).modules.replication;
    expect(screen.getByText(snapshot.transferRSquared.toFixed(3))).toBeInTheDocument();
  });

  test('slider takeover: pauses live updates and offers Resume live', () => {
    render(<ReplicationTab />);
    expect(screen.queryByText(/Resume live/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Sample Size'), { target: { value: '80' } });

    expect(screen.getByText(/Resume live/i)).toBeInTheDocument();
    expect(screen.getByText(/exploring/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Resume live/i));
    expect(screen.queryByText(/Resume live/i)).not.toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  // Regression guard for the unicode bug: the rendered output must contain the
  // real glyphs (from SYM), never literal "λ"/"²" escape text.
  test('renders real glyphs, not literal \\uXXXX escapes', () => {
    const { container } = render(<ReplicationTab />);
    const text = container.textContent ?? '';

    // The Transfer R² label and the ± margin readout must render real glyphs.
    expect(text).toContain(SYM.sup2); // ²
    expect(text).toContain(SYM.plusminus); // ±
    expect(text).toContain(SYM.leftright); // ↔ (fab-pair rows)

    // No literal backslash-u escapes should ever leak into the DOM text.
    expect(text).not.toContain('\\u03BB');
    expect(text).not.toContain('\\u00B2');
    expect(text).not.toContain('\\u00B1');
    expect(text).not.toContain('\\u2194');
    expect(text).not.toContain('\\u2014');
  });
});
