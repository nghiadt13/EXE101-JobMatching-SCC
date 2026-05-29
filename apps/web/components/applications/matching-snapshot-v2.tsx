'use client';

import { useState } from 'react';
import { MatchingSnapshotV2 } from '@/lib/applications-client';
import { Badge } from '@/components/ui/badge';
import { ConstraintFlags } from './constraint-flags';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Quote,
  Clock,
  MapPin,
  FolderKanban,
} from 'lucide-react';

type MatchingSnapshotV2Props = {
  snapshot: MatchingSnapshotV2;
};

/* ── Helpers ─────────────────────────────────────────────── */

function getFitInfo(score: number) {
  if (score >= 70)
    return {
      text: 'Phù hợp tốt',
      variant: 'success' as const,
      border: 'border-emerald-200',
      bg: 'bg-emerald-50',
      bar: 'bg-emerald-500',
      textColor: 'text-emerald-700',
    };
  if (score >= 40)
    return {
      text: 'Phù hợp khá',
      variant: 'warning' as const,
      border: 'border-amber-200',
      bg: 'bg-amber-50',
      bar: 'bg-amber-500',
      textColor: 'text-amber-700',
    };
  return {
    text: 'Phù hợp thấp',
    variant: 'danger' as const,
    border: 'border-red-200',
    bg: 'bg-red-50',
    bar: 'bg-red-500',
    textColor: 'text-red-700',
  };
}

function getStatusInfo(status: string) {
  switch (status) {
    case 'met':
      return {
        text: 'Đáp ứng',
        variant: 'success' as const,
        icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
      };
    case 'partial':
      return {
        text: 'Một phần',
        variant: 'warning' as const,
        icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
      };
    case 'missing':
      return {
        text: 'Còn thiếu',
        variant: 'danger' as const,
        icon: <XCircle className="h-3.5 w-3.5 text-red-500" />,
      };
    default:
      return {
        text: 'Không áp dụng',
        variant: 'default' as const,
        icon: null,
      };
  }
}

function getConfidenceBadge(confidence: string) {
  switch (confidence) {
    case 'high':
      return { text: 'Độ tin cậy cao', variant: 'info' as const };
    case 'medium':
      return { text: 'Độ tin cậy vừa', variant: 'default' as const };
    default:
      return { text: 'Độ tin cậy thấp', variant: 'outline' as const };
  }
}

const IMPORTANCE_LABEL: Record<string, string> = {
  critical: 'Bắt buộc',
  high: 'Quan trọng',
  medium: 'Trung bình',
  low: 'Thấp',
  very_low: 'Rất thấp',
};

const IMPORTANCE_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  very_low: 4,
};

const STATUS_ORDER: Record<string, number> = {
  met: 0,
  partial: 1,
  missing: 2,
  not_applicable: 3,
};

function formatMonths(months: number): string {
  if (months >= 12) {
    const years = Math.floor(months / 12);
    const remaining = months % 12;
    return remaining > 0 ? `${years} năm ${remaining} tháng` : `${years} năm`;
  }
  return `${months} tháng`;
}

/* ── Collapsible Section ─────────────────────────────────── */

function CollapsibleSection({
  title,
  subtitle,
  children,
  defaultOpen = false,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-zinc-50"
      >
        <div>
          <h5 className="text-sm font-bold text-zinc-800">{title}</h5>
          <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-zinc-400" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
        )}
      </button>
      {open && <div className="border-t border-zinc-100 p-4">{children}</div>}
    </div>
  );
}

/* ── Score Bar Row ───────────────────────────────────────── */

