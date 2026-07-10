import { Suspense } from 'react';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';
import { AdminUsersStats } from '@/components/users/admin-users-stats';
import { AdminUsersFilters } from '@/components/users/admin-users-filters';
import { AdminUsersTable } from '@/components/users/admin-users-table';
import { AdminUsersPagination } from '@/components/users/admin-users-pagination';
import { Alert } from '@/components/ui/alert';
import { ApiError } from '@/lib/api-client';
import {
  deleteUserByAdmin,
  getUsers,
  type UsersListResponse,
} from '@/lib/users-client';

type AdminUsersPageProps = {
  searchParams: Promise<{ search?: string; role?: string; page?: string }>;
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const { search, role, page } = await searchParams;
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'ADMIN') redirect('/dashboard');
  if (!session.accessToken) redirect('/login');

  async function deleteAction(formData: FormData) {
    'use server';
    const currentSession = await auth();
    if (
      !currentSession?.user ||
      currentSession.user.role !== 'ADMIN' ||
      !currentSession.accessToken
    )
      redirect('/login');
    const userId = String(formData.get('userId') ?? '');
    if (!userId) return;
    await deleteUserByAdmin(currentSession.accessToken, userId);
    revalidatePath('/dashboard/admin/users');
  }

  const currentPage = Math.max(1, Number(page) || 1);
  const queryRole =
    role && ['ADMIN', 'RECRUITER', 'CANDIDATE'].includes(role.toUpperCase())
      ? role.toUpperCase()
      : undefined;

  let usersData: UsersListResponse = {
    items: [],
    pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 1 },
  };
  let errorMessage = '';
  try {
    usersData = await getUsers(session.accessToken, {
      page: currentPage,
      role: queryRole as 'ADMIN' | 'RECRUITER' | 'CANDIDATE' | undefined,
      search: search || undefined,
    });
  } catch (error) {
    errorMessage =
      error instanceof ApiError
        ? error.message
        : 'Không thể tải danh sách người dùng';
  }

  // Compute stats from the first page (all roles, no search filter)
  let stats = { totalUsers: 0, candidates: 0, recruiters: 0, admins: 0 };
  try {
    const allData = await getUsers(session.accessToken, { page: 1, limit: 100 });
    stats = {
      totalUsers: allData.pagination.totalItems,
      candidates: allData.items.filter((u) => u.role === 'CANDIDATE').length,
      recruiters: allData.items.filter((u) => u.role === 'RECRUITER').length,
      admins: allData.items.filter((u) => u.role === 'ADMIN').length,
    };
  } catch {
    // Silently fail - stats are non-critical
  }

  return (
    <DashboardShell
      title="Quản lý người dùng"
      description={`${usersData.pagination.totalItems} người dùng đã đăng ký.`}
      email={session.user.email}
      userName={session.user.name}
      userAvatarUrl={session.user.image}
      role="ADMIN"
      currentPath="/dashboard/admin/users"
      breadcrumbs={[
        { label: 'Bảng điều khiển', href: '/dashboard/admin' },
        { label: 'Người dùng' },
      ]}
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <AdminUsersStats
          totalUsers={stats.totalUsers}
          candidates={stats.candidates}
          recruiters={stats.recruiters}
          admins={stats.admins}
        />

        {/* Error Alert */}
        {errorMessage ? <Alert>{errorMessage}</Alert> : null}

        {/* Search & Role Filters */}
        <Suspense>
          <AdminUsersFilters
            currentSearch={search ?? ''}
            currentRole={role ?? ''}
          />
        </Suspense>

        {/* Users Table */}
        <AdminUsersTable
          users={usersData.items}
          currentUserId={session.user.id}
          deleteAction={deleteAction}
        />

        {/* Pagination */}
        <AdminUsersPagination
          page={usersData.pagination.page}
          totalPages={usersData.pagination.totalPages}
          totalItems={usersData.pagination.totalItems}
          limit={usersData.pagination.limit}
        />
      </div>
    </DashboardShell>
  );
}
