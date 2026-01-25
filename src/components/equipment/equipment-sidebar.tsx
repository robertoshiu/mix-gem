"use client";

import { Equipment } from "@/types/equipment";
import { EquipmentCard } from "./equipment-card";
import { cn } from "@/lib/utils";

interface EquipmentSidebarProps {
  equipment: Equipment[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

export function EquipmentSidebar({
  equipment,
  selectedId,
  onSelect,
  className,
}: EquipmentSidebarProps) {
  // Sort: alarms first, then warnings, then by name
  const sortedEquipment = [...equipment].sort((a, b) => {
    const priority = { alarm: 0, warning: 1, normal: 2, idle: 3, offline: 4 };
    const priorityDiff = priority[a.status] - priority[b.status];
    if (priorityDiff !== 0) return priorityDiff;
    return a.name.localeCompare(b.name);
  });

  return (
    <aside
      className={cn(
        "w-72 bg-slate-900 border-r border-slate-700 overflow-y-auto",
        className
      )}
      aria-label="Equipment list"
    >
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold text-slate-50">Equipment</h2>
        <p className="text-sm text-slate-400">
          {equipment.filter((e) => e.status === "alarm").length} alarms
        </p>
      </div>

      <nav className="p-2 space-y-2" role="listbox" aria-label="Select equipment">
        {sortedEquipment.map((eq) => (
          <EquipmentCard
            key={eq.id}
            equipment={eq}
            isSelected={selectedId === eq.id}
            onClick={() => onSelect(eq.id)}
          />
        ))}
      </nav>
    </aside>
  );
}
