import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';
import { CvBuilderPage } from '@/components/cv/builder/cv-builder-page';
import { EMPTY_CV_DATA } from '@/types/cv-builder';
import type { CvBuilderData } from '@/types/cv-builder';
import { getCvById, updateBuilderCv } from '@/lib/cv-client';
import { ApiError } from '@/lib/api-client';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCvPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || !session.accessToken) redirect('/login');
  if (session.user.role !== 'CANDIDATE') redirect('/dashboard');

  let cv;
  try {
    cv = await getCvById(session.accessToken, id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect('/login');
    redirect('/dashboard/candidate/cvs');
  }

  // Only builder CVs can be edited
  if (cv.source !== 'builder') {
    redirect('/dashboard/candidate/cvs');
  }

  const builderData = cv.parsedData?.builderData;
  const initialData: CvBuilderData = builderData
    ? {
        templateId: cv.templateId ?? builderData.templateId ?? 'simple',
        profile: builderData.profile ?? EMPTY_CV_DATA.profile,
        experience: builderData.experience ?? [],
        education: builderData.education ?? [],
        skills: cv.skills ?? [],
        projects: builderData.projects ?? [],
        certifications: builderData.certifications ?? [],
        languages: builderData.languages ?? [],
      }
    : { ...EMPTY_CV_DATA, templateId: cv.templateId ?? 'simple' };

  async function saveAction(data: CvBuilderData): Promise<string | null> {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) {
      redirect('/login');
    }
    try {
      await updateBuilderCv(currentSession.accessToken, id, data);
      revalidatePath('/dashboard/candidate/cvs');
      revalidatePath(`/dashboard/candidate/cvs/${id}/edit`);
      return null;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) redirect('/api/auth/logout');
        return error.message;
      }
      return 'Đã xảy ra lỗi. Vui lòng thử lại.';
    }
  }

  return (
    <DashboardShell
      title="Chỉnh sửa CV"
      description="Cập nhật CV và xem preview real-time."
      email={session.user.email}
      userName={session.user.name}
      userAvatarUrl={session.user.image}
      role="CANDIDATE"
      currentPath={`/dashboard/candidate/cvs/${id}/edit`}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard/candidate' },
        { label: 'CVs', href: '/dashboard/candidate/cvs' },
        { label: 'Chỉnh sửa CV' },
      ]}
    >
      <CvBuilderPage initialData={initialData} cvId={id} accessToken={session.accessToken} onSave={saveAction} />
    </DashboardShell>
  );
}
