import {
  Injectable,
  UnprocessableEntityException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { extname } from 'node:path';
import { CV_ALLOWED_EXTENSIONS, CV_ALLOWED_MIME_TYPES } from '../cvs.constants';

@Injectable()
export class CvTextExtractorService {
  async extract(file: Express.Multer.File): Promise<string> {
    this.assertSupported(file);

    let text = '';
    try {
      if (file.mimetype === 'application/pdf') {
        const parsePdf = pdfParse as unknown as (
          buffer: Buffer,
        ) => Promise<{ text?: string }>;
        const parsed = await parsePdf(file.buffer);
        text = typeof parsed.text === 'string' ? parsed.text : '';
      } else {
        const parsed = await mammoth.extractRawText({ buffer: file.buffer });
        text = parsed.value;
      }
    } catch {
      throw new UnprocessableEntityException(
        'Could not parse CV file. Please upload a valid PDF or DOCX file',
      );
    }

    const normalized = text.replace(/\s+/g, ' ').trim();
    if (!normalized) {
      throw new UnprocessableEntityException(
        'Could not extract readable text from CV file',
      );
    }

    return normalized;
  }

  assertSupported(
    file: Pick<Express.Multer.File, 'mimetype' | 'originalname'>,
  ) {
    const extension = extname(file.originalname).toLowerCase();
    const allowedMime = CV_ALLOWED_MIME_TYPES.has(file.mimetype);
    const allowedExtension = CV_ALLOWED_EXTENSIONS.has(extension);

    if (!allowedMime || !allowedExtension) {
      throw new UnsupportedMediaTypeException(
        'Only PDF and DOCX files are supported',
      );
    }
  }
}
