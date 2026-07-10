import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  UserView,
  UsersListResponse,
  AdminUserDetailResponse,
} from './users.types';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: QueryUsersDto): Promise<UsersListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = this.buildWhere(query);

    const [rawItems, totalItems] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: this.userViewSelect,
      }),
      this.prisma.user.count({ where }),
    ]);

    const items: UserView[] = rawItems.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      avatar: u.avatar,
      planName: u.planName,
      lastLoginAt: u.lastLoginAt,
      transactionCount: u._count.transactions,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      deletedAt: u.deletedAt,
    }));

    return {
      items,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / limit)),
      },
    };
  }

  async getById(id: string, includeDeleted?: boolean): Promise<UserView> {
    const raw = await this.prisma.user.findFirst({
      where: {
        id,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
      select: this.userViewSelect,
    });

    if (!raw) {
      throw new NotFoundException('User not found');
    }

    return {
      id: raw.id,
      email: raw.email,
      name: raw.name,
      role: raw.role,
      avatar: raw.avatar,
      planName: raw.planName,
      lastLoginAt: raw.lastLoginAt,
      transactionCount: raw._count.transactions,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    };
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserView> {
    await this.ensureActiveUser(id);

    const raw = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.avatar !== undefined ? { avatar: dto.avatar } : {}),
        ...(dto.role !== undefined ? { role: dto.role } : {}),
      },
      select: this.userViewSelect,
    });

    return {
      id: raw.id,
      email: raw.email,
      name: raw.name,
      role: raw.role,
      avatar: raw.avatar,
      planName: raw.planName,
      lastLoginAt: raw.lastLoginAt,
      transactionCount: raw._count.transactions,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    };
  }

  async softDelete(
    id: string,
    currentUserId: string,
  ): Promise<{ success: true }> {
    if (id === currentUserId) {
      throw new BadRequestException('You cannot delete your own account');
    }

    await this.ensureActiveUser(id);
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  async getDetail(id: string): Promise<AdminUserDetailResponse> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        planName: true,
        createdAt: true,
        lastLoginAt: true,
        candidates: {
          select: {
            cvs: {
              where: { deletedAt: null },
              orderBy: { createdAt: 'desc' as const },
              select: {
                id: true,
                fileName: true,
                fileSize: true,
                mimeType: true,
                source: true,
                isPrimary: true,
                createdAt: true,
              },
            },
          },
        },
        transactions: {
          orderBy: { createdAt: 'desc' as const },
          select: {
            id: true,
            amount: true,
            planName: true,
            orderCode: true,
            status: true,
            paymentMethod: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Calculate total usage days
    const now = new Date();
    const totalUsageDays = Math.floor(
      (now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      planName: user.planName,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      totalUsageDays,
      cvs: user.candidates[0]?.cvs ?? [],
      transactions: user.transactions,
    };
  }

  private async ensureActiveUser(id: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  private buildWhere(query: QueryUsersDto): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};

    if (!query.includeDeleted) {
      where.deletedAt = null;
    }

    if (query.role) {
      where.role = query.role;
    }

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private get userViewSelect() {
    return {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
      planName: true,
      lastLoginAt: true,
      _count: {
        select: {
          transactions: true,
        },
      },
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    } satisfies Prisma.UserSelect;
  }
}
