import { UserRole } from '@prisma/client';

export const ALLOWED_PUBLIC_REGISTRATION_ROLES: UserRole[] = [
  UserRole.CANDIDATE,
  UserRole.RECRUITER,
];

export const DEFAULT_BCRYPT_ROUNDS = 10;
export const DEFAULT_JWT_EXPIRES_IN = '7d';
