import { render, screen } from '@testing-library/react';

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(), unobserve: jest.fn(), disconnect: jest.fn(),
}));

// Simulator engine should not run in tests
jest.mock('@/lib/simulator-engine', () => ({
  SimulatorEngine: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
  })),
}));

import SpcPage from './page';

describe('SpcPage', () => {
  it('renders the KPI strip skeleton on initial load', () => {
    render(<SpcPage />);
    // Page starts with no measurements — skeleton should show
    expect(screen.getByTestId('kpi-strip-skeleton')).toBeInTheDocument();
  });

  it('renders FaultInjector section', () => {
    render(<SpcPage />);
    expect(screen.getByText(/Fault Injection/i)).toBeInTheDocument();
  });

  it('renders EventLog section', () => {
    render(<SpcPage />);
    expect(screen.getByText(/Event Log/i)).toBeInTheDocument();
  });
});
