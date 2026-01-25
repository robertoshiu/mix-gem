"use client";

import { Bell, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface HeaderProps {
  alarmCount?: number;
  className?: string;
}

export function Header({ alarmCount = 0, className }: HeaderProps) {
  return (
    <header
      className={cn(
        "h-14 px-4 flex items-center justify-between",
        "bg-slate-900 border-b border-slate-700",
        "sticky top-0 z-50",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center">
          <span className="text-white font-bold text-sm">EM</span>
        </div>
        <h1 className="text-lg font-semibold text-slate-50">
          Equipment Monitor
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative text-slate-400 hover:text-slate-50 hover:bg-slate-800"
          aria-label={`Alerts: ${alarmCount} active`}
        >
          <Bell className="w-5 h-5" />
          {alarmCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs"
            >
              {alarmCount > 99 ? "99+" : alarmCount}
            </Badge>
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-slate-50 hover:bg-slate-800"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-slate-50 hover:bg-slate-800"
          aria-label="User profile"
        >
          <User className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
