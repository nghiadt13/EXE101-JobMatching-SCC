import { MatchingSnapshotV2 } from '@/lib/applications-client';
import { Badge } from '@/components/ui/badge';
import { ConstraintFlags } from './constraint-flags';

type MatchingSnapshotV2Props = {
  snapshot: MatchingSnapshotV2;
};

export function MatchingSnapshotV2View({ snapshot }: MatchingSnapshotV2Props) {
  const { scoreBreakdown } = snapshot;

  return (
    <div className="mt-3 space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-semibold text-zinc-900">V2 AI Analysis</h4>
          <p className="text-xs text-zinc-500">JD-contextual evaluation</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="block text-xs text-zinc-500">Skill Score</span>
            <span className="font-medium text-zinc-900">{Math.round(scoreBreakdown.skillScore)}/100</span>
          </div>
          <div>
            <span className="block text-xs text-zinc-500">Constraint Score</span>
            <span className="font-medium text-zinc-900">{Math.round(scoreBreakdown.constraintScore)}/100</span>
          </div>
          {scoreBreakdown.experienceBonus != null && (
            <div>
              <span className="block text-xs text-zinc-500">Experience Bonus</span>
              <span className="font-medium text-zinc-900">{Math.round(scoreBreakdown.experienceBonus)}/100</span>
            </div>
          )}
          {scoreBreakdown.projectBonus != null && (
            <div>
              <span className="block text-xs text-zinc-500">Project Bonus</span>
              <span className="font-medium text-zinc-900">{Math.round(scoreBreakdown.projectBonus)}/100</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Strengths</h5>
          {snapshot.strengths.length > 0 ? (
            <ul className="space-y-1">
              {snapshot.strengths.map((s, i) => (
                <li key={i} className="flex text-sm text-zinc-700">
                  <span className="mr-2 text-emerald-500">✓</span> {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500 italic">No notable strengths identified</p>
          )}
        </div>
        <div>
          <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Gaps</h5>
          {snapshot.gaps.length > 0 ? (
            <ul className="space-y-1">
              {snapshot.gaps.map((g, i) => (
                <li key={i} className="flex text-sm text-zinc-700">
                  <span className="mr-2 text-rose-500">✗</span> {g}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500 italic">No significant gaps identified</p>
          )}
        </div>
      </div>

      {snapshot.constraintsFailed?.length > 0 && (
        <ConstraintFlags failed={snapshot.constraintsFailed} />
      )}

      {snapshot.warnings?.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
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
