import 'dotenv/config';
import { JobStatus, UserRole } from '@prisma/client';
import {
  buildPrismaClient,
  DEMO_PASSWORD,
  hashPassword,
  SEED_APPLICATION_MATRIX,
  SEED_CANDIDATES,
  SEED_CATEGORIES,
  SEED_COMPANIES,
  SEED_JOBS,
  SEED_RECRUITERS,
  SEED_TAG,
} from './data';

async function seedHomepageVnShowcase() {
  const prisma = buildPrismaClient();

  try {
    const hashedPassword = await hashPassword();
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      const companiesBySlug = new Map<string, { id: string; name: string }>();
      for (const company of SEED_COMPANIES) {
        const upserted = await tx.company.upsert({
          where: { slug: company.slug },
          create: {
            name: company.name,
            slug: company.slug,
            logoUrl: company.logoUrl,
            iconKey: company.iconKey,
            isTrusted: company.trusted,
          },
          update: {
            name: company.name,
            logoUrl: company.logoUrl,
            iconKey: company.iconKey,
            isTrusted: company.trusted,
          },
          select: { id: true, name: true },
        });
        companiesBySlug.set(company.slug, upserted);
      }

      const categoriesBySlug = new Map<string, { id: string; name: string }>();
      for (const category of SEED_CATEGORIES) {
        const upserted = await tx.jobCategory.upsert({
          where: { slug: category.slug },
          create: {
            slug: category.slug,
            name: category.name,
            iconKey: category.iconKey,
            sortOrder: category.sortOrder,
          },
          update: {
            name: category.name,
            iconKey: category.iconKey,
            sortOrder: category.sortOrder,
          },
          select: { id: true, name: true },
        });
        categoriesBySlug.set(category.slug, upserted);
      }

      const recruitersByEmail = new Map<string, { id: string; name: string }>();
      for (const recruiter of SEED_RECRUITERS) {
        const upserted = await tx.user.upsert({
          where: { email: recruiter.email },
          create: {
            email: recruiter.email,
            name: recruiter.name,
            role: UserRole.RECRUITER,
            password: hashedPassword,
            avatar: 'https://i.pravatar.cc/200?img=32',
            planName: 'Pro Recruiter',
          },
          update: {
            name: recruiter.name,
            role: UserRole.RECRUITER,
            password: hashedPassword,
            planName: 'Pro Recruiter',
          },
          select: { id: true, name: true },
        });
        recruitersByEmail.set(recruiter.email, upserted);
      }

      const candidatesByEmail = new Map<string, { userId: string; candidateId: string }>();
      for (const candidate of SEED_CANDIDATES) {
        const user = await tx.user.upsert({
          where: { email: candidate.email },
          create: {
            email: candidate.email,
            name: candidate.name,
            role: UserRole.CANDIDATE,
            password: hashedPassword,
            avatar: 'https://i.pravatar.cc/200?img=12',
            planName: 'Career Plus',
          },
          update: {
            name: candidate.name,
            role: UserRole.CANDIDATE,
            password: hashedPassword,
          },
          select: { id: true },
        });

        const candidateProfile = await tx.candidate.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            phone: candidate.phone,
            location: { city: candidate.city, country: 'Vietnam' },
            bio: candidate.bio,
          },
          update: {
            phone: candidate.phone,
            location: { city: candidate.city, country: 'Vietnam' },
            bio: candidate.bio,
          },
          select: { id: true },
        });

        const existingPrimaryCv = await tx.cV.findFirst({
          where: { candidateId: candidateProfile.id, isPrimary: true },
          select: { id: true },
        });

        if (!existingPrimaryCv) {
          await tx.cV.create({
            data: {
              candidateId: candidateProfile.id,
              fileName: `${candidate.email.replace('@', '_')}_cv.pdf`,
              filePath: `/uploads/cvs/${SEED_TAG}-${candidate.email.replace('@', '_')}.pdf`,
              fileSize: 950000,
              mimeType: 'application/pdf',
              parsedData: { source: SEED_TAG, status: 'seeded' },
              rawText: candidate.rawText,
              skills: candidate.skills,
              isPrimary: true,
            },
          });
        }

        candidatesByEmail.set(candidate.email, {
          userId: user.id,
          candidateId: candidateProfile.id,
        });
      }

      const jobsBySlug = new Map<string, { id: string }>();
      for (const job of SEED_JOBS) {
        const recruiter = recruitersByEmail.get(job.recruiterEmail);
        const company = companiesBySlug.get(job.companySlug);
        const category = categoriesBySlug.get(job.categorySlug);

        if (!recruiter || !company || !category) {
          throw new Error(`Missing recruiter/company/category mapping for ${job.slug}`);
        }

        const publishedAt = new Date(now.getTime() - job.publishedOffsetDays * 24 * 60 * 60 * 1000);
        const upserted = await tx.job.upsert({
          where: { slug: job.slug },
          create: {
            recruiterId: recruiter.id,
            companyId: company.id,
            categoryId: category.id,
            title: job.title,
            slug: job.slug,
            description: job.description,
            shortDescription: job.shortDescription,
            skills: job.skills,
            location: job.location,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            employmentType: 'FULL_TIME',
            status: JobStatus.PUBLISHED,
            publishedAt,
          },
          update: {
            recruiterId: recruiter.id,
            companyId: company.id,
            categoryId: category.id,
            title: job.title,
            description: job.description,
            shortDescription: job.shortDescription,
            skills: job.skills,
            location: job.location,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            employmentType: 'FULL_TIME',
            status: JobStatus.PUBLISHED,
            publishedAt,
            deletedAt: null,
          },
          select: { id: true },
        });
        jobsBySlug.set(job.slug, upserted);
      }

      for (const application of SEED_APPLICATION_MATRIX) {
        const job = jobsBySlug.get(application.jobSlug);
        const candidate = candidatesByEmail.get(application.candidateEmail);

        if (!job || !candidate) {
          throw new Error(`Missing job/candidate mapping for application ${application.jobSlug}`);
        }

        const cv = await tx.cV.findFirst({
          where: { candidateId: candidate.candidateId, isPrimary: true },
          select: { id: true },
        });

        if (!cv) {
          throw new Error(`Primary CV missing for candidate ${application.candidateEmail}`);
        }

        await tx.application.upsert({
          where: {
            jobId_candidateId: {
              jobId: job.id,
              candidateId: candidate.candidateId,
            },
          },
          create: {
            jobId: job.id,
            candidateId: candidate.candidateId,
            cvId: cv.id,
            matchScore: application.matchScore,
            status: application.status,
            notes: application.notes,
            matchingSnapshot: {
              version: 'seed_homepage_vn_v1',
              source: SEED_TAG,
              scoreBreakdown: {
                mustHave: Math.round(application.matchScore + 2),
                niceToHave: Math.round(application.matchScore - 3),
                final: application.matchScore,
              },
            },
          },
          update: {
            cvId: cv.id,
            matchScore: application.matchScore,
            status: application.status,
            notes: application.notes,
          },
        });
      }

      for (const recruiter of SEED_RECRUITERS) {
        const recruiterUser = recruitersByEmail.get(recruiter.email);
        if (!recruiterUser) continue;

        await tx.notification.create({
          data: {
            userId: recruiterUser.id,
            title: 'New candidate applications received',
            body: `Seeded candidate applications are ready for review in dashboard (${SEED_TAG}).`,
            isRead: false,
          },
        });
      }

      await tx.homepageContent.upsert({
        where: { slug: 'home-main' },
        create: {
          slug: 'home-main',
          heroHeadline: 'Find Your Dream Job',
          heroSubheadline:
            'Trusted by top Vietnam companies. Explore high-quality openings and apply in minutes.',
          heroBackgroundImageUrl:
            'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80',
          popularKeywords: [
            'Backend Engineer',
            'Data Engineer',
            'Product Designer',
            'DevOps Engineer',
          ],
          footerQuickLinks: [
            { label: 'Browse Jobs', href: '/jobs' },
            { label: 'Top Companies', href: '#' },
            { label: 'Create CV', href: '#' },
            { label: 'Career Advice', href: '#' },
          ],
          footerSupportLinks: [
            { label: 'Privacy Policy', href: '#' },
            { label: 'Terms of Service', href: '#' },
            { label: 'Help Center', href: '#' },
            { label: 'Contact', href: '#' },
          ],
          footerSocialLinks: [
            { platform: 'linkedin', href: '#' },
            { platform: 'facebook', href: '#' },
            { platform: 'youtube', href: '#' },
            { platform: 'tiktok', href: '#' },
          ],
        },
        update: {
          heroHeadline: 'Find Your Dream Job',
          heroSubheadline:
            'Trusted by top Vietnam companies. Explore high-quality openings and apply in minutes.',
          popularKeywords: [
            'Backend Engineer',
            'Data Engineer',
            'Product Designer',
            'DevOps Engineer',
          ],
        },
      });

      const statsDays = [5, 4, 3, 2, 1, 0];
      const growth = [120, 168, 210, 255, 305, 360];
      const active = [1200, 1480, 1720, 2010, 2340, 2680];
      const hiring = [120, 156, 190, 228, 266, 308];
      for (let index = 0; index < statsDays.length; index += 1) {
        const date = new Date(now.getTime() - statsDays[index]! * 24 * 60 * 60 * 1000);
        await tx.marketStatDaily.upsert({
          where: { statDate: new Date(date.toISOString().slice(0, 10)) },
          create: {
            statDate: new Date(date.toISOString().slice(0, 10)),
            newJobs24h: growth[index]!,
            activeJobs: active[index]!,
            hiringCompanies: hiring[index]!,
          },
          update: {
            newJobs24h: growth[index]!,
            activeJobs: active[index]!,
            hiringCompanies: hiring[index]!,
          },
        });
      }

      const latestDate = new Date(now.toISOString().slice(0, 10));
      const demands = [
        { key: 'software', label: 'Software', value: 98, sortOrder: 1 },
        { key: 'data-ai', label: 'Data & AI', value: 94, sortOrder: 2 },
        { key: 'fintech', label: 'Fintech', value: 88, sortOrder: 3 },
        { key: 'product', label: 'Product', value: 80, sortOrder: 4 },
      ];

      for (const demand of demands) {
        await tx.industryDemandDaily.upsert({
          where: {
            statDate_industryKey: {
              statDate: latestDate,
              industryKey: demand.key,
            },
          },
          create: {
            statDate: latestDate,
            industryKey: demand.key,
            industryLabel: demand.label,
            demandValue: demand.value,
            sortOrder: demand.sortOrder,
          },
          update: {
            industryLabel: demand.label,
            demandValue: demand.value,
            sortOrder: demand.sortOrder,
          },
        });
      }
    });

    console.log(`[${SEED_TAG}] Homepage VN showcase seed completed.`);
    console.log(`Demo password for all seeded users: ${DEMO_PASSWORD}`);
    console.log('Seeded recruiter accounts:');
    for (const recruiter of SEED_RECRUITERS) {
      console.log(`- ${recruiter.email}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

seedHomepageVnShowcase().catch((error) => {
  console.error(`[${SEED_TAG}] Seed failed. No partial commit should persist due to transaction rollback.`, error);
  process.exit(1);
});
