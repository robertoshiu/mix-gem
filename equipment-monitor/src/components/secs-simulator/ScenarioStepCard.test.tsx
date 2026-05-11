import { render, screen } from '@testing-library/react';
import { ScenarioStepCard } from './ScenarioStepCard';
import type { DemoScenarioStep, DemoSecsMessage, DemoSnapshot } from '@/lib/secs-gem-demo-data';

const step: DemoScenarioStep = {
  id: 'establish-comm',
  label: 'Establish communications',
  actor: 'Host',
  action: 'Open communication channel and select equipment',
  primary: 'S1F13',
  expected: 'S1F14',
  status: 'active',
};

const message: DemoSecsMessage = {
  id: 'msg-00',
  timestamp: '2026-05-11T08:00:00.000Z',
  direction: 'H2E',
  sf: 'S1F13',
  stream: 1,
  function: 13,
  wbit: true,
  latencyMs: 0,
  systemBytes: '0x1000',
  summary: 'S1F13 Establish Communications Request',
  payload: { stream: 1, function: 13, mdln: 'MIX-GEM-DEMO', softrev: '2026.05' },
};

const snapshot: DemoSnapshot = {
  id: 'snapshot-1',
  sequence: 1,
  timestamp: '2026-05-11T08:00:00.000Z',
  stepId: 'establish-comm',
  label: 'Establish communications',
  stateVariables: [
    { name: 'Control state', value: 'Online Remote' },
    { name: 'Recipe', value: 'RCP-001' },
  ],
  pendingTransactions: 0,
};

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

describe('ScenarioStepCard', () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it('shows the active detail panel when active', () => {
    render(<ScenarioStepCard step={step} isActive isComplete={false} message={message} snapshot={snapshot} />);

    expect(screen.getAllByText('Establish communications').length).toBeGreaterThan(0);
    expect(screen.getByText('Host to Equipment')).toBeInTheDocument();
    expect(screen.getByText('mdln')).toBeInTheDocument();
    expect(screen.getByText('MIX-GEM-DEMO')).toBeInTheDocument();
    expect(screen.getByText('Snapshot 1')).toBeInTheDocument();
    expect(screen.getByText('Online Remote')).toBeInTheDocument();
  });

  it('renders a complete step as collapsed', () => {
    render(<ScenarioStepCard step={step} isActive={false} isComplete message={message} snapshot={snapshot} />);

    expect(screen.getByText('Complete')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Establish communications/i })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Host to Equipment')).not.toBeInTheDocument();
  });

  it('renders a pending step with dimmed collapsed state', () => {
    const { container } = render(<ScenarioStepCard step={step} isActive={false} isComplete={false} />);

    expect(screen.getByText('Establish communications')).toBeInTheDocument();
    expect(screen.queryByText('Complete')).not.toBeInTheDocument();
    expect(screen.queryByText(/Host · S1F13 → S1F14/i)).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass('opacity-65');
  });

  it('uses the reduced-motion fallback while keeping active details visible', () => {
    mockMatchMedia(true);

    render(<ScenarioStepCard step={step} isActive isComplete={false} message={message} snapshot={snapshot} />);

    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    expect(screen.getByText('Host to Equipment')).toBeInTheDocument();
    expect(screen.getByText('Snapshot 1')).toBeInTheDocument();
  });
});
