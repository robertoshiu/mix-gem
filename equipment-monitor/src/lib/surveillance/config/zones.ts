import { Vector3 } from '@babylonjs/core/Maths/math.vector';

export type Severity = 'critical' | 'high' | 'medium';

export interface RestrictedZone {
  id: string;
  name: string;
  min: Vector3;
  max: Vector3;
  severity: Severity;
}

export const restrictedZones: RestrictedZone[] = [
  {
    id: 'litho_bay',
    name: '微影區 (Class 1)',
    min: new Vector3(-12, 0, -5),
    max: new Vector3(-6, 3, 5),
    severity: 'critical',
  },
  {
    id: 'chemical_storage',
    name: '化學品儲存區',
    min: new Vector3(8, 0, -9),
    max: new Vector3(14, 3, -5),
    severity: 'high',
  },
  {
    id: 'maintenance_pit',
    name: '維修區',
    min: new Vector3(2, -2, 6),
    max: new Vector3(6, 0, 10),
    severity: 'medium',
  },
];

export function isInsideZone(pos: Vector3, zone: RestrictedZone): boolean {
  return (
    pos.x >= zone.min.x && pos.x <= zone.max.x &&
    pos.y >= zone.min.y && pos.y <= zone.max.y &&
    pos.z >= zone.min.z && pos.z <= zone.max.z
  );
}
