import type { Metadata } from 'next';
import { JobsListingPage } from '@/components/jobs/jobs-listing-page';

const baseMetadata: Metadata = {
  title: 'Find Jobs',
  description: 'Browse open jobs and apply directly from the platform.',
  alternates: { canonical: '/' },
};

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: HomePageProps): Promise<Metadata> {
  const params = await searchParams;
  const hasDynamicQuery = Object.keys(params).some((key) => key !== 'page' && key !== 'limit');
  return {
    ...baseMetadata,
    robots: hasDynamicQuery ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function Home({ searchParams }: HomePageProps) {
  return <JobsListingPage searchParams={await searchParams} currentPath="/" />;
}
