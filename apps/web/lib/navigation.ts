import {
  Home,
  FileText,
  Briefcase,
  Users,
  UserCircle,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react';

export type NavIconName =
  | 'home'
  | 'file-text'
  | 'briefcase'
  | 'users'
  | 'user-circle'
  | 'clipboard-list';

export type NavItem = {
  label: string;
  href: string;
  iconName: NavIconName;
};

export const candidateNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard/candidate', iconName: 'home' },
  { label: 'My CVs', href: '/dashboard/candidate/cvs', iconName: 'file-text' },
  { label: 'Applications', href: '/dashboard/candidate/applications', iconName: 'clipboard-list' },
  { label: 'Browse Jobs', href: '/jobs', iconName: 'briefcase' },
  { label: 'Profile', href: '/dashboard/profile', iconName: 'user-circle' },
];

export const recruiterNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard/recruiter', iconName: 'home' },
  { label: 'Jobs', href: '/dashboard/recruiter/jobs', iconName: 'briefcase' },
  { label: 'Applications', href: '/dashboard/recruiter/applications', iconName: 'clipboard-list' },
  { label: 'Profile', href: '/dashboard/profile', iconName: 'user-circle' },
];

export const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard/admin', iconName: 'home' },
  { label: 'Users', href: '/dashboard/admin/users', iconName: 'users' },
  { label: 'Profile', href: '/dashboard/profile', iconName: 'user-circle' },
];

const navIcons: Record<NavIconName, LucideIcon> = {
  home: Home,
  'file-text': FileText,
  briefcase: Briefcase,
  users: Users,
  'user-circle': UserCircle,
  'clipboard-list': ClipboardList,
};

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
 * Handles exact matches and prefix matches. The /jobs item is treated as a prefix
 * root so /jobs/[slug] also activates it.
 */
export function isNavItemActive(itemHref: string, currentPath: string | undefined): boolean {
  if (!currentPath) return false;
  if (currentPath === itemHref) return true;
  // All nav items that have a meaningful sub-route hierarchy match by prefix.
  // This includes /jobs and /jobs/[slug].
  return currentPath.startsWith(itemHref + '/') || currentPath.startsWith(itemHref + '?');
}

