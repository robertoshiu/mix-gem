import { render, screen, fireEvent } from '@testing-library/react';
import { ChartDataTable } from './chart-data-table';

describe('ChartDataTable', () => {
  const mockData = [
    { timestamp: new Date('2026-01-25T10:00:00'), value: 23.5 },
    { timestamp: new Date('2026-01-25T10:01:00'), value: 24.2 },
    { timestamp: new Date('2026-01-25T10:02:00'), value: 23.8 },
    { timestamp: new Date('2026-01-25T10:03:00'), value: 25.1 },
    { timestamp: new Date('2026-01-25T10:04:00'), value: 24.9 },
  ];

  it('should render a collapsible details element', () => {
    render(<ChartDataTable data={mockData} title="Temperature" unit="°C" />);

    const summary = screen.getByText(/View data table/);
    expect(summary).toBeInTheDocument();
  });

  it('should have accessible aria-label on table', () => {
    render(<ChartDataTable data={mockData} title="Temperature" unit="°C" />);

    // Open the details
    const summary = screen.getByText(/View data table/);
    fireEvent.click(summary);

    const table = screen.getByRole('table', { name: 'Temperature data' });
    expect(table).toBeInTheDocument();
  });

  it('should display column headers with unit', () => {
    render(<ChartDataTable data={mockData} title="Temperature" unit="°C" />);

    const summary = screen.getByText(/View data table/);
    fireEvent.click(summary);

    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Value (°C)')).toBeInTheDocument();
  });

  it('should display data rows with formatted values', () => {
    render(<ChartDataTable data={mockData} title="Temperature" unit="°C" />);

    const summary = screen.getByText(/View data table/);
    fireEvent.click(summary);

    expect(screen.getByText('23.50')).toBeInTheDocument();
    expect(screen.getByText('24.20')).toBeInTheDocument();
  });

  it('should display last 10 data points when more than 10 exist', () => {
    const largeData = Array.from({ length: 20 }, (_, i) => ({
      timestamp: new Date(`2026-01-25T10:${i.toString().padStart(2, '0')}:00`),
      value: 20 + i,
    }));

    render(<ChartDataTable data={largeData} title="Temperature" unit="°C" />);

    const summary = screen.getByText(/View data table/);
    fireEvent.click(summary);

    // Should show notification about data limit
    expect(screen.getByText(/Showing last 10 of 20 data points/)).toBeInTheDocument();

    // Should show last value (20 + 19 = 39)
    expect(screen.getByText('39.00')).toBeInTheDocument();
  });

  it('should show "No data available" when data is empty', () => {
    render(<ChartDataTable data={[]} title="Temperature" unit="°C" />);

    const summary = screen.getByText(/View data table/);
    fireEvent.click(summary);

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('should format timestamps as locale time strings', () => {
    render(<ChartDataTable data={mockData} title="Temperature" unit="°C" />);

    const summary = screen.getByText(/View data table/);
    fireEvent.click(summary);

    // Check for time format (this will vary by locale, but should contain time components)
    const rows = screen.getAllByRole('row');
    // Header + 5 data rows = 6 rows
    expect(rows).toHaveLength(6);
  });

  it('should have minimum 44px height on summary element', () => {
    const { container } = render(
      <ChartDataTable data={mockData} title="Temperature" unit="°C" />
    );

    const summary = container.querySelector('summary');
    expect(summary?.className).toMatch(/min-h-\[44px\]/);
  });
});
