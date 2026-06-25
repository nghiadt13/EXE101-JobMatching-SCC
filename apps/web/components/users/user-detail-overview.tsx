import { Badge } from '@/components/ui/badge';
import type { AdminUserDetail } from '@/lib/users-client';

type Props = {
  user: AdminUserDetail;
};

const roleVariant: Record<string, 'primary' | 'success' | 'info'> = {
  ADMIN: 'primary',
  RECRUITER: 'info',
  CANDIDATE: 'success',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Chưa có';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function UserDetailOverview({ user }: Props) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-zinc-900">
        Thông tin tổng quan
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-sm text-zinc-500">Email</p>
          <p className="font-medium text-zinc-900">{user.email}</p>
        </div>
        <div>
          <p className="text-sm text-zinc-500">Tên</p>
          <p className="font-medium text-zinc-900">{user.name}</p>
        </div>
        <div>
          <p className="text-sm text-zinc-500">Vai trò</p>
          <Badge variant={roleVariant[user.role] ?? 'default'}>
            {user.role}
          </Badge>
        </div>
        <div>
          <p className="text-sm text-zinc-500">Plan hiện tại</p>
          <p className="font-medium text-zinc-900">{user.planName}</p>
        </div>
        <div>
          <p className="text-sm text-zinc-500">Ngày đăng ký</p>
          <p className="font-medium text-zinc-900">
            {formatDate(user.createdAt)}
          </p>
        </div>
        <div>
          <p className="text-sm text-zinc-500">Lần hoạt động cuối</p>
          <p className="font-medium text-zinc-900">
            {formatDate(user.lastLoginAt)}
          </p>
        </div>
        <div>
          <p className="text-sm text-zinc-500">Tổng thời gian sử dụng</p>
          <p className="font-medium text-zinc-900">
            {user.totalUsageDays} ngày
          </p>
        </div>
        <div>
          <p className="text-sm text-zinc-500">Số CV đã tải lên</p>
          <p className="font-medium text-zinc-900">{user.cvs.length} CV</p>
        </div>
        <div>
          <p className="text-sm text-zinc-500">Số giao dịch</p>
          <p className="font-medium text-zinc-900">
            {user.transactions.length} giao dịch
          </p>
        </div>
      </div>
    </div>
  );
}
