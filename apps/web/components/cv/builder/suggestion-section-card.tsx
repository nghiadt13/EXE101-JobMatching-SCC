'use client';

import { useState } from 'react';
import type { SectionSuggestion } from '@/lib/cv-client';

type Props = {
  data: SectionSuggestion;
};

const PRIORITY_CONFIG = {
  high: { icon: '🔴', label: 'Ưu tiên cao', color: 'border-red-200 bg-red-50' },
  medium: { icon: '🟡', label: 'Ưu tiên trung bình', color: 'border-amber-200 bg-amber-50' },
  low: { icon: '🟢', label: 'Ưu tiên thấp', color: 'border-green-200 bg-green-50' },
};

const SECTION_LABELS: Record<string, string> = {
  summary: 'Tóm tắt / Mục tiêu',
  skills: 'Kỹ năng',
  experience: 'Kinh nghiệm',
  education: 'Học vấn',
  projects: 'Dự án',
  certifications: 'Chứng chỉ',
};

export function SuggestionSectionCard({ data }: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const cfg = PRIORITY_CONFIG[data.priority];
  const label = SECTION_LABELS[data.section] ?? data.section;

  return (
    <div className={`rounded-xl border ${cfg.color} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-zinc-800">
          {cfg.icon} {label}
        </span>
        <span className="text-xs text-zinc-500">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>
      {isOpen && (
        <div className="border-t border-zinc-200/50 px-4 pb-3 pt-2">
          <ul className="space-y-1.5">
            {data.suggestions.map((suggestion, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                <span className="mt-0.5 text-zinc-400">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
