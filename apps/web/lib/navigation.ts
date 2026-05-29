import {
  Home,
  FileText,
  Briefcase,
  Users,
  UserCircle,
  ClipboardList,
  Heart,
  Settings,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { LEGACY_JOBS_LISTING_ROUTE, PUBLIC_JOBS_LISTING_ROUTE } from './routes';

export type NavIconName =
  | 'home'
  | 'file-text'
  | 'briefcase'
  | 'users'
  | 'user-circle'
  | 'clipboard-list'
  | 'heart'
  | 'settings'
  | 'sparkles';

export type NavItem = {
  label: string;
  href: string;
  iconName: NavIconName;
};

export const candidateNav: NavItem[] = [
  { label: 'Tổng quan', href: '/dashboard/candidate', iconName: 'home' },
  { label: 'CV của tôi', href: '/dashboard/candidate/cvs', iconName: 'file-text' },
  { label: 'Đơn ứng tuyển', href: '/dashboard/candidate/applications', iconName: 'clipboard-list' },
  { label: 'Tìm việc thông minh', href: '/dashboard/candidate/recommendations', iconName: 'sparkles' },
  { label: 'Tìm việc làm', href: PUBLIC_JOBS_LISTING_ROUTE, iconName: 'briefcase' },
  { label: 'Hồ sơ', href: '/dashboard/profile', iconName: 'user-circle' },
];

export const recruiterNav: NavItem[] = [
  { label: 'Tổng quan', href: '/dashboard/recruiter', iconName: 'home' },
  { label: 'Việc làm', href: '/dashboard/recruiter/jobs', iconName: 'briefcase' },
  { label: 'Đơn ứng tuyển', href: '/dashboard/recruiter/applications', iconName: 'clipboard-list' },
  { label: 'Hồ sơ', href: '/dashboard/profile', iconName: 'user-circle' },
];

export const adminNav: NavItem[] = [
  { label: 'Tổng quan', href: '/dashboard/admin', iconName: 'home' },
  { label: 'Người dùng', href: '/dashboard/admin/users', iconName: 'users' },
  { label: 'Hồ sơ', href: '/dashboard/profile', iconName: 'user-circle' },
];

const navIcons: Record<NavIconName, LucideIcon> = {
  home: Home,
  'file-text': FileText,
  briefcase: Briefcase,
  users: Users,
  'user-circle': UserCircle,
  'clipboard-list': ClipboardList,
  heart: Heart,
  settings: Settings,
  sparkles: Sparkles,
};

const DASHBOARD_ROOT_PATHS = new Set([
  '/dashboard/candidate',
  '/dashboard/recruiter',
  '/dashboard/admin',
]);

export function getNavIcon(iconName: NavIconName): LucideIcon {
  return navIcons[iconName];
}

export function getNavForRole(role: string): NavItem[] {
  switch (role) {
    case 'CANDIDATE':
      return candidateNav;
    case 'RECRUITER':
      return recruiterNav;
    case 'ADMIN':
      return adminNav;
    default:
      return [];
  }
}

/**
 * Returns true when a nav item should be considered active for the given currentPath.
 * Handles exact matches and prefix matches. The public jobs listing route treats
 * both `/` and legacy `/jobs` paths as active.
 */
export function isNavItemActive(itemHref: string, currentPath: string | undefined): boolean {
  if (!currentPath) return false;

  if (itemHref === PUBLIC_JOBS_LISTING_ROUTE) {
    return (
      currentPath === PUBLIC_JOBS_LISTING_ROUTE
      || currentPath.startsWith('/?')
      || currentPath === LEGACY_JOBS_LISTING_ROUTE
      || currentPath.startsWith(`${LEGACY_JOBS_LISTING_ROUTE}/`)
      || currentPath.startsWith(`${LEGACY_JOBS_LISTING_ROUTE}?`)
    );
  }

  if (DASHBOARD_ROOT_PATHS.has(itemHref)) {
    return currentPath === itemHref || currentPath.startsWith(`${itemHref}?`);
  }

  if (currentPath === itemHref) return true;
  // All nav items that have a meaningful sub-route hierarchy match by prefix.
  // This includes /jobs and /jobs/[slug].
  return currentPath.startsWith(itemHref + '/') || currentPath.startsWith(itemHref + '?');
}

