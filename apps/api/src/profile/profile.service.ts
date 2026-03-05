import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileView } from './profile.types';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string): Promise<ProfileView> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        candidate: {
          select: {
            phone: true,
            location: true,
            bio: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Profile not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      candidate:
        user.role === UserRole.CANDIDATE
          ? {
              phone: user.candidate?.phone ?? null,
              location:
                (user.candidate?.location as Record<string, unknown> | null) ??
                null,
              bio: user.candidate?.bio ?? null,
            }
          : null,
    };
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<ProfileView> {
    const existing = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        role: true,
        candidate: {
          select: { id: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Profile not found');
    }

    if (dto.name !== undefined || dto.avatar !== undefined) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.avatar !== undefined ? { avatar: dto.avatar } : {}),
        },
      });
    }

    if (
      existing.role === UserRole.CANDIDATE &&
      (dto.phone !== undefined ||
        dto.location !== undefined ||
        dto.bio !== undefined)
    ) {
      if (!existing.candidate) {
        throw new NotFoundException('Candidate profile not found');
      }

      await this.prisma.candidate.update({
        where: { userId },
        data: {
          ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
          ...(dto.location !== undefined
            ? { location: dto.location as Prisma.InputJsonValue }
            : {}),
          ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
        },
      });
    }

    return this.getProfile(userId);
  }
}
