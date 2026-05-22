import { render, screen } from '@testing-library/react';
import { ReplicationTab } from '../ReplicationTab';
import { useAnalyticsStore, INITIAL_ANALYTICS_STATE } from '@/stores/analytics-store';

describe('ReplicationTab', () => {
  beforeEach(() => {
    useAnalyticsStore.setState(INITIAL_ANALYTICS_STATE);
  });

  test('renders KPI strip with Fab Count', () => {
    render(<ReplicationTab />);
    expect(screen.getByText(/Fab Count/i)).toBeInTheDocument();
  });

  test('renders 3 fab cards', () => {
    render(<ReplicationTab />);
    expect(screen.getByText('HQ Fab')).toBeInTheDocument();
    expect(screen.getByText('Satellite Fab')).toBeInTheDocument();
    expect(screen.getByText('New-Build Fab')).toBeInTheDocument();
  });

  test('renders parameter selector', () => {
    render(<ReplicationTab />);
    expect(screen.getByLabelText(/Parameter/i)).toBeInTheDocument();
  });

  test('renders chart canvases', () => {
    render(<ReplicationTab />);
    const canvases = screen.getAllByTestId(/replication-chart/);
    expect(canvases.length).toBeGreaterThanOrEqual(3);
  });
});
