import type { ReactNode } from 'react';
import Link from 'next/link';
import { SignOutButton } from './sign-out-button';
import { MobileNav } from './mobile-nav';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/ui/breadcrumbs';
import { getNavForRole, getNavIcon, isNavItemActive } from '@/lib/navigation';

type DashboardShellProps = {
  title: string;
  description?: string;
  email?: string | null;
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
  role,
  currentPath,
  breadcrumbs,
  actions,
  children,
}: DashboardShellProps) {
  const navItems = role ? getNavForRole(role) : [];

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      {navItems.length > 0 ? (
        <aside className="hidden w-[240px] shrink-0 border-r border-zinc-200 bg-white lg:block">
          <div className="sticky top-0 flex h-screen flex-col px-3 py-5">
            <Link href="/" className="mb-6 block px-3">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
                HR Platform
              </p>
            </Link>
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
                        ? 'bg-zinc-900 text-white'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto border-t border-zinc-200 pt-4">
              <p className="mb-3 truncate px-3 text-xs text-zinc-500">{email ?? 'User'}</p>
              <SignOutButton />
            </div>
          </div>
        </aside>
      ) : null}

      {/* Main Content */}
      <main className="relative flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* Mobile Header */}
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <Link href="/">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
                HR Platform
              </p>
            </Link>
            <div className="flex items-center gap-2">
              <MobileNav items={navItems} currentPath={currentPath} />
              <SignOutButton />
            </div>
          </div>

          {breadcrumbs ? <Breadcrumbs items={breadcrumbs} className="mb-4" /> : null}

          <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900">{title}</h1>
              {description ? (
                <p className="mt-1 max-w-2xl text-sm text-zinc-600">{description}</p>
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
  );
}
