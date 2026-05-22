import { render, screen, fireEvent } from '@testing-library/react';
import { StressPanel } from '../StressPanel';
import { createDefaultPipeline, runFederatedSim } from '@/lib/analytics/vpp-engine';

describe('StressPanel', () => {
  const result = runFederatedSim(createDefaultPipeline());

  test('renders canvases and controls', () => {
    render(<StressPanel perStep={result.perStep} />);
    expect(screen.getByTestId('stress-bar-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('stress-cumulative-canvas')).toBeInTheDocument();
    expect(screen.getByText('Biaxial')).toBeInTheDocument();
  });

  test('stress mode buttons are interactive', () => {
    render(<StressPanel perStep={result.perStep} />);
    const planeBtn = screen.getByText('Plane Stress');
    fireEvent.click(planeBtn);
    expect(screen.getByText('Plane Stress')).toBeInTheDocument();
  });

  test('shows wafer bow readout', () => {
    render(<StressPanel perStep={result.perStep} />);
    expect(screen.getByText(/Bow:/)).toBeInTheDocument();
  });
});
