import { Injectable } from '@nestjs/common';
import { DocumentTextExtractorService } from '../../documents/services/document-text-extractor.service';

@Injectable()
export class CvTextExtractorService {
  constructor(
    private readonly documentTextExtractorService: DocumentTextExtractorService,
  ) {}

  async extract(file: Express.Multer.File): Promise<string> {
    return this.documentTextExtractorService.extract(file, 'CV');
  }

  assertSupported(
    file: Pick<Express.Multer.File, 'mimetype' | 'originalname'>,
  ) {
    this.documentTextExtractorService.assertSupported(file);
  }
}
