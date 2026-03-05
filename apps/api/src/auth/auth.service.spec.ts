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
    };
  };
  let jwtService: { signAsync: jest.Mock };

  beforeEach(async () => {
    prismaService = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
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
          candidate?: { create: Record<string, never> };
        };
      },
    ];
    expect(firstCreateCall[0].data.role).toBe(UserRole.CANDIDATE);
    expect(firstCreateCall[0].data.candidate).toEqual({ create: {} });
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
});
