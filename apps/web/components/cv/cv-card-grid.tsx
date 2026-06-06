'use client';

import type { CvItem } from '@/lib/cv-client';
import { CvCardItem } from './cv-card-item';

type CvCardGridProps = {
  items: CvItem[];
  onDelete: (cvId: string) => void;
  onSetDefault: (cvId: string) => void;
  onRename: (cvId: string, newTitle: string) => void;
};

export function CvCardGrid({
  items,
  onDelete,
  onSetDefault,
  onRename,
}: CvCardGridProps) {
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-500">
      {items.map((cv) => (
        <CvCardItem
          key={cv.id}
          cv={cv}
          onDelete={onDelete}
          onSetDefault={onSetDefault}
          onRename={onRename}
        />
      ))}
    </div>
  );
}
