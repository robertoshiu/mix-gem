'use client';

import { useEffect, useMemo, useCallback } from 'react';
import type { Equipment } from '@/lib/mes-types';
import { generateToolPerformance, generatePmSchedule, generateMtbfPrediction } from '@/lib/tool-health';
import { PerformanceGauges } from './PerformanceGauges';
import { PmTimeline } from './PmTimeline';
import { MtbfChart } from './MtbfChart';
import { cn } from '@/lib/utils';

interface EquipmentDrawerProps {
  equipmentId: string | null;
  equipment: Equipment | null;
  onClose: () => void;
}

const STATUS_BADGE: Record<string, string> = {
  running: 'bg-green-950/80 border border-[var(--smartfactory-status-green)] text-green-300',
  idle: 'bg-amber-950/80 border border-[var(--smartfactory-status-amber)] text-amber-300',
  down: 'bg-red-950/80 border border-[var(--smartfactory-status-red)] text-red-300',
};

export function EquipmentDrawer({ equipmentId, equipment, onClose }: EquipmentDrawerProps) {
  const isOpen = equipmentId !== null && equipment !== null;

  const performance = useMemo(
    () => equipmentId ? generateToolPerformance(equipmentId, 90) : null,
    [equipmentId],
  );
  const pmSchedule = useMemo(
    () => equipmentId ? generatePmSchedule(equipmentId) : null,
    [equipmentId],
  );
  const mtbf = useMemo(
    () => equipmentId ? generateMtbfPrediction(equipmentId) : null,
    [equipmentId],
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) onClose();
  }, [isOpen, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      data-testid="equipment-drawer"
      className={cn(
        'absolute right-0 top-0 h-full z-20 w-[480px] bg-[var(--smartfactory-surface-card)] border-l border-[var(--smartfactory-border-default)] transition-transform duration-200 ease-out overflow-y-auto',
        isOpen ? 'translate-x-0' : 'translate-x-full',
      )}
    >
      {equipment && (
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="text-base font-semibold text-[var(--smartfactory-text-primary)]">
                {equipment.name}
              </div>
              <div className="text-xs text-[var(--smartfactory-text-muted)] font-mono">
                {equipment.id}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                  'inline-flex items-center text-xs px-2 py-0.5 rounded border font-medium',
                  STATUS_BADGE[equipment.status] ?? STATUS_BADGE.idle,
                )}>
                  {equipment.status.toUpperCase()}
                </span>
              </div>
            </div>
            <button
              data-testid="drawer-close-btn"
              type="button"
              onClick={onClose}
              className="text-[var(--smartfactory-text-muted)] hover:text-[var(--smartfactory-text-primary)] text-lg p-1"
            >
              &times;
            </button>
          </div>

          {/* Recipe + Wafer Progress */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--smartfactory-text-secondary)]">Recipe</span>
              <span className="text-[var(--smartfactory-text-primary)] font-mono text-xs">{equipment.recipe}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--smartfactory-text-secondary)]">Wafers</span>
              <span className="text-[var(--smartfactory-text-primary)] font-mono text-xs">
                {equipment.currentWafer} / {equipment.totalWafers}
              </span>
            </div>
            {equipment.totalWafers > 0 && (
              <div className="w-full bg-slate-700 rounded h-1.5">
                <div
                  className="bg-emerald-500 rounded h-1.5 transition-all"
                  style={{ width: `${Math.min((equipment.currentWafer / equipment.totalWafers) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Performance */}
          <div className="border-t border-[var(--smartfactory-border-default)] pt-3">
            <div className="text-[10px] font-semibold text-[var(--smartfactory-text-muted)] tracking-wider mb-2">
              PERFORMANCE
            </div>
            {performance && <PerformanceGauges performance={performance} />}
          </div>

          {/* PM */}
          <div className="border-t border-[var(--smartfactory-border-default)] pt-3">
            <div className="text-[10px] font-semibold text-[var(--smartfactory-text-muted)] tracking-wider mb-2">
              PREVENTIVE MAINTENANCE
            </div>
            {pmSchedule && <PmTimeline schedule={pmSchedule} />}
          </div>

          {/* MTBF */}
          <div className="border-t border-[var(--smartfactory-border-default)] pt-3">
            <div className="text-[10px] font-semibold text-[var(--smartfactory-text-muted)] tracking-wider mb-2">
              MTBF PREDICTION
            </div>
            {mtbf && <MtbfChart prediction={mtbf} />}
          </div>
        </div>
      )}
    </div>
  );
}
