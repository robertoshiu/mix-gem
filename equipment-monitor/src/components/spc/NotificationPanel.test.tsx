import { render, screen } from '@testing-library/react';
import { NotificationPanel } from './NotificationPanel';

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

describe('NotificationPanel', () => {
  beforeEach(() => {
    mockUseMesSpcStore.mockReset();
  });

  it('renders with notification-panel testid', () => {
    mockUseMesSpcStore.mockReturnValue({
      notifications: [],
      markAllNotificationsRead: jest.fn(),
      dismissNotification: jest.fn(),
      closeAllPanels: jest.fn(),
    });
    render(<NotificationPanel />);
    expect(screen.getByTestId('notification-panel')).toBeInTheDocument();
  });

  it('shows empty state when no notifications', () => {
    mockUseMesSpcStore.mockReturnValue({
      notifications: [],
      markAllNotificationsRead: jest.fn(),
      dismissNotification: jest.fn(),
      closeAllPanels: jest.fn(),
    });
    render(<NotificationPanel />);
    expect(screen.getByText('No notifications')).toBeInTheDocument();
  });
});
