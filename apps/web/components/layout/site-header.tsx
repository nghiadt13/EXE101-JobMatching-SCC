'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { signOut } from 'next-auth/react';
import { SCCBrandLogo } from './brand-mark';

const FALLBACK_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDJWS7D-glrmKnFu1VhcuuzOu_7JGrK2arpYsJhWT1gTvdQviF_WOQofU7PVeH7WcAnTep-bGy3eDxC-u5JWJ6btQ_PpU8N7RLp6ze8iuUAyxMNaPvh7vsNqNncmWtgpXqIkFfN-CwD9wvu3QBjNDz0P-aYmdSzPgd5pPKYsFLSoGF3ETtkfmQJmnIBQiJXzHR3C5WIeRcyyfW5do8LWB-YCjSE7LC6BWr8-hHiTUWfuLW5jH4sd6yFney9N9Bx4mjD9jH2lhNszDE';

type SiteHeaderUser = {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  planName?: string | null;
};

type SiteHeaderProps = {
  user?: SiteHeaderUser | null;
  unreadCount?: number;
  isAuthenticated?: boolean;
  role?: string;
};

function NavbarChevronAccent({
  className = '',
  innerClassName = '',
}: {
  className?: string;
  innerClassName?: string;
}) {
  const dottedChevronStyle = {
    backgroundImage:
      'radial-gradient(circle, rgba(8,145,178,0.9) 1.35px, transparent 1.45px)',
    backgroundSize: '6px 6px',
    clipPath: 'polygon(0 0, 52% 50%, 0 100%, 26% 100%, 78% 50%, 26% 0)',
  };

  return (
    <div
      className={`pointer-events-none relative shrink-0 items-center justify-center overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <span
        className={`block opacity-80 ${innerClassName}`}
        style={dottedChevronStyle}
      />
      <span
        className={`absolute block translate-x-2 opacity-45 ${innerClassName}`}
        style={dottedChevronStyle}
      />
    </div>
  );
}

export function SiteHeader({
  user,
  unreadCount = 1,
  isAuthenticated = false,
  role,
}: SiteHeaderProps) {
  const isRecruiter = role === 'RECRUITER';
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const userDisplayName =
    user?.name?.trim() || (isAuthenticated ? 'Người dùng' : 'Khách');
  const userPlan = user?.planName?.trim() || 'Gói miễn phí';
  const userEmail =
    user?.email?.trim() ||
    (isAuthenticated ? 'Tài khoản đã đăng nhập' : 'Tài khoản khách');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white shadow-sm">
      <nav className="flex h-20 w-full items-center justify-between gap-4 px-4 sm:px-8 lg:px-12">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2" aria-label="SCC">
            <SCCBrandLogo showText={false} iconClassName="h-16 w-16" />
          </Link>
          <NavbarChevronAccent
            className="hidden h-12 w-12 md:flex"
            innerClassName="h-12 w-12"
          />
        </div>

        <div className="hidden items-center space-x-9 lg:flex">
          {isRecruiter ? (
            <>
              <Link
                className="transition-standard flex items-center gap-1.5 text-[15px] font-semibold text-slate-600 hover:text-primary-600"
                href="/dashboard/recruiter/jobs"
              >
                <i className="fa-solid fa-briefcase text-sm" /> Việc làm của tôi
              </Link>
              <Link
                className="transition-standard flex items-center gap-1.5 text-[15px] font-semibold text-slate-600 hover:text-primary-600"
                href="/dashboard/recruiter/applications"
              >
                <i className="fa-solid fa-clipboard-list text-sm" /> Đơn ứng
                tuyển
              </Link>
              <Link
                className="transition-standard flex items-center gap-1.5 text-[15px] font-semibold text-slate-600 hover:text-primary-600"
                href="/dashboard/recruiter/jobs"
              >
                <i className="fa-solid fa-plus-circle text-sm" /> Đăng tuyển
              </Link>
            </>
          ) : (
            <>
              <Link
                className="transition-standard flex items-center gap-1.5 text-[15px] font-semibold text-slate-600 hover:text-primary-600"
                href="/jobs"
              >
                Tìm việc làm <i className="fa-solid fa-chevron-down text-xs" />
              </Link>
              <Link
                className="transition-standard flex items-center gap-1.5 text-[15px] font-semibold text-slate-600 hover:text-primary-600"
                href="/companies"
              >
                Công ty <i className="fa-solid fa-chevron-down text-xs" />
              </Link>
              <Link
                className="transition-standard flex items-center gap-1.5 text-[15px] font-semibold text-slate-600 hover:text-primary-600"
                href="/dashboard/candidate/cvs"
              >
                Tạo CV <i className="fa-solid fa-chevron-down text-xs" />
              </Link>
              <a
                className="transition-standard flex items-center gap-1.5 text-[15px] font-semibold text-slate-600 hover:text-primary-600"
                href="#"
              >
                Công cụ <i className="fa-solid fa-chevron-down text-xs" />
              </a>
            </>
          )}
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          {role === 'CANDIDATE' ? (
            <Link
              href="/dashboard/candidate/notifications"
              className="transition-standard group relative rounded-full p-2.5 text-slate-600 hover:bg-primary-50 hover:text-primary-600"
            >
              <i className="fa-regular fa-bell text-xl" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary-600" />
                </span>
              )}
              <span className="sr-only">{unreadCount} thông báo chưa đọc</span>
            </Link>
          ) : (
            <button
              className="transition-standard group relative rounded-full p-2.5 text-slate-600 hover:bg-primary-50 hover:text-primary-600"
              type="button"
            >
              <i className="fa-regular fa-bell text-xl" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary-600" />
                </span>
              )}
              <span className="sr-only">{unreadCount} thông báo chưa đọc</span>
            </button>
          )}

          <button
            className="transition-standard rounded-full p-3 text-slate-600 hover:bg-primary-50 hover:text-primary-600"
            type="button"
          >
            <i className="fa-regular fa-comment-dots text-[22px]" />
          </button>

          <div className="hidden h-8 w-px bg-gray-200 md:block" />

          <div
            ref={dropdownRef}
            className={`relative ${isDropdownOpen ? 'dropdown-active' : ''}`}
            onMouseEnter={() => setIsDropdownOpen(true)}
            onMouseLeave={() => setIsDropdownOpen(false)}
          >
            <button
              className="transition-standard flex items-center gap-3 rounded-full p-1.5 hover:bg-gray-100 focus:outline-none"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setIsDropdownOpen((prev) => !prev);
              }}
            >
              <div className="h-11 w-11 overflow-hidden rounded-full border-2 border-primary-100">
                <Image
                  alt="User"
                  className="h-full w-full object-cover"
                  src={user?.avatarUrl || FALLBACK_AVATAR}
                  width={44}
                  height={44}
                  unoptimized
                />
              </div>
              <div className="hidden pr-2 text-left md:block">
                <p className="text-sm leading-none font-bold text-slate-800">
                  {userDisplayName}
                </p>
                <p className="mt-1.5 text-[11px] text-gray-500">{userPlan}</p>
              </div>
              <i
                className={`fa-solid fa-chevron-down mr-1 hidden text-xs text-gray-400 transition-transform duration-200 md:block ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            <div className="dropdown-menu absolute top-full right-0 z-[60] w-56 pt-2">
              <div className="rounded-xl border border-gray-100 bg-white py-2 shadow-xl">
                <div className="mb-1 border-b border-gray-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {userDisplayName}
                  </p>
                  <p className="truncate text-xs text-gray-500">{userEmail}</p>
                </div>
                {isRecruiter ? (
                  <>
                    <Link
                      className="transition-standard flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-primary-50 hover:text-primary-600"
                      href="/dashboard/recruiter"
                    >
                      <i className="fa-solid fa-gauge-high w-4 text-center" />{' '}
                      Bảng điều khiển
                    </Link>
                    <Link
                      className="transition-standard flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-primary-50 hover:text-primary-600"
                      href="/dashboard/recruiter/jobs"
                    >
                      <i className="fa-solid fa-briefcase w-4 text-center" />{' '}
                      Việc làm của tôi
                    </Link>
                    <Link
                      className="transition-standard flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-primary-50 hover:text-primary-600"
                      href="/dashboard/recruiter/applications"
                    >
                      <i className="fa-solid fa-clipboard-check w-4 text-center" />{' '}
                      Duyệt đơn ứng tuyển
                    </Link>
                    <Link
                      className="transition-standard flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-primary-50 hover:text-primary-600"
                      href="/dashboard/profile"
                    >
                      <i className="fa-solid fa-user-gear w-4 text-center" />{' '}
                      Cài đặt
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      className="transition-standard flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-primary-50 hover:text-primary-600"
                      href="/dashboard/profile"
                    >
                      <i className="fa-solid fa-user-gear w-4 text-center" />{' '}
                      Cài đặt
                    </Link>
                    <Link
                      className="transition-standard flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-primary-50 hover:text-primary-600"
                      href="/dashboard/candidate/applications"
                    >
                      <i className="fa-solid fa-briefcase w-4 text-center" />{' '}
                      Đơn ứng tuyển của tôi
                    </Link>
                    <Link
                      className="transition-standard flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-primary-50 hover:text-primary-600"
                      href="/dashboard/candidate/cvs"
                    >
                      <i className="fa-solid fa-file-invoice w-4 text-center" />{' '}
                      CV của tôi
                    </Link>
                  </>
                )}
                <div className="mx-2 my-1 h-px bg-gray-50" />
                {isAuthenticated ? (
                  <button
                    className="transition-standard flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50"
                    type="button"
                    onClick={() => {
                      void signOut({ callbackUrl: '/login' });
                    }}
                  >
                    <i className="fa-solid fa-arrow-right-from-bracket w-4 text-center" />{' '}
                    Đăng xuất
                  </button>
                ) : (
                  <Link
                    className="transition-standard flex items-center gap-3 px-4 py-2.5 text-sm text-primary-600 hover:bg-primary-50"
                    href="/login"
                  >
                    <i className="fa-solid fa-right-to-bracket w-4 text-center" />{' '}
                    Đăng nhập
                  </Link>
                )}
              </div>
            </div>
          </div>

          {!isRecruiter && (
            <Link
              href="/register?role=recruiter"
              className="transition-standard hidden border-l border-gray-200 py-0.5 pl-5 pr-1 hover:border-primary-200 xl:block"
            >
              <span className="block text-xs font-medium leading-none text-slate-400">
                Bạn là nhà tuyển dụng?
              </span>
              <span className="mt-2 flex items-center gap-1.5 text-sm font-extrabold leading-none text-slate-800 hover:text-primary-600">
                Đăng tuyển ngay
                <i className="fa-solid fa-angles-right text-xs" />
              </span>
            </Link>
          )}

          <NavbarChevronAccent
            className="hidden h-14 w-14 rotate-0 2xl:flex"
            innerClassName="h-14 w-14"
          />
        </div>
      </nav>
    </header>
  );
}
