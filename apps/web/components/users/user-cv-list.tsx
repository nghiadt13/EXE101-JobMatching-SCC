import { Badge } from '@/components/ui/badge';
import type { AdminUserCv } from '@/lib/users-client';

type Props = {
  cvs: AdminUserCv[];
  userName: string;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function UserCvList({ cvs, userName }: Props) {
  if (cvs.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-zinc-900">
          CV đã tải lên
        </h3>
        <p className="text-sm text-zinc-500">
          {userName} chưa tải lên CV nào.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-6 py-4">
        <h3 className="text-lg font-semibold text-zinc-900">
          CV đã tải lên ({cvs.length})
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-600">
            <tr>
              <th className="px-6 py-3">Tên file</th>
              <th className="px-6 py-3">Kích thước</th>
              <th className="px-6 py-3">Nguồn</th>
              <th className="px-6 py-3">Trạng thái</th>
              <th className="px-6 py-3">Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {cvs.map((cv) => (
              <tr
                key={cv.id}
                className="border-t border-zinc-100 transition-colors hover:bg-zinc-50/50"
              >
                <td className="px-6 py-3 font-medium text-zinc-900">
                  {cv.fileName}
                </td>
                <td className="px-6 py-3 text-zinc-600">
                  {formatFileSize(cv.fileSize)}
                </td>
                <td className="px-6 py-3">
                  <Badge variant={cv.source === 'upload' ? 'info' : 'default'}>
                    {cv.source === 'upload' ? 'Tải lên' : 'Builder'}
                  </Badge>
                </td>
                <td className="px-6 py-3">
                  {cv.isPrimary ? (
                    <Badge variant="primary">Chính</Badge>
                  ) : (
                    <Badge variant="default">Phụ</Badge>
                  )}
                </td>
                <td className="px-6 py-3 text-zinc-600">
                  {formatDate(cv.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
