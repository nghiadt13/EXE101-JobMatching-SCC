import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getRoleDashboardPath } from '@/lib/auth-redirect';
import { getJobs } from '@/lib/jobs-client';
import { safeJsonLdSerialize } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { HomeHeroSearch } from '@/components/jobs/home-hero-search';
import { HomeFeaturedJobs } from '@/components/jobs/home-featured-jobs';
import { HomeHowItWorks } from '@/components/jobs/home-how-it-works';

export const metadata: Metadata = {
  title: 'Find Jobs Fast',
  description: 'Search jobs, review details, and apply quickly with role-based workflows.',
  alternates: { canonical: '/' },
};

function isEnabled(key: string): boolean {
  const value = process.env[key];
  return value === '1' || value === 'true' || value === 'yes';
}

export default async function Home() {
  const session = await auth();
  if (session?.user?.role) {
    redirect(getRoleDashboardPath(session.user.role));
  }

  const homeEnabled = isEnabled('WEB_HOME_TOPCV_V1_ENABLED');
  if (!homeEnabled) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16">
        <div className="w-full rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">HR Recruitment Platform</p>
            <h1 className="text-3xl font-semibold text-zinc-900">Find talent. Land roles.</h1>
            <p className="text-zinc-600">
              AI-powered matching between candidates and opportunities. Sign in to access your role-based dashboard.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/register">Create account</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/jobs">Browse jobs</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const jobs = await getJobs({ page: 1, limit: 6, sort: 'newest' });
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'HR Recruitment Platform',
    url: process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000'}/jobs?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <main className="relative overflow-hidden bg-gradient-to-b from-sky-50 via-white to-zinc-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdSerialize(jsonLd) }} />
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-12">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">
            HR Platform
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/jobs">Browse jobs</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </header>

        <section className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-white to-sky-50 p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-700">Career marketplace</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
            Discover better jobs with faster applications.
          </h1>
          <p className="mt-4 max-w-2xl text-zinc-600">
            Search real openings, review role details, and apply with your existing CV profile in minutes.
          </p>
          <HomeHeroSearch />
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-zinc-500">
            <span className="rounded-full border border-zinc-300 px-3 py-1">Public jobs only</span>
            <span className="rounded-full border border-zinc-300 px-3 py-1">Role-based dashboards</span>
            <span className="rounded-full border border-zinc-300 px-3 py-1">Application status tracking</span>
          </div>
        </section>

        <HomeFeaturedJobs jobs={jobs.items} />
        <HomeHowItWorks />

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
          <h2 className="text-2xl font-semibold text-zinc-900">Ready to apply?</h2>
          <p className="mt-2 text-sm text-zinc-600">Create your account and start applying to suitable positions today.</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Button asChild>
              <Link href="/register">Create candidate account</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/jobs">Explore jobs</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
