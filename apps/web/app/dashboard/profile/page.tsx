import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { ProfileForm } from '@/components/profile/profile-form';
import { ApiError } from '@/lib/api-client';
import { getRoleDashboardPath } from '@/lib/auth-redirect';
import { getMyProfile, updateMyProfile } from '@/lib/profile-client';

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user || !session.accessToken) {
    redirect('/login');
  }

  async function updateAction(formData: FormData) {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) {
      redirect('/login');
    }

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
      if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
        redirect('/login');
      }
      throw error;
    }
    revalidatePath('/dashboard/profile');
  }

  let profile: Awaited<ReturnType<typeof getMyProfile>>;
  try {
    profile = await getMyProfile(session.accessToken);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
      redirect('/login');
    }
    throw error;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-12">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-500">Profile</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">My Account</h1>
        </div>
        <Link
          href={getRoleDashboardPath(session.user.role)}
          className="text-sm font-medium text-zinc-700 underline"
        >
          Back dashboard
        </Link>
      </header>

      <ProfileForm profile={profile} updateAction={updateAction} />
    </main>
  );
}
