'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

type AdminUsersPaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  limit: number;
};

export function AdminUsersPagination({
  page,
  totalPages,
  totalItems,
  limit,
}: AdminUsersPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage <= 1) {
      params.delete('page');
    } else {
      params.set('page', String(newPage));
    }
    router.push(`/dashboard/admin/users?${params.toString()}`);
  };

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalItems);

  return (
    <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/50 px-6 py-4 text-xs text-zinc-500">
      <div className="font-medium">
        Hiển thị {totalItems > 0 ? start : 0} - {end} trong tổng số{' '}
        {totalItems} người dùng
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => goToPage(page - 1)}
        >
          Trước
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => goToPage(page + 1)}
        >
          Sau
        </Button>
      </div>
    </div>
  );
}
