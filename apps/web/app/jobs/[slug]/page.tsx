import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { CandidateApplyForm } from '@/components/applications/candidate-apply-form';
import { Alert } from '@/components/ui/alert';
import { createApplication } from '@/lib/applications-client';
import { ApiError } from '@/lib/api-client';
import { getMyCvs } from '@/lib/cv-client';
import { getJobDetail } from '@/lib/jobs-client';
import type { JobItem } from '@/lib/jobs-client';
import { PUBLIC_JOBS_LISTING_ROUTE } from '@/lib/routes';
import { safeJsonLdSerialize } from '@/lib/seo';
import { RequirementsSection, RequirementsFallbackSection } from '@/components/jobs/requirements-section';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ applied?: string; error?: string }>;
};

function normalizeIconClass(iconKey: string | null | undefined): string {
  if (!iconKey || iconKey.trim().length === 0) {
    return 'fa-solid fa-building';
  }
  if (
    iconKey.includes('fa-solid') ||
    iconKey.includes('fa-regular') ||
    iconKey.includes('fa-brands')
  ) {
    return iconKey;
  }
  return iconKey.startsWith('fa-')
    ? `fa-solid ${iconKey}`
    : `fa-solid fa-${iconKey}`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const job = await getJobDetail(slug);
    const isPublic = job.status === 'PUBLISHED';
    return {
      title: `${job.title} | Jobs`,
      description: job.description.slice(0, 140),
      alternates: { canonical: `/jobs/${job.slug}` },
      robots: isPublic ? { index: true, follow: true } : { index: false, follow: true },
    };
  } catch {
    return {
      title: 'Job details',
      robots: { index: false, follow: false },
    };
  }
}

