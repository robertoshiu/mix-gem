import { render, screen } from '@testing-library/react';
import { EventLog } from './EventLog';
import type { SecsEvent } from '@/lib/mes-types';

const mockEvents: SecsEvent[] = [
  {
    id: 'e1', type: 's6f11_spc_data', label: 'S6F11 Collection Event: LOT-001 wafer 5',
    timestamp: new Date('2026-05-02T10:32:05'), secsMessage: { stream: 6, function: 11 },
  },
  {
    id: 'e2', type: 's2f41_stop', label: 'S2F41 STOP -> LITHO01',
    timestamp: new Date('2026-05-02T10:32:06'), secsMessage: { stream: 2, function: 41, rcmd: 'STOP' },
  },
];

describe('EventLog', () => {
  it('renders event labels', () => {
    render(<EventLog events={mockEvents} />);
    expect(screen.getByText(/S6F11 Collection Event/)).toBeInTheDocument();
    expect(screen.getByText(/S2F41 STOP/)).toBeInTheDocument();
  });

  it('renders timestamps', () => {
    render(<EventLog events={mockEvents} />);
    expect(screen.getAllByText(/10:32/).length).toBeGreaterThan(0);
  });

  it('renders empty state when no events', () => {
    render(<EventLog events={[]} />);
    expect(screen.getByText(/no events/i)).toBeInTheDocument();
  });
});