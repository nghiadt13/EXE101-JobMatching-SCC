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
        `Could not parse ${documentLabel} file. Please upload a valid PDF or DOCX file`,
      );
    }

    const normalized = text.replace(/\s+/g, ' ').trim();
    if (!normalized) {
      throw new UnprocessableEntityException(
        `Could not extract readable text from ${documentLabel} file`,
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
        'Only PDF and DOCX files are supported',
      );
    }
  }
}
