import { Module } from '@nestjs/common';
import { DocumentStorageService } from '../documents/services/document-storage.service';
import { DocumentTextExtractorService } from '../documents/services/document-text-extractor.service';
import { MatchingModule } from '../matching/matching.module';
import { CvsController } from './cvs.controller';
import { CvsService } from './cvs.service';
import { CvStorageService } from './services/cv-storage.service';
import { CvTextExtractorService } from './services/cv-text-extractor.service';
import { CvAiParserService } from './services/cv-ai-parser.service';
import { CvParsingNormalizerService } from './services/cv-parsing-normalizer.service';

@Module({
  imports: [MatchingModule],
  controllers: [CvsController],
  providers: [
    CvsService,
    DocumentStorageService,
    DocumentTextExtractorService,
    CvStorageService,
    CvTextExtractorService,
    CvAiParserService,
    CvParsingNormalizerService,
  ],
})
export class CvsModule {}
