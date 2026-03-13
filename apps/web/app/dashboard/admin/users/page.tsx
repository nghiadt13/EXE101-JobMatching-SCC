import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';
import { AdminUsersTable } from '@/components/users/admin-users-table';
import { Alert } from '@/components/ui/alert';
import { ApiError, UserRole } from '@/lib/api-client';
import { deleteUserByAdmin, getUsers, updateUserByAdmin, type UsersListResponse } from '@/lib/users-client';

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'ADMIN') redirect('/dashboard');
  if (!session.accessToken) redirect('/login');

  async function updateAction(formData: FormData) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || currentSession.user.role !== 'ADMIN' || !currentSession.accessToken) redirect('/login');
    const userId = String(formData.get('userId') ?? '');
    const name = String(formData.get('name') ?? '').trim();
    const role = String(formData.get('role') ?? '') as UserRole;
    if (!userId || !name || !['ADMIN', 'RECRUITER', 'CANDIDATE'].includes(role)) return;
    await updateUserByAdmin(currentSession.accessToken, userId, { name, role });
    revalidatePath('/dashboard/admin/users');
  }

  async function deleteAction(formData: FormData) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || currentSession.user.role !== 'ADMIN' || !currentSession.accessToken) redirect('/login');
    const userId = String(formData.get('userId') ?? '');
    if (!userId) return;
    await deleteUserByAdmin(currentSession.accessToken, userId);
    revalidatePath('/dashboard/admin/users');
  }

  let usersData: UsersListResponse = {
    items: [],
    pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 1 },
  };
  let errorMessage = '';
  try {
    usersData = await getUsers(session.accessToken);
  } catch (error) {
    errorMessage = error instanceof ApiError ? error.message : 'Failed to load users';
  }

  return (
    <DashboardShell
      title="Users Management"
      description={`${usersData.pagination.totalItems} registered users.`}
      email={session.user.email}
      userName={session.user.name}
      userAvatarUrl={session.user.image}
      role="ADMIN"
      currentPath="/dashboard/admin/users"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard/admin' },
        { label: 'Users' },
      ]}
    >
      {errorMessage ? <Alert className="mb-4">{errorMessage}</Alert> : null}
      <AdminUsersTable
        users={usersData.items}
        currentUserId={session.user.id}
        updateAction={updateAction}
        deleteAction={deleteAction}
      />
    </DashboardShell>
  );
}

