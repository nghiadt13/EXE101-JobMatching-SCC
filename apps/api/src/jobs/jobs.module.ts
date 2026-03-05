import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JobSlugService } from './services/job-slug.service';

@Module({
  controllers: [JobsController],
  providers: [JobsService, JobSlugService],
})
export class JobsModule {}
