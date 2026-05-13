import { render, screen, waitFor } from '@testing-library/react';
import Page from '@/app/page';

jest.mock('recharts', () => ({
  AreaChart: ({ children }: { children?: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  CartesianGrid: () => null,
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

describe('Fab Command Center Flow', () => {
  it('shows the fab-wide process command center', async () => {
    render(<Page />);

    expect(await screen.findByText('8-Process Fab Flow')).toBeInTheDocument();
    expect(screen.getByText('Process Pipeline')).toBeInTheDocument();
    expect(screen.getByText('Live Trend · Fab WPH Last 24h')).toBeInTheDocument();
  });

  it('updates live fab KPI state without crashing', async () => {
    jest.useFakeTimers();
    render(<Page />);

    await screen.findByText('Fab KPI Command Center');
    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByText('Fab OEE')).toBeInTheDocument();
    });
    jest.useRealTimers();
  });
});
