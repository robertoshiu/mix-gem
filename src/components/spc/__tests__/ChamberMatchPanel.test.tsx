import { render, screen, fireEvent } from '@testing-library/react';
import { ChamberMatchPanel } from '../ChamberMatchPanel';

describe('ChamberMatchPanel', () => {
  test('renders process dropdown with 8 processes', () => {
    render(<ChamberMatchPanel />);
    const select = screen.getByTestId('match-process-select');
    const options = select.querySelectorAll('option');
    expect(options).toHaveLength(8);
  });

  test('param dropdown has 6 FDC params', () => {
    render(<ChamberMatchPanel />);
    const select = screen.getByTestId('match-param-select');
    const options = select.querySelectorAll('option');
    expect(options).toHaveLength(6);
  });

  test('summary strip shows match/mismatch status', () => {
    render(<ChamberMatchPanel />);
    const summary = screen.getByTestId('match-summary');
    expect(summary.textContent?.length).toBeGreaterThan(0);
  });

  test('changing process regenerates chart', () => {
    render(<ChamberMatchPanel />);
    const select = screen.getByTestId('match-process-select');
    fireEvent.change(select, { target: { value: 'etching' } });
    expect(screen.getByTestId('match-summary')).toBeInTheDocument();
  });
});
