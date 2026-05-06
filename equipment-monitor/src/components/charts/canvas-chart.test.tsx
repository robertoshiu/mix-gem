import { render } from '@testing-library/react';
import { CanvasChart } from './canvas-chart';

describe('CanvasChart', () => {
  const mockData = Array.from({ length: 100 }, (_, i) => ({
    timestamp: new Date(Date.now() + i * 1000),
    value: 20 + Math.sin(i / 10) * 5,
  }));

  beforeEach(() => {
    // Mock canvas getContext
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      closePath: jest.fn(),
      setLineDash: jest.fn(),
    })) as unknown as HTMLCanvasElement['getContext'];
  });

  it('should render a canvas element', () => {
    const { container } = render(
      <CanvasChart data={mockData} width={600} height={300} />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should have correct width and height attributes', () => {
    const { container } = render(
      <CanvasChart data={mockData} width={600} height={300} />
    );

    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas.width).toBe(600);
    expect(canvas.height).toBe(300);
  });

  it('should have proper ARIA attributes', () => {
    const { container } = render(
      <CanvasChart data={mockData} width={600} height={300} />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toHaveAttribute('aria-label', 'Chart visualization');
    expect(canvas).toHaveAttribute('role', 'img');
  });

  it('should accept custom color', () => {
    const { container } = render(
      <CanvasChart data={mockData} width={600} height={300} color="#10B981" />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should handle empty data gracefully', () => {
    const { container } = render(
      <CanvasChart data={[]} width={600} height={300} />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should accept LSL and USL spec limits', () => {
    const { container } = render(
      <CanvasChart data={mockData} width={600} height={300} lsl={15} usl={30} />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should call canvas drawing methods', () => {
    const mockContext = {
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      closePath: jest.fn(),
      setLineDash: jest.fn(),
      strokeStyle: '',
      fillStyle: '',
      lineWidth: 0,
    };

    HTMLCanvasElement.prototype.getContext = jest.fn(
      () => mockContext
    ) as unknown as HTMLCanvasElement['getContext'];

    render(<CanvasChart data={mockData} width={600} height={300} />);

    expect(mockContext.clearRect).toHaveBeenCalled();
    expect(mockContext.beginPath).toHaveBeenCalled();
    expect(mockContext.stroke).toHaveBeenCalled();
  });

  it('should accept custom className', () => {
    const { container } = render(
      <CanvasChart
        data={mockData}
        width={600}
        height={300}
        className="custom-class"
      />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toHaveClass('custom-class');
  });
});
