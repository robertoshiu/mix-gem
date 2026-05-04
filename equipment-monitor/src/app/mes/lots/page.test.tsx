import { render, screen } from '@testing-library/react';
import { useMesSpcStore, INITIAL_MES_SPC_STATE } from '@/stores/mes-spc-store';
import LotsPage from './page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => '/mes/lots',
  useSearchParams: () => new URLSearchParams(),
}));

beforeEach(() => {
  useMesSpcStore.setState(INITIAL_MES_SPC_STATE);
});

describe('LotsPage', () => {
  it('renders table headers', () => {
    render(<LotsPage />);
    expect(screen.getByText('Lot ID')).toBeInTheDocument();
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders all 3 mock lots', () => {
    render(<LotsPage />);
    expect(screen.getByText('LOT-2026-001')).toBeInTheDocument();
    expect(screen.getByText('LOT-2026-002')).toBeInTheDocument();
    expect(screen.getByText('LOT-2026-003')).toBeInTheDocument();
  });

  it('shows in_process badge for first lot', () => {
    render(<LotsPage />);
    expect(screen.getByText(/in.?process/i)).toBeInTheDocument();
  });
});
