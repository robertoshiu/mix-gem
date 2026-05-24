"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMesSpcStore } from "@/stores/mes-spc-store";
import { NotificationPanel } from "@/components/spc/NotificationPanel";

export function Header({ className }: { className?: string }) {
  const [clock, setClock] = useState("--:--:--");
  const iconAreaRef = useRef<HTMLDivElement>(null);

  const notifications = useMesSpcStore((s) => s.notifications);
  const isNotificationPanelOpen = useMesSpcStore((s) => s.isNotificationPanelOpen);
  const isSettingsPanelOpen = useMesSpcStore((s) => s.isSettingsPanelOpen);
  const isUserDropdownOpen = useMesSpcStore((s) => s.isUserDropdownOpen);
  const toggleNotificationPanel = useMesSpcStore((s) => s.toggleNotificationPanel);
  const toggleSettingsPanel = useMesSpcStore((s) => s.toggleSettingsPanel);
  const toggleUserDropdown = useMesSpcStore((s) => s.toggleUserDropdown);
  const closeAllPanels = useMesSpcStore((s) => s.closeAllPanels);

  const anyPanelOpen = isNotificationPanelOpen || isSettingsPanelOpen || isUserDropdownOpen;

  // Live clock
  useEffect(() => {
    const updateClock = () => {
      setClock(
        new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    };
    const initialId = window.setTimeout(updateClock, 0);
    const id = setInterval(() => {
      updateClock();
    }, 1000);
    return () => {
      window.clearTimeout(initialId);
      clearInterval(id);
    };
  }, []);

  // Click-outside handler
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!anyPanelOpen) return;
      if (iconAreaRef.current && !iconAreaRef.current.contains(e.target as Node)) {
        closeAllPanels();
      }
    },
    [anyPanelOpen, closeAllPanels]
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [handleMouseDown]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <header
        className={cn(
          "h-14 px-4 flex items-center justify-between",
          "bg-[var(--smartfactory-bg-canvas)] border-b border-[var(--smartfactory-border-default)]",
          "sticky top-0 z-50",
          className
        )}
      >
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3">
          <Image
            src="/mix-gem/better-logo.png"
            width={48}
            height={48}
            className="shrink-0"
            alt="Better SmartFactory Logo"
            priority
          />
          <div className="flex flex-col leading-tight">
            <h1 className="text-sm font-semibold text-[var(--smartfactory-text-primary)]">
              Equipment Monitor
            </h1>
            <span className="text-[11px] text-[var(--smartfactory-text-secondary)]">
              Better SmartFactory
            </span>
          </div>
        </div>

        {/* Center: Live Clock */}
        <div
          className="font-['Fira_Code',monospace] text-sm text-[var(--smartfactory-text-secondary)] tabular-nums"
          data-testid="header-clock"
        >
          {clock}
        </div>

        {/* Right: Icon buttons */}
        <div ref={iconAreaRef} className="relative flex items-center gap-1">
          {/* Bell / Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "relative",
              isNotificationPanelOpen
                ? "text-[var(--smartfactory-accent-blue)]"
                : "text-[var(--smartfactory-text-secondary)]",
              "hover:text-[var(--smartfactory-text-primary)] hover:bg-[var(--smartfactory-surface-elevated)]"
            )}
            onClick={toggleNotificationPanel}
            aria-label="Notifications"
            data-testid="bell-icon"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              isSettingsPanelOpen
                ? "text-[var(--smartfactory-accent-blue)]"
                : "text-[var(--smartfactory-text-secondary)]",
              "hover:text-[var(--smartfactory-text-primary)] hover:bg-[var(--smartfactory-surface-elevated)]"
            )}
            onClick={toggleSettingsPanel}
            aria-label="Settings"
            data-testid="settings-icon"
          >
            <Settings className="w-5 h-5" />
          </Button>

          {/* User avatar */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "relative",
              isUserDropdownOpen
                ? "text-[var(--smartfactory-accent-blue)]"
                : "text-[var(--smartfactory-text-secondary)]",
              "hover:text-[var(--smartfactory-text-primary)] hover:bg-[var(--smartfactory-surface-elevated)]"
            )}
            onClick={toggleUserDropdown}
            aria-label="User"
            data-testid="user-icon"
          >
            <div className="w-7 h-7 rounded-full bg-[var(--smartfactory-accent-blue)] flex items-center justify-center text-white text-xs font-bold">
              AC
            </div>
          </Button>

          {isNotificationPanelOpen && <NotificationPanel />}
          {isSettingsPanelOpen && (
            <div className="absolute top-full right-12 mt-2 w-80 border border-[var(--smartfactory-border-default)] bg-[var(--smartfactory-surface-card)] rounded-b-lg shadow-lg p-4 z-40">
              <p className="text-sm text-[var(--smartfactory-text-primary)] font-medium">Settings Panel</p>
            </div>
          )}
          {isUserDropdownOpen && (
            <div className="absolute top-full right-4 mt-2 w-56 border border-[var(--smartfactory-border-default)] bg-[var(--smartfactory-surface-card)] rounded-b-lg shadow-lg p-4 z-40">
              <p className="text-sm text-[var(--smartfactory-text-primary)] font-medium">User Profile</p>
              <p className="text-xs text-[var(--smartfactory-text-secondary)]">Admin User (AC)</p>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
