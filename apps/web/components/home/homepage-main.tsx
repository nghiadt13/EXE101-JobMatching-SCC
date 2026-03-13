'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type {
  HomepageFeaturedJob,
  HomepageResponse,
} from '@/lib/homepage-client';
import {
  saveHomepageJob,
  unsaveHomepageJob,
} from '@/lib/homepage-client';
import { getJobs } from '@/lib/jobs-client';
import type { JobItem } from '@/lib/jobs-client';
import { SiteHeader } from '@/components/layout/site-header';

const FALLBACK_HOMEPAGE: HomepageResponse = {
  currentUser: null,
  hero: {
    headline: 'Find Your Dream Job',
    subheadline:
      'Over 500,000 active job openings from top-tier companies and innovative startups worldwide.',
    backgroundImageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDfgq41SCyJjCh8zdZiRw6w8jt0VVFLbbLZt7ykfAFG5aMhH40ASM8UMZ9MfGO8putfc51TN2a1kZKzgL-xf1h2OCA2zfSWVROPUmoryvq3LWede7BycCZTqzh84lcsbOCYi2E_Uci0U4tKT8uz1n9flsEcFS-JQpNGsZwDylU6idlM9bD_qSH0Ka99HwwLlw_9-MwVTdiTw3FGdxMlEg-6TyTfakh-LEv5JrJRl1lGhd3E8PBaADKLpsv489FaNa0QW7cfRgIorbk',
    popularKeywords: [
      'Software Engineer',
      'Product Designer',
      'Marketing Manager',
    ],
  },
  marketStats: {
    asOfDate: new Date().toISOString().slice(0, 10),
    newJobs24h: 0,
    activeJobs: 0,
    hiringCompanies: 0,
  },
  jobGrowthSeries: [],
  demandByIndustry: [],
  trustedCompanies: [],
  categories: [],
  locationFilters: [],
  featuredJobs: [],
  footer: {
    quickLinks: [{ label: 'Browse Jobs', href: '/jobs' }],
    supportLinks: [{ label: 'Privacy Policy', href: '#' }],
    socialLinks: [{ platform: 'linkedin', href: '#' }],
    copyrightText: '© 2023 HireStream Recruitment Inc. All rights reserved.',
  },
  generatedAt: new Date().toISOString(),
};

const DEMAND_COLORS = [
  'bg-white',
  'bg-primary-200',
  'bg-primary-300',
  'bg-primary-400',
  'bg-primary-100',
];

const MOCK_JOB_GROWTH_SERIES = [
  { date: '2026-02-11', value: 11800 },
  { date: '2026-02-17', value: 13200 },
  { date: '2026-02-23', value: 14900 },
  { date: '2026-03-01', value: 17100 },
  { date: '2026-03-07', value: 19800 },
  { date: '2026-03-13', value: 22400 },
];

const MOCK_DEMAND_BY_INDUSTRY = [
  { industryKey: 'sales', label: 'Sales', value: 9400, order: 1 },
  { industryKey: 'admin', label: 'Admin', value: 8200, order: 2 },
  { industryKey: 'service', label: 'Service', value: 7300, order: 3 },
  { industryKey: 'marketing', label: 'Marketing', value: 6100, order: 4 },
  { industryKey: 'other', label: 'Other', value: 5600, order: 5 },
];

const MOCK_CATEGORIES = [
  {
    id: 'mock-tech-software',
    slug: 'tech-software',
    name: 'Tech & Software',
    iconKey: 'fa-code',
    openJobsCount: 1240,
  },
  {
    id: 'mock-design-creative',
    slug: 'design-creative',
    name: 'Design & Creative',
    iconKey: 'fa-pen-nib',
    openJobsCount: 840,
  },
  {
    id: 'mock-marketing-sales',
    slug: 'marketing-sales',
    name: 'Marketing & Sales',
    iconKey: 'fa-chart-line',
    openJobsCount: 920,
  },
  {
    id: 'mock-finance-banking',
    slug: 'finance-banking',
    name: 'Finance & Banking',
    iconKey: 'fa-landmark',
    openJobsCount: 450,
  },
];

