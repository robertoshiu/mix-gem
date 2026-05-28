import { act, render, screen, fireEvent, within } from '@testing-library/react';
import { FabHealthHero } from '../FabHealthHero';
import { useAnalyticsStore, INITIAL_ANALYTICS_STATE } from '@/stores/analytics-store';
import { useAnalyticsSimStore } from '@/stores/analytics-sim-store';

// Recharts is mocked (mirrors the tab tests) so the radial gauges render as
// inert DOM in jsdom without needing layout measurement.
jest.mock('recharts', () => {
  const ReactActual = jest.requireActual('react') as typeof import('react');
  const DivWrap = ({ children }: { children?: import('react').ReactNode }) =>
    ReactActual.createElement('div', null, children);
  const SvgWrap = ({ children }: { children?: import('react').ReactNode }) =>
    ReactActual.createElement('svg', null, children);
  const Empty = () => null;
  return {
    ResponsiveContainer: DivWrap,
    RadialBarChart: SvgWrap,
    RadialBar: Empty,
    PolarAngleAxis: Empty,
  };
});

describe('FabHealthHero', () => {
  beforeEach(() => {
    useAnalyticsStore.setState(INITIAL_ANALYTICS_STATE);
    // Reset the shared live-data store to its deterministic tick-0 snapshot and
    // stop the interval driver so each test starts from the same source of truth.
    useAnalyticsSimStore.getState().reset();
  });

  afterEach(() => {
    // Ensure no interval driver leaks across tests (wrapped in act because
    // stop() flips the store's `playing` flag, which a mounted Hero subscribes to).
    act(() => useAnalyticsSimStore.getState().stop());
  });

  test('renders the composite Fab Health Score anchor', () => {
    render(<FabHealthHero />);
    const score = screen.getByTestId('fab-health-score');
    expect(score).toBeInTheDocument();
    // Client-ready in jsdom → a numeric score (not the cold-start em dash).
    expect(score.textContent).toMatch(/^\d{1,3}$/);
  });

  test('renders the four supporting sub-gauges', () => {
    render(<FabHealthHero />);
    expect(screen.getByTestId('fab-subgauge-yield')).toBeInTheDocument();
    expect(screen.getByTestId('fab-subgauge-oee')).toBeInTheDocument();
    expect(screen.getByTestId('fab-subgauge-reliability')).toBeInTheDocument();
    expect(screen.getByTestId('fab-subgauge-multifab')).toBeInTheDocument();
  });

  test('renders all 8 process-health pills', () => {
    render(<FabHealthHero />);
    const ids = [
      'oxidation', 'lithography', 'etching', 'deposition',
      'implant', 'diffusion', 'cmp', 'metallization',
    ];
    for (const id of ids) {
      expect(screen.getByTestId(`process-pill-${id}`)).toBeInTheDocument();
    }
  });

  test('renders the live event stream', () => {
    render(<FabHealthHero />);
    expect(screen.getByText('FAB ANALYTICS EVENT STREAM')).toBeInTheDocument();
  });

  test('renders the SHIFT loop pill and progress bar', () => {
    render(<FabHealthHero />);
    expect(within(screen.getByTestId('fab-loop-pill')).getByText(/SHIFT \d{2}:\d{2} LOOP/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('composite score updates when the sim advances a tick', () => {
    render(<FabHealthHero />);
    const before = screen.getByTestId('fab-health-score').textContent;

    // Drive the shared store forward deterministically (no timers needed).
    act(() => {
      // Advance several ticks so the weighted composite is virtually certain to
      // move at least one whole point.
      for (let i = 0; i < 12; i++) useAnalyticsSimStore.getState().tick_();
    });

    const after = screen.getByTestId('fab-health-score').textContent;
    expect(after).not.toBe(before);
  });

  test('clicking a process pill drills into the matching tab via setTab', () => {
    render(<FabHealthHero />);
    // etching → APC tab per STEP_TO_TAB.
    fireEvent.click(screen.getByTestId('process-pill-etching'));
    expect(useAnalyticsStore.getState().activeTab).toBe('apc');

    // lithography → Multi-Fab (replication) tab.
    fireEvent.click(screen.getByTestId('process-pill-lithography'));
    expect(useAnalyticsStore.getState().activeTab).toBe('replication');
  });

  test('clicking a sub-gauge drills into its tab via setTab', () => {
    render(<FabHealthHero />);
    fireEvent.click(screen.getByTestId('fab-subgauge-reliability'));
    expect(useAnalyticsStore.getState().activeTab).toBe('reliability');
  });

  test('play/pause toggles the sim store playing state', () => {
    // Start playing (mirrors the page mounting the driver).
    act(() => useAnalyticsSimStore.getState().start());
    render(<FabHealthHero />);

    const button = screen.getByTestId('fab-play-pause');
    expect(useAnalyticsSimStore.getState().playing).toBe(true);
    expect(button).toHaveAttribute('aria-pressed', 'true');

    // Click → pause.
    fireEvent.click(button);
    expect(useAnalyticsSimStore.getState().playing).toBe(false);
    expect(screen.getByTestId('fab-play-pause')).toHaveAttribute('aria-pressed', 'false');

    // Click again → resume.
    fireEvent.click(screen.getByTestId('fab-play-pause'));
    expect(useAnalyticsSimStore.getState().playing).toBe(true);
  });

  test('per-tick score live region is aria-live off', () => {
    render(<FabHealthHero />);
    expect(screen.getByTestId('fab-health-score-live')).toHaveAttribute('aria-live', 'off');
  });
});
