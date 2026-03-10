'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/analytics/track';

export function HomeHeroSearch() {
  const [q, setQ] = useState('');

  return (
    <form
      action="/jobs"
      method="get"
      className="mt-6 rounded-2xl border border-zinc-200 bg-white/90 p-4 shadow-sm"
      onSubmit={() => {
        trackEvent('home_search_submitted', {
          hasKeyword: q.trim().length > 0,
          keywordLengthBucket:
            q.trim().length === 0 ? 'none' : q.trim().length <= 20 ? 'short' : 'long',
        });
      }}
    >
      <label htmlFor="home-q" className="sr-only">
        Search jobs
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="home-q"
          name="q"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search jobs by title, skill, or keyword"
          className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-800 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
        />
        <Button type="submit" size="lg">
          Find jobs
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/register">Create account</Link>
        </Button>
      </div>
    </form>
  );
}
