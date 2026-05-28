import { render, screen, fireEvent } from '@testing-library/react';

// recharts' ResponsiveContainer needs ResizeObserver, which jsdom lacks.
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

import { DopantPanel } from '../DopantPanel';

jest.mock('@/hooks/use-client-ready', () => ({ useClientReady: () => true }));

describe('DopantPanel', () => {
  test('renders a recharts chart (not canvas) and species checkboxes', () => {
    const { container } = render(<DopantPanel />);
    expect(screen.getByTestId('dopant-profile-chart')).toBeInTheDocument();
    expect(container.querySelector('canvas')).toBeNull();
    expect(screen.getByLabelText('B')).toBeInTheDocument();
    expect(screen.getByLabelText('P')).toBeInTheDocument();
  });

  test('scale toggle switches between Log and Linear', () => {
    render(<DopantPanel />);
    fireEvent.click(screen.getByText('Linear'));
    expect(screen.getByText('Linear')).toBeInTheDocument();
  });

  test('shows junction depth readout', () => {
    render(<DopantPanel />);
    const xjElements = screen.getAllByText(/Xj/);
    expect(xjElements.length).toBeGreaterThan(0);
  });

  test('moving a control fires onExplore (slider takeover hook)', () => {
    const onExplore = jest.fn();
    render(<DopantPanel onExplore={onExplore} />);
    fireEvent.change(screen.getByLabelText('Maximum depth'), { target: { value: '800' } });
    expect(onExplore).toHaveBeenCalled();
  });
});
