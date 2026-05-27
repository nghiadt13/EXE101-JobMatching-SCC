import { JobStatus } from '@prisma/client';
import {
  NormalizationTelemetry,
  NormalizedProfile,
  ParseStatus,
} from '../normalization/normalization.types';
import {
  RequirementsSchemaV1,
  RequirementsSchemaV2,
} from '../matching/types/schema-matching.types';

export interface JobView {
  id: string;
  recruiterId: string;
  companyName: string | null;
  companyLogoUrl: string | null;
  companyIconKey: string | null;
  title: string;
  slug: string;
  description: string;
  skills: string[];
  inputMode: 'manual' | 'file_upload';
  location: Record<string, unknown> | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryNegotiable?: boolean;
  employmentType: string;
  parseStatus: ParseStatus;
  normalizedProfile: NormalizedProfile | null;
  requirementsSchema: RequirementsSchemaV1 | RequirementsSchemaV2 | null;
  requirementsSchemaVersion: string | null;
  parseTelemetry: NormalizationTelemetry | null;
  status: JobStatus;
  publishedAt: Date | null;
  closedAt: Date | null;
  applicationDeadline?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  workingDayStatus?: string | null;
  experienceLevel?: string | null;
  minExperienceMonths?: number | null;
  companyIndustryKey?: string | null;
  jobFieldKey?: string | null;
  jobLevel?: string | null;
  salesModel?: string | null;
  companyType?: string | null;
  categorySlugs?: string[];
  customerTypes?: string[];
}

export interface JobsListResponse {
  items: JobView[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  meta?: {
    sort: 'newest' | 'salary_asc' | 'salary_desc' | 'deadline_soon' | 'relevance';
    appliedFilters: {
      q?: string;
      employmentTypes?: string[];
      remote?: 'any' | 'true' | 'false';
      salaryMinGte?: number;
      salaryMaxLte?: number;
      postedWithinDays?: 1 | 3 | 7 | 14 | 30;
      categorySlugs?: string[];
      experienceLevels?: string[];
      companyIndustryKeys?: string[];
      jobFieldKeys?: string[];
      companyTypes?: string[];
      salaryBands?: string[];
      jobLevels?: string[];
      salesModels?: string[];
      customerTypes?: string[];
      workingDayStatus?: string;
      searchScope?: string;
      location?: string;
    };
  };
  facets?: {
    categories: Array<{ value: string; label: string; count: number }>;
    workingDayStatus: Array<{ value: string; count: number }>;
    experienceLevels: Array<{ value: string; count: number }>;
    companyIndustryKeys: Array<{ value: string; count: number }>;
    jobFieldKeys: Array<{ value: string; count: number }>;
    companyTypes: Array<{ value: string; count: number }>;
    salaryBands: Array<{ value: string; count: number }>;
    jobLevels: Array<{ value: string; count: number }>;
    employmentTypes: Array<{ value: string; count: number }>;
    salesModels: Array<{ value: string; count: number }>;
    customerTypes: Array<{ value: string; count: number }>;
    cities: Array<{ value: string; count: number }>;
  };
}

export interface SaveJobResponse {
  jobId: string;
  isSaved: boolean;
}
