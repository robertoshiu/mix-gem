"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMesSpcStore } from "@/stores/mes-spc-store";
import { NotificationPanel } from "@/components/spc/NotificationPanel";
import { InstallButton } from "@/components/pwa/InstallButton";

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
          {/* Silicon-wafer mark — disc + primary flat + die grid, DESIGN.md primary accent cyan #22D3EE */}
          <svg
            width={48}
            height={48}
            viewBox="0 0 48 48"
            fill="none"
            className="shrink-0"
            role="img"
            aria-label="Silicon wafer"
          >
            <defs>
              {/* Wafer disc with a primary flat on the bottom edge */}
              <clipPath id="waferDisc">
                <path d="M17.76 43 A20 20 0 1 1 30.24 43 Z" />
              </clipPath>
            </defs>
            {/* faint disc glow */}
            <path d="M17.76 43 A20 20 0 1 1 30.24 43 Z" fill="#22D3EE" fillOpacity="0.07" />
            {/* die grid, clipped to the disc */}
            <g clipPath="url(#waferDisc)" stroke="#22D3EE" strokeOpacity="0.38" strokeWidth="1">
              <path d="M12 4 V44 M18 4 V44 M24 4 V44 M30 4 V44 M36 4 V44" />
              <path d="M4 12 H44 M4 18 H44 M4 24 H44 M4 30 H44 M4 36 H44" />
            </g>
            {/* disc outline + flat */}
            <path
              d="M17.76 43 A20 20 0 1 1 30.24 43 Z"
              stroke="#22D3EE"
              strokeWidth="1.75"
              strokeLinejoin="round"
            />
          </svg>
          <div className="flex flex-col leading-tight">
            <h1 className="text-sm font-semibold text-[var(--smartfactory-text-primary)]">
              Equipment Monitor
            </h1>
            <span className="text-[11px] text-[var(--smartfactory-text-secondary)]">
              Semiconductor SmartFactory
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
          <InstallButton />
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
