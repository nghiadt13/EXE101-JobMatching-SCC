import { ApplicationStatus, JobStatus, Prisma, UserRole } from '@prisma/client';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MatchingService } from '../matching/matching.service';
import { AppLogger } from '../common/logging/app-logger.service';
import type { JwtPayload } from '../auth/auth.types';
import { CreateApplicationDto } from './dto/create-application.dto';
import { QueryApplicationsDto } from './dto/query-applications.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import {
  ApplicationView,
  ApplicationsListResponse,
} from './applications.types';

const RECRUITER_TRANSITIONS = new Map<ApplicationStatus, ApplicationStatus[]>([
  [ApplicationStatus.PENDING_MATCHING, [ApplicationStatus.REJECTED]],
  [
    ApplicationStatus.APPLIED,
    [ApplicationStatus.REVIEWING, ApplicationStatus.REJECTED],
  ],
  [
    ApplicationStatus.REVIEWING,
    [ApplicationStatus.INTERVIEW, ApplicationStatus.REJECTED],
  ],
  [
    ApplicationStatus.INTERVIEW,
    [ApplicationStatus.OFFER, ApplicationStatus.REJECTED],
  ],
  [ApplicationStatus.OFFER, [ApplicationStatus.REJECTED]],
]);

type ApplicationRecord = {
  id: string;
  jobId: string;
  candidateId: string;
  cvId: string;
  matchScore: number;
  matchingSnapshot: Prisma.JsonValue | null;
  status: ApplicationStatus;
  notes: string | null;
  appliedAt: Date;
  updatedAt: Date;
  job: { id: string; title: string; slug: string };
  candidate: { id: string; user: { name: string; email: string } };
  cv: { id: string; fileName: string };
};

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matchingService: MatchingService,
    private readonly logger: AppLogger,
  ) {}

  async create(
    actor: JwtPayload,
    dto: CreateApplicationDto,
  ): Promise<ApplicationView> {
    const candidate = await this.getCandidateOrThrow(actor.sub);
    const cv = await this.prisma.cV.findFirst({
      where: { id: dto.cvId, candidateId: candidate.id, deletedAt: null },
      select: { id: true },
    });
    const job = await this.prisma.job.findFirst({
      where: { id: dto.jobId, deletedAt: null, status: JobStatus.PUBLISHED },
      select: { id: true },
    });
    if (!cv || !job) {
      throw new NotFoundException('Resource not found');
    }

    let created: ApplicationRecord;
    try {
      created = await this.prisma.application.create({
        data: {
          jobId: job.id,
          candidateId: candidate.id,
          cvId: cv.id,
          status: ApplicationStatus.PENDING_MATCHING,
        },
        select: this.applicationSelect,
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('You already applied to this job');
      }
      throw error;
    }

    // Fire-and-forget: run matching in background
    this.processMatchingInBackground(created.id, cv.id, job.id, actor).catch(
      (error) => {
        this.logger.error('background_matching_unhandled', {
          applicationId: created.id,
          error: error instanceof Error ? error.message : String(error),
        });
      },
    );

    return this.toView(created);
  }

  private async processMatchingInBackground(
    applicationId: string,
    cvId: string,
    jobId: string,
    actor: JwtPayload,
  ): Promise<void> {
    try {
      const matching = await this.matchingService.calculateIntegrationPayload(
        cvId,
        jobId,
        actor,
      );
      await this.prisma.application.update({
        where: { id: applicationId },
        data: {
          matchScore: matching.finalScorePercent,
          matchingSnapshot:
            matching.matchingSnapshot as unknown as Prisma.InputJsonValue,
          status: ApplicationStatus.APPLIED,
        },
      });
      this.logger.info('background_matching_completed', {
        applicationId,
        matchScore: matching.finalScorePercent,
      });
    } catch (error) {
      this.logger.error('background_matching_failed', {
        applicationId,
        error: error instanceof Error ? error.message : String(error),
      });
      // Still transition to APPLIED so the application isn't stuck in PENDING
      await this.prisma.application
        .update({
          where: { id: applicationId },
          data: { status: ApplicationStatus.APPLIED },
        })
        .catch(() => {
          /* best-effort */
        });
    }
  }

  async list(
    actor: JwtPayload,
    query: QueryApplicationsDto,
  ): Promise<ApplicationsListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = await this.buildListWhere(actor, query);
    const [items, totalItems] = await Promise.all([
      this.prisma.application.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { appliedAt: 'desc' },
        select: this.applicationSelect,
      }),
      this.prisma.application.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toView(item)),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / limit)),
      },
    };
  }

  async getById(actor: JwtPayload, id: string): Promise<ApplicationView> {
    const where = await this.buildVisibilityWhere(actor);
    const application = await this.prisma.application.findFirst({
      where: { ...where, id },
      select: this.applicationSelect,
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    return this.toView(application);
  }

  async updateStatus(
    actor: JwtPayload,
    id: string,
    dto: UpdateApplicationStatusDto,
  ): Promise<ApplicationView> {
    const application = await this.prisma.application.findFirst({
      where: {
        id,
        job: { recruiterId: actor.sub, deletedAt: null },
      },
      select: {
        id: true,
        status: true,
      },
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    if (!this.canTransition(application.status, dto.status)) {
      throw new BadRequestException('Invalid status transition');
    }

    const updated = await this.prisma.application.update({
      where: { id: application.id },
      data: {
        status: dto.status,
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
      select: this.applicationSelect,
    });
    return this.toView(updated);
  }

  private async buildListWhere(
    actor: JwtPayload,
    query: QueryApplicationsDto,
  ): Promise<Prisma.ApplicationWhereInput> {
    const base = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.jobId ? { jobId: query.jobId } : {}),
    };
    const visibility = await this.buildVisibilityWhere(actor);
    return { ...base, ...visibility };
  }

  private async buildVisibilityWhere(
    actor: JwtPayload,
  ): Promise<Prisma.ApplicationWhereInput> {
    if (actor.role === UserRole.CANDIDATE) {
      const candidate = await this.getCandidateOrThrow(actor.sub);
      return { candidateId: candidate.id };
    }
    return {
      job: { recruiterId: actor.sub, deletedAt: null },
    };
  }

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

  private canTransition(
    from: ApplicationStatus,
    to: ApplicationStatus,
  ): boolean {
    if (from === to) {
      return true;
    }
    const allowed = RECRUITER_TRANSITIONS.get(from) ?? [];
    return allowed.includes(to);
  }

  private isUniqueViolation(error: unknown): boolean {
    return (error as { code?: string })?.code === 'P2002';
  }

  private toView(item: ApplicationRecord): ApplicationView {
    const matchingSnapshot = this.normalizeMatchingSnapshot(
      item.matchingSnapshot,
    );
    return {
      id: item.id,
      jobId: item.jobId,
      candidateId: item.candidateId,
      cvId: item.cvId,
      matchScore: item.matchScore,
      matchingSnapshot,
      status: item.status,
      notes: item.notes,
      appliedAt: item.appliedAt,
      updatedAt: item.updatedAt,
      job: item.job,
      candidate: {
        id: item.candidate.id,
        name: item.candidate.user.name,
        email: item.candidate.user.email,
      },
      cv: item.cv,
    };
  }

  private normalizeMatchingSnapshot(
    value: Prisma.JsonValue | null,
  ): ApplicationView['matchingSnapshot'] {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    const record = value as Record<string, unknown>;
    const breakdown =
      record['scoreBreakdown'] &&
      typeof record['scoreBreakdown'] === 'object' &&
      !Array.isArray(record['scoreBreakdown'])
        ? (record['scoreBreakdown'] as Record<string, unknown>)
        : null;
    if (!breakdown || typeof breakdown['final'] !== 'number') {
      return null;
    }
    return record as unknown as ApplicationView['matchingSnapshot'];
  }

  private get applicationSelect() {
    return {
      id: true,
      jobId: true,
      candidateId: true,
      cvId: true,
      matchScore: true,
      matchingSnapshot: true,
      status: true,
      notes: true,
      appliedAt: true,
      updatedAt: true,
      job: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
      candidate: {
        select: {
          id: true,
          user: { select: { name: true, email: true } },
        },
      },
      cv: {
        select: {
          id: true,
          fileName: true,
        },
      },
    } satisfies Prisma.ApplicationSelect;
  }
}
