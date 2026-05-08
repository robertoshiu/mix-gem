"use client";

import type { ProcessParameter } from "@/types/equipment";
import { safeRange } from "@/lib/gauge-geometry";
import { CyberpunkGaugeCard } from "./cyberpunk-gauge-card";

interface GaugeCardProps {
  parameter: ProcessParameter;
  className?: string;
}

type GaugeStatus = "normal" | "warning" | "alarm";

function getStatus(value: number, lsl: number, usl: number): GaugeStatus {
  const range = safeRange(lsl, usl);
  const warningThreshold = range * 0.2;

  if (value < lsl || value > usl) return "alarm";
  if (value < lsl + warningThreshold || value > usl - warningThreshold) return "warning";
  return "normal";
}

export function GaugeCard({ parameter, className }: GaugeCardProps) {
  const { name, value, unit, lsl, usl } = parameter;
  const status = getStatus(value, lsl, usl);

  return (
    <CyberpunkGaugeCard
      title={name}
      value={value}
      unit={unit}
      lsl={lsl}
      usl={usl}
      status={status}
      className={className}
    />
  );
}
