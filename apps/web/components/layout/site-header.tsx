"use client";

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

export function SiteHeader({
  user,
  unreadCount = 1,
  isAuthenticated = false,
  role,
}: SiteHeaderProps) {
  const isRecruiter = role === 'RECRUITER';
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const userDisplayName = user?.name?.trim() || (isAuthenticated ? 'Người dùng' : 'Khách');
  const userPlan = user?.planName?.trim() || 'Gói miễn phí';
  const userEmail = user?.email?.trim() || (isAuthenticated ? 'Tài khoản đã đăng nhập' : 'Tài khoản khách');

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
      <nav className="flex h-20 w-full items-center justify-between px-4 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-2">
          <SCCBrandLogo />
        </Link>

        <div className="hidden items-center space-x-8 lg:flex">
          {isRecruiter ? (
            <>
              <Link
                className="transition-standard flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-primary-600"
                href="/dashboard/recruiter/jobs"
              >
                <i className="fa-solid fa-briefcase text-xs" /> Việc làm của tôi
              </Link>
              <Link
                className="transition-standard flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-primary-600"
                href="/dashboard/recruiter/applications"
              >
                <i className="fa-solid fa-clipboard-list text-xs" /> Đơn ứng tuyển
              </Link>
              <Link
                className="transition-standard flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-primary-600"
                href="/dashboard/recruiter/jobs"
              >
                <i className="fa-solid fa-plus-circle text-xs" /> Đăng tuyển
              </Link>
            </>
          ) : (
            <>
              <Link
                className="transition-standard flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-primary-600"
                href="/jobs"
              >
                Tìm việc làm <i className="fa-solid fa-chevron-down text-[10px]" />
              </Link>
              <a
                className="transition-standard flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-primary-600"
                href="#"
              >
                Công ty <i className="fa-solid fa-chevron-down text-[10px]" />
              </a>
              <Link
                className="transition-standard flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-primary-600"
                href="/dashboard/candidate/cvs"
              >
                Tạo CV <i className="fa-solid fa-chevron-down text-[10px]" />
              </Link>
              <a
                className="transition-standard flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-primary-600"
                href="#"
              >
                Công cụ <i className="fa-solid fa-chevron-down text-[10px]" />
              </a>
            </>
          )}
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          <button
            className="transition-standard group relative rounded-full p-2.5 text-slate-600 hover:bg-primary-50 hover:text-primary-600"
            type="button"
          >
            <i className="fa-regular fa-bell text-xl" />
            <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary-600" />
            </span>
            <span className="sr-only">{unreadCount} thông báo chưa đọc</span>
          </button>

          <button
            className="transition-standard rounded-full p-2.5 text-slate-600 hover:bg-primary-50 hover:text-primary-600"
            type="button"
          >
            <i className="fa-regular fa-comment-dots text-xl" />
          </button>

          <div className="hidden h-6 w-px bg-gray-200 md:block" />

          <div
            ref={dropdownRef}
            className={`relative ${isDropdownOpen ? 'dropdown-active' : ''}`}
            onMouseEnter={() => setIsDropdownOpen(true)}
            onMouseLeave={() => setIsDropdownOpen(false)}
          >
            <button
              className="transition-standard flex items-center gap-3 rounded-full p-1 hover:bg-gray-100 focus:outline-none"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setIsDropdownOpen((prev) => !prev);
              }}
            >
              <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-primary-100">
                <Image
                  alt="User"
                  className="h-full w-full object-cover"
                  src={user?.avatarUrl || FALLBACK_AVATAR}
                  width={40}
                  height={40}
                  unoptimized
                />
              </div>
              <div className="hidden pr-2 text-left md:block">
                <p className="text-xs leading-none font-bold text-slate-800">{userDisplayName}</p>
                <p className="mt-1 text-[10px] text-gray-500">{userPlan}</p>
              </div>
              <i
                className={`fa-solid fa-chevron-down mr-1 hidden text-[10px] text-gray-400 transition-transform duration-200 md:block ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            <div className="dropdown-menu absolute top-full right-0 z-[60] w-56 pt-2">
              <div className="rounded-xl border border-gray-100 bg-white py-2 shadow-xl">
                <div className="mb-1 border-b border-gray-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{userDisplayName}</p>
                  <p className="truncate text-xs text-gray-500">{userEmail}</p>
                </div>
                {isRecruiter ? (
                  <>
                    <Link
                      className="transition-standard flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-primary-50 hover:text-primary-600"
                      href="/dashboard/recruiter"
                    >
                      <i className="fa-solid fa-gauge-high w-4 text-center" /> Bảng điều khiển
                    </Link>
                    <Link
                      className="transition-standard flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-primary-50 hover:text-primary-600"
                      href="/dashboard/recruiter/jobs"
                    >
                      <i className="fa-solid fa-briefcase w-4 text-center" /> Việc làm của tôi
                    </Link>
                    <Link
                      className="transition-standard flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-primary-50 hover:text-primary-600"
                      href="/dashboard/recruiter/applications"
                    >
                      <i className="fa-solid fa-clipboard-check w-4 text-center" /> Duyệt đơn ứng tuyển
                    </Link>
                    <Link
                      className="transition-standard flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-primary-50 hover:text-primary-600"
                      href="/dashboard/profile"
                    >
                      <i className="fa-solid fa-user-gear w-4 text-center" /> Cài đặt
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      className="transition-standard flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-primary-50 hover:text-primary-600"
                      href="/dashboard/profile"
                    >
                      <i className="fa-solid fa-user-gear w-4 text-center" /> Cài đặt
                    </Link>
                    <Link
                      className="transition-standard flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-primary-50 hover:text-primary-600"
                      href="/dashboard/candidate/applications"
                    >
                      <i className="fa-solid fa-briefcase w-4 text-center" /> Đơn ứng tuyển của tôi
                    </Link>
                    <Link
                      className="transition-standard flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-primary-50 hover:text-primary-600"
                      href="/dashboard/candidate/cvs"
                    >
                      <i className="fa-solid fa-file-invoice w-4 text-center" /> CV của tôi
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
                    <i className="fa-solid fa-arrow-right-from-bracket w-4 text-center" /> Đăng xuất
                  </button>
                ) : (
                  <Link
                    className="transition-standard flex items-center gap-3 px-4 py-2.5 text-sm text-primary-600 hover:bg-primary-50"
                    href="/login"
                  >
                    <i className="fa-solid fa-right-to-bracket w-4 text-center" /> Đăng nhập
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
