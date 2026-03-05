import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AdminUsersTable } from '@/components/users/admin-users-table';
import { ApiError, UserRole } from '@/lib/api-client';
import {
  deleteUserByAdmin,
  getUsers,
  updateUserByAdmin,
  type UsersListResponse,
} from '@/lib/users-client';

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }
  if (!session.accessToken) {
    redirect('/login');
  }

  async function updateAction(formData: FormData) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || currentSession.user.role !== 'ADMIN' || !currentSession.accessToken) {
      redirect('/login');
    }

    const userId = String(formData.get('userId') ?? '');
    const name = String(formData.get('name') ?? '').trim();
    const role = String(formData.get('role') ?? '') as UserRole;
    if (!userId || !name || !['ADMIN', 'RECRUITER', 'CANDIDATE'].includes(role)) {
      return;
    }

    await updateUserByAdmin(currentSession.accessToken, userId, { name, role });
    revalidatePath('/dashboard/admin/users');
  }

  async function deleteAction(formData: FormData) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || currentSession.user.role !== 'ADMIN' || !currentSession.accessToken) {
      redirect('/login');
    }

    const userId = String(formData.get('userId') ?? '');
    if (!userId) {
      return;
    }

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
    if (error instanceof ApiError) {
      errorMessage = error.message;
    } else {
      errorMessage = 'Failed to load users';
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-12">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-500">Admin</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Users Management</h1>
        </div>
        <Link href="/dashboard/admin" className="text-sm font-medium text-zinc-700 underline">
          Back dashboard
        </Link>
      </header>

      {errorMessage ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <AdminUsersTable
        users={usersData.items}
        currentUserId={session.user.id}
        updateAction={updateAction}
        deleteAction={deleteAction}
      />
    </main>
  );
}
