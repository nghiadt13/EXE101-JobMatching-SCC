'use client';

import type { CvProfile } from '@/types/cv-builder';

type Props = {
  data: CvProfile;
  onChange: (profile: CvProfile) => void;
};

export function ProfileSection({ data, onChange }: Props) {
  const update = (field: keyof CvProfile, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <fieldset className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <legend className="px-2 text-sm font-semibold text-zinc-700">Thông tin cá nhân</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-600">
            Họ và tên <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Nguyễn Văn A"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Email</label>
          <input
            type="email"
            value={data.email ?? ''}
            onChange={(e) => update('email', e.target.value)}
            placeholder="email@example.com"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Số điện thoại</label>
          <input
            type="tel"
            value={data.phone ?? ''}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="0909 123 456"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Website / LinkedIn</label>
          <input
            type="url"
            value={data.website ?? ''}
            onChange={(e) => update('website', e.target.value)}
            placeholder="linkedin.com/in/name"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Thành phố</label>
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
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-600">Mục tiêu nghề nghiệp</label>
          <textarea
            value={data.summary ?? ''}
            onChange={(e) => update('summary', e.target.value)}
            placeholder="Mô tả ngắn gọn mục tiêu nghề nghiệp của bạn..."
            rows={3}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
      </div>
    </fieldset>
  );
}
