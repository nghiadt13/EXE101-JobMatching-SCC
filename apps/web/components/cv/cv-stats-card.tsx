'use client';

import { Plus, Upload, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

type CvStatsCardProps = {
  onCreateClick: () => void;
  onUploadClick: () => void;
};

export function CvStatsCard({ onCreateClick, onUploadClick }: CvStatsCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm overflow-hidden relative group w-full transition-all duration-200">
      {/* Glow gradient border effect */}
      <div className="absolute -inset-px bg-gradient-to-r from-brand-500/20 to-indigo-500/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
        {/* Analytics stats */}
        <div className="space-y-4 flex-1 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
            Nhu cầu tuyển dụng tăng cao
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-snug">
            Ứng viên được nhà tuyển dụng tiếp cận{' '}
            <span className="text-brand-600 dark:text-brand-400 relative inline-block font-extrabold">
              tăng 27%
              <span className="absolute bottom-0 left-0 w-full h-1 bg-brand-500/20 rounded" />
            </span>{' '}
            trong tuần qua!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Nâng cấp chất lượng CV của bạn lên chuẩn TopCV Pro để nổi bật hơn 95% ứng viên khác trên thị trường lao động.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              size="sm"
              onClick={onCreateClick}
              className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-brand-500/10 flex items-center gap-1.5 border-0 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Tạo CV mới
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onUploadClick}
              className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="h-4 w-4" /> Tải CV lên (.pdf)
            </Button>
          </div>
        </div>

        {/* Sparkline chart */}
        <div className="w-full md:w-72 shrink-0 flex flex-col justify-end items-end">
          <span className="text-xs font-bold text-blue-500 flex items-center gap-0.5 self-end mb-2">
            <TrendingUp className="h-4 w-4" /> +27.4% tương tác
          </span>
          <div className="w-full h-28 bg-slate-50 dark:bg-slate-950/50 rounded-xl p-2 border border-slate-100 dark:border-slate-800/80">
            <svg viewBox="0 0 100 30" className="w-full h-full text-brand-500 overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0 25 C15 20, 30 24, 45 15 C60 6, 75 14, 90 4 L90 30 L0 30 Z" fill="url(#chart-grad)" />
              <path d="M0 25 C15 20, 30 24, 45 15 C60 6, 75 14, 90 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="90" cy="4" r="2.5" className="fill-brand-500 animate-ping" style={{ transformOrigin: '90px 4px' }} />
              <circle cx="90" cy="4" r="1.5" className="fill-brand-600 dark:fill-brand-400" />
            </svg>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Lượt tương tác hồ sơ cập nhật theo thời gian thực</span>
        </div>
      </div>
    </div>
  );
}
