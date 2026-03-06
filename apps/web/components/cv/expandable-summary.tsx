'use client';

import { useState } from 'react';

export function ExpandableSummary({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  const isLong = text.length > 180;

  return (
    <div className="mt-3 max-w-3xl text-sm text-zinc-600">
      <p className={expanded ? '' : 'line-clamp-2'}>{text}</p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-xs font-medium text-zinc-500 hover:text-zinc-800 focus:outline-none"
        >
          {expanded ? 'See less ▴' : 'See more ▾'}
        </button>
      )}
    </div>
  );
}
