'use client';

import { useRef } from 'react';
import { User, Upload, X } from 'lucide-react';
import type { CvProfile } from '@/types/cv-builder';
import { SectionCard } from './section-card';

type Props = {
  data: CvProfile;
  onChange: (profile: CvProfile) => void;
};

export function ProfileSection({ data, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (field: keyof CvProfile, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ ...data, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    onChange({ ...data, photo: undefined });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const inputClasses = "w-full rounded-xl border border-zinc-200/80 bg-zinc-50/50 px-4 py-3 text-[14px] text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all placeholder:text-zinc-400 hover:bg-zinc-50 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10";
  const labelClasses = "mb-1.5 block text-[13px] font-semibold tracking-wide text-zinc-700";

  return (
    <SectionCard title="Thông tin cá nhân" icon={<User className="h-5 w-5 text-primary-600" />} defaultExpanded={true}>
      <div className="grid gap-5 sm:grid-cols-2 lg:pr-10">
        
        {/* Photo Upload Zone */}
        <div className="sm:col-span-2 flex items-center gap-5">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-dashed border-zinc-300 bg-zinc-50/50 transition-colors hover:border-primary-400 group flex items-center justify-center">
            {data.photo ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={data.photo} alt="Avatar" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </>
            ) : (
              <div
                className="flex h-full w-full cursor-pointer flex-col items-center justify-center text-zinc-400 transition-colors group-hover:text-primary-500"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-6 w-6 mb-1" />
                <span className="text-[10px] font-medium uppercase tracking-wider">Tải ảnh</span>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-zinc-800">Ảnh đại diện</h3>
            <p className="mt-1 text-xs text-zinc-500">Nên dùng ảnh chân dung rõ nét, phông nền sáng, định dạng JPG hoặc PNG.</p>
          </div>
        </div>

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

