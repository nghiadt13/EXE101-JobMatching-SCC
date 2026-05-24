'use client';

import { useState, useMemo } from 'react';
import type { CvItem } from '@/lib/cv-client';
import { CvPageHeader } from './cv-page-header';
import { AnnouncementBanner } from './announcement-banner';
import { CvStatsCard } from './cv-stats-card';
import { CvCardGrid } from './cv-card-grid';
import { CvSearchBar } from './cv-search-bar';
import { CvCreateModal } from './cv-create-modal';
import { CvPreviewModal } from './cv-preview-modal';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';

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
    <div className="space-y-6 w-full">
      {/* Greeting Header */}
      <CvPageHeader userName={userName} />

      {/* Announcement Banner */}
      <AnnouncementBanner />

      {/* Stats Card: Career Opportunities */}
      <CvStatsCard
        onCreateClick={() => setShowCreateModal(true)}
        onUploadClick={() => setShowCreateModal(true)}
      />

      {/* CV List Section */}
      <div className="space-y-6 w-full">
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
            <Button size="sm" onClick={() => setShowCreateModal(true)} className="bg-primary hover:bg-primary/90 text-on-primary font-semibold text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-1 shrink-0 border-0">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Tạo mới</span>
            </Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center space-y-3 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm">
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
              <Button className="mt-4 border-0" size="sm" onClick={() => setShowCreateModal(true)}>
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
    </div>
  );
}
