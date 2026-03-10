import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { buildJobsSearchParams, type JobsQuery } from '@/lib/jobs-client';

type JobsActiveFiltersProps = {
  query: JobsQuery;
};

function buildClearLink(query: JobsQuery, key: keyof JobsQuery, value?: string) {
  const next: JobsQuery = { ...query, page: 1 };
  if (key === 'employmentTypes' && value && Array.isArray(next.employmentTypes)) {
    next.employmentTypes = next.employmentTypes.filter((entry) => entry !== value);
    if (next.employmentTypes.length === 0) {
      delete next.employmentTypes;
    }
  } else {
    delete next[key];
  }
  const params = buildJobsSearchParams(next);
  return `/jobs?${params.toString()}`;
}

export function JobsActiveFilters({ query }: JobsActiveFiltersProps) {
  const chips: Array<{ label: string; href: string }> = [];
  if (query.q) {
    chips.push({ label: `q: ${query.q}`, href: buildClearLink(query, 'q') });
  }
  if (query.remote && query.remote !== 'any') {
    chips.push({ label: `remote: ${query.remote}`, href: buildClearLink(query, 'remote') });
  }
  if (query.salaryMinGte !== undefined) {
    chips.push({
      label: `min >= ${query.salaryMinGte}`,
      href: buildClearLink(query, 'salaryMinGte'),
    });
  }
  if (query.salaryMaxLte !== undefined) {
    chips.push({
      label: `max <= ${query.salaryMaxLte}`,
      href: buildClearLink(query, 'salaryMaxLte'),
    });
  }
  if (query.postedWithinDays !== undefined) {
    chips.push({
      label: `posted ${query.postedWithinDays}d`,
      href: buildClearLink(query, 'postedWithinDays'),
    });
  }
  for (const type of query.employmentTypes ?? []) {
    chips.push({
      label: `type: ${type}`,
      href: buildClearLink(query, 'employmentTypes', type),
    });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Link key={chip.label} href={chip.href} className="inline-flex">
          <Badge variant="outline">{chip.label} ×</Badge>
        </Link>
      ))}
      <Link href="/jobs" className="text-xs font-medium text-zinc-600 underline">
        Clear all
      </Link>
    </div>
  );
}
