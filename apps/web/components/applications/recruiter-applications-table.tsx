'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ApplicationStatus,
  ApplicationItem,
  isMatchingSnapshotV2,
} from '@/lib/applications-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { MatchingSnapshotV2View } from './matching-snapshot-v2';
import { CvPreviewModal } from '@/components/cv/cv-preview-modal';
import type { CvItem } from '@/lib/cv-client';
import { toast } from 'sonner';

type RecruiterApplicationsTableProps = {
  items: ApplicationItem[];
  action: (formData: FormData) => Promise<void>;
};

const RECRUITER_TRANSITIONS: Record<string, ApplicationStatus[]> = {
  APPLIED: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['REJECTED'],
  REJECTED: [],
};

const STATUS_LABELS: Record<string, string> = {
  APPLIED: 'Chưa review',
  ACCEPTED: 'Đã chấp nhận',
  REJECTED: 'Đã từ chối',
  REVIEWING: 'Đang review',
  INTERVIEW: 'Phỏng vấn',
  OFFER: 'Offer',
  PENDING_MATCHING: 'Đang xử lý',
  WITHDRAWN: 'Đã rút',
};

function getStatusOptions(current: ApplicationStatus): ApplicationStatus[] {
  const allowedNext = RECRUITER_TRANSITIONS[current] ?? [];
  return [current, ...allowedNext];
}

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'info' | 'danger'> = {
  APPLIED: 'default',
  REVIEWING: 'info',
  INTERVIEW: 'success',
  OFFER: 'success',
  ACCEPTED: 'success',
  REJECTED: 'danger',
};

export function RecruiterApplicationsTable({ items, action }: RecruiterApplicationsTableProps) {
  const [selectedCv, setSelectedCv] = useState<CvItem | null>(null);

  const handleAction = async (formData: FormData) => {
    try {
      await action(formData);
      toast.success('Cập nhật thành công');
    } catch (err) {
      toast.error('Cập nhật thất bại');
    }
  };

  if (!items.length) {
    return (
      <EmptyState
        title="Chưa có đơn ứng tuyển nào"
        description="Đơn ứng tuyển từ ứng viên sẽ xuất hiện tại đây khi họ ứng tuyển vào việc làm đã đăng của bạn."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild size="sm">
              <Link href="/dashboard/recruiter/jobs">Xem việc làm của bạn</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/recruiter/jobs">Tạo việc làm</Link>
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const statusOptions = getStatusOptions(item.status);
        return (
        <article key={item.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-zinc-300">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-zinc-900">{item.candidate.name}</p>
              <p className="text-xs text-zinc-500">{item.candidate.email}</p>
              <p className="mt-1 text-xs text-zinc-600">
                Việc làm: {item.job.title} · Điểm: {Math.round(item.matchScore)}%
              </p>
              {isMatchingSnapshotV2(item.matchingSnapshot) ? (
                <MatchingSnapshotV2View snapshot={item.matchingSnapshot} />
              ) : item.matchingSnapshot ? (
                <>
                  <div className="mt-2 grid gap-2 text-xs text-zinc-600 md:grid-cols-2">
                    <p>Điểm mạnh: {item.matchingSnapshot.strengths?.slice(0, 2).join(', ') || 'Không có'}</p>
                    <p>Điểm yếu: {item.matchingSnapshot.gaps?.slice(0, 2).join(', ') || 'Không có'}</p>
                  </div>
                  {item.matchingSnapshot.warnings?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.matchingSnapshot.warnings.slice(0, 2).map((warning) => (
                        <Badge key={`${item.id}-${warning}`} variant="warning">{warning}</Badge>
                      ))}
                    </div>
                  )}
                </>
              ) : null}
            </div>
            <Badge variant={statusVariant[item.status] ?? 'default'}>{STATUS_LABELS[item.status] || item.status}</Badge>
          </div>

          <form action={handleAction} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="applicationId" value={item.id} />
            <input type="hidden" name="currentStatus" value={item.status} />
            
            {item.status !== 'REJECTED' && (
              <input
                name="notes"
                placeholder="Ghi chú (tùy chọn)"
                defaultValue={item.notes ?? ''}
                className="h-9 min-w-48 rounded-lg border border-zinc-300 bg-white px-3 text-sm focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
              />
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                  setSelectedCv({
                    id: item.cv.id,
                    fileName: item.cv.fileName,
                    candidateProfile: item.cv.candidateProfile,
                    parsedData: item.cv.parsedData,
                    source: (item.cv as any).source,
                    candidate: {
                      phone: (item.candidate as any).phone,
                      location: (item.candidate as any).location,
                      user: {
                        name: item.candidate.name,
                        email: item.candidate.email,
                        avatar: (item.candidate as any).avatar,
                      },
                    },
                  } as any)
              }
            >
              Xem CV
            </Button>
            
            {item.status === 'APPLIED' && (
              <>
                <Button type="submit" name="status" value="ACCEPTED" size="sm" className="bg-green-600 hover:bg-green-700 text-white">Chấp nhận</Button>
                <Button type="submit" name="status" value="REJECTED" size="sm" variant="danger">Từ chối</Button>
              </>
            )}
            {item.status === 'ACCEPTED' && (
              <Button type="submit" name="status" value="REJECTED" size="sm" variant="danger">Từ chối</Button>
            )}
          </form>
        </article>
        );
      })}
      
      <CvPreviewModal isOpen={!!selectedCv} onClose={() => setSelectedCv(null)} cv={selectedCv} />
    </div>
  );
}
