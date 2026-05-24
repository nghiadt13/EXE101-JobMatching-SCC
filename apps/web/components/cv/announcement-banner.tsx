'use client';

import { Sparkles } from 'lucide-react';

export function AnnouncementBanner() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white relative overflow-hidden shadow-md rounded-2xl py-3 px-4 w-full">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10 w-full">
        <div className="flex items-center gap-2.5 text-center sm:text-left">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white shadow-sm shrink-0">
            <Sparkles className="h-4 w-4 animate-pulse" />
          </span>
          <p className="text-xs sm:text-sm font-medium">
            Hãy chia sẻ nhu cầu công việc của bạn để nhận các gợi ý vị trí lương cao được cá nhân hóa!
          </p>
        </div>
        <button className="px-4 py-1.5 bg-white text-blue-800 hover:bg-slate-100 font-semibold text-xs rounded-lg transition-all shadow-md active:scale-95 shrink-0 border-0 cursor-pointer">
          Cập nhật ngay
        </button>
      </div>
    </div>
  );
}
