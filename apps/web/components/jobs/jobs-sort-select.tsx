'use client';

import { type JobsSort } from '@/lib/jobs-client';

type JobsSortSelectProps = {
  value: JobsSort;
  name?: string;
  className?: string;
};

export function JobsSortSelect({ value, name = 'sort', className }: JobsSortSelectProps) {
  return (
    <select
      name={name}
      defaultValue={value}
      className={
        className ??
        'h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2'
      }
    >
      <option value="newest">Newest</option>
      <option value="salary_desc">Salary: high to low</option>
      <option value="salary_asc">Salary: low to high</option>
    </select>
  );
}
