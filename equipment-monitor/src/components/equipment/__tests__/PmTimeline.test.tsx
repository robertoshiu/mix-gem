import { render, screen } from '@testing-library/react';
import { PmTimeline } from '../PmTimeline';
import type { PmSchedule } from '@/lib/tool-health';

const mockSchedule: PmSchedule = {
  equipmentId: 'NXE-3800-01',
  nextPmDate: '2026-06-15',
  pmIntervalDays: 30,
  lastPmDate: '2026-05-16',
  history: [
    { id: 'pm-1', type: 'completed', date: '2026-05-16', durationHours: 4, description: 'Chamber clean' },
    { id: 'pm-2', type: 'completed', date: '2026-04-16', durationHours: 6, description: 'Filter replacement' },
    { id: 'pm-3', type: 'unscheduled', date: '2026-03-18', durationHours: 8, description: 'Leak fix' },
    { id: 'pm-4', type: 'completed', date: '2026-02-15', durationHours: 3, description: 'Calibration' },
    { id: 'pm-5', type: 'completed', date: '2026-01-16', durationHours: 5, description: 'Consumable swap' },
    { id: 'pm-6', type: 'completed', date: '2025-12-17', durationHours: 4, description: 'Chamber clean' },
  ],
};

describe('PmTimeline', () => {
  test('shows countdown text with correct days', () => {
    render(<PmTimeline schedule={mockSchedule} today="2026-05-22" />);
    expect(screen.getByText(/next pm in 24 days/i)).toBeInTheDocument();
  });

  test('renders 6 history dots', () => {
    const { container } = render(<PmTimeline schedule={mockSchedule} today="2026-05-22" />);
    const dots = container.querySelectorAll('[data-testid^="pm-dot-"]');
    expect(dots).toHaveLength(6);
  });

  test('overdue PM shows red indicator', () => {
    const overdueSchedule: PmSchedule = {
      ...mockSchedule,
      nextPmDate: '2026-05-20',
    };
    render(<PmTimeline schedule={overdueSchedule} today="2026-05-22" />);
    expect(screen.getByText(/pm overdue/i)).toBeInTheDocument();
  });
});
