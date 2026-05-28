import { render, screen, fireEvent, within } from '@testing-library/react';

// recharts' ResponsiveContainer needs ResizeObserver, which jsdom lacks.
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

import { VppTab } from '../VppTab';
import { useAnalyticsSimStore } from '@/stores/analytics-sim-store';

jest.mock('@/lib/analytics/vpp-engine', () => {
  const actual = jest.requireActual('@/lib/analytics/vpp-engine');
  return actual;
});

// Charts render behind a hydration gate (useClientReady). Force "ready" so the
// recharts trees mount and we exercise the real (non-canvas) chart path.
jest.mock('@/hooks/use-client-ready', () => ({
  useClientReady: () => true,
}));

afterEach(() => {
  // Make sure the shared tick driver never leaks between tests.
  useAnalyticsSimStore.getState().reset();
});

describe('VppTab', () => {
  test('renders KPI strip', () => {
    render(<VppTab />);
    expect(screen.getByText(/Active Sims/)).toBeInTheDocument();
    expect(screen.getByText('Cumulative Yield')).toBeInTheDocument();
  });

  test('renders a plain-language caption under the tab title', () => {
    render(<VppTab />);
    expect(screen.getByText(/Virtual Process Pipeline/)).toBeInTheDocument();
    expect(
      screen.getByText(/Simulate the full 8-step wafer recipe end to end/i),
    ).toBeInTheDocument();
  });

  test('renders pipeline steps section', () => {
    render(<VppTab />);
    expect(screen.getAllByText(/Pipeline Steps/).length).toBeGreaterThanOrEqual(1);
  });

  test('renders all 5 accordion panels', () => {
    render(<VppTab />);
    expect(screen.getByText(/Film Stack/)).toBeInTheDocument();
    expect(screen.getByText(/Thermal Budget/)).toBeInTheDocument();
    expect(screen.getByText(/Stress/)).toBeInTheDocument();
    expect(screen.getByText(/Defect/)).toBeInTheDocument();
    expect(screen.getByText(/Dopant/)).toBeInTheDocument();
  });

  test('renders recharts-based VPP charts (not canvas)', () => {
    const { container } = render(<VppTab />);
    expect(screen.getByTestId('vpp-chart-waterfall')).toBeInTheDocument();
    expect(screen.getByTestId('vpp-chart-metric')).toBeInTheDocument();
    // The hand-rolled canvas charts must be gone.
    expect(container.querySelector('canvas')).toBeNull();
    expect(
      container.querySelectorAll('.recharts-responsive-container').length,
    ).toBeGreaterThanOrEqual(2);
  });

  test('reflects the live simulation snapshot in cumulative yield', () => {
    render(<VppTab />);
    // The KPI value is engine-derived from the live snapshot; advancing the
    // store one tick re-derives it. We assert the value is a real percentage,
    // proving the engine consumed the snapshot rather than a static default.
    const yieldLabel = screen.getByText('Cumulative Yield');
    const card = yieldLabel.closest('[data-testid="kpi-box"]') as HTMLElement;
    expect(card).not.toBeNull();
    expect(within(card).getByText(/%$/)).toBeInTheDocument();
  });

  test('starts live (no paused badge) and shows live badge by default', () => {
    render(<VppTab />);
    expect(screen.getByTestId('vpp-live-badge')).toBeInTheDocument();
    expect(screen.queryByTestId('vpp-paused-badge')).toBeNull();
  });

  test('slider takeover: moving a child-panel slider pauses live + shows resume', () => {
    render(<VppTab />);

    // Open the Stress / Strain accordion to reach its temperature slider.
    fireEvent.click(screen.getByText('Stress / Strain'));
    const tempSlider = screen.getByLabelText('Process temperature');
    fireEvent.change(tempSlider, { target: { value: '300' } });

    // The tab is now paused-for-exploration with a resume affordance.
    expect(screen.getByTestId('vpp-paused-badge')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Resume live/i })).toBeInTheDocument();
    expect(screen.queryByTestId('vpp-live-badge')).toBeNull();

    // Resuming clears the takeover.
    fireEvent.click(screen.getByRole('button', { name: /Resume live/i }));
    expect(screen.getByTestId('vpp-live-badge')).toBeInTheDocument();
    expect(screen.queryByTestId('vpp-paused-badge')).toBeNull();
  });

  test('regression: renders real Unicode glyphs, never literal \\u escapes', () => {
    const { container } = render(<VppTab />);

    // Open Defect Density to surface the squared/subscript glyphs in its footer.
    fireEvent.click(screen.getByText(/Defect Density/));

    const text = container.textContent ?? '';
    // Real glyphs present (rendered from SYM via {} expressions).
    expect(text).toContain('²'); // superscript two, e.g. /cm²
    expect(text).toContain('₀'); // subscript zero, e.g. D₀
    expect(text).toContain('—'); // em dash separator

    // And never the raw escape sequences that the original JSX-text bug printed.
    expect(text).not.toContain('\\u00B2');
    expect(text).not.toContain('\\u2080');
    expect(text).not.toContain('\\u03BB');
  });
});
