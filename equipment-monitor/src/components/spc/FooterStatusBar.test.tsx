import { render, screen, act } from '@testing-library/react';
import FooterStatusBar from './FooterStatusBar';
import React from 'react';

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

// Mock the system time for consistent testing
beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-05-04T10:00:00'));
});

afterAll(() => {
  jest.useRealTimers();
});

describe('FooterStatusBar', () => {
  it('renders correctly with expected segments', () => {
    render(<FooterStatusBar />);
    
    expect(screen.getByTestId('footer-status-bar')).toBeInTheDocument();
    expect(screen.getByText('SmartFactory Intelligence Platform v1.0')).toBeInTheDocument();
    expect(screen.getByText('AI Engine: Active')).toBeInTheDocument();
    expect(screen.getByText('Data Refresh: 2s')).toBeInTheDocument();
    expect(screen.getByText('Connected: 8 devices')).toBeInTheDocument();
  });

  it('displays the current time in HH:MM:SS format', () => {
    render(<FooterStatusBar />);
    const clock = screen.getByTestId('footer-clock');
    // 10:00:00 because of mocked system time
    expect(clock.textContent).toBe('10:00:00');
  });

  it('updates the clock every second', () => {
    render(<FooterStatusBar />);
    const clock = screen.getByTestId('footer-clock');
    
    expect(clock.textContent).toBe('10:00:00');
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(clock.textContent).toBe('10:00:01');
    
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    expect(clock.textContent).toBe('10:00:03');
  });
});
