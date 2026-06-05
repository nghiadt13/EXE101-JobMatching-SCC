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
        candidates: {
          select: {
            phone: true,
            location: true,
            bio: true,
          },
          take: 1,
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
              phone: user.candidates[0]?.phone ?? null,
              location:
                (user.candidates[0]?.location as Record<
                  string,
                  unknown
                > | null) ?? null,
              bio: user.candidates[0]?.bio ?? null,
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
        candidates: {
          select: { id: true },
          take: 1,
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
      if (existing.candidates.length === 0) {
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
