export type CompanyJobView = {
  id: string;
  slug: string;
  title: string;
  location: string;
  salary: string;
  postedAt: string;
  tags: string[];
};

export type CompanyView = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  website: string | null;
  taxCode: string | null;
  size: string | null;
  industry: string | null;
  companyType: string;
  priorityRank: number;
  isTrusted: boolean;
  jobsCount: number;
  location: string | null;
  shortDescription: string | null;
  description: string[];
  highlights: string[];
  recentJobs: CompanyJobView[];
};

export type CompaniesListResponse = {
  items: CompanyView[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
};

