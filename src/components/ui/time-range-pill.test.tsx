import { render, screen, fireEvent } from '@testing-library/react';
import { TimeRangePill } from './time-range-pill';

describe('TimeRangePill', () => {
  it('should have minimum 44px height', () => {
    const { container } = render(
      <TimeRangePill label="1h" value="1h" isActive={false} onClick={jest.fn()} />
    );
    const button = container.firstChild as HTMLElement;
    expect(button?.className).toMatch(/min-h-\[44px\]/);
  });

  it('should have minimum 44px width', () => {
    const { container } = render(
      <TimeRangePill label="1h" value="1h" isActive={false} onClick={jest.fn()} />
    );
    const button = container.firstChild as HTMLElement;
    expect(button?.className).toMatch(/min-w-\[44px\]/);
  });

  it('should display the label', () => {
    render(<TimeRangePill label="1 Hour" value="1h" isActive={false} onClick={jest.fn()} />);
    expect(screen.getByText('1 Hour')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = jest.fn();
    render(<TimeRangePill label="1h" value="1h" isActive={false} onClick={onClick} />);

    const button = screen.getByRole('button', { name: '1h' });
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should have active styles when isActive is true', () => {
    const { container } = render(
      <TimeRangePill label="1h" value="1h" isActive={true} onClick={jest.fn()} />
    );
    const button = container.firstChild as HTMLElement;
    expect(button?.className).toMatch(/bg-blue-500/);
    expect(button?.className).toMatch(/text-white/);
  });

  it('should have inactive styles when isActive is false', () => {
    const { container } = render(
      <TimeRangePill label="1h" value="1h" isActive={false} onClick={jest.fn()} />
    );
    const button = container.firstChild as HTMLElement;
    expect(button?.className).toMatch(/bg-slate-700/);
    expect(button?.className).toMatch(/text-slate-300/);
  });

  it('should have aria-pressed attribute', () => {
    render(<TimeRangePill label="1h" value="1h" isActive={true} onClick={jest.fn()} />);
    const button = screen.getByRole('button', { name: '1h' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('should have rounded-full class for pill shape', () => {
    const { container } = render(
      <TimeRangePill label="1h" value="1h" isActive={false} onClick={jest.fn()} />
    );
    const button = container.firstChild as HTMLElement;
    expect(button?.className).toMatch(/rounded-full/);
  });
});
