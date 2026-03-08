import { ApplicationStatus, ApplicationItem } from '@/lib/applications-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

type RecruiterApplicationsTableProps = {
  items: ApplicationItem[];
  action: (formData: FormData) => Promise<void>;
};

const STATUS_OPTIONS: ApplicationStatus[] = ['APPLIED', 'REVIEWING', 'INTERVIEW', 'OFFER', 'REJECTED'];

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'info' | 'danger'> = {
  APPLIED: 'default',
  REVIEWING: 'info',
  INTERVIEW: 'success',
  OFFER: 'success',
  REJECTED: 'danger',
};

export function RecruiterApplicationsTable({ items, action }: RecruiterApplicationsTableProps) {
  if (!items.length) {
    return <EmptyState title="No applications" description="No applications found for your jobs." />;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article key={item.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-zinc-300">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-zinc-900">{item.candidate.name}</p>
              <p className="text-xs text-zinc-500">{item.candidate.email}</p>
              <p className="mt-1 text-xs text-zinc-600">
                Job: {item.job.title} · Score: {Math.round(item.matchScore)}%
              </p>
              {item.matchingSnapshot ? (
                <div className="mt-2 grid gap-2 text-xs text-zinc-600 md:grid-cols-2">
                  <p>Strengths: {item.matchingSnapshot.strengths.slice(0, 2).join(', ') || 'None'}</p>
                  <p>Gaps: {item.matchingSnapshot.gaps.slice(0, 2).join(', ') || 'None'}</p>
                </div>
              ) : null}
              {item.matchingSnapshot?.warnings.length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.matchingSnapshot.warnings.slice(0, 2).map((warning) => (
                    <Badge key={`${item.id}-${warning}`} variant="warning">{warning}</Badge>
                  ))}
                </div>
              ) : null}
            </div>
            <Badge variant={statusVariant[item.status] ?? 'default'}>{item.status}</Badge>
          </div>

          <form action={action} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="applicationId" value={item.id} />
            <select
              name="status"
              defaultValue={item.status}
              className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <input
              name="notes"
              placeholder="Notes (optional)"
              defaultValue={item.notes ?? ''}
              className="h-9 min-w-56 rounded-lg border border-zinc-300 bg-white px-3 text-sm focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
            />
            <Button type="submit" size="sm">Update</Button>
          </form>
        </article>
      ))}
    </div>
  );
}
