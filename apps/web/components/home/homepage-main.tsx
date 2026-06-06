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
import { SCCBrandLogo } from '@/components/layout/brand-mark';
import { SiteHeader } from '@/components/layout/site-header';

const FALLBACK_HOMEPAGE: HomepageResponse = {
  currentUser: null,
  hero: {
    headline: 'Find Your Dream Job',
    subheadline:
      'Over 500,000 active job openings from top-tier companies and innovative startups worldwide.',
    backgroundImageUrl: '/hero-bg.jpg',
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
    copyrightText: '© 2023 SCC Smart Career Connector. All rights reserved.',
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
  backgroundImageUrl: '/hero-bg.jpg',
  popularKeywords: [
    'Software Engineer',
    'Product Designer',
    'Marketing Manager',
  ],
};

const STATIC_MARKET_STATS = {
  asOfText: '13 tháng 3, 2026',
  newJobs24h: 5059,
  activeJobs: 63198,
  hiringCompanies: 18402,
};

const STATIC_QUICK_LINKS = [
  { label: 'Tìm việc làm', href: '/jobs' },
  { label: 'Hồ sơ công ty', href: '#' },
  { label: 'Thông báo việc làm', href: '#' },
  { label: 'Lời khuyên nghề nghiệp', href: '#' },
];

const STATIC_SUPPORT_LINKS = [
  { label: 'Chính sách bảo mật', href: '#' },
  { label: 'Điều khoản dịch vụ', href: '#' },
  { label: 'Chính sách cookie', href: '#' },
  { label: 'Trung tâm trợ giúp', href: '#' },
];

const STATIC_SOCIAL_LINKS = [
  { icon: 'fa-brands fa-linkedin-in', href: '#' },
  { icon: 'fa-brands fa-twitter', href: '#' },
  { icon: 'fa-brands fa-instagram', href: '#' },
  { icon: 'fa-brands fa-facebook-f', href: '#' },
];

const TOP_EMPLOYERS = [
  { name: 'FPT Software', domain: 'fpt-software.com', tagline: 'Dịch vụ IT hàng đầu', openPositions: 142 },
  { name: 'VNG Corporation', domain: 'vng.com.vn', tagline: 'Công nghệ & Game', openPositions: 87 },
  { name: 'Viettel', domain: 'viettel.com.vn', tagline: 'Viễn thông & Số', openPositions: 203 },
  { name: 'Techcombank', domain: 'techcombank.com.vn', tagline: 'Ngân hàng & Tài chính', openPositions: 65 },
  { name: 'VNPay', domain: 'vnpay.vn', tagline: 'Fintech & Thanh toán', openPositions: 48 },
  { name: 'MoMo', domain: 'momo.vn', tagline: 'Ví điện tử & Tài chính', openPositions: 72 },
  { name: 'Shopee Vietnam', domain: 'shopee.vn', tagline: 'Thương mại điện tử', openPositions: 156 },
  { name: 'Grab Vietnam', domain: 'grab.com', tagline: 'Giao thông & Giao hàng', openPositions: 93 },
];

const WHY_CHOOSE_FEATURES = [
  {
    icon: 'fa-solid fa-brain',
    title: 'Ghép nối bằng AI',
    description: 'AI phân tích kỹ năng và sở thích của bạn để tìm việc làm phù hợp nhất với độ chính xác 95%.',
    color: 'bg-purple-50 text-purple-600',
    hoverColor: 'group-hover:bg-purple-600',
  },
  {
    icon: 'fa-solid fa-shield-check',
    title: 'Nhà tuyển dụng xác thực',
    description: 'Mỗi công ty trên SCC đều được xác thực để đảm bảo cơ hội việc làm an toàn và hợp pháp cho ứng viên.',
    color: 'bg-green-50 text-green-600',
    hoverColor: 'group-hover:bg-green-600',
  },
  {
    icon: 'fa-solid fa-bell',
    title: 'Thông báo thời gian thực',
    description: 'Nhận cảnh báo tức thì khi có việc làm phù hợp hoặc khi nhà tuyển dụng xem hồ sơ của bạn.',
    color: 'bg-blue-50 text-primary-600',
    hoverColor: 'group-hover:bg-primary-600',
  },
  {
    icon: 'fa-solid fa-chart-pie',
    title: 'Thông tin nghề nghiệp',
    description: 'Xem báo cáo lương, xu hướng ngành và lời khuyên nghề nghiệp cá nhân hóa để đưa ra quyết định đúng đắn.',
    color: 'bg-orange-50 text-orange-600',
    hoverColor: 'group-hover:bg-orange-600',
  },
];

const BLOG_ARTICLES = [
  {
    id: 'blog-1',
    title: '10 Kỹ năng mềm giúp bạn nổi bật trong mắt nhà tuyển dụng 2026',
    excerpt: 'Khám phá những kỹ năng mềm quan trọng nhất mà các nhà tuyển dụng hàng đầu đang tìm kiếm...',
    category: 'Mẹo nghề nghiệp',
    readTime: '5 phút đọc',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=250&fit=crop',
  },
  {
    id: 'blog-2',
    title: 'Xu hướng lương IT Việt Nam 2026: Ngành nào trả cao nhất?',
    excerpt: 'Phân tích chi tiết mức lương các vị trí IT phổ biến tại Việt Nam trong năm 2026...',
    category: 'Báo cáo lương',
    readTime: '8 phút đọc',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop',
  },
  {
    id: 'blog-3',
    title: 'Cách viết CV ấn tượng: Bí quyết từ chuyên gia tuyển dụng',
    excerpt: 'Hướng dẫn từng bước cách tạo CV chuyên nghiệp giúp bạn vượt qua vòng sàng lọc...',
    category: 'Hướng dẫn CV',
    readTime: '6 phút đọc',
    imageUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=250&fit=crop',
  },
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

const ALL_HOMEPAGE_CATEGORIES = [
  // Page 1
  { name: 'Kinh doanh/Bán hàng', keyword: 'Kinh doanh' },
  { name: 'Marketing/PR/Quảng cáo', keyword: 'Marketing' },
  { name: 'Chăm sóc khách hàng (Custome...', keyword: 'Chăm sóc khách hàng' },
  { name: 'Nhân sự/Hành chính/Pháp chế', keyword: 'Nhân sự' },
  { name: 'Công nghệ Thông tin', keyword: 'Công nghệ Thông tin' },
  { name: 'Lao động phổ thông', keyword: 'Lao động phổ thông' },
  // Page 2
  { name: 'Tài chính/Kế toán', keyword: 'Kế toán' },
  { name: 'Xây dựng/Kiến trúc', keyword: 'Xây dựng' },
  { name: 'Khách sạn/Du lịch', keyword: 'Du lịch' },
  { name: 'Y tế/Dược phẩm', keyword: 'Y tế' },
  { name: 'Giáo dục/Đào tạo', keyword: 'Giáo dục' },
  { name: 'Logistics/Vận tải', keyword: 'Vận tải' },
  // Page 3
  { name: 'Ngôn ngữ/Biên phiên dịch', keyword: 'Biên phiên dịch' },
  { name: 'Luật/Pháp lý', keyword: 'Pháp lý' },
  { name: 'Thiết kế/Đồ họa', keyword: 'Thiết kế' },
  { name: 'Kỹ thuật/Cơ khí', keyword: 'Kỹ thuật' },
  { name: 'Sản xuất/Vận hành', keyword: 'Sản xuất' },
  { name: 'Bất động sản', keyword: 'Bất động sản' },
  // Page 4
  { name: 'Spa/Làm đẹp', keyword: 'Làm đẹp' },
  { name: 'Thời trang/Mỹ phẩm', keyword: 'Thời trang' },
  { name: 'Nông/Lâm/Ngư nghiệp', keyword: 'Nông nghiệp' },
  { name: 'Thực phẩm/Đồ uống', keyword: 'Thực phẩm' },
  { name: 'Báo chí/Truyền thông', keyword: 'Truyền thông' },
  { name: 'Xuất nhập khẩu', keyword: 'Xuất nhập khẩu' },
  // Page 5
  { name: 'Hàng tiêu dùng', keyword: 'Hàng tiêu dùng' },
  { name: 'An ninh/Bảo vệ', keyword: 'Bảo vệ' },
  { name: 'Kỹ thuật điện/Điện tử', keyword: 'Điện tử' },
  { name: 'Tư vấn/Trợ lý', keyword: 'Tư vấn' },
  { name: 'Thương mại điện tử', keyword: 'Thương mại điện tử' },
  { name: 'Khác', keyword: 'Khác' },
];

const SUGGESTED_SEARCH_TAGS = [
  'Kỹ sư thiết kế công nghệ',
  'Nhân viên kinh doanh online',
  'Nhân viên kinh doanh',
  'Kỹ sư thiết kế',
  'Trực page',
  'Sale online',
];

type HomepageMainProps = {
  initialData: HomepageResponse | null;
  accessToken: string | null;
  isAuthenticated?: boolean;
  role?: string;
};

export function HomepageMain({
  initialData,
  accessToken,
  isAuthenticated = false,
  role,
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
  const [totalPages, setTotalPages] = useState<number>(1);
  const [hasMoreJobs, setHasMoreJobs] = useState<boolean>(true);
  const [isLoadingMoreJobs, setIsLoadingMoreJobs] = useState<boolean>(false);
  const [isSearchingJobs, setIsSearchingJobs] = useState<boolean>(false);

  const [categoryPage, setCategoryPage] = useState<number>(1);
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState<boolean>(false);

  useEffect(() => {
    if (isAutoplayPaused) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoplayPaused]);

  const handleCategoryClick = async (keyword: string) => {
    if (keyword === 'Khác') {
      document.getElementById('best-jobs-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setSearchKeyword(keyword);
    setActionError(null);
    setIsSearchingJobs(true);
    try {
      const response = await getJobs({
        page: 1,
        limit: 6,
        q: keyword.trim() || undefined,
        status: 'PUBLISHED',
      });
      const mapped = response.items.map(toHomepageJob);
      setFeaturedJobs(mapped);
      setJobsPage(response.pagination.page);
      setTotalPages(response.pagination.totalPages);
      setHasMoreJobs(response.pagination.page < response.pagination.totalPages);
      
      document.getElementById('best-jobs-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      console.error('Failed to search jobs by category', error);
      setActionError('Could not load jobs for this category.');
    } finally {
      setIsSearchingJobs(false);
    }
  };

  const handleSuggestedTagClick = async (tag: string) => {
    setSearchKeyword(tag);
    setActionError(null);
    setIsSearchingJobs(true);
    try {
      const response = await getJobs({
        page: 1,
        limit: 6,
        q: tag.trim() || undefined,
        status: 'PUBLISHED',
      });
      const mapped = response.items.map(toHomepageJob);
      setFeaturedJobs(mapped);
      setJobsPage(response.pagination.page);
      setTotalPages(response.pagination.totalPages);
      setHasMoreJobs(response.pagination.page < response.pagination.totalPages);
      
      document.getElementById('best-jobs-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      console.error('Failed to search jobs by tag', error);
      setActionError('Could not load jobs for this tag.');
    } finally {
      setIsSearchingJobs(false);
    }
  };

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

  const fetchJobs = async (page: number) => {
    const response = await getJobs({
      page,
      limit: 6,
      q: searchKeyword.trim() || undefined,
      status: 'PUBLISHED',
    });
    const mapped = response.items.map(toHomepageJob);
    setFeaturedJobs(mapped);
    setJobsPage(response.pagination.page);
    setTotalPages(response.pagination.totalPages);
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
      await fetchJobs(1);
    } catch (error) {
      console.error('Failed to search jobs from homepage', error);
      setActionError('Could not search jobs right now.');
    } finally {
      setIsSearchingJobs(false);
    }
  };



  const handlePrevPage = async () => {
    if (isLoadingMoreJobs || jobsPage <= 1) return;
    setActionError(null);
    setIsLoadingMoreJobs(true);
    try {
      await fetchJobs(jobsPage - 1);
      document.getElementById('best-jobs-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      console.error('Failed to load previous page', error);
      setActionError('Could not load jobs right now.');
    } finally {
      setIsLoadingMoreJobs(false);
    }
  };

  const handleNextPage = async () => {
    if (isLoadingMoreJobs || !hasMoreJobs) return;
    setActionError(null);
    setIsLoadingMoreJobs(true);
    try {
      await fetchJobs(jobsPage + 1);
      document.getElementById('best-jobs-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      console.error('Failed to load next page', error);
      setActionError('Could not load jobs right now.');
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
        role={role}
        user={{
          name: homepageData.currentUser?.name,
          email: undefined,
          avatarUrl: homepageData.currentUser?.avatarUrl,
          planName: homepageData.currentUser?.planName,
        }}
      />
      <main>
        <section className="relative flex min-h-[750px] items-center justify-center overflow-hidden py-12 px-4 text-white">
          <img
            alt="Office Collaboration"
            className="absolute inset-0 h-full w-full object-cover"
            src={STATIC_HERO.backgroundImageUrl}
          />
          
          <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-center">
            {/* Headline */}
            <div className="text-center mb-8">
              <h1 className="mb-4 text-3xl leading-tight font-extrabold text-white md:text-5xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)]">
                {STATIC_HERO.headline} <br />
                <span className="text-primary-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">Where You Belong.</span>
              </h1>
              <p className="mx-auto max-w-2xl text-sm md:text-base text-slate-100 font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                {STATIC_HERO.subheadline}
              </p>
            </div>

            {/* Search Box Card */}
            <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-2 rounded-2xl bg-white p-2.5 shadow-2xl md:flex-row border border-slate-200/10">
              <div className="flex w-full flex-1 items-center px-4">
                <i className="fa-solid fa-magnifying-glass mr-3 text-slate-400" />
                <input
                  className="w-full border-none py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 text-sm md:text-base"
                  placeholder="Vị trí tuyển dụng, từ khóa..."
                  type="text"
                  value={searchKeyword}
                  onChange={(event) => {
                    setSearchKeyword(event.target.value);
                  }}
                />
              </div>
              <div className="hidden h-8 w-px bg-gray-200 md:block" />
              <div className="flex w-full flex-1 items-center px-4">
                <i className="fa-solid fa-location-dot mr-3 text-slate-400" />
                <input
                  className="w-full border-none py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 text-sm md:text-base"
                  placeholder="Miền Bắc, Miền Nam, Hà Nội, TP.HCM..."
                  type="text"
                  value={searchLocationInput}
                  onChange={(event) => {
                    setSearchLocationInput(event.target.value);
                  }}
                />
              </div>
              <button
                className="w-full rounded-xl bg-primary-600 px-8 py-3.5 font-bold text-white transition-all hover:bg-primary-700 active:scale-95 md:w-auto shadow-md cursor-pointer"
                type="button"
                disabled={isSearchingJobs}
                onClick={() => {
                  void handleSearchJobs();
                }}
              >
                {isSearchingJobs ? 'Đang tìm...' : 'Tìm việc làm'}
              </button>
            </div>

            {/* Gợi ý tags */}
            <div className="w-full max-w-4xl mx-auto mt-5 flex flex-wrap items-center gap-2 text-sm justify-start pl-2">
              <span className="text-slate-100 font-bold tracking-wide">Gợi ý:</span>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_SEARCH_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => void handleSuggestedTagClick(tag)}
                    className="bg-white text-primary-700 px-3.5 py-1 text-xs font-semibold rounded-full hover:bg-primary-50 active:scale-95 transition-all shadow-sm cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* 2-Column: Categories (Left) & Banner Slider (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8 w-full max-w-7xl">
              {/* Category card (Left) */}
              <div className="lg:col-span-4 xl:col-span-3 bg-white text-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between h-[450px] border border-slate-100/50">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-4 mb-3">
                    Danh mục nghề nghiệp
                  </h3>
                  {ALL_HOMEPAGE_CATEGORIES.slice((categoryPage - 1) * 6, categoryPage * 6).map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => void handleCategoryClick(cat.keyword)}
                      className="w-full flex items-center justify-between py-3 px-4 rounded-2xl hover:bg-blue-50/70 hover:text-blue-700 transition-all duration-200 group text-left cursor-pointer"
                    >
                      <span className="text-[13px] md:text-[14px] font-bold text-slate-700 group-hover:text-blue-700 truncate mr-2">
                        {cat.name}
                      </span>
                      <i className="fa-solid fa-chevron-right text-slate-300 group-hover:text-blue-500 text-xs transition-transform group-hover:translate-x-1" />
                    </button>
                  ))}
                </div>

                {/* Left Card Pagination */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider px-2">
                    Trang {categoryPage} / 5
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCategoryPage((prev) => Math.max(1, prev - 1))}
                      disabled={categoryPage === 1}
                      className="w-8 h-8 rounded-full border border-slate-200 text-slate-400 flex items-center justify-center hover:border-blue-500 hover:text-blue-700 disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-400 transition-all cursor-pointer"
                      aria-label="Trang trước"
                    >
                      <i className="fa-solid fa-chevron-left text-xs" />
                    </button>
                    <button
                      onClick={() => setCategoryPage((prev) => Math.min(5, prev + 1))}
                      disabled={categoryPage === 5}
                      className="w-8 h-8 rounded-full border border-slate-200 text-slate-400 flex items-center justify-center hover:border-blue-500 hover:text-blue-700 disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-400 transition-all cursor-pointer"
                      aria-label="Trang sau"
                    >
                      <i className="fa-solid fa-chevron-right text-xs" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Banner Carousel Slider (Right) */}
              <div 
                className="lg:col-span-8 xl:col-span-9 rounded-3xl overflow-hidden shadow-xl h-[450px] relative group border border-slate-100"
                onMouseEnter={() => setIsAutoplayPaused(true)}
                onMouseLeave={() => setIsAutoplayPaused(false)}
              >
                {/* Carousel Slides */}
                <div className="w-full h-full relative overflow-hidden">
                  {/* SLIDE 0: CTY TNHH LUYỆN KIM TRẦN HỒNG QUÂN */}
                  {activeSlide === 0 && (
                    <div className="relative w-full h-full p-6 md:p-10 flex flex-col justify-between select-none transition-all duration-700 animate-fadeIn bg-slate-950">
                      {/* Background Photo with 100% opacity */}
                      <Image
                        src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&auto=format&fit=crop"
                        alt="Aluminium Factory"
                        fill
                        className="absolute inset-0 object-cover z-0 opacity-100"
                        unoptimized
                      />
                      {/* Subtle left-side dark gradient to protect text legibility, leaving the right bright and natural */}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent z-0 pointer-events-none" />

                      {/* Header block */}
                      <div className="relative z-10 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center border border-amber-400/50 shadow-md shrink-0">
                          <span className="text-[10px] font-extrabold text-primary-700 leading-none text-center">THQ<br/>LK</span>
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-amber-300 tracking-widest uppercase block drop-shadow-sm">CTY TNHH LUYỆN KIM TRẦN HỒNG QUÂN</span>
                        </div>
                      </div>

                      {/* Main Center body */}
                      <div className="relative z-10 my-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex-1 max-w-xl">
                          <h2 className="text-xl md:text-3xl font-extrabold text-white tracking-wide leading-tight drop-shadow-md">
                            NHÀ MÁY SẢN XUẤT NHÔM KIM LOẠI
                          </h2>
                          <div className="mt-2 inline-block bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-sm uppercase tracking-wider shadow-sm animate-pulse">
                            ĐẦU TIÊN TẠI VIỆT NAM
                          </div>
                          <p className="mt-4 text-xs md:text-sm font-bold text-slate-100 flex items-center gap-2 drop-shadow-md">
                            TUYỂN DỤNG <span className="text-yellow-300 text-2xl md:text-3xl font-black drop-shadow-sm">600</span> NHÂN SỰ MỚI
                          </p>
                        </div>
                        
                        {/* QR and Details card */}
                        <div className="flex items-center gap-3 shrink-0 bg-black/40 p-3 rounded-2xl border border-white/10 backdrop-blur-sm shadow-md">
                          <div className="bg-white p-2 rounded-xl flex flex-col items-center justify-center shrink-0 border border-primary-500 shadow-sm w-20 h-20 md:w-24 md:h-24">
                            <svg className="w-14 h-14 md:w-18 md:h-18 text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                              <rect x="5" y="5" width="25" height="25" />
                              <rect x="10" y="10" width="15" height="15" fill="white" />
                              <rect x="70" y="5" width="25" height="25" />
                              <rect x="75" y="10" width="15" height="15" fill="white" />
                              <rect x="5" y="70" width="25" height="25" />
                              <rect x="10" y="75" width="15" height="15" fill="white" />
                              <rect x="40" y="5" width="10" height="10" />
                              <rect x="55" y="15" width="10" height="20" />
                              <rect x="40" y="25" width="20" height="10" />
                              <rect x="5" y="40" width="20" height="10" />
                              <rect x="20" y="55" width="10" height="10" />
                              <rect x="35" y="45" width="15" height="15" />
                              <rect x="50" y="60" width="15" height="10" />
                              <rect x="70" y="40" width="10" height="15" />
                              <rect x="85" y="45" width="10" height="10" />
                              <rect x="70" y="65" width="25" height="10" />
                              <rect x="40" y="80" width="15" height="15" />
                              <rect x="60" y="80" width="10" height="10" />
                              <rect x="80" y="80" width="15" height="15" />
                            </svg>
                            <span className="text-[6px] md:text-[7px] font-black text-center text-slate-800 mt-1 uppercase tracking-tight leading-none">Quét Ứng Tuyển</span>
                          </div>
                          <div className="hidden sm:block w-px h-16 bg-white/20" />
                          <div className="hidden sm:flex flex-col text-left">
                            <span className="text-[10px] font-black text-amber-300">THU NHẬP HẤP DẪN</span>
                            <span className="text-base md:text-lg font-bold text-white tracking-wide">8 - 18 TRIỆU</span>
                            <span className="text-[9px] text-slate-300">Tùy từng vị trí tuyển dụng</span>
                          </div>
                        </div>
                      </div>

                      {/* Benefits Footer row with glassmorphic cards */}
                      <div className="relative z-10 grid grid-cols-2 md:grid-cols-5 gap-2 mt-auto">
                        <div className="bg-black/50 border border-white/10 backdrop-blur-xs rounded-xl p-2 text-center flex flex-col justify-center items-center shadow-md">
                          <i className="fa-solid fa-helmet-safety text-amber-400 text-xs mb-1" />
                          <span className="text-[9px] font-black tracking-tight leading-tight text-white uppercase leading-none">KỸ THUẬT VIÊN & CÔNG NHÂN</span>
                          <span className="text-[7px] text-amber-200 mt-0.5 leading-none">Đắk Nông, Lâm Đồng</span>
                        </div>
                        <div className="bg-black/50 border border-white/10 backdrop-blur-xs rounded-xl p-2 text-center flex flex-col justify-center items-center shadow-md">
                          <i className="fa-solid fa-road text-amber-400 text-xs mb-1" />
                          <span className="text-[9px] font-black tracking-tight leading-tight text-white uppercase">LỘ TRÌNH PHÁT TRIỂN</span>
                        </div>
                        <div className="bg-black/50 border border-white/10 backdrop-blur-xs rounded-xl p-2 text-center flex flex-col justify-center items-center shadow-md">
                          <i className="fa-solid fa-hand-holding-heart text-amber-400 text-xs mb-1" />
                          <span className="text-[9px] font-black tracking-tight leading-tight text-white uppercase">PHÚC LỢI ĐẦY ĐỦ</span>
                          <span className="text-[7px] text-amber-200 mt-0.5 leading-none">Lương T13, BHXH đầy đủ</span>
                        </div>
                        <div className="bg-black/50 border border-white/10 backdrop-blur-xs rounded-xl p-2 text-center flex flex-col justify-center items-center shadow-md">
                          <i className="fa-solid fa-dollar-sign text-amber-400 text-xs mb-1" />
                          <span className="text-[9px] font-black tracking-tight leading-tight text-white uppercase">THU NHẬP HẤP DẪN</span>
                          <span className="text-[7px] text-amber-200 mt-0.5 leading-none">8 - 18 Triệu/Tháng</span>
                        </div>
                        <div className="bg-black/50 border border-white/10 backdrop-blur-xs rounded-xl p-2 text-center flex flex-col justify-center items-center shadow-md col-span-2 md:col-span-1">
                          <i className="fa-solid fa-hotel text-amber-400 text-xs mb-1" />
                          <span className="text-[9px] font-black tracking-tight leading-tight text-white uppercase">PHỤ CẤP 3 BỮA + KÝ TÚC XÁ</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SLIDE 1: SCC TECH RECRUITMENT */}
                  {activeSlide === 1 && (
                    <div className="relative w-full h-full p-6 md:p-10 flex flex-col justify-between select-none transition-all duration-700 animate-fadeIn bg-slate-950">
                      {/* Background Photo with 100% opacity */}
                      <Image
                        src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop"
                        alt="Tech Platform"
                        fill
                        className="absolute inset-0 object-cover z-0 opacity-100"
                        unoptimized
                      />
                      {/* Left-side gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent z-0 pointer-events-none" />

                      <div className="relative z-10 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-indigo-400/30 shadow-md shrink-0">
                          <i className="fa-solid fa-brain text-indigo-400 text-lg" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-indigo-300 tracking-widest uppercase block drop-shadow-sm">SCC SMART CAREER CONNECTOR</span>
                        </div>
                      </div>

                      <div className="relative z-10 my-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex-1 max-w-xl">
                          <h2 className="text-xl md:text-3xl font-extrabold text-white tracking-wide leading-tight drop-shadow-md">
                            SCC AI MATCHING ENGINE PLATFORM
                          </h2>
                          <div className="mt-2 inline-block bg-indigo-500 text-white text-xs font-black px-3 py-1 rounded-sm uppercase tracking-wider shadow-sm animate-pulse">
                            CƠ HỘI ĐỘT PHÁ SỰ NGHIỆP IT
                          </div>
                          <p className="mt-4 text-xs md:text-sm font-bold text-slate-100 flex items-center gap-2 drop-shadow-md">
                            TUYỂN DỤNG <span className="text-indigo-300 text-2xl md:text-3xl font-black drop-shadow-sm">50+</span> KỸ SƯ AI & FULLSTACK
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 bg-black/40 p-3 rounded-2xl border border-white/10 backdrop-blur-sm shadow-md">
                          <div className="bg-white p-2 rounded-xl flex flex-col items-center justify-center shrink-0 border border-indigo-500 shadow-sm w-20 h-20 md:w-24 md:h-24">
                            <svg className="w-14 h-14 md:w-18 md:h-18 text-indigo-950" viewBox="0 0 100 100" fill="currentColor">
                              <rect x="5" y="5" width="25" height="25" />
                              <rect x="10" y="10" width="15" height="15" fill="white" />
                              <rect x="70" y="5" width="25" height="25" />
                              <rect x="75" y="10" width="15" height="15" fill="white" />
                              <rect x="5" y="70" width="25" height="25" />
                              <rect x="10" y="75" width="15" height="15" fill="white" />
                              <rect x="40" y="10" width="10" height="15" />
                              <rect x="55" y="5" width="10" height="10" />
                              <rect x="35" y="30" width="25" height="15" />
                              <rect x="15" y="40" width="10" height="15" />
                              <rect x="75" y="35" width="15" height="20" />
                              <rect x="45" y="55" width="10" height="10" />
                              <rect x="60" y="60" width="20" height="15" />
                              <rect x="80" y="80" width="15" height="15" />
                            </svg>
                            <span className="text-[6px] md:text-[7px] font-black text-center text-slate-800 mt-1 uppercase tracking-tight leading-none">Nộp CV Ngay</span>
                          </div>
                          <div className="hidden sm:block w-px h-16 bg-white/20" />
                          <div className="hidden sm:flex flex-col text-left">
                            <span className="text-[10px] font-black text-indigo-300">MỨC LƯƠNG HẤP DẪN</span>
                            <span className="text-base md:text-lg font-bold text-white tracking-wide">$2000 - $5000</span>
                            <span className="text-[9px] text-slate-300">Thỏa thuận theo năng lực</span>
                          </div>
                        </div>
                      </div>

                      <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-2 mt-auto">
                        <div className="bg-black/50 border border-white/10 backdrop-blur-xs rounded-xl p-2 text-center flex flex-col justify-center items-center shadow-md">
                          <i className="fa-solid fa-house-laptop text-indigo-400 text-xs mb-1" />
                          <span className="text-[9px] font-black tracking-tight leading-tight text-white uppercase leading-none">LÀM VIỆC HYBRID / REMOTE</span>
                        </div>
                        <div className="bg-black/50 border border-white/10 backdrop-blur-xs rounded-xl p-2 text-center flex flex-col justify-center items-center shadow-md">
                          <i className="fa-solid fa-gift text-indigo-400 text-xs mb-1" />
                          <span className="text-[9px] font-black tracking-tight leading-tight text-white uppercase leading-none">THƯỞNG DỰ ÁN CỰC CAO</span>
                        </div>
                        <div className="bg-black/50 border border-white/10 backdrop-blur-xs rounded-xl p-2 text-center flex flex-col justify-center items-center shadow-md">
                          <i className="fa-solid fa-laptop text-indigo-400 text-xs mb-1" />
                          <span className="text-[9px] font-black tracking-tight leading-tight text-white uppercase leading-none">CẤP MACBOOK PRO M3</span>
                        </div>
                        <div className="bg-black/50 border border-white/10 backdrop-blur-xs rounded-xl p-2 text-center flex flex-col justify-center items-center shadow-md">
                          <i className="fa-solid fa-kit-medical text-indigo-400 text-xs mb-1" />
                          <span className="text-[9px] font-black tracking-tight leading-tight text-white uppercase leading-none">BẢO HIỂM CHĂM SÓC SỨC KHỎE</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SLIDE 2: CORPORATE FINANCE/BANKING */}
                  {activeSlide === 2 && (
                    <div className="relative w-full h-full p-6 md:p-10 flex flex-col justify-between select-none transition-all duration-700 animate-fadeIn bg-slate-950">
                      {/* Background Photo with 100% opacity */}
                      <Image
                        src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop"
                        alt="Banking Partner"
                        fill
                        className="absolute inset-0 object-cover z-0 opacity-100"
                        unoptimized
                      />
                      {/* Left-side gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent z-0 pointer-events-none" />

                      <div className="relative z-10 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center border border-amber-400 shadow-md shrink-0">
                          <i className="fa-solid fa-landmark text-amber-600 text-lg" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-amber-300 tracking-widest uppercase block drop-shadow-sm">NGÂN HÀNG THƯƠNG MẠI ĐỐI TÁC</span>
                        </div>
                      </div>

                      <div className="relative z-10 my-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex-1 max-w-xl">
                          <h2 className="text-xl md:text-3xl font-extrabold text-white tracking-wide leading-tight drop-shadow-md">
                            HỆ THỐNG GIAO DỊCH VIÊN & RM TOÀN QUỐC
                          </h2>
                          <div className="mt-2 inline-block bg-amber-400 text-slate-900 text-xs font-black px-3 py-1 rounded-sm uppercase tracking-wider shadow-sm animate-pulse">
                            BỨT PHÁ SỰ NGHIỆP TÀI CHÍNH
                          </div>
                          <p className="mt-4 text-xs md:text-sm font-bold text-slate-100 flex items-center gap-2 drop-shadow-md">
                            TUYỂN DỤNG <span className="text-amber-300 text-2xl md:text-3xl font-black drop-shadow-sm">150+</span> NHÂN SỰ CHUYÊN NGHIỆP
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 bg-black/40 p-3 rounded-2xl border border-white/10 backdrop-blur-sm shadow-md">
                          <div className="bg-white p-2 rounded-xl flex flex-col items-center justify-center shrink-0 border border-amber-500 shadow-sm w-20 h-20 md:w-24 md:h-24">
                            <svg className="w-14 h-14 md:w-18 md:h-18 text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                              <rect x="5" y="5" width="25" height="25" />
                              <rect x="10" y="10" width="15" height="15" fill="white" />
                              <rect x="70" y="5" width="25" height="25" />
                              <rect x="75" y="10" width="15" height="15" fill="white" />
                              <rect x="5" y="70" width="25" height="25" />
                              <rect x="10" y="75" width="15" height="15" fill="white" />
                              <rect x="40" y="5" width="15" height="15" />
                              <rect x="5" y="40" width="10" height="20" />
                              <rect x="25" y="45" width="15" height="15" />
                              <rect x="45" y="30" width="20" height="20" />
                              <rect x="70" y="40" width="20" height="10" />
                              <rect x="75" y="60" width="15" height="15" />
                              <rect x="40" y="75" width="20" height="20" />
                            </svg>
                            <span className="text-[6px] md:text-[7px] font-black text-center text-slate-800 mt-1 uppercase tracking-tight leading-none">Ứng Tuyển Nhanh</span>
                          </div>
                          <div className="hidden sm:block w-px h-16 bg-white/20" />
                          <div className="hidden sm:flex flex-col text-left">
                            <span className="text-[10px] font-black text-amber-300">THU NHẬP HẤP DẪN</span>
                            <span className="text-base md:text-lg font-bold text-white tracking-wide">12 - 25 TRIỆU</span>
                            <span className="text-[9px] text-slate-300">Thưởng doanh số cực cao</span>
                          </div>
                        </div>
                      </div>

                      <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-2 mt-auto">
                        <div className="bg-black/50 border border-white/10 backdrop-blur-xs rounded-xl p-2 text-center flex flex-col justify-center items-center shadow-md">
                          <i className="fa-solid fa-graduation-cap text-amber-400 text-xs mb-1" />
                          <span className="text-[9px] font-black tracking-tight leading-tight text-white uppercase leading-none">ĐÀO TẠO CHUẨN QUỐC TẾ</span>
                        </div>
                        <div className="bg-black/50 border border-white/10 backdrop-blur-xs rounded-xl p-2 text-center flex flex-col justify-center items-center shadow-md">
                          <i className="fa-solid fa-briefcase-medical text-amber-400 text-xs mb-1" />
                          <span className="text-[9px] font-black tracking-tight leading-tight text-white uppercase leading-none">BẢO HIỂM SỨC KHỎE AON</span>
                        </div>
                        <div className="bg-black/50 border border-white/10 backdrop-blur-xs rounded-xl p-2 text-center flex flex-col justify-center items-center shadow-md">
                          <i className="fa-solid fa-chart-line text-amber-400 text-xs mb-1" />
                          <span className="text-[9px] font-black tracking-tight leading-tight text-white uppercase leading-none">LỘ TRÌNH THĂNG TIẾN</span>
                        </div>
                        <div className="bg-black/50 border border-white/10 backdrop-blur-xs rounded-xl p-2 text-center flex flex-col justify-center items-center shadow-md">
                          <i className="fa-solid fa-plane text-amber-400 text-xs mb-1" />
                          <span className="text-[9px] font-black tracking-tight leading-tight text-white uppercase leading-none">DU LỊCH NGHỈ DƯỠNG HÀNG NĂM</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Carousel dots */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                  {[0, 1, 2].map((idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSlide(idx)}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${activeSlide === idx ? 'w-6 bg-amber-400' : 'w-2 bg-white/40 hover:bg-white/60'}`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Carousel chevrons */}
                <button
                  onClick={() => setActiveSlide((prev) => (prev - 1 + 3) % 3)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 cursor-pointer"
                  aria-label="Previous slide"
                >
                  <i className="fa-solid fa-chevron-left text-xs" />
                </button>
                <button
                  onClick={() => setActiveSlide((prev) => (prev + 1) % 3)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 cursor-pointer"
                  aria-label="Next slide"
                >
                  <i className="fa-solid fa-chevron-right text-xs" />
                </button>
              </div>
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
                    <h2 className="text-2xl font-bold">Thị trường việc làm hôm nay</h2>
                    <p className="text-sm text-primary-100">{STATIC_MARKET_STATS.asOfText}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm transition-all hover:bg-white/20">
                    <p className="text-3xl font-bold">
                      {STATIC_MARKET_STATS.newJobs24h.toLocaleString('en-US')}
                    </p>
                    <p className="text-sm font-medium text-primary-100">
                      Việc làm mới trong 24h qua
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm transition-all hover:bg-white/20">
                    <p className="text-3xl font-bold">
                      {STATIC_MARKET_STATS.activeJobs.toLocaleString('en-US')}
                    </p>
                    <p className="text-sm font-medium text-primary-100">
                      Tổng việc làm đang tuyển
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm transition-all hover:bg-white/20">
                    <p className="text-3xl font-bold">
                      {STATIC_MARKET_STATS.hiringCompanies.toLocaleString('en-US')}
                    </p>
                    <p className="text-sm font-medium text-primary-100">
                      Công ty đang tuyển
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:w-2/3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-sm font-bold tracking-wider text-white uppercase">
                      <i className="fa-solid fa-chart-line mr-2" />
                      Tăng trưởng cơ hội việc làm
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
                      Nhu cầu theo ngành
                    </h3>
                    <select className="rounded border border-white/20 bg-white/10 px-2 py-1 text-xs text-white focus:border-white/40 focus:ring-0">
                      <option className="text-slate-800">Ngành nghề</option>
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
              Được tin dùng bởi các công ty hàng đầu Việt Nam
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
              {[
                { name: 'Viettel', domain: 'viettel.com.vn' },
                { name: 'FPT Software', domain: 'fpt-software.com' },
                { name: 'VNG', domain: 'vng.com.vn' },
                { name: 'VNPay', domain: 'vnpay.vn' },
                { name: 'MoMo', domain: 'momo.vn' },
                { name: 'Techcombank', domain: 'techcombank.com.vn' },
              ].map((company) => (
                <div key={company.domain} className="flex flex-col items-center gap-2 opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0">
                  <Image
                    src={`https://www.google.com/s2/favicons?domain=${company.domain}&sz=128`}
                    alt={company.name}
                    width={40}
                    height={40}
                    className="h-10 w-10 object-contain"
                    unoptimized
                  />
                  <span className="text-xs font-semibold text-gray-500">{company.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== TOP EMPLOYERS SECTION ===== */}
        <section className="bg-gray-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold text-slate-900">Nhà tuyển dụng hàng đầu</h2>
              <p className="mt-2 text-gray-500">Các công ty hàng đầu đang tích cực tuyển dụng trên SCC</p>
            </div>
            <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
              {TOP_EMPLOYERS.map((employer) => (
                <div
                  key={employer.domain}
                  className="employer-card group cursor-pointer rounded-2xl border border-gray-100 bg-white p-6 text-center transition-all hover:border-primary-400 hover:shadow-xl"
                >
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gray-50 transition-all group-hover:bg-primary-50">
                    <Image
                      src={`https://www.google.com/s2/favicons?domain=${employer.domain}&sz=128`}
                      alt={employer.name}
                      width={40}
                      height={40}
                      className="h-10 w-10 object-contain"
                      unoptimized
                    />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">{employer.name}</h3>
                  <p className="mt-1 text-xs text-gray-400">{employer.tagline}</p>
                  <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600">
                    <i className="fa-solid fa-briefcase text-[10px]" />
                    {employer.openPositions} vị trí
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link
                className="inline-flex items-center gap-2 rounded-full border-2 border-primary-600 px-6 py-2.5 text-sm font-bold text-primary-600 transition-all hover:bg-primary-600 hover:text-white"
                href="/jobs"
              >
                Xem tất cả nhà tuyển dụng <i className="fa-solid fa-arrow-right text-xs" />
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">
                  Khám phá theo danh mục
                </h2>
                <p className="mt-2 text-gray-500">
                  Tìm con đường phù hợp cho sự nghiệp của bạn.
                </p>
              </div>
              <Link
                className="font-semibold text-primary-600 hover:underline"
                href="/jobs"
              >
                Xem tất cả danh mục{' '}
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
        <section id="best-jobs-section" className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div className="flex flex-col items-start gap-2.5">
                <div className="inline-block bg-primary-600 text-white px-5 py-2.5 text-[14px] font-black rounded-tr-2xl rounded-bl-2xl shadow-md uppercase tracking-wider">
                  Việc làm mới nhất dành cho bạn
                </div>
                <p className="text-sm flex items-center gap-2 text-slate-500 font-bold mt-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary-500 animate-pulse" />{' '}
                  Gợi ý việc làm phù hợp nhất từ AI của SCC
                </p>
              </div>
              <Link
                className="font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1.5 transition-all text-sm"
                href="/jobs"
              >
                Xem tất cả việc làm{' '}
                <i className="fa-solid fa-chevron-right text-xs" />
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
                <span className="text-sm font-medium">Lọc theo: Địa điểm</span>
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
                  className="job-grid-card group relative flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-100 bg-slate-50 p-1.5">
                      {job.companyLogoUrl ? (
                        <Image
                          src={job.companyLogoUrl}
                          alt={job.companyName}
                          width={32}
                          height={32}
                          className="h-8 w-8 object-contain"
                          unoptimized
                        />
                      ) : (
                        <i
                          className={`${normalizeIconClass(job.companyIconKey)} text-2xl text-slate-700`}
                        />
                      )}
                    </div>
                    <button
                      className="transition-standard flex h-7 w-7 items-center justify-center rounded-full border border-gray-100 text-gray-400 hover:border-red-100 hover:text-red-500"
                      type="button"
                      disabled={savingJobIds.has(job.id)}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        void toggleJobSave(job);
                      }}
                    >
                      <i
                        className={`${job.isSaved ? 'fa-solid text-red-500' : 'fa-regular'} fa-heart text-sm`}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                  <div className="flex-grow">
                    <Link href={`/jobs/${job.slug}`}>
                      <h3 className="transition-standard mb-0.5 cursor-pointer text-[15px] leading-snug font-bold text-slate-900 group-hover:text-primary-600">
                        {job.title}
                      </h3>
                    </Link>
                    <p className="mb-1.5 text-xs text-gray-500">
                      {job.companyName}
                    </p>
                    <p className="line-clamp-2 mb-3 text-xs leading-relaxed text-gray-600">
                      {job.shortDescription}
                    </p>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="rounded bg-primary-50 px-2 py-0.5 text-xs font-bold text-primary-600">
                        {job.salaryText}
                      </span>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-3">
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-600">
                      {job.locationLabel}
                    </span>
                    <Link
                      className="flex items-center gap-1 text-xs font-bold text-primary-600 transition-all hover:gap-2"
                      href={`/jobs/${job.slug}`}
                    >
                      View details{' '}
                      <i className="fa-solid fa-arrow-right text-[10px]" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            {/* Pagination */}
            <div className="mt-12 flex items-center justify-center gap-4">
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary-200 text-primary-500 transition-all hover:border-primary-500 hover:bg-primary-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300 disabled:hover:bg-transparent"
                type="button"
                disabled={jobsPage <= 1 || isLoadingMoreJobs}
                onClick={() => { void handlePrevPage(); }}
                aria-label="Previous page"
              >
                <i className="fa-solid fa-chevron-left text-sm" />
              </button>
              <span className="text-sm font-medium text-slate-600">
                {isLoadingMoreJobs ? (
                  <span className="inline-flex items-center gap-2">
                    <i className="fa-solid fa-spinner fa-spin text-primary-500" />
                  </span>
                ) : (
                  <>{jobsPage} / {totalPages} trang</>
                )}
              </span>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary-200 text-primary-500 transition-all hover:border-primary-500 hover:bg-primary-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300 disabled:hover:bg-transparent"
                type="button"
                disabled={!hasMoreJobs || isLoadingMoreJobs}
                onClick={() => { void handleNextPage(); }}
                aria-label="Next page"
              >
                <i className="fa-solid fa-chevron-right text-sm" />
              </button>
            </div>
          </div>
        </section>

        {/* ===== WHY CHOOSE SCC SECTION ===== */}
        <section className="why-choose-section relative overflow-hidden py-20">
          <div className="absolute inset-0 bg-linear-to-br from-slate-50 via-primary-50/30 to-slate-50" />
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-14 text-center">
              <span className="mb-3 inline-block rounded-full bg-primary-100 px-4 py-1 text-xs font-bold tracking-wider text-primary-700 uppercase">Vì sao SCC</span>
              <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">Vì sao chọn SCC?</h2>
              <p className="mx-auto mt-3 max-w-2xl text-gray-500">
                Chúng tôi kết hợp công nghệ AI tiên tiến với chuyên gia tuyển dụng để mang đến trải nghiệm tìm việc tốt nhất tại Việt Nam.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {WHY_CHOOSE_FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="feature-card group cursor-pointer rounded-2xl border border-gray-100 bg-white p-8 transition-all hover:border-transparent hover:shadow-2xl"
                >
                  <div
                    className={`transition-standard mb-6 flex h-14 w-14 items-center justify-center rounded-xl ${feature.color} ${feature.hoverColor} group-hover:text-white`}
                  >
                    <i className={`${feature.icon} text-2xl`} />
                  </div>
                  <h3 className="mb-3 text-lg font-bold text-slate-800">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-500">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-primary-900 py-24 text-white">
          <div className="absolute top-0 right-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-800 opacity-20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/2 translate-y-1/2 rounded-full bg-primary-700 opacity-20 blur-3xl" />
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold md:text-4xl">How SCC Works</h2>
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

        {/* ===== CAREER BLOG SECTION ===== */}
        <section className="bg-gray-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <span className="mb-2 inline-block rounded-full bg-green-100 px-4 py-1 text-xs font-bold tracking-wider text-green-700 uppercase">Blog</span>
                <h2 className="text-3xl font-bold text-slate-900">Cẩm nang nghề nghiệp</h2>
                <p className="mt-2 text-gray-500">Kiến thức và mẹo hữu ích cho sự nghiệp của bạn</p>
              </div>
              <a
                className="hidden font-semibold text-primary-600 hover:underline md:inline-flex md:items-center md:gap-1"
                href="#"
              >
                Xem tất cả bài viết <i className="fa-solid fa-arrow-right text-xs" />
              </a>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {BLOG_ARTICLES.map((article) => (
                <article
                  key={article.id}
                  className="blog-card group cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all hover:shadow-xl"
                >
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={article.imageUrl}
                      alt={article.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      unoptimized
                    />
                    <div className="absolute top-3 left-3">
                      <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-primary-600 shadow-sm backdrop-blur-sm">
                        {article.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="mb-2 text-lg font-bold leading-snug text-slate-800 transition-colors group-hover:text-primary-600">
                      {article.title}
                    </h3>
                    <p className="mb-4 line-clamp-2 text-sm text-gray-500">{article.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <i className="fa-regular fa-clock" /> {article.readTime}
                      </span>
                      <span className="flex items-center gap-1 text-sm font-bold text-primary-600 transition-all group-hover:gap-2">
                        Đọc thêm <i className="fa-solid fa-arrow-right text-xs" />
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CTA BANNER SECTION ===== */}
        <section className="cta-banner-gradient relative overflow-hidden py-20">
          <div className="absolute top-0 right-0 h-80 w-80 translate-x-1/3 -translate-y-1/3 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-60 w-60 -translate-x-1/3 translate-y-1/3 rounded-full bg-white/10 blur-3xl" />
          <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <i className="fa-solid fa-file-lines text-3xl text-white" />
            </div>
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
              Tạo CV chuyên nghiệp ngay hôm nay
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-white/80">
              Sử dụng công cụ tạo CV thông minh của SCC để tạo CV ấn tượng và tăng cơ hội được tuyển dụng lên 3 lần.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-primary-700 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                href="/dashboard/candidate/cvs"
              >
                <i className="fa-solid fa-wand-magic-sparkles" /> Tạo CV miễn phí
              </Link>
              <Link
                className="inline-flex items-center gap-2 rounded-xl border-2 border-white/40 px-8 py-4 text-base font-bold text-white transition-all hover:border-white hover:bg-white/10"
                href="/jobs"
              >
                Khám phá việc làm <i className="fa-solid fa-arrow-right" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 bg-white pt-20 pb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
            <div className="col-span-1 lg:col-span-1">
              <div className="mb-6 flex items-center gap-2">
                <SCCBrandLogo iconClassName="h-8 w-8 rounded-md" textClassName="text-xl" />
              </div>
              <p className="mb-6 text-gray-500">
                Đăng ký nhận bản tin để cập nhật tin tuyển dụng mới nhất trực tiếp vào hộp mail của bạn.
              </p>
              <div className="flex">
                <input
                  className="w-full rounded-l-lg border-gray-200 bg-gray-50 px-4 focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Địa chỉ email"
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
              <h4 className="mb-6 font-bold text-slate-900">Liên kết nhanh</h4>
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
              <h4 className="mb-6 font-bold text-slate-900">Hỗ trợ</h4>
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
              <h4 className="mb-6 font-bold text-slate-900">Kết nối với chúng tôi</h4>
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
            <p>© 2023 SCC Smart Career Connector. Bảo lưu mọi quyền.</p>
            <div className="flex space-x-6">
              <a className="hover:text-slate-600" href="#">
                Sơ đồ trang
              </a>
              <a className="hover:text-slate-600" href="#">
                Tiếng Việt
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
