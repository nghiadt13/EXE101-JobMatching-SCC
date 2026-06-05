'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState, useTransition } from 'react';
import { JobListSidebar } from '@/components/jobs/job-list-sidebar';
import { JobListCard } from '@/components/jobs/job-list-card';
import { JobsActiveFilters } from '@/components/jobs/jobs-active-filters';
import { buildJobsSearchParams } from '@/lib/jobs-client';
import type { JobItem, JobsQuery, JobsListResponse } from '@/lib/jobs-client';

function buildSalaryText(min: number | null, max: number | null, negotiable?: boolean): string {
  if (negotiable || (min === null && max === null)) return 'Thỏa thuận';
  const toMillion = (v: number) => {
    const m = v / 1_000_000;
    return Number.isInteger(m) ? String(m) : m.toFixed(1);
  };
  if (min !== null && max !== null) return `${toMillion(min)} - ${toMillion(max)} triệu`;
  if (min !== null) return `Từ ${toMillion(min)} triệu`;
  if (max !== null) return `Đến ${toMillion(max)} triệu`;
  return 'Thỏa thuận';
}

function buildLocationLabel(
  location: Record<string, unknown> | null | undefined,
): string {
  if (!location) return 'Remote';
  if (location.remote === true) return 'Remote';
  const city = typeof location.city === 'string' ? location.city.trim() : '';
  const country = typeof location.country === 'string' ? location.country.trim() : '';
  if (city) return city;
  if (country) return country;
  return 'Remote';
}

function getTimeAgo(dateString: string | null): string {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return 'Hôm nay';
  if (diffDays === 1) return '1 ngày trước';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return '1 tuần trước';
  if (diffWeeks < 4) return `${diffWeeks} tuần trước`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return '1 tháng trước';
  return `${diffMonths} tháng trước`;
}

type JobListClientProps = {
  initialQuery: JobsQuery;
  initialJobs: JobItem[];
  initialTotal: number;
  initialPage: number;
  initialTotalPages: number;
  initialFacets: JobsListResponse['facets'] | null;
  isAuthenticated: boolean;
  user?: { name?: string | null; avatarUrl?: string | null } | null;
};

