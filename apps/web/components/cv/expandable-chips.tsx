'use client';

import { useState } from 'react';

export function ExpandableChips({ title, items, categorize = false }: { title: string; items: string[], categorize?: boolean }) {
  const [expanded, setExpanded] = useState(false);

  if (!items.length) return null;

  const threshold = 12;
  const isLong = items.length > threshold;
  const displayItems = expanded ? items : items.slice(0, threshold);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
        {title}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {displayItems.map((item) => {
          const parts = item.split(':');
          if (categorize && parts.length > 1) {
            return (
              <div
                key={`${title}-${item}`}
                className="flex w-full flex-col sm:flex-row overflow-hidden rounded-md border border-zinc-200 bg-white text-xs text-zinc-700"
              >
                <div className="flex w-full sm:w-48 lg:w-56 flex-shrink-0 items-center bg-zinc-50 px-3 py-2 font-medium border-b sm:border-b-0 sm:border-r border-zinc-200">
                  {parts[0].trim()}
                </div>
                <div className="flex-1 px-3 py-2 leading-relaxed">
                  {parts.slice(1).join(':').trim()}
                </div>
              </div>
            );
          }
          return (
            <span
              key={`${title}-${item}`}
              className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700"
            >
              {item}
            </span>
          );
        })}
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 focus:outline-none"
          >
            {expanded ? 'See less ▴' : `+${items.length - threshold} more ▾`}
          </button>
        )}
      </div>
    </div>
  );
}
