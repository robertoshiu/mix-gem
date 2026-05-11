import { fireEvent, render, screen, within } from '@testing-library/react';
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

  it('renders scenario step cards for the full demo flow', () => {
    render(<SecsGemPage />);

    const scenarioSection = screen
      .getByRole('heading', { name: /Scenario Console/i })
      .closest('section') as HTMLElement;

    expect(within(scenarioSection).getAllByText('Establish communications').length).toBeGreaterThan(0);
    expect(within(scenarioSection).getAllByText('Collect SPC report').length).toBeGreaterThan(0);
    expect(within(scenarioSection).getAllByText('Inhibit on violation').length).toBeGreaterThan(0);
    expect(within(scenarioSection).getAllByText('Push corrected recipe').length).toBeGreaterThan(0);
  });

  it('renders feed packet cards in the dynamic feed', () => {
    render(<SecsGemPage />);

    const feedSection = screen
      .getByRole('heading', { name: /Dynamic Data Feed/i })
      .closest('section') as HTMLElement;

    expect(within(feedSection).getByText('S1F13')).toBeInTheDocument();
    expect(within(feedSection).getByText('S1F14')).toBeInTheDocument();
    expect(within(feedSection).getByText('S6F11')).toBeInTheDocument();
  });

  it('renders trace table rows for visible SECS messages', () => {
    render(<SecsGemPage />);

    const traceSection = screen
      .getByRole('heading', { name: /Live SECS Trace/i })
      .closest('section') as HTMLElement;
    const rows = within(traceSection).getAllByRole('row');

    expect(rows.length).toBeGreaterThan(1);
    expect(within(traceSection).getByRole('button', { name: /S1F13 Establish Communications Request/i })).toBeInTheDocument();
    expect(within(traceSection).getByRole('button', { name: /S6F11 Collection Event/i })).toBeInTheDocument();
  });

  it('keeps the recipe detail section mounted and conditionally renders the recipe card', () => {
    render(<SecsGemPage />);

    const recipeSection = screen
      .getByRole('heading', { name: /Recipe Detail/i })
      .closest('section') as HTMLElement;

    expect(recipeSection).toBeInTheDocument();
    expect(within(recipeSection).queryByText(/Recipe pushed/i)).not.toBeInTheDocument();

    const stepButton = screen.getByRole('button', { name: /step/i });
    fireEvent.click(stepButton);
    fireEvent.click(stepButton);
    fireEvent.click(stepButton);

    expect(within(recipeSection).getByText(/Recipe pushed/i)).toBeInTheDocument();
    expect(within(recipeSection).getByText('S2F49')).toBeInTheDocument();
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
