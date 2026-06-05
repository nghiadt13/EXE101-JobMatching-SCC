import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';
import { CvBuilderPage } from '@/components/cv/builder/cv-builder-page';
import { DEFAULT_DESIGN_TOKENS, EMPTY_CV_DATA } from '@/types/cv-builder';
import type { CvBuilderData } from '@/types/cv-builder';
import { getCvById, updateBuilderCv } from '@/lib/cv-client';
import { ApiError } from '@/lib/api-client';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function EditCvPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { isNew } = await searchParams;
  const isNewUpload = isNew === '1';
  
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

  const builderData = cv.parsedData?.builderData;
  const normalized = cv.normalizedProfile as any;
  const candidateInfo = cv.candidate || (cv as any).candidate;

  let initialData: CvBuilderData;

  if (builderData) {
    initialData = {
      templateId: cv.templateId ?? builderData.templateId ?? 'simple',
      designTokens: builderData.designTokens ?? DEFAULT_DESIGN_TOKENS,
      profile: builderData.profile ?? EMPTY_CV_DATA.profile,
      experience: builderData.experience ?? [],
      education: builderData.education ?? [],
      skills: cv.skills ?? [],
      projects: builderData.projects ?? [],
      certifications: builderData.certifications ?? [],
      languages: builderData.languages ?? [],
    };
  } else {
    initialData = {
      templateId: cv.templateId ?? 'simple',
      designTokens: DEFAULT_DESIGN_TOKENS,
      profile: {
        name: normalized?.candidateName || candidateInfo?.user?.name || cv.fileName.replace('.pdf', '') || 'Ứng viên',
        email: candidateInfo?.user?.email || '',
        phone: candidateInfo?.phone || '',
        location: normalized?.location || { city: '', country: '' },
        website: '',
        summary: normalized?.summary || '',
      },
      experience: Array.isArray(normalized?.experience) ? normalized.experience.map((e: any) => ({
        role: e.role || '',
        company: e.company || '',
        startDate: e.startDate || '',
        endDate: e.endDate || '',
        description: e.description || '',
        tech: e.tech || [],
      })) : [],
      education: Array.isArray(normalized?.education) ? normalized.education.map((e: any) => ({
        school: e.school || '',
        degree: e.degree || '',
        field: e.field || '',
        startDate: e.startDate || '',
        endDate: e.endDate || '',
        gpa: e.gpa || '',
      })) : [],
      skills: cv.skills ?? [],
      projects: Array.isArray(normalized?.projects) ? normalized.projects.map((p: any) => ({
        name: p.name || '',
        description: p.description || '',
        tech: p.tech || [],
      })) : [],
      certifications: normalized?.certifications ?? [],
      languages: normalized?.languages ?? [],
    };
  }

  async function saveAction(data: CvBuilderData): Promise<string | null> {
    'use server';
    const currentSession = await auth();
    if (!currentSession?.user || !currentSession.accessToken) {
      redirect('/login');
    }
    try {
      await updateBuilderCv(currentSession.accessToken, id, data);
      revalidatePath('/', 'layout');
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
      <CvBuilderPage 
        initialData={initialData} 
        cvId={cv.id} 
        accessToken={session.accessToken} 
        hasPdfFile={cv.source !== 'builder' && cv.mimeType === 'application/pdf'} 
        isNewUpload={isNewUpload}
        onSave={saveAction} 
      />
    </DashboardShell>
  );
}
