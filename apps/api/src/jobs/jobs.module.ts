import { Module } from '@nestjs/common';
import { DocumentStorageService } from '../documents/services/document-storage.service';
import { DocumentTextExtractorService } from '../documents/services/document-text-extractor.service';
import { MatchingModule } from '../matching/matching.module';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JobSlugService } from './services/job-slug.service';

@Module({
  imports: [MatchingModule],
  controllers: [JobsController],
  providers: [
    JobsService,
    JobSlugService,
    DocumentStorageService,
    DocumentTextExtractorService,
  ],
})
export class JobsModule {}
