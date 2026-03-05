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
              <td className="px-4 py-3 text-zinc-700">{Math.round(item.matchScore)}%</td>
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
