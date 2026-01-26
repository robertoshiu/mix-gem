export interface AuditEntry {
  id: string;
  action: 'ACKNOWLEDGE' | 'DISMISS' | 'ESCALATE';
  alarmId: string;
  equipmentId: string;
  severity: string;
  message: string;
  userId: string;
  timestamp: Date;
  notes?: string;
}

export interface AuditTrail {
  entries: AuditEntry[];
  addEntry: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
  getEntriesByAlarm: (alarmId: string) => AuditEntry[];
  getEntriesByEquipment: (equipmentId: string) => AuditEntry[];
  getEntriesByUser: (userId: string) => AuditEntry[];
}
