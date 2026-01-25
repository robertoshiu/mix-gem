import { render, screen, waitFor } from '@testing-library/react';
import { AlertToast } from './alert-toast';

describe('AlertToast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should render alarm message', () => {
    render(
      <AlertToast
        id="test-1"
        severity="CRITICAL"
        message="Chamber temperature exceeded USL"
        equipmentId="ETCH-001"
        onDismiss={jest.fn()}
      />
    );
    expect(screen.getByText(/Chamber temperature exceeded USL/)).toBeInTheDocument();
  });

  it('should auto-dismiss after 5 seconds', async () => {
    const onDismiss = jest.fn();
    render(
      <AlertToast
        id="test-2"
        severity="MINOR"
        message="Low pressure warning"
        equipmentId="ETCH-001"
        onDismiss={onDismiss}
      />
    );

    jest.advanceTimersByTime(5000);
    await waitFor(() => expect(onDismiss).toHaveBeenCalledWith('test-2'));
  });

  it('should show correct color for CRITICAL severity', () => {
    const { container } = render(
      <AlertToast
        id="test-3"
        severity="CRITICAL"
        message="Critical alarm"
        equipmentId="ETCH-001"
        onDismiss={jest.fn()}
      />
    );
    const toast = container.querySelector('[data-severity="CRITICAL"]');
    expect(toast?.className).toMatch(/border-red-500/);
  });
});
