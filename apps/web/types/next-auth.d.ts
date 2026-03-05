import { DefaultSession } from 'next-auth';
import { UserRole } from '@/lib/api-client';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      role?: UserRole;
    };
    accessToken?: string;
  }

  interface User {
    id: string;
    role?: UserRole;
    accessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    role?: UserRole;
    accessToken?: string;
  }
}

export {};
