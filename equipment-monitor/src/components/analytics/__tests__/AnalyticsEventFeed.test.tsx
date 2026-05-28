import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  AnalyticsEventFeed,
  type AnalyticsEvent,
} from '../AnalyticsEventFeed';

const mockEvents: AnalyticsEvent[] = [
  { id: 'e1', tick: 0, timestamp: '16:40:00', category: 'yield', severity: 'info', message: 'Line yield holding at 94.2% — nominal' },
  { id: 'e2', tick: 1, timestamp: '16:40:01', category: 'apc', severity: 'warning', message: 'EWMA drift on litho step exceeds 1.5 sigma' },
  { id: 'e3', tick: 2, timestamp: '16:40:02', category: 'reliability', severity: 'critical', message: 'Implant tool MTBF breach — availability below 0.95' },
  { id: 'e4', tick: 3, timestamp: '16:40:03', category: 'optimization', severity: 'info', message: 'Pareto front advanced — throughput +2.1%' },
  { id: 'e5', tick: 4, timestamp: '16:40:04', category: 'multifab', severity: 'info', message: 'HQ vs Satellite CD equivalence test passed' },
  { id: 'e6', tick: 5, timestamp: '16:40:05', category: 'vpp', severity: 'info', message: 'Pipeline cumulative yield projected at 91.8%' },
];

