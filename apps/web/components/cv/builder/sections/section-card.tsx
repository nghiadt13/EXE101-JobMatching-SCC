'use client';
import { useState } from 'react';

type SectionCardProps = {
  title: string;
  icon: string | React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
};

export function SectionCard({ title, icon, children, defaultExpanded = true }: SectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/80 backdrop-blur-xl shadow-sm transition-all hover:shadow-md hover:border-zinc-300 group">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-zinc-50/50 focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary-50 to-primary-100 text-xl shadow-inner border border-primary-100 transition-transform group-hover:scale-105">
            {icon}
          </div>
          <h2 className="text-[15px] font-bold tracking-tight text-zinc-800">{title}</h2>
        </div>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-all duration-300 ${
            isExpanded ? 'rotate-180 bg-primary-50 text-primary-600' : ''
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-1">
            <div className="h-px w-full bg-zinc-100 mb-5" />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
