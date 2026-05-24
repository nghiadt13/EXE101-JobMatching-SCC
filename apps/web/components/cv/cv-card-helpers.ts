import type { CvItem } from '@/lib/cv-client';

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function getTitle(cv: CvItem): string {
  const summary =
    cv.parsedData?.summary ??
    cv.normalizedProfile?.summary ??
    cv.candidateProfile?.summary;
  if (typeof summary === 'string' && summary.length > 0) {
    return summary.length > 50 ? summary.slice(0, 50) + '...' : summary;
  }
  return cv.fileName || 'CV chưa đặt tên';
}

export function getAiScore(cv: CvItem): number | null {
  const score = cv.parsedData?.aiScore;
  if (typeof score === 'number') return score;
  return null;
}

export function getTemplateLabel(templateId: string | null): string {
  if (!templateId) return 'Default';
  const map: Record<string, string> = {
    classic: 'Classic Minimalist',
    creative: 'Creative Elegant',
    modern: 'Modern Professional',
  };
  return map[templateId] || templateId;
}
