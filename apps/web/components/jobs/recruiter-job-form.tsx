type RecruiterJobFormProps = {
  submitLabel: string;
  action: (formData: FormData) => Promise<void>;
  initialValues?: {
    title?: string;
    description?: string;
    skills?: string[];
    employmentType?: string;
    salaryMin?: number | null;
    salaryMax?: number | null;
  };
};

export function RecruiterJobForm({
  submitLabel,
  action,
  initialValues,
}: RecruiterJobFormProps) {
  return (
    <form action={action} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm font-medium text-zinc-700">Title</span>
          <input
            name="title"
            defaultValue={initialValues?.title ?? ''}
            className="h-10 w-full rounded-lg border border-zinc-300 px-3"
            minLength={3}
            required
          />
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm font-medium text-zinc-700">Description</span>
          <textarea
            name="description"
            defaultValue={initialValues?.description ?? ''}
            className="min-h-28 w-full rounded-lg border border-zinc-300 px-3 py-2"
            minLength={10}
            required
          />
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm font-medium text-zinc-700">Skills (comma separated)</span>
          <input
            name="skills"
            defaultValue={initialValues?.skills?.join(', ') ?? ''}
            className="h-10 w-full rounded-lg border border-zinc-300 px-3"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-zinc-700">Employment Type</span>
          <input
            name="employmentType"
            defaultValue={initialValues?.employmentType ?? 'FULL_TIME'}
            className="h-10 w-full rounded-lg border border-zinc-300 px-3"
            required
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-zinc-700">Salary Min</span>
          <input
            type="number"
            name="salaryMin"
            defaultValue={initialValues?.salaryMin ?? ''}
            className="h-10 w-full rounded-lg border border-zinc-300 px-3"
            min={0}
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-zinc-700">Salary Max</span>
          <input
            type="number"
            name="salaryMax"
            defaultValue={initialValues?.salaryMax ?? ''}
            className="h-10 w-full rounded-lg border border-zinc-300 px-3"
            min={0}
          />
        </label>
      </div>

      <button
        type="submit"
        className="h-10 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700"
      >
        {submitLabel}
      </button>
    </form>
  );
}
