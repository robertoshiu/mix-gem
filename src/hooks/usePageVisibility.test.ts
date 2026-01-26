import { renderHook, act } from '@testing-library/react';
import { usePageVisibility } from './usePageVisibility';

describe('usePageVisibility', () => {
  it('should return true when page is visible', () => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      writable: true,
      value: false,
    });

    const { result } = renderHook(() => usePageVisibility());
    expect(result.current).toBe(true);
  });

  it('should return false when page is hidden', () => {
    Object.defineProperty(document, 'hidden', {
        configurable: true,
      writable: true,
      value: true,
    });
    
    // We need to trigger visibilitychange event for the hook to update?
    // Wait, the hook initializes with document.hidden.
    // But if we change it before render, it should pick it up.
    
    const { result } = renderHook(() => usePageVisibility());
    expect(result.current).toBe(false);
  });
});
