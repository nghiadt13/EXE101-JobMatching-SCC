import { Button } from '@/components/ui/button';
import { formatMultilineList } from '@/lib/job-description-format';

type RecruiterJobFormProps = {
  submitLabel: string;
  action: (formData: FormData) => Promise<void>;
  initialValues?: {
    title?: string;
    summary?: string;
    requirements?: string[];
    benefits?: string[];
    skills?: string[];
    employmentType?: string;
    salaryMin?: number | null;
    salaryMax?: number | null;
  };
};

const inputClass =
  'h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2';
const textareaClass =
  'w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2';

export function RecruiterJobForm({ submitLabel, action, initialValues }: RecruiterJobFormProps) {
  return (
    <form action={action} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm font-medium text-zinc-700">Title</span>
          <input name="title" defaultValue={initialValues?.title ?? ''} className={inputClass} minLength={3} required />
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm font-medium text-zinc-700">Summary</span>
          <textarea name="summary" defaultValue={initialValues?.summary ?? ''} className={`min-h-28 ${textareaClass}`} minLength={10} required />
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm font-medium text-zinc-700">Requirements (one per line)</span>
          <textarea name="requirements" defaultValue={formatMultilineList(initialValues?.requirements)} className={`min-h-28 ${textareaClass}`} />
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm font-medium text-zinc-700">Benefits (one per line)</span>
          <textarea name="benefits" defaultValue={formatMultilineList(initialValues?.benefits)} className={`min-h-24 ${textareaClass}`} />
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm font-medium text-zinc-700">Skills (comma separated)</span>
          <input name="skills" defaultValue={initialValues?.skills?.join(', ') ?? ''} className={inputClass} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-zinc-700">Employment Type</span>
          <input name="employmentType" defaultValue={initialValues?.employmentType ?? 'FULL_TIME'} className={inputClass} required />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-zinc-700">Salary Min</span>
          <input type="number" name="salaryMin" defaultValue={initialValues?.salaryMin ?? ''} className={inputClass} min={0} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-zinc-700">Salary Max</span>
          <input type="number" name="salaryMax" defaultValue={initialValues?.salaryMax ?? ''} className={inputClass} min={0} />
        </label>
      </div>

      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
