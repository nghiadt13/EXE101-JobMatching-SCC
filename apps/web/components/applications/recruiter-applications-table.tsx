import { ApplicationStatus, ApplicationItem } from '@/lib/applications-client';

type RecruiterApplicationsTableProps = {
  items: ApplicationItem[];
  action: (formData: FormData) => Promise<void>;
};

const STATUS_OPTIONS: ApplicationStatus[] = [
  'APPLIED',
  'REVIEWING',
  'INTERVIEW',
  'OFFER',
  'REJECTED',
];

export function RecruiterApplicationsTable({ items, action }: RecruiterApplicationsTableProps) {
  if (!items.length) {
    return <p className="text-sm text-zinc-500">No applications found for your jobs.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article key={item.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-zinc-900">{item.candidate.name}</p>
              <p className="text-xs text-zinc-500">{item.candidate.email}</p>
              <p className="mt-1 text-xs text-zinc-600">
                Job: {item.job.title} | Score: {Math.round(item.matchScore)}%
              </p>
            </div>
            <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
              {item.status}
            </span>
          </div>

          <form action={action} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="applicationId" value={item.id} />
            <select
              name="status"
              defaultValue={item.status}
              className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <input
              name="notes"
              placeholder="Notes (optional)"
              defaultValue={item.notes ?? ''}
              className="h-9 min-w-56 rounded-lg border border-zinc-300 bg-white px-3 text-sm"
            />
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Update
            </button>
          </form>
        </article>
      ))}
    </div>
  );
}