const STATIC_HERO = {
  headline: 'Find Your Dream Job',
  subheadline:
    'Over 500,000 active job openings from top-tier companies and innovative startups worldwide.',
  backgroundImageUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDfgq41SCyJjCh8zdZiRw6w8jt0VVFLbbLZt7ykfAFG5aMhH40ASM8UMZ9MfGO8putfc51TN2a1kZKzgL-xf1h2OCA2zfSWVROPUmoryvq3LWede7BycCZTqzh84lcsbOCYi2E_Uci0U4tKT8uz1n9flsEcFS-JQpNGsZwDylU6idlM9bD_qSH0Ka99HwwLlw_9-MwVTdiTw3FGdxMlEg-6TyTfakh-LEv5JrJRl1lGhd3E8PBaADKLpsv489FaNa0QW7cfRgIorbk',
  popularKeywords: [
    'Software Engineer',
    'Product Designer',
    'Marketing Manager',
  ],
};

const STATIC_MARKET_STATS = {
  asOfText: 'March 13, 2026',
  newJobs24h: 5059,
  activeJobs: 63198,
  hiringCompanies: 18402,
};

const STATIC_QUICK_LINKS = [
  { label: 'Browse Jobs', href: '/jobs' },
  { label: 'Company Profile', href: '#' },
  { label: 'Job Notifications', href: '#' },
  { label: 'Career Advice', href: '#' },
];

const STATIC_SUPPORT_LINKS = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
  { label: 'Cookie Policy', href: '#' },
  { label: 'Help Center', href: '#' },
];

const STATIC_SOCIAL_LINKS = [
  { icon: 'fa-brands fa-linkedin-in', href: '#' },
  { icon: 'fa-brands fa-twitter', href: '#' },
  { icon: 'fa-brands fa-instagram', href: '#' },
  { icon: 'fa-brands fa-facebook-f', href: '#' },
];

const HOMEPAGE_LOCATION_FILTERS = [
  { slug: 'mien-bac', label: 'Miền Bắc' },
  { slug: 'mien-nam', label: 'Miền Nam' },
  { slug: 'ngau-nhien', label: 'Ngẫu nhiên' },
  { slug: 'ha-noi', label: 'Hà Nội' },
  { slug: 'tp-ho-chi-minh', label: 'Thành phố Hồ Chí Minh' },
] as const;

type HomepageLocationSlug = (typeof HOMEPAGE_LOCATION_FILTERS)[number]['slug'];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function buildSalaryText(min: number | null, max: number | null): string {
  const toMillion = (value: number) => {
    const million = value / 1_000_000;
    return Number.isInteger(million) ? String(million) : million.toFixed(1);
  };
  if (min !== null && max !== null) {
    return `${toMillion(min)} - ${toMillion(max)} million VND`;
  }
  if (min !== null) {
    return `From ${toMillion(min)} million VND`;
  }
  if (max !== null) {
    return `Up to ${toMillion(max)} million VND`;
  }
  return 'Negotiable';
}

function buildLocationLabel(
  location: Record<string, unknown> | null | undefined,
): string {
  if (!location) return 'Remote';
  if (location.remote === true) return 'Remote';
  const city = typeof location.city === 'string' ? location.city.trim() : '';
  const country =
    typeof location.country === 'string' ? location.country.trim() : '';
  if (city) return city;
  if (country) return country;
  return 'Remote';
}

function toHomepageJob(job: JobItem): HomepageFeaturedJob {
  return {
    id: job.id,
    slug: job.slug,
    title: job.title,
    companyName: job.companyName ?? 'Confidential Company',
    companyLogoUrl: job.companyLogoUrl ?? null,
    companyIconKey: job.companyIconKey ?? null,
    shortDescription: job.description.trim().slice(0, 180),
    salaryText: buildSalaryText(job.salaryMin, job.salaryMax),
    locationLabel: buildLocationLabel(
      job.location as Record<string, unknown> | null,
    ),
    isSaved: false,
  };
}

function mergeUniqueJobs(
  current: HomepageFeaturedJob[],
  incoming: HomepageFeaturedJob[],
): HomepageFeaturedJob[] {
  const map = new Map<string, HomepageFeaturedJob>();
  for (const job of current) {
    map.set(job.id, job);
  }
  for (const job of incoming) {
    map.set(job.id, job);
  }
  return Array.from(map.values());
}

function matchesLocationFilter(
  locationLabel: string,
  selectedLocation: HomepageLocationSlug,
): boolean {
  const normalized = normalizeText(locationLabel);
  const isHanoi = normalized.includes('ha noi');
  const isHcm =
    normalized.includes('ho chi minh') || normalized.includes('tp hcm');

  if (selectedLocation === 'ha-noi') return isHanoi;
  if (selectedLocation === 'tp-ho-chi-minh') return isHcm;
  if (selectedLocation === 'mien-bac') return isHanoi;
  if (selectedLocation === 'mien-nam') return isHcm;
  return true;
}

