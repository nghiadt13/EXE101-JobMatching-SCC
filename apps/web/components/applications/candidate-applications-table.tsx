'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ApplicationItem,
  isMatchingSnapshotV2,
} from '@/lib/applications-client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PUBLIC_JOBS_LISTING_ROUTE } from '@/lib/routes';
import { MatchingSnapshotV2View } from './matching-snapshot-v2';
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Clock,
  XCircle,
  Trophy,
  CalendarCheck,
  TrendingUp,
  Loader2,
  Building2,
  Calendar,
  Target,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

type CandidateApplicationsTableProps = {
  items: ApplicationItem[];
};

/* ── Status config ─────────────────────────────────────── */

type StatusConfig = {
  label: string;
  icon: React.ReactNode;
  badgeVariant: 'default' | 'success' | 'warning' | 'info' | 'danger';
};

const STATUS_CONFIG: Record<string, StatusConfig> = {
  PENDING_MATCHING: {
    label: 'Đang phân tích…',
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    badgeVariant: 'warning',
  },
  APPLIED: {
    label: 'Đã nộp',
    icon: <Briefcase className="h-3.5 w-3.5" />,
    badgeVariant: 'default',
  },
  REVIEWING: {
    label: 'Đang xem xét',
    icon: <Clock className="h-3.5 w-3.5" />,
    badgeVariant: 'info',
  },
  INTERVIEW: {
    label: 'Phỏng vấn',
    icon: <CalendarCheck className="h-3.5 w-3.5" />,
    badgeVariant: 'success',
  },
  OFFER: {
    label: 'Nhận offer',
    icon: <Trophy className="h-3.5 w-3.5" />,
    badgeVariant: 'success',
  },
  REJECTED: {
    label: 'Không phù hợp',
    icon: <XCircle className="h-3.5 w-3.5" />,
    badgeVariant: 'danger',
  },
  WITHDRAWN: {
    label: 'Đã rút',
    icon: <XCircle className="h-3.5 w-3.5" />,
    badgeVariant: 'danger',
  },
};

/* ── Match Score Ring ──────────────────────────────────── */

