import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationStatus, JobStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

type MockUser = {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

type MockCandidate = {
  id: string;
  userId: string;
  phone: string | null;
  location: Record<string, unknown> | null;
  bio: string | null;
};

type MockCv = {
  id: string;
  candidateId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  parsedData: Record<string, unknown>;
  skills: string[];
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

type MockJob = {
  id: string;
  recruiterId: string;
  title: string;
  slug: string;
  description: string;
  skills: string[];
  location: Record<string, unknown> | null;
  salaryMin: number | null;
  salaryMax: number | null;
  employmentType: string;
  status: JobStatus;
  publishedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

type MockApplication = {
  id: string;
  jobId: string;
  candidateId: string;
  cvId: string;
  matchScore: number;
  tfidfScore: number | null;
  skillsScore: number | null;
  status: ApplicationStatus;
  notes: string | null;
  appliedAt: Date;
  updatedAt: Date;
};

describe('Auth and User/Profile (e2e)', () => {
  let app: INestApplication;
  let users: MockUser[];
  let candidates: MockCandidate[];
  let createRequest: () => ReturnType<typeof request>;
  let adminToken = '';
  let recruiterToken = '';
  let candidateToken = '';
  let cvs: MockCv[];
  let jobs: MockJob[];
  let applications: MockApplication[];

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.NODE_ENV = 'test';

    const now = new Date();
    const hashedPassword = await bcrypt.hash('password123', 10);
    users = [
      {
        id: 'admin-1',
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'Admin User',
        role: UserRole.ADMIN,
        avatar: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      {
        id: 'recruiter-1',
        email: 'recruiter@example.com',
        password: hashedPassword,
        name: 'Recruiter User',
        role: UserRole.RECRUITER,
        avatar: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      {
        id: 'candidate-1',
        email: 'candidate-seeded@example.com',
        password: hashedPassword,
        name: 'Candidate Seeded',
        role: UserRole.CANDIDATE,
        avatar: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
    ];
    candidates = [
      {
        id: 'cand-1',
        userId: 'candidate-1',
        phone: '0909123123',
        location: { city: 'HCM', country: 'VN' },
        bio: 'Candidate bio',
      },
    ];
    cvs = [
      {
        id: 'cv-1',
        candidateId: 'cand-1',
        fileName: 'cv.pdf',
        filePath: 'cand-1/cv.pdf',
        fileSize: 12000,
        mimeType: 'application/pdf',
        parsedData: { skills: ['TypeScript'], summary: 'seeded summary' },
        skills: ['TypeScript'],
        isPrimary: true,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
    ];
    jobs = [
      {
        id: 'job-1',
        recruiterId: 'recruiter-1',
        title: 'Backend Engineer',
        slug: 'backend-engineer',
        description: 'Published backend engineer role',
        skills: ['TypeScript', 'NestJS'],
        location: { city: 'HCM' },
        salaryMin: 1000,
        salaryMax: 2000,
        employmentType: 'FULL_TIME',
        status: JobStatus.PUBLISHED,
        publishedAt: now,
        closedAt: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      {
        id: 'job-2',
        recruiterId: 'recruiter-1',
        title: 'Draft Recruiter Job',
        slug: 'draft-recruiter-job',
        description: 'Draft recruiter internal job',
        skills: ['Recruiting'],
        location: { city: 'HCM' },
        salaryMin: null,
        salaryMax: null,
        employmentType: 'FULL_TIME',
        status: JobStatus.DRAFT,
        publishedAt: null,
        closedAt: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
    ];
    applications = [];

    const prismaMock = {
      user: {
        findUnique: jest.fn(({ where }: { where: { email: string } }) => {
          return Promise.resolve(
            users.find((user) => user.email === where.email) ?? null,
          );
        }),
        findFirst: jest.fn(
          ({
            where,
            select,
          }: {
            where: { id?: string; deletedAt?: null };
            select?: Record<string, unknown>;
          }) => {
            const found = users.find((item) => {
              const byId = where.id ? item.id === where.id : true;
              const byDeleted =
                where.deletedAt === null ? item.deletedAt === null : true;
              return byId && byDeleted;
            });
            if (!found) {
              return Promise.resolve(null);
            }

            const foundCandidate =
              candidates.find((candidate) => candidate.userId === found.id) ??
              null;
            if (select && 'candidate' in select) {
              return Promise.resolve({
                id: found.id,
                email: found.email,
                name: found.name,
                role: found.role,
                avatar: found.avatar,
                candidate: foundCandidate
                  ? {
                      id: foundCandidate.id,
                      phone: foundCandidate.phone,
                      location: foundCandidate.location,
                      bio: foundCandidate.bio,
                    }
                  : null,
              });
            }

            return Promise.resolve({
              id: found.id,
              email: found.email,
              name: found.name,
              role: found.role,
              avatar: found.avatar,
            });
          },
        ),
        create: jest.fn(
          ({
            data,
          }: {
            data: {
              email: string;
              password: string;
              name: string;
              role: UserRole;
              candidate?: { create: Record<string, never> };
            };
          }) => {
            const created: MockUser = {
              id: `user-${users.length + 1}`,
              email: data.email,
              password: data.password,
              name: data.name,
              role: data.role,
              avatar: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              deletedAt: null,
            };
            users.push(created);
            if (data.role === UserRole.CANDIDATE && data.candidate) {
              candidates.push({
                id: `cand-${candidates.length + 1}`,
                userId: created.id,
                phone: null,
                location: null,
                bio: null,
              });
            }

            return Promise.resolve({
              id: created.id,
              email: created.email,
              name: created.name,
              role: created.role,
            });
          },
        ),
        findMany: jest.fn(
          ({
            where,
            skip,
            take,
          }: {
            where?: { role?: UserRole; deletedAt?: null };
            skip?: number;
            take?: number;
          }) => {
            let filtered = [...users];
            if (where?.deletedAt === null) {
              filtered = filtered.filter((item) => item.deletedAt === null);
            }
            if (where?.role) {
              filtered = filtered.filter((item) => item.role === where.role);
            }
            const start = skip ?? 0;
            const end = take ? start + take : undefined;
            const rows = filtered.slice(start, end).map((item) => ({
              id: item.id,
              email: item.email,
              name: item.name,
              role: item.role,
              avatar: item.avatar,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
              deletedAt: item.deletedAt,
            }));
            return Promise.resolve(rows);
          },
        ),
        count: jest.fn(
          ({ where }: { where?: { deletedAt?: null; role?: UserRole } }) => {
            let filtered = [...users];
            if (where?.deletedAt === null) {
              filtered = filtered.filter((item) => item.deletedAt === null);
            }
            if (where?.role) {
              filtered = filtered.filter((item) => item.role === where.role);
            }
            return Promise.resolve(filtered.length);
          },
        ),
        update: jest.fn(
          ({
            where,
            data,
            select,
          }: {
            where: { id: string };
            data: Partial<MockUser>;
            select?: Record<string, unknown>;
          }) => {
            const index = users.findIndex((item) => item.id === where.id);
            const updated = {
              ...users[index],
              ...data,
              updatedAt: new Date(),
            };
            users[index] = updated;
            if (select) {
              return Promise.resolve({
                id: updated.id,
                email: updated.email,
                name: updated.name,
                role: updated.role,
                avatar: updated.avatar,
                createdAt: updated.createdAt,
                updatedAt: updated.updatedAt,
                deletedAt: updated.deletedAt,
              });
            }
            return Promise.resolve(updated);
          },
        ),
      },
      candidate: {
        findFirst: jest.fn(
          ({
            where,
            select,
          }: {
            where: { userId?: string; user?: { deletedAt?: null } };
            select?: Record<string, unknown>;
          }) => {
            const found = candidates.find((item) =>
              where.userId ? item.userId === where.userId : true,
            );
            if (!found) {
              return Promise.resolve(null);
            }
            if (select && 'id' in select) {
              return Promise.resolve({ id: found.id });
            }
            return Promise.resolve(found);
          },
        ),
        update: jest.fn(
          ({
            where,
            data,
          }: {
            where: { userId: string };
            data: Partial<MockCandidate>;
          }) => {
            const index = candidates.findIndex(
              (item) => item.userId === where.userId,
            );
            const updated = { ...candidates[index], ...data };
            candidates[index] = updated;
            return Promise.resolve(updated);
          },
        ),
      },
      cV: {
        count: jest.fn(
          ({
            where,
          }: {
            where?: { candidateId?: string; deletedAt?: null };
          }) => {
            let filtered = [...cvs];
            if (where?.candidateId) {
              filtered = filtered.filter(
                (item) => item.candidateId === where.candidateId,
              );
            }
            if (where?.deletedAt === null) {
              filtered = filtered.filter((item) => item.deletedAt === null);
            }
            return Promise.resolve(filtered.length);
          },
        ),
        findMany: jest.fn(
          ({
            where,
          }: {
            where?: { candidateId?: string; deletedAt?: null };
          }) => {
            let filtered = [...cvs];
            if (where?.candidateId) {
              filtered = filtered.filter(
                (item) => item.candidateId === where.candidateId,
              );
            }
            if (where?.deletedAt === null) {
              filtered = filtered.filter((item) => item.deletedAt === null);
            }

            return Promise.resolve(
              filtered.map((item) => ({
                id: item.id,
                fileName: item.fileName,
                fileSize: item.fileSize,
                mimeType: item.mimeType,
                parsedData: item.parsedData,
                skills: item.skills,
                isPrimary: item.isPrimary,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                filePath: item.filePath,
              })),
            );
          },
        ),
        findFirst: jest.fn(
          ({
            where,
          }: {
            where?: { id?: string; candidateId?: string; deletedAt?: null };
          }) => {
            const found = cvs.find((item) => {
              const byId = where?.id ? item.id === where.id : true;
              const byCandidate = where?.candidateId
                ? item.candidateId === where.candidateId
                : true;
              const byDeleted =
                where?.deletedAt === null ? item.deletedAt === null : true;
              return byId && byCandidate && byDeleted;
            });
            if (!found) {
              return Promise.resolve(null);
            }
            const foundCandidate = candidates.find(
              (candidate) => candidate.id === found.candidateId,
            );
            return Promise.resolve({
              id: found.id,
              fileName: found.fileName,
              fileSize: found.fileSize,
              mimeType: found.mimeType,
              parsedData: found.parsedData,
              skills: found.skills,
              isPrimary: found.isPrimary,
              createdAt: found.createdAt,
              updatedAt: found.updatedAt,
              filePath: found.filePath,
              candidate: foundCandidate
                ? { userId: foundCandidate.userId }
                : undefined,
            });
          },
        ),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      job: {
        count: jest.fn(({ where }: { where?: Record<string, unknown> }) => {
          let filtered = [...jobs];
          if (where?.['deletedAt'] === null) {
            filtered = filtered.filter((item) => item.deletedAt === null);
          }
          if (typeof where?.['recruiterId'] === 'string') {
            filtered = filtered.filter(
              (item) => item.recruiterId === where['recruiterId'],
            );
          }
          if (typeof where?.['status'] === 'string') {
            filtered = filtered.filter(
              (item) => item.status === where['status'],
            );
          }
          return Promise.resolve(filtered.length);
        }),
        findMany: jest.fn(
          ({
            where,
            skip,
            take,
          }: {
            where?: Record<string, unknown>;
            skip?: number;
            take?: number;
          }) => {
            let filtered = [...jobs];
            if (where?.['deletedAt'] === null) {
              filtered = filtered.filter((item) => item.deletedAt === null);
            }
            if (typeof where?.['recruiterId'] === 'string') {
              filtered = filtered.filter(
                (item) => item.recruiterId === where['recruiterId'],
              );
            }
            if (typeof where?.['status'] === 'string') {
              filtered = filtered.filter(
                (item) => item.status === where['status'],
              );
            }
            if (Array.isArray(where?.['OR'])) {
              const orFilters = where['OR'] as Array<{
                title?: { contains?: string };
                description?: { contains?: string };
              }>;
              filtered = filtered.filter((item) =>
                orFilters.some((entry) => {
                  const titleNeedle = entry.title?.contains?.toLowerCase();
                  const descNeedle = entry.description?.contains?.toLowerCase();
                  return (
                    (titleNeedle
                      ? item.title.toLowerCase().includes(titleNeedle)
                      : false) ||
                    (descNeedle
                      ? item.description.toLowerCase().includes(descNeedle)
                      : false)
                  );
                }),
              );
            }
            const start = skip ?? 0;
            const end = take ? start + take : undefined;
            return Promise.resolve(
              filtered.slice(start, end).map((item) => ({
                id: item.id,
                recruiterId: item.recruiterId,
                title: item.title,
                slug: item.slug,
                description: item.description,
                skills: item.skills,
                location: item.location,
                salaryMin: item.salaryMin,
                salaryMax: item.salaryMax,
                employmentType: item.employmentType,
                status: item.status,
                publishedAt: item.publishedAt,
                closedAt: item.closedAt,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
              })),
            );
          },
        ),
        findFirst: jest.fn(({ where }: { where?: Record<string, unknown> }) => {
          const found = jobs.find((item) => {
            const byId =
              typeof where?.['id'] === 'string'
                ? item.id === where['id']
                : true;
            const byRecruiter =
              typeof where?.['recruiterId'] === 'string'
                ? item.recruiterId === where['recruiterId']
                : true;
            const byDeleted =
              where?.['deletedAt'] === null ? item.deletedAt === null : true;
            const bySlug =
              typeof where?.['slug'] === 'string'
                ? item.slug === where['slug']
                : true;
            const byStatus =
              typeof where?.['status'] === 'string'
                ? item.status === where['status']
                : true;
            const byOr = Array.isArray(where?.['OR'])
              ? (where?.['OR'] as Array<{ id?: string; slug?: string }>).some(
                  (entry) =>
                    (entry.id ? item.id === entry.id : false) ||
                    (entry.slug ? item.slug === entry.slug : false),
                )
              : true;

            return (
              byId && byRecruiter && byDeleted && bySlug && byStatus && byOr
            );
          });
          if (!found) {
            return Promise.resolve(null);
          }
          return Promise.resolve({
            id: found.id,
            recruiterId: found.recruiterId,
            title: found.title,
            slug: found.slug,
            description: found.description,
            skills: found.skills,
            location: found.location,
            salaryMin: found.salaryMin,
            salaryMax: found.salaryMax,
            employmentType: found.employmentType,
            status: found.status,
            publishedAt: found.publishedAt,
            closedAt: found.closedAt,
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
            deletedAt: found.deletedAt,
          });
        }),
        create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
          const created: MockJob = {
            id: `job-${jobs.length + 1}`,
            recruiterId: String(data.recruiterId),
            title: String(data.title),
            slug: String(data.slug),
            description: String(data.description),
            skills: Array.isArray(data.skills) ? (data.skills as string[]) : [],
            location: (data.location as Record<string, unknown> | null) ?? null,
            salaryMin: (data.salaryMin as number | null) ?? null,
            salaryMax: (data.salaryMax as number | null) ?? null,
            employmentType: String(data.employmentType),
            status: JobStatus.DRAFT,
            publishedAt: null,
            closedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          };
          jobs.push(created);
          return Promise.resolve({
            ...created,
          });
        }),
        update: jest.fn(
          ({
            where,
            data,
          }: {
            where: { id: string };
            data: Record<string, unknown>;
          }) => {
            const index = jobs.findIndex((item) => item.id === where.id);
            const updated: MockJob = {
              ...jobs[index],
              ...data,
              updatedAt: new Date(),
            };
            jobs[index] = updated;
            return Promise.resolve({
              id: updated.id,
              recruiterId: updated.recruiterId,
              title: updated.title,
              slug: updated.slug,
              description: updated.description,
              skills: updated.skills,
              location: updated.location,
              salaryMin: updated.salaryMin,
              salaryMax: updated.salaryMax,
              employmentType: updated.employmentType,
              status: updated.status,
              publishedAt: updated.publishedAt,
              closedAt: updated.closedAt,
              createdAt: updated.createdAt,
              updatedAt: updated.updatedAt,
              deletedAt: updated.deletedAt,
            });
          },
        ),
      },
      application: {
        count: jest.fn(
          ({ where }: { where?: Record<string, unknown> } = {}) => {
          let filtered = [...applications];
          if (typeof where?.['candidateId'] === 'string') {
            filtered = filtered.filter(
              (item) => item.candidateId === where['candidateId'],
            );
          }
          if (typeof where?.['jobId'] === 'string') {
            filtered = filtered.filter((item) => item.jobId === where['jobId']);
          }
          if (typeof where?.['status'] === 'string') {
            filtered = filtered.filter(
              (item) => item.status === where['status'],
            );
          }
          if (where?.['job'] && typeof where['job'] === 'object') {
            const recruiterId = (where['job'] as { recruiterId?: string })
              .recruiterId;
            if (recruiterId) {
              filtered = filtered.filter((item) => {
                const job = jobs.find((entry) => entry.id === item.jobId);
                return job?.recruiterId === recruiterId;
              });
            }
          }
          return Promise.resolve(filtered.length);
          },
        ),
        findMany: jest.fn(
          ({
            where,
            skip,
            take,
          }: {
            where?: Record<string, unknown>;
            skip?: number;
            take?: number;
          }) => {
            let filtered = [...applications];
            if (typeof where?.['candidateId'] === 'string') {
              filtered = filtered.filter(
                (item) => item.candidateId === where['candidateId'],
              );
            }
            if (typeof where?.['jobId'] === 'string') {
              filtered = filtered.filter(
                (item) => item.jobId === where['jobId'],
              );
            }
            if (typeof where?.['status'] === 'string') {
              filtered = filtered.filter(
                (item) => item.status === where['status'],
              );
            }
            if (where?.['job'] && typeof where['job'] === 'object') {
              const recruiterId = (where['job'] as { recruiterId?: string })
                .recruiterId;
              if (recruiterId) {
                filtered = filtered.filter((item) => {
                  const job = jobs.find((entry) => entry.id === item.jobId);
                  return job?.recruiterId === recruiterId;
                });
              }
            }
            const start = skip ?? 0;
            const end = take ? start + take : undefined;
            const items = filtered.slice(start, end).map((item) => {
              const job = jobs.find((entry) => entry.id === item.jobId);
              const candidate = candidates.find(
                (entry) => entry.id === item.candidateId,
              );
              const user = users.find(
                (entry) => entry.id === candidate?.userId,
              );
              const cv = cvs.find((entry) => entry.id === item.cvId);
              return {
                ...item,
                job: {
                  id: job?.id ?? item.jobId,
                  title: job?.title ?? 'Unknown',
                  slug: job?.slug ?? 'unknown',
                },
                candidate: {
                  id: candidate?.id ?? item.candidateId,
                  user: {
                    name: user?.name ?? 'Unknown',
                    email: user?.email ?? 'unknown@example.com',
                  },
                },
                cv: {
                  id: cv?.id ?? item.cvId,
                  fileName: cv?.fileName ?? 'unknown.pdf',
                },
              };
            });
            return Promise.resolve(items);
          },
        ),
        findFirst: jest.fn(({ where }: { where?: Record<string, unknown> }) => {
          const found = applications.find((item) => {
            const byId =
              typeof where?.['id'] === 'string'
                ? item.id === where['id']
                : true;
            const byCandidate =
              typeof where?.['candidateId'] === 'string'
                ? item.candidateId === where['candidateId']
                : true;
            const byJob =
              typeof where?.['jobId'] === 'string'
                ? item.jobId === where['jobId']
                : true;
            const byStatus =
              typeof where?.['status'] === 'string'
                ? item.status === where['status']
                : true;
            const byRecruiter =
              where?.['job'] && typeof where['job'] === 'object'
                ? (() => {
                    const recruiterId = (
                      where['job'] as { recruiterId?: string }
                    ).recruiterId;
                    if (!recruiterId) {
                      return true;
                    }
                    const job = jobs.find((entry) => entry.id === item.jobId);
                    return job?.recruiterId === recruiterId;
                  })()
                : true;
            return byId && byCandidate && byJob && byStatus && byRecruiter;
          });
          if (!found) {
            return Promise.resolve(null);
          }

          const job = jobs.find((entry) => entry.id === found.jobId);
          const candidate = candidates.find(
            (entry) => entry.id === found.candidateId,
          );
          const user = users.find((entry) => entry.id === candidate?.userId);
          const cv = cvs.find((entry) => entry.id === found.cvId);
          return Promise.resolve({
            ...found,
            job: {
              id: job?.id ?? found.jobId,
              title: job?.title ?? 'Unknown',
              slug: job?.slug ?? 'unknown',
            },
            candidate: {
              id: candidate?.id ?? found.candidateId,
              user: {
                name: user?.name ?? 'Unknown',
                email: user?.email ?? 'unknown@example.com',
              },
            },
            cv: {
              id: cv?.id ?? found.cvId,
              fileName: cv?.fileName ?? 'unknown.pdf',
            },
          });
        }),
        create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
          const exists = applications.some(
            (item) =>
              item.jobId === data.jobId &&
              item.candidateId === data.candidateId,
          );
          if (exists) {
            const duplicateError = Object.assign(
              new Error('Unique constraint violation'),
              { code: 'P2002' },
            );
            return Promise.reject(duplicateError);
          }
          const created: MockApplication = {
            id: `app-${applications.length + 1}`,
            jobId: String(data.jobId),
            candidateId: String(data.candidateId),
            cvId: String(data.cvId),
            matchScore: Number(data.matchScore ?? 0),
            tfidfScore: Number(data.tfidfScore ?? 0),
            skillsScore: Number(data.skillsScore ?? 0),
            status: ApplicationStatus.APPLIED,
            notes: null,
            appliedAt: new Date(),
            updatedAt: new Date(),
          };
          applications.push(created);
          const job = jobs.find((entry) => entry.id === created.jobId);
          const candidate = candidates.find(
            (entry) => entry.id === created.candidateId,
          );
          const user = users.find((entry) => entry.id === candidate?.userId);
          const cv = cvs.find((entry) => entry.id === created.cvId);
          return Promise.resolve({
            ...created,
            job: {
              id: job?.id ?? created.jobId,
              title: job?.title ?? 'Unknown',
              slug: job?.slug ?? 'unknown',
            },
            candidate: {
              id: candidate?.id ?? created.candidateId,
              user: {
                name: user?.name ?? 'Unknown',
                email: user?.email ?? 'unknown@example.com',
              },
            },
            cv: {
              id: cv?.id ?? created.cvId,
              fileName: cv?.fileName ?? 'unknown.pdf',
            },
          });
        }),
        update: jest.fn(
          ({
            where,
            data,
          }: {
            where: { id: string };
            data: Record<string, unknown>;
          }) => {
            const index = applications.findIndex(
              (item) => item.id === where.id,
            );
            const updated: MockApplication = {
              ...applications[index],
              ...data,
              updatedAt: new Date(),
            };
            applications[index] = updated;
            const job = jobs.find((entry) => entry.id === updated.jobId);
            const candidate = candidates.find(
              (entry) => entry.id === updated.candidateId,
            );
            const user = users.find((entry) => entry.id === candidate?.userId);
            const cv = cvs.find((entry) => entry.id === updated.cvId);
            return Promise.resolve({
              ...updated,
              job: {
                id: job?.id ?? updated.jobId,
                title: job?.title ?? 'Unknown',
                slug: job?.slug ?? 'unknown',
              },
              candidate: {
                id: candidate?.id ?? updated.candidateId,
                user: {
                  name: user?.name ?? 'Unknown',
                  email: user?.email ?? 'unknown@example.com',
                },
              },
              cv: {
                id: cv?.id ?? updated.cvId,
                fileName: cv?.fileName ?? 'unknown.pdf',
              },
            });
          },
        ),
      },
      $transaction: jest.fn((callback: (tx: unknown) => unknown) =>
        callback({
          cV: {
            update: jest.fn(),
            findFirst: jest.fn(),
            updateMany: jest.fn(),
          },
          job: {
            update: jest.fn(),
            findFirst: jest.fn(),
            updateMany: jest.fn(),
          },
          application: {
            create: jest.fn(),
            findFirst: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
          },
        }),
      ),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    createRequest = () => request(httpServer);

    adminToken = await loginAndGetToken('admin@example.com');
    recruiterToken = await loginAndGetToken('recruiter@example.com');
    candidateToken = await loginAndGetToken('candidate-seeded@example.com');
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers candidate user', async () => {
    const response = await createRequest()
      .post('/api/auth/register')
      .send({
        email: 'candidate@example.com',
        password: 'password123',
        name: 'Candidate User',
        role: 'CANDIDATE',
      })
      .expect(201);

    const body = response.body as { user: { email: string }; token: string };
    expect(body.user.email).toBe('candidate@example.com');
    expect(body.token).toBeDefined();
  });

  it('rejects duplicate email register', () => {
    return createRequest()
      .post('/api/auth/register')
      .send({
        email: 'candidate@example.com',
        password: 'password123',
        name: 'Duplicate Candidate',
        role: 'CANDIDATE',
      })
      .expect(409);
  });

  it('rejects admin role on register', () => {
    return createRequest()
      .post('/api/auth/register')
      .send({
        email: 'new-admin@example.com',
        password: 'password123',
        name: 'New Admin',
        role: 'ADMIN',
      })
      .expect(400);
  });

  it('logs in and calls /auth/me', async () => {
    const loginResponse = await createRequest()
      .post('/api/auth/login')
      .send({
        email: 'candidate@example.com',
        password: 'password123',
      })
      .expect(201);

    const token = (loginResponse.body as { accessToken: string }).accessToken;
    expect(token).toBeDefined();

    const meResponse = await createRequest()
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const meBody = meResponse.body as { email: string; role: string };
    expect(meBody).toMatchObject({
      email: 'candidate@example.com',
      role: 'CANDIDATE',
    });
  });

  it('fails login with wrong password', () => {
    return createRequest()
      .post('/api/auth/login')
      .send({
        email: 'candidate@example.com',
        password: 'wrong-password',
      })
      .expect(401);
  });

  it('rejects /auth/me without bearer token', () => {
    return createRequest().get('/api/auth/me').expect(401);
  });

  it('allows admin to list users', async () => {
    const response = await createRequest()
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const body = response.body as { items: Array<{ id: string }> };
    expect(body.items.length).toBeGreaterThan(0);
  });

  it('rejects recruiter from listing users', async () => {
    await createRequest()
      .get('/api/users')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .expect(403);
  });

  it('blocks admin self-delete', async () => {
    await createRequest()
      .delete('/api/users/admin-1')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400);
  });

  it('returns current candidate profile', async () => {
    const response = await createRequest()
      .get('/api/profile')
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    const body = response.body as {
      role: string;
      candidate: { phone: string };
    };
    expect(body.role).toBe('CANDIDATE');
    expect(body.candidate.phone).toBe('0909123123');
  });

  it('updates current candidate profile', async () => {
    const response = await createRequest()
      .patch('/api/profile')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        name: 'Candidate Updated',
        phone: '0911111111',
      })
      .expect(200);

    const body = response.body as {
      name: string;
      candidate: { phone: string };
    };
    expect(body.name).toBe('Candidate Updated');
    expect(body.candidate.phone).toBe('0911111111');
  });

  it('allows candidate to list own cvs', async () => {
    const response = await createRequest()
      .get('/api/cvs')
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    const body = response.body as { items: Array<{ id: string }> };
    expect(body.items.length).toBeGreaterThan(0);
  });

  it('rejects recruiter from cv endpoints', async () => {
    await createRequest()
      .get('/api/cvs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .expect(403);
  });

  it('allows recruiter to create a draft job', async () => {
    const response = await createRequest()
      .post('/api/jobs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        title: 'Senior Recruiter',
        description: 'Need recruiter with at least 3 years of experience.',
        skills: ['Communication', 'Sourcing'],
        employmentType: 'FULL_TIME',
      })
      .expect(201);

    const body = response.body as { status: string; recruiterId: string };
    expect(body.status).toBe('DRAFT');
    expect(body.recruiterId).toBe('recruiter-1');
  });

  it('rejects candidate from creating jobs', async () => {
    await createRequest()
      .post('/api/jobs')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        title: 'Should fail',
        description: 'Candidate cannot create jobs',
        skills: ['X'],
        employmentType: 'FULL_TIME',
      })
      .expect(403);
  });

  it('returns only published jobs for public listing', async () => {
    const response = await createRequest().get('/api/jobs').expect(200);
    const body = response.body as { items: Array<{ status: string }> };
    expect(body.items.every((item) => item.status === 'PUBLISHED')).toBe(true);
  });

  it('allows recruiter to list own draft jobs', async () => {
    const response = await createRequest()
      .get('/api/jobs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .expect(200);

    const body = response.body as { items: Array<{ status: string }> };
    expect(body.items.some((item) => item.status === 'DRAFT')).toBe(true);
  });

  it('blocks closing a draft job', async () => {
    await createRequest()
      .post('/api/jobs/job-2/close')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .expect(400);
  });

  it('allows candidate to calculate matching for own cv and published job', async () => {
    const response = await createRequest()
      .post('/api/matching/calculate')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        cvId: 'cv-1',
        jobId: 'job-1',
      })
      .expect(201);

    const body = response.body as {
      score: number;
      tfidfScore: number;
      skillsScore: number;
      breakdown: { matchedSkills: string[]; missingSkills: string[] };
    };
    expect(body.score).toBeGreaterThanOrEqual(0);
    expect(body.score).toBeLessThanOrEqual(100);
    expect(body.breakdown.matchedSkills).toContain('TypeScript');
  });

  it('rejects invalid matching payload', async () => {
    await createRequest()
      .post('/api/matching/calculate')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        cvId: 'cv-1',
      })
      .expect(400);
  });

  it('hides non-visible job from candidate matching', async () => {
    await createRequest()
      .post('/api/matching/calculate')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        cvId: 'cv-1',
        jobId: 'job-2',
      })
      .expect(404);
  });

  it('allows candidate to apply a published job with own cv', async () => {
    const response = await createRequest()
      .post('/api/applications')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        jobId: 'job-1',
        cvId: 'cv-1',
      })
      .expect(201);

    const body = response.body as { status: string; matchScore: number };
    expect(body.status).toBe('APPLIED');
    expect(body.matchScore).toBeGreaterThanOrEqual(0);
  });

  it('rejects duplicate apply for same job and candidate', async () => {
    await createRequest()
      .post('/api/applications')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        jobId: 'job-1',
        cvId: 'cv-1',
      })
      .expect(409);
  });

  it('allows candidate to list own applications', async () => {
    const response = await createRequest()
      .get('/api/applications')
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    const body = response.body as { items: Array<{ candidateId: string }> };
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.every((item) => item.candidateId === 'cand-1')).toBe(
      true,
    );
  });

  it('allows recruiter to list applications on own jobs', async () => {
    const response = await createRequest()
      .get('/api/applications')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .expect(200);

    const body = response.body as { items: Array<{ jobId: string }> };
    expect(body.items.some((item) => item.jobId === 'job-1')).toBe(true);
  });

  it('allows recruiter to update application status with valid transition', async () => {
    const response = await createRequest()
      .patch('/api/applications/app-1/status')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        status: 'REVIEWING',
      })
      .expect(200);

    const body = response.body as { status: string };
    expect(body.status).toBe('REVIEWING');
  });

  it('blocks invalid recruiter status transition', async () => {
    await createRequest()
      .patch('/api/applications/app-1/status')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        status: 'APPLIED',
      })
      .expect(400);
  });

  it('rejects dashboard stats without bearer token', async () => {
    await createRequest().get('/api/dashboard/stats').expect(401);
  });

  it('returns candidate dashboard stats', async () => {
    const response = await createRequest()
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${candidateToken}`)
      .expect(200);

    const body = response.body as {
      totalApplications: number;
      pendingApplications: number;
      interviewCount: number;
    };
    expect(body.totalApplications).toBeGreaterThanOrEqual(0);
    expect(body.pendingApplications).toBeGreaterThanOrEqual(0);
    expect(body.interviewCount).toBeGreaterThanOrEqual(0);
  });

  it('returns recruiter dashboard stats', async () => {
    const response = await createRequest()
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .expect(200);

    const body = response.body as {
      totalJobs: number;
      activeJobs: number;
      totalApplications: number;
      pendingReview: number;
    };
    expect(body.totalJobs).toBeGreaterThanOrEqual(0);
    expect(body.activeJobs).toBeGreaterThanOrEqual(0);
    expect(body.totalApplications).toBeGreaterThanOrEqual(0);
    expect(body.pendingReview).toBeGreaterThanOrEqual(0);
  });

  it('returns admin dashboard stats', async () => {
    const response = await createRequest()
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const body = response.body as {
      totalUsers: number;
      totalRecruiters: number;
      totalCandidates: number;
      totalJobs: number;
      totalApplications: number;
    };
    expect(body.totalUsers).toBeGreaterThan(0);
    expect(body.totalRecruiters).toBeGreaterThanOrEqual(0);
    expect(body.totalCandidates).toBeGreaterThanOrEqual(0);
    expect(body.totalJobs).toBeGreaterThanOrEqual(0);
    expect(body.totalApplications).toBeGreaterThanOrEqual(0);
  });

  async function loginAndGetToken(email: string): Promise<string> {
    const response = await createRequest()
      .post('/api/auth/login')
      .send({ email, password: 'password123' })
      .expect(201);
    return (response.body as { accessToken: string }).accessToken;
  }
});
