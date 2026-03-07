import { ApplicationItem } from '@/lib/applications-client';

type CandidateApplicationsTableProps = {
  items: ApplicationItem[];
};

export function CandidateApplicationsTable({ items }: CandidateApplicationsTableProps) {
  if (!items.length) {
    return <p className="text-sm text-zinc-500">You have not applied to any job yet.</p>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
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
            <tr key={item.id} className="border-t border-zinc-100">
              <td className="px-4 py-3">
                <p className="font-medium text-zinc-900">{item.job.title}</p>
                <p className="text-xs text-zinc-500">{item.cv.fileName}</p>
              </td>
              <td className="px-4 py-3 text-zinc-700">{item.status}</td>
              <td className="px-4 py-3 text-zinc-700">
                <p>{Math.round(item.matchScore)}%</p>
                {item.matchingSnapshot?.warnings.length ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.matchingSnapshot.warnings.slice(0, 2).map((warning) => (
                      <span
                        key={`${item.id}-${warning}`}
                        className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800"
                      >
                        {warning}
                      </span>
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
