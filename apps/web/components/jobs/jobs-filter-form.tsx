'use client';

import { useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { type JobsQuery } from '@/lib/jobs-client';
import { JobsSortSelect } from './jobs-sort-select';

type JobsFilterFormProps = {
  query: JobsQuery;
};

export function JobsFilterForm({ query }: JobsFilterFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function navigateWithForm(formData: FormData) {
    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('limit', String(query.limit ?? 20));

    const q = String(formData.get('q') ?? '').trim();
    if (q) params.set('q', q);
    const sort = String(formData.get('sort') ?? '').trim();
    if (sort) params.set('sort', sort);
    const employmentTypes = String(formData.get('employmentTypes') ?? '').trim();
    if (employmentTypes) params.set('employmentTypes', employmentTypes);
    const remote = String(formData.get('remote') ?? 'any').trim();
    if (remote && remote !== 'any') params.set('remote', remote);
    const salaryMinGte = String(formData.get('salaryMinGte') ?? '').trim();
    if (salaryMinGte) params.set('salaryMinGte', salaryMinGte);
    const salaryMaxLte = String(formData.get('salaryMaxLte') ?? '').trim();
    if (salaryMaxLte) params.set('salaryMaxLte', salaryMaxLte);
    const postedWithinDays = String(formData.get('postedWithinDays') ?? '').trim();
    if (postedWithinDays) params.set('postedWithinDays', postedWithinDays);

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <form
      className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
      action={(formData) => navigateWithForm(formData)}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm text-zinc-700">
          <span className="font-medium">Keyword</span>
          <input
            type="search"
            name="q"
            defaultValue={query.q ?? query.search ?? ''}
            placeholder="e.g. backend, nestjs"
            className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
          />
        </label>
        <label className="space-y-1 text-sm text-zinc-700">
          <span className="font-medium">Sort</span>
          <JobsSortSelect value={query.sort ?? 'newest'} />
        </label>
        <label className="space-y-1 text-sm text-zinc-700">
          <span className="font-medium">Employment types (CSV)</span>
          <input
            type="text"
            name="employmentTypes"
            defaultValue={query.employmentTypes?.join(',') ?? ''}
            placeholder="FULL_TIME,PART_TIME"
            className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
          />
        </label>
        <label className="space-y-1 text-sm text-zinc-700">
          <span className="font-medium">Remote</span>
          <select
            name="remote"
            defaultValue={query.remote ?? 'any'}
            className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
          >
            <option value="any">Any</option>
            <option value="true">Remote only</option>
            <option value="false">On-site only</option>
          </select>
        </label>
        <label className="space-y-1 text-sm text-zinc-700">
          <span className="font-medium">Salary min</span>
          <input
            type="number"
            name="salaryMinGte"
            defaultValue={query.salaryMinGte ?? ''}
            placeholder="1000"
            min={0}
            className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
          />
        </label>
        <label className="space-y-1 text-sm text-zinc-700">
          <span className="font-medium">Salary max</span>
          <input
            type="number"
            name="salaryMaxLte"
            defaultValue={query.salaryMaxLte ?? ''}
            placeholder="5000"
            min={0}
            className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
          />
        </label>
        <label className="space-y-1 text-sm text-zinc-700">
          <span className="font-medium">Posted within</span>
          <select
            name="postedWithinDays"
            defaultValue={query.postedWithinDays ? String(query.postedWithinDays) : ''}
            className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
          >
            <option value="">Any time</option>
            <option value="1">1 day</option>
            <option value="3">3 days</option>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
          </select>
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Applying...' : 'Apply filters'}
        </Button>
        <Button asChild variant="outline">
          <Link href={pathname}>Reset</Link>
        </Button>
      </div>
    </form>
  );
}
