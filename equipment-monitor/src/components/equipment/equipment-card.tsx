"use client";

import { cn } from "@/lib/utils";
import { Equipment } from "@/types/equipment";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Card } from "@/components/ui/card";
import { Activity, Layers } from "lucide-react";

interface EquipmentCardProps {
  equipment: Equipment;
  isSelected?: boolean;
  onClick?: () => void;
}

export function EquipmentCard({
  equipment,
  isSelected = false,
  onClick,
}: EquipmentCardProps) {
  const borderColor = {
    normal: "border-l-emerald-500",
    warning: "border-l-amber-500",
    alarm: "border-l-red-500",
    idle: "border-l-blue-400",
    offline: "border-l-slate-500",
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={cn(
        "p-4 cursor-pointer transition-colors duration-200",
        "border-l-4 border-slate-700",
        "hover:bg-slate-800",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950",
        isSelected && "bg-slate-800",
        isSelected && borderColor[equipment.status],
        equipment.status === "alarm" && "bg-red-500/5"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <StatusIndicator status={equipment.status} size="md" />
          <span className="font-semibold text-slate-50">{equipment.name}</span>
        </div>
        {equipment.status === "alarm" && (
          <span className="text-xs font-medium text-red-400 uppercase">Alarm</span>
        )}
      </div>

      {equipment.currentRecipe && (
        <div className="flex items-center gap-1 text-sm text-slate-400 mb-1">
          <Activity className="w-4 h-4" />
          <span>{equipment.currentRecipe}</span>
        </div>
      )}

      <div className="flex items-center gap-1 text-sm text-slate-500">
        <Layers className="w-4 h-4" />
        <span>{equipment.waferCount} wafers</span>
      </div>
    </Card>
  );
}
