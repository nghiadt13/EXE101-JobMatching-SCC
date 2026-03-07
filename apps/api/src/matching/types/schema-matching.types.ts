export const REQUIREMENTS_SCHEMA_VERSION = 'requirements_schema_v1';
export const CANDIDATE_PROFILE_VERSION = 'candidate_profile_v1';
export const SCHEMA_MATCHING_SNAPSHOT_VERSION = 'schema_v1';

export type RequirementCategory =
  | 'skill'
  | 'experience'
  | 'education'
  | 'language'
  | 'location'
  | 'certification'
  | 'general';

export type RequirementImportance = 'must_have' | 'nice_to_have';

export type RequirementStatus = 'met' | 'partial' | 'missing' | 'not_applicable';

export interface RequirementItem {
  id: string;
  label: string;
  category: RequirementCategory;
  importance: RequirementImportance;
  keywords: string[];
  minimumMonths: number | null;
}

export interface LocationPreference {
  city: string;
  country: string;
  remote: boolean;
}

export interface RequirementsSchemaV1 {
  version: typeof REQUIREMENTS_SCHEMA_VERSION;
  roleTitle: string;
  summary: string;
  mustHaves: RequirementItem[];
  niceToHaves: RequirementItem[];
  locationPreference: LocationPreference | null;
  warnings: string[];
}

export interface CandidateExperienceEntry {
  role: string;
  company: string;
  startDate: string | null;
  endDate: string | null;
  tech: string[];
}

export interface CandidateEducationEntry {
  school: string;
  degree: string;
  field: string;
  startDate: string | null;
  endDate: string | null;
}

export interface CandidateProjectEntry {
  name: string;
  description: string;
  tech: string[];
}

export interface CandidateProfileV1 {
  version: typeof CANDIDATE_PROFILE_VERSION;
  headline: string;
  summary: string;
  skills: string[];
  experience: CandidateExperienceEntry[];
  education: CandidateEducationEntry[];
  certifications: string[];
  languages: string[];
  projects: CandidateProjectEntry[];
  location: {
    city: string;
    country: string;
  } | null;
  warnings: string[];
}

export interface SchemaRequirementEvaluation {
  id: string;
  label: string;
  category: RequirementCategory;
  importance: RequirementImportance;
  status: RequirementStatus;
  evidence: string[];
}

export interface SchemaMatchingSnapshot {
  version: typeof SCHEMA_MATCHING_SNAPSHOT_VERSION;
  scoreBreakdown: {
    mustHave: number;
    niceToHave: number;
    experience: number;
    education: number;
    language: number;
    location: number;
    final: number;
  };
  requirements: SchemaRequirementEvaluation[];
  strengths: string[];
  gaps: string[];
  warnings: string[];
}