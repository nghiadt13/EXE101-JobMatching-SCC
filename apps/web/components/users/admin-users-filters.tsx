'use client';

import { useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { cn } from '@/lib/cn';

type RoleFilter = 'ALL' | 'ADMIN' | 'RECRUITER' | 'CANDIDATE';

const roleFilters: { label: string; value: RoleFilter }[] = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Candidate', value: 'CANDIDATE' },
  { label: 'Recruiter', value: 'RECRUITER' },
  { label: 'Admin', value: 'ADMIN' },
];

type AdminUsersFiltersProps = {
  currentSearch: string;
  currentRole: string;
};

export function AdminUsersFilters({
  currentSearch,
  currentRole,
}: AdminUsersFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== 'ALL' && key === 'role') {
        params.set(key, value);
      } else if (value && key === 'search') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      if (key !== 'page') {
        params.delete('page');
      }
      router.push(`/dashboard/admin/users?${params.toString()}`);
    },
    [router, searchParams],
  );

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        updateParam('search', value);
      }, 300);
    },
    [updateParam],
  );

  const handleRoleFilter = useCallback(
    (role: RoleFilter) => {
      updateParam('role', role);
    },
    [updateParam],
  );

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      {/* Search Box */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          defaultValue={currentSearch}
          onChange={handleSearch}
          placeholder="Tìm theo email, tên..."
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 py-2 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-400 transition-all focus:border-primary-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
      </div>

      {/* Role Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
        <span className="whitespace-nowrap text-xs font-semibold text-zinc-500">
          Vai trò:
        </span>
        {roleFilters.map(({ label, value }) => {
          const isActive =
            value === 'ALL'
              ? !currentRole || currentRole === 'ALL'
              : currentRole === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => handleRoleFilter(value)}
              className={cn(
                'whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                isActive
                  ? 'bg-primary-50 text-primary-700 border border-primary-200/50'
                  : 'text-zinc-600 hover:bg-zinc-50',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
