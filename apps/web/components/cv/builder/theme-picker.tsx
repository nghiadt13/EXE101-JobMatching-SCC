'use client';

import type { TemplateId } from '@/types/cv-builder';
import { TEMPLATES } from '@/types/cv-builder';

type Props = {
  templateId: string;
  onChange: (templateId: TemplateId) => void;
};

export function ThemePicker({ templateId, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      {TEMPLATES.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            templateId === t.id
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
          title={t.description}
        >
          {t.name}
        </button>
      ))}
    </div>
  );
}