function MatchScoreRing({ score, pending }: { score: number; pending?: boolean }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const progress = pending ? 0 : Math.min(score, 100);
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative flex h-14 w-14 items-center justify-center shrink-0">
      <svg className="-rotate-90" width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="5" />
        {!pending && (
          <circle
            cx="28"
            cy="28"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
        ) : (
          <>
            <span className="text-xs font-bold leading-none" style={{ color }}>
              {Math.round(score)}%
            </span>
            <span className="text-[9px] text-zinc-400 leading-none mt-0.5">phù hợp</span>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Company Avatar ────────────────────────────────────── */

const AVATAR_COLORS = [
  'from-blue-500 to-blue-700',
  'from-violet-500 to-violet-700',
  'from-emerald-500 to-emerald-700',
  'from-rose-500 to-rose-700',
  'from-amber-500 to-amber-700',
  'from-cyan-500 to-cyan-700',
  'from-indigo-500 to-indigo-700',
  'from-pink-500 to-pink-700',
];

function normalizeIconClass(iconKey: string | null | undefined): string {
  if (!iconKey || iconKey.trim().length === 0) {
    return 'fa-solid fa-building';
  }
  if (
    iconKey.includes('fa-solid') ||
    iconKey.includes('fa-regular') ||
    iconKey.includes('fa-brands')
  ) {
    return iconKey;
  }
  return iconKey.startsWith('fa-') ? `fa-solid ${iconKey}` : `fa-solid fa-${iconKey}`;
}

function CompanyAvatar({
  name,
  index,
  logoUrl,
  iconKey,
}: {
  name: string;
  index: number;
  logoUrl?: string | null;
  iconKey?: string | null;
}) {
  const gradient = AVATAR_COLORS[index % AVATAR_COLORS.length];

  // 1. Real company logo image
  if (logoUrl && logoUrl.trim().length > 0) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-white p-1.5">
        <Image
          src={logoUrl}
          alt={name}
          width={48}
          height={48}
          className="h-full w-full object-contain"
          unoptimized
        />
      </div>
    );
  }

  // 2. FontAwesome brand icon
  if (iconKey && iconKey.trim().length > 0) {
    return (
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-sm`}
      >
        <i className={`${normalizeIconClass(iconKey)} text-lg`} />
      </div>
    );
  }

  // 3. Fallback: initials
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-sm font-bold text-white shadow-sm`}
    >
      {initials || '?'}
    </div>
  );
}

/* ── Stats Summary Bar ─────────────────────────────────── */

function StatsSummary({ items }: { items: ApplicationItem[] }) {
  const total = items.length;
  const reviewing = items.filter((i) => i.status === 'REVIEWING').length;
  const interviews = items.filter((i) => i.status === 'INTERVIEW').length;
  const offers = items.filter((i) => i.status === 'OFFER').length;
  const scoredItems = items.filter((i) => i.status !== 'PENDING_MATCHING');
  const avgScore =
    scoredItems.length > 0
      ? Math.round(scoredItems.reduce((sum, i) => sum + i.matchScore, 0) / scoredItems.length)
      : 0;

  const stats = [
    {
      label: 'Tổng jobs',
      value: total,
      icon: <Briefcase className="h-4 w-4" />,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Đang xem xét',
      value: reviewing,
      icon: <Clock className="h-4 w-4" />,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Phỏng vấn',
      value: interviews,
      icon: <CalendarCheck className="h-4 w-4" />,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Offer nhận được',
      value: offers,
      icon: <Trophy className="h-4 w-4" />,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Điểm phù hợp TB',
      value: `${avgScore}%`,
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm sm:grid-cols-3 lg:grid-cols-5 lg:divide-x">
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-center gap-3 p-4">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.bg} ${stat.color}`}>
            {stat.icon}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium text-zinc-500 leading-none">{stat.label}</p>
            <p className="mt-1.5 text-xl font-bold leading-none text-zinc-800">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Application Card ──────────────────────────────────── */

function ApplicationCard({ item, index }: { item: ApplicationItem; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const config = STATUS_CONFIG[item.status] ?? STATUS_CONFIG['APPLIED'];
  const isPending = item.status === 'PENDING_MATCHING';
  const companyName = item.job.companyName ?? 'Công ty';
  const hasSnapshot = !!item.matchingSnapshot && !isPending;

  // Quick preview: strengths from snapshot (collapsed state)
  const previewStrengths = hasSnapshot ? (item.matchingSnapshot?.strengths ?? []).slice(0, 2) : [];
  const previewGaps = hasSnapshot ? (item.matchingSnapshot?.gaps ?? []).slice(0, 1) : [];

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-200 hover:border-zinc-300 hover:shadow-md">
      {/* ── Main card row ── */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          <CompanyAvatar
            name={companyName}
            index={index}
            logoUrl={item.job.companyLogoUrl}
            iconKey={item.job.companyIconKey}
          />

          <div className="min-w-0 flex-1">
            {/* Title + score ring */}
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                {item.job.slug ? (
                  <Link
                    href={`/jobs/${item.job.slug}`}
                    className="block truncate text-base font-bold text-zinc-900 hover:text-primary-600 transition-colors"
                  >
                    {item.job.title}
                  </Link>
                ) : (
                  <p className="truncate text-base font-bold text-zinc-900">{item.job.title}</p>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="flex items-center gap-1 text-xs text-zinc-500">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    {companyName}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-zinc-400">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    {new Date(item.appliedAt).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              <MatchScoreRing score={item.matchScore} pending={isPending} />
            </div>

            {/* Status badge + CV chip */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant={config.badgeVariant} className="flex items-center gap-1">
                {config.icon}
                {config.label}
              </Badge>

              <span className="flex items-center gap-1.5 rounded-full border border-zinc-100 bg-zinc-50 px-2.5 py-1 text-[11px] text-zinc-500">
                <FileText className="h-3 w-3 shrink-0 text-rose-400" />
                <span className="max-w-[200px] truncate">{item.cv.fileName}</span>
              </span>

              {isPending && (
                <span className="flex items-center gap-1 text-[11px] text-amber-600">
                  <Sparkles className="h-3 w-3" />
                  Đang tính điểm phù hợp…
                </span>
              )}
            </div>

            {/* Quick preview pills (only when collapsed) */}
            {!expanded && hasSnapshot && (previewStrengths.length > 0 || previewGaps.length > 0) && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {previewStrengths.map((s, i) => (
                  <span
                    key={`s-${i}`}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700"
                  >
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    {s}
                  </span>
                ))}
                {previewGaps.map((g, i) => (
                  <span
                    key={`g-${i}`}
                    className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700"
                  >
                    <AlertTriangle className="h-2.5 w-2.5" />
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Expand toggle button */}
        {hasSnapshot && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-100 bg-zinc-50 py-2 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          >
            <Target className="h-3.5 w-3.5" />
            {expanded ? 'Ẩn phân tích phù hợp' : 'Xem phân tích phù hợp chi tiết'}
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {/* ── Expandable matching detail ── */}
      {expanded && hasSnapshot && (
        <div className="border-t border-zinc-100 bg-zinc-50/40 px-5 pb-5">
          {isMatchingSnapshotV2(item.matchingSnapshot) ? (
            <MatchingSnapshotV2View snapshot={item.matchingSnapshot} />
          ) : item.matchingSnapshot ? (
            /* schema_v1 fallback */
            <div className="mt-4 space-y-3">
              {item.matchingSnapshot.strengths?.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Điểm mạnh
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.matchingSnapshot.strengths.map((s, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {item.matchingSnapshot.gaps?.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Cần cải thiện
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.matchingSnapshot.gaps.map((g, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {item.matchingSnapshot.warnings?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {item.matchingSnapshot.warnings.map((w, i) => (
                    <Badge key={i} variant="warning" className="text-[10px]">
                      {w}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

/* ── Main Component ────────────────────────────────────── */

const POLL_INTERVAL_MS = 5_000;

export function CandidateApplicationsTable({ items: initialItems }: CandidateApplicationsTableProps) {
  const [items, setItems] = useState<ApplicationItem[]>(initialItems);
  const router = useRouter();

  // Sync with server-rendered props when they change (e.g., after router.refresh())
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const hasPending = items.some((i) => i.status === 'PENDING_MATCHING');

  // Auto-refresh page data when there are pending items
  useEffect(() => {
    if (!hasPending) return;

    const intervalId = setInterval(() => {
      router.refresh(); // Re-runs the server component, which re-fetches data
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [hasPending, router]);

  if (!items.length) {
    return (
      <EmptyState
        title="Chưa có đơn ứng tuyển nào"
        description="Bạn chưa ứng tuyển việc làm nào. Hãy khám phá các vị trí đang tuyển dụng."
        action={
          <Button asChild size="sm">
            <Link href={PUBLIC_JOBS_LISTING_ROUTE}>Xem vị trí đang tuyển</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats summary */}
      <StatsSummary items={items} />

      {/* Application cards */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <ApplicationCard key={item.id} item={item} index={index} />
        ))}
      </div>
    </div>
  );
}

