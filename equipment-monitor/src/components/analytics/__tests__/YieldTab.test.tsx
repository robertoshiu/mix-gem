import { render, screen } from '@testing-library/react';
import { YieldTab } from '../YieldTab';

describe('YieldTab', () => {
  test('renders KPI strip with Line Yield', () => {
    render(<YieldTab />);
    expect(screen.getByText(/Line Yield/i)).toBeInTheDocument();
  });

  test('renders die area slider', () => {
    render(<YieldTab />);
    expect(screen.getByLabelText(/Die Area/i)).toBeInTheDocument();
  });

  test('renders D0 sliders for process steps', () => {
    render(<YieldTab />);
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBeGreaterThanOrEqual(8);
  });

  test('renders scenario preset buttons', () => {
    render(<YieldTab />);
    expect(screen.getByRole('button', { name: /Baseline/i })).toBeInTheDocument();
  });

  test('renders 3 chart canvases', () => {
    render(<YieldTab />);
    const canvases = screen.getAllByTestId(/yield-chart/);
    expect(canvases.length).toBeGreaterThanOrEqual(3);
  });
});
