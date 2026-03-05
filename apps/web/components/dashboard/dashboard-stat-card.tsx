type DashboardStatCardProps = {
  label: string;
  value: number;
  hint?: string;
};

export function DashboardStatCard({
  label,
  value,
  hint,
}: DashboardStatCardProps) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-zinc-900">{value}</p>
      {hint ? <p className="mt-2 text-sm text-zinc-600">{hint}</p> : null}
    </article>
  );
}

export function DashboardStatCardSkeleton() {
  return (
    <article className="animate-pulse rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="h-3 w-24 rounded bg-zinc-200" />
      <div className="mt-3 h-9 w-16 rounded bg-zinc-200" />
      <div className="mt-3 h-4 w-32 rounded bg-zinc-100" />
    </article>
  );
}