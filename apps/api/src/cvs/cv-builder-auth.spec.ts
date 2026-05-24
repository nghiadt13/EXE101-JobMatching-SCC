import {
  ForbiddenException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import request from 'supertest';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import type { JwtPayload } from '../auth/auth.types';
import { buildErrorPayload } from '../common/errors/api-error-envelope';
import { ERROR_CODES } from '../common/errors/error-codes';
import { CvsController } from './cvs.controller';
import { CvsService } from './cvs.service';
import { CvSuggestionService } from './services/cv-suggestion.service';

/**
 * Integration tests for the auth + validation boundary on
 * `PUT /cvs/:id/builder`.
 *
 * Approach:
 *   We boot a focused NestJS testing module containing the real
 *   `CvsController` together with the *real* `JwtAuthGuard`,
 *   `RolesGuard`, `JwtStrategy`, `JwtModule`, and `PassportModule`,
 *   plus the same global `ValidationPipe` configuration that
 *   `apps/api/src/main.ts` installs in production. This lets us
 *   exercise auth + DTO validation through real HTTP via Supertest,
 *   while mocking `CvsService` so we don't need a database or
 *   surrounding modules. The mocked service simulates ownership the
 *   same way the real one does — by throwing `ForbiddenException`
 *   for non-owners.
 *
 * Validates: Requirements 7.8, 11.3, 11.4, 11.5
 */
describe('CvsController PUT /cvs/:id/builder — auth & validation boundary', () => {
  const JWT_SECRET = 'test-jwt-secret-for-cv-builder-auth';
  const CANDIDATE_A_ID = 'user-candidate-a';
  const CANDIDATE_B_ID = 'user-candidate-b';
  const CV_ID = 'cv-belongs-to-A';

  let app: INestApplication;
  let jwtService: JwtService;
  let cvsService: { updateBuilderCv: jest.Mock };

  const validCvBody = {
    templateId: 'simple',
    profile: { name: 'Test User' },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
  };

  const validTokens = {
    fontFamily: 'Inter, sans-serif',
    fontSize: 12,
    lineHeight: 1.5,
    primaryColor: '#0f172a',
    pageMargin: 40,
  };

  const signCandidateToken = (userId: string): string =>
    jwtService.sign({
      sub: userId,
      email: `${userId}@example.com`,
      role: UserRole.CANDIDATE,
    } satisfies JwtPayload);

  beforeAll(async () => {
    cvsService = {
      updateBuilderCv: jest.fn(
        async (userId: string, cvId: string): Promise<unknown> => {
          // Simulate the real service's ownership check.
          if (userId !== CANDIDATE_A_ID || cvId !== CV_ID) {
            throw new ForbiddenException(
              buildErrorPayload(
                ERROR_CODES.forbidden,
                'You do not have permission to access this CV',
              ),
            );
          }
          return {
            id: cvId,
            fileName: 'Test User - CV',
            fileSize: 0,
            mimeType: 'application/json',
            parsedData: {},
            skills: [],
            parseStatus: 'parsed_ok',
            normalizedProfile: null,
            candidateProfile: null,
            candidateProfileVersion: null,
            parseTelemetry: null,
            source: 'builder',
            templateId: 'simple',
            isPrimary: true,
            createdAt: new Date('2026-03-23T00:00:00.000Z'),
            updatedAt: new Date('2026-03-23T00:00:00.000Z'),
          };
        },
      ),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              JWT_SECRET,
              JWT_EXPIRES_IN: '1h',
            }),
          ],
        }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: JWT_SECRET,
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [CvsController],
      providers: [
        Reflector,
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
        { provide: CvsService, useValue: cvsService },
        { provide: CvSuggestionService, useValue: { suggest: jest.fn() } },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    jwtService = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    cvsService.updateBuilderCv.mockClear();
  });

  // Requirement 11.3: requests must carry a valid bearer token.
  it('returns 401 when no Authorization header is present', async () => {
    await request(app.getHttpServer())
      .put(`/api/cvs/${CV_ID}/builder`)
      .send({ ...validCvBody, designTokens: validTokens })
      .expect(401);

    expect(cvsService.updateBuilderCv).not.toHaveBeenCalled();
  });

  // Requirement 11.4: an authenticated user who does not own the CV is rejected with 403.
  it('returns 403 when the authenticated user does not own the CV', async () => {
    const tokenForCandidateB = signCandidateToken(CANDIDATE_B_ID);

    await request(app.getHttpServer())
      .put(`/api/cvs/${CV_ID}/builder`)
      .set('Authorization', `Bearer ${tokenForCandidateB}`)
      .send({ ...validCvBody, designTokens: validTokens })
      .expect(403);

    // The controller did reach the service (auth passed), but ownership failed.
    expect(cvsService.updateBuilderCv).toHaveBeenCalledTimes(1);
    expect(cvsService.updateBuilderCv).toHaveBeenCalledWith(
      CANDIDATE_B_ID,
      CV_ID,
      expect.any(Object),
    );
  });

  // Requirements 7.8 + 11.5: ValidationPipe rejects out-of-range tokens with 400.
  it('returns 400 when designTokens.fontSize is out of the allowed range', async () => {
    const tokenForCandidateA = signCandidateToken(CANDIDATE_A_ID);

    await request(app.getHttpServer())
      .put(`/api/cvs/${CV_ID}/builder`)
      .set('Authorization', `Bearer ${tokenForCandidateA}`)
      .send({
        ...validCvBody,
        designTokens: { ...validTokens, fontSize: 99 },
      })
      .expect(400);

    // Validation must short-circuit before the service is called.
    expect(cvsService.updateBuilderCv).not.toHaveBeenCalled();
  });

  // Happy path: authenticated owner with valid in-range tokens succeeds.
  it('returns 200 when the owner submits valid in-range tokens', async () => {
    const tokenForCandidateA = signCandidateToken(CANDIDATE_A_ID);

    const response = await request(app.getHttpServer())
      .put(`/api/cvs/${CV_ID}/builder`)
      .set('Authorization', `Bearer ${tokenForCandidateA}`)
      .send({ ...validCvBody, designTokens: validTokens })
      .expect(200);

    expect(response.body).toMatchObject({ id: CV_ID, templateId: 'simple' });
    expect(cvsService.updateBuilderCv).toHaveBeenCalledTimes(1);
    const [actorId, cvId, dto] = cvsService.updateBuilderCv.mock.calls[0];
    expect(actorId).toBe(CANDIDATE_A_ID);
    expect(cvId).toBe(CV_ID);
    expect((dto as { designTokens: unknown }).designTokens).toEqual(
      validTokens,
    );
  });
});
