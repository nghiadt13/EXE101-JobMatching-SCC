import { ApplicationItem } from '@/lib/applications-client';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

type CandidateApplicationsTableProps = {
  items: ApplicationItem[];
};

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'info' | 'danger'> = {
  APPLIED: 'default',
  REVIEWING: 'info',
  INTERVIEW: 'success',
  OFFER: 'success',
  REJECTED: 'danger',
};

export function CandidateApplicationsTable({ items }: CandidateApplicationsTableProps) {
  if (!items.length) {
    return (
      <EmptyState
        title="No applications yet"
        description="You have not applied to any job yet. Browse open positions to get started."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-50 text-zinc-600">
          <tr>
            <th className="px-4 py-3 font-medium">Job</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Match</th>
            <th className="px-4 py-3 font-medium">Applied</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t border-zinc-100 transition-colors hover:bg-zinc-50/50">
              <td className="px-4 py-3">
                <p className="font-medium text-zinc-900">{item.job.title}</p>
                <p className="text-xs text-zinc-500">{item.cv.fileName}</p>
              </td>
              <td className="px-4 py-3">
                <Badge variant={statusVariant[item.status] ?? 'default'}>{item.status}</Badge>
              </td>
              <td className="px-4 py-3 text-zinc-700">
                <p>{Math.round(item.matchScore)}%</p>
                {item.matchingSnapshot ? (
                  <p className="mt-1 text-xs text-zinc-500">
                    {item.matchingSnapshot.strengths.slice(0, 2).join(', ') || 'Profile review needed'}
                  </p>
                ) : null}
                {item.matchingSnapshot?.warnings.length ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.matchingSnapshot.warnings.slice(0, 2).map((warning) => (
                      <Badge key={`${item.id}-${warning}`} variant="warning">{warning}</Badge>
                    ))}
                  </div>
                ) : null}
              </td>
              <td className="px-4 py-3 text-zinc-500">
                {new Date(item.appliedAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
