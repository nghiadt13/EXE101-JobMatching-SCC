import { CvItem } from '@/lib/cv-client';
import { CvEditForm } from './cv-edit-form';

type CvListProps = {
  items: CvItem[];
  setPrimaryAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  updateAction: (formData: FormData) => Promise<void>;
};

export function CvList({
  items,
  setPrimaryAction,
  deleteAction,
  updateAction,
}: CvListProps) {
  if (!items.length) {
    return (
      <section className="rounded-2xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-600">
        No CV uploaded yet.
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {items.map((cv) => (
        <article key={cv.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium text-zinc-900">{cv.fileName}</p>
              <p className="text-sm text-zinc-500">
                {(cv.fileSize / 1024).toFixed(1)} KB - {new Date(cv.createdAt).toLocaleString()}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {cv.isPrimary ? (
                  <span className="rounded-full bg-zinc-900 px-2 py-1 text-xs font-medium text-white">
                    Primary CV
                  </span>
                ) : null}
                {cv.skills.slice(0, 6).map((skill) => (
                  <span
                    key={`${cv.id}-${skill}`}
                    className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <form action={setPrimaryAction}>
                <input type="hidden" name="cvId" value={cv.id} />
                <button
                  type="submit"
                  disabled={cv.isPrimary}
                  className="h-9 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Set primary
                </button>
              </form>
              <form action={deleteAction}>
                <input type="hidden" name="cvId" value={cv.id} />
                <button
                  type="submit"
                  className="h-9 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              </form>
            </div>
          </div>

          <div className="mt-4">
            <CvEditForm cv={cv} updateAction={updateAction} />
          </div>
        </article>
      ))}
    </section>
  );
}
