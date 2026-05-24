import { render, screen, fireEvent } from '@testing-library/react';
import { FdcTraceViewer } from '../FdcTraceViewer';

describe('FdcTraceViewer', () => {
  test('renders chamber dropdown with equipment options', () => {
    render(<FdcTraceViewer />);
    const select = screen.getByTestId('fdc-chamber-select');
    expect(select).toBeInTheDocument();
    const options = select.querySelectorAll('option');
    expect(options.length).toBeGreaterThan(1);
  });

  test('anomaly selector has 5 options (none + 4 types)', () => {
    render(<FdcTraceViewer />);
    const select = screen.getByTestId('fdc-anomaly-select');
    const options = select.querySelectorAll('option');
    expect(options).toHaveLength(5);
  });

  test('legend strip shows 6 params', () => {
    render(<FdcTraceViewer />);
    const chips = screen.getAllByTestId(/^fdc-legend-/);
    expect(chips).toHaveLength(6);
  });

  test('toggling param visibility updates visible set', () => {
    render(<FdcTraceViewer />);
    const chip = screen.getByTestId('fdc-legend-pressure');
    fireEvent.click(chip);
    expect(chip).toHaveAttribute('data-visible', 'false');
    fireEvent.click(chip);
    expect(chip).toHaveAttribute('data-visible', 'true');
  });
});
