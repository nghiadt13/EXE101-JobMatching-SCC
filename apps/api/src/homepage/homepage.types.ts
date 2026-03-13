export interface HomepageCurrentUser {
  id: string;
  name: string;
  avatarUrl: string | null;
  planName: string;
  unreadNotificationCount: number;
}

export interface HomepageHeroSection {
  headline: string;
  subheadline: string;
  backgroundImageUrl: string;
  popularKeywords: string[];
}

export interface HomepageMarketStats {
  asOfDate: string;
  newJobs24h: number;
  activeJobs: number;
  hiringCompanies: number;
}

export interface HomepageTrendPoint {
  date: string;
  value: number;
}

export interface HomepageIndustryDemandPoint {
  industryKey: string;
  label: string;
  value: number;
  order: number;
}

export interface HomepageTrustedCompany {
  companyId: string;
  name: string;
  logoUrl: string | null;
  brandIconKey: string | null;
}

export interface HomepageCategory {
  id: string;
  slug: string;
  name: string;
  iconKey: string;
  openJobsCount: number;
}

export interface HomepageLocationFilter {
  slug: string;
  label: string;
  jobCount: number;
}

export interface HomepageFeaturedJob {
  id: string;
  slug: string;
  title: string;
  companyName: string;
  companyLogoUrl: string | null;
  companyIconKey: string | null;
  shortDescription: string;
  salaryText: string;
  locationLabel: string;
  isSaved: boolean;
}

export interface HomepageFooterLink {
  label: string;
  href: string;
}

export interface HomepageSocialLink {
  platform: string;
  href: string;
}

export interface HomepageFooter {
  quickLinks: HomepageFooterLink[];
  supportLinks: HomepageFooterLink[];
  socialLinks: HomepageSocialLink[];
  copyrightText: string;
}

export interface HomepageResponse {
  currentUser: HomepageCurrentUser | null;
  hero: HomepageHeroSection;
  marketStats: HomepageMarketStats;
  jobGrowthSeries: HomepageTrendPoint[];
  demandByIndustry: HomepageIndustryDemandPoint[];
  trustedCompanies: HomepageTrustedCompany[];
  categories: HomepageCategory[];
  locationFilters: HomepageLocationFilter[];
  featuredJobs: HomepageFeaturedJob[];
  footer: HomepageFooter;
  generatedAt: string;
}

export interface SaveJobResponse {
  jobId: string;
  isSaved: boolean;
}
