import { UserRole } from '@/lib/api-client';
import { AdminUser } from '@/lib/users-client';

type AdminUsersTableProps = {
  users: AdminUser[];
  currentUserId: string;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
};

export function AdminUsersTable({
  users,
  currentUserId,
  updateAction,
  deleteAction,
}: AdminUsersTableProps) {
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
            <tr key={user.id} className="border-t border-zinc-200 align-top">
              <td className="px-4 py-3">
                <p className="font-medium text-zinc-900">{user.email}</p>
                <p className="text-zinc-500">{user.name}</p>
              </td>
              <td className="px-4 py-3">
                <form action={updateAction} className="flex items-center gap-2">
                  <input type="hidden" name="userId" value={user.id} />
                  <input
                    type="text"
                    name="name"
                    defaultValue={user.name}
                    className="h-9 rounded-lg border border-zinc-300 px-2"
                    minLength={2}
                    required
                  />
                  <select
                    name="role"
                    defaultValue={user.role}
                    className="h-9 rounded-lg border border-zinc-300 px-2"
                  >
                    {(['ADMIN', 'RECRUITER', 'CANDIDATE'] as UserRole[]).map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="h-9 rounded-lg border border-zinc-300 px-3 font-medium text-zinc-800 hover:bg-zinc-100"
                  >
                    Save
                  </button>
                </form>
              </td>
              <td className="px-4 py-3">
                <form action={deleteAction}>
                  <input type="hidden" name="userId" value={user.id} />
                  <button
                    type="submit"
                    disabled={user.id === currentUserId}
                    className="h-9 rounded-lg border border-red-200 px-3 font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Delete
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
