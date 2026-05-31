import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  let profileService: ProfileService;
  let prismaService: {
    user: {
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    candidate: {
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaService = {
      user: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      candidate: {
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    profileService = module.get<ProfileService>(ProfileService);
  });

  it('returns candidate profile payload', async () => {
    prismaService.user.findFirst.mockResolvedValue({
      id: 'candidate-1',
      email: 'candidate@example.com',
      name: 'Candidate',
      role: UserRole.CANDIDATE,
      avatar: null,
      candidates: [
        {
          phone: '0909',
          location: { city: 'HCM' },
          bio: 'bio',
        },
      ],
    });

    const profile = await profileService.getProfile('candidate-1');
    expect(profile.candidate?.phone).toBe('0909');
  });

  it('throws when profile not found', async () => {
    prismaService.user.findFirst.mockResolvedValue(null);
    await expect(profileService.getProfile('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
