import Link from 'next/link';
import { Eye, Trash2, Clock, CreditCard, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmForm } from '@/components/ui/confirm-form';
import { EmptyState } from '@/components/ui/empty-state';
import type { AdminUser } from '@/lib/users-client';

type AdminUsersTableProps = {
  users: AdminUser[];
  currentUserId: string;
  deleteAction: (formData: FormData) => Promise<void>;
};

const roleVariant: Record<string, 'primary' | 'success' | 'info'> = {
  ADMIN: 'primary',
  RECRUITER: 'info',
  CANDIDATE: 'success',
};

const roleLabel: Record<string, string> = {
  ADMIN: 'Quản trị',
  RECRUITER: 'Nhà tuyển dụng',
  CANDIDATE: 'Ứng viên',
};

const avatarColors = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-fuchsia-500',
  'bg-rose-500',
  'bg-sky-500',
];

function getInitials(name: string | null): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getAvatarColor(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Chưa đăng nhập';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return formatDateTime(dateStr);
}

function formatActiveHours(createdAt: string, lastLoginAt: string | null): string {
  if (!lastLoginAt) return '—';
  const created = new Date(createdAt).getTime();
  const lastLogin = new Date(lastLoginAt).getTime();
  const diffMs = Math.max(0, lastLogin - created);
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return '< 1 giờ';
  return `${hours} giờ`;
}

const planBadgeVariant: Record<string, 'default' | 'success' | 'info' | 'primary'> = {
  'Free Plan': 'default',
  'Pro Plan': 'info',
  'Premium Plan': 'primary',
};

export function AdminUsersTable({
  users,
  currentUserId,
  deleteAction,
}: AdminUsersTableProps) {
  if (users.length === 0) {
    return (
      <EmptyState
        title="Không tìm thấy người dùng"
        description="Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc vai trò."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50/75 text-left text-zinc-500">
            <tr>
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider">
                Người dùng
              </th>
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider">
                Tên hiển thị
              </th>
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider">
                Vai trò
              </th>
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider">
                <span className="inline-flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  Plan
                </span>
              </th>
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Hoạt động cuối
                </span>
              </th>
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider">
                <span className="inline-flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  Giao dịch
                </span>
              </th>
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider">
                Ngày đăng ký
              </th>
              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {users.map((user) => {
              const initials = getInitials(user.name);
              const avatarBg = getAvatarColor(user.email);
              const isCurrentUser = user.id === currentUserId;

              return (
                <tr
                  key={user.id}
                  className="transition-colors hover:bg-zinc-50/70"
                >
                  {/* User & Email */}
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm ${avatarBg}`}
                      >
                        {user.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="min-w-0">
                        <span
                          className="block truncate text-xs font-semibold text-zinc-900"
                          title={user.email}
                        >
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Display Name */}
                  <td className="px-5 py-4">
                    <span className="block text-xs font-semibold text-zinc-800">
                      {user.name}
                    </span>
                  </td>

                  {/* Role */}
                  <td className="px-5 py-4">
                    <Badge variant={roleVariant[user.role] ?? 'default'}>
                      {roleLabel[user.role] ?? user.role}
                    </Badge>
                  </td>

                  {/* Plan */}
                  <td className="px-5 py-4">
                    <Badge variant={planBadgeVariant[user.planName] ?? 'default'}>
                      {user.planName}
                    </Badge>
                  </td>

                  {/* Last Activity */}
                  <td className="px-5 py-4">
                    <span
                      className={`text-xs font-medium ${
                        user.lastLoginAt ? 'text-zinc-700' : 'text-zinc-400'
                      }`}
                      title={user.lastLoginAt ? formatDateTime(user.lastLoginAt) : undefined}
                    >
                      {formatRelativeTime(user.lastLoginAt)}
                    </span>
                  </td>

                  {/* Transaction Count */}
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold ${
                      user.transactionCount > 0 ? 'text-emerald-600' : 'text-zinc-400'
                    }`}>
                      {user.transactionCount}
                    </span>
                  </td>

                  {/* Join Date */}
                  <td className="px-5 py-4">
                    <span className="text-xs font-medium text-zinc-600">
                      {formatDate(user.createdAt)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        title="Xem hồ sơ"
                      >
                        <Link href={`/dashboard/admin/users/${user.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      {isCurrentUser ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled
                          title="Không thể xóa chính mình"
                        >
                          <Trash2 className="h-4 w-4 text-zinc-300" />
                        </Button>
                      ) : (
                        <ConfirmForm
                          title="Xác nhận xóa người dùng?"
                          description={`Hành động này sẽ xóa tài khoản ${user.email}. Bạn có chắc chắn muốn tiếp tục?`}
                          confirmLabel="Xóa người dùng"
                          action={deleteAction}
                          triggerLabel="Xóa"
                          triggerVariant="danger"
                          triggerSize="icon"
                          hiddenInputs={{ userId: user.id }}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
