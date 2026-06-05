import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import type { StringValue } from 'ms';
import {
  ALLOWED_PUBLIC_REGISTRATION_ROLES,
  DEFAULT_BCRYPT_ROUNDS,
  DEFAULT_JWT_EXPIRES_IN,
} from './auth.constants';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SocialLoginDto } from './dto/social-login.dto';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthResponse, AuthUser, JwtPayload } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    if (!ALLOWED_PUBLIC_REGISTRATION_ROLES.includes(dto.role)) {
      throw new BadRequestException(
        'Register only supports CANDIDATE or RECRUITER roles',
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(
      dto.password,
      this.getSaltRounds(),
    );
    let user: AuthUser;
    try {
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          name: dto.name,
          role: dto.role,
          candidates:
            dto.role === UserRole.CANDIDATE ? { create: {} } : undefined,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });
    } catch (error) {
      const maybeError = error as {
        code?: string;
        meta?: { target?: unknown };
      };
      const target = maybeError.meta?.target;
      const targetHasEmail =
        !Array.isArray(target) || target.some((entry) => entry === 'email');

      if (maybeError.code === 'P2002' && targetHasEmail) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(dto.password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResponse({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  }

  async socialLogin(dto: SocialLoginDto): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        deletedAt: true,
      },
    });

    let authUser: AuthUser;

    if (existingUser) {
      if (existingUser.deletedAt) {
        throw new UnauthorizedException('Account has been deactivated');
      }

      const shouldUpdateAvatar =
        !!dto.avatar && existingUser.avatar !== dto.avatar;

      if (shouldUpdateAvatar) {
        const updated = await this.prisma.user.update({
          where: { id: existingUser.id },
          data: { avatar: dto.avatar },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        });
        authUser = updated;
      } else {
        authUser = {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role,
        };
      }
    } else {
      const dummyPassword = randomUUID();
      const dummyPasswordHash = await bcrypt.hash(
        dummyPassword,
        this.getSaltRounds(),
      );

      const role = dto.role as UserRole;
      const created = await this.prisma.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          password: dummyPasswordHash,
          role,
          avatar: dto.avatar,
          candidates:
            role === UserRole.CANDIDATE ? { create: {} } : undefined,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      authUser = created;
    }

    return this.buildAuthResponse(authUser);
  }

  async me(userId: string): Promise<AuthUser> {
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
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private async buildAuthResponse(user: AuthUser): Promise<AuthResponse> {
    const expiresInValue = this.getJwtExpiresIn();
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: expiresInValue,
    });

    return {
      user,
      token: accessToken,
      accessToken,
      expiresIn: this.toSeconds(expiresInValue),
    };
  }

  private getSaltRounds(): number {
    const configured = this.configService.get<string>('BCRYPT_ROUNDS');
    const parsed = Number.parseInt(configured ?? '', 10);

    return Number.isFinite(parsed) && parsed > 0
      ? parsed
      : DEFAULT_BCRYPT_ROUNDS;
  }

  private getJwtExpiresIn(): number | StringValue {
    const configured =
      this.configService.get<string>('JWT_EXPIRES_IN') ??
      DEFAULT_JWT_EXPIRES_IN;
    if (/^\d+$/.test(configured)) {
      return Number.parseInt(configured, 10);
    }

    return configured as StringValue;
  }

  private toSeconds(expiresIn: number | StringValue): number {
    if (typeof expiresIn === 'number') {
      return expiresIn;
    }

    const matched = /^(\d+)([smhd])$/i.exec(expiresIn.trim());
    if (!matched) {
      return 7 * 24 * 60 * 60;
    }

    const value = Number.parseInt(matched[1], 10);
    const unit = matched[2].toLowerCase();

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 7 * 24 * 60 * 60;
    }
  }
}
