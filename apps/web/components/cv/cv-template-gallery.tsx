import Link from 'next/link';
import { TEMPLATES } from '@/types/cv-builder';

export function CvTemplateGallery() {
  const templateColors: Record<string, string> = {
    simple: 'from-zinc-500 to-zinc-700',
    professional: 'from-blue-600 to-blue-800',
    modern: 'from-violet-500 to-purple-700',
  };

  const templateIcons: Record<string, string> = {
    simple: '📄',
    professional: '💼',
    modern: '✨',
  };

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {TEMPLATES.map((template) => (
        <div
          key={template.id}
          className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
        >
          {/* Preview header */}
          <div
            className={`flex h-40 items-center justify-center bg-gradient-to-br ${templateColors[template.id]}`}
          >
            <div className="text-center">
              <span className="text-5xl">{templateIcons[template.id]}</span>
              <p className="mt-2 text-sm font-medium text-white/80">Preview</p>
            </div>
          </div>

          {/* Info */}
          <div className="p-5">
            <h3 className="text-lg font-bold text-zinc-900">{template.name}</h3>
            <p className="mt-1 text-sm text-zinc-500">{template.description}</p>
            <Link
              href={`/dashboard/candidate/cvs/create?template=${template.id}`}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow"
            >
              🎨 Dùng mẫu này
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
