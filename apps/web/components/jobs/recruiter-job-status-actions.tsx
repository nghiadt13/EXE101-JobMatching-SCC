import Link from 'next/link';
import { JobItem } from '@/lib/jobs-client';
import { Button } from '@/components/ui/button';
import { ConfirmForm } from '@/components/ui/confirm-form';

type RecruiterJobStatusActionsProps = {
  job: JobItem;
  publishAction: (formData: FormData) => Promise<void>;
  closeAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
};

export function RecruiterJobStatusActions({
  job, publishAction, closeAction, deleteAction,
}: RecruiterJobStatusActionsProps) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
      <Button asChild>
        <Link href={`/dashboard/recruiter/jobs/${job.id}`}>View details</Link>
      </Button>

      <form action={publishAction}>
        <input type="hidden" name="jobId" value={job.id} />
        <Button
          type="submit"
          variant="success"
          className="w-full"
          disabled={job.status !== 'DRAFT'}
        >
          Publish
        </Button>
      </form>

      <form action={closeAction}>
        <input type="hidden" name="jobId" value={job.id} />
        <Button
          type="submit"
          variant="outline"
          className="w-full"
          disabled={job.status !== 'PUBLISHED'}
        >
          Close
        </Button>
      </form>

      <ConfirmForm
        title="Delete this job?"
        description="This will remove the job from your workspace. Use this only when you no longer need the draft or posting."
        confirmLabel="Delete job"
        action={deleteAction}
        triggerLabel="Delete"
        triggerVariant="danger"
        hiddenInputs={{ jobId: job.id }}
      />
    </div>
  );
}
