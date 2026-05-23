export class HistoryBuffer<T> {
  private buf: (T | undefined)[];
  private head = 0;
  private count = 0;
  private readonly cap: number;

  constructor(capacity: number) {
    this.cap = capacity;
    this.buf = new Array(capacity);
  }

  push(value: T): void {
    this.buf[this.head] = value;
    this.head = (this.head + 1) % this.cap;
    if (this.count < this.cap) this.count++;
  }

  get length(): number {
    return this.count;
  }

  latest(): T | undefined {
    if (this.count === 0) return undefined;
    return this.buf[(this.head - 1 + this.cap) % this.cap];
  }

  toArray(): T[] {
    if (this.count === 0) return [];
    const start = (this.head - this.count + this.cap) % this.cap;
    const result: T[] = [];
    for (let i = 0; i < this.count; i++) {
      result.push(this.buf[(start + i) % this.cap] as T);
    }
    return result;
  }

  last(n: number): T[] {
    const arr = this.toArray();
    return n >= arr.length ? arr : arr.slice(arr.length - n);
  }

  clear(): void {
    this.head = 0;
    this.count = 0;
    this.buf = new Array(this.cap);
  }
}
