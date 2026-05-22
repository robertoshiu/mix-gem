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
    <div className="border border-[var(--smartfactory-border-default)] rounded bg-[var(--smartfactory-surface-card)]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--smartfactory-text-muted)]">{open ? '▾' : '▸'}</span>
          <span className="text-sm font-semibold text-[var(--smartfactory-text-primary)]">{title}</span>
          <span className="text-xs text-[var(--smartfactory-text-secondary)]">{summary}</span>
        </div>
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}
