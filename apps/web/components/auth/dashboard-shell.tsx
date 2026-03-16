import type { ReactNode } from 'react';
import Link from 'next/link';
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
    <div className="min-h-screen bg-gray-50 text-slate-900">
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
          <aside className="hidden w-[240px] shrink-0 border-r border-primary-100 bg-white lg:block">
            <div className="sticky top-20 flex h-[calc(100vh-5rem)] flex-col px-3 py-5">
              {isRecruiter ? (
                <div className="mb-4 flex items-center gap-2 px-3">
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
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary-600 text-white'
                          : 'text-slate-600 hover:bg-primary-50 hover:text-primary-700'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-auto border-t border-primary-100 pt-4">
                <p className="mb-3 truncate px-3 text-xs text-slate-500">{email ?? 'User'}</p>
                <SignOutButton />
              </div>
            </div>
          </aside>
        ) : null}

        <main className="relative flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mb-4 flex items-center justify-end gap-2 lg:hidden">
              <MobileNav items={navItems} currentPath={currentPath} />
              <SignOutButton />
            </div>

            {breadcrumbs ? <Breadcrumbs items={breadcrumbs} className="mb-4" /> : null}

            <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
                {description ? (
                  <p className="mt-1 max-w-2xl text-sm text-slate-600">{description}</p>
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
