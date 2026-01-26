import { Card } from '@/components/ui/card';

export function LoadingChart({ title }: { title?: string }) {
  return (
    <Card className="p-4">
      {title && <div className="text-sm text-slate-400 mb-2">{title}</div>}
      <div className="animate-pulse">
        <div className="h-48 bg-slate-800 rounded" />
      </div>
    </Card>
  );
}
