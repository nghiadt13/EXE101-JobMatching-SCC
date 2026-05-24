'use client';

import { useState, useMemo } from 'react';
import type { CvItem } from '@/lib/cv-client';
import { CvCardGrid } from './cv-card-grid';
import { CvSearchBar } from './cv-search-bar';
import { CvCreateModal } from './cv-create-modal';
import { CvPreviewModal } from './cv-preview-modal';
import { Button } from '@/components/ui/button';
import { Plus, Upload, FileText, TrendingUp } from 'lucide-react';
import Link from 'next/link';

type CvPageContentProps = {
  items: CvItem[];
  userName: string;
  onDelete: (cvId: string) => Promise<void>;
  onSetDefault: (cvId: string) => Promise<void>;
  onRename: (cvId: string, newTitle: string) => Promise<void>;
};

export function CvPageContent({
  items,
  userName,
  onDelete,
  onSetDefault,
  onRename,
}: CvPageContentProps) {
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewCv, setPreviewCv] = useState<CvItem | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (cv) =>
        cv.fileName.toLowerCase().includes(q) ||
        (typeof cv.parsedData?.summary === 'string' && cv.parsedData.summary.toLowerCase().includes(q)),
    );
  }, [items, search]);

  return (
    <>
      {/* Stats Card: Career Opportunities */}
      <div className="mb-8 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm overflow-hidden relative group">
        {/* Hover gradient border effect */}
        <div className="absolute -inset-px bg-gradient-to-r from-primary/20 to-indigo-500/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Stats content */}
          <div className="space-y-4 max-w-md">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
              Nhu cầu tuyển dụng tăng cao
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface leading-snug">
              Ứng viên được nhà tuyển dụng tiếp cận{' '}
              <span className="text-primary relative inline-block font-extrabold">
                tăng 27%
                <span className="absolute bottom-0 left-0 w-full h-1 bg-primary/20 rounded" />
              </span>{' '}
              trong tuần qua!
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              Nâng cấp chất lượng CV của bạn lên chuẩn TopCV Pro để nổi bật hơn 95% ứng viên khác trên thị trường lao động.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button size="sm" onClick={() => setShowCreateModal(true)} className="bg-primary hover:bg-primary/90 text-on-primary font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-primary/10 flex items-center gap-1.5">
                <Plus className="h-4 w-4" /> Tạo CV mới
              </Button>
              <Button size="sm" variant="outline" asChild className="border-outline-variant hover:bg-surface-container-low text-on-surface font-semibold text-xs sm:text-sm rounded-xl flex items-center gap-1.5">
                <Link href="/dashboard/candidate/cvs/templates">
                  <Upload className="h-4 w-4" /> Tải CV lên (.pdf)
                </Link>
              </Button>
            </div>
          </div>

          {/* Mini Sparkline Chart */}
          <div className="flex-grow max-w-xs flex flex-col justify-end items-end">
            <span className="text-xs font-bold text-blue-500 flex items-center gap-0.5 self-end mb-2">
              <TrendingUp className="h-4 w-4" /> +27.4% tương tác
            </span>
            <div className="w-full h-28 bg-surface-container-low rounded-xl p-2 border border-outline-variant/30">
              <svg viewBox="0 0 100 30" className="w-full h-full text-primary overflow-visible" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--md-primary, #003f87)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--md-primary, #003f87)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 25 C15 20, 30 24, 45 15 C60 6, 75 14, 90 4 L90 30 L0 30 Z" fill="url(#chart-grad)" />
                <path d="M0 25 C15 20, 30 24, 45 15 C60 6, 75 14, 90 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="90" cy="4" r="2.5" className="fill-primary animate-ping" style={{ transformOrigin: '90px 4px' }} />
                <circle cx="90" cy="4" r="1.5" className="fill-primary" />
              </svg>
            </div>
            <span className="text-[10px] text-on-surface-variant mt-1">Lượt tương tác hồ sơ cập nhật theo thời gian thực</span>
          </div>
        </div>
      </div>

      {/* CV List Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <FileText className="text-primary w-5 h-5" />
              Hồ Sơ & CV Cá Nhân
            </h3>
            <p className="text-xs text-on-surface-variant">Quản lý, chỉnh sửa và cấu hình hồ sơ tìm việc của bạn</p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <div className="relative flex-grow sm:w-64">
              <CvSearchBar value={search} onChange={setSearch} />
            </div>
            <Button size="sm" onClick={() => setShowCreateModal(true)} className="bg-primary hover:bg-primary/90 text-on-primary font-semibold text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-1 shrink-0">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Tạo mới</span>
            </Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center mx-auto text-on-surface-variant">
              <FileText className="h-8 w-8" />
            </div>
            <p className="text-on-surface-variant font-medium text-sm">
              {search ? 'Không tìm thấy CV nào phù hợp' : 'Chưa có CV nào'}
            </p>
            <p className="text-xs text-outline-variant">
              {search ? 'Thử từ khóa khác' : 'Tạo CV đầu tiên để bắt đầu ứng tuyển'}
            </p>
            {!search && (
              <Button className="mt-4" size="sm" onClick={() => setShowCreateModal(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                Tạo CV mới
              </Button>
            )}
          </div>
        ) : (
          <CvCardGrid
            items={filtered}
            onPreview={(cvId) => {
              const cv = items.find((c) => c.id === cvId);
              if (cv) setPreviewCv(cv);
            }}
            onDelete={onDelete}
            onSetDefault={onSetDefault}
            onRename={onRename}
          />
        )}
      </div>

      {/* Modals */}
      <CvCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={(title, style) => {
          window.location.href = `/dashboard/candidate/cvs/create?template=${style}&title=${encodeURIComponent(title)}`;
        }}
      />
      <CvPreviewModal isOpen={!!previewCv} onClose={() => setPreviewCv(null)} cv={previewCv} />
    </>
  );
}
