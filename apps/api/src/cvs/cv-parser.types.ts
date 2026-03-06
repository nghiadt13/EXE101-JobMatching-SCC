import {
  NormalizationResult,
  NormalizedProfile,
  ParseStatus,
} from '../normalization/normalization.types';

export interface CvParsedData {
  skills: string[];
  experience: Array<Record<string, unknown>>;
  education: Array<Record<string, unknown>>;
  contact: Record<string, unknown>;
  summary?: string;
  schemaVersion?: string;
  parseStatus?: ParseStatus;
  parseTelemetry?: NormalizationResult['telemetry'];
  normalizedProfile?: NormalizedProfile;
}

export interface CvNormalizedResult {
  parsedData: CvParsedData;
  skills: string[];
}
