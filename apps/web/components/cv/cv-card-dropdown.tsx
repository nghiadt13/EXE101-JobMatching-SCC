'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Star, Copy, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type CvCardDropdownProps = {
  cvId: string;
  isPrimary: boolean;
  onSetDefault: (cvId: string) => void;
  onDelete: (cvId: string) => void;
};

export function CvCardDropdown({
  cvId,
  isPrimary,
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
    }
    setIsOpen(false);
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/dashboard/candidate/cvs/${cvId}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setIsOpen(false);
  }

  function handleDelete() {
    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa CV này không?');
    if (confirmed) {
      onDelete(cvId);
    }
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
          'text-md-on-surface-variant hover:bg-md-surface-container-high',
          isOpen && 'bg-md-surface-container-high',
        )}
        aria-label="Thêm tùy chọn"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute right-0 top-full z-50 mt-1 min-w-[180px] overflow-hidden rounded-xl border shadow-lg',
            'bg-md-surface-container-lowest border-md-outline-variant/30',
          )}
        >
          <button
            type="button"
            onClick={handleSetDefault}
            disabled={isPrimary}
            className={cn(
              'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
              isPrimary
                ? 'cursor-not-allowed text-md-outline-variant'
                : 'text-md-on-surface hover:bg-md-surface-container-low',
            )}
          >
            <Star className="h-4 w-4" />
            Đặt làm mặc định
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-md-on-surface transition-colors hover:bg-md-surface-container-low"
          >
            <Copy className="h-4 w-4" />
            Sao chép liên kết
          </button>
          <div className="border-t border-md-outline-variant/30" />
          <button
            type="button"
            onClick={handleDelete}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-md-error transition-colors hover:bg-md-error-container/30"
          >
            <Trash2 className="h-4 w-4" />
            Xóa
          </button>
        </div>
      )}
    </div>
  );
}
