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
        <ul className="space-y-3">
          {applications.map((app) => (
            <li
              key={app.id}
              className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-md-surface-container-low"
            >
              {/* Company initial avatar */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-md-primary-container font-label-md text-md-on-primary">
                {getInitial(app.companyName)}
              </div>

              {/* Job info */}
              <div className="min-w-0 flex-1">
                <p className="truncate font-body-md text-md-on-surface">
                  {app.jobTitle}
                </p>
                <p className="truncate font-body-sm text-md-on-surface-variant">
                  {app.companyName} · {timeAgo(app.appliedAt)}
                </p>
              </div>

              {/* Status badge */}
              <span
                className={cn(
                  'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 font-label-sm',
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
