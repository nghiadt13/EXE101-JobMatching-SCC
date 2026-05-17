'use client';

import { useState } from 'react';
import { Zap } from 'lucide-react';
import { SectionCard } from './section-card';

type Props = {
  data: string[];
  onChange: (skills: string[]) => void;
};

export function SkillsSection({ data, onChange }: Props) {
  const [input, setInput] = useState('');

  const addSkill = () => {
    const trimmed = input.trim();
    if (trimmed && !data.includes(trimmed)) {
      onChange([...data, trimmed]);
      setInput('');
    }
  };

  const removeSkill = (skill: string) => {
    onChange(data.filter((s) => s !== skill));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill();
    }
  };

  const inputClasses = "flex-1 rounded-xl border border-zinc-200/80 bg-zinc-50/50 px-4 py-3 text-[14px] text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all placeholder:text-zinc-400 hover:bg-zinc-50 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10";
  const labelClasses = "mb-1.5 block text-[13px] font-semibold tracking-wide text-zinc-700";

  return (
    <SectionCard title="Kỹ năng" icon={<Zap className="h-5 w-5 text-primary-600" />} defaultExpanded={data.length > 0}>
      <div className="space-y-4">
        <label className={labelClasses}>Phân loại hoặc liệt kê các kỹ năng chuyên môn</label>
        
        <div className="flex flex-wrap gap-2.5 min-h-[44px] rounded-2xl border border-dashed border-zinc-200/80 bg-zinc-50/30 p-3">
          {data.length === 0 && (
            <span className="text-[13px] text-zinc-400 my-auto ml-1 italic">Chưa có kỹ năng nào. Nhập phía dưới để thêm.</span>
          )}
          {data.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3.5 py-1.5 text-[13px] font-semibold text-primary-700 border border-primary-200/60 shadow-sm transition-all hover:bg-primary-100 hover:border-primary-300"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="ml-1 flex h-4 w-4 items-center justify-center rounded-full text-primary-400 transition-colors hover:bg-primary-200 hover:text-red-500"
              >
                ✕
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập kỹ năng rồi nhấn Enter..."
            className={inputClasses}
          />
          <button
            type="button"
            onClick={addSkill}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-[14px] font-semibold text-white shadow-sm shadow-primary-600/20 transition-all hover:bg-primary-700 hover:shadow-md active:scale-95"
          >
            <span>+</span> Thêm
          </button>
        </div>
      </div>
    </SectionCard>
  );
}

