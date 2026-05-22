import { render, screen } from '@testing-library/react';
import { VppTab } from '../VppTab';

describe('VppTab', () => {
  test('renders KPI strip with Active Sims', () => {
    render(<VppTab />);
    expect(screen.getByText(/Active Sims/i)).toBeInTheDocument();
  });

  test('renders 8 pipeline step cards', () => {
    render(<VppTab />);
    expect(screen.getByText(/OX/)).toBeInTheDocument();
    expect(screen.getByText(/MET/)).toBeInTheDocument();
  });

  test('renders film stack section', () => {
    render(<VppTab />);
    expect(screen.getByText(/Film Stack/i)).toBeInTheDocument();
  });

  test('renders chart canvases', () => {
    render(<VppTab />);
    const canvases = screen.getAllByTestId(/vpp-chart/);
    expect(canvases.length).toBeGreaterThanOrEqual(2);
  });
});
