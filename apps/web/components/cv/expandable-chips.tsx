'use client';

import { useState } from 'react';

export function ExpandableChips({ title, items }: { title: string; items: string[] }) {
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
        {displayItems.map((item) => (
          <span
            key={`${title}-${item}`}
            className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-700"
          >
            {item}
          </span>
        ))}
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
