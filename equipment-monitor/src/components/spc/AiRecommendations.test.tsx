import { render, screen, fireEvent } from '@testing-library/react';
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
const mockApplyRecommendation = jest.fn();
const mockOverrideRecommendation = jest.fn();
const mockAddEvent = jest.fn();
const mockAddRecommendation = jest.fn();
const mockUpdateConfidence = jest.fn();
const mockSupersede = jest.fn();
const mockClearStale = jest.fn();
const mockSetConfig = jest.fn();
const mockSetTimestamp = jest.fn();

jest.mock('@/stores/mes-spc-store', () => ({
  useMesSpcStore: jest.fn(),
}));

import { useMesSpcStore } from '@/stores/mes-spc-store';

const mockUseMesSpcStore = useMesSpcStore as jest.Mock;

function createMockStoreState(overrides: Record<string, unknown> = {}) {
  return {
    recommendations: [],
    measurements: [],
    aiEngineConfig: {
      driftThreshold: 0.3,
      minDataPoints: 5,
      confidenceDecayRate: 0.5,
      maxRecommendations: 10,
      analysisInterval: 3,
    },
    applyRecommendation: mockApplyRecommendation,
    overrideRecommendation: mockOverrideRecommendation,
    addEvent: mockAddEvent,
    addRecommendation: mockAddRecommendation,
    updateRecommendationConfidence: mockUpdateConfidence,
    supersedeRecommendation: mockSupersede,
    clearStaleRecommendations: mockClearStale,
    setAiEngineConfig: mockSetConfig,
    setLastAnalysisTimestamp: mockSetTimestamp,
    ...overrides,
  };
}

