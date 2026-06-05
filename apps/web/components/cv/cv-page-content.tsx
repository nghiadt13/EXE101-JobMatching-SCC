'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { uploadCv, type CvItem } from '@/lib/cv-client';
import { CvPageHeader } from './cv-page-header';
import { AnnouncementBanner } from './announcement-banner';
import { CvStatsCard } from './cv-stats-card';
import { CvCardGrid } from './cv-card-grid';
import { CvSearchBar } from './cv-search-bar';
import { CvCreateModal } from './cv-create-modal';
import { CvPreviewModal } from './cv-preview-modal';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';
import { toast } from 'sonner';

type CvPageContentProps = {
  items: CvItem[];
  userName: string;
  onDelete: (cvId: string) => Promise<void>;
  onSetDefault: (cvId: string) => Promise<void>;
  onRename: (cvId: string, newTitle: string) => Promise<void>;
  accessToken?: string;
};

export function CvPageContent({
  items,
  userName,
  onDelete,
  onSetDefault,
  onRename,
  accessToken,
}: CvPageContentProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewCv, setPreviewCv] = useState<CvItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const prevItemsRef = useRef(items);

  useEffect(() => {
    const prevItems = prevItemsRef.current;
    
    // Check if any CV just transitioned from pending_apply to completed
    const newlyCompleted = items.filter(
      (item) => 
        (item.parseStatus === 'parsed_ok' || item.parseStatus === 'needs_review') && 
        prevItems.find((p) => p.id === item.id)?.parseStatus === 'pending_apply'
    );

    if (newlyCompleted.length > 0) {
      toast.success(
        'Phân tích thành công! Vui lòng kiểm tra và chỉnh sửa lại dữ liệu.',
        { duration: 5000 }
      );
      // Navigate immediately to the builder to edit the parsed CV
      router.push(`/dashboard/candidate/cvs/${newlyCompleted[0].id}/edit?isNew=1`);
    }

    prevItemsRef.current = items;
  }, [items, router]);

  useEffect(() => {
    const hasPendingCvs = items.some((cv) => cv.parseStatus === 'pending_apply');
    if (!hasPendingCvs) return;

    const interval = setInterval(() => {
      router.refresh();
    }, 5000);

    return () => clearInterval(interval);
  }, [items, router]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(file.type) && fileExtension !== 'pdf' && fileExtension !== 'docx') {
      toast.error('Chỉ hỗ trợ tải lên file định dạng PDF hoặc DOCX.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước file CV tối đa là 5MB.');
      return;
    }

    if (!accessToken) {
      toast.error('Phiên làm việc hết hạn. Vui lòng đăng nhập lại.');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Đang tải CV lên và phân tích AI... Vui lòng đợi.');

    try {
      await uploadCv(accessToken, file);
      toast.success('Tải CV lên và phân tích AI thành công!', { id: toastId });
      router.refresh();
      // Clear input
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      const msg = error?.message || 'Có lỗi xảy ra khi tải CV lên.';
      toast.error(`Tải CV thất bại: ${msg}`, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

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
        onUploadClick={() => fileInputRef.current?.click()}
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

      {/* Hidden file input for seamless uploading */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        disabled={isUploading}
      />
    </div>
  );
}
