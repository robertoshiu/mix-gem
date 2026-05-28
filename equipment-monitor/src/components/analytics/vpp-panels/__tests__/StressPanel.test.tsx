import { render, screen, fireEvent } from '@testing-library/react';

// recharts' ResponsiveContainer needs ResizeObserver, which jsdom lacks.
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

import { StressPanel } from '../StressPanel';
import { createDefaultPipeline, runFederatedSim } from '@/lib/analytics/vpp-engine';

jest.mock('@/hooks/use-client-ready', () => ({ useClientReady: () => true }));

describe('StressPanel', () => {
  const result = runFederatedSim(createDefaultPipeline());

  test('renders recharts charts (not canvas) and controls', () => {
    const { container } = render(<StressPanel perStep={result.perStep} />);
    expect(screen.getByTestId('stress-bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('stress-cumulative-chart')).toBeInTheDocument();
    expect(container.querySelector('canvas')).toBeNull();
    expect(screen.getByText('Biaxial')).toBeInTheDocument();
  });

  test('stress mode buttons are interactive', () => {
    render(<StressPanel perStep={result.perStep} />);
    const planeBtn = screen.getByText('Plane Stress');
    fireEvent.click(planeBtn);
    expect(screen.getByText('Plane Stress')).toBeInTheDocument();
  });

  test('shows wafer bow readout with real µm glyph', () => {
    const { container } = render(<StressPanel perStep={result.perStep} />);
    expect(screen.getByText(/Bow:/)).toBeInTheDocument();
    expect(container.textContent ?? '').toContain('µm');
    expect(container.textContent ?? '').not.toContain('\\u00B5');
  });

  test('moving a control fires onExplore (slider takeover hook)', () => {
    const onExplore = jest.fn();
    render(<StressPanel perStep={result.perStep} onExplore={onExplore} />);
    fireEvent.change(screen.getByLabelText('Process temperature'), { target: { value: '300' } });
    expect(onExplore).toHaveBeenCalled();
  });
});