function ScoreBar({ label, value }: { label: string; value: number }) {
  const rounded = Math.round(value ?? 0) || 0;
  const color =
    rounded >= 70 ? 'bg-emerald-500' : rounded >= 40 ? 'bg-amber-500' : 'bg-red-500';
  const textColor =
    rounded >= 70 ? 'text-emerald-600' : rounded >= 40 ? 'text-amber-600' : 'text-red-600';

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-600">{label}</span>
        <span className={`text-xs font-bold ${textColor}`}>{rounded}/100</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${Math.min(rounded, 100)}%` }}
        />
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────── */

export function MatchingSnapshotV2View({ snapshot }: MatchingSnapshotV2Props) {
  const scoreBreakdown = snapshot.scoreBreakdown ?? {
    skillScore: 0,
    constraintScore: 0,
    experienceBonus: 0,
    projectBonus: 0,
    final: 0,
  };
  const candidateSummary = snapshot.candidateSummary ?? {
    headline: '',
    totalExperienceMonths: 0,
    relevantExperienceMonths: 0,
    skills: [],
    location: null,
    projectRelevance: { totalProjects: 0, relevantProjects: 0, relevanceScore: 0, highlights: [] },
  };

  // Safe array defaults — incoming data may omit these fields entirely
  const requirements = snapshot.requirements ?? [];
  const strengths = snapshot.strengths ?? [];
  const gaps = snapshot.gaps ?? [];
  const warnings = snapshot.warnings ?? [];
  const constraintsFailed = snapshot.constraintsFailed ?? [];

  const fit = getFitInfo(scoreBreakdown.final);

  // Sort requirements: met first, then partial, then missing — by importance within each group
  const sortedRequirements = [...requirements]
    .filter((r) => r.status !== 'not_applicable')
    .sort((a, b) => {
      const statusDiff = (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3);
      if (statusDiff !== 0) return statusDiff;
      return (
        (IMPORTANCE_ORDER[a.importance ?? 'medium'] ?? 2) -
        (IMPORTANCE_ORDER[b.importance ?? 'medium'] ?? 2)
      );
    })
    .slice(0, 10);

  // Find best evidence from highest-importance met requirement
  const bestEvidence = requirements
    .filter((r) => r.status === 'met' && (r.evidence?.length ?? 0) > 0)
    .sort(
      (a, b) =>
        (IMPORTANCE_ORDER[a.importance ?? 'medium'] ?? 2) -
        (IMPORTANCE_ORDER[b.importance ?? 'medium'] ?? 2),
    )[0]?.evidence?.[0];

  return (
    <div className="mt-3 space-y-3">
      {/* ── Section 1: Overall Fit Summary ──────────────────── */}
      <div className={`overflow-hidden rounded-xl border ${fit.border} ${fit.bg}`}>
        <div className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge variant={fit.variant}>{fit.text}</Badge>
              <span className="text-sm font-semibold text-zinc-900">
                Mức độ phù hợp tổng thể
              </span>
            </div>
            <span className={`text-2xl font-bold ${fit.textColor}`}>
              {scoreBreakdown.final}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/70">
            <div
              className={`h-full rounded-full ${fit.bar} transition-all duration-700`}
              style={{ width: `${Math.min(scoreBreakdown.final, 100)}%` }}
            />
          </div>

          {candidateSummary.headline && (
            <p className="mt-3 text-sm leading-relaxed text-zinc-700">
              {candidateSummary.headline}
            </p>
          )}

          {strengths.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {strengths.slice(0, 4).map((s, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-medium text-emerald-700"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {s}
                </span>
              ))}
            </div>
          )}

          {gaps.length > 0 && (
            <p className="mt-3 flex items-start gap-1.5 text-xs text-zinc-500">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              <span>
                <span className="font-semibold text-zinc-600">Cần làm rõ thêm: </span>
                {gaps.slice(0, 3).join(', ')}
              </span>
            </p>
          )}
        </div>

        {bestEvidence && (
          <div className="border-t border-white/60 bg-white/40 px-4 py-3">
            <p className="flex items-start gap-2 text-sm text-zinc-600">
              <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
              <span>
                <span className="font-semibold text-zinc-700">Bằng chứng nổi bật: </span>
                {bestEvidence.length > 150 ? bestEvidence.slice(0, 150) + '…' : bestEvidence}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* ── Candidate meta chips ────────────────────────────── */}
      {(candidateSummary.totalExperienceMonths > 0 ||
        candidateSummary.relevantExperienceMonths > 0 ||
        candidateSummary.location ||
        (candidateSummary.projectRelevance?.totalProjects ?? 0) > 0) && (
        <div className="flex flex-wrap gap-2">
          {candidateSummary.totalExperienceMonths > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-600">
              <Clock className="h-3.5 w-3.5 text-zinc-400" />
              {formatMonths(candidateSummary.totalExperienceMonths)} kinh nghiệm
            </span>
          )}
          {candidateSummary.relevantExperienceMonths > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs text-blue-700">
              <Clock className="h-3.5 w-3.5" />
              {formatMonths(candidateSummary.relevantExperienceMonths)} liên quan
            </span>
          )}
          {candidateSummary.location && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-600">
              <MapPin className="h-3.5 w-3.5 text-zinc-400" />
              {[candidateSummary.location.city, candidateSummary.location.country]
                .filter(Boolean)
                .join(', ')}
            </span>
          )}
          {(candidateSummary.projectRelevance?.totalProjects ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-600">
              <FolderKanban className="h-3.5 w-3.5 text-zinc-400" />
              {candidateSummary.projectRelevance.relevantProjects}/
              {candidateSummary.projectRelevance.totalProjects} dự án liên quan
            </span>
          )}
        </div>
      )}

      {/* ── Section 2: How This Score Is Built ──────────────── */}
      <CollapsibleSection
        title="Điểm phù hợp được tính như thế nào"
        subtitle="Tổng hợp từ kỹ năng, điều kiện, kinh nghiệm và độ liên quan của dự án"
      >
        <div className="space-y-3">
          <ScoreBar label="Kỹ năng" value={scoreBreakdown.skillScore} />
          <ScoreBar label="Điều kiện" value={scoreBreakdown.constraintScore} />
          <ScoreBar label="Kinh nghiệm" value={scoreBreakdown.experienceBonus} />
          <ScoreBar label="Dự án" value={scoreBreakdown.projectBonus} />
        </div>
      </CollapsibleSection>

      {/* ── Section 3: Why This Looks Relevant ─────────────── */}
      <CollapsibleSection
        title="Vì sao bạn phù hợp với vị trí này"
        subtitle="Đối chiếu giữa yêu cầu công việc và hồ sơ của bạn"
        defaultOpen={false}
      >
        <div className="space-y-3">
          {sortedRequirements.map((req, i) => {
            const status = getStatusInfo(req.status);
            const confidence = getConfidenceBadge(req.confidence);
            const label = req.label || req.requirementId;

            return (
              <div
                key={i}
                className="rounded-lg border border-zinc-100 bg-zinc-50/60 p-3"
              >
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="flex items-center gap-1">
                    {status.icon}
                    <Badge variant={status.variant}>{status.text}</Badge>
                  </span>
                  <Badge variant={confidence.variant}>{confidence.text}</Badge>
                  {req.importance && req.importance !== 'medium' && (
                    <Badge variant="outline" className="text-[10px]">
                      {IMPORTANCE_LABEL[req.importance] ?? req.importance}
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-zinc-700">
                  <span className="font-medium text-zinc-900">Yêu cầu: </span>
                  {label}
                </p>

                {req.evidence?.length > 0 ? (
                  <p className="mt-1 text-sm text-zinc-600">
                    <span className="font-medium text-zinc-700">Bằng chứng từ CV: </span>
                    {req.evidence
                      .map((e) => (e.length > 120 ? e.slice(0, 120) + '…' : e))
                      .join(' · ')}
                  </p>
                ) : (
                  <p className="mt-1 text-sm italic text-zinc-400">
                    Chưa tìm thấy bằng chứng trong CV
                  </p>
                )}
              </div>
            );
          })}

          {sortedRequirements.length === 0 && (
            <p className="text-sm italic text-zinc-500">
              Chưa có dữ liệu đánh giá yêu cầu
            </p>
          )}
        </div>
      </CollapsibleSection>

      {/* ── Constraint Flags (unchanged) ───────────────────── */}
      {constraintsFailed.length > 0 && <ConstraintFlags failed={constraintsFailed} />}

      {/* ── Warnings ───────────────────────────────────────── */}
      {warnings.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {warnings.map((w, i) => (
            <Badge key={i} variant="warning" className="text-[10px]">
              {w}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
