import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserView, UsersListResponse } from './users.types';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: QueryUsersDto): Promise<UsersListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = this.buildWhere(query);

    const [items, totalItems] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: this.userViewSelect,
      }),
      this.prisma.user.count({ where }),
    ]);

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
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
      select: this.userViewSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserView> {
    await this.ensureActiveUser(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.avatar !== undefined ? { avatar: dto.avatar } : {}),
        ...(dto.role !== undefined ? { role: dto.role } : {}),
      },
      select: this.userViewSelect,
    });

    return user;
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
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    } satisfies Prisma.UserSelect;
  }
}
