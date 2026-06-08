import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Crown,
  MapPin,
  Search,
  Sparkles,
} from 'lucide-react';
import { auth } from '@/auth';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { getCompanies } from '@/lib/companies-client';
import type { CompanyItem } from '@/lib/companies-client';

export const metadata: Metadata = {
  title: 'Danh sách công ty - SCC',
  description:
    'Khám phá danh sách công ty đang tuyển dụng, ưu tiên các doanh nghiệp nổi bật và nhiều vị trí phù hợp.',
  alternates: { canonical: '/companies' },
};

type CompaniesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function getCompanyTypeLabel(type: string | null | undefined): string {
  if (!type) return 'Đang tăng trưởng';
  const t = type.toLowerCase().trim();
  if (t === 'pro') return 'Pro';
  if (t === 'corporation' || t === 'large' || t === 'big') return 'Tập đoàn lớn';
  if (t === 'normal') return 'Đang tăng trưởng';
  return 'Startup';
}

function CompanyLogo({ company, className = '' }: { company: CompanyItem; className?: string }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white ${className}`}
    >
      <Image
        src={company.logoUrl ?? '/logo.jpg'}
        alt={`Logo ${company.name}`}
        className="h-full w-full object-contain p-2"
        loading="lazy"
        width={128}
        height={128}
      />
    </div>
  );
}

function FeaturedCompanyCard({ company, index }: { company: CompanyItem; index: number }) {
  return (
    <Link
      href={`/companies/${company.slug}`}
      className="group flex h-full flex-col rounded-lg border border-white/70 bg-white p-5 shadow-sm shadow-slate-200/70 outline-none transition-all duration-200 hover:-translate-y-1 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-100/70 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-4">
        <CompanyLogo company={company} className="h-16 w-16" />
        <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-primary-50 px-3 text-sm font-bold text-primary-700">
          #{index + 1}
        </span>
      </div>
      <div className="mt-5 flex-1">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          <Crown className="h-3.5 w-3.5" aria-hidden="true" />
          Pro
        </div>
        <h2 className="line-clamp-2 text-lg font-extrabold text-slate-950 transition-colors group-hover:text-primary-700">
          {company.name}
        </h2>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
          {company.shortDescription ?? 'Hồ sơ công ty đang được cập nhật.'}
        </p>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
        <div className="flex items-center gap-2 text-slate-600">
          <BriefcaseBusiness className="h-4 w-4 text-primary-600" aria-hidden="true" />
          <span className="font-semibold text-slate-900">{company.jobsCount}</span> việc
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <Building2 className="h-4 w-4 text-primary-600" aria-hidden="true" />
          <span className="line-clamp-1">{company.industry ?? 'Đa lĩnh vực'}</span>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between text-sm font-bold text-primary-700">
        Xem công ty
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </div>
    </Link>
  );
}

function CompanyListCard({ company }: { company: CompanyItem }) {
  return (
    <Link
      href={`/companies/${company.slug}`}
      className="group grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm outline-none transition-all duration-200 hover:border-primary-200 hover:bg-primary-50/40 hover:shadow-lg hover:shadow-primary-100/60 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 sm:grid-cols-[72px_1fr_auto]"
    >
      <CompanyLogo company={company} className="h-[72px] w-[72px]" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {getCompanyTypeLabel(company.companyType)}
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {company.jobsCount} tin tuyển dụng
          </span>
        </div>
        <h2 className="mt-3 text-base font-extrabold text-slate-950 transition-colors group-hover:text-primary-700 sm:text-lg">
          {company.name}
        </h2>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
          {company.shortDescription ?? 'Hồ sơ công ty đang được cập nhật.'}
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="h-4 w-4" aria-hidden="true" />
            {company.industry ?? 'Đa lĩnh vực'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {(company.location ?? 'Việt Nam').split(',').slice(-2).join(',').trim()}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center">
        <span className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary-600 px-4 text-sm font-bold text-white transition-colors group-hover:bg-primary-700">
          Xem chi tiết
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

export default async function CompaniesPage({ searchParams }: CompaniesPageProps) {
  const [session, params] = await Promise.all([auth(), searchParams]);
  const query = getParam(params.q).trim();
  const type = getParam(params.type);
  const [companies, featured] = await Promise.all([
    getCompanies({ q: query || undefined, type: type || undefined, limit: 60 }),
    getCompanies({ type: 'pro', limit: 5 }),
  ]);
  const filteredCompanies = companies.items;
  const featuredCompanies = featured.items;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader
        isAuthenticated={Boolean(session?.accessToken)}
        role={session?.user?.role}
        user={
          session?.user
            ? {
                name: session.user.name,
                email: session.user.email,
                avatarUrl: session.user.image,
              }
            : null
        }
      />

      <main>
        <section className="border-b border-primary-100 bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-14">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-sm font-bold text-primary-700">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Danh sách công ty nổi bật
              </div>
              <h1 className="mt-5 max-w-3xl text-3xl font-extrabold leading-tight text-slate-950 sm:text-4xl">
                Khám phá công ty đang tuyển dụng trên SCC
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Xem nhanh hồ sơ công ty, quy mô, lĩnh vực hoạt động và các tin tuyển dụng mock data. Các công ty lớn được ưu tiên hiển thị ở đầu danh sách.
              </p>
              <form className="mt-7 grid max-w-3xl gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_190px_auto]">
                <label className="relative block">
                  <span className="sr-only">Tìm công ty</span>
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    name="q"
                    defaultValue={getParam(params.q)}
                    placeholder="Tên công ty, lĩnh vực, địa điểm..."
                    className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  />
                </label>
                <label className="block">
                  <span className="sr-only">Loại công ty</span>
                  <select
                    name="type"
                    defaultValue={type}
                    className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  >
                    <option value="">Tất cả công ty</option>
                    <option value="pro">Công ty Pro</option>
                    <option value="normal">Đang tăng trưởng</option>
                    <option value="startup">Startup</option>
                  </select>
                </label>
                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 text-sm font-bold text-white transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                >
                  <Search className="h-4 w-4" aria-hidden="true" />
                  Tìm kiếm
                </button>
              </form>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:self-end">
              {[
                [`${companies.pagination.totalItems}+`, 'Công ty'],
                [
                  `${filteredCompanies.reduce((total, company) => total + company.jobsCount, 0)}+`,
                  'Tin tuyển dụng',
                ],
                [`${featuredCompanies.length}`, 'Công ty Pro'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="text-2xl font-extrabold text-primary-700">{value}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-600">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase text-primary-700">Ưu tiên</p>
              <h2 className="mt-1 text-2xl font-extrabold text-slate-950">Top công ty lớn</h2>
            </div>
            <p className="text-sm text-slate-500">Sắp xếp theo quy mô, độ nổi bật và số lượng tin tuyển dụng.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featuredCompanies.map((company, index) => (
              <FeaturedCompanyCard key={company.slug} company={company} index={index} />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase text-primary-700">Tất cả</p>
              <h2 className="mt-1 text-2xl font-extrabold text-slate-950">
                {filteredCompanies.length} công ty phù hợp
              </h2>
            </div>
          </div>
          <div className="grid gap-4">
            {filteredCompanies.map((company) => (
              <CompanyListCard key={company.slug} company={company} />
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
