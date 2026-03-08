import { cn } from '@/lib/cn';

type DashboardStatCardProps = {
  label: string;
  value: number | string;
  hint?: string;
  className?: string;
};

export function DashboardStatCard({ label, value, hint, className }: DashboardStatCardProps) {
  return (
    <div className={cn('rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm', className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-zinc-950">{value}</p>
      {hint ? <p className="mt-2 text-sm text-zinc-600">{hint}</p> : null}
    </div>
  );
}

export function DashboardStatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm', className)}>
      <div className="h-3 w-16 rounded bg-zinc-200" />
      <div className="mt-4 h-8 w-12 rounded bg-zinc-200" />
      <div className="mt-3 h-3 w-24 rounded bg-zinc-200" />
    </div>
  );
}