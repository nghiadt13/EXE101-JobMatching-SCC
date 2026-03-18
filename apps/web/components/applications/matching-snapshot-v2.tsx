'use client';

import { useState } from 'react';
import { MatchingSnapshotV2 } from '@/lib/applications-client';
import { Badge } from '@/components/ui/badge';
import { ConstraintFlags } from './constraint-flags';
import { ChevronDown, ChevronUp } from 'lucide-react';

type MatchingSnapshotV2Props = {
  snapshot: MatchingSnapshotV2;
};

/* ── Helpers ─────────────────────────────────────────────── */

function getFitInfo(score: number) {
  if (score >= 70)
    return {
      text: 'Good fit',
      variant: 'success' as const,
      border: 'border-emerald-300',
      bg: 'bg-emerald-50',
    };
  if (score >= 40)
    return {
      text: 'Fair fit',
      variant: 'warning' as const,
      border: 'border-amber-300',
      bg: 'bg-amber-50',
    };
  return {
    text: 'Weak fit',
    variant: 'danger' as const,
    border: 'border-red-300',
    bg: 'bg-red-50',
  };
}

function getStatusInfo(status: string) {
  switch (status) {
    case 'met':
      return { text: 'Direct match', variant: 'success' as const };
    case 'partial':
      return { text: 'Partial match', variant: 'warning' as const };
    case 'missing':
      return { text: 'Missing', variant: 'danger' as const };
    default:
      return { text: 'N/A', variant: 'default' as const };
  }
}

function getConfidenceBadge(confidence: string) {
  switch (confidence) {
    case 'high':
      return { text: 'High confidence', variant: 'info' as const };
    case 'medium':
      return { text: 'Medium confidence', variant: 'default' as const };
    default:
      return { text: 'Low confidence', variant: 'outline' as const };
  }
}

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
    return remaining > 0 ? `${years}y ${remaining}m` : `${years}y`;
  }
  return `${months}m`;
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
    <div className="rounded-xl border border-zinc-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-zinc-50"
      >
        <div>
          <h5 className="text-xs font-bold uppercase tracking-wider text-primary-700">
            {title}
          </h5>
          <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-zinc-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-zinc-400" />
        )}
      </button>
      {open && <div className="border-t border-zinc-100 p-4">{children}</div>}
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────── */

