import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';
import { ProfileForm } from '@/components/profile/profile-form';
import { ApiError } from '@/lib/api-client';
import { getRoleDashboardPath } from '@/lib/auth-redirect';
import { getMyProfile, updateMyProfile } from '@/lib/profile-client';
import { revalidatePath } from 'next/cache';

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user || !session.accessToken) redirect('/login');

  async function updateAction(formData: FormData) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) redirect('/login');

    const name = String(formData.get('name') ?? '').trim();
    const avatar = String(formData.get('avatar') ?? '').trim();
    const phone = String(formData.get('phone') ?? '').trim();
    const bio = String(formData.get('bio') ?? '').trim();
    const city = String(formData.get('locationCity') ?? '').trim();

    try {
      await updateMyProfile(currentSession.accessToken, {
        ...(name ? { name } : {}),
        ...(avatar ? { avatar } : {}),
        ...(phone ? { phone } : {}),
        ...(bio ? { bio } : {}),
        ...(city ? { location: { city } } : {}),
      });
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 404)) redirect('/login');
      throw error;
    }
    revalidatePath('/dashboard/profile');
  }

  let profile: Awaited<ReturnType<typeof getMyProfile>>;
  try {
    profile = await getMyProfile(session.accessToken);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 404)) redirect('/login');
    throw error;
  }

  return (
    <DashboardShell
      title="Tài khoản của tôi"
      description="Cập nhật thông tin hồ sơ của bạn."
      email={session.user.email}
      userName={session.user.name}
      userAvatarUrl={session.user.image}
      role={session.user.role}
      currentPath="/dashboard/profile"
      breadcrumbs={[
        { label: 'Bảng điều khiển', href: getRoleDashboardPath(session.user.role) },
        { label: 'Hồ sơ' },
      ]}
    >
      <ProfileForm profile={profile} updateAction={updateAction} />
    </DashboardShell>
  );
}

