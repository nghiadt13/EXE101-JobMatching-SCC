'use client';

import type { CvEducation } from '@/types/cv-builder';

type Props = {
  data: CvEducation[];
  onChange: (education: CvEducation[]) => void;
};

const EMPTY_ENTRY: CvEducation = { school: '', degree: '', field: '', startDate: '', endDate: '', gpa: '' };

export function EducationSection({ data, onChange }: Props) {
  const add = () => onChange([...data, { ...EMPTY_ENTRY }]);
  const remove = (index: number) => onChange(data.filter((_, i) => i !== index));
  const update = (index: number, field: keyof CvEducation, value: string) => {
    const updated = [...data];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <fieldset className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <legend className="px-2 text-sm font-semibold text-zinc-700">Học vấn</legend>
      <div className="space-y-4">
        {data.map((entry, index) => (
          <div key={index} className="relative rounded-lg border border-zinc-100 bg-zinc-50 p-3">
            <button type="button" onClick={() => remove(index)} className="absolute right-2 top-2 rounded-md p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="Xóa">✕</button>
            <div className="grid gap-3 sm:grid-cols-2 pr-6">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">Trường <span className="text-red-500">*</span></label>
                <input type="text" value={entry.school} onChange={(e) => update(index, 'school', e.target.value)} placeholder="ĐH Bách Khoa" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">Bằng cấp <span className="text-red-500">*</span></label>
                <input type="text" value={entry.degree} onChange={(e) => update(index, 'degree', e.target.value)} placeholder="Cử nhân" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">Chuyên ngành</label>
                <input type="text" value={entry.field ?? ''} onChange={(e) => update(index, 'field', e.target.value)} placeholder="Khoa học máy tính" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">GPA</label>
                <input type="text" value={entry.gpa ?? ''} onChange={(e) => update(index, 'gpa', e.target.value)} placeholder="3.5/4.0" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">Bắt đầu</label>
                <input type="month" value={entry.startDate ?? ''} onChange={(e) => update(index, 'startDate', e.target.value)} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">Kết thúc</label>
                <input type="month" value={entry.endDate ?? ''} onChange={(e) => update(index, 'endDate', e.target.value)} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
              </div>
            </div>
          </div>
        ))}
        <button type="button" onClick={add} className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-zinc-300 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:border-primary-400 hover:text-primary-600">
          <span className="text-lg">+</span> Thêm học vấn
        </button>
      </div>
    </fieldset>
  );
}
