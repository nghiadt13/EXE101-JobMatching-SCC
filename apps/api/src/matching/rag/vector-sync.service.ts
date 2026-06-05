import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GeminiClientService } from '../../normalization/gemini-client.service';

@Injectable()
export class VectorSyncService {
  private readonly logger = new Logger(VectorSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiClientService,
  ) {}

  /**
   * Syncs the vector embedding for a Job asynchronously.
   * This is meant to be called in a fire-and-forget manner.
   */
  async syncJob(jobId: string): Promise<void> {
    try {
      const job = await this.prisma.job.findUnique({
        where: { id: jobId },
        include: { category: true },
      });

      if (!job) {
        this.logger.warn('Job ' + jobId + ' not found for vector sync.');
        return;
      }

      // Prepare text to embed
      const skillsArray = Array.isArray(job.skills) ? job.skills : [];
      const textToEmbed = [
        job.category ? 'Industry/Category: ' + job.category.name : '',
        'Title: ' + job.title,
        'Description: ' +
          (job.shortDescription || job.description).slice(0, 1000),
        'Skills: ' + (skillsArray as string[]).join(', '),
      ]
        .filter(Boolean)
        .join('. ');

      const embedding = await this.gemini.generateEmbedding(textToEmbed);
      const vectorString = '[' + embedding.join(',') + ']';

      await this.prisma.$executeRawUnsafe(
        'UPDATE "Job" SET embedding = $1::vector WHERE id = $2',
        vectorString,
        job.id,
      );

      this.logger.log('Successfully synced vector for Job ' + jobId);
    } catch (error) {
      this.logger.error('Failed to sync vector for Job ' + jobId, error);
    }
  }

  /**
   * Syncs the vector embedding for a CV asynchronously.
   * This is meant to be called in a fire-and-forget manner.
   */
  async syncCv(cvId: string): Promise<void> {
    try {
      const cv = await this.prisma.cV.findUnique({
        where: { id: cvId },
      });

      if (!cv) {
        this.logger.warn('CV ' + cvId + ' not found for vector sync.');
        return;
      }

      const parsed =
        typeof cv.parsedData === 'object' && cv.parsedData !== null
          ? cv.parsedData
          : {};
      const title = (parsed as any).title || (parsed as any).headline || '';
      const summary = (parsed as any).summary || '';

      const skillsArray = Array.isArray(cv.skills) ? cv.skills : [];
      const textToEmbed = [
        title ? 'Role: ' + title : '',
        summary ? 'Summary: ' + summary.slice(0, 1000) : '',
        'Skills: ' + (skillsArray as string[]).join(', '),
      ]
        .filter(Boolean)
        .join('. ');

      const embedding = await this.gemini.generateEmbedding(textToEmbed);
      const vectorString = '[' + embedding.join(',') + ']';

      await this.prisma.$executeRawUnsafe(
        'UPDATE "CV" SET embedding = $1::vector WHERE id = $2',
        vectorString,
        cv.id,
      );

      this.logger.log('Successfully synced vector for CV ' + cvId);
    } catch (error) {
      this.logger.error('Failed to sync vector for CV ' + cvId, error);
    }
  }
}
