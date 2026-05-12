import { render, screen, fireEvent } from '@testing-library/react';
import { AlertToast } from './alert-toast';
import type { AlarmSeverity } from '@/types/equipment';

describe('AlertToast', () => {
  const mockOnDismiss = jest.fn();

  const defaultProps = {
    id: 'alarm-1',
    severity: 'CRITICAL' as AlarmSeverity,
    message: 'Temperature out of range',
    equipmentId: 'EQP-001',
    timestamp: new Date('2026-01-26T10:00:00'),
    onDismiss: mockOnDismiss,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('rendering', () => {
    it('should render alarm message', () => {
      render(<AlertToast {...defaultProps} />);
      expect(screen.getByText('Temperature out of range')).toBeInTheDocument();
    });

    it('should render equipment ID', () => {
      render(<AlertToast {...defaultProps} />);
      expect(screen.getByText('EQP-001')).toBeInTheDocument();
    });

    it('should render timestamp', () => {
      render(<AlertToast {...defaultProps} />);
      expect(screen.getByText(/10:00:00 AM/)).toBeInTheDocument();
    });

    it('should have aria-live="assertive"', () => {
      const { container } = render(<AlertToast {...defaultProps} />);
      const toast = container.firstChild as HTMLElement;
      expect(toast).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have role="alert"', () => {
      const { container } = render(<AlertToast {...defaultProps} />);
      const toast = container.firstChild as HTMLElement;
      expect(toast).toHaveAttribute('role', 'alert');
    });
  });

  describe('severity colors', () => {
    it('should show red colors for CRITICAL', () => {
      const { container } = render(<AlertToast {...defaultProps} severity="CRITICAL" />);
      const toast = container.firstChild as HTMLElement;
      expect(toast).toHaveClass('border-red-500');
    });

    it('should show amber colors for MAJOR', () => {
      const { container } = render(<AlertToast {...defaultProps} severity="MAJOR" />);
      const toast = container.firstChild as HTMLElement;
      expect(toast).toHaveClass('border-amber-500');
    });

    it('should show yellow colors for MINOR', () => {
      const { container } = render(<AlertToast {...defaultProps} severity="MINOR" />);
      const toast = container.firstChild as HTMLElement;
      expect(toast).toHaveClass('border-yellow-500');
    });

    it('should show blue colors for INFO', () => {
      const { container } = render(<AlertToast {...defaultProps} severity="INFO" />);
      const toast = container.firstChild as HTMLElement;
      expect(toast).toHaveClass('border-blue-500');
    });
  });

  describe('auto-dismiss', () => {
    it('should auto-dismiss after 5 seconds', () => {
      render(<AlertToast {...defaultProps} />);

      expect(mockOnDismiss).not.toHaveBeenCalled();

      jest.advanceTimersByTime(5000);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
      expect(mockOnDismiss).toHaveBeenCalledWith('alarm-1');
    });

    it('should not auto-dismiss before 5 seconds', () => {
      render(<AlertToast {...defaultProps} />);

      jest.advanceTimersByTime(4999);

      expect(mockOnDismiss).not.toHaveBeenCalled();
    });

    it('should clear timeout on unmount', () => {
      const { unmount } = render(<AlertToast {...defaultProps} />);

      unmount();

      jest.advanceTimersByTime(5000);

      expect(mockOnDismiss).not.toHaveBeenCalled();
    });
  });

  describe('dismiss button', () => {
    it('should render dismiss button', () => {
      render(<AlertToast {...defaultProps} />);
      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      expect(dismissButton).toBeInTheDocument();
    });

    it('should call onDismiss when dismiss button is clicked', () => {
      render(<AlertToast {...defaultProps} />);
      const dismissButton = screen.getByRole('button', { name: /dismiss/i });

      fireEvent.click(dismissButton);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
      expect(mockOnDismiss).toHaveBeenCalledWith('alarm-1');
    });

    it('should cancel auto-dismiss when manually dismissed', () => {
      render(<AlertToast {...defaultProps} />);
      const dismissButton = screen.getByRole('button', { name: /dismiss/i });

      fireEvent.click(dismissButton);
      mockOnDismiss.mockClear();

      jest.advanceTimersByTime(5000);

      expect(mockOnDismiss).not.toHaveBeenCalled();
    });
  });
});
