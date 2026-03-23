'use client';

import type { CvExperience } from '@/types/cv-builder';
import { SectionCard } from './section-card';

type Props = {
  data: CvExperience[];
  onChange: (experience: CvExperience[]) => void;
};

const EMPTY_ENTRY: CvExperience = {
  role: '',
  company: '',
  startDate: '',
  endDate: '',
  description: '',
  tech: [],
};

export function ExperienceSection({ data, onChange }: Props) {
  const add = () => onChange([...data, { ...EMPTY_ENTRY }]);
  const remove = (index: number) => onChange(data.filter((_, i) => i !== index));
  const update = (index: number, field: keyof CvExperience, value: unknown) => {
    const updated = [...data];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const inputClasses = "w-full rounded-xl border border-zinc-200/80 bg-zinc-50/50 px-4 py-3 text-[14px] text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all placeholder:text-zinc-400 hover:bg-zinc-50 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10";
  const labelClasses = "mb-1.5 block text-[13px] font-semibold tracking-wide text-zinc-700";

  return (
    <SectionCard title="Kinh nghiệm làm việc" icon="💼" defaultExpanded={data.length > 0}>
      <div className="space-y-6">
        {data.map((entry, index) => (
          <div key={index} className="relative rounded-2xl border border-zinc-200/80 bg-zinc-50/40 p-5 shadow-sm transition-all hover:bg-zinc-50/80">
            <button
              type="button"
              onClick={() => remove(index)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-zinc-400 shadow-sm transition-all hover:bg-red-50 hover:text-red-500 hover:shadow"
              title="Xóa"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="grid gap-5 sm:grid-cols-2 lg:pr-10">
              <div>
                <label className={labelClasses}>
                  Vị trí <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={entry.role}
                  onChange={(e) => update(index, 'role', e.target.value)}
                  placeholder="Ví dụ: Backend Developer"
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>
                  Công ty <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={entry.company}
                  onChange={(e) => update(index, 'company', e.target.value)}
                  placeholder="Ví dụ: FPT Software"
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>
                  Bắt đầu <span className="text-red-500">*</span>
                </label>
                <input
                  type="month"
                  value={entry.startDate}
                  onChange={(e) => update(index, 'startDate', e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Kết thúc</label>
                <input
                  type="month"
                  value={entry.endDate ?? ''}
                  onChange={(e) => update(index, 'endDate', e.target.value || undefined)}
                  className={inputClasses}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClasses}>Mô tả công việc</label>
                <textarea
                  value={entry.description ?? ''}
                  onChange={(e) => update(index, 'description', e.target.value)}
                  placeholder="Mô tả công việc, thành tựu hoặc các project nổi bật..."
                  rows={3}
                  className={`${inputClasses} resize-y min-h-[80px] leading-relaxed`}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClasses}>Công nghệ (phân cách bằng dấu phẩy)</label>
                <input
                  type="text"
                  value={(entry.tech ?? []).join(', ')}
                  onChange={(e) =>
                    update(
                      index,
                      'tech',
                      e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    )
                  }
                  placeholder="Node.js, PostgreSQL, Docker"
                  className={inputClasses}
                />
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary-200/60 bg-primary-50/50 py-3.5 text-[14px] font-semibold text-primary-600 transition-all hover:border-primary-300 hover:bg-primary-50"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Thêm kinh nghiệm
        </button>
      </div>
    </SectionCard>
  );
}

