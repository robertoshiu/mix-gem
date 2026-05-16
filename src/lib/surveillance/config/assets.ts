// Asset paths relative to public/
// These are populated by `npm run assets:refresh`

export const ASSETS = {
  environment: {
    hdri: '/env/cleanroom.env',
  },
  equipment: {
    chamber: '/models/equipment/chamber.glb',
    efem: '/models/equipment/efem.glb',
    stepper: '/models/equipment/stepper.glb',
    metrology: '/models/equipment/metrology.glb',
    spinCoater: '/models/equipment/spin_coater.glb',
    robotArm: '/models/equipment/robot_arm.glb',
  },
  character: {
    engineer: '/models/character/base.glb',
    suit: '/models/character/suit.glb',
  },
  accessory: {
    arGlasses: '/models/accessory/ar_glasses.glb',
    helmet: '/models/accessory/safety_helmet.glb',
  },
} as const;

// Equipment placement clusters (2 rows with central walkway)
export interface EquipmentPlacement {
  assetKey: keyof typeof ASSETS.equipment;
  position: [number, number, number];
  rotation?: number; // Y-axis rotation in radians
  label: string;
}

export const equipmentLayout: EquipmentPlacement[] = [
  // North row (z > 0)
  { assetKey: 'stepper', position: [-9, 0, 3], label: 'LITHO-01' },
  { assetKey: 'stepper', position: [-9, 0, -2], label: 'LITHO-02' },
  { assetKey: 'spinCoater', position: [-4, 0, 3], rotation: Math.PI / 2, label: 'COAT-01' },
  { assetKey: 'chamber', position: [0, 0, 4], label: 'CVD-01' },
  { assetKey: 'chamber', position: [4, 0, 4], label: 'ETCH-01' },
  { assetKey: 'robotArm', position: [2, 0, 2], label: 'ROBOT-01' },

  // South row (z < 0)
  { assetKey: 'efem', position: [-4, 0, -6], rotation: Math.PI, label: 'EFEM-01' },
  { assetKey: 'metrology', position: [0, 0, -6], label: 'SEM-01' },
  { assetKey: 'metrology', position: [4, 0, -6], label: 'SEM-02' },
  { assetKey: 'chamber', position: [8, 0, -3], label: 'PVD-01' },

  // Chemical storage area
  { assetKey: 'chamber', position: [11, 0, -7], label: 'CHEM-01' },
  { assetKey: 'efem', position: [11, 0, -5], rotation: -Math.PI / 2, label: 'EFEM-02' },
];
