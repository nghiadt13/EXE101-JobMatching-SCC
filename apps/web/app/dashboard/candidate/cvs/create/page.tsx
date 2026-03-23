import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';
import { CvBuilderPage } from '@/components/cv/builder/cv-builder-page';
import { EMPTY_CV_DATA } from '@/types/cv-builder';
import type { CvBuilderData, TemplateId } from '@/types/cv-builder';
import { createBuilderCv } from '@/lib/cv-client';
import { ApiError } from '@/lib/api-client';

type PageProps = {
  searchParams: Promise<{ template?: string }>;
};

export default async function CreateCvPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const session = await auth();
  if (!session?.user || !session.accessToken) redirect('/login');
  if (session.user.role !== 'CANDIDATE') redirect('/dashboard');

  const templateId = (['simple', 'professional', 'modern'].includes(query.template ?? '')
    ? query.template
    : 'simple') as TemplateId;

  const initialData: CvBuilderData = {
    ...EMPTY_CV_DATA,
    templateId,
  };

  async function saveAction(data: CvBuilderData): Promise<string | null> {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) {
      redirect('/login');
    }
    try {
      const result = await createBuilderCv(currentSession.accessToken, data);
      revalidatePath('/dashboard/candidate/cvs');
      redirect(`/dashboard/candidate/cvs/${result.id}/edit`);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) redirect('/login');
        return error.message;
      }
      // Next.js redirect() throws a NEXT_REDIRECT error, re-throw it
      throw error;
    }
  }

  return (
    <DashboardShell
      title="Tạo CV mới"
      description="Điền thông tin và xem preview CV real-time."
      email={session.user.email}
      userName={session.user.name}
      userAvatarUrl={session.user.image}
      role="CANDIDATE"
      currentPath="/dashboard/candidate/cvs/create"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard/candidate' },
        { label: 'CVs', href: '/dashboard/candidate/cvs' },
        { label: 'Tạo CV' },
      ]}
    >
      <CvBuilderPage initialData={initialData} onSave={saveAction} />
    </DashboardShell>
  );
}
