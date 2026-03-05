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
  deletedAt: Date | null;
};

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let users: MockUser[];
  let createRequest: () => ReturnType<typeof request>;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.NODE_ENV = 'test';

    users = [
      {
        id: 'admin-1',
        email: 'admin@example.com',
        password: await bcrypt.hash('password123', 10),
        name: 'Admin User',
        role: UserRole.ADMIN,
        deletedAt: null,
      },
    ];

    const prismaMock = {
      user: {
        findUnique: jest.fn(async ({ where }: { where: { email: string } }) => {
          return Promise.resolve(
            users.find((user) => user.email === where.email) ?? null,
          );
        }),
        findFirst: jest.fn(
          ({ where }: { where: { id: string; deletedAt: null } }) => {
            const user = users.find(
              (item) =>
                item.id === where.id && item.deletedAt === where.deletedAt,
            );
            if (!user) {
              return Promise.resolve(null);
            }

            return Promise.resolve({
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            });
          },
        ),
        create: jest.fn(
          ({ data }: { data: Omit<MockUser, 'id' | 'deletedAt'> }) => {
            const created: MockUser = {
              id: `user-${users.length + 1}`,
              email: data.email,
              password: data.password,
              name: data.name,
              role: data.role,
              deletedAt: null,
            };
            users.push(created);

            return Promise.resolve({
              id: created.id,
              email: created.email,
              name: created.name,
              role: created.role,
            });
          },
        ),
        count: jest.fn(() => Promise.resolve(users.length)),
      },
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
});
