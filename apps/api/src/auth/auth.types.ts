import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  planName: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  accessToken: string;
  expiresIn: number;
}
