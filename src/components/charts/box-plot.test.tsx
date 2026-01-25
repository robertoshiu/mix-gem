import { render, screen } from '@testing-library/react';
import { BoxPlot } from './box-plot';

describe('BoxPlot', () => {
  const mockData = [
    { parameter: 'Temperature', min: 18, q1: 20, median: 22, q3: 24, max: 26, outliers: [16, 28] },
    { parameter: 'Pressure', min: 95, q1: 98, median: 100, q3: 102, max: 105, outliers: [] },
  ];

  it('should render parameter names', () => {
    render(<BoxPlot data={mockData} />);
    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('Pressure')).toBeInTheDocument();
  });

  it('should show outliers when present', () => {
    const { container } = render(<BoxPlot data={mockData} />);
    const outliers = container.querySelectorAll('[data-testid="outlier"]');
    expect(outliers.length).toBe(2); // Temperature has 2 outliers
  });
});
