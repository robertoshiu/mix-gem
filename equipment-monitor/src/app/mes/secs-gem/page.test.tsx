import { fireEvent, render, screen } from '@testing-library/react';
import SecsGemPage from './page';

describe('SecsGemPage', () => {
  it('renders the simulator console, SECS trace, and replay state panels', () => {
    render(<SecsGemPage />);

    expect(screen.getByRole('heading', { name: /SECS\/GEM Simulator/i })).toBeInTheDocument();
    expect(screen.getByText(/HSMS Session/i)).toBeInTheDocument();
    expect(screen.getByText(/Scenario Console/i)).toBeInTheDocument();
    expect(screen.getByText(/Live SECS Trace/i)).toBeInTheDocument();
    expect(screen.getByText(/Replay State/i)).toBeInTheDocument();
    expect(screen.getByText(/Dynamic Data Feed/i)).toBeInTheDocument();
    expect(screen.getAllByText('S1F13').length).toBeGreaterThan(0);
    expect(screen.getAllByText('S6F11').length).toBeGreaterThan(0);
  });

  it('lets operators step and reset the frontend message feed', () => {
    render(<SecsGemPage />);

    expect(screen.getByText(/3\/7 packets ingested/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /step/i }));
    expect(screen.getByText(/4\/7 packets ingested/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(screen.getByText(/1\/7 packets ingested/i)).toBeInTheDocument();
  });
});
