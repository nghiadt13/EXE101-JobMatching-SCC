export const NORMALIZED_SCHEMA_VERSION = 'candidate_job_profile_v1';
export const JOB_LOCATION_NORMALIZATION_KEY = '__normalization';

export type ParseStatus = 'parsed_ok' | 'needs_review' | 'pending_apply';

export type NormalizationProvider = 'gemini' | 'kimi';

export interface NormalizedExperience {
  role: string;
  company: string;
  startDate: string | null;
  endDate: string | null;
  tech: string[];
}

export interface NormalizedEducation {
  school: string;
  degree: string;
  field: string;
  startDate: string | null;
  endDate: string | null;
  gpa: string | null;
}

export interface NormalizedProject {
  name: string;
  description: string;
  tech: string[];
}

export interface NormalizedLocation {
  city: string;
  country: string;
}

export interface JobMetaBlock {
  requirements: string[];
  benefits: string[];
  employmentType: string;
}

export interface NormalizedProfile {
  schemaVersion: typeof NORMALIZED_SCHEMA_VERSION;
  language: 'vi' | 'en' | 'mixed';
  title: string;
  summary: string;
  skills: string[];
  experience: NormalizedExperience[];
  education: NormalizedEducation[];
  certifications: string[];
  projects: NormalizedProject[];
  languages: string[];
  location: NormalizedLocation;
  rawQuality: {
    score: number;
    needsManualReview: boolean;
    reason: string;
  };
  jobMeta?: JobMetaBlock;
}

export interface NormalizationTelemetry {
  provider: NormalizationProvider;
  model: string;
  latencyMs: number;
}

export interface NormalizationResult {
  schemaVersion: typeof NORMALIZED_SCHEMA_VERSION;
  status: ParseStatus;
  profile: NormalizedProfile;
  telemetry: NormalizationTelemetry;
}
