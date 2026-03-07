import { JobStatus } from '@prisma/client';
import {
  NormalizationTelemetry,
  NormalizedProfile,
  ParseStatus,
} from '../normalization/normalization.types';
import { RequirementsSchemaV1 } from '../matching/types/schema-matching.types';

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
  requirementsSchema: RequirementsSchemaV1 | null;
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
}
