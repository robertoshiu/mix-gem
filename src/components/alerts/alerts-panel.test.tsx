import { render, screen, fireEvent } from '@testing-library/react';
import { AlertsPanel } from './alerts-panel';
import type { Alarm } from '@/types/equipment';

describe('AlertsPanel', () => {
  const mockAlarms: Alarm[] = [
    {
      id: 'alarm-1',
      alarmId: 1001,
      alarmCode: 'P1',
      equipmentId: 'ETCH-001',
      severity: 'CRITICAL',
      message: 'Chamber pressure critical',
      timestamp: new Date('2024-01-15T10:00:00'),
      acknowledged: false,
    },
    {
      id: 'alarm-2',
      alarmId: 1002,
      alarmCode: 'T1',
      equipmentId: 'ETCH-001',
      severity: 'MAJOR',
      message: 'Temperature exceeds limit',
      timestamp: new Date('2024-01-15T10:05:00'),
      acknowledged: false,
    },
    {
      id: 'alarm-3',
      alarmId: 2001,
      alarmCode: 'F1',
      equipmentId: 'CVD-002',
      severity: 'MINOR',
      message: 'Flow rate warning',
      timestamp: new Date('2024-01-15T10:10:00'),
      acknowledged: false,
    },
    {
      id: 'alarm-4',
      alarmId: 3001,
      alarmCode: 'V1',
      equipmentId: 'PVD-003',
      severity: 'INFO',
      message: 'Vent valve open',
      timestamp: new Date('2024-01-15T10:15:00'),
      acknowledged: true,
    },
  ];

  const defaultProps = {
    alarms: mockAlarms,
    onAcknowledge: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all alarms grouped by equipment', () => {
      render(<AlertsPanel {...defaultProps} />);

      expect(screen.getAllByText('ETCH-001').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Chamber pressure critical/)).toBeInTheDocument();
      expect(screen.getByText(/Temperature exceeds limit/)).toBeInTheDocument();
    });

    it('should show alert count in header (acknowledged hidden by default)', () => {
      render(<AlertsPanel {...defaultProps} />);

      // Count is 3 because one is acknowledged and hidden by default
      expect(screen.getByText('3 alerts', { exact: true })).toBeInTheDocument();
    });

    it('should show critical badge when critical alarms exist', () => {
      render(<AlertsPanel {...defaultProps} />);

      expect(screen.getByText(/1 Critical/)).toBeInTheDocument();
    });

    it('should render alert messages for each alarm', () => {
      render(<AlertsPanel {...defaultProps} />);

      expect(screen.getByText(/Chamber pressure critical/)).toBeInTheDocument();
      expect(screen.getByText(/Temperature exceeds limit/)).toBeInTheDocument();
      expect(screen.getByText(/Flow rate warning/)).toBeInTheDocument();
    });
  });

  describe('Filtering by severity', () => {
    it('should filter out non-CRITICAL alarms when only CRITICAL selected', async () => {
      render(<AlertsPanel {...defaultProps} />);

      // First click "None" to clear all
      const noneButton = screen.getByRole('button', { name: /Clear all severities/ });
      fireEvent.click(noneButton);

      // Now select only CRITICAL
      const criticalButton = screen.getByRole('checkbox', { name: /Critical severity/ });
      fireEvent.click(criticalButton);

      expect(screen.queryByText(/Temperature exceeds limit/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Flow rate warning/)).not.toBeInTheDocument();
      expect(screen.getByText(/Chamber pressure critical/)).toBeInTheDocument();
    });

    it('should show multiple severity levels when selected', async () => {
      render(<AlertsPanel {...defaultProps} />);

      // First click "None" to clear all
      const noneButton = screen.getByRole('button', { name: /Clear all severities/ });
      fireEvent.click(noneButton);

      // Select CRITICAL and MAJOR
      const criticalButton = screen.getByRole('checkbox', { name: /Critical severity/ });
      const majorButton = screen.getByRole('checkbox', { name: /Major severity/ });
      fireEvent.click(criticalButton);
      fireEvent.click(majorButton);

      expect(screen.getByText(/Chamber pressure critical/)).toBeInTheDocument();
      expect(screen.getByText(/Temperature exceeds limit/)).toBeInTheDocument();
      expect(screen.queryByText(/Flow rate warning/)).not.toBeInTheDocument();
    });

    it('should show empty state when no severities selected', async () => {
      render(<AlertsPanel {...defaultProps} />);

      // Click "None" to clear all
      const noneButton = screen.getByRole('button', { name: /Clear all severities/ });
      fireEvent.click(noneButton);

      expect(screen.getByText(/No alerts match your filters/)).toBeInTheDocument();
    });
  });

  describe('Searching by message', () => {
    it('should filter alarms by message content', async () => {
      render(<AlertsPanel {...defaultProps} />);

      const searchInput = screen.getByLabelText(/Search alerts by message or equipment/);
      fireEvent.change(searchInput, { target: { value: 'pressure' } });

      expect(screen.getByText(/Chamber pressure critical/)).toBeInTheDocument();
      expect(screen.queryByText(/Temperature exceeds limit/)).not.toBeInTheDocument();
    });

    it('should filter alarms by equipment ID', async () => {
      render(<AlertsPanel {...defaultProps} />);

      const searchInput = screen.getByLabelText(/Search alerts by message or equipment/);
      fireEvent.change(searchInput, { target: { value: 'ETCH' } });

      expect(screen.getAllByText(/ETCH-001/).length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText(/CVD-002/)).not.toBeInTheDocument();
      expect(screen.queryByText(/PVD-003/)).not.toBeInTheDocument();
    });

    it('should be case insensitive', async () => {
      render(<AlertsPanel {...defaultProps} />);

      const searchInput = screen.getByLabelText(/Search alerts by message or equipment/);
      fireEvent.change(searchInput, { target: { value: 'PRESSURE' } });

      expect(screen.getByText(/Chamber pressure critical/)).toBeInTheDocument();
    });

    it('should show clear button when search has value', async () => {
      render(<AlertsPanel {...defaultProps} />);

      const searchInput = screen.getByLabelText(/Search alerts by message or equipment/);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      expect(screen.getByLabelText(/Clear search/)).toBeInTheDocument();
    });

    it('should clear search when clear button clicked', async () => {
      render(<AlertsPanel {...defaultProps} />);

      const searchInput = screen.getByLabelText(/Search alerts by message or equipment/);
      fireEvent.change(searchInput, { target: { value: 'pressure' } });

      const clearButton = screen.getByLabelText(/Clear search/);
      fireEvent.click(clearButton);

      expect(screen.getByText(/Chamber pressure critical/)).toBeInTheDocument();
      expect(screen.getByText(/Temperature exceeds limit/)).toBeInTheDocument();
    });
  });

  describe('Grouping by equipment', () => {
    it('should group alarms under their equipment ID', () => {
      render(<AlertsPanel {...defaultProps} />);

      // ETCH-001 has 2 alarms
      const etchGroup = screen.getByRole('list', { name: /Alerts for ETCH-001/ });
      expect(etchGroup).toBeInTheDocument();

      // CVD-002 has 1 alarm
      expect(screen.getByRole('list', { name: /Alerts for CVD-002/ })).toBeInTheDocument();

      // PVD-003 has 1 alarm but it's acknowledged and hidden by default
      expect(screen.queryByRole('list', { name: /Alerts for PVD-003/ })).not.toBeInTheDocument();
    });

    it('should show equipment group with alarm count', () => {
      render(<AlertsPanel {...defaultProps} />);

      // Check for equipment ID text (count is in separate element; ETCH-001 appears in group header + each alert row)
      expect(screen.getAllByText('ETCH-001').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('CVD-002').length).toBeGreaterThanOrEqual(1);
    });

    it('should show only alarms for filtered equipment', async () => {
      render(<AlertsPanel {...defaultProps} />);

      const searchInput = screen.getByLabelText(/Search alerts by message or equipment/);
      fireEvent.change(searchInput, { target: { value: 'ETCH-001' } });

      expect(screen.getAllByText('ETCH-001').length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText(/CVD-002/)).not.toBeInTheDocument();
    });
  });

  describe('Acknowledged filter', () => {
    it('should hide acknowledged alarms by default', () => {
      render(<AlertsPanel {...defaultProps} />);

      // PVD-003 alarm is acknowledged, should not be visible
      expect(screen.queryByText(/Vent valve open/)).not.toBeInTheDocument();
      expect(screen.queryByText(/PVD-003/)).not.toBeInTheDocument();
    });

    it('should show acknowledged alarms when checkbox checked', async () => {
      render(<AlertsPanel {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox', { name: /Show acknowledged/ });
      fireEvent.click(checkbox);

      expect(screen.getByText(/Vent valve open/)).toBeInTheDocument();
      expect(screen.getAllByText(/PVD-003/).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<AlertsPanel {...defaultProps} />);

      expect(screen.getByRole('list', { name: /Alerts list/ })).toBeInTheDocument();
    });

    it('should have searchable input with label', () => {
      render(<AlertsPanel {...defaultProps} />);

      const searchInput = screen.getByLabelText(/Search alerts by message or equipment/);
      expect(searchInput).toBeInTheDocument();
    });

    it('severity buttons should be checkboxes', () => {
      render(<AlertsPanel {...defaultProps} />);

      const criticalButton = screen.getByRole('checkbox', { name: /Critical severity/ });
      expect(criticalButton).toBeInTheDocument();
    });
  });

  describe('onAcknowledge callback', () => {
    it('should call onAcknowledge when Ack button clicked', () => {
      const onAcknowledge = jest.fn();
      render(<AlertsPanel {...defaultProps} onAcknowledge={onAcknowledge} />);

      // Get the first Ack button (for the first alarm)
      const ackButtons = screen.getAllByRole('button', { name: 'Ack' });
      fireEvent.click(ackButtons[0]);

      expect(onAcknowledge).toHaveBeenCalledWith('alarm-1');
    });

    it('should show "Done" for acknowledged alarms when show acknowledged is checked', () => {
      const acknowledgedAlarms = [
        {
          id: 'alarm-4',
          alarmId: 3001,
          alarmCode: 'V1',
          equipmentId: 'PVD-003',
          severity: 'INFO',
          message: 'Vent valve open',
          timestamp: new Date('2024-01-15T10:15:00'),
          acknowledged: true,
        },
      ];

      render(<AlertsPanel alarms={acknowledgedAlarms} onAcknowledge={jest.fn()} />);

      // First show acknowledged
      const checkbox = screen.getByRole('checkbox', { name: /Show acknowledged/ });
      fireEvent.click(checkbox);

      expect(screen.getByRole('button', { name: /Done/ })).toBeInTheDocument();
    });
  });
});
