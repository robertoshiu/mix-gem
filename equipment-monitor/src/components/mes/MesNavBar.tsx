'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard' },
  { href: '/mes/war-room', label: 'War Room', icon: Activity },
  { href: '/mes/fab-floor', label: 'Fab Floor', icon: Activity },
  { href: '/mes/fab-twin', label: 'Fab Twin', icon: Activity },
  { href: '/mes/ar-tracking', label: 'AR Tracking', icon: Activity },
  { href: '/mes/surveillance', label: 'Surveillance', icon: Activity },
  { href: '/mes/equipment', label: 'Equipment' },
  { href: '/mes/lots', label: 'Lot Tracker' },
  { href: '/mes/recipes', label: 'Recipe Manager' },
  { href: '/mes/spc', label: 'SPC Dashboard' },
  { href: '/mes/analytics', label: 'Analytics', icon: Activity },
  { href: '/mes/secs-gem', label: 'SECS/GEM Sim', icon: Activity },
];

export function MesNavBar() {
  const pathname = usePathname() ?? '/';

  return (
    <nav
      className="flex border-b border-[var(--smartfactory-border-default)] bg-[var(--smartfactory-surface-card)] px-4 overflow-x-auto"
      aria-label="MES navigation"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'min-h-[44px] flex items-center gap-2 px-4 text-sm font-medium whitespace-nowrap transition-colors',
              isActive
                ? 'border-b-2 border-[var(--smartfactory-border-active)] text-[var(--smartfactory-text-primary)]'
                : 'text-[var(--smartfactory-text-secondary)] hover:text-[var(--smartfactory-text-primary)]'
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
