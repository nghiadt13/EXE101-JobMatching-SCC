'use client';

import type { CvItem } from '@/lib/cv-client';
import { CvCardItem } from './cv-card-item';

type CvCardGridProps = {
  items: CvItem[];
  onPreview: (cvId: string) => void;
  onDelete: (cvId: string) => void;
  onSetDefault: (cvId: string) => void;
  onRename: (cvId: string, newTitle: string) => void;
};

export function CvCardGrid({
  items,
  onPreview,
  onDelete,
  onSetDefault,
  onRename,
}: CvCardGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {items.map((cv) => (
        <CvCardItem
          key={cv.id}
          cv={cv}
          onPreview={onPreview}
          onDelete={onDelete}
          onSetDefault={onSetDefault}
          onRename={onRename}
        />
      ))}
    </div>
  );
}
