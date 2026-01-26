import { renderHook, act } from '@testing-library/react';
import { useTimeRange } from './useTimeRange';

describe('useTimeRange', () => {
  it('should default to 1h range', () => {
    const { result } = renderHook(() => useTimeRange());
    expect(result.current.range).toBe('1h');
  });

  it('should calculate correct start time for 1h', () => {
    const { result } = renderHook(() => useTimeRange());
    const now = Date.now();
    const startTime = result.current.startTime.getTime();
    expect(now - startTime).toBeCloseTo(3600000, -3); // 1 hour in ms (allowing small diff for execution time)
  });

  it('should update range when setRange called', () => {
    const { result } = renderHook(() => useTimeRange());
    act(() => {
      result.current.setRange('6h');
    });
    expect(result.current.range).toBe('6h');
  });
});
