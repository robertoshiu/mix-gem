import { render, screen, fireEvent } from '@testing-library/react';
import { AlertBanner } from './alert-banner';

describe('AlertBanner', () => {
  const mockAlarm = {
    id: 'alarm-1',
    equipmentId: 'ETCH-001',
    severity: 'CRITICAL' as const,
    message: 'Chamber pressure critical',
    timestamp: new Date(),
    acknowledged: false,
  };

  it('should render alarm details', () => {
    render(
      <AlertBanner alarm={mockAlarm} onAcknowledge={jest.fn()} />
    );
    expect(screen.getByText(/Chamber pressure critical/)).toBeInTheDocument();
    expect(screen.getByText(/ETCH-001/)).toBeInTheDocument();
  });

  it('should call onAcknowledge when button clicked', () => {
    const onAcknowledge = jest.fn();
    render(
      <AlertBanner alarm={mockAlarm} onAcknowledge={onAcknowledge} />
    );

    const button = screen.getByRole('button', { name: /acknowledge/i });
    fireEvent.click(button);

    expect(onAcknowledge).toHaveBeenCalledWith('alarm-1');
  });

  it('should not show if alarm is acknowledged', () => {
    const { container } = render(
      <AlertBanner
        alarm={{ ...mockAlarm, acknowledged: true }}
        onAcknowledge={jest.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
