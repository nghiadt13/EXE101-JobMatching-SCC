import { CvItem } from '@/lib/cv-client';

type CvEditFormProps = {
  cv: CvItem;
  updateAction: (formData: FormData) => Promise<void>;
};

export function CvEditForm({ cv, updateAction }: CvEditFormProps) {
  const summary =
    cv.candidateProfile?.summary ??
    cv.normalizedProfile?.summary ??
    (typeof cv.parsedData.summary === 'string' ? cv.parsedData.summary : '');
  const languages =
    cv.candidateProfile?.languages?.length
      ? cv.candidateProfile.languages
      : cv.normalizedProfile?.languages?.length
        ? cv.normalizedProfile.languages
      : (Array.isArray(cv.parsedData.languages)
          ? cv.parsedData.languages.filter((item): item is string => typeof item === 'string')
          : []);

  return (
    <form action={updateAction} className="space-y-2 rounded-lg border border-zinc-200 p-3">
      <input type="hidden" name="cvId" value={cv.id} />
      <label className="block space-y-1">
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-600">
          Skills (one per line)
        </span>
        <textarea
          name="skills"
          defaultValue={(cv.candidateProfile?.skills ?? cv.normalizedProfile?.skills ?? cv.skills).join('\n')}
          className="min-h-24 w-full rounded-md border border-zinc-300 px-2 py-2 text-sm leading-relaxed"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-600">
          Summary
        </span>
        <textarea
          name="summary"
          defaultValue={summary}
          className="min-h-20 w-full rounded-md border border-zinc-300 px-2 py-2 text-sm"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-600">
          Languages (comma/new line)
        </span>
        <textarea
          name="languages"
          defaultValue={languages.join(', ')}
          className="min-h-16 w-full rounded-md border border-zinc-300 px-2 py-2 text-sm"
        />
      </label>
      <button
        type="submit"
        className="h-9 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
      >
        Save parsed data
      </button>
    </form>
  );
}
