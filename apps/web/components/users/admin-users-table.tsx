import { UserRole } from '@/lib/api-client';
import { AdminUser } from '@/lib/users-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmForm } from '@/components/ui/confirm-form';

type AdminUsersTableProps = {
  users: AdminUser[];
  currentUserId: string;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
};

const roleVariant: Record<string, 'primary' | 'success' | 'info'> = {
  ADMIN: 'primary',
  RECRUITER: 'info',
  CANDIDATE: 'success',
};

export function AdminUsersTable({ users, currentUserId, updateAction, deleteAction }: AdminUsersTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-zinc-100 text-left text-zinc-600">
          <tr>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t border-zinc-200 align-top transition-colors hover:bg-zinc-50/50">
              <td className="px-4 py-3">
                <p className="font-medium text-zinc-900">{user.email}</p>
                <p className="text-zinc-500">{user.name}</p>
                <Badge variant={roleVariant[user.role] ?? 'default'} className="mt-1">{user.role}</Badge>
              </td>
              <td className="px-4 py-3">
                <form action={updateAction} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="userId" value={user.id} />
                  <input
                    type="text"
                    name="name"
                    defaultValue={user.name}
                    className="h-9 rounded-lg border border-zinc-300 px-2 text-sm focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
                    minLength={2}
                    required
                  />
                  <select
                    name="role"
                    defaultValue={user.role}
                    className="h-9 rounded-lg border border-zinc-300 px-2 text-sm focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
                  >
                    {(['ADMIN', 'RECRUITER', 'CANDIDATE'] as UserRole[]).map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                  <Button type="submit" variant="outline" size="sm">Save</Button>
                </form>
              </td>
              <td className="px-4 py-3">
                {user.id === currentUserId ? (
                  <Button type="button" variant="danger" size="sm" disabled>
                    Delete
                  </Button>
                ) : (
                  <ConfirmForm
                    title="Delete this user?"
                    description="This action will soft-delete the account. Make sure this is not the wrong user before continuing."
                    confirmLabel="Delete user"
                    action={deleteAction}
                    triggerLabel="Delete"
                    triggerVariant="danger"
                    hiddenInputs={{ userId: user.id }}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
