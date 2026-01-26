import { render, fireEvent } from '@testing-library/react';
import { EquipmentSidebar } from './equipment-sidebar';
import { useEquipmentStore } from '@/stores/equipment-store';

const mockEquipment = [
  { id: 'ETCH-001', name: 'Etcher 1', status: 'process' as const, currentRecipe: 'RECIPE-A' },
  { id: 'ETCH-002', name: 'Etcher 2', status: 'idle' as const, currentRecipe: 'RECIPE-B' },
  { id: 'ETCH-003', name: 'Etcher 3', status: 'alarm' as const, currentRecipe: 'RECIPE-C' },
];

// Mock the store hook
jest.mock('@/stores/equipment-store');

describe('EquipmentSidebar Keyboard Navigation', () => {
  const mockSelectEquipment = jest.fn();

  beforeEach(() => {
    mockSelectEquipment.mockClear();
  });

  it('should select first equipment (highest priority) on ArrowDown when nothing selected', () => {
    (useEquipmentStore as unknown as jest.Mock).mockReturnValue({
      equipment: mockEquipment,
      selectedEquipmentId: null,
      selectEquipment: mockSelectEquipment,
    });

    const { container } = render(<EquipmentSidebar />);
    const sidebar = container.querySelector('[role="list"]');

    fireEvent.keyDown(sidebar!, { key: 'ArrowDown' });

    // Sorted order: Alarm (ETCH-003) -> Process (ETCH-001) -> Idle (ETCH-002)
    // First is ETCH-003
    expect(mockSelectEquipment).toHaveBeenCalledWith('ETCH-003');
  });

  it('should select next equipment on ArrowDown', () => {
    // Simulate ETCH-003 (index 0) is selected
    (useEquipmentStore as unknown as jest.Mock).mockReturnValue({
      equipment: mockEquipment,
      selectedEquipmentId: 'ETCH-003',
      selectEquipment: mockSelectEquipment,
    });

    const { container } = render(<EquipmentSidebar />);
    const sidebar = container.querySelector('[role="list"]');

    fireEvent.keyDown(sidebar!, { key: 'ArrowDown' });

    // Next is ETCH-001
    expect(mockSelectEquipment).toHaveBeenCalledWith('ETCH-001');
  });

  it('should select previous equipment on ArrowUp', () => {
     // Simulate ETCH-001 (index 1) is selected
    (useEquipmentStore as unknown as jest.Mock).mockReturnValue({
      equipment: mockEquipment,
      selectedEquipmentId: 'ETCH-001',
      selectEquipment: mockSelectEquipment,
    });

    const { container } = render(<EquipmentSidebar />);
    const sidebar = container.querySelector('[role="list"]');

    fireEvent.keyDown(sidebar!, { key: 'ArrowUp' });

    // Previous is ETCH-003
    expect(mockSelectEquipment).toHaveBeenCalledWith('ETCH-003');
  });
  
  it('should wrap around to first item on ArrowDown from last item', () => {
     // Simulate ETCH-002 (index 2, last) is selected
    (useEquipmentStore as unknown as jest.Mock).mockReturnValue({
      equipment: mockEquipment,
      selectedEquipmentId: 'ETCH-002',
      selectEquipment: mockSelectEquipment,
    });

    const { container } = render(<EquipmentSidebar />);
    const sidebar = container.querySelector('[role="list"]');

    fireEvent.keyDown(sidebar!, { key: 'ArrowDown' });

    // Next after last is first: ETCH-003
    expect(mockSelectEquipment).toHaveBeenCalledWith('ETCH-003');
  });
});
