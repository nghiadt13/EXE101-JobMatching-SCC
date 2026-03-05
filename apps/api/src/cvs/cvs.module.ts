import { Module } from '@nestjs/common';
import { CvsController } from './cvs.controller';
import { CvsService } from './cvs.service';
import { CvStorageService } from './services/cv-storage.service';
import { CvTextExtractorService } from './services/cv-text-extractor.service';
import { CvAiParserService } from './services/cv-ai-parser.service';
import { CvParsingNormalizerService } from './services/cv-parsing-normalizer.service';

@Module({
  controllers: [CvsController],
  providers: [
    CvsService,
    CvStorageService,
    CvTextExtractorService,
    CvAiParserService,
    CvParsingNormalizerService,
  ],
})
export class CvsModule {}
