import { render, screen } from '@testing-library/react';

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(), unobserve: jest.fn(), disconnect: jest.fn(),
}));

import { ThumbnailChart } from './ThumbnailChart';

const mockData = Array.from({ length: 10 }, (_, i) => ({ waferNumber: i + 1, value: 45 + Math.sin(i) }));

describe('ThumbnailChart', () => {
  it('renders the parameter label', () => {
    render(
      <ThumbnailChart label="CDU" unit="nm" data={mockData} ucl={2.9} lcl={1.1} isActive={false} />
    );
    expect(screen.getByText('CDU')).toBeInTheDocument();
  });

  it('shows ACTIVE badge when isActive is true', () => {
    render(
      <ThumbnailChart label="CDU" unit="nm" data={mockData} ucl={2.9} lcl={1.1} isActive={true} />
    );
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('renders the chart container', () => {
    const { container } = render(
      <ThumbnailChart label="CDU" unit="nm" data={mockData} ucl={2.9} lcl={1.1} isActive={false} />
    );
    // ResponsiveContainer renders in jsdom but recharts-wrapper requires a real DOM with layout
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });
});