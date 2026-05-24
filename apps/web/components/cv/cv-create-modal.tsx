'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, FileText } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';

type CvCreateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, style: string) => void;
};

const STYLE_OPTIONS = [
  { id: 'classic', label: 'Classic Minimalist' },
  { id: 'creative', label: 'Creative Elegant' },
] as const;

export function CvCreateModal({ isOpen, onClose, onCreate }: CvCreateModalProps) {
  const [title, setTitle] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('classic');

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onCreate(trimmed, selectedStyle);
    setTitle('');
    setSelectedStyle('classic');
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Khởi tạo CV mới"
    >
      <div
        className={cn(
          'w-full max-w-md rounded-xl p-6 shadow-xl',
          'bg-md-surface-container-lowest',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-md-primary" />
            <h2 className="font-headline-md text-md-on-surface">
              Khởi tạo CV mới nhanh
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-md-on-surface-variant transition-colors hover:bg-md-surface-container-high"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Title input */}
          <div>
            <label
              htmlFor="cv-title"
              className="font-label-md text-md-on-surface block mb-1.5"
            >
              Tên CV của bạn
            </label>
            <input
              id="cv-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Nguyễn Văn A - Frontend Developer"
              className={cn(
                'w-full rounded-lg border px-3 py-2.5 text-sm',
                'bg-md-surface-container-low text-md-on-surface',
                'border-md-outline-variant placeholder:text-md-outline-variant',
                'outline-none focus:border-md-primary focus:ring-1 focus:ring-md-primary/20',
              )}
              autoFocus
            />
          </div>

          {/* Radio group */}
          <div>
            <p className="font-label-md text-md-on-surface mb-2">
              Chọn phong cách thiết kế
            </p>
            <div className="space-y-2">
              {STYLE_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors',
                    selectedStyle === opt.id
                      ? 'border-md-primary bg-md-primary-container/10'
                      : 'border-md-outline-variant hover:bg-md-surface-container-low',
                  )}
                >
                  <input
                    type="radio"
                    name="style"
                    value={opt.id}
                    checked={selectedStyle === opt.id}
                    onChange={() => setSelectedStyle(opt.id)}
                    className="accent-[var(--md-primary)]"
                  />
                  <span className="text-sm text-md-on-surface">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!title.trim()}
            >
              Tạo ngay
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
