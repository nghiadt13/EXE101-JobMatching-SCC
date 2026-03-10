'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { trackEvent } from '@/lib/analytics/track';

type CandidateApplyFormProps = {
  jobId: string;
  cvs: Array<{ id: string; fileName: string; isPrimary: boolean }>;
  action: (formData: FormData) => Promise<void>;
};

export function CandidateApplyForm({ jobId, cvs, action }: CandidateApplyFormProps) {
  return (
    <form
      action={action}
      className="mt-6 space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
      onSubmit={() => {
        trackEvent('apply_attempted', { hasPrimaryCv: cvs.some((item) => item.isPrimary) });
      }}
    >
      <input type="hidden" name="jobId" value={jobId} />
      <label className="block text-sm font-medium text-zinc-800" htmlFor="cvId">
        Select CV to apply
      </label>
      <select
        id="cvId"
        name="cvId"
        defaultValue={cvs.find((item) => item.isPrimary)?.id ?? cvs[0]?.id ?? ''}
        className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
      >
        {cvs.map((cv) => (
          <option key={cv.id} value={cv.id}>
            {cv.fileName}
            {cv.isPrimary ? ' (Primary)' : ''}
          </option>
        ))}
      </select>
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Submitting…
        </>
      ) : (
        'Apply now'
      )}
    </Button>
  );
}
