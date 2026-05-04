import { render, screen, fireEvent } from '@testing-library/react';
import { useMesSpcStore, INITIAL_MES_SPC_STATE } from '@/stores/mes-spc-store';
import RecipesPage from './page';

beforeEach(() => {
  useMesSpcStore.setState(INITIAL_MES_SPC_STATE);
});

describe('RecipesPage', () => {
  it('renders all 3 recipe names', () => {
    render(<RecipesPage />);
    expect(screen.getByText('LITHO-193nm-v4')).toBeInTheDocument();
    expect(screen.getByText('COAT-std-v2')).toBeInTheDocument();
    expect(screen.getByText('DEV-alkaline-v1')).toBeInTheDocument();
  });

  it('renders Push Recipe buttons', () => {
    render(<RecipesPage />);
    const buttons = screen.getAllByRole('button', { name: /push recipe/i });
    expect(buttons).toHaveLength(3);
  });

  it('adds S2F49 event to store when Push Recipe clicked', () => {
    render(<RecipesPage />);
    const firstPush = screen.getAllByRole('button', { name: /push recipe/i })[0];
    fireEvent.click(firstPush);
    const events = useMesSpcStore.getState().events;
    expect(events.some((e) => e.type === 's2f49_recipe_push')).toBe(true);
  });
});