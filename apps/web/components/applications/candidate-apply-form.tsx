type CandidateApplyFormProps = {
  jobId: string;
  cvs: Array<{ id: string; fileName: string; isPrimary: boolean }>;
  action: (formData: FormData) => Promise<void>;
};

export function CandidateApplyForm({ jobId, cvs, action }: CandidateApplyFormProps) {
  return (
    <form action={action} className="mt-6 space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <input type="hidden" name="jobId" value={jobId} />
      <label className="block text-sm font-medium text-zinc-800" htmlFor="cvId">
        Select CV to apply
      </label>
      <select
        id="cvId"
        name="cvId"
        defaultValue={cvs.find((item) => item.isPrimary)?.id ?? cvs[0]?.id ?? ''}
        className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm"
      >
        {cvs.map((cv) => (
          <option key={cv.id} value={cv.id}>
            {cv.fileName}
            {cv.isPrimary ? ' (Primary)' : ''}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700"
      >
        Apply now
      </button>
    </form>
  );
}
