export interface CvParsedData {
  skills: string[];
  experience: Array<Record<string, unknown>>;
  education: Array<Record<string, unknown>>;
  contact: Record<string, unknown>;
  summary?: string;
}

export interface CvNormalizedResult {
  parsedData: CvParsedData;
  skills: string[];
}
