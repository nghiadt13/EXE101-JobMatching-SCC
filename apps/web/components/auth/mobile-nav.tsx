'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { getNavIcon, isNavItemActive, type NavItem } from '@/lib/navigation';

type MobileNavProps = {
  items: NavItem[];
  currentPath?: string;
};

export function MobileNav({ items, currentPath }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  if (!items.length) return null;

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded-lg border border-zinc-300 p-2 text-zinc-600 transition-colors hover:bg-zinc-100"
        aria-label={open ? 'Close navigation' : 'Open navigation'}
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {open ? (
        <nav className="absolute left-0 right-0 z-40 mt-2 border-b border-zinc-200 bg-white p-3 shadow-lg">
          <div className="mx-auto max-w-5xl space-y-0.5">
            {items.map((item) => {
              const Icon = getNavIcon(item.iconName);
              const isActive = isNavItemActive(item.href, currentPath);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
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
          </div>
        </nav>
      ) : null}
    </div>
  );
}
