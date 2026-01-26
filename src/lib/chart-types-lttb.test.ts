import { lttbDownsample } from './chart-types';

describe('LTTB Downsampling', () => {
  it('should reduce 1000 points to 100 while preserving shape', () => {
    const data = Array.from({ length: 1000 }, (_, i) => ({
      timestamp: new Date(Date.now() + i * 1000).getTime(),
      value: Math.sin(i / 10) * 10 + 20,
    }));

    const downsampled = lttbDownsample(data, 100);

    expect(downsampled.length).toBe(100);
    expect(downsampled[0]).toEqual(data[0]); // First point preserved
    expect(downsampled[99]).toEqual(data[999]); // Last point preserved
  });
});
