import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface SemanticSearchResult {
  id: string;
  score: number;
}

@Injectable()
export class SemanticSearchService {
  private readonly logger = new Logger(SemanticSearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Finds the Top N CVs that best match a given Job using Vector Cosine Distance.
   */
  async findTopCvsForJob(jobId: string, limit: number = 50): Promise<SemanticSearchResult[]> {
    try {
      const job = await this.prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        throw new Error(`Job \${jobId} not found`);
      }

      // First check if the Job has an embedding
      const jobVectorResult = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT embedding::text FROM "Job" WHERE id = $1`,
        job.id
      );

      const embeddingStr = jobVectorResult[0]?.embedding;
      if (!embeddingStr) {
        this.logger.warn(`Job \${jobId} has no embedding. Returning empty results.`);
        return [];
      }

      // Find top CVs using pgvector <=> operator
      const results = await this.prisma.$queryRawUnsafe<any[]>(
        `
        SELECT id, 1 - (embedding <=> $1::vector) AS score
        FROM "CV"
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> $1::vector
        LIMIT $2
        `,
        embeddingStr,
        limit
      );

      return results.map(row => ({
        id: row.id,
        score: row.score,
      }));
    } catch (error) {
      this.logger.error(`Error in findTopCvsForJob:`, error);
      return [];
    }
  }

  /**
   * Finds the Top N Jobs that best match a given CV using Vector Cosine Distance.
   */
  async findTopJobsForCv(cvId: string, limit: number = 50): Promise<SemanticSearchResult[]> {
    try {
      const cv = await this.prisma.cV.findUnique({
        where: { id: cvId },
      });

      if (!cv) {
        throw new Error(`CV \${cvId} not found`);
      }

      const cvVectorResult = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT embedding::text FROM "CV" WHERE id = $1`,
        cv.id
      );

      const embeddingStr = cvVectorResult[0]?.embedding;
      if (!embeddingStr) {
        this.logger.warn(`CV \${cvId} has no embedding. Returning empty results.`);
        return [];
      }

      // Find top Jobs using pgvector <=> operator
      // Can add further conditions like status = 'PUBLISHED' here
      const results = await this.prisma.$queryRawUnsafe<any[]>(
        `
        SELECT id, 1 - (embedding <=> $1::vector) AS score
        FROM "Job"
        WHERE embedding IS NOT NULL
          AND status = 'PUBLISHED'
        ORDER BY embedding <=> $1::vector
        LIMIT $2
        `,
        embeddingStr,
        limit
      );

      return results.map(row => ({
        id: row.id,
        score: row.score,
      }));
    } catch (error) {
      this.logger.error(`Error in findTopJobsForCv:`, error);
      return [];
    }
  }
}
