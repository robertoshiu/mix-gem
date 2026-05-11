import { render, screen } from '@testing-library/react';
import SecsGemPage from './page';

describe('SecsGemPage', () => {
  it('renders the simulator console, SECS trace, and replay state panels', () => {
    render(<SecsGemPage />);

    expect(screen.getByRole('heading', { name: /SECS\/GEM Simulator/i })).toBeInTheDocument();
    expect(screen.getByText(/HSMS Session/i)).toBeInTheDocument();
    expect(screen.getByText(/Scenario Console/i)).toBeInTheDocument();
    expect(screen.getByText(/Live SECS Trace/i)).toBeInTheDocument();
    expect(screen.getByText(/Replay State/i)).toBeInTheDocument();
    expect(screen.getByText('S1F13')).toBeInTheDocument();
    expect(screen.getByText('S6F11')).toBeInTheDocument();
  });
});
