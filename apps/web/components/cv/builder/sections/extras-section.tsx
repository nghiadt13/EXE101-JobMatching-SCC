'use client';

import { useState } from 'react';
import { SectionCard } from './section-card';

type Props = {
  certifications: string[];
  languages: string[];
  onChangeCertifications: (certifications: string[]) => void;
  onChangeLanguages: (languages: string[]) => void;
};

const inputClasses = "flex-1 rounded-xl border border-zinc-200/80 bg-zinc-50/50 px-4 py-3 text-[14px] text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all placeholder:text-zinc-400 hover:bg-zinc-50 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10";
const labelClasses = "mb-1.5 block text-[13px] font-semibold tracking-wide text-zinc-700";

function TagInput({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState('');
  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed]);
      setInput('');
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add();
    }
  };
  return (
    <div>
      <label className={labelClasses}>{label}</label>
      <div className="flex flex-wrap gap-2.5 min-h-[44px] rounded-2xl border border-dashed border-zinc-200/80 bg-zinc-50/30 p-3 mb-3">
        {items.length === 0 && (
          <span className="text-[13px] text-zinc-400 my-auto ml-1 italic">Chưa có thông tin. Nhập phía dưới để thêm.</span>
        )}
        {items.map((item) => (
          <span key={item} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold text-zinc-700 border border-zinc-200 shadow-sm transition-all hover:bg-zinc-50">
            {item}
            <button type="button" onClick={() => onChange(items.filter((i) => i !== item))} className="ml-1 flex h-4 w-4 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-red-500">✕</button>
          </span>
        ))}
      </div>
      <div className="flex gap-3">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={placeholder} className={inputClasses} />
        <button type="button" onClick={add} className="flex shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 py-3 text-[14px] font-semibold text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-zinc-500/10 active:scale-95">Thêm</button>
      </div>
    </div>
  );
}

export function ExtrasSection({ certifications, languages, onChangeCertifications, onChangeLanguages }: Props) {
  return (
    <SectionCard title="Chứng chỉ & Ngoại ngữ" icon="🏅" defaultExpanded={certifications.length > 0 || languages.length > 0}>
      <div className="space-y-6">
        <TagInput label="Chứng chỉ" items={certifications} onChange={onChangeCertifications} placeholder="Ví dụ: AWS Solutions Architect, IELTS 7.5..." />
        <div className="h-px w-full bg-zinc-100" />
        <TagInput label="Ngoại ngữ" items={languages} onChange={onChangeLanguages} placeholder="Ví dụ: Tiếng Anh (Lưu loát), Tiếng Nhật (N3)..." />
      </div>
    </SectionCard>
  );
}

