import { render, screen, fireEvent } from '@testing-library/react';
import { EquipmentDrawer } from '../EquipmentDrawer';
import type { Equipment } from '@/lib/mes-types';

const mockEquipment: Equipment = {
  id: 'NXE-3800-01',
  name: 'NXE:3800E',
  type: 'lithography',
  status: 'running',
  x: 0, y: 0,
  zone: 'Bay 2',
  powerKw: 42,
  recipe: 'M2-193I-OPC',
  currentWafer: 18,
  totalWafers: 25,
};

describe('EquipmentDrawer', () => {
  test('renders when equipmentId provided', () => {
    render(<EquipmentDrawer equipmentId="NXE-3800-01" equipment={mockEquipment} onClose={() => {}} />);
    expect(screen.getByText('NXE:3800E')).toBeInTheDocument();
  });

  test('hidden when equipmentId is null', () => {
    const { container } = render(<EquipmentDrawer equipmentId={null} equipment={null} onClose={() => {}} />);
    const drawer = container.querySelector('[data-testid="equipment-drawer"]');
    expect(drawer).toHaveClass('translate-x-full');
  });

  test('shows equipment name, status badge, wafer progress', () => {
    render(<EquipmentDrawer equipmentId="NXE-3800-01" equipment={mockEquipment} onClose={() => {}} />);
    expect(screen.getByText('NXE:3800E')).toBeInTheDocument();
    expect(screen.getByText('RUNNING')).toBeInTheDocument();
    expect(screen.getByText(/18 \/ 25/)).toBeInTheDocument();
  });

  test('contains Performance, PM, MTBF sections', () => {
    render(<EquipmentDrawer equipmentId="NXE-3800-01" equipment={mockEquipment} onClose={() => {}} />);
    expect(screen.getByText('PERFORMANCE')).toBeInTheDocument();
    expect(screen.getByText('PREVENTIVE MAINTENANCE')).toBeInTheDocument();
    expect(screen.getByText('MTBF PREDICTION')).toBeInTheDocument();
  });

  test('close button calls handler', () => {
    const onClose = jest.fn();
    render(<EquipmentDrawer equipmentId="NXE-3800-01" equipment={mockEquipment} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('drawer-close-btn'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
