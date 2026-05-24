'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Star, Copy, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { toast } from 'sonner';

type CvCardDropdownProps = {
  cvId: string;
  isPrimary: boolean;
  cvTitle?: string;
  onSetDefault: (cvId: string) => void;
  onDelete: (cvId: string) => void;
};

export function CvCardDropdown({
  cvId,
  isPrimary,
  cvTitle = 'CV',
  onSetDefault,
  onDelete,
}: CvCardDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  function handleSetDefault() {
    if (!isPrimary) {
      onSetDefault(cvId);
      toast.success(`Đã thiết lập "${cvTitle}" làm CV chính thức!`);
    }
    setIsOpen(false);
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/dashboard/candidate/cvs/${cvId}`;
    navigator.clipboard.writeText(url)
      .then(() => {
        toast.success('Đã sao chép liên kết CV!');
      })
      .catch(() => {
        toast.error('Lỗi khi sao chép liên kết!');
      });
    setIsOpen(false);
  }

  function handleDelete() {
    const confirmed = window.confirm(`Bạn chắc chắn muốn xóa hồ sơ "${cvTitle}"? Hành động này không thể hoàn tác.`);
    if (confirmed) {
      onDelete(cvId);
      toast.success('Đã xóa CV thành công!');
    }
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'p-1.5 text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer',
          isOpen && 'bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400',
        )}
        aria-label="Thêm tùy chọn"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute right-0 bottom-full mb-2 w-48 py-1 rounded-xl shadow-xl border z-30 animate-in fade-in slide-in-from-bottom-2 duration-150',
            'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800',
          )}
        >
          <button
            type="button"
            onClick={handleSetDefault}
            disabled={isPrimary}
            className={cn(
              'w-full text-left px-4 py-2 text-xs flex items-center gap-1.5 transition-colors cursor-pointer',
              isPrimary
                ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
            )}
          >
            <Star className="h-3.5 w-3.5" />
            Đặt làm CV chính
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Copy className="h-3.5 w-3.5" />
            Sao chép liên kết
          </button>
          <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
          <button
            type="button"
            onClick={handleDelete}
            className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Xóa hồ sơ
          </button>
        </div>
      )}
    </div>
  );
}
