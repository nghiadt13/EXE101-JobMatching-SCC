import Link from 'next/link';
import { JobItem } from '@/lib/jobs-client';
import { RecruiterJobStatusActions } from './recruiter-job-status-actions';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

type RecruiterJobsTableProps = {
  jobs: JobItem[];
  totalItems: number;
  visibleItems: number;
  currentPage: number;
  totalPages: number;
  currentStatus?: string;
  currentSearch?: string;
  publishAction: (formData: FormData) => Promise<void>;
  closeAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
};

export function RecruiterJobsTable({
  jobs, totalItems, visibleItems, currentPage, totalPages, currentStatus, currentSearch, publishAction, closeAction, deleteAction,
}: RecruiterJobsTableProps) {
  const lifecycleVariant: Record<JobItem['status'], 'primary' | 'success' | 'default'> = {
    DRAFT: 'primary',
    PUBLISHED: 'success',
    CLOSED: 'default',
    ARCHIVED: 'default',
  };

  const parseVariant: Record<JobItem['parseStatus'], 'success' | 'default'> = {
    parsed_ok: 'success',
    needs_review: 'default',
  };

  const parseLabel: Record<JobItem['parseStatus'], string> = {
    parsed_ok: 'Parsed OK',
    needs_review: 'Needs Review',
  };

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Danh sách việc làm</p>
        <h2 className="mt-2 text-xl font-semibold text-zinc-950">Quản lý tin tuyển dụng</h2>

        <form method="GET" action="" className="mt-4 flex items-center gap-3">
          {currentStatus && <input type="hidden" name="status" value={currentStatus} />}
          <div className="relative flex-1 min-w-0">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="search"
              name="q"
              defaultValue={currentSearch || ''}
              placeholder="Tìm kiếm việc làm..."
              className="h-10 w-full rounded-lg border border-zinc-300 bg-zinc-50 pl-10 pr-3 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>
          <button
            type="submit"
            className="h-10 shrink-0 rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-800 shadow-sm transition-all"
          >
            Tìm kiếm
          </button>
          {currentSearch && (
            <Link
              href={`?${new URLSearchParams({ ...(currentStatus ? { status: currentStatus } : {}) }).toString()}`}
              className="shrink-0 text-sm text-zinc-500 hover:text-red-500 whitespace-nowrap underline transition-colors"
              title="Xóa tìm kiếm"
            >
              Xóa
            </Link>
          )}
        </form>

        <div className="mt-5 flex items-center justify-between">
          <div className="flex gap-6 text-sm font-medium">
            <Link
              href={`?${new URLSearchParams({ ...(currentSearch ? { q: currentSearch } : {}) }).toString()}`}
              className={!currentStatus ? 'text-blue-600 underline underline-offset-[12px] decoration-2 font-semibold' : 'text-zinc-500 hover:text-zinc-800'}
            >
              Tất cả
            </Link>
            <Link
              href={`?${new URLSearchParams({ status: 'PUBLISHED', ...(currentSearch ? { q: currentSearch } : {}) }).toString()}`}
              className={currentStatus === 'PUBLISHED' ? 'text-blue-600 underline underline-offset-[12px] decoration-2 font-semibold' : 'text-zinc-500 hover:text-zinc-800'}
            >
              Đã đăng
            </Link>
            <Link
              href={`?${new URLSearchParams({ status: 'DRAFT', ...(currentSearch ? { q: currentSearch } : {}) }).toString()}`}
              className={currentStatus === 'DRAFT' ? 'text-blue-600 underline underline-offset-[12px] decoration-2 font-semibold' : 'text-zinc-500 hover:text-zinc-800'}
            >
              Bản nháp
            </Link>
          </div>
          <div className="text-sm text-zinc-500">
            {totalItems > 0 ? (visibleItems < totalItems ? `Hiển thị ${visibleItems} / ${totalItems} việc làm` : `Tổng cộng: ${totalItems} việc làm`) : ''}
          </div>
        </div>
      </div>

      {!jobs.length ? (
        <div className="py-12">
          <EmptyState
            title="Chưa có việc làm nào"
            description="Hãy bắt đầu bằng cách tạo một việc làm mới hoặc tải lên JD."
          />
        </div>
      ) : (
        <div className="divide-y divide-zinc-200">
          {jobs.map((job) => {
          const salaryLabel = formatSalary(job.salaryMin, job.salaryMax);
          const summary = getSummaryPreview(job);
          const tags = job.skills.slice(0, 3);
          const extraTagCount = Math.max(0, job.skills.length - tags.length);

          return (
            <article
              key={job.id}
              className="flex flex-col gap-5 px-6 py-6 transition-colors hover:bg-zinc-50/80 xl:flex-row xl:items-start xl:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/dashboard/recruiter/jobs/${job.id}`}
                      className="text-lg font-semibold text-zinc-950 underline-offset-4 hover:underline"
                    >
                      {job.title}
                    </Link>
                    <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-zinc-600">
                      {summary || 'No summary available yet.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <Badge variant={lifecycleVariant[job.status]}>{job.status}</Badge>
                    <Badge variant={parseVariant[job.parseStatus]}>{parseLabel[job.parseStatus]}</Badge>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-500">
                  <span>{formatEmploymentType(job.employmentType)}</span>
                  {salaryLabel ? <span>{salaryLabel}</span> : null}
                  <span>{job.inputMode === 'file_upload' ? 'Uploaded JD' : 'Manual'}</span>
                  <span>Updated {formatDate(job.updatedAt)}</span>
                </div>

                {tags.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {tags.map((skill) => (
                      <Badge key={`${job.id}-skill-${skill}`} variant="outline">{skill}</Badge>
                    ))}
                    {extraTagCount > 0 ? (
                      <Badge variant="outline">+{extraTagCount} more</Badge>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="w-full xl:w-52 xl:shrink-0">
                <RecruiterJobStatusActions
                  job={job}
                  publishAction={publishAction}
                  closeAction={closeAction}
                  deleteAction={deleteAction}
                />
              </div>
            </article>
          );
        })}
      </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-4 text-sm text-zinc-600 bg-zinc-50/50 rounded-b-2xl">
          <div>Trang {currentPage} / {totalPages}</div>
          <div className="flex gap-2">
            {currentPage > 1 ? (
              <Link
                href={`?${new URLSearchParams({ ...(currentStatus ? { status: currentStatus } : {}), ...(currentSearch ? { q: currentSearch } : {}), page: String(currentPage - 1) }).toString()}`}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 hover:bg-zinc-50 shadow-sm transition-all"
              >
                Trang trước
              </Link>
            ) : null}
            {currentPage < totalPages ? (
              <Link
                href={`?${new URLSearchParams({ ...(currentStatus ? { status: currentStatus } : {}), ...(currentSearch ? { q: currentSearch } : {}), page: String(currentPage + 1) }).toString()}`}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 hover:bg-zinc-50 shadow-sm transition-all"
              >
                Trang sau
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function formatEmploymentType(value: string): string {
  return value.split('_').map((item) => item.charAt(0) + item.slice(1).toLowerCase()).join(' ');
}

function formatSalary(min: number | null, max: number | null): string | null {
  if (min === null && max === null) return null;
  const formatter = new Intl.NumberFormat('en-US');
  if (min !== null && max !== null) return `${formatter.format(min)} – ${formatter.format(max)}`;
  if (min !== null) return `From ${formatter.format(min)}`;
  return `Up to ${formatter.format(max ?? 0)}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function getSummaryPreview(job: JobItem): string {
  const savedDescription = stripDescriptionHeadings(job.description);
  if (savedDescription) return savedDescription;
  return job.normalizedProfile?.summary.trim() || '';
}

function stripDescriptionHeadings(value: string): string {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    .filter((line) => !/^(summary|requirements|benefits)\s*:?$/i.test(line)).join(' ');
}
