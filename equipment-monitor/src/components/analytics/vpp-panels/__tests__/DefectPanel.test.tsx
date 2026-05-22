import { render, screen, fireEvent } from '@testing-library/react';
import { DefectPanel } from '../DefectPanel';
import { createDefaultPipeline, runFederatedSim } from '@/lib/analytics/vpp-engine';

describe('DefectPanel', () => {
  const result = runFederatedSim(createDefaultPipeline());

  test('renders canvases and controls', () => {
    render(<DefectPanel perStep={result.perStep} />);
    expect(screen.getByTestId('defect-bar-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('defect-wafer-canvas')).toBeInTheDocument();
  });

  test('sort buttons are interactive', () => {
    render(<DefectPanel perStep={result.perStep} />);
    fireEvent.click(screen.getByText('By Severity'));
    expect(screen.getByText('By Severity')).toBeInTheDocument();
  });

  test('shows total and killer D0', () => {
    render(<DefectPanel perStep={result.perStep} />);
    expect(screen.getByText(/Total D/)).toBeInTheDocument();
    expect(screen.getByText(/Killer/)).toBeInTheDocument();
  });
});