describe('AnalyticsEventFeed', () => {
  it('renders header with "FAB ANALYTICS EVENT STREAM" and event count', () => {
    render(<AnalyticsEventFeed events={mockEvents} currentTick={10} />);
    expect(screen.getByText('FAB ANALYTICS EVENT STREAM')).toBeInTheDocument();
    expect(screen.getByText(/6 events/)).toBeInTheDocument();
  });

  it('renders LIVE indicator', () => {
    render(<AnalyticsEventFeed events={mockEvents} currentTick={10} />);
    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });

  it('exposes the high-frequency list as a log with aria-live OFF', () => {
    render(<AnalyticsEventFeed events={mockEvents} currentTick={10} />);
    expect(screen.getByRole('log', { name: /fab analytics event stream/i })).toHaveAttribute(
      'aria-live',
      'off',
    );
  });

  it('provides a single polite live region for critical announcements', () => {
    render(<AnalyticsEventFeed events={mockEvents} currentTick={10} />);
    const announcer = screen.getByTestId('analytics-critical-announcer');
    expect(announcer).toHaveAttribute('aria-live', 'polite');
    // Region is present even though it is visually hidden.
    expect(announcer).toHaveAttribute('aria-atomic', 'true');
  });

  it('announces only new critical-severity events (not info/warning ticks)', () => {
    render(<AnalyticsEventFeed events={mockEvents} currentTick={10} />);
    const announcer = screen.getByTestId('analytics-critical-announcer');
    // The single critical event (e3) is announced with a human-readable label.
    expect(announcer).toHaveTextContent(
      'Critical Reliability event: Implant tool MTBF breach — availability below 0.95',
    );
    // Non-critical messages are not announced through the polite region.
    expect(announcer).not.toHaveTextContent('Line yield holding at 94.2% — nominal');
    expect(announcer).not.toHaveTextContent('EWMA drift on litho step exceeds 1.5 sigma');
  });

  it('keeps the polite region empty when there are no critical events', () => {
    const noCritical = mockEvents.filter((e) => e.severity !== 'critical');
    render(<AnalyticsEventFeed events={noCritical} currentTick={10} />);
    expect(screen.getByTestId('analytics-critical-announcer')).toHaveTextContent('');
  });

  it('does not re-announce the same critical event on a subsequent tick', () => {
    const { rerender } = render(<AnalyticsEventFeed events={mockEvents} currentTick={10} />);
    expect(screen.getByTestId('analytics-critical-announcer')).toHaveTextContent(
      'Critical Reliability event: Implant tool MTBF breach — availability below 0.95',
    );
    // Each sim tick feeds a fresh array (rolling buffer) with the same critical
    // event still in it. The announcement should clear so the screen reader is
    // not re-triggered for an already-announced event.
    rerender(<AnalyticsEventFeed events={[...mockEvents]} currentTick={11} />);
    expect(screen.getByTestId('analytics-critical-announcer')).toHaveTextContent('');
  });

  it('announces a brand-new critical event that arrives on a later tick', () => {
    const { rerender } = render(<AnalyticsEventFeed events={mockEvents} currentTick={10} />);
    const newCritical: AnalyticsEvent = {
      id: 'e7', tick: 6, timestamp: '16:40:06', category: 'apc',
      severity: 'critical', message: 'APC controller saturated — manual override required',
    };
    rerender(<AnalyticsEventFeed events={[...mockEvents, newCritical]} currentTick={11} />);
    expect(screen.getByTestId('analytics-critical-announcer')).toHaveTextContent(
      'Critical APC R2R event: APC controller saturated — manual override required',
    );
  });

  it('renders event messages', () => {
    render(<AnalyticsEventFeed events={mockEvents} currentTick={10} />);
    expect(screen.getByText('Line yield holding at 94.2% — nominal')).toBeInTheDocument();
    expect(screen.getByText('EWMA drift on litho step exceeds 1.5 sigma')).toBeInTheDocument();
    expect(screen.getByText('Implant tool MTBF breach — availability below 0.95')).toBeInTheDocument();
    expect(screen.getByText('Pareto front advanced — throughput +2.1%')).toBeInTheDocument();
    expect(screen.getByText('HQ vs Satellite CD equivalence test passed')).toBeInTheDocument();
    expect(screen.getByText('Pipeline cumulative yield projected at 91.8%')).toBeInTheDocument();
  });

  it('renders timestamps', () => {
    render(<AnalyticsEventFeed events={mockEvents} currentTick={10} />);
    expect(screen.getByText('16:40:00')).toBeInTheDocument();
    expect(screen.getByText('16:40:01')).toBeInTheDocument();
    expect(screen.getByText('16:40:02')).toBeInTheDocument();
    expect(screen.getByText('16:40:03')).toBeInTheDocument();
    expect(screen.getByText('16:40:04')).toBeInTheDocument();
    expect(screen.getByText('16:40:05')).toBeInTheDocument();
  });

  it('renders category tags (YLD, APC, REL, OPT, MFB, VPP)', () => {
    render(<AnalyticsEventFeed events={mockEvents} currentTick={10} />);
    expect(screen.getByText('YLD')).toBeInTheDocument();
    expect(screen.getByText('APC')).toBeInTheDocument();
    expect(screen.getByText('REL')).toBeInTheDocument();
    expect(screen.getByText('OPT')).toBeInTheDocument();
    expect(screen.getByText('MFB')).toBeInTheDocument();
    expect(screen.getByText('VPP')).toBeInTheDocument();
  });

  it('renders empty state when no events', () => {
    render(<AnalyticsEventFeed events={[]} currentTick={0} />);
    expect(screen.getByText('Awaiting fab events…')).toBeInTheDocument();
  });

  it('displays newest events first (first row contains last event message)', () => {
    render(<AnalyticsEventFeed events={mockEvents} currentTick={10} />);
    const rows = screen.getAllByTestId('analytics-event-row');
    expect(rows.length).toBe(6);
    // First rendered row should be the newest event (e6, last in array)
    expect(rows[0]).toHaveTextContent('Pipeline cumulative yield projected at 91.8%');
    // Last rendered row should be the oldest event (e1, first in array)
    expect(rows[5]).toHaveTextContent('Line yield holding at 94.2% — nominal');
  });

  it('fades events correctly across the 180-tick wrap boundary', () => {
    render(
      <AnalyticsEventFeed
        currentTick={5}
        events={[
          { id: 'wrapped-old', tick: 140, timestamp: '16:42:20', category: 'yield', severity: 'info', message: 'older wrapped event' },
        ]}
      />,
    );
    expect(screen.getByTestId('analytics-event-row')).toHaveStyle({ opacity: '0.4' });
  });

  it('renders fresh events at full opacity', () => {
    render(
      <AnalyticsEventFeed
        currentTick={5}
        events={[
          { id: 'fresh', tick: 5, timestamp: '16:40:05', category: 'vpp', severity: 'info', message: 'just now' },
        ]}
      />,
    );
    expect(screen.getByTestId('analytics-event-row')).toHaveStyle({ opacity: '1' });
  });
});
