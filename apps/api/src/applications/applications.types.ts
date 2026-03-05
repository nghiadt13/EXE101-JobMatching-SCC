import { ApplicationStatus } from '@prisma/client';

export type ApplicationView = {
  id: string;
  jobId: string;
  candidateId: string;
  cvId: string;
  matchScore: number;
  tfidfScore: number | null;
  skillsScore: number | null;
  status: ApplicationStatus;
  notes: string | null;
  appliedAt: Date;
  updatedAt: Date;
  job: {
    id: string;
    title: string;
    slug: string;
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
