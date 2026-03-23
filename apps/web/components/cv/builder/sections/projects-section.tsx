'use client';

import type { CvProject } from '@/types/cv-builder';

type Props = {
  data: CvProject[];
  onChange: (projects: CvProject[]) => void;
};

const EMPTY_ENTRY: CvProject = { name: '', description: '', tech: [] };

export function ProjectsSection({ data, onChange }: Props) {
  const add = () => onChange([...data, { ...EMPTY_ENTRY }]);
  const remove = (index: number) => onChange(data.filter((_, i) => i !== index));
  const update = (index: number, field: keyof CvProject, value: unknown) => {
    const updated = [...data];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <fieldset className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <legend className="px-2 text-sm font-semibold text-zinc-700">Dự án</legend>
      <div className="space-y-4">
        {data.map((entry, index) => (
          <div key={index} className="relative rounded-lg border border-zinc-100 bg-zinc-50 p-3">
            <button type="button" onClick={() => remove(index)} className="absolute right-2 top-2 rounded-md p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="Xóa">✕</button>
            <div className="grid gap-3 pr-6">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">Tên dự án <span className="text-red-500">*</span></label>
                <input type="text" value={entry.name} onChange={(e) => update(index, 'name', e.target.value)} placeholder="JobMatching MVP" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">Mô tả</label>
                <textarea value={entry.description ?? ''} onChange={(e) => update(index, 'description', e.target.value)} placeholder="Mô tả ngắn về dự án..." rows={2} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">Công nghệ (phân cách bằng dấu phẩy)</label>
                <input type="text" value={(entry.tech ?? []).join(', ')} onChange={(e) => update(index, 'tech', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} placeholder="Next.js, NestJS, Prisma" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
              </div>
            </div>
          </div>
        ))}
        <button type="button" onClick={add} className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-zinc-300 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:border-primary-400 hover:text-primary-600">
          <span className="text-lg">+</span> Thêm dự án
        </button>
      </div>
    </fieldset>
  );
}
