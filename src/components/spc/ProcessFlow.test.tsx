import { render, screen } from '@testing-library/react';
import { ProcessFlow } from './ProcessFlow';

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

// Mock the zustand store
jest.mock('@/stores/mes-spc-store', () => ({
  useMesSpcStore: jest.fn(() => ({
    equipmentState: 'idle',
  })),
}));

describe('ProcessFlow', () => {
  it('renders the process flow container', () => {
    render(<ProcessFlow />);
    expect(screen.getByTestId('process-flow')).toBeInTheDocument();
  });

  it('renders all 5 process steps', () => {
    render(<ProcessFlow />);
    expect(screen.getByText('COAT')).toBeInTheDocument();
    expect(screen.getByText('EXPOSE')).toBeInTheDocument();
    expect(screen.getByText('DEVELOP')).toBeInTheDocument();
    expect(screen.getByText('METROLOGY')).toBeInTheDocument();
    expect(screen.getByText('SPC EVAL')).toBeInTheDocument();
  });
});
