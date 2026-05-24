'use client';

import { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Bell, UserCheck, Award, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

type CvPageHeaderProps = {
  userName: string;
};

export function CvPageHeader({ userName }: CvPageHeaderProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const notiRef = useRef<HTMLDivElement | null>(null);

  // Initialize theme from document element class list
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    }
  }, []);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notiRef.current && !notiRef.current.contains(event.target as Node)) {
        setIsNotiOpen(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Theme toggle handler
  function handleThemeToggle() {
    if (theme === 'light') {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setTheme('dark');
      toast.info('Đã chuyển sang giao diện Tối');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setTheme('light');
      toast.info('Đã chuyển sang giao diện Sáng');
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2">
          Chào quay trở lại,{' '}
          <span className="bg-gradient-to-r from-brand-600 to-indigo-500 dark:from-brand-500 dark:to-indigo-400 bg-clip-text text-transparent capitalize">
            {userName}
          </span>{' '}
          👋
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Hôm nay bạn muốn cập nhật hay ứng tuyển vị trí nào?
        </p>
      </div>

      {/* Utility controls: Theme toggle & Notification dropdown */}
      <div className="flex items-center gap-3 self-end sm:self-auto">
        {/* Dark/Light mode toggle */}
        <button
          type="button"
          onClick={handleThemeToggle}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 transition-colors bg-white dark:bg-slate-900 shadow-sm cursor-pointer"
          title="Đổi chế độ sáng/tối"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        {/* Notification Bell with Dropdown */}
        <div ref={notiRef} className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsNotiOpen(!isNotiOpen);
            }}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 transition-colors bg-white dark:bg-slate-900 shadow-sm relative cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
          </button>

          {/* Notifications Dropdown menu */}
          {isNotiOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 glass">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Thông báo mới</span>
                <span
                  onClick={() => toast.success('Đã đánh dấu đọc tất cả thông báo!')}
                  className="text-xs text-brand-600 dark:text-brand-400 cursor-pointer hover:underline"
                >
                  Đã đọc tất cả
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div
                  onClick={() => toast.info('Đang xem chi tiết thông báo từ VinGroup...')}
                  className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex gap-3 border-b border-slate-100 dark:border-slate-800/50 cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-normal">
                      Tập đoàn VinGroup vừa xem hồ sơ của bạn
                    </p>
                    <span className="text-[10px] text-slate-400">10 phút trước</span>
                  </div>
                </div>
                <div
                  onClick={() => toast.info('Đang mở báo cáo chi tiết điểm AI của CV...')}
                  className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex gap-3 border-b border-slate-100 dark:border-slate-800/50 cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-normal">
                      CV "{userName}" đạt điểm tối ưu 9.5/10
                    </p>
                    <span className="text-[10px] text-slate-400">2 giờ trước</span>
                  </div>
                </div>
              </div>
              <div className="px-4 py-1 text-center border-t border-slate-100 dark:border-slate-800 mt-1">
                <span
                  onClick={() => toast.info('Đang chuyển tới trang tất cả thông báo...')}
                  className="text-xs text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 font-medium block py-1 cursor-pointer hover:underline"
                >
                  Xem tất cả thông báo
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
