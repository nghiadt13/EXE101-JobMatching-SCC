import { JobStatus } from '@prisma/client';
import {
  NormalizationTelemetry,
  NormalizedProfile,
  ParseStatus,
} from '../normalization/normalization.types';

export interface JobView {
  id: string;
  recruiterId: string;
  title: string;
  slug: string;
  description: string;
  skills: string[];
  location: Record<string, unknown> | null;
  salaryMin: number | null;
  salaryMax: number | null;
  employmentType: string;
  parseStatus: ParseStatus;
  normalizedProfile: NormalizedProfile | null;
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
