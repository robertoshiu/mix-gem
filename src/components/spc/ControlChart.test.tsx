import { render, screen } from '@testing-library/react';

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(), unobserve: jest.fn(), disconnect: jest.fn(),
}));

import { ControlChart } from './ControlChart';

const mockData = Array.from({ length: 10 }, (_, i) => ({
  waferNumber: i + 1, value: 45.0 + (Math.random() - 0.5), isViolation: false,
}));

const config = { target: 45, sigma: 1, ucl: 48, lcl: 42, unit: 'nm', label: 'Critical Dimension' };

describe('ControlChart', () => {
  it('renders the parameter label as heading', () => {
    render(<ControlChart paramLabel="CD (Critical Dimension)" config={config} data={mockData} />);
    expect(screen.getByText('CD (Critical Dimension)')).toBeInTheDocument();
  });

  it('shows UCL value', () => {
    render(<ControlChart paramLabel="CD" config={config} data={mockData} />);
    expect(screen.getByText(/48\.0/)).toBeInTheDocument();
  });

  it('shows LCL value', () => {
    render(<ControlChart paramLabel="CD" config={config} data={mockData} />);
    expect(screen.getByText(/42\.0/)).toBeInTheDocument();
  });

  it('renders chart wrapper', () => {
    const { container } = render(<ControlChart paramLabel="CD" config={config} data={mockData} />);
    // ResponsiveContainer renders in jsdom but recharts-wrapper requires a real DOM with layout
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });
});