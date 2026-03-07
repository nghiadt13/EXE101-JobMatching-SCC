import Link from 'next/link';
import { JobItem } from '@/lib/jobs-client';

type RecruiterJobStatusActionsProps = {
  job: JobItem;
  publishAction: (formData: FormData) => Promise<void>;
  closeAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
};

export function RecruiterJobStatusActions({
  job,
  publishAction,
  closeAction,
  deleteAction,
}: RecruiterJobStatusActionsProps) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
      <Link
        href={`/dashboard/recruiter/jobs/${job.id}`}
        className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800"
      >
        View details
      </Link>

      <form action={publishAction}>
        <input type="hidden" name="jobId" value={job.id} />
        <button
          type="submit"
          disabled={job.status !== 'DRAFT'}
          className="h-10 w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400"
        >
          Publish
        </button>
      </form>

      <form action={closeAction}>
        <input type="hidden" name="jobId" value={job.id} />
        <button
          type="submit"
          disabled={job.status !== 'PUBLISHED'}
          className="h-10 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400"
        >
          Close
        </button>
      </form>

      <form action={deleteAction}>
        <input type="hidden" name="jobId" value={job.id} />
        <button
          type="submit"
          className="mt-1 h-10 w-full rounded-xl border border-red-200 bg-white px-4 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Delete
        </button>
      </form>
    </div>
  );
}
