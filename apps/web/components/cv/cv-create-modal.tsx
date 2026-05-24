'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';

type CvCreateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, style: string) => void;
};

const STYLE_OPTIONS = [
  { id: 'Classic Minimalist', label: 'Classic Minimalist', desc: 'Đơn giản, tinh tế, tối ưu trải nghiệm đọc ATS.' },
  { id: 'Creative Elegant', label: 'Creative Elegant', desc: 'Sang trọng, phối màu chuyên nghiệp cho Designer.' },
] as const;

export function CvCreateModal({ isOpen, onClose, onCreate }: CvCreateModalProps) {
  const [title, setTitle] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Classic Minimalist');

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
    setSelectedStyle('Classic Minimalist');
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Khởi tạo CV mới"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <PlusCircle className="text-brand-500 w-5 h-5" />
            Khởi tạo CV mới nhanh
          </h4>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all cursor-pointer border-0 bg-transparent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label
              htmlFor="new-cv-title"
              className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5"
            >
              Tên CV của bạn
            </label>
            <input
              type="text"
              id="new-cv-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Đàm Trọng Nghĩa - Full Stack Developer"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400"
              autoFocus
            />
          </div>

          {/* Design Style Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Chọn phong cách thiết kế
            </label>
            <div className="grid grid-cols-2 gap-3">
              {STYLE_OPTIONS.map((opt) => (
                <label key={opt.id} className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="cv-template-style"
                    value={opt.id}
                    checked={selectedStyle === opt.id}
                    onChange={() => setSelectedStyle(opt.id)}
                    className="peer sr-only"
                  />
                  <div className="h-full p-3 border rounded-xl bg-slate-50 dark:bg-slate-950 peer-checked:border-brand-500 peer-checked:bg-brand-500/[0.04] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                    <p className="font-bold text-xs text-slate-800 dark:text-slate-100">{opt.label}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-normal">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer bg-transparent"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="w-1/2 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:hover:bg-brand-600 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer border-0"
            >
              Tạo ngay
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
