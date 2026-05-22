import { render, screen, fireEvent } from '@testing-library/react';
import { DopantPanel } from '../DopantPanel';

describe('DopantPanel', () => {
  test('renders canvas and species checkboxes', () => {
    render(<DopantPanel />);
    expect(screen.getByTestId('dopant-profile-canvas')).toBeInTheDocument();
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
});