function parseLocationInputToSlug(value: string): HomepageLocationSlug | null {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  if (normalized.includes('mien bac')) return 'mien-bac';
  if (normalized.includes('mien nam')) return 'mien-nam';
  if (normalized.includes('ngau nhien')) return 'ngau-nhien';
  if (normalized.includes('ha noi')) return 'ha-noi';
  if (normalized.includes('ho chi minh') || normalized.includes('tp hcm')) {
    return 'tp-ho-chi-minh';
  }
  return null;
}

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

function buildTrendPath(series: Array<{ value: number }>): string {
  if (series.length < 2) {
    return 'M0 80 Q 20 75, 40 85 T 60 50 T 80 40 T 100 20';
  }
  const min = Math.min(...series.map((point) => point.value));
  const max = Math.max(...series.map((point) => point.value));
  const spread = max - min || 1;
  return series
    .map((point, index) => {
      const x = (index / (series.length - 1)) * 100;
      const y = 90 - ((point.value - min) / spread) * 65;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function formatShortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

type HomepageMainProps = {
  initialData: HomepageResponse | null;
  accessToken: string | null;
  isAuthenticated: boolean;
};

export function HomepageMain({
  initialData,
  accessToken,
  isAuthenticated,
}: HomepageMainProps) {
  const [homepageData, setHomepageData] = useState<HomepageResponse>(
    initialData ?? FALLBACK_HOMEPAGE,
  );
  const [selectedLocation, setSelectedLocation] =
    useState<HomepageLocationSlug>('ngau-nhien');
  const [savingJobIds, setSavingJobIds] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [searchLocationInput, setSearchLocationInput] = useState<string>('');
  const [featuredJobs, setFeaturedJobs] = useState<HomepageFeaturedJob[]>(
    initialData?.featuredJobs ?? [],
  );
  const [jobsPage, setJobsPage] = useState<number>(1);
  const [hasMoreJobs, setHasMoreJobs] = useState<boolean>(true);
  const [isLoadingMoreJobs, setIsLoadingMoreJobs] = useState<boolean>(false);
  const [isSearchingJobs, setIsSearchingJobs] = useState<boolean>(false);

  useEffect(() => {
    if (initialData) {
      setHomepageData(initialData);
      setFeaturedJobs(initialData.featuredJobs);
    }
  }, [initialData]);

  const growthSeries = useMemo(() => MOCK_JOB_GROWTH_SERIES, []);
  const growthPath = useMemo(() => buildTrendPath(growthSeries), [growthSeries]);
  const demandBars = useMemo(() => {
    const bars = MOCK_DEMAND_BY_INDUSTRY;
    const maxValue = Math.max(...bars.map((item) => item.value), 1);
    return bars.map((item, index) => ({
      ...item,
      className: DEMAND_COLORS[index % DEMAND_COLORS.length],
      height: `${Math.max(18, Math.round((item.value / maxValue) * 100))}%`,
    }));
  }, []);

  const visibleFeaturedJobs = useMemo(() => {
    const filtered = featuredJobs.filter((job) =>
      matchesLocationFilter(job.locationLabel, selectedLocation),
    );
    // Keep deterministic rendering for SSR/CSR hydration consistency.
    // "Ngau nhien" behaves as mixed/all jobs without randomizing order at render time.
    return filtered;
  }, [featuredJobs, selectedLocation]);

  const unreadCount = homepageData.currentUser?.unreadNotificationCount ?? 1;
  const displayedCategories = MOCK_CATEGORIES;

  const setJobSavedState = (jobId: string, isSaved: boolean) => {
    setFeaturedJobs((prev) =>
      prev.map((job) => (job.id === jobId ? { ...job, isSaved } : job)),
    );
  };

  const toggleJobSave = async (job: HomepageFeaturedJob) => {
    setActionError(null);
    if (!accessToken) {
      window.location.href = '/login?callbackUrl=/';
      return;
    }
    if (savingJobIds.has(job.id)) return;
    const nextSaved = !job.isSaved;
    setJobSavedState(job.id, nextSaved);
    setSavingJobIds((prev) => new Set(prev).add(job.id));
    try {
      if (nextSaved) {
        await saveHomepageJob(job.id, accessToken);
      } else {
        await unsaveHomepageJob(job.id, accessToken);
      }
    } catch (error) {
      setJobSavedState(job.id, !nextSaved);
      console.error('Failed to save job', error);
      setActionError('Could not update saved jobs right now.');
    } finally {
      setSavingJobIds((prev) => {
        const next = new Set(prev);
        next.delete(job.id);
        return next;
      });
    }
  };

  const handleLocationSelect = (slug: HomepageLocationSlug) => {
    setSelectedLocation(slug);
  };

  const fetchJobs = async (page: number, append: boolean) => {
    const response = await getJobs({
      page,
      limit: 6,
      q: searchKeyword.trim() || undefined,
      status: 'PUBLISHED',
    });
    const mapped = response.items.map(toHomepageJob);
    setFeaturedJobs((prev) => (append ? mergeUniqueJobs(prev, mapped) : mapped));
    setJobsPage(response.pagination.page);
    setHasMoreJobs(response.pagination.page < response.pagination.totalPages);
  };

  const handleSearchJobs = async () => {
    setActionError(null);
    setIsSearchingJobs(true);
    const parsedLocation = parseLocationInputToSlug(searchLocationInput);
    if (parsedLocation) {
      setSelectedLocation(parsedLocation);
    }
    try {
      await fetchJobs(1, false);
    } catch (error) {
      console.error('Failed to search jobs from homepage', error);
      setActionError('Could not search jobs right now.');
    } finally {
      setIsSearchingJobs(false);
    }
  };

  const handleLoadMoreJobs = async () => {
    if (isLoadingMoreJobs || !hasMoreJobs) return;
    setActionError(null);
    setIsLoadingMoreJobs(true);
    try {
      await fetchJobs(jobsPage + 1, true);
    } catch (error) {
      console.error('Failed to load more jobs', error);
      setActionError('Could not load more jobs right now.');
    } finally {
      setIsLoadingMoreJobs(false);
    }
  };

  return (
    <div
      className="bg-gray-50 text-slate-900"
      style={{ fontFamily: 'var(--font-inter), sans-serif' }}
    >
      <SiteHeader
        isAuthenticated={isAuthenticated}
        unreadCount={unreadCount}
        user={{
          name: homepageData.currentUser?.name,
          email: undefined,
          avatarUrl: homepageData.currentUser?.avatarUrl,
          planName: homepageData.currentUser?.planName,
        }}
      />
      <main>
        <section className="relative flex h-[600px] items-center justify-center overflow-hidden">
          <Image
            alt="Office Collaboration"
            className="absolute inset-0 h-full w-full object-cover"
            src={STATIC_HERO.backgroundImageUrl}
            fill
            sizes="100vw"
            unoptimized
          />
          <div className="hero-overlay absolute inset-0" />
          <div className="relative z-10 w-full max-w-4xl px-4 text-center">
            <h1 className="mb-6 text-4xl leading-tight font-extrabold text-white md:text-6xl">
              {STATIC_HERO.headline} <br />
              <span className="text-primary-400">Where You Belong.</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-300">
              {STATIC_HERO.subheadline}
            </p>
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 rounded-2xl bg-white p-2 shadow-2xl md:flex-row">
              <div className="flex w-full flex-1 items-center px-4">
                <i className="fa-solid fa-magnifying-glass mr-3 text-gray-400" />
                <input
                  className="w-full border-none py-3 text-slate-800 focus:ring-0"
                  placeholder="Job title, keywords..."
                  type="text"
                  value={searchKeyword}
                  onChange={(event) => {
                    setSearchKeyword(event.target.value);
                  }}
                />
              </div>
              <div className="hidden h-8 w-px bg-gray-200 md:block" />
              <div className="flex w-full flex-1 items-center px-4">
                <i className="fa-solid fa-location-dot mr-3 text-gray-400" />
                <input
                  className="w-full border-none py-3 text-slate-800 focus:ring-0"
                  placeholder="Miền Bắc, Miền Nam, Hà Nội, TP.HCM..."
                  type="text"
                  value={searchLocationInput}
                  onChange={(event) => {
                    setSearchLocationInput(event.target.value);
                  }}
                />
              </div>
              <button
                className="w-full rounded-xl bg-primary-600 px-8 py-3.5 font-bold text-white transition-standard hover:bg-primary-700 md:w-auto"
                type="button"
                disabled={isSearchingJobs}
                onClick={() => {
                  void handleSearchJobs();
                }}
              >
                {isSearchingJobs ? 'Searching...' : 'Search Jobs'}
              </button>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-white/80">
              <span>Popular:</span>
              {STATIC_HERO.popularKeywords.map((keyword) => (
                <a
                  key={keyword}
                  className="underline hover:text-white"
                  href="#"
                >
                  {keyword}
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="relative z-20 -mt-16 px-4 py-12">
          <div className="stats-gradient mx-auto max-w-7xl overflow-hidden rounded-3xl p-8 text-white shadow-2xl">
            <div className="flex flex-col gap-8 lg:flex-row">
              <div className="space-y-8 lg:w-1/3">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-sm">
                      <i className="fa-solid fa-robot text-4xl text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-4 w-4 animate-pulse rounded-full border-2 border-primary-900 bg-primary-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Job Market Today</h2>
                    <p className="text-sm text-primary-100">{STATIC_MARKET_STATS.asOfText}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm transition-all hover:bg-white/20">
                    <p className="text-3xl font-bold">
                      {STATIC_MARKET_STATS.newJobs24h.toLocaleString('en-US')}
                    </p>
                    <p className="text-sm font-medium text-primary-100">
                      New Jobs in last 24h
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm transition-all hover:bg-white/20">
                    <p className="text-3xl font-bold">
                      {STATIC_MARKET_STATS.activeJobs.toLocaleString('en-US')}
                    </p>
                    <p className="text-sm font-medium text-primary-100">
                      Total Active Openings
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm transition-all hover:bg-white/20">
                    <p className="text-3xl font-bold">
                      {STATIC_MARKET_STATS.hiringCompanies.toLocaleString('en-US')}
                    </p>
                    <p className="text-sm font-medium text-primary-100">
                      Hiring Companies
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:w-2/3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-sm font-bold tracking-wider text-white uppercase">
                      <i className="fa-solid fa-chart-line mr-2" />
                      Job Opportunity Growth
                    </h3>
                  </div>
                  <div className="relative flex h-48 items-end justify-between">
                    <svg
                      className="absolute inset-0 h-full w-full"
                      preserveAspectRatio="none"
                      viewBox="0 0 100 100"
                    >
                      <path
                        d={growthPath}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="3"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col justify-between opacity-10">
                      <div className="w-full border-t border-white" />
                      <div className="w-full border-t border-white" />
                      <div className="w-full border-t border-white" />
                      <div className="w-full border-t border-white" />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between text-[10px] text-primary-100/70">
                    {growthSeries.map((point) => (
                      <span key={`${point.date}-${point.value}`}>
                        {formatShortDate(point.date)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-sm font-bold tracking-wider text-white uppercase">
                      <i className="fa-solid fa-chart-bar mr-2" />
                      Demand by Industry
                    </h3>
                    <select className="rounded border border-white/20 bg-white/10 px-2 py-1 text-xs text-white focus:border-white/40 focus:ring-0">
                      <option className="text-slate-800">Industries</option>
                    </select>
                  </div>
                  <div className="flex h-48 items-end justify-around gap-2 px-2">
                    {demandBars.map((bar, index) => (
                      <div
                        key={`${bar.height}-${index}`}
                        className={`bar-animate h-0 w-8 rounded-t-sm ${bar.className}`}
                        style={
                          {
                            '--final-height': bar.height,
                            height: 0,
                          } as CSSProperties
                        }
                        title={bar.label}
                      />
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-primary-50">
                    {demandBars.map((bar) => (
                      <span
                        key={`${bar.industryKey}-${bar.label}`}
                        className="flex items-center gap-1"
                      >
                        <span className={`h-2 w-2 rounded-full ${bar.className}`} />
                        {bar.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-gray-100 bg-white py-12">
          <div className="mx-auto max-w-7xl px-4">
            <p className="mb-8 text-center text-sm font-semibold tracking-widest text-gray-400 uppercase">
              Trusted by 10,000+ top companies
            </p>
            <div className="flex flex-wrap items-center justify-center gap-10 opacity-40 grayscale md:gap-20">
              <i className="fa-brands fa-google text-4xl" />
              <i className="fa-brands fa-microsoft text-4xl" />
              <i className="fa-brands fa-amazon text-4xl" />
              <i className="fa-brands fa-apple text-4xl" />
              <i className="fa-brands fa-airbnb text-4xl" />
              <i className="fa-brands fa-slack text-4xl" />
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">
                  Explore by Category
                </h2>
                <p className="mt-2 text-gray-500">
                  Find the right path for your professional growth.
                </p>
              </div>
              <Link
                className="font-semibold text-primary-600 hover:underline"
                href="/jobs"
              >
                View all categories{' '}
                <i className="fa-solid fa-arrow-right ml-1" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {displayedCategories.map((category) => (
                <div
                  key={category.id}
                  className="group cursor-pointer rounded-2xl border border-gray-100 bg-white p-8 transition-all hover:border-primary-500 hover:shadow-xl"
                >
                  <div
                    className={`transition-standard mb-6 flex h-14 w-14 items-center justify-center rounded-xl group-hover:bg-primary-600 group-hover:text-white ${
                      category.slug === 'design-creative'
                        ? 'bg-indigo-50 text-indigo-600'
                        : category.slug === 'marketing-sales'
                          ? 'bg-green-50 text-green-600'
                          : category.slug === 'finance-banking'
                            ? 'bg-orange-50 text-orange-600'
                            : 'bg-blue-50 text-primary-600'
                    }`}
                  >
                    <i
                      className={`${normalizeIconClass(category.iconKey)} text-2xl`}
                    />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {category.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {category.openJobsCount.toLocaleString('en-US')} Openings
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">
                  Best Jobs For You
                </h2>
                <p className="mt-1 flex items-center gap-2 text-gray-500">
                  <span className="h-2 w-2 rounded-full bg-green-500" />{' '}
                  Recommendations by HireStream AI
                </p>
              </div>
              <Link
                className="font-bold text-primary-600 hover:underline"
                href="/jobs"
              >
                View all{' '}
                <i className="fa-solid fa-chevron-right ml-1 text-xs" />
              </Link>
            </div>

            {actionError ? (
              <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {actionError}
              </div>
            ) : null}

            <div className="hide-scrollbar mb-8 flex items-center gap-4 overflow-x-auto pb-2">
              <div className="flex shrink-0 items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-500">
                <i className="fa-solid fa-filter text-xs" />
                <span className="text-sm font-medium">Filter by: Location</span>
                <i className="fa-solid fa-chevron-down ml-2 text-[10px]" />
              </div>
              {HOMEPAGE_LOCATION_FILTERS.map((location) => (
                <button
                  key={location.slug}
                  className={`transition-standard rounded-full px-5 py-2 text-sm font-semibold ${selectedLocation === location.slug ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  type="button"
                  onClick={() => {
                    handleLocationSelect(location.slug);
                  }}
                >
                  {location.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visibleFeaturedJobs.map((job) => (
                <div
                  key={job.id}
                  className="job-grid-card group relative flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-gray-100 bg-slate-50 p-2">
                      {job.companyLogoUrl ? (
                        <Image
                          src={job.companyLogoUrl}
                          alt={job.companyName}
                          width={48}
                          height={48}
                          className="h-10 w-10 object-contain"
                          unoptimized
                        />
                      ) : (
                        <i
                          className={`${normalizeIconClass(job.companyIconKey)} text-3xl text-slate-700`}
                        />
                      )}
                    </div>
                    <button
                      className="transition-standard flex h-8 w-8 items-center justify-center rounded-full border border-gray-100 text-gray-400 hover:border-red-100 hover:text-red-500"
                      type="button"
                      disabled={savingJobIds.has(job.id)}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        void toggleJobSave(job);
                      }}
                    >
                      <i
                        className={`${job.isSaved ? 'fa-solid text-red-500' : 'fa-regular'} fa-heart`}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                  <div className="flex-grow">
                    <Link href={`/jobs/${job.slug}`}>
                      <h3 className="transition-standard mb-1 cursor-pointer text-lg leading-tight font-bold text-slate-900 group-hover:text-primary-600">
                        {job.title}
                      </h3>
                    </Link>
                    <p className="mb-2 text-sm text-gray-500">
                      {job.companyName}
                    </p>
                    <p className="line-clamp-2 mb-4 text-sm text-gray-600">
                      {job.shortDescription}
                    </p>
                    <div className="mb-4 flex items-center gap-2">
                      <span className="rounded bg-primary-50 px-2 py-0.5 text-sm font-bold text-primary-600">
                        {job.salaryText}
                      </span>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-4">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                      {job.locationLabel}
                    </span>
                    <Link
                      className="flex items-center gap-1 text-sm font-bold text-primary-600 transition-all hover:gap-2"
                      href={`/jobs/${job.slug}`}
                    >
                      View details{' '}
                      <i className="fa-solid fa-arrow-right text-xs" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <button
                className="rounded-xl border-2 border-primary-600 px-8 py-3 font-bold text-primary-600 shadow-md transition-all hover:bg-primary-600 hover:text-white active:scale-95"
                type="button"
                disabled={!hasMoreJobs || isLoadingMoreJobs}
                onClick={() => {
                  void handleLoadMoreJobs();
                }}
              >
                {isLoadingMoreJobs ? 'Loading...' : 'Explore more jobs'}{' '}
                <i className="fa-solid fa-arrow-down ml-2 text-sm" />
              </button>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-primary-900 py-24 text-white">
          <div className="absolute top-0 right-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-800 opacity-20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/2 translate-y-1/2 rounded-full bg-primary-700 opacity-20 blur-3xl" />
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold md:text-4xl">How HireStream Works</h2>
              <p className="mt-4 text-primary-300">
                Three simple steps to your next career milestone.
              </p>
            </div>
            <div className="grid gap-12 text-center md:grid-cols-3">
              <div className="group flex flex-col items-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-primary-700 bg-primary-800 shadow-lg transition-transform group-hover:scale-110">
                  <i className="fa-solid fa-user-plus text-3xl text-primary-400" />
                </div>
                <h3 className="mb-3 text-xl font-bold">Create Account</h3>
                <p className="text-primary-200">
                  Sign up in seconds. Tell us about your expertise and career aspirations.
                </p>
              </div>
              <div className="group flex flex-col items-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-primary-700 bg-primary-800 shadow-lg transition-transform group-hover:scale-110">
                  <i className="fa-solid fa-file-arrow-up text-3xl text-primary-400" />
                </div>
                <h3 className="mb-3 text-xl font-bold">Upload CV</h3>
                <p className="text-primary-200">
                  Our AI-powered CV parser will help you stand out to hiring managers.
                </p>
              </div>
              <div className="group flex flex-col items-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-primary-700 bg-primary-800 shadow-lg transition-transform group-hover:scale-110">
                  <i className="fa-solid fa-briefcase text-3xl text-primary-400" />
                </div>
                <h3 className="mb-3 text-xl font-bold">Get Hired</h3>
                <p className="text-primary-200">
                  Apply to jobs with one click and track your applications in real-time.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 bg-white pt-20 pb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
            <div className="col-span-1 lg:col-span-1">
              <div className="mb-6 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-600 text-white">
                  <i className="fa-solid fa-bolt-lightning" />
                </div>
                <span className="text-xl font-bold text-slate-800">HireStream</span>
              </div>
              <p className="mb-6 text-gray-500">
                Join our newsletter to receive the latest job openings directly in your inbox.
              </p>
              <div className="flex">
                <input
                  className="w-full rounded-l-lg border-gray-200 bg-gray-50 px-4 focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Email address"
                  type="email"
                />
                <button
                  className="transition-standard rounded-r-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
                  type="button"
                >
                  <i className="fa-solid fa-paper-plane" />
                </button>
              </div>
            </div>
            <div>
              <h4 className="mb-6 font-bold text-slate-900">Quick Links</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                {STATIC_QUICK_LINKS.map((link) => (
                  <li key={`${link.label}-${link.href}`}>
                    <a
                      className="transition-standard hover:text-primary-600"
                      href={link.href}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-6 font-bold text-slate-900">Support</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                {STATIC_SUPPORT_LINKS.map((link) => (
                  <li key={`${link.label}-${link.href}`}>
                    <a
                      className="transition-standard hover:text-primary-600"
                      href={link.href}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-6 font-bold text-slate-900">Connect With Us</h4>
              <div className="flex space-x-4">
                {STATIC_SOCIAL_LINKS.map((link) => (
                  <a
                    key={`${link.icon}-${link.href}`}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-all hover:bg-primary-600 hover:text-white"
                    href={link.href}
                  >
                    <i className={link.icon} />
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-8 text-sm text-gray-400 md:flex-row">
            <p>© 2023 HireStream Recruitment Inc. All rights reserved.</p>
            <div className="flex space-x-6">
              <a className="hover:text-slate-600" href="#">
                Sitemap
              </a>
              <a className="hover:text-slate-600" href="#">
                English (US)
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
