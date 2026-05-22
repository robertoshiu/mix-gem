import { render, screen } from '@testing-library/react';
import { VppTab } from '../VppTab';

jest.mock('@/lib/analytics/vpp-engine', () => {
  const actual = jest.requireActual('@/lib/analytics/vpp-engine');
  return actual;
});

describe('VppTab', () => {
  test('renders KPI strip', () => {
    render(<VppTab />);
    expect(screen.getByText(/Active Sims/)).toBeInTheDocument();
    expect(screen.getByText(/Cumulative Yield/)).toBeInTheDocument();
  });

  test('renders pipeline steps section', () => {
    render(<VppTab />);
    expect(screen.getAllByText(/Pipeline Steps/).length).toBeGreaterThanOrEqual(1);
  });

  test('renders film stack accordion', () => {
    render(<VppTab />);
    expect(screen.getByText(/Film Stack/)).toBeInTheDocument();
  });

  test('renders all 5 accordion panels', () => {
    render(<VppTab />);
    expect(screen.getByText(/Film Stack/)).toBeInTheDocument();
    expect(screen.getByText(/Thermal Budget/)).toBeInTheDocument();
    expect(screen.getByText(/Stress/)).toBeInTheDocument();
    expect(screen.getByText(/Defect/)).toBeInTheDocument();
    expect(screen.getByText(/Dopant/)).toBeInTheDocument();
  });

  test('renders VPP charts', () => {
    render(<VppTab />);
    expect(screen.getByTestId('vpp-chart-waterfall')).toBeInTheDocument();
    expect(screen.getByTestId('vpp-chart-metric')).toBeInTheDocument();
  });
});
