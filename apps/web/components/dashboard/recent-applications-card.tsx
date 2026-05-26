import Link from 'next/link';
import type { ApplicationStatus } from '@/lib/applications-client';
import { cn } from '@/lib/cn';

type RecentApplication = {
  id: string;
  jobTitle: string;
  companyName: string;
  status: ApplicationStatus;
  appliedAt: string;
};

type RecentApplicationsCardProps = {
  applications: RecentApplication[];
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING_MATCHING: 'Đang xử lý',
  APPLIED: 'Đã ứng tuyển',
  REVIEWING: 'Đang xem xét',
  INTERVIEW: 'Phỏng vấn',
  OFFER: 'Nhận offer',
  REJECTED: 'Bị từ chối',
  WITHDRAWN: 'Đã rút hồi',
};

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  PENDING_MATCHING: 'bg-md-surface-container text-md-on-surface-variant',
  APPLIED: 'bg-md-primary-container text-md-on-primary',
  REVIEWING: 'bg-md-tertiary-container text-md-on-tertiary-container',
  INTERVIEW: 'bg-md-surface-container-high text-md-on-surface',
  OFFER: 'bg-green-100 text-green-800',
  REJECTED: 'bg-md-error-container text-md-on-error-container',
  WITHDRAWN: 'bg-md-surface-container text-md-on-surface-variant',
};

function getInitial(name: string) {
  return name.charAt(0).toUpperCase();
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  return `${days} ngày trước`;
}

export function RecentApplicationsCard({
  applications,
}: RecentApplicationsCardProps) {
  return (
    <div className="rounded-xl border border-md-outline-variant/30 bg-md-surface-container-lowest p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-headline-md text-md-on-surface">
          Đơn ứng tuyển gần đây
        </h3>
        <Link
          href="/dashboard/candidate/applications"
          className="font-label-md text-md-primary hover:underline"
        >
          Xem tất cả
        </Link>
      </div>

      {applications.length === 0 ? (
        <p className="font-body-sm text-md-on-surface-variant">
          Chưa có đơn đăng ký nào.
        </p>
      ) : (
        <ul className="space-y-3.5">
          {applications.map((app) => (
            <li
              key={app.id}
              className="flex items-center gap-4 rounded-xl border border-md-outline-variant/20 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-primary/30 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
            >
              {/* Company initial avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-md-primary-container/20 font-bold text-md-primary text-sm shadow-sm">
                {getInitial(app.companyName)}
              </div>

              {/* Job info */}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-sm text-md-on-surface hover:text-md-primary transition-colors">
                  {app.jobTitle}
                </p>
                <p className="truncate text-xs text-md-on-surface-variant mt-1 flex items-center gap-1.5">
                  <span className="font-medium text-md-on-surface/75">{app.companyName}</span>
                  <span className="text-md-outline/60">•</span>
                  <span>{timeAgo(app.appliedAt)}</span>
                </p>
              </div>

              {/* Status badge */}
              <span
                className={cn(
                  'inline-flex shrink-0 items-center rounded-lg px-3 py-1 text-[11px] font-semibold tracking-wide uppercase',
                  STATUS_STYLES[app.status],
                )}
              >
                {STATUS_LABELS[app.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
