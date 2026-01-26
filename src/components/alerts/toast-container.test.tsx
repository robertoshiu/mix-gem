import { render, screen } from '@testing-library/react';
import { ToastContainer } from './toast-container';
import { useEquipmentStore } from '@/stores/equipment-store';
import type { Alarm } from '@/types/equipment';

// Mock the store
jest.mock('@/stores/equipment-store');

describe('ToastContainer', () => {
  const mockUseEquipmentStore = useEquipmentStore as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should render no toasts when there are no alarms', () => {
    mockUseEquipmentStore.mockReturnValue({
      alarms: [],
      acknowledgeAlarm: jest.fn(),
    });

    const { container } = render(<ToastContainer />);
    const toastContainer = container.firstChild as HTMLElement;
    expect(toastContainer).toBeInTheDocument();
    expect(toastContainer.children).toHaveLength(0);
  });

  it('should render toast for unacknowledged alarm from last 30 seconds', () => {
    const now = new Date('2026-01-26T10:00:00');
    jest.setSystemTime(now);

    const recentAlarm: Alarm = {
      id: 'alarm-1',
      alarmId: 1001,
      alarmCode: 'TEMP_HIGH',
      equipmentId: 'EQP-001',
      severity: 'CRITICAL',
      message: 'Temperature exceeded limit',
      timestamp: new Date('2026-01-26T09:59:45'), // 15 seconds ago
      acknowledged: false,
    };

    mockUseEquipmentStore.mockReturnValue({
      alarms: [recentAlarm],
      acknowledgeAlarm: jest.fn(),
    });

    render(<ToastContainer />);
    expect(screen.getByText('Temperature exceeded limit')).toBeInTheDocument();
    expect(screen.getByText('EQP-001')).toBeInTheDocument();
  });

  it('should not render toast for acknowledged alarm', () => {
    const now = new Date('2026-01-26T10:00:00');
    jest.setSystemTime(now);

    const acknowledgedAlarm: Alarm = {
      id: 'alarm-1',
      alarmId: 1001,
      alarmCode: 'TEMP_HIGH',
      equipmentId: 'EQP-001',
      severity: 'CRITICAL',
      message: 'Temperature exceeded limit',
      timestamp: new Date('2026-01-26T09:59:45'),
      acknowledged: true,
    };

    mockUseEquipmentStore.mockReturnValue({
      alarms: [acknowledgedAlarm],
      acknowledgeAlarm: jest.fn(),
    });

    render(<ToastContainer />);
    expect(screen.queryByText('Temperature exceeded limit')).not.toBeInTheDocument();
  });

  it('should not render toast for alarm older than 30 seconds', () => {
    const now = new Date('2026-01-26T10:00:00');
    jest.setSystemTime(now);

    const oldAlarm: Alarm = {
      id: 'alarm-1',
      alarmId: 1001,
      alarmCode: 'TEMP_HIGH',
      equipmentId: 'EQP-001',
      severity: 'CRITICAL',
      message: 'Temperature exceeded limit',
      timestamp: new Date('2026-01-26T09:59:29'), // 31 seconds ago
      acknowledged: false,
    };

    mockUseEquipmentStore.mockReturnValue({
      alarms: [oldAlarm],
      acknowledgeAlarm: jest.fn(),
    });

    render(<ToastContainer />);
    expect(screen.queryByText('Temperature exceeded limit')).not.toBeInTheDocument();
  });

  it('should render multiple unacknowledged alarms', () => {
    const now = new Date('2026-01-26T10:00:00');
    jest.setSystemTime(now);

    const alarm1: Alarm = {
      id: 'alarm-1',
      alarmId: 1001,
      alarmCode: 'TEMP_HIGH',
      equipmentId: 'EQP-001',
      severity: 'CRITICAL',
      message: 'Temperature exceeded limit',
      timestamp: new Date('2026-01-26T09:59:45'),
      acknowledged: false,
    };

    const alarm2: Alarm = {
      id: 'alarm-2',
      alarmId: 1002,
      alarmCode: 'PRESS_LOW',
      equipmentId: 'EQP-002',
      severity: 'MAJOR',
      message: 'Pressure below threshold',
      timestamp: new Date('2026-01-26T09:59:50'),
      acknowledged: false,
    };

    mockUseEquipmentStore.mockReturnValue({
      alarms: [alarm1, alarm2],
      acknowledgeAlarm: jest.fn(),
    });

    render(<ToastContainer />);
    expect(screen.getByText('Temperature exceeded limit')).toBeInTheDocument();
    expect(screen.getByText('Pressure below threshold')).toBeInTheDocument();
  });

  it('should have correct accessibility attributes', () => {
    mockUseEquipmentStore.mockReturnValue({
      alarms: [],
      acknowledgeAlarm: jest.fn(),
    });

    const { container } = render(<ToastContainer />);
    const toastContainer = container.firstChild as HTMLElement;
    expect(toastContainer).toHaveAttribute('aria-live', 'polite');
    expect(toastContainer).toHaveAttribute('aria-atomic', 'false');
  });

  it('should be positioned fixed top-right', () => {
    mockUseEquipmentStore.mockReturnValue({
      alarms: [],
      acknowledgeAlarm: jest.fn(),
    });

    const { container } = render(<ToastContainer />);
    const toastContainer = container.firstChild as HTMLElement;
    expect(toastContainer).toHaveClass('fixed');
    expect(toastContainer).toHaveClass('top-20');
    expect(toastContainer).toHaveClass('right-4');
    expect(toastContainer).toHaveClass('z-50');
    expect(toastContainer).toHaveClass('w-96');
  });

  it('should acknowledge alarm when toast is dismissed', () => {
    const now = new Date('2026-01-26T10:00:00');
    jest.setSystemTime(now);

    const alarm: Alarm = {
      id: 'alarm-1',
      alarmId: 1001,
      alarmCode: 'TEMP_HIGH',
      equipmentId: 'EQP-001',
      severity: 'CRITICAL',
      message: 'Temperature exceeded limit',
      timestamp: new Date('2026-01-26T09:59:45'),
      acknowledged: false,
    };

    const mockAcknowledge = jest.fn();
    mockUseEquipmentStore.mockReturnValue({
      alarms: [alarm],
      acknowledgeAlarm: mockAcknowledge,
    });

    render(<ToastContainer />);

    // Wait for auto-dismiss (5 seconds)
    jest.advanceTimersByTime(5000);

    expect(mockAcknowledge).toHaveBeenCalledWith('alarm-1');
  });
});
