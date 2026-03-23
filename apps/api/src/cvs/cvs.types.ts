import { CvParsedData } from './cv-parser.types';
import {
  NormalizationTelemetry,
  NormalizedProfile,
  ParseStatus,
} from '../normalization/normalization.types';
import { CandidateProfileV1 } from '../matching/types/schema-matching.types';

export interface CvView {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  parsedData: CvParsedData;
  skills: string[];
  parseStatus: ParseStatus;
  normalizedProfile: NormalizedProfile | null;
  candidateProfile: CandidateProfileV1 | null;
  candidateProfileVersion: string | null;
  parseTelemetry: NormalizationTelemetry | null;
  source: string;
  templateId: string;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CvsListResponse {
  items: CvView[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}
