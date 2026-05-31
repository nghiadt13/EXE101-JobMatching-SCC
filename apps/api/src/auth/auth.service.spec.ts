import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: {
    user: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let jwtService: { signAsync: jest.Mock };

  beforeEach(async () => {
    prismaService = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'JWT_EXPIRES_IN') {
                return '7d';
              }
              if (key === 'BCRYPT_ROUNDS') {
                return '10';
              }
              return undefined;
            },
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('registers candidate and auto creates candidate profile', async () => {
    prismaService.user.findUnique.mockResolvedValue(null);
    prismaService.user.create.mockResolvedValue({
      id: 'u-1',
      email: 'candidate@example.com',
      name: 'Candidate User',
      role: UserRole.CANDIDATE,
    });

    const result = await authService.register({
      email: 'candidate@example.com',
      password: 'password123',
      name: 'Candidate User',
      role: UserRole.CANDIDATE,
    });

    const firstCreateCall = prismaService.user.create.mock.calls[0] as [
      {
        data: {
          role: UserRole;
          candidates?: { create: Record<string, never> };
        };
      },
    ];
    expect(firstCreateCall[0].data.role).toBe(UserRole.CANDIDATE);
    expect(firstCreateCall[0].data.candidates).toEqual({ create: {} });
    expect(result).toMatchObject({
      user: {
        id: 'u-1',
        email: 'candidate@example.com',
        role: UserRole.CANDIDATE,
      },
      token: 'signed-jwt-token',
      accessToken: 'signed-jwt-token',
      expiresIn: 604800,
    });
  });

  it('rejects register when email already exists', async () => {
    prismaService.user.findUnique.mockResolvedValue({ id: 'existing-user' });

    await expect(
      authService.register({
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing',
        role: UserRole.CANDIDATE,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('maps unique constraint race to conflict', async () => {
    prismaService.user.findUnique.mockResolvedValue(null);
    prismaService.user.create.mockRejectedValue({
      code: 'P2002',
      meta: { target: ['email'] },
    });

    await expect(
      authService.register({
        email: 'race@example.com',
        password: 'password123',
        name: 'Race User',
        role: UserRole.CANDIDATE,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects public admin registration', async () => {
    await expect(
      authService.register({
        email: 'admin@example.com',
        password: 'password123',
        name: 'Admin',
        role: UserRole.ADMIN,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('logs in with valid credentials', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    prismaService.user.findUnique.mockResolvedValue({
      id: 'u-2',
      email: 'recruiter@example.com',
      password: hashedPassword,
      name: 'Recruiter User',
      role: UserRole.RECRUITER,
      deletedAt: null,
    });

    const result = await authService.login({
      email: 'recruiter@example.com',
      password: 'password123',
    });

    expect(result.user).toEqual({
      id: 'u-2',
      email: 'recruiter@example.com',
      name: 'Recruiter User',
      role: UserRole.RECRUITER,
    });
  });

  it('fails login for missing user', async () => {
    prismaService.user.findUnique.mockResolvedValue(null);

    await expect(
      authService.login({
        email: 'unknown@example.com',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns current user for me', async () => {
    prismaService.user.findFirst.mockResolvedValue({
      id: 'u-3',
      email: 'admin@example.com',
      name: 'Admin User',
      role: UserRole.ADMIN,
    });

    await expect(authService.me('u-3')).resolves.toEqual({
      id: 'u-3',
      email: 'admin@example.com',
      name: 'Admin User',
      role: UserRole.ADMIN,
    });
  });

  describe('socialLogin', () => {
    const baseGoogleDto = {
      email: 'new-candidate@example.com',
      name: 'New Candidate',
      avatar: 'https://example.com/avatar.png',
      provider: 'google' as const,
      providerId: 'google-oauth-id-123',
      role: 'CANDIDATE' as const,
    };

    it('creates a new CANDIDATE user with an empty Candidate profile (Google)', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue({
        id: 'social-1',
        email: baseGoogleDto.email,
        name: baseGoogleDto.name,
        role: UserRole.CANDIDATE,
      });

      const result = await authService.socialLogin(baseGoogleDto);

      const [createCall] = prismaService.user.create.mock.calls as [
        [
          {
            data: {
              email: string;
              name: string;
              role: UserRole;
              password: string;
              avatar?: string;
              candidates?: { create: Record<string, never> };
            };
          },
        ],
      ];
      expect(createCall[0].data.email).toBe(baseGoogleDto.email);
      expect(createCall[0].data.name).toBe(baseGoogleDto.name);
      expect(createCall[0].data.role).toBe(UserRole.CANDIDATE);
      expect(createCall[0].data.avatar).toBe(baseGoogleDto.avatar);
      expect(createCall[0].data.candidates).toEqual({ create: {} });
      expect(typeof createCall[0].data.password).toBe('string');
      expect(createCall[0].data.password).not.toBe('');
      // Password must be a bcrypt hash, not plain text
      expect(createCall[0].data.password.startsWith('$2')).toBe(true);

      expect(prismaService.user.update).not.toHaveBeenCalled();
      expect(result.user).toEqual({
        id: 'social-1',
        email: baseGoogleDto.email,
        name: baseGoogleDto.name,
        role: UserRole.CANDIDATE,
      });
      expect(result.accessToken).toBe('signed-jwt-token');
      expect(result.token).toBe('signed-jwt-token');
    });

    it('creates a new RECRUITER user without a Candidate profile (Facebook)', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue({
        id: 'social-2',
        email: 'new-recruiter@example.com',
        name: 'New Recruiter',
        role: UserRole.RECRUITER,
      });

      const result = await authService.socialLogin({
        email: 'new-recruiter@example.com',
        name: 'New Recruiter',
        avatar: 'https://example.com/recruiter.png',
        provider: 'facebook',
        providerId: 'fb-oauth-id-456',
        role: 'RECRUITER',
      });

      const [createCall] = prismaService.user.create.mock.calls as [
        [
          {
            data: {
              role: UserRole;
              candidates?: { create: Record<string, never> };
            };
          },
        ],
      ];
      expect(createCall[0].data.role).toBe(UserRole.RECRUITER);
      expect(createCall[0].data.candidates).toBeUndefined();

      expect(result.user.role).toBe(UserRole.RECRUITER);
    });

    it('auto-links an existing user without checking password and skips avatar update when unchanged', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: 'existing-1',
        email: 'existing@example.com',
        name: 'Existing User',
        role: UserRole.CANDIDATE,
        avatar: 'https://example.com/avatar.png',
        deletedAt: null,
      });

      const result = await authService.socialLogin({
        email: 'existing@example.com',
        name: 'Existing User',
        avatar: 'https://example.com/avatar.png', // same avatar
        provider: 'google',
        providerId: 'google-oauth-id-existing',
        role: 'CANDIDATE',
      });

      expect(prismaService.user.create).not.toHaveBeenCalled();
      expect(prismaService.user.update).not.toHaveBeenCalled();
      expect(result.user).toEqual({
        id: 'existing-1',
        email: 'existing@example.com',
        name: 'Existing User',
        role: UserRole.CANDIDATE,
      });
      expect(result.accessToken).toBe('signed-jwt-token');
    });

    it('updates avatar when an existing user has a different avatar', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: 'existing-2',
        email: 'avatar-change@example.com',
        name: 'Avatar Change',
        role: UserRole.CANDIDATE,
        avatar: 'https://example.com/old-avatar.png',
        deletedAt: null,
      });
      prismaService.user.update.mockResolvedValue({
        id: 'existing-2',
        email: 'avatar-change@example.com',
        name: 'Avatar Change',
        role: UserRole.CANDIDATE,
      });

      const result = await authService.socialLogin({
        email: 'avatar-change@example.com',
        name: 'Avatar Change',
        avatar: 'https://example.com/new-avatar.png',
        provider: 'facebook',
        providerId: 'fb-oauth-id-789',
        role: 'CANDIDATE',
      });

      expect(prismaService.user.update).toHaveBeenCalledTimes(1);
      const [updateCall] = prismaService.user.update.mock.calls as [
        [
          {
            where: { id: string };
            data: { avatar: string };
          },
        ],
      ];
      expect(updateCall[0].where).toEqual({ id: 'existing-2' });
      expect(updateCall[0].data).toEqual({
        avatar: 'https://example.com/new-avatar.png',
      });

      expect(prismaService.user.create).not.toHaveBeenCalled();
      expect(result.user.id).toBe('existing-2');
    });

    it('throws UnauthorizedException when the existing user has been deleted', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: 'deleted-1',
        email: 'deleted@example.com',
        name: 'Deleted User',
        role: UserRole.CANDIDATE,
        avatar: null,
        deletedAt: new Date('2025-01-01T00:00:00Z'),
      });

      await expect(
        authService.socialLogin({
          email: 'deleted@example.com',
          name: 'Deleted User',
          avatar: 'https://example.com/x.png',
          provider: 'google',
          providerId: 'google-oauth-id-deleted',
          role: 'CANDIDATE',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(prismaService.user.create).not.toHaveBeenCalled();
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });

    it.each([
      ['google' as const, 'google-id-1'],
      ['facebook' as const, 'fb-id-1'],
    ])(
      'accepts %s as a valid provider when registering a new user',
      async (provider, providerId) => {
        prismaService.user.findUnique.mockResolvedValue(null);
        prismaService.user.create.mockResolvedValue({
          id: `user-${provider}`,
          email: `${provider}@example.com`,
          name: `${provider} User`,
          role: UserRole.CANDIDATE,
        });

        const result = await authService.socialLogin({
          email: `${provider}@example.com`,
          name: `${provider} User`,
          avatar: undefined,
          provider,
          providerId,
          role: 'CANDIDATE',
        });

        expect(result.user.id).toBe(`user-${provider}`);
        expect(prismaService.user.create).toHaveBeenCalledTimes(1);
      },
    );
  });
});
