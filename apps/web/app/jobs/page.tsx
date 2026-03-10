import { permanentRedirect, redirect } from 'next/navigation';
import { buildPublicJobsListingHref } from '@/lib/routes';

type JobsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function isEnabled(key: string): boolean {
  const value = process.env[key];
  return value === '1' || value === 'true' || value === 'yes';
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (entry) query.append(key, entry);
      }
      continue;
    }
    if (value) query.set(key, value);
  }

  const target = buildPublicJobsListingHref(query);
  if (isEnabled('WEB_JOBS_LEGACY_REDIRECT_PERMANENT')) {
    permanentRedirect(target);
  }

  redirect(target);
}
