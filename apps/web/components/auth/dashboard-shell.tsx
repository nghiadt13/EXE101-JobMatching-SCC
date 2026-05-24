import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SignOutButton } from './sign-out-button';
import { MobileNav } from './mobile-nav';
import { SiteHeader } from '@/components/layout/site-header';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/ui/breadcrumbs';
import { getNavForRole, getNavIcon, isNavItemActive } from '@/lib/navigation';

type DashboardShellProps = {
  title: string;
  description?: string;
  email?: string | null;
  userName?: string | null;
  userAvatarUrl?: string | null;
  role?: string;
  currentPath?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  children?: ReactNode;
};

export function DashboardShell({
  title,
  description,
  email,
  userName,
  userAvatarUrl,
  role,
  currentPath,
  breadcrumbs,
  actions,
  children,
}: DashboardShellProps) {
  const navItems = role ? getNavForRole(role) : [];
  const isRecruiter = role === 'RECRUITER';
  const resolvedUserName =
    userName?.trim() ||
    (email?.includes('@') ? email.split('@')[0] : email?.trim()) ||
    'User';

  return (
    <div className="min-h-screen bg-md-background text-md-on-background">
      <SiteHeader
        isAuthenticated
        role={role}
        user={{
          name: resolvedUserName,
          email,
          avatarUrl: userAvatarUrl,
          planName: isRecruiter ? 'Recruiter' : 'Member',
        }}
      />
      <div className="flex">
        {navItems.length > 0 ? (
          <aside className="hidden w-[256px] shrink-0 border-r border-md-outline-variant/30 bg-md-surface lg:flex lg:flex-col">
            <div className="flex h-full flex-col px-4 py-6 gap-1">
              {/* User Profile Section */}
              <div className="flex items-center gap-3 px-3 pb-5 mb-2">
                {userAvatarUrl ? (
                  <Image
                    src={userAvatarUrl}
                    alt={resolvedUserName}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full border-2 border-md-surface-container-highest object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-md-surface-container-highest bg-md-primary-container text-md-on-primary font-semibold text-lg">
                    {resolvedUserName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-md-on-surface">{resolvedUserName}</div>
                  <div className="truncate text-xs text-md-on-surface-variant">
                    {role === 'CANDIDATE' ? 'Candidate' : role === 'RECRUITER' ? 'Recruiter' : 'Admin'}
                  </div>
                </div>
              </div>

              {/* Navigation */}
              {isRecruiter ? (
                <div className="mb-3 flex items-center gap-2 px-3">
                  <span className="recruiter-sidebar-badge">
                    <i className="fa-solid fa-building-columns text-[8px]" /> HR Portal
                  </span>
                </div>
              ) : null}
              <nav className="flex-1 space-y-0.5" aria-label="Dashboard navigation">
                {navItems.map((item) => {
                  const Icon = getNavIcon(item.iconName);
                  const isActive = isNavItemActive(item.href, currentPath);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-md-surface-container-high text-md-primary'
                          : 'text-md-on-surface-variant hover:bg-md-surface-container-low hover:text-md-on-surface'
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-auto border-t border-md-outline-variant/30 pt-4">
                <p className="mb-3 truncate px-3 text-xs text-md-on-surface-variant">{email ?? 'User'}</p>
                <SignOutButton />
              </div>
            </div>
          </aside>
        ) : null}

        <main className="relative flex-1 overflow-x-hidden">
          <div className="max-w-7xl px-4 py-6 sm:px-6 lg:px-6 lg:py-8">
            <div className="mb-4 flex items-center justify-end gap-2 lg:hidden">
              <MobileNav items={navItems} currentPath={currentPath} />
              <SignOutButton />
            </div>

            {breadcrumbs ? <Breadcrumbs items={breadcrumbs} className="mb-4" /> : null}

            <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-md-on-surface">{title}</h1>
                {description ? (
                  <p className="mt-1 max-w-2xl text-sm text-md-on-surface-variant">{description}</p>
                ) : null}
              </div>
              {actions ? (
                <div className="flex flex-wrap items-center gap-2">{actions}</div>
              ) : null}
            </header>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
