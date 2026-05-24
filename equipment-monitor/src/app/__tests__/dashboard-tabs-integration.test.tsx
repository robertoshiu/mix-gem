import { render, screen, fireEvent } from '@testing-library/react';

// Mock recharts
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => <div />,
  CartesianGrid: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
}));

// Mock FacilityTab (it has complex store/canvas deps)
jest.mock('@/components/dashboard/FacilityTab', () => ({
  FacilityTab: () => <div data-testid="facility-tab-content">Facility Systems Content</div>,
}));

// Mock useClientReady
jest.mock('@/hooks/use-client-ready', () => ({
  useClientReady: () => true,
}));

import DashboardPage from '../page';

describe('Dashboard page with tabs', () => {
  test('renders Fab Flow tab by default', () => {
    render(<DashboardPage />);
    expect(screen.getByText(/8-Process Fab Flow/i)).toBeInTheDocument();
  });

  test('renders tab bar with both tabs', () => {
    render(<DashboardPage />);
    expect(screen.getByRole('tab', { name: /Fab Flow/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Facility Systems/i })).toBeInTheDocument();
  });

  test('switches to Facility Systems tab on click', () => {
    render(<DashboardPage />);
    fireEvent.click(screen.getByRole('tab', { name: /Facility Systems/i }));
    expect(screen.getByTestId('facility-tab-content')).toBeInTheDocument();
  });

  test('switches back to Fab Flow tab', () => {
    render(<DashboardPage />);
    fireEvent.click(screen.getByRole('tab', { name: /Facility Systems/i }));
    fireEvent.click(screen.getByRole('tab', { name: /Fab Flow/i }));
    expect(screen.getByText(/8-Process Fab Flow/i)).toBeInTheDocument();
  });
});
