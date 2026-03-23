import type { Metadata } from 'next';
import { auth } from '@/auth';
import { HomepageMain } from '@/components/home/homepage-main';
import { getHomepage } from '@/lib/homepage-client';

export const metadata: Metadata = {
  title: 'SCC - Smart Career Connector',
  description:
    'Over 500,000 active job openings from top-tier companies and innovative startups worldwide.',
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const session = await auth();
  const token = session?.accessToken || undefined;

  let homepageData = null;
  try {
    homepageData = await getHomepage({ token });
  } catch (error) {
    console.error('Failed to fetch homepage data', error);
  }

  return (
    <HomepageMain
      initialData={homepageData}
      accessToken={token ?? null}
      isAuthenticated={Boolean(token)}
    />
  );
}
