'use client';

import { Search } from 'lucide-react';

type CvSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export function CvSearchBar({ value, onChange }: CvSearchBarProps) {
  return (
    <div className="relative">
      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
        <Search className="h-4 w-4" />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Tìm kiếm CV nhanh..."
        className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400"
      />
    </div>
  );
}
