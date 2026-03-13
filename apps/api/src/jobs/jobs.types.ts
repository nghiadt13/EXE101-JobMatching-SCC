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
  title: string;
  slug: string;
  description: string;
  skills: string[];
  inputMode: 'manual' | 'file_upload';
  location: Record<string, unknown> | null;
  salaryMin: number | null;
  salaryMax: number | null;
  employmentType: string;
  parseStatus: ParseStatus;
  normalizedProfile: NormalizedProfile | null;
  requirementsSchema: RequirementsSchemaV1 | RequirementsSchemaV2 | null;
  requirementsSchemaVersion: string | null;
  parseTelemetry: NormalizationTelemetry | null;
  status: JobStatus;
  publishedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
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
    sort: 'newest' | 'salary_asc' | 'salary_desc';
    appliedFilters: {
      q?: string;
      employmentTypes?: string[];
      remote?: 'any' | 'true' | 'false';
      salaryMinGte?: number;
      salaryMaxLte?: number;
      postedWithinDays?: 1 | 3 | 7 | 14 | 30;
    };
  };
  facets?: {
    employmentTypes: Array<{ value: string; count: number }>;
    remote: Array<{ value: 'true' | 'false'; count: number }>;
    cities: Array<{ value: string; count: number }>;
  };
}

export interface SaveJobResponse {
  jobId: string;
  isSaved: boolean;
}
