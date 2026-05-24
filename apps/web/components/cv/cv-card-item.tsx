'use client';

import { useState } from 'react';
import { Eye, Edit, Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { CvItem } from '@/lib/cv-client';
import { CvCardDropdown } from './cv-card-dropdown';
import { getTitle, getAiScore, getTemplateLabel, formatDate } from './cv-card-helpers';

type CvCardItemProps = {
  cv: CvItem;
  onPreview: (cvId: string) => void;
  onDelete: (cvId: string) => void;
  onSetDefault: (cvId: string) => void;
  onRename: (cvId: string, newTitle: string) => void;
};

export function CvCardItem({
  cv,
  onPreview,
  onDelete,
  onSetDefault,
  onRename,
}: CvCardItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(getTitle(cv));

  const title = getTitle(cv);
  const aiScore = getAiScore(cv);
  const templateLabel = getTemplateLabel(cv.templateId);

  function handleRenameSubmit() {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== title) {
      onRename(cv.id, trimmed);
    } else {
      setEditTitle(title);
    }
    setIsEditing(false);
  }

  return (
    <article
      className={cn(
        'group relative flex flex-col justify-between rounded-2xl border p-5 shadow-sm transition-all duration-200 overflow-hidden',
        cv.isPrimary
          ? 'border-primary ring-2 ring-primary/10 bg-surface-container-lowest'
          : 'border-outline-variant/30 bg-surface-container-lowest hover:shadow-md',
      )}
    >
      {/* Thumbnail area */}
      <div>
        <div
          className="relative h-32 overflow-hidden rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-center cursor-pointer"
          onClick={() => onPreview(cv.id)}
        >
          {/* Mock CV Layout Background */}
          <div className="absolute inset-x-4 top-4 bottom-0 bg-white shadow-sm border border-outline-variant/30 rounded-t p-2 space-y-2 select-none pointer-events-none transition-transform duration-300 group-hover:scale-[1.03]">
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-1">
              <span className="w-8 h-1.5 bg-outline-variant/40 rounded-full" />
              <span className="w-12 h-1 bg-outline-variant/30 rounded-full" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1">
                <span className="w-full h-1 bg-outline-variant/30 rounded-full block" />
                <span className="w-5/6 h-1 bg-outline-variant/20 rounded-full block" />
                <span className="w-full h-1 bg-outline-variant/30 rounded-full block" />
              </div>
              <div className="space-y-1">
                <span className="w-full h-1 bg-outline-variant/30 rounded-full block" />
                <span className="w-full h-1 bg-outline-variant/20 rounded-full block" />
              </div>
            </div>
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/40 group-hover:opacity-100">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onPreview(cv.id); }}
              className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-on-surface shadow transition-transform hover:scale-105"
            >
              <Eye className="h-3.5 w-3.5" />
              Xem nhanh
            </button>
          </div>

          {/* Primary badge */}
          {cv.isPrimary && (
            <span className="absolute left-2.5 top-2.5 rounded bg-primary px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase text-white shadow">
              CV Chính
            </span>
          )}

          {/* AI Score badge */}
          <span className="absolute right-2.5 top-2.5 flex items-center gap-0.5 rounded bg-on-surface/80 backdrop-blur px-2 py-0.5 text-[10px] font-bold text-white shadow">
            <span className="material-symbols-outlined text-amber-400 text-[12px]">award</span>
            {aiScore !== null ? aiScore : '—'}
          </span>
        </div>

        {/* Title & Metadata */}
        <div className="mt-4 space-y-1">
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit();
                if (e.key === 'Escape') { setEditTitle(title); setIsEditing(false); }
              }}
              autoFocus
              className="w-full rounded border border-primary bg-white px-2 py-1 text-sm font-bold text-on-surface outline-none"
            />
          ) : (
            <h3
              className="cursor-pointer text-sm font-bold text-on-surface line-clamp-1 transition-colors group-hover:text-primary"
              onClick={() => onPreview(cv.id)}
            >
              {title}
            </h3>
          )}
          <div className="flex items-center gap-2 text-[10px] text-on-surface-variant">
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              Cập nhật: {formatDate(cv.updatedAt)}
            </span>
            <span className="h-2 w-px bg-outline-variant" />
            <span className="flex items-center gap-0.5">
              <Sparkles className="h-3 w-3" />
              Mẫu: {templateLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="mt-4 flex items-center justify-between pt-3 border-t border-outline-variant/30">
        <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
          <Eye className="h-3.5 w-3.5 text-outline-variant" /> 0 lượt xem
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onPreview(cv.id)}
            className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg transition-all"
            title="Xem trước"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => { setEditTitle(title); setIsEditing(true); }}
            className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg transition-all"
            title="Đổi tên"
          >
            <Edit className="h-4 w-4" />
          </button>
          <CvCardDropdown
            cvId={cv.id}
            isPrimary={cv.isPrimary}
            onSetDefault={onSetDefault}
            onDelete={onDelete}
          />
        </div>
      </div>
    </article>
  );
}
