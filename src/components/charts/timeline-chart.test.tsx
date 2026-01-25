import { render, screen } from '@testing-library/react';
import { TimelineChart } from './timeline-chart';

describe('TimelineChart', () => {
  const mockAlarms = [
    {
      id: '1',
      alarmId: 101,
      alarmCode: 'ERR-TEMP',
      equipmentId: 'ETCH-001',
      severity: 'CRITICAL' as const,
      message: 'High temp',
      timestamp: new Date('2026-01-25T10:00:00'),
      acknowledged: true,
    },
    {
      id: '2',
      alarmId: 102,
      alarmCode: 'ERR-PRESS',
      equipmentId: 'ETCH-001',
      severity: 'MINOR' as const,
      message: 'Low pressure',
      timestamp: new Date('2026-01-25T10:30:00'),
      acknowledged: false,
    },
  ];

  it('should render alarm messages in timeline', () => {
    render(<TimelineChart alarms={mockAlarms} />);
    expect(screen.getByText(/High temp/)).toBeInTheDocument();
    expect(screen.getByText(/Low pressure/)).toBeInTheDocument();
  });

  it('should show timestamps', () => {
    render(<TimelineChart alarms={mockAlarms} />);
    expect(screen.getByText(/10:00/)).toBeInTheDocument();
    expect(screen.getByText(/10:30/)).toBeInTheDocument();
  });
});
