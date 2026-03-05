import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let usersService: UsersService;
  let prismaService: {
    user: {
      findMany: jest.Mock;
      count: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaService = {
      user: {
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
  });

  it('lists users with pagination', async () => {
    prismaService.user.findMany.mockResolvedValue([
      {
        id: 'u1',
        email: 'admin@example.com',
        name: 'Admin',
        role: UserRole.ADMIN,
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    ]);
    prismaService.user.count.mockResolvedValue(1);

    const response = await usersService.list({ page: 1, limit: 10 });
    expect(response.pagination.totalItems).toBe(1);
    expect(response.items).toHaveLength(1);
  });

  it('blocks self delete', async () => {
    await expect(
      usersService.softDelete('same-id', 'same-id'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws not found for missing user on getById', async () => {
    prismaService.user.findFirst.mockResolvedValue(null);
    await expect(usersService.getById('missing-user')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
