import { render, screen, fireEvent } from '@testing-library/react';
import { AlertRow } from './alert-row';
import type { Alarm } from '@/types/equipment';

describe('AlertRow', () => {
  const mockAlarm: Alarm = {
    id: 'alarm-1',
    alarmId: 1001,
    alarmCode: 'TEMP_HIGH',
    equipmentId: 'ETCH-001',
    severity: 'CRITICAL',
    message: 'Chamber temperature exceeded USL',
    timestamp: new Date('2026-01-25T10:00:00'),
    acknowledged: false,
  };

  it('should have minimum 56px height', () => {
    const { container } = render(
      <AlertRow alarm={mockAlarm} onAcknowledge={jest.fn()} />
    );
    const row = container.firstChild as HTMLElement;
    expect(row?.className).toMatch(/min-h-\[56px\]/);
  });

  it('should have 44px acknowledge button', () => {
    render(<AlertRow alarm={mockAlarm} onAcknowledge={jest.fn()} />);
    const button = screen.getByRole('button', { name: /Ack/ });
    expect(button.className).toMatch(/min-h-\[44px\]/);
    expect(button.className).toMatch(/min-w-\[44px\]/);
  });

  it('should display alarm message', () => {
    render(<AlertRow alarm={mockAlarm} onAcknowledge={jest.fn()} />);
    expect(screen.getByText(/Chamber temperature exceeded USL/)).toBeInTheDocument();
  });

  it('should display equipment ID', () => {
    render(<AlertRow alarm={mockAlarm} onAcknowledge={jest.fn()} />);
    expect(screen.getByText(/ETCH-001/)).toBeInTheDocument();
  });

  it('should display timestamp', () => {
    render(<AlertRow alarm={mockAlarm} onAcknowledge={jest.fn()} />);
    expect(screen.getByText(/1\/25\/2026/)).toBeInTheDocument();
  });

  it('should call onAcknowledge when button clicked', () => {
    const onAcknowledge = jest.fn();
    render(<AlertRow alarm={mockAlarm} onAcknowledge={onAcknowledge} />);
    
    const button = screen.getByRole('button', { name: /Ack/ });
    fireEvent.click(button);
    
    expect(onAcknowledge).toHaveBeenCalledWith('alarm-1');
  });

  it('should show "Done" when alarm is acknowledged', () => {
    const acknowledgedAlarm = { ...mockAlarm, acknowledged: true };
    render(<AlertRow alarm={acknowledgedAlarm} onAcknowledge={jest.fn()} />);
    
    const button = screen.getByRole('button', { name: /Done/ });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('should show correct icon for CRITICAL severity', () => {
    const { container } = render(
      <AlertRow alarm={mockAlarm} onAcknowledge={jest.fn()} />
    );
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});
