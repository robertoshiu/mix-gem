import React from 'react';
import { render, screen } from '@testing-library/react';
import { EventFeed } from '../EventFeed';
import type { FacilityEvent } from '@/lib/engines/dashboard-facility-types';

const mockEvents: FacilityEvent[] = [
  { id: 'e1', tick: 0, timestamp: '16:40:00', subsystem: 'ems', severity: 'info', message: 'CR-A Zone temp 22.1C — nominal' },
  { id: 'e2', tick: 1, timestamp: '16:40:01', subsystem: 'gas', severity: 'warning', message: 'NH3 sensor GS-03 reading 22ppm' },
  { id: 'e3', tick: 2, timestamp: '16:40:02', subsystem: 'fire', severity: 'critical', message: 'SMOKE ALARM SD-04 — Zone B ACTIVATED' },
  { id: 'e4', tick: 3, timestamp: '16:40:03', subsystem: 'power', severity: 'info', message: 'PDU-A load 847kW nominal' },
  { id: 'e5', tick: 4, timestamp: '16:40:04', subsystem: 'bas', severity: 'info', message: 'AHU-2 fan speed adjusted to 78%' },
];

describe('EventFeed', () => {
  it('renders header with "FACILITY EVENT LOG" and event count', () => {
    render(<EventFeed events={mockEvents} currentTick={10} />);
    expect(screen.getByText('FACILITY EVENT LOG')).toBeInTheDocument();
    expect(screen.getByText(/5 events/)).toBeInTheDocument();
  });

  it('renders LIVE indicator', () => {
    render(<EventFeed events={mockEvents} currentTick={10} />);
    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });

  it('exposes the event list as a polite live log', () => {
    render(<EventFeed events={mockEvents} currentTick={10} />);
    expect(screen.getByRole('log', { name: /facility event log/i })).toHaveAttribute(
      'aria-live',
      'polite',
    );
  });

  it('renders event messages', () => {
    render(<EventFeed events={mockEvents} currentTick={10} />);
    expect(screen.getByText('CR-A Zone temp 22.1C — nominal')).toBeInTheDocument();
    expect(screen.getByText('NH3 sensor GS-03 reading 22ppm')).toBeInTheDocument();
    expect(screen.getByText('SMOKE ALARM SD-04 — Zone B ACTIVATED')).toBeInTheDocument();
    expect(screen.getByText('PDU-A load 847kW nominal')).toBeInTheDocument();
    expect(screen.getByText('AHU-2 fan speed adjusted to 78%')).toBeInTheDocument();
  });

  it('renders timestamps', () => {
    render(<EventFeed events={mockEvents} currentTick={10} />);
    expect(screen.getByText('16:40:00')).toBeInTheDocument();
    expect(screen.getByText('16:40:01')).toBeInTheDocument();
    expect(screen.getByText('16:40:02')).toBeInTheDocument();
    expect(screen.getByText('16:40:03')).toBeInTheDocument();
    expect(screen.getByText('16:40:04')).toBeInTheDocument();
  });

  it('renders subsystem tags (EMS, GAS, FIRE, PWR, BAS)', () => {
    render(<EventFeed events={mockEvents} currentTick={10} />);
    expect(screen.getByText('EMS')).toBeInTheDocument();
    expect(screen.getByText('GAS')).toBeInTheDocument();
    expect(screen.getByText('FIRE')).toBeInTheDocument();
    expect(screen.getByText('PWR')).toBeInTheDocument();
    expect(screen.getByText('BAS')).toBeInTheDocument();
  });

  it('renders empty state when no events', () => {
    render(<EventFeed events={[]} currentTick={0} />);
    expect(screen.getByText('Awaiting facility events...')).toBeInTheDocument();
  });

  it('displays newest events first (first row contains last event message)', () => {
    render(<EventFeed events={mockEvents} currentTick={10} />);
    const rows = screen.getAllByTestId('event-row');
    expect(rows.length).toBe(5);
    // First rendered row should be the newest event (e5, last in array)
    expect(rows[0]).toHaveTextContent('AHU-2 fan speed adjusted to 78%');
    // Last rendered row should be the oldest event (e1, first in array)
    expect(rows[4]).toHaveTextContent('CR-A Zone temp 22.1C — nominal');
  });

  it('fades events correctly across the 180-tick wrap boundary', () => {
    render(
      <EventFeed
        currentTick={5}
        events={[
          { id: 'wrapped-old', tick: 140, timestamp: '16:42:20', subsystem: 'ems', severity: 'info', message: 'older wrapped event' },
        ]}
      />,
    );
    expect(screen.getByTestId('event-row')).toHaveStyle({ opacity: '0.4' });
  });
});
