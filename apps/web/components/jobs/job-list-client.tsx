'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SiteHeader } from '@/components/layout/site-header';
import { JobListSidebar } from '@/components/jobs/job-list-sidebar';
import { JobListCard } from '@/components/jobs/job-list-card';
import { getJobs } from '@/lib/jobs-client';
import type { JobItem, JobsQuery } from '@/lib/jobs-client';

const POPULAR_KEYWORDS = [
  'nhân viên kinh doanh',
  'sales admin',
  'sales',
  'thực tập sinh kinh doanh',
  'tư vấn tuyển sinh',
  'trình dược viên',
  'sales online',
  'nhân viên tư vấn',
  'marketing',
  'developer',
  'designer',
];

const SEARCH_TABS = [
  { key: 'job', label: 'Tên việc làm', icon: 'fa-solid fa-check' },
  { key: 'company', label: 'Tên công ty', icon: null },
  { key: 'both', label: 'Cả hai', icon: null },
] as const;

type SearchTabKey = (typeof SEARCH_TABS)[number]['key'];

export type JobListFilters = {
  categories: string[];
  businessType: string;
  customerType: string;
  experience: string;
  keyword: string;
};

const DEFAULT_FILTERS: JobListFilters = {
  categories: [],
  businessType: 'all',
  customerType: 'all',
  experience: 'all',
  keyword: '',
};

function buildSalaryText(min: number | null, max: number | null): string {
  const toMillion = (value: number) => {
    const million = value / 1_000_000;
    return Number.isInteger(million) ? String(million) : million.toFixed(1);
  };
  if (min !== null && max !== null) {
    return `${toMillion(min)} - ${toMillion(max)} triệu`;
  }
  if (min !== null) {
    return `Từ ${toMillion(min)} triệu`;
  }
  if (max !== null) {
    return `Đến ${toMillion(max)} triệu`;
  }
  return 'Thỏa thuận';
}

function buildLocationLabel(
  location: Record<string, unknown> | null | undefined,
): string {
  if (!location) return 'Remote';
  if (location.remote === true) return 'Remote';
  const city = typeof location.city === 'string' ? location.city.trim() : '';
  const country =
    typeof location.country === 'string' ? location.country.trim() : '';
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
  initialJobs: JobItem[];
  initialTotal: number;
  initialPage: number;
  initialTotalPages: number;
  isAuthenticated: boolean;
  user?: {
    name?: string | null;
    avatarUrl?: string | null;
    planName?: string | null;
  } | null;
};

