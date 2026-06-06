import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ExternalLink,
  Globe,
  Heart,
  Link as LinkIcon,
  Map,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { auth } from '@/auth';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { getCompanies, getCompanyDetail } from '@/lib/companies-client';
import type { CompanyItem } from '@/lib/companies-client';

type CompanyDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CompanyDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const company = await getCompanyDetail(slug).catch(() => null);

  if (!company) {
    return {
      title: 'Không tìm thấy công ty - SCC',
    };
  }

  return {
    title: `${company.name} - SCC`,
    description: company.shortDescription,
    alternates: { canonical: `/companies/${company.slug}` },
  };
}

function CompanyLogo({ company, className = '' }: { company: CompanyItem; className?: string }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white ${className}`}
    >
      <Image
        src={company.logoUrl ?? '/logo.jpg'}
        alt={`Logo ${company.name}`}
        className="h-full w-full object-contain p-3"
        loading="lazy"
        width={128}
        height={128}
      />
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 font-bold text-slate-950">{value}</p>
      </div>
    </div>
  );
}

export default async function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  const [{ slug }, session] = await Promise.all([params, auth()]);
  const company = await getCompanyDetail(slug).catch(() => null);

  if (!company) {
    notFound();
  }

  const relatedCompanies = (
    await getCompanies({ type: 'pro', limit: 4 }).catch(() => ({ items: [] }))
  ).items
    .filter((item) => item.slug !== company.slug)
    .slice(0, 3);

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

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Danh sách công ty', href: '/companies' },
            { label: company.name },
          ]}
          className="mb-5"
        />

        <section className="overflow-hidden rounded-lg bg-white shadow-sm shadow-slate-200/70">
          <div className="relative border-b border-slate-100 bg-white p-5 sm:p-7">
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-primary-50 via-white to-emerald-50" aria-hidden="true" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <CompanyLogo company={company} className="h-32 w-32" />
                <div>
                  <Link
                    href="/companies"
                    className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-primary-700 transition-colors hover:text-primary-900"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Quay lại danh sách
                  </Link>
                  <h1 className="max-w-3xl text-2xl font-extrabold leading-tight text-slate-950 sm:text-3xl">
                    {company.name}
                  </h1>
                  {company.website ? (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-primary-700"
                    >
                      <LinkIcon className="h-4 w-4" aria-hidden="true" />
                      {company.website}
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  ) : (
                    <p className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500">
                      <LinkIcon className="h-4 w-4" aria-hidden="true" />
                      Website đang cập nhật
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(company.highlights.length ? company.highlights : ['Hiring']).map((highlight) => (
                      <span
                        key={highlight}
                        className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="inline-flex h-12 min-w-44 items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 text-sm font-extrabold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                <Heart className="h-4 w-4" aria-hidden="true" />
                Theo dõi công ty
              </button>
            </div>
          </div>
          <nav aria-label="Thông tin công ty" className="flex gap-6 px-5 sm:px-7">
            <a
              href="#overview"
              className="border-b-2 border-emerald-600 py-4 text-sm font-extrabold text-emerald-700"
            >
              Trang chủ
            </a>
            <a
              href="#jobs"
              className="border-b-2 border-transparent py-4 text-sm font-bold text-slate-500 transition-colors hover:text-primary-700"
            >
              Tin tuyển dụng ({company.jobsCount})
            </a>
          </nav>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <section id="overview" className="rounded-lg bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-7">
              <h2 className="text-2xl font-extrabold text-slate-950">Giới thiệu công ty</h2>
              <div className="mt-5 space-y-4 text-[15px] leading-7 text-slate-700">
                {company.description.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {!company.description.length ? (
                  <p>{company.shortDescription ?? 'Thông tin giới thiệu công ty đang được cập nhật.'}</p>
                ) : null}
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ['Quy mô', company.size ?? 'Đang cập nhật'],
                  ['Vị trí mở', `${company.jobsCount} tin`],
                  ['Lĩnh vực', company.industry ?? 'Đa lĩnh vực'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-1 font-extrabold text-slate-950">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="jobs" className="rounded-lg bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-950">Tin tuyển dụng</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Một số vị trí mock đang hiển thị cho công ty này.
                  </p>
                </div>
                <div className="relative w-full sm:w-80">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    placeholder="Tên công việc, vị trí ứng tuyển..."
                    className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {company.recentJobs.map((job) => (
                  <article
                    key={job.id}
                    className="rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-primary-200 hover:bg-primary-50/40"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-extrabold text-slate-950">{job.title}</h3>
                        <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" aria-hidden="true" />
                            {job.location}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
                            {job.salary}
                          </span>
                          <span>{job.postedAt}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {job.tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="inline-flex h-11 items-center justify-center rounded-lg bg-primary-600 px-4 text-sm font-bold text-white transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                      >
                        Ứng tuyển
                      </button>
                    </div>
                  </article>
                ))}
                {!company.recentJobs.length ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-sm font-semibold text-slate-500">
                    Công ty này chưa có tin tuyển dụng đang mở.
                  </div>
                ) : null}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-lg bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-6">
              <h2 className="text-xl font-extrabold text-slate-950">Thông tin chung</h2>
              <div className="mt-5 space-y-5">
                <InfoRow icon={BadgeCheck} label="Mã số thuế" value={company.taxCode ?? 'Đang cập nhật'} />
                <InfoRow icon={Users} label="Quy mô" value={company.size ?? 'Đang cập nhật'} />
                <InfoRow icon={Building2} label="Lĩnh vực hoạt động" value={company.industry ?? 'Đa lĩnh vực'} />
              </div>
            </section>

            <section className="rounded-lg bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-6">
              <h2 className="text-xl font-extrabold text-slate-950">Địa điểm công ty</h2>
              <p className="mt-4 flex gap-3 text-sm leading-6 text-slate-700">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                {company.location ?? 'Địa điểm đang cập nhật'}
              </p>
              <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
                <div className="relative h-48 bg-[linear-gradient(135deg,#dbeafe_0%,#ecfeff_45%,#dcfce7_100%)]">
                  <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-bold text-primary-700 shadow-sm">
                    Mở trong Maps
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="absolute bottom-5 left-5 right-5 rounded-lg bg-white/90 p-3 text-sm font-semibold text-slate-700 shadow-sm">
                    <Map className="mr-2 inline h-4 w-4 text-primary-600" aria-hidden="true" />
                    Bản đồ minh họa mock data
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-lg bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-6">
              <h2 className="text-xl font-extrabold text-slate-950">Điểm nổi bật</h2>
              <div className="mt-5 space-y-3">
                {([
                  ['Môi trường xác thực', ShieldCheck],
                  ['Phúc lợi rõ ràng', CheckCircle2],
                  ['Có website công ty', Globe],
                  ['Đang tuyển tích cực', Sparkles],
                ] satisfies Array<[string, LucideIcon]>).map(([label, Icon]) => (
                  <div key={label} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                    <Icon className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                    {label}
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>

        <section className="py-10">
          <h2 className="text-2xl font-extrabold text-slate-950">Công ty liên quan</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {relatedCompanies.map((item) => (
              <Link
                key={item.slug}
                href={`/companies/${item.slug}`}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-primary-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              >
                <div className="flex items-center gap-3">
                  <CompanyLogo company={item} className="h-14 w-14" />
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 text-sm font-extrabold text-slate-950">{item.name}</h3>
                    <p className="mt-1 text-xs font-semibold text-primary-700">{item.jobsCount} tin tuyển dụng</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
