import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/auth/dashboard-shell';
import { CvTemplateGallery } from '@/components/cv/cv-template-gallery';

export default async function TemplatesPage() {
  const session = await auth();
  if (!session?.user || !session.accessToken) redirect('/login');
  if (session.user.role !== 'CANDIDATE') redirect('/dashboard');

  return (
    <DashboardShell
      title="Chọn mẫu CV"
      description="Chọn một mẫu CV để bắt đầu tạo CV của bạn."
      email={session.user.email}
      userName={session.user.name}
      userAvatarUrl={session.user.image}
      role="CANDIDATE"
      currentPath="/dashboard/candidate/cvs/templates"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard/candidate' },
        { label: 'CVs', href: '/dashboard/candidate/cvs' },
        { label: 'Chọn mẫu' },
      ]}
    >
      <CvTemplateGallery />
    </DashboardShell>
  );
}
