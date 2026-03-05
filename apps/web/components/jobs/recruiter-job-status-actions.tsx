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
    <div className="flex flex-wrap gap-2">
      <form action={publishAction}>
        <input type="hidden" name="jobId" value={job.id} />
        <button
          type="submit"
          disabled={job.status !== 'DRAFT'}
          className="h-9 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Publish
        </button>
      </form>

      <form action={closeAction}>
        <input type="hidden" name="jobId" value={job.id} />
        <button
          type="submit"
          disabled={job.status !== 'PUBLISHED'}
          className="h-9 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Close
        </button>
      </form>

      <form action={deleteAction}>
        <input type="hidden" name="jobId" value={job.id} />
        <button
          type="submit"
          className="h-9 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Delete
        </button>
      </form>
    </div>
  );
}
