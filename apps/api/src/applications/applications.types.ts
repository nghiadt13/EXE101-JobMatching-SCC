import { ApplicationStatus } from '@prisma/client';
import { SchemaMatchingSnapshot } from '../matching/types/schema-matching.types';

export type ApplicationView = {
  id: string;
  jobId: string;
  candidateId: string;
  cvId: string;
  matchScore: number;
  matchingSnapshot: SchemaMatchingSnapshot | null;
  status: ApplicationStatus;
  notes: string | null;
  appliedAt: Date;
  updatedAt: Date;
  job: {
    id: string;
    title: string;
    slug: string;
    companyName?: string | null;
    companyLogoUrl?: string | null;
    companyIconKey?: string | null;
  };
  candidate: {
    id: string;
    name: string;
    email: string;
  };
  cv: {
    id: string;
    fileName: string;
    candidateProfile?: Record<string, unknown> | null;
    parsedData?: Record<string, unknown> | null;
  };
};

export type ApplicationsListResponse = {
  items: ApplicationView[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
};
