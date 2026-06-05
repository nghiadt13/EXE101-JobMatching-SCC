import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  JobStatus,
  Prisma,
  RecommendationScanStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AppLogger } from '../../common/logging/app-logger.service';
import { SemanticSearchService } from '../rag/semantic-search.service';
import { VectorSyncService } from '../rag/vector-sync.service';
import {
  resolveMatchTier,
  RecommendationScanView,
  RecommendationResultView,
  RecommendationScanListItem,
} from '../recommendation.types';
import type { JwtPayload } from '../../auth/auth.types';

const MAX_RESULTS = 10;

@Injectable()
export class RecommendationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
    private readonly semanticSearch: SemanticSearchService,
    private readonly vectorSync: VectorSyncService,
  ) {}

  async startScan(
    cvId: string,
    actor: JwtPayload,
  ): Promise<{ scanId: string }> {
    if (actor.role !== UserRole.CANDIDATE) {
      throw new ForbiddenException('Only candidates can use this feature');
    }

    // Premium check removed – Smart Job Match is now available for all plans

    const candidate = await this.getCandidateOrThrow(actor.sub);

    const cv = await this.prisma.cV.findFirst({
      where: { id: cvId, candidateId: candidate.id, deletedAt: null },
      select: { id: true },
    });
    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    const scan = await this.prisma.recommendationScan.create({
      data: {
        candidateId: candidate.id,
        cvId,
      },
    });

    this.processInBackground(scan.id, cvId, candidate.id, actor).catch(
      (error) => {
        this.logger.error('recommendation_scan_unhandled', {
          scanId: scan.id,
          error: error instanceof Error ? error.message : String(error),
        });
      },
    );

    return { scanId: scan.id };
  }

  async getScanResult(
    scanId: string,
    actor: JwtPayload,
  ): Promise<RecommendationScanView> {
    const candidate = await this.getCandidateOrThrow(actor.sub);
    const scan = await this.prisma.recommendationScan.findFirst({
      where: { id: scanId, candidateId: candidate.id },
      include: {
        results: {
          orderBy: { rank: 'asc' },
          include: {
            job: {
              select: {
                id: true,
                title: true,
                slug: true,
                employmentType: true,
                salaryMin: true,
                salaryMax: true,
                company: { select: { name: true, logoUrl: true } },
              },
            },
          },
        },
      },
    });
    if (!scan) {
      throw new NotFoundException('Scan not found');
    }
    return this.toScanView(scan);
  }

  async listScans(
    actor: JwtPayload,
    page = 1,
    limit = 5,
  ): Promise<{
    items: RecommendationScanListItem[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
  }> {
    const candidate = await this.getCandidateOrThrow(actor.sub);
    const where = { candidateId: candidate.id };
    const [items, totalItems] = await Promise.all([
      this.prisma.recommendationScan.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          results: {
            select: { matchScore: true },
            orderBy: { rank: 'asc' },
            take: 1,
          },
          _count: { select: { results: true } },
        },
      }),
      this.prisma.recommendationScan.count({ where }),
    ]);

    return {
      items: items.map((scan) => ({
        id: scan.id,
        status: scan.status,
        totalJobs: scan.totalJobs,
        aiEvaluated: scan.aiEvaluated,
        processingMs: scan.processingMs,
        createdAt: scan.createdAt.toISOString(),
        completedAt: scan.completedAt?.toISOString() ?? null,
        resultCount: scan._count.results,
        topScore: scan.results[0]?.matchScore ?? null,
      })),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / limit)),
      },
    };
  }

  // ---- Background Processing ----

  private async processInBackground(
    scanId: string,
    cvId: string,
    candidateId: string,
    _actor: JwtPayload,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // 1. Ensure CV has an embedding (generate if missing)
      await this.vectorSync.syncCv(cvId);

      // 2. Count total published jobs
      const totalJobs = await this.prisma.job.count({
        where: { status: JobStatus.PUBLISHED, deletedAt: null },
      });

      // 3. Vector search: find top jobs by cosine similarity
      const vectorResults = await this.semanticSearch.findTopJobsForCv(
        cvId,
        MAX_RESULTS,
      );

      if (vectorResults.length === 0) {
        this.logger.warn('recommendation_no_vector_results', {
          scanId,
          cvId,
          totalJobs,
          hint: 'No jobs have embeddings yet. Run vector sync for existing jobs.',
        });
      }

      this.logger.info('recommendation_vector_search_done', {
        scanId,
        totalJobs,
        vectorResultCount: vectorResults.length,
        topScore: vectorResults[0]?.score ?? 0,
        processingMs: Date.now() - startTime,
      });

      // 4. Fetch job metadata for the matched jobs
      const jobIds = vectorResults.map((r) => r.id);
      const jobs =
        jobIds.length > 0
          ? await this.prisma.job.findMany({
              where: { id: { in: jobIds } },
              select: {
                id: true,
                title: true,
                description: true,
                skills: true,
                skillAtoms: true,
                requirementsSchema: true,
                location: true,
                recruiterId: true,
              },
            })
          : [];

      // 5. Pre-filter / Re-rank using Canonical Skills
      const jobMap = new Map(jobs.map((j) => [j.id, j]));

      // 5. Build ranked results — convert cosine similarity (0-1) to percentage (0-100)
      const rankedResults = vectorResults.map((result, index) => {
        const job = jobMap.get(result.id);
        const matchScore = Math.round(result.score * 100);

        // Extract strengths from job skills that exist
        const jobSkills = Array.isArray(job?.skills)
          ? (job.skills as string[]).slice(0, 4)
          : [];
        const strengths =
          jobSkills.length > 0
            ? [`Phù hợp kỹ năng: ${jobSkills.join(', ')}`]
            : [];

        return {
          jobId: result.id,
          rank: index + 1,
          matchScore,
          matchTier: resolveMatchTier(matchScore),
          matchingVersion: 'vector_cosine_v1',
          matchingSnapshot: {
            method: 'vector_cosine_similarity',
            rawScore: result.score,
            jobTitle: job?.title ?? 'Unknown',
          } as Prisma.InputJsonValue,
          strengths: strengths as unknown as Prisma.InputJsonValue,
          gaps: [] as unknown as Prisma.InputJsonValue,
          confidenceScore: result.score,
        };
      });

      // 6. Save results
      if (rankedResults.length > 0) {
        await this.prisma.recommendationResult.createMany({
          data: rankedResults.map((result) => ({
            scanId,
            jobId: result.jobId,
            rank: result.rank,
            matchScore: result.matchScore,
            matchTier: result.matchTier,
            matchingVersion: result.matchingVersion,
            matchingSnapshot: result.matchingSnapshot,
            strengths: result.strengths,
            gaps: result.gaps,
            confidenceScore: result.confidenceScore,
          })),
        });
      }

      // 7. Update scan status
      await this.prisma.recommendationScan.update({
        where: { id: scanId },
        data: {
          status: RecommendationScanStatus.COMPLETED,
          totalJobs,
          preFiltered: vectorResults.length,
          aiEvaluated: 0, // No LLM calls in vector-only mode
          processingMs: Date.now() - startTime,
          completedAt: new Date(),
        },
      });

      // 8. Create notification
      await this.createCompletionNotification(
        candidateId,
        totalJobs,
        rankedResults.length,
      );

      this.logger.info('recommendation_scan_completed', {
        scanId,
        totalJobs,
        resultCount: rankedResults.length,
        processingMs: Date.now() - startTime,
        method: 'vector_cosine_similarity',
      });
    } catch (error) {
      this.logger.error('recommendation_scan_failed', {
        scanId,
        error: error instanceof Error ? error.message : String(error),
      });

      await this.prisma.recommendationScan
        .update({
          where: { id: scanId },
          data: {
            status: RecommendationScanStatus.FAILED,
            processingMs: Date.now() - startTime,
            errorMessage:
              error instanceof Error ? error.message : 'Unknown error',
            completedAt: new Date(),
          },
        })
        .catch(() => {
          /* best-effort */
        });

      await this.createFailureNotification(candidateId).catch(() => {
        /* best-effort */
      });
    }
  }

  // ---- Notifications ----

  private async createCompletionNotification(
    candidateId: string,
    totalJobs: number,
    resultCount: number,
  ): Promise<void> {
    const candidate = await this.prisma.candidate.findFirst({
      where: { id: candidateId },
      select: { userId: true },
    });
    if (!candidate) return;

    await this.prisma.notification.create({
      data: {
        userId: candidate.userId,
        title: 'Smart Job Match results are ready!',
        body: `Analyzed ${totalJobs} jobs and found ${resultCount} best-matching positions. View results now!`,
      },
    });
  }

  private async createFailureNotification(candidateId: string): Promise<void> {
    const candidate = await this.prisma.candidate.findFirst({
      where: { id: candidateId },
      select: { userId: true },
    });
    if (!candidate) return;

    await this.prisma.notification.create({
      data: {
        userId: candidate.userId,
        title: 'CV analysis failed',
        body: 'The system encountered an error while analyzing your CV. Please try again later.',
      },
    });
  }

  // ---- Helpers ----

  private async getCandidateOrThrow(userId: string): Promise<{ id: string }> {
    const candidate = await this.prisma.candidate.findFirst({
      where: { userId, user: { deletedAt: null } },
      select: { id: true },
    });
    if (!candidate) {
      throw new NotFoundException('Candidate profile not found');
    }
    return candidate;
  }

  private toScanView(scan: {
    id: string;
    status: RecommendationScanStatus;
    totalJobs: number;
    preFiltered: number;
    aiEvaluated: number;
    processingMs: number | null;
    errorMessage: string | null;
    createdAt: Date;
    completedAt: Date | null;
    results: Array<{
      id: string;
      rank: number;
      matchScore: number;
      matchTier: string;
      confidenceScore: number;
      strengths: Prisma.JsonValue;
      gaps: Prisma.JsonValue;
      job: {
        id: string;
        title: string;
        slug: string;
        employmentType: string;
        salaryMin: number | null;
        salaryMax: number | null;
        company: { name: string; logoUrl: string | null } | null;
      };
    }>;
  }): RecommendationScanView {
    return {
      id: scan.id,
      status: scan.status,
      totalJobs: scan.totalJobs,
      preFiltered: scan.preFiltered,
      aiEvaluated: scan.aiEvaluated,
      processingMs: scan.processingMs,
      errorMessage: scan.errorMessage,
      createdAt: scan.createdAt.toISOString(),
      completedAt: scan.completedAt?.toISOString() ?? null,
      results: scan.results.map((r) => this.toResultView(r)),
    };
  }

  private toResultView(result: {
    id: string;
    rank: number;
    matchScore: number;
    matchTier: string;
    confidenceScore: number;
    strengths: Prisma.JsonValue;
    gaps: Prisma.JsonValue;
    job: {
      id: string;
      title: string;
      slug: string;
      employmentType: string;
      salaryMin: number | null;
      salaryMax: number | null;
      company: { name: string; logoUrl: string | null } | null;
    };
  }): RecommendationResultView {
    return {
      id: result.id,
      rank: result.rank,
      matchScore: result.matchScore,
      matchTier: resolveMatchTier(result.matchScore),
      confidenceScore: result.confidenceScore,
      strengths: this.readJsonStringArray(result.strengths),
      gaps: this.readJsonStringArray(result.gaps),
      job: result.job,
    };
  }

  private readJsonStringArray(value: Prisma.JsonValue): string[] {
    if (!Array.isArray(value)) return [];
    return value
      .filter((item): item is string => typeof item === 'string')
      .slice(0, 5);
  }
}
