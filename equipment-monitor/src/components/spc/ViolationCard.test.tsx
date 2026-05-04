import { render, screen, fireEvent } from '@testing-library/react';
import { ViolationCard } from './ViolationCard';
import type { SpcViolation } from '@/lib/mes-types';

const mockViolation: SpcViolation = {
  id: 'v1', lotId: 'LOT-2026-001', waferNumber: 11,
  parameter: 'cd', rule: 'rule_1', value: 49.1, limit: 48.0,
  acknowledged: false, timestamp: new Date('2026-05-02T10:00:00'),
};

describe('ViolationCard', () => {
  it('displays rule and parameter', () => {
    render(<ViolationCard violation={mockViolation} onAcknowledge={jest.fn()} />);
    expect(screen.getByText(/Rule 1/i)).toBeInTheDocument();
    expect(screen.getByText(/cd/i)).toBeInTheDocument();
  });

  it('shows lot ID', () => {
    render(<ViolationCard violation={mockViolation} onAcknowledge={jest.fn()} />);
    expect(screen.getByText(/LOT-2026-001/)).toBeInTheDocument();
  });

  it('shows Acknowledge button when not acknowledged', () => {
    render(<ViolationCard violation={mockViolation} onAcknowledge={jest.fn()} />);
    expect(screen.getByRole('button', { name: /acknowledge/i })).toBeInTheDocument();
  });

  it('calls onAcknowledge with violation id', () => {
    const onAck = jest.fn();
    render(<ViolationCard violation={mockViolation} onAcknowledge={onAck} />);
    fireEvent.click(screen.getByRole('button', { name: /acknowledge/i }));
    expect(onAck).toHaveBeenCalledWith('v1');
  });

  it('shows "Acknowledged" text when already acknowledged', () => {
    render(<ViolationCard violation={{ ...mockViolation, acknowledged: true }} onAcknowledge={jest.fn()} />);
    expect(screen.getByText(/acknowledged/i)).toBeInTheDocument();
  });
});
