'use client';

import { useEffect, useCallback } from 'react';
import { X, FileText } from 'lucide-react';
import type { CvItem } from '@/lib/cv-client';
import {
  ProfileHeader,
  SkillsSection,
  ExperienceSection,
  EducationSection,
  ProjectsSection,
} from './cv-preview-section';

type CvPreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  cv: CvItem | null;
};

export function CvPreviewModal({ isOpen, onClose, cv }: CvPreviewModalProps) {
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

  if (!isOpen || !cv) return null;

  const profile = cv.candidateProfile ?? null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Xem trước CV"
    >
      <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-xl bg-md-surface-container-lowest shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-md-outline-variant/30 px-6 py-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-md-primary" />
            <h2 className="font-headline-md text-md-on-surface">
              {cv.fileName || 'CV Preview'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-label-sm text-md-on-surface-variant">
              Xem trước thời gian thực
            </span>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-md-on-surface-variant transition-colors hover:bg-md-surface-container-high"
              aria-label="Đóng"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6">
          {profile ? (
            <>
              <ProfileHeader profile={profile} />
              <SkillsSection skills={profile.skills} />
              <ExperienceSection experience={profile.experience} />
              <EducationSection education={profile.education} />
              <ProjectsSection projects={profile.projects} />
            </>
          ) : (
            <p className="text-md-on-surface-variant">
              Không có dữ liệu để xem trước
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
