import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
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

describe('Auth and User/Profile (e2e)', () => {
  let app: INestApplication;
  let users: MockUser[];
  let candidates: MockCandidate[];
  let createRequest: () => ReturnType<typeof request>;
  let adminToken = '';
  let recruiterToken = '';
  let candidateToken = '';
  let cvs: MockCv[];

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
            });
          },
        ),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn((callback: (tx: unknown) => unknown) =>
        callback({
          cV: {
            update: jest.fn(),
            findFirst: jest.fn(),
            updateMany: jest.fn(),
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

  async function loginAndGetToken(email: string): Promise<string> {
    const response = await createRequest()
      .post('/api/auth/login')
      .send({ email, password: 'password123' })
      .expect(201);
    return (response.body as { accessToken: string }).accessToken;
  }
});
