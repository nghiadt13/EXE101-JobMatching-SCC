import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/notifications-client';
import { Bell, CheckCircle2 } from 'lucide-react';

import Link from 'next/link';

export default async function CandidateNotificationsPage() {
  const session = await auth();
  if (!session?.user || !session.accessToken) redirect('/login');
  if (session.user.role !== 'CANDIDATE') redirect('/dashboard');

  const notifications = await getNotifications(session.accessToken, { page: 1, limit: 50 });

  async function markAsReadAction(formData: FormData) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) return;
    const notificationId = formData.get('notificationId')?.toString();
    if (notificationId) {
      await markNotificationAsRead(currentSession.accessToken, notificationId).catch(() => {});
    }
    revalidatePath('/dashboard/candidate/notifications');
  }

  async function markAllAsReadAction() {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) return;
    await markAllNotificationsAsRead(currentSession.accessToken).catch(() => {});
    revalidatePath('/dashboard/candidate/notifications');
  }

  return (
    <DashboardShell
      title="Thông báo"
      description="Xem các thông báo mới nhất từ nhà tuyển dụng và hệ thống."
      email={session.user.email}
      userName={session.user.name}
      userAvatarUrl={session.user.image}
      role="CANDIDATE"
      currentPath="/dashboard/candidate/notifications"
      breadcrumbs={[
        { label: 'Bảng điều khiển', href: '/dashboard/candidate' },
        { label: 'Thông báo' },
      ]}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-md-on-background flex items-center gap-2">
          <Bell className="w-5 h-5 text-brand-600" /> 
          Tất cả thông báo 
          {notifications.unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {notifications.unreadCount} mới
            </span>
          )}
        </h2>
        {notifications.unreadCount > 0 && (
          <form action={markAllAsReadAction}>
            <button
              type="submit"
              className="text-sm text-brand-600 font-medium hover:text-brand-700 hover:underline"
            >
              Đánh dấu tất cả đã đọc
            </button>
          </form>
        )}
      </div>

      <div className="bg-white border border-md-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
        {notifications.items.length === 0 ? (
          <div className="p-12 text-center text-md-on-surface-variant flex flex-col items-center">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-zinc-400" />
            </div>
            <p className="text-lg font-medium">Bạn chưa có thông báo nào.</p>
            <p className="text-sm mt-1">Khi nhà tuyển dụng cập nhật trạng thái đơn ứng tuyển, thông báo sẽ hiển thị ở đây.</p>
          </div>
        ) : (
          <ul className="divide-y divide-md-outline-variant/20">
            {notifications.items.map((notification) => {
              const timeAgo = new Intl.DateTimeFormat('vi-VN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              }).format(new Date(notification.createdAt));
              const isUnread = !notification.isRead;
              
              let href = '#';
              if (notification.type === 'APPLICATION_STATUS_UPDATE') {
                href = '/dashboard/candidate/applications';
              }

              return (
                <li key={notification.id} className={`p-4 transition-colors ${isUnread ? 'bg-blue-50/50' : 'hover:bg-zinc-50'}`}>
                  <div className="flex gap-4">
                    <div className="shrink-0 mt-1">
                      {isUnread ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-brand-600 mt-1.5" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-zinc-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className={`text-sm ${isUnread ? 'font-semibold text-md-on-surface' : 'font-medium text-md-on-surface-variant'}`}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-md-on-surface-variant whitespace-nowrap">{timeAgo}</span>
                      </div>
                      <p className={`text-sm mb-2 ${isUnread ? 'text-zinc-800' : 'text-zinc-500'}`}>
                        {notification.body}
                      </p>
                      
                      <div className="flex items-center gap-4">
                        <Link href={href} className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline">
                          Xem chi tiết
                        </Link>
                        {isUnread && (
                          <form action={markAsReadAction}>
                            <input type="hidden" name="notificationId" value={notification.id} />
                            <button type="submit" className="text-xs font-medium text-zinc-500 hover:text-zinc-700 hover:underline">
                              Đánh dấu đã đọc
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </DashboardShell>
  );
}
