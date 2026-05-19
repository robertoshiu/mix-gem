"use client";

import { useRef } from "react";
import { useEquipmentStore } from "@/stores/equipment-store";
import { EquipmentCard } from "./equipment-card";
import { cn } from "@/lib/utils";

interface EquipmentSidebarProps {
  className?: string;
}

export function EquipmentSidebar({ className }: EquipmentSidebarProps) {
  const { equipment, selectedEquipmentId, selectEquipment } = useEquipmentStore();
  const listRef = useRef<HTMLDivElement>(null);

  // Sort: alarms first, then warnings, then by name
  const sortedEquipment = [...equipment].sort((a, b) => {
    const priority: Record<string, number> = { 
      alarm: 0, 
      warning: 1, 
      process: 2, 
      idle: 3, 
      pm: 4, 
      offline: 5 
    };
    const pA = priority[a.status] ?? 99;
    const pB = priority[b.status] ?? 99;
    const priorityDiff = pA - pB;
    if (priorityDiff !== 0) return priorityDiff;
    return a.name.localeCompare(b.name);
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedEquipmentId && equipment.length > 0) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            selectEquipment(sortedEquipment[0].id);
            return;
        }
    }

    const currentIndex = sortedEquipment.findIndex((eq) => eq.id === selectedEquipmentId);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = currentIndex < sortedEquipment.length - 1 ? currentIndex + 1 : 0;
      selectEquipment(sortedEquipment[nextIndex].id);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : sortedEquipment.length - 1;
      selectEquipment(sortedEquipment[prevIndex].id);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      selectEquipment(null);
    }
  };

  return (
    <div
      ref={listRef}
      className={cn(
        "w-70 bg-slate-900 border-r border-slate-700 overflow-y-auto focus:outline-none focus:ring-2 focus:ring-blue-500",
        className
      )}
      role="list"
      aria-label="Equipment list"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold text-slate-50">Equipment</h2>
        <p className="text-sm text-slate-400">
          {equipment.filter((e) => e.status === "alarm").length} alarms
        </p>
      </div>

      <div className="p-2 space-y-2">
        {sortedEquipment.map((eq) => (
          <EquipmentCard
            key={eq.id}
            equipment={eq}
            isSelected={selectedEquipmentId === eq.id}
            onClick={() => selectEquipment(eq.id)}
            data-equipment-id={eq.id}
            data-selected={selectedEquipmentId === eq.id}
          />
        ))}
      </div>
    </div>
  );
}
