import { render, screen, fireEvent, within } from '@testing-library/react';
import { YieldTab } from '../YieldTab';
import { SYM } from '@/lib/analytics/symbols';
import { useAnalyticsSimStore } from '@/stores/analytics-sim-store';

describe('YieldTab', () => {
  beforeEach(() => {
    // Reset the shared live-data store to its deterministic tick-0 snapshot so
    // each test renders from the same live source of truth.
    useAnalyticsSimStore.getState().reset();
  });

  test('renders KPI strip with Line Yield', () => {
    render(<YieldTab />);
    // Exact match (not substring) — avoids colliding with the waterfall caption
    // which legitimately contains the phrase "line yield".
    expect(screen.getByText('Line Yield')).toBeInTheDocument();
  });

  test('renders die area slider', () => {
    render(<YieldTab />);
    expect(screen.getByLabelText(/Die Area/i)).toBeInTheDocument();
  });

  test('renders D0 sliders for process steps', () => {
    render(<YieldTab />);
    const sliders = screen.getAllByRole('slider');
    // 8 process-step D0 sliders + die area + cluster alpha.
    expect(sliders.length).toBeGreaterThanOrEqual(8);
  });

  test('renders scenario preset buttons', () => {
    render(<YieldTab />);
    expect(screen.getByRole('button', { name: /Baseline/i })).toBeInTheDocument();
  });

  test('renders 3 recharts chart containers', () => {
    render(<YieldTab />);
    const charts = screen.getAllByTestId(/yield-chart/);
    expect(charts.length).toBeGreaterThanOrEqual(3);
  });

  test('starts in live mode (no paused badge)', () => {
    render(<YieldTab />);
    expect(screen.queryByTestId('yield-paused-badge')).not.toBeInTheDocument();
    expect(screen.getByText(/^Live$/i)).toBeInTheDocument();
  });

  /** The KPI box whose label is `label` (scopes value assertions to the strip). */
  function kpiBoxByLabel(label: string): HTMLElement {
    const labelNode = screen.getByText(label);
    const box = labelNode.closest('[data-testid="kpi-box"]');
    if (!(box instanceof HTMLElement)) throw new Error(`No KPI box for label "${label}"`);
    return box;
  }

  test('binds KPIs to the live yield snapshot from the sim store', () => {
    render(<YieldTab />);
    // Die Area KPI should reflect the live snapshot's area, not a hard-coded value.
    const liveArea = useAnalyticsSimStore.getState().modules.yield.area;
    expect(within(kpiBoxByLabel('Die Area')).getByText(`${liveArea} mm${SYM.sup2}`)).toBeInTheDocument();
  });

  test('moving a slider takes over: pauses live + shows Resume live', () => {
    render(<YieldTab />);
    const areaSlider = screen.getByLabelText(/Die Area/i);
    fireEvent.change(areaSlider, { target: { value: '222' } });

    expect(screen.getByTestId('yield-paused-badge')).toBeInTheDocument();
    expect(within(kpiBoxByLabel('Die Area')).getByText(`222 mm${SYM.sup2}`)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Resume live/i }).length).toBeGreaterThanOrEqual(1);
  });

  test('Resume live clears the paused state', () => {
    render(<YieldTab />);
    fireEvent.change(screen.getByLabelText(/Die Area/i), { target: { value: '222' } });
    expect(screen.getByTestId('yield-paused-badge')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /Resume live/i })[0]);
    expect(screen.queryByTestId('yield-paused-badge')).not.toBeInTheDocument();
  });

  test('applying a preset pauses live updates (slider takeover)', () => {
    render(<YieldTab />);
    fireEvent.click(screen.getByRole('button', { name: /Baseline/i }));
    expect(screen.getByTestId('yield-paused-badge')).toBeInTheDocument();
  });

  // --- Unicode regression guard -------------------------------------------
  // The whole point of the redesign: JSX text/attributes must render REAL
  // glyphs, never the literal escape sequence that JSX does not parse.
  test('renders real Unicode glyphs, not literal \\u escapes', () => {
    const { container } = render(<YieldTab />);
    const text = container.textContent ?? '';

    // Real glyphs are present...
    expect(text).toContain(SYM.alpha); // 'α'
    expect(text).toContain(SYM.sup2); // '²'
    expect(text).toContain(SYM.sub0); // '₀'

    // ...and the literal escape sequences are NOT.
    expect(text).not.toContain('\\u03BB');
    expect(text).not.toContain('\\u00B2');
    expect(text).not.toContain('\\u2080');
    expect(text).not.toMatch(/\\u[0-9a-fA-F]{4}/);
  });

  test('paused badge uses a real em dash, not an escape', () => {
    render(<YieldTab />);
    fireEvent.change(screen.getByLabelText(/Die Area/i), { target: { value: '180' } });
    const badge = screen.getByTestId('yield-paused-badge');
    expect(within(badge).getByText(new RegExp(`PAUSED ${SYM.dash} EXPLORING`, 'i'))).toBeInTheDocument();
  });
});
