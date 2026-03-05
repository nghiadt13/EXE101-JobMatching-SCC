import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationStatus, JobStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prismaService: {
    candidate: { findFirst: jest.Mock };
    application: { count: jest.Mock };
    job: { count: jest.Mock };
    user: { count: jest.Mock };
  };

  beforeEach(async () => {
    prismaService = {
      candidate: { findFirst: jest.fn() },
      application: { count: jest.fn() },
      job: { count: jest.fn() },
      user: { count: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('returns candidate stats', async () => {
    prismaService.candidate.findFirst.mockResolvedValue({ id: 'cand-1' });
    prismaService.application.count
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1);

    const result = await service.getStats({
      sub: 'user-1',
      email: 'candidate@example.com',
      role: UserRole.CANDIDATE,
    });

    expect(result).toEqual({
      totalApplications: 8,
      pendingApplications: 3,
      interviewCount: 1,
    });

    const secondCall = prismaService.application.count.mock.calls[1] as Array<{
      where: { status: { in: ApplicationStatus[] } };
    }>;
    expect(secondCall[0].where.status.in).toEqual([
      ApplicationStatus.APPLIED,
      ApplicationStatus.REVIEWING,
    ]);
  });

  it('throws not found when candidate profile does not exist', async () => {
    prismaService.candidate.findFirst.mockResolvedValue(null);

    await expect(
      service.getStats({
        sub: 'user-1',
        email: 'candidate@example.com',
        role: UserRole.CANDIDATE,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns recruiter stats scoped to own jobs', async () => {
    prismaService.job.count.mockResolvedValueOnce(5).mockResolvedValueOnce(2);
    prismaService.application.count
      .mockResolvedValueOnce(40)
      .mockResolvedValueOnce(9);

    const result = await service.getStats({
      sub: 'recruiter-1',
      email: 'recruiter@example.com',
      role: UserRole.RECRUITER,
    });

    expect(result).toEqual({
      totalJobs: 5,
      activeJobs: 2,
      totalApplications: 40,
      pendingReview: 9,
    });

    const activeJobsCall = prismaService.job.count.mock.calls[1] as Array<{
      where: { status: JobStatus };
    }>;
    expect(activeJobsCall[0].where.status).toBe(JobStatus.PUBLISHED);

    const applicationsCall = prismaService.application.count.mock
      .calls[0] as Array<{
      where: { job: { recruiterId: string } };
    }>;
    expect(applicationsCall[0].where.job.recruiterId).toBe('recruiter-1');
  });

  it('returns admin stats', async () => {
    prismaService.user.count
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(20)
      .mockResolvedValueOnce(75);
    prismaService.job.count.mockResolvedValue(45);
    prismaService.application.count.mockResolvedValue(260);

    const result = await service.getStats({
      sub: 'admin-1',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
    });

    expect(result).toEqual({
      totalUsers: 100,
      totalRecruiters: 20,
      totalCandidates: 75,
      totalJobs: 45,
      totalApplications: 260,
    });
  });
});
