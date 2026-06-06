'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Eye, Edit, Clock, Sparkles, Award } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { CvItem } from '@/lib/cv-client';
import { CvCardDropdown } from './cv-card-dropdown';
import {
  getTitle,
  getAiScore,
  getTemplateLabel,
  formatDate,
} from './cv-card-helpers';

type CvCardItemProps = {
  cv: CvItem;
  onDelete: (cvId: string) => void;
  onSetDefault: (cvId: string) => void;
  onRename: (cvId: string, newTitle: string) => void;
};

export function CvCardItem({
  cv,
  onDelete,
  onSetDefault,
  onRename,
}: CvCardItemProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const title = getTitle(cv);
  const [editTitle, setEditTitle] = useState(title);
  const aiScore = getAiScore(cv);
  const templateLabel = getTemplateLabel(cv.templateId);

  // Generate a realistic views number based on id so it looks exactly like the mockup data (45, 12, etc.)
  const mockViews = ((cv.id.charCodeAt(cv.id.length - 1) || 0) % 3) * 33 + 12;

  function handleRenameSubmit() {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== title) {
      onRename(cv.id, trimmed);
    } else {
      setEditTitle(title);
    }
    setIsEditing(false);
  }

  function navigateToEdit() {
    if (cv.parseStatus !== 'pending_apply') {
      router.push(`/dashboard/candidate/cvs/${cv.id}/edit`);
    }
  }

  return (
    <article
      className={cn(
        'group bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden flex flex-col justify-between h-[340px] w-full',
        cv.isPrimary
          ? 'border-brand-500 ring-2 ring-brand-500/10'
          : 'border-slate-200/80 dark:border-slate-800/80',
      )}
    >
      <div>
        {/* Banner Preview Area */}
        <div
          className={cn(
            'h-32 bg-slate-50 dark:bg-slate-950 rounded-xl relative overflow-hidden border border-slate-100 dark:border-slate-800/80 flex items-center justify-center',
            cv.parseStatus === 'pending_apply'
              ? 'cursor-wait'
              : 'cursor-pointer',
          )}
          onClick={navigateToEdit}
        >
          {/* Mock CV Layout Background */}
          <div className="absolute inset-x-4 top-4 bottom-0 bg-white dark:bg-slate-900 shadow-sm border border-slate-200/50 dark:border-slate-800/50 rounded-t p-2 space-y-2 select-none pointer-events-none transition-transform duration-300 group-hover:scale-[1.03]">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1">
              <span className="w-8 h-1.5 bg-slate-400 dark:bg-slate-600 rounded-full" />
              <span className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1">
                <span className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full block" />
                <span className="w-5/6 h-1 bg-slate-100 dark:bg-slate-800 rounded-full block" />
                <span className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full block" />
              </div>
              <div className="space-y-1">
                <span className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full block" />
                <span className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full block" />
              </div>
            </div>
          </div>

          {/* Hover Overlay Effect */}
          {cv.parseStatus === 'pending_apply' ? (
            <div className="absolute inset-0 bg-slate-900/10 dark:bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center gap-2 overflow-hidden z-10">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <div className="px-3 py-1.5 bg-white text-brand-700 rounded-lg text-xs font-bold shadow flex items-center gap-1.5 border border-brand-100">
                <div className="w-3.5 h-3.5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                Đang đọc CV...
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 z-10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateToEdit();
                }}
                className="px-3 py-1.5 bg-white text-slate-800 rounded-lg text-xs font-bold hover:bg-slate-100 shadow flex items-center gap-1 cursor-pointer border-0"
              >
                <Edit className="w-3.5 h-3.5" /> Mở CV
              </button>
            </div>
          )}

          {/* Badge CV Chính */}
          {cv.isPrimary && (
            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-brand-600 text-white text-[9px] font-bold tracking-wide uppercase shadow">
              CV Chính
            </span>
          )}

          {/* Điểm số AI Đánh Giá */}
          {aiScore !== null && (
            <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur text-white text-[10px] font-bold flex items-center gap-0.5 shadow">
              <Award className="w-3 h-3 text-amber-400 fill-current" />{' '}
              {aiScore}
            </span>
          )}
        </div>

        {/* Tên CV & Metadata */}
        <div className="mt-4 space-y-1">
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit();
                if (e.key === 'Escape') {
                  setEditTitle(title);
                  setIsEditing(false);
                }
              }}
              autoFocus
              className="w-full rounded border border-brand-500 bg-white dark:bg-slate-900 px-2 py-1 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          ) : (
            <h4
              className={cn(
                'font-bold text-sm text-slate-800 dark:text-slate-100 transition-colors line-clamp-1',
                cv.parseStatus === 'pending_apply'
                  ? 'cursor-wait opacity-70'
                  : 'group-hover:text-brand-600 dark:group-hover:text-brand-400 cursor-pointer',
              )}
              onClick={navigateToEdit}
            >
              {title}
            </h4>
          )}
          <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3" /> Cập nhật: {formatDate(cv.updatedAt)}
            </span>
            <span className="h-2 w-px bg-slate-200 dark:bg-slate-800" />
            <span className="flex items-center gap-0.5">
              <Sparkles className="w-3 h-3" /> Mẫu: {templateLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Actions inside card */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <span className="text-[10px] text-slate-500 flex items-center gap-1">
          <Eye className="w-3.5 h-3.5 text-slate-400" /> {mockViews} lượt xem
        </span>

        {/* Actions buttons */}
        <div className="flex items-center gap-1.5">
          {cv.parseStatus === 'pending_apply' ? (
            <span
              className="p-1.5 text-slate-500 rounded-lg cursor-wait opacity-50"
              title="Đang đọc CV..."
            >
              <Edit className="w-4 h-4" />
            </span>
          ) : (
            <Link
              href={`/dashboard/candidate/cvs/${cv.id}/edit`}
              className="p-1.5 text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
              title="Chỉnh sửa CV"
            >
              <Edit className="w-4 h-4" />
            </Link>
          )}

          {/* Dropdown Options */}
          <CvCardDropdown
            cvId={cv.id}
            isPrimary={cv.isPrimary}
            cvTitle={title}
            onSetDefault={onSetDefault}
            onDelete={onDelete}
          />
        </div>
      </div>
    </article>
  );
}
