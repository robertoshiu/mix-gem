import { act, render, screen } from '@testing-library/react';
import { KpiBox } from './KpiBox';

// matchMedia is read by prefersReducedMotion() inside the flash effect.
// Default to "motion allowed" so the flash path is exercised.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('KpiBox', () => {
  it('renders the label and value', () => {
    render(<KpiBox label="Line Yield" value="98.7%" />);

    expect(screen.getByText('Line Yield')).toBeInTheDocument();
    expect(screen.getByText('98.7%')).toBeInTheDocument();
  });

  it('renders the optional plain-language caption when provided', () => {
    render(
      <KpiBox
        label="EWMA λ"
        value="0.30"
        plain="How fast the controller reacts to drift"
      />,
    );

    expect(
      screen.getByText('How fast the controller reacts to drift'),
    ).toBeInTheDocument();
  });

  it('does not flash on the initial render', () => {
    render(<KpiBox label="OEE" value="82.1%" />);

    expect(screen.getByTestId('kpi-box')).toHaveAttribute(
      'data-flashing',
      'false',
    );
  });

  it('flashes briefly when the value changes between renders', () => {
    jest.useFakeTimers();
    try {
      const { rerender } = render(<KpiBox label="OEE" value="82.1%" />);

      // Initial render: not flashing.
      expect(screen.getByTestId('kpi-box')).toHaveAttribute(
        'data-flashing',
        'false',
      );

      // Value changes -> flash turns on.
      rerender(<KpiBox label="OEE" value="83.4%" />);
      expect(screen.getByTestId('kpi-box')).toHaveAttribute(
        'data-flashing',
        'true',
      );
      expect(screen.getByText('83.4%')).toBeInTheDocument();

      // Flash auto-clears after the highlight window.
      act(() => {
        jest.advanceTimersByTime(700);
      });
      expect(screen.getByTestId('kpi-box')).toHaveAttribute(
        'data-flashing',
        'false',
      );
    } finally {
      jest.useRealTimers();
    }
  });

  it('does not flash on value change when reduced motion is preferred', () => {
    (window.matchMedia as jest.Mock).mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    const { rerender } = render(<KpiBox label="Risk" value="12" />);
    rerender(<KpiBox label="Risk" value="17" />);

    expect(screen.getByTestId('kpi-box')).toHaveAttribute(
      'data-flashing',
      'false',
    );
    expect(screen.getByText('17')).toBeInTheDocument();
  });
});
