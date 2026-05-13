import { render, screen } from '@testing-library/react';
import Page from './page';

jest.mock('@/components/layout/header', () => ({ Header: () => <div data-testid="header" /> }));
jest.mock('@/components/mes/MesNavBar', () => ({ MesNavBar: () => <nav data-testid="mes-nav" /> }));
jest.mock('recharts', () => ({
  AreaChart: ({ children }: { children?: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  CartesianGrid: () => null,
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

describe('Fab KPI Command Center', () => {
  it('renders aggregate fab KPI gauges', () => {
    render(<Page />);

    expect(screen.getByText('Fab KPI Command Center')).toBeInTheDocument();
    expect(screen.getByText('Fab OEE')).toBeInTheDocument();
    expect(screen.getByText('Total WPH')).toBeInTheDocument();
    expect(screen.getByText('Fab Yield')).toBeInTheDocument();
    expect(screen.getByText('Cycle Time')).toBeInTheDocument();
  });

  it('renders all eight process cards', () => {
    render(<Page />);

    ['Oxidation', 'Lithography', 'Etching', 'Thin Film Deposition', 'Ion Implantation', 'Diffusion', 'CMP', 'Metallization'].forEach((name) => {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0);
    });
  });
});
