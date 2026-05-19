import { render, screen } from '@testing-library/react';
import { WaferBinMap } from './WaferBinMap';

// matchMedia needed by useReducedMotion in animation.ts
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('WaferBinMap', () => {
  it('renders with wafer-bin-map testid', () => {
    render(<WaferBinMap />);
    expect(screen.getByTestId('wafer-bin-map')).toBeInTheDocument();
  });

  it('shows default lot id when not provided', () => {
    render(<WaferBinMap />);
    expect(screen.getByText(/Wafer Map — Lot A03/)).toBeInTheDocument();
  });

  it('shows custom lot id when provided', () => {
    render(<WaferBinMap lotId="LOT-2026-001" />);
    expect(screen.getByText(/Wafer Map — Lot LOT-2026-001/)).toBeInTheDocument();
  });

  it('renders legend labels', () => {
    render(<WaferBinMap />);
    expect(screen.getByText('Pass')).toBeInTheDocument();
    expect(screen.getByText('Fail')).toBeInTheDocument();
    expect(screen.getByText('Retest')).toBeInTheDocument();
    expect(screen.getByText('Not Tested')).toBeInTheDocument();
  });

  it('renders total die count', () => {
    render(<WaferBinMap />);
    expect(screen.getByText(/Total:/)).toBeInTheDocument();
  });

  it('renders svg element', () => {
    const { container } = render(<WaferBinMap />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
