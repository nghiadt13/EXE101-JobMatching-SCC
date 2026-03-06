import { CvItem } from '@/lib/cv-client';
import { CvEditForm } from './cv-edit-form';
import { ExpandableSummary } from './expandable-summary';
import { ExpandableChips as ChipsSection } from './expandable-chips';

type CvListProps = {
  items: CvItem[];
  setPrimaryAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  updateAction: (formData: FormData) => Promise<void>;
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function toRecordArray(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> =>
      !!item && typeof item === 'object' && !Array.isArray(item),
  );
}

function preferStringArray(primary: string[], fallback: string[]): string[] {
  return primary.length ? primary : fallback;
}

function preferRecordArray(
  primary: Array<Record<string, unknown>>,
  fallback: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  return primary.length ? primary : fallback;
}

function formatMonthYear(dateString: unknown): string | null {
  if (typeof dateString !== 'string' || !dateString.trim()) return null;
  const match = dateString.trim().match(/^(\d{4})-(\d{2})$/);
  if (match) {
    return `${match[2]}/${match[1]}`;
  }
  return dateString.trim();
}

function ObjectSection({
  title,
  rows,
  pickTitle,
  pickSubtitle,
}: {
  title: string;
  rows: Array<Record<string, unknown>>;
  pickTitle: (row: Record<string, unknown>) => string;
  pickSubtitle: (row: Record<string, unknown>) => string;
}) {
  if (!rows.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">{title}</p>
      <div className="mt-2 space-y-2">
        {rows.slice(0, 4).map((row, index) => (
          <div key={`${title}-${index}`} className="rounded-md border border-zinc-200 bg-zinc-50 p-2 text-xs">
            <p className="font-medium text-zinc-800">{pickTitle(row) || 'N/A'}</p>
            <p className="text-zinc-600">{pickSubtitle(row)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CvList({
  items,
  setPrimaryAction,
  deleteAction,
  updateAction,
}: CvListProps) {
  const parseStatusLabel: Record<CvItem['parseStatus'], string> = {
    parsed_ok: 'Parsed OK',
    fallback: 'Fallback Parse',
    needs_review: 'Needs Review',
  };

  if (!items.length) {
    return (
      <section className="rounded-2xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-600">
        No CV uploaded yet.
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {items.map((cv) => {
        const location = cv.normalizedProfile?.location;
        const locationStr = location
          ? [location.city, location.country].filter(Boolean).join(', ')
          : null;

        return (
          <article key={cv.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-medium text-zinc-900">{cv.fileName}</p>
                {cv.normalizedProfile?.title && (
                  <p className="mt-0.5 text-sm font-medium text-zinc-700">
                    {cv.normalizedProfile.title}
                    {locationStr && <span className="text-zinc-500"> • {locationStr}</span>}
                  </p>
                )}
                <p className="mt-1 text-sm text-zinc-500">
                  {(cv.fileSize / 1024).toFixed(1)} KB • {new Date(cv.createdAt).toLocaleString()}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {cv.isPrimary && (
                    <span className="rounded-full bg-zinc-900 px-2 py-1 text-xs font-medium text-white">
                      Primary CV
                    </span>
                  )}
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                    {parseStatusLabel[cv.parseStatus]}
                  </span>
                </div>
              </div>
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
            </div>

            {/* Summary */}
            {(cv.normalizedProfile?.summary ?? cv.parsedData.summary) && (
              <ExpandableSummary
                text={cv.normalizedProfile?.summary ?? String(cv.parsedData.summary)}
              />
            )}

            {/* Skills Section */}
            <div className="mt-4">
              <ChipsSection
                title="Skills"
                items={preferStringArray(
                  cv.normalizedProfile?.skills ?? [],
                  cv.skills,
                )}
              />
            </div>

            {/* Details Grid */}
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <ChipsSection
                title="Languages"
                items={preferStringArray(
                  cv.normalizedProfile?.languages ?? [],
                  toStringArray(cv.parsedData.languages),
                )}
              />
              <ChipsSection
                title="Certifications"
                items={preferStringArray(
                  cv.normalizedProfile?.certifications ?? [],
                  toStringArray(cv.parsedData.certifications),
                )}
              />
              <ObjectSection
                title="Experience"
                rows={preferRecordArray(
                  (cv.normalizedProfile?.experience ?? []).map((exp) => ({
                    role: exp.role,
                    company: exp.company,
                    startDate: exp.startDate,
                    endDate: exp.endDate,
                    tech: exp.tech,
                  })),
                  toRecordArray(cv.parsedData.experience),
                )}
                pickTitle={(row) => String(row.role ?? '')}
                pickSubtitle={(row) => {
                  const parts = [String(row.company ?? '')];
                  if (row.startDate || row.endDate) {
                    const start = formatMonthYear(row.startDate) ?? '?';
                    const end = formatMonthYear(row.endDate) ?? 'Present';
                    parts.push(`${start} - ${end}`);
                  }
                  const companyDate = parts.filter(Boolean).join(' • ');
                  const techDesc = Array.isArray(row.tech) && row.tech.length
                    ? `Tech: ${row.tech.join(', ')}`
                    : '';
                  return [companyDate, techDesc].filter(Boolean).join(' | ');
                }}
              />
              <ObjectSection
                title="Education"
                rows={preferRecordArray(
                  cv.normalizedProfile?.education ?? [],
                  toRecordArray(cv.parsedData.education),
                )}
                pickTitle={(row) => String(row.degree ?? row.school ?? '')}
                pickSubtitle={(row) => {
                  const parts = [String(row.school ?? row.field ?? '')];
                  if (row.startDate || row.endDate) {
                    const start = formatMonthYear(row.startDate) ?? '?';
                    const end = formatMonthYear(row.endDate) ?? 'Present';
                    parts.push(`${start} - ${end}`);
                  }
                  return parts.filter(Boolean).join(' • ');
                }}
              />
              <ObjectSection
                title="Projects"
                rows={preferRecordArray(
                  (cv.normalizedProfile?.projects ?? []).map((project) => ({
                    name: project.name,
                    description: project.description,
                    tech: project.tech,
                  })),
                  toRecordArray(cv.parsedData.projects),
                )}
                pickTitle={(row) => String(row.name ?? '')}
                pickSubtitle={(row) => {
                  const techDesc = Array.isArray(row.tech) && row.tech.length
                    ? `Tech: ${row.tech.join(', ')}`
                    : '';
                  return techDesc || String(row.description ?? '');
                }}
              />
            </div>

            {/* Collapsible Edit Form */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-zinc-600 hover:text-zinc-900">
                Edit parsed data ▾
              </summary>
              <div className="mt-2">
                <CvEditForm cv={cv} updateAction={updateAction} />
              </div>
            </details>

            {/* Delete Button */}
            <form action={deleteAction} className="mt-3">
              <input type="hidden" name="cvId" value={cv.id} />
              <button
                type="submit"
                className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Delete
              </button>
            </form>
          </article>
        );
      })}
    </section>
  );
}
