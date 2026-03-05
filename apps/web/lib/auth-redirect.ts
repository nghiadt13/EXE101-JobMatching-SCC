import { UserRole } from './api-client';

export function getRoleDashboardPath(role?: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return '/dashboard/admin';
    case 'RECRUITER':
      return '/dashboard/recruiter';
    case 'CANDIDATE':
      return '/dashboard/candidate';
    default:
      return '/dashboard';
  }
}
