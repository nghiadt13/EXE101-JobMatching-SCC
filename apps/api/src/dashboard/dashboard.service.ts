import { Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationStatus, JobStatus, UserRole } from '@prisma/client';
import type { JwtPayload } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import type {
  AdminDashboardStats,
  CandidateDashboardStats,
  DashboardStatsResponse,
  RecruiterDashboardStats,
} from './dashboard.types';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(actor: JwtPayload): Promise<DashboardStatsResponse> {
    switch (actor.role) {
      case UserRole.CANDIDATE:
        return this.getCandidateStats(actor.sub);
      case UserRole.RECRUITER:
        return this.getRecruiterStats(actor.sub);
      case UserRole.ADMIN:
        return this.getAdminStats();
    }

    throw new NotFoundException('Unsupported role');
  }

  private async getCandidateStats(
    userId: string,
  ): Promise<CandidateDashboardStats> {
    const candidate = await this.prisma.candidate.findFirst({
      where: { userId, user: { deletedAt: null } },
      select: { id: true },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate profile not found');
    }

    const [totalApplications, pendingApplications, interviewCount] =
      await Promise.all([
        this.prisma.application.count({
          where: { candidateId: candidate.id },
        }),
        this.prisma.application.count({
          where: {
            candidateId: candidate.id,
            status: {
              in: [ApplicationStatus.APPLIED, ApplicationStatus.REVIEWING],
            },
          },
        }),
        this.prisma.application.count({
          where: {
            candidateId: candidate.id,
            status: ApplicationStatus.INTERVIEW,
          },
        }),
      ]);

    return {
      totalApplications,
      pendingApplications,
      interviewCount,
    };
  }

  private async getRecruiterStats(
    userId: string,
  ): Promise<RecruiterDashboardStats> {
    const [totalJobs, activeJobs, totalApplications, pendingReview] =
      await Promise.all([
        this.prisma.job.count({
          where: { recruiterId: userId, deletedAt: null },
        }),
        this.prisma.job.count({
          where: {
            recruiterId: userId,
            deletedAt: null,
            status: JobStatus.PUBLISHED,
          },
        }),
        this.prisma.application.count({
          where: {
            job: { recruiterId: userId, deletedAt: null },
          },
        }),
        this.prisma.application.count({
          where: {
            status: ApplicationStatus.APPLIED,
            job: { recruiterId: userId, deletedAt: null },
          },
        }),
      ]);

    return {
      totalJobs,
      activeJobs,
      totalApplications,
      pendingReview,
    };
  }

  private async getAdminStats(): Promise<AdminDashboardStats> {
    const [
      totalUsers,
      totalRecruiters,
      totalCandidates,
      totalJobs,
      totalApplications,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({
        where: { deletedAt: null, role: UserRole.RECRUITER },
      }),
      this.prisma.user.count({
        where: { deletedAt: null, role: UserRole.CANDIDATE },
      }),
      this.prisma.job.count({ where: { deletedAt: null } }),
      this.prisma.application.count(),
    ]);

    return {
      totalUsers,
      totalRecruiters,
      totalCandidates,
      totalJobs,
      totalApplications,
    };
  }
}
