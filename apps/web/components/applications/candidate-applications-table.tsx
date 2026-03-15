import Link from 'next/link';
import { ApplicationItem } from '@/lib/applications-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PUBLIC_JOBS_LISTING_ROUTE } from '@/lib/routes';

type CandidateApplicationsTableProps = {
  items: ApplicationItem[];
};

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'info' | 'danger'> = {
  PENDING_MATCHING: 'warning',
  APPLIED: 'default',
  REVIEWING: 'info',
  INTERVIEW: 'success',
  OFFER: 'success',
  REJECTED: 'danger',
};

const statusLabel: Record<string, string> = {
  PENDING_MATCHING: 'Analyzing…',
};

export function CandidateApplicationsTable({ items }: CandidateApplicationsTableProps) {
  if (!items.length) {
    return (
      <EmptyState
        title="No applications yet"
        description="You haven't applied to any job yet."
        action={
          <Button asChild size="sm">
            <Link href={PUBLIC_JOBS_LISTING_ROUTE}>Browse open positions</Link>
          </Button>
        }
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
                {item.job.slug ? (
                  <Link href={`/jobs/${item.job.slug}`} className="font-medium text-zinc-900 hover:underline">
                    {item.job.title}
                  </Link>
                ) : (
                  <p className="font-medium text-zinc-900">{item.job.title}</p>
                )}
                <p className="text-xs text-zinc-500">{item.cv.fileName}</p>
              </td>
              <td className="px-4 py-3">
                <Badge variant={statusVariant[item.status] ?? 'default'}>
                  {statusLabel[item.status] ?? item.status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-zinc-700">
                {item.status === 'PENDING_MATCHING' ? (
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin text-amber-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    <span className="text-xs text-amber-600">Calculating match…</span>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
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
