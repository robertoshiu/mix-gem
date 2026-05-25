import { fireEvent, render, screen, within } from '@testing-library/react';
import SecsGemPage from './page';

describe('SecsGemPage', () => {
  it('renders the simulator heading and all section panels', () => {
    render(<SecsGemPage />);

    expect(screen.getByRole('heading', { name: /SECS\/GEM Simulator/i })).toBeInTheDocument();
    expect(screen.getByText(/HSMS Session/i)).toBeInTheDocument();
    expect(screen.getByText(/Scenario Console/i)).toBeInTheDocument();
    expect(screen.getByText(/Live SECS Trace/i)).toBeInTheDocument();
    expect(screen.getByText(/Replay Controls/i)).toBeInTheDocument();
    expect(screen.getByText(/Dynamic Data Feed/i)).toBeInTheDocument();
  });

  it('renders scenario step cards from the first template', () => {
    render(<SecsGemPage />);

    const scenarioSection = screen
      .getByRole('heading', { name: /Scenario Console/i })
      .closest('section') as HTMLElement;

    expect(within(scenarioSection).getAllByText('Establish communications').length).toBeGreaterThan(0);
    expect(within(scenarioSection).getAllByText('Collect SPC report').length).toBeGreaterThan(0);
    expect(within(scenarioSection).getAllByText('Inhibit on violation').length).toBeGreaterThan(0);
    expect(within(scenarioSection).getAllByText('Push corrected recipe').length).toBeGreaterThan(0);
  });

  it('generates messages when step button is clicked', () => {
    render(<SecsGemPage />);

    // Initially no messages in buffer
    expect(screen.getByText(/0 packets generated/i)).toBeInTheDocument();

    // Click step to generate one tick
    fireEvent.click(screen.getByRole('button', { name: /step/i }));

    // Should now have generated messages
    expect(screen.queryByText(/0 packets generated/i)).not.toBeInTheDocument();
  });

  it('reset clears the message buffer', () => {
    render(<SecsGemPage />);

    // Generate some messages
    fireEvent.click(screen.getByRole('button', { name: /step/i }));
    fireEvent.click(screen.getByRole('button', { name: /step/i }));

    // Reset
    fireEvent.click(screen.getByRole('button', { name: /reset/i }));

    expect(screen.getByText(/0 packets generated/i)).toBeInTheDocument();
  });

  it('renders equipment list in the HSMS Session sidebar', () => {
    render(<SecsGemPage />);

    const sidebar = screen
      .getByText(/HSMS Session/i)
      .closest('aside') as HTMLElement;

    expect(within(sidebar).getAllByText('LITHO-01').length).toBeGreaterThan(0);
    expect(within(sidebar).getAllByText('COAT-01').length).toBeGreaterThan(0);
  });

  it('has recipe detail and alarm context sections', () => {
    render(<SecsGemPage />);

    expect(screen.getByRole('heading', { name: /Recipe Detail/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Alarm Context/i })).toBeInTheDocument();
  });
});
