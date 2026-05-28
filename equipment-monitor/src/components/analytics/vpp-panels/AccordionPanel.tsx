'use client';

import { useState } from 'react';

interface Props {
  title: string;
  summary: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}

export function AccordionPanel({ title, summary, defaultOpen, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-[rgba(34,211,238,0.22)] bg-[rgba(2,6,23,0.66)] shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex min-h-[44px] w-full items-center justify-between rounded-2xl px-4 py-3 text-left outline-none transition-colors hover:bg-[rgba(34,211,238,0.06)] focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F19]"
      >
        <div className="flex items-center gap-3">
          <span aria-hidden className="text-sm text-[var(--sf-accent-cyan)]">
            {open ? '▾' : '▸'}
          </span>
          <span className="text-sm font-semibold text-[var(--sf-text-primary)]">{title}</span>
          <span className="text-sm text-[var(--sf-text-secondary)]">{summary}</span>
        </div>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}