export function JobListClient({
  initialJobs,
  initialTotal,
  initialPage,
  initialTotalPages,
  isAuthenticated,
  user,
}: JobListClientProps) {
  const [jobs, setJobs] = useState<JobItem[]>(initialJobs);
  const [totalItems, setTotalItems] = useState(initialTotal);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<JobListFilters>(DEFAULT_FILTERS);
  const [searchTab, setSearchTab] = useState<SearchTabKey>('job');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'salary_asc' | 'salary_desc'>('newest');

  const fetchJobs = useCallback(async (page: number, currentFilters: JobListFilters, sort: typeof sortBy) => {
    setIsLoading(true);
    try {
      const query: JobsQuery = {
        page,
        limit: 10,
        status: 'PUBLISHED',
        sort,
      };
      if (currentFilters.keyword) {
        query.q = currentFilters.keyword;
      }
      const response = await getJobs(query);
      setJobs(response.items);
      setTotalItems(response.pagination.totalItems);
      setCurrentPage(response.pagination.page);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch jobs', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFilterChange = useCallback((newFilters: JobListFilters) => {
    setFilters(newFilters);
    void fetchJobs(1, newFilters, sortBy);
  }, [fetchJobs, sortBy]);

  const handleSearch = useCallback(() => {
    const newFilters = { ...filters, keyword: searchInput };
    setFilters(newFilters);
    void fetchJobs(1, newFilters, sortBy);
  }, [filters, searchInput, fetchJobs, sortBy]);

  const handleKeywordClick = useCallback((keyword: string) => {
    setSearchInput(keyword);
    const newFilters = { ...filters, keyword };
    setFilters(newFilters);
    void fetchJobs(1, newFilters, sortBy);
  }, [filters, fetchJobs, sortBy]);

  const handleSortChange = useCallback((newSort: typeof sortBy) => {
    setSortBy(newSort);
    void fetchJobs(currentPage, filters, newSort);
  }, [currentPage, filters, fetchJobs]);

  const handlePageChange = useCallback((page: number) => {
    void fetchJobs(page, filters, sortBy);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [filters, sortBy, fetchJobs]);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div
      className="min-h-screen bg-gray-50 text-slate-900"
      style={{ fontFamily: 'var(--font-inter), sans-serif' }}
    >
      <SiteHeader isAuthenticated={isAuthenticated} user={user} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-primary-600">Trang chủ</Link>
          <i className="fa-solid fa-chevron-right text-[8px] text-gray-300" />
          <Link href="/jobs" className="hover:text-primary-600">Việc làm</Link>
          {filters.keyword && (
            <>
              <i className="fa-solid fa-chevron-right text-[8px] text-gray-300" />
              <span className="text-slate-700 font-medium">{filters.keyword}</span>
            </>
          )}
        </nav>

        {/* Job count header */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Tuyển dụng <span className="font-bold text-primary-600">{totalItems.toLocaleString('vi-VN')}</span>{' '}
            việc làm {filters.keyword && <span className="font-medium">{filters.keyword}</span>}{' '}
            <span className="text-gray-400">[Update {new Date().toLocaleDateString('vi-VN')}]</span>
          </p>
        </div>

        {/* Keyword pills */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
          <span className="shrink-0 text-xs text-gray-400">Từ khóa gợi ý:</span>
          {POPULAR_KEYWORDS.map((keyword) => (
            <button
              key={keyword}
              className="keyword-pill shrink-0"
              type="button"
              onClick={() => handleKeywordClick(keyword)}
            >
              {keyword}
            </button>
          ))}
        </div>

        {/* Main 2-column layout */}
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden w-72 shrink-0 lg:block">
            <JobListSidebar
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </aside>

          {/* Job list */}
          <div className="min-w-0 flex-1">
            {/* Search + Sort bar */}
            <div className="mb-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                {/* Search tabs */}
                <div className="flex items-center gap-1">
                  <span className="mr-2 text-sm font-medium text-gray-500">Tìm kiếm theo:</span>
                  {SEARCH_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                        searchTab === tab.key
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      type="button"
                      onClick={() => setSearchTab(tab.key)}
                    >
                      {tab.icon && <i className={`${tab.icon} mr-1 text-xs`} />}
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Sắp xếp theo:</span>
                  <select
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}
                  >
                    <option value="newest">Mới nhất</option>
                    <option value="salary_desc">Lương cao → thấp</option>
                    <option value="salary_asc">Lương thấp → cao</option>
                  </select>
                </div>
              </div>

              {/* Search input */}
              <div className="mt-3 flex gap-2">
                <div className="relative flex-1">
                  <i className="fa-solid fa-magnifying-glass absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-gray-400 focus:border-primary-400 focus:bg-white focus:ring-1 focus:ring-primary-400"
                    placeholder="Nhập từ khóa tìm kiếm..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearch();
                    }}
                  />
                </div>
                <button
                  className="shrink-0 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-primary-700"
                  type="button"
                  onClick={handleSearch}
                >
                  Tìm kiếm
                </button>
              </div>
            </div>

            {/* Jobs list */}
            <div className="space-y-3">
              {isLoading ? (
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
                    salaryText={buildSalaryText(job.salaryMin, job.salaryMax)}
                    locationLabel={buildLocationLabel(
                      job.location as Record<string, unknown> | null,
                    )}
                    timeAgo={getTimeAgo(job.publishedAt)}
                  />
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && !isLoading && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-all hover:border-primary-400 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-40"
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  <i className="fa-solid fa-chevron-left text-xs" />
                </button>
                {pageNumbers.map((page) => (
                  <button
                    key={page}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-all ${
                      page === currentPage
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'border border-gray-200 text-gray-600 hover:border-primary-400 hover:text-primary-600'
                    }`}
                    type="button"
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-all hover:border-primary-400 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-40"
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  <i className="fa-solid fa-chevron-right text-xs" />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
