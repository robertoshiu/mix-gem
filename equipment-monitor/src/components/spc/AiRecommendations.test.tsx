import { render, screen } from '@testing-library/react';
import { AiRecommendations } from './AiRecommendations';

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
  useMesSpcStore: jest.fn(),
}));

import { useMesSpcStore } from '@/stores/mes-spc-store';

const mockUseMesSpcStore = useMesSpcStore as jest.Mock;

describe('AiRecommendations', () => {
  beforeEach(() => {
    mockUseMesSpcStore.mockReset();
  });

  it('renders with ai-recommendations testid', () => {
    mockUseMesSpcStore.mockReturnValue({
      recommendations: [],
      applyRecommendation: jest.fn(),
      overrideRecommendation: jest.fn(),
      addEvent: jest.fn(),
    });
    render(<AiRecommendations />);
    expect(screen.getByTestId('ai-recommendations')).toBeInTheDocument();
  });

  it('shows empty state when no recommendations', () => {
    mockUseMesSpcStore.mockReturnValue({
      recommendations: [],
      applyRecommendation: jest.fn(),
      overrideRecommendation: jest.fn(),
      addEvent: jest.fn(),
    });
    render(<AiRecommendations />);
    expect(screen.getByText('No AI recommendations available')).toBeInTheDocument();
  });
});
