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
  };
  candidate: {
    id: string;
    name: string;
    email: string;
  };
  cv: {
    id: string;
    fileName: string;
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
