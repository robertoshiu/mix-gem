"use client";

import { Equipment } from "@/types/equipment";
import { EquipmentCard } from "./equipment-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronUp } from "lucide-react";
import { StatusIndicator } from "@/components/ui/status-indicator";

interface EquipmentBottomSheetProps {
  equipment: Equipment[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function EquipmentBottomSheet({
  equipment,
  selectedId,
  onSelect,
}: EquipmentBottomSheetProps) {
  const selectedEquipment = equipment.find((e) => e.id === selectedId);
  const alarmCount = equipment.filter((e) => e.status === "alarm").length;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="fixed bottom-4 left-4 right-4 h-14 bg-slate-900 border-slate-700 justify-between md:hidden"
        >
          <div className="flex items-center gap-2">
            {selectedEquipment && (
              <>
                <StatusIndicator status={selectedEquipment.status} />
                <span className="font-medium">{selectedEquipment.name}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {alarmCount > 0 && (
              <span className="text-sm text-red-400">{alarmCount} alarms</span>
            )}
            <ChevronUp className="w-5 h-5" />
          </div>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-slate-50">Select Equipment</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
          {equipment.map((eq) => (
            <DialogTrigger key={eq.id} asChild>
              <div>
                <EquipmentCard
                  equipment={eq}
                  isSelected={selectedId === eq.id}
                  onClick={() => onSelect(eq.id)}
                />
              </div>
            </DialogTrigger>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
