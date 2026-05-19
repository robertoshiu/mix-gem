import { fireEvent, render, screen } from '@testing-library/react';
import { PayloadViewer } from './PayloadViewer';

const payload = {
  stream: 1,
  function: 13,
  mdln: 'MIX-GEM-DEMO',
  nested: { commack: 0 },
  reports: [
    { parameter: 'cd', value: 49.1 },
    { parameter: 'cdu', value: 3.8 },
  ],
};

describe('PayloadViewer', () => {
  it('toggles payload content between collapsed and expanded states', () => {
    render(<PayloadViewer payload={payload} />);

    const toggle = screen.getByRole('button', { name: /Payload/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('mdln')).not.toBeInTheDocument();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('mdln')).toBeInTheDocument();
    expect(screen.getByText('MIX-GEM-DEMO')).toBeInTheDocument();
  });

  it('formats payload keys, primitive values, nested objects, and arrays', () => {
    render(<PayloadViewer payload={payload} defaultExpanded />);

    expect(screen.getByText('stream')).toBeInTheDocument();
    expect(screen.getByText('function')).toBeInTheDocument();
    expect(screen.getByText('13')).toBeInTheDocument();
    expect(screen.getByText('nested')).toBeInTheDocument();
    expect(screen.getByText('commack')).toBeInTheDocument();
    expect(screen.getByText('reports')).toBeInTheDocument();
    expect(screen.getAllByText('parameter').length).toBeGreaterThan(0);
    expect(screen.getByText('cd')).toBeInTheDocument();
    expect(screen.getAllByText('value').length).toBeGreaterThan(0);
    expect(screen.getByText('49.1')).toBeInTheDocument();
  });
});
