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
import { MatchingService } from '../matching.service';
import { SkillStorageAdapterService } from './skill-storage-adapter.service';
import {
  RecommendationPrefilterService,
  PrefilterJobRecord,
} from './recommendation-prefilter.service';
import {
  resolveMatchTier,
  RecommendationScanView,
  RecommendationResultView,
  RecommendationScanListItem,
} from '../recommendation.types';
import type { JwtPayload } from '../../auth/auth.types';

const AI_BATCH_SIZE = 2;
const PRE_FILTER_LIMIT = 20;
const MAX_RESULTS = 10;

type EvaluationResult = {
  jobId: string;
  matchScore: number;
  matchingVersion: string;
  matchingSnapshot: unknown;
  strengths: string[];
  gaps: string[];
  confidenceScore: number;
};

@Injectable()
export class RecommendationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
    private readonly matchingService: MatchingService,
    private readonly skillStorageAdapter: SkillStorageAdapterService,
    private readonly prefilterService: RecommendationPrefilterService,
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
    actor: JwtPayload,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // 1. Fetch CV data
      const cv = await this.prisma.cV.findFirst({
        where: { id: cvId, deletedAt: null },
        select: { id: true, skills: true, skillAtoms: true, rawText: true },
      });
      if (!cv) {
        throw new Error('CV not found during background processing');
      }

      const cvAtoms = this.skillStorageAdapter.readSkillAtoms(cv.skillAtoms);
      const cvCanonicals = new Set(cvAtoms.map((a) => a.canonical));

      // 2. Fetch all published jobs
      const allJobs = (await this.prisma.job.findMany({
        where: { status: JobStatus.PUBLISHED, deletedAt: null },
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
      })) as PrefilterJobRecord[];

      const totalJobs = allJobs.length;

      // 3. Pre-filter
      const topJobs = this.prefilterService.rankJobs({
        cvCanonicals,
        cvRawText: cv.rawText,
        jobs: allJobs,
        limit: PRE_FILTER_LIMIT,
      });

      const preFiltered = topJobs.length;

      this.logger.info('recommendation_prefilter_done', {
        scanId,
        totalJobs,
        preFiltered,
        cvCanonicalCount: cvCanonicals.size,
      });

      // 4. AI Evaluate in sequential batches
      const evaluations: EvaluationResult[] = [];

      for (let i = 0; i < topJobs.length; i += AI_BATCH_SIZE) {
        const batch = topJobs.slice(i, i + AI_BATCH_SIZE);
        const batchResults = await Promise.allSettled(
          batch.map((job) =>
            this.evaluateOneJob(cvId, job.id, actor),
          ),
        );

        for (let idx = 0; idx < batchResults.length; idx++) {
          const settled = batchResults[idx];
          if (settled.status === 'fulfilled') {
            evaluations.push({ jobId: batch[idx].id, ...settled.value });
          } else {
            this.logger.warn('recommendation_single_job_failed', {
              scanId,
              jobId: batch[idx].id,
              error:
                settled.reason instanceof Error
                  ? settled.reason.message
                  : 'unknown',
            });
          }
        }
      }

      // 5. Sort and take top results
      const rankedResults = evaluations
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, MAX_RESULTS)
        .map((result, index) => ({
          ...result,
          rank: index + 1,
        }));

      // 6. Save results
      if (rankedResults.length > 0) {
        await this.prisma.recommendationResult.createMany({
          data: rankedResults.map((result) => ({
            scanId,
            jobId: result.jobId,
            rank: result.rank,
            matchScore: result.matchScore,
            matchTier: resolveMatchTier(result.matchScore),
            matchingVersion: result.matchingVersion,
            matchingSnapshot:
              result.matchingSnapshot as unknown as Prisma.InputJsonValue,
            strengths: result.strengths as unknown as Prisma.InputJsonValue,
            gaps: result.gaps as unknown as Prisma.InputJsonValue,
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
          preFiltered,
          aiEvaluated: evaluations.length,
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
        preFiltered,
        aiEvaluated: evaluations.length,
        resultCount: rankedResults.length,
        processingMs: Date.now() - startTime,
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

  private async evaluateOneJob(
    cvId: string,
    jobId: string,
    actor: JwtPayload,
  ): Promise<Omit<EvaluationResult, 'jobId'>> {
    const result = await this.matchingService.calculateForCvAndJob(
      cvId,
      jobId,
      actor,
    );

    const snapshot = result.matchingSnapshot;
    const strengths = this.extractStrengths(snapshot);
    const gaps = this.extractGaps(snapshot);
    const confidenceScore = this.extractConfidenceScore(snapshot);

    return {
      matchScore: result.score,
      matchingVersion: result.matchingVersion,
      matchingSnapshot: snapshot,
      strengths,
      gaps,
      confidenceScore,
    };
  }

  private extractStrengths(snapshot: unknown): string[] {
    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
      return [];
    }
    const record = snapshot as Record<string, unknown>;
    return Array.isArray(record['strengths'])
      ? (record['strengths'] as unknown[])
          .filter((s): s is string => typeof s === 'string')
          .slice(0, 4)
      : [];
  }

  private extractGaps(snapshot: unknown): string[] {
    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
      return [];
    }
    const record = snapshot as Record<string, unknown>;
    return Array.isArray(record['gaps'])
      ? (record['gaps'] as unknown[])
          .filter((s): s is string => typeof s === 'string')
          .slice(0, 3)
      : [];
  }

  /**
   * Confidence score (0-1) based on the proportion of requirement evaluations
   * with high/medium confidence. V2 snapshots only.
   */
  private extractConfidenceScore(snapshot: unknown): number {
    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
      return 0;
    }
    const record = snapshot as Record<string, unknown>;
    if (!Array.isArray(record['requirements'])) return 0;

    const reqs = record['requirements'] as Array<{
      confidence?: string;
      status?: string;
    }>;
    const applicable = reqs.filter((r) => r.status !== 'not_applicable');
    if (applicable.length === 0) return 0;

    const highCount = applicable.filter(
      (r) => r.confidence === 'high',
    ).length;
    const mediumCount = applicable.filter(
      (r) => r.confidence === 'medium',
    ).length;

    return (highCount * 1.0 + mediumCount * 0.5) / applicable.length;
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
        title: '🎯 Kết quả tìm việc phù hợp đã sẵn sàng!',
        body: `Đã phân tích ${totalJobs} công việc và tìm thấy ${resultCount} vị trí phù hợp nhất. Xem kết quả ngay!`,
      },
    });
  }

  private async createFailureNotification(
    candidateId: string,
  ): Promise<void> {
    const candidate = await this.prisma.candidate.findFirst({
      where: { id: candidateId },
      select: { userId: true },
    });
    if (!candidate) return;

    await this.prisma.notification.create({
      data: {
        userId: candidate.userId,
        title: '⚠️ Phân tích CV không thành công',
        body: 'Hệ thống gặp lỗi khi phân tích CV của bạn. Vui lòng thử lại sau.',
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

  private toScanView(
    scan: {
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
    },
  ): RecommendationScanView {
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
