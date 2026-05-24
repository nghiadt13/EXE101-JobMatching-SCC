'use client';

import { Search } from 'lucide-react';
import { cn } from '@/lib/cn';

type CvSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export function CvSearchBar({ value, onChange }: CvSearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-md-on-surface-variant" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Tìm kiếm CV..."
        className={cn(
          'w-full rounded-lg py-2.5 pl-10 pr-4 text-sm',
          'bg-md-surface-container-low text-md-on-surface',
          'border border-md-outline-variant',
          'placeholder:text-md-outline-variant',
          'outline-none transition-colors focus:border-md-primary focus:ring-1 focus:ring-md-primary/20',
        )}
      />
    </div>
  );
}
