import Link from 'next/link';
import { JobItem } from '@/lib/jobs-client';
import { RecruiterJobStatusActions } from './recruiter-job-status-actions';

type RecruiterJobsTableProps = {
  jobs: JobItem[];
  publishAction: (formData: FormData) => Promise<void>;
  closeAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
};

export function RecruiterJobsTable({
  jobs,
  publishAction,
  closeAction,
  deleteAction,
}: RecruiterJobsTableProps) {
  if (!jobs.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-600">
        No jobs yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-zinc-100 text-left text-zinc-600">
          <tr>
            <th className="px-4 py-3">Job</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="border-t border-zinc-200 align-top">
              <td className="px-4 py-3">
                <Link href={`/dashboard/recruiter/jobs/${job.id}`} className="font-medium text-zinc-900 underline">
                  {job.title}
                </Link>
                <p className="text-zinc-500">{job.employmentType}</p>
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
                  {job.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <RecruiterJobStatusActions
                  job={job}
                  publishAction={publishAction}
                  closeAction={closeAction}
                  deleteAction={deleteAction}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