describe('AiRecommendations', () => {
  beforeEach(() => {
    mockUseMesSpcStore.mockReset();
    jest.clearAllMocks();
  });

  it('renders with ai-recommendations testid', () => {
    mockUseMesSpcStore.mockReturnValue(createMockStoreState());
    render(<AiRecommendations />);
    expect(screen.getByTestId('ai-recommendations')).toBeInTheDocument();
  });

  it('shows initializing state when insufficient data', () => {
    mockUseMesSpcStore.mockReturnValue(createMockStoreState({
      measurements: [],
      aiEngineConfig: { minDataPoints: 5 },
    }));
    render(<AiRecommendations />);
    expect(screen.getByText(/AI analysis initializing/i)).toBeInTheDocument();
    expect(screen.getByText(/0\/5 wafers/i)).toBeInTheDocument();
  });

  it('shows stable state when no recommendations and enough data', () => {
    mockUseMesSpcStore.mockReturnValue(createMockStoreState({
      measurements: Array.from({ length: 10 }, () => ({})),
    }));
    render(<AiRecommendations />);
    expect(screen.getByText(/No active recommendations/i)).toBeInTheDocument();
    expect(screen.getByText(/process is stable/i)).toBeInTheDocument();
  });

  it('renders recommendations with confidence display', () => {
    mockUseMesSpcStore.mockReturnValue(createMockStoreState({
      measurements: Array.from({ length: 10 }, () => ({})),
      recommendations: [
        {
          id: 'rec-001',
          type: 'quality',
          source: 'trend-drift',
          title: 'CD uniformity degrading',
          description: 'Test description',
          confidence: 92,
          impact: 'High impact',
          status: 'pending',
          createdAt: new Date(),
          relatedParameter: 'cd',
          trendDirection: 'degrading',
          confidenceHistory: [{ timestamp: new Date(), confidence: 92 }],
        },
      ],
    }));
    render(<AiRecommendations />);
    expect(screen.getByText('CD uniformity degrading')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
  });

  it('renders trend indicators', () => {
    mockUseMesSpcStore.mockReturnValue(createMockStoreState({
      measurements: Array.from({ length: 10 }, () => ({})),
      recommendations: [
        {
          id: 'rec-001',
          type: 'quality',
          source: 'trend-drift',
          title: 'Test',
          description: 'Test',
          confidence: 85,
          impact: 'High',
          status: 'pending',
          createdAt: new Date(),
          trendDirection: 'degrading',
          confidenceHistory: [{ timestamp: new Date(), confidence: 85 }],
        },
      ],
    }));
    render(<AiRecommendations />);
    expect(screen.getByText('degrading')).toBeInTheDocument();
  });

  it('renders source badges', () => {
    mockUseMesSpcStore.mockReturnValue(createMockStoreState({
      measurements: Array.from({ length: 10 }, () => ({})),
      recommendations: [
        {
          id: 'rec-001',
          type: 'quality',
          source: 'spc-violation',
          title: 'Test',
          description: 'Test',
          confidence: 90,
          impact: 'High',
          status: 'pending',
          createdAt: new Date(),
          confidenceHistory: [{ timestamp: new Date(), confidence: 90 }],
        },
      ],
    }));
    render(<AiRecommendations />);
    expect(screen.getByText('SPC Alert')).toBeInTheDocument();
  });

  it('renders related parameter chips', () => {
    mockUseMesSpcStore.mockReturnValue(createMockStoreState({
      measurements: Array.from({ length: 10 }, () => ({})),
      recommendations: [
        {
          id: 'rec-001',
          type: 'quality',
          source: 'trend-drift',
          title: 'Test',
          description: 'Test',
          confidence: 85,
          impact: 'High',
          status: 'pending',
          createdAt: new Date(),
          relatedParameter: 'cd',
          confidenceHistory: [{ timestamp: new Date(), confidence: 85 }],
        },
      ],
    }));
    render(<AiRecommendations />);
    expect(screen.getByText('CD')).toBeInTheDocument();
  });

  it('applies recommendation when Apply button clicked', () => {
    mockUseMesSpcStore.mockReturnValue(createMockStoreState({
      measurements: Array.from({ length: 10 }, () => ({})),
      recommendations: [
        {
          id: 'rec-apply-test',
          type: 'quality',
          source: 'trend-drift',
          title: 'Test',
          description: 'Test',
          confidence: 85,
          impact: 'High',
          status: 'pending',
          createdAt: new Date(),
          confidenceHistory: [{ timestamp: new Date(), confidence: 85 }],
        },
      ],
    }));
    render(<AiRecommendations />);
    const applyButton = screen.getByTestId('ai-action-apply-rec-apply-test');
    fireEvent.click(applyButton);
    expect(mockApplyRecommendation).toHaveBeenCalledWith('rec-apply-test');
    expect(mockAddEvent).toHaveBeenCalled();
  });

  it('overrides recommendation when Override button clicked', () => {
    mockUseMesSpcStore.mockReturnValue(createMockStoreState({
      measurements: Array.from({ length: 10 }, () => ({})),
      recommendations: [
        {
          id: 'rec-override-test',
          type: 'scheduling',
          source: 'equipment-inhibited',
          title: 'Test',
          description: 'Test',
          confidence: 88,
          impact: 'High',
          status: 'pending',
          createdAt: new Date(),
          confidenceHistory: [{ timestamp: new Date(), confidence: 88 }],
        },
      ],
    }));
    render(<AiRecommendations />);
    const overrideButton = screen.getByTestId('ai-action-override-rec-override-test');
    fireEvent.click(overrideButton);
    expect(mockOverrideRecommendation).toHaveBeenCalledWith('rec-override-test');
    expect(mockAddEvent).toHaveBeenCalled();
  });

  it('renders superseded recommendations as grayed out', () => {
    mockUseMesSpcStore.mockReturnValue(createMockStoreState({
      measurements: Array.from({ length: 10 }, () => ({})),
      recommendations: [
        {
          id: 'rec-001',
          type: 'quality',
          source: 'trend-drift',
          title: 'Test',
          description: 'Test',
          confidence: 85,
          impact: 'High',
          status: 'superseded',
          createdAt: new Date(),
          supersededById: 'rec-002',
          confidenceHistory: [{ timestamp: new Date(), confidence: 85 }],
        },
      ],
    }));
    render(<AiRecommendations />);
    expect(screen.getByText(/Superseded/i)).toBeInTheDocument();
  });

  it('shows pending count badge when recommendations exist', () => {
    mockUseMesSpcStore.mockReturnValue(createMockStoreState({
      measurements: Array.from({ length: 10 }, () => ({})),
      recommendations: [
        {
          id: 'rec-1',
          type: 'quality',
          source: 'trend-drift',
          title: 'Test 1',
          description: 'Test',
          confidence: 85,
          impact: 'High',
          status: 'pending',
          createdAt: new Date(),
          confidenceHistory: [{ timestamp: new Date(), confidence: 85 }],
        },
        {
          id: 'rec-2',
          type: 'energy',
          source: 'process-optimization',
          title: 'Test 2',
          description: 'Test',
          confidence: 78,
          impact: 'High',
          status: 'pending',
          createdAt: new Date(),
          confidenceHistory: [{ timestamp: new Date(), confidence: 78 }],
        },
      ],
    }));
    render(<AiRecommendations />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows live indicator when data is available', () => {
    mockUseMesSpcStore.mockReturnValue(createMockStoreState({
      measurements: Array.from({ length: 10 }, () => ({})),
    }));
    render(<AiRecommendations />);
    expect(screen.getByText('Live')).toBeInTheDocument();
  });
});
