import { CvParsedData } from './cv-parser.types';

export interface CvView {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  parsedData: CvParsedData;
  skills: string[];
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
