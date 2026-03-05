import { UserRole } from '@prisma/client';

export interface ProfileView {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string | null;
  candidate: {
    phone: string | null;
    location: Record<string, unknown> | null;
    bio: string | null;
  } | null;
}
