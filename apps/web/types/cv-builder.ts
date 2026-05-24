// Shared types for the CV Builder feature

/**
 * Design tokens controlling the visual styling of the CV canvas and PDF export.
 *
 * - `fontFamily`: CSS font-family string (e.g. `"Inter, sans-serif"`).
 * - `fontSize`: base font size in pixels. Bounded to `[10, 16]` (step 1).
 * - `lineHeight`: unitless line height multiplier. Bounded to `[1.2, 2.0]` (step 0.1).
 * - `primaryColor`: 6-digit hex color string (e.g. `"#0f172a"`) used for accents.
 * - `pageMargin`: page padding in pixels. Bounded to `[20, 60]` (step 5).
 *
 * Bounds are mirrored on the backend by `CvDesignTokensDto` validators and on the
 * frontend by the slider ranges in `cv-builder-constants.ts`.
 */
export interface CvDesignTokens {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  primaryColor: string;
  pageMargin: number;
}

export interface CvLocation {
  city?: string;
  country?: string;
}

export interface CvProfile {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  summary?: string;
  location?: CvLocation;
  photo?: string;
}

export interface CvExperience {
  role: string;
  company: string;
  startDate: string;
  endDate?: string;
  description?: string;
  tech?: string[];
}

export interface CvEducation {
  school: string;
  degree: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
}

export interface CvProject {
  name: string;
  description?: string;
  tech?: string[];
}

export interface CvBuilderData {
  templateId: string;
  /**
   * Optional design tokens. Absent on legacy CVs created before CV Builder 2.0;
   * consumers should fall back to `DEFAULT_DESIGN_TOKENS` when undefined.
   */
  designTokens?: CvDesignTokens;
  profile: CvProfile;
  experience: CvExperience[];
  education: CvEducation[];
  skills: string[];
  projects: CvProject[];
  certifications: string[];
  languages: string[];
}

/**
 * Default design tokens applied to new CVs and used as a fallback when a
 * persisted CV does not include a `designTokens` field.
 */
export const DEFAULT_DESIGN_TOKENS: CvDesignTokens = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 12,
  lineHeight: 1.5,
  primaryColor: '#0f172a',
  pageMargin: 40,
};

export const EMPTY_CV_DATA: CvBuilderData = {
  templateId: 'simple',
  profile: {
    name: '',
    email: '',
    phone: '',
    website: '',
    summary: '',
    location: { city: '', country: '' },
  },
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
};

export type TemplateId = 'simple' | 'professional' | 'modern';

export const TEMPLATES: Array<{
  id: TemplateId;
  name: string;
  description: string;
  color: string;
}> = [
  {
    id: 'simple',
    name: 'Simple',
    description: 'Single column, clean lines, ATS-friendly. Perfect for traditional industries.',
    color: '#374151',
  },
  {
    id: 'professional',
    name: 'Professional',
    description: '2-column layout with sidebar. Accent color header for a polished look.',
    color: '#1e40af',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Full-width sections with colorful headers. Modern typography.',
    color: '#7c3aed',
  },
];