export default async function JobDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const session = await auth();

  let job;
  try {
    job = await getJobDetail(slug);
  } catch {
    // Fallback to mock data for UI testing if backend is unavailable or job not found
    job = {
      id: 'mock-id',
      recruiterId: 'mock-recruiter',
      companyName: 'TechCorp Inc.',
      companyLogoUrl: null,
      companyIconKey: 'fa-building',
      title: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'iOS Developer Fulltime',
      slug: slug,
      description: 'We are looking for a highly skilled iOS Developer to join our core engineering team in Cupertino. As an iOS Developer at TechCorp, you will be responsible for building high-quality, scalable mobile applications that provide an exceptional user experience for millions of users worldwide. You will work closely with product managers, designers, and other engineers to define, design, and ship new features.',
      skills: ['Swift', 'SwiftUI', 'Combine framework', 'RESTful APIs', 'Git', 'Agile'],
      inputMode: 'manual',
      parseStatus: 'parsed_ok',
      parseTelemetry: null,
      normalizedProfile: null,
      requirementsSchema: null,
      requirementsSchemaVersion: null,
      location: { city: 'Cupertino', country: 'CA' },
      salaryMin: 140000,
      salaryMax: 180000,
      employmentType: 'Full-time',
      status: 'PUBLISHED',
      publishedAt: new Date().toISOString(),
      closedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as JobItem;
  }

  const canApply = session?.user?.role === 'CANDIDATE' && Boolean(session.accessToken);
  let cvs = null;
  if (canApply) {
    try {
      cvs = await getMyCvs(session.accessToken as string);
    } catch (error) {
      console.error('Failed to fetch CVs', error);
      cvs = { items: [], pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 0 } };
    }
  }
  const errorMessage =
    query.error === 'duplicate' ? 'You already applied to this job.'
    : query.error === 'missing' ? 'Please select a CV before submitting your application.'
    : query.error ? 'Unable to submit application.'
    : null;

  async function applyAction(formData: FormData) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) redirect(`/login?callbackUrl=${encodeURIComponent(`/jobs/${slug}`)}`);
    if (currentSession.user.role !== 'CANDIDATE') redirect('/dashboard');
    const cvId = String(formData.get('cvId') ?? '').trim();
    const jobId = String(formData.get('jobId') ?? '').trim();
    if (!cvId || !jobId) redirect(`/jobs/${slug}?error=missing`);
    let redirectTarget = '/dashboard/candidate/applications?applied=1';
    try {
      await createApplication(currentSession.accessToken, { cvId, jobId });
    } catch (error) {
      redirectTarget = error instanceof ApiError && error.status === 409
        ? `/jobs/${slug}?error=duplicate`
        : `/jobs/${slug}?error=failed`;
    }
    redirect(redirectTarget);
  }

  const jobPath = `/jobs/${slug}`;
  const cvPrereqUrl = `/dashboard/candidate/cvs?returnTo=${encodeURIComponent(jobPath)}`;
  const isPublicJob = job.status === 'PUBLISHED';
  const jobPostingJsonLd = isPublicJob
    ? {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: job.title,
        description: job.description,
        employmentType: job.employmentType,
        datePosted: job.publishedAt ?? job.createdAt,
        url: `${process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000'}/jobs/${job.slug}`,
      }
    : null;

  const district =
    job.location && typeof job.location.district === 'string'
      ? job.location.district
      : '';
  const city =
    job.location && typeof job.location.city === 'string' ? job.location.city : '';
  const country =
    job.location && typeof job.location.country === 'string'
      ? job.location.country
      : '';

  const locationParts = [district, city, country].filter(
    (part) => part.trim().length > 0,
  );
  const locationStr = locationParts.length > 0 ? locationParts.join(', ') : 'Remote';

  const salaryText = job.salaryMin && job.salaryMax 
    ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
    : job.salaryMin 
    ? `From $${job.salaryMin.toLocaleString()}`
    : job.salaryMax
    ? `Up to $${job.salaryMax.toLocaleString()}`
    : 'Negotiable';

  const companyName = job.companyName?.trim() || 'Confidential Company';
  const companyLogoUrl =
    typeof job.companyLogoUrl === 'string' &&
    job.companyLogoUrl.trim().length > 0
      ? job.companyLogoUrl
      : null;
  const companyIconClass = normalizeIconClass(job.companyIconKey);

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-sans">
      <SiteHeader
        isAuthenticated={Boolean(session?.accessToken)}
        user={session?.user ? {
          name: session.user.name,
          email: session.user.email,
        } : null}
      />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
        {jobPostingJsonLd && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdSerialize(jobPostingJsonLd) }} />
        )}
        
        <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-8">
          <Link className="hover:text-primary transition-colors" href="/">Home</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <Link className="hover:text-primary transition-colors" href={PUBLIC_JOBS_LISTING_ROUTE}>Jobs</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-slate-900 dark:text-slate-100 font-medium">{job.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
                <div className="flex gap-4">
                  <div className="size-20 shrink-0 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                    {companyLogoUrl ? (
                      <Image
                        src={companyLogoUrl}
                        alt={companyName}
                        width={80}
                        height={80}
                        className="h-full w-full object-contain p-2"
                        unoptimized
                      />
                    ) : (
                      <i className={`${companyIconClass} text-3xl text-slate-400`} />
                    )}
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-2xl font-bold">{job.title}</h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">business</span>{companyName}</span>
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">location_on</span>{locationStr}</span>
                      <span className="flex items-center gap-1 text-primary font-semibold"><span className="material-symbols-outlined text-sm">payments</span>{salaryText}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-xs rounded text-slate-500">{job.employmentType}</span>
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-xs rounded text-slate-500">
                        {new Date(job.publishedAt || job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex w-full md:w-auto gap-3 shrink-0">
                  <button className="flex-1 md:flex-none px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary/20">
                    Apply Now
                  </button>
                  <button className="flex items-center justify-center size-12 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">bookmark</span>
                  </button>
                </div>
              </div>

              <div className="mt-8 border-b border-slate-200 dark:border-slate-800">
                <nav className="flex gap-8">
                  <a className="pb-4 border-b-2 border-primary text-primary font-bold text-sm" href="#description">Job Description</a>
                  <a className="pb-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium text-sm" href="#requirements">Requirements</a>
                  <a className="pb-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium text-sm" href="#benefits">Benefits</a>
                </nav>
              </div>

              <div className="py-8 space-y-8">
                <section id="description">
                  <h3 className="text-lg font-bold mb-4">About the Role</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                    {job.description}
                  </p>
                </section>

                {job.skills?.length > 0 ? (
                  <RequirementsSection skills={job.skills} />
                ) : (
                  <RequirementsFallbackSection />
                )}

                <section id="benefits">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">redeem</span> Benefits &amp; Perks
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary">medical_services</span>
                      <div>
                        <p className="font-semibold text-sm">Full Health Insurance</p>
                        <p className="text-xs text-slate-500">Premium dental, medical, and vision coverage.</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary">schedule</span>
                      <div>
                        <p className="font-semibold text-sm">Flexible Hours</p>
                        <p className="text-xs text-slate-500">Core hours with flexible start and end times.</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary">home_work</span>
                      <div>
                        <p className="font-semibold text-sm">Hybrid Work Model</p>
                        <p className="text-xs text-slate-500">3 days in-office, 2 days remote work.</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary">fitness_center</span>
                      <div>
                        <p className="font-semibold text-sm">Gym Membership</p>
                        <p className="text-xs text-slate-500">Monthly allowance for fitness and wellness.</p>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-8">
                  <h3 className="text-lg font-bold mb-4">Submit Your Application</h3>
                  
                  {query.applied === '1' && (
                    <Alert variant="success" className="mb-4" role="status" aria-live="polite">
                      Application submitted successfully.
                    </Alert>
                  )}
                  
                  {errorMessage && (
                    <Alert className="mb-4" role="alert" aria-live="assertive">
                      {errorMessage}
                    </Alert>
                  )}

                  {canApply && cvs && cvs.items.length > 0 ? (
                    <CandidateApplyForm jobId={job.id} cvs={cvs.items} action={applyAction} />
                  ) : null}
                  
                  {canApply && cvs && cvs.items.length === 0 ? (
                    <p className="text-sm text-zinc-600">
                      Please{' '}
                      <Link href={cvPrereqUrl} className="font-medium underline text-primary">upload a CV</Link>
                      {' '}first before applying.
                    </p>
                  ) : null}
                  
                  {!session?.user && (
                    <p className="text-sm text-zinc-600">
                      <Link href={`/login?callbackUrl=${encodeURIComponent(jobPath)}`} className="font-medium underline text-primary">Sign in</Link>{' '}
                      as candidate to apply.
                    </p>
                  )}
                  
                  {session?.user && session.user.role !== 'CANDIDATE' && (
                    <p className="text-sm text-zinc-600">Only candidate accounts can apply for jobs.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-bold mb-4">About the Company</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                  {companyLogoUrl ? (
                    <Image
                      src={companyLogoUrl}
                      alt={companyName}
                      width={48}
                      height={48}
                      className="h-full w-full object-contain p-1"
                      unoptimized
                    />
                  ) : (
                    <i className={`${companyIconClass} text-xl text-primary`} />
                  )}
                </div>
                <div>
                  <p className="font-bold">{companyName}</p>
                  <a className="text-xs text-primary font-medium hover:underline" href="#">View Company Profile</a>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Company size</span>
                  <span className="font-medium">10,000+ employees</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Industry</span>
                  <span className="font-medium">Technology</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Headquarters</span>
                  <span className="font-medium">{locationStr}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Founded</span>
                  <span className="font-medium">2010</span>
                </div>
              </div>
              
              <button className="w-full mt-6 py-2.5 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary/5 transition-colors">
                Follow Company
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-bold mb-4">Similar Jobs</h3>
              <div className="space-y-6">
                <div className="group cursor-pointer">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-sm group-hover:text-primary transition-colors">Senior iOS Engineer</h4>
                    <span className="text-[10px] font-bold text-slate-400">3d ago</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">InnovateApp • San Francisco, CA</p>
                  <p className="text-xs font-bold text-primary">$160k - $210k</p>
                </div>
                <div className="group cursor-pointer">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-sm group-hover:text-primary transition-colors">Mobile Developer (Swift)</h4>
                    <span className="text-[10px] font-bold text-slate-400">1w ago</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">FutureTech • Remote</p>
                  <p className="text-xs font-bold text-primary">$130k - $155k</p>
                </div>
                <div className="group cursor-pointer">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-sm group-hover:text-primary transition-colors">Staff iOS Engineer</h4>
                    <span className="text-[10px] font-bold text-slate-400">2h ago</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">GlobalPay • Palo Alto, CA</p>
                  <p className="text-xs font-bold text-primary">$180k - $240k</p>
                </div>
              </div>
              <a className="block text-center text-sm font-bold text-slate-400 mt-6 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" href="#">
                View All Recommendations
              </a>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
