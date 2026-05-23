import { HistoryBuffer } from '../history-buffer';

describe('HistoryBuffer', () => {
  test('starts empty', () => {
    const buf = new HistoryBuffer<number>(10);
    expect(buf.length).toBe(0);
    expect(buf.toArray()).toEqual([]);
  });

  test('push adds values', () => {
    const buf = new HistoryBuffer<number>(5);
    buf.push(1);
    buf.push(2);
    expect(buf.length).toBe(2);
    expect(buf.toArray()).toEqual([1, 2]);
  });

  test('wraps at capacity', () => {
    const buf = new HistoryBuffer<number>(3);
    buf.push(1); buf.push(2); buf.push(3); buf.push(4);
    expect(buf.length).toBe(3);
    expect(buf.toArray()).toEqual([2, 3, 4]);
  });

  test('latest returns most recent value', () => {
    const buf = new HistoryBuffer<number>(5);
    buf.push(10); buf.push(20);
    expect(buf.latest()).toBe(20);
  });

  test('latest returns undefined when empty', () => {
    const buf = new HistoryBuffer<number>(5);
    expect(buf.latest()).toBeUndefined();
  });

  test('last(n) returns tail slice', () => {
    const buf = new HistoryBuffer<number>(10);
    for (let i = 0; i < 7; i++) buf.push(i);
    expect(buf.last(3)).toEqual([4, 5, 6]);
  });

  test('last(n) with n > length returns all', () => {
    const buf = new HistoryBuffer<number>(10);
    buf.push(1); buf.push(2);
    expect(buf.last(5)).toEqual([1, 2]);
  });

  test('clear resets buffer', () => {
    const buf = new HistoryBuffer<number>(5);
    buf.push(1); buf.push(2);
    buf.clear();
    expect(buf.length).toBe(0);
    expect(buf.toArray()).toEqual([]);
  });

  test('handles 300-point capacity (production size)', () => {
    const buf = new HistoryBuffer<number>(300);
    for (let i = 0; i < 500; i++) buf.push(i);
    expect(buf.length).toBe(300);
    expect(buf.toArray()[0]).toBe(200);
    expect(buf.latest()).toBe(499);
  });

  test('works with object values', () => {
    const buf = new HistoryBuffer<{ t: number; v: number }>(3);
    buf.push({ t: 0, v: 100 });
    buf.push({ t: 1, v: 200 });
    buf.push({ t: 2, v: 300 });
    buf.push({ t: 3, v: 400 });
    expect(buf.toArray()).toEqual([
      { t: 1, v: 200 }, { t: 2, v: 300 }, { t: 3, v: 400 },
    ]);
  });
});
