import { render, screen, fireEvent } from '@testing-library/react';

// recharts' ResponsiveContainer needs ResizeObserver, which jsdom lacks.
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

import { DefectPanel } from '../DefectPanel';
import { createDefaultPipeline, runFederatedSim } from '@/lib/analytics/vpp-engine';

jest.mock('@/hooks/use-client-ready', () => ({ useClientReady: () => true }));

describe('DefectPanel', () => {
  const result = runFederatedSim(createDefaultPipeline());

  test('renders recharts charts (not canvas) and controls', () => {
    const { container } = render(<DefectPanel perStep={result.perStep} />);
    expect(screen.getByTestId('defect-bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('defect-wafer-chart')).toBeInTheDocument();
    expect(container.querySelector('canvas')).toBeNull();
  });

  test('sort buttons are interactive', () => {
    render(<DefectPanel perStep={result.perStep} />);
    fireEvent.click(screen.getByText('By Severity'));
    expect(screen.getByText('By Severity')).toBeInTheDocument();
  });

  test('shows total and killer D0 with real superscript/subscript glyphs', () => {
    const { container } = render(<DefectPanel perStep={result.perStep} />);
    expect(screen.getByText(/Total D/)).toBeInTheDocument();
    expect(screen.getByText(/Killer/)).toBeInTheDocument();
    const text = container.textContent ?? '';
    expect(text).toContain('²'); // /cm²
    expect(text).toContain('₀'); // D₀
    expect(text).not.toContain('\\u00B2');
    expect(text).not.toContain('\\u2080');
  });

  test('moving a control fires onExplore (slider takeover hook)', () => {
    const onExplore = jest.fn();
    render(<DefectPanel perStep={result.perStep} onExplore={onExplore} />);
    fireEvent.change(screen.getByLabelText('Defect density ceiling'), { target: { value: '2' } });
    expect(onExplore).toHaveBeenCalled();
  });
});
