'use client';

import dynamic from 'next/dynamic';
import { ReactNode, Suspense } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { WebGLFallback } from './WebGLFallback';

const R3FCanvas = dynamic(
  () => import('@react-three/fiber').then((mod) => ({ default: mod.Canvas })),
  { ssr: false },
);

interface FactoryCanvasProps {
  children: ReactNode;
  className?: string;
}

function CanvasLoadingFallback() {
  return (
    <div
      className="flex items-center justify-center h-full w-full"
      style={{ backgroundColor: 'var(--sf-bg-canvas, #0B0F19)' }}
    >
      <p
        className="animate-pulse text-sm"
        style={{ color: 'var(--sf-text-muted, #475569)' }}
      >
          Loading 3D scene...
      </p>
    </div>
  );
}

function CanvasErrorFallback() {
  return <WebGLFallback />;
}

export function FactoryCanvas({ children, className }: FactoryCanvasProps) {
  return (
    <ErrorBoundary fallback={<CanvasErrorFallback />}>
      <Suspense fallback={<CanvasLoadingFallback />}>
        <R3FCanvas
          className={className}
          frameloop="demand"
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false }}
          style={{ backgroundColor: 'var(--sf-bg-canvas, #0B0F19)' }}
        >
          {children}
        </R3FCanvas>
      </Suspense>
    </ErrorBoundary>
  );
}
