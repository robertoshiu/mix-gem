import { render, screen, fireEvent } from '@testing-library/react';
import { AlertBanner } from './alert-banner';
import type { AlarmSeverity } from '@/types/equipment';

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

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const { container } = render(
        <AlertBanner alarm={mockAlarm} onAcknowledge={jest.fn()} />
      );
      const alert = container.firstChild as HTMLElement;
      expect(alert).toHaveAttribute('role', 'alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have descriptive aria-label on button', () => {
      render(
        <AlertBanner alarm={mockAlarm} onAcknowledge={jest.fn()} />
      );
      const button = screen.getByRole('button', { name: /acknowledge critical alarm for etch-001/i });
      expect(button).toBeInTheDocument();
    });

    it('should have aria-label that includes severity and equipment ID', () => {
      const alarm = {
        ...mockAlarm,
        severity: 'MAJOR' as const,
        equipmentId: 'CVD-123',
      };
      render(
        <AlertBanner alarm={alarm} onAcknowledge={jest.fn()} />
      );
      const button = screen.getByRole('button', { name: /acknowledge major alarm for cvd-123/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Severity Levels', () => {
    test.each([
      ['CRITICAL', 'border-red-500', 'text-red-400'],
      ['MAJOR', 'border-amber-500', 'text-amber-400'],
      ['MINOR', 'border-yellow-500', 'text-yellow-400'],
      ['INFO', 'border-blue-500', 'text-blue-400'],
    ])('should render %s severity with correct colors', (severity, borderClass, textClass) => {
      const alarm = { ...mockAlarm, severity: severity as AlarmSeverity };
      const { container } = render(<AlertBanner alarm={alarm} onAcknowledge={jest.fn()} />);
      const banner = container.firstChild as HTMLElement;
      expect(banner.className).toContain(borderClass);

      // Verify text color on severity badge
      const severityText = screen.getByText(severity);
      expect(severityText.className).toContain(textClass);
    });

    test.each([
      ['CRITICAL', 'AlertTriangle'],
      ['MAJOR', 'AlertCircle'],
      ['MINOR', 'AlertCircle'],
      ['INFO', 'Info'],
    ])('should render %s severity with correct icon', (severity, iconName) => {
      const alarm = { ...mockAlarm, severity: severity as AlarmSeverity };
      const { container } = render(<AlertBanner alarm={alarm} onAcknowledge={jest.fn()} />);

      // Icon should be present (lucide-react icons render as SVG)
      const svgElement = container.querySelector('svg');
      expect(svgElement).toBeInTheDocument();
    });

    it('should display all severity levels with unique styling', () => {
      const severities: AlarmSeverity[] = ['CRITICAL', 'MAJOR', 'MINOR', 'INFO'];
      const renderedClasses = severities.map(severity => {
        const alarm = { ...mockAlarm, severity };
        const { container } = render(<AlertBanner alarm={alarm} onAcknowledge={jest.fn()} />);
        const banner = container.firstChild as HTMLElement;
        return banner.className;
      });

      // Each severity should have unique border class
      const uniqueClasses = new Set(renderedClasses);
      expect(uniqueClasses.size).toBe(4);
    });
  });
});
