'use client';

import { useState } from 'react';

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

  return (
    <fieldset className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <legend className="px-2 text-sm font-semibold text-zinc-700">Kỹ năng</legend>
      <div className="flex flex-wrap gap-2 mb-3">
        {data.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 border border-primary-200"
          >
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(skill)}
              className="ml-0.5 text-primary-400 hover:text-red-500 transition-colors"
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập kỹ năng rồi nhấn Enter"
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
        <button
          type="button"
          onClick={addSkill}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
        >
          Thêm
        </button>
      </div>
    </fieldset>
  );
}