export function MatchingSnapshotV2View({ snapshot }: MatchingSnapshotV2Props) {
  const { scoreBreakdown } = snapshot;
  const candidateSummary = snapshot.candidateSummary ?? {
    headline: '',
    totalExperienceMonths: 0,
    relevantExperienceMonths: 0,
    skills: [],
    location: null,
    projectRelevance: { totalProjects: 0, relevantProjects: 0, relevanceScore: 0, highlights: [] },
  };
  const fit = getFitInfo(scoreBreakdown.final);

  // Sort requirements: met first, then partial, then missing — by importance within each group
  const sortedRequirements = [...snapshot.requirements]
    .filter((r) => r.status !== 'not_applicable')
    .sort((a, b) => {
      const statusDiff =
        (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3);
      if (statusDiff !== 0) return statusDiff;
      return (
        (IMPORTANCE_ORDER[a.importance ?? 'medium'] ?? 2) -
        (IMPORTANCE_ORDER[b.importance ?? 'medium'] ?? 2)
      );
    })
    .slice(0, 10);

  // Find best evidence from highest-importance met requirement
  const bestEvidence = snapshot.requirements
    .filter((r) => r.status === 'met' && r.evidence.length > 0)
    .sort(
      (a, b) =>
        (IMPORTANCE_ORDER[a.importance ?? 'medium'] ?? 2) -
        (IMPORTANCE_ORDER[b.importance ?? 'medium'] ?? 2),
    )[0]?.evidence[0];

  return (
    <div className="mt-3 space-y-3">
      {/* ── Section 1: Overall Fit Summary ──────────────────── */}
      <div className={`rounded-xl border ${fit.border} ${fit.bg} p-4`}>
        <div className="flex items-center gap-2">
          <Badge variant={fit.variant}>{fit.text}</Badge>
          <span className="text-sm font-semibold text-zinc-900">
            {scoreBreakdown.final}% overall fit
          </span>
        </div>

        {candidateSummary.headline && (
          <p className="mt-2 text-sm text-zinc-700">
            {candidateSummary.headline}
            {snapshot.strengths.length > 0 && (
              <>
                .{' '}
                <span className="font-medium">
                  Strengths: {snapshot.strengths.slice(0, 3).join(', ')}
                </span>
              </>
            )}
          </p>
        )}

        {bestEvidence && (
          <p className="mt-2 text-sm text-zinc-600">
            <span className="font-semibold">Best evidence:</span>{' '}
            {bestEvidence.length > 150
              ? bestEvidence.slice(0, 150) + '...'
              : bestEvidence}
          </p>
        )}

        {snapshot.gaps.length > 0 && (
          <p className="mt-2 text-sm text-zinc-500">
            <span className="font-semibold">Still unclear:</span>{' '}
            {snapshot.gaps.slice(0, 3).join(', ')}
          </p>
        )}
      </div>

      {/* ── Section 2: How This Score Is Built ──────────────── */}
      <CollapsibleSection
        title="HOW THIS SCORE IS BUILT"
        subtitle="The final fit blends skill score, constraint compliance, experience, and project relevance"
      >
        {/* Final fit badge */}
        <div className="mb-3">
          <Badge variant={fit.variant}>Final fit {scoreBreakdown.final}%</Badge>
        </div>

        {/* Score grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ScoreColumn label="Skill Score" value={scoreBreakdown.skillScore} />
          <ScoreColumn
            label="Constraint"
            value={scoreBreakdown.constraintScore}
          />
          <ScoreColumn
            label="Experience"
            value={scoreBreakdown.experienceBonus}
          />
          <ScoreColumn label="Project" value={scoreBreakdown.projectBonus} />
        </div>

        {/* Metadata badges */}
        <div className="mt-3 flex flex-wrap gap-2">
          {candidateSummary.totalExperienceMonths > 0 && (
            <Badge variant="outline">
              {formatMonths(candidateSummary.totalExperienceMonths)} total exp
            </Badge>
          )}
          {candidateSummary.relevantExperienceMonths > 0 && (
            <Badge variant="info">
              {formatMonths(candidateSummary.relevantExperienceMonths)} relevant
            </Badge>
          )}
          {candidateSummary.location && (
            <Badge variant="outline">
              {[candidateSummary.location.city, candidateSummary.location.country]
                .filter(Boolean)
                .join(', ')}
            </Badge>
          )}
          {candidateSummary.projectRelevance?.totalProjects > 0 && (
            <Badge variant="outline">
              {candidateSummary.projectRelevance.relevantProjects}/
              {candidateSummary.projectRelevance.totalProjects} relevant
              projects
            </Badge>
          )}
        </div>
      </CollapsibleSection>

      {/* ── Section 3: Why This Looks Relevant ─────────────── */}
      <CollapsibleSection
        title="WHY THIS LOOKS RELEVANT"
        subtitle="Evidence pulled from the job requirements and the CV"
        defaultOpen={false}
      >
        <div className="space-y-4">
          {sortedRequirements.map((req, i) => {
            const status = getStatusInfo(req.status);
            const confidence = getConfidenceBadge(req.confidence);
            const label = req.label || req.requirementId;

            return (
              <div key={i} className="border-b border-zinc-100 pb-3 last:border-0 last:pb-0">
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge variant={status.variant}>{status.text}</Badge>
                  <Badge variant={confidence.variant}>{confidence.text}</Badge>
                  {req.importance && req.importance !== 'medium' && (
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {req.importance}
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-zinc-700">
                  <span className="font-medium text-zinc-900">
                    Job asks for:{' '}
                  </span>
                  {label}
                </p>

                {req.evidence.length > 0 ? (
                  <p className="mt-1 text-sm text-zinc-600">
                    <span className="font-medium text-zinc-700">
                      CV evidence:{' '}
                    </span>
                    {req.evidence
                      .map((e) => (e.length > 120 ? e.slice(0, 120) + '...' : e))
                      .join(' · ')}
                  </p>
                ) : (
                  <p className="mt-1 text-sm italic text-zinc-400">
                    No evidence found
                  </p>
                )}
              </div>
            );
          })}

          {sortedRequirements.length === 0 && (
            <p className="text-sm italic text-zinc-500">
              No requirement evaluations available
            </p>
          )}
        </div>
      </CollapsibleSection>

      {/* ── Constraint Flags (unchanged) ───────────────────── */}
      {snapshot.constraintsFailed?.length > 0 && (
        <ConstraintFlags failed={snapshot.constraintsFailed} />
      )}

      {/* ── Warnings ───────────────────────────────────────── */}
      {snapshot.warnings?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {snapshot.warnings.map((w, i) => (
            <Badge key={i} variant="warning" className="text-[10px] uppercase">
              {w}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Score Column Sub-component ───────────────────────────── */

function ScoreColumn({ label, value }: { label: string; value: number }) {
  const rounded = Math.round(value ?? 0) || 0;
  const color =
    rounded >= 70
      ? 'text-emerald-600'
      : rounded >= 40
        ? 'text-amber-600'
        : 'text-red-600';

  return (
    <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-2 text-center">
      <span className="block text-xs text-zinc-500">{label}</span>
      <span className={`text-lg font-bold ${color}`}>{rounded}</span>
      <span className="text-xs text-zinc-400">/100</span>
    </div>
  );
}
