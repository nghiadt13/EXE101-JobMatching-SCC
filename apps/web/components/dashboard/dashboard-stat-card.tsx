import Link from 'next/link';
import { cn } from '@/lib/cn';

type DashboardStatCardProps = {
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
  className?: string;
};

export function DashboardStatCard({ label, value, hint, href, className }: DashboardStatCardProps) {
  const inner = (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
      {hint ? <p className="mt-2 text-sm text-slate-600">{hint}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          'block rounded-2xl border border-primary-100 bg-white p-5 shadow-sm transition-colors hover:border-primary-200 hover:bg-primary-50/40',
          className,
        )}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className={cn('rounded-2xl border border-primary-100 bg-white p-5 shadow-sm', className)}>
      {inner}
    </div>
  );
}


export function DashboardStatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-2xl border border-primary-100 bg-white p-5 shadow-sm', className)}>
      <div className="h-3 w-16 rounded bg-primary-100" />
      <div className="mt-4 h-8 w-12 rounded bg-primary-100" />
      <div className="mt-3 h-3 w-24 rounded bg-primary-100" />
    </div>
  );
}
