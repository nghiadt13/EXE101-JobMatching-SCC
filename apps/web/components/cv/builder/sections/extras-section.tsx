'use client';

import { useState } from 'react';

type Props = {
  certifications: string[];
  languages: string[];
  onChangeCertifications: (certifications: string[]) => void;
  onChangeLanguages: (languages: string[]) => void;
};

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
      <label className="mb-1 block text-xs font-medium text-zinc-600">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {items.map((item) => (
          <span key={item} className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
            {item}
            <button type="button" onClick={() => onChange(items.filter((i) => i !== item))} className="text-zinc-400 hover:text-red-500">✕</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={placeholder} className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
        <button type="button" onClick={add} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors">Thêm</button>
      </div>
    </div>
  );
}

export function ExtrasSection({ certifications, languages, onChangeCertifications, onChangeLanguages }: Props) {
  return (
    <fieldset className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <legend className="px-2 text-sm font-semibold text-zinc-700">Khác</legend>
      <div className="space-y-4">
        <TagInput label="Chứng chỉ" items={certifications} onChange={onChangeCertifications} placeholder="AWS SAA, IELTS 7.0" />
        <TagInput label="Ngôn ngữ" items={languages} onChange={onChangeLanguages} placeholder="Vietnamese, English" />
      </div>
    </fieldset>
  );
}
