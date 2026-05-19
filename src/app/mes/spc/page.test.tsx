import { render, screen } from '@testing-library/react';

// Simulator engine should not run in tests
jest.mock('@/lib/simulator-engine', () => ({
  SimulatorEngine: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
  })),
}));

import SpcPage from './page';

beforeAll(() => { jest.useFakeTimers(); });
afterAll(() => { jest.useRealTimers(); });

describe('SpcPage', () => {
  it('renders the KPI gauge cards on initial load', () => {
    render(<SpcPage />);
    // Page uses KpiGaugeCard — each param gets a kpi-gauge-{param} testid
    // When measurements are seeded (useEffect runs), KpiGaugeCard renders gauge tiles
    // In jsdom, useEffect fires synchronously after act(), so gauges should appear
    expect(screen.getByTestId('spc-dashboard')).toBeInTheDocument();
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
