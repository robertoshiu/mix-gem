'use client';

import { AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface WebGLFallbackProps {
  /** Optional link for troubleshooting or documentation */
  learnMoreHref?: string;
}

/**
 * Fallback card displayed when WebGL is unavailable.
 * Uses dark theme CSS tokens (var(--sf-*)).
 */
export function WebGLFallback({
  learnMoreHref = '#',
}: WebGLFallbackProps) {
  return (
    <Card
      role="alert"
      aria-label="WebGL not available"
      className="flex h-full min-h-[420px] w-full flex-col items-center justify-center gap-4 rounded-none border-0 p-8 text-center"
      style={{
        background:
          'radial-gradient(circle at 50% 20%, rgba(59,130,246,0.16), transparent 34%), var(--sf-bg-canvas, #0B0F19)',
        borderColor: 'var(--sf-border-default, #1E3A5F)',
        color: 'var(--sf-text-primary, #e2e8f0)',
      }}
    >
      <AlertTriangle
        className="h-12 w-12"
        style={{ color: 'var(--sf-status-amber, #f59e0b)' }}
        aria-hidden="true"
      />
      <h2
        className="text-lg font-semibold"
        style={{ color: 'var(--sf-text-primary, #e2e8f0)' }}
      >
        WebGL Not Available
      </h2>
      <p
        className="max-w-sm text-sm"
        style={{ color: 'var(--sf-text-secondary, #94a3b8)' }}
      >
        WebGL is required for 3D visualization. Please use a modern browser or
        enable hardware acceleration.
      </p>
      <a
        href={learnMoreHref}
        className="text-sm underline underline-offset-4 transition-colors hover:opacity-80"
        style={{ color: 'var(--sf-accent-cyan, #22D3EE)' }}
        aria-label="Learn more about WebGL requirements"
      >
        Learn more
      </a>
    </Card>
  );
}
