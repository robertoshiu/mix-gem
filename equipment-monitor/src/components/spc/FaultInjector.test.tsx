import { render, screen, fireEvent } from '@testing-library/react';
import { FaultInjector } from './FaultInjector';

describe('FaultInjector', () => {
  it('renders "Inject Fault" button', () => {
    render(<FaultInjector onInject={jest.fn()} onClear={jest.fn()} activeFault={null} />);
    expect(screen.getByRole('button', { name: /inject fault/i })).toBeInTheDocument();
  });

  it('inject button uses AMAT Orange style', () => {
    render(<FaultInjector onInject={jest.fn()} onClear={jest.fn()} activeFault={null} />);
    const btn = screen.getByRole('button', { name: /inject fault/i });
    expect(btn.className).toMatch(/smartfactory-accent-orange/);
  });

  it('shows Clear Fault button when fault is active', () => {
    const fault = { type: 'sudden_shift' as const, parameter: 'cd' as const, severity: 1.0, startedAtWafer: 5 };
    render(<FaultInjector onInject={jest.fn()} onClear={jest.fn()} activeFault={fault} />);
    expect(screen.getByRole('button', { name: /clear fault/i })).toBeInTheDocument();
  });

  it('calls onInject with selected fault when injected', () => {
    const onInject = jest.fn();
    render(<FaultInjector onInject={onInject} onClear={jest.fn()} activeFault={null} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'sudden_shift' } });
    fireEvent.click(screen.getByRole('button', { name: /inject fault/i }));
    expect(onInject).toHaveBeenCalledWith(expect.objectContaining({ type: 'sudden_shift' }));
  });

  it('calls onClear when Clear Fault is clicked', () => {
    const onClear = jest.fn();
    const fault = { type: 'sudden_shift' as const, parameter: 'cd' as const, severity: 1.0, startedAtWafer: 5 };
    render(<FaultInjector onInject={jest.fn()} onClear={onClear} activeFault={fault} />);
    fireEvent.click(screen.getByRole('button', { name: /clear fault/i }));
    expect(onClear).toHaveBeenCalled();
  });
});