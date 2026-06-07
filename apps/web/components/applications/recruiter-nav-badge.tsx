'use client';

import { useState, useEffect } from 'react';
import { getApplications } from '@/lib/applications-client';

export function RecruiterNavBadge() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    const fetchSessionAndPoll = async () => {
      try {
        const sessionRes = await fetch('/api/auth/session');
        if (!sessionRes.ok) return;
        const session = await sessionRes.json();
        const token = session?.accessToken;
        const role = session?.user?.role;
        if (!token || role !== 'RECRUITER') return;

        // Fetch initial count
        const initialRes = await getApplications(token, { page: 1, limit: 100 });
        if (!isMounted) return;

        const initialUnreviewed = initialRes.items.filter(item =>
          ['APPLIED', 'PENDING_MATCHING', 'REVIEWING'].includes(item.status)
        ).length;
        setCount(initialUnreviewed);

        // Start polling interval every 5 seconds
        intervalId = setInterval(async () => {
          try {
            const pollRes = await getApplications(token, { page: 1, limit: 100 });
            if (!isMounted) return;

            const pollUnreviewed = pollRes.items.filter(item =>
              ['APPLIED', 'PENDING_MATCHING', 'REVIEWING'].includes(item.status)
            ).length;
            setCount(pollUnreviewed);
          } catch (err) {
            console.error('Error polling applications count:', err);
          }
        }, 5000);

      } catch (err) {
        console.error('Error in RecruiterNavBadge setup:', err);
      }
    };

    fetchSessionAndPoll();

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  if (count === null || count === 0) return null;

  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white shadow-sm transition-all animate-pulse">
      {count}
    </span>
  );
}
