import { render, screen } from '@testing-library/react';
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

describe('Process Alarm Visibility', () => {
  it('surfaces process alarm counts on cards', async () => {
    render(<Page />);

    expect(await screen.findByText('Ion Implantation')).toBeInTheDocument();
    expect(screen.getAllByText('Alarms').length).toBeGreaterThan(0);
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
  });

  it('marks the implant process as the bottleneck', async () => {
    render(<Page />);

    expect(await screen.findByText('Ion Implantation')).toBeInTheDocument();
    expect(screen.getByText('BOTTLENECK')).toBeInTheDocument();
  });
});
