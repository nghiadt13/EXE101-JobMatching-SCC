import { CvParsedData } from './cv-parser.types';
import {
  NormalizationTelemetry,
  NormalizedProfile,
  ParseStatus,
} from '../normalization/normalization.types';

export interface CvView {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  parsedData: CvParsedData;
  skills: string[];
  parseStatus: ParseStatus;
  normalizedProfile: NormalizedProfile | null;
  parseTelemetry: NormalizationTelemetry | null;
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