export function JobListClient({
  initialQuery,
  initialJobs,
  initialTotal,
  initialPage,
  initialTotalPages,
  initialFacets,
}: JobListClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(initialQuery.q ?? '');
  const [locationInput, setLocationInput] = useState(initialQuery.location ?? '');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Use SSR props directly — router.push triggers server re-render with fresh data
  const jobs = initialJobs;
  const totalItems = initialTotal;
  const currentPage = initialPage;
  const totalPages = initialTotalPages;
  const facets = initialFacets;

  const pushQuery = useCallback((updates: Partial<JobsQuery>) => {
    const merged: JobsQuery = { ...initialQuery, ...updates, page: updates.page ?? 1 };
    const params = buildJobsSearchParams(merged);
    params.set('includeFacets', 'true');
    startTransition(() => {
      router.push(`/jobs/list?${params.toString()}`);
    });
  }, [initialQuery, router]);

  const handleSearch = useCallback(() => {
    pushQuery({
      q: searchInput || undefined,
      location: locationInput || undefined,
    });
  }, [locationInput, searchInput, pushQuery]);

  const handleSortChange = useCallback((sort: string) => {
    pushQuery({ sort: sort as JobsQuery['sort'] });
  }, [pushQuery]);

  const handlePageChange = useCallback((page: number) => {
    pushQuery({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pushQuery]);

  const handleFilterChange = useCallback((filterKey: string, values: string[] | string | undefined) => {
    pushQuery({ [filterKey]: values, page: 1 });
  }, [pushQuery]);

  const handleClearAllFilters = useCallback(() => {
    pushQuery({
      q: initialQuery.q,
      categorySlugs: undefined,
      experienceLevels: undefined,
      companyIndustryKeys: undefined,
      jobFieldKeys: undefined,
      companyTypes: undefined,
      salaryBands: undefined,
      jobLevels: undefined,
      salesModels: undefined,
      customerTypes: undefined,
      workingDayStatus: undefined,
      searchScope: undefined,
      location: undefined,
      employmentTypes: undefined,
      remote: undefined,
      salaryMinGte: undefined,
      salaryMaxLte: undefined,
      postedWithinDays: undefined,
    });
  }, [initialQuery.q, pushQuery]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (initialQuery.categorySlugs?.length) count++;
    if (initialQuery.experienceLevels?.length) count++;
    if (initialQuery.companyIndustryKeys?.length) count++;
    if (initialQuery.jobFieldKeys?.length) count++;
    if (initialQuery.companyTypes?.length) count++;
    if (initialQuery.salaryBands?.length) count++;
    if (initialQuery.jobLevels?.length) count++;
    if (initialQuery.salesModels?.length) count++;
    if (initialQuery.customerTypes?.length) count++;
    if (initialQuery.workingDayStatus) count++;
    if (initialQuery.location) count++;
    if (initialQuery.employmentTypes?.length) count++;
    if (initialQuery.remote && initialQuery.remote !== 'any') count++;
    return count;
  }, [initialQuery]);

  return (
    <div className="job-list-page min-h-screen bg-background-light text-slate-900" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
      <div className="sticky top-20 z-40 border-b border-primary-100 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-[1180px] items-center gap-2 px-4 py-3">

          <div className="relative min-w-0 flex-1">
            <i className="fa-solid fa-magnifying-glass absolute top-1/2 left-3 -translate-y-1/2 text-xs text-primary-400" />
            <input
              type="text"
              className="h-10 w-full rounded-lg border border-primary-100 bg-white py-2 pr-3 pl-9 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              placeholder="Vị trí tuyển dụng"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleSearch();
              }}
            />
          </div>
          <div className="relative hidden min-w-0 flex-1 md:block">
            <i className="fa-solid fa-location-dot absolute top-1/2 left-3 -translate-y-1/2 text-xs text-primary-400" />
            <input
              type="text"
              className="h-10 w-full rounded-lg border border-primary-100 bg-white py-2 pr-8 pl-9 text-sm text-slate-700 outline-none placeholder:text-slate-500 focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              placeholder="Địa điểm"
              value={locationInput}
              onChange={(event) => setLocationInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleSearch();
              }}
            />
            <i className="fa-solid fa-chevron-down absolute top-1/2 right-3 -translate-y-1/2 text-[10px] text-primary-400" />
          </div>
          <button
            className="h-10 shrink-0 rounded-lg bg-primary-600 px-6 text-sm font-bold text-white transition-colors hover:bg-primary-700"
            type="button"
            onClick={handleSearch}
          >
            Tìm kiếm
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-[1180px] px-4 py-4">
        {/* Breadcrumb */}
        <nav className="mb-2 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-primary-600">Trang chủ</Link>
          <i className="fa-solid fa-chevron-right text-[8px] text-gray-300" />
          <span className="font-medium text-slate-700">Việc làm</span>
          {initialQuery.q && (
            <>
              <i className="fa-solid fa-chevron-right text-[8px] text-gray-300" />
              <span className="font-medium text-slate-700">{initialQuery.q}</span>
            </>
          )}
        </nav>

        {/* Job count header */}
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <p className="text-sm text-slate-700">
            Tuyển dụng <span className="font-bold text-primary-600">{totalItems.toLocaleString('vi-VN')}</span> việc làm
            {initialQuery.q && <span className="font-medium"> {initialQuery.q}</span>}
            <span className="text-gray-400"> [Update {new Date().toLocaleDateString('vi-VN')}]</span>
            </p>
            {initialQuery.location ? (
              <div className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                Có việc làm tại <span className="ml-1 text-primary-700">{initialQuery.location}</span>. <span className="ml-1 text-primary-600">Xem ngay</span>
              </div>
            ) : null}
          </div>
          <button className="hidden h-9 items-center gap-2 rounded-full bg-white px-4 text-sm font-medium text-slate-600 shadow-sm md:flex" type="button">
            <i className="fa-regular fa-bell text-xs" />
            Tạo thông báo việc làm
          </button>
        </div>

        {/* Active filters */}
        {activeFilterCount > 0 && (
          <JobsActiveFilters
            query={initialQuery}
            facets={facets}
            onRemove={(key, value) => {
              const current = initialQuery[key as keyof JobsQuery];
              if (Array.isArray(current)) {
                handleFilterChange(key, (current as string[]).filter(v => v !== value));
              } else {
                handleFilterChange(key, undefined);
              }
            }}
            onClearAll={handleClearAllFilters}
          />
        )}

        {/* Mobile filter button */}
        <div className="mb-4 lg:hidden">
          <button
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary-200 bg-primary-50 py-2.5 text-sm font-semibold text-primary-700"
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
          >
            <i className="fa-solid fa-filter text-xs" />
            Bộ lọc {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
        </div>

        {/* Main 2-column layout */}
        <div className="flex gap-6">
          {/* Sidebar - desktop */}
          <aside className="hidden w-72 shrink-0 lg:block">
            <JobListSidebar
              query={initialQuery}
              facets={facets}
              onFilterChange={handleFilterChange}
              onClearAll={handleClearAllFilters}
            />
          </aside>

          {/* Job list */}
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Tìm kiếm theo:</span>
                {[
                  ['job', 'Tên việc làm'],
                  ['company', 'Tên công ty'],
                  ['both', 'Cả hai'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                      (initialQuery.searchScope ?? 'job') === value
                        ? 'border-primary-500 bg-white text-primary-700'
                        : 'border-transparent bg-slate-200/70 text-slate-600 hover:bg-white'
                    }`}
                    type="button"
                    onClick={() => pushQuery({ searchScope: value })}
                  >
                    {(initialQuery.searchScope ?? 'job') === value ? <i className="fa-solid fa-check mr-1 text-xs" /> : null}
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600"><i className="fa-solid fa-arrow-up-wide-short mr-1 text-xs" />Sắp xếp theo:</span>
                <select
                  className="h-9 rounded-full border-0 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm focus:ring-2 focus:ring-primary-100"
                  value={initialQuery.sort ?? 'newest'}
                  onChange={(event) => handleSortChange(event.target.value)}
                >
                  <option value="relevance">Search by AI</option>
                  <option value="newest">Mới nhất</option>
                  <option value="salary_desc">Lương cao đến thấp</option>
                  <option value="salary_asc">Lương thấp đến cao</option>
                  <option value="deadline_soon">Hạn nộp gần nhất</option>
                </select>
              </div>
            </div>
            <div className="space-y-3">
              {isPending ? (
                <div className="flex items-center justify-center py-20">
                  <i className="fa-solid fa-spinner fa-spin mr-2 text-2xl text-primary-500" />
                  <span className="text-gray-500">Đang tải...</span>
                </div>
              ) : jobs.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center">
                  <i className="fa-solid fa-briefcase mb-4 text-5xl text-gray-300" />
                  <h3 className="mb-2 text-lg font-bold text-gray-600">Không tìm thấy việc làm</h3>
                  <p className="text-sm text-gray-400">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                </div>
              ) : (
                jobs.map((job) => (
                  <JobListCard
                    key={job.id}
                    job={job}
                    salaryText={buildSalaryText(job.salaryMin, job.salaryMax, job.salaryNegotiable)}
                    locationLabel={buildLocationLabel(job.location as Record<string, unknown> | null)}
                    timeAgo={getTimeAgo(job.publishedAt)}
                  />
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && !isPending && (
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            )}
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black/40" onClick={() => setMobileDrawerOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-full max-w-sm overflow-y-auto bg-white p-5 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">Bộ lọc</h2>
                <button onClick={() => setMobileDrawerOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <i className="fa-solid fa-xmark text-xl" />
                </button>
              </div>
              <JobListSidebar
                query={initialQuery}
                facets={facets}
                onFilterChange={(key, values) => {
                  handleFilterChange(key, values);
                  setMobileDrawerOpen(false);
                }}
                onClearAll={() => {
                  handleClearAllFilters();
                  setMobileDrawerOpen(false);
                }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (p: number) => void }) {
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);
  start = Math.max(1, end - maxVisible + 1);
  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <button
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-primary-400 hover:text-primary-600 disabled:opacity-40"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <i className="fa-solid fa-chevron-left text-xs" />
      </button>
      {pages.map(page => (
        <button
          key={page}
          className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium ${
            page === currentPage
              ? 'bg-primary-600 text-white shadow-sm'
              : 'border border-gray-200 text-gray-600 hover:border-primary-400 hover:text-primary-600'
          }`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}
      <button
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-primary-400 hover:text-primary-600 disabled:opacity-40"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <i className="fa-solid fa-chevron-right text-xs" />
      </button>
    </div>
  );
}
