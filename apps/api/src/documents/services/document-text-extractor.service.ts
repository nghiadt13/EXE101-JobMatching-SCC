import {
  Injectable,
  UnprocessableEntityException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { extname } from 'node:path';
import {
  DOCUMENT_ALLOWED_EXTENSIONS,
  DOCUMENT_ALLOWED_MIME_TYPES,
} from '../document-upload.constants';
import { buildErrorPayload } from '../../common/errors/api-error-envelope';
import { ERROR_CODES } from '../../common/errors/error-codes';

@Injectable()
export class DocumentTextExtractorService {
  async extract(
    file: Express.Multer.File,
    documentLabel = 'document',
  ): Promise<string> {
    this.assertSupported(file);

    let text = '';
    try {
      if (file.mimetype === 'application/pdf') {
        const parser = new PDFParse({ data: new Uint8Array(file.buffer) });
        try {
          const parsed = await parser.getText();
          text = parsed.text;
        } finally {
          await parser.destroy();
        }
      } else {
        const parsed = await mammoth.extractRawText({ buffer: file.buffer });
        text = parsed.value;
      }
    } catch {
      throw new UnprocessableEntityException(
        buildErrorPayload(
          ERROR_CODES.documentParseFailed,
          `Could not parse ${documentLabel} file. Please upload a valid PDF or DOCX file`,
        ),
      );
    }

    const normalized = text.replace(/\s+/g, ' ').trim();
    if (!normalized) {
      throw new UnprocessableEntityException(
        buildErrorPayload(
          ERROR_CODES.documentTextMissing,
          `Could not extract readable text from ${documentLabel} file`,
        ),
      );
    }

    return normalized;
  }

  assertSupported(
    file: Pick<Express.Multer.File, 'mimetype' | 'originalname'>,
  ) {
    const extension = extname(file.originalname).toLowerCase();
    const allowedMime = DOCUMENT_ALLOWED_MIME_TYPES.has(file.mimetype);
    const allowedExtension = DOCUMENT_ALLOWED_EXTENSIONS.has(extension);

    if (!allowedMime || !allowedExtension) {
      throw new UnsupportedMediaTypeException(
        buildErrorPayload(
          ERROR_CODES.documentUnsupportedType,
          'Only PDF and DOCX files are supported',
        ),
      );
    }
  }
}
