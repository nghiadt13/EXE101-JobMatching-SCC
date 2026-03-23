'use client';

import type { CvProfile } from '@/types/cv-builder';
import { SectionCard } from './section-card';

type Props = {
  data: CvProfile;
  onChange: (profile: CvProfile) => void;
};

export function ProfileSection({ data, onChange }: Props) {
  const update = (field: keyof CvProfile, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const inputClasses = "w-full rounded-xl border border-zinc-200/80 bg-zinc-50/50 px-4 py-3 text-[14px] text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all placeholder:text-zinc-400 hover:bg-zinc-50 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10";
  const labelClasses = "mb-1.5 block text-[13px] font-semibold tracking-wide text-zinc-700";

  return (
    <SectionCard title="Thông tin cá nhân" icon="👤" defaultExpanded={true}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClasses}>
            Họ và tên <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Ví dụ: Nguyễn Văn A"
            className={inputClasses}
          />
        </div>
        <div>
          <label className={labelClasses}>Email</label>
          <input
            type="email"
            value={data.email ?? ''}
            onChange={(e) => update('email', e.target.value)}
            placeholder="email@example.com"
            className={inputClasses}
          />
        </div>
        <div>
          <label className={labelClasses}>Số điện thoại</label>
          <input
            type="tel"
            value={data.phone ?? ''}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="0909 123 456"
            className={inputClasses}
          />
        </div>
        <div>
          <label className={labelClasses}>Website / LinkedIn</label>
          <input
            type="url"
            value={data.website ?? ''}
            onChange={(e) => update('website', e.target.value)}
            placeholder="linkedin.com/in/name"
            className={inputClasses}
          />
        </div>
        <div>
          <label className={labelClasses}>Thành phố</label>
          <input
            type="text"
            value={data.location?.city ?? ''}
            onChange={(e) =>
              onChange({
                ...data,
                location: { ...data.location, city: e.target.value },
              })
            }
            placeholder="Hồ Chí Minh"
            className={inputClasses}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClasses}>Mục tiêu nghề nghiệp</label>
          <textarea
            value={data.summary ?? ''}
            onChange={(e) => update('summary', e.target.value)}
            placeholder="Mô tả ngắn gọn mục tiêu nghề nghiệp của bạn..."
            rows={4}
            className={`${inputClasses} resize-y min-h-[100px] leading-relaxed`}
          />
        </div>
      </div>
    </SectionCard>
  );
}

