import { Badge } from '@/components/ui/badge';
import type { AdminTransaction } from '@/lib/users-client';

type Props = {
  transactions: AdminTransaction[];
  currentPlan: string;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const statusVariant: Record<string, 'success' | 'info' | 'danger'> = {
  SUCCESS: 'success',
  PENDING: 'info',
  FAILED: 'danger',
};

const statusLabel: Record<string, string> = {
  SUCCESS: 'Thành công',
  PENDING: 'Đang xử lý',
  FAILED: 'Thất bại',
};

export function UserPlanHistory({ transactions, currentPlan }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-zinc-900">
          Lịch sử thanh toán
        </h3>
        <p className="text-sm text-zinc-500">Chưa có giao dịch nào.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-6 py-4">
        <h3 className="text-lg font-semibold text-zinc-900">
          Lịch sử thanh toán ({transactions.length})
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          Plan hiện tại: <span className="font-medium">{currentPlan}</span>
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-600">
            <tr>
              <th className="px-6 py-3">Plan</th>
              <th className="px-6 py-3">Số tiền</th>
              <th className="px-6 py-3">Phương thức</th>
              <th className="px-6 py-3">Trạng thái</th>
              <th className="px-6 py-3">Mã giao dịch</th>
              <th className="px-6 py-3">Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                className="border-t border-zinc-100 transition-colors hover:bg-zinc-50/50"
              >
                <td className="px-6 py-3 font-medium text-zinc-900">
                  {tx.planName || 'N/A'}
                </td>
                <td className="px-6 py-3 text-zinc-600">
                  {formatCurrency(tx.amount)}
                </td>
                <td className="px-6 py-3 text-zinc-600">
                  {tx.paymentMethod}
                </td>
                <td className="px-6 py-3">
                  <Badge variant={statusVariant[tx.status] ?? 'default'}>
                    {statusLabel[tx.status] || tx.status}
                  </Badge>
                </td>
                <td className="px-6 py-3 font-mono text-xs text-zinc-500">
                  {tx.orderCode}
                </td>
                <td className="px-6 py-3 text-zinc-600">
                  {formatDate(tx.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
