'use client';

import type { RewriteSuggestion } from '@/lib/cv-client';

type Props = {
  data: RewriteSuggestion;
  onApply?: (section: string, newText: string) => void;
};

const SECTION_LABELS: Record<string, string> = {
  summary: 'Tóm tắt / Mục tiêu',
  skills: 'Kỹ năng',
  experience: 'Kinh nghiệm',
  education: 'Học vấn',
  projects: 'Dự án',
  certifications: 'Chứng chỉ',
};

export function SuggestionRewriteCard({ data, onApply }: Props) {
  const label = SECTION_LABELS[data.section] ?? data.section;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h4 className="mb-3 text-sm font-semibold text-zinc-800">
        📝 {label}
      </h4>

      <div className="mb-2 rounded-lg bg-red-50 p-3">
        <p className="mb-1 text-xs font-medium text-red-500">Trước</p>
        <p className="text-sm text-zinc-700 line-through decoration-red-300">{data.original}</p>
      </div>

      <div className="mb-2 rounded-lg bg-emerald-50 p-3">
        <p className="mb-1 text-xs font-medium text-emerald-500">Sau</p>
        <p className="text-sm text-zinc-800 font-medium">{data.suggested}</p>
      </div>

      {data.reason && (
        <p className="mb-3 text-xs text-zinc-500 italic">
          💡 {data.reason}
        </p>
      )}

      {onApply && (
        <button
          type="button"
          onClick={() => onApply(data.section, data.suggested)}
          className="w-full rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow"
        >
          ✨ Áp dụng gợi ý
        </button>
      )}
    </div>
  );
}
